import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { normalizeLatinText } from "../normalizer/latin.js";
import { isGabc, gabcToVolpiano } from "../converters/gabc-to-volpiano.js";
import { multiSearch, getActiveAdapters } from "../orchestrator/multi-search.js";
import { formatResults } from "../utils/format-response.js";
import type { SearchQuery } from "../models/query.js";

/**
 * Testable handler for the search_chants tool.
 * Normalizes Latin text, searches all configured sources in parallel,
 * deduplicates results, and returns formatted response with source warnings.
 */
export async function handleSearchChants(params: {
  query: string;
  genre?: string;
  century?: string;
  feast?: string;
  melody?: string;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const adapters = getActiveAdapters();
  const resolvedMelody = params.melody
    ? isGabc(params.melody)
      ? gabcToVolpiano(params.melody)
      : params.melody
    : undefined;
  const searchQuery: SearchQuery = {
    query: normalizeLatinText(params.query),
    rawQuery: params.query,
    genre: params.genre,
    century: params.century,
    feast: params.feast,
    melody: resolvedMelody,
  };
  const { results, warnings } = await multiSearch(adapters, searchQuery);

  if (results.length === 0) {
    let text = `No manuscripts found for "${params.query}". Try a shorter incipit or different spelling.`;
    if (warnings.length > 0) {
      text += "\n\nSource warnings:\n" + warnings.map((w) => `- ${w}`).join("\n");
    }
    return {
      content: [
        { type: "text", text },
        { type: "text", text: "---JSON---\n[]" },
      ],
    };
  }

  let text = formatResults(results, params.query);
  if (warnings.length > 0) {
    text += "\n\nSource warnings:\n" + warnings.map((w) => `- ${w}`).join("\n");
  }

  return {
    content: [
      { type: "text", text },
      { type: "text", text: "---JSON---\n" + JSON.stringify(results) },
    ],
  };
}

/**
 * Register the search_chants tool with an MCP server.
 */
export function registerSearchChantsTool(server: McpServer): void {
  server.registerTool("search_chants", {
    description:
      "Search for Gregorian chant manuscripts by incipit (the opening words of the chant). Returns a list of manuscripts from academic databases, each with metadata about the source, holding library, date, and available digitization links. Supports partial incipits and handles Latin spelling variants automatically.",
    inputSchema: {
      query: z
        .string()
        .min(2)
        .describe(
          "Latin incipit to search for. Examples: 'Pange lingua', 'Ave Maria', 'Veni creator spiritus'",
        ),
      genre: z
        .string()
        .optional()
        .describe(
          "Liturgical genre filter. Options: antiphon, responsory, hymn, introit, gradual, offertory, communion, sequence, tract",
        ),
      century: z
        .string()
        .optional()
        .describe(
          "Century or date range filter. Examples: '12th', '13th century', '1100-1200'",
        ),
      feast: z
        .string()
        .optional()
        .describe(
          "Liturgical feast filter. Examples: 'Corpus Christi', 'Nativity', 'Easter', 'Pentecost'",
        ),
      melody: z
        .string()
        .optional()
        .describe(
          "Melody incipit for melody-based search. Accepts Volpiano notation (e.g., '1---h--ij---h--g---k') or GABC notation (e.g., '(c4) Pan(f)ge(gfg) lin(hjh)gua(g)'). GABC input is auto-detected and converted to Volpiano. When provided, searches CantusDB by melody instead of text.",
        ),
    },
  }, async (params) => {
    return handleSearchChants(params);
  });
}
