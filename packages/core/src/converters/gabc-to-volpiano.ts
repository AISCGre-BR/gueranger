/**
 * GABC-to-Volpiano converter for Gregorian chant melody search.
 *
 * Converts GABC notation (used by Gregorio/GregorioTeX) to Volpiano pitch
 * characters for melody-based manuscript search in Cantus Database.
 *
 * Algorithm: GABC staff position -> MIDI number -> Volpiano character
 * Reference: https://github.com/bacor/gabc2volpiano
 *
 * No external dependencies -- pure TypeScript with lookup tables.
 */

/** GABC note letter to staff position value (a=-3 through m=9). */
const POSITIONS: Record<string, number> = {
  a: -3, b: -2, c: -1, d: 0, e: 1, f: 2, g: 3,
  h: 4, i: 5, j: 6, k: 7, l: 8, m: 9,
};

/** Clef type to staff position of the reference note. */
const CLEF_POSITIONS: Record<string, number> = {
  c1: 0, c2: 2, c3: 4, c4: 6, cb1: 0, cb2: 2, cb3: 4, cb4: 6,
  f1: -3, f2: -1, f3: 1, f4: 3,
};

/** Clef type to MIDI number of the C reference pitch. */
const MIDI_C_REF: Record<string, number> = {
  c3: 72, c4: 72, cb3: 72, cb4: 72,
  c1: 60, c2: 60, cb1: 60, cb2: 60,
  f1: 60, f2: 60, f3: 60, f4: 60,
};

/** Natural diatonic scale intervals (C major). */
const NATURAL_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** Flat diatonic scale intervals (B-flat instead of B-natural). */
const FLAT_SCALE = [0, 2, 4, 5, 7, 9, 10];

/** MIDI number to Volpiano pitch character (skips 'i' per Volpiano convention). */
const MIDI_TO_VOLPIANO: Record<number, string> = {
  53: "8", 55: "9", 57: "a", 59: "b", 60: "c", 62: "d", 64: "e",
  65: "f", 67: "g", 69: "h", 71: "j", 72: "k", 74: "l", 76: "m",
  77: "n", 79: "o", 81: "p", 83: "q", 84: "r", 86: "s",
};

/** Regex to match parenthesized groups in GABC. */
const NEUME_GROUP_RE = /\(([^)]+)\)/g;

/** Regex to identify a clef declaration inside a parenthesized group. */
const CLEF_RE = /^[cf]b?[1-4]$/;

/** Regex to extract pitch letters (a-m) from a neume group. */
const NOTE_LETTERS_RE = /[a-m]/g;

/**
 * Convert a GABC staff position to a MIDI number given the current clef.
 *
 * @param pos - Single GABC note letter (a-m)
 * @param clef - Current clef (e.g., "c4", "f3", "cb3")
 * @returns MIDI number, or undefined if outside Volpiano range
 */
function positionToMidi(pos: string, clef: string): number | undefined {
  const posValue = POSITIONS[pos];
  if (posValue === undefined) return undefined;

  const clefPos = CLEF_POSITIONS[clef];
  if (clefPos === undefined) return undefined;

  const cRef = MIDI_C_REF[clef];
  if (cRef === undefined) return undefined;

  const relative = posValue - clefPos;
  const octave = Math.floor(relative / 7);
  const degree = ((relative % 7) + 7) % 7;

  const scale = clef.startsWith("cb") || clef.startsWith("fb")
    ? FLAT_SCALE
    : NATURAL_SCALE;

  const midi = cRef + octave * 12 + scale[degree];
  return MIDI_TO_VOLPIANO[midi] !== undefined ? midi : undefined;
}

/**
 * Detect whether a string is GABC notation.
 *
 * Returns true if the input contains a clef declaration in parentheses
 * (e.g., `(c4)`, `(f3)`) or has 2+ parenthesized groups starting with
 * a note letter (a-m).
 *
 * @param input - String to test
 * @returns true if the input appears to be GABC notation
 */
export function isGabc(input: string): boolean {
  if (!input) return false;

  // Check for clef marker in parentheses
  if (/\([cf]b?[1-4]/.test(input)) return true;

  // Check for 2+ parenthesized note groups
  const noteGroups = input.match(/\([a-m]/g);
  return noteGroups !== null && noteGroups.length >= 2;
}

/**
 * Convert GABC notation to a Volpiano pitch-only string.
 *
 * Parses clef declarations to establish pitch context, then maps each
 * note letter (a-m) in parenthesized groups to the corresponding Volpiano
 * pitch character. Non-pitch characters (liquescents, ornaments, text)
 * are ignored.
 *
 * Output is pitch-only (no hyphens, barlines, or clef markers), matching
 * what `volpianoToNotes()` produces from standard Volpiano strings.
 *
 * @param input - GABC notation string (with or without text)
 * @returns Volpiano pitch-only string (characters from the a-s range)
 */
export function gabcToVolpiano(input: string): string {
  if (!input) return "";

  let currentClef = "c4"; // Default clef (per D-08)
  const volpianoChars: string[] = [];

  // Match all parenthesized groups
  let match: RegExpExecArray | null;
  const re = new RegExp(NEUME_GROUP_RE.source, "g");

  while ((match = re.exec(input)) !== null) {
    const content = match[1];

    // Check if this group is a clef declaration
    if (CLEF_RE.test(content)) {
      currentClef = content;
      continue;
    }

    // Extract note letters and convert to Volpiano
    const notes = content.match(NOTE_LETTERS_RE);
    if (!notes) continue;

    for (const note of notes) {
      const midi = positionToMidi(note, currentClef);
      if (midi !== undefined) {
        const volpChar = MIDI_TO_VOLPIANO[midi];
        if (volpChar) {
          volpianoChars.push(volpChar);
        }
      }
    }
  }

  return volpianoChars.join("");
}
