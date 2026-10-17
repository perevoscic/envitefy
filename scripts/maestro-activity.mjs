import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import sharp from "sharp";
import { writeActivitySummary } from "./lib/maestro-activity-report.mjs";
import { inspectAndroid } from "./lib/maestro-android.mjs";
import {
  classifyFailure,
  contained,
  maestroCommand,
  ROOT,
  redact,
  runProcess,
  scrubArtifacts,
  selectScenarios,
} from "./lib/maestro-core.mjs";
import { inspectFailure, writeReports } from "./lib/maestro-report.mjs";
import { acquireAndroidUiLock } from "./lib/maestro-ui-lock.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const account = option("--account", "QA01");
selectScenarios([account]); // Never loads or uses QA11.
const step = option("--step", "open-snap");
if (!/^[a-z][a-z-]+$/.test(step)) throw new Error("Invalid activity step.");
if (step === "google-sign-out-limit" && !args.includes("--allow-google-web-signout"))
  throw new Error(
    "Signing out all Google web sessions requires specific owner authorization and --allow-google-web-signout.",
  );
if (
  ["switch-google-signup", "resume-signup"].includes(step) &&
  !args.includes("--provision-test-account")
)
  throw new Error(
    "Account provisioning accepts the required legal consent. Use --provision-test-account only with explicit owner authorization.",
  );
const sourceFile = path.join(ROOT, `.maestro/android/activity/${step}.yaml`);
const template = await readFile(sourceFile, "utf8");
const values = {
  ...parseEnv(await readFile(path.join(ROOT, ".env.maestro.local"), "utf8")),
  ...process.env,
};
const email = values[`MAESTRO_${account}_EMAIL`];
const password = values[`MAESTRO_${account}_PASSWORD`];
if (!email || !password) throw new Error(`${account}: missing Google tester variables.`);
await acquireAndroidUiLock(values.MAESTRO_ANDROID_SERIAL || "emulator-5556", { account, step });
const runId = option("--run", `activity-${account}-${Date.now()}`);
if (!new RegExp(`^activity-${account}-[0-9]+$`).test(runId))
  throw new Error("Run must belong to the selected account.");
