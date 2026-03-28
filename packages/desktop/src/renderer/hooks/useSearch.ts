import { useState, useCallback } from "react";
import type { ManuscriptRow } from "../lib/columns";

export interface SearchState {
  results: ManuscriptRow[];
  warnings: string[];
  sourcesQueried: string[];
  sourcesSucceeded: string[];
  sourcesFailed: string[];
  loading: boolean;
  error: string | null;
  searchedQuery: string;
  hasSearched: boolean;
}

const INITIAL_STATE: SearchState = {
  results: [],
  warnings: [],
  sourcesQueried: [],
  sourcesSucceeded: [],
  sourcesFailed: [],
  loading: false,
  error: null,
  searchedQuery: "",
  hasSearched: false,
};

export interface SearchParams {
  query: string;
  genre: string;
  century: string;
  feast: string;
}

/** Strips parenthesized groups from GABC to extract plain text. Exported for testing. */
export function extractTextFromGabc(gabc: string): string {
  return gabc
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useSearch() {
  const [state, setState] = useState<SearchState>(INITIAL_STATE);

  const search = useCallback(async (params: SearchParams) => {
    const { query, genre, century, feast } = params;
    if (!query.trim()) return;

    setState((prev) => ({ ...prev, loading: true, error: null, searchedQuery: query }));

    try {
      // Smart GABC detection (D-02): if input contains GABC, extract text + melody
      let searchQuery = query;
      let melody: string | undefined;

      // Import isGabc from core (pure TS, no Node deps -- bundled by Vite)
      const { isGabc } = await import("@gueranger/core");
      if (isGabc(query)) {
        searchQuery = extractTextFromGabc(query);
        melody = query; // Pass raw GABC -- core's handleSearch converts via gabcToVolpiano
      }

      const response = await window.gueranger.search({
        query: searchQuery,
        genre: genre || undefined,
        century: century || undefined,
        feast: feast || undefined,
        melody,
      });

      setState({
        results: response.results as ManuscriptRow[],
        warnings: response.warnings,
        sourcesQueried: response.sourcesQueried,
        sourcesSucceeded: response.sourcesSucceeded,
        sourcesFailed: response.sourcesFailed,
        loading: false,
        error: null,
        searchedQuery: query,
        hasSearched: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `Search failed: ${msg}. Check your connection and try again.`,
        results: [],
        hasSearched: true,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, search, reset };
}
