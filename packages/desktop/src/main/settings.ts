import { nativeTheme, ipcMain } from "electron";
import { Conf } from "electron-conf";

let settings: InstanceType<typeof Conf> | null = null;

function getSettings() {
  if (!settings) {
    settings = new Conf();
  }
  return settings;
}

export function initializeTheme(): void {
  const theme = getSettings().get("theme", "system") as string;
  nativeTheme.themeSource = theme as "system" | "light" | "dark";
}

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get-language", () => {
    return getSettings().get("language", "pt");
  });

  ipcMain.handle("settings:set-language", (_event, lang: string) => {
    getSettings().set("language", lang);
    return lang;
  });

  ipcMain.handle("settings:get-theme", () => {
    return getSettings().get("theme", "system");
  });

  ipcMain.handle("settings:set-theme", (_event, theme: string) => {
    nativeTheme.themeSource = theme as "system" | "light" | "dark";
    getSettings().set("theme", theme);
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle("settings:is-first-launch", () => {
    return !getSettings().get("hasLaunched", false);
  });

  ipcMain.handle("settings:mark-launched", () => {
    getSettings().set("hasLaunched", true);
  });
}
