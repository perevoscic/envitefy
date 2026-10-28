import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

export const REQUIRED_PUSH_CHECKS = Object.freeze([
  "test:git-hooks", "typecheck", "test:create-remediation", "test:create-browser",
]);
const TIMEOUTS = Object.freeze({
  "test:git-hooks": 300000, typecheck: 300000,
  "test:create-remediation": 1200000, "test:create-browser": 1800000,
});
const GIT_CONTEXT = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_PREFIX", "GIT_CONFIG", "GIT_CONFIG_PARAMETERS", "GIT_CONFIG_COUNT", "GIT_GRAFT_FILE", "GIT_SHALLOW_FILE", "GIT_NAMESPACE"];
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function cleanGitEnvironment(env = process.env) {
  const result = { ...env };
  for (const key of GIT_CONTEXT) delete result[key];
  for (const key of Object.keys(result)) if (/^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(key)) delete result[key];
  return result;
}

function git(root, args) {
  const result = spawnSync("git", ["--no-optional-locks", ...args], {
    cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true,
    env: cleanGitEnvironment(),
  });
  if (result.error || result.status !== 0) throw new Error(`Git inspection failed: ${result.error?.message || result.stderr?.trim() || result.status}`);
  return result.stdout.trim();
}

const CI_SETUP_COMMANDS = new Set([
  "npm ci",
  "bun --version",
  "npx playwright install --with-deps --only-shell chromium",
  'if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then\nsudo apt-get update\nsudo apt-get install --yes --no-install-recommends ffmpeg\nfi\nffmpeg -version\nffprobe -version',
]);

export function workflowRunCommands(workflow) {
  const lines = workflow.replaceAll("\r\n", "\n").split("\n");
  const commands = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^(\s*)(?:-\s*)?run:\s*(.*)$/);
    if (!match) continue;
    const fieldIndent = match[1].length + (/^\s*-\s+run:/.test(lines[index]) ? 2 : 0);
    let command = match[2].trim();
    if (/^\|[-+]?$/.test(command)) {
      const block = [];
      while (index + 1 < lines.length) {
        const next = lines[index + 1];
        if (next.trim() && next.match(/^\s*/)[0].length <= fieldIndent) break;
        index++;
        if (next.trim()) block.push(next.trim());
      }
      command = block.join("\n");
    } else if ((command.startsWith('"') && command.endsWith('"')) || (command.startsWith("'") && command.endsWith("'"))) {
      command = command.slice(1, -1);
    }
    commands.push(command);
  }
  return commands;
}

export function readValidationPolicy(root) {
  const packageText = readFileSync(path.join(root, "package.json"), "utf8");
  const workflow = readFileSync(path.join(root, ".github/workflows/create-fact-integrity.yml"), "utf8");
  const ciChecks = [];
  for (const command of workflowRunCommands(workflow)) {
    const check = command.match(/^npm run ([\w:-]+)$/);
    if (check) ciChecks.push(check[1]);
    else if (!CI_SETUP_COMMANDS.has(command)) {
      throw new Error(`Unrecognized CI run command: ${JSON.stringify(command)}. Add its validation to the shared push policy before pushing.`);
    }
  }
  if (JSON.stringify(ciChecks) !== JSON.stringify(REQUIRED_PUSH_CHECKS)) {
    throw new Error(`Push validation does not match Create event fact integrity CI. CI runs: ${ciChecks.join(", ")}. Update the required checks and their regression test before pushing.`);
  }
  const { scripts = {} } = JSON.parse(packageText);
  for (const name of REQUIRED_PUSH_CHECKS) if (typeof scripts[name] !== "string" || !scripts[name].trim()) throw new Error(`Missing npm script: ${name}`);
  const lock = readFileSync(path.join(root, "package-lock.json"), "utf8");
  const localConfiguration = readdirSync(root).filter((name) => /^\.env(?:\.|$)/.test(name))
    .sort().map((name) => [name, readFileSync(path.join(root, name), "utf8")]);
  return {
    checks: REQUIRED_PUSH_CHECKS.map((name) => ({ name, script: scripts[name], timeoutMs: TIMEOUTS[name] })),
    configHash: digest({ packageText, workflow, lock, localConfiguration }),
  };
}

