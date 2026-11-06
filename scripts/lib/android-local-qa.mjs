import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, appendFile, copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify, parseArgs } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { maestroCommand, redact, runProcess } from "./maestro-core.mjs";
import { acquireAndroidUiLock } from "./maestro-ui-lock.mjs";
import { selectPrimaryCaptureDisplay, explicitDisplayScreencapArgs } from "./maestro-display.mjs";
import { startLocalQaDevice, stopLocalQaDevice } from "./android-local-qa-device.mjs";

const execFileAsync = promisify(execFile);
export const APP_ID = "com.envitefy.app";

export function parseLocalQaArgs(args) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    help: { type: "boolean" }, apk: { type: "string" }, flow: { type: "string" },
    location: { type: "string" }, "boot-timeout-ms": { type: "string" }, "test-timeout-ms": { type: "string" },
  } });
  const command = positionals[0] || "doctor";
  if (positionals.length > 1 || !["doctor", "setup", "run", "stop"].includes(command))
    throw new Error("Command must be doctor, setup, run or stop.");
  if (values.help) return { command, help: true };
  const timeout = (key, fallback, maximum = 1800000) => {
    if (values[key] === undefined) return fallback;
    if (!/^\d+$/.test(values[key]) || Number(values[key]) < 1000 || Number(values[key]) > maximum)
      throw new Error(`--${key} must be an integer from 1000 to ${maximum}.`);
    return Number(values[key]);
  };
  if (command !== "run" && Object.keys(values).length) throw new Error("Run options are accepted only by run.");
  if (command === "run" && !values.apk) throw new Error("run requires --apk with an Envitefy APK. Userdata is retained on reinstall.");
  let location;
  if (values.location !== undefined) {
    const parts = values.location.split(",");
    if (parts.length !== 2 || parts.some(value => !/^-?\d+(?:\.\d+)?$/.test(value)))
      throw new Error("--location requires longitude,latitude (for example -87.6298,41.8781).");
    const [longitude, latitude] = parts.map(Number);
    if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) throw new Error("Location is outside longitude/latitude bounds.");
    location = { longitude, latitude };
  }
  return { command, apk: values.apk && path.resolve(values.apk), flow: values.flow && path.resolve(values.flow), location,
    bootTimeoutMs: timeout("boot-timeout-ms", 180000, 600000), testTimeoutMs: timeout("test-timeout-ms", 300000) };
}

export class QaCheckError extends Error {
  constructor(message, classification = "tool_or_access_failure", detail = {}) {
    super(message); this.classification = classification; Object.assign(this, detail);
  }
}

export function requireCommand(result, label, timeoutMs) {
  if (result.timedOut) throw new QaCheckError(`${label} timed out after ${timeoutMs} ms.`, "timeout", { timeoutMs });
  if (result.exitCode !== 0) throw new QaCheckError(`${label} did not complete (exit ${result.exitCode}): ${result.output?.slice(-1800) || result.spawnError || "no output"}`);
  return result.output || "";
}

export function requireMaestroResult(result, timeoutMs) {
  const assertion = result.output?.match(/Assertion is false:\s*([^\r\n]+)/);
  if (!result.timedOut && result.exitCode !== 0 && assertion)
    throw new QaCheckError(`Maestro assertion failed: ${assertion[1].slice(0, 1500)}`, "assertion_failure");
  return requireCommand(result, "Maestro flow", timeoutMs);
}

export function launcherComponent(output) {
  const components = output.split(/\r?\n/).map(line => line.trim())
    .filter(line => /^[\w.]+\/[\w.$]+$/.test(line));
  if (components.length !== 1 || !components[0].startsWith(`${APP_ID}/`))
    throw new QaCheckError("Android did not resolve exactly one Envitefy launcher component.", "assertion_failure");
  return components[0];
}

export function verifyActivityLaunch(output, scenario) {
  if (/Status:\s*timeout\b/i.test(output)) {
    const observedWaitMs = Number(output.match(/WaitTime:\s*(\d+)/)?.[1]);
    throw new QaCheckError(`${scenario}: Android activity launch returned Status: timeout${Number.isFinite(observedWaitMs) ? ` after a reported ${observedWaitMs} ms wait` : ""}; Chrome handoff remains unverified.`,
      "timeout", Number.isFinite(observedWaitMs) ? { observedWaitMs } : {});
  }
  if (/Error:|Error type|Exception occurred|Status:\s*(?!ok\b)\S+/i.test(output))
    throw new QaCheckError(`Android rejected ${scenario}: ${output}`, "assertion_failure");
}

