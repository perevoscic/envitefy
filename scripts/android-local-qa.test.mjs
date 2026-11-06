import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { APP_ID, QaCheckError, collectQaDiagnostics, exerciseLocalQa, launcherComponent, parseLocalQaArgs,
  prepareQaInputs, requireCommand, requireMaestroResult, runLocalQa, verifyActivityLaunch, verifyMaestroJunit } from "./lib/android-local-qa.mjs";

const config = { sdkRoot: "sdk", adb: "adb.exe", avdName: "Envitefy_Local_QA", serial: "emulator-5554" };
const options = { apk: "test.apk", bootTimeoutMs: 1000, testTimeoutMs: 2000 };
const inputs = { apk: { file: "run/candidate.apk", sha256: "abc", versionCode: "5", installation: "adb_sideload" } };
const junit = `<testsuites><testsuite tests="1" failures="0"><testcase name="smoke" status="SUCCESS"/></testsuite></testsuites>`;

async function temp(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "envitefy-local-qa-"));
  t.after(() => rm(dir, { recursive: true, force: true })); return dir;
}

test("CLI selects a single isolated QA device and rejects malformed location, timeout and destructive options", () => {
  const parsed = parseLocalQaArgs(["run", "--apk", "build with spaces.apk", "--location=-87.6298,41.8781"]);
  assert.deepEqual(parsed.location, { longitude: -87.6298, latitude: 41.8781 });
  assert.equal(parseLocalQaArgs([]).command, "doctor");
  for (const args of [["run"], ["run", "--apk", "a.apk", "--wipe-data"], ["run", "--apk", "a.apk", "--serial", "emulator-5560"],
    ["run", "--apk", "a.apk", "--location=181,0"], ["run", "--apk", "a.apk", "--location=0,91"],
    ["run", "--apk", "a.apk", "--location=,0"], ["run", "--apk", "a.apk", "--boot-timeout-ms", "600001"],
    ["run", "--apk", "a.apk", "--test-timeout-ms", "NaN"], ["setup", "--flow", "test.yaml"]]) assert.throws(() => parseLocalQaArgs(args));
});

test("timeout cannot pass even with exit zero; launcher cannot target another package", () => {
  assert.throws(() => requireCommand({ exitCode: 0, timedOut: true }, "boot", 1000), error => error.classification === "timeout" && error.timeoutMs === 1000);
  assert.equal(launcherComponent(`priority=0\n${APP_ID}/com.google.LauncherActivity\n`), `${APP_ID}/com.google.LauncherActivity`);
  for (const output of ["other.app/.Main", `${APP_ID}/.Main\nother.app/.Main`, "No activity found"]) assert.throws(() => launcherComponent(output));
});

test("Maestro success requires nonempty complete JUnit with no failed, skipped or missing cases", () => {
  assert.equal(verifyMaestroJunit(junit).tests, 1);
  for (const xml of ["", junit.replace('tests="1"', 'tests="2"'), junit.replace('failures="0"', 'failures="1"'),
    junit.replace('status="SUCCESS"', 'status="SKIPPED"'), junit.replace('status="SUCCESS"', ''), junit.replace('</testsuites>', ''),
    junit.replace('/></testsuite>', '><skipped/></testcase></testsuite>')]) assert.throws(() => verifyMaestroJunit(xml));
});

test("a confirmed Maestro assertion is a failed check while timeouts and driver failures stay incomplete", () => {
  const result = { exitCode: 1, output: '[Failed] launch (Assertion is false: "Welcome to Chrome" is visible)' };
  assert.throws(() => requireMaestroResult(result, 300000), error => error.classification === "assertion_failure");
  assert.throws(() => requireMaestroResult({ ...result, timedOut: true }, 300000), error => error.classification === "timeout");
  assert.throws(() => requireMaestroResult({ exitCode: 1, output: "DeviceServerDiedException" }, 300000), error => error.classification === "tool_or_access_failure");
});

test("Android's own activity wait timeout remains incomplete even when adb exits zero", () => {
  assert.throws(() => verifyActivityLaunch("Status: timeout\r\nWaitTime: 10331\r\nComplete", "cold_launch"),
    error => error.classification === "timeout" && error.observedWaitMs === 10331 && error.timeoutMs === undefined);
  assert.doesNotThrow(() => verifyActivityLaunch("Status: ok\nWaitTime: 350", "cold_launch"));
});

