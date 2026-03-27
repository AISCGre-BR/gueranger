import type { IiifCanvasMatch } from "./biblissima-types.js";

/**
 * Normalizes a folio reference for matching against IIIF canvas labels.
 *
 * Strips common prefixes (fol., f., folio), converts "recto"/"verso"
 * to "r"/"v", and removes whitespace. Case-insensitive.
 *
 * Examples:
 * - "f. 42r"        -> "42r"
 * - "fol. 42 recto" -> "42r"
 * - "folio 10 verso"-> "10v"
 * - "42r"           -> "42r"
 */
export function normalizeFolio(folio: string): string {
  return folio
    .toLowerCase()
    .replace(/^(folio|fol\.?|f\.?)\s*/i, "")
    .replace(/\s*(recto)\s*$/i, "r")
    .replace(/\s*(verso)\s*$/i, "v")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Extracts the label string from a IIIF v3 label object.
 *
 * IIIF v3 labels can be:
 * - A string: "1r"
 * - A language map object: { "none": ["1r"] } or { "en": ["folio 1r"] }
 */
export function extractV3Label(label: unknown): string {
  if (typeof label === "string") return label;
  if (label && typeof label === "object") {
    const values = Object.values(label as Record<string, unknown>).flat();
    return String(values[0] ?? "");
  }
  return "";
}

/**
 * Extracts canvas information from a IIIF manifest (v2 or v3).
 *
 * Detects version by checking @context for "presentation/2" or "presentation/3".
 * - v2: canvases in sequences[0].canvases
 * - v3: canvases in items (filtered by type==="Canvas")
 */
export function extractCanvases(manifest: unknown): IiifCanvasMatch[] {
  if (!manifest || typeof manifest !== "object") return [];

  const m = manifest as Record<string, unknown>;
  const context = String(m["@context"] ?? "");

  // IIIF Presentation API v2
  if (context.includes("presentation/2")) {
    const sequences = m.sequences as Array<Record<string, unknown>> | undefined;
    const canvases = (sequences?.[0]?.canvases ?? []) as Array<
      Record<string, unknown>
    >;

    return canvases.map((c) => ({
      canvasId: String(c["@id"] ?? ""),
      label: typeof c.label === "string" ? c.label : String(c.label ?? ""),
      imageUrl: extractV2ImageUrl(c),
    }));
  }

  // IIIF Presentation API v3 (default)
  if (context.includes("presentation/3")) {
    const items = (m.items ?? []) as Array<Record<string, unknown>>;

    return items
      .filter((item) => item.type === "Canvas")
      .map((c) => ({
        canvasId: String(c.id ?? ""),
        label: extractV3Label(c.label),
        imageUrl: extractV3ImageUrl(c),
      }));
  }

  return [];
}

function extractV2ImageUrl(canvas: Record<string, unknown>): string {
  const images = canvas.images as Array<Record<string, unknown>> | undefined;
  const resource = images?.[0]?.resource as Record<string, unknown> | undefined;
  return String(resource?.["@id"] ?? "N/A");
}

function extractV3ImageUrl(canvas: Record<string, unknown>): string {
  const items = canvas.items as Array<Record<string, unknown>> | undefined;
  const innerItems = items?.[0]?.items as
    | Array<Record<string, unknown>>
    | undefined;
  const body = innerItems?.[0]?.body as Record<string, unknown> | undefined;
  return String(body?.id ?? "N/A");
}

/**
 * Resolves a specific canvas from a IIIF manifest matching a target folio.
 *
 * First tries exact normalized match, then falls back to substring containment.
 * Returns null when no canvas matches (graceful degradation per D-04).
 */
export function resolveCanvas(
  manifest: unknown,
  targetFolio: string,
): IiifCanvasMatch | null {
  const normalized = normalizeFolio(targetFolio);
  if (!normalized) return null;

  const canvases = extractCanvases(manifest);

  // Exact normalized match
  for (const canvas of canvases) {
    if (normalizeFolio(canvas.label) === normalized) {
      return canvas;
    }
  }

  // Fallback: substring match
  for (const canvas of canvases) {
    const normalizedLabel = normalizeFolio(canvas.label);
    if (
      normalizedLabel.includes(normalized) ||
      normalized.includes(normalizedLabel)
    ) {
      return canvas;
    }
  }

  return null;
}
