#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

// Keep every run visible. A good outlier must not conceal a failing error budget.
export function evaluateAssertions(reports, assertions) {
  const results = [];
  for (const [id, [level, limits]] of Object.entries(assertions)) {
    if (!["error", "warn"].includes(level)) throw new Error(`Invalid assertion level: ${level}`);
    if (!Object.keys(limits).length) throw new Error(`Missing threshold for ${id}`);
    for (const [metric, expected] of Object.entries(limits)) {
      if (!["minScore", "maxNumericValue"].includes(metric) || !Number.isFinite(expected)) {
        throw new Error(`Unsupported assertion: ${id}.${metric}`);
      }
      const values = reports.map((report) => {
        const audit = id.startsWith("categories:")
          ? report.categories?.[id.slice("categories:".length)]
          : report.audits?.[id];
        return audit?.[metric === "minScore" ? "score" : "numericValue"];
      });
      const validValues = values.filter(Number.isFinite);
      const sorted = [...validValues].sort((first, second) => first - second);
      const middle = Math.floor(sorted.length / 2);
      const actual = sorted.length
        ? sorted.length % 2
          ? sorted[middle]
          : (sorted[middle - 1] + sorted[middle]) / 2
        : null;
      const withinBudget = (value) =>
        Number.isFinite(value) && (metric === "minScore" ? value >= expected : value <= expected);
      const runPassed = values.map(withinBudget);
      const allRunsPassed = runPassed.length > 0 && runPassed.every(Boolean);
      const medianPassed = withinBudget(actual);
      results.push({
        id,
        level,
        metric,
        expected,
        actual,
        values,
        runPassed,
        medianPassed,
        allRunsPassed,
        passed: medianPassed && allRunsPassed,
      });
    }
  }
  const runtimeErrors = reports
    .filter((report) => report.runtimeError)
    .map((report) => report.runtimeError);
  return {
    assertions: results,
    runtimeErrors,
    passed:
      reports.length > 0 &&
      !runtimeErrors.length &&
      !results.some((result) => result.level === "error" && !result.passed),
  };
}

export function productionServerEnvironment(origin, environment = process.env) {
  return {
    ...environment,
    NODE_ENV: "production",
    PORT: new URL(origin).port,
    NEXTAUTH_URL: origin,
    NEXTAUTH_URL_INTERNAL: origin,
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

export function chromeExecutable(environment = process.env) {
  return (
    environment.LIGHTHOUSE_CHROME_PATH ||
    environment.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    environment.CHROME_PATH ||
    undefined
  );
}

export function auditPaths(paths, origin, environment = process.env) {
  let selected = paths;
  if (environment.LIGHTHOUSE_PATHS !== undefined) {
    try {
      selected = JSON.parse(environment.LIGHTHOUSE_PATHS);
    } catch (error) {
      throw new Error("LIGHTHOUSE_PATHS must be a JSON array of local paths.", { cause: error });
    }
  }
  if (
    !Array.isArray(selected) ||
    !selected.length ||
    selected.some((route) => {
      if (typeof route !== "string" || !route.trim()) return true;
      try {
        return new URL(route, origin).origin !== origin;
      } catch {
        return true;
      }
    })
  ) {
    throw new Error("Lighthouse paths must target the local production server.");
  }
  return selected;
}

export async function saveRunArtifacts(artifacts, outputDirectory, name) {
  const files = { trace: null, devtoolsLog: null };
  for (const [field, key, suffix] of [
    ["trace", "Trace", "trace"],
    ["devtoolsLog", "DevtoolsLog", "devtoolslog"],
  ]) {
    const data = artifacts?.[key];
    if (data == null || data instanceof Error) continue;
    const filename = `${name}.${suffix}.json`;
    await writeFile(path.join(outputDirectory, filename), JSON.stringify(data));
    files[field] = filename;
  }
  return files;
}

export function waitForServer(server, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    let output = "";
    const finish = (error) => {
      clearTimeout(timeout);
      server.stdout.off("data", onData);
      server.off("error", onError);
      server.off("exit", onExit);
      if (error) reject(error);
      else resolve();
    };
    const onError = (error) => finish(error);
    const onExit = (code, signal) =>
      finish(new Error(`Next.js exited before becoming ready (${signal ?? code}).`));
    const onData = (chunk) => {
      output = `${output}${chunk}`.slice(-4096);
      if (/Ready in|ready - started server/.test(output)) finish();
    };
    const timeout = setTimeout(
      () => finish(new Error(`Timed out after ${timeoutMs}ms waiting for the production server.`)),
      timeoutMs,
    );
    server.stdout.on("data", onData);
    server.once("error", onError);
    server.once("exit", onExit);
  });
}

