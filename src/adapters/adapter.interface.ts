import type { ManuscriptResult } from "../models/manuscript-result.js";
import type { SearchQuery } from "../models/query.js";

export interface SourceAdapter {
  readonly name: string;
  search(query: SearchQuery): Promise<ManuscriptResult[]>;
}
