import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManuscriptResult } from "../models/manuscript-result.js";
import type { MultiSearchResult } from "../orchestrator/multi-search.js";
import type { SearchQuery } from "../models/query.js";

const mockMultiSearch = vi.fn<(...args: unknown[]) => Promise<MultiSearchResult>>();
const mockGetActiveAdapters = vi.fn().mockReturnValue([]);

// Mock the orchestrator module
vi.mock("../orchestrator/multi-search.js", () => {
  return {
    multiSearch: (...args: unknown[]) => mockMultiSearch(...(args as [])),
    getActiveAdapters: () => mockGetActiveAdapters(),
  };
});

import { handleSearchChants } from "./search-chants.js";

function makeMockResult(overrides: Partial<ManuscriptResult> = {}): ManuscriptResult {
  return {
    siglum: "F-Pn lat. 1090",
    library: "N/A",
    city: "N/A",
    century: "12",
    incipit: "Pange lingua gloriosi corporis mysterium",
    genre: "Hymn",
    feast: "Corpus Christi",
    folio: "145v",
    cantusId: "008248",
    iiifManifest: "N/A",
    sourceUrl: "https://cantusindex.org/chant/1",
    sourceDatabase: "Cantus Database",
    ...overrides,
  };
}

function makeSearchResult(
  results: ManuscriptResult[],
  warnings: string[] = [],
): MultiSearchResult {
  return {
    results,
    warnings,
    sourcesQueried: ["Cantus Index Network", "DIAMM", "RISM Online"],
    sourcesSucceeded: ["Cantus Index Network"],
    sourcesFailed: [],
  };
}

describe("handleSearchChants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMultiSearch.mockReset();
  });

  it("calls multiSearch with normalized query and all adapters", async () => {
    mockMultiSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    const result = await handleSearchChants({ query: "Pange lingua" });

    expect(mockMultiSearch).toHaveBeenCalledTimes(1);
    const callArgs = mockMultiSearch.mock.calls[0];
    const query = callArgs[1] as SearchQuery;
    expect(query.rawQuery).toBe("Pange lingua");
    expect(query.query).toBe("pange lingua"); // normalized
    expect(result.content[0].text).toContain("Pange lingua gloriosi");
  });

  it("passes genre, century, feast, and melody filters to multiSearch", async () => {
    mockMultiSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    await handleSearchChants({
      query: "Pange lingua",
      genre: "hymn",
      century: "12th",
      feast: "Corpus Christi",
      melody: "1---h--g--f",
    });

    const query = mockMultiSearch.mock.calls[0][1] as SearchQuery;
    expect(query.genre).toBe("hymn");
    expect(query.century).toBe("12th");
    expect(query.feast).toBe("Corpus Christi");
    expect(query.melody).toBe("1---h--g--f");
  });

  it("returns 'No manuscripts found' when multiSearch returns empty results", async () => {
    mockMultiSearch.mockResolvedValue(makeSearchResult([]));

    const result = await handleSearchChants({ query: "nonexistent chant" });

    expect(result.content[0].text).toContain("No manuscripts found");
  });

  it("includes source warnings in response when present", async () => {
    mockMultiSearch.mockResolvedValue(
      makeSearchResult(
        [makeMockResult()],
        ["DIAMM results unavailable \u2014 credentials not configured"],
      ),
    );

    const result = await handleSearchChants({ query: "Pange lingua" });
    const text = result.content[0].text;

    expect(text).toContain("Source warnings:");
    expect(text).toContain("DIAMM results unavailable");
  });

  it("includes source warnings even when no results found", async () => {
    mockMultiSearch.mockResolvedValue({
      results: [],
      warnings: ["RISM Online: Timeout after 15000ms"],
      sourcesQueried: ["Cantus", "RISM"],
      sourcesSucceeded: ["Cantus"],
      sourcesFailed: ["RISM"],
    });

    const result = await handleSearchChants({ query: "test" });
    const text = result.content[0].text;

    expect(text).toContain("No manuscripts found");
    expect(text).toContain("Source warnings:");
    expect(text).toContain("RISM Online: Timeout");
  });

  it("results text contains structured format fields", async () => {
    mockMultiSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    const result = await handleSearchChants({ query: "Pange lingua" });
    const text = result.content[0].text;

    expect(text).toContain("Library:");
    expect(text).toContain("City:");
    expect(text).toContain("Century:");
  });
});
