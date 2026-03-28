import type { SourceAdapter } from "../adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { createRateLimiter } from "../../utils/http-client.js";
import { searchCompositions, getSourceDetail } from "./diamm-client.js";
import { mapDiammToResult } from "./diamm-mapper.js";
import type { DiammAuth } from "./diamm-client.js";

const MAX_COMPOSITIONS = 20;
const MAX_SOURCES = 20;

/**
 * Custom error thrown when DIAMM credentials are not configured.
 * Multi-search orchestration catches this to emit the D-04 warning
 * while allowing other sources to return results.
 */
export class DiammCredentialsMissingError extends Error {
  constructor() {
    super("DIAMM results unavailable \u2014 credentials not configured");
    this.name = "DiammCredentialsMissingError";
  }
}

/**
 * DiammAdapter searches the DIAMM database for manuscript attestations.
 *
 * Uses a two-phase approach:
 * 1. Search compositions by incipit text
 * 2. Fetch source details for unique source PKs found in composition results
 *
 * Requires DIAMM_USERNAME and DIAMM_PASSWORD env vars (per D-03).
 * Throws DiammCredentialsMissingError when not configured (per D-04).
 */
export class DiammAdapter implements SourceAdapter {
  readonly name = "DIAMM";

  private limiter = createRateLimiter({ maxConcurrent: 2, minTime: 500 });

  async search(query: SearchQuery): Promise<ManuscriptResult[]> {
    // D-04: Check credentials BEFORE try/catch so error propagates
    const username = process.env.DIAMM_USERNAME;
    const password = process.env.DIAMM_PASSWORD;

    if (!username || !password) {
      throw new DiammCredentialsMissingError();
    }

    const auth: DiammAuth = { username, password };

    try {
      // Phase 1: Search compositions
      const searchResponse = await searchCompositions(
        query.rawQuery,
        this.limiter,
        auth,
      );

      if (searchResponse.results.length === 0) {
        return [];
      }

      // Cap compositions processed
      const compositions = searchResponse.results.slice(0, MAX_COMPOSITIONS);

      // Collect all source references with their composition context
      const sourceRefs: Array<{
        pk: string;
        composition: { heading: string; title: string };
        folio_start?: string;
        folio_end?: string;
      }> = [];

      for (const comp of compositions) {
        for (const srcRef of comp.sources) {
          // Extract PK from URL (e.g., "/sources/4871/?format=json" -> "4871")
          const pkMatch = srcRef.url.match(/\/sources\/(\d+)\//);
          if (pkMatch) {
            sourceRefs.push({
              pk: pkMatch[1],
              composition: { heading: comp.heading, title: comp.title },
              folio_start: srcRef.folio_start,
              folio_end: srcRef.folio_end,
            });
          }
        }
      }

      // Phase 2: Fetch unique source details
      const uniquePks = [...new Set(sourceRefs.map((ref) => ref.pk))].slice(
        0,
        MAX_SOURCES,
      );

      const sourceDetails = new Map<
        string,
        Awaited<ReturnType<typeof getSourceDetail>>
      >();
      const detailPromises = uniquePks.map(async (pk) => {
        const detail = await getSourceDetail(pk, this.limiter, auth);
        if (detail) {
          sourceDetails.set(pk, detail);
        }
      });
      await Promise.all(detailPromises);

      // Map each source reference to a ManuscriptResult
      const results: ManuscriptResult[] = [];
      for (const ref of sourceRefs) {
        const detail = sourceDetails.get(ref.pk);
        if (detail) {
          results.push(
            mapDiammToResult(detail, ref.composition, {
              folio_start: ref.folio_start,
              folio_end: ref.folio_end,
            }),
          );
        }
      }

      return results;
    } catch (error) {
      console.error("[DiammAdapter] search error:", error);
      return [];
    }
  }
}
