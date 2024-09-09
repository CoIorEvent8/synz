import path from "path";
import { window, OpenDialogOptions, ExtensionContext } from "vscode";

export async function showFileSelect(context: ExtensionContext) {
  const options: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select",
    canSelectFiles: true,
    canSelectFolders: false,
  };

  window.showOpenDialog(options).then((fileUri) => {
    if (fileUri && fileUri[0]) {
      const filePath = fileUri[0].fsPath;
      const parentFolder = path.dirname(filePath);

      context.globalState.update("synzLoaderParent", parentFolder);

      window.showInformationMessage(
        "Launcher file updated to: " + parentFolder
      );
    } else {
      window
        .showErrorMessage(
          "No file selected for the launcher.",
          "Select Loader File"
        )
        .then((selection) => {
          if (selection === "Select Loader File") {
            showFileSelect(context).catch(console.error);
          }
        });
    }
  });
}
