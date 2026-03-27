import { describe, it, expect } from "vitest";
import {
  normalizeFolio,
  resolveCanvas,
  extractCanvases,
} from "../iiif-resolver.js";

describe("normalizeFolio", () => {
  it('"f. 42r" returns "42r"', () => {
    expect(normalizeFolio("f. 42r")).toBe("42r");
  });

  it('"fol. 42 recto" returns "42r"', () => {
    expect(normalizeFolio("fol. 42 recto")).toBe("42r");
  });

  it('"42r" returns "42r"', () => {
    expect(normalizeFolio("42r")).toBe("42r");
  });

  it('"folio 10 verso" returns "10v"', () => {
    expect(normalizeFolio("folio 10 verso")).toBe("10v");
  });
});

const V2_MANIFEST = {
  "@context": "http://iiif.io/api/presentation/2/context.json",
  "@type": "sc:Manifest",
  sequences: [
    {
      canvases: [
        {
          "@id": "https://example.org/canvas/001r",
          label: "1r",
          images: [
            {
              resource: {
                "@id":
                  "https://example.org/image/001r/full/full/0/default.jpg",
              },
            },
          ],
        },
        {
          "@id": "https://example.org/canvas/001v",
          label: "1v",
          images: [
            {
              resource: {
                "@id":
                  "https://example.org/image/001v/full/full/0/default.jpg",
              },
            },
          ],
        },
        {
          "@id": "https://example.org/canvas/042r",
          label: "42r",
          images: [
            {
              resource: {
                "@id":
                  "https://example.org/image/042r/full/full/0/default.jpg",
              },
            },
          ],
        },
      ],
    },
  ],
};

const V3_MANIFEST = {
  "@context": "http://iiif.io/api/presentation/3/context.json",
  type: "Manifest",
  items: [
    {
      type: "Canvas",
      id: "https://example.org/canvas/v3/001r",
      label: { none: ["1r"] },
      items: [
        {
          type: "AnnotationPage",
          items: [
            {
              body: {
                type: "Image",
                id: "https://example.org/image/v3/001r/full/max/0/default.jpg",
              },
            },
          ],
        },
      ],
    },
    {
      type: "Canvas",
      id: "https://example.org/canvas/v3/010v",
      label: { none: ["10v"] },
      items: [
        {
          type: "AnnotationPage",
          items: [
            {
              body: {
                type: "Image",
                id: "https://example.org/image/v3/010v/full/max/0/default.jpg",
              },
            },
          ],
        },
      ],
    },
  ],
};

describe("extractCanvases", () => {
  it('detects v2 by @context containing "presentation/2"', () => {
    const canvases = extractCanvases(V2_MANIFEST);
    expect(canvases).toHaveLength(3);
    expect(canvases[0].canvasId).toBe("https://example.org/canvas/001r");
    expect(canvases[0].label).toBe("1r");
    expect(canvases[0].imageUrl).toBe(
      "https://example.org/image/001r/full/full/0/default.jpg",
    );
  });

  it('detects v3 by @context containing "presentation/3"', () => {
    const canvases = extractCanvases(V3_MANIFEST);
    expect(canvases).toHaveLength(2);
    expect(canvases[0].canvasId).toBe(
      "https://example.org/canvas/v3/001r",
    );
    expect(canvases[0].label).toBe("1r");
    expect(canvases[0].imageUrl).toBe(
      "https://example.org/image/v3/001r/full/max/0/default.jpg",
    );
  });
});

describe("resolveCanvas", () => {
  it("finds canvas by normalized label match in v2 manifest", () => {
    const match = resolveCanvas(V2_MANIFEST, "42r");
    expect(match).not.toBeNull();
    expect(match!.canvasId).toBe("https://example.org/canvas/042r");
    expect(match!.label).toBe("42r");
    expect(match!.imageUrl).toBe(
      "https://example.org/image/042r/full/full/0/default.jpg",
    );
  });

  it("finds canvas correctly in v3 manifest (label as { none: [string] })", () => {
    const match = resolveCanvas(V3_MANIFEST, "1r");
    expect(match).not.toBeNull();
    expect(match!.canvasId).toBe("https://example.org/canvas/v3/001r");
    expect(match!.label).toBe("1r");
  });

  it("returns null when no canvas matches the folio", () => {
    const match = resolveCanvas(V2_MANIFEST, "999r");
    expect(match).toBeNull();
  });

  it("tries substring match as fallback when exact normalized match fails", () => {
    // "f. 42r" normalizes to "42r", exact match with canvas label "42r"
    const match = resolveCanvas(V2_MANIFEST, "f. 42r");
    expect(match).not.toBeNull();
    expect(match!.canvasId).toBe("https://example.org/canvas/042r");
  });

  it("resolves v3 manifest with folio prefix normalization", () => {
    const match = resolveCanvas(V3_MANIFEST, "fol. 10 verso");
    expect(match).not.toBeNull();
    expect(match!.canvasId).toBe("https://example.org/canvas/v3/010v");
  });
});
