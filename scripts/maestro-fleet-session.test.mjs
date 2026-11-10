import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  buildFleetFlow,
  buildFleetMaestroArgs,
  classifyFleetSessionResult,
  credentialEvidence,
  expectedFleetDevice,
  FLEET_STEPS,
  parseFleetSessionArgs,
  recordedSessionBlockers,
  resolveFleetDevice,
  verifyFleetDevice,
  verifyPasswordForeground,
} from "./maestro-fleet-session.mjs";

const manifest = (account = "QA13") => ({
  schemaVersion: 1,
  kind: "envitefy-android-qa-fleet",
  profiles: [{ ...expectedFleetDevice(account), assigned: true, provisioned: true }],
});

test("no command selects a live action implicitly and code/signup steps cannot be requested", () => {
  assert.deepEqual(parseFleetSessionArgs([]), { help: true });
  assert.throws(() => parseFleetSessionArgs(["--account", "QA01"]), /explicit supported --step/);
  for (const step of ["signup", "chrome-code", "chrome-request-code", "delete"]) {
    assert.throws(() => parseFleetSessionArgs(["--account", "QA01", "--step", step]), /explicit supported --step/);
  }
  assert.throws(() => parseFleetSessionArgs(["--account", "QA01", "--step", "smoke", "--account", "QA02"]), /each once/);
});

test("driver reuse requires the explicit valueless option exactly once", () => {
  const base = ["--account", "QA01", "--step", "app-browse"];
  assert.deepEqual(parseFleetSessionArgs(base), { account: "QA01", step: "app-browse" });
  assert.deepEqual(parseFleetSessionArgs([...base, "--reuse-installed-driver"]),
    { account: "QA01", step: "app-browse", reuseInstalledDriver: true });
  assert.equal(parseFleetSessionArgs(["--reuse-installed-driver", ...base, "--serial", "emulator-5560"]).serial, "emulator-5560");
  for (const extra of [["--reuse-installed-driver", "--reuse-installed-driver"],
    ["--reuse-installed-driver=true"], ["--reuse-installed-driver", "true"], ["--reuse-installed-driver", "false"]])
    assert.throws(() => parseFleetSessionArgs([...base, ...extra]));
  assert.throws(() => parseFleetSessionArgs(["--account", "QA01", "--reuse-installed-driver"]), /explicit supported --step/);
});

test("default Maestro argv is preserved and explicit reuse is placed after the test subcommand", () => {
  const inputs = { serial: "emulator-5560", dir: path.join("synthetic", "evidence"), flow: path.join("synthetic", "evidence", "flow.yaml") };
  const original = ["--device", inputs.serial, "test", "--no-ansi", "--format", "JUNIT",
    "--output", path.join(inputs.dir, "junit.xml"), "--test-output-dir", inputs.dir, "--debug-output", inputs.dir, inputs.flow];
  assert.deepEqual(buildFleetMaestroArgs(inputs), original);
  assert.deepEqual(buildFleetMaestroArgs({ ...inputs, reuseInstalledDriver: false }), original);
  const parsed = parseFleetSessionArgs(["--account", "QA01", "--step", "app-browse", "--reuse-installed-driver"]);
  const actual = buildFleetMaestroArgs({ ...inputs, reuseInstalledDriver: parsed.reuseInstalledDriver });
  assert.deepEqual(actual, [...original.slice(0, 3), "--no-reinstall-driver", ...original.slice(3)]);
  assert.equal(actual.filter(x => x === "--no-reinstall-driver").length, 1);
  for (const value of ["true", "false", 1, null])
    assert.throws(() => buildFleetMaestroArgs({ ...inputs, reuseInstalledDriver: value }), /explicit boolean/);
});

test("QA13 works without an event fixture but neither legacy nor another account's serial can be used", () => {
  assert.equal(resolveFleetDevice({ account: "QA13", step: "app-session" }, manifest()).serial, "emulator-5584");
  for (const serial of ["emulator-5556", "emulator-5560", "device-physical"]) {
    assert.throws(() => resolveFleetDevice({ account: "QA13", serial }, manifest()), /different fleet account/);
  }
  assert.throws(() => expectedFleetDevice("QA14"), /QA01 through QA13/);
  assert.throws(() => resolveFleetDevice({ account: "QA13" }), /Provide --serial/);
});

