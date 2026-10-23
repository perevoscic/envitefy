const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../../../../scripts/lib/event-messages-test-loader.cjs");

function harness({ authenticated = true, failure, suggestion, configured = false } = {}) {
  const calls = [];
  const row = {
    id: "current-user",
    feature_visibility: {
      v: 4,
      visibleTemplateKeys: ["birthdays", "weddings", "football_season"],
      defaultCreateIntent: "weddings",
      sportPreferences: configured
        ? { primarySport: "football", enabledSports: ["football"], setupCompleted: true }
        : undefined,
    },
  };
  const route = loadTs("src/app/api/user/feature-visibility/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": {
      getAuthenticatedRequestUser: async () => {
        if (failure === "auth") throw new Error("session service unavailable");
        return authenticated ? { ok: true, email: "current@example.test", userId: row.id } : { ok: false };
      },
    },
    "@/lib/db": {
      getFeatureVisibilityByEmail: async (email) => {
        calls.push({ method: "preferences", email });
        if (failure === "preferences") throw new Error("preferences unavailable");
        return row;
      },
      getSportPreferenceSuggestionByEmail: async (email, existingRow) => {
        calls.push({ method: "suggestion", email });
        assert.equal(existingRow, row);
        if (failure === "suggestion") throw new Error("optional history unavailable");
        return suggestion ? suggestion() : { sport: "football", source: "history" };
      },
    },
    "@/lib/creation-access-server": {
      getCreationAccess: async (userId) => {
        calls.push({ method: "access", userId });
        if (failure === "access") throw new Error("grants unavailable");
        return { policy: "restricted", allowedProducts: ["event_page"], allowedCategories: ["birthdays"] };
      },
    },
  });
  return { calls, get: () => route.GET(new Request("http://localhost/api/user/feature-visibility")) };
}

test("feature visibility returns saved preferences filtered by the current account grants", async () => {
  const state = harness();
  const response = await state.get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const payload = await response.json();
  assert.deepEqual(payload.visibleTemplateKeys, ["birthdays"]);
  assert.equal(payload.defaultCreateIntent, null);
  assert.deepEqual(payload.sportPreferenceSuggestion, { sport: "football", source: "history" });
  assert.deepEqual(state.calls, [
    { method: "preferences", email: "current@example.test" },
    { method: "access", userId: "current-user" },
    { method: "suggestion", email: "current@example.test" },
  ]);
});

test("optional sport history failures do not discard verified workspace preferences", async () => {
  const response = await harness({ failure: "suggestion" }).get();
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.visibleTemplateKeys, ["birthdays"]);
  assert.equal(payload.sportPreferenceSuggestion, null);
});

test("stalled optional sport history does not delay preferences beyond one second", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let started;
  const historyStarted = new Promise((resolve) => { started = resolve; });
  const state = harness({ suggestion: () => { started(); return new Promise(() => {}); } });
  const pending = state.get();
  await historyStarted;
  context.mock.timers.tick(1_000);
  const response = await pending;
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.visibleTemplateKeys, ["birthdays"]);
  assert.equal(payload.sportPreferenceSuggestion, null);
});

test("completed sports setup skips optional history and still applies grants", async () => {
  const state = harness({ configured: true, failure: "suggestion" });
  const response = await state.get();
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.sportPreferences.enabledSports, []);
  assert.equal(payload.sportPreferenceSuggestion, null);
  assert.equal(state.calls.some((call) => call.method === "suggestion"), false);
});

test("feature visibility requires authentication before reading preferences or grants", async () => {
  const state = harness({ authenticated: false });
  const response = await state.get();
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(state.calls, []);
});

test("core session, preference and grant failures return retryable JSON without granting categories", async () => {
  for (const failure of ["auth", "preferences", "access"]) {
    const response = await harness({ failure }).get();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { error: "Could not load your workspace preferences. Please retry." });
  }
});
