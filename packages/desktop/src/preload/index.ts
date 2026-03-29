import { contextBridge, ipcRenderer } from "electron";

const ALLOWED_PROTOCOLS = ["https:", "http:"];

contextBridge.exposeInMainWorld("gueranger", {
  search: (params: { query: string; genre?: string; century?: string; feast?: string; melody?: string }) =>
    ipcRenderer.invoke("search:execute", params),
  onSourceProgress: (callback: (data: { name: string; status: "ok" | "fail" }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { name: string; status: "ok" | "fail" }) => callback(data);
    ipcRenderer.on("search:source-progress", handler);
    return () => ipcRenderer.removeListener("search:source-progress", handler);
  },
  getLanguage: () => ipcRenderer.invoke("settings:get-language"),
  setLanguage: (lang: string) => ipcRenderer.invoke("settings:set-language", lang),
  getTheme: () => ipcRenderer.invoke("settings:get-theme"),
  setTheme: (theme: string) => ipcRenderer.invoke("settings:set-theme", theme),
  isFirstLaunch: () => ipcRenderer.invoke("settings:is-first-launch"),
  markLaunched: () => ipcRenderer.invoke("settings:mark-launched"),
  openExternal: (url: string): Promise<void> => {
    try {
      const parsed = new URL(url);
      if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        return ipcRenderer.invoke("shell:open-external", url);
      }
    } catch {
      // Invalid URL -- silently ignore
    }
    return Promise.resolve();
  },

  // Auth
  googleSignIn: (rememberMe: boolean) =>
    ipcRenderer.invoke("auth:google-sign-in", rememberMe),
  googleSignOut: () => ipcRenderer.invoke("auth:google-sign-out"),
  googleGetStatus: () => ipcRenderer.invoke("auth:google-get-status"),

  // DIAMM credentials
  diammSave: (username: string, password: string) =>
    ipcRenderer.invoke("auth:diamm-save", username, password),
  diammGet: () => ipcRenderer.invoke("auth:diamm-get"),
  diammClear: () => ipcRenderer.invoke("auth:diamm-clear"),

  // Export
  exportToSheets: (params: {
    rows: Record<string, string>[];
    columns: string[];
    sheetName: string;
    existingSpreadsheetId?: string;
    appendOrNewTab?: "append" | "newTab";
  }) => ipcRenderer.invoke("export:to-sheets", params),
  listRecentSheets: () => ipcRenderer.invoke("export:list-sheets"),
});
