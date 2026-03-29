interface GuerangerAPI {
  search: (params: {
    query: string;
    genre?: string;
    century?: string;
    feast?: string;
    melody?: string;
  }) => Promise<{
    results: Array<{
      siglum: string;
      library: string;
      city: string;
      century: string;
      incipit: string;
      genre: string;
      feast: string;
      folio: string;
      cantusId: string;
      iiifManifest: string;
      imageAvailable: boolean;
      sourceUrl: string;
      sourceDatabase: string;
      matchType: "text" | "melody" | "both";
      [key: string]: unknown;
    }>;
    warnings: string[];
    sourcesQueried: string[];
    sourcesSucceeded: string[];
    sourcesFailed: string[];
  }>;
  getLanguage: () => Promise<string>;
  setLanguage: (lang: string) => Promise<string>;
  getTheme: () => Promise<string>;
  setTheme: (theme: string) => Promise<boolean>;
  isFirstLaunch: () => Promise<boolean>;
  markLaunched: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;

  // Auth
  googleSignIn: (rememberMe: boolean) => Promise<{ email: string; avatarUrl: string }>;
  googleSignOut: () => Promise<void>;
  googleGetStatus: () => Promise<{ signedIn: boolean; email?: string; avatarUrl?: string }>;

  // DIAMM
  diammSave: (username: string, password: string) => Promise<void>;
  diammGet: () => Promise<{ username: string | null; password: string | null }>;
  diammClear: () => Promise<void>;

  // Export
  exportToSheets: (params: {
    rows: Record<string, string>[];
    columns: string[];
    sheetName: string;
    existingSpreadsheetId?: string;
    appendOrNewTab?: "append" | "newTab";
  }) => Promise<{ url: string }>;
  listRecentSheets: () => Promise<Array<{ id: string; name: string; modifiedTime: string }>>;
}

declare global {
  interface Window {
    gueranger: GuerangerAPI;
  }
}

export {};
