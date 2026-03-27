import * as cheerio from "cheerio";
import type Bottleneck from "bottleneck";
import pRetry, { AbortError } from "p-retry";
import {
  MmmoChantResultSchema,
  type MmmoSearchHit,
  type MmmoChantResult,
} from "./mmmo-types.js";

const MMMO_BASE = "https://musmed.eu";

/**
 * Parses MMMO Drupal search results HTML into structured search hits.
 *
 * Extracts chant IDs, titles, and URLs from the search results page
 * at /search/node/{query}. Drupal 7 search uses <ol class="search-results">
 * with <li> items containing <h3><a href="/chant/{id}"> links.
 */
export function parseSearchHits(html: string): MmmoSearchHit[] {
  const $ = cheerio.load(html);
  const hits: MmmoSearchHit[] = [];

  $(".search-results li h3 a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const match = href.match(/\/chant\/(\d+)/);
    if (match) {
      hits.push({
        chantId: match[1],
        title: $(el).text().trim(),
        url: `${MMMO_BASE}${href}`,
      });
    }
  });

  return hits;
}

/**
 * Parses an MMMO chant detail page into structured metadata.
 *
 * Extracts fields from Drupal 7 node display at /chant/{id}.
 * Fields are structured as .field-name-field-{name} containers
 * with .field-items / .field-item children.
 *
 * Returns null if no recognizable source field is found (indicates
 * the page has no structured chant data).
 */
export function parseChantDetail(html: string): MmmoChantResult | null {
  if (!html) return null;

  const $ = cheerio.load(html);

  // Extract source -- primary indicator that this is a valid chant page
  const sourceEl = $(".field-name-field-source");
  const source =
    sourceEl.find("a").first().text().trim() ||
    sourceEl.find(".field-item").first().text().trim();

  // If no source found, this page has no structured chant data
  if (!source) return null;

  // Extract folio
  const folio =
    $(".field-name-field-folio .field-item").first().text().trim() || "N/A";

  // Extract feast (linked text)
  const feast =
    $(".field-name-field-feast a").first().text().trim() ||
    $(".field-name-field-feast .field-item").first().text().trim() ||
    "N/A";

  // Extract genre (linked text)
  const genre =
    $(".field-name-field-genre a").first().text().trim() ||
    $(".field-name-field-genre .field-item").first().text().trim() ||
    "N/A";

  // Extract Cantus ID from cantusindex.org link
  let cantusId = "N/A";
  $(".field-name-field-cantus-id a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const cidMatch = href.match(/cantusindex\.org\/id\/(\d+)/);
    if (cidMatch) {
      cantusId = cidMatch[1];
    }
  });
  // Fallback: try text content if no link match
  if (cantusId === "N/A") {
    const cidText = $(".field-name-field-cantus-id .field-item")
      .first()
      .text()
      .trim();
    if (cidText && /^\d+$/.test(cidText)) {
      cantusId = cidText;
    }
  }

  // Extract full text
  const fullText =
    $(".field-name-field-full-text .field-item").first().text().trim() || "N/A";

  // Extract image URL
  const imageUrl =
    $(".field-name-field-image a").first().attr("href") || "N/A";

  // Extract office
  const office =
    $(".field-name-field-office .field-item").first().text().trim() || "N/A";

  // We need a chantId but it is not on the detail page itself.
  // It comes from the URL pattern /chant/{id}, so we extract from the
  // canonical link or og:url meta tag if present. Otherwise "N/A".
  let chantId = "N/A";
  const canonical = $('link[rel="canonical"]').attr("href") ?? "";
  const canonicalMatch = canonical.match(/\/chant\/(\d+)/);
  if (canonicalMatch) {
    chantId = canonicalMatch[1];
  } else {
    // Try og:url meta tag
    const ogUrl = $('meta[property="og:url"]').attr("content") ?? "";
    const ogMatch = ogUrl.match(/\/chant\/(\d+)/);
    if (ogMatch) {
      chantId = ogMatch[1];
    }
  }

  const raw = {
    chantId,
    source,
    folio,
    feast,
    genre,
    cantusId,
    fullText,
    imageUrl,
    office,
  };

  const parsed = MmmoChantResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * Searches MMMO via the Drupal core search endpoint.
 *
 * Fetches /search/node/{query} and parses the results page for
 * chant links. Rate-limited via the provided Bottleneck limiter.
 * Returns first page only (~10 results).
 */
export async function searchMmmo(
  query: string,
  limiter: Bottleneck,
): Promise<MmmoSearchHit[]> {
  const url = `${MMMO_BASE}/search/node/${encodeURIComponent(query)}`;

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (response.status === 404) {
        throw new AbortError(`Not found: ${url} (404)`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    const html = await pRetry(() => limiter.schedule(doFetch), {
      retries: 2,
      minTimeout: 1000,
      factor: 2,
    });

    return parseSearchHits(html);
  } catch (error) {
    console.error("[MmmoClient] searchMmmo error:", error);
    return [];
  }
}

/**
 * Fetches and parses a single MMMO chant detail page.
 *
 * Retrieves /chant/{id} and extracts structured metadata.
 * Rate-limited via the provided Bottleneck limiter.
 * Returns null on error or if the page has no structured data.
 */
export async function fetchChantDetail(
  chantId: string,
  limiter: Bottleneck,
): Promise<MmmoChantResult | null> {
  const url = `${MMMO_BASE}/chant/${chantId}`;

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (response.status === 404) {
        throw new AbortError(`Not found: ${url} (404)`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    const html = await pRetry(() => limiter.schedule(doFetch), {
      retries: 2,
      minTimeout: 1000,
      factor: 2,
    });

    // Inject chantId into the parsed result since it comes from the URL, not the page
    const result = parseChantDetail(html);
    if (result && result.chantId === "N/A") {
      result.chantId = chantId;
    }
    return result;
  } catch (error) {
    console.error("[MmmoClient] fetchChantDetail error:", error);
    return null;
  }
}
