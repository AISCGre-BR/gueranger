import { normalizeLatinText } from "../normalizer/latin.js";
import { isGabc, gabcToVolpiano } from "../converters/gabc-to-volpiano.js";
import { multiSearch, getActiveAdapters } from "../orchestrator/multi-search.js";
import type { SearchQuery } from "../models/query.js";
import type { MultiSearchResult, SourceProgressCallback } from "../orchestrator/multi-search.js";

export interface SearchParams {
  query: string;
  genre?: string;
  century?: string;
  feast?: string;
  melody?: string;
}

export type SearchResponse = MultiSearchResult;

export async function handleSearch(
  params: SearchParams,
  onSourceProgress?: SourceProgressCallback,
): Promise<SearchResponse> {
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
  return multiSearch(adapters, searchQuery, undefined, onSourceProgress);
}
