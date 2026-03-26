import type Bottleneck from "bottleneck";
import pRetry, { AbortError } from "p-retry";
import {
  DiammSearchResponseSchema,
  DiammSourceDetailSchema,
  type DiammSearchResponse,
  type DiammSourceDetail,
} from "./diamm-types.js";

const DIAMM_BASE = "https://www.diamm.ac.uk";

export interface DiammAuth {
  username: string;
  password: string;
}

/**
 * Fetches a DIAMM URL with rate limiting, retry, and optional Basic Auth.
 * Since fetchWithRetry does not support custom headers, we use
 * limiter.schedule() with native fetch + p-retry directly.
 */
async function fetchDiamm(
  url: string,
  limiter: Bottleneck,
  auth?: DiammAuth,
): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (auth) {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString(
      "base64",
    );
    headers["Authorization"] = `Basic ${encoded}`;
  }

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers,
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

  return pRetry(() => limiter.schedule(doFetch), {
    retries: 3,
    minTimeout: 1000,
    factor: 2,
  });
}

/**
 * Searches DIAMM compositions by text query.
 */
export async function searchCompositions(
  query: string,
  limiter: Bottleneck,
  auth?: DiammAuth,
): Promise<DiammSearchResponse> {
  const url = `${DIAMM_BASE}/search/?q=${encodeURIComponent(query)}&type=composition&format=json`;
  const data = await fetchDiamm(url, limiter, auth);

  const parsed = DiammSearchResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[DiammClient] searchCompositions parse error:", parsed.error);
    return { count: 0, results: [] };
  }

  return parsed.data;
}

/**
 * Fetches detailed source information from DIAMM.
 */
export async function getSourceDetail(
  pk: string,
  limiter: Bottleneck,
  auth?: DiammAuth,
): Promise<DiammSourceDetail | null> {
  const url = `${DIAMM_BASE}/sources/${pk}/?format=json`;
  const data = await fetchDiamm(url, limiter, auth);

  const parsed = DiammSourceDetailSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[DiammClient] getSourceDetail parse error:", parsed.error);
    return null;
  }

  return parsed.data;
}
