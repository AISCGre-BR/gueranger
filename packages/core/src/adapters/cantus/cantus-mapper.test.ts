import { describe, it, expect } from "vitest";
import {
  mapCantusIndexChantToResult,
  mapCantusDbMelodyToResult,
} from "./cantus-mapper.js";
import { genreCodeToName, genreNameToCode } from "./genre-codes.js";
import { dbCodeToName } from "./db-codes.js";
import { ManuscriptResultSchema } from "../../models/manuscript-result.js";

describe("genreCodeToName", () => {
  it('maps "H" to "Hymn"', () => {
    expect(genreCodeToName("H")).toBe("Hymn");
  });

  it('maps "A" to "Antiphon"', () => {
    expect(genreCodeToName("A")).toBe("Antiphon");
  });

  it('maps "R" to "Responsory"', () => {
    expect(genreCodeToName("R")).toBe("Responsory");
  });

  it('passes through unknown code "ZZ"', () => {
    expect(genreCodeToName("ZZ")).toBe("ZZ");
  });
});

describe("genreNameToCode", () => {
  it('maps "hymn" (case-insensitive) to "H"', () => {
    expect(genreNameToCode("hymn")).toBe("H");
  });

  it('maps "Antiphon" to "A"', () => {
    expect(genreNameToCode("Antiphon")).toBe("A");
  });

  it("returns undefined for unknown name", () => {
    expect(genreNameToCode("unknown")).toBeUndefined();
  });
});

describe("dbCodeToName", () => {
  it('maps "CD" to "Cantus Database"', () => {
    expect(dbCodeToName("CD")).toBe("Cantus Database");
  });

  it('maps "FCB" to "Fontes Cantus Bohemiae"', () => {
    expect(dbCodeToName("FCB")).toBe("Fontes Cantus Bohemiae");
  });

  it('returns "Cantus Index Network" for unknown code', () => {
    expect(dbCodeToName("UNKNOWN")).toBe("Cantus Index Network");
  });
});

describe("mapCantusIndexChantToResult", () => {
  it("maps a full chant object to ManuscriptResult", () => {
    const chant = {
      siglum: "F-Pn lat. 1090",
      srclink: "https://cantusindex.org/source/123",
      chantlink: "https://cantusindex.org/chant/456",
      folio: "145v",
      incipit: "Pange lingua gloriosi",
      feast: "Corpus Christi",
      genre: "H",
      century: "12",
      image: "",
      melody: "1---h--ij---h",
      fulltext: "Pange lingua gloriosi corporis mysterium",
      db: "CD",
    };

    const result = mapCantusIndexChantToResult(chant, "008248");
    expect(result.siglum).toBe("F-Pn lat. 1090");
    expect(result.folio).toBe("145v");
    expect(result.feast).toBe("Corpus Christi");
    expect(result.genre).toBe("Hymn");
    expect(result.century).toBe("12");
    expect(result.sourceUrl).toBe("https://cantusindex.org/chant/456");
    expect(result.sourceDatabase).toBe("Cantus Database");
    expect(result.cantusId).toBe("008248");
    expect(result.library).toBe("N/A");
    expect(result.city).toBe("N/A");
    expect(result.iiifManifest).toBe("N/A");

    // Validate against schema
    const parsed = ManuscriptResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("uses N/A fallbacks for minimal chant", () => {
    const chant = {
      siglum: "D-Mbs Clm 9508",
    };

    const result = mapCantusIndexChantToResult(chant, "001234");
    expect(result.siglum).toBe("D-Mbs Clm 9508");
    expect(result.folio).toBe("N/A");
    expect(result.feast).toBe("N/A");
    expect(result.genre).toBe("");
    expect(result.incipit).toBe("N/A");
    expect(result.century).toBe("N/A");
    expect(result.sourceUrl).toBe("N/A");
    expect(result.sourceDatabase).toBe("Cantus Index Network");
  });

  it("uses info-level fallbacks when chant fields are missing", () => {
    const chant = {
      siglum: "GB-Lbl Add. 12194",
    };

    const result = mapCantusIndexChantToResult(
      chant,
      "005555",
      "Easter",
      "R",
      "Haec dies quam fecit Dominus",
    );
    expect(result.feast).toBe("Easter");
    expect(result.genre).toBe("Responsory");
    expect(result.incipit).toBe("Haec dies quam fecit Dominus");
  });

  it("handles null century", () => {
    const chant = {
      siglum: "I-Rvat lat. 5319",
      century: null,
    };

    const result = mapCantusIndexChantToResult(chant, "003000");
    expect(result.century).toBe("N/A");
  });
});

describe("mapCantusDbMelodyToResult", () => {
  it("maps a CantusDB melody item to ManuscriptResult", () => {
    const item = {
      id: 42,
      source__holding_institution__siglum: "F-Pn",
      source__shelfmark: "lat. 1090",
      folio: "23r",
      incipit: "Veni creator spiritus",
      genre__name: "H",
      feast__name: "Pentecost",
      volpiano: "1---h--ij---h--g---k",
      cantus_id: "008407",
    };

    const result = mapCantusDbMelodyToResult(item);
    expect(result.siglum).toBe("F-Pn lat. 1090");
    expect(result.folio).toBe("23r");
    expect(result.genre).toBe("Hymn");
    expect(result.feast).toBe("Pentecost");
    expect(result.incipit).toBe("Veni creator spiritus");
    expect(result.sourceDatabase).toBe("Cantus Database");
    expect(result.cantusId).toBe("008407");
    expect(result.sourceUrl).toBe("https://cantusdatabase.org/id/008407");

    // Validate against schema
    const parsed = ManuscriptResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("handles minimal item with N/A fallbacks", () => {
    const item = {
      id: 1,
    };

    const result = mapCantusDbMelodyToResult(item);
    expect(result.siglum).toBe("N/A");
    expect(result.folio).toBe("N/A");
    expect(result.incipit).toBe("N/A");
    expect(result.genre).toBe("N/A");
    expect(result.feast).toBe("N/A");
  });

  it("uses provided cantusId over item cantus_id", () => {
    const item = {
      id: 2,
      cantus_id: "original",
    };

    const result = mapCantusDbMelodyToResult(item, "override");
    expect(result.cantusId).toBe("override");
  });
});
