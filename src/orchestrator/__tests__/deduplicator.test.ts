import { describe, it, expect } from "vitest";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { deduplicateResults } from "../deduplicator.js";

function makeResult(overrides: Partial<ManuscriptResult> = {}): ManuscriptResult {
  return {
    siglum: "F-Pn lat. 1090",
    library: "Bibliotheque nationale de France",
    city: "Paris",
    century: "12th century",
    incipit: "Pange lingua gloriosi corporis mysterium",
    genre: "Hymn",
    feast: "Corpus Christi",
    folio: "145v",
    cantusId: "008248",
    iiifManifest: "N/A",
    sourceUrl: "https://cantusindex.org/chant/1",
    sourceDatabase: "Cantus Index Network",
    matchType: "text",
    imageAvailable: true,
    ...overrides,
  };
}

describe("deduplicateResults", () => {
  it("returns empty array for empty input", () => {
    expect(deduplicateResults([])).toEqual([]);
  });

  it("returns single result unchanged", () => {
    const result = makeResult();
    const deduped = deduplicateResults([result]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0]).toEqual(result);
  });

  it("merges two results with same siglum+folio, preferring non-N/A values (D-02)", () => {
    const cantus = makeResult({
      iiifManifest: "N/A",
      library: "BnF",
      sourceDatabase: "Cantus Index Network",
    });
    const diamm = makeResult({
      iiifManifest: "https://iiif.example.com/manifest.json",
      library: "N/A",
      sourceDatabase: "DIAMM",
    });

    const deduped = deduplicateResults([cantus, diamm]);
    expect(deduped).toHaveLength(1);
    // Non-N/A values preferred
    expect(deduped[0].iiifManifest).toBe("https://iiif.example.com/manifest.json");
    expect(deduped[0].library).toBe("BnF");
  });

  it("combines sourceDatabase from all contributing sources", () => {
    const cantus = makeResult({ sourceDatabase: "Cantus Index Network" });
    const diamm = makeResult({ sourceDatabase: "DIAMM" });

    const deduped = deduplicateResults([cantus, diamm]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].sourceDatabase).toBe("Cantus Index Network, DIAMM");
  });

  it("does NOT merge results with different sigla", () => {
    const a = makeResult({ siglum: "F-Pn lat. 1090" });
    const b = makeResult({ siglum: "GB-Lbl Add. 12345" });

    const deduped = deduplicateResults([a, b]);
    expect(deduped).toHaveLength(2);
  });

  it("does NOT merge results with same siglum but different folio", () => {
    const a = makeResult({ siglum: "F-Pn lat. 1090", folio: "145v" });
    const b = makeResult({ siglum: "F-Pn lat. 1090", folio: "200r" });

    const deduped = deduplicateResults([a, b]);
    expect(deduped).toHaveLength(2);
  });

  it("replaces N/A in first result with value from second result", () => {
    const first = makeResult({
      city: "N/A",
      century: "N/A",
      cantusId: "008248",
      sourceDatabase: "Source A",
    });
    const second = makeResult({
      city: "Paris",
      century: "12th century",
      cantusId: "N/A",
      sourceDatabase: "Source B",
    });

    const deduped = deduplicateResults([first, second]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].city).toBe("Paris");
    expect(deduped[0].century).toBe("12th century");
    expect(deduped[0].cantusId).toBe("008248"); // first had non-N/A
  });

  it("deduplicates sourceDatabase to avoid duplicates", () => {
    const a = makeResult({ sourceDatabase: "Cantus Index Network" });
    const b = makeResult({ sourceDatabase: "Cantus Index Network" });

    const deduped = deduplicateResults([a, b]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].sourceDatabase).toBe("Cantus Index Network");
  });
});
