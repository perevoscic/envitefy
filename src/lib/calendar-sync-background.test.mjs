import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as state from "./calendar-sync-state.ts";

function load(file, mocks) {
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Response,
    URL,
    Buffer,
    console,
    process,
    require(name) {
      if (!(name in mocks)) throw new Error(`Missing mock ${name}`);
      return mocks[name];
    },
  });
  return module.exports;
}

function harness({
  userId = "owner",
  status = "pending",
  enabled = true,
  delay = false,
  error = false,
} = {}) {
  const h = { jobs: [], calls: [], writes: [], invalidations: [], providerCalls: 0 };
  h.row = {
    id: "event",
    user_id: "owner",
    title: "Appointment",
    data: {
      createdVia: "ocr",
      calendarSync: {
        status,
        updatedAt: new Date().toISOString(),
        autoProvider: "google",
        providers: { google: { externalEventId: "private" } },
        claimToken: "private-token",
      },
    },
  };
  h.gate = new Promise((resolve) => {
    h.release = resolve;
  });
  const mocks = {
    "node:crypto": { randomUUID: () => "new-claim" },
    "next/server": { NextResponse: Response, after: (job) => h.jobs.push(job) },
    "next-auth": {
      getServerSession: async () => (userId ? { user: { email: "owner@example.invalid" } } : null),
    },
    "@/config/calendar-sync": { CONNECTED_CALENDAR_SYNC_ENABLED: enabled },
    "@/lib/calendar-sync-state": state,
    "@/lib/ocr/original-display-state": load("src/lib/ocr/original-display-state.ts", {}),
    "@/lib/calendar-sync-pause": { getCalendarSyncPauseResponse: () => null },
    "@/lib/absolute-url": { absoluteUrl: async () => "https://envitefy.example/" },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/dashboard-cache": {
      invalidateUserDashboard: (id) => h.invalidations.push(["dashboard", id]),
    },
    "@/lib/history-cache": { invalidateUserHistory: (id) => h.invalidations.push(["history", id]) },
    "@/lib/db": {
      getEventHistoryById: async () => h.row,
      query: async (sql, values) => {
        h.writes.push({ sql, values });
        if (sql.includes("RETURNING id")) {
          const current = state.readCalendarSyncState(h.row.data.calendarSync);
          if (
            values[1] !== h.row.user_id ||
            !(state.canResumeCalendarSync(current) || (values[4] && current.status !== "syncing"))
          )
            return { rows: [] };
          h.row.data.calendarSync = { ...h.row.data.calendarSync, ...JSON.parse(values[2]) };
          return { rows: [{ id: "event" }] };
        }
        if (h.row.data.calendarSync.claimToken === values[3]) {
          Object.assign(h.row.data.calendarSync, JSON.parse(values[2]));
        }
        return { rows: [] };
      },
    },
    "@/lib/calendar-sync-service": {
      syncSavedEventToCalendar: async (params) => {
        h.providerCalls++;
        h.calls.push(params);
        if (delay) await h.gate;
        if (error) throw new Error("provider unavailable");
        h.row.data.calendarSync.status = "synced";
        return Response.json({ ok: true, status: "synced", provider: "google" });
      },
    },
    "@/lib/signup-mutations": { updateSignupDefinition: () => {}, SignupMutationError: Error },
    "@/lib/event-draft-access": { isEventDraft: () => false, isClientDraftId: () => true },
    "@/lib/ocr/scan-artwork": { prepareSavedScanArtwork: () => false },
    "@/lib/event-access": {},
    "@/lib/event-media": { findTransientEventMedia: () => [] },
    "@/lib/history-view": {},
    "@/lib/scan-attempts": { markScanAttemptSaved: async () => {} },
  };
  Object.assign(mocks["@/lib/db"], {
    insertEventHistory: async ({ data }) => {
      h.row.data = data;
      return h.row;
    },
  });
  h.worker = load("src/lib/calendar-sync-background.ts", mocks);
  mocks["@/lib/calendar-sync-background"] = h.worker;
  h.route = load("src/app/api/events/calendar/auto/route.ts", mocks);
  h.history = load("src/app/api/history/route.ts", mocks);
  h.job = {
    eventId: "event",
    userId: "owner",
    email: "owner@example.invalid",
    origin: "https://envitefy.example/",
  };
  return h;
}

