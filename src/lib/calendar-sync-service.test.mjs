import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync("src/lib/calendar-sync-service.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness({
  provider = "google",
  providerError = null,
  stale = false,
  validDate = true,
} = {}) {
  const h = { writes: [], calls: [], invalidations: [] };
  h.row = {
    id: "01234567-abcd-4321-abcd-012345678901",
    user_id: "owner",
    title: "Appointment",
    data: { calendarSync: { status: "syncing", claimToken: stale ? "newer-worker" : "claim" } },
    public_slug: "appointment",
  };
  const mocks = {
    "next/server": { NextResponse: Response },
    "@/lib/google-calendar-connection": {
      getGoogleCalendarRefreshToken: async () =>
        provider === "google" ? "google-test-grant" : null,
    },
    googleapis: {
      google: {
        auth: {
          OAuth2: class {
            setCredentials(value) {
              h.credentials = value;
            }
          },
        },
        calendar: () => ({
          events: {
            insert: async (...args) => {
              h.calls.push(args);
              if (providerError) throw providerError;
              return {
                data: { id: "google-event", htmlLink: "https://calendar.google.com/event" },
              };
            },
            get: async () => ({ data: { id: "existing-event" } }),
          },
        }),
      },
    },
    "@/lib/calendar-auto-sync": {
      buildAutoCalendarEvent: () =>
        validDate
          ? { ok: true, value: { event: { title: "Appointment" }, flyer: null } }
          : { ok: false, reason: "missing_start" },
    },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => h.invalidations.push("dashboard") },
    "@/lib/history-cache": { invalidateUserHistory: () => h.invalidations.push("history") },
    "@/lib/db": {
      getEventHistoryById: async () => h.row,
      getMicrosoftRefreshToken: async () =>
        provider === "microsoft" ? "microsoft-test-grant" : null,
      getUserByEmail: async () => ({ preferred_provider: provider }),
      query: async (sql, values) => {
        h.writes.push({ sql, values });
        if (h.row.data.calendarSync.claimToken === values[1])
          h.row.data.calendarSync = JSON.parse(values[2]);
        return { rows: [] };
      },
    },
    "@/lib/mappers": { toGoogleEvent: (event) => event, toMicrosoftEvent: (event) => event },
    "@/utils/event-url": { buildEventPath: () => "/event/appointment" },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    URL,
    URLSearchParams,
    Response,
    Buffer,
    AbortSignal,
    process: { env: {} },
    fetch: async (url, options) => {
      h.calls.push([url, options]);
      return Response.json(
        url.includes("/token")
          ? { access_token: "test-access" }
          : { id: "outlook-event", webLink: "https://outlook.example/event" },
      );
    },
    require: (name) => {
      assert.ok(mocks[name], `Missing mock: ${name}`);
      return mocks[name];
    },
  });
  h.run = () =>
    module.exports.syncSavedEventToCalendar({
      eventId: h.row.id,
      userId: "owner",
      email: "owner@example.invalid",
      origin: "https://envitefy.example",
      claimToken: "claim",
    });
  return h;
}

test("background Google sync retains deterministic IDs and persists success", async () => {
  const h = harness();
  assert.equal((await (await h.run()).json()).status, "synced");
  assert.equal(h.calls[0][0].requestBody.id, "e01234567abcd4321abcd012345678901");
  assert.equal(h.calls[0][0].requestBody.source.url, "https://envitefy.example/event/appointment");
  assert.equal(h.row.data.calendarSync.providers.google.externalEventId, "google-event");
  assert.equal(h.row.data.calendarSync.status, "synced");
});

test("background Outlook sync retains its transaction ID and persists success", async () => {
  const h = harness({ provider: "microsoft" });
  assert.equal((await (await h.run()).json()).provider, "microsoft");
  assert.equal(JSON.parse(h.calls[1][1].body).transactionId, `envitefy:${h.row.id}`);
  assert.equal(h.row.data.calendarSync.providers.microsoft.externalEventId, "outlook-event");
});

test("disconnected accounts and invalid dates become terminal states for polling", async () => {
  for (const [options, expected] of [
    [{ provider: null }, "needs_connection"],
    [{ validDate: false }, "skipped"],
  ]) {
    const h = harness(options);
    assert.equal((await (await h.run()).json()).status, expected);
    assert.equal(h.row.data.calendarSync.status, expected);
    assert.equal(h.calls.length, 0);
  }
});

test("provider failures preserve reconnect feedback without throwing into event saving", async () => {
  const h = harness({ providerError: { status: 401 } });
  assert.equal((await (await h.run()).json()).status, "needs_reconnect");
  assert.equal(h.row.data.calendarSync.status, "needs_reconnect");
});

test("an expired worker cannot overwrite the result of a newer retry", async () => {
  const h = harness({ stale: true });
  await h.run();
  assert.equal(h.row.data.calendarSync.claimToken, "newer-worker");
  assert.equal(h.row.data.calendarSync.status, "syncing");
  assert.match(h.writes[0].sql, /data->'calendarSync'->>'claimToken' = \$2/);
});

test("explicit retries reuse an existing provider event, while a newly connected provider can sync", async () => {
  const h = harness();
  h.row.data.calendarSync.providers = { google: { status: "synced", externalEventId: "existing" } };
  assert.equal((await (await h.run()).json()).status, "already_synced");
  assert.equal(h.calls.length, 0);
  const outlook = harness({ provider: "microsoft" });
  outlook.row.data.calendarSync.providers = {
    google: { status: "synced", externalEventId: "existing" },
  };
  assert.equal((await (await outlook.run()).json()).status, "synced");
  assert.equal(outlook.row.data.calendarSync.providers.microsoft.externalEventId, "outlook-event");
});
