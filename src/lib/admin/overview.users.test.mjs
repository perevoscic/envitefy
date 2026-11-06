import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");
const databaseErrors = loadTs("src/lib/database-errors.ts");

function harness({ optionalTables = true } = {}) {
  const calls = [];
  const overview = loadTs("src/lib/admin/overview.ts", {
    "@/lib/db": {
      ...databaseErrors,
      async query(sql, values = []) {
        calls.push(sql);
        assert.doesNotMatch(sql, /\b(?:from|join)\s+(?:public\.)?users\b/i);
        if (sql.includes("to_regclass")) return { rows: [{ exists: optionalTables ? values[0] : null }] };
        if (sql.includes("from email_campaigns") && sql.includes("as failed")) return { rows: [{ total: "4", failed: "0" }] };
        if (sql.includes("as current_count")) return { rows: [{ current_count: "3", previous_count: "2" }] };
        if (sql.includes("select type, label, detail, occurred_at")) {
          return { rows: [{ type: "event", label: "Birthday", detail: "birthdays", occurred_at: "2026-11-01T12:00:00Z" }] };
        }
        if (/^\s*select count\(\*\)::text as n from event_history where\s+\(/.test(sql)) {
          return { rows: [{ n: "42" }] };
        }
        if (sql.includes("::text as n")) return { rows: [{ n: "11" }] };
        return { rows: [] };
      },
    },
    "./analytics": {
      getAdminGa4Status: () => ({ connected: true }),
      getAdminAnalyticsOverviewSnapshot: async () => ({
        ga4: { connected: true }, ga4Report: { status: "available" }, trackingGaps: [],
      }),
    },
  });
  return { load: overview.getAdminOverviewData, calls };
}

for (const optionalTables of [true, false]) {
  test(`dashboard loads event statistics without user queries (optional tables: ${optionalTables})`, async () => {
    const h = harness({ optionalTables });
    const overview = await h.load();
    assert.ok(h.calls.length > 0);
    assert.equal(overview.kpis.events, 11);
    assert.equal(overview.kpis.scans, 42);
    assert.equal(overview.kpis.emailCampaigns, optionalTables ? 4 : 0);
    assert.equal(Object.hasOwn(overview, "users"), false);
    assert.equal(Object.hasOwn(overview.kpis, "users"), false);
    assert.deepEqual(overview.funnel.map((item) => item.label), ["Events", "Public events", "Shares", "RSVPs"]);
    assert.deepEqual(overview.growthInsights.map((item) => item.label), ["Events created", "Scans saved", "RSVP responses"]);
    assert.equal(overview.recentActivity[0].type, "event");
    assert.equal(overview.needsAttention.some((item) => item.tone === "danger"), false);
  });
}
