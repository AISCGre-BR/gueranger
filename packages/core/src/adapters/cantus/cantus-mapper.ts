import type { ManuscriptResult } from "../../models/manuscript-result.js";
import type { CantusIndexChant, CantusDbMelodyItem } from "./cantus-types.js";
import { genreCodeToName } from "./genre-codes.js";
import { dbCodeToName } from "./db-codes.js";
import { hasImageUrl } from "../../utils/image-utils.js";

/**
 * Maps a raw Cantus Index chant object (from /json-cid/ response) to a ManuscriptResult.
 *
 * Info-level fallbacks (infoFeast, infoGenre, infoFulltext) come from the "info" section
 * of the /json-cid/ response and are used when the individual chant entry lacks those fields.
 *
 * Library, city, and IIIF manifest are set to "N/A" -- enrichment deferred to later phases.
 */
export function mapCantusIndexChantToResult(
  chant: CantusIndexChant,
  cantusId: string,
  infoFeast?: string,
  infoGenre?: string,
  infoFulltext?: string,
): ManuscriptResult {
  return {
    siglum: chant.siglum,
    library: "N/A",
    city: "N/A",
    century: chant.century != null ? String(chant.century) : "N/A",
    incipit: chant.incipit || chant.fulltext || infoFulltext || "N/A",
    genre: genreCodeToName(chant.genre || infoGenre || ""),
    feast: chant.feast || infoFeast || "N/A",
    folio: chant.folio || "N/A",
    cantusId: cantusId,
    iiifManifest: "N/A",
    sourceUrl: chant.chantlink || chant.srclink || "N/A",
    sourceDatabase: dbCodeToName(chant.db || ""),
    matchType: "text",
    imageAvailable: false,
  };
}

/**
 * Maps a CantusDB melody search result to a ManuscriptResult.
 *
 * Combines holding_institution__siglum and shelfmark into siglum.
 * sourceDatabase is always "Cantus Database" for CantusDB results.
 */
export function mapCantusDbMelodyToResult(
  item: CantusDbMelodyItem,
  cantusId?: string,
  imageLink?: string,
): ManuscriptResult {
  // Use imageLink from detail endpoint when it's a real value (not empty, not "N/A")
  const iiifManifest =
    imageLink && imageLink !== "N/A" && imageLink.trim() !== ""
      ? imageLink
      : "N/A";

  return {
    siglum:
      [item.source__holding_institution__siglum, item.source__shelfmark]
        .filter(Boolean)
        .join(" ") || "N/A",
    library: "N/A",
    city: "N/A",
    century: "N/A",
    incipit: item.incipit || "N/A",
    genre: item.genre__name ? genreCodeToName(item.genre__name) : "N/A",
    feast: item.feast__name || "N/A",
    folio: item.folio || "N/A",
    cantusId: cantusId || item.cantus_id || "N/A",
    iiifManifest,
    sourceUrl: `https://cantusdatabase.org/id/${item.cantus_id || ""}`,
    sourceDatabase: "Cantus Database",
    matchType: "text",
    imageAvailable: hasImageUrl(iiifManifest),
  };
}