export function verifyMaestroJunit(xml) {
  const suites = [...xml.matchAll(/<testsuite\b([^>]*)>/g)];
  const cases = [...xml.matchAll(/<testcase\b([^>]*)\/?\s*>/g)];
  const attribute = (text, key) => text.match(new RegExp(`\\b${key}=["']([^"']*)["']`))?.[1];
  const tests = suites.reduce((total, suite) => total + Number(attribute(suite[1], "tests")), 0);
  if (!suites.length || !cases.length || tests !== cases.length || !/<\/testsuites>\s*$/.test(xml) ||
      suites.length !== (xml.match(/<\/testsuite>/g) || []).length ||
      suites.some(suite => ["failures", "errors", "skipped"].some(key => Number(attribute(suite[1], key) || 0) !== 0)) ||
      cases.some(item => attribute(item[1], "status") !== "SUCCESS") || /<(?:failure|error|skipped)\b/.test(xml))
    throw new QaCheckError("Maestro did not produce a complete, successful JUnit result for every selected test.", "incomplete_test_evidence");
  return { tests, failures: 0, skipped: 0 };
}

export async function prepareQaInputs(config, options, { run = runProcess, getMaestro = maestroCommand, artifactDir } = {}) {
  if (!(await stat(options.apk)).isFile() || !options.apk.toLowerCase().endsWith(".apk")) throw new Error("--apk must be an existing APK file.");
  // Build tools can replace the caller's APK while an emulator boots. Inspect,
  // hash and install one private run copy so the evidence identifies its bytes.
  const candidate = artifactDir ? path.join(artifactDir, "candidate.apk") : options.apk;
  if (artifactDir) await copyFile(options.apk, candidate, constants.COPYFILE_EXCL);
  const versions = (await readdir(path.join(config.sdkRoot, "build-tools"))).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  let aapt;
  for (const version of versions) {
    const candidate = path.join(config.sdkRoot, "build-tools", version, "aapt.exe");
    if (await access(candidate).then(() => true, () => false)) { aapt = candidate; break; }
  }
  if (!aapt) throw new Error("Install Android SDK Build Tools (aapt.exe is missing).");
  const badging = requireCommand(await run(aapt, ["dump", "badging", candidate], { timeoutMs: 30000 }), "APK inspection", 30000);
  const packageLine = badging.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']*)'/m);
  if (packageLine?.[1] !== APP_ID) throw new Error(`Only an APK whose package is ${APP_ID} can be tested.`);
  const apk = { file: candidate, sourceFile: options.apk, sha256: createHash("sha256").update(await readFile(candidate)).digest("hex"),
    appId: packageLine[1], versionCode: packageLine[2], versionName: packageLine[3], installation: "adb_sideload" };
  let flow;
  if (options.flow) {
    if (!(await stat(options.flow)).isFile() || !/\.ya?ml$/i.test(options.flow)) throw new Error("--flow must be an existing Maestro YAML file.");
    const source = await readFile(options.flow, "utf8");
    const command = await getMaestro();
    requireCommand(await run(command.binary, ["--version"], { env: command.env, timeoutMs: 60000 }), "Maestro availability", 60000);
    flow = { file: options.flow, source, sha256: createHash("sha256").update(source).digest("hex"), command };
  }
  return { apk, flow };
}

