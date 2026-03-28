import type { ManuscriptResult } from "../../models/manuscript-result.js";
import type { DiammSourceDetail } from "./diamm-types.js";
import { hasImageUrl } from "../../utils/image-utils.js";

/**
 * Maps a DIAMM source detail + composition info to a ManuscriptResult.
 *
 * - siglum: source.display_name, fallback to archive.siglum + shelfmark
 * - library: source.archive.name
 * - city: source.archive.city
 * - century: source.date_statement
 * - incipit: composition heading, fallback to title
 * - genre: first genre from inventory, or "N/A"
 * - feast: always "N/A" (DIAMM does not track feasts)
 * - folio: from sourceRef folio_start/folio_end
 * - cantusId: always "N/A"
 * - iiifManifest: manifest_url, fallback to links[type=1].link
 * - sourceUrl: DIAMM source permalink
 * - sourceDatabase: "DIAMM"
 */
export function mapDiammToResult(
  source: DiammSourceDetail,
  composition: { heading: string; title: string },
  sourceRef: { folio_start?: string; folio_end?: string },
): ManuscriptResult {
  // Siglum: prefer display_name, fallback to archive siglum + shelfmark
  const siglum =
    source.display_name ||
    `${source.archive.siglum} ${source.shelfmark ?? ""}`.trim();

  // IIIF manifest: prefer manifest_url, fallback to links with type 1
  let iiifManifest = "N/A";
  if (source.manifest_url) {
    iiifManifest = source.manifest_url;
  } else if (source.links && source.links.length > 0) {
    const iiifLink = source.links.find((l) => l.type === 1);
    if (iiifLink) {
      iiifManifest = iiifLink.link;
    }
  }

  // Folio: combine start and end
  let folio = "N/A";
  if (sourceRef.folio_start) {
    folio = sourceRef.folio_start;
    if (sourceRef.folio_end && sourceRef.folio_end !== sourceRef.folio_start) {
      folio = `${sourceRef.folio_start}-${sourceRef.folio_end}`;
    }
  }

  // Genre: first genre from inventory, or "N/A"
  const genres = source.inventory?.flatMap((inv) => inv.genres) ?? [];
  const genre = genres.length > 0 ? genres[0] : "N/A";

  // Incipit: heading first, fallback to title
  const incipit = composition.heading || composition.title || "N/A";

  return {
    siglum,
    library: source.archive.name,
    city: source.archive.city,
    century: source.date_statement || "N/A",
    incipit,
    genre,
    feast: "N/A",
    folio,
    cantusId: "N/A",
    iiifManifest,
    sourceUrl: `https://www.diamm.ac.uk/sources/${source.pk}/`,
    sourceDatabase: "DIAMM",
    matchType: "text",
    imageAvailable: hasImageUrl(iiifManifest),
  };
}
