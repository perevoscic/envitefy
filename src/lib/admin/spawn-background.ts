import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

export function spawnBackgroundNodeScript({
  scriptPath,
  args,
  cwd = process.cwd(),
  logFile,
}: {
  scriptPath: string;
  args: string[];
  cwd?: string;
  logFile?: string;
}) {
  let stdio: any = "ignore";

  if (logFile) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    const stream = fs.openSync(logFile, "a");
    stdio = ["ignore", stream, stream];
  }

  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd,
    stdio,
    shell: false,
    detached: true,
    env: process.env,
  });

  child.unref();
  return child.pid ?? null;
}
