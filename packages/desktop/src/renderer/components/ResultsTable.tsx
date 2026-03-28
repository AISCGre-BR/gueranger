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
  type ColumnResizeMode,
} from "@tanstack/react-table";
import { FileSpreadsheet } from "lucide-react";
import { useColumns, SortIndicator, type ManuscriptRow } from "../lib/columns";
import { PAGE_SIZE } from "../lib/constants";
import { Pagination } from "./Pagination";
import { ExportDialog } from "./ExportDialog";

interface Props {
  data: ManuscriptRow[];
  sourcesSucceeded: string[];
  auth: { signedIn: boolean };
  exportState: { exportToSheets: (params: { rows: Record<string, string>[]; columns: string[]; sheetName: string; existingSpreadsheetId?: string; appendOrNewTab?: "append" | "newTab" }) => void };
  searchQuery: string;
}

export function ResultsTable({ data, sourcesSucceeded, auth, exportState, searchQuery }: Props) {
  const { t } = useTranslation();
  const columns = useColumns();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnResizeMode] = useState<ColumnResizeMode>("onChange");

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
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
    enableColumnResizing: true,
  });

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const selectedCount = Object.keys(rowSelection).length;
  const totalCount = data.length;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  // Compute percentage widths from column sizes
  const totalSize = table.getCenterTotalSize();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Selection toolbar (D-12) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {t("table.selectedOf", { selected: selectedCount, total: totalCount })}
          </span>
          {(() => {
            const withResults = sourcesSucceeded.filter((s) =>
              data.some((r) => r.sourceDatabase === s),
            );
            return withResults.length > 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-400">
                {t("table.resultsFrom", { sources: withResults.join(", ") })}
              </span>
            ) : null;
          })()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportDialogOpen(true)}
            disabled={selectedCount === 0 || !auth.signedIn}
            title={
              !auth.signedIn
                ? t("export.signInRequired")
                : selectedCount === 0
                  ? t("export.selectRequired")
                  : undefined
            }
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              selectedCount === 0 || !auth.signedIn
                ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {t("export.toSheets")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            {table.getAllColumns().map((col) => (
              <col
                key={col.id}
                style={{ width: `${(col.getSize() / totalSize) * 100}%` }}
              />
            ))}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50 dark:bg-slate-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative select-none px-3 py-3 text-left text-xs font-normal uppercase tracking-wide text-slate-500 dark:text-slate-400"
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
                    {/* Resize handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none ${
                          header.column.getIsResizing()
                            ? "bg-blue-500"
                            : "bg-transparent hover:bg-slate-300 dark:hover:bg-slate-600"
                        }`}
                      />
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
                    className="overflow-hidden truncate px-3 py-2 text-slate-700 dark:text-slate-300"
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

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        selectedRows={selectedRows}
        searchQuery={searchQuery}
        onExport={(params) => {
          setExportDialogOpen(false);
          exportState.exportToSheets(params);
        }}
      />
    </div>
  );
}
