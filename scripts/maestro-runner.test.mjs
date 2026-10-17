import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ANDROID_APP_ID, inspectAndroid, selectAndroidDevice } from "./lib/maestro-android.mjs";
import { appOrigin, configuredAccounts } from "./lib/maestro-config.mjs";
import {
  ACTIVE_SCENARIOS,
  classifyFailure,
  contained,
  fingerprint,
  localOrigin,
  redact,
  runProcess,
  scrubArtifacts,
  selectScenarios,
} from "./lib/maestro-core.mjs";
import { authenticatedRequest } from "./lib/maestro-environment.mjs";
import { inspectFailure, updateFindingRegistry, writeReports } from "./lib/maestro-report.mjs";

test("supplied-account checks stop on missing values without exposing credentials", () => {
  assert.throws(
    () => configuredAccounts({ MAESTRO_QA01_PASSWORD: "do-not-print-this" }),
    (error) =>
      error.message.includes("MAESTRO_BASE_URL") &&
      error.message.includes("MAESTRO_QA12_PASSWORD") &&
      !error.message.includes("do-not-print-this"),
  );
});

test("configured origins require HTTPS remotely and reject embedded credentials", () => {
  assert.equal(appOrigin("https://qa.example.test/"), "https://qa.example.test");
  assert.equal(appOrigin("http://127.0.0.1:3217"), "http://127.0.0.1:3217");
  for (const value of [
    "http://qa.example.test",
    "https://user:password@qa.example.test",
    "https://qa.example.test/path",
  ])
    assert.throws(() => appOrigin(value));
});

test("a selected supplied account preserves password spaces and needs no synthetic fixtures", () => {
  const environment = configuredAccounts(
    {
      MAESTRO_BASE_URL: "https://envitefy.com",
      MAESTRO_QA01_EMAIL: "first@example.test",
      MAESTRO_QA01_PASSWORD: "  intentional spaces  ",
    },
    [{ account: "QA01" }],
  );
  assert.equal(environment.configured, true);
  assert.equal(environment.accounts[0].password, "  intentional spaces  ");
  assert.equal(environment.accounts[0].eventId, "");
});

test("mutating test environments reject remote origins, credentials and paths", () => {
  for (const url of [
    "https://envitefy.com",
    "http://example.com",
    "http://localhost@evil.test",
    "http://localhost:3000/path",
    "http://localhost:3000/?x=1",
    "http://localhost:3000/#secret",
  ])
    assert.throws(() => localOrigin(url));
  assert.equal(localOrigin("http://127.0.0.1:3217"), "http://127.0.0.1:3217");
  assert.throws(() => contained("/safe/root", "../../private"));
});

test("deferred QA11 stays prepared for explicit selection and is omitted from default runs", () => {
  assert.equal(selectScenarios().length, 11);
  assert.ok(!selectScenarios().some((item) => item.account === "QA11"));
  assert.ok(selectScenarios().some((item) => item.account === "QA12"));
  assert.throws(() => selectScenarios(["QA13"]), /Unknown flow selection/);
  for (const selector of ["QA11", "11", "11-dashboard-calendar"])
    assert.deepEqual(
      selectScenarios([selector]).map((item) => item.account),
      ["QA11"],
    );
  assert.throws(
    () =>
      configuredAccounts({ MAESTRO_BASE_URL: "https://envitefy.com" }, selectScenarios(["QA11"])),
    /MAESTRO_QA11_EMAIL/,
  );
  const configured = configuredAccounts(
    {
      MAESTRO_BASE_URL: "https://envitefy.com",
      MAESTRO_QA11_EMAIL: "calendar@example.test",
      MAESTRO_QA11_PASSWORD: "  selected-calendar-password  ",
      MAESTRO_QA11_EVENT_ID: "00000000-0000-4000-8000-000000000011",
      MAESTRO_QA11_EVENT_TITLE: "QA11 calendar test",
    },
    selectScenarios(["QA11"]),
  );
  assert.equal(configured.accounts[10].email, "calendar@example.test");
  assert.equal(configured.accounts[10].password, "  selected-calendar-password  ");
  assert.equal(configured.accounts[10].eventTitle, "QA11 calendar test");
  assert.ok(configured.secretValues.includes("  selected-calendar-password  "));
});

test("Google credentials are explicitly distinguished from Envitefy password accounts", () => {
  const environment = configuredAccounts(
    {
      MAESTRO_BASE_URL: "https://envitefy.com",
      MAESTRO_AUTH_PROVIDER: "google",
      MAESTRO_QA01_EMAIL: "one@example.test",
      MAESTRO_QA01_PASSWORD: "google-password",
    },
    [{ account: "QA01" }],
  );
  assert.equal(environment.authProvider, "google");
});

