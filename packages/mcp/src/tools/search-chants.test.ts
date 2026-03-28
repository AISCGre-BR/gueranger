import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManuscriptResult, MultiSearchResult, SearchQuery } from "@gueranger/core";

const mockHandleSearch = vi.fn<(...args: unknown[]) => Promise<MultiSearchResult>>();
const mockFormatResults = vi.fn<(results: ManuscriptResult[], query: string) => string>();

// Mock @gueranger/core
vi.mock("@gueranger/core", () => {
  return {
    handleSearch: (...args: unknown[]) => mockHandleSearch(...(args as [])),
    formatResults: (results: ManuscriptResult[], query: string) => mockFormatResults(results, query),
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
    matchType: "text",
    imageAvailable: true,
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
    mockHandleSearch.mockReset();
    mockFormatResults.mockReset();
    // Default formatResults mock returns a formatted string
    mockFormatResults.mockImplementation((results, query) => {
      const lines: string[] = [];
      lines.push(`Found ${results.length} result(s) for "${query}":`);
      for (const r of results) {
        lines.push(`\n## ${r.siglum}`);
        lines.push(`- Library: ${r.library}`);
        lines.push(`- City: ${r.city}`);
        lines.push(`- Century: ${r.century}`);
        lines.push(`  - Incipit: ${r.incipit}`);
      }
      return lines.join("\n");
    });
  });

  it("calls handleSearch with params and formats results", async () => {
    mockHandleSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    const result = await handleSearchChants({ query: "Pange lingua" });

    expect(mockHandleSearch).toHaveBeenCalledTimes(1);
    expect(mockHandleSearch).toHaveBeenCalledWith({ query: "Pange lingua" });
    expect(result.content[0].text).toContain("Pange lingua gloriosi");
  });

  it("passes genre, century, feast, and melody filters to handleSearch", async () => {
    mockHandleSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    await handleSearchChants({
      query: "Pange lingua",
      genre: "hymn",
      century: "12th",
      feast: "Corpus Christi",
      melody: "1---h--g--f",
    });

    expect(mockHandleSearch).toHaveBeenCalledWith({
      query: "Pange lingua",
      genre: "hymn",
      century: "12th",
      feast: "Corpus Christi",
      melody: "1---h--g--f",
    });
  });

  it("returns 'No manuscripts found' when handleSearch returns empty results", async () => {
    mockHandleSearch.mockResolvedValue(makeSearchResult([]));

    const result = await handleSearchChants({ query: "nonexistent chant" });

    expect(result.content[0].text).toContain("No manuscripts found");
  });

  it("includes source warnings in response when present", async () => {
    mockHandleSearch.mockResolvedValue(
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
    mockHandleSearch.mockResolvedValue({
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
    mockHandleSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    const result = await handleSearchChants({ query: "Pange lingua" });
    const text = result.content[0].text;

    expect(text).toContain("Library:");
    expect(text).toContain("City:");
    expect(text).toContain("Century:");
  });

  it("includes JSON marker in response", async () => {
    mockHandleSearch.mockResolvedValue(makeSearchResult([makeMockResult()]));

    const result = await handleSearchChants({ query: "Pange lingua" });

    expect(result.content[1].text).toContain("---JSON---");
  });
});
