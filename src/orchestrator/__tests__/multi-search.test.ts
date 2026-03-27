import { describe, it, expect, vi } from "vitest";
import type { SourceAdapter } from "../../adapters/adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { multiSearch, getActiveAdapters } from "../multi-search.js";
import { DiammCredentialsMissingError } from "../../adapters/diamm/diamm-adapter.js";

// Mock enrichWithCanvasLinks to be a pass-through in multiSearch tests
vi.mock("../iiif-enrichment.js", () => ({
  enrichWithCanvasLinks: vi.fn((results: ManuscriptResult[]) => Promise.resolve(results)),
}));

function makeResult(overrides: Partial<ManuscriptResult> = {}): ManuscriptResult {
  return {
    siglum: "F-Pn lat. 1090",
    library: "BnF",
    city: "Paris",
    century: "12th century",
    incipit: "Pange lingua",
    genre: "Hymn",
    feast: "Corpus Christi",
    folio: "145v",
    cantusId: "008248",
    iiifManifest: "N/A",
    sourceUrl: "https://example.com",
    sourceDatabase: "Test Source",
    ...overrides,
  };
}

function makeMockAdapter(name: string, results: ManuscriptResult[]): SourceAdapter {
  return {
    name,
    search: vi.fn().mockResolvedValue(results),
  };
}

function makeFailingAdapter(name: string, error: Error): SourceAdapter {
  return {
    name,
    search: vi.fn().mockRejectedValue(error),
  };
}

function makeSlowAdapter(name: string, delayMs: number, results: ManuscriptResult[]): SourceAdapter {
  return {
    name,
    search: vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(results), delayMs)),
    ),
  };
}

const baseQuery: SearchQuery = {
  query: "pange lingua",
  rawQuery: "Pange lingua",
};

describe("multiSearch", () => {
  it("combines results from all successful adapters", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });
    const diammResult = makeResult({ sourceDatabase: "DIAMM", siglum: "B-2" });
    const rismResult = makeResult({ sourceDatabase: "RISM", siglum: "C-3" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeMockAdapter("DIAMM", [diammResult]),
      makeMockAdapter("RISM", [rismResult]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);
    expect(result.sourcesQueried).toEqual(["Cantus", "DIAMM", "RISM"]);
    expect(result.sourcesSucceeded).toEqual(["Cantus", "DIAMM", "RISM"]);
    expect(result.sourcesFailed).toEqual([]);
  });

  it("returns results from successful adapters when one fails", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeFailingAdapter("DIAMM", new Error("Connection refused")),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].sourceDatabase).toBe("Cantus");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("DIAMM: Connection refused");
    expect(result.sourcesSucceeded).toEqual(["Cantus"]);
    expect(result.sourcesFailed).toEqual(["DIAMM"]);
  });

  it("handles adapter timeout gracefully", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeSlowAdapter("SlowSource", 5000, []),
    ];

    const result = await multiSearch(adapters, baseQuery, 100); // 100ms timeout

    expect(result.results).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("SlowSource");
    expect(result.warnings[0]).toContain("Timeout");
    expect(result.sourcesFailed).toEqual(["SlowSource"]);
  });

  it("returns empty results when all adapters fail", async () => {
    const adapters = [
      makeFailingAdapter("Cantus", new Error("Down")),
      makeFailingAdapter("DIAMM", new Error("Down")),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toEqual([]);
    expect(result.warnings).toHaveLength(2);
    expect(result.sourcesSucceeded).toEqual([]);
    expect(result.sourcesFailed).toEqual(["Cantus", "DIAMM"]);
  });

  it("tracks sourcesQueried, sourcesSucceeded, sourcesFailed correctly", async () => {
    const adapters = [
      makeMockAdapter("Cantus", [makeResult({ siglum: "A-1" })]),
      makeFailingAdapter("DIAMM", new Error("fail")),
      makeMockAdapter("RISM", [makeResult({ siglum: "C-3" })]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.sourcesQueried).toEqual(["Cantus", "DIAMM", "RISM"]);
    expect(result.sourcesSucceeded).toEqual(["Cantus", "RISM"]);
    expect(result.sourcesFailed).toEqual(["DIAMM"]);
  });

  it("deduplicates results across sources", async () => {
    // Same siglum+folio from two sources, one has N/A iiifManifest
    const cantusResult = makeResult({
      siglum: "F-Pn lat. 1090",
      folio: "145v",
      iiifManifest: "N/A",
      sourceDatabase: "Cantus",
    });
    const diammResult = makeResult({
      siglum: "F-Pn lat. 1090",
      folio: "145v",
      iiifManifest: "https://iiif.example.com/manifest",
      sourceDatabase: "DIAMM",
    });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeMockAdapter("DIAMM", [diammResult]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].iiifManifest).toBe("https://iiif.example.com/manifest");
    expect(result.results[0].sourceDatabase).toBe("Cantus, DIAMM");
  });

  it("includes Biblissima in combined results from 4 sources", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });
    const diammResult = makeResult({ sourceDatabase: "DIAMM", siglum: "B-2" });
    const rismResult = makeResult({ sourceDatabase: "RISM", siglum: "C-3" });
    const biblissimaResult = makeResult({ sourceDatabase: "Biblissima", siglum: "D-4" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeMockAdapter("DIAMM", [diammResult]),
      makeMockAdapter("RISM", [rismResult]),
      makeMockAdapter("Biblissima", [biblissimaResult]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(4);
    expect(result.sourcesQueried).toContain("Biblissima");
    expect(result.sourcesSucceeded).toContain("Biblissima");
  });

  it("emits exact D-04 warning when DiammCredentialsMissingError is thrown", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeFailingAdapter("DIAMM", new DiammCredentialsMissingError()),
    ];

    const result = await multiSearch(adapters, baseQuery);

    // D-04: exact warning text, not prefixed with adapter name
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("DIAMM results unavailable \u2014 credentials not configured");
    // Other sources still return results
    expect(result.results).toHaveLength(1);
    expect(result.results[0].sourceDatabase).toBe("Cantus");
    // DIAMM in failed list
    expect(result.sourcesFailed).toEqual(["DIAMM"]);
    expect(result.sourcesSucceeded).toEqual(["Cantus"]);
  });
});

