import { z } from "zod";

// --- RISM Search Response (JSON-LD) ---

export const RismSearchItemSchema = z.object({
  id: z.string(),
  label: z.object({
    en: z.array(z.string()),
  }),
  type: z.string().optional(),
  summary: z.unknown().optional(),
});
export type RismSearchItem = z.infer<typeof RismSearchItemSchema>;

export const RismSearchViewSchema = z.object({
  first: z.string().optional(),
  next: z.string().optional(),
  last: z.string().optional(),
  totalPages: z.number().optional(),
  thisPage: z.number().optional(),
});

export const RismSearchResponseSchema = z.object({
  totalItems: z.number(),
  view: RismSearchViewSchema.optional(),
  items: z.array(RismSearchItemSchema),
});
export type RismSearchResponse = z.infer<typeof RismSearchResponseSchema>;
