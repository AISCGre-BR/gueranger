import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { ExternalLink, ArrowUpDown, ChevronUp, ChevronDown, Image } from "lucide-react";

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
      enableResizing: false,
    }),
    col.accessor("siglum", {
      header: t("table.siglum"),
      size: 150,
      minSize: 80,
    }),
    col.accessor("library", {
      header: t("table.library"),
      size: 200,
      minSize: 80,
    }),
    col.accessor("city", {
      header: t("table.city"),
      size: 100,
      minSize: 60,
    }),
    col.accessor("century", {
      header: t("table.century"),
      size: 70,
      minSize: 50,
    }),
    col.accessor("incipit", {
      header: t("table.incipit"),
      size: 280,
      minSize: 100,
    }),
    col.accessor("genre", {
      header: t("table.genre"),
      size: 100,
      minSize: 60,
    }),
    col.accessor("feast", {
      header: t("table.feast"),
      size: 140,
      minSize: 60,
    }),
    col.accessor("folio", {
      header: t("table.folio"),
      size: 60,
      minSize: 40,
    }),
    // Image column — link when available, dash with tooltip when not
    col.accessor("iiifManifest", {
      header: t("table.image"),
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const url = row.original.iiifManifest;
        const hasUrl = url && url !== "N/A" && url.trim() !== "";
        if (hasUrl) {
          // For IIIF manifests (JSON), link to the source page instead (has embedded viewer)
          const viewUrl = url.endsWith(".json") || url.includes("/manifest")
            ? row.original.sourceUrl
            : url;
          return (
            <button
              onClick={() => window.gueranger.openExternal(viewUrl)}
              className="flex cursor-pointer items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <Image className="h-3.5 w-3.5" />
              <span className="text-xs">{t("table.imageOpen")}</span>
            </button>
          );
        }
        return (
          <span
            className="text-slate-300 dark:text-slate-600 cursor-help"
            title={t("table.imageTooltip")}
          >
            –
          </span>
        );
      },
    }),
    // Source column with explicit link (D-08, UX-02)
    col.accessor("sourceDatabase", {
      header: t("table.source"),
      size: 190,
      minSize: 100,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.sourceDatabase}</span>
          {row.original.sourceUrl && (
            <button
              onClick={() => window.gueranger.openExternal(row.original.sourceUrl)}
              title={t("table.openInBrowser", { source: row.original.sourceDatabase })}
              aria-label={t("table.openInBrowser", { source: row.original.sourceDatabase })}
              className="flex cursor-pointer items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="text-xs">Link</span>
            </button>
          )}
        </div>
      ),
    }),
    col.accessor("matchType", {
      header: t("table.match"),
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => {
        const val = getValue();
        return <span>{t(`table.matchType.${val}`)}</span>;
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
