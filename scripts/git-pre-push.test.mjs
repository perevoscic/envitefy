import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
const guard = path.join(sourceRoot, "scripts/git-pre-push.mjs");
// Keep fixture Git metadata inside the ignored workspace, including sandboxed
// Windows runs where child Git processes cannot write the system temp folder.
const fixtureRoot = path.join(sourceRoot, "output/git-hooks-tests");

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_CEILING_DIRECTORIES: fixtureRoot, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null" } });
}
function git(cwd, ...args) {
  const result = run("git", args, cwd);
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function fixture(t, initialize = true) {
  mkdirSync(fixtureRoot, { recursive: true });
  const temporaryRoot = mkdtempSync(path.join(fixtureRoot, "envitefy-git-hooks-"));
  const repository = path.join(temporaryRoot, "repo with spaces");
  mkdirSync(path.join(repository, "scripts"), { recursive: true });
  mkdirSync(path.join(repository, ".githooks"));
  for (const name of ["git-pre-push.mjs", "install-git-hooks.mjs"]) copyFileSync(path.join(sourceRoot, "scripts", name), path.join(repository, "scripts", name));
  copyFileSync(path.join(sourceRoot, ".githooks/pre-push"), path.join(repository, ".githooks/pre-push"));
  chmodSync(path.join(repository, ".githooks/pre-push"), 0o755);
  writeFileSync(path.join(repository, "tracked.txt"), "committed\n");
  writeFileSync(path.join(repository, ".gitignore"), "ignored.txt\n");
  t.after(() => {
    // Only remove the exact mkdtemp workspace created by this fixture.
    assert.equal(path.dirname(temporaryRoot), path.resolve(fixtureRoot));
    assert.ok(path.basename(temporaryRoot).startsWith("envitefy-git-hooks-"));
    rmSync(temporaryRoot, { recursive: true, force: true });
  });
  if (initialize) {
    git(repository, "init", "--quiet");
    git(repository, "add", ".");
    git(repository, "-c", "user.name=Hook Test", "-c", "user.email=hook@example.test", "commit", "--quiet", "-m", "Fixture");
  }
  return { repository, temporaryRoot };
}
function check(repository) {
  const beforeIndex = readFileSync(path.join(repository, ".git/index"));
  const beforeStatus = git(repository, "--no-optional-locks", "status", "--porcelain=v1", "-z", "--untracked-files=all");
  const result = run(process.execPath, [guard], repository);
  assert.deepEqual(readFileSync(path.join(repository, ".git/index")), beforeIndex, "guard must not change the index");
  assert.equal(git(repository, "--no-optional-locks", "status", "--porcelain=v1", "-z", "--untracked-files=all"), beforeStatus, "guard must not change the checkout");
  return result;
}
function install(repository) {
  return run(process.execPath, [path.join(repository, "scripts/install-git-hooks.mjs")], repository);
}

test("pre-push allows a clean checkout", (t) => {
  const { repository } = fixture(t);
  const result = check(repository);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
});

test("pre-push refuses unstaged changes and lists the path", (t) => {
  const { repository } = fixture(t);
  writeFileSync(path.join(repository, "tracked.txt"), "unsaved work\n");
  const result = check(repository);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[unstaged M\] "tracked\.txt"/);
  assert.equal(readFileSync(path.join(repository, "tracked.txt"), "utf8"), "unsaved work\n");
});

test("pre-push refuses staged changes", (t) => {
  const { repository } = fixture(t);
  writeFileSync(path.join(repository, "tracked.txt"), "staged work\n");
  git(repository, "add", "tracked.txt");
  const result = check(repository);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[staged M\] "tracked\.txt"/);
});

test("pre-push lists staged and unstaged work on the same path", (t) => {
  const { repository } = fixture(t);
  writeFileSync(path.join(repository, "tracked.txt"), "staged\n");
  git(repository, "add", "tracked.txt");
  writeFileSync(path.join(repository, "tracked.txt"), "later edits\n");
  const result = check(repository);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[staged M, unstaged M\] "tracked\.txt"/);
});

