import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleSearch, formatResults } from "@gueranger/core";
import type { SearchParams } from "@gueranger/core";

/**
 * Testable handler for the search_chants tool.
 * Delegates search logic to @gueranger/core handleSearch,
 * then wraps the result in MCP content format.
 */
export async function handleSearchChants(params: SearchParams): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { results, warnings } = await handleSearch(params);

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
