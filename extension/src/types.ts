/**
 * Manuscript result from the Gueranger MCP server.
 * Plain TypeScript interface matching ManuscriptResultSchema (no Zod dependency).
 */
export interface ManuscriptResult {
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
  sourceUrl: string;
  sourceDatabase: string;
}

/**
 * Search parameters for the search_chants MCP tool.
 */
export interface SearchParams {
  query: string;
  genre?: string;
  century?: string;
  feast?: string;
  melody?: string;
}

// --- WebView message types ---

export interface SearchMessage {
  type: "search";
  params: SearchParams;
}

export interface OpenUrlMessage {
  type: "openUrl";
  url: string;
}

export interface ResultsMessage {
  type: "results";
  data: ManuscriptResult[];
}

export interface LoadingMessage {
  type: "loading";
  loading: boolean;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

/** Messages from WebView to extension host */
export type WebViewToHostMessage = SearchMessage | OpenUrlMessage;

/** Messages from extension host to WebView */
export type HostToWebViewMessage = ResultsMessage | LoadingMessage | ErrorMessage;
