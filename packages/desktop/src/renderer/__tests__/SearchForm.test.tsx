import { describe, it, expect } from "vitest";
import { extractTextFromGabc } from "../hooks/useSearch";

describe("GABC text extraction (DESK-02)", () => {
  it("extracts text from GABC by removing parenthesized groups", () => {
    const result = extractTextFromGabc("(c4) Pan(d)ge(e) lin(f)gua");
    expect(result).toBe("Pange lingua");
  });

  it("passes non-GABC text through unchanged", () => {
    const result = extractTextFromGabc("Pange lingua gloriosi");
    expect(result).toBe("Pange lingua gloriosi");
  });

  it("handles GABC with only clef notation", () => {
    const result = extractTextFromGabc("(c4) Pange lingua");
    expect(result).toBe("Pange lingua");
  });
});
