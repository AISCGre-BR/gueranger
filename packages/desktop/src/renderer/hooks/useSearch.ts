import { useState, useCallback, useEffect, useRef } from "react";
import i18n from "../i18n";
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

export type SourceStatus = Record<string, "pending" | "ok" | "fail">;

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

/** Detects GABC notation — inlined to avoid importing @gueranger/core in the renderer bundle. */
function isGabc(input: string): boolean {
  if (!input) return false;
  if (/\([cf]b?[1-4]/.test(input)) return true;
  const noteGroups = input.match(/\([a-m]/g);
  return noteGroups !== null && noteGroups.length >= 2;
}

const SOURCES = ["Cantus Index Network", "DIAMM", "RISM Online", "Biblissima", "MMMO"];

export function useSearch() {
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>({});
  const unsubRef = useRef<(() => void) | null>(null);

  // Listen for per-source progress events from main process
  useEffect(() => {
    const unsub = window.gueranger.onSourceProgress((data) => {
      setSourceStatus((prev) => ({ ...prev, [data.name]: data.status }));
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, []);

  const search = useCallback(async (params: SearchParams) => {
    const { query, genre, century, feast } = params;
    if (!query.trim()) return;

    // Reset source status to pending
    const initial: SourceStatus = {};
    for (const s of SOURCES) initial[s] = "pending";
    setSourceStatus(initial);

    setState((prev) => ({ ...prev, loading: true, error: null, searchedQuery: query }));

    try {
      let searchQuery = query;
      let melody: string | undefined;

      if (isGabc(query)) {
        searchQuery = extractTextFromGabc(query);
        melody = query;
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
        error: i18n.t("search.error", { message: msg }),
        results: [],
        hasSearched: true,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setSourceStatus({});
  }, []);

  return { ...state, sourceStatus, search, reset };
}