export function readCandidateSnapshot(root) {
  const status = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none"]);
  if (status) throw new Error("Push validation requires a clean committed checkout. Commit the intended changes, then run npm run validate:push. No files were stashed, reset or deleted.");
  return { head: git(root, ["rev-parse", "HEAD"]), tree: git(root, ["rev-parse", "HEAD^{tree}"]) };
}

export function parsePushUpdates(input) {
  const updates = [];
  for (const line of input.split(/\r?\n/).filter(Boolean)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4 || !/^(?:[\da-f]{40}|[\da-f]{64})$/i.test(fields[1]) || !/^(?:[\da-f]{40}|[\da-f]{64})$/i.test(fields[3])) {
      throw new Error("Cannot validate malformed Git pre-push ref data; push was stopped.");
    }
    const [localRef, localSha, remoteRef, remoteSha] = fields;
    if (!/^0+$/.test(localSha)) updates.push({ localRef, localSha, remoteRef, remoteSha });
  }
  return updates;
}

export function assertPushCandidate(root, updates, snapshot) {
  for (const update of updates) {
    const commit = git(root, ["rev-parse", "--verify", `${update.localSha}^{commit}`]);
    if (commit !== snapshot.head) throw new Error(`Push blocked: ${update.localRef} → ${update.remoteRef} is not the checked-out commit. Check out ${commit}, validate it, then retry that push.`);
  }
}