export async function exerciseLocalQa(config, options, { adb, check, wait = delay, inputs, runMaestro } ) {
  await check("apk_install", async () => {
    const output = await adb(["install", "-r", inputs.apk.file], 120000);
    if (!/^Success\s*$/m.test(output)) throw new QaCheckError("ADB did not confirm APK installation.", "assertion_failure");
    return { installation: "adb_sideload", userdataReset: false };
  });
  await check("installed_package", async () => {
    const packages = await adb(["shell", "pm", "list", "packages", "-i", APP_ID]);
    const line = packages.split(/\r?\n/).find(value => value.startsWith(`package:${APP_ID} `));
    const dump = await adb(["shell", "dumpsys", "package", APP_ID]);
    const versionCode = dump.match(/\bversionCode=(\d+)/)?.[1];
    if (!line || versionCode !== inputs.apk.versionCode)
      throw new QaCheckError("The installed package/version does not match the inspected APK.", "assertion_failure");
    return { appId: APP_ID, versionCode, reportedInstaller: line.match(/installer=(\S+)/)?.[1] || "unknown", installation: "adb_sideload" };
  });
  if (options.location) await check("simulated_location", async () => {
    const { longitude, latitude } = options.location;
    const output = await adb(["emu", "geo", "fix", String(longitude), String(latitude)]);
    if (!/^OK\s*$/m.test(output) || /^KO:/m.test(output)) throw new QaCheckError("Emulator did not accept the simulated QA location.");
    return { longitude, latitude, purpose: "application_qa" };
  });
  const component = await check("launcher_resolution", async () => launcherComponent(await adb([
    "shell", "cmd", "package", "resolve-activity", "--brief", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", APP_ID,
  ])));
  for (const scenario of ["cold_launch", "relaunch", "https_intent"]) await check(scenario, async () => {
    await adb(["shell", "am", "force-stop", APP_ID]);
    // The baseline is retained in commands.jsonl before clearing this QA device's crash buffer.
    await adb(["logcat", "-d", "-b", "crash", "-t", "200"]);
    await adb(["logcat", "-b", "crash", "-c"]);
    const intent = scenario === "https_intent" ? ["-a", "android.intent.action.VIEW", "-d", "https://envitefy.com/", "-n", component]
      : ["-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-n", component];
    const started = await adb(["shell", "am", "start", "--user", "0", "-W", ...intent], 60000);
    verifyActivityLaunch(started, scenario);
    await wait(4000);
    const crashes = await adb(["logcat", "-d", "-b", "crash", "-v", "brief"]);
    if (/com\.envitefy\.app|surfaceflinger|system_server/.test(crashes))
      throw new QaCheckError(`A crash was recorded during ${scenario}; inspect commands.jsonl.`, "assertion_failure");
    const activities = await adb(["shell", "dumpsys", "activity", "activities"]);
    const resumed = activities.split(/\r?\n/).filter(line => /(?:mResumedActivity|topResumedActivity)\s*[:=]/.test(line));
    if (!resumed.length || resumed.some(line => !/com\.android\.chrome\//.test(line)))
      throw new QaCheckError(`${scenario} did not reach the wrapper's Chrome activity.`, "assertion_failure");
    return { chromeResumed: true, appCrashObserved: false, websiteWorkflowVerified: false };
  });
  if (inputs.flow) await check("maestro_flow", () => runMaestro(inputs.flow));
}

export async function collectQaDiagnostics(config, artifactDir, { adb, capture = execFileAsync } = {}) {
  const results = [];
  for (const [name, args] of [["logcat", ["logcat", "-d", "-t", "2000", "-v", "threadtime"]],
    ["activities", ["shell", "dumpsys", "activity", "activities"]], ["package", ["shell", "dumpsys", "package", APP_ID]]]) {
    try { await writeFile(path.join(artifactDir, `${name}.txt`), await adb(args, 20000)); results.push({ name, status: "passed" }); }
    catch (error) { results.push({ name, status: "incomplete", message: error.message }); }
  }
  try {
    const ids = await adb(["shell", "dumpsys", "SurfaceFlinger", "--display-id"]);
    const details = await adb(["shell", "dumpsys", "display"]);
    await writeFile(path.join(artifactDir, "display-ids.txt"), ids);
    await writeFile(path.join(artifactDir, "display-details.txt"), details);
    const display = selectPrimaryCaptureDisplay(ids, details);
    const result = await capture(config.adb, explicitDisplayScreencapArgs(config.serial, display),
      { encoding: "buffer", timeout: 15000, maxBuffer: 12 * 1024 * 1024, windowsHide: true });
    if (result.stdout.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Screenshot was not a PNG.");
    await writeFile(path.join(artifactDir, "screen.png"), result.stdout);
    results.push({ name: "screenshot", status: "passed", display });
  } catch (error) { results.push({ name: "screenshot", status: "incomplete", message: error.message }); }
  return results;
}

export async function runLocalQa(config, options, artifactDir, dependencies = {}) {
  const { prepare = prepareQaInputs, start = startLocalQaDevice, stop = stopLocalQaDevice,
    acquire = acquireAndroidUiLock, run = runProcess, exercise = exerciseLocalQa, diagnose = collectQaDiagnostics, wait = delay } = dependencies;
  await mkdir(artifactDir, { recursive: true });
  const report = { schemaVersion: 1, kind: "local_android_automated_qa", startedAt: new Date().toISOString(),
    avdName: config.avdName, serial: config.serial, installation: "adb_sideload", checks: [], diagnostics: [],
    limitations: ["Launcher checks accept Chrome onboarding; website functionality requires a Maestro flow.",
      "No human participation, Play installation, enrollment duration or production eligibility is established."] };
  const save = () => writeFile(path.join(artifactDir, "report.json"), redact(JSON.stringify(report, null, 2)));
  const check = async (name, operation) => {
    const entry = { name, status: "running", startedAt: new Date().toISOString() }; report.checks.push(entry); await save();
    try { const result = await operation(); Object.assign(entry, { status: "passed", result }); return result; }
    catch (error) { Object.assign(entry, { status: error.classification === "assertion_failure" ? "failed" : "incomplete",
      classification: error.classification || "tool_or_access_failure", message: error.message,
      ...(error.timeoutMs ? { timeoutMs: error.timeoutMs } : {}),
      ...(error.observedWaitMs !== undefined ? { observedWaitMs: error.observedWaitMs } : {}) }); throw error; }
    finally { entry.finishedAt = new Date().toISOString(); await save(); }
  };
  const adb = async (args, timeoutMs = 15000) => {
    const result = await run(config.adb, ["-s", config.serial, ...args], { timeoutMs });
    await appendFile(path.join(artifactDir, "commands.jsonl"), redact(JSON.stringify({ at: new Date().toISOString(), args, ...result })) + "\n");
    return requireCommand(result, `adb ${args.slice(0, 3).join(" ")}`, timeoutMs);
  };
  let release, startedDevice = false, booted = false;
  try {
    let inputs;
    await check("input_preflight", async () => {
      inputs = await prepare(config, options, { artifactDir });
      report.apk = inputs.apk;
      if (inputs.flow) {
        report.flow = { file: inputs.flow.file, entrySha256: inputs.flow.sha256, provenance: "Entry source only; relative dependencies resolve from the original flow directory." };
        await writeFile(path.join(artifactDir, "flow-entry.yaml"), inputs.flow.source);
      }
      return { apkSha256: inputs.apk.sha256, flowEntrySha256: inputs.flow?.sha256 };
    });
    await check("device_lock", async () => { release = await acquire(config.serial, { kind: "local-android-qa", serial: config.serial }); });
    await check("android_boot", async () => {
      try { const result = await start(config, { artifactDir, bootTimeoutMs: options.bootTimeoutMs }); startedDevice = true; booted = true; return result; }
      catch (error) { startedDevice = error.startedDevice === true; throw error; }
    });
    const runMaestro = async flow => {
      const verifyEntry = async () => {
        if (createHash("sha256").update(await readFile(flow.file)).digest("hex") !== flow.sha256)
          throw new QaCheckError("Maestro entry source changed during this run; its result cannot verify the saved entry.", "incomplete_test_evidence");
      };
      await verifyEntry();
      const runtimeHome = path.join(artifactDir, "maestro-home"); await mkdir(runtimeHome, { recursive: true });
      const result = await run(flow.command.binary, ["--device", config.serial, "test", "--no-ansi", "--format", "JUNIT", "--output", path.join(artifactDir, "junit.xml"),
        "--test-output-dir", artifactDir, "--debug-output", artifactDir, flow.file], {
        cwd: path.dirname(flow.file), timeoutMs: options.testTimeoutMs,
        env: { ...flow.command.env, JAVA_OPTS: `-Duser.home=${runtimeHome.replaceAll("\\", "/")}`, MAESTRO_ANDROID_APP_ID: APP_ID, MAESTRO_BASE_URL: "https://envitefy.com" },
      });
      await writeFile(path.join(artifactDir, "maestro.log"), result.output);
      requireMaestroResult(result, options.testTimeoutMs);
      await verifyEntry();
      return verifyMaestroJunit(await readFile(path.join(artifactDir, "junit.xml"), "utf8"));
    };
    await exercise(config, options, { adb, check, inputs, runMaestro, wait });
  } catch (error) { report.error = error.message; }
  finally {
    try {
      if (booted) {
        try { report.diagnostics = await diagnose(config, artifactDir, { adb }); }
        catch (error) { report.diagnostics = [{ name: "diagnostics", status: "incomplete", message: error.message }]; }
      }
      if (startedDevice) {
        try { await check("normal_shutdown", () => stop(config, { artifactDir })); }
        catch { /* Retain the lifecycle lease and the independent check result. */ }
      }
    } finally { release?.(); }
    report.finishedAt = new Date().toISOString();
    report.status = report.checks.some(entry => entry.status === "failed") ? "failed"
      : report.error || report.checks.some(entry => entry.status !== "passed") || report.diagnostics.some(entry => entry.status !== "passed") ? "incomplete" : "passed";
    await save();
  }
  return report;
}
