import { z } from "zod";

// --- DIAMM Search Response ---

export const DiammSearchSourceRefSchema = z.object({
  url: z.string(),
  display_name: z.string(),
  has_images: z.boolean().optional(),
  has_external_manifest: z.boolean().optional(),
  folio_start: z.string().optional(),
  folio_end: z.string().optional(),
});
export type DiammSearchSourceRef = z.infer<typeof DiammSearchSourceRefSchema>;

export const DiammSearchResultSchema = z.object({
  pk: z.string(),
  url: z.string().optional(),
  heading: z.string(),
  type: z.string().optional(),
  title: z.string(),
  sources: z.array(DiammSearchSourceRefSchema),
});
export type DiammSearchResult = z.infer<typeof DiammSearchResultSchema>;

export const DiammSearchResponseSchema = z.object({
  count: z.number(),
  results: z.array(DiammSearchResultSchema),
});
export type DiammSearchResponse = z.infer<typeof DiammSearchResponseSchema>;

// --- DIAMM Source Detail ---

export const DiammArchiveSchema = z.object({
  url: z.string().optional(),
  name: z.string(),
  siglum: z.string(),
  city: z.string(),
  country: z.string().optional(),
});
export type DiammArchive = z.infer<typeof DiammArchiveSchema>;

export const DiammLinkSchema = z.object({
  type: z.number(),
  url_type: z.string().optional(),
  link: z.string(),
});
export type DiammLink = z.infer<typeof DiammLinkSchema>;

export const DiammInventoryItemSchema = z.object({
  pk: z.number(),
  genres: z.array(z.string()),
  folio_start: z.string().optional(),
  composition: z.string().optional(),
});
export type DiammInventoryItem = z.infer<typeof DiammInventoryItemSchema>;

export const DiammSourceDetailSchema = z.object({
  pk: z.number(),
  display_name: z.string(),
  shelfmark: z.string().optional(),
  date_statement: z.string().optional(),
  archive: DiammArchiveSchema,
  manifest_url: z.string().optional(),
  links: z.array(DiammLinkSchema).optional(),
  inventory: z.array(DiammInventoryItemSchema).optional(),
});
export type DiammSourceDetail = z.infer<typeof DiammSourceDetailSchema>;
