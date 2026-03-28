import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { ManuscriptRow } from "../lib/columns";

interface Props {
  table: Table<ManuscriptRow>;
}

export function Pagination({ table }: Props) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageSize = table.getState().pagination.pageSize;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  if (totalRows === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
      <span>
        Page {pageIndex + 1} of {pageCount}
      </span>
      <span>
        Showing {start}--{end} of {totalRows} results
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