test("unassigned, unprovisioned, duplicate and swapped manifest entries fail closed", () => {
  for (const key of ["assigned", "provisioned"]) {
    const data = manifest();
    data.profiles[0][key] = false;
    assert.throws(() => resolveFleetDevice({ account: "QA13" }, data), /not assigned/);
  }
  const swapped = manifest();
  swapped.profiles[0].avdName = "Envitefy_Fleet_QA12";
  assert.throws(() => resolveFleetDevice({ account: "QA13" }, swapped), /mapping/);
  const duplicate = manifest();
  duplicate.profiles.push({ ...duplicate.profiles[0] });
  assert.throws(() => resolveFleetDevice({ account: "QA13" }, duplicate), /exactly one/);
});

test("device preflight rejects a different AVD before any other adb operation", async () => {
  const calls = [];
  await assert.rejects(verifyFleetDevice(expectedFleetDevice("QA03"), "fake-adb", async (_binary, args) => {
    calls.push(args);
    return { exitCode: 0, output: "Envitefy_Fleet_QA02\nOK\n", timedOut: false };
  }), /assigned AVD/);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ["-s", "emulator-5564", "emu", "avd", "name"]);
});

test("boot must finish on the exact assigned AVD; timed-out inspection is not success", async () => {
  const device = expectedFleetDevice("QA04");
  for (const boot of [{ exitCode: 0, output: "0" }, { exitCode: 0, output: "1", timedOut: true }]) {
    await assert.rejects(verifyFleetDevice(device, "fake-adb", async (_binary, args) =>
      args.includes("emu") ? { exitCode: 0, output: `${device.avdName}\nOK` } : boot), /not completed booting/);
  }
  assert.deepEqual(await verifyFleetDevice(device, "fake-adb", async (_binary, args) => ({
    exitCode: 0, output: args.includes("emu") ? `${device.avdName}\r\r\nOK\r\r\n` : "1\r\r\n",
  })), { avdName: device.avdName, bootCompleted: true });
});

test("Google password phases reject a browser or unrelated foreground package", async () => {
  const fake = (output) => async () => ({ exitCode: 0, output });
  await assert.rejects(verifyPasswordForeground("play-password", "emulator-5560", "fake-adb",
    fake("topResumedActivity=ActivityRecord{0 u0 com.android.chrome/.Main t1}")), /expected Google/);
  await assert.rejects(verifyPasswordForeground("chrome-password", "emulator-5560", "fake-adb",
    fake("mResumedActivity: ActivityRecord{0 u0 com.envitefy.app/.Main t1}")), /expected Google/);
  await verifyPasswordForeground("play-password", "emulator-5560", "fake-adb",
    fake("topResumedActivity=ActivityRecord{0 u0 com.google.android.gms/.Login t1}\nmResumedActivity: ActivityRecord{0 u0 com.google.android.gms/.Login t1}"));
  await verifyPasswordForeground("chrome-password", "emulator-5560", "fake-adb",
    fake("mResumedActivity: ActivityRecord{0 u0 com.android.chrome/.Main t1}"));
  await assert.rejects(verifyPasswordForeground("chrome-signin", "emulator-5560", "fake-adb",
    fake("mResumedActivity: ActivityRecord{0 u0 com.google.android.gms/.Login t1}")), /expected Google/);
  await verifyPasswordForeground("chrome-signin", "emulator-5560", "fake-adb",
    fake("mResumedActivity: ActivityRecord{0 u0 com.android.chrome/.Main t1}"));
  await verifyPasswordForeground("play-signin", "emulator-5560", "fake-adb", async () => {
    assert.fail("Combined sign-in must establish the password screen inside its flow, not require it before opening Play.");
  });
});

