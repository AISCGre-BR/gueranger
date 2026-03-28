import { z } from "zod";

// --- MMMO Search Hit (from /search/node/{query} results page) ---

export const MmmoSearchHitSchema = z.object({
  chantId: z.string(),
  title: z.string(),
  url: z.string(),
});
export type MmmoSearchHit = z.infer<typeof MmmoSearchHitSchema>;

// --- MMMO Chant Detail (from /chant/{id} page) ---

export const MmmoChantResultSchema = z.object({
  chantId: z.string(),
  source: z.string(),
  sourcePath: z.string(),
  folio: z.string(),
  feast: z.string(),
  genre: z.string(),
  cantusId: z.string(),
  fullText: z.string(),
  imageUrl: z.string(),
  office: z.string(),
});
export type MmmoChantResult = z.infer<typeof MmmoChantResultSchema>;
