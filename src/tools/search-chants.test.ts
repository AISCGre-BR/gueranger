import { describe, it, expect } from "vitest";
import { handleSearchChants } from "./search-chants.js";

describe("handleSearchChants", () => {
  it("query 'Pange lingua' returns content containing 'Pange lingua gloriosi'", async () => {
    const result = await handleSearchChants({ query: "Pange lingua" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Pange lingua gloriosi");
  });

  it("query 'nonexistent chant' returns 'No manuscripts found'", async () => {
    const result = await handleSearchChants({ query: "nonexistent chant" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain("No manuscripts found");
  });

  it("query 'Pange lingua' with genre 'hymn' returns results", async () => {
    const result = await handleSearchChants({ query: "Pange lingua", genre: "hymn" });
    expect(result.content[0].text).toContain("Pange lingua gloriosi");
    expect(result.content[0].text).not.toContain("No manuscripts found");
  });

  it("query 'Ave maris stella' returns content containing 'Ave maris stella'", async () => {
    const result = await handleSearchChants({ query: "Ave maris stella" });
    expect(result.content[0].text).toContain("Ave maris stella");
    expect(result.content[0].text).not.toContain("No manuscripts found");
  });

  it("results text contains structured format fields (MCP-03)", async () => {
    const result = await handleSearchChants({ query: "Pange lingua" });
    const text = result.content[0].text;
    expect(text).toContain("Library:");
    expect(text).toContain("City:");
    expect(text).toContain("Century:");
  });
});