test("pre-push refuses untracked Unicode paths containing spaces", (t) => {
  const { repository } = fixture(t);
  writeFileSync(path.join(repository, "notes ü draft.md"), "new work\n");
  const result = check(repository);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[untracked\] "notes ü draft\.md"/);
});

test("pre-push allows ignored local output", (t) => {
  const { repository } = fixture(t);
  writeFileSync(path.join(repository, "ignored.txt"), "local output\n");
  assert.equal(check(repository).status, 0);
  assert.equal(readFileSync(path.join(repository, "ignored.txt"), "utf8"), "local output\n");
});

test("pre-push consumes both records of a staged rename", (t) => {
  const { repository } = fixture(t);
  git(repository, "mv", "tracked.txt", "renamed file.txt");
  const result = check(repository);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[staged R\] "tracked\.txt" -> "renamed file\.txt"/);
  assert.equal(result.stderr.split("\n").filter((line) => line.startsWith("  - ")).length, 1);
});

test("pre-push fails closed outside a Git checkout", (t) => {
  const { repository } = fixture(t, false);
  const result = run(process.execPath, [guard], repository);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /could not inspect this checkout/);
});

test("installer skips source archives without a .git checkout", (t) => {
  const { repository } = fixture(t, false);
  const result = install(repository);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no \.git checkout/);
  assert.equal(existsSync(path.join(repository, ".git")), false);
});

test("installer configures only the local versioned hooks path and is repeatable", (t) => {
  const { repository } = fixture(t);
  assert.equal(install(repository).status, 0);
  assert.equal(git(repository, "config", "--local", "--get", "core.hooksPath"), ".githooks");
  const beforeConfig = readFileSync(path.join(repository, ".git/config"));
  assert.equal(install(repository).status, 0);
  assert.deepEqual(readFileSync(path.join(repository, ".git/config")), beforeConfig);
});

test("installer preserves an existing custom hook manager", (t) => {
  const { repository } = fixture(t);
  git(repository, "config", "--local", "core.hooksPath", "my custom hooks");
  const beforeConfig = readFileSync(path.join(repository, ".git/config"));
  const result = install(repository);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Git hooks preserved/);
  assert.deepEqual(readFileSync(path.join(repository, ".git/config")), beforeConfig);
});

test("installer preserves an explicitly disabled hooks path", (t) => {
  const { repository } = fixture(t);
  git(repository, "config", "--local", "core.hooksPath", "");
  const beforeConfig = readFileSync(path.join(repository, ".git/config"));
  const result = install(repository);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Git hooks preserved/);
  assert.deepEqual(readFileSync(path.join(repository, ".git/config")), beforeConfig);
});

test("Git invokes the versioned shell hook from a checkout path containing spaces", (t) => {
  const { repository } = fixture(t);
  assert.equal(install(repository).status, 0);
  const clean = run("git", ["hook", "run", "pre-push"], repository);
  assert.equal(clean.status, 0, clean.stderr);
  writeFileSync(path.join(repository, "tracked.txt"), "leftover work\n");
  const dirty = run("git", ["hook", "run", "pre-push"], repository);
  assert.equal(dirty.status, 1);
  assert.match(dirty.stderr, /\[unstaged M\] "tracked\.txt"/);
});

test("installer supports a .git file in a linked worktree", (t) => {
  const { repository, temporaryRoot } = fixture(t);
  const worktree = path.join(temporaryRoot, "linked worktree");
  git(repository, "worktree", "add", "--quiet", "--detach", worktree, "HEAD");
  assert.match(readFileSync(path.join(worktree, ".git"), "utf8"), /^gitdir:/);
  const result = install(worktree);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(worktree, "config", "--local", "--get", "core.hooksPath"), ".githooks");
});
