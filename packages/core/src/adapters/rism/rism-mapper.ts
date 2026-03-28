import type { ManuscriptResult } from "../../models/manuscript-result.js";
import type { RismSearchItem } from "./rism-types.js";

/**
 * Parses a RISM English label into incipit and siglum.
 *
 * RISM labels follow the format: "Title; Source type; SIGLUM SHELFMARK"
 * - 3+ segments: first is incipit, last is siglum
 * - 2 segments: first is incipit, last is siglum
 * - 1 segment: used as both incipit and siglum
 */
export function parseRismLabel(label: string): {
  incipit: string;
  siglum: string;
} {
  const segments = label.split(";").map((s) => s.trim());

  if (segments.length >= 2) {
    return {
      incipit: segments[0],
      siglum: segments[segments.length - 1],
    };
  }

  // Single segment: use as both
  return {
    incipit: segments[0],
    siglum: segments[0],
  };
}

/**
 * Maps a RISM search item to a ManuscriptResult.
 *
 * Uses label parsing for siglum and incipit extraction.
 * Most fields default to "N/A" since the search endpoint
 * provides limited metadata (detail fetch deferred).
 */
export function mapRismToResult(item: RismSearchItem): ManuscriptResult {
  const labelText = item.label.en[0] ?? "";

  let incipit = "N/A";
  let siglum = "N/A";

  if (labelText) {
    const parsed = parseRismLabel(labelText);
    incipit = parsed.incipit;
    siglum = parsed.siglum;
  }

  return {
    siglum,
    library: "N/A",
    city: "N/A",
    century: "N/A",
    incipit,
    genre: "N/A",
    feast: "N/A",
    folio: "N/A",
    cantusId: "N/A",
    iiifManifest: "N/A",
    sourceUrl: item.id,
    sourceDatabase: "RISM Online",
    matchType: "text",
    imageAvailable: false,
  };
}
