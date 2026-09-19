import assert from "node:assert/strict";
import test from "node:test";
import { CAMPAIGN_OPERATION_TIMEOUT_MS, withCampaignTimeout } from "./create-campaign-timeout.mjs";

test("campaign operation deadline bounds a response that never finishes", async () => {
  assert.equal(CAMPAIGN_OPERATION_TIMEOUT_MS, 240_000);
  await assert.rejects(withCampaignTimeout(new Promise(() => {}), { timeoutMs: 15, label: "Generation response completion" }), error => error.code === "harness_interaction" && /Generation response completion timed out/.test(error.message));
});

test("campaign operation preserves resolution and rejection and removes abort listeners", async () => {
  const controller = new AbortController();
  assert.equal(await withCampaignTimeout(Promise.resolve("complete"), { timeoutMs: 30, signal: controller.signal }), "complete");
  controller.abort(new Error("late close"));
  const original = new Error("provider response failed");
  await assert.rejects(withCampaignTimeout(Promise.reject(original)), error => error === original);
});

test("campaign cancellation rejects pending and already-aborted waits without orphaning late errors", async () => {
  const controller = new AbortController();
  let rejectLate;
  const wait = withCampaignTimeout(new Promise((_resolve, reject) => { rejectLate = reject; }), { timeoutMs: 10_000, signal: controller.signal, label: "Body capture" });
  controller.abort(new Error("CDP closed"));
  await assert.rejects(wait, error => error.code === "harness_interaction" && /Body capture cancelled: CDP closed/.test(error.message));
  rejectLate(new Error("late transport rejection"));
  await assert.rejects(withCampaignTimeout(new Promise(() => {}), { signal: controller.signal }), /cancelled: CDP closed/);
  await new Promise(resolve => setImmediate(resolve));
});
