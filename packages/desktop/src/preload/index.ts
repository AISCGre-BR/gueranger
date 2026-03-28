import { contextBridge, ipcRenderer } from "electron";

const ALLOWED_PROTOCOLS = ["https:", "http:"];

contextBridge.exposeInMainWorld("gueranger", {
  search: (params: { query: string; genre?: string; century?: string; feast?: string; melody?: string }) =>
    ipcRenderer.invoke("search:execute", params),
  getLanguage: () => ipcRenderer.invoke("settings:get-language"),
  setLanguage: (lang: string) => ipcRenderer.invoke("settings:set-language", lang),
  getTheme: () => ipcRenderer.invoke("settings:get-theme"),
  setTheme: (theme: string) => ipcRenderer.invoke("settings:set-theme", theme),
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
});
