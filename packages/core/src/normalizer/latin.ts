/**
 * Latin text normalization for Gregorian chant incipit matching.
 *
 * Handles orthographic variants common in medieval Latin manuscripts:
 * - Case insensitivity (LATN-02)
 * - Diacritics stripping (Unicode NFD decomposition)
 * - j/i equivalence (medieval Latin has no j/i distinction)
 * - v/u equivalence (medieval Latin has no u/v distinction)
 * - ae/e diphthong collapse (caelum = celum)
 * - oe/e diphthong collapse (coelum = celum)
 * - ti/ci assibilation before vowels (ratio = racio)
 *
 * Transformation order matters -- applied in this exact sequence.
 */
export function normalizeLatinText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .replace(/j/g, "i")              // j -> i
    .replace(/v/g, "u")              // v -> u
    .replace(/ae/g, "e")             // ae -> e
    .replace(/oe/g, "e")             // oe -> e
    .replace(/ti(?=[aeiouy])/g, "ci") // ti before vowel -> ci
    .replace(/\s+/g, " ")            // Collapse whitespace
    .trim();
}

/**
 * Check if a stored incipit matches a search query using prefix matching.
 * Both strings are normalized before comparison (LATN-03).
 *
 * @param storedIncipit - The full incipit as stored in the database
 * @param searchQuery - The user's search query (may be partial)
 * @returns true if the normalized stored incipit starts with the normalized query
 */
export function matchesIncipit(storedIncipit: string, searchQuery: string): boolean {
  const normalizedStored = normalizeLatinText(storedIncipit);
  const normalizedQuery = normalizeLatinText(searchQuery);
  return normalizedStored.startsWith(normalizedQuery);
}
