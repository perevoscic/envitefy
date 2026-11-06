import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { cleanGitEnvironment, parsePushUpdates, readCandidateSnapshot, readValidationPolicy, REQUIRED_PUSH_CHECKS, runValidationCheck, validatePush, validationChromiumPath, versionToolInvocation, workflowRunCommands } from "./lib/push-validation.mjs";

const root = path.resolve(import.meta.dirname, "..");
const fixtureRoot = path.join(root, "output/push-validation-tests");

test("browser metadata resolves through the installed Playwright API even before CI downloads Chromium", () => {
  assert.match(validationChromiumPath(root, {}), /chromium.*headless|headless.*chromium/i);
  assert.equal(validationChromiumPath(root, { PLAYWRIGHT_CHROMIUM_EXECUTABLE: "/custom/browser" }), "/custom/browser");
});

test("version probes support Windows npm shims without exposing shell arguments", () => {
  const windows = versionToolInvocation("bun", ["--version"], "win32");
  assert.equal(windows.args.at(-1), "bun --version");
  assert.deepEqual(versionToolInvocation("bun", ["--version"], "linux"), { command: "bun", args: ["--version"] });
  assert.throws(() => versionToolInvocation("bun", ["--version & echo unexpected"], "win32"), /Unsafe/);
});
function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true, env: {
    ...cleanGitEnvironment(), GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  } });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}
function fixture(t) {
  mkdirSync(fixtureRoot, { recursive: true });
  const directory = mkdtempSync(path.join(fixtureRoot, "candidate-"));
  const repository = path.join(directory, "repo with spaces");
  mkdirSync(path.join(repository, ".github/workflows"), { recursive: true });
  writeFileSync(path.join(repository, "package.json"), JSON.stringify({ scripts: Object.fromEntries(REQUIRED_PUSH_CHECKS.map((name) => [name, `echo ${name}`])) }));
  writeFileSync(path.join(repository, "package-lock.json"), "{}\n");
  writeFileSync(path.join(repository, ".github/workflows/create-fact-integrity.yml"), REQUIRED_PUSH_CHECKS.map((name) => `      - run: npm run ${name}`).join("\n"));
  git(repository, "init", "--quiet");
  git(repository, "config", "user.name", "Push Validation Test");
  git(repository, "config", "user.email", "push-validation@example.test");
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "Candidate");
  t.after(() => {
    assert.equal(path.dirname(directory), fixtureRoot);
    assert.ok(path.basename(directory).startsWith("candidate-"));
    rmSync(directory, { recursive: true, force: true });
  });
  let versions = { node: "24.test", bun: "1.3.11", npm: "11.test" };
  const calls = [];
  const options = {
    root: repository, runtime: () => versions, report: () => {},
    execute: async (check, { logPath }) => {
      calls.push(check.name);
      writeFileSync(logPath, `Passed ${check.name}\n`);
      return { exitCode: 0, completed: true, timedOut: false, logPath };
    },
  };
  const receiptPath = path.join(repository, ".git/envitefy-push-validation/receipt.json");
  return { repository, options, calls, receiptPath, versions: (next) => { versions = next; } };
}

test("push policy is exactly the CI npm check list and fails closed when it drifts", (t) => {
  assert.deepEqual(readValidationPolicy(root).checks.map((check) => check.name), REQUIRED_PUSH_CHECKS);
  const { repository } = fixture(t);
  writeFileSync(path.join(repository, ".github/workflows/create-fact-integrity.yml"), "run: npm run typecheck\n");
  assert.throws(() => readValidationPolicy(repository), /does not match/);
});

test("new direct or multiline CI commands cannot evade the required check policy", (t) => {
  const { repository } = fixture(t);
  const filename = path.join(repository, ".github/workflows/create-fact-integrity.yml");
  const original = readFileSync(filename, "utf8");
  for (const addition of [
    "      - run: node --test extra.test.mjs",
    "      - run: bun test extra.test.ts",
    "      - run: |\n          npm run typecheck\n          node --test extra.test.mjs",
    "      - run: ./scripts/new-check.sh",
  ]) {
    writeFileSync(filename, `${original}\n${addition}\n`);
    assert.throws(() => readValidationPolicy(repository), /Unrecognized CI run command/);
  }
  assert.deepEqual(workflowRunCommands("  - run: |\n      npm run typecheck\n    name: Types\n  - run: bun --version"), ["npm run typecheck", "bun --version"]);
});

test("pre-push ref parsing handles no-ops, deletion, multiple refs and malformed input", () => {
  const a = "a".repeat(40), b = "b".repeat(40), zero = "0".repeat(40);
  assert.deepEqual(parsePushUpdates(""), []);
  assert.deepEqual(parsePushUpdates(`(delete) ${zero} refs/heads/old ${a}\n`), []);
  assert.equal(parsePushUpdates(`refs/heads/main ${a} refs/heads/main ${b}\nrefs/tags/v1 ${a} refs/tags/v1 ${zero}\n`).length, 2);
  for (const input of ["not git ref data", `refs/heads/main nope refs/heads/main ${b}`]) assert.throws(() => parsePushUpdates(input), /malformed/);
});

