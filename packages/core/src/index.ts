// Search
export { handleSearch } from "./search/handle-search.js";
export type { SearchParams, SearchResponse } from "./search/handle-search.js";

// Orchestrator
export { multiSearch, getActiveAdapters } from "./orchestrator/multi-search.js";
export type { MultiSearchResult } from "./orchestrator/multi-search.js";

// Models
export type { SearchQuery } from "./models/query.js";
export type { ManuscriptResult } from "./models/manuscript-result.js";
export { ManuscriptResultSchema } from "./models/manuscript-result.js";

// Adapters
export type { SourceAdapter } from "./adapters/adapter.interface.js";

// Normalizer + Converters
export { normalizeLatinText } from "./normalizer/latin.js";
export { isGabc, gabcToVolpiano } from "./converters/gabc-to-volpiano.js";

// Utils
export { formatResults } from "./utils/format-response.js";