export async function stopServer(server) {
  if (!server?.pid || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => server.kill("SIGKILL"), 10_000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    server.kill("SIGTERM");
  });
}

async function ensurePortAvailable(port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", (error) =>
      reject(new Error(`Cannot start Lighthouse's server on localhost:${port}: ${error.message}`)),
    );
    probe.listen(port, "localhost", () => probe.close(resolve));
  });
}

export async function runLighthouse() {
  const config = JSON.parse(await readFile(path.join(root, "lighthouse.config.json"), "utf8"));
  if (process.env.LIGHTHOUSE_PORT) config.port = Number(process.env.LIGHTHOUSE_PORT);
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error("Lighthouse port must be an integer between 1 and 65535.");
  const origin = `http://localhost:${config.port}`;
  if (!Number.isInteger(config.numberOfRuns) || config.numberOfRuns < 1)
    throw new Error("numberOfRuns must be a positive integer.");
  config.paths = auditPaths(config.paths, origin);
  evaluateAssertions([], config.assertions);
  const baseDirectory = path.resolve(root, config.outputDir);
  const relativeOutput = path.relative(path.join(root, "output"), baseDirectory);
  if (
    relativeOutput === ".." ||
    relativeOutput.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeOutput)
  )
    throw new Error("Lighthouse reports must be written inside output/.");
  await mkdir(baseDirectory, { recursive: true });
  const outputDirectory = await mkdtemp(
    path.join(baseDirectory, `${new Date().toISOString().replaceAll(":", "-")}-`),
  );
  const summary = {
    startedAt: new Date().toISOString(),
    config,
    aggregation: "median reported; every run must meet error budgets",
    nodeVersion: process.version,
    passed: false,
    pages: [],
  };
  let server;
  let chrome;
  let chromeLaunch;
  let cleanupPromise;
  let interruptedSignal;
  const cleanup = () => {
    cleanupPromise ??= (async () => {
      try {
        // An interrupt can arrive before launch has spawned Chrome. Wait for
        // launch to settle so a detached browser cannot appear after cleanup.
        await chromeLaunch?.catch(() => {});
        await chrome?.kill();
      } finally {
        await stopServer(server);
      }
    })();
    return cleanupPromise;
  };
  const saveSummary = async () => {
    const temporary = path.join(outputDirectory, ".summary.json.tmp");
    await writeFile(temporary, `${JSON.stringify(summary, null, 2)}\n`);
    await rename(temporary, path.join(outputDirectory, "summary.json"));
  };
  const checkInterrupted = () => {
    if (interruptedSignal) throw new Error(`Interrupted by ${interruptedSignal}`);
  };
  const interrupt = (signal) => {
    interruptedSignal = signal;
    // Closing our Chrome instance cancels an in-progress audit as well.
    // The main finally block owns summary writes and records cleanup failures.
    void cleanup().catch(() => {});
  };
  const onInterrupt = () => interrupt("SIGINT");
  const onTerminate = () => interrupt("SIGTERM");
  process.once("SIGINT", onInterrupt);
  process.once("SIGTERM", onTerminate);
  console.log(`Lighthouse reports: ${outputDirectory}`);
  try {
    try {
      summary.buildId = (await readFile(path.join(root, ".next", "BUILD_ID"), "utf8")).trim();
    } catch (error) {
      throw new Error(
        "Cannot read .next/BUILD_ID. Run npm run build before auditing the production server.",
        { cause: error },
      );
    }
    await ensurePortAvailable(config.port);
    const { default: lighthouse } = await import("lighthouse");
    const { Launcher } = await import("chrome-launcher");
    checkInterrupted();
    server = spawn(
      process.execPath,
      [
        require.resolve("next/dist/bin/next"),
        "start",
        "--port",
        String(config.port),
        "--hostname",
        "localhost",
      ],
      {
        cwd: root,
        env: productionServerEnvironment(origin),
        stdio: ["ignore", "pipe", "inherit"],
      },
    );
    server.stdout.pipe(process.stdout);
    await waitForServer(server);
    checkInterrupted();
    chrome = new Launcher({
      chromeFlags: config.chromeFlags,
      chromePath: chromeExecutable(),
      handleSIGINT: false,
    });
    chromeLaunch = chrome.launch();
    await chromeLaunch;
    checkInterrupted();
    for (const [index, route] of config.paths.entries()) {
      const url = new URL(route, origin).href;
      const page = { url, runs: [] };
      summary.pages.push(page);
      const reports = [];
      for (let run = 1; run <= config.numberOfRuns; run++) {
        checkInterrupted();
        console.log(`Auditing ${route}, run ${run}/${config.numberOfRuns}…`);
        const result = await lighthouse(url, {
          ...config.settings,
          port: chrome.port,
          output: ["html", "json"],
          logLevel: "error",
        });
        if (!result) throw new Error(`Lighthouse returned no result for ${url}`);
        const name = `${index + 1}-${new URL(url).pathname.replaceAll(/[^a-zA-Z0-9-]/g, "_")}-${run}`;
        await writeFile(path.join(outputDirectory, `${name}.html`), result.report[0]);
        await writeFile(path.join(outputDirectory, `${name}.json`), result.report[1]);
        const artifacts = await saveRunArtifacts(result.artifacts, outputDirectory, name);
        reports.push(result.lhr);
        page.runs.push({
          run,
          finalUrl: result.lhr.finalDisplayedUrl,
          lighthouseVersion: result.lhr.lighthouseVersion,
          environment: result.lhr.environment,
          artifacts,
          result: evaluateAssertions([result.lhr], config.assertions),
          html: `${name}.html`,
          json: `${name}.json`,
        });
        page.result = evaluateAssertions(reports, config.assertions);
        // Save partial progress even if a later audit crashes or is interrupted.
        await saveSummary();
        if (result.lhr.runtimeError)
          throw new Error(`Lighthouse failed for ${url}: ${result.lhr.runtimeError.message}`);
      }
      for (const assertion of page.result.assertions) {
        const status = assertion.passed ? "PASS" : assertion.level.toUpperCase();
        console.log(
          `${status} ${route} ${assertion.id}: median ${assertion.actual ?? "missing"}; runs ${assertion.values.map((value) => value ?? "missing").join(", ")} (${assertion.metric} ${assertion.expected}; all runs ${assertion.allRunsPassed ? "pass" : "fail"})`,
        );
      }
    }
    summary.passed = summary.pages.every((page) => page.result.passed);
  } catch (error) {
    summary.error = error.message;
    console.error(error.message);
  } finally {
    try {
      await cleanup();
    } catch (error) {
      summary.passed = false;
      summary.cleanupError = error.message;
      console.error(`Lighthouse cleanup failed: ${error.message}`);
    }
    if (interruptedSignal) {
      summary.passed = false;
      summary.error = `Interrupted by ${interruptedSignal}`;
    }
    summary.finishedAt = new Date().toISOString();
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
    await saveSummary();
  }
  console.log(
    `Lighthouse ${summary.passed ? "passed" : "failed"}. Summary: ${path.join(outputDirectory, "summary.json")}`,
  );
  return interruptedSignal ? (interruptedSignal === "SIGINT" ? 130 : 143) : summary.passed ? 0 : 1;
}

if (import.meta.main) {
  try {
    process.exitCode = await runLighthouse();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
