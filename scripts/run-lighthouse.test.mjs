import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  auditPaths,
  chromeExecutable,
  evaluateAssertions,
  productionServerEnvironment,
  saveRunArtifacts,
  stopServer,
  waitForServer,
} from "./run-lighthouse.mjs";

const { assertions } = JSON.parse(
  await readFile(new URL("../lighthouse.config.json", import.meta.url), "utf8"),
);
const report = (accessibility = 0.9, performance = 0.8, lcp = 2500, cls = 0.1) => ({
  categories: {
    accessibility: { score: accessibility },
    performance: { score: performance },
    "best-practices": { score: 1 },
    seo: { score: 1 },
  },
  audits: {
    "first-contentful-paint": { numericValue: 1000 },
    "total-blocking-time": { numericValue: 100 },
    "largest-contentful-paint": { numericValue: lcp },
    "cumulative-layout-shift": { numericValue: cls },
  },
});

test("threshold boundaries pass and medians preserve every run", () => {
  const result = evaluateAssertions(
    [report(0.9, 0.8, 2500, 0.1), report(1, 0.9, 2000, 0.05), report(0.95, 1, 1500, 0)],
    assertions,
  );
  assert.equal(result.passed, true);
  assert.deepEqual(
    result.assertions.filter((item) => item.level === "error").map((item) => item.actual),
    [0.95, 2000, 0.05],
  );
  const lcp = result.assertions.find((item) => item.id === "largest-contentful-paint");
  assert.deepEqual(lcp.values, [2500, 2000, 1500]);
  assert.deepEqual(lcp.runPassed, [true, true, true]);
  assert.equal(lcp.medianPassed, true);
  assert.equal(lcp.allRunsPassed, true);
});

test("one failing run cannot be concealed by a passing median or a good outlier", () => {
  for (const reports of [
    [report(1, 1, 5000), report(), report()],
    [report(1, 1, 5000), report(1, 1, 5000), report()],
  ]) {
    const result = evaluateAssertions(reports, assertions);
    assert.equal(result.passed, false);
    assert.equal(
      result.assertions.find((item) => item.id === "largest-contentful-paint").allRunsPassed,
      false,
    );
  }
  assert.equal(evaluateAssertions([report(0.89), report(), report()], assertions).passed, false);
  assert.equal(
    evaluateAssertions(
      [report(0.9, 0.5, 5000, 0.2), report(0.5, 0.8, 2500, 0.2), report(0.5, 0.5, 5000, 0.1)],
      assertions,
    ).passed,
    false,
    "Passing different budgets in different runs cannot create a passing result",
  );
});

test("even run counts use the average of the middle values", () => {
  const result = evaluateAssertions([report(1, 1, 1000), report(1, 1, 2000)], assertions);
  assert.equal(
    result.assertions.find((item) => item.id === "largest-contentful-paint").actual,
    1500,
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
    assert.equal(evaluateAssertions([report(), lhr, report()], assertions).passed, false);
  }
  assert.equal(evaluateAssertions([{}], assertions).passed, false);
  assert.equal(evaluateAssertions([], assertions).passed, false);
});

test("production audits use local auth URLs and production mode without discarding configuration", () => {
  const environment = productionServerEnvironment("http://localhost:3101", {
    NODE_ENV: "development",
    NEXTAUTH_URL: "https://envitefy.com",
    NEXTAUTH_URL_INTERNAL: "https://envitefy.com",
    DATABASE_URL: "fixture-database",
  });
  assert.equal(environment.NODE_ENV, "production");
  assert.equal(environment.NEXTAUTH_URL, "http://localhost:3101");
  assert.equal(environment.NEXTAUTH_URL_INTERNAL, "http://localhost:3101");
  assert.equal(environment.PORT, "3101");
  assert.equal(environment.DATABASE_URL, "fixture-database");
  assert.equal(environment.NEXT_TELEMETRY_DISABLED, "1");
});

test("Chrome selection honors explicit overrides before falling back to auto discovery", () => {
  assert.equal(
    chromeExecutable({
      LIGHTHOUSE_CHROME_PATH: "lh",
      PLAYWRIGHT_CHROMIUM_EXECUTABLE: "pw",
      CHROME_PATH: "chrome",
    }),
    "lh",
  );
  assert.equal(
    chromeExecutable({ PLAYWRIGHT_CHROMIUM_EXECUTABLE: "pw", CHROME_PATH: "chrome" }),
    "pw",
  );
  assert.equal(chromeExecutable({ CHROME_PATH: "chrome" }), "chrome");
  assert.equal(chromeExecutable({}), undefined);
});

test("focused path overrides retain the local origin and default to the configured matrix", () => {
  const origin = "http://localhost:3100";
  assert.deepEqual(auditPaths(["/", "/landing"], origin, {}), ["/", "/landing"]);
  assert.deepEqual(auditPaths(["/landing"], origin, { LIGHTHOUSE_PATHS: '["/"]' }), ["/"]);
  assert.deepEqual(auditPaths([], origin, { LIGHTHOUSE_PATHS: '["http://localhost:3100/"]' }), [
    "http://localhost:3100/",
  ]);
  assert.throws(() => auditPaths(["/"], origin, { LIGHTHOUSE_PATHS: "/" }), /JSON array/);
  for (const selected of [
    [],
    null,
    "/",
    [""],
    [null],
    ["https://envitefy.com/"],
    ["//other.test/"],
    ["http://localhost:3101/"],
  ]) {
    assert.throws(
      () => auditPaths(["/"], origin, { LIGHTHOUSE_PATHS: JSON.stringify(selected) }),
      /local production server/,
    );
  }
});

test("trace and DevTools artifacts are saved faithfully with relative per-run metadata", async () => {
  const outputRoot = path.resolve(fileURLToPath(new URL("../output/", import.meta.url)));
  await mkdir(outputRoot, { recursive: true });
  const directory = await mkdtemp(path.join(outputRoot, "lighthouse-runner-tests-"));
  const artifacts = {
    Trace: { traceEvents: [{ name: "navigationStart", ts: 123 }] },
    DevtoolsLog: [{ method: "Network.requestWillBeSent", params: { requestId: "fixture" } }],
  };
  try {
    const files = await saveRunArtifacts(artifacts, directory, "1-_-1");
    assert.deepEqual(files, { trace: "1-_-1.trace.json", devtoolsLog: "1-_-1.devtoolslog.json" });
    assert.deepEqual(
      JSON.parse(await readFile(path.join(directory, files.trace), "utf8")),
      artifacts.Trace,
    );
    assert.deepEqual(
      JSON.parse(await readFile(path.join(directory, files.devtoolsLog), "utf8")),
      artifacts.DevtoolsLog,
    );
    assert.deepEqual(await saveRunArtifacts(undefined, directory, "missing"), {
      trace: null,
      devtoolsLog: null,
    });
    assert.deepEqual(
      await saveRunArtifacts({ Trace: new Error("trace unavailable") }, directory, "failed"),
      { trace: null, devtoolsLog: null },
    );
    assert.equal((await readdir(directory)).length, 2, "unavailable artifacts never claim a file");
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), outputRoot, "cleanup stays within output/");
    await rm(directory, { recursive: true });
  }
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
