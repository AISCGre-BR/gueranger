import * as cheerio from "cheerio";
import type Bottleneck from "bottleneck";
import pRetry, { AbortError } from "p-retry";
import {
  BiblissimaSearchResultSchema,
  type BiblissimaSearchResult,
} from "./biblissima-types.js";

const BIBLISSIMA_SEARCH_URL =
  "https://iiif.biblissima.fr/collections/search";

/**
 * Parses Biblissima search result HTML into structured data.
 *
 * Extracts manuscript metadata from `.result-item` containers
 * with `h5` title, `dl/dt/dd` metadata, and `a[href]` links.
 */
export function parseSearchResults(html: string): BiblissimaSearchResult[] {
  const $ = cheerio.load(html);
  const results: BiblissimaSearchResult[] = [];

  $(".result-item").each((_, el) => {
    const $el = $(el);
    const title = $el.find("h5").first().text().trim();

    // Extract original IIIF manifest URL (external link containing "manifest"
    // but NOT starting with "manifest/" which is Biblissima's internal link)
    let iiifManifestUrl = "N/A";
    $el.find("a").each((_, link) => {
      const href = $(link).attr("href") ?? "";
      if (href.includes("manifest") && !href.startsWith("manifest/")) {
        iiifManifestUrl = href;
      }
    });

    // Extract Biblissima detail page URL
    const biblissimaHref =
      $el.find('a[href^="manifest/"]').attr("href") ?? "";
    const biblissimaUrl = biblissimaHref
      ? `https://iiif.biblissima.fr/collections/${biblissimaHref}`
      : "N/A";

    // Extract metadata from <dl> key-value pairs
    const metadata: Record<string, string> = {};
    $el.find("dl dt").each((_, dt) => {
      const key = $(dt).text().trim();
      const value = $(dt).next("dd").text().trim();
      metadata[key] = value;
    });

    const item: BiblissimaSearchResult = {
      title,
      iiifManifestUrl,
      biblissimaUrl,
      collection: metadata["Collection"] ?? "N/A",
      library: metadata["Library"] ?? "N/A",
      date: metadata["Date"] ?? "N/A",
      language: metadata["Language"] ?? "N/A",
    };

    // Validate with Zod before adding
    const parsed = BiblissimaSearchResultSchema.safeParse(item);
    if (parsed.success) {
      results.push(parsed.data);
    }
  });

  return results;
}

/**
 * Searches Biblissima IIIF Collections by scraping the HTML search page.
 *
 * Uses cheerio to parse results since Biblissima has no public JSON API.
 * Rate-limited via the provided Bottleneck limiter.
 * Returns first page only (up to 20 results).
 */
export async function searchBiblissima(
  query: string,
  limiter: Bottleneck,
): Promise<BiblissimaSearchResult[]> {
  const url = `${BIBLISSIMA_SEARCH_URL}?q=${encodeURIComponent(query)}`;

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
      retries: 3,
      minTimeout: 1000,
      factor: 2,
    });

    return parseSearchResults(html);
  } catch (error) {
    console.error("[BiblissimaClient] searchBiblissima error:", error);
    return [];
  }
}