test("history returns the saved event without starting or awaiting the provider", async () => {
  const h = harness({ delay: true });
  const response = await h.history.POST(
    new Request("https://envitefy.example/api/history", {
      method: "POST",
      body: JSON.stringify({
        title: "Appointment",
        scanAttemptId: "scan-test",
        data: { createdVia: "ocr" },
      }),
    }),
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.calendarSync.status, "pending");
  assert.equal(h.providerCalls, 0);
  assert.equal(h.jobs.length, 1);
  const work = h.jobs[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.providerCalls, 1);
  h.release();
  await work;
  assert.equal(h.row.data.calendarSync.status, "synced");
});

test("authenticated status reads return immediately and resume pending work after the response", async () => {
  const h = harness({ delay: true });
  const response = await h.route.GET(
    new Request("https://envitefy.example/api/events/calendar/auto?eventId=event"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["provider", "status", "updatedAt"]);
  assert.equal(body.status, "pending");
  assert.equal(h.providerCalls, 0);
  assert.equal(h.jobs.length, 1);
});

test("guests cannot inspect or trigger another owner's calendar sync", async () => {
  for (const [userId, status] of [
    [null, 401],
    ["other", 403],
  ]) {
    const h = harness({ userId });
    assert.equal(
      (
        await h.route.GET(
          new Request("https://envitefy.example/api/events/calendar/auto?eventId=event"),
        )
      ).status,
      status,
    );
    assert.equal(
      (
        await h.route.POST(
          new Request("https://envitefy.example/api/events/calendar/auto", {
            method: "POST",
            body: JSON.stringify({ eventId: "event" }),
          }),
        )
      ).status,
      status,
    );
    assert.equal(h.jobs.length, 0);
    assert.equal(h.writes.length, 0);
    assert.equal(h.providerCalls, 0);
  }
});

test("reloading an already-synced event only reads status without scheduling or sending provider work", async () => {
  const h = harness({ status: "synced" });
  for (let reload = 0; reload < 3; reload++) {
    const response = await h.route.GET(new Request("https://envitefy.example/api/events/calendar/auto?eventId=event"));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "synced");
  }
  assert.equal(h.jobs.length, 0);
  assert.equal(h.providerCalls, 0);
  assert.equal(h.writes.length, 0);
});

test("concurrent workers cannot both send the same event to the calendar", async () => {
  const h = harness({ delay: true });
  const first = h.worker.runSavedCalendarSync(h.job);
  const second = await h.worker.runSavedCalendarSync(h.job);
  assert.equal((await second.json()).status, "syncing");
  assert.equal(h.providerCalls, 1);
  h.release();
  await first;
  assert.equal(h.invalidations.length, 2);
});

test("a crashed worker can be reclaimed, but fresh or completed work is not replayed", async () => {
  const h = harness({ status: "syncing" });
  h.row.data.calendarSync.updatedAt = new Date(Date.now() - 6 * 60_000).toISOString();
  assert.equal((await h.worker.runSavedCalendarSync(h.job)).status, 200);
  assert.equal(h.providerCalls, 1);
  assert.equal(
    (await (await h.worker.runSavedCalendarSync(h.job)).json()).status,
    "already_synced",
  );
  assert.equal(h.providerCalls, 1);
});

test("background failures are saved for the owner without failing event creation", async () => {
  const h = harness({ error: true });
  const result = await (await h.worker.runSavedCalendarSync(h.job)).json();
  assert.equal(result.status, "failed");
  assert.equal(h.row.data.calendarSync.status, "failed");
  assert.equal(h.row.data.calendarSync.reason, "request_failed");
  assert.equal(h.invalidations.length, 2);
});

test("only actual saved scans queue automatic work", () => {
  const h = harness();
  for (const [data, attempt] of [
    [{ createdVia: "manual" }, "scan"],
    [{ createdVia: "ocr", status: "draft" }, "scan"],
    [{ createdVia: "ocr" }, null],
  ]) {
    assert.equal(h.worker.prepareScanCalendarSync(data, attempt), false);
    assert.equal(data.calendarSync, undefined);
  }
  assert.equal(h.worker.prepareScanCalendarSync({ createdVia: "ocr-birthday-skin" }, "scan"), true);
  assert.equal(
    harness({ enabled: false }).worker.prepareScanCalendarSync({ createdVia: "ocr" }, "scan"),
    false,
  );
});