test("generated phases preserve data and never request a code, solve a CAPTCHA or select signup", async () => {
  for (const step of Object.keys(FLEET_STEPS)) {
    const source = await buildFleetFlow(step);
    assert.equal((source.match(/^---$/gm) || []).length, 1, `${step}: one YAML flow`);
    assert.doesNotMatch(source, /recaptcha-anchor|MAESTRO_VERIFICATION_CODE|chrome-google-request-code|clearState:\s*true/);
    assert.doesNotMatch(source, /tapOn:[^\n]*(?:sign up|Sign up|I confirm|Create account|Send.*code)/);
    assert.match(source, /owner-verification-required/);
    if (step.endsWith("password")) assert.match(source, /assertVisible: '\.\*\$\{MAESTRO_EMAIL_PATTERN\}\.\*'/);
    if (step.startsWith("app-") || step === "smoke") assert.match(source, /clearState: false/);
  }
});

test("sign-in verifies the resulting account and read-only browsing returns to it without record writes", async () => {
  const signin = await buildFleetFlow("app-signin");
  assert.match(signin, /Sign in with Google/);
  assert.match(signin, /https:\/\/envitefy\.com\/settings/);
  assert.match(signin, /authenticated-profile/);
  assert.doesNotMatch(signin, /20261026|scheduled-|MAESTRO_EVENT_ID|MAESTRO_DAY4/);
  const browse = await buildFleetFlow("app-browse");
  assert.ok(browse.indexOf("authenticated-profile") < browse.indexOf("fleet-catalog-opened"));
  assert.ok(browse.indexOf("fleet-catalog-scrolled") < browse.indexOf("fleet-account-reverified"));
  assert.ok(browse.indexOf("fleet-account-reverified") < browse.indexOf("fleet-dashboard-returned"));
  assert.doesNotMatch(browse, /inputText:|Save|Publish|MAESTRO_EVENT_ID/);
});

test("combined Play sign-in keeps exact-account password entry and outcome checks within one bounded flow", async () => {
  const source = await buildFleetFlow("play-signin");
  const emailInput = source.indexOf("- inputText: ${MAESTRO_EMAIL}");
  const welcome = source.indexOf('- assertVisible: "Welcome"');
  const exactAccount = source.indexOf("- assertVisible: '.*${MAESTRO_EMAIL_PATTERN}.*'", welcome);
  const passwordInput = source.indexOf("- inputText: ${MAESTRO_PASSWORD}");
  const outcome = source.indexOf("google-credential-outcome");
  assert.ok(emailInput > 0 && welcome > emailInput);
  assert.ok(exactAccount > welcome && passwordInput > exactAccount);
  assert.ok(source.indexOf('visible: "Enter your password"', welcome) < passwordInput);
  assert.ok(outcome > passwordInput);
  assert.match(source, /timeout: 90000/);
  assert.match(source, /google-terms-owner-action-required/);
  assert.match(source, /google-credentials-rejected/);
  assert.doesNotMatch(source, /tapOn:[^\n]*(?:I agree|Accept|Create account|Send.*code)/);
  assert.equal((source.match(/^---$/gm) || []).length, 1);
  assert.equal((source.match(/- inputText: \$\{MAESTRO_PASSWORD\}/g) || []).length, 1);
});

test("combined Chrome phase requires the observed website email form and guards the assigned account before password input", async () => {
  const source = await buildFleetFlow("chrome-signin");
  const emailInput = source.indexOf("- inputText: ${MAESTRO_EMAIL}");
  const passwordInput = source.indexOf("- inputText: ${MAESTRO_PASSWORD}");
  assert.ok(emailInput > 0 && passwordInput > emailInput);
  const beforeEmail = source.slice(0, emailInput);
  assert.match(beforeEmail, /assertNotVisible: "Sign in to this site and Chrome"/);
  assert.match(beforeEmail, /assertNotVisible: "Sign in to Chrome"/);
  assert.match(beforeEmail, /assertVisible: 'accounts\\\.google\\\.com'/);
  assert.match(beforeEmail, /- assertVisible:\n    id: "identifierId"/);
  const beforePassword = source.slice(emailInput, passwordInput);
  assert.match(beforePassword, /account-recovery-owner-action-required/);
  assert.match(beforePassword, /captcha-owner-action-required/);
  assert.match(beforePassword, /assertNotVisible: "Sign in to this site and Chrome"/);
  assert.match(beforePassword, /assertVisible: 'accounts\\\.google\\\.com'/);
  assert.match(beforePassword, /assertVisible: '\.\*\$\{MAESTRO_EMAIL_PATTERN\}\.\*'/);
  assert.match(beforePassword, /visible: "Enter your password\|Введите пароль"/);
  assert.equal((source.match(/- inputText: \$\{MAESTRO_PASSWORD\}/g) || []).length, 1);
  assert.doesNotMatch(source, /tapOn:[^\n]*(?:Continue|Продолжить|Skip|Send.*code|Try another way)|openLink:|launchApp:/);
  const afterPassword = source.slice(passwordInput);
  assert.match(afterPassword, /timeout: 90000/);
  assert.ok(afterPassword.indexOf("chrome-credential-outcome") < afterPassword.indexOf("chrome-oauth-consent-ready"));
  const consent = afterPassword.slice(afterPassword.indexOf('visible: "^Continue$|^Продолжить$"'), afterPassword.indexOf("chrome-oauth-consent-ready"));
  assert.match(consent, /assertVisible: 'accounts\\\.google\\\.com'/);
  assert.match(consent, /MAESTRO_EMAIL_PATTERN/);
  assert.match(consent, /assertVisible: "\.\*Envitefy\.\*"/);
});

