import { strict as assert } from "node:assert";
import { test } from "node:test";
import { requestDashboard } from "./dashboard-request.ts";

test("recovers from a temporary failure and a degraded response", async () => {
  const responses = [new Response(null, { status: 503 }), Response.json({ degraded: true }), Response.json({ ok: true })];
  const delays: number[] = [];
  const result = await requestDashboard("/api/dashboard", () => true, async () => responses.shift()!, async (ms) => { delays.push(ms); });
  assert.deepEqual(result?.body, { ok: true });
  assert.deepEqual(delays, [500, 1500]);
});

test("does not retry unauthorized responses", async () => {
  let calls = 0;
  const result = await requestDashboard("/api/dashboard", () => true, async () => { calls++; return new Response(null, { status: 401 }); }, async () => {});
  assert.equal(result?.response.status, 401);
  assert.equal(calls, 1);
});

test("stops retrying when the account changes", async () => {
  let current = true;
  let calls = 0;
  const result = await requestDashboard("/api/dashboard", () => current, async () => { calls++; throw new Error("offline"); }, async () => { current = false; });
  assert.equal(result, null);
  assert.equal(calls, 1);
});

test("reports a persistent network failure after bounded attempts", async () => {
  let calls = 0;
  await assert.rejects(requestDashboard("/api/dashboard", () => true, async () => { calls++; throw new Error("offline"); }, async () => {}), /offline/);
  assert.equal(calls, 3);
});
