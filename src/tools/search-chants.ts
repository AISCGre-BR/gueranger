import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { normalizeLatinText } from "../normalizer/latin.js";
import { CantusAdapter } from "../adapters/cantus/cantus-adapter.js";
import { formatResults } from "../utils/format-response.js";
import type { SearchQuery } from "../models/query.js";

/**
 * Testable handler for the search_chants tool.
 * Normalizes Latin text, searches Cantus Index network, and returns formatted results.
 */
export async function handleSearchChants(params: {
  query: string;
  genre?: string;
  century?: string;
  feast?: string;
  melody?: string;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const adapter = new CantusAdapter();
  const searchQuery: SearchQuery = {
    query: normalizeLatinText(params.query),
    rawQuery: params.query,
    genre: params.genre,
    century: params.century,
    feast: params.feast,
    melody: params.melody,
  };
  const results = await adapter.search(searchQuery);

  if (results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No manuscripts found for "${params.query}". Try a shorter incipit or different spelling.`,
        },
      ],
    };
  }

  const formatted = formatResults(results, params.query);
  const text = adapter.lastRelaxationMessage
    ? `Note: ${adapter.lastRelaxationMessage}\n\n${formatted}`
    : formatted;

  return {
    content: [{ type: "text", text }],
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
          "Volpiano melodic incipit for melody-based search. Provide the Volpiano string as-is (e.g., '1---h--ij---h--g---k'). When provided, searches CantusDB by melody instead of text.",
        ),
    },
  }, async (params) => {
    return handleSearchChants(params);
  });
}
