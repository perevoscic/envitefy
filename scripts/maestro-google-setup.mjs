import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { inspectAndroid } from "./lib/maestro-android.mjs";
import {
  maestroCommand,
  ROOT,
  runProcess,
  scrubArtifacts,
  selectScenarios,
} from "./lib/maestro-core.mjs";
import { inspectFailure } from "./lib/maestro-report.mjs";
import { acquireAndroidUiLock } from "./lib/maestro-ui-lock.mjs";

// This command operates on the dedicated test emulator and one allowed tester.
// The Google password is never passed to Envitefy's credentials endpoint.
const accountOption = process.argv.indexOf("--account");
const account = accountOption < 0 ? "QA01" : process.argv[accountOption + 1];
if (!/^QA\d{2}$/.test(account || "")) throw new Error("Select a QA account alias.");
selectScenarios([account]); // Refuses QA11 before loading or using credentials.
const values = {
  ...parseEnv(await readFile(path.join(ROOT, ".env.maestro.local"), "utf8")),
  ...process.env,
};
const step = process.argv[2] || "email";
const stepFiles = {
  email: "google-play-email",
  password: "google-play-password",
  smoke: "play-smoke",
  session: "envitefy-google-session",
  signup: "envitefy-google-signup",
  "chrome-email": "chrome-google-email",
  "chrome-email-retry": "chrome-google-email-retry",
  "chrome-password": "chrome-google-password",
  "chrome-code": "chrome-google-code",
  "device-email": "device-google-email",
  "device-password": "device-google-password",
};
if (!Object.hasOwn(stepFiles, step)) throw new Error("Unknown Google setup step.");
const verificationCode = step === "chrome-code" ? process.env.MAESTRO_VERIFICATION_CODE : undefined;
if (step === "chrome-code" && !/^\d{6}$/.test(verificationCode || ""))
  throw new Error("Provide the current six-digit Google code in MAESTRO_VERIFICATION_CODE.");
if (step === "signup" && !process.argv.includes("--provision-test-account"))
  throw new Error(
    "Signup accepts Envitefy's legal checkbox and provisions an app account. Use --provision-test-account only after the account owner explicitly authorizes both actions.",
  );
const email = values[`MAESTRO_${account}_EMAIL`];
const password = values[`MAESTRO_${account}_PASSWORD`];
if (!email || !password) throw new Error(`${account} Google tester credentials are missing.`);
const secrets = [password, verificationCode].filter(Boolean);
const serial = values.MAESTRO_ANDROID_SERIAL || "emulator-5556";
await acquireAndroidUiLock(serial, { account, step: `google-${step}` });
const ready = await runProcess(
  process.env.MAESTRO_ADB_BIN || "adb",
  ["-s", serial, "shell", "getprop", "sys.boot_completed"],
  { timeoutMs: 10000 },
);
if (ready.exitCode !== 0 || ready.output.trim() !== "1") {
  console.error(
    "The Android test device has not completed booting. Google sign-in was not started; wait for the emulator home screen, then retry.",
  );
  process.exit(1);
}
const dir = path.join(ROOT, "output/maestro", `google-setup-${step}-${Date.now()}`);
await mkdir(dir, { recursive: true });
const flowFile = path.join(dir, `${stepFiles[step]}.yaml`);
await writeFile(
  flowFile,
  await readFile(path.join(ROOT, `.maestro/android/setup/${stepFiles[step]}.yaml`)),
);
const android = ["smoke", "session", "signup"].includes(step)
  ? await inspectAndroid({ androidAppId: "com.envitefy.app", androidSerial: serial })
  : undefined;
if (android)
  await writeFile(path.join(dir, "android-device.json"), JSON.stringify(android, null, 2));
const c = await maestroCommand();
const result = await runProcess(
  c.binary,
  [
    "--device",
    serial,
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
    flowFile,
  ],
  {
    env: {
      ...c.env,
      MAESTRO_EMAIL: email,
      MAESTRO_EMAIL_PATTERN: email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ...(verificationCode ? { MAESTRO_VERIFICATION_CODE: verificationCode } : {}),
      ...(["password", "chrome-password", "device-password"].includes(step)
        ? { MAESTRO_PASSWORD: password }
        : {}),
    },
    secrets,
    timeoutMs: 300000,
    onOutput: (chunk) => appendFileSync(path.join(dir, "console.log"), chunk),
  },
);
await writeFile(path.join(dir, "console.log"), result.output);
await scrubArtifacts(dir, secrets);
const failure = result.exitCode === 0 ? {} : await inspectFailure(dir);
await writeFile(
  path.join(dir, "status.json"),
  JSON.stringify(
    {
      provider: "google",
      account,
      step,
      status: result.exitCode === 0 ? "step_completed" : "incomplete",
      classification: result.exitCode === 0 ? undefined : "incomplete_check",
      timeoutMs: result.timedOut ? 300000 : failure.waitTimeoutMs,
      message: failure.message,
      limitation:
        step === "smoke"
          ? "This checks the Play app launch, landing menu and sign-in form. No Envitefy login, signup, account creation or business workflow is performed."
          : step === "session"
            ? "This checks an existing signed-in session, dashboard and matching profile email. It does not run a new login or the eleven business workflows."
            : step === "signup"
              ? "This checks Google signup and the dashboard only. The other account workflows and server permission checks remain unverified."
              : "A Google setup step does not verify enrollment, installation, or Envitefy behavior. Password submission may require further account verification.",
    },
    null,
    2,
  ),
);
console.log(
  `Google Play setup ${account} ${step}: ${result.exitCode === 0 ? "completed" : "incomplete"}. Evidence: ${dir}`,
);
console.log(result.output.split("\n").slice(-12).join("\n"));
process.exitCode = result.exitCode === 0 ? 0 : 1;

import { appendFileSync } from "node:fs";
