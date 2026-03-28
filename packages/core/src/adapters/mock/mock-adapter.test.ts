import { describe, it, expect } from "vitest";
import { MockAdapter } from "./mock-adapter.js";
import type { SearchQuery } from "../../models/query.js";

describe("MockAdapter", () => {
  const adapter = new MockAdapter();

  it("has name 'Mock Data'", () => {
    expect(adapter.name).toBe("Mock Data");
  });

  it("search 'pange lingua' returns 2 results (both Pange lingua variants)", async () => {
    const query: SearchQuery = { query: "pange lingua", rawQuery: "Pange lingua" };
    const results = await adapter.search(query);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.incipit)).toEqual(
      expect.arrayContaining([
        "Pange lingua gloriosi corporis mysterium",
        "Pange lingua gloriosi proelii certamen",
      ]),
    );
  });

  it("search 'pange lingua' with genre 'hymn' returns 2 results", async () => {
    const query: SearchQuery = { query: "pange lingua", rawQuery: "Pange lingua", genre: "hymn" };
    const results = await adapter.search(query);
    expect(results).toHaveLength(2);
  });

  it("search 'ave maris stella' returns 2 results", async () => {
    // normalizeLatinText("ave maris stella") => "aue maris stella"
    // matchesIncipit normalizes both sides, so raw "ave maris stella" works
    const query: SearchQuery = { query: "ave maris stella", rawQuery: "Ave maris stella" };
    const results = await adapter.search(query);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.siglum)).toEqual(
      expect.arrayContaining(["D-Mbs Clm 4306", "F-Pn lat. 1090"]),
    );
  });

  it("search with genre 'antiphon' matching 'salve regina' returns 1 result", async () => {
    const query: SearchQuery = {
      query: "salve regina",
      rawQuery: "Salve regina",
      genre: "antiphon",
    };
    const results = await adapter.search(query);
    expect(results).toHaveLength(1);
    expect(results[0].siglum).toBe("I-Rvat lat. 5319");
  });

  it("search with genre 'sequence' matching 'victimae' returns 1 result", async () => {
    const query: SearchQuery = {
      query: "victimae",
      rawQuery: "Victimae",
      genre: "sequence",
    };
    const results = await adapter.search(query);
    expect(results).toHaveLength(1);
    expect(results[0].siglum).toBe("CH-SGs 390");
  });

  it("search with feast 'Easter' returns results with feast containing Easter", async () => {
    // "victimae" matches CH-SGs 390 which has feast "Easter"
    const query: SearchQuery = {
      query: "victimae",
      rawQuery: "Victimae",
      feast: "Easter",
    };
    const results = await adapter.search(query);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.feast.toLowerCase().includes("easter"))).toBe(true);
  });

  it("search with non-matching query returns empty array", async () => {
    const query: SearchQuery = {
      query: "nonexistent chant xyz",
      rawQuery: "nonexistent chant xyz",
    };
    const results = await adapter.search(query);
    expect(results).toHaveLength(0);
  });

  it("search with century '12th' filters correctly", async () => {
    // "pange lingua" with century "12th" should return only A-Wn 1799 (12th century)
    const query: SearchQuery = {
      query: "pange lingua",
      rawQuery: "Pange lingua",
      century: "12th",
    };
    const results = await adapter.search(query);
    expect(results).toHaveLength(1);
    expect(results[0].siglum).toBe("A-Wn 1799");
    expect(results[0].century).toBe("12th century");
  });
});
