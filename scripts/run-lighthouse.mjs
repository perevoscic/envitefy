#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

// An explicit origin audits an already-running site. Without it, retain the
// existing behavior of owning a local production server and cleaning it up.
export function resolveRunConfiguration(config, args = []) {
  const { values } = parseArgs({
    args,
    options: {
      origin: { type: "string" },
      path: { type: "string", multiple: true },
      profile: { type: "string", multiple: true },
      runs: { type: "string" },
      "output-dir": { type: "string" },
    },
  });
  const originUrl = new URL(values.origin ?? `http://localhost:${config.port}`);
  if (
    !["http:", "https:"].includes(originUrl.protocol) ||
    originUrl.username ||
    originUrl.password ||
    originUrl.pathname !== "/" ||
    originUrl.search ||
    originUrl.hash
  )
    throw new Error(
      "Lighthouse origin must be an HTTP(S) origin without credentials, path, query or fragment.",
    );
  const origin = originUrl.origin;
  const paths = values.path ?? config.paths;
  if (
    !Array.isArray(paths) ||
    !paths.length ||
    paths.some(
      (route) =>
        typeof route !== "string" ||
        !route.startsWith("/") ||
        new URL(route, origin).origin !== origin,
    )
  )
    throw new Error("Lighthouse paths must target the selected origin.");
  const profiles = values.profile ?? config.profiles ?? [config.settings?.formFactor ?? "mobile"];
  if (
    !Array.isArray(profiles) ||
    !profiles.length ||
    profiles.some((profile) => !["mobile", "desktop"].includes(profile)) ||
    new Set(profiles).size !== profiles.length
  )
    throw new Error("Lighthouse profiles must contain mobile and/or desktop without duplicates.");
  const numberOfRuns = values.runs === undefined ? config.numberOfRuns : Number(values.runs);
  if (!Number.isInteger(numberOfRuns) || numberOfRuns < 1)
    throw new Error("numberOfRuns must be a positive integer.");
  evaluateAssertions([], config.assertions);
  return {
    ...config,
    origin,
    paths,
    profiles,
    numberOfRuns,
    outputDir: values["output-dir"] ?? config.outputDir,
    startServer: values.origin === undefined,
  };
}

export function summarizeReports(reports) {
  const median = (values) => {
    const numbers = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!numbers.length) return null;
    const middle = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
  };
  const metrics = {
    performance: (report) => report.categories?.performance?.score,
    accessibility: (report) => report.categories?.accessibility?.score,
    firstContentfulPaintMs: (report) => report.audits?.["first-contentful-paint"]?.numericValue,
    largestContentfulPaintMs: (report) => report.audits?.["largest-contentful-paint"]?.numericValue,
    cumulativeLayoutShift: (report) => report.audits?.["cumulative-layout-shift"]?.numericValue,
    totalBlockingTimeMs: (report) => report.audits?.["total-blocking-time"]?.numericValue,
  };
  return Object.fromEntries(
    Object.entries(metrics).map(([key, read]) => {
      const values = reports.map(read).map((value) => (Number.isFinite(value) ? value : null));
      return [key, { median: median(values), values }];
    }),
  );
}

// LHCI's default is optimistic: the best value for each assertion across runs.
// Keep that behavior, including inclusive thresholds and non-failing warnings.
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
      const actual = validValues.length
        ? metric === "minScore"
          ? Math.max(...validValues)
          : Math.min(...validValues)
        : null;
      const passed =
        actual !== null && (metric === "minScore" ? actual >= expected : actual <= expected);
      results.push({ id, level, metric, expected, actual, values, passed });
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
      () => finish(new Error("Timed out waiting for the production server.")),
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

