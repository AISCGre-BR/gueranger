import { SearchForm } from "./components/SearchForm";
import { ResultsTable } from "./components/ResultsTable";
import { WarningBanner } from "./components/WarningBanner";
import { useSearch } from "./hooks/useSearch";
import { Loader2, Search, SearchX } from "lucide-react";

function App() {
  const {
    results,
    warnings,
    sourcesSucceeded,
    sourcesFailed,
    loading,
    error,
    searchedQuery,
    hasSearched,
    search,
    reset,
  } = useSearch();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1280px] px-12 pt-8 pb-12">
        {/* Header */}
        <h1 className="mb-6 text-xl font-semibold text-slate-800">
          Gueranger
        </h1>

        {/* Search Form Card */}
        <SearchForm onSearch={search} onClear={reset} loading={loading} />

        {/* Results Area -- 32px gap below search form */}
        <div className="mt-8">
          {/* Loading state (D-13) */}
          {loading && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <Loader2
                className="h-6 w-6 animate-spin text-blue-600"
                role="status"
                aria-label="Searching"
              />
              <p className="mt-3 text-sm text-slate-500">
                Searching across 5 sources...
              </p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <SearchX className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">{error}</p>
            </div>
          )}

          {/* Initial state -- before first search */}
          {!loading && !error && !hasSearched && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <Search className="h-12 w-12 text-slate-300" />
              <h2 className="mt-3 text-lg font-semibold text-slate-700">
                Search manuscripts
              </h2>
              <p className="mt-1 max-w-md text-center text-sm text-slate-500">
                Enter a Latin incipit or GABC melody above to find digitized
                manuscripts across Cantus, DIAMM, RISM, Biblissima, and MMMO.
              </p>
            </div>
          )}

          {/* Empty results state */}
          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
              <SearchX className="h-12 w-12 text-slate-300" />
              <h2 className="mt-3 text-lg font-semibold text-slate-700">
                No manuscripts found
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                No results for &quot;{searchedQuery}&quot;. Try a broader
                incipit or remove filters.
              </p>
            </div>
          )}

          {/* Results with warning banner and table */}
          {!loading && !error && results.length > 0 && (
            <>
              <WarningBanner
                sourcesFailed={sourcesFailed}
                warnings={warnings}
              />
              <ResultsTable
                data={results}
                sourcesSucceeded={sourcesSucceeded}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
