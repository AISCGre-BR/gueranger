import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { handleSearch } from "@gueranger/core";
import { initializeTheme, registerSettingsHandlers } from "./settings";
import {
  storeEncrypted,
  retrieveEncrypted,
  clearEncrypted,
} from "./auth/safe-credentials";
import { exportToExcel, revealInFolder, openFile } from "./export/excel-export";

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

function registerDiammHandlers(): void {
  ipcMain.handle(
    "auth:diamm-save",
    async (_event, username: string, password: string) => {
      storeEncrypted("diamm-username", username);
      storeEncrypted("diamm-password", password);
    },
  );

  ipcMain.handle("auth:diamm-get", async () => {
    return {
      username: retrieveEncrypted("diamm-username"),
      password: retrieveEncrypted("diamm-password"),
    };
  });

  ipcMain.handle("auth:diamm-clear", async () => {
    clearEncrypted("diamm-username");
    clearEncrypted("diamm-password");
  });
}

function registerExportHandlers(): void {
  ipcMain.handle(
    "export:to-excel",
    async (
      event,
      params: {
        rows: Record<string, string>[];
        columns: string[];
        columnLabels: string[];
        sheetName: string;
        defaultFileName: string;
      },
    ) => {
      const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
      return exportToExcel(params, parent);
    },
  );

  ipcMain.handle("export:reveal-in-folder", async (_event, filePath: string) => {
    revealInFolder(filePath);
  });

  ipcMain.handle("export:open-file", async (_event, filePath: string) => {
    return openFile(filePath);
  });
}

app.whenReady().then(() => {
  initializeTheme();
  registerSettingsHandlers();
  registerDiammHandlers();
  registerExportHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
