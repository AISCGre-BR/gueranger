import { describe, it, expect } from "vitest";

describe("column definitions (DESK-03)", () => {
  it("columns array has 12 entries", async () => {
    const { columns } = await import("../lib/columns");
    expect(columns).toHaveLength(12);
  });

  it("includes all required ManuscriptResult field accessors", async () => {
    const { columns } = await import("../lib/columns");
    const accessorIds = columns
      .filter((c: any) => c.accessorKey)
      .map((c: any) => c.accessorKey);
    expect(accessorIds).toContain("siglum");
    expect(accessorIds).toContain("library");
    expect(accessorIds).toContain("city");
    expect(accessorIds).toContain("century");
    expect(accessorIds).toContain("genre");
    expect(accessorIds).toContain("feast");
    expect(accessorIds).toContain("folio");
    expect(accessorIds).toContain("sourceDatabase");
    expect(accessorIds).toContain("matchType");
    expect(accessorIds).toContain("imageAvailable");
  });

  it("has a select display column", async () => {
    const { columns } = await import("../lib/columns");
    const selectCol = columns.find((c: any) => c.id === "select");
    expect(selectCol).toBeDefined();
  });
});

describe("constants (D-03, D-09)", () => {
  it("GENRE_OPTIONS contains expected genres", async () => {
    const { GENRE_OPTIONS } = await import("../lib/constants");
    expect(GENRE_OPTIONS).toContain("Antiphon");
    expect(GENRE_OPTIONS).toContain("Hymn");
    expect(GENRE_OPTIONS).toContain("Responsory");
    expect(GENRE_OPTIONS).toContain("Introit");
  });

  it("CENTURY_OPTIONS has 8 entries (9th-16th)", async () => {
    const { CENTURY_OPTIONS } = await import("../lib/constants");
    expect(CENTURY_OPTIONS).toHaveLength(8);
    expect(CENTURY_OPTIONS[0]).toBe("9th century");
    expect(CENTURY_OPTIONS[7]).toBe("16th century");
  });

  it("PAGE_SIZE is 50", async () => {
    const { PAGE_SIZE } = await import("../lib/constants");
    expect(PAGE_SIZE).toBe(50);
  });
});