test("credential evidence never promotes submission or an OAuth screen to session identity proof", () => {
  assert.deepEqual(credentialEvidence("chrome-signin", []), {
    credentialsSubmitted: false, credentialOutcomeObserved: false,
    oauthConsentReady: false, dashboardObserved: false, googleSessionVerified: false,
  });
  const evidence = credentialEvidence("chrome-signin", [
    "run/google-oauth-password-result.png", "run/chrome-credential-outcome.png", "run/chrome-oauth-consent-ready.png",
  ]);
  assert.equal(evidence.credentialsSubmitted, true);
  assert.equal(evidence.credentialOutcomeObserved, true);
  assert.equal(evidence.oauthConsentReady, true);
  assert.equal(evidence.dashboardObserved, false);
  assert.equal(evidence.googleSessionVerified, false);
  assert.equal(Object.hasOwn(evidence, "identityVerified"), false);
  assert.deepEqual(recordedSessionBlockers(["run/account-recovery-owner-action-required.png"]),
    { browserAssociation: false, ownerGate: true });
  assert.deepEqual(credentialEvidence("chrome-password", ["run/google-oauth-password-result.png"]), {});
});

test("successful CLI exit with only credential screenshots is incomplete when the terminal gates all skip", () => {
  const success = { exitCode: 0, timedOut: false };
  for (const [step, screenshots, terminal] of [
    ["play-signin", ["google-password-submission-result", "google-credential-outcome"], "google-play-listing-ready"],
    ["chrome-signin", ["google-oauth-password-result", "chrome-credential-outcome"], "chrome-oauth-consent-ready"],
  ]) {
    const files = screenshots.map((name) => `run/takeScreenshot/${name}.png`);
    const incomplete = classifyFleetSessionResult(step, success, files);
    assert.equal(incomplete.passed, false);
    assert.equal(incomplete.status, "incomplete");
    assert.equal(incomplete.classification, "unverified_credential_terminal_state");
    assert.equal(incomplete.terminalStateObserved, false);
    const recognized = [...files, `run/takeScreenshot/${terminal}.png`];
    assert.equal(classifyFleetSessionResult(step, success, recognized).status, "step_completed");
    assert.equal(credentialEvidence(step, recognized).googleSessionVerified, false);
    const challenged = classifyFleetSessionResult(step, success, [...recognized, "run/owner-verification-required.png"]);
    assert.equal(challenged.status, "owner_action_required");
    assert.equal(challenged.passed, false);
    for (const result of [{ exitCode: 1, timedOut: false }, { exitCode: 0, timedOut: true }]) {
      assert.equal(classifyFleetSessionResult(step, result, recognized).passed, false);
    }
    assert.equal(classifyFleetSessionResult(step, success, [`run/${terminal}.png`]).passed, false);
  }
  assert.equal(classifyFleetSessionResult("app-session", success, ["run/authenticated-profile.png"]).status, "step_completed");
});

