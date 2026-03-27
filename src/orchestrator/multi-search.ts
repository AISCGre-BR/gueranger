import type { SourceAdapter } from "../adapters/adapter.interface.js";
import type { SearchQuery } from "../models/query.js";
import type { ManuscriptResult } from "../models/manuscript-result.js";
import { DiammCredentialsMissingError } from "../adapters/diamm/diamm-adapter.js";
import { CantusAdapter } from "../adapters/cantus/cantus-adapter.js";
import { DiammAdapter } from "../adapters/diamm/diamm-adapter.js";
import { RismAdapter } from "../adapters/rism/rism-adapter.js";
import { BiblissimaAdapter } from "../adapters/biblissima/biblissima-adapter.js";
import { deduplicateResults } from "./deduplicator.js";
import { enrichWithCanvasLinks } from "./iiif-enrichment.js";

export interface MultiSearchResult {
  results: ManuscriptResult[];
  warnings: string[];
  sourcesQueried: string[];
  sourcesSucceeded: string[];
  sourcesFailed: string[];
}

/**
 * Race a promise against a timeout.
 * Rejects with a descriptive error if the timeout fires first.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Query all adapters in parallel with per-source timeouts.
 *
 * Collects results from successful adapters, records warnings for failures.
 * Per D-04: when DIAMM throws DiammCredentialsMissingError, the exact
 * error message is used as the warning (not prefixed with adapter name).
 * Results are deduplicated before returning.
 */
export async function multiSearch(
  adapters: SourceAdapter[],
  query: SearchQuery,
  timeoutMs = 15000,
): Promise<MultiSearchResult> {
  const sourcesQueried = adapters.map((a) => a.name);
  const sourcesSucceeded: string[] = [];
  const sourcesFailed: string[] = [];
  const warnings: string[] = [];
  const allResults: ManuscriptResult[] = [];

  const settled = await Promise.allSettled(
    adapters.map((adapter) => withTimeout(adapter.search(query), timeoutMs)),
  );

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const adapter = adapters[i];

    if (outcome.status === "fulfilled") {
      allResults.push(...outcome.value);
      sourcesSucceeded.push(adapter.name);
    } else {
      sourcesFailed.push(adapter.name);
      const reason = outcome.reason;

      // D-04: Use exact error message for DiammCredentialsMissingError
      if (reason && reason.name === "DiammCredentialsMissingError") {
        warnings.push(reason.message);
      } else {
        warnings.push(`${adapter.name}: ${reason?.message ?? "Unknown error"}`);
      }
    }
  }

  const deduplicated = deduplicateResults(allResults);
  const results = await enrichWithCanvasLinks(deduplicated);

  return {
    results,
    warnings,
    sourcesQueried,
    sourcesSucceeded,
    sourcesFailed,
  };
}

/**
 * Returns the default set of active adapters.
 * Always includes DIAMM -- the adapter handles credential checks itself.
 */
export function getActiveAdapters(): SourceAdapter[] {
  return [new CantusAdapter(), new DiammAdapter(), new RismAdapter(), new BiblissimaAdapter()];
}
