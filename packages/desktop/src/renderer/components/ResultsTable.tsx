import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useColumns, SortIndicator, type ManuscriptRow } from "../lib/columns";
import { PAGE_SIZE } from "../lib/constants";
import { Pagination } from "./Pagination";

interface Props {
  data: ManuscriptRow[];
  sourcesSucceeded: string[];
}

export function ResultsTable({ data, sourcesSucceeded }: Props) {
  const { t } = useTranslation();
  const columns = useColumns();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const totalCount = data.length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Selection toolbar (D-12) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {t("table.selectedOf", { selected: selectedCount, total: totalCount })}
          </span>
          {sourcesSucceeded.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-400">
              {t("table.resultsFrom", { sources: sourcesSucceeded.join(", ") })}
            </span>
          )}
        </div>
        {/* Phase 10 export buttons will go here */}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50 dark:bg-slate-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="select-none px-4 py-3 text-left text-xs font-normal uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    style={{ width: header.getSize() }}
                    aria-sort={
                      header.column.getIsSorted()
                        ? header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex cursor-pointer items-center gap-1 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <SortIndicator isSorted={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`
                  ${i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800"}
                  ${row.getIsSelected() ? "border-l-3 border-l-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-l-blue-400" : ""}
                  transition-colors hover:bg-slate-100 dark:hover:bg-slate-700
                `}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (D-09) */}
      <Pagination table={table} />
    </div>
  );
}
