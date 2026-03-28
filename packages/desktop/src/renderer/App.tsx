import { useTranslation } from "react-i18next";
import { SearchForm } from "./components/SearchForm";
import { ResultsTable } from "./components/ResultsTable";
import { WarningBanner } from "./components/WarningBanner";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeToggle } from "./components/ThemeToggle";
import { useSearch } from "./hooks/useSearch";
import { useSettings } from "./hooks/useSettings";
import { Search, SearchX } from "lucide-react";
import { SearchProgress } from "./components/SearchProgress";
import iconUrl from "./assets/icon.png";

function App() {
  const { t } = useTranslation();
  const { language, theme, setLanguage, setTheme } = useSettings();
  const {
    results,
    warnings,
    sourcesSucceeded,
    sourcesFailed,
    sourceStatus,
    loading,
    error,
    searchedQuery,
    hasSearched,
    search,
    reset,
  } = useSearch();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="mx-auto px-8 pt-8 pb-12">
        {/* Header toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={iconUrl} alt="" className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {t("app.title")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher language={language} onChangeLanguage={setLanguage} />
            <ThemeToggle theme={theme} onChangeTheme={setTheme} />
          </div>
        </div>

        {/* Search Form Card */}
        <SearchForm onSearch={search} onClear={reset} loading={loading} />

        {/* Results Area -- 32px gap below search form */}
        <div className="mt-8">
          {/* Loading state (D-13) */}
          {loading && (
            <SearchProgress sourceStatus={sourceStatus} />
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <SearchX className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          )}

          {/* Initial state -- before first search */}
          {!loading && !error && !hasSearched && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <Search className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h2 className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-100">
                {t("search.initialTitle")}
              </h2>
              <p className="mt-1 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
                {t("search.initialHint")}
              </p>
            </div>
          )}

          {/* Empty results state */}
          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <SearchX className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h2 className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-100">
                {t("search.noResults")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("search.noResultsHint", { query: searchedQuery })}
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
