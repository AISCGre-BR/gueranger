/**
 * GABC-to-Volpiano converter for Gregorian chant melody search.
 *
 * Converts GABC notation (used by Gregorio/GregorioTeX) to Volpiano pitch
 * characters for melody-based manuscript search in Cantus Database.
 *
 * Algorithm: GABC position -> MIDI number -> Volpiano character
 * Reference: https://github.com/bacor/gabc2volpiano
 */

// Stub exports -- tests should FAIL
export function isGabc(_input: string): boolean {
  return false;
}

export function gabcToVolpiano(_input: string): string {
  return "";
}
