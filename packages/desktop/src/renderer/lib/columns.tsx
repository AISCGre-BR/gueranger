import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { ExternalLink, Check, Minus, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

/** ManuscriptResult type matching the IPC response shape. */
export interface ManuscriptRow {
  siglum: string;
  library: string;
  city: string;
  century: string;
  incipit: string;
  genre: string;
  feast: string;
  folio: string;
  cantusId: string;
  iiifManifest: string;
  imageAvailable: boolean;
  sourceUrl: string;
  sourceDatabase: string;
  matchType: "text" | "melody" | "both";
}

const col = createColumnHelper<ManuscriptRow>();

export function useColumns() {
  const { t } = useTranslation();

  return [
    // Checkbox column for row selection (D-04, DESK-04)
    col.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected();
          }}
          className="h-4 w-4 accent-blue-600"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 accent-blue-600"
        />
      ),
      size: 40,
    }),
    col.accessor("siglum", {
      header: t("table.siglum"),
      size: 120,
    }),
    col.accessor("library", {
      header: t("table.library"),
      size: 180,
    }),
    col.accessor("city", {
      header: t("table.city"),
      size: 100,
    }),
    col.accessor("century", {
      header: t("table.century"),
      size: 80,
    }),
    col.accessor("incipit", {
      header: t("table.incipit"),
      size: 200,
    }),
    col.accessor("genre", {
      header: t("table.genre"),
      size: 100,
    }),
    col.accessor("feast", {
      header: t("table.feast"),
      size: 120,
    }),
    col.accessor("folio", {
      header: t("table.folio"),
      size: 60,
    }),
    // Source column with external link button (D-08, UX-02)
    col.accessor("sourceDatabase", {
      header: t("table.source"),
      size: 140,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.sourceDatabase}</span>
          {row.original.sourceUrl && (
            <button
              onClick={() => window.gueranger.openExternal(row.original.sourceUrl)}
              title={t("table.openInBrowser", { source: row.original.sourceDatabase })}
              aria-label={t("table.openInBrowser", { source: row.original.sourceDatabase })}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    }),
    col.accessor("matchType", {
      header: t("table.match"),
      size: 80,
    }),
    // Image availability with honest labeling (D-07)
    col.accessor("imageAvailable", {
      header: t("table.image"),
      size: 90,
      cell: ({ getValue }) => {
        const available = getValue();
        return (
          <span
            className={`flex items-center gap-1 ${available ? "text-green-600" : "text-slate-400"}`}
            title={t("table.imageTooltip")}
          >
            {available ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>{t("table.imageDetected")}</span>
              </>
            ) : (
              <>
                <Minus className="h-3.5 w-3.5" />
                <span>{t("table.imageNotFound")}</span>
              </>
            )}
          </span>
        );
      },
    }),
  ];
}

/** Sort indicator component for column headers (D-06). */
export function SortIndicator({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ChevronUp className="h-3.5 w-3.5 text-blue-600" />;
  if (isSorted === "desc") return <ChevronDown className="h-3.5 w-3.5 text-blue-600" />;
  return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
}
