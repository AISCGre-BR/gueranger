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
      century: string;
      genre: string;
      folio: string;
      sourceDatabase: string;
      [key: string]: unknown;
    }>;
    warnings: string[];
    sourcesQueried: string[];
    sourcesSucceeded: string[];
    sourcesFailed: string[];
  }>;
}

declare global {
  interface Window {
    gueranger: GuerangerAPI;
  }
}

export {};
