/**
 * WebView-side script for Gueranger search panel.
 * Runs in the browser context inside the VSCode WebView.
 */

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

interface ManuscriptResult {
  siglum: string;
  library: string;
  city: string;
  century: string;
  incipit: string;
  genre: string;
  feast: string;
  folio: string;
  cantusId: string;
  iiifManifest: string;
  sourceUrl: string;
  sourceDatabase: string;
}

const vscode = acquireVsCodeApi();

const COLUMNS = ["Siglum", "Library", "Century", "Genre", "Feast", "Folio", "Source"];
const COLUMN_KEYS: (keyof ManuscriptResult)[] = [
  "siglum", "library", "century", "genre", "feast", "folio", "sourceDatabase",
];

let currentResults: ManuscriptResult[] = [];
let sortCol = -1;
let sortAsc = true;

/**
 * Initialize form and message handlers when DOM is ready.
 */
function init(): void {
  const form = document.getElementById("search-form") as HTMLFormElement | null;
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = (document.getElementById("query") as HTMLInputElement).value.trim();
      if (!query) return;

      const genre = (document.getElementById("genre") as HTMLSelectElement).value;
      const feast = (document.getElementById("feast") as HTMLInputElement).value.trim();
      const century = (document.getElementById("century") as HTMLInputElement).value.trim();
      const melody = (document.getElementById("melody") as HTMLInputElement).value.trim();

      const params: Record<string, string> = { query };
      if (genre) params.genre = genre;
      if (feast) params.feast = feast;
      if (century) params.century = century;
      if (melody) params.melody = melody;

      vscode.postMessage({ type: "search", params });
    });
  }

  // Listen for messages from extension host
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "results":
        currentResults = message.data;
        renderTable(currentResults);
        break;
      case "loading":
        setLoading(message.loading);
        break;
      case "error":
        showError(message.message);
        break;
    }
  });
}

/**
 * Render results into the table.
 */
function renderTable(results: ManuscriptResult[]): void {
  const container = document.getElementById("results-container");
  if (!container) return;

  hideError();

  if (results.length === 0) {
    container.innerHTML = '<p class="result-count">No results found.</p>';
    return;
  }

  let html = `<p class="result-count">Found ${results.length} result${results.length !== 1 ? "s" : ""}</p>`;
  html += '<table id="results-table"><thead><tr>';

  // Headers
  COLUMNS.forEach((col, i) => {
    const cls = sortCol === i ? (sortAsc ? "sort-asc" : "sort-desc") : "";
    html += `<th class="${cls}" data-col="${i}">${col}</th>`;
  });
  html += "</tr></thead><tbody>";

  // Rows
  for (const r of results) {
    html += "<tr>";

    // Siglum: clickable if sourceUrl is available
    if (r.sourceUrl && r.sourceUrl !== "N/A") {
      html += `<td><a data-url="${escapeAttr(r.sourceUrl)}">${escapeHtml(r.siglum)}</a></td>`;
    } else {
      html += `<td>${escapeHtml(r.siglum)}</td>`;
    }

    // Library, Century, Genre, Feast, Folio: plain text
    html += `<td>${escapeHtml(r.library)}</td>`;
    html += `<td>${escapeHtml(r.century)}</td>`;
    html += `<td>${escapeHtml(r.genre)}</td>`;
    html += `<td>${escapeHtml(r.feast)}</td>`;
    html += `<td>${escapeHtml(r.folio)}</td>`;

    // Source: database name + optional IIIF link
    let sourceHtml = escapeHtml(r.sourceDatabase);
    if (r.iiifManifest && r.iiifManifest !== "N/A") {
      sourceHtml += ` <a class="iiif-link" data-url="${escapeAttr(r.iiifManifest)}" title="IIIF Manifest">[IIIF]</a>`;
    }
    html += `<td>${sourceHtml}</td>`;

    html += "</tr>";
  }

  html += "</tbody></table>";
  container.innerHTML = html;

  // Bind header click for sorting
  const headers = container.querySelectorAll("th[data-col]");
  headers.forEach((th) => {
    th.addEventListener("click", () => {
      const colIdx = parseInt((th as HTMLElement).dataset.col || "0", 10);
      sortTable(colIdx);
    });
  });

  // Bind link clicks to open via extension host
  const links = container.querySelectorAll("a[data-url]");
  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const url = (a as HTMLElement).dataset.url;
      if (url) {
        vscode.postMessage({ type: "openUrl", url });
      }
    });
  });
}

/**
 * Sort the table by column index. Toggles asc/desc on same column.
 */
function sortTable(columnIndex: number): void {
  if (sortCol === columnIndex) {
    sortAsc = !sortAsc;
  } else {
    sortCol = columnIndex;
    sortAsc = true;
  }

  const key = COLUMN_KEYS[columnIndex];
  currentResults.sort((a, b) => {
    const aVal = a[key] || "";
    const bVal = b[key] || "";
    const cmp = aVal.localeCompare(bVal);
    return sortAsc ? cmp : -cmp;
  });

  renderTable(currentResults);
}

/**
 * Show or hide the loading indicator.
 */
function setLoading(loading: boolean): void {
  const indicator = document.getElementById("loading-indicator");
  if (indicator) {
    indicator.classList.toggle("visible", loading);
  }
  if (loading) {
    hideError();
  }
}

/**
 * Show an error message.
 */
function showError(message: string): void {
  const errorEl = document.getElementById("error-display");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("visible");
  }
}

/**
 * Hide the error display.
 */
function hideError(): void {
  const errorEl = document.getElementById("error-display");
  if (errorEl) {
    errorEl.classList.remove("visible");
    errorEl.textContent = "";
  }
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Escape a string for use as an HTML attribute value.
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Initialize on DOM ready
init();
