import { describe, it, expect, vi } from "vitest";
import { MmmoAdapter } from "../mmmo-adapter.js";
import type { MmmoChantResult } from "../mmmo-types.js";

// Mock the client module
vi.mock("../mmmo-client.js", () => ({
  searchMmmo: vi.fn(),
  fetchChantDetail: vi.fn(),
}));

import { searchMmmo, fetchChantDetail } from "../mmmo-client.js";
const mockSearch = vi.mocked(searchMmmo);
const mockFetchDetail = vi.mocked(fetchChantDetail);

const FIXTURE_HITS = [
  {
    chantId: "26355",
    title: "Pange lingua gloriosi corporis mysterium",
    url: "https://musmed.eu/chant/26355",
  },
  {
    chantId: "99001",
    title: "Pange lingua gloriosi proelii certamen",
    url: "https://musmed.eu/chant/99001",
  },
];

const FIXTURE_DETAIL: MmmoChantResult = {
  chantId: "26355",
  source: "F-CH : Ms 0050",
  folio: "309r",
  feast: "Nicolai",
  genre: "H",
  cantusId: "008367",
  fullText: "Pange lingua*",
  imageUrl: "https://bvmm.irht.cnrs.fr/iiif/223/canvas/canvas-151914/view",
  office: "M",
};

const FIXTURE_DETAIL_2: MmmoChantResult = {
  chantId: "99001",
  source: "D-Mbs : Clm 4660",
  folio: "001v",
  feast: "Inventio Crucis",
  genre: "H",
  cantusId: "008370",
  fullText: "Pange lingua gloriosi proelii certamen",
  imageUrl: "N/A",
  office: "V",
};

describe("MmmoAdapter", () => {
  const adapter = new MmmoAdapter();

  it('has name "MMMO"', () => {
    expect(adapter.name).toBe("MMMO");
  });

  it("returns ManuscriptResult[] on successful search", async () => {
    mockSearch.mockResolvedValue(FIXTURE_HITS);
    mockFetchDetail
      .mockResolvedValueOnce(FIXTURE_DETAIL)
      .mockResolvedValueOnce(FIXTURE_DETAIL_2);

    const results = await adapter.search({ query: "pange lingua", rawQuery: "pange lingua" });

    expect(results).toHaveLength(2);
    expect(results[0].sourceDatabase).toBe("MMMO");
    expect(results[0].siglum).toBe("F-CH : Ms 0050");
    expect(results[0].folio).toBe("309r");
    expect(results[0].sourceUrl).toBe("https://musmed.eu/chant/26355");
    expect(results[1].sourceDatabase).toBe("MMMO");
    expect(results[1].siglum).toBe("D-Mbs : Clm 4660");
  });

  it("returns [] when searchMmmo throws (graceful degradation)", async () => {
    mockSearch.mockRejectedValue(new Error("Network error"));

    const results = await adapter.search({ query: "pange lingua", rawQuery: "pange lingua" });

    expect(results).toEqual([]);
  });

  it("returns [] when searchMmmo returns empty array", async () => {
    mockSearch.mockResolvedValue([]);

    const results = await adapter.search({ query: "nonexistent", rawQuery: "nonexistent" });

    expect(results).toEqual([]);
  });

  it("filters out null results from fetchChantDetail (partial failure)", async () => {
    mockSearch.mockResolvedValue(FIXTURE_HITS);
    mockFetchDetail
      .mockResolvedValueOnce(FIXTURE_DETAIL)
      .mockResolvedValueOnce(null); // Second detail fetch fails

    const results = await adapter.search({ query: "pange lingua", rawQuery: "pange lingua" });

    expect(results).toHaveLength(1);
    expect(results[0].siglum).toBe("F-CH : Ms 0050");
  });
});
