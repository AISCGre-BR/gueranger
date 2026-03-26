import { describe, it, expect, vi } from "vitest";
import type { SourceAdapter } from "../../adapters/adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { multiSearch } from "../multi-search.js";
import { DiammCredentialsMissingError } from "../../adapters/diamm/diamm-adapter.js";

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
