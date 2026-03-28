import { describe, it, expect } from "vitest";
import { parseSearchResults } from "../biblissima-client.js";

const FIXTURE_HTML = `
<div class="result-item">
  <a href="manifest/abc123hash">
    <img class="thumbnail" src="/thumb/abc123.jpg" />
  </a>
  <h5>Paris. BnF, lat. 1090</h5>
  <a href="https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json">
    <img src="/images/iiif-logo.png">
  </a>
  <dl>
    <dt>Collection</dt><dd>Gallica (BnF)</dd>
    <dt>Library</dt><dd>Bibliotheque nationale de France</dd>
    <dt>Date</dt><dd>12th century</dd>
    <dt>Language</dt><dd>Latin</dd>
  </dl>
  <ul>
    <li>Pange lingua gloriosi corporis</li>
  </ul>
</div>
<div class="result-item">
  <a href="manifest/def456hash">
    <img class="thumbnail" src="/thumb/def456.jpg" />
  </a>
  <h5>Roma. BAV, Vat. lat. 4756</h5>
  <a href="https://digi.vatlib.it/iiif/MSS_Vat.lat.4756/manifest.json">
    <img src="/images/iiif-logo.png">
  </a>
  <dl>
    <dt>Collection</dt><dd>DigiVatLib</dd>
    <dt>Library</dt><dd>Biblioteca Apostolica Vaticana</dd>
    <dt>Date</dt><dd>13th century</dd>
    <dt>Language</dt><dd>Latin</dd>
  </dl>
</div>
`;

describe("parseSearchResults", () => {
  it("extracts title, iiifManifestUrl, biblissimaUrl, collection, library, date, language from HTML fixture", () => {
    const results = parseSearchResults(FIXTURE_HTML);

    expect(results).toHaveLength(2);

    expect(results[0].title).toBe("Paris. BnF, lat. 1090");
    expect(results[0].iiifManifestUrl).toBe(
      "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json",
    );
    expect(results[0].biblissimaUrl).toBe(
      "https://iiif.biblissima.fr/collections/manifest/abc123hash",
    );
    expect(results[0].collection).toBe("Gallica (BnF)");
    expect(results[0].library).toBe("Bibliotheque nationale de France");
    expect(results[0].date).toBe("12th century");
    expect(results[0].language).toBe("Latin");

    expect(results[1].title).toBe("Roma. BAV, Vat. lat. 4756");
    expect(results[1].iiifManifestUrl).toBe(
      "https://digi.vatlib.it/iiif/MSS_Vat.lat.4756/manifest.json",
    );
  });

  it("returns empty array for HTML with no .result-item elements", () => {
    const results = parseSearchResults("<div>No results found</div>");
    expect(results).toEqual([]);
  });

  it("handles missing metadata fields by defaulting to N/A", () => {
    const html = `
      <div class="result-item">
        <h5>London. BL, Add. 12345</h5>
        <a href="manifest/xyz789">
          <img class="thumbnail" src="/thumb.jpg" />
        </a>
        <dl>
          <dt>Collection</dt><dd>British Library</dd>
        </dl>
      </div>
    `;

    const results = parseSearchResults(html);
    expect(results).toHaveLength(1);
    expect(results[0].collection).toBe("British Library");
    expect(results[0].library).toBe("N/A");
    expect(results[0].date).toBe("N/A");
    expect(results[0].language).toBe("N/A");
  });

  it("extracts external IIIF manifest URL (href containing manifest but NOT starting with manifest/)", () => {
    const html = `
      <div class="result-item">
        <a href="manifest/internal123">
          <img class="thumbnail" src="/thumb.jpg" />
        </a>
        <h5>Test Manuscript</h5>
        <a href="https://example.org/iiif/manifest.json">
          <img src="/images/iiif-logo.png">
        </a>
        <dl></dl>
      </div>
    `;

    const results = parseSearchResults(html);
    expect(results).toHaveLength(1);
    expect(results[0].iiifManifestUrl).toBe(
      "https://example.org/iiif/manifest.json",
    );
    expect(results[0].biblissimaUrl).toBe(
      "https://iiif.biblissima.fr/collections/manifest/internal123",
    );
  });

  it("sets iiifManifestUrl to N/A when no external manifest link found", () => {
    const html = `
      <div class="result-item">
        <a href="manifest/internal123">
          <img class="thumbnail" src="/thumb.jpg" />
        </a>
        <h5>No External Manifest</h5>
        <dl></dl>
      </div>
    `;

    const results = parseSearchResults(html);
    expect(results).toHaveLength(1);
    expect(results[0].iiifManifestUrl).toBe("N/A");
  });
});
