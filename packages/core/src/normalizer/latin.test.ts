import { describe, it, expect } from "vitest";
import { normalizeLatinText, matchesIncipit } from "./latin.js";

describe("normalizeLatinText", () => {
  describe("case insensitivity (LATN-02)", () => {
    it("converts uppercase to lowercase", () => {
      expect(normalizeLatinText("PANGE LINGUA")).toBe("pange lingua");
    });

    it("converts mixed case to lowercase", () => {
      expect(normalizeLatinText("Pange Lingua")).toBe("pange lingua");
    });

    it("leaves already lowercase unchanged", () => {
      expect(normalizeLatinText("pange lingua")).toBe("pange lingua");
    });
  });

  describe("diacritics", () => {
    it("strips acute accents", () => {
      expect(normalizeLatinText("Domínus")).toBe("dominus");
    });

    it("strips circumflex accents", () => {
      expect(normalizeLatinText("lûmen")).toBe("lumen");
    });

    it("strips grave accents", () => {
      expect(normalizeLatinText("è")).toBe("e");
    });
  });

  describe("j/i normalization (LATN-01)", () => {
    it("converts j to i in Jesu", () => {
      expect(normalizeLatinText("Jesu")).toBe("iesu");
    });

    it("converts j to i in jejunium", () => {
      expect(normalizeLatinText("jejunium")).toBe("ieiunium");
    });

    it("converts uppercase J to i", () => {
      expect(normalizeLatinText("JERUSALEM")).toBe("ierusalem");
    });
  });

  describe("v/u normalization (LATN-01)", () => {
    it("converts v to u in lingva", () => {
      expect(normalizeLatinText("lingva")).toBe("lingua");
    });

    it("converts v to u in vinum", () => {
      expect(normalizeLatinText("vinum")).toBe("uinum");
    });

    it("converts V to u in uppercase", () => {
      expect(normalizeLatinText("VERBUM")).toBe("uerbum");
    });
  });

  describe("ae/e diphthong (LATN-01)", () => {
    it("converts ae to e in caelum", () => {
      expect(normalizeLatinText("caelum")).toBe("celum");
    });

    it("converts ae to e in praemium", () => {
      expect(normalizeLatinText("praemium")).toBe("premium");
    });

    it("handles uppercase AE", () => {
      expect(normalizeLatinText("CAELUM")).toBe("celum");
    });
  });

  describe("oe/e diphthong (LATN-01)", () => {
    it("converts oe to e in coelum", () => {
      expect(normalizeLatinText("coelum")).toBe("celum");
    });

    it("converts oe to e in poena", () => {
      expect(normalizeLatinText("poena")).toBe("pena");
    });
  });

  describe("ti/ci assibilation (LATN-01)", () => {
    it("converts ti to ci before vowel in ratio", () => {
      expect(normalizeLatinText("ratio")).toBe("racio");
    });

    it("converts ti to ci before vowel in totius", () => {
      expect(normalizeLatinText("totius")).toBe("tocius");
    });

    it("converts ti to ci before vowel in etiam", () => {
      expect(normalizeLatinText("etiam")).toBe("eciam");
    });

    it("does not convert ti when not before vowel in christus", () => {
      // "christus" -> lowercase "christus", no ti before vowel (t is before u but "ti" is not present -- "st" cluster)
      expect(normalizeLatinText("christus")).toBe("christus");
    });

    it("converts ti to ci in hostia", () => {
      expect(normalizeLatinText("hostia")).toBe("hoscia");
    });
  });

  describe("whitespace normalization", () => {
    it("collapses multiple spaces", () => {
      expect(normalizeLatinText("pange  lingua")).toBe("pange lingua");
    });

    it("trims leading and trailing whitespace", () => {
      expect(normalizeLatinText("  pange lingua  ")).toBe("pange lingua");
    });

    it("collapses tabs and newlines", () => {
      expect(normalizeLatinText("pange\t\nlingua")).toBe("pange lingua");
    });
  });

  describe("combined transformations", () => {
    it("applies all transformations to 'Pange lingva'", () => {
      expect(normalizeLatinText("Pange lingva")).toBe("pange lingua");
    });

    it("normalizes CAELUM with case and diphthong", () => {
      expect(normalizeLatinText("CAELUM")).toBe("celum");
    });

    it("handles complex combination", () => {
      // "Jesu Caelestis" -> lowercase -> diacritics -> j->i -> v->u -> ae->e -> oe->e -> ti/ci -> whitespace
      // "jesu caelestis" -> "iesu celestis" -> no ti before vowel (stis has "ti" before "s" not vowel)
      // Wait: "celestis" has "ti" before "s" -- not a vowel. So no change.
      expect(normalizeLatinText("Jesu Caelestis")).toBe("iesu celestis");
    });
  });

  describe("idempotency", () => {
    it("normalizing already-normalized text returns same result", () => {
      const once = normalizeLatinText("Pange lingua gloriosi");
      const twice = normalizeLatinText(once);
      expect(twice).toBe(once);
    });

    it("double normalization of complex text is stable", () => {
      const once = normalizeLatinText("Jesu Caelestis lingva");
      const twice = normalizeLatinText(once);
      expect(twice).toBe(once);
    });
  });
});

describe("matchesIncipit (LATN-03)", () => {
  it("matches when query is prefix of stored incipit", () => {
    expect(
      matchesIncipit("Pange lingua gloriosi corporis mysterium", "Pange lingua")
    ).toBe(true);
  });

  it("matches with v/u variant and case difference", () => {
    expect(
      matchesIncipit("Pange lingua gloriosi", "pange lingva")
    ).toBe(true);
  });

  it("does not match when query is longer than stored", () => {
    expect(
      matchesIncipit("Pange", "Pange lingua gloriosi")
    ).toBe(false);
  });

  it("does not match unrelated text", () => {
    expect(matchesIncipit("Ave Maria", "Pange lingua")).toBe(false);
  });

  it("matches exact full incipit", () => {
    expect(
      matchesIncipit("Pange lingua", "Pange lingua")
    ).toBe(true);
  });

  it("matches with diacritics in stored text", () => {
    expect(
      matchesIncipit("Domínus vobíscum", "dominus")
    ).toBe(true);
  });
});
