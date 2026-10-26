const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

function harness({ provider = "google", connected = true, insertError = null, updateError = null } = {}) {
  const h = { googleInserts: [], googleUpdates: [], googleGets: [], requests: [], tokenReads: [] };
  h.row = { id: "saved-memo", user_id: "owner", data: { scanSchedule: { kind: "school-memo" } } };
  h.events = {
    insert: async (...args) => {
      h.googleInserts.push(args);
      if (insertError) throw insertError;
      return { data: { id: args[0].requestBody.id, htmlLink: "https://calendar.example/event" } };
    },
    get: async (...args) => { h.googleGets.push(args); return { data: { id: "recovered-item", summary: "Old title" } }; },
    update: async (...args) => {
      h.googleUpdates.push(args);
      if (updateError) throw updateError;
      return { data: { id: args[0].eventId, htmlLink: "https://calendar.example/updated" } };
    },
  };
  const service = loadTs("src/lib/calendar-sync-service.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/google-calendar-connection": { getGoogleCalendarRefreshToken: async (email) => { h.tokenReads.push(["google", email]); return connected && provider === "google" ? "test-google-grant" : null; } },
    googleapis: { google: {
      auth: { OAuth2: class { setCredentials(value) { h.credentials = value; } } },
      calendar: () => ({ events: h.events }),
    } },
    "@/lib/calendar-auto-sync": { buildAutoCalendarEvent: () => { throw new Error("Memo parent must not be normalized for auto-sync"); } },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => {} },
    "@/lib/history-cache": { invalidateUserHistory: () => {} },
    "@/lib/db": {
      getEventHistoryById: async () => h.row,
      getMicrosoftRefreshToken: async (email) => { h.tokenReads.push(["microsoft", email]); return connected && provider === "microsoft" ? "test-microsoft-grant" : null; },
      getUserByEmail: async () => { throw new Error("Memo parent must not read calendar preferences"); },
      query: async () => { throw new Error("Memo parent must not write auto-sync state"); },
    },
    "@/lib/mappers": {
      toGoogleEvent: (event) => ({ summary: event.title, start: { date: event.start }, end: { date: event.end } }),
      toMicrosoftEvent: (event) => ({ subject: event.title, start: { dateTime: `${event.start}T00:00:00`, timeZone: event.timezone }, end: { dateTime: `${event.end}T00:00:00`, timeZone: event.timezone }, isAllDay: true }),
    },
    "@/utils/event-product-route": { buildEventProductPath: () => "/event/saved-memo" },
  });
  h.write = (options = {}) => service.writeSelectedCalendarItem({
    provider, email: "owner@example.invalid", sourceId: "abc123def4567890abc123def4567890",
    eventUrl: "https://envitefy.example/event/saved-memo",
    event: { title: "Bible test", start: "2026-10-30", end: "2026-10-31", allDay: true, timezone: "America/Chicago", reminders: [] },
    ...options,
  });
  h.auto = (options = {}) => service.syncSavedEventToCalendar({ eventId: h.row.id, userId: "owner", email: "owner@example.invalid", origin: "https://envitefy.example", claimToken: "claim", ...options });
  h.installFetch = (t, { failUpdate = false } = {}) => t.mock.method(globalThis, "fetch", async (url, options) => {
    h.requests.push([url, options]);
    if (String(url).includes("/token")) return Response.json({ access_token: "test-access-token" });
    if (options.method === "PATCH" && failUpdate) return Response.json({ error: { message: "provider detail" } }, { status: 500 });
    return Response.json({ id: "outlook-item", webLink: "https://calendar.example/outlook-item" });
  });
  return h;
}

test("direct auto-sync refuses a memo parent before reading tokens or writing provider events", async () => {
  const h = harness();
  const response = await h.auto();
  assert.deepEqual(await response.json(), { ok: true, status: "skipped", reason: "explicit_calendar_selection" });
  assert.equal(h.tokenReads.length, 0);
  assert.equal(h.googleInserts.length, 0);
  assert.equal((await h.auto({ userId: "another-account" })).status, 403);
});

test("explicit Google additions use deterministic identities and preserve no reminders without attachments", async () => {
  const h = harness();
  const added = await h.write();
  const input = h.googleInserts[0][0];
  assert.equal(input.requestBody.id, "eabc123def4567890abc123def4567890");
  assert.equal(added.externalEventId, input.requestBody.id);
  assert.deepEqual(input.requestBody.reminders, { useDefault: false, overrides: [] });
  assert.equal(input.requestBody.attachments, undefined);
  assert.equal(input.supportsAttachments, false);
  assert.deepEqual(input.requestBody.start, { date: "2026-10-30" });
});

test("an existing Google item is updated rather than inserted again", async () => {
  const h = harness();
  const updated = await h.write({ externalEventId: "linked-item" });
  assert.equal(h.googleInserts.length, 0);
  assert.equal(h.googleUpdates.length, 1);
  assert.equal(h.googleUpdates[0][0].eventId, "linked-item");
  assert.equal(h.googleUpdates[0][0].requestBody.summary, "Bible test");
  assert.deepEqual(h.googleUpdates[0][0].requestBody.reminders, { useDefault: false, overrides: [] });
  assert.equal(updated.externalEventId, "linked-item");
});

test("Google recovery of a remotely-created item applies the current reviewed content", async () => {
  const h = harness({ insertError: { code: 409 } });
  const recovered = await h.write();
  assert.equal(h.googleInserts.length, 1);
  assert.equal(h.googleUpdates.length, 1, "recovery must not mark new content synced while leaving the old remote event unchanged");
  assert.equal(h.googleUpdates[0][0].eventId, "eabc123def4567890abc123def4567890");
  assert.equal(h.googleUpdates[0][0].requestBody.summary, "Bible test");
  assert.equal(recovered.externalEventId, "eabc123def4567890abc123def4567890");
});

test("disconnected selections and missing timed ends fail before any provider write", async () => {
  const h = harness({ connected: false });
  await assert.rejects(h.write(), /Reconnect/);
  assert.equal(h.googleInserts.length, 0);
  const missingEnd = harness();
  await assert.rejects(missingEnd.write({ event: { title: "Meeting", start: "2026-11-02T15:30:00-06:00", end: null, timezone: "America/Chicago" } }), /end time/);
  assert.equal(missingEnd.tokenReads.length, 0);
});

test("Microsoft additions and updates share stable item identity and explicit no-reminder behavior", async (t) => {
  const h = harness({ provider: "microsoft" });
  h.installFetch(t);
  await h.write();
  const create = h.requests.find(([, options]) => options.method === "POST" && options.headers["Content-Type"] === "application/json");
  const body = JSON.parse(create[1].body);
  assert.equal(body.transactionId, "envitefy:abc123def4567890abc123def4567890");
  assert.equal(body.isReminderOn, false);
  assert.equal(body.attachments, undefined);
  h.requests.length = 0;
  const updated = await h.write({ externalEventId: "outlook /item" });
  const patch = h.requests.find(([, options]) => options.method === "PATCH");
  assert.match(patch[0], /outlook%20%2Fitem$/);
  assert.equal(JSON.parse(patch[1].body).isReminderOn, false);
  assert.equal(updated.externalEventId, "outlook /item");
});

test("Microsoft update failures remain failures rather than reporting a successful sync", async (t) => {
  const h = harness({ provider: "microsoft" });
  h.installFetch(t, { failUpdate: true });
  await assert.rejects(h.write({ externalEventId: "linked-item" }), /could not update/);
});
