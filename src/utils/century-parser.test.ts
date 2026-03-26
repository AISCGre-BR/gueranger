import { describe, it, expect } from "vitest";
import { parseCentury } from "./century-parser.js";

describe("parseCentury", () => {
  it('parses ordinal "12th" to 12', () => {
    expect(parseCentury("12th")).toBe(12);
  });

  it('parses ordinal with word "13th century" to 13', () => {
    expect(parseCentury("13th century")).toBe(13);
  });

  it('parses date range "1100-1200" to 12', () => {
    expect(parseCentury("1100-1200")).toBe(12);
  });

  it('parses Roman numeral "XII" to 12', () => {
    expect(parseCentury("XII")).toBe(12);
  });

  it('parses plain number "9" to 9', () => {
    expect(parseCentury("9")).toBe(9);
  });

  it('returns null for "nonsense"', () => {
    expect(parseCentury("nonsense")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCentury("")).toBeNull();
  });

  it('parses "1st" to 1', () => {
    expect(parseCentury("1st")).toBe(1);
  });

  it('parses "2nd" to 2', () => {
    expect(parseCentury("2nd")).toBe(2);
  });

  it('parses "3rd" to 3', () => {
    expect(parseCentury("3rd")).toBe(3);
  });

  it('parses lowercase Roman "xii" to 12', () => {
    expect(parseCentury("xii")).toBe(12);
  });

  it('parses "IX" to 9', () => {
    expect(parseCentury("IX")).toBe(9);
  });
});
