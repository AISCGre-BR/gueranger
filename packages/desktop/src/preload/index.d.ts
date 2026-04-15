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

  // DIAMM
  diammSave: (username: string, password: string) => Promise<void>;
  diammGet: () => Promise<{ username: string | null; password: string | null }>;
  diammClear: () => Promise<void>;

  // Excel export
  exportToExcel: (params: {
    rows: Record<string, string>[];
    columns: string[];
    columnLabels: string[];
    sheetName: string;
    defaultFileName: string;
  }) => Promise<{ filePath: string; canceled: boolean }>;
  revealExportInFolder: (filePath: string) => Promise<void>;
  openExportFile: (filePath: string) => Promise<string>;
}

declare global {
  interface Window {
    gueranger: GuerangerAPI;
  }
}

export {};
