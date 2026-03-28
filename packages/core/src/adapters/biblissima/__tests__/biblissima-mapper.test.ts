import { describe, it, expect } from "vitest";
import { mapBiblissimaToResult } from "../biblissima-mapper.js";
import type { BiblissimaSearchResult } from "../biblissima-types.js";

function makeItem(
  overrides: Partial<BiblissimaSearchResult> = {},
): BiblissimaSearchResult {
  return {
    title: "Paris. BnF, lat. 1090",
    iiifManifestUrl:
      "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json",
    biblissimaUrl:
      "https://iiif.biblissima.fr/collections/manifest/abc123hash",
    collection: "Gallica (BnF)",
    library: "Bibliotheque nationale de France",
    date: "12th century",
    language: "Latin",
    ...overrides,
  };
}

describe("mapBiblissimaToResult", () => {
  it('maps title "Paris. BnF, lat. 1090" to siglum, city="Paris", library="BnF"', () => {
    const result = mapBiblissimaToResult(makeItem());

    expect(result.siglum).toBe("Paris. BnF, lat. 1090");
    expect(result.city).toBe("Paris");
    expect(result.library).toBe("BnF");
  });

  it('sets sourceDatabase to "Biblissima"', () => {
    const result = mapBiblissimaToResult(makeItem());
    expect(result.sourceDatabase).toBe("Biblissima");
  });

  it("sets iiifManifest from iiifManifestUrl field", () => {
    const result = mapBiblissimaToResult(makeItem());
    expect(result.iiifManifest).toBe(
      "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json",
    );
  });

  it('defaults all unknown fields to "N/A" (genre, feast, folio, cantusId, incipit)', () => {
    const result = mapBiblissimaToResult(makeItem());

    expect(result.genre).toBe("N/A");
    expect(result.feast).toBe("N/A");
    expect(result.folio).toBe("N/A");
    expect(result.cantusId).toBe("N/A");
    expect(result.incipit).toBe("N/A");
  });

  it("maps century from date field", () => {
    const result = mapBiblissimaToResult(makeItem({ date: "13th century" }));
    expect(result.century).toBe("13th century");
  });

  it("sets sourceUrl from biblissimaUrl", () => {
    const result = mapBiblissimaToResult(makeItem());
    expect(result.sourceUrl).toBe(
      "https://iiif.biblissima.fr/collections/manifest/abc123hash",
    );
  });

  it("handles title without dot-space separator", () => {
    const result = mapBiblissimaToResult(
      makeItem({ title: "Unknown Manuscript" }),
    );
    expect(result.city).toBe("N/A");
    expect(result.library).toBe("Unknown Manuscript");
    expect(result.siglum).toBe("Unknown Manuscript");
  });
});
