import * as vscode from "vscode";
import { GuerangerClient, type ClientContext } from "./mcp-client";

let client: GuerangerClient | undefined;

/**
 * Create a ClientContext from a VSCode ExtensionContext.
 */
function createClientContext(context: vscode.ExtensionContext): ClientContext {
  return {
    extensionPath: context.extensionPath,
    getConfig: (key: string) => {
      return vscode.workspace.getConfiguration().get<string>(key, "");
    },
  };
}

export async function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "gueranger.search",
    async () => {
      try {
        if (!client) {
          client = new GuerangerClient(createClientContext(context));
          await client.connect();
        }
        // GuerangerPanel will be implemented in Plan 02
        vscode.window.showInformationMessage(
          "Gueranger panel coming in Plan 02",
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error connecting to server";
        vscode.window.showErrorMessage(`Gueranger: ${message}`);
      }
    },
  );

  context.subscriptions.push(command);
  context.subscriptions.push({
    dispose: () => {
      client?.dispose();
    },
  });
}

export function deactivate() {
  client?.dispose();
}
