import type { ManuscriptResult } from "../models/manuscript-result.js";

/**
 * Deduplicate manuscript results by exact siglum+folio key (D-01).
 *
 * For groups with 2+ entries from different sources, merges by
 * preferring non-N/A values for each field (D-02). The sourceDatabase
 * field combines all contributing source names.
 */
export function deduplicateResults(results: ManuscriptResult[]): ManuscriptResult[] {
  if (results.length === 0) return [];

  // Group by exact siglum::folio key (D-01)
  const groups = new Map<string, ManuscriptResult[]>();
  for (const result of results) {
    const key = `${result.siglum}::${result.folio}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(result);
    } else {
      groups.set(key, [result]);
    }
  }

  const deduplicated: ManuscriptResult[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      deduplicated.push(group[0]);
    } else {
      deduplicated.push(mergeResults(group));
    }
  }

  return deduplicated;
}

/**
 * Merge a group of results for the same siglum+folio.
 * For each field, prefer the first non-N/A value (D-02).
 * Combine sourceDatabase from all contributing sources.
 */
function mergeResults(group: ManuscriptResult[]): ManuscriptResult {
  const merged = { ...group[0] };

  const fields: (keyof ManuscriptResult)[] = [
    "siglum", "library", "city", "century", "incipit", "genre",
    "feast", "folio", "cantusId", "iiifManifest", "sourceUrl",
  ];

  for (const entry of group.slice(1)) {
    for (const field of fields) {
      if (merged[field] === "N/A" && entry[field] !== "N/A") {
        (merged as Record<string, string>)[field] = entry[field];
      }
    }
  }

  // Combine sourceDatabase: deduplicate source names
  merged.sourceDatabase = [...new Set(group.map((r) => r.sourceDatabase))].join(", ");

  return merged;
}
