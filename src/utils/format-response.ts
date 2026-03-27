import type { ManuscriptResult } from "../models/manuscript-result.js";

/**
 * Format manuscript search results for MCP text response.
 *
 * Groups results by manuscript siglum (D-03), shows all fields
 * including N/A values (D-02), uses English labels (D-04).
 */
export function formatResults(results: ManuscriptResult[], query: string): string {
  if (results.length === 0) {
    return `No manuscripts found for "${query}".`;
  }

  // Group results by siglum (D-03)
  const grouped = new Map<string, ManuscriptResult[]>();
  for (const result of results) {
    const existing = grouped.get(result.siglum);
    if (existing) {
      existing.push(result);
    } else {
      grouped.set(result.siglum, [result]);
    }
  }

  // Count unique sources (split merged sourceDatabase fields like "Cantus, DIAMM")
  const sources = new Set<string>();
  for (const result of results) {
    for (const src of result.sourceDatabase.split(", ")) {
      sources.add(src);
    }
  }

  const lines: string[] = [];
  lines.push(
    `Found ${results.length} result(s) for "${query}" across ${grouped.size} manuscript(s) from ${sources.size} source(s):`,
  );

  for (const [siglum, entries] of grouped) {
    const first = entries[0];
    lines.push("");
    lines.push(`## ${siglum}`);
    lines.push(`- Library: ${first.library}`);
    lines.push(`- City: ${first.city}`);
    lines.push(`- Century: ${first.century === "N/A" ? "" : first.century}`);
    if (first.imageAvailable === false && first.iiifManifest !== "N/A") {
      lines.push(`- IIIF Manifest: ${first.iiifManifest} [unavailable]`);
    } else {
      lines.push(`- IIIF Manifest: ${first.iiifManifest}`);
    }
    lines.push(`- Source: ${first.sourceDatabase}`);
    lines.push(`- Source URL: ${first.sourceUrl}`);

    for (const entry of entries) {
      lines.push(`  - Incipit: ${entry.incipit}`);
      const matchLabel = entry.matchType === "both" ? "text+melody" : (entry.matchType ?? "text");
      lines.push(
        `    Genre: ${entry.genre} | Feast: ${entry.feast} | Folio: ${entry.folio} | Cantus ID: ${entry.cantusId} | Match: ${matchLabel}`,
      );
    }
  }

  return lines.join("\n");
}
