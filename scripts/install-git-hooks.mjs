import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const hookDirectory = path.join(projectRoot, ".githooks");
const hookPath = path.join(hookDirectory, "pre-push");

// A checkout can have a .git directory or a linked-worktree .git file. A source
// archive / installed package must not configure an enclosing repository.
if (!existsSync(path.join(projectRoot, ".git"))) {
  console.log("Git hooks skipped: this project has no .git checkout.");
  process.exit(0);
}

function git(args) {
  return spawnSync("git", args, { cwd: projectRoot, encoding: "utf8", windowsHide: true });
}

const configured = git(["config", "--path", "--get", "core.hooksPath"]);
if (configured.error || (configured.status !== 0 && configured.status !== 1)) {
  console.error("Git hook installation failed: could not read core.hooksPath.");
  console.error(configured.error?.message || configured.stderr?.trim());
  process.exit(1);
}

const currentPath = configured.stdout.trim();
const normalizedPath = (value) => {
  const resolved = path.resolve(projectRoot, value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};
if (configured.status === 0 && (!currentPath || normalizedPath(currentPath) !== normalizedPath(hookDirectory))) {
  console.log(`Git hooks preserved: existing core.hooksPath is ${JSON.stringify(currentPath)}.`);
  console.log("Add the Envitefy pre-push check to that hook manager if required; its configuration was not changed.");
  process.exit(0);
}

if (!existsSync(hookPath)) {
  console.error("Git hook installation failed: .githooks/pre-push is missing from this checkout.");
  process.exit(1);
}

// Git for Windows runs the shebang through its bundled sh. Unix checkouts also
// need the executable bit, including copies extracted without Git file modes.
chmodSync(hookPath, statSync(hookPath).mode | 0o111);
if (configured.status === 1) {
  const installed = git(["config", "--local", "core.hooksPath", ".githooks"]);
  if (installed.error || installed.status !== 0) {
    console.error("Git hook installation failed: could not set the repository-local hooks path.");
    console.error(installed.error?.message || installed.stderr?.trim());
    process.exit(1);
  }
}
console.log("Git hooks ready: .githooks/pre-push blocks pushes while this checkout has uncommitted changes.");
