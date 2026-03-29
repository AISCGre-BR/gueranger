import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DiammCredentialsDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing credentials when dialog opens
  useEffect(() => {
    if (open) {
      setSaved(false);
      setSaving(false);
      setError(null);
      window.gueranger.diammGet().then((creds) => {
        setUsername(creds.username ?? "");
        setPassword(creds.password ?? "");
      });
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await window.gueranger.diammSave(username, password);
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error && err.message.includes("Secure storage")
          ? t("auth.diammStorageUnavailable")
          : t("auth.diammSaveFailed"),
      );
    }
  }, [username, password, onClose, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {t("auth.diammTitle")}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("auth.diammUsername")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("auth.diammPassword")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("auth.diammClose")}
          </button>
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
              <Check className="h-4 w-4" />
              {t("auth.diammSaved")}
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={(!username && !password) || saving}
              className={`text-sm font-medium rounded-md px-4 py-2 transition-colors ${
                (!username && !password) || saving
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-600 dark:text-slate-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              }`}
            >
              {t("auth.diammSave")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
