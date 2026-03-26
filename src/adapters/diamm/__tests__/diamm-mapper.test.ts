import { describe, it, expect } from "vitest";
import { mapDiammToResult } from "../diamm-mapper.js";
import type { DiammSourceDetail } from "../diamm-types.js";

function makeSourceDetail(
  overrides: Partial<DiammSourceDetail> = {},
): DiammSourceDetail {
  return {
    pk: 4871,
    display_name: "F-CHM 27",
    shelfmark: "27",
    date_statement: "end of 13th century",
    archive: {
      url: "https://www.diamm.ac.uk/archives/123/",
      name: "Mediatheque Jean-Jacques Rousseau",
      siglum: "F-CHM",
      city: "Chambery",
      country: "France",
    },
    manifest_url: "https://api.irht.cnrs.fr/ark:/12345/manifest.json",
    links: [
      {
        type: 1,
        url_type: "IIIF Manifest",
        link: "https://example.com/iiif/manifest.json",
      },
    ],
    inventory: [
      {
        pk: 145538,
        genres: ["Hymn"],
        folio_start: "rear flyleaf",
        composition: "Pange lingua",
      },
    ],
    ...overrides,
  };
}

describe("mapDiammToResult", () => {
  it("maps all 12 ManuscriptResult fields from DIAMM source detail", () => {
    const source = makeSourceDetail();
    const composition = {
      heading: "Pange lingua gloriosi corporis misterium",
      title: "Pange lingua gloriosi corporis misterium",
    };
    const sourceRef = { folio_start: "4v", folio_end: "5" };

    const result = mapDiammToResult(source, composition, sourceRef);

    expect(result.siglum).toBe("F-CHM 27");
    expect(result.library).toBe("Mediatheque Jean-Jacques Rousseau");
    expect(result.city).toBe("Chambery");
    expect(result.century).toBe("end of 13th century");
    expect(result.incipit).toBe(
      "Pange lingua gloriosi corporis misterium",
    );
    expect(result.genre).toBe("Hymn");
    expect(result.feast).toBe("N/A");
    expect(result.folio).toBe("4v-5");
    expect(result.cantusId).toBe("N/A");
    expect(result.iiifManifest).toBe(
      "https://api.irht.cnrs.fr/ark:/12345/manifest.json",
    );
    expect(result.sourceUrl).toBe("https://www.diamm.ac.uk/sources/4871/");
    expect(result.sourceDatabase).toBe("DIAMM");
  });

  it("falls back to links array when manifest_url is missing", () => {
    const source = makeSourceDetail({ manifest_url: "" });
    const result = mapDiammToResult(
      source,
      { heading: "Test", title: "Test" },
      {},
    );

    expect(result.iiifManifest).toBe(
      "https://example.com/iiif/manifest.json",
    );
  });

  it("returns N/A for iiifManifest when no manifest available", () => {
    const source = makeSourceDetail({ manifest_url: "", links: [] });
    const result = mapDiammToResult(
      source,
      { heading: "Test", title: "Test" },
      {},
    );

    expect(result.iiifManifest).toBe("N/A");
  });

  it("returns N/A for folio when no folio data provided", () => {
    const source = makeSourceDetail();
    const result = mapDiammToResult(
      source,
      { heading: "Test", title: "Test" },
      {},
    );

    expect(result.folio).toBe("N/A");
  });

  it("returns folio_start only when folio_end is the same", () => {
    const source = makeSourceDetail();
    const result = mapDiammToResult(
      source,
      { heading: "Test", title: "Test" },
      { folio_start: "4v", folio_end: "4v" },
    );

    expect(result.folio).toBe("4v");
  });

  it("uses composition title as fallback when heading is empty", () => {
    const source = makeSourceDetail();
    const result = mapDiammToResult(
      source,
      { heading: "", title: "Fallback Title" },
      {},
    );

    expect(result.incipit).toBe("Fallback Title");
  });

  it("returns N/A for genre when inventory has no genres", () => {
    const source = makeSourceDetail({
      inventory: [{ pk: 1, genres: [], folio_start: "", composition: "" }],
    });
    const result = mapDiammToResult(
      source,
      { heading: "Test", title: "Test" },
      {},
    );

    expect(result.genre).toBe("N/A");
  });

  it("uses archive siglum + shelfmark when display_name is missing", () => {
    const source = makeSourceDetail({ display_name: "" });
    const result = mapDiammToResult(
      source,
      { heading: "Test", title: "Test" },
      {},
    );

    expect(result.siglum).toBe("F-CHM 27");
  });
});