test("exact clean candidate receipt reuses all four passed checks without changing files or index", async (t) => {
  const { repository, options, calls, receiptPath } = fixture(t);
  const before = readFileSync(path.join(repository, ".git/index"));
  const receipt = await validatePush(options);
  assert.equal(receipt.status, "passed");
  assert.deepEqual(calls, REQUIRED_PUSH_CHECKS);
  assert.equal(receipt.checks.length, 4);
  assert.ok(existsSync(receiptPath));
  await validatePush(options);
  assert.equal(calls.length, 4, "only an identical fully tested candidate is cached");
  assert.deepEqual(readFileSync(path.join(repository, ".git/index")), before);
  assert.equal(git(repository, "status", "--porcelain"), "");
});

test("different HEAD invalidates proof even with an identical tree, and a changed tree also reruns", async (t) => {
  const { repository, options, calls } = fixture(t);
  const first = await validatePush(options);
  git(repository, "commit", "--quiet", "--allow-empty", "-m", "Different commit");
  const second = await validatePush(options);
  assert.equal(first.snapshot.tree, second.snapshot.tree);
  assert.notEqual(first.snapshot.head, second.snapshot.head);
  assert.equal(calls.length, 8);
  writeFileSync(path.join(repository, "source.txt"), "new source\n");
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "Changed tree");
  const third = await validatePush(options);
  assert.notEqual(second.snapshot.tree, third.snapshot.tree);
  assert.equal(calls.length, 12);
});

test("runtime identity and CI command definitions are part of proof", async (t) => {
  const { repository, options, calls, versions } = fixture(t);
  const first = await validatePush(options);
  versions({ node: "24.test", bun: "1.3.12", npm: "11.test" });
  const second = await validatePush(options);
  assert.notEqual(first.fingerprint, second.fingerprint);
  assert.equal(calls.length, 8);
  const filename = path.join(repository, "package.json");
  const data = JSON.parse(readFileSync(filename, "utf8"));
  data.scripts.typecheck = "echo changed implementation";
  writeFileSync(filename, JSON.stringify(data));
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "Changed validation command");
  const third = await validatePush(options);
  assert.equal(third.checks[1].script, "echo changed implementation");
  assert.equal(calls.length, 12);
});

test("failed, skipped, incomplete and timed-out checks invalidate old proof and stop the pipeline", async (t) => {
  for (const result of [
    { exitCode: 1, completed: true, timedOut: false },
    { exitCode: 0, completed: true, timedOut: false, skipped: true },
    { exitCode: 0, completed: false, timedOut: false },
    { exitCode: null, completed: false, timedOut: true },
  ]) {
    const { options, calls, receiptPath } = fixture(t);
    await validatePush(options);
    let invoked = 0;
    await assert.rejects(validatePush({ ...options, force: true, execute: async () => { invoked++; return result; } }), /did not pass|timed out/);
    assert.equal(invoked, 1, "a failed check cannot be skipped while later suites pass");
    assert.equal(existsSync(receiptPath), false);
    await validatePush(options);
    assert.equal(calls.length, 8, "failed proof never permits a later push without revalidation");
  }
});

test("corrupt and partial receipts cannot authorize a push", async (t) => {
  const { options, calls, receiptPath } = fixture(t);
  const valid = await validatePush(options);
  writeFileSync(receiptPath, "not json");
  await validatePush(options);
  assert.equal(calls.length, 8);
  writeFileSync(receiptPath, JSON.stringify({ ...valid, checks: valid.checks.slice(0, 3) }));
  await validatePush(options);
  assert.equal(calls.length, 12);
});

test("cached success rejects skipped, signaled or errored proof records", async (t) => {
  const { options, calls, receiptPath } = fixture(t);
  let valid = await validatePush(options);
  for (const marker of [{ skipped: true }, { signal: "SIGTERM" }, { error: "check failed" }]) {
    writeFileSync(receiptPath, JSON.stringify({ ...valid, checks: valid.checks.map((check, index) => index ? check : { ...check, ...marker }) }));
    valid = await validatePush(options);
  }
  assert.equal(calls.length, 16, "every invalid proof forces all four real checks again");
});

test("success proof expires when the UTC validation day changes", async (t) => {
  const { options, calls } = fixture(t);
  let clock = "2026-10-28T23:59:00Z";
  const run = () => validatePush({ ...options, now: () => clock });
  await run();
  await run();
  assert.equal(calls.length, 4);
  clock = "2026-10-29T00:01:00Z";
  const next = await run();
  assert.equal(next.validationDay, "2026-10-29");
  assert.equal(calls.length, 8);
});

