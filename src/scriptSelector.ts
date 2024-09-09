import { ExtensionContext, QuickInputButtons, window, ThemeIcon } from "vscode";

export function showScriptSelector(context: ExtensionContext) {
  const ScriptQuickPick = window.createQuickPick();

  ScriptQuickPick.title = "Navigate to a script";
  ScriptQuickPick.placeholder = "Type to search for a script by name";

  ScriptQuickPick.items = [
    {
      iconPath: new ThemeIcon("globe"),
      label: "Universal Scripts",
    },
    {
      iconPath: new ThemeIcon("shield"),
      label: "Workspace",
    },
    {
      iconPath: new ThemeIcon("repo"),
      label: "Scripts Folder",
    },
  ];

  ScriptQuickPick.onDidChangeSelection((selection) => {
    if (selection[0].label === "Universal Scripts") {
      // Open the Universal Scripts folder
    } else if (selection[0].label === "Workspace") {
      // Open the Workspace folder
    } else if (selection[0].label === "Scripts Folder") {
      // Open the Scripts folder
    }
  });

  ScriptQuickPick.show();
}
