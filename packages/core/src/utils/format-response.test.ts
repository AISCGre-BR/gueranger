import { describe, it, expect } from "vitest";
import { formatResults } from "./format-response.js";
import type { ManuscriptResult } from "../models/manuscript-result.js";

const sampleResult: ManuscriptResult = {
  siglum: "F-Pn lat. 1090",
  library: "Bibliotheque nationale de France",
  city: "Paris",
  century: "13th century",
  incipit: "Pange lingua gloriosi corporis mysterium",
  genre: "hymn",
  feast: "Corpus Christi",
  folio: "145v",
  cantusId: "008368",
  iiifManifest: "N/A",
  sourceUrl: "https://cantusindex.org/id/008368",
  sourceDatabase: "Cantus Index",
  matchType: "text",
  imageAvailable: true,
};

describe("formatResults", () => {
  it("single result formats correctly with all 12 fields present", () => {
    const output = formatResults([sampleResult], "Pange lingua");

    expect(output).toContain('Found 1 result(s) for "Pange lingua"');
    expect(output).toContain("## F-Pn lat. 1090");
    expect(output).toContain("- Library: Bibliotheque nationale de France");
    expect(output).toContain("- City: Paris");
    expect(output).toContain("- Century: 13th century");
    expect(output).toContain("- IIIF Manifest: N/A");
    expect(output).toContain("- Source: Cantus Index");
    expect(output).toContain("- Source URL: https://cantusindex.org/id/008368");
    expect(output).toContain("Incipit: Pange lingua gloriosi corporis mysterium");
    expect(output).toContain("Genre: hymn");
    expect(output).toContain("Feast: Corpus Christi");
    expect(output).toContain("Folio: 145v");
    expect(output).toContain("Cantus ID: 008368");
  });

  it("multiple results with same siglum are grouped under one manuscript header", () => {
    const result2: ManuscriptResult = {
      ...sampleResult,
      incipit: "Ave maris stella dei mater alma",
      genre: "hymn",
      feast: "Common of the BVM",
      folio: "48r",
      cantusId: "008272",
      sourceUrl: "https://cantusindex.org/id/008272",
    };

    const output = formatResults([sampleResult, result2], "query");

    // Only one manuscript header for F-Pn lat. 1090
    const headerCount = (output.match(/## F-Pn lat\. 1090/g) || []).length;
    expect(headerCount).toBe(1);

    // Both incipits appear
    expect(output).toContain("Pange lingua gloriosi corporis mysterium");
    expect(output).toContain("Ave maris stella dei mater alma");
    expect(output).toContain("across 1 manuscript(s)");
  });

  it("multiple results with different sigla produce separate headers", () => {
    const result2: ManuscriptResult = {
      siglum: "A-Wn 1799",
      library: "Oesterreichische Nationalbibliothek",
      city: "Wien",
      century: "12th century",
      incipit: "Pange lingua gloriosi proelii certamen",
      genre: "hymn",
      feast: "Passion",
      folio: "89r",
      cantusId: "008369",
      iiifManifest: "N/A",
      sourceUrl: "https://cantusindex.org/id/008369",
      sourceDatabase: "Cantus Index",
      matchType: "text",
      imageAvailable: true,
    };

    const output = formatResults([sampleResult, result2], "Pange lingua");

    expect(output).toContain("## F-Pn lat. 1090");
    expect(output).toContain("## A-Wn 1799");
    expect(output).toContain("across 2 manuscript(s)");
  });

  it("empty results returns 'No manuscripts found' message", () => {
    const output = formatResults([], "nonexistent");
    expect(output).toContain("No manuscripts found");
    expect(output).toContain("nonexistent");
  });

  it("all fields appear in output including N/A values", () => {
    const output = formatResults([sampleResult], "test");

    // All 12 ManuscriptResult fields must appear
    expect(output).toContain("F-Pn lat. 1090"); // siglum
    expect(output).toContain("Bibliotheque nationale de France"); // library
    expect(output).toContain("Paris"); // city
    expect(output).toContain("13th century"); // century
    expect(output).toContain("Pange lingua gloriosi corporis mysterium"); // incipit
    expect(output).toContain("hymn"); // genre
    expect(output).toContain("Corpus Christi"); // feast
    expect(output).toContain("145v"); // folio
    expect(output).toContain("008368"); // cantusId
    expect(output).toContain("N/A"); // iiifManifest
    expect(output).toContain("https://cantusindex.org/id/008368"); // sourceUrl
    expect(output).toContain("Cantus Index"); // sourceDatabase
  });
});
