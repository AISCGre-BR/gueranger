import type { ManuscriptResult } from "../models/manuscript-result.js";
import { resolveCanvas } from "../adapters/biblissima/iiif-resolver.js";
import { fetchWithRetry, createRateLimiter } from "../utils/http-client.js";
import type Bottleneck from "bottleneck";

/**
 * Maximum number of manifest fetches per enrichment pass.
 * Limits latency by capping the number of IIIF manifests downloaded.
 */
const MAX_ENRICHMENT_CANDIDATES = 5;

/**
 * Enriches deduplicated results with IIIF canvas fragment links.
 *
 * After deduplication merges results from multiple sources, some results
 * may have both a folio (from Cantus) and a IIIF manifest URL (from
 * Biblissima/DIAMM). This function fetches those manifests and resolves
 * the specific canvas matching the folio, appending #canvas={canvasId}
 * to the manifest URL (per D-06).
 *
 * When canvas resolution fails (manifest fetch error or no matching
 * canvas), the original manifest URL is kept unchanged (per D-04).
 *
 * Rate-limited to respect academic infrastructure.
 */
export async function enrichWithCanvasLinks(
  results: ManuscriptResult[],
  limiter?: Bottleneck,
): Promise<ManuscriptResult[]> {
  const effectiveLimiter =
    limiter ?? createRateLimiter({ maxConcurrent: 2, minTime: 1000 });

  // Filter candidates: have manifest, have folio, no existing canvas fragment
  const candidates = results.filter(
    (r) =>
      r.iiifManifest !== "N/A" &&
      r.folio !== "N/A" &&
      !r.iiifManifest.includes("#canvas="),
  );

  // Limit to MAX_ENRICHMENT_CANDIDATES to control latency
  const toEnrich = candidates.slice(0, MAX_ENRICHMENT_CANDIDATES);

  // Fetch manifests and resolve canvases in parallel (rate-limited)
  await Promise.allSettled(
    toEnrich.map(async (result) => {
      try {
        const manifestJson = await fetchWithRetry(result.iiifManifest, {
          limiter: effectiveLimiter,
          timeout: 15000,
          retries: 1,
        });

        const canvas = resolveCanvas(manifestJson, result.folio);
        if (canvas) {
          result.iiifManifest = `${result.iiifManifest}#canvas=${canvas.canvasId}`;
        }
      } catch {
        // D-04: keep original manifest URL on failure
      }
    }),
  );

  return results;
}
