/**
 * Checks whether a URL string represents an actual image link.
 *
 * Returns false for undefined, null, empty strings, and the "N/A" sentinel
 * used throughout the codebase as a missing-value placeholder.
 */
export function hasImageUrl(url: string | undefined | null): boolean {
  return !!url && url !== "N/A" && url.trim() !== "";
}