export async function stopChrome(chrome) {
  try {
    await chrome?.kill();
  } finally {
    // chrome-launcher can throw on Windows temp-directory cleanup after its
    // process termination attempt. Do not let that child handle keep a failed
    // audit command alive after its summary has been written.
    chrome?.chromeProcess?.unref();
  }
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

export async function runLighthouse(args = process.argv.slice(2)) {
  const config = resolveRunConfiguration(
    JSON.parse(await readFile(path.join(root, "lighthouse.config.json"), "utf8")),
    args,
  );
  const { origin } = config;
  const baseDirectory = path.resolve(root, config.outputDir);
  await mkdir(baseDirectory, { recursive: true });
  const outputDirectory = await mkdtemp(
    path.join(baseDirectory, `${new Date().toISOString().replaceAll(":", "-")}-`),
  );
  const summary = { startedAt: new Date().toISOString(), config, passed: false, pages: [] };
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
        await stopChrome(chrome);
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
    if (config.startServer) await ensurePortAvailable(config.port);
    const { default: lighthouse } = await import("lighthouse");
    const { Launcher } = await import("chrome-launcher");
    const { default: desktopConfig } = await import("lighthouse/core/config/desktop-config.js");
    checkInterrupted();
    if (config.startServer) {
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
          env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
          stdio: ["ignore", "pipe", "inherit"],
        },
      );
      server.stdout.pipe(process.stdout);
      await waitForServer(server);
    }
    checkInterrupted();
    chrome = new Launcher({ chromeFlags: config.chromeFlags, handleSIGINT: false });
    chromeLaunch = chrome.launch();
    await chromeLaunch;
    checkInterrupted();
    for (const profile of config.profiles) {
      for (const [index, route] of config.paths.entries()) {
        const url = new URL(route, origin).href;
        const page = { url, profile, runs: [] };
        summary.pages.push(page);
        const reports = [];
        for (let run = 1; run <= config.numberOfRuns; run++) {
          checkInterrupted();
          console.log(`Auditing ${route} (${profile}), run ${run}/${config.numberOfRuns}…`);
          const result = await lighthouse(
            url,
            {
              ...config.settings,
              formFactor: profile,
              port: chrome.port,
              output: ["html", "json"],
              logLevel: "error",
            },
            profile === "desktop" ? desktopConfig : undefined,
          );
          if (!result) throw new Error(`Lighthouse returned no result for ${url}`);
          const name = `${profile}-${index + 1}-${new URL(url).pathname.replaceAll(/[^a-zA-Z0-9-]/g, "_")}-${run}`;
          await writeFile(path.join(outputDirectory, `${name}.html`), result.report[0]);
          await writeFile(path.join(outputDirectory, `${name}.json`), result.report[1]);
          reports.push(result.lhr);
          const stylesheets =
            result.lhr.audits["network-requests"]?.details?.items?.filter(
              (request) => request.resourceType === "Stylesheet",
            ) ?? [];
          page.runs.push({
            run,
            finalUrl: result.lhr.finalDisplayedUrl,
            html: `${name}.html`,
            json: `${name}.json`,
            lighthouseVersion: result.lhr.lighthouseVersion,
            settings: result.lhr.configSettings,
            stylesheets: {
              count: stylesheets.length,
              transferBytes: stylesheets.reduce(
                (total, request) => total + (request.transferSize ?? 0),
                0,
              ),
              resourceBytes: stylesheets.reduce(
                (total, request) => total + (request.resourceSize ?? 0),
                0,
              ),
            },
          });
          page.result = evaluateAssertions(reports, config.assertions);
          page.metrics = summarizeReports(reports);
          // Save partial progress even if a later audit crashes or is interrupted.
          await saveSummary();
          if (result.lhr.runtimeError)
            throw new Error(`Lighthouse failed for ${url}: ${result.lhr.runtimeError.message}`);
        }
        for (const assertion of page.result.assertions) {
          const status = assertion.passed ? "PASS" : assertion.level.toUpperCase();
          console.log(
            `${status} ${route} (${profile}) ${assertion.id}: ${assertion.actual ?? "missing"} (${assertion.metric} ${assertion.expected})`,
          );
        }
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
