import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { handleSearch } from "@gueranger/core";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("search:execute", async (_event, params) => {
  try {
    return await handleSearch(params);
  } catch (err) {
    console.error("[search:execute] Error:", err);
    throw err;
  }
});

ipcMain.handle("shell:open-external", async (_event, url: string) => {
  await shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
