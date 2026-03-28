import { nativeTheme, ipcMain } from "electron";
import Conf from "electron-conf";

const settings = new Conf();

export function initializeTheme(): void {
  const theme = settings.get("theme", "system") as string;
  nativeTheme.themeSource = theme as "system" | "light" | "dark";
}

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get-language", () => {
    return settings.get("language", "pt");
  });

  ipcMain.handle("settings:set-language", (_event, lang: string) => {
    settings.set("language", lang);
    return lang;
  });

  ipcMain.handle("settings:get-theme", () => {
    return settings.get("theme", "system");
  });

  ipcMain.handle("settings:set-theme", (_event, theme: string) => {
    nativeTheme.themeSource = theme as "system" | "light" | "dark";
    settings.set("theme", theme);
    return nativeTheme.shouldUseDarkColors;
  });
}
