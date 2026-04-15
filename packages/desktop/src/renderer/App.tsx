import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SearchForm } from "./components/SearchForm";
import { ResultsTable } from "./components/ResultsTable";
import { WarningBanner } from "./components/WarningBanner";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeToggle } from "./components/ThemeToggle";
import { DiammCredentialsDialog } from "./components/DiammCredentialsDialog";
import { ExportToast } from "./components/ExportToast";
import { WelcomeDialog } from "./components/WelcomeDialog";
import { useSearch } from "./hooks/useSearch";
import { useSettings } from "./hooks/useSettings";
import { useExport } from "./hooks/useExport";
import { Search, SearchX, Key } from "lucide-react";
import { SearchProgress } from "./components/SearchProgress";
import iconUrl from "./assets/icon.png";

function App() {
  const { t } = useTranslation();
  const { language, theme, setLanguage, setTheme } = useSettings();
  const exportState = useExport();
  const [diammOpen, setDiammOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    window.gueranger.isFirstLaunch().then((isFirst) => {
      if (isFirst) setWelcomeOpen(true);
    });
  }, []);
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={iconUrl} alt="" className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {t("app.title")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiammOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              title={t("auth.diammCredentials")}
            >
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auth.diammCredentials")}</span>
            </button>
            <LanguageSwitcher language={language} onChangeLanguage={setLanguage} />
            <ThemeToggle theme={theme} onChangeTheme={setTheme} />
          </div>
        </div>

        <SearchForm onSearch={search} onClear={reset} loading={loading} />

        <div className="mt-8">
          {loading && <SearchProgress sourceStatus={sourceStatus} />}

          {!loading && error && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <SearchX className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          )}

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

          {!loading && !error && results.length > 0 && (
            <>
              <WarningBanner
                sourcesFailed={sourcesFailed}
                warnings={warnings}
              />
              <ResultsTable
                data={results}
                sourcesSucceeded={sourcesSucceeded}
                exportState={exportState}
                searchQuery={searchedQuery ?? ""}
              />
            </>
          )}
        </div>
      </div>

      <WelcomeDialog
        open={welcomeOpen}
        onClose={() => {
          setWelcomeOpen(false);
          window.gueranger.markLaunched();
        }}
      />
      <DiammCredentialsDialog open={diammOpen} onClose={() => setDiammOpen(false)} />
      <ExportToast
        status={exportState.status}
        filePath={exportState.filePath}
        errorMessage={exportState.errorMessage}
        onRetry={exportState.retry}
        onDismiss={exportState.dismiss}
      />
    </div>
  );
}

export default App;
