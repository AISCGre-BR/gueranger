import { describe, it, expect } from "vitest";
import { parseSearchHits, parseChantDetail } from "../mmmo-client.js";

// --- Search results HTML fixture ---
// Based on Drupal 7 search results structure at /search/node/{query}
const SEARCH_HTML_FIXTURE = `
<ol class="search-results node-results">
  <li class="search-result">
    <h3 class="title">
      <a href="/chant/26355">Pange lingua gloriosi corporis mysterium</a>
    </h3>
    <div class="search-snippet-info">
      <p class="search-snippet">...Pange lingua gloriosi corporis...</p>
    </div>
  </li>
  <li class="search-result">
    <h3 class="title">
      <a href="/chant/99001">Pange lingua gloriosi proelii certamen</a>
    </h3>
    <div class="search-snippet-info">
      <p class="search-snippet">...Pange lingua gloriosi proelii...</p>
    </div>
  </li>
</ol>
`;

const SEARCH_HTML_NO_RESULTS = `
<div class="content">
  <h2>Your search yielded no results</h2>
</div>
`;

// --- Chant detail HTML fixture ---
// Based on Drupal 7 node display for /chant/26355
const CHANT_DETAIL_FIXTURE = `
<div class="node node-chant">
  <div class="content">
    <div class="field field-name-field-source">
      <div class="field-label">Source:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">
          <a href="/source/23756">F-CH : Ms 0050</a>
        </div>
      </div>
    </div>
    <div class="field field-name-field-folio">
      <div class="field-label">Folio:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">309r</div>
      </div>
    </div>
    <div class="field field-name-field-feast">
      <div class="field-label">Feast:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">
          <a href="/feast/5623">Nicolai</a>
        </div>
      </div>
    </div>
    <div class="field field-name-field-office">
      <div class="field-label">Office:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">M</div>
      </div>
    </div>
    <div class="field field-name-field-genre">
      <div class="field-label">Genre:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">
          <a href="/genre/6145">H</a>
        </div>
      </div>
    </div>
    <div class="field field-name-field-cantus-id">
      <div class="field-label">Cantus ID:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">
          <a href="http://cantusindex.org/id/008367">008367</a>
        </div>
      </div>
    </div>
    <div class="field field-name-field-full-text">
      <div class="field-label">Full text:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">Pange lingua*</div>
      </div>
    </div>
    <div class="field field-name-field-image-link field-type-link-field field-label-inline clearfix">
      <div class="field-label">Image link:&nbsp;</div>
      <div class="field-items">
        <div class="field-item">
          <a href="https://bvmm.irht.cnrs.fr/iiif/223/canvas/canvas-151914/view">View image</a>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const CHANT_DETAIL_MINIMAL = `
<div class="node node-chant">
  <div class="content">
    <p>No structured data available</p>
  </div>
</div>
`;

describe("parseSearchHits", () => {
  it("extracts chant IDs, titles, and URLs from search results HTML", () => {
    const hits = parseSearchHits(SEARCH_HTML_FIXTURE);

    expect(hits).toHaveLength(2);

    expect(hits[0].chantId).toBe("26355");
    expect(hits[0].title).toBe(
      "Pange lingua gloriosi corporis mysterium",
    );
    expect(hits[0].url).toBe("https://musmed.eu/chant/26355");

    expect(hits[1].chantId).toBe("99001");
    expect(hits[1].title).toBe(
      "Pange lingua gloriosi proelii certamen",
    );
    expect(hits[1].url).toBe("https://musmed.eu/chant/99001");
  });

  it("returns empty array when no .search-results found", () => {
    const hits = parseSearchHits(SEARCH_HTML_NO_RESULTS);
    expect(hits).toEqual([]);
  });

  it("returns empty array for empty HTML", () => {
    const hits = parseSearchHits("");
    expect(hits).toEqual([]);
  });

  it("skips links that do not match /chant/ pattern", () => {
    const html = `
      <ol class="search-results">
        <li><h3><a href="/source/12345">Some source</a></h3></li>
        <li><h3><a href="/chant/55555">Valid chant</a></h3></li>
      </ol>
    `;
    const hits = parseSearchHits(html);
    expect(hits).toHaveLength(1);
    expect(hits[0].chantId).toBe("55555");
  });
});

describe("parseChantDetail", () => {
  it("extracts source field", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result).not.toBeNull();
    expect(result!.source).toBe("F-CH : Ms 0050");
  });

  it("extracts folio field", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.folio).toBe("309r");
  });

  it("extracts feast field", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.feast).toBe("Nicolai");
  });

  it("extracts genre field", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.genre).toBe("H");
  });

  it("extracts cantusId from cantusindex.org link", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.cantusId).toBe("008367");
  });

  it("extracts fullText field", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.fullText).toBe("Pange lingua*");
  });

  it("extracts imageUrl from image link", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.imageUrl).toBe(
      "https://bvmm.irht.cnrs.fr/iiif/223/canvas/canvas-151914/view",
    );
  });

  it("extracts office field", () => {
    const result = parseChantDetail(CHANT_DETAIL_FIXTURE);
    expect(result!.office).toBe("M");
  });

  it("returns null for minimal HTML without recognizable fields", () => {
    const result = parseChantDetail(CHANT_DETAIL_MINIMAL);
    expect(result).toBeNull();
  });

  it("returns null for empty HTML", () => {
    const result = parseChantDetail("");
    expect(result).toBeNull();
  });

  it("handles partial fields gracefully (missing optional fields default to N/A)", () => {
    const partialHtml = `
      <div class="node node-chant">
        <div class="content">
          <div class="field field-name-field-source">
            <div class="field-items">
              <div class="field-item">
                <a href="/source/100">D-Mbs : Clm 4660</a>
              </div>
            </div>
          </div>
          <div class="field field-name-field-full-text">
            <div class="field-items">
              <div class="field-item">Ave maris stella</div>
            </div>
          </div>
        </div>
      </div>
    `;
    const result = parseChantDetail(partialHtml);
    expect(result).not.toBeNull();
    expect(result!.source).toBe("D-Mbs : Clm 4660");
    expect(result!.fullText).toBe("Ave maris stella");
    expect(result!.folio).toBe("N/A");
    expect(result!.feast).toBe("N/A");
    expect(result!.genre).toBe("N/A");
    expect(result!.cantusId).toBe("N/A");
    expect(result!.imageUrl).toBe("N/A");
    expect(result!.office).toBe("N/A");
  });
});
