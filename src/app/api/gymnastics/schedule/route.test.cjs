const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../../../scripts/lib/event-messages-test-loader.cjs");
class CreateSourceError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
function route(overrides = {}) {
  const calls = [];
  const stubs = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": { getAuthenticatedRequestUser: async () => ({ ok: true, userId: "host" }) },
    "@/lib/creation-access-server": { checkCreationAccess: async (userId, operation) => { calls.push({ userId, operation }); return null; } },
    "@/lib/create/read-source": { CreateSourceError },
    "@/lib/gymnastics-schedule-reader": { readGymnasticsSchedule: async (file, signal) => { calls.push({ file: file.name, signal }); return { days: [{ isoDate: "2027-04-10", sessions: [] }] }; } },
    ...overrides,
  };
  return { post: loadTs("src/app/api/gymnastics/schedule/route.ts", stubs).POST, calls };
}
const request = (options = {}) => {
  const form = new FormData();
  if (!options.empty) form.set("file", new File(["schedule"], "schedule.jpg", { type: "image/jpeg" }));
  return new Request("https://envitefy.com/api/gymnastics/schedule?edit=same-event", { method: "POST", body: form, headers: options.headers });
};
test("saved event membership is checked before schedule reading", async () => {
  const { post, calls } = route();
  const response = await post(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(calls[0], { userId: "host", operation: { product: "event_page", category: "gymnastics", eventId: "same-event" } });
  assert.equal(calls[1].file, "schedule.jpg");
  assert.ok(calls[1].signal instanceof AbortSignal);
});
test("unauthorized, cross-site, oversized and missing-file requests cannot reach reading", async () => {
  for (const [overrides, options, status] of [
    [{ "@/lib/auth": { getAuthenticatedRequestUser: async () => ({ ok: false }) } }, {}, 401],
    [{ "@/lib/creation-access-server": { checkCreationAccess: async () => Response.json({ error: "No access" }, { status: 403 }) } }, {}, 403],
    [{}, { headers: { "sec-fetch-site": "cross-site" } }, 403],
    [{}, { headers: { "content-length": String(5 * 1024 * 1024) } }, 413],
    [{}, { empty: true }, 400],
  ]) {
    const { post, calls } = route(overrides);
    assert.equal((await post(request(options))).status, status);
    assert.equal(calls.some(call => call.file), false);
  }
});
test("parse failures keep edits and hide provider errors", async () => {
  const { post } = route({ "@/lib/gymnastics-schedule-reader": { readGymnasticsSchedule: async () => { throw new Error("private provider details"); } } });
  const response = await post(request());
  assert.equal(response.status, 422);
  const body = await response.text();
  assert.match(body, /Your edits are kept/);
  assert.doesNotMatch(body, /private provider details/);
});
