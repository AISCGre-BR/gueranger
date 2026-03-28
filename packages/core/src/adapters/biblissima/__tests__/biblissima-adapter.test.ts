import { describe, it, expect, vi } from "vitest";
import { BiblissimaAdapter } from "../biblissima-adapter.js";
import type { BiblissimaSearchResult } from "../biblissima-types.js";

// Mock the client module
vi.mock("../biblissima-client.js", () => ({
  searchBiblissima: vi.fn(),
}));

import { searchBiblissima } from "../biblissima-client.js";
const mockSearch = vi.mocked(searchBiblissima);

const FIXTURE_RESULTS: BiblissimaSearchResult[] = [
  {
    title: "Paris. BnF, lat. 1090",
    iiifManifestUrl:
      "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json",
    biblissimaUrl:
      "https://iiif.biblissima.fr/collections/manifest/abc123hash",
    collection: "Gallica (BnF)",
    library: "Bibliotheque nationale de France",
    date: "12th century",
    language: "Latin",
  },
];

describe("BiblissimaAdapter", () => {
  const adapter = new BiblissimaAdapter();

  it('has name "Biblissima"', () => {
    expect(adapter.name).toBe("Biblissima");
  });

  it('returns ManuscriptResult[] with sourceDatabase "Biblissima"', async () => {
    mockSearch.mockResolvedValue(FIXTURE_RESULTS);

    const results = await adapter.search({ rawQuery: "pange lingua" });

    expect(results).toHaveLength(1);
    expect(results[0].sourceDatabase).toBe("Biblissima");
    expect(results[0].siglum).toBe("Paris. BnF, lat. 1090");
    expect(results[0].iiifManifest).toBe(
      "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json",
    );
  });

  it("returns [] when searchBiblissima returns empty", async () => {
    mockSearch.mockResolvedValue([]);

    const results = await adapter.search({ rawQuery: "nonexistent" });

    expect(results).toEqual([]);
  });

  it("returns [] when searchBiblissima throws (graceful degradation)", async () => {
    mockSearch.mockRejectedValue(new Error("Network error"));

    const results = await adapter.search({ rawQuery: "pange lingua" });

    expect(results).toEqual([]);
  });
});
