import { z } from "zod";

// --- Biblissima Search Result (scraped from HTML) ---

export const BiblissimaSearchResultSchema = z.object({
  title: z.string(),
  iiifManifestUrl: z.string(),
  biblissimaUrl: z.string(),
  collection: z.string(),
  library: z.string(),
  date: z.string(),
  language: z.string(),
});
export type BiblissimaSearchResult = z.infer<
  typeof BiblissimaSearchResultSchema
>;

// --- IIIF Canvas Match ---

export interface IiifCanvasMatch {
  canvasId: string;
  imageUrl: string;
  label: string;
}
