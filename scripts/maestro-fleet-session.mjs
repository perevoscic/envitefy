import { createHash, randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { inspectAndroid } from "./lib/maestro-android.mjs";
import { maestroCommand, redact, ROOT, runProcess, scrubArtifacts } from "./lib/maestro-core.mjs";
import { artifactFiles, inspectFailure } from "./lib/maestro-report.mjs";
import { acquireAndroidUiLock } from "./lib/maestro-ui-lock.mjs";

export const FLEET_STEPS = Object.freeze({
  "play-email": "google-play-email.yaml",
  "play-password": "google-play-password.yaml",
  "play-signin": "google-play-email.yaml",
  "device-email": "device-google-email.yaml",
  "device-password": "device-google-password.yaml",
  "chrome-email": "chrome-google-email.yaml",
  "chrome-password": "chrome-google-password.yaml",
  "chrome-password-observed": null,
  "chrome-signin": "chrome-google-email.yaml",
  "app-session": "envitefy-google-session.yaml",
  "app-browse": "envitefy-google-session.yaml",
  smoke: "play-smoke.yaml",
  "app-signin": null,
});
const APP_STEPS = new Set(["app-session", "app-signin", "app-browse", "smoke"]);
const PASSWORD_STEPS = new Set(["play-password", "device-password", "chrome-password", "chrome-password-observed"]);
const CREDENTIAL_STEPS = new Set([...PASSWORD_STEPS, "play-signin", "chrome-signin"]);
const TIMEOUT_MS = 300000;
const MASTER_SERIAL = "emulator-5556";
const EMAIL_PATTERN = "${MAESTRO_EMAIL_PATTERN}";
const OWNER_GATE = "Verify.*you.*|Verify.*identity.*|Enter.*code.*|2-Step Verification|Check your phone|Confirm.*you.*|Подтвердите.*|Введите код.*";
const CAPTCHA_GATE = "I'm not a robot|Verify you are human|Solve.*puzzle.*";
const SIGNUP_GATE = "I confirm I am at least 18, agree to the Terms of Use.*";
const GOOGLE_TERMS_GATE = "^I agree$|^Accept$|^Google services$";
const CREDENTIAL_ERROR = "Wrong password.*|Incorrect password.*|Couldn't sign you in.*|Could not sign you in.*";
const BROWSER_ASSOCIATION_GATE = "Sign in to this site and Chrome";
const RECOVERY_GATE = "(?i)Account recovery|Recover your account|Enter.*recovery.*|Confirm.*recovery.*|Get a verification code|Check your.*phone.*|Tap Yes.*|Use your passkey.*|Восстановление аккаунта.*";

function browserAssociationCommands(indent = 0) {
  const flow = `- runFlow:\n    when:\n      visible: ${JSON.stringify(BROWSER_ASSOCIATION_GATE)}\n    commands:\n      - takeScreenshot: browser-association-not-authorized\n      - assertNotVisible: ${JSON.stringify(BROWSER_ASSOCIATION_GATE)}\n`;
  return flow.split("\n").filter(Boolean).map((line) => `${" ".repeat(indent)}${line}\n`).join("");
}

function gateCommands() {
  return [
    [OWNER_GATE, "owner-verification-required"],
    [CAPTCHA_GATE, "captcha-owner-action-required"],
    [SIGNUP_GATE, "signup-consent-not-authorized"],
  ].map(([pattern, screenshot]) => `- runFlow:\n    when:\n      visible: ${JSON.stringify(pattern)}\n    commands:\n      - takeScreenshot: ${screenshot}\n      - assertNotVisible: ${JSON.stringify(pattern)}\n`).join("") + browserAssociationCommands();
}

function stopAt(pattern, screenshot) {
  return `- runFlow:\n    when:\n      visible: ${JSON.stringify(pattern)}\n    commands:\n      - takeScreenshot: ${screenshot}\n      - assertNotVisible: ${JSON.stringify(pattern)}\n`;
}

// The ordinary existing-account chooser calibrated in the October 26 QA run.
// It has no dependency on that run's paths, dates, records or completed results.
const SIGNIN_FLOW = String.raw`appId: com.envitefy.app
androidWebViewHierarchy: devtools
name: Fleet existing Google account sign-in
---
- launchApp:
    appId: com.envitefy.app
    clearState: false
- openLink: https://envitefy.com/
- extendedWaitUntil:
    visible: "Open navigation|Log ?in|Sign In|Sign in with Google"
    timeout: 30000
- runFlow:
    when:
      notVisible: "Sign in with Google"
    commands:
      - runFlow:
          when:
            notVisible: "(?i)^(Log ?in|Sign in)$"
          commands:
            - tapOn: "Open navigation"
            - extendedWaitUntil:
                visible: "(?i)^(Log ?in|Sign in)$"
                timeout: 10000
      - tapOn: "(?i)^(Log ?in|Sign in)$"
- extendedWaitUntil:
    visible: "Sign in with Google"
    timeout: 30000
- assertNotVisible: "I confirm I am at least 18, agree to the Terms of Use.*"
- tapOn:
    text: "Sign in with Google"
    retryTapIfNoChange: false
- extendedWaitUntil:
    visible: "Choose an account|Выберите аккаунт"
    timeout: 60000
${browserAssociationCommands()}
- assertVisible: 'accounts\.google\.com'
- runFlow:
    when:
      visible: "^Continue$|^Продолжить$"
    commands:
${browserAssociationCommands(6)}
      - runFlow:
          when:
            notVisible: '.*${EMAIL_PATTERN}.*'
          commands:
            - tapOn:
                text: "Choose an account|Выберите аккаунт"
                retryTapIfNoChange: false
            - waitForAnimationToEnd:
                timeout: 3000
- scrollUntilVisible:
    element: '.*${EMAIL_PATTERN}.*'
    direction: DOWN
    timeout: 15000
    centerElement: false
- takeScreenshot: existing-google-account-choice
- retry:
    maxRetries: 3
    commands:
${browserAssociationCommands(6)}
      - runFlow:
          when:
            notVisible: "Continue|Продолжить|Welcome.*|Open navigation|Access Denied|Verify.*|Enter.*code.*"
          commands:
            - tapOn: '.*${EMAIL_PATTERN}.*'
      - extendedWaitUntil:
          visible: "Continue|Продолжить|Welcome.*|Open navigation|Access Denied|Verify.*|Enter.*code.*"
          timeout: 10000
- runFlow:
    when:
      visible: "^Continue$|^Продолжить$"
    commands:
${browserAssociationCommands(6)}
      - assertVisible: 'accounts\.google\.com'
      - assertVisible: '.*${EMAIL_PATTERN}.*'
      - assertVisible: ".*Envitefy.*"
      - tapOn: "^Continue$|^Продолжить$"
`;

export function parseFleetSessionArgs(args) {
  if (!args.length || args.includes("--help")) return { help: true };
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === "--reuse-installed-driver") {
      if (Object.hasOwn(options, "reuseInstalledDriver"))
        throw new Error("Use each session option once.");
      options.reuseInstalledDriver = true;
      continue;
    }
    if (!["--account", "--step", "--serial"].includes(flag) || Object.hasOwn(options, flag.slice(2)))
      throw new Error("Use only --account, --step and optional --serial or --reuse-installed-driver, each once.");
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new Error("A session option is missing its value.");
    options[flag.slice(2)] = value;
  }
  expectedFleetDevice(options.account);
  if (!Object.hasOwn(FLEET_STEPS, options.step))
    throw new Error("Choose an explicit supported --step; no action was started.");
  return options;
}

