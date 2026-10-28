import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  evaluateAssertions,
  resolveRunConfiguration,
  stopChrome,
  stopServer,
  summarizeReports,
  waitForServer,
} from "./run-lighthouse.mjs";

const config = JSON.parse(
  await readFile(new URL("../lighthouse.config.json", import.meta.url), "utf8"),
);
const { assertions } = config;
const report = (accessibility = 0.9, performance = 0.8, lcp = 2500, cls = 0.1) => ({
  categories: { accessibility: { score: accessibility }, performance: { score: performance } },
  audits: {
    "largest-contentful-paint": { numericValue: lcp },
    "cumulative-layout-shift": { numericValue: cls },
  },
});

test("the default production audit covers mobile and desktop on its owned local server", () => {
  const resolved = resolveRunConfiguration(config);
  assert.deepEqual(resolved.profiles, ["mobile", "desktop"]);
  assert.deepEqual(resolved.paths, config.paths);
  assert.equal(resolved.origin, `http://localhost:${config.port}`);
  assert.equal(resolved.startServer, true);
  assert.equal(resolved.numberOfRuns, 3);
});

test("explicit targets allow the same profile and run count on live production and local builds", () => {
  for (const origin of ["https://envitefy.com", "http://localhost:3101"]) {
    const resolved = resolveRunConfiguration(config, [
      "--origin",
      origin,
      "--path",
      "/",
      "--path",
      "/landing",
      "--profile",
      "desktop",
      "--runs",
      "2",
      "--output-dir",
      "output/css-audit",
    ]);
    assert.equal(resolved.origin, origin);
    assert.equal(resolved.startServer, false);
    assert.deepEqual(resolved.paths, ["/", "/landing"]);
    assert.deepEqual(resolved.profiles, ["desktop"]);
    assert.equal(resolved.numberOfRuns, 2);
    assert.equal(resolved.outputDir, "output/css-audit");
  }
});

test("invalid profiles, origins and paths fail before starting a server or browser", () => {
  for (const args of [
    ["--profile", "tablet"],
    ["--profile", "mobile", "--profile", "mobile"],
    ["--origin", "file:///tmp/report"],
    ["--origin", "https://user:password@envitefy.com"],
    ["--origin", "https://envitefy.com/landing"],
    ["--path", "//another.example/"],
    ["--path", "https://envitefy.com/"],
    ["--runs", "0"],
    ["--runs", "1.5"],
    ["--runs", "invalid"],
  ])
    assert.throws(() => resolveRunConfiguration(config, args));
});

test("median metrics preserve every run and do not turn missing metrics into zero", () => {
  const reports = [report(1, 0.9, 2000), report(0.9, 0.8, 5000), report(0.8, 0.7, 3000)];
  const metrics = summarizeReports(reports);
  assert.deepEqual(metrics.largestContentfulPaintMs, { median: 3000, values: [2000, 5000, 3000] });
  assert.equal(metrics.performance.median, 0.8);
  assert.deepEqual(metrics.firstContentfulPaintMs, { median: null, values: [null, null, null] });
  assert.equal(summarizeReports(reports.slice(0, 2)).largestContentfulPaintMs.median, 3500);
});

test("threshold boundaries pass and use the best value for each metric across three runs", () => {
  const result = evaluateAssertions(
    [report(0.9, 0.5, 5000, 0.2), report(0.5, 0.8, 2500, 0.2), report(0.5, 0.5, 5000, 0.1)],
    assertions,
  );
  assert.equal(result.passed, true);
  assert.deepEqual(
    result.assertions.map((item) => item.actual),
    [0.9, 0.8, 2500, 0.1],
  );
});

test("a performance warning is reported without failing the run", () => {
  const result = evaluateAssertions([report(1, 0.79)], assertions);
  assert.equal(result.passed, true);
  assert.equal(
    result.assertions.find((item) => item.id === "categories:performance").passed,
    false,
  );
});

test("each error budget fails when no run meets it", () => {
  for (const lhr of [report(0.89), report(1, 1, 2501), report(1, 1, 1000, 0.101)]) {
    assert.equal(evaluateAssertions([lhr, lhr, lhr], assertions).passed, false);
  }
});

test("missing, null, or non-finite metrics cannot become passing zero scores", () => {
  for (const value of [undefined, null, Number.NaN, Infinity]) {
    const lhr = report();
    lhr.audits["largest-contentful-paint"].numericValue = value;
    const result = evaluateAssertions([lhr], assertions);
    assert.equal(result.passed, false);
    assert.equal(
      result.assertions.find((item) => item.id === "largest-contentful-paint").actual,
      null,
    );
  }
  assert.equal(evaluateAssertions([{}], assertions).passed, false);
  assert.equal(evaluateAssertions([], assertions).passed, false);
});

test("failed navigations fail even if another run has passing metrics", () => {
  const result = evaluateAssertions(
    [{ ...report(), runtimeError: { code: "NO_FCP", message: "No content" } }, report()],
    assertions,
  );
  assert.equal(result.passed, false);
  assert.equal(result.runtimeErrors[0].code, "NO_FCP");
});

test("unsupported thresholds fail explicitly instead of silently skipping a check", () => {
  assert.throws(
    () => evaluateAssertions([report()], { typo: ["error", { minValue: 1 }] }),
    /Unsupported assertion/,
  );
});

test("server readiness handles split output and cleanup stops only its child", async () => {
  const server = spawn(
    process.execPath,
    [
      "-e",
      'process.stdout.write("Rea"); setTimeout(() => process.stdout.write("dy in 12ms"), 25); setInterval(() => {}, 1000);',
    ],
    { stdio: ["ignore", "pipe", "ignore"] },
  );
  try {
    await waitForServer(server, 5000);
    assert.equal(server.exitCode, null);
  } finally {
    await stopServer(server);
  }
  assert.ok(server.exitCode !== null || server.signalCode !== null);
  await stopServer(server);
});

test("server failure before readiness rejects promptly", async () => {
  const server = spawn(process.execPath, ["-e", "process.exit(7)"], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  await assert.rejects(waitForServer(server, 5000), /exited before becoming ready \(7\)/);
});

test("startup timeout leaves the caller able to clean up the server", async () => {
  const server = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  try {
    await assert.rejects(waitForServer(server, 100), /Timed out/);
  } finally {
    await stopServer(server);
  }
  assert.ok(server.exitCode !== null || server.signalCode !== null);
});

test("browser cleanup errors remain failures without leaving a referenced child handle", async () => {
  const cleanupError = new Error("EPERM: browser temporary directory cleanup failed");
  let released = false;
  await assert.rejects(
    stopChrome({
      kill() {
        throw cleanupError;
      },
      chromeProcess: {
        unref() {
          released = true;
        },
      },
    }),
    (error) => error === cleanupError,
  );
  assert.equal(released, true);
  await stopChrome(undefined);
  await stopChrome({ kill() {} });
});
