import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { companionChecks } from "./lib/maestro-companion.mjs";
import { loadConfiguredEnvironment } from "./lib/maestro-config.mjs";
import {
  ARTIFACT_ROOT,
  classifyFailure,
  contained,
  localOrigin,
  maestroCommand,
  ROOT,
  runProcess,
  SCENARIOS,
  scrubArtifacts,
  snapshotFlow,
} from "./lib/maestro-core.mjs";
import { startEnvironment, warmScenario } from "./lib/maestro-environment.mjs";
import { inspectFailure, updateFindingRegistry, writeReports } from "./lib/maestro-report.mjs";

const args = process.argv.slice(2);
if (args.includes("--list")) {
  for (const item of SCENARIOS) console.log(`${item.account}  ${item.id}  ${item.name}`);
  process.exit(0);
}
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const unknown = args.filter(
  (arg, index) =>
    ![
      "--flow",
      "--timeout-ms",
      "--headed",
      "--attach",
      "--env-file",
      "--check",
      "--local-fixtures",
    ].includes(arg) &&
    !["--flow", "--timeout-ms", "--attach", "--env-file"].includes(args[index - 1]),
);
if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(", ")}`);
const selected = option("--flow")?.split(",");
const matches = (item, selector) =>
  item.id === selector || item.account === selector || item.id.startsWith(`${selector}-`);
if (selected?.some((selector) => !SCENARIOS.some((item) => matches(item, selector))))
  throw new Error("Unknown flow selection. Run npm run test:maestro -- --list.");
const scenarios = SCENARIOS.filter(
  (item) => !selected || selected.some((selector) => matches(item, selector)),
);
if (!scenarios.length) throw new Error("No matching flow. Run npm run test:maestro -- --list.");
const localFixtures = args.includes("--local-fixtures") || Boolean(option("--attach"));
if (args.includes("--check") && localFixtures)
  throw new Error("--check validates supplied account variables; omit --local-fixtures/--attach.");
let configuredEnvironment;
if (!localFixtures) {
  try {
    configuredEnvironment = await loadConfiguredEnvironment(option("--env-file"), scenarios);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
if (args.includes("--check")) {
  console.log(
    `Configuration complete for ${scenarios.length} selected accounts at ${configuredEnvironment.baseUrl}. No browser, login or app requests were started.`,
  );
  process.exit(0);
}
const timeoutMs = Number(option("--timeout-ms") || 240000);
if (!Number.isInteger(timeoutMs) || timeoutMs < 10000 || timeoutMs > 900000)
  throw new Error("Flow timeout must be 10000–900000 ms.");
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
const runDir = path.join(ARTIFACT_ROOT, runId);
await mkdir(runDir, { recursive: true });
let commit = "unknown";
try {
  commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
} catch {
  /* Report missing git metadata. */
}
const metadata = {
  runId,
  commit,
  environment: localFixtures ? "isolated-local" : "user-configured",
  limitations: [
    "Existing accounts, artwork and scans are prerequisites; registration, generation and scan upload are not exercised.",
    "AI generation, provider OCR and email inbox delivery are not verified.",
    localFixtures
      ? "Seeded artwork and scan data exercise application editing and display."
      : "Supplied test records will be modified; the environment's normal notification configuration applies.",
    "Maestro browser support covers Chromium; browser/device coverage is not universal.",
    "UI permission assertions do not independently certify server authorization.",
  ],
};
const results = [];
const selectorText = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let environment;
let secrets = [];
console.log(`Run ${runId}: ${scenarios.length} account flows. Artifacts: ${runDir}`);
try {
  const command = await maestroCommand();
  const version = await runProcess(command.binary, ["--version"], {
    env: command.env,
    timeoutMs: 30000,
  });
  if (version.exitCode !== 0) throw new Error(`Maestro did not start: ${version.output}`);
  if (option("--attach")) {
    const attached = contained(ARTIFACT_ROOT, option("--attach"));
    const summary = JSON.parse(await readFile(path.join(attached, "environment.json"), "utf8"));
    if (summary.kind !== "envitefy-maestro-local")
      throw new Error("Only an Envitefy Maestro local environment can be attached.");
    const data = JSON.parse(await readFile(path.join(attached, "runtime/secrets.json"), "utf8"));
    environment = {
      baseUrl: localOrigin(summary.baseUrl),
      accounts: data.accounts,
      secretValues: [
        data.databasePassword,
        data.authSecret,
        data.blobToken,
        ...data.accounts.map((account) => account.password),
      ],
    };
  } else environment = configuredEnvironment || (await startEnvironment(runDir));
  secrets = environment.secretValues;
  console.log(
    localFixtures
      ? `Local Envitefy ready at ${environment.baseUrl}. Twelve synthetic accounts seeded.`
      : `Using supplied test accounts at ${environment.baseUrl}.`,
  );
  for (const scenario of scenarios) {
    const account = environment.accounts.find((account) => account.alias === scenario.account);
    const dir = path.join(runDir, scenario.id);
    await mkdir(dir, { recursive: true });
    const startedAt = new Date().toISOString();
    console.log(`${scenario.account}: ${scenario.name}`);
    try {
      await warmScenario(environment, scenario, account);
    } catch (error) {
      results.push({
        scenario: scenario.id,
        name: scenario.name,
        account: scenario.account,
        status: "failed",
        classification: "environment_or_test_failure",
        message: error.message,
        artifactDir: scenario.id,
        startedAt,
      });
      await writeFile(path.join(dir, "console.log"), error.message);
      await writeReports(runDir, results, metadata, secrets);
      console.log("  route preparation failed; continuing with the next account.");
      continue;
    }
    const sourceSnapshot = await snapshotFlow(scenario, dir);
    const result = await runProcess(
      command.binary,
      [
        "test",
        ...(args.includes("--headed") ? [] : ["--headless"]),
        "--screen-size",
        "1440x1000",
        "--no-ansi",
        "--format",
        "JUNIT",
        "--output",
        path.join(dir, "junit.xml"),
        "--test-output-dir",
        dir,
        "--debug-output",
        dir,
        sourceSnapshot.file,
      ],
      {
        env: {
          ...command.env,
          MAESTRO_BASE_URL: environment.baseUrl,
          MAESTRO_EMAIL: account.email,
          MAESTRO_EMAIL_PATTERN: selectorText(account.email),
          MAESTRO_PASSWORD: account.password,
          MAESTRO_ACCOUNT: account.alias,
          MAESTRO_EVENT_ID: account.eventId,
          MAESTRO_EVENT_TITLE: selectorText(account.eventTitle),
          MAESTRO_SLOT_LABEL: selectorText(account.slotLabel || "Welcome desk"),
          MAESTRO_PATIENT_NAME: selectorText(
            account.patientName || environment.accounts[4].patientName || "Synthetic Patient",
          ),
          MAESTRO_CLINICIAN_NAME: selectorText(
            account.clinicianName || environment.accounts[4].clinicianName || "Synthetic Clinician",
          ),
          MAESTRO_PRIVATE_EVENT_TITLE: selectorText(
            environment.accounts[4].eventTitle || "Synthetic medical appointment",
          ),
        },
        timeoutMs,
        secrets,
      },
    );
    await writeFile(path.join(dir, "console.log"), result.output);
    await scrubArtifacts(dir, secrets);
    const failure = result.exitCode === 0 ? {} : await inspectFailure(dir);
    const entry = {
      scenario: scenario.id,
      name: scenario.name,
      account: scenario.account,
      role: scenario.role,
      file: scenario.file,
      sourceDigest: sourceSnapshot.digest,
      startedAt,
      durationMs: Date.now() - Date.parse(startedAt),
      artifactDir: scenario.id,
      status: result.exitCode === 0 ? "passed" : "failed",
      exitCode: result.exitCode,
      ...failure,
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
              (result.timedOut
                ? `Flow exceeded ${timeoutMs} ms; subsequent steps remain unverified.`
                : result.output.trim().split("\n").slice(-12).join("\n")),
          }),
    };
    try {
      entry.apiChecks = await companionChecks(
        environment,
        scenario,
        account,
        dir,
        entry.status === "passed",
      );
    } catch (error) {
      entry.apiChecks = [
        { name: "Server companion setup", status: "failed", message: error.message },
      ];
    }
    if (entry.status === "passed" && entry.apiChecks.some((check) => check.status === "failed")) {
      entry.status = "failed";
      entry.classification = "suspected_defect";
      entry.message = entry.apiChecks
        .filter((check) => check.status === "failed")
        .map((check) => `${check.name}: ${check.message}`)
        .join("\n");
    }
    results.push(entry);
    await writeReports(runDir, results, metadata, secrets);
    console.log(`  ${entry.status}${entry.classification ? ` (${entry.classification})` : ""}`);
  }
} catch (error) {
  secrets = error.maestroSecrets || secrets;
  await mkdir(path.join(runDir, "runtime"), { recursive: true });
  await writeFile(path.join(runDir, "runtime/console.log"), error.message);
  results.push({
    scenario: "setup",
    name: "Local test environment setup",
    account: "setup",
    status: "failed",
    classification: "environment_or_test_failure",
    message: error.message,
    artifactDir: "runtime",
  });
  for (const scenario of scenarios.filter(
    (item) => !results.some((result) => result.scenario === item.id),
  ))
    results.push({
      ...scenario,
      scenario: scenario.id,
      status: "skipped",
      message: "The test environment could not start; application behavior remains unverified.",
    });
  console.error(error.message);
} finally {
  try {
    await environment?.shutdown?.();
  } catch (error) {
    console.error(`Test environment shutdown: ${error.message}`);
  }
  await scrubArtifacts(runDir, secrets);
  const report = await writeReports(runDir, results, metadata, secrets);
  await updateFindingRegistry(ARTIFACT_ROOT, report);
  console.log(
    `Report: ${path.join(runDir, "report.html")}\n${report.summary.passed} passed, ${report.summary.failed} failed/incomplete, ${report.summary.skipped} skipped.`,
  );
  process.exitCode = report.summary.failed || report.summary.skipped ? 1 : 0;
}
