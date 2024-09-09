import {
  window,
  commands,
  ExtensionContext,
  ThemeIcon,
  QuickPickItem,
  ProgressLocation,
  StatusBarAlignment,
  QuickPickItemKind,
  workspace,
  OutputChannel,
} from "vscode";

import { showFileSelect } from "./selectLauncher";
import {
  findLauncher,
  startProcess,
  execute,
  getRobloxProcesses,
} from "./synzAPI";

import express, { Application } from "express";
import { Server } from "http";
import { showScriptSelector } from "./scriptSelector";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let previousStep = 0;
let previousProgress = 0;
let previousTargetIncrement = 0;

async function animateProgress(
  progress: any,
  targetIncrement: number,
  message: string,
  delayAmount: number = 75
) {
  if (previousProgress > 0) {
    progress.report({
      increment: previousTargetIncrement - previousProgress,
      message: message,
    });
  }

  const step = previousStep + 1;

  previousTargetIncrement = targetIncrement;
  previousProgress = 0;
  previousStep = step;

  while (previousStep === step && previousProgress < targetIncrement) {
    previousProgress += 1;

    progress.report({
      increment: 1,
      message: message,
    });

    await delay(delayAmount);
  }
}

const outputChannel = window.createOutputChannel("Synapse-Z");
let outputListenConnection: Server | undefined = undefined;

function setupOutputListener(parentPath: string) {
  if (workspace.getConfiguration("synz").get("logOutput")) {
    if (outputListenConnection) {
      outputListenConnection.close();
      outputListenConnection = undefined;
    }

    outputChannel.clear();

    const expressApp = express();

    expressApp.use(express.json());

    expressApp.post("/synzOutput", (req, res) => {
      const body = req.body;

      const message = body.message.toString();
      const messageType = body.messageType;

      if (!messageType) {
        outputChannel.appendLine("⚪ " + message);
      } else if (messageType === 1) {
        outputChannel.appendLine("🔵 " + message);
      } else if (messageType === 2) {
        outputChannel.appendLine("🟡 " + message);
      } else if (messageType === 3) {
        outputChannel.appendLine("🔴 " + message);
      }
      res.send();
    });

    outputListenConnection = expressApp.listen(10581);

    execute(
      parentPath.toString(),
      `if SOUUUUTPUTLOADED then return end;pcall(function()getgenv().SOUUUUTPUTLOADED=true end)local a=game:GetService("LogService")a.MessageOut:Connect(function(b,c)request({Url="http://localhost:10581/synzOutput",Method="POST",Headers={["Content-Type"]="application/json"},Body=game:GetService("HttpService"):JSONEncode({message=b,messageType=c.Value})})end)request({Url="http://localhost:10581/synzOutput",Method="POST",Headers={["Content-Type"]="application/json"},Body=game:GetService("HttpService"):JSONEncode({message=string.format("Receiving messages from %s (%s) as %s",game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name,game.PlaceId,game.Players.LocalPlayer.Name),messageType=1})})`
    );

    outputChannel.show();
  }
}

