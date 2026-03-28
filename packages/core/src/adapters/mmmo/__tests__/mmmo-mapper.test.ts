import { describe, it, expect } from "vitest";
import { mapMmmoToResult } from "../mmmo-mapper.js";
import type { MmmoChantResult } from "../mmmo-types.js";

function makeChantResult(
  overrides: Partial<MmmoChantResult> = {},
): MmmoChantResult {
  return {
    chantId: "26355",
    source: "F-CH : Ms 0050",
    folio: "309r",
    feast: "Nicolai",
    genre: "H",
    cantusId: "008367",
    fullText: "Pange lingua*",
    imageUrl: "https://bvmm.irht.cnrs.fr/iiif/223/canvas/canvas-151914/view",
    office: "M",
    ...overrides,
  };
}

describe("mapMmmoToResult", () => {
  it("maps all fields to ManuscriptResult with sourceDatabase='MMMO'", () => {
    const result = mapMmmoToResult(makeChantResult());

    expect(result.siglum).toBe("F-CH : Ms 0050");
    expect(result.library).toBe("N/A");
    expect(result.city).toBe("N/A");
    expect(result.century).toBe("N/A");
    expect(result.incipit).toBe("Pange lingua*");
    expect(result.genre).toBe("H");
    expect(result.feast).toBe("Nicolai");
    expect(result.folio).toBe("309r");
    expect(result.cantusId).toBe("008367");
    expect(result.iiifManifest).toBe(
      "https://bvmm.irht.cnrs.fr/iiif/223/canvas/canvas-151914/view",
    );
    expect(result.sourceUrl).toBe("https://musmed.eu/chant/26355");
    expect(result.sourceDatabase).toBe("MMMO");
  });

  it('defaults missing optional fields to "N/A"', () => {
    const result = mapMmmoToResult(
      makeChantResult({
        source: "N/A",
        folio: "N/A",
        feast: "N/A",
        genre: "N/A",
        cantusId: "N/A",
        fullText: "N/A",
        imageUrl: "N/A",
      }),
    );

    expect(result.siglum).toBe("N/A");
    expect(result.incipit).toBe("N/A");
    expect(result.genre).toBe("N/A");
    expect(result.feast).toBe("N/A");
    expect(result.folio).toBe("N/A");
    expect(result.cantusId).toBe("N/A");
    expect(result.iiifManifest).toBe("N/A");
    expect(result.sourceUrl).toBe("https://musmed.eu/chant/26355");
    expect(result.sourceDatabase).toBe("MMMO");
  });

  it("always sets library, city, century to N/A (not available from chant page)", () => {
    const result = mapMmmoToResult(makeChantResult());

    expect(result.library).toBe("N/A");
    expect(result.city).toBe("N/A");
    expect(result.century).toBe("N/A");
  });

  it("constructs sourceUrl from chantId", () => {
    const result = mapMmmoToResult(makeChantResult({ chantId: "99001" }));
    expect(result.sourceUrl).toBe("https://musmed.eu/chant/99001");
  });

  it("sets imageAvailable=true when imageUrl is a valid URL", () => {
    const result = mapMmmoToResult(
      makeChantResult({
        imageUrl: "https://bvmm.irht.cnrs.fr/iiif/223/canvas/canvas-151914/view",
      }),
    );
    expect(result.imageAvailable).toBe(true);
  });

  it("sets imageAvailable=false when imageUrl is N/A", () => {
    const result = mapMmmoToResult(makeChantResult({ imageUrl: "N/A" }));
    expect(result.imageAvailable).toBe(false);
  });

  it("sets imageAvailable=false when imageUrl is empty", () => {
    const result = mapMmmoToResult(makeChantResult({ imageUrl: "" }));
    expect(result.imageAvailable).toBe(false);
  });

  it("sets imageAvailable=false when imageUrl is undefined", () => {
    const result = mapMmmoToResult(makeChantResult({ imageUrl: undefined }));
    expect(result.imageAvailable).toBe(false);
  });
});