test("Google credentials are rejected before an Envitefy password request is created", async () => {
  await assert.rejects(
    () => authenticatedRequest("https://envitefy.com", { authProvider: "google" }),
    /must not be sent/,
  );
});

test("Android selection distinguishes missing, unauthorized and ambiguous devices", () => {
  assert.throws(() => selectAndroidDevice("List of devices attached\n"), /No authorized/);
  assert.throws(() => selectAndroidDevice("phone unauthorized\n", "phone"), /unauthorized/);
  assert.throws(() => selectAndroidDevice("one device\ntwo device\n"), /Multiple/);
  assert.equal(selectAndroidDevice("emulator-5556 device product:pixel\n"), "emulator-5556");
});

test("Android preflight rejects sideloaded builds before any app action", async () => {
  const commands = [];
  await assert.rejects(
    () =>
      inspectAndroid({ androidAppId: ANDROID_APP_ID }, async (_, args) => {
        commands.push(args.join(" "));
        return {
          exitCode: 0,
          output:
            args[0] === "devices"
              ? "phone device\n"
              : `package:${ANDROID_APP_ID} installer=com.android.shell\n`,
        };
      }),
    /not identified as Google Play installed/,
  );
  assert.equal(commands.length, 2);
  assert.ok(commands.every((command) => !/install |am start|clear /.test(command)));
});

test("all twelve Android flows target the native app and have website counterparts", async () => {
  assert.equal(ACTIVE_SCENARIOS.length, 12);
  for (const scenario of ACTIVE_SCENARIOS) {
    const flow = await readFile(
      path.resolve(".maestro/android/flows", path.basename(scenario.file)),
      "utf8",
    );
    assert.match(flow, /appId: \$\{MAESTRO_ANDROID_APP_ID\}/);
    assert.doesNotMatch(flow, /^url:/m);
    assert.ok(await readFile(path.resolve(scenario.file), "utf8"));
  }
  const login = await readFile(".maestro/android/shared/open-login.yaml", "utf8");
  assert.match(login, /api\/auth\/signout/);
  assert.doesNotMatch(login, /clearState/);
  const oauth = await readFile(".maestro/android/shared/login.yaml", "utf8");
  assert.match(oauth, /Sign in with Google/);
  assert.doesNotMatch(oauth, /\$\{MAESTRO_PASSWORD\}/);
});

test("redaction preserves valid JSON while removing credentials and authorization", () => {
  const secret = "my-password-123456";
  const safe = redact(
    JSON.stringify({
      password: secret,
      authSecret: "private-auth-value",
      tokens: ["Bearer private-value"],
      evaluatedInput: secret,
    }),
    [secret],
  );
  assert.doesNotThrow(() => JSON.parse(safe));
  assert.ok(!safe.includes(secret));
  assert.ok(!safe.includes("private-auth-value"));
  assert.ok(!safe.includes("Bearer private-value"));
});

test("timeout and missing browser are distinct from an assertion finding", () => {
  assert.equal(classifyFailure({ timedOut: true }), "incomplete_check");
  assert.equal(
    classifyFailure({ output: "Unable to obtain: chromedriver" }),
    "environment_or_test_failure",
  );
  assert.equal(
    classifyFailure({ output: "Assertion is false: text not visible" }),
    "suspected_defect",
  );
});

test("redaction removes short and JSON-escaped supplied passwords without breaking JSON", () => {
  for (const secret of [":", "abc", 'a"quoted\\password']) {
    const result = JSON.parse(
      redact(JSON.stringify({ evaluatedInput: secret, count: 12 }), [secret]),
    );
    assert.equal(result.evaluatedInput, "[REDACTED]");
    assert.equal(result.count, 12);
  }
});

test("the same failure across accounts deduplicates while a different step stays separate", () => {
  const first = {
    scenario: "a",
    failedStep: "assertVisible: Saved",
    message: "QA01 cannot find Saved at 127.0.0.1:3217",
  };
  const second = { ...first, scenario: "b", message: "QA02 cannot find Saved at 127.0.0.1:4444" };
  assert.equal(fingerprint(first), fingerprint(second));
  assert.notEqual(fingerprint(first), fingerprint({ ...first, failedStep: "tapOn: Publish" }));
});

