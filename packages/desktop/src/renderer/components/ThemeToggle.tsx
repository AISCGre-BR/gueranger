import { useTranslation } from "react-i18next";
import { Sun, Moon } from "lucide-react";

interface Props {
  theme: string;
  onChangeTheme: (theme: string) => void;
}

function nextTheme(current: string): string {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

function nextLabel(current: string): string {
  if (current === "system") return "settings.lightMode";
  if (current === "light") return "settings.darkMode";
  return "settings.systemMode";
}

export function ThemeToggle({ theme, onChangeTheme }: Props) {
  const { t } = useTranslation();

  const showSun = theme === "dark";

  return (
    <button
      onClick={() => onChangeTheme(nextTheme(theme))}
      className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
      aria-label={t(nextLabel(theme))}
    >
      {showSun ? (
        <Sun className="h-[18px] w-[18px] text-slate-500 dark:text-slate-400" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-slate-500 dark:text-slate-400" />
      )}
    </button>
  );
}
