import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

interface Props {
  sourcesFailed: string[];
  warnings: string[];
}

export function WarningBanner({ sourcesFailed, warnings }: Props) {
  const { t } = useTranslation();

  if (sourcesFailed.length === 0) return null;

  return (
    <div
      className="rounded-t-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:bg-amber-950 dark:border-amber-800"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
          {t("warnings.sourcesUnavailable", { count: sourcesFailed.length })}
        </p>
      </div>
      {warnings.length > 0 && (
        <ul className="ml-6 mt-1 text-sm text-amber-700 dark:text-amber-400">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
