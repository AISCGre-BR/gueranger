import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

interface Props {
  status: "idle" | "exporting" | "success" | "error";
  url: string | null;
  errorMessage: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ExportToast({ status, url, errorMessage, onRetry, onDismiss }: Props) {
  if (status === "idle") return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 min-w-[300px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 p-4"
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
            <ExportProgressText />
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              <ExportSuccessText />
            </span>
          </div>
          {url && (
            <button
              onClick={() => window.gueranger.openExternal(url)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExportOpenSheetText />
            </button>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">
              <ExportErrorText message={errorMessage} />
            </span>
          </div>
          <button
            onClick={onRetry}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExportRetryText />
          </button>
        </div>
      )}
    </div>
  );
}

// Inner components that use useTranslation to keep hooks at top level
function ExportProgressText() {
  const { t } = useTranslation();
  return <>{t("export.progress")}</>;
}

function ExportSuccessText() {
  const { t } = useTranslation();
  return <>{t("export.success")}</>;
}

function ExportOpenSheetText() {
  const { t } = useTranslation();
  return <>{t("export.openSheet")}</>;
}

function ExportErrorText({ message }: { message: string | null }) {
  const { t } = useTranslation();
  return <>{t("export.error", { message: message ?? "Unknown error" })}</>;
}

function ExportRetryText() {
  const { t } = useTranslation();
  return <>{t("export.retry")}</>;
}
