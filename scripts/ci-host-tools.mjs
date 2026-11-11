import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { chmodSync, copyFileSync, mkdirSync, appendFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const destination = path.join(os.homedir(), ".local", "bin");
mkdirSync(destination, { recursive: true });

function installBinary(source, name) {
  const target = path.join(destination, name);
  copyFileSync(source, target);
  chmodSync(target, 0o755);
  execFileSync(target, ["-version"], { stdio: "inherit" });
}

const ffmpeg = require("ffmpeg-static");
if (!ffmpeg) throw new Error("ffmpeg-static did not provide a binary. npm ci installs it without apt.");
installBinary(ffmpeg, "ffmpeg");

const ffprobe = execFileSync("npm", [
  "exec", "--yes", "--package=ffprobe-static@3.1.0", "--",
  process.execPath, "-p", "require('ffprobe-static').path",
], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean).at(-1);
installBinary(ffprobe, "ffprobe");

if (process.env.GITHUB_PATH) appendFileSync(process.env.GITHUB_PATH, `${destination}\n`);
