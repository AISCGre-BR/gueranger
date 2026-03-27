import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    default: { ...actual, existsSync: vi.fn(() => false) },
    existsSync: vi.fn(() => false),
  };
});

import { GuerangerClient } from "./mcp-client";
import { existsSync } from "node:fs";

const mockedExistsSync = vi.mocked(existsSync);

describe("GuerangerClient.parseResults", () => {
  it("extracts ManuscriptResult[] from MCP response with ---JSON--- marker", () => {
    const mockResults = [
      {
        siglum: "F-Pn lat. 1090",
        library: "Bibliotheque nationale de France",
        city: "Paris",
        century: "12th century",
        incipit: "Pange lingua gloriosi",
        genre: "hymn",
        feast: "Corpus Christi",
        folio: "145v",
        cantusId: "008346",
        iiifManifest: "https://gallica.bnf.fr/iiif/ark:/12148/btv1b8432895r/manifest.json",
        sourceUrl: "https://cantusindex.org/id/008346",
        sourceDatabase: "Cantus Index",
      },
    ];
    const content = [
      { type: "text", text: "Found 1 manuscript(s) for 'Pange lingua'..." },
      { type: "text", text: "---JSON---\n" + JSON.stringify(mockResults) },
    ];

    const results = GuerangerClient.parseResults(content);
    expect(results).toHaveLength(1);
    expect(results[0].siglum).toBe("F-Pn lat. 1090");
    expect(results[0].sourceDatabase).toBe("Cantus Index");
  });

  it("returns empty array when no ---JSON--- marker found", () => {
    const content = [
      { type: "text", text: "Some plain text response without marker" },
    ];

    const results = GuerangerClient.parseResults(content);
    expect(results).toEqual([]);
  });

  it("returns empty array for malformed JSON after marker", () => {
    const content = [
      { type: "text", text: "---JSON---\n{invalid json[[[" },
    ];

    const results = GuerangerClient.parseResults(content);
    expect(results).toEqual([]);
  });

  it("returns empty array from empty JSON array marker", () => {
    const content = [
      { type: "text", text: "No results found..." },
      { type: "text", text: "---JSON---\n[]" },
    ];

    const results = GuerangerClient.parseResults(content);
    expect(results).toEqual([]);
  });
});

describe("GuerangerClient.resolveServerPath", () => {
  beforeEach(() => {
    mockedExistsSync.mockReset();
  });

  it("uses gueranger.serverPath setting when provided and file exists", () => {
    mockedExistsSync.mockReturnValue(true);

    const mockContext = {
      extensionPath: "/mock/extension",
      getConfig: () => "/custom/path/server.js",
    };

    const client = new GuerangerClient(mockContext as any);
    const resolved = client.resolveServerPath();
    expect(resolved).toBe("/custom/path/server.js");
  });

  it("falls back to extension path when setting is empty", () => {
    mockedExistsSync.mockImplementation((p) => {
      return String(p).includes("build/server.js");
    });

    const mockContext = {
      extensionPath: "/mock/extension",
      getConfig: () => "",
    };

    const client = new GuerangerClient(mockContext as any);
    const resolved = client.resolveServerPath();
    expect(resolved).toContain("build/server.js");
  });

  it("throws when no server path is found", () => {
    mockedExistsSync.mockReturnValue(false);

    const mockContext = {
      extensionPath: "/mock/extension",
      getConfig: () => "",
    };

    const client = new GuerangerClient(mockContext as any);
    expect(() => client.resolveServerPath()).toThrow("Gueranger server not found");
  });
});
