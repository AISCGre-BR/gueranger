/**
 * Converts a Volpiano notation string to pitch-only letters.
 *
 * Volpiano uses lowercase letters a-s for pitches, with numbers (1, 3, 4)
 * for clefs and barlines, and hyphens for spacing. This function strips
 * everything except the pitch letters.
 *
 * @param volpiano - Raw Volpiano notation string
 * @returns String containing only pitch letters (a-s)
 */
export function volpianoToNotes(volpiano: string): string {
  return volpiano.replace(/[^a-s]/g, "");
}
