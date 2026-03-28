import { createRateLimiter, fetchWithRetry } from "../../utils/http-client.js";
import { volpianoToNotes } from "./volpiano.js";
import type { CantusDbMelodyResponse } from "./cantus-types.js";
import { CantusDbChantDetailSchema, type CantusDbChantDetail } from "./cantus-types.js";

const CANTUS_DB_BASE = "https://cantusdatabase.org";

/** Rate limiter for CantusDB: max 1 concurrent, 1 req/2sec */
const limiter = createRateLimiter({ maxConcurrent: 1, minTime: 2000 });

/**
 * Searches CantusDB by Volpiano melodic incipit.
 * Converts the raw Volpiano to pitch-only notes for the query.
 */
export async function searchByMelody(
  volpiano: string,
  options?: { genre?: string; feast?: string },
): Promise<CantusDbMelodyResponse> {
  try {
    const notes = volpianoToNotes(volpiano);
    let url = `${CANTUS_DB_BASE}/ajax/melody-search/?notes=${encodeURIComponent(notes)}&anywhere=false&transpose=false`;

    if (options?.genre) {
      url += `&genre=${encodeURIComponent(options.genre)}`;
    }
    if (options?.feast) {
      url += `&feast=${encodeURIComponent(options.feast)}`;
    }

    const data = await fetchWithRetry(url, { limiter });
    return data as CantusDbMelodyResponse;
  } catch (error) {
    console.error("[CantusDbClient] searchByMelody error:", error);
    return { results: [], result_count: 0 };
  }
}

/**
 * Fetches chant detail from CantusDB /json-node/{id} endpoint.
 * Returns parsed detail on success, null on any error (best-effort).
 */
export async function fetchChantDetail(
  chantId: string | number,
): Promise<CantusDbChantDetail | null> {
  try {
    const url = `${CANTUS_DB_BASE}/json-node/${chantId}`;
    const data = await fetchWithRetry(url, { limiter, timeout: 5000 });
    const parsed = CantusDbChantDetailSchema.safeParse(data);
    if (parsed.success) {
      return parsed.data;
    }
    console.error("[CantusDbClient] fetchChantDetail parse error:", parsed.error);
    return null;
  } catch (error) {
    console.error("[CantusDbClient] fetchChantDetail error:", error);
    return null;
  }
}
