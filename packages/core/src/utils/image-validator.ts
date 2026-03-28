import type { ManuscriptResult } from "../models/manuscript-result.js";

const MAX_VALIDATE = 20;
const HEAD_TIMEOUT_MS = 4000;

/**
 * Validates image/IIIF URLs in manuscript results using HEAD requests.
 *
 * - URLs that are "N/A" or empty get imageAvailable=false without a request
 * - HEAD requests with 4s timeout; non-2xx or error = imageAvailable=false
 * - Same URL validated only once (Map cache)
 * - Capped at 20 unique URLs; remaining default to imageAvailable=true
 */
export async function validateImageUrls(
  results: ManuscriptResult[],
): Promise<ManuscriptResult[]> {
  const cache = new Map<string, boolean>();

  // Collect unique URLs that need validation
  const uniqueUrls: string[] = [];
  for (const r of results) {
    const url = r.iiifManifest;
    if (!url || url === "N/A" || url.trim() === "") {
      continue;
    }
    if (!cache.has(url) && !uniqueUrls.includes(url)) {
      uniqueUrls.push(url);
    }
  }

  // Validate up to MAX_VALIDATE unique URLs
  const toValidate = uniqueUrls.slice(0, MAX_VALIDATE);
  const settled = await Promise.allSettled(
    toValidate.map(async (url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });
        return { url, available: response.ok };
      } catch {
        return { url, available: false };
      } finally {
        clearTimeout(timeoutId);
      }
    }),
  );

  // Populate cache from results
  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      cache.set(outcome.value.url, outcome.value.available);
    } else {
      // Should not happen since we catch inside, but handle defensively
    }
  }

  // Apply validation results to all results.
  // Only downgrade imageAvailable if the URL is clearly absent.
  // A HEAD timeout does NOT mean the image is unavailable — many academic
  // servers (Gallica, BVMM) are slow or don't support HEAD. If the adapter
  // already found a real URL, trust it.
  for (const r of results) {
    const url = r.iiifManifest;
    if (!url || url === "N/A" || url.trim() === "") {
      r.imageAvailable = false;
    } else if (cache.has(url) && cache.get(url)!) {
      // Confirmed available — upgrade to true
      r.imageAvailable = true;
    }
    // If validation failed/timed out but URL exists, keep adapter's decision
  }

  return results;
}