export function buildFleetMaestroArgs({ serial, dir, flow, reuseInstalledDriver = false }) {
  if (typeof reuseInstalledDriver !== "boolean") throw new Error("Driver reuse must be an explicit boolean.");
  return ["--device", serial, "test", ...(reuseInstalledDriver ? ["--no-reinstall-driver"] : []),
    "--no-ansi", "--format", "JUNIT", "--output", path.join(dir, "junit.xml"),
    "--test-output-dir", dir, "--debug-output", dir, flow];
}

export function expectedFleetDevice(account) {
  if (!/^QA(?:0[1-9]|1[0-3])$/.test(account || ""))
    throw new Error("Select an account alias from QA01 through QA13.");
  const port = 5560 + 2 * (Number(account.slice(2)) - 1);
  return { account, avdName: `Envitefy_Fleet_${account}`, serial: `emulator-${port}`, port };
}

export function resolveFleetDevice(options, manifest) {
  const expected = expectedFleetDevice(options.account);
  let profile;
  if (manifest) {
    if (manifest.schemaVersion !== 1 || manifest.kind !== "envitefy-android-qa-fleet" || !Array.isArray(manifest.profiles))
      throw new Error("Unsupported fleet manifest; no device actions were started.");
    const matches = manifest.profiles.filter((item) => item.account === options.account);
    if (matches.length !== 1) throw new Error("Fleet manifest must contain exactly one assignment for this account.");
    profile = matches[0];
    if (!profile.assigned || !profile.provisioned)
      throw new Error(`${options.account} is not assigned to a provisioned fleet profile.`);
    if (profile.avdName !== expected.avdName || profile.serial !== expected.serial || profile.port !== expected.port)
      throw new Error("Fleet manifest device mapping does not match the account's reserved device.");
  }
  const serial = options.serial || profile?.serial;
  if (!serial) throw new Error("Provide --serial or a provisioned assignment in the fleet manifest.");
  if (serial !== expected.serial) throw new Error("The requested serial belongs to a different fleet account.");
  return { ...expected, sdkRoot: manifest?.sdkRoot };
}

