import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateAssertions, stopServer, waitForServer } from "./run-lighthouse.mjs";

const { assertions } = JSON.parse(
  await readFile(new URL("../lighthouse.config.json", import.meta.url), "utf8"),
);
const report = (accessibility = 0.9, performance = 0.8, lcp = 2500, cls = 0.1) => ({
  categories: { accessibility: { score: accessibility }, performance: { score: performance } },
  audits: {
    "largest-contentful-paint": { numericValue: lcp },
    "cumulative-layout-shift": { numericValue: cls },
  },
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
