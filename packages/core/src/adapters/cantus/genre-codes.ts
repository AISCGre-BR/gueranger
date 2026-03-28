/**
 * Bidirectional mapping between Cantus genre single-letter codes and full names.
 */

export const GENRE_MAP: Record<string, string> = {
  A: "Antiphon",
  R: "Responsory",
  H: "Hymn",
  HV: "Hymn verse",
  W: "Versicle",
  I: "Invitatory",
  In: "Introit",
  Gr: "Gradual",
  Of: "Offertory",
  Co: "Communion",
  Sq: "Sequence",
  Tr: "Tract",
};

/** Reverse map: lowercase full name -> code */
const REVERSE_GENRE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(GENRE_MAP).map(([code, name]) => [name.toLowerCase(), code]),
);

/**
 * Converts a genre code to its full name.
 * Returns the code unchanged if not found in the mapping.
 */
export function genreCodeToName(code: string): string {
  return GENRE_MAP[code] ?? code;
}

/**
 * Converts a genre full name to its code (case-insensitive).
 * Returns undefined if the name is not recognized.
 */
export function genreNameToCode(name: string): string | undefined {
  return REVERSE_GENRE_MAP[name.toLowerCase()];
}