test("the positive Play outcome marker follows the owner gates and requires the app listing plus its install/open control", async () => {
  const source = await buildFleetFlow("play-signin");
  const terminal = source.slice(source.lastIndexOf("- runFlow:"));
  assert.match(terminal, /visible: "\^Install\$\|\^Open\$"/);
  assert.match(terminal, /assertVisible: '\(\?i\)\^Envitefy/);
  assert.match(terminal, /assertVisible: "\^Install\$\|\^Open\$"/);
  assert.ok(source.lastIndexOf("owner-verification-required") < source.indexOf("google-play-listing-ready"));
  assert.doesNotMatch(terminal, /tapOn:|inputText:|retry:|openLink:|launchApp:/);
});

test("Chrome association sheet stops account chooser before website-account interaction even when the page is visible behind it", async () => {
  const source = await buildFleetFlow("app-signin");
  const chooserWait = source.indexOf('visible: "Choose an account|Выберите аккаунт"');
  const stop = source.indexOf('assertNotVisible: "Sign in to this site and Chrome"', chooserWait);
  const pageAssertion = source.indexOf("- assertVisible: 'accounts\\.google\\.com'", chooserWait);
  const accountTap = source.indexOf("- tapOn: '.*${MAESTRO_EMAIL_PATTERN}.*'", chooserWait);
  assert.ok(chooserWait >= 0 && stop > chooserWait && pageAssertion > stop && accountTap > stop);
  assert.doesNotMatch(source, /tapOn:[^\n]*Continue as/);
  assert.deepEqual(recordedSessionBlockers(["run/takeScreenshot/browser-association-not-authorized.png"]),
    { browserAssociation: true, ownerGate: false });
  assert.deepEqual(recordedSessionBlockers(["run/takeScreenshot/existing-google-account-choice.png"]),
    { browserAssociation: false, ownerGate: false });
});

test("every fleet identity check opens the current mobile Profile detail and verifies its read-only sign-in email", async () => {
  for (const step of ["app-session", "app-signin", "app-browse"]) {
    const source = await buildFleetFlow(step);
    const expectedChecks = step === "app-browse" ? 2 : 1;
    assert.equal((source.match(/https:\/\/envitefy\.com\/settings\?section=profile/g) || []).length, expectedChecks);
    assert.equal((source.match(/- assertVisible: "Sign-in email"/g) || []).length, expectedChecks);
    assert.doesNotMatch(source, /https:\/\/envitefy\.com\/settings(?:\s|$)|- assertVisible: "Email"/);
    const before = source.slice(0, source.indexOf("authenticated-profile"));
    assert.match(before, /visible: '\.\*\$\{MAESTRO_EMAIL_PATTERN\}\.\*'/);
    if (step === "app-browse") {
      const after = source.slice(source.indexOf("fleet-catalog-scrolled"), source.indexOf("fleet-account-reverified"));
      assert.match(after, /settings\?section=profile/);
      assert.match(after, /visible: '\.\*\$\{MAESTRO_EMAIL_PATTERN\}\.\*'/);
      assert.match(after, /assertVisible: "Sign-in email"/);
    }
  }
});

test("observed password form is an explicit phase and requires Chrome foreground", async () => {
  assert.equal(parseFleetSessionArgs(["--account", "QA04", "--step", "chrome-password-observed"]).step,
    "chrome-password-observed");
  for (const invalid of ["chrome-password-observed=true", "chrome-password-anywhere"]) {
    assert.throws(() => parseFleetSessionArgs(["--account", "QA04", "--step", invalid]), /explicit supported/);
  }
  const fake = (output) => async () => ({ exitCode: 0, output });
  await assert.rejects(verifyPasswordForeground("chrome-password-observed", "emulator-5566", "fake-adb",
    fake("mResumedActivity: ActivityRecord{0 u0 com.google.android.gms/.Login t1}")), /expected Google/);
  await verifyPasswordForeground("chrome-password-observed", "emulator-5566", "fake-adb",
    fake("mResumedActivity: ActivityRecord{0 u0 com.android.chrome/.Main t1}"));
});

test("observed password phase uses exact recorded IDs with one input and one non-retrying submission", async () => {
  const source = await buildFleetFlow("chrome-password-observed");
  const input = source.indexOf("- inputText: ${MAESTRO_PASSWORD}");
  const next = source.indexOf('- tapOn:\n    id: "^passwordNext$"');
  assert.ok(input > 0 && next > input);
  assert.match(source.slice(0, input), /visible:\n      id: "\^password\$"\n    timeout: 30000/);
  assert.match(source.slice(0, input), /- tapOn:\n    id: "\^password\$"\n    retryTapIfNoChange: false/);
  assert.match(source.slice(next), /^- tapOn:\n    id: "\^passwordNext\$"\n    retryTapIfNoChange: false/);
  assert.equal((source.match(/- inputText:/g) || []).length, 1);
  assert.equal((source.match(/- tapOn:/g) || []).length, 2);
  assert.doesNotMatch(source, /Enter your password|Введите пароль|retry:|launchApp:|openLink:|clearState:|MAESTRO_EMAIL\}/);
  assert.doesNotMatch(source, /tapOn:[^\n]*(?:Continue|Продолжить|Cancel|Skip|Accept|I agree|Send.*code|Try another way)/);
});

