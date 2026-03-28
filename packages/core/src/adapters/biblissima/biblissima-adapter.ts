import type { SourceAdapter } from "../adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { createRateLimiter } from "../../utils/http-client.js";
import { searchBiblissima } from "./biblissima-client.js";
import { mapBiblissimaToResult } from "./biblissima-mapper.js";

/**
 * BiblissimaAdapter searches Biblissima's IIIF Collections for manuscripts.
 *
 * Scrapes HTML search results from iiif.biblissima.fr/collections since
 * no public JSON API is available. Returns ManuscriptResult[] with IIIF
 * manifest URLs from European libraries (Gallica, BAV, BSB, e-codices, etc.).
 *
 * Canvas/folio resolution is not done here -- it is triggered during
 * dedup merge when a folio is known from another source (e.g., Cantus).
 *
 * Rate limiting is conservative (1 req/2s for scraping) since Biblissima
 * is academic infrastructure.
 */
export class BiblissimaAdapter implements SourceAdapter {
  readonly name = "Biblissima";

  private scrapeLimiter = createRateLimiter({
    maxConcurrent: 1,
    minTime: 2000,
  });

  async search(query: SearchQuery): Promise<ManuscriptResult[]> {
    try {
      const results = await searchBiblissima(
        query.rawQuery,
        this.scrapeLimiter,
      );

      if (results.length === 0) {
        return [];
      }

      return results.map(mapBiblissimaToResult);
    } catch (error) {
      console.error("[BiblissimaAdapter] search error:", error);
      return [];
    }
  }
}
