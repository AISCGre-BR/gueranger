import { useState, useEffect, useCallback } from "react";
import i18n from "../i18n";

interface Settings {
  language: string;
  theme: string;
  isDark: boolean;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    language: "pt",
    theme: "system",
    isDark: false,
  });

  useEffect(() => {
    async function load() {
      const [language, theme] = await Promise.all([
        window.gueranger.getLanguage(),
        window.gueranger.getTheme(),
      ]);
      if (language !== i18n.language) {
        await i18n.changeLanguage(language);
      }
      setSettings({ language, theme, isDark: false });
    }
    load();
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    await window.gueranger.setLanguage(lang);
    await i18n.changeLanguage(lang);
    setSettings((prev) => ({ ...prev, language: lang }));
  }, []);

  const setTheme = useCallback(async (theme: string) => {
    const isDark = await window.gueranger.setTheme(theme);
    setSettings((prev) => ({ ...prev, theme, isDark }));
  }, []);

  return { ...settings, setLanguage, setTheme };
}
