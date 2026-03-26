import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SearchQuery } from "../../../models/query.js";

// Mock the client module before importing adapter
vi.mock("../diamm-client.js", () => ({
  searchCompositions: vi.fn(),
  getSourceDetail: vi.fn(),
}));

// Mock http-client to avoid real rate limiter instantiation
vi.mock("../../../utils/http-client.js", () => ({
  createRateLimiter: vi.fn(() => ({
    schedule: vi.fn((fn: () => unknown) => fn()),
  })),
  fetchWithRetry: vi.fn(),
}));

import {
  DiammAdapter,
  DiammCredentialsMissingError,
} from "../diamm-adapter.js";
import { searchCompositions, getSourceDetail } from "../diamm-client.js";

const mockSearchCompositions = vi.mocked(searchCompositions);
const mockGetSourceDetail = vi.mocked(getSourceDetail);

const baseQuery: SearchQuery = {
  query: "pange lingua",
  rawQuery: "Pange lingua",
};

function makeDiammSearchResponse() {
  return {
    count: 1,
    results: [
      {
        pk: "11954",
        url: "https://www.diamm.ac.uk/compositions/11954/?format=json",
        heading: "Pange lingua gloriosi corporis misterium",
        type: "composition",
        title: "Pange lingua gloriosi corporis misterium",
        sources: [
          {
            url: "https://www.diamm.ac.uk/sources/4871/?format=json",
            display_name: "F-CHM 27",
            has_images: false,
            has_external_manifest: false,
            folio_start: "4v",
            folio_end: "5",
          },
        ],
      },
    ],
  };
}

function makeDiammSourceDetail() {
  return {
    pk: 4871,
    display_name: "F-CHM 27",
    shelfmark: "27",
    date_statement: "end of 13th century",
    archive: {
      url: "https://www.diamm.ac.uk/archives/123/",
      name: "Mediatheque Jean-Jacques Rousseau",
      siglum: "F-CHM",
      city: "Chambery",
      country: "France",
    },
    manifest_url: "https://api.irht.cnrs.fr/ark:/12345/manifest.json",
    links: [],
    inventory: [
      {
        pk: 145538,
        genres: ["Hymn"],
        folio_start: "rear flyleaf",
        composition: "Pange lingua",
      },
    ],
  };
}

describe("DiammAdapter", () => {
  let adapter: DiammAdapter;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    adapter = new DiammAdapter();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('has name "DIAMM"', () => {
    expect(adapter.name).toBe("DIAMM");
  });

  describe("credential handling (D-03, D-04)", () => {
    it("throws DiammCredentialsMissingError when DIAMM_USERNAME is not set", async () => {
      delete process.env.DIAMM_USERNAME;
      delete process.env.DIAMM_PASSWORD;

      await expect(adapter.search(baseQuery)).rejects.toThrow(
        DiammCredentialsMissingError,
      );
      await expect(adapter.search(baseQuery)).rejects.toThrow(
        "DIAMM results unavailable — credentials not configured",
      );
    });

    it("throws DiammCredentialsMissingError when DIAMM_PASSWORD is not set", async () => {
      process.env.DIAMM_USERNAME = "user";
      delete process.env.DIAMM_PASSWORD;

      await expect(adapter.search(baseQuery)).rejects.toThrow(
        DiammCredentialsMissingError,
      );
    });

    it("throws DiammCredentialsMissingError when credentials are empty strings", async () => {
      process.env.DIAMM_USERNAME = "";
      process.env.DIAMM_PASSWORD = "";

      await expect(adapter.search(baseQuery)).rejects.toThrow(
        DiammCredentialsMissingError,
      );
    });

    it("proceeds with search when credentials are set (D-03)", async () => {
      process.env.DIAMM_USERNAME = "testuser";
      process.env.DIAMM_PASSWORD = "testpass";

      mockSearchCompositions.mockResolvedValue(makeDiammSearchResponse());
      mockGetSourceDetail.mockResolvedValue(makeDiammSourceDetail());

      const results = await adapter.search(baseQuery);

      expect(results).toHaveLength(1);
      expect(results[0].siglum).toBe("F-CHM 27");
      expect(results[0].sourceDatabase).toBe("DIAMM");
      expect(results[0].library).toBe("Mediatheque Jean-Jacques Rousseau");
      expect(results[0].city).toBe("Chambery");
      expect(results[0].century).toBe("end of 13th century");
      expect(results[0].iiifManifest).toBe(
        "https://api.irht.cnrs.fr/ark:/12345/manifest.json",
      );

      // Verify auth was passed to client functions
      expect(mockSearchCompositions).toHaveBeenCalledWith(
        "Pange lingua",
        expect.anything(),
        { username: "testuser", password: "testpass" },
      );
      expect(mockGetSourceDetail).toHaveBeenCalledWith(
        "4871",
        expect.anything(),
        { username: "testuser", password: "testpass" },
      );
    });
  });

  describe("search behavior", () => {
    beforeEach(() => {
      process.env.DIAMM_USERNAME = "testuser";
      process.env.DIAMM_PASSWORD = "testpass";
    });

    it("returns empty array when API errors (with credentials present)", async () => {
      mockSearchCompositions.mockRejectedValue(new Error("API down"));

      const results = await adapter.search(baseQuery);
      expect(results).toEqual([]);
    });

    it("returns empty array when search has no results", async () => {
      mockSearchCompositions.mockResolvedValue({ count: 0, results: [] });

      const results = await adapter.search(baseQuery);
      expect(results).toEqual([]);
    });

    it("extracts unique source PKs from composition sources", async () => {
      const response = makeDiammSearchResponse();
      // Add a second composition with the same source
      response.results.push({
        pk: "99999",
        url: "https://www.diamm.ac.uk/compositions/99999/?format=json",
        heading: "Another composition",
        type: "composition",
        title: "Another composition",
        sources: [
          {
            url: "https://www.diamm.ac.uk/sources/4871/?format=json",
            display_name: "F-CHM 27",
            has_images: false,
            has_external_manifest: false,
            folio_start: "10r",
            folio_end: "10v",
          },
        ],
      });

      mockSearchCompositions.mockResolvedValue(response);
      mockGetSourceDetail.mockResolvedValue(makeDiammSourceDetail());

      const results = await adapter.search(baseQuery);

      // Two results (one per composition-source pair) but getSourceDetail only called once for the unique PK
      expect(results).toHaveLength(2);
      expect(mockGetSourceDetail).toHaveBeenCalledTimes(1);
    });
  });

  describe("DiammCredentialsMissingError", () => {
    it("has correct name property", () => {
      const error = new DiammCredentialsMissingError();
      expect(error.name).toBe("DiammCredentialsMissingError");
    });

    it("has correct message", () => {
      const error = new DiammCredentialsMissingError();
      expect(error.message).toBe(
        "DIAMM results unavailable \u2014 credentials not configured",
      );
    });

    it("is an instance of Error", () => {
      const error = new DiammCredentialsMissingError();
      expect(error).toBeInstanceOf(Error);
    });
  });
});
