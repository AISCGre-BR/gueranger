import * as vscode from "vscode";

export async function activate(context: vscode.ExtensionContext) {
  // Stub -- will be implemented in Task 2
  const command = vscode.commands.registerCommand("gueranger.search", () => {
    vscode.window.showInformationMessage("Gueranger: Extension activating...");
  });
  context.subscriptions.push(command);
}

export function deactivate() {
  // Stub -- will be implemented in Task 2
}
