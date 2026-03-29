import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, FileSpreadsheet, Music, ChevronRight, ChevronLeft, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 4;

export function WelcomeDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const steps = [
    {
      icon: <Search className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: t("welcome.step1Title"),
      body: t("welcome.step1Body"),
    },
    {
      icon: <Music className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: t("welcome.step2Title"),
      body: t("welcome.step2Body"),
    },
    {
      icon: <FileSpreadsheet className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
      title: t("welcome.step3Title"),
      body: t("welcome.step3Body"),
    },
    {
      icon: null,
      title: t("welcome.step4Title"),
      body: t("welcome.step4Body"),
    },
  ];

  const current = steps[step];
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        {/* Close button */}
        <div className="flex justify-end p-3 pb-0">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={t("welcome.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-2 text-center">
          {current.icon && <div className="flex justify-center mb-4">{current.icon}</div>}
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {current.title}
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {current.body}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-blue-600 dark:bg-blue-400"
                  : "w-1.5 bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className={`flex items-center gap-1 text-sm transition-colors ${
              step === 0
                ? "text-transparent cursor-default"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("welcome.back")}
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md px-5 py-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t("welcome.start")}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t("welcome.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
