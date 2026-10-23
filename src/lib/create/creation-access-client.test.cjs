const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

const grants = (category) => ({ policy: "restricted", allowedProducts: ["event_page"], allowedCategories: [category] });

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
    // Ignore cancellation to verify that deadlines don't depend on transport.
    requests.push({ url, options, resolve, reject });
  }));
  const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  return {
    ...loadTs("src/lib/create/creation-access-client.ts"), requests, timers,
    async advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
      await settle();
    },
    async respond(index, body, status = 200) {
      requests[index].resolve(Response.json(body, { status }));
      await settle();
    },
  };
}

test("concurrent grant reads for one account share one request and completed reads do not stay cached", async (t) => {
  const state = harness(t);
  const first = state.loadCreationAccess("owner@example.com");
  assert.equal(state.loadCreationAccess("owner@example.com"), first);
  assert.equal(state.requests.length, 1);
  await state.respond(0, { access: grants("birthdays") });
  assert.deepEqual(await first, grants("birthdays"));
  assert.equal(state.timers.size, 0);
  const refreshed = state.loadCreationAccess("owner@example.com");
  assert.notEqual(refreshed, first);
  await state.respond(1, { access: grants("weddings") });
  assert.deepEqual(await refreshed, grants("weddings"));
});

test("different account identities never share a pending grant response", async (t) => {
  const state = harness(t);
  const owner = state.loadCreationAccess("owner@example.com");
  const other = state.loadCreationAccess("other@example.com");
  assert.notEqual(owner, other);
  assert.equal(state.requests.length, 2);
  await state.respond(1, { access: grants("gymnastics") });
  await state.respond(0, { access: grants("birthdays") });
  assert.deepEqual(await owner, grants("birthdays"));
  assert.deepEqual(await other, grants("gymnastics"));
  assert.equal(state.timers.size, 0);
});

test("grant reads use the authenticated no-store summary endpoint", async (t) => {
  const state = harness(t);
  const read = state.loadCreationAccess("owner@example.com");
  const request = state.requests[0];
  assert.equal(request.url, "/api/user/creation-access?summary=1");
  assert.equal(request.options.credentials, "include");
  assert.equal(request.options.cache, "no-store");
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.equal(request.options.signal.aborted, false);
  await state.respond(0, { access: grants("birthdays") });
  await read;
});

test("a stalled first connection automatically retries before the total deadline", async (t) => {
  const state = harness(t);
  const read = state.loadCreationAccess("owner");
  await state.advance(3_999);
  assert.equal(state.requests[0].options.signal.aborted, false);
  await state.advance(1);
  assert.equal(state.requests[0].options.signal.aborted, true);
  await state.advance(300);
  assert.equal(state.requests.length, 2);
  assert.equal(state.loadCreationAccess("owner"), read);
  await state.respond(0, { access: grants("weddings") });
  await state.respond(1, { access: grants("birthdays") });
  assert.deepEqual(await read, grants("birthdays"), "the abandoned first response cannot win the retry");
  assert.equal(state.timers.size, 0);
});

test("two stalled attempts stop at ten seconds and allow a fresh explicit retry", async (t) => {
  const state = harness(t);
  assert.equal(state.CREATION_ACCESS_TIMEOUT_MS, 10_000);
  const read = state.loadCreationAccess("owner");
  const rejected = assert.rejects(read, /Loading your event types took too long\. Please try again\./);
  await state.advance(4_000);
  await state.advance(300);
  assert.equal(state.requests.length, 2);
  await state.advance(5_699);
  assert.equal(state.requests[1].options.signal.aborted, false);
  await state.advance(1);
  await rejected;
  assert.equal(state.requests[1].options.signal.aborted, true);
  assert.equal(state.timers.size, 0);
  const retry = state.loadCreationAccess("owner");
  assert.notEqual(retry, read);
  await state.respond(0, { access: grants("weddings") });
  await state.respond(1, { access: grants("weddings") });
  assert.equal(state.loadCreationAccess("owner"), retry, "late expired responses cannot disturb the fresh read");
  await state.respond(2, { access: grants("birthdays") });
  assert.deepEqual(await retry, grants("birthdays"));
});

for (const failure of [408, 429, 503, "network"]) {
  test(`a transient ${failure} failure retries once automatically`, async (t) => {
    const state = harness(t);
    const read = state.loadCreationAccess("owner");
    if (failure === "network") {
      state.requests[0].reject(new TypeError("Network unavailable"));
      await state.advance(0);
    } else await state.respond(0, { error: "Temporarily unavailable" }, failure);
    await state.advance(300);
    assert.equal(state.requests.length, 2);
    assert.equal(state.loadCreationAccess("owner"), read);
    await state.respond(1, { access: grants("birthdays") });
    assert.deepEqual(await read, grants("birthdays"));
    assert.equal(state.timers.size, 0);
  });
}

for (const status of [401, 403]) {
  test(`a ${status} response fails without retry or fabricated access`, async (t) => {
    const state = harness(t);
    const read = state.loadCreationAccess("owner");
    const failed = assert.rejects(read, /Sign in again/);
    await state.respond(0, { error: "Sign in again" }, status);
    await failed;
    assert.equal(state.requests.length, 1);
    assert.equal(state.timers.size, 0);
  });
}

test("exhausted temporary failures expose recovery and release the shared request", async (t) => {
  const state = harness(t);
  const read = state.loadCreationAccess("owner");
  const failed = assert.rejects(read, /Service unavailable/);
  await state.respond(0, { error: "Service unavailable" }, 503);
  await state.advance(300);
  await state.respond(1, { error: "Service unavailable" }, 503);
  await failed;
  assert.equal(state.timers.size, 0);
  const retry = state.loadCreationAccess("owner");
  await state.respond(2, { access: grants("birthdays") });
  assert.deepEqual(await retry, grants("birthdays"));
});

test("malformed grants never become a successful snapshot", async (t) => {
  const state = harness(t);
  const read = state.loadCreationAccess("owner");
  const failed = assert.rejects(read, /Could not load your event access/);
  await state.respond(0, { access: { policy: "standard" } });
  await state.advance(300);
  await state.respond(1, { access: { policy: "restricted", allowedProducts: [true], allowedCategories: [] } });
  await failed;
  assert.equal(state.timers.size, 0);
});

test("changing sessions invalidates the old pending read without letting its completion displace a new read", async (t) => {
  const state = harness(t);
  const old = state.loadCreationAccess("owner");
  state.invalidateCreationAccess("owner");
  const current = state.loadCreationAccess("owner");
  assert.notEqual(current, old);
  await state.respond(0, { access: grants("weddings") });
  await old;
  assert.equal(state.loadCreationAccess("owner"), current);
  await state.respond(1, { access: grants("birthdays") });
  assert.deepEqual(await current, grants("birthdays"));
});