const root = path.join(ROOT, "output/maestro");
const runDir = contained(root, runId);
await mkdir(runDir, { recursive: true });
const stateFile = path.join(runDir, "state.json");
let state;
try {
  state = JSON.parse(await readFile(stateFile, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (state && (state.account !== account || state.kind !== "envitefy-android-activity"))
  throw new Error("Activity checkpoint does not match this account.");
state ||= {
  kind: "envitefy-android-activity",
  runId,
  account,
  createdAt: new Date().toISOString(),
  title: `Envitefy ${account} Test Workshop ${runId.split("-").at(-1)}`,
  expected: {
    start: "2026-10-30T13:00:00-05:00",
    end: "2026-10-30T14:00:00-05:00",
    timezone: "America/Chicago",
    location: "Online",
    website: `https://example.com/${account.toLowerCase()}`,
  },
  results: [],
};
await writeFile(stateFile, JSON.stringify(state, null, 2));
const input = path.join(runDir, "snap-input.png");
try {
  await readFile(input);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#f4f0ff"/><rect x="60" y="60" width="1080" height="1480" rx="40" fill="white" stroke="#6b39e5" stroke-width="6"/><g font-family="Arial,sans-serif" fill="#23133d"><text x="100" y="180" font-size="36" font-weight="bold">ENVITEFY ANDROID TEST EVENT</text><text x="100" y="320" font-size="57" font-weight="bold">Envitefy ${account}</text><text x="100" y="400" font-size="57" font-weight="bold">Test Workshop</text><text x="100" y="480" font-size="30">Run ${runId.split("-").at(-1)}</text><text x="100" y="650" font-size="46">Friday, October 30, 2026</text><text x="100" y="740" font-size="46">1:00 PM to 2:00 PM</text><text x="100" y="820" font-size="34">Central Time — America/Chicago</text><text x="100" y="990" font-size="46">Online event</text><text x="100" y="1070" font-size="36">${state.expected.website}</text><text x="100" y="1230" font-size="33">A synthetic workshop for app testing.</text><text x="100" y="1300" font-size="33">No guests will be invited.</text><text x="100" y="1400" font-size="30">Host: Envitefy QA</text></g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(input);
}
const attempt = `${String(state.results.length + 1).padStart(2, "0")}-${step}-${Date.now()}`;
const dir = path.join(runDir, attempt);
await mkdir(dir, { recursive: true });
const importsSnap = template.includes("addMedia:");
const snapFilename = importsSnap
  ? `snap-input-${account}-${attempt.split("-").at(-1)}.png`
  : state.snapMediaFilename || `snap-input-${account}.png`;
if (!new RegExp(`^snap-input-${account}(?:-[0-9]+)?\\.png$`).test(snapFilename))
  throw new Error("Saved media filename does not match the selected account.");
if (importsSnap) state.snapMediaFilename = snapFilename;
// Maestro resolves addMedia file paths before evaluating flow variables.
const source = Buffer.from(
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Materialize the saved filename before Maestro parses its media path.
  template.replaceAll("${MAESTRO_SNAP_FILE}", snapFilename),
);
await writeFile(path.join(dir, "flow.yaml"), source);
await writeFile(path.join(dir, "template.yaml"), template);
await writeFile(path.join(dir, "snap-input.png"), await readFile(input));
await writeFile(path.join(dir, snapFilename), await readFile(input));
const startedAt = new Date().toISOString();
const entry = {
  scenario: attempt,
  name: step,
  account,
  platform: "android",
  artifactDir: attempt,
  file: `.maestro/android/activity/${step}.yaml`,
  sourceDigest: createHash("sha256").update(source).digest("hex"),
  templateDigest: createHash("sha256").update(template).digest("hex"),
  snapMediaFilename: snapFilename,
  startedAt,
  status: "running",
};
state.results.push(entry);
await writeFile(stateFile, JSON.stringify(state, null, 2));
const journal = (event) =>
  appendFileSync(
    path.join(runDir, "journal.jsonl"),
    `${JSON.stringify({ at: new Date().toISOString(), account, step, ...event })}\n`,
  );
journal({ event: "started", attempt, sourceDigest: entry.sourceDigest });
console.log(`Activity run ${runId}; step ${step}; logs: ${dir}`);
try {
  const device = await inspectAndroid({
    androidAppId: "com.envitefy.app",
    androidSerial: values.MAESTRO_ANDROID_SERIAL || "emulator-5556",
  });
  await writeFile(path.join(dir, "android-device.json"), JSON.stringify(device, null, 2));
  if (["enter-snap", "scan-upload"].includes(step)) {
    const forward = await runProcess(
      process.env.MAESTRO_ADB_BIN || "adb",
      ["-s", device.serial, "forward", "tcp:9223", "localabstract:chrome_devtools_remote"],
      { timeoutMs: 15000 },
    );
    if (forward.exitCode !== 0)
      throw new Error("Chrome diagnostic forwarding failed; upload stopped.");
    const identity = await runProcess(
      process.execPath,
      [path.join(ROOT, "scripts/maestro-activity-identity.mjs"), runId, attempt],
      { timeoutMs: 70000, secrets: [password] },
    );
    await writeFile(path.join(dir, "account-precondition.log"), identity.output);
    if (identity.exitCode !== 0)
      throw new Error(
        identity.timedOut
          ? "Account/duplicate precondition exceeded 70000ms; upload stopped and account identity remains unverified."
          : identity.output.trim() || "Account/duplicate precondition failed; upload stopped.",
      );
  }
  if (["open-snap", "restore-app"].includes(step)) {
    const adb = process.env.MAESTRO_ADB_BIN || "adb";
    const resolved = await runProcess(
      adb,
      [
        "-s",
        device.serial,
        "shell",
        "cmd",
        "package",
        "resolve-activity",
        "--brief",
        "-a",
        "android.intent.action.MAIN",
        "-c",
        "android.intent.category.LAUNCHER",
        device.appId,
      ],
      { timeoutMs: 15000 },
    );
    const component = resolved.output.trim().split(/\r?\n/).at(-1);
    if (resolved.exitCode !== 0 || !/^com\.envitefy\.app\/[A-Za-z0-9_.$]+$/.test(component))
      throw new Error("The installed Envitefy launcher could not be resolved.");
    const launch = await runProcess(
      adb,
      [
        "-s",
        device.serial,
        "shell",
        "am",
        "start",
        "-W",
        "-a",
        "android.intent.action.MAIN",
        "-c",
        "android.intent.category.LAUNCHER",
        "-n",
        component,
      ],
      { timeoutMs: 30000 },
    );
    await writeFile(path.join(dir, "android-launch.log"), launch.output);
    if (launch.exitCode !== 0 || /Error type|Error:/.test(launch.output))
      throw new Error("Android could not launch Envitefy; see android-launch.log.");
  }
  const command = await maestroCommand();
  const result = await runProcess(
    command.binary,
    [
      "--device",
      device.serial,
      "test",
      "--no-ansi",
      "--format",
      "JUNIT",
      "--output",
      path.join(dir, "junit.xml"),
      "--test-output-dir",
      dir,
      "--debug-output",
      dir,
      path.join(dir, "flow.yaml"),
    ],
    {
      env: {
        ...command.env,
        MAESTRO_EMAIL_PATTERN: email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        MAESTRO_ACCOUNT: account,
        MAESTRO_ACTIVITY_TITLE: state.title,
        MAESTRO_SNAP_FILE: snapFilename,
        MAESTRO_SNAP_PICKER_PATTERN: snapFilename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      },
      secrets: [password],
      timeoutMs: 300000,
      onOutput: (chunk) => appendFileSync(path.join(dir, "console.log"), chunk),
    },
  );
  await writeFile(path.join(dir, "console.log"), result.output);
  const failure = result.exitCode === 0 ? {} : await inspectFailure(dir);
  Object.assign(entry, failure, {
    status: result.exitCode === 0 ? "passed" : "failed",
    durationMs: Date.now() - Date.parse(startedAt),
    ...(result.exitCode === 0
      ? {}
      : {
          classification: classifyFailure({
            ...result,
            timedOut: result.timedOut || failure.waitTimedOut,
            output: `${result.output}\n${failure.message || ""}`,
          }),
          message:
            failure.message ||
            result.output.split(/\r?\n/).find((line) => line.trim()) ||
            "Maestro did not complete the step.",
          cause:
            "Unconfirmed; inspect the saved command, hierarchy, screenshot and logs before attributing a cause.",
        }),
  });
} catch (error) {
  Object.assign(entry, {
    status: "failed",
    classification: "environment_or_test_failure",
    message: error.message,
    cause: "Setup or tool access failed; application behavior for this step remains unverified.",
  });
  await writeFile(path.join(dir, "console.log"), error.message);
} finally {
  // Bounded Android error snapshot. Keep capture failures separate from UI results.
  const deviceErrors = await runProcess(
    process.env.MAESTRO_ADB_BIN || "adb",
    [
      "-s",
      values.MAESTRO_ANDROID_SERIAL || "emulator-5556",
      "logcat",
      "-d",
      "-t",
      "500",
      "-v",
      "threadtime",
      "-s",
      "AndroidRuntime:E",
      "ActivityManager:W",
      "chromium:E",
    ],
    { timeoutMs: 10000, secrets: [password] },
  );
  const safeDeviceErrors = redact(deviceErrors.output, [password]).replace(
    /https?:\/\/[^\s"<>]+/g,
    (value) => {
      try {
        const url = new URL(value);
        return url.origin + url.pathname;
      } catch {
        return "[URL omitted]";
      }
    },
  );
  await writeFile(path.join(dir, "android-errors.log"), safeDeviceErrors);
  entry.androidErrorCapture = {
    status: deviceErrors.exitCode === 0 ? "captured" : "unavailable",
    timedOut: deviceErrors.timedOut,
    scope:
      "Last 500 entries available for AndroidRuntime:E, ActivityManager:W and chromium:E; may include earlier attempts.",
  };
  journal({ event: "finished", attempt, status: entry.status, message: entry.message });
  state.updatedAt = new Date().toISOString();
  await writeFile(stateFile, JSON.stringify(state, null, 2));
  await writeReports(
    runDir,
    state.results,
    {
      runId,
      platform: "android",
      account,
      limitations: [
        "Only completed step assertions are verified. A resumed run must inspect the current UI and existing records before repeating an upload or publication.",
        "Server-side provider logs are not collected by this client runner; causes without direct evidence remain unconfirmed.",
      ],
    },
    [password],
  );
  await scrubArtifacts(runDir, [password]);
  await writeActivitySummary(runDir, state, [password]);
  const index = await runProcess(
    process.execPath,
    [path.join(ROOT, "scripts/maestro-activity-status.mjs")],
    { timeoutMs: 10000 },
  );
  if (index.exitCode !== 0)
    console.error("The account status index could not be refreshed; the per-run report is saved.");
}
console.log(
  `${account} ${step}: ${entry.status}. Report: ${path.join(runDir, "activity-summary.html")}`,
);
process.exitCode = entry.status === "passed" ? 0 : 1;
