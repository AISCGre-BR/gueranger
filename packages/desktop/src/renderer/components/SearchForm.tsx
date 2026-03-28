import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { GENRE_OPTIONS, CENTURY_OPTIONS, FEAST_OPTIONS } from "../lib/constants";
import type { SearchParams } from "../hooks/useSearch";

interface Props {
  onSearch: (params: SearchParams) => void;
  onClear: () => void;
  loading: boolean;
}

export function SearchForm({ onSearch, onClear, loading }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [century, setCentury] = useState("");
  const [feast, setFeast] = useState("");

  function handleSubmit() {
    if (!query.trim() || loading) return;
    onSearch({ query, genre, century, feast });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  function handleClear() {
    setQuery("");
    setGenre("");
    setCentury("");
    setFeast("");
    onClear();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <div className="flex flex-wrap items-end gap-4">
        {/* Smart text/GABC input (D-01, D-02) */}
        <div className="min-w-[280px] flex-1">
          <label htmlFor="query" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t("search.label")}
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("search.placeholder")}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Genre dropdown (D-03) */}
        <div className="w-[160px]">
          <label htmlFor="genre" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t("filters.genre")}
          </label>
          <input
            id="genre"
            list="genre-options"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("filters.genrePlaceholder")}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <datalist id="genre-options">
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        {/* Century dropdown (D-03) */}
        <div className="w-[160px]">
          <label htmlFor="century" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t("filters.century")}
          </label>
          <input
            id="century"
            list="century-options"
            value={century}
            onChange={(e) => setCentury(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("filters.centuryPlaceholder")}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <datalist id="century-options">
            {CENTURY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {/* Feast dropdown (D-03) */}
        <div className="w-[160px]">
          <label htmlFor="feast" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t("filters.feast")}
          </label>
          <input
            id="feast"
            list="feast-options"
            value={feast}
            onChange={(e) => setFeast(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("filters.feastPlaceholder")}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <datalist id="feast-options">
            {FEAST_OPTIONS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        {/* Buttons (D-04, D-05) */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search className="h-4 w-4" />
            {t("search.button")}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
            {t("search.clear")}
          </button>
        </div>
      </div>
    </div>
  );
}
