import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateWebviewHtml, getNonce } from "./panel";

// Mock vscode module
vi.mock("vscode", () => ({
  Uri: {
    joinPath: (...args: unknown[]) => ({
      toString: () => args.map(String).join("/"),
      fsPath: args.map(String).join("/"),
    }),
    parse: (url: string) => ({ toString: () => url }),
  },
  ViewColumn: { One: 1 },
  window: {
    createWebviewPanel: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
  },
  workspace: {
    getConfiguration: () => ({ get: () => "" }),
  },
}));

/**
 * Create a mock vscode.Webview object.
 */
function createMockWebview() {
  return {
    cspSource: "https://mock.csp.source",
    asWebviewUri: (uri: { toString(): string }) => ({
      toString: () => `https://webview-uri/${uri.toString()}`,
    }),
    onDidReceiveMessage: vi.fn(),
    postMessage: vi.fn(),
  };
}

/**
 * Create a mock extensionUri.
 */
function createMockExtensionUri() {
  return {
    toString: () => "/mock/extension",
    fsPath: "/mock/extension",
  };
}

describe("getNonce", () => {
  it("returns a base64 string", () => {
    const nonce = getNonce();
    expect(nonce).toBeTruthy();
    expect(typeof nonce).toBe("string");
    // base64 characters only
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("returns different values on each call", () => {
    const a = getNonce();
    const b = getNonce();
    expect(a).not.toBe(b);
  });
});

describe("generateWebviewHtml", () => {
  let html: string;

  beforeEach(() => {
    const webview = createMockWebview();
    const extensionUri = createMockExtensionUri();
    html = generateWebviewHtml(webview as any, extensionUri as any);
  });

  it("contains Content-Security-Policy meta tag", () => {
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("script-src 'nonce-");
    expect(html).toContain("style-src");
  });

  it("contains search form with id", () => {
    expect(html).toContain('id="search-form"');
  });

  it("contains query input", () => {
    expect(html).toContain('name="query"');
    expect(html).toContain('id="query"');
    expect(html).toContain("Pange lingua");
  });

  it("contains genre select with options", () => {
    expect(html).toContain('id="genre"');
    expect(html).toContain("<option");
    expect(html).toContain("antiphon");
    expect(html).toContain("responsory");
    expect(html).toContain("hymn");
    expect(html).toContain("introit");
    expect(html).toContain("gradual");
    expect(html).toContain("offertory");
    expect(html).toContain("communion");
    expect(html).toContain("sequence");
    expect(html).toContain("tract");
  });

  it("contains feast input", () => {
    expect(html).toContain('id="feast"');
    expect(html).toContain('name="feast"');
  });

  it("contains century input", () => {
    expect(html).toContain('id="century"');
    expect(html).toContain('name="century"');
  });

  it("contains melody input", () => {
    expect(html).toContain('id="melody"');
    expect(html).toContain('name="melody"');
    expect(html).toContain("Volpiano");
  });

  it("contains loading indicator", () => {
    expect(html).toContain('id="loading-indicator"');
    expect(html).toContain("Searching...");
  });

  it("contains error display", () => {
    expect(html).toContain('id="error-display"');
  });

  it("contains results container", () => {
    expect(html).toContain('id="results-container"');
  });

  it("contains script tag with nonce", () => {
    expect(html).toMatch(/script nonce="[A-Za-z0-9+/=]+" src="/);
  });

  it("contains stylesheet link", () => {
    expect(html).toContain('rel="stylesheet"');
    expect(html).toContain("styles.css");
  });

  it("references webview.js script", () => {
    expect(html).toContain("webview.js");
  });
});
