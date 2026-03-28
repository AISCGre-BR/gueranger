import type { SourceAdapter } from "../adapter.interface.js";
import type { SearchQuery } from "../../models/query.js";
import type { ManuscriptResult } from "../../models/manuscript-result.js";
import { matchesIncipit } from "../../normalizer/latin.js";
import { MOCK_MANUSCRIPTS } from "./mock-data.js";

/**
 * Mock adapter for development and testing.
 * Searches in-memory mock manuscripts using Latin text normalization.
 */
export class MockAdapter implements SourceAdapter {
  readonly name = "Mock Data";

  async search(query: SearchQuery): Promise<ManuscriptResult[]> {
    return MOCK_MANUSCRIPTS.filter((entry) => {
      // Text matching via normalized Latin incipit comparison
      if (!matchesIncipit(entry.incipit, query.query)) {
        return false;
      }

      // Genre filter (case-insensitive exact match)
      if (query.genre && entry.genre.toLowerCase() !== query.genre.toLowerCase()) {
        return false;
      }

      // Century filter (case-insensitive contains)
      if (query.century && !entry.century.toLowerCase().includes(query.century.toLowerCase())) {
        return false;
      }

      // Feast filter (case-insensitive contains)
      if (query.feast && !entry.feast.toLowerCase().includes(query.feast.toLowerCase())) {
        return false;
      }

      return true;
    });
  }
}
