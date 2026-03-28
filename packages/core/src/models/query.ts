export interface SearchQuery {
  /** Normalized Latin text (lowercase, diacritics stripped, variants resolved) */
  query: string;
  /** Original user input (for display purposes) */
  rawQuery: string;
  /** Liturgical genre filter (e.g., 'hymn', 'antiphon') */
  genre?: string;
  /** Century or date range filter (e.g., '12th', '13th century') */
  century?: string;
  /** Liturgical feast filter (e.g., 'Corpus Christi') */
  feast?: string;
  /** Volpiano melodic incipit for melody search */
  melody?: string;
}
