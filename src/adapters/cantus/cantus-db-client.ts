import { createRateLimiter, fetchWithRetry } from "../../utils/http-client.js";
import { volpianoToNotes } from "./volpiano.js";
import type { CantusDbMelodyResponse } from "./cantus-types.js";

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
