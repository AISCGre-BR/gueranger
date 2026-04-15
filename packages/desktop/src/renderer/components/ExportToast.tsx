import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle, AlertCircle, X, FolderOpen, FileSpreadsheet } from "lucide-react";

interface Props {
  status: "idle" | "exporting" | "success" | "error";
  filePath: string | null;
  errorMessage: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ExportToast({ status, filePath, errorMessage, onRetry, onDismiss }: Props) {
  const { t } = useTranslation();
  if (status === "idle") return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 min-w-[320px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 p-4"
      role="status"
      aria-live="polite"
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <X className="h-4 w-4" />
      </button>

      {status === "exporting" && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {t("export.progress")}
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t("export.success")}
            </span>
          </div>
          {filePath && (
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => window.gueranger.openExportFile(filePath)}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {t("export.openFile")}
              </button>
              <button
                onClick={() => window.gueranger.revealExportInFolder(filePath)}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {t("export.showInFolder")}
              </button>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">
              {t("export.error", { message: errorMessage ?? "Unknown error" })}
            </span>
          </div>
          <button
            onClick={onRetry}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t("export.retry")}
          </button>
        </div>
      )}
    </div>
  );
}
