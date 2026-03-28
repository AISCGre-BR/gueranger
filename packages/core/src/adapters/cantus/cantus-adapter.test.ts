import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManuscriptResult } from "../../models/manuscript-result.js";

// Mock the client modules before importing the adapter
vi.mock("./cantus-index-client.js", () => ({
  searchByText: vi.fn(),
  getChantsByCid: vi.fn(),
}));

vi.mock("./cantus-db-client.js", () => ({
  searchByMelody: vi.fn(),
}));

import { CantusAdapter } from "./cantus-adapter.js";
import { searchByText, getChantsByCid } from "./cantus-index-client.js";
import { searchByMelody } from "./cantus-db-client.js";
import type { SearchQuery } from "../../models/query.js";

const mockSearchByText = vi.mocked(searchByText);
const mockGetChantsByCid = vi.mocked(getChantsByCid);
const mockSearchByMelody = vi.mocked(searchByMelody);

function makeChant(overrides: Record<string, unknown> = {}) {
  return {
    siglum: "F-Pn lat. 1090",
    chantlink: "https://cantusindex.org/chant/1",
    folio: "145v",
    incipit: "Pange lingua gloriosi",
    feast: "Corpus Christi",
    genre: "H",
    century: "12",
    db: "CD",
    ...overrides,
  };
}

