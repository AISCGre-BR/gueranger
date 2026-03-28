import { describe, it, expect } from "vitest";
import { volpianoToNotes } from "./volpiano.js";

describe("volpianoToNotes", () => {
  it("extracts pitch letters from Volpiano string", () => {
    expect(volpianoToNotes("1---h--ij---h--g---k")).toBe("hijhgk");
  });

  it("strips barlines (3, 4) from Volpiano string", () => {
    expect(volpianoToNotes("1---h--g--f--h---3---k")).toBe("hgfhk");
  });

  it("returns empty string for empty input", () => {
    expect(volpianoToNotes("")).toBe("");
  });

  it("handles Volpiano with only non-pitch characters", () => {
    expect(volpianoToNotes("1---3---4")).toBe("");
  });
});
