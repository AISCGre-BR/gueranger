import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gueranger", {
  search: (params: { query: string; genre?: string; century?: string; feast?: string; melody?: string }) =>
    ipcRenderer.invoke("search:execute", params),
});