export function activate(context: ExtensionContext) {
  const executeButton = window.createStatusBarItem(
    StatusBarAlignment.Right,
    999
  );

  executeButton.text = "$(play) Execute";
  executeButton.command = "synz.execute";

  const attachButton = window.createStatusBarItem(
    StatusBarAlignment.Right,
    998
  );

  attachButton.text = "$(debug-disconnect) Attach";
  attachButton.command = "synz.attach";

  const statusBarButton = window.createStatusBarItem(
    StatusBarAlignment.Right,
    997
  );

  statusBarButton.name = "Synapse-Z";
  statusBarButton.text = "$(telescope) SynZ";
  // statusBarButton.text = "$(loading~spin) SynZ";
  statusBarButton.command = "synz.openmenu";
  statusBarButton.show();

  let RobloxOpen: boolean | undefined = undefined;

  new Promise(() => {
    setInterval(async () => {
      let NewRobloxOpenValue: boolean | undefined = undefined;

      // TODO: Re-enable when auto attach works
      // const AutoAttach = workspace.getConfiguration("synz").get("autoAttach");

      const AutomaticallyDetectRobloxProcess = workspace
        .getConfiguration("synz")
        .get("automaticallyDetectRobloxProcess");

      const QuickAccess =
        workspace.getConfiguration("synz").get("quickAccess") === true;

      // TODO: Re-enable when auto attach works
      // if (
      //   workspace.getConfiguration("synz").get("autoAttach") === true &&
      //   AutomaticallyDetectRobloxProcess
      // ) {
      //   statusBarButton.text = "$(telescope) SynZ (Auto Attaching)";
      // } else {
      //   statusBarButton.text = "$(telescope) SynZ";
      // }

      if (AutomaticallyDetectRobloxProcess) {
        NewRobloxOpenValue = await getRobloxProcesses();
      } else {
        NewRobloxOpenValue = undefined;
      }

      if (NewRobloxOpenValue === false && outputListenConnection) {
        // Close previous output listener
        outputListenConnection.close();
        outputListenConnection = undefined;
      }

      if (NewRobloxOpenValue !== false && QuickAccess) {
        attachButton.show();
        executeButton.show();
      } else {
        attachButton.hide();
        executeButton.hide();
      }

      // TODO: Re-enable when auto attach works
      // if (
      //   AutoAttach &&
      //   AutomaticallyDetectRobloxProcess &&
      //   NewRobloxOpenValue !== RobloxOpen &&
      //   RobloxOpen !== undefined &&
      //   NewRobloxOpenValue !== undefined
      // ) {
      //   commands.executeCommand("synz.attach");
      // }

      RobloxOpen = NewRobloxOpenValue;
    }, 500);
  });

  context.subscriptions.push(
    statusBarButton,
    commands.registerCommand("synz.execute", async () => {
      const textEditor = window.activeTextEditor;
      const parentPath = context.globalState.get("synzLoaderParent");

      if (textEditor && textEditor.document.getText()) {
        const FileName = textEditor.document.fileName;
        const Text = textEditor.document.getText();

        if (!parentPath) {
          window
            .showErrorMessage(
              "You must provide a loader file for synz",
              "Select Loader File"
            )
            .then((selection) => {
              if (selection === "Select Loader File") {
                showFileSelect(context).catch(console.error);
              }
            });
          return;
        }

        if (execute(parentPath.toString(), Text)) {
          window.withProgress(
            { location: ProgressLocation.Notification },
            async (progress) => {
              let progressAmount = 0;
              while (progressAmount < 100) {
                progressAmount += 1;

                progress.report({
                  increment: 1,
                  message: "Successfully executed " + FileName,
                });

                await delay(15);
              }
            }
          );
        }
      } else {
        window.showErrorMessage("You must have a script open to execute!");
      }
    }),
    commands.registerCommand("synz.attach", async () => {
      const parentPath = context.globalState.get("synzLoaderParent");

      window.withProgress(
        { location: ProgressLocation.Notification },
        async (progress) => {
          // RUN LOADER
          animateProgress(progress, 10, "Finding the loader file");

          let ErrorMessage = "";

          await new Promise<void>(async (resolve, reject) => {
            if (!parentPath) {
              ErrorMessage = "You must provide a loader file for synz";
              return resolve();
            }

            const launcherFile = findLauncher(parentPath.toString());

            if (!launcherFile) {
              ErrorMessage =
                "We were unable to find a synz loader file in " +
                parentPath +
                ". Try selecting a different loader file.";
              return resolve();
            }

            // INJECT
            animateProgress(progress, 80, "Injecting into Roblox");

            const InjectionStatus = await startProcess(
              launcherFile,
              parentPath.toString()
            );

            if (InjectionStatus !== true) {
              ErrorMessage =
                "The loader crashed while injecting. Please try again. Error Code: " +
                InjectionStatus;
              return resolve();
            }

            setupOutputListener(parentPath.toString());

            const textEditor = window.activeTextEditor;

            if (textEditor && textEditor.document.getText()) {
              const FileName = textEditor.document.fileName;
              const Text = textEditor.document.getText();

              window
                .showInformationMessage(
                  "We injected successfully! You can execute using the button below or the status bar button.",
                  "Execute " + FileName,
                  "Hide"
                )
                .then((selection) => {
                  if (selection === "Execute " + FileName) {
                    if (execute(parentPath.toString(), Text)) {
                      window.showInformationMessage(
                        "Successfully executed " + FileName
                      );
                    }
                  }
                });

              return resolve();
            } else {
              window.showInformationMessage(
                "We injected successfully! You can execute with the status bar button below."
              );

              return resolve();
            }
          });

          // FINISH
          progress.report({
            increment: 100 - previousProgress,
            message: "",
          });

          if (ErrorMessage) {
            window
              .showErrorMessage(ErrorMessage, "Select Loader File")
              .then((selection) => {
                if (selection === "Select Loader File") {
                  showFileSelect(context).catch(console.error);
                }
              });
          }
        }
      );
    }),
    commands.registerCommand("synz.openmenu", async () => {
      const quickPick = window.createQuickPick();
      const parentPath = context.globalState.get("synzLoaderParent");

      const items: QuickPickItem[] = [
        {
          iconPath: parentPath ? new ThemeIcon("pass") : new ThemeIcon("error"),
          label: "Loader",
          description: parentPath
            ? parentPath.toString()
            : "File not specified",
          detail: parentPath ? "" : "Click here to choose the synz loader file",
        },
      ];

      if (parentPath) {
        items.push({
          iconPath: new ThemeIcon("settings"),
          label: "Settings",
        });

        if (RobloxOpen !== false) {
          items.push(
            {
              iconPath: new ThemeIcon("file-code"),
              label: "Scripts",
            },
            {
              label: "Executor Functions",
              kind: QuickPickItemKind.Separator,
            },
            {
              iconPath: new ThemeIcon("debug-disconnect"),
              label: "Attach",
            },
            {
              iconPath: new ThemeIcon("play"),
              label: "Execute",
            }
          );
        }
      }

      quickPick.title = "Synapse-Z";
      quickPick.items = items;

      quickPick.onDidChangeSelection((selection) => {
        if (selection[0].label === "Loader") {
          showFileSelect(context).catch(console.error);
        } else if (selection[0].label === "Settings") {
          commands.executeCommand("workbench.action.openSettings", "Synapse Z");
        } else if (selection[0].label === "Scripts") {
          showScriptSelector(context);
        } else if (selection[0].label === "Attach") {
          quickPick.hide();
          commands.executeCommand("synz.attach");
        } else if (selection[0].label === "Execute") {
          quickPick.hide();
          commands.executeCommand("synz.execute");
        }
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );
}
