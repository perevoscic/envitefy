const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./lib/event-messages-test-loader.cjs");
function api(fail) {
  return loadTs("src/app/api/livecard-builder/jobs/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) }, after: () => {} },
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "owner" },
    "@/lib/livecard-api-access": { builderApiAccess: async () => null },
    "@/lib/livecard-builder": { readLiveCardForm: () => ({ title: "Event" }), validateLiveCard: () => ({}) },
    "@/lib/shared-card-design": { readSharedCardDesign: () => null },
    "@/lib/creation-access": { liveCardCreationCategories: () => ["general"] },
    "@/lib/creation-access-server": { checkCreationAccess: async () => null },
    "@/lib/db": { getEventHistoryById: async () => null },
    "@/lib/event-collaboration": { getEventPermissions: async () => ({ canEdit: true }) },
    "@/lib/livecard-artwork-jobs": {
      readArtworkJobForAccess: async () => fail ? Promise.reject(new Error("Private database detail")) : null,
      createArtworkJob: async () => { throw new Error("Private database detail"); },
      cancelArtworkJob: async () => null, runArtworkJob: async () => {},
    },
  });
}
test("job request failures return safe JSON instead of a framework HTML error page", async t => {
  t.mock.method(console, "error", () => {});
  const route = api(true);
  for (const method of ["GET", "POST", "PATCH"]) {
    const response = await route[method](new Request("https://envitefy.com/api/livecard-builder/jobs?id=existing-job", { method, ...(method === "GET" ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "existing-job", key: "original-key", form: { title: "Event" } }) }) }));
    assert.equal(response.status, 503);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.match((await response.json()).error, /Reconnect to the same job/);
  }
});
test("missing jobs remain JSON 404 and cannot trigger a new generation", async () => {
  const response = await api(false).GET(new Request("https://envitefy.com/api/livecard-builder/jobs?id=missing"));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { job: null });
});
