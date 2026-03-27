import * as vscode from "vscode";
import * as crypto from "node:crypto";
import type { GuerangerClient } from "../mcp-client";
import type { SearchMessage, OpenUrlMessage } from "../types";

/**
 * Manages the Gueranger WebView panel for manuscript search.
 */
export class GuerangerPanel {
  public static currentPanel: GuerangerPanel | undefined;
  private static readonly viewType = "gueranger";

  private readonly panel: vscode.WebviewPanel;
  private readonly client: GuerangerClient;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  /**
   * Create or reveal the Gueranger search panel.
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    client: GuerangerClient,
  ): void {
    if (GuerangerPanel.currentPanel) {
      GuerangerPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      GuerangerPanel.viewType,
      "Gueranger: Manuscript Search",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      },
    );

    GuerangerPanel.currentPanel = new GuerangerPanel(panel, extensionUri, client);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    client: GuerangerClient,
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.client = client;

    this.panel.webview.html = this.getWebviewContent();

    this.panel.webview.onDidReceiveMessage(
      (message: SearchMessage | OpenUrlMessage) => this.handleMessage(message),
      null,
      this.disposables,
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  /**
   * Handle messages from the WebView.
   */
  private async handleMessage(
    message: SearchMessage | OpenUrlMessage,
  ): Promise<void> {
    switch (message.type) {
      case "search": {
        this.panel.webview.postMessage({ type: "loading", loading: true });
        try {
          const results = await this.client.search(message.params);
          this.panel.webview.postMessage({ type: "results", data: results });
        } catch (err: unknown) {
          const errorMsg =
            err instanceof Error ? err.message : "Search failed";
          this.panel.webview.postMessage({ type: "error", message: errorMsg });
        } finally {
          this.panel.webview.postMessage({ type: "loading", loading: false });
        }
        break;
      }
      case "openUrl": {
        vscode.env.openExternal(vscode.Uri.parse(message.url));
        break;
      }
    }
  }

  /**
   * Generate the HTML content for the WebView.
   * Extracted as a method for testability.
   */
  private getWebviewContent(): string {
    return generateWebviewHtml(
      this.panel.webview,
      this.extensionUri,
    );
  }

  /**
   * Dispose panel and clean up resources.
   */
  private dispose(): void {
    GuerangerPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

/**
 * Generate a cryptographically secure nonce for CSP.
 */
export function getNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

/**
 * Generate WebView HTML content.
 * Exported for testing.
 */
export function generateWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "styles.css"),
  );
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Gueranger</title>
</head>
<body>
  <form id="search-form" class="search-form">
    <div class="form-field">
      <label for="query">Query</label>
      <input type="text" id="query" name="query" placeholder="e.g. Pange lingua" required>
    </div>
    <div class="form-field">
      <label for="genre">Genre</label>
      <select id="genre" name="genre">
        <option value="">Any</option>
        <option value="antiphon">Antiphon</option>
        <option value="responsory">Responsory</option>
        <option value="hymn">Hymn</option>
        <option value="introit">Introit</option>
        <option value="gradual">Gradual</option>
        <option value="offertory">Offertory</option>
        <option value="communion">Communion</option>
        <option value="sequence">Sequence</option>
        <option value="tract">Tract</option>
      </select>
    </div>
    <div class="form-field">
      <label for="feast">Feast</label>
      <input type="text" id="feast" name="feast" placeholder="e.g. Corpus Christi">
    </div>
    <div class="form-field">
      <label for="century">Century</label>
      <input type="text" id="century" name="century" placeholder="e.g. 12th">
    </div>
    <div class="form-field">
      <label for="melody">Melody</label>
      <input type="text" id="melody" name="melody" placeholder="Volpiano notation">
    </div>
    <button type="submit">Search</button>
  </form>

  <div id="loading-indicator" class="loading-indicator">Searching...</div>
  <div id="error-display" class="error-display"></div>
  <div id="results-container"></div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
