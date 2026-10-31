import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, openSync } from "node:fs";
import { access, lstat, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, redact, runProcess } from "./maestro-core.mjs";

const IMAGE = "system-images;android-34;google_apis_playstore;x86_64";
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const failure = (message, details = {}) => Object.assign(new Error(message), { classification: "tool_failure", ...details });

function commandFailure(result, check, timeoutMs) {
  const detail = redact(result.output || result.spawnError || "").trim().slice(-1500);
  return failure(result.timedOut ? `${check} timed out after ${timeoutMs} ms; its result remains unverified.` : `${check} failed with exit ${result.exitCode}.${detail ? ` ${detail}` : ""}`,
    result.timedOut ? { classification: "timeout", timeoutMs } : {});
}

export function localQaConfig({ root = ROOT, sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.USERPROFILE || "", "AppData/Local/Android/Sdk") } = {}) {
  root = path.resolve(root);
  sdkRoot = path.resolve(sdkRoot);
  const avdHome = path.join(root, ".tools/android/local-qa/avd");
  const avdName = "Envitefy_Local_QA";
  const avdPath = path.join(avdHome, `${avdName}.avd`);
  const outputRoot = path.join(root, "output/maestro/local-qa");
  return {
    root, sdkRoot, avdHome, avdName, avdPath, outputRoot,
    registryPath: path.join(avdHome, `${avdName}.ini`),
    markerPath: path.join(avdPath, ".envitefy-local-qa.json"),
    leasePath: path.join(outputRoot, "running-device.json"),
    fleetLeasePath: path.join(root, "output/maestro/device-fleet/running-device.json"),
    adb: path.join(sdkRoot, "platform-tools/adb.exe"),
    emulator: path.join(sdkRoot, "emulator/emulator.exe"),
    avdmanager: path.join(sdkRoot, "cmdline-tools/latest/bin/avdmanager.bat"),
    imagePath: path.join(sdkRoot, ...IMAGE.split(";"), "package.xml"),
    systemImage: IMAGE, hardwareProfile: "pixel_7", serial: "emulator-5554", port: 5554,
  };
}

function canonical(config) {
  const expected = localQaConfig({ root: config.root, sdkRoot: config.sdkRoot });
  for (const [key, value] of Object.entries(expected))
    if (config[key] !== value) throw new Error(`Dedicated local QA ${key} differs from its isolated mapping.`);
}

