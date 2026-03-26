/**
 * Mapping of Cantus Index Network database codes to full names.
 */

export const DB_MAP: Record<string, string> = {
  CD: "Cantus Database",
  FCB: "Fontes Cantus Bohemiae",
  SEMM: "Spanish Early Music Manuscripts",
  CPL: "Cantus Planus in Polonia",
  HYM: "Hymnologica",
};

/**
 * Converts a database code to its full name.
 * Returns "Cantus Index Network" for unknown codes (generic fallback).
 */
export function dbCodeToName(code: string): string {
  return DB_MAP[code] ?? "Cantus Index Network";
}