export function npmInvocation(args, env = process.env) {
  // npm sets this for the explicit validation command; the Git hook does not.
  if (env.npm_execpath && /npm-cli\.js$/i.test(env.npm_execpath) && existsSync(env.npm_execpath)) return { command: process.execPath, args: [env.npm_execpath, ...args] };
  if (process.platform === "win32") {
    // These arguments are only our fixed npm verbs/check names, never ref data.
    if (args.some((arg) => !/^[\w:-]+$/.test(arg))) throw new Error("Unsafe npm validation argument");
    return { command: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", `npm ${args.join(" ")}`] };
  }
  return { command: "npm", args };
}

export function versionToolInvocation(command, args, platform = process.platform) {
  if (platform === "win32" && ["bun", "ffmpeg", "ffprobe"].includes(command)) {
    // Windows npm installs Bun as a .cmd shim, which cannot be execFile'd.
    if (args.some((arg) => !/^[\w-]+$/.test(arg))) throw new Error("Unsafe version probe argument");
    return { command: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", `${command} ${args.join(" ")}`] };
  }
  return { command, args };
}

function probe(command, args) {
  const invocation = versionToolInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, { encoding: "utf8", windowsHide: true, timeout: 15000, maxBuffer: 256 * 1024, env: cleanGitEnvironment() });
  if (result.error || result.status !== 0) throw new Error(`Required runtime failed: ${command} ${args.join(" ")}: ${result.error?.message || result.stderr?.trim() || result.status}`);
  return (result.stdout || result.stderr).trim().split(/\r?\n/)[0];
}

export function validationChromiumPath(root, env = process.env) {
  if (env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const require = createRequire(path.join(root, "package.json"));
  const exported = require("playwright-core/lib/coreBundle").registry;
  const registry = exported.registry || exported;
  if (typeof registry.findExecutable !== "function") throw new Error("Cannot inspect the installed Playwright browser registry; update push validation for this Playwright version.");
  return registry.findExecutable("chromium-headless-shell").executablePath();
}

export function captureValidationRuntime(root) {
  if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error(`CI requires Node 24; current Node is ${process.versions.node}`);
  const npm = npmInvocation(["--version"]);
  const require = createRequire(path.join(root, "package.json"));
  const packages = Object.fromEntries(["playwright", "typescript"].map((name) => [name, require(`${name}/package.json`).version]));
  const browser = validationChromiumPath(root);
  if (!browser || !existsSync(browser)) throw new Error("Required Chromium is missing. Install it with npx playwright install --with-deps --only-shell chromium.");
  const browserFile = statSync(browser);
  if (!browserFile.isFile()) throw new Error(`Chromium executable is not a file: ${browser}`);
  const installedLock = path.join(root, "node_modules/.package-lock.json");
  return {
    node: process.versions.node, nodePath: process.execPath, platform: process.platform, arch: process.arch,
    npm: probe(npm.command, npm.args), bun: probe("bun", ["--version"]),
    ffmpeg: probe("ffmpeg", ["-version"]), ffprobe: probe("ffprobe", ["-version"]), packages,
    chromium: { path: browser, size: browserFile.size, mtimeMs: browserFile.mtimeMs },
    installedDependencies: existsSync(installedLock) ? digest(readFileSync(installedLock, "utf8")) : null,
    environment: Object.fromEntries(["NODE_OPTIONS", "NODE_ENV", "CI", "PLAYWRIGHT_CHROMIUM_EXECUTABLE", "PLAYWRIGHT_BROWSERS_PATH", "FFMPEG_PATH", "FFPROBE_PATH"].map((name) => [name, process.env[name] || ""])),
  };
}

function privateDirectory(root) {
  return path.join(git(root, ["rev-parse", "--absolute-git-dir"]), "envitefy-push-validation");
}

export function receiptMatches(receipt, candidate) {
  return receipt?.version === 1 && receipt.status === "passed" && receipt.fingerprint === candidate.fingerprint
    && receipt.validationDay === candidate.validationDay
    && JSON.stringify(receipt.snapshot) === JSON.stringify(candidate.snapshot)
    && JSON.stringify(receipt.runtime) === JSON.stringify(candidate.runtime)
    && receipt.checks?.length === candidate.policy.checks.length
    && candidate.policy.checks.every((check, index) => {
      const proof = receipt.checks[index];
      return proof.name === check.name && proof.script === check.script && proof.exitCode === 0 && proof.completed === true
        && proof.timedOut === false && !proof.skipped && !proof.signal && !proof.error;
    });
}

export function runValidationCheck(check, { root, logPath, signal }) {
  const invocation = npmInvocation(["run", check.name]);
  return new Promise((resolve) => {
    const log = createWriteStream(logPath);
    const started = Date.now();
    const child = spawn(invocation.command, invocation.args, {
      cwd: root, env: cleanGitEnvironment(), windowsHide: true, detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let timedOut = false;
    let launchError;
    let terminated = false;
    const terminate = () => {
      if (!child.pid || terminated) return;
      terminated = true;
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      else { try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); } }
    };
    const abort = () => { launchError = "Push validation interrupted"; terminate(); };
    const write = (chunk, stream) => { stream.write(chunk); log.write(chunk); };
    child.stdout.on("data", (chunk) => write(chunk, process.stdout));
    child.stderr.on("data", (chunk) => write(chunk, process.stderr));
    child.on("error", (error) => { launchError = error.message; });
    log.on("error", (error) => { launchError = `Cannot write validation log: ${error.message}`; terminate(); });
    const timeout = setTimeout(() => {
      timedOut = true;
      terminate();
    }, check.timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    child.on("close", (code, exitSignal) => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      const finish = () => resolve({ exitCode: code, signal: exitSignal, timedOut,
        completed: !launchError && !exitSignal && !timedOut, error: launchError, durationMs: Date.now() - started, logPath });
      if (log.destroyed) finish();
      else log.end((error) => { if (error) launchError = `Cannot write validation log: ${error.message}`; finish(); });
    });
  });
}

export async function validatePush({ root = process.cwd(), updates = [], force = false,
  snapshot = readCandidateSnapshot, policy = readValidationPolicy, runtime = captureValidationRuntime,
  execute = runValidationCheck, storageDirectory, report = console.log, signal, now = () => new Date(),
} = {}) {
  const initial = snapshot(root);
  assertPushCandidate(root, updates, initial);
  const directory = storageDirectory || privateDirectory(root);
  const receiptPath = path.join(directory, "receipt.json");
  // A requested fresh attempt must revoke old proof even if preflight fails.
  if (force) await rm(receiptPath, { force: true });
  if (signal?.aborted) throw new Error("Push validation interrupted");
  const required = policy(root);
  const runtimes = runtime(root);
  const validationDay = new Date(now()).toISOString().slice(0, 10);
  const candidate = { snapshot: initial, policy: required, runtime: runtimes, validationDay };
  candidate.fingerprint = digest(candidate);
  const assertUnchanged = () => {
    if (signal?.aborted) throw new Error("Push validation interrupted");
    if (new Date(now()).toISOString().slice(0, 10) !== validationDay) throw new Error("UTC validation day changed; validate the current candidate again.");
    if (JSON.stringify(snapshot(root)) !== JSON.stringify(initial)) throw new Error("The checkout or HEAD changed during push validation. Validate the final committed candidate again.");
  };
  let previous;
  try { previous = JSON.parse(await readFile(receiptPath, "utf8")); } catch { /* Missing/corrupt proof requires real validation. */ }
  if (!force && receiptMatches(previous, candidate)) {
    assertUnchanged();
    report(`Push validation already passed for ${initial.head.slice(0, 12)} (${initial.tree.slice(0, 12)}).`);
    return previous;
  }
  await mkdir(directory, { recursive: true });
  // Invalidate any previous proof before starting a fresh attempt.
  await rm(receiptPath, { force: true });
  const runDirectory = path.join(directory, new Date().toISOString().replaceAll(":", "-"));
  await mkdir(runDirectory, { recursive: true });
  const evidence = { version: 1, status: "running", fingerprint: candidate.fingerprint, snapshot: initial, runtime: runtimes, validationDay, checks: [], startedAt: new Date().toISOString() };
  const evidencePath = path.join(runDirectory, "result.json");
  try {
    for (const check of required.checks) {
      assertUnchanged();
      report(`Push validation: npm run ${check.name} (timeout ${check.timeoutMs / 1000}s)`);
      const result = await execute(check, { root, logPath: path.join(runDirectory, `${check.name.replaceAll(":", "-")}.log`), signal });
      evidence.checks.push({ name: check.name, script: check.script, ...result });
      await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
      if (result.exitCode !== 0 || result.completed !== true || result.timedOut !== false || result.skipped || result.signal || result.error) throw new Error(`npm run ${check.name} ${result.timedOut ? `timed out after ${check.timeoutMs / 1000}s` : `did not pass (exit ${result.exitCode ?? "unknown"})`}. Log: ${result.logPath || runDirectory}`);
      assertUnchanged();
    }
    if (digest(runtime(root)) !== digest(runtimes) || digest(policy(root)) !== digest(required)) throw new Error("Validation tools or CI policy changed during the run; validate again.");
    assertUnchanged();
    evidence.status = "passed";
    evidence.finishedAt = new Date().toISOString();
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    const temporary = path.join(directory, "receipt.json.tmp");
    await writeFile(temporary, `${JSON.stringify(evidence, null, 2)}\n`);
    await rename(temporary, receiptPath);
    assertUnchanged();
    report(`Push validation passed for ${initial.head.slice(0, 12)}. Evidence: ${evidencePath}`);
    return evidence;
  } catch (error) {
    await rm(receiptPath, { force: true });
    evidence.status = "failed";
    evidence.error = error.message;
    evidence.finishedAt = new Date().toISOString();
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    throw error;
  }
}

export function validationInterrupts() {
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  return { signal: controller.signal, dispose: () => { process.off("SIGINT", abort); process.off("SIGTERM", abort); } };
}
