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
    // Deliberately ignore the AbortSignal so timeout recovery cannot depend on
    // the transport acknowledging cancellation.
    requests.push({ url, options, resolve, reject });
  }));
  const client = loadTs("src/lib/create/creation-access-client.ts");
  return {
    ...client,
    requests,
    timers,
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
    respond(index, body, status = 200) {
      requests[index].resolve(Response.json(body, { status }));
    },
  };
}

test("concurrent grant reads for one account share one request and completed reads do not stay cached", async (t) => {
  const state = harness(t);
  const first = state.loadCreationAccess("owner@example.com");
  assert.equal(state.loadCreationAccess("owner@example.com"), first);
  assert.equal(state.requests.length, 1);
  state.respond(0, { access: grants("birthdays") });
  assert.deepEqual(await first, grants("birthdays"));
  assert.equal(state.timers.size, 0);

  const refreshed = state.loadCreationAccess("owner@example.com");
  assert.notEqual(refreshed, first);
  assert.equal(state.requests.length, 2);
  state.respond(1, { access: grants("weddings") });
  assert.deepEqual(await refreshed, grants("weddings"));
});

test("different account identities never share a pending grant response", async (t) => {
  const state = harness(t);
  const owner = state.loadCreationAccess("owner@example.com");
  const other = state.loadCreationAccess("other@example.com");
  assert.notEqual(owner, other);
  assert.equal(state.requests.length, 2);
  state.respond(1, { access: grants("gymnastics") });
  state.respond(0, { access: grants("birthdays") });
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
  state.respond(0, { access: grants("birthdays") });
  await read;
});

test("a 10-second grant timeout aborts the transport and permits retry even when fetch ignores abort", async (t) => {
  const state = harness(t);
  assert.equal(state.CREATION_ACCESS_TIMEOUT_MS, 10_000);
  const read = state.loadCreationAccess("owner@example.com");
  const rejected = assert.rejects(read, /Loading your event types took too long\. Please try again\./);
  state.advance(9_999);
  assert.equal(state.requests[0].options.signal.aborted, false);
  assert.equal(state.loadCreationAccess("owner@example.com"), read);
  state.advance(1);
  await rejected;
  assert.equal(state.requests[0].options.signal.aborted, true);
  assert.equal(state.timers.size, 0);

  const retry = state.loadCreationAccess("owner@example.com");
  assert.notEqual(retry, read);
  assert.equal(state.requests.length, 2);
  state.respond(0, { access: grants("weddings") });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(state.loadCreationAccess("owner@example.com"), retry, "a late timed-out response must not disturb its pending retry");
  state.respond(1, { access: grants("birthdays") });
  assert.deepEqual(await retry, grants("birthdays"));
  assert.equal(state.timers.size, 0);
});

test("failed grant responses release their pending request and leave a fresh retry possible", async (t) => {
  const state = harness(t);
  const failed = state.loadCreationAccess("owner@example.com");
  state.respond(0, { error: "Access service is unavailable." }, 503);
  await assert.rejects(failed, /Access service is unavailable\./);
  assert.equal(state.timers.size, 0);
  const retry = state.loadCreationAccess("owner@example.com");
  assert.equal(state.requests.length, 2);
  state.respond(1, { access: grants("birthdays") });
  assert.deepEqual(await retry, grants("birthdays"));
});
