import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { chmodSync, copyFileSync, mkdirSync, appendFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export function installHostTools({
  destination = path.join(os.homedir(), ".local", "bin"),
  githubPath = process.env.GITHUB_PATH,
} = {}) {
  mkdirSync(destination, { recursive: true });

  function installBinary(source, name) {
    if (!source) throw new Error(`${name}-static did not provide a binary for this platform.`);
    const target = path.join(destination, `${name}${process.platform === "win32" ? ".exe" : ""}`);
    copyFileSync(source, target);
    chmodSync(target, 0o755);
    // A freshly copied executable can start slowly on Windows; still require
    // the real binary to answer successfully before accepting the installation.
    execFileSync(target, ["-version"], { stdio: "pipe", timeout: process.platform === "win32" ? 60000 : 15000, windowsHide: true });
    console.log(`Verified ${name}: ${target}`);
    return target;
  }

  // Both packages are installed by npm ci from the lockfile. npm exec only adds
  // temporary package binaries to PATH; it does not make their modules requireable.
  const ffmpeg = installBinary(require("ffmpeg-static"), "ffmpeg");
  const ffprobe = installBinary(require("ffprobe-static").path, "ffprobe");

  if (githubPath) appendFileSync(githubPath, `${destination}\n`);
  return { ffmpeg, ffprobe };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) installHostTools();