test("observed password guards every input and submission boundary and stops after a bounded outcome", async () => {
  const source = await buildFleetFlow("chrome-password-observed");
  const input = source.indexOf("- inputText: ${MAESTRO_PASSWORD}");
  const next = source.indexOf('- tapOn:\n    id: "^passwordNext$"');
  const outcome = source.indexOf("- takeScreenshot: chrome-credential-outcome");
  assert.ok(outcome > next);
  for (const part of [source.slice(0, input), source.slice(input, next), source.slice(outcome)]) {
    for (const guard of ["owner-verification-required", "captcha-owner-action-required",
      "signup-consent-not-authorized", "browser-association-not-authorized",
      "account-recovery-owner-action-required", "google-credentials-rejected",
      "Set up screen lock to use passkeys", "google-terms-owner-action-required"]) {
      assert.ok(part.includes(guard), `Missing ${guard} at credential boundary`);
    }
    assert.match(part, /assertVisible: 'accounts\\\.google\\\.com'/);
    assert.match(part, /assertVisible: '\.\*\$\{MAESTRO_EMAIL_PATTERN\}\.\*'/);
  }
  assert.match(source.slice(next, outcome), /timeout: 90000/);
  assert.equal((source.match(/^---$/gm) || []).length, 1);
  assert.doesNotMatch(source.slice(outcome), /tapOn:|inputText:/);
});

test("observed password submission never establishes identity or a completed credential phase without terminal evidence", () => {
  const step = "chrome-password-observed";
  const success = { exitCode: 0, timedOut: false };
  const submitted = ["run/google-oauth-password-result.png", "run/chrome-credential-outcome.png"];
  assert.deepEqual(credentialEvidence(step, submitted), {
    credentialsSubmitted: true, credentialOutcomeObserved: true,
    oauthConsentReady: false, dashboardObserved: false, googleSessionVerified: false,
  });
  assert.equal(classifyFleetSessionResult(step, success, submitted).classification, "unverified_credential_terminal_state");
  const consent = [...submitted, "run/chrome-oauth-consent-ready.png"];
  assert.equal(classifyFleetSessionResult(step, success, consent).terminalState, "envitefy_oauth_consent");
  assert.equal(credentialEvidence(step, consent).googleSessionVerified, false);
  assert.equal(Object.hasOwn(credentialEvidence(step, consent), "identityVerified"), false);
  assert.equal(classifyFleetSessionResult(step, success, ["run/chrome-oauth-consent-ready.png"]).passed, false);
  assert.equal(classifyFleetSessionResult(step, { exitCode: 0, timedOut: true }, consent).passed, false);
  for (const gate of ["owner-verification-required", "captcha-owner-action-required", "account-recovery-owner-action-required",
    "signup-consent-not-authorized", "google-terms-owner-action-required"]) {
    const result = classifyFleetSessionResult(step, success, [...consent, `run/${gate}.png`]);
    assert.equal(result.status, "owner_action_required");
    assert.equal(result.passed, false);
  }
  assert.equal(classifyFleetSessionResult(step, success, [...consent, "run/browser-association-not-authorized.png"]).classification,
    "unsupported_browser_association_prompt");
});
