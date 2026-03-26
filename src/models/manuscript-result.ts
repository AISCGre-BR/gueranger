import { z } from "zod";

export const ManuscriptResultSchema = z.object({
  // Identification
  siglum: z.string().describe("Manuscript siglum or name (e.g., 'F-Pn lat. 1090')"),
  library: z.string().describe("Holding institution (e.g., 'Bibliotheque nationale de France')"),
  city: z.string().describe("City of the holding library (e.g., 'Paris')"),

  // Dating
  century: z.string().describe("Approximate date or century (e.g., '12th century', '1150-1200')"),

  // Content
  incipit: z.string().describe("Full text incipit as stored in the source"),
  genre: z.string().describe("Liturgical genre (antiphon, responsory, hymn, etc.)"),
  feast: z.string().describe("Liturgical feast or occasion (e.g., 'Corpus Christi')"),
  folio: z.string().describe("Folio reference where the piece appears (e.g., '145v')"),
  cantusId: z.string().describe("Cantus ID -- universal identifier for this chant"),

  // Links
  iiifManifest: z.string().describe("IIIF manifest URL when available, 'N/A' otherwise"),
  sourceUrl: z.string().describe("Permalink in the original database"),
  sourceDatabase: z.string().describe("Name of the source database (e.g., 'Cantus Database', 'DIAMM')"),
});

export type ManuscriptResult = z.infer<typeof ManuscriptResultSchema>;