test("a process timeout terminates the check and returns an incomplete result", async () => {
  const result = await runProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    timeoutMs: 200,
  });
  assert.equal(result.timedOut, true);
  assert.equal(result.exitCode, null);
});

test("exit codes and complete stdout survive process execution", async () => {
  const result = await runProcess(process.execPath, [
    "-e",
    'console.log("complete output"); process.exitCode=3;',
  ]);
  assert.equal(result.exitCode, 3);
  assert.match(result.output, /complete output/);
});

test("finding history deduplicates repeated imports and preserves explicit triage across runs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "envitefy-maestro-registry-"));
  try {
    const finding = {
      id: "F-one",
      classification: "suspected_defect",
      severity: "untriaged",
      occurrences: [{ account: "QA02", scenario: "save", artifactDir: "save" }],
    };
    const report = {
      runId: "run-one",
      commit: "first",
      generatedAt: "2026-10-16T13:00:00Z",
      findings: [finding],
    };
    await updateFindingRegistry(dir, report);
    const initial = await updateFindingRegistry(dir, report);
    assert.equal(initial.findings[0].occurrences.length, 1);
    initial.findings[0].classification = "test_script_problem";
    initial.findings[0].triage = { note: "The selector was verified to target a hidden control." };
    await writeFile(path.join(dir, "findings.json"), JSON.stringify(initial));
    const repeated = await updateFindingRegistry(dir, {
      ...report,
      runId: "run-two",
      commit: "second",
      generatedAt: "2026-10-16T14:00:00Z",
    });
    assert.equal(repeated.findings[0].firstSeen, report.generatedAt);
    assert.equal(repeated.findings[0].lastSeen, "2026-10-16T14:00:00Z");
    assert.equal(repeated.findings[0].occurrences.length, 2);
    assert.equal(repeated.findings[0].classification, "test_script_problem");
    assert.match(repeated.findings[0].triage.note, /hidden control/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a failed bounded wait retains its timeout instead of claiming a confirmed defect", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "envitefy-maestro-wait-"));
  try {
    await writeFile(
      path.join(dir, "commands.json"),
      JSON.stringify([
        {
          command: {
            assertConditionCommand: {
              timeout: "60000",
              condition: { visible: { textRegex: "Saved" } },
            },
          },
          metadata: {
            status: "FAILED",
            error: { message: "Assertion is false: Saved is visible" },
          },
        },
      ]),
    );
    const failure = await inspectFailure(dir);
    assert.equal(failure.waitTimedOut, true);
    assert.equal(failure.waitTimeoutMs, 60000);
    assert.equal(classifyFailure({ timedOut: failure.waitTimedOut }), "incomplete_check");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("nested Maestro artifacts are parsed, secrets scrubbed, reports escaped and successful results retained", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "envitefy-maestro-"));
  try {
    const artifact = path.join(dir, "flow/nested");
    await mkdir(artifact, { recursive: true });
    await writeFile(
      path.join(artifact, "commands.json"),
      JSON.stringify([
        {
          command: { assertConditionCommand: { condition: "visible: Saved" } },
          metadata: { status: "FAILED", error: { message: "<script>bad()</script>" } },
        },
      ]),
    );
    await writeFile(path.join(artifact, "console.log"), "my-password-123456");
    await scrubArtifacts(dir, ["my-password-123456"]);
    assert.equal(await readFile(path.join(artifact, "console.log"), "utf8"), "[REDACTED]");
    const failure = await inspectFailure(path.join(dir, "flow"));
    assert.match(failure.failedStep, /assertConditionCommand/);
    const report = await writeReports(dir, [
      {
        scenario: "ok",
        name: "Passed check",
        account: "QA01",
        status: "passed",
        artifactDir: "ok",
      },
      {
        scenario: "broken",
        name: "Broken check",
        account: "QA02",
        status: "failed",
        classification: "suspected_defect",
        artifactDir: "flow",
        ...failure,
      },
      {
        scenario: "broken2",
        name: "Broken check",
        account: "QA03",
        status: "failed",
        classification: "suspected_defect",
        artifactDir: "flow",
        ...failure,
      },
    ]);
    assert.equal(report.summary.passed, 1);
    assert.equal(report.summary.findings, 1);
    assert.equal(report.summary.confirmedDefects, 0);
    assert.equal(report.findings[0].occurrences.length, 2);
    const html = await readFile(path.join(dir, "report.html"), "utf8");
    assert.ok(!html.includes("<script>bad()"));
    assert.ok(html.includes("&lt;script&gt;"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
