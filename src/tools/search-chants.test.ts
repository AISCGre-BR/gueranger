import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManuscriptResult } from "../models/manuscript-result.js";

const mockSearch = vi.fn();
let mockLastRelaxationMessage: string | null = null;

// Mock the CantusAdapter module with a proper class
vi.mock("../adapters/cantus/cantus-adapter.js", () => {
  return {
    CantusAdapter: class MockCantusAdapter {
      name = "Cantus Index Network";
      get lastRelaxationMessage() {
        return mockLastRelaxationMessage;
      }
      search = mockSearch;
    },
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

describe("handleSearchChants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockReset();
    mockLastRelaxationMessage = null;
  });

  it("text search calls CantusAdapter with normalized query", async () => {
    mockSearch.mockResolvedValue([makeMockResult()]);

    const result = await handleSearchChants({ query: "Pange lingua" });

    expect(mockSearch).toHaveBeenCalledTimes(1);
    const callArg = mockSearch.mock.calls[0][0];
    expect(callArg.rawQuery).toBe("Pange lingua");
    expect(callArg.query).toBe("pange lingua"); // normalized
    expect(result.content[0].text).toContain("Pange lingua gloriosi");
  });

  it("melody search passes melody field to adapter", async () => {
    mockSearch.mockResolvedValue([makeMockResult({ incipit: "Veni creator spiritus" })]);

    await handleSearchChants({ query: "", melody: "1---h--g--f" });

    const callArg = mockSearch.mock.calls[0][0];
    expect(callArg.melody).toBe("1---h--g--f");
  });

  it("displays relaxation message when adapter sets it", async () => {
    mockSearch.mockImplementation(() => {
      mockLastRelaxationMessage = "Relaxed century filter -- no results matched the requested century.";
      return Promise.resolve([makeMockResult()]);
    });

    const result = await handleSearchChants({ query: "test", genre: "hymn", century: "12th" });

    expect(result.content[0].text).toContain("Note: Relaxed century filter");
  });

  it("returns 'No manuscripts found' when adapter returns empty array", async () => {
    mockSearch.mockResolvedValue([]);

    const result = await handleSearchChants({ query: "nonexistent chant" });

    expect(result.content[0].text).toContain("No manuscripts found");
  });

  it("passes genre, century, and feast filters to adapter", async () => {
    mockSearch.mockResolvedValue([makeMockResult()]);

    await handleSearchChants({
      query: "Pange lingua",
      genre: "hymn",
      century: "12th",
      feast: "Corpus Christi",
    });

    const callArg = mockSearch.mock.calls[0][0];
    expect(callArg.genre).toBe("hymn");
    expect(callArg.century).toBe("12th");
    expect(callArg.feast).toBe("Corpus Christi");
  });

  it("results text contains structured format fields", async () => {
    mockSearch.mockResolvedValue([makeMockResult()]);

    const result = await handleSearchChants({ query: "Pange lingua" });
    const text = result.content[0].text;

    expect(text).toContain("Library:");
    expect(text).toContain("City:");
    expect(text).toContain("Century:");
  });
});
