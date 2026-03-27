import * as fs from "node:fs";
import * as path from "node:path";
import type { ManuscriptResult, SearchParams } from "./types";

/**
 * Configuration interface for GuerangerClient.
 * Abstracted from vscode.ExtensionContext for testability.
 */
export interface ClientContext {
  extensionPath: string;
  getConfig: (key: string) => string;
}

/**
 * MCP client wrapper that manages the lifecycle of a connection
 * to the Gueranger MCP server via stdio transport.
 */
export class GuerangerClient {
  private client: any | null = null;
  private context: ClientContext;

  constructor(context: ClientContext) {
    this.context = context;
  }

  /**
   * Resolve the path to the Gueranger MCP server binary.
   * Priority: (1) gueranger.serverPath setting, (2) workspace node_modules,
   * (3) fallback to build/server.js relative to extension path.
   */
  resolveServerPath(): string {
    // 1. Check user setting
    const settingPath = this.context.getConfig("gueranger.serverPath");
    if (settingPath && fs.existsSync(settingPath)) {
      return settingPath;
    }

    // 2. Check workspace root (parent of extension)
    const workspacePath = path.resolve(
      this.context.extensionPath,
      "..",
      "node_modules",
      ".bin",
      "gueranger",
    );
    if (fs.existsSync(workspacePath)) {
      return workspacePath;
    }

    // 3. Fallback: build/server.js relative to extension parent
    const buildPath = path.resolve(
      this.context.extensionPath,
      "..",
      "build",
      "server.js",
    );
    if (fs.existsSync(buildPath)) {
      return buildPath;
    }

    throw new Error(
      "Gueranger server not found. Set gueranger.serverPath in settings or install the package in your workspace.",
    );
  }

  /**
   * Connect to the MCP server by spawning a child process.
   */
  async connect(): Promise<void> {
    const serverPath = this.resolveServerPath();

    // Dynamic imports for MCP SDK (ESM modules)
    const { Client } = await import(
      "@modelcontextprotocol/sdk/client/index.js"
    );
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );

    const transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
    });

    this.client = new Client({
      name: "gueranger-vscode",
      version: "0.1.0",
    });

    await this.client.connect(transport);
  }

  /**
   * Search for manuscripts via the MCP search_chants tool.
   */
  async search(params: SearchParams): Promise<ManuscriptResult[]> {
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }

    const result = await this.client.callTool({
      name: "search_chants",
      arguments: params,
    });

    return GuerangerClient.parseResults(
      result.content as Array<{ type: string; text: string }>,
    );
  }

  /**
   * Parse ManuscriptResult[] from MCP tool response content.
   * Looks for the ---JSON--- marker and extracts the JSON payload.
   */
  static parseResults(
    content: Array<{ type: string; text: string }>,
  ): ManuscriptResult[] {
    const JSON_MARKER = "---JSON---\n";

    for (const item of content) {
      if (item.type === "text" && item.text.startsWith(JSON_MARKER)) {
        try {
          const jsonStr = item.text.slice(JSON_MARKER.length);
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            return parsed as ManuscriptResult[];
          }
        } catch {
          return [];
        }
      }
    }

    return [];
  }

  /**
   * Dispose the client and kill the child process.
   */
  async dispose(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // Ignore close errors during disposal
      }
      this.client = null;
    }
  }

  /**
   * Whether the client is currently connected.
   */
  get isConnected(): boolean {
    return this.client !== null;
  }
}