test("a forced preflight failure revokes existing proof before policy or runtime probes", async (t) => {
  for (const phase of ["runtime", "policy"]) {
    const { options, calls, receiptPath } = fixture(t);
    await validatePush(options);
    await assert.rejects(validatePush({ ...options, force: true,
      [phase]: () => { throw new Error(`${phase} unavailable`); },
    }), /unavailable/);
    assert.equal(existsSync(receiptPath), false);
    await validatePush(options);
    assert.equal(calls.length, 8, "restored tools must run checks instead of reusing revoked success");
  }
});

test("real timed out and interrupted processes clean up the abort listener and never pass", { timeout: 15000 }, async (t) => {
  const { repository } = fixture(t);
  const filename = path.join(repository, "package.json");
  const data = JSON.parse(readFileSync(filename, "utf8"));
  data.scripts.hold = 'node -e "setInterval(()=>{},1000)"';
  writeFileSync(filename, JSON.stringify(data));
  for (const interrupted of [false, true]) {
    const controller = new AbortController();
    const remove = controller.signal.removeEventListener.bind(controller.signal);
    let removed = 0;
    controller.signal.removeEventListener = (...args) => { removed++; return remove(...args); };
    const abort = interrupted ? setTimeout(() => controller.abort(), 1200) : null;
    const result = await runValidationCheck({ name: "hold", timeoutMs: interrupted ? 10000 : 1200 }, {
      root: repository, logPath: path.join(repository, interrupted ? "aborted.log" : "timeout.log"), signal: controller.signal,
    });
    clearTimeout(abort);
    assert.equal(result.completed, false);
    assert.equal(result.timedOut, !interrupted);
    assert.equal(removed, 1, "cleanup uses the AbortSignal rather than the child's exit-signal string");
    if (interrupted) assert.match(result.error, /interrupted/);
  }
});

test("dirty checkout or changed HEAD during validation leaves no success receipt and preserves work", async (t) => {
  for (const changeHead of [false, true]) {
    const { repository, options, receiptPath } = fixture(t);
    const original = options.execute;
    await assert.rejects(validatePush({ ...options, execute: async (...args) => {
      const result = await original(...args);
      if (changeHead) git(repository, "commit", "--quiet", "--allow-empty", "-m", "Concurrent commit");
      else writeFileSync(path.join(repository, "unfinished.txt"), "must remain\n");
      return result;
    } }), /clean committed|HEAD changed/);
    assert.equal(existsSync(receiptPath), false);
    if (!changeHead) assert.equal(readFileSync(path.join(repository, "unfinished.txt"), "utf8"), "must remain\n");
  }
});

test("missing runtime fails before running a command or creating proof", async (t) => {
  const { options, calls, receiptPath } = fixture(t);
  await assert.rejects(validatePush({ ...options, runtime: () => { throw new Error("Bun not found"); } }), /Bun not found/);
  assert.equal(calls.length, 0);
  assert.equal(existsSync(receiptPath), false);
});

test("receipt for HEAD cannot authorize another commit, including a mixed multi-ref push", async (t) => {
  const { repository, options, calls } = fixture(t);
  const older = git(repository, "rev-parse", "HEAD");
  git(repository, "commit", "--quiet", "--allow-empty", "-m", "Latest");
  const head = git(repository, "rev-parse", "HEAD");
  await validatePush(options);
  const update = (localSha, localRef = "refs/heads/main") => ({ localSha, localRef, remoteRef: "refs/heads/main" });
  await assert.rejects(validatePush({ ...options, updates: [update(older)] }), /not the checked-out commit/);
  await assert.rejects(validatePush({ ...options, updates: [update(head), update(older, "refs/heads/older")] }), /not the checked-out commit/);
  git(repository, "tag", "-a", "-m", "Annotated HEAD", "v1");
  const tag = git(repository, "rev-parse", "v1");
  await validatePush({ ...options, updates: [update(tag, "refs/tags/v1")] });
  assert.equal(calls.length, 4, "a tag resolving to the tested commit can reuse its proof");
});

test("validation refuses an initially dirty checkout without changing the index", async (t) => {
  const { repository, options, calls } = fixture(t);
  writeFileSync(path.join(repository, "source.txt"), "pending\n");
  const before = readFileSync(path.join(repository, ".git/index"));
  assert.throws(() => readCandidateSnapshot(repository), /clean committed/);
  await assert.rejects(validatePush(options), /clean committed/);
  assert.equal(calls.length, 0);
  assert.deepEqual(readFileSync(path.join(repository, ".git/index")), before);
  assert.equal(readFileSync(path.join(repository, "source.txt"), "utf8"), "pending\n");
});

test("hook-launched fixture environments cannot retain another checkout's Git metadata", () => {
  const original = { PATH: "test", GIT_DIR: "/real/repo/.git", GIT_WORK_TREE: "/real/repo", GIT_INDEX_FILE: "/real/index" };
  assert.deepEqual(cleanGitEnvironment(original), { PATH: "test" });
  assert.equal(original.GIT_DIR, "/real/repo/.git");
});
