import Bottleneck from "bottleneck";
import pRetry, { AbortError } from "p-retry";

/**
 * Creates a rate limiter instance for a specific data source.
 * Each source should have its own limiter with appropriate settings.
 */
export function createRateLimiter(options: {
  maxConcurrent: number;
  minTime: number;
}): Bottleneck {
  return new Bottleneck({
    maxConcurrent: options.maxConcurrent,
    minTime: options.minTime,
  });
}

export interface FetchOptions {
  /** Bottleneck limiter instance for rate limiting */
  limiter?: Bottleneck;
  /** Number of retries (default: 3) */
  retries?: number;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
}

/**
 * Fetches a URL with retry logic, rate limiting, and BOM stripping.
 *
 * - Retries on 429, 5xx, and network errors with exponential backoff
 * - Aborts (no retry) on 404
 * - Strips UTF-8 BOM from JSON responses
 * - Optionally rate-limits via a Bottleneck instance
 */
export async function fetchWithRetry(
  url: string,
  options?: FetchOptions,
): Promise<unknown> {
  const { limiter, retries = 3, timeout = 10000 } = options ?? {};

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (response.status === 404) {
        throw new AbortError(`Not found: ${url} (404)`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      const text = await response.text();
      // Strip UTF-8 BOM if present
      const clean = text.replace(/^\uFEFF/, "");
      return JSON.parse(clean);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const wrappedFetch = limiter
    ? () => limiter.schedule(doFetch)
    : doFetch;

  return pRetry(wrappedFetch, {
    retries,
    minTimeout: 1000,
    factor: 2,
  });
}
