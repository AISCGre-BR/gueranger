import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { handleSearch } from "@gueranger/core";
import { initializeTheme, registerSettingsHandlers } from "./settings";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: join(__dirname, "../../resources/icon.png"),
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

ipcMain.handle("search:execute", async (event, params) => {
  try {
    return await handleSearch(params, (name, status) => {
      event.sender.send("search:source-progress", { name, status });
    });
  } catch (err) {
    console.error("[search:execute] Error:", err);
    throw err;
  }
});

ipcMain.handle("shell:open-external", async (_event, url: string) => {
  await shell.openExternal(url);
});

app.whenReady().then(() => {
  initializeTheme();
  registerSettingsHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
