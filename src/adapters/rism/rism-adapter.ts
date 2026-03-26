import type { SourceAdapter } from "../adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { createRateLimiter } from "../../utils/http-client.js";
import { searchSources } from "./rism-client.js";
import { mapRismToResult } from "./rism-mapper.js";

/**
 * RismAdapter searches RISM Online for manuscript sources.
 *
 * Uses the RISM Search API with JSON-LD content negotiation,
 * manuscript type filter, and 20 results per page.
 * No authentication required (public API).
 */
export class RismAdapter implements SourceAdapter {
  readonly name = "RISM Online";

  private limiter = createRateLimiter({ maxConcurrent: 2, minTime: 500 });

  async search(query: SearchQuery): Promise<ManuscriptResult[]> {
    try {
      const response = await searchSources(query.rawQuery, this.limiter);

      if (!response.items || response.items.length === 0) {
        return [];
      }

      return response.items.map(mapRismToResult);
    } catch (error) {
      console.error("[RismAdapter] search error:", error);
      return [];
    }
  }
}
