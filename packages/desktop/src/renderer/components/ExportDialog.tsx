import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ManuscriptRow } from "../lib/columns";

const EXPORTABLE_COLUMNS = [
  "siglum",
  "library",
  "city",
  "century",
  "incipit",
  "genre",
  "feast",
  "folio",
  "cantusId",
  "iiifManifest",
  "imageAvailable",
  "sourceUrl",
  "sourceDatabase",
  "matchType",
] as const;

type ExportableColumn = (typeof EXPORTABLE_COLUMNS)[number];

interface Props {
  open: boolean;
  onClose: () => void;
  selectedRows: ManuscriptRow[];
  searchQuery: string;
  onExport: (params: {
    rows: Record<string, string>[];
    columns: string[];
    columnLabels: string[];
    sheetName: string;
    defaultFileName: string;
  }) => void;
}

function getColumnLabel(key: ExportableColumn, t: (k: string) => string): string {
  switch (key) {
    case "cantusId":
      return "Cantus ID";
    case "iiifManifest":
      return "IIIF Manifest";
    case "sourceUrl":
      return "Source URL";
    case "imageAvailable":
      return t("table.image");
    case "sourceDatabase":
      return t("table.source");
    case "matchType":
      return t("table.match");
    default:
      return t(`table.${key}`);
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "gueranger-export";
}

export function ExportDialog({ open, onClose, selectedRows, searchQuery, onExport }: Props) {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<ExportableColumn[]>([...EXPORTABLE_COLUMNS]);

  useEffect(() => {
    if (open) {
      const date = new Date().toISOString().split("T")[0];
      const base = searchQuery ? `Gueranger - ${searchQuery} - ${date}` : `Gueranger - ${date}`;
      setFileName(base);
      setSheetName("Results");
    }
  }, [open, searchQuery]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const toggleColumn = useCallback((col: ExportableColumn) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedColumns([...EXPORTABLE_COLUMNS]);
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  const handleExport = useCallback(() => {
    const rows = selectedRows.map((row) => {
      const record: Record<string, string> = {};
      for (const col of selectedColumns) {
        const value = row[col];
        if (col === "imageAvailable") {
          record[col] = value ? "Yes" : "No";
        } else {
          record[col] = String(value ?? "");
        }
      }
      return record;
    });

    const columnLabels = selectedColumns.map((c) => getColumnLabel(c, t));

    onExport({
      rows,
      columns: [...selectedColumns],
      columnLabels,
      sheetName: sheetName || "Results",
      defaultFileName: sanitizeFileName(fileName),
    });
  }, [selectedRows, selectedColumns, fileName, sheetName, onExport, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {t("export.dialogTitle")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("export.dialogSubtitle", { count: selectedRows.length })}
          </p>
        </div>

        <div className="px-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("export.fileName")}
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {t("export.fileNameHint")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("export.sheetName")}
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t("export.columnsLabel")}
              </label>
              <button
                onClick={selectedColumns.length === EXPORTABLE_COLUMNS.length ? handleDeselectAll : handleSelectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {selectedColumns.length === EXPORTABLE_COLUMNS.length
                  ? t("export.deselectAll")
                  : t("export.selectAll")}
              </button>
            </div>
            <div className="max-h-[200px] overflow-y-auto mt-2 space-y-1">
              {EXPORTABLE_COLUMNS.map((col) => (
                <label key={col} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {getColumnLabel(col, t)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("export.close")}
          </button>
          <button
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
            className={`text-sm font-medium rounded-md px-4 py-2 transition-colors ${
              selectedColumns.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-600 dark:text-slate-400"
                : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
          >
            {t("export.exportButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