export async function verifyFleetDevice(device, adb, run = runProcess) {
  const name = await run(adb, ["-s", device.serial, "emu", "avd", "name"], { timeoutMs: 10000 });
  const observedName = name.output.split(/\r?\n/).map((line) => line.trim()).find((line) => line && line !== "OK");
  if (name.exitCode !== 0 || name.timedOut || observedName !== device.avdName)
    throw new Error("The selected serial is not running this account's assigned AVD; no credentials were submitted.");
  const boot = await run(adb, ["-s", device.serial, "shell", "getprop", "sys.boot_completed"], { timeoutMs: 10000 });
  if (boot.exitCode !== 0 || boot.timedOut || boot.output.trim() !== "1")
    throw new Error("The assigned AVD has not completed booting; no credentials were submitted.");
  return { avdName: observedName, bootCompleted: true };
}

export async function verifyPasswordForeground(step, serial, adb, run = runProcess) {
  if (!PASSWORD_STEPS.has(step) && step !== "chrome-signin") return;
  const result = await run(adb, ["-s", serial, "shell", "dumpsys", "activity", "activities"], { timeoutMs: 10000 });
  const resumed = result.output.split(/\r?\n/).filter((line) => /(?:mResumedActivity|topResumedActivity|ResumedActivity)\s*[:=]/.test(line));
  const packages = new Set(resumed.map((line) => line.match(/\b(com\.[\w.]+)\//)?.[1]).filter(Boolean));
  const allowed = step.startsWith("chrome-") ? ["com.android.chrome"] : ["com.google.android.gms", "com.android.vending"];
  if (result.exitCode !== 0 || result.timedOut || packages.size !== 1 || !allowed.includes([...packages][0]))
    throw new Error("Password entry requires the expected Google sign-in app in the foreground; no password was submitted.");
}

export function recordedSessionBlockers(files) {
  return {
    browserAssociation: files.some((file) => path.basename(file) === "browser-association-not-authorized.png"),
    ownerGate: files.some((file) => /(?:owner-verification-required|captcha-owner-action-required|signup-consent-not-authorized|google-terms-owner-action-required|account-recovery-owner-action-required)\.png$/i.test(file)),
  };
}

export function credentialEvidence(step, files) {
  if (!["play-signin", "chrome-signin", "chrome-password-observed"].includes(step)) return {};
  const has = (name) => files.some((file) => path.basename(file) === `${name}.png`);
  const chrome = step === "chrome-signin" || step === "chrome-password-observed";
  return {
    credentialsSubmitted: has(chrome ? "google-oauth-password-result" : "google-password-submission-result"),
    credentialOutcomeObserved: has(chrome ? "chrome-credential-outcome" : "google-credential-outcome"),
    ...(chrome ? { oauthConsentReady: has("chrome-oauth-consent-ready"), dashboardObserved: has("chrome-dashboard-observed") } : {}),
    googleSessionVerified: false,
  };
}

export function classifyFleetSessionResult(step, result, files) {
  const { browserAssociation, ownerGate } = recordedSessionBlockers(files);
  const chromeCredentialOutcome = step === "chrome-signin" || step === "chrome-password-observed";
  const combinedSignin = step === "play-signin" || chromeCredentialOutcome;
  const credentials = credentialEvidence(step, files);
  const has = (name) => files.some((file) => path.basename(file) === `${name}.png`);
  const terminalState = step === "play-signin" && has("google-play-listing-ready") ? "play_app_listing"
    : chromeCredentialOutcome && has("chrome-oauth-consent-ready") ? "envitefy_oauth_consent"
      : chromeCredentialOutcome && has("chrome-dashboard-observed") ? "envitefy_dashboard" : undefined;
  // A challenge may disappear from an accessibility snapshot while remaining
  // visible onscreen. Skipped negative gates are not positive completion proof.
  const terminalEvidenceComplete = !combinedSignin || Boolean(
    credentials.credentialsSubmitted && credentials.credentialOutcomeObserved && terminalState);
  const commandCompleted = result.exitCode === 0 && !result.timedOut;
  const passed = commandCompleted && !ownerGate && !browserAssociation && terminalEvidenceComplete;
  return {
    passed,
    status: browserAssociation ? "incomplete" : ownerGate ? "owner_action_required" : passed ? "step_completed" : "incomplete",
    classification: browserAssociation ? "unsupported_browser_association_prompt" : ownerGate ? "owner_verification_or_consent"
      : passed ? undefined : commandCompleted && combinedSignin && !terminalEvidenceComplete ? "unverified_credential_terminal_state" : "incomplete_check",
    ...(combinedSignin ? { terminalStateObserved: Boolean(terminalState), terminalState } : {}),
  };
}

function preserveSession(flow) {
  return flow.replace(/- launchApp:\s*\n\s+permissions:\s*\n\s+all: unset/g,
    "- launchApp:\n    appId: com.envitefy.app\n    clearState: false")
    // The current phone Settings page opens its section list by default.
    // Profile's read-only Sign-in email was verified in the QA01 live pilot.
    .replace(/https:\/\/envitefy\.com\/settings(?=\s|$)/g, "https://envitefy.com/settings?section=profile")
    .replaceAll('- assertVisible: "Email"', '- assertVisible: "Sign-in email"');
}

export async function buildFleetFlow(step, read = readFile) {
  if (!Object.hasOwn(FLEET_STEPS, step)) throw new Error("Unsupported fleet step.");
  const load = (file) => read(path.join(ROOT, ".maestro/android/setup", file), "utf8");
  const guards = gateCommands();
  let source = step === "app-signin" ? SIGNIN_FLOW
    : step === "chrome-password-observed" ? "appId: com.android.chrome\nname: Observed Google website password form\n---\n"
      : await load(FLEET_STEPS[step]);
  source = preserveSession(source.replaceAll("\r\n", "\n"));
  if (step === "chrome-password-observed") {
    // QA04's saved November 4 hierarchy has no password label. Its exact
    // password container surrounds the focused EditText; passwordNext
    // surrounds the Next button. This explicit phase never navigates to login.
    const chromeGuards = `${guards}${stopAt(RECOVERY_GATE, "account-recovery-owner-action-required")}${stopAt(CREDENTIAL_ERROR, "google-credentials-rejected")}${stopAt("Set up screen lock to use passkeys", "owner-verification-required")}${stopAt(GOOGLE_TERMS_GATE, "google-terms-owner-action-required")}`;
    source += `${chromeGuards}- assertNotVisible: "Sign in to Chrome"\n- assertVisible: 'accounts\\.google\\.com'\n- assertVisible: '.*${EMAIL_PATTERN}.*'\n`;
    source += '- extendedWaitUntil:\n    visible:\n      id: "^password$"\n    timeout: 30000\n';
    source += `${chromeGuards}- assertVisible: 'accounts\\.google\\.com'\n- assertVisible: '.*${EMAIL_PATTERN}.*'\n- assertVisible:\n    id: "^passwordNext$"\n`;
    source += '- tapOn:\n    id: "^password$"\n    retryTapIfNoChange: false\n- pressKey: Backspace\n- inputText: ${MAESTRO_PASSWORD}\n- hideKeyboard\n';
    source += `${chromeGuards}- assertVisible: 'accounts\\.google\\.com'\n- assertVisible: '.*${EMAIL_PATTERN}.*'\n`;
    source += '- tapOn:\n    id: "^passwordNext$"\n    retryTapIfNoChange: false\n- takeScreenshot: google-oauth-password-result\n';
    const outcome = [OWNER_GATE, CAPTCHA_GATE, RECOVERY_GATE, CREDENTIAL_ERROR, BROWSER_ASSOCIATION_GATE,
      GOOGLE_TERMS_GATE, "Set up screen lock to use passkeys", "^Continue$|^Продолжить$|Welcome,.*"].join("|");
    source += `- extendedWaitUntil:\n    visible: ${JSON.stringify(outcome)}\n    timeout: 90000\n- takeScreenshot: chrome-credential-outcome\n${chromeGuards}`;
    source += `- runFlow:\n    when:\n      visible: "^Continue$|^Продолжить$"\n    commands:\n      - assertVisible: 'accounts\\.google\\.com'\n      - assertVisible: '.*${EMAIL_PATTERN}.*'\n      - assertVisible: ".*Envitefy.*"\n      - takeScreenshot: chrome-oauth-consent-ready\n`;
    source += '- runFlow:\n    when:\n      visible: "Welcome,.*"\n    commands:\n      - assertVisible: "Welcome,.*"\n      - takeScreenshot: chrome-dashboard-observed\n';
  }
  if (step === "play-signin") {
    // Keep both credential phases in one Maestro session. The first live pilot
    // reached Google's password page, but that transient page did not remain
    // available after the email-only CLI session ended.
    source += `\n${guards}- assertVisible: "Welcome"\n`;
    const passwordFlow = (await load("google-play-password.yaml")).replaceAll("\r\n", "\n");
    const passwordCommands = passwordFlow.split(/\n---\n/)[1];
    if (!passwordCommands || !passwordCommands.includes("${MAESTRO_EMAIL_PATTERN}") || !passwordCommands.includes("Enter your password"))
      throw new Error("Google Play password helper changed; review account and password-field guards before using it.");
    source += passwordCommands;
    const outcome = [OWNER_GATE, CAPTCHA_GATE, GOOGLE_TERMS_GATE, CREDENTIAL_ERROR,
      "(?i)^Envitefy$|^Install$|^Open$"].join("|");
    source += `\n- extendedWaitUntil:\n    visible: ${JSON.stringify(outcome)}\n    timeout: 90000\n- takeScreenshot: google-credential-outcome\n`;
    source += `- runFlow:\n    when:\n      visible: ${JSON.stringify(GOOGLE_TERMS_GATE)}\n    commands:\n      - takeScreenshot: google-terms-owner-action-required\n      - assertNotVisible: ${JSON.stringify(GOOGLE_TERMS_GATE)}\n`;
    source += `- runFlow:\n    when:\n      visible: ${JSON.stringify(CREDENTIAL_ERROR)}\n    commands:\n      - takeScreenshot: google-credentials-rejected\n      - assertNotVisible: ${JSON.stringify(CREDENTIAL_ERROR)}\n`;
  }
  if (step === "chrome-email" || step === "chrome-signin") {
    // The legacy helper clicked a CAPTCHA checkbox. Preserve the email-entry
    // primitives, but stop at that human verification boundary instead.
    const captchaBlock = /- runFlow:\n    when:\n      visible: "I'm not a robot"\n    commands:\n[\s\S]*?(?=- extendedWaitUntil:)/;
    if (!captchaBlock.test(source)) throw new Error("Chrome email helper changed; review its CAPTCHA boundary before using it.");
    source = source.replace(captchaBlock, guards);
  }
  if (step === "chrome-signin") {
    const recoveryGuard = stopAt(RECOVERY_GATE, "account-recovery-owner-action-required");
    const errorGuard = stopAt(CREDENTIAL_ERROR, "google-credentials-rejected");
    const chromeGuards = `${guards}${recoveryGuard}${errorGuard}`;
    const header = source.split(/\n---\n/)[0];
    const emailCommands = source.slice(source.indexOf("- assertVisible: 'accounts\\.google\\.com'"));
    if (!emailCommands.includes('id: "identifierId"') || !emailCommands.includes("${MAESTRO_EMAIL}"))
      throw new Error("Chrome email helper changed; review the observed web email-form boundary before using it.");
    // The combined phase starts on the already-observed website email form.
    // It does not dismiss Chrome setup, select a browser account or navigate.
    source = `${header}\n---\n${chromeGuards}- assertNotVisible: "Sign in to Chrome"\n- assertVisible: 'accounts\\.google\\.com'\n- assertVisible:\n    id: "identifierId"\n${emailCommands}`;
    const emailOutcome = ["Enter your password|Введите пароль", OWNER_GATE, CAPTCHA_GATE, RECOVERY_GATE, CREDENTIAL_ERROR, BROWSER_ASSOCIATION_GATE].join("|");
    source = source.replace('visible: "Enter your password|Введите пароль|I\'m not a robot"', `visible: ${JSON.stringify(emailOutcome)}`);
    source = source.replace('- extendedWaitUntil:\n    visible: "Enter your password|Введите пароль"', `${chromeGuards}- extendedWaitUntil:\n    visible: "Enter your password|Введите пароль"`);
    const passwordFlow = (await load("chrome-google-password.yaml")).replaceAll("\r\n", "\n");
    const passwordCommands = passwordFlow.split(/\n---\n/)[1];
    if (!passwordCommands || !passwordCommands.includes("${MAESTRO_EMAIL_PATTERN}") || !passwordCommands.includes("accounts\\.google\\.com") || !passwordCommands.includes("Enter your password"))
      throw new Error("Chrome password helper changed; review account, domain and password-field guards before using it.");
    source += `\n${chromeGuards}${passwordCommands}`;
    const outcome = [OWNER_GATE, CAPTCHA_GATE, RECOVERY_GATE, CREDENTIAL_ERROR, BROWSER_ASSOCIATION_GATE, "^Continue$|^Продолжить$|Welcome,.*"].join("|");
    source += `\n- extendedWaitUntil:\n    visible: ${JSON.stringify(outcome)}\n    timeout: 90000\n- takeScreenshot: chrome-credential-outcome\n${chromeGuards}`;
    source += `- runFlow:\n    when:\n      visible: "^Continue$|^Продолжить$"\n    commands:\n      - assertVisible: 'accounts\\.google\\.com'\n      - assertVisible: '.*${EMAIL_PATTERN}.*'\n      - assertVisible: ".*Envitefy.*"\n      - takeScreenshot: chrome-oauth-consent-ready\n`;
    source += `- runFlow:\n    when:\n      visible: "Welcome,.*"\n    commands:\n      - assertVisible: "Welcome,.*"\n      - takeScreenshot: chrome-dashboard-observed\n`;
  }
  if (step === "smoke") {
    source = source.replace('visible: "Open menu"', 'visible: "Open navigation|Log in|Sign In"')
      .replace('- tapOn: "Open menu"\n- tapOn: "Sign In"',
        '- runFlow:\n    when:\n      notVisible: "(?i)^(Log in|Sign in)$"\n    commands:\n      - tapOn: "Open navigation"\n- tapOn: "(?i)^(Log in|Sign in)$"');
  }
  if (PASSWORD_STEPS.has(step)) source += "\n- waitForAnimationToEnd:\n    timeout: 3000\n";
  source += `\n${guards}`;
  if (step === "play-signin") {
    source += `- runFlow:\n    when:\n      visible: "^Install$|^Open$"\n    commands:\n      - assertVisible: '(?i)^Envitefy(?: \\(Early Access\\))?$'\n      - assertVisible: "^Install$|^Open$"\n      - takeScreenshot: google-play-listing-ready\n`;
  }
  if (step === "app-signin") {
    const verification = preserveSession((await load("envitefy-google-session.yaml")).replaceAll("\r\n", "\n"));
    source += verification.split(/\n---\n/)[1];
  }
  if (step === "app-browse") {
    source += String.raw`
- openLink: https://envitefy.com/birthdays/templates
- extendedWaitUntil:
    visible: "(?i).*birthday.*"
    timeout: 60000
- takeScreenshot: fleet-catalog-opened
- swipe:
    direction: UP
- waitForAnimationToEnd:
    timeout: 3000
- takeScreenshot: fleet-catalog-scrolled
- openLink: https://envitefy.com/settings?section=profile
- extendedWaitUntil:
    visible: '.*${EMAIL_PATTERN}.*'
    timeout: 60000
- assertVisible: "Sign-in email"
- takeScreenshot: fleet-account-reverified
- openLink: https://envitefy.com/
- extendedWaitUntil:
    visible: "Welcome,.*"
    timeout: 60000
- takeScreenshot: fleet-dashboard-returned
`;
    source += guards;
  }
  if (/recaptcha-anchor|MAESTRO_VERIFICATION_CODE|chrome-google-request-code|clearState:\s*true/.test(source))
    throw new Error("Fleet flow contains an unsupported verification or data-reset action.");
  return source;
}

function help() {
  console.log("Usage: node scripts/maestro-fleet-session.mjs --account QA01 --step app-session [--serial emulator-5560] [--reuse-installed-driver]");
  console.log(`Steps: ${Object.keys(FLEET_STEPS).join(", ")}. No step is run by default.`);
  console.log("--reuse-installed-driver requests Maestro test --no-reinstall-driver; Maestro may still install a missing driver.");
  console.log("Each command performs one bounded phase. Password submission does not prove Google login completed. MFA, CAPTCHA and signup consent require owner action.");
}

export async function main(args = process.argv.slice(2)) {
  const options = parseFleetSessionArgs(args);
  if (options.help) { help(); return 0; }
  const fleetRoot = path.join(ROOT, "output/maestro/device-fleet");
  const manifest = await readFile(path.join(fleetRoot, "manifest.json"), "utf8")
    .then(JSON.parse).catch((error) => { if (error.code === "ENOENT") return undefined; throw error; });
  const device = resolveFleetDevice(options, manifest);
  const dir = path.join(fleetRoot, "sessions", `${new Date().toISOString().replaceAll(":", "-")}-${device.account}-${options.step}-${randomUUID().slice(0, 8)}`);
  await mkdir(dir, { recursive: true });
  const releases = [];
  let secrets = [];
  let result;
  let status = { account: device.account, step: options.step, serial: device.serial, avdName: device.avdName,
    startedAt: new Date().toISOString(), sessionType: "maestro_automation", status: "preflight_pending",
    ...(options.reuseInstalledDriver ? { reuseInstalledDriver: true } : {}) };
  try {
    // The legacy master lock serializes UI ownership across both old devices
    // and the entire fleet. The second lock also reserves this exact device.
    releases.push(await acquireAndroidUiLock(MASTER_SERIAL, { account: device.account, step: `fleet-${options.step}`, serial: device.serial }));
    releases.push(await acquireAndroidUiLock(device.serial, { account: device.account, step: `fleet-${options.step}` }));
    const values = { ...parseEnv(await readFile(path.join(ROOT, ".env.maestro.local"), "utf8")), ...process.env };
    const email = values[`MAESTRO_${device.account}_EMAIL`]?.trim();
    const password = values[`MAESTRO_${device.account}_PASSWORD`];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || /^(?:REPLACE_|YOUR_|<)/.test(password))
      throw new Error(`${device.account} requires a configured Google email and password.`);
    const emailPattern = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    secrets = [email, emailPattern, password];
    const sdkRoot = device.sdkRoot || values.ANDROID_HOME || path.join(process.env.USERPROFILE || "", "AppData/Local/Android/Sdk");
    const adb = values.MAESTRO_ADB_BIN || (process.platform === "win32" ? path.join(sdkRoot, "platform-tools/adb.exe") : "adb");
    const safeRun = (binary, commandArgs, runOptions = {}) => runProcess(binary, commandArgs, { ...runOptions, secrets });
    status.device = await verifyFleetDevice(device, adb, safeRun);
    await verifyPasswordForeground(options.step, device.serial, adb, safeRun);
    if (APP_STEPS.has(options.step)) {
      status.android = await inspectAndroid({ androidAppId: "com.envitefy.app", androidSerial: device.serial },
        (_binary, commandArgs, runOptions) => safeRun(adb, commandArgs, runOptions));
    }
    const source = await buildFleetFlow(options.step);
    const flow = path.join(dir, "flow.yaml");
    await writeFile(flow, source);
    status.flowDigest = createHash("sha256").update(source).digest("hex");
    status.status = "running";
    await writeFile(path.join(dir, "status.json"), JSON.stringify(status, null, 2));
    const command = await maestroCommand();
    const runtimeHome = path.join(dir, "runtime-home");
    await mkdir(runtimeHome, { recursive: true });
    status.runtimeHome = runtimeHome;
    result = await runProcess(command.binary, buildFleetMaestroArgs({ serial: device.serial, dir, flow,
      reuseInstalledDriver: options.reuseInstalledDriver }), {
      env: { ...command.env, JAVA_OPTS: `-Duser.home=${runtimeHome.replaceAll("\\", "/")}`,
        MAESTRO_EMAIL: email, MAESTRO_EMAIL_PATTERN: emailPattern,
        ...(CREDENTIAL_STEPS.has(options.step) ? { MAESTRO_PASSWORD: password } : {}) },
      secrets, timeoutMs: TIMEOUT_MS,
      onOutput: (chunk) => appendFileSync(path.join(dir, "console.log"), redact(chunk, secrets)),
    });
    await writeFile(path.join(dir, "console.log"), redact(result.output, secrets));
    await scrubArtifacts(dir, secrets);
    const files = await artifactFiles(dir);
    const { browserAssociation, ownerGate } = recordedSessionBlockers(files);
    const { passed, ...completion } = classifyFleetSessionResult(options.step, result, files);
    const browseActions = options.step === "app-browse" ? [
      ["authenticated-profile", "verify_assigned_account_in_settings"],
      ["fleet-catalog-opened", "open_birthday_template_catalog"],
      ["fleet-catalog-scrolled", "scroll_birthday_template_catalog"],
      ["fleet-account-reverified", "reverify_assigned_account_after_browsing"],
      ["fleet-dashboard-returned", "return_to_dashboard"],
    ].filter(([marker]) => files.some((file) => path.basename(file) === `${marker}.png`)).map(([, action]) => action) : [];
    status = { ...status, ...completion,
      exitCode: result.exitCode, timedOut: Boolean(result.timedOut),
      ...(result.timedOut ? { terminationVerified: result.terminationVerified === true, termination: result.termination ?? null } : {}),
      ...(result.timedOut ? { timeoutMs: TIMEOUT_MS } : {}),
      ...(passed ? {} : await inspectFailure(dir)),
      identityVerified: passed && ["app-session", "app-signin", "app-browse"].includes(options.step),
      ...credentialEvidence(options.step, files),
      ...(options.step === "app-browse" ? { plannedUiActionCount: 5, completedUiActionCount: browseActions.length, completedUiActions: browseActions } : {}),
      limitation: APP_STEPS.has(options.step)
        ? "Automated UI evidence only. No human participation, continuous Play enrollment, Google-side engagement credit or production eligibility is established. Smoke alone does not verify account identity."
        : "Only the requested Google setup phase was exercised. A password submission is not proof of a completed Google session, Play enrollment or Envitefy activity.",
      nextStep: browserAssociation
        ? "Inspect the saved Chrome association prompt. Use its observed Skip option to continue to the website sign-in form; do not select Continue as or associate the account with Chrome. This result does not establish an Envitefy session."
        : ownerGate ? "Inspect the saved screen and let the account owner complete the challenge or explicit consent. Do not send fresh codes automatically."
          : completion.classification === "unverified_credential_terminal_state"
            ? "Inspect the saved post-credential screen before continuing. A successful command exit and submitted credentials do not establish a completed sign-in phase; do not retry credentials automatically." : undefined };
    return passed ? 0 : 1;
  } catch (error) {
    status = { ...status, status: "incomplete", classification: "tool_or_preflight_failure", message: redact(error.message, secrets), identityVerified: false };
    return 1;
  } finally {
    status.completedAt = new Date().toISOString();
    try {
      await writeFile(path.join(dir, "status.json"), redact(JSON.stringify(status, null, 2), secrets));
      await scrubArtifacts(dir, secrets);
    } finally {
      for (const release of releases.reverse()) release();
    }
    console.log(`${device.account} ${options.step}: ${status.status}. Evidence: ${dir}`);
    if (status.message) console.log(redact(status.message, secrets));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }).catch(() => {
    console.error("Fleet session could not start. Check the account, explicit step, serial and fleet manifest. No credentials are printed.");
    process.exitCode = 1;
  });
}
