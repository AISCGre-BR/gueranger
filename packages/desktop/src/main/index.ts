import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { handleSearch } from "@gueranger/core";
import { initializeTheme, registerSettingsHandlers } from "./settings";
import {
  startGoogleSignIn,
  restoreSession,
  signOut,
  getAuthClient,
} from "./auth/google-oauth";
import {
  storeEncrypted,
  retrieveEncrypted,
  clearEncrypted,
} from "./auth/safe-credentials";
import {
  exportToNewSheet,
  exportToExistingSheet,
  listRecentSpreadsheets,
} from "./export/sheets-export";

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

function registerAuthHandlers(): void {
  ipcMain.handle(
    "auth:google-sign-in",
    async (_event, rememberMe: boolean) => {
      const result = await startGoogleSignIn();
      if (rememberMe) {
        try {
          storeEncrypted("google-refresh-token", result.refreshToken);
        } catch (err) {
          console.warn("[auth] Could not persist token (secure storage unavailable):", err);
        }
      }
      return { email: result.email, avatarUrl: result.avatarUrl };
    },
  );

  ipcMain.handle("auth:google-sign-out", async () => {
    await signOut();
  });

  ipcMain.handle("auth:google-get-status", async () => {
    const session = await restoreSession();
    if (session) {
      return { signedIn: true, email: session.email, avatarUrl: session.avatarUrl };
    }
    return { signedIn: false };
  });

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
    "export:to-sheets",
    async (
      _event,
      params: {
        rows: Record<string, string>[];
        columns: string[];
        sheetName: string;
        existingSpreadsheetId?: string;
        appendOrNewTab?: "append" | "newTab";
      },
    ) => {
      const auth = getAuthClient();
      if (!auth) throw new Error("Not signed in");

      const headers = params.columns;
      const rowsData = params.rows.map((row) =>
        params.columns.map((col) => row[col] ?? ""),
      );

      let url: string;
      if (params.existingSpreadsheetId) {
        url = await exportToExistingSheet(
          auth,
          params.existingSpreadsheetId,
          params.appendOrNewTab ?? "newTab",
          params.sheetName,
          headers,
          rowsData,
        );
      } else {
        url = await exportToNewSheet(auth, params.sheetName, headers, rowsData);
      }

      return { url };
    },
  );

  ipcMain.handle("export:list-sheets", async () => {
    const auth = getAuthClient();
    if (!auth) throw new Error("Not signed in");
    return listRecentSpreadsheets(auth);
  });
}

app.whenReady().then(() => {
  initializeTheme();
  registerSettingsHandlers();
  registerAuthHandlers();
  registerExportHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
