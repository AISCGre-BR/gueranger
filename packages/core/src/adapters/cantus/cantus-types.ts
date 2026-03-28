import { z } from "zod";

// --- Cantus Index API response schemas ---

/** Individual text search result from /json-text/{searchString} */
export const CantusIndexTextItemSchema = z.object({
  cid: z.string(),
  fulltext: z.string(),
  genre: z.string(),
});
export type CantusIndexTextItem = z.infer<typeof CantusIndexTextItemSchema>;

/** Individual chant entry from /json-cid/{CantusID} response */
export const CantusIndexChantSchema = z.object({
  siglum: z.string(),
  srclink: z.string().optional(),
  chantlink: z.string().optional(),
  folio: z.string().optional(),
  incipit: z.string().optional(),
  feast: z.string().optional(),
  genre: z.string().optional(),
  century: z.union([z.string(), z.number(), z.null()]).optional(),
  image: z.string().optional(),
  melody: z.string().optional(),
  fulltext: z.string().optional(),
  db: z.string().optional(),
});
export type CantusIndexChant = z.infer<typeof CantusIndexChantSchema>;

/** Full response from /json-cid/{CantusID} */
export const CantusIndexCidResponseSchema = z.object({
  info: z.record(z.string(), z.unknown()),
  databases: z.record(z.string(), z.unknown()),
  chants: z.record(z.string(), CantusIndexChantSchema),
});
export type CantusIndexCidResponse = z.infer<
  typeof CantusIndexCidResponseSchema
>;

// --- CantusDB chant detail schema (for /json-node/{id}) ---

/** Detail response from /json-node/{id} -- passthrough since we only need a few fields */
export const CantusDbChantDetailSchema = z.object({
  id: z.number().optional(),
  image_link: z.string().nullable().optional(),
  source_id: z.number().nullable().optional(),
}).passthrough();
export type CantusDbChantDetail = z.infer<typeof CantusDbChantDetailSchema>;

/** Source detail from /json-node/{source_id} — used for century enrichment */
export const CantusDbSourceDetailSchema = z.object({
  id: z.number().optional(),
  date: z.string().nullable().optional(),
}).passthrough();
export type CantusDbSourceDetail = z.infer<typeof CantusDbSourceDetailSchema>;

// --- CantusDB API response schemas ---

/** Individual melody search result from CantusDB */
export const CantusDbMelodyItemSchema = z.object({
  id: z.number(),
  source__holding_institution__siglum: z.string().optional(),
  source__shelfmark: z.string().optional(),
  folio: z.string().optional(),
  incipit: z.string().optional(),
  genre__name: z.string().optional(),
  feast__name: z.string().optional(),
  volpiano: z.string().optional(),
  cantus_id: z.string().optional(),
});
export type CantusDbMelodyItem = z.infer<typeof CantusDbMelodyItemSchema>;

/** Paginated response from CantusDB melody search */
export const CantusDbMelodyResponseSchema = z.object({
  results: z.array(CantusDbMelodyItemSchema),
  result_count: z.number(),
});
export type CantusDbMelodyResponse = z.infer<
  typeof CantusDbMelodyResponseSchema
>;
