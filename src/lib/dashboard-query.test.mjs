import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as dashboardData from "./dashboard-data.ts";

function loadQuery(db) {
  const source = readFileSync(new URL("./dashboard-query.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (name) => {
      if (name === "@/lib/dashboard-data") return dashboardData;
      if (name === "@/lib/db") return db;
      throw new Error(`Unexpected dependency: ${name}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}

const eventRow = (id, startAt, data = {}) => ({
  id,
  title: id,
  created_at: "2026-01-01T00:00:00.000Z",
  data: { startAt, ...data },
});

test("dashboard chooses the nearest event and sorts the rest across ownership types", () => {
  const { buildDashboardCollections } = loadQuery({});
  const rows = [
    eventRow("birthday-next-year", "2027-04-19T18:00:00Z"),
    eventRow("wedding", "2026-09-25T12:00:00Z"),
    eventRow("nearest-invite", "2026-09-19T00:00:00Z", { ownership: "invited" }),
    eventRow("past", "2026-09-01T00:00:00Z"),
    eventRow("canceled", "2026-09-06T00:00:00Z", { status: "canceled" }),
    eventRow("archived", "2026-09-07T00:00:00Z", { status: "archived" }),
  ];
  const result = buildDashboardCollections(
    rows.map(dashboardData.toDashboardEvent),
    Date.parse("2026-09-05T00:00:00Z"),
  );
  assert.equal(result.nextEvent.id, "nearest-invite");
  assert.deepEqual(result.upcoming.map((event) => event.id), [
    "nearest-invite", "wedding", "birthday-next-year",
  ]);
});

test("dashboard reads the requested event window once even for accounts with only owned events", async () => {
  let calls = 0;
  const { listDashboardEventsForUser } = loadQuery({
    listDashboardHistoryWindowForUser: async (userId, limit) => {
      calls += 1;
      assert.equal(userId, "owner");
      assert.equal(limit, 120);
      return Array.from({ length: 120 }, (_, index) =>
        eventRow(`event-${index}`, "2030-09-19T00:00:00Z"),
      );
    },
    listDashboardHistoryFallbackForUser: async () => {
      assert.fail("a date-ordered result does not need another read to search for invites");
    },
  });
  const result = await listDashboardEventsForUser("owner", 120);
  assert.equal(calls, 1);
  assert.equal(result.events.length, 120);
  assert.equal(result.diagnostics.fallbackUsed, false);
});

test("active agenda keeps ongoing events and excludes drafts and declined invitations from counts", () => {
  const { buildDashboardCollections } = loadQuery({});
  const rows = [
    eventRow("ongoing", "2030-01-01T11:00:00Z", { endAt: "2030-01-01T13:00:00Z" }),
    eventRow("draft", "2030-01-02T12:00:00Z", { status: "draft" }),
    eventRow("declined", "2030-01-02T12:00:00Z", { ownership: "invited" }),
  ].map(dashboardData.toDashboardEvent);
  rows[2].userRsvpResponse = "no";
  const result = buildDashboardCollections(rows, Date.parse("2030-01-01T12:00:00Z"));
  assert.equal(result.nextEvent.id, "ongoing");
  assert.equal(result.upcomingIn7DaysCount, 1);
  assert.equal(result.allDrafts.length, 1);
});

test("dashboard retries a statement timeout and returns the recovered events", async () => {
  const { listDashboardEventsForUser } = loadQuery({
    listDashboardHistoryWindowForUser: async () => {
      throw Object.assign(new Error("statement timeout"), { code: "57014" });
    },
    listDashboardHistoryFallbackForUser: async () => [eventRow("recovered", "2030-09-19T00:00:00Z")],
  });
  const result = await listDashboardEventsForUser("owner", 120);
  assert.equal(result.events[0].id, "recovered");
  assert.equal(result.diagnostics.fallbackReason, "statement-timeout");
});

test("dashboard SQL sorts the full owned history before limiting candidates", () => {
  const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
  const query = source.slice(
    source.indexOf("function buildDashboardFastHistoryQuery("),
    source.indexOf("function buildSidebarFastHistoryQuery("),
  );
  const candidateQueries = [...query.matchAll(/own_candidates as \(([\s\S]*?)\),/g)];
  assert.equal(candidateQueries.length, 2, "both shared and own-only paths are covered");
  for (const [, candidates] of candidateQueries) {
    assert.match(candidates, /where eh\.user_id = \$1/);
    assert.doesNotMatch(candidates, /limit \$2/);
  }
  assert.match(query, /order by \$\{buildFastHistoryOrderBySql\("own_rows"\)\}\s+limit \$2/);
  assert.match(query, /order by \$\{buildFastHistoryOrderBySql\("combined"\)\}\s+limit \$2/);
});
