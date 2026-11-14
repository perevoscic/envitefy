const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");

function fixture({
  signedIn = true,
  canEdit = true,
  ended = false,
  url = true,
  fail = false,
  protectedSource,
} = {}) {
  let checks = 0,
    reads = 0;
  const row = {
    id: "event",
    user_id: "owner",
    data: {
      date: ended ? "2020-01-01" : "2099-01-01",
      timezone: "America/Chicago",
      ...(url ? { sourceUpdates: { version: 1, url: "https://example.com/event" } } : {}),
    },
  };
  const { GET, POST } = load("src/app/api/events/[id]/source-updates/route.ts", {
    "next/server": {
      NextResponse: {
        json: (value, options) =>
          new Response(JSON.stringify(value), {
            ...options,
            headers: { "Content-Type": "application/json", ...options?.headers },
          }),
      },
    },
    "@/lib/auth": {
      getAuthenticatedRequestUser: async () =>
        signedIn ? { ok: true, userId: "cohost" } : { ok: false },
    },
    "@/lib/db": {
      getEventHistoryById: async () => {
        reads++;
        return row;
      },
      getEventDiscoveryByEventId: async () =>
        protectedSource ? { source: protectedSource } : null,
    },
    "@/lib/event-collaboration": { getEventPermissions: async () => ({ canEdit }) },
    "@/lib/event-source-updates.server": {
      checkEventSource: async () => {
        checks++;
        if (fail) throw new Error("Schedule fetch timed out");
        return { incoming: { title: "New" }, warnings: [] };
      },
    },
  });
  return {
    metadata: () =>
      GET(new Request("http://localhost/api/events/event/source-updates"), {
        params: Promise.resolve({ id: "event" }),
      }),
    call: () =>
      POST(new Request("http://localhost/api/events/event/source-updates", { method: "POST" }), {
        params: Promise.resolve({ id: "event" }),
      }),
    checks: () => checks,
    reads: () => reads,
  };
}
test("source checks reject unauthenticated users, non-hosts, ended events, and non-URL events before extraction", async () => {
  for (const [options, status] of [
    [{ signedIn: false }, 401],
    [{ canEdit: false }, 404],
    [{ ended: true }, 409],
    [{ url: false }, 400],
  ]) {
    const f = fixture(options);
    assert.equal((await f.call()).status, status);
    assert.equal(f.checks(), 0);
    if (!options.signedIn && options.signedIn !== undefined) assert.equal(f.reads(), 0);
  }
});

test("eligibility recovers the protected original URL without extraction, including ended events", async () => {
  for (const ended of [false, true]) {
    const f = fixture({
      url: false,
      ended,
      protectedSource: { type: "url", url: "https://example.com/original-meet" },
    });
    const response = await f.metadata();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const body = await response.json();
    assert.equal(body.eligible, true);
    assert.equal(body.ended, ended);
    assert.equal(body.url, "https://example.com/original-meet");
    assert.equal(f.checks(), 0);
  }
  assert.equal(
    (
      await (
        await fixture({
          url: false,
          protectedSource: { type: "file", url: "https://example.com/not-the-input" },
        }).metadata()
      ).json()
    ).eligible,
    false,
  );
});

test("source metadata is restricted to signed-in hosts and never starts source extraction", async () => {
  for (const [options, status] of [
    [{ signedIn: false }, 401],
    [{ canEdit: false }, 404],
  ]) {
    const f = fixture(options);
    assert.equal((await f.metadata()).status, status);
    assert.equal(f.checks(), 0);
  }
});
test("authorized co-host checks are private read-only responses and preserve precise fetch failures", async () => {
  const f = fixture();
  const response = await f.call();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(f.checks(), 1);
  const failed = await fixture({ fail: true }).call();
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).error, "Schedule fetch timed out");
});
