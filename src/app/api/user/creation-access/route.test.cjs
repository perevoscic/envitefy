const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../../../../scripts/lib/event-messages-test-loader.cjs");

function harness({ authenticated = true, accessFailure = false, requestsFailure = false } = {}) {
  const calls = [];
  const access = { policy: "restricted", allowedProducts: ["event_page"], allowedCategories: ["birthdays"] };
  const requests = [{ id: "request-1", status: "pending", capability: "weddings" }];
  const route = loadTs("src/app/api/user/creation-access/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": { getAuthenticatedRequestUser: async () => authenticated ? { ok: true, userId: "current-user" } : { ok: false } },
    "@/lib/creation-access-server": {
      getCreationAccess: async (userId) => {
        calls.push({ method: "access", userId });
        if (accessFailure) throw new Error("database unavailable");
        return access;
      },
      listCreationAccessRequests: async (userId) => {
        calls.push({ method: "requests", userId });
        if (requestsFailure) throw new Error("history unavailable");
        return requests;
      },
    },
  });
  return { calls, access, requests, get: (query = "") => route.GET(new Request(`http://localhost/api/user/creation-access${query}`)) };
}

test("the creation access summary returns current grants without loading settings history", async () => {
  const state = harness({ requestsFailure: true });
  const response = await state.get("?summary=1");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { access: state.access });
  assert.deepEqual(state.calls, [{ method: "access", userId: "current-user" }]);
});

test("the default creation access response retains requests and the settings catalog", async () => {
  const state = harness();
  const response = await state.get();
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.access, state.access);
  assert.deepEqual(payload.requests, state.requests);
  assert.equal(payload.catalog.categories.birthdays, "Birthdays");
  assert.equal(payload.catalog.products.event_page, "Event Page");
  assert.deepEqual(state.calls, [
    { method: "access", userId: "current-user" },
    { method: "requests", userId: "current-user" },
  ]);
});

test("creation access requires sign-in for both response forms before reading grants", async () => {
  for (const query of ["", "?summary=1"]) {
    const state = harness({ authenticated: false });
    const response = await state.get(query);
    assert.equal(response.status, 401);
    assert.deepEqual(state.calls, []);
  }
});

test("failed creation access reads return retryable JSON without admitting any grants", async () => {
  for (const query of ["", "?summary=1"]) {
    const state = harness({ accessFailure: true });
    const response = await state.get(query);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), { error: "Could not load your event access. Please retry." });
  }
});
