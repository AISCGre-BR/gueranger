import type { ManuscriptResult } from "../../models/manuscript-result.js";
import type { MmmoChantResult } from "./mmmo-types.js";
import { hasImageUrl } from "../../utils/image-utils.js";

/**
 * Maps an MMMO chant detail result to a ManuscriptResult.
 *
 * Library, city, and century are set to "N/A" because these fields
 * are not available on the chant detail page (they live on the source
 * page). Dedup merge with Cantus/RISM fills these gaps for
 * overlapping manuscripts.
 */
export function mapMmmoToResult(item: MmmoChantResult, century?: string): ManuscriptResult {
  return {
    siglum: item.source || "N/A",
    library: "N/A",
    city: "N/A",
    century: century || "N/A",
    incipit: item.fullText || "N/A",
    genre: item.genre || "N/A",
    feast: item.feast || "N/A",
    folio: item.folio || "N/A",
    cantusId: item.cantusId || "N/A",
    iiifManifest: item.imageUrl || "N/A",
    sourceUrl: `https://musmed.eu/chant/${item.chantId}`,
    sourceDatabase: "MMMO",
    matchType: "text",
    imageAvailable: hasImageUrl(item.imageUrl),
  };
}
