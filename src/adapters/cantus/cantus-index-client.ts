import { createRateLimiter, fetchWithRetry } from "../../utils/http-client.js";
import type { CantusIndexTextItem, CantusIndexCidResponse } from "./cantus-types.js";

const CANTUS_INDEX_BASE = "https://cantusindex.org";

/** Rate limiter for Cantus Index: max 2 concurrent, 1 req/sec */
const limiter = createRateLimiter({ maxConcurrent: 2, minTime: 1000 });

/**
 * Searches Cantus Index by text incipit.
 * Returns up to 20 items (fan-out cap) to avoid excessive CID lookups.
 */
export async function searchByText(searchString: string): Promise<CantusIndexTextItem[]> {
  try {
    const url = `${CANTUS_INDEX_BASE}/json-text/${encodeURIComponent(searchString)}`;
    const data = await fetchWithRetry(url, { limiter });
    if (!Array.isArray(data)) return [];
    return (data as CantusIndexTextItem[]).slice(0, 20);
  } catch (error) {
    console.error("[CantusIndexClient] searchByText error:", error);
    return [];
  }
}

/**
 * Fetches all chant attestations for a given Cantus ID.
 */
export async function getChantsByCid(cantusId: string): Promise<CantusIndexCidResponse> {
  try {
    const url = `${CANTUS_INDEX_BASE}/json-cid/${encodeURIComponent(cantusId)}`;
    const data = await fetchWithRetry(url, { limiter });
    return data as CantusIndexCidResponse;
  } catch (error) {
    console.error("[CantusIndexClient] getChantsByCid error:", error);
    return { info: {}, databases: {}, chants: {} };
  }
}