test("APK package is inspected before any device work and optional Maestro is not required for launcher QA", async t => {
  const dir = await temp(t); const apk = path.join(dir, "local.apk");
  await writeFile(apk, "test bytes");
  const tool = path.join(dir, "build-tools/35.0.0/aapt.exe"); await mkdir(path.dirname(tool), { recursive: true }); await writeFile(tool, "");
  let calls = 0;
  const good = await prepareQaInputs({ sdkRoot: dir }, { apk }, { run: async (_binary, args) => {
    calls++; assert.deepEqual(args, ["dump", "badging", apk]); return { exitCode: 0, output: `package: name='${APP_ID}' versionCode='5' versionName='1.0.3'` };
  }, getMaestro: () => { throw new Error("Maestro must remain optional"); } });
  assert.equal(good.apk.installation, "adb_sideload"); assert.match(good.apk.sha256, /^[a-f0-9]{64}$/); assert.equal(calls, 1);
  const artifactDir = path.join(dir, "run"); await mkdir(artifactDir);
  const copied = await prepareQaInputs({ sdkRoot: dir }, { apk }, { artifactDir, run: async (_binary, args) => {
    assert.equal(args[2], path.join(artifactDir, "candidate.apk"));
    await writeFile(apk, "concurrent rebuild");
    return { exitCode: 0, output: `package: name='${APP_ID}' versionCode='5' versionName='1.0.3'` };
  } });
  assert.equal(copied.apk.sha256, good.apk.sha256);
  assert.equal(await readFile(copied.apk.file, "utf8"), "test bytes");
  await assert.rejects(prepareQaInputs({ sdkRoot: dir }, { apk }, { run: async () => ({ exitCode: 0, output: "package: name='other.app' versionCode='5' versionName='1'" }) }), /Only an APK/);
});

function fakeAdb(overrides = {}) {
  const calls = [];
  const adb = async args => {
    calls.push(args);
    const key = args.join(" ");
    for (const [match, result] of Object.entries(overrides)) if (key.startsWith(match)) {
      if (result instanceof Error) throw result; return result;
    }
    if (args[0] === "install") return "Success\n";
    if (key.startsWith("shell pm list packages")) return `package:${APP_ID} installer=com.android.shell`;
    if (key.startsWith("shell dumpsys package")) return "versionCode=5 minSdk=23";
    if (key.startsWith("shell cmd package")) return `${APP_ID}/com.google.LauncherActivity`;
    if (key.startsWith("emu geo fix")) return "OK\n";
    if (key.startsWith("shell am start")) return "Status: ok\n";
    if (key.startsWith("shell dumpsys activity")) return "mResumedActivity: ActivityRecord{ com.android.chrome/.Main }";
    return "";
  };
  return { adb, calls };
}

test("APK install failure prevents launch and the successful scenario keeps GPS longitude first", async () => {
  const failed = fakeAdb({ install: "Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]" });
  const check = async (_name, fn) => fn();
  await assert.rejects(exerciseLocalQa(config, options, { ...failed, check, inputs, wait: async () => {} }), /installation/);
  assert.equal(failed.calls.length, 1);
  const good = fakeAdb(); const checks = [];
  await exerciseLocalQa(config, { ...options, location: { longitude: -87.6298, latitude: 41.8781 } }, {
    ...good, inputs, wait: async () => {}, check: async (name, fn) => { const result = await fn(); checks.push({ name, result }); return result; },
  });
  assert.deepEqual(good.calls.find(args => args[0] === "emu"), ["emu", "geo", "fix", "-87.6298", "41.8781"]);
  assert.deepEqual(good.calls[0], ["install", "-r", "run/candidate.apk"]);
  assert.equal(checks.filter(item => item.result?.chromeResumed).length, 3);
  assert.ok(checks.filter(item => item.result?.chromeResumed).every(item => item.result.websiteWorkflowVerified === false));
  assert.ok(!good.calls.some(args => args.includes("clear") || args.includes("uninstall")));
});

test("installed version mismatch, launch error, crash, or absent Chrome cannot pass launcher checks", async () => {
  for (const overrides of [{ "shell dumpsys package": "versionCode=4" }, { "shell am start": "Error type 3" },
    { "logcat -d -b crash -v": "FATAL EXCEPTION: com.envitefy.app" }, { "shell dumpsys activity": "mResumedActivity: other.app/.Main" }]) {
    await assert.rejects(exerciseLocalQa(config, options, { ...fakeAdb(overrides), inputs, check: async (_name, fn) => fn(), wait: async () => {} }), QaCheckError);
  }
});