describe("multiSearch – MMMO integration", () => {
  it("includes MMMO results in multi-search output", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });
    const mmmoResult = makeResult({ sourceDatabase: "MMMO", siglum: "E-5" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeMockAdapter("MMMO", [mmmoResult]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(2);
    expect(result.sourcesQueried).toContain("MMMO");
    expect(result.sourcesSucceeded).toContain("MMMO");
    expect(result.results.map((r) => r.sourceDatabase)).toContain("MMMO");
  });

  it("degrades gracefully when MMMO fails", async () => {
    const cantusResult = makeResult({ sourceDatabase: "Cantus", siglum: "A-1" });
    const diammResult = makeResult({ sourceDatabase: "DIAMM", siglum: "B-2" });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeMockAdapter("DIAMM", [diammResult]),
      makeFailingAdapter("MMMO", new Error("MMMO site unreachable")),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(2);
    expect(result.sourcesSucceeded).toEqual(["Cantus", "DIAMM"]);
    expect(result.sourcesFailed).toEqual(["MMMO"]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toBe("MMMO: MMMO site unreachable");
  });

  it("deduplicates MMMO results with Cantus by siglum::folio", async () => {
    // Cantus has century but no IIIF; MMMO has no century but has sourceUrl
    const cantusResult = makeResult({
      siglum: "F-Pn lat. 1090",
      folio: "145v",
      century: "12th century",
      iiifManifest: "N/A",
      sourceUrl: "https://cantus.example.com",
      sourceDatabase: "Cantus",
    });
    const mmmoResult = makeResult({
      siglum: "F-Pn lat. 1090",
      folio: "145v",
      century: "N/A",
      iiifManifest: "N/A",
      sourceUrl: "https://musmed.eu/chant/42",
      sourceDatabase: "MMMO",
    });

    const adapters = [
      makeMockAdapter("Cantus", [cantusResult]),
      makeMockAdapter("MMMO", [mmmoResult]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(1);
    // Merge keeps non-N/A century from Cantus
    expect(result.results[0].century).toBe("12th century");
    // sourceDatabase combines both
    expect(result.results[0].sourceDatabase).toBe("Cantus, MMMO");
  });

  it("includes MMMO in combined results from all 5 sources", async () => {
    const adapters = [
      makeMockAdapter("Cantus", [makeResult({ sourceDatabase: "Cantus", siglum: "A-1" })]),
      makeMockAdapter("DIAMM", [makeResult({ sourceDatabase: "DIAMM", siglum: "B-2" })]),
      makeMockAdapter("RISM", [makeResult({ sourceDatabase: "RISM", siglum: "C-3" })]),
      makeMockAdapter("Biblissima", [makeResult({ sourceDatabase: "Biblissima", siglum: "D-4" })]),
      makeMockAdapter("MMMO", [makeResult({ sourceDatabase: "MMMO", siglum: "E-5" })]),
    ];

    const result = await multiSearch(adapters, baseQuery);

    expect(result.results).toHaveLength(5);
    expect(result.sourcesQueried).toEqual(["Cantus", "DIAMM", "RISM", "Biblissima", "MMMO"]);
    expect(result.sourcesSucceeded).toEqual(["Cantus", "DIAMM", "RISM", "Biblissima", "MMMO"]);
  });
});

describe("getActiveAdapters", () => {
  it("returns 5 adapters", () => {
    const adapters = getActiveAdapters();
    expect(adapters).toHaveLength(5);
  });

  it("includes an adapter named MMMO", () => {
    const adapters = getActiveAdapters();
    const names = adapters.map((a) => a.name);
    expect(names).toContain("MMMO");
  });

  it("includes an adapter named Biblissima", () => {
    const adapters = getActiveAdapters();
    const names = adapters.map((a) => a.name);
    expect(names).toContain("Biblissima");
  });

  it("includes Cantus, DIAMM, RISM, Biblissima, and MMMO", () => {
    const adapters = getActiveAdapters();
    const names = adapters.map((a) => a.name);
    expect(names).toEqual(["Cantus Index Network", "DIAMM", "RISM Online", "Biblissima", "MMMO"]);
  });
});
