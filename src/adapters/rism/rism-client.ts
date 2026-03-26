import type Bottleneck from "bottleneck";
import pRetry, { AbortError } from "p-retry";
import {
  RismSearchResponseSchema,
  type RismSearchResponse,
} from "./rism-types.js";

const RISM_BASE = "https://rism.online";

/**
 * Searches RISM Online for manuscript sources matching the query.
 *
 * Uses JSON-LD content negotiation (Accept: application/ld+json).
 * Filters to manuscripts only (fq=source-type:manuscript).
 * Limited to 20 results per page (valid RISM page sizes: 20, 40, 100).
 */
export async function searchSources(
  query: string,
  limiter: Bottleneck,
): Promise<RismSearchResponse> {
  const url = `${RISM_BASE}/search?mode=sources&q=${encodeURIComponent(query)}&fq=source-type:manuscript&rows=20`;

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/ld+json",
        },
      });

      if (response.status === 404) {
        throw new AbortError(`Not found: ${url} (404)`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      const text = await response.text();
      const clean = text.replace(/^\uFEFF/, "");
      return JSON.parse(clean);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    const data = await pRetry(() => limiter.schedule(doFetch), {
      retries: 3,
      minTimeout: 1000,
      factor: 2,
    });

    const parsed = RismSearchResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error("[RismClient] searchSources parse error:", parsed.error);
      return { totalItems: 0, items: [] };
    }

    return parsed.data;
  } catch (error) {
    console.error("[RismClient] searchSources error:", error);
    return { totalItems: 0, items: [] };
  }
}
