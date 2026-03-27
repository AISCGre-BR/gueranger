import type { SourceAdapter } from "../adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { createRateLimiter } from "../../utils/http-client.js";
import { searchMmmo, fetchChantDetail } from "./mmmo-client.js";
import { mapMmmoToResult } from "./mmmo-mapper.js";
import type { MmmoChantResult } from "./mmmo-types.js";

/**
 * MmmoAdapter searches MMMO (Medieval Music Manuscripts Online) for chants.
 *
 * Uses a two-step HTML scraping approach:
 * 1. Search via /search/node/{query} to discover chant IDs
 * 2. Fetch /chant/{id} for each hit to extract full metadata
 *
 * Rate limiting is conservative (1 req/3s, maxConcurrent 1) since
 * MMMO is small-scale academic infrastructure.
 *
 * Gracefully degrades to [] on any error (D-02).
 */
export class MmmoAdapter implements SourceAdapter {
  readonly name = "MMMO";

  private limiter = createRateLimiter({ maxConcurrent: 1, minTime: 3000 });

  async search(query: SearchQuery): Promise<ManuscriptResult[]> {
    try {
      const hits = await searchMmmo(query.rawQuery, this.limiter);
      if (hits.length === 0) return [];

      const details = await Promise.all(
        hits.map((hit) => fetchChantDetail(hit.chantId, this.limiter)),
      );

      return details
        .filter((d): d is MmmoChantResult => d !== null)
        .map(mapMmmoToResult);
    } catch (error) {
      console.error("[MmmoAdapter] search error:", error);
      return [];
    }
  }
}
