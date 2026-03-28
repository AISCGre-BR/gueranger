import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { ManuscriptRow } from "../lib/columns";

interface Props {
  table: Table<ManuscriptRow>;
}

export function Pagination({ table }: Props) {
  const { t } = useTranslation();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageSize = table.getState().pagination.pageSize;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  if (totalRows === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
      <span>
        {t("pagination.page", { current: pageIndex + 1, total: pageCount })}
      </span>
      <span>
        {t("pagination.showing", { start, end, total: totalRows })}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:border-slate-600 dark:hover:bg-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
