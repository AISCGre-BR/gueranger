import type { ManuscriptResult } from "../../models/manuscript-result.js";
import type { BiblissimaSearchResult } from "./biblissima-types.js";

/**
 * Parses a Biblissima title into city and library components.
 *
 * Biblissima titles follow the format: "City. Library, Shelfmark"
 * - City: text before first ". "
 * - Library: text after first ". " up to comma (or end)
 * - Siglum: full title string
 */
function parseBiblissimaTitle(title: string): {
  city: string;
  library: string;
} {
  const dotIndex = title.indexOf(". ");
  if (dotIndex === -1) {
    return { city: "N/A", library: title || "N/A" };
  }

  const city = title.substring(0, dotIndex).trim();
  const remainder = title.substring(dotIndex + 2).trim();

  // Library is the part before the comma, or the whole remainder
  const commaIndex = remainder.indexOf(",");
  const library =
    commaIndex !== -1
      ? remainder.substring(0, commaIndex).trim()
      : remainder;

  return {
    city: city || "N/A",
    library: library || "N/A",
  };
}

/**
 * Maps a scraped Biblissima search result to a ManuscriptResult.
 *
 * Most liturgical fields (genre, feast, folio, cantusId, incipit) are
 * unavailable from Biblissima and default to "N/A". These may be filled
 * by deduplication merging with Cantus or other sources.
 */
export function mapBiblissimaToResult(
  item: BiblissimaSearchResult,
): ManuscriptResult {
  const { city, library } = parseBiblissimaTitle(item.title);

  return {
    siglum: item.title || "N/A",
    library,
    city,
    century: item.date || "N/A",
    incipit: "N/A",
    genre: "N/A",
    feast: "N/A",
    folio: "N/A",
    cantusId: "N/A",
    iiifManifest: item.iiifManifestUrl || "N/A",
    sourceUrl: item.biblissimaUrl || "N/A",
    sourceDatabase: "Biblissima",
  };
}
