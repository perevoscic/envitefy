const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

function harness(t) {
  const requests = [], timers = new Map();
  let nextTimer = 0, now = 0;
  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, at: now + delay });
    return id;
  });
  t.mock.method(globalThis, "clearTimeout", (id) => timers.delete(id));
  t.mock.method(globalThis, "fetch", (url, options) => new Promise((resolve, reject) => {
    requests.push({ url, options, resolve, reject });
  }));
  return {
    ...loadTs("src/lib/feature-visibility-client.ts"), requests, timers,
    async advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
      for (let i = 0; i < 8; i++) await Promise.resolve();
    },
    async respond(index, body, status = 200) {
      requests[index].resolve(Response.json(body, { status }));
      for (let i = 0; i < 8; i++) await Promise.resolve();
    },
  };
}
const preferences = (category) => ({ visibleTemplateKeys: [category] });

test("workspace reads share concurrent requests only for the same account", async (t) => {
  const state = harness(t);
  const first = state.loadFeatureVisibility("first");
  assert.equal(state.loadFeatureVisibility("first"), first);
  const second = state.loadFeatureVisibility("second");
  assert.equal(state.requests.length, 2);
  assert.equal(state.requests[0].url, "/api/user/feature-visibility");
  assert.equal(state.requests[0].options.credentials, "include");
  assert.equal(state.requests[0].options.cache, "no-store");
  await state.respond(1, preferences("weddings"));
  await state.respond(0, preferences("birthdays"));
  assert.deepEqual(await first, preferences("birthdays"));
  assert.deepEqual(await second, preferences("weddings"));
  assert.equal(state.timers.size, 0);
});

test("temporary server and network failures retry once without requiring a click", async (t) => {
  for (const failure of [503, 429, "network"]) {
    await t.test(String(failure), async (t) => {
      const state = harness(t);
      const read = state.loadFeatureVisibility("owner");
      if (failure === "network") {
        state.requests[0].reject(new TypeError("Network unavailable"));
        await state.advance(0);
      } else await state.respond(0, { error: "Temporary failure" }, failure);
      await state.advance(300);
      assert.equal(state.requests.length, 2);
      assert.equal(state.loadFeatureVisibility("owner"), read);
      await state.respond(1, preferences("birthdays"));
      assert.deepEqual(await read, preferences("birthdays"));
      assert.equal(state.timers.size, 0);
    });
  }
});

test("authentication failures do not retry or supply fabricated preferences", async (t) => {
  const state = harness(t);
  const read = state.loadFeatureVisibility("owner");
  const failed = assert.rejects(read, /Could not load feature visibility/);
  await state.respond(0, { error: "Not authenticated" }, 401);
  await failed;
  assert.equal(state.requests.length, 1);
  assert.equal(state.timers.size, 0);
});

test("malformed success responses cannot enable default categories", async (t) => {
  const state = harness(t);
  const read = state.loadFeatureVisibility("owner");
  const failed = assert.rejects(read, /Invalid workspace preferences response/);
  await state.respond(0, {});
  await state.advance(300);
  await state.respond(1, null);
  await failed;
  assert.equal(state.requests.length, 2);
  assert.equal(state.timers.size, 0);
});

test("stalled reads time out and a late response cannot displace the pending retry", async (t) => {
  const state = harness(t);
  const stalled = state.loadFeatureVisibility("owner");
  const failed = assert.rejects(stalled, /took too long/);
  await state.advance(10_000);
  await failed;
  assert.equal(state.requests[0].options.signal.aborted, true);
  const retry = state.loadFeatureVisibility("owner");
  await state.respond(0, preferences("weddings"));
  assert.equal(state.loadFeatureVisibility("owner"), retry);
  await state.respond(1, preferences("birthdays"));
  assert.deepEqual(await retry, preferences("birthdays"));
  assert.equal(state.timers.size, 0);
});

test("preference changes invalidate an in-flight read before consumers refresh", async (t) => {
  const state = harness(t);
  const old = state.loadFeatureVisibility("owner");
  state.invalidateFeatureVisibility();
  const current = state.loadFeatureVisibility("owner");
  assert.notEqual(old, current);
  await state.respond(0, preferences("weddings"));
  await old;
  assert.equal(state.loadFeatureVisibility("owner"), current);
  await state.respond(1, preferences("birthdays"));
  assert.deepEqual(await current, preferences("birthdays"));
  assert.equal(state.timers.size, 0);
});
