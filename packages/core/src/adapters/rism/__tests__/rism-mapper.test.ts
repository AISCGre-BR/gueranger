import { describe, it, expect } from "vitest";
import { mapRismToResult, parseRismLabel } from "../rism-mapper.js";
import type { RismSearchItem } from "../rism-types.js";

describe("parseRismLabel", () => {
  it("parses 3-segment label into incipit and siglum", () => {
    const result = parseRismLabel(
      "Pange lingua-A minor; Manuscript copy; F-Pn RES F-923",
    );
    expect(result.incipit).toBe("Pange lingua-A minor");
    expect(result.siglum).toBe("F-Pn RES F-923");
  });

  it("handles 2-segment label", () => {
    const result = parseRismLabel("Missa; D-Mbs Mus.ms. 65");
    expect(result.incipit).toBe("Missa");
    expect(result.siglum).toBe("D-Mbs Mus.ms. 65");
  });

  it("handles single-segment label (no semicolons)", () => {
    const result = parseRismLabel("Some title without semicolons");
    expect(result.incipit).toBe("Some title without semicolons");
    expect(result.siglum).toBe("Some title without semicolons");
  });

  it("trims whitespace from parsed segments", () => {
    const result = parseRismLabel(
      "  Pange lingua  ;  Manuscript copy  ;  F-Pn RES F-923  ",
    );
    expect(result.incipit).toBe("Pange lingua");
    expect(result.siglum).toBe("F-Pn RES F-923");
  });

  it("handles label with more than 3 segments", () => {
    const result = parseRismLabel("Title; Extra; More info; GB-Lbl Add. 123");
    expect(result.incipit).toBe("Title");
    expect(result.siglum).toBe("GB-Lbl Add. 123");
  });
});

describe("mapRismToResult", () => {
  function makeItem(overrides: Partial<RismSearchItem> = {}): RismSearchItem {
    return {
      id: "https://rism.online/sources/840022701",
      label: {
        en: ["Pange lingua-A minor; Manuscript copy; F-Pn RES F-923"],
      },
      ...overrides,
    };
  }

  it("maps all 12 ManuscriptResult fields", () => {
    const result = mapRismToResult(makeItem());

    expect(result.siglum).toBe("F-Pn RES F-923");
    expect(result.library).toBe("N/A");
    expect(result.city).toBe("N/A");
    expect(result.century).toBe("N/A");
    expect(result.incipit).toBe("Pange lingua-A minor");
    expect(result.genre).toBe("N/A");
    expect(result.feast).toBe("N/A");
    expect(result.folio).toBe("N/A");
    expect(result.cantusId).toBe("N/A");
    expect(result.iiifManifest).toBe("N/A");
    expect(result.sourceUrl).toBe("https://rism.online/sources/840022701");
    expect(result.sourceDatabase).toBe("RISM Online");
  });

  it("handles missing label gracefully", () => {
    const result = mapRismToResult(
      makeItem({ label: { en: [] } }),
    );

    expect(result.siglum).toBe("N/A");
    expect(result.incipit).toBe("N/A");
    expect(result.sourceDatabase).toBe("RISM Online");
  });

  it("uses item.id as sourceUrl", () => {
    const result = mapRismToResult(
      makeItem({ id: "https://rism.online/sources/999" }),
    );
    expect(result.sourceUrl).toBe("https://rism.online/sources/999");
  });

  it("always sets imageAvailable=false (RISM never provides image URLs)", () => {
    const result = mapRismToResult(makeItem());
    expect(result.imageAvailable).toBe(false);
  });
});
