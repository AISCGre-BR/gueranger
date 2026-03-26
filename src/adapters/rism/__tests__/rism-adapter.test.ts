import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SearchQuery } from "../../../models/query.js";

// Mock the client module before importing adapter
vi.mock("../rism-client.js", () => ({
  searchSources: vi.fn(),
}));

// Mock http-client to avoid real rate limiter instantiation
vi.mock("../../../utils/http-client.js", () => ({
  createRateLimiter: vi.fn(() => ({
    schedule: vi.fn((fn: () => unknown) => fn()),
  })),
  fetchWithRetry: vi.fn(),
}));

import { RismAdapter } from "../rism-adapter.js";
import { searchSources } from "../rism-client.js";

const mockSearchSources = vi.mocked(searchSources);

const baseQuery: SearchQuery = {
  query: "pange lingua",
  rawQuery: "Pange lingua",
};

function makeRismSearchResponse() {
  return {
    totalItems: 4126,
    view: {
      totalPages: 207,
      thisPage: 1,
    },
    items: [
      {
        id: "https://rism.online/sources/840022701",
        label: {
          en: ["Pange lingua-A minor; Manuscript copy; F-Pn RES F-923"],
        },
      },
      {
        id: "https://rism.online/sources/840013672",
        label: {
          en: ["12 Motets; Manuscript copy; GB-Lbl Add. 12345"],
        },
      },
    ],
  };
}

describe("RismAdapter", () => {
  let adapter: RismAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new RismAdapter();
  });

  it('has name "RISM Online"', () => {
    expect(adapter.name).toBe("RISM Online");
  });

  describe("search behavior", () => {
    it("returns correctly mapped ManuscriptResult[]", async () => {
      mockSearchSources.mockResolvedValue(makeRismSearchResponse());

      const results = await adapter.search(baseQuery);

      expect(results).toHaveLength(2);
      expect(results[0].siglum).toBe("F-Pn RES F-923");
      expect(results[0].sourceDatabase).toBe("RISM Online");
      expect(results[0].incipit).toBe("Pange lingua-A minor");
      expect(results[0].sourceUrl).toBe(
        "https://rism.online/sources/840022701",
      );

      expect(results[1].siglum).toBe("GB-Lbl Add. 12345");
      expect(results[1].incipit).toBe("12 Motets");
    });

    it("returns empty array when API errors", async () => {
      mockSearchSources.mockRejectedValue(new Error("RISM API down"));

      const results = await adapter.search(baseQuery);
      expect(results).toEqual([]);
    });

    it("returns empty array when no items returned", async () => {
      mockSearchSources.mockResolvedValue({
        totalItems: 0,
        items: [],
      });

      const results = await adapter.search(baseQuery);
      expect(results).toEqual([]);
    });

    it("passes rawQuery to searchSources", async () => {
      mockSearchSources.mockResolvedValue({ totalItems: 0, items: [] });

      await adapter.search(baseQuery);

      expect(mockSearchSources).toHaveBeenCalledWith(
        "Pange lingua",
        expect.anything(),
      );
    });
  });
});
