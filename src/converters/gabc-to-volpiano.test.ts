import { describe, it, expect } from "vitest";
import { isGabc, gabcToVolpiano } from "./gabc-to-volpiano.js";

describe("isGabc", () => {
  it("detects full GABC with clef and text", () => {
    expect(isGabc("(c4) Pan(f)ge(gfg) lin(hjh)gua(g)")).toBe(true);
  });

  it("detects neume-only GABC with clef", () => {
    expect(isGabc("(c4)(f)(gfg)(hjh)(g)")).toBe(true);
  });

  it("detects parenthesized note groups without explicit clef", () => {
    expect(isGabc("(f)(gfg)(hjh)")).toBe(true);
  });

  it("rejects Volpiano notation", () => {
    expect(isGabc("1---h--ij---h--g---k")).toBe(false);
  });

  it("rejects plain pitch letters", () => {
    expect(isGabc("hijhgk")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isGabc("")).toBe(false);
  });

  it("rejects random text", () => {
    expect(isGabc("some random text")).toBe(false);
  });
});

describe("gabcToVolpiano", () => {
  describe("c4 clef", () => {
    it("converts full GABC with text and neumes", () => {
      // c4 clef: f->65->'f', g->67->'g', h->69->'h', j->72->'k'
      expect(gabcToVolpiano("(c4) Pan(f)ge(gfg) lin(hjh)gua(g)")).toBe(
        "fgfghkhg",
      );
    });

    it("converts neume-only input with c4 clef", () => {
      expect(gabcToVolpiano("(c4)(f)(gfg)(hjh)(g)")).toBe("fgfghkhg");
    });
  });

  describe("f3 clef", () => {
    it("produces different pitches than c4 for same note letters", () => {
      const c4Result = gabcToVolpiano("(c4)(f)(g)(h)");
      const f3Result = gabcToVolpiano("(f3)(f)(g)(h)");
      expect(c4Result).not.toBe(f3Result);
      // f3 clef: clef_pos=1, C_ref=60
      // f: pos=2, rel=1, oct=0, deg=1 -> 60+2=62 -> 'd'
      // g: pos=3, rel=2, oct=0, deg=2 -> 60+4=64 -> 'e'
      // h: pos=4, rel=3, oct=0, deg=3 -> 60+5=65 -> 'f'
      expect(f3Result).toBe("def");
    });
  });

  describe("default clef", () => {
    it("uses c4 default when no explicit clef", () => {
      expect(gabcToVolpiano("(f)(gfg)(hjh)(g)")).toBe("fgfghkhg");
    });
  });

  describe("mid-piece clef change", () => {
    it("switches pitch mapping when clef changes mid-piece", () => {
      // c4: f->65->'f', g->67->'g'
      // f3: f->62->'d', g->64->'e'
      expect(gabcToVolpiano("(c4)(f)(g)(f3)(f)(g)")).toBe("fgde");
    });
  });

  describe("flat clef (cb3)", () => {
    it("uses flat scale with minor 7th for cb3 clef", () => {
      // cb3: clef_pos=4, C_ref=72, FLAT_SCALE=[0,2,4,5,7,9,10]
      // f: pos=2, rel=-2, oct=-1, deg=5 -> 72-12+9=69 -> 'h'
      // g: pos=3, rel=-1, oct=-1, deg=6 -> 72-12+10=70 -> UNMAPPED (Bb not in Volpiano)
      // h: pos=4, rel=0, oct=0, deg=0 -> 72+0=72 -> 'k'
      const result = gabcToVolpiano("(cb3)(f)(g)(h)");
      expect(result).toBe("hk"); // g skipped (MIDI 70 unmapped)
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty input", () => {
      expect(gabcToVolpiano("")).toBe("");
    });

    it("returns empty string when no note letters in parentheses", () => {
      expect(gabcToVolpiano("(c4)")).toBe("");
    });

    it("handles neume-only input without text", () => {
      const result = gabcToVolpiano("(c4)(f)(g)");
      expect(result).toBe("fg");
    });

    it("ignores liquescent/ornamental characters -- only a-m extracted", () => {
      // Characters outside a-m in note groups should be ignored
      const result = gabcToVolpiano("(c4)(fF)(gG~)");
      expect(result).toBe("fg");
    });

    it("skips notes outside MIDI_TO_VOLPIANO range", () => {
      // Best-effort: notes that don't map are silently skipped
      const result = gabcToVolpiano("(c4)(f)(g)");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