describe("CantusAdapter", () => {
  let adapter: CantusAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new CantusAdapter();
  });

  it("has name 'Cantus Index Network'", () => {
    expect(adapter.name).toBe("Cantus Index Network");
  });

  describe("text search", () => {
    it("performs two-phase search: text -> CIDs -> manuscripts", async () => {
      mockSearchByText.mockResolvedValue([
        { cid: "008248", fulltext: "Pange lingua gloriosi", genre: "H" },
      ]);
      mockGetChantsByCid.mockResolvedValue({
        info: { feast: "Corpus Christi", genre: "H", fulltext: "Pange lingua gloriosi corporis mysterium" },
        databases: {},
        chants: {
          "1": makeChant(),
          "2": makeChant({ siglum: "D-Mbs Clm 9508", folio: "23r" }),
        },
      });

      const query: SearchQuery = { query: "pange lingua", rawQuery: "Pange lingua" };
      const results = await adapter.search(query);

      expect(mockSearchByText).toHaveBeenCalledWith("Pange lingua");
      expect(mockGetChantsByCid).toHaveBeenCalledWith("008248");
      expect(results).toHaveLength(2);
      expect(results[0].siglum).toBe("F-Pn lat. 1090");
      expect(results[1].siglum).toBe("D-Mbs Clm 9508");
    });

    it("caps fan-out at 20 CIDs", async () => {
      const cids = Array.from({ length: 30 }, (_, i) => ({
        cid: String(i).padStart(6, "0"),
        fulltext: `Chant ${i}`,
        genre: "A",
      }));
      mockSearchByText.mockResolvedValue(cids);
      mockGetChantsByCid.mockResolvedValue({
        info: {},
        databases: {},
        chants: { "1": makeChant() },
      });

      const query: SearchQuery = { query: "chant", rawQuery: "chant" };
      await adapter.search(query);

      expect(mockGetChantsByCid).toHaveBeenCalledTimes(20);
    });

    it("caps results at 100", async () => {
      mockSearchByText.mockResolvedValue([
        { cid: "001000", fulltext: "Test", genre: "A" },
      ]);
      const chants: Record<string, ReturnType<typeof makeChant>> = {};
      for (let i = 0; i < 150; i++) {
        chants[String(i)] = makeChant({ siglum: `MS-${i}` });
      }
      mockGetChantsByCid.mockResolvedValue({
        info: {},
        databases: {},
        chants,
      });

      const query: SearchQuery = { query: "test", rawQuery: "test" };
      const results = await adapter.search(query);

      expect(results.length).toBe(100);
    });
  });

  describe("genre filter", () => {
    it("filters by genre name (case-insensitive)", async () => {
      mockSearchByText.mockResolvedValue([
        { cid: "001000", fulltext: "Test", genre: "H" },
      ]);
      mockGetChantsByCid.mockResolvedValue({
        info: {},
        databases: {},
        chants: {
          "1": makeChant({ genre: "H" }),
          "2": makeChant({ genre: "H", siglum: "MS-2" }),
          "3": makeChant({ genre: "A", siglum: "MS-3" }),
        },
      });

      const query: SearchQuery = { query: "test", rawQuery: "test", genre: "hymn" };
      const results = await adapter.search(query);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.genre === "Hymn")).toBe(true);
    });
  });

  describe("feast filter", () => {
    it("filters by feast name (case-insensitive, contains)", async () => {
      mockSearchByText.mockResolvedValue([
        { cid: "001000", fulltext: "Test", genre: "H" },
      ]);
      mockGetChantsByCid.mockResolvedValue({
        info: {},
        databases: {},
        chants: {
          "1": makeChant({ feast: "Corpus Christi" }),
          "2": makeChant({ feast: "Corpus Christi", siglum: "MS-2" }),
          "3": makeChant({ feast: "Easter", siglum: "MS-3" }),
        },
      });

      const query: SearchQuery = { query: "test", rawQuery: "test", feast: "Corpus Christi" };
      const results = await adapter.search(query);

      expect(results).toHaveLength(2);
    });
  });

  describe("century filter", () => {
    it("filters by century (parsed from various formats)", async () => {
      mockSearchByText.mockResolvedValue([
        { cid: "001000", fulltext: "Test", genre: "H" },
      ]);
      mockGetChantsByCid.mockResolvedValue({
        info: {},
        databases: {},
        chants: {
          "1": makeChant({ century: "12" }),
          "2": makeChant({ century: "13", siglum: "MS-2" }),
          "3": makeChant({ century: null, siglum: "MS-3" }),
        },
      });

      const query: SearchQuery = { query: "test", rawQuery: "test", century: "12th" };
      const results = await adapter.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].century).toBe("12");
    });
  });

  describe("filter-then-relax", () => {
    it("relaxes century first when all filters return 0", async () => {
      mockSearchByText.mockResolvedValue([
        { cid: "001000", fulltext: "Test", genre: "H" },
      ]);
      // All chants are Hymn + Corpus Christi but century 13, not 12
      mockGetChantsByCid.mockResolvedValue({
        info: {},
        databases: {},
        chants: {
          "1": makeChant({ century: "13", feast: "Corpus Christi", genre: "H" }),
          "2": makeChant({ century: "13", feast: "Corpus Christi", genre: "H", siglum: "MS-2" }),
        },
      });

      const query: SearchQuery = {
        query: "test",
        rawQuery: "test",
        genre: "hymn",
        feast: "Corpus Christi",
        century: "12th",
      };
      const results = await adapter.search(query);

      expect(results).toHaveLength(2);
      expect(adapter.lastRelaxationMessage).toContain("century");
    });
  });

  describe("melody search", () => {
    it("searches CantusDB by melody and maps results", async () => {
      mockSearchByMelody.mockResolvedValue({
        results: [
          {
            id: 1,
            source__holding_institution__siglum: "F-Pn",
            source__shelfmark: "lat. 1090",
            folio: "23r",
            incipit: "Veni creator spiritus",
            genre__name: "H",
            feast__name: "Pentecost",
            volpiano: "1---h--ij---h--g---k",
            cantus_id: "008407",
          },
          {
            id: 2,
            source__holding_institution__siglum: "D-Mbs",
            source__shelfmark: "Clm 9508",
            folio: "45v",
            incipit: "Veni creator spiritus",
            genre__name: "H",
            feast__name: "Pentecost",
            volpiano: "1---h--ij---h--g---k",
            cantus_id: "008407",
          },
        ],
        result_count: 2,
      });

      const query: SearchQuery = {
        query: "",
        rawQuery: "",
        melody: "1---h--ij---h--g---k",
      };
      const results = await adapter.search(query);

      expect(mockSearchByMelody).toHaveBeenCalledWith("1---h--ij---h--g---k", {
        genre: undefined,
        feast: undefined,
      });
      expect(results).toHaveLength(2);
      expect(results[0].siglum).toBe("F-Pn lat. 1090");
      expect(results[1].siglum).toBe("D-Mbs Clm 9508");
    });

    it("applies century filter client-side for melody search", async () => {
      mockSearchByMelody.mockResolvedValue({
        results: [
          {
            id: 1,
            source__holding_institution__siglum: "F-Pn",
            source__shelfmark: "lat. 1090",
            folio: "23r",
            incipit: "Test",
            genre__name: "H",
            feast__name: "Pentecost",
            cantus_id: "008407",
          },
        ],
        result_count: 1,
      });

      const query: SearchQuery = {
        query: "",
        rawQuery: "",
        melody: "1---h--ij",
        century: "12th",
      };
      const results = await adapter.search(query);

      // CantusDB melody results have century "N/A" -- excluded when century filter is active
      expect(results).toHaveLength(0);
    });
  });
});
