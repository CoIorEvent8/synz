import fs from "fs";
import path from "path";
import { exec, spawn } from "child_process";

function randomString(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getRobloxProcesses() {
  return new Promise<boolean>((resolve, reject) => {
    exec("tasklist", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing tasklist: ${error}`);
        return resolve(false);
      }

      if (stderr) {
        console.error(`Error output from tasklist: ${stderr}`);
        return resolve(false);
      }

      return resolve(stdout.toLowerCase().includes("robloxplayerbeta.exe"));
    });
  });
}

export function execute(parentPath: string, script: string) {
  const binPath = path.join(parentPath, "bin");
  const schedulerPath = path.join(binPath, "scheduler");

  const randomFileName = randomString(10) + ".lua";
  const filePath = path.join(schedulerPath, randomFileName);

  try {
    fs.writeFileSync(filePath, script + "@@FileFullyWritten@@");
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return false;
  }

  return true;
}

export function startProcess(launcherPath: string, parentPath: string) {
  return new Promise((resolve, reject) => {
    const process = spawn(launcherPath, { shell: true, cwd: parentPath });

    process.on("error", (error) => {
      console.error(`Error: ${error.message}`);
      resolve(error);
    });

    process.on("close", (code) => {
      resolve(code === 0 ? true : code);
    });
  });
}

export function findLauncher(folderPath: string) {
  const files = fs.readdirSync(folderPath);

  // useful if the user wants to use a custom shortcut (e.g. not being asked for uac)
  if (files.includes("customloader.lnk")) {
    return path.join(folderPath, "customloader.lnk");
  }

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    // Check if the current path is a file
    if (fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, "utf8");

      if (
        content.includes(".grh0") &&
        content.includes(".grh1") &&
        content.includes(".grh2")
      ) {
        return filePath;
      }
    }
  }

  return "";
}
