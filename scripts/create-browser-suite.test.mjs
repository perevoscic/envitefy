import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ensureLiveCardBuilderFixture from "./lib/ensure-livecard-builder-fixture.cjs";
import { browserTestArguments, CREATE_BROWSER_CONCURRENCY, INDEPENDENT_CREATE_BROWSER_TESTS, LIVECARD_CREATE_BROWSER_TESTS, runCreateBrowserTests } from "./lib/create-browser-suite.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("Create browser files keep independent work off the shared Live Card fixture", () => {
  assert.equal(CREATE_BROWSER_CONCURRENCY.independent > 1, true);
  assert.equal(CREATE_BROWSER_CONCURRENCY.livecard, 1);
  const overlap = INDEPENDENT_CREATE_BROWSER_TESTS.filter((file) => LIVECARD_CREATE_BROWSER_TESTS.includes(file));
  assert.deepEqual(overlap, []);
  for (const file of INDEPENDENT_CREATE_BROWSER_TESTS) {
    assert.doesNotMatch(readFileSync(path.join(root, file), "utf8"), /output\/livecard-builder|ensureLiveCardBuilderFixture/);
  }
  for (const file of LIVECARD_CREATE_BROWSER_TESTS) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.match(source, /ensureLiveCardBuilderFixture\(/);
    assert.match(source, /output\/livecard-builder/);
    assert.doesNotMatch(source, /build-livecard-builder-fixture|execSync\(\s*["']bun/);
  }
});

test("browser arguments keep the offline network import and the batch concurrency", () => {
  assert.deepEqual(browserTestArguments(["scripts/event-editor-browser.test.cjs"], 2), [
    "--import", "./scripts/lib/create-offline-network.mjs",
    "--test",
    "--test-concurrency=2",
    "scripts/event-editor-browser.test.cjs",
  ]);
});

test("the suite builds the Live Card fixture once and stops after an independent failure", () => {
  const builds = [];
  const spawns = [];
  const status = runCreateBrowserTests({
    build: () => { builds.push("fixture"); },
    spawn: (files, concurrency, env) => {
      spawns.push({ files: [...files], concurrency, ready: env.ENVITEFY_LIVECARD_FIXTURE_READY });
      return { status: 1 };
    },
  });
  assert.equal(status, 1);
  assert.deepEqual(builds, ["fixture"]);
  assert.equal(spawns.length, 1);
  assert.equal(spawns[0].concurrency, CREATE_BROWSER_CONCURRENCY.independent);
  assert.equal(spawns[0].ready, "1");
  assert.equal(spawns[0].files.includes("scripts/livecard-reconnect-browser.test.mjs"), false);
});

test("the Live Card batch runs after the independent files pass", () => {
  const spawns = [];
  const status = runCreateBrowserTests({
    build: () => {},
    spawn: (files, concurrency) => {
      spawns.push({ count: files.length, concurrency, first: files[0] });
      return { status: 0 };
    },
  });
  assert.equal(status, 0);
  assert.deepEqual(spawns, [
    { count: INDEPENDENT_CREATE_BROWSER_TESTS.length, concurrency: CREATE_BROWSER_CONCURRENCY.independent, first: INDEPENDENT_CREATE_BROWSER_TESTS[0] },
    { count: LIVECARD_CREATE_BROWSER_TESTS.length, concurrency: 1, first: LIVECARD_CREATE_BROWSER_TESTS[0] },
  ]);
});

test("a ready Live Card fixture is not rebuilt", () => {
  let built = 0;
  ensureLiveCardBuilderFixture({ ENVITEFY_LIVECARD_FIXTURE_READY: "1" }, () => { built += 1; });
  assert.equal(built, 0);
  ensureLiveCardBuilderFixture({}, () => { built += 1; });
  assert.equal(built, 1);
});
