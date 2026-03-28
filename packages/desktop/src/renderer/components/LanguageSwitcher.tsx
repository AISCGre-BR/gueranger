import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "pt", flag: "\u{1F1E7}\u{1F1F7}", name: "Portugues" },
  { code: "en", flag: "\u{1F1FA}\u{1F1F8}", name: "English" },
  { code: "it", flag: "\u{1F1EE}\u{1F1F9}", name: "Italiano" },
  { code: "de", flag: "\u{1F1E9}\u{1F1EA}", name: "Deutsch" },
] as const;

interface Props {
  language: string;
  onChangeLanguage: (code: string) => void;
}

export function LanguageSwitcher({ language, onChangeLanguage }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelect(code: string) {
    onChangeLanguage(code);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label={t("settings.language")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {current.flag}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === language}
              onClick={() => handleSelect(lang.code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 ${
                lang.code === language
                  ? "border-l-3 border-l-blue-600 font-semibold"
                  : ""
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
