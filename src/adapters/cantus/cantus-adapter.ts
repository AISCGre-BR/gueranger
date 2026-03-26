import type { SourceAdapter } from "../adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { searchByText, getChantsByCid } from "./cantus-index-client.js";
import { searchByMelody } from "./cantus-db-client.js";
import {
  mapCantusIndexChantToResult,
  mapCantusDbMelodyToResult,
} from "./cantus-mapper.js";
import { genreNameToCode, genreCodeToName } from "./genre-codes.js";
import { parseCentury } from "../../utils/century-parser.js";

const MAX_RESULTS = 100;
const MAX_CID_FANOUT = 20;

/**
 * CantusAdapter queries the Cantus Index network (Cantus Index + CantusDB)
 * for Gregorian chant manuscript attestations.
 *
 * Text search: two-phase (text -> CIDs -> manuscripts per CID).
 * Melody search: single-phase via CantusDB melody search API.
 *
 * Filters (genre, feast, century) are applied client-side with AND logic.
 * If AND-filtered results are empty, filters are relaxed one by one
 * (century first, then feast, then genre) and the relaxation is reported.
 */
export class CantusAdapter implements SourceAdapter {
  readonly name = "Cantus Index Network";

  /** Set after search() if filters were relaxed to produce results. */
  public lastRelaxationMessage: string | null = null;

  async search(query: SearchQuery): Promise<ManuscriptResult[]> {
    this.lastRelaxationMessage = null;

    if (query.melody) {
      return this.melodySearch(query);
    }

    return this.textSearch(query);
  }

  private async melodySearch(query: SearchQuery): Promise<ManuscriptResult[]> {
    const response = await searchByMelody(query.melody!, {
      genre: query.genre,
      feast: query.feast,
    });

    let results = response.results.map((item) =>
      mapCantusDbMelodyToResult(item, item.cantus_id),
    );

    // Century filter is applied client-side (CantusDB melody search doesn't support it)
    if (query.century) {
      const targetCentury = parseCentury(query.century);
      if (targetCentury !== null) {
        results = results.filter((r) => {
          const resultCentury = parseCentury(r.century);
          return resultCentury !== null && resultCentury === targetCentury;
        });
      }
    }

    return results.slice(0, MAX_RESULTS);
  }

  private async textSearch(query: SearchQuery): Promise<ManuscriptResult[]> {
    const textItems = await searchByText(query.rawQuery);
    if (textItems.length === 0) return [];

    // Fan-out: fetch chant attestations for each CID (capped at 20)
    const cidsToFetch = textItems.slice(0, MAX_CID_FANOUT);
    const cidResponses = await Promise.all(
      cidsToFetch.map((item) => getChantsByCid(item.cid).then((resp) => ({ cid: item.cid, resp, item }))),
    );

    // Flatten all chants into ManuscriptResult[]
    const allResults: ManuscriptResult[] = [];
    for (const { cid, resp, item } of cidResponses) {
      const info = (resp.info ?? {}) as Record<string, string | undefined>;
      const chants = resp.chants ?? {};
      for (const key of Object.keys(chants)) {
        allResults.push(
          mapCantusIndexChantToResult(
            chants[key],
            cid,
            info.feast,
            info.genre,
            info.fulltext ?? item.fulltext,
          ),
        );
      }
    }

    // Apply filters
    const hasFilters = !!(query.genre || query.feast || query.century);
    const filtered = this.filterResults(allResults, query);

    if (filtered.length === 0 && hasFilters) {
      return this.relaxFilters(allResults, query);
    }

    return filtered.slice(0, MAX_RESULTS);
  }

  private filterResults(
    results: ManuscriptResult[],
    query: SearchQuery,
  ): ManuscriptResult[] {
    let filtered = results;

    if (query.genre) {
      const genreCode = genreNameToCode(query.genre);
      const genreName = genreCode ? genreCodeToName(genreCode) : undefined;
      filtered = filtered.filter((r) => {
        const rLower = r.genre.toLowerCase();
        return (
          rLower === query.genre!.toLowerCase() ||
          (genreName && rLower === genreName.toLowerCase()) ||
          (genreCode && r.genre === genreCode)
        );
      });
    }

    if (query.feast) {
      const feastLower = query.feast.toLowerCase();
      filtered = filtered.filter(
        (r) => r.feast.toLowerCase().includes(feastLower),
      );
    }

    if (query.century) {
      const targetCentury = parseCentury(query.century);
      if (targetCentury !== null) {
        filtered = filtered.filter((r) => {
          const resultCentury = parseCentury(r.century);
          return resultCentury !== null && resultCentury === targetCentury;
        });
      }
    }

    return filtered;
  }

  /**
   * Relaxes filters one by one (century -> feast -> genre) until results are found.
   * Sets lastRelaxationMessage to describe what was relaxed.
   */
  private relaxFilters(
    allResults: ManuscriptResult[],
    query: SearchQuery,
  ): ManuscriptResult[] {
    // Try without century
    if (query.century) {
      const relaxed = this.filterResults(allResults, { ...query, century: undefined });
      if (relaxed.length > 0) {
        this.lastRelaxationMessage = "Relaxed century filter -- no results matched the requested century.";
        return relaxed.slice(0, MAX_RESULTS);
      }
    }

    // Try without feast
    if (query.feast) {
      const relaxed = this.filterResults(allResults, { ...query, century: undefined, feast: undefined });
      if (relaxed.length > 0) {
        this.lastRelaxationMessage = "Relaxed century and feast filters -- no results matched the requested century and feast.";
        return relaxed.slice(0, MAX_RESULTS);
      }
    }

    // Try without genre
    if (query.genre) {
      const relaxed = this.filterResults(allResults, { ...query, century: undefined, feast: undefined, genre: undefined });
      if (relaxed.length > 0) {
        this.lastRelaxationMessage = "Relaxed all filters -- no results matched the requested filters.";
        return relaxed.slice(0, MAX_RESULTS);
      }
    }

    return [];
  }
}
