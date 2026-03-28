import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManuscriptResult } from "../models/manuscript-result.js";

// Mock global fetch for HEAD requests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { validateImageUrls } from "./image-validator.js";

function makeResult(overrides: Partial<ManuscriptResult> = {}): ManuscriptResult {
  return {
    siglum: "F-Pn lat. 1090",
    library: "BnF",
    city: "Paris",
    century: "12th century",
    incipit: "Pange lingua",
    genre: "Hymn",
    feast: "Corpus Christi",
    folio: "145v",
    cantusId: "008248",
    iiifManifest: "N/A",
    sourceUrl: "https://example.com",
    sourceDatabase: "Cantus",
    matchType: "text",
    imageAvailable: true,
    ...overrides,
  };
}

describe("validateImageUrls", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("sets imageAvailable=false for N/A iiifManifest without making requests", async () => {
    const results = [makeResult({ iiifManifest: "N/A" })];
    const validated = await validateImageUrls(results);
    expect(validated[0].imageAvailable).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sets imageAvailable=false for empty iiifManifest without making requests", async () => {
    const results = [makeResult({ iiifManifest: "" })];
    const validated = await validateImageUrls(results);
    expect(validated[0].imageAvailable).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sets imageAvailable=true for successful HEAD request (2xx)", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const results = [makeResult({ iiifManifest: "https://example.com/manifest.json" })];
    const validated = await validateImageUrls(results);
    expect(validated[0].imageAvailable).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps imageAvailable=true when HEAD fails but URL exists (trusts adapter)", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    const results = [makeResult({ iiifManifest: "https://example.com/broken.json" })];
    const validated = await validateImageUrls(results);
    // Adapter set imageAvailable=true and URL exists — don't downgrade on HEAD failure
    expect(validated[0].imageAvailable).toBe(true);
  });

  it("keeps imageAvailable=true on network error when URL exists (trusts adapter)", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const results = [makeResult({ iiifManifest: "https://example.com/timeout.json" })];
    const validated = await validateImageUrls(results);
    // Adapter set imageAvailable=true and URL exists — timeout doesn't mean unavailable
    expect(validated[0].imageAvailable).toBe(true);
  });

  it("validates same URL only once (cache)", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const url = "https://example.com/manifest.json";
    const results = [
      makeResult({ iiifManifest: url }),
      makeResult({ iiifManifest: url, siglum: "A-Wn 1799" }),
    ];
    const validated = await validateImageUrls(results);
    expect(validated[0].imageAvailable).toBe(true);
    expect(validated[1].imageAvailable).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("caps validation at 20 unique URLs, remainder defaults to true", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const results = Array.from({ length: 25 }, (_, i) =>
      makeResult({ iiifManifest: `https://example.com/manifest-${i}.json`, siglum: `SIG-${i}` }),
    );
    const validated = await validateImageUrls(results);
    // All should be true (20 validated + 5 defaulted)
    expect(validated.every((r) => r.imageAvailable)).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(20);
  });
});
