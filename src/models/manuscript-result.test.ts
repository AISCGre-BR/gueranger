import { describe, it, expect } from "vitest";
import { ManuscriptResultSchema } from "./manuscript-result.js";
import type { ManuscriptResult } from "./manuscript-result.js";

const validData = {
  siglum: "F-Pn lat. 1090",
  library: "Bibliotheque nationale de France",
  city: "Paris",
  century: "13th century",
  incipit: "Pange lingua gloriosi corporis mysterium",
  genre: "hymn",
  feast: "Corpus Christi",
  folio: "145v",
  cantusId: "008368",
  iiifManifest: "N/A",
  sourceUrl: "https://cantusindex.org/id/008368",
  sourceDatabase: "Cantus Index",
};

describe("ManuscriptResultSchema", () => {
  it("parses valid data and adds matchType default", () => {
    const result = ManuscriptResultSchema.parse(validData);
    expect(result).toEqual({ ...validData, matchType: "text", imageAvailable: true });
  });

  it("fails when siglum is missing", () => {
    const { siglum, ...noSiglum } = validData;
    expect(() => ManuscriptResultSchema.parse(noSiglum)).toThrow();
  });

  it("fails when library is missing", () => {
    const { library, ...noLibrary } = validData;
    expect(() => ManuscriptResultSchema.parse(noLibrary)).toThrow();
  });

  it("fails when city is missing", () => {
    const { city, ...noCity } = validData;
    expect(() => ManuscriptResultSchema.parse(noCity)).toThrow();
  });

  it("fails when century is missing", () => {
    const { century, ...noCentury } = validData;
    expect(() => ManuscriptResultSchema.parse(noCentury)).toThrow();
  });

  it("fails when incipit is missing", () => {
    const { incipit, ...noIncipit } = validData;
    expect(() => ManuscriptResultSchema.parse(noIncipit)).toThrow();
  });

  it("fails when genre is missing", () => {
    const { genre, ...noGenre } = validData;
    expect(() => ManuscriptResultSchema.parse(noGenre)).toThrow();
  });

  it("fails when feast is missing", () => {
    const { feast, ...noFeast } = validData;
    expect(() => ManuscriptResultSchema.parse(noFeast)).toThrow();
  });

  it("fails when folio is missing", () => {
    const { folio, ...noFolio } = validData;
    expect(() => ManuscriptResultSchema.parse(noFolio)).toThrow();
  });

  it("fails when cantusId is missing", () => {
    const { cantusId, ...noCantusId } = validData;
    expect(() => ManuscriptResultSchema.parse(noCantusId)).toThrow();
  });

  it("fails when iiifManifest is missing", () => {
    const { iiifManifest, ...noIiif } = validData;
    expect(() => ManuscriptResultSchema.parse(noIiif)).toThrow();
  });

  it("fails when sourceUrl is missing", () => {
    const { sourceUrl, ...noSourceUrl } = validData;
    expect(() => ManuscriptResultSchema.parse(noSourceUrl)).toThrow();
  });

  it("fails when sourceDatabase is missing", () => {
    const { sourceDatabase, ...noSourceDb } = validData;
    expect(() => ManuscriptResultSchema.parse(noSourceDb)).toThrow();
  });

  it("fails with only siglum (missing all other fields)", () => {
    expect(() => ManuscriptResultSchema.parse({ siglum: "test" })).toThrow();
  });

  it("has exactly 14 fields (12 required + matchType + imageAvailable with defaults)", () => {
    const result = ManuscriptResultSchema.parse(validData);
    const keys = Object.keys(result);
    expect(keys).toHaveLength(14);
    expect(keys).toContain("siglum");
    expect(keys).toContain("library");
    expect(keys).toContain("city");
    expect(keys).toContain("century");
    expect(keys).toContain("incipit");
    expect(keys).toContain("genre");
    expect(keys).toContain("feast");
    expect(keys).toContain("folio");
    expect(keys).toContain("cantusId");
    expect(keys).toContain("iiifManifest");
    expect(keys).toContain("sourceUrl");
    expect(keys).toContain("sourceDatabase");
    expect(keys).toContain("matchType");
    expect(keys).toContain("imageAvailable");
    expect(result.matchType).toBe("text");
    expect(result.imageAvailable).toBe(true);
  });

  it("imageAvailable defaults to true when not provided", () => {
    const result = ManuscriptResultSchema.parse(validData);
    expect(result.imageAvailable).toBe(true);
  });

  it("imageAvailable can be explicitly set to false", () => {
    const result = ManuscriptResultSchema.parse({ ...validData, imageAvailable: false });
    expect(result.imageAvailable).toBe(false);
  });

  it("all fields are strings (rejects numbers)", () => {
    const withNumber = { ...validData, century: 13 };
    expect(() => ManuscriptResultSchema.parse(withNumber)).toThrow();
  });
});
