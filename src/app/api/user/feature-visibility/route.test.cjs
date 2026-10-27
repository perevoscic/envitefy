const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../../../../scripts/lib/event-messages-test-loader.cjs");

function harness({ authenticated = true, failure, suggestion, configured = false, metadata = {}, access } = {}) {
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
      ...metadata,
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
      updateFeatureVisibilityByEmail: async ({ email, ...patch }) => {
        calls.push({ method: "update", email, patch });
        row.feature_visibility = { ...row.feature_visibility, ...JSON.parse(JSON.stringify(patch)) };
      },
    },
    "@/lib/creation-access-server": {
      getCreationAccess: async (userId) => {
        calls.push({ method: "access", userId });
        if (failure === "access") throw new Error("grants unavailable");
        return access || { policy: "restricted", allowedProducts: ["event_page"], allowedCategories: ["birthdays"] };
      },
    },
  });
  return {
    calls, row,
    get: () => route.GET(new Request("http://localhost/api/user/feature-visibility")),
    put: (body) => route.PUT(new Request("http://localhost/api/user/feature-visibility", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })),
  };
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

test("pinned category reads preserve legacy absence and explicit clearing while applying account grants", async () => {
  for (const pinnedCategoryIds of [undefined, null]) {
    const payload = await (await harness({ metadata: { pinnedCategoryIds } }).get()).json();
    assert.equal(Object.hasOwn(payload, "pinnedCategoryIds"), false);
  }
  const cleared = await (await harness({ metadata: { pinnedCategoryIds: [] } }).get()).json();
  assert.deepEqual(cleared.pinnedCategoryIds, []);
  const filtered = await (await harness({ metadata: { pinnedCategoryIds: ["weddings", "birthdays", "birthdays", "unknown"] } }).get()).json();
  assert.deepEqual(filtered.pinnedCategoryIds, ["birthdays"]);
});

test("pin writes deduplicate allowed categories without granting blocked categories or products", async () => {
  const state = harness({ metadata: { signupAttribution: { intent: "gymnastics", path: "/gymnastics" } } });
  const response = await state.put({ pinnedCategoryIds: ["weddings", "birthdays", "birthdays", "gymnastics", "unknown"] });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.featureVisibility.pinnedCategoryIds, ["birthdays"]);
  assert.deepEqual(state.row.feature_visibility.signupAttribution, { intent: "gymnastics", path: "/gymnastics" });
  const update = state.calls.find((call) => call.method === "update");
  assert.equal(update.email, "current@example.test");
  assert.deepEqual(update.patch.pinnedCategoryIds, ["birthdays"]);
  assert.deepEqual(update.patch.visibleTemplateKeys, ["birthdays"]);
  assert.equal(Object.hasOwn(update.patch, "allowedCategories"), false);
  assert.equal(Object.hasOwn(update.patch, "allowedProducts"), false);

  const noProduct = harness({ access: { policy: "restricted", allowedProducts: ["snap"], allowedCategories: ["birthdays"] } });
  const denied = await noProduct.put({ pinnedCategoryIds: ["birthdays"] });
  assert.deepEqual((await denied.json()).featureVisibility.pinnedCategoryIds, []);
});

test("explicit empty pin writes remain empty across reloads and unrelated writes preserve saved pins", async () => {
  const state = harness({ metadata: { pinnedCategoryIds: ["birthdays"] } });
  assert.equal((await state.put({ quickAccess: ["snap"] })).status, 200);
  assert.deepEqual(state.row.feature_visibility.pinnedCategoryIds, ["birthdays"]);
  assert.equal(state.calls.find((call) => call.method === "update").patch.pinnedCategoryIds, undefined);
  const response = await state.put({ pinnedCategoryIds: [] });
  assert.deepEqual((await response.json()).featureVisibility.pinnedCategoryIds, []);
  assert.deepEqual((await (await state.get()).json()).pinnedCategoryIds, []);
});

test("pin writes require authentication and a string list before preferences are mutated", async () => {
  const signedOut = harness({ authenticated: false });
  assert.equal((await signedOut.put({ pinnedCategoryIds: ["birthdays"] })).status, 401);
  assert.deepEqual(signedOut.calls, []);
  for (const pinnedCategoryIds of [null, "birthdays", {}, ["birthdays", 5]]) {
    const state = harness();
    assert.equal((await state.put({ pinnedCategoryIds })).status, 400);
    assert.equal(state.calls.some((call) => call.method === "update"), false);
  }
});