async function exists(file) {
  try { await access(file); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function safePath(root, target) {
  let current = path.resolve(target);
  const relative = path.relative(root, current);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Local QA paths must remain inside the workspace.");
  while (current !== root) {
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error("Local QA path contains a symbolic link."); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    current = path.dirname(current);
  }
}

async function readJson(file) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

const ini = (value) => Object.fromEntries(value.split(/\r?\n/).filter((line) => /^\s*[^#;=]+\s*=/.test(line))
  .map((line) => { const at = line.indexOf("="); return [line.slice(0, at).trim(), line.slice(at + 1).trim()]; }));

async function inspectAvd(config, { requireMarker = true } = {}) {
  for (const file of [config.avdPath, config.registryPath, config.markerPath]) await safePath(config.root, file);
  const registered = await exists(config.registryPath);
  const data = await exists(config.avdPath);
  if (!registered && !data) return { present: false, provisioned: false };
  if (!registered || !data) throw new Error("Dedicated local QA AVD has partial registry/data files; they were preserved.");
  const registry = ini(await readFile(config.registryPath, "utf8"));
  if (path.resolve(registry.path || "") !== config.avdPath || registry.target !== "android-34")
    throw new Error("Dedicated local QA AVD registry path or target differs; no data was changed.");
  const configFile = path.join(config.avdPath, "config.ini");
  await safePath(config.root, configFile);
  const values = ini(await readFile(configFile, "utf8"));
  if (values["image.sysdir.1"]?.replaceAll("\\", "/").replace(/\/+$/, "") !== "system-images/android-34/google_apis_playstore/x86_64" ||
      values["abi.type"] !== "x86_64" || values["hw.device.name"] !== config.hardwareProfile)
    throw new Error("Dedicated local QA AVD system image or hardware differs; no data was changed.");
  const marker = await readJson(config.markerPath);
  if (requireMarker && (!marker || marker.kind !== "envitefy-local-android-qa" || marker.avdName !== config.avdName || marker.avdPath !== config.avdPath || marker.systemImage !== config.systemImage))
    throw new Error("Dedicated local QA ownership marker is absent or differs; existing AVD was not adopted.");
  return { present: true, provisioned: Boolean(marker), configFile };
}

export async function checkLocalQaDevice(config = localQaConfig()) {
  canonical(config);
  const tools = Object.fromEntries(await Promise.all(["adb", "emulator", "avdmanager"].map(async (name) => [name, { path: config[name], present: await exists(config[name]) }])));
  const imagePresent = await exists(config.imagePath);
  const issues = Object.entries(tools).filter(([, item]) => !item.present).map(([name]) => `Missing Android SDK tool: ${name}.`);
  if (!imagePresent) issues.push(`Missing Android SDK image: ${config.systemImage}.`);
  let avd = { present: false, provisioned: false };
  try { avd = await inspectAvd(config); }
  catch (error) { issues.push(error.message); }
  if (!avd.present && !issues.some((item) => /AVD|ownership/.test(item))) issues.push("Dedicated local QA AVD is not provisioned.");
  return { ready: issues.length === 0 && avd.provisioned, tools, imagePresent, ...avd, issues, avdName: config.avdName, serial: config.serial };
}

// avdmanager asks about a custom hardware profile. Supply "no" on stdin;
// ordinary ADB commands continue to use the shared bounded process helper.
async function provisionCommand(binary, args, { env, cwd, input, timeoutMs }) {
  if ([binary, ...args].some((value) => /["\r\n%!&|<>^]/.test(String(value)))) throw new Error("Unsafe Windows avdmanager argument.");
  return new Promise((resolve) => {
    const child = spawn("cmd.exe", ["/d", "/s", "/c", `"${[binary, ...args].map((value) => `"${value}"`).join(" ")}"`],
      { cwd, env, windowsHide: true, windowsVerbatimArguments: true, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", timedOut = false, settled = false;
    const finish = (exitCode) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      child.stdout.destroy(); child.stderr.destroy(); child.unref();
      resolve({ exitCode, timedOut, output });
    };
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.stdin.on("error", () => {});
    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid) spawn("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" }).unref();
      child.kill(); finish(null);
    }, timeoutMs);
    child.once("error", (error) => { output += error.message; finish(null); });
    child.once("close", finish);
    child.stdin.end(input);
  });
}

export async function provisionLocalQaDevice(config = localQaConfig(), { run = provisionCommand, now = Date.now } = {}) {
  canonical(config);
  for (const file of [config.adb, config.emulator, config.avdmanager, config.imagePath])
    if (!(await exists(file))) throw new Error(`Required Android SDK file is missing: ${file}`);
  const existing = await inspectAvd(config);
  if (existing.provisioned) return { provisioned: true, created: false, avdName: config.avdName, serial: config.serial };
  await safePath(config.root, config.outputRoot);
  if (await exists(config.leasePath)) throw new Error("An unresolved local QA device lease prevents provisioning.");
  await mkdir(config.avdHome, { recursive: true });
  const result = await run(config.avdmanager, ["create", "avd", "--name", config.avdName, "--package", config.systemImage,
    "--device", config.hardwareProfile, "--path", config.avdPath], {
    cwd: config.root, env: { ...process.env, ANDROID_HOME: config.sdkRoot, ANDROID_SDK_ROOT: config.sdkRoot, ANDROID_AVD_HOME: config.avdHome },
    input: "no\n", timeoutMs: 120000,
  });
  if (result.exitCode !== 0 || result.timedOut)
    throw failure(`Local QA avdmanager ${result.timedOut ? "timed out after 120000 ms" : `failed with exit ${result.exitCode}`}; partial files were preserved. ${result.output?.slice(-2000) || ""}`,
      result.timedOut ? { classification: "timeout", timeoutMs: 120000 } : {});
  const created = await inspectAvd(config, { requireMarker: false });
  if (!created.present) throw new Error("avdmanager returned success without the dedicated AVD registry/data files.");
  await writeFile(config.markerPath, JSON.stringify({ kind: "envitefy-local-android-qa", avdName: config.avdName, avdPath: config.avdPath,
    systemImage: config.systemImage, createdAt: new Date(now()).toISOString() }, null, 2), { flag: "wx" });
  await inspectAvd(config);
  return { provisioned: true, created: true, avdName: config.avdName, serial: config.serial };
}

const psLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;

// Only process metadata and this AVD's match flags leave PowerShell. Commands
// belonging to other emulator sessions may contain private values.
export async function inspectLocalQaProcesses(config, { run = runProcess, timeoutMs = 10000 } = {}) {
  canonical(config);
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$qaAvdName = ${psLiteral(config.avdName)}`,
    `$qaAvdPath = ${psLiteral(config.avdPath)}`,
    `$qaPort = ${config.port}`,
    "$qaProcesses = @(Get-CimInstance -ClassName Win32_Process -Filter \"Name = 'emulator.exe' OR Name LIKE 'qemu-system-%'\" -ErrorAction Stop)",
    "@($qaProcesses | ForEach-Object {",
    "  $qaEntry = $_",
    "  $qaCommand = [string]$qaEntry.CommandLine",
    "  [pscustomobject]@{",
    "    pid = [int]$qaEntry.ProcessId; parentPid = [int]$qaEntry.ParentProcessId; name = [string]$qaEntry.Name",
    "    createdAt = $qaEntry.CreationDate.ToUniversalTime().ToString('o')",
    "    matchesAvd = [bool]($qaCommand -match ('(?:^|\\s)(?:-avd\\s+|@)\"?' + [regex]::Escape($qaAvdName) + '(?:\"|\\s|$)'))",
    "    matchesPath = [bool]($qaCommand -match ([regex]::Escape($qaAvdPath) + '(?:[\\\\/]|[\"\\s]|$)'))",
    "    matchesPort = [bool]($qaCommand -match ('(?:^|\\s)-(?:port|ports|android-ports)\\s+\"?' + $qaPort + '(?:,' + ($qaPort + 1) + ')?(?:\"|\\s|$)'))",
    "  }",
    "}) | ConvertTo-Json -Compress",
  ].join("\n");
  const result = await run("powershell.exe", ["-NoProfile", "-Command", script], { timeoutMs });
  if (result.exitCode !== 0 || result.timedOut) throw commandFailure(result, "PowerShell CIM emulator process inventory", timeoutMs);
  const parsed = result.output.trim() ? JSON.parse(result.output) : [];
  const processes = Array.isArray(parsed) ? parsed : [parsed];
  if (processes.some((item) => !item || !Number.isInteger(item.pid) || item.pid < 1 || !Number.isInteger(item.parentPid) ||
      !/^(?:emulator|qemu-system-[\w-]+)(?:\.exe)?$/i.test(item.name || "") || !Number.isFinite(Date.parse(item.createdAt)) ||
      ["matchesAvd", "matchesPath", "matchesPort"].some((key) => typeof item[key] !== "boolean")))
    throw failure("PowerShell CIM emulator process inventory returned incomplete process identity metadata.");
  return processes;
}

// PID alone is insufficient after a process exits. Retained family entries are
// matched by both PID and creation time, while new descendants must be younger
// than the launch that established ownership.
export function selectLocalQaProcesses(processes, { pid, startedAt, ownedProcesses = [] } = {}) {
  const started = Date.parse(startedAt);
  const recent = (item) => Number.isFinite(started) && Date.parse(item.createdAt) >= started - 1000;
  const initialRoot = (item) => ownedProcesses.length === 0 && item.pid === pid && recent(item) && Date.parse(item.createdAt) <= started + 5000;
  const sameProcess = (a, b) => a.pid === b.pid && Date.parse(a.createdAt) === Date.parse(b.createdAt);
  const selected = processes.filter((item) => item.matchesAvd || item.matchesPath || item.matchesPort ||
    ownedProcesses.some((owned) => sameProcess(owned, item)) || initialRoot(item));
  for (;;) {
    const children = processes.filter((item) => !selected.includes(item) && recent(item) &&
      selected.some((parent) => parent.pid === item.parentPid && Date.parse(item.createdAt) >= Date.parse(parent.createdAt)));
    if (!children.length) return selected;
    selected.push(...children);
  }
}

function rememberProcesses(state, processes) {
  const known = new Map((state.ownedProcesses || []).map((item) => [`${item.pid}:${Date.parse(item.createdAt)}`, item]));
  for (const item of processes) known.set(`${item.pid}:${Date.parse(item.createdAt)}`, item);
  state.ownedProcesses = [...known.values()];
}

async function inventory(config, run, timeoutMs = 10000) {
  const result = await run(config.adb, ["devices", "-l"], { timeoutMs });
  if (result.exitCode !== 0 || result.timedOut) throw commandFailure(result, "ADB device inventory (adb devices -l)", timeoutMs);
  return result.output.split(/\r?\n/).map((line) => line.match(/^(emulator-\d+)\s+(\S+)/)).filter(Boolean).map((match) => ({ serial: match[1], status: match[2] }));
}

async function verifyIdentity(config, run, timeoutMs = 10000) {
  const result = await run(config.adb, ["-s", config.serial, "emu", "avd", "name"], { timeoutMs });
  if (result.exitCode !== 0 || result.timedOut) throw commandFailure(result, `ADB AVD identity check (${config.serial})`, timeoutMs);
  if (!result.output.split(/\r?\n/).map((line) => line.trim()).includes(config.avdName))
    throw new Error("Connected serial does not match the dedicated local QA AVD; no device mutation was requested.");
}

async function prepareArtifacts(config, artifactDir) {
  if (!artifactDir) throw new Error("A local QA artifact directory is required.");
  const resolved = path.resolve(artifactDir);
  await safePath(config.root, resolved);
  await safePath(config.root, config.leasePath);
  await mkdir(resolved, { recursive: true });
  await mkdir(config.outputRoot, { recursive: true });
  return resolved;
}

export async function startLocalQaDevice(config = localQaConfig(), { artifactDir, bootTimeoutMs = 180000,
  run = runProcess, spawnProcess = spawn, now = Date.now, sleep = delay } = {}) {
  canonical(config);
  if (!Number.isInteger(bootTimeoutMs) || bootTimeoutMs < 1000 || bootTimeoutMs > 600000) throw new Error("Boot timeout must be 1000–600000 ms.");
  const check = await checkLocalQaDevice(config);
  if (!check.ready) throw new Error(check.issues.join(" "));
  artifactDir = await prepareArtifacts(config, artifactDir);
  if (await exists(config.leasePath)) throw new Error(`Unresolved local QA device lease: ${config.leasePath}. Inspect its saved evidence before starting another device.`);
  if ((await inventory(config, run)).some((item) => item.serial === config.serial))
    throw new Error(`The local QA serial ${config.serial} is already connected; it will not be attached to or stopped implicitly.`);
  if (selectLocalQaProcesses(await inspectLocalQaProcesses(config, { run })).length)
    throw new Error("A process for the dedicated local QA AVD or port is already running; another instance was not started.");
  const state = { kind: "envitefy-local-android-qa", token: randomUUID(), avdName: config.avdName, avdPath: config.avdPath,
    serial: config.serial, artifactDir, startedAt: new Date(now()).toISOString(), startedDevice: false, status: "launching", userdataPreserved: true };
  const save = () => writeFile(path.join(artifactDir, "device-start.json"), JSON.stringify(state, null, 2));
  const args = ["-avd", config.avdName, "-port", String(config.port), "-memory", "3072", "-cores", "2",
    "-no-window", "-no-audio", "-no-snapshot", "-no-boot-anim", "-gpu", "software", "-feature", "-Vulkan"];
  let stdoutFd, stderrFd, leased = false;
  try {
    stdoutFd = openSync(path.join(artifactDir, "emulator-stdout.log"), "a");
    stderrFd = openSync(path.join(artifactDir, "emulator-stderr.log"), "a");
    await writeFile(config.leasePath, JSON.stringify(state, null, 2), { flag: "wx" });
    leased = true;
    const child = spawnProcess(config.emulator, args, { cwd: config.root,
      env: { ...process.env, ANDROID_HOME: config.sdkRoot, ANDROID_SDK_ROOT: config.sdkRoot, ANDROID_AVD_HOME: config.avdHome },
      windowsHide: true, detached: true, stdio: ["ignore", stdoutFd, stderrFd] });
    await new Promise((resolve, reject) => { child.once("spawn", resolve); child.once("error", reject); });
    Object.assign(state, { pid: child.pid, startedDevice: true, status: "booting", launchArguments: args });
    child.unref();
    await writeFile(config.leasePath, JSON.stringify(state, null, 2));
    rememberProcesses(state, selectLocalQaProcesses(await inspectLocalQaProcesses(config, { run }), state));
    await writeFile(config.leasePath, JSON.stringify(state, null, 2));
    await save();
    const deadline = now() + bootTimeoutMs;
    const bootTimeout = () => {
      const pending = [state.userUnlocked === false ? "user 0 unlock" : null, state.packageManagerReady === false ? "package manager readiness" : null].filter(Boolean);
      return failure(`Android boot/readiness check exceeded ${bootTimeoutMs} ms at ${pending.join(" and ") || state.readinessStage || "sys.boot_completed"}; installation and app behavior remain unverified.`,
        { classification: "timeout", timeoutMs: bootTimeoutMs });
    };
    const remainingTimeout = (maximum = 5000) => {
      if (now() >= deadline) throw bootTimeout();
      return Math.min(maximum, deadline - now());
    };
    const readyCommand = async (args, stage) => {
      state.readinessStage = stage;
      const timeoutMs = remainingTimeout();
      const result = await run(config.adb, ["-s", config.serial, "shell", ...args], { timeoutMs });
      state.lastReadinessCheck = { stage, exitCode: result.exitCode, timedOut: Boolean(result.timedOut), timeoutMs };
      return result;
    };
    while (now() < deadline) {
      const result = await readyCommand(["getprop", "sys.boot_completed"], "sys.boot_completed");
      if (result.exitCode === 0 && !result.timedOut && result.output.trim() === "1") {
        state.bootCompletedObserved = true;
        if (!state.identityVerified) {
          await verifyIdentity(config, run, remainingTimeout(10000));
          state.identityVerified = true;
          for (const [args, label] of [[["input", "keyevent", "KEYCODE_WAKEUP"], "display wake"], [["wm", "dismiss-keyguard"], "keyguard dismissal"]]) {
            const outcome = await readyCommand(args, label);
            if (outcome.exitCode !== 0 || outcome.timedOut) throw commandFailure(outcome, `ADB ${label}`, state.lastReadinessCheck.timeoutMs);
          }
        }
        const user = await readyCommand(["am", "get-started-user-state", "0"], "user 0 unlock");
        state.userUnlocked = user.exitCode === 0 && !user.timedOut && user.output.trim() === "RUNNING_UNLOCKED";
        const packages = await readyCommand(["pm", "path", "android"], "package manager readiness");
        state.packageManagerReady = packages.exitCode === 0 && !packages.timedOut && /^package:\/.+\.apk\s*$/m.test(packages.output);
        if (state.userUnlocked && state.packageManagerReady && now() < deadline) {
          rememberProcesses(state, selectLocalQaProcesses(await inspectLocalQaProcesses(config, { run, timeoutMs: remainingTimeout(10000) }), state));
          if (now() >= deadline) throw bootTimeout();
          if (!state.ownedProcesses.length) throw failure("The booted local QA device's process family could not be identified; launch lease retained.");
          state.status = "android_boot_verified";
          state.bootCompletedAt = new Date(now()).toISOString();
          await writeFile(config.leasePath, JSON.stringify(state, null, 2));
          await save();
          return state;
        }
      }
      if (now() < deadline) await sleep(Math.min(2000, deadline - now()));
    }
    throw bootTimeout();
  } catch (error) {
    state.status = "incomplete";
    state.error = error.message;
    state.classification = error.classification || "tool_failure";
    if (error.timeoutMs) state.timeoutMs = error.timeoutMs;
    // Preserve launch ownership even when the failure is an artifact write;
    // callers must still be able to attempt a normal, identity-checked stop.
    error.startedDevice = state.startedDevice;
    error.leasePath = config.leasePath;
    const writes = await Promise.allSettled([
      ...(leased ? [writeFile(config.leasePath, JSON.stringify(state, null, 2))] : []), save(),
    ]);
    const writeErrors = writes.filter((result) => result.status === "rejected").map((result) => result.reason.message);
    if (writeErrors.length) error.evidenceWriteErrors = writeErrors;
    throw error;
  } finally {
    if (stdoutFd !== undefined) closeSync(stdoutFd);
    if (stderrFd !== undefined) closeSync(stderrFd);
  }
}

export async function stopLocalQaDevice(config = localQaConfig(), { artifactDir, run = runProcess, now = Date.now, sleep = delay } = {}) {
  canonical(config);
  artifactDir = await prepareArtifacts(config, artifactDir);
  const state = { avdName: config.avdName, serial: config.serial, status: "shutdown_pending", userdataPreserved: true };
  try {
    const lease = await readJson(config.leasePath);
    if (!lease || lease.kind !== "envitefy-local-android-qa" || lease.avdName !== config.avdName || lease.avdPath !== config.avdPath || lease.serial !== config.serial || !lease.token)
      throw new Error("Dedicated local QA launch lease is absent or differs; no shutdown was requested.");
    await inspectAvd(config);
    const tracked = { ...lease, ownedProcesses: [...(lease.ownedProcesses || [])] };
    rememberProcesses(tracked, selectLocalQaProcesses(await inspectLocalQaProcesses(config, { run }), tracked));
    state.ownedProcesses = tracked.ownedProcesses;
    await writeFile(config.leasePath, JSON.stringify(tracked, null, 2));
    const connected = await inventory(config, run);
    if (connected.some((item) => item.serial === config.serial)) {
      await verifyIdentity(config, run);
      const result = await run(config.adb, ["-s", config.serial, "emu", "kill"], { timeoutMs: 10000 });
      if (result.exitCode !== 0 || result.timedOut) throw commandFailure(result, "Normal local QA emulator shutdown (adb emu kill); launch lease retained", 10000);
    }
    const deadline = now() + 30000;
    let disconnected = false;
    let processes = [];
    do {
      disconnected = !(await inventory(config, run, Math.max(1, Math.min(10000, deadline - now())))).some((item) => item.serial === config.serial);
      processes = selectLocalQaProcesses(await inspectLocalQaProcesses(config, { run, timeoutMs: Math.max(1, Math.min(10000, deadline - now())) }), tracked);
      rememberProcesses(tracked, processes);
      state.ownedProcesses = tracked.ownedProcesses;
      if (disconnected && processes.length === 0) break;
      if (now() < deadline) await sleep(Math.min(1000, deadline - now()));
    } while (now() < deadline);
    if (!disconnected || processes.length) {
      await writeFile(config.leasePath, JSON.stringify(tracked, null, 2));
      throw failure("Normal local QA shutdown/owned process exit was not verified within 30000 ms; launch lease retained.", { classification: "timeout", timeoutMs: 30000 });
    }
    const current = await readJson(config.leasePath);
    if (!current || current.token !== lease.token) throw new Error("Local QA launch lease changed during shutdown; it was preserved.");
    await unlink(config.leasePath);
    state.status = "stopped_with_userdata_preserved";
    return state;
  } catch (error) {
    state.status = "incomplete";
    state.error = error.message;
    state.classification = error.classification || "tool_failure";
    if (error.timeoutMs) state.timeoutMs = error.timeoutMs;
    throw error;
  } finally {
    state.completedAt = new Date(now()).toISOString();
    await writeFile(path.join(artifactDir, "device-stop.json"), JSON.stringify(state, null, 2));
  }
}
