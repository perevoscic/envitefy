import { spawnSync } from "node:child_process";

// -z preserves spaces and Unicode paths. Disable optional index refresh writes:
// this guard inspects the checkout and never changes its files or Git state.
const result = spawnSync("git", [
  "--no-optional-locks",
  "-c", "core.quotepath=false",
  "status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none",
], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true });

if (result.error || result.status !== 0) {
  console.error("Push blocked: Git could not inspect this checkout.");
  console.error(result.error?.message || result.stderr?.trim() || `Git exited with status ${result.status}.`);
  console.error("Run git status in the repository, resolve the inspection error, then retry git push.");
  process.exit(1);
}

const records = result.stdout.split("\0");
const changes = [];
for (let index = 0; index < records.length; index += 1) {
  const record = records[index];
  if (!record) continue;
  const status = record.slice(0, 2);
  const path = record.slice(3);
  const originalPath = /[RC]/.test(status) ? records[++index] : undefined;
  const kinds = status === "??"
    ? ["untracked"]
    : [status[0] !== " " ? `staged ${status[0]}` : null, status[1] !== " " ? `unstaged ${status[1]}` : null].filter(Boolean);
  const name = originalPath === undefined
    ? JSON.stringify(path)
    : `${JSON.stringify(originalPath)} -> ${JSON.stringify(path)}`;
  changes.push(`  - [${kinds.join(", ")}] ${name}`);
}

if (changes.length) {
  console.error("Push blocked: this checkout contains changes outside the commits being pushed.");
  console.error(changes.join("\n"));
  console.error("Review these paths and commit the intended changes before retrying git push.");
  console.error("Keep unrelated work in a separate worktree. This check does not modify, stash or delete files.");
  process.exit(1);
}