function lifecycle(overrides = {}) {
  const events = [];
  return { events, dependencies: {
    prepare: async () => inputs,
    acquire: async serial => { assert.equal(serial, "emulator-5554"); events.push("lock"); return () => events.push("release"); },
    start: async () => { events.push("start"); return { startedDevice: true }; },
    exercise: async (_config, _options, { check }) => { events.push("exercise"); await check("scenario", async () => ({ observed: true })); },
    diagnose: async () => { events.push("diagnose"); return [{ name: "logcat", status: "passed" }]; },
    stop: async () => { events.push("stop"); return { userdataPreserved: true }; }, ...overrides,
  } };
}

test("boot timeout prevents install and still stops only the owned launched device", async t => {
  const dir = await temp(t);
  const fake = lifecycle({ start: async () => { throw Object.assign(new QaCheckError("Boot exceeded 1000 ms", "timeout", { timeoutMs: 1000 }), { startedDevice: true }); } });
  const report = await runLocalQa(config, options, dir, fake.dependencies);
  assert.equal(report.status, "incomplete"); assert.equal(report.checks.find(item => item.name === "android_boot").timeoutMs, 1000);
  assert.deepEqual(fake.events, ["lock", "stop", "release"]);
  assert.equal(report.checks.find(item => item.name === "normal_shutdown").status, "passed");
});

test("a lock or ownership rejection never installs, diagnoses or shuts down someone else's device", async t => {
  for (const failure of ["acquire", "start"]) {
    const dir = await temp(t);
    const fake = lifecycle({ [failure]: async () => { throw new Error("reserved by another run"); } });
    const report = await runLocalQa(config, options, dir, fake.dependencies);
    assert.equal(report.status, "incomplete"); assert.ok(!fake.events.includes("stop")); assert.ok(!fake.events.includes("exercise"));
  }
});

test("diagnostic/shutdown failures preserve successful scenario evidence and release the device lock", async t => {
  for (const kind of ["diagnostic", "shutdown"]) {
    const dir = await temp(t); const fake = lifecycle(kind === "diagnostic"
      ? { diagnose: async () => [{ name: "screenshot", status: "incomplete", message: "display is off" }] }
      : { stop: async () => { throw new Error("Process exit not verified within 30000 ms; lease retained."); } });
    const report = await runLocalQa(config, options, dir, fake.dependencies);
    assert.equal(report.status, "incomplete"); assert.equal(report.checks.find(item => item.name === "scenario").status, "passed");
    assert.equal(fake.events.at(-1), "release");
    assert.equal(JSON.parse(await readFile(path.join(dir, "report.json"), "utf8")).status, "incomplete");
  }
});

test("assertion failure remains distinct from diagnostic failure; environments never enter the saved report", async t => {
  const dir = await temp(t);
  const fake = lifecycle({ prepare: async () => ({ ...inputs, flow: { file: "test.yaml", sha256: "def", source: "appId: com.envitefy.app", command: { env: { PRIVATE_CREDENTIAL: "sensitive-value" } } } }),
    exercise: async (_config, _options, { check }) => check("assertion", () => { throw new QaCheckError("Observed launch error", "assertion_failure"); }) });
  const report = await runLocalQa(config, options, dir, fake.dependencies);
  assert.equal(report.status, "failed"); assert.equal(report.checks.find(item => item.name === "assertion").status, "failed");
  assert.ok(!JSON.stringify(report).includes("sensitive-value")); assert.ok(!(await readFile(path.join(dir, "report.json"), "utf8")).includes("PRIVATE_CREDENTIAL"));
  assert.deepEqual(fake.events, ["lock", "start", "diagnose", "stop", "release"]);
});

test("each diagnostic is independent when logcat or screenshot collection fails", async t => {
  const dir = await temp(t); const fake = fakeAdb({ "logcat": new Error("ADB timed out after 20000 ms") });
  const result = await collectQaDiagnostics(config, dir, { adb: fake.adb, capture: async () => { throw new Error("must not capture without display mapping"); } });
  assert.equal(result.find(item => item.name === "logcat").status, "incomplete");
  assert.equal(result.find(item => item.name === "activities").status, "passed");
  assert.equal(result.find(item => item.name === "package").status, "passed");
  assert.equal(result.find(item => item.name === "screenshot").status, "incomplete");
});
