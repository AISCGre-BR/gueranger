import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManuscriptResult } from "../../models/manuscript-result.js";

// Mock fetchWithRetry before importing the module under test
vi.mock("../../utils/http-client.js", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    fetchWithRetry: vi.fn(),
  };
});

import { enrichWithCanvasLinks } from "../iiif-enrichment.js";
import { fetchWithRetry } from "../../utils/http-client.js";

const mockedFetch = vi.mocked(fetchWithRetry);

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

// IIIF v2 manifest fixture
const v2Manifest = {
  "@context": "http://iiif.io/api/presentation/2/context.json",
  sequences: [
    {
      canvases: [
        {
          "@id": "https://example.com/canvas/p1",
          label: "1r",
          images: [{ resource: { "@id": "https://example.com/img/1r.jpg" } }],
        },
        {
          "@id": "https://example.com/canvas/p290",
          label: "145v",
          images: [{ resource: { "@id": "https://example.com/img/145v.jpg" } }],
        },
      ],
    },
  ],
};

describe("enrichWithCanvasLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends #canvas={canvasId} when folio is known and canvas is found", async () => {
    const manifestUrl = "https://iiif.example.com/manifest.json";
    mockedFetch.mockResolvedValueOnce(v2Manifest);

    const results = [
      makeResult({
        folio: "145v",
        iiifManifest: manifestUrl,
      }),
    ];

    const enriched = await enrichWithCanvasLinks(results);

    expect(enriched[0].iiifManifest).toBe(
      "https://iiif.example.com/manifest.json#canvas=https://example.com/canvas/p290",
    );
    expect(mockedFetch).toHaveBeenCalledOnce();
  });

  it("leaves iiifManifest unchanged when folio is N/A", async () => {
    const manifestUrl = "https://iiif.example.com/manifest.json";
    const results = [
      makeResult({
        folio: "N/A",
        iiifManifest: manifestUrl,
      }),
    ];

    const enriched = await enrichWithCanvasLinks(results);

    expect(enriched[0].iiifManifest).toBe(manifestUrl);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("leaves iiifManifest unchanged when iiifManifest is N/A", async () => {
    const results = [
      makeResult({
        folio: "145v",
        iiifManifest: "N/A",
      }),
    ];

    const enriched = await enrichWithCanvasLinks(results);

    expect(enriched[0].iiifManifest).toBe("N/A");
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("leaves iiifManifest unchanged when resolveCanvas returns null (D-04)", async () => {
    const manifestUrl = "https://iiif.example.com/manifest.json";
    // Manifest with canvases that don't match the target folio
    mockedFetch.mockResolvedValueOnce({
      "@context": "http://iiif.io/api/presentation/2/context.json",
      sequences: [
        {
          canvases: [
            {
              "@id": "https://example.com/canvas/p1",
              label: "1r",
              images: [{ resource: { "@id": "https://example.com/img/1r.jpg" } }],
            },
          ],
        },
      ],
    });

    const results = [
      makeResult({
        folio: "999r",
        iiifManifest: manifestUrl,
      }),
    ];

    const enriched = await enrichWithCanvasLinks(results);

    expect(enriched[0].iiifManifest).toBe(manifestUrl);
  });

  it("does not modify results that already have a #canvas= fragment", async () => {
    const manifestUrl = "https://iiif.example.com/manifest.json#canvas=existing";
    const results = [
      makeResult({
        folio: "145v",
        iiifManifest: manifestUrl,
      }),
    ];

    const enriched = await enrichWithCanvasLinks(results);

    expect(enriched[0].iiifManifest).toBe(manifestUrl);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("handles manifest fetch failure gracefully (keeps original manifest URL)", async () => {
    const manifestUrl = "https://iiif.example.com/manifest.json";
    mockedFetch.mockRejectedValueOnce(new Error("Network error"));

    const results = [
      makeResult({
        folio: "145v",
        iiifManifest: manifestUrl,
      }),
    ];

    const enriched = await enrichWithCanvasLinks(results);

    expect(enriched[0].iiifManifest).toBe(manifestUrl);
  });

  it("rate-limits manifest fetches via provided limiter", async () => {
    const manifestUrl1 = "https://iiif.example.com/manifest1.json";
    const manifestUrl2 = "https://iiif.example.com/manifest2.json";
    mockedFetch.mockResolvedValue(v2Manifest);

    const results = [
      makeResult({ folio: "145v", iiifManifest: manifestUrl1, siglum: "A-1" }),
      makeResult({ folio: "145v", iiifManifest: manifestUrl2, siglum: "B-2" }),
    ];

    const mockLimiter = { id: "test-limiter" };
    const enriched = await enrichWithCanvasLinks(results, mockLimiter as never);

    // Both should have been enriched
    expect(enriched[0].iiifManifest).toContain("#canvas=");
    expect(enriched[1].iiifManifest).toContain("#canvas=");

    // fetchWithRetry should have been called with the limiter
    for (const call of mockedFetch.mock.calls) {
      expect((call[1] as Record<string, unknown>)?.limiter).toBe(mockLimiter);
    }
  });
});
