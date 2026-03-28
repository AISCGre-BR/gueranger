import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SourceStatus } from "../hooks/useSearch";

const SOURCES = ["Cantus Index Network", "DIAMM", "RISM Online", "Biblissima", "MMMO"];

interface Props {
  sourceStatus: SourceStatus;
}

export function SearchProgress({ sourceStatus }: Props) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);

  const completed = SOURCES.filter((s) => sourceStatus[s] === "ok" || sourceStatus[s] === "fail").length;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        // Anchor progress to real completion ratio, but smoothly animate
        const realProgress = (completed / SOURCES.length) * 90;
        const target = Math.max(realProgress, p);
        if (p >= 90) return p + 0.1;
        if (p >= target - 2) return p + 0.2;
        return p + 1.5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [completed]);

  const clampedProgress = Math.min(progress, 95);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <p className="mb-4 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("search.searching")}
      </p>

      {/* Progress bar */}
      <div className="mx-auto mb-5 h-2 max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Source indicators with real status */}
      <div className="flex flex-wrap justify-center gap-3">
        {SOURCES.map((source) => {
          const status = sourceStatus[source] ?? "pending";
          let className = "text-xs transition-colors duration-500 ";
          let prefix = "";

          if (status === "ok") {
            className += "text-green-600 dark:text-green-400";
            prefix = "\u2713 ";
          } else if (status === "fail") {
            className += "text-red-500 dark:text-red-400";
            prefix = "\u2717 ";
          } else {
            // pending — check if any source has completed yet
            const anyDone = SOURCES.some((s) => sourceStatus[s] === "ok" || sourceStatus[s] === "fail");
            className += anyDone
              ? "text-blue-600 dark:text-blue-400 font-medium"
              : "text-slate-400 dark:text-slate-500";
          }

          return (
            <span key={source} className={className}>
              {prefix}{source}
            </span>
          );
        })}
      </div>
    </div>
  );
}
