import { spawnSync } from "node:child_process";
import buildBunFixture from "./build-bun-fixture.cjs";

export const INDEPENDENT_CREATE_BROWSER_TESTS = Object.freeze([
  "scripts/create-guest-preview-offline.test.cjs",
  "scripts/create-guest-rsvp-offline.test.cjs",
  "scripts/event-messages-browser.test.cjs",
  "scripts/owner-card-preview-browser.test.cjs",
  "scripts/template-single-section-browser.test.cjs",
  "scripts/event-collaboration-browser.test.cjs",
  "scripts/event-editor-browser.test.cjs",
  "scripts/event-editor-back-browser.test.cjs",
  "scripts/generated-gymnastics-layout-browser.test.cjs",
  "scripts/gymnastics-schedule-import-browser.test.cjs",
  "scripts/gymnastics-theme-colors-browser.test.cjs",
  "scripts/gymnastics-text-controls-browser.test.cjs",
  "scripts/product-urls-browser.test.cjs",
  "scripts/school-memo-direct-browser.test.cjs",
]);

export const LIVECARD_CREATE_BROWSER_TESTS = Object.freeze([
  "scripts/livecard-reconnect-browser.test.mjs",
  "scripts/livecard-generation-progress-browser.test.mjs",
  "scripts/livecard-lettering-save-browser.test.mjs",
  "scripts/livecard-integrated-save-browser.test.mjs",
]);

export const CREATE_BROWSER_CONCURRENCY = Object.freeze({ independent: 2, livecard: 1 });

export function browserTestArguments(files, concurrency) {
  return [
    "--import", "./scripts/lib/create-offline-network.mjs",
    "--test",
    `--test-concurrency=${concurrency}`,
    ...files,
  ];
}

function defaultSpawn(files, concurrency, env) {
  return spawnSync(process.execPath, browserTestArguments(files, concurrency), {
    stdio: "inherit", env, windowsHide: true,
  });
}

export function runCreateBrowserTests({
  build = () => buildBunFixture("scripts/build-livecard-builder-fixture.mjs"),
  spawn = defaultSpawn,
  env = process.env,
} = {}) {
  build();
  const readyEnv = { ...env, ENVITEFY_LIVECARD_FIXTURE_READY: "1" };
  for (const [files, concurrency] of [
    [INDEPENDENT_CREATE_BROWSER_TESTS, CREATE_BROWSER_CONCURRENCY.independent],
    [LIVECARD_CREATE_BROWSER_TESTS, CREATE_BROWSER_CONCURRENCY.livecard],
  ]) {
    const result = spawn(files, concurrency, readyEnv);
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status ?? 1;
  }
  return 0;
}
