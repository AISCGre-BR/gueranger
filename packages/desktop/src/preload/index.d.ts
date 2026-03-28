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
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    gueranger: GuerangerAPI;
  }
}

export {};
