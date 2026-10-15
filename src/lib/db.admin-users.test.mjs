import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { ADMIN_USER_METRICS_CTE_SQL, ADMIN_USER_METRICS_SELECT_SQL } from "./admin-user-metrics-sql.ts";

const source = ts.createSourceFile("db.ts", readFileSync(new URL("./db.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const lookup = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "getAdminUsersPageData");
assert.ok(lookup);
const { outputText } = ts.transpileModule(lookup.getText(source), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

function harness(items) {
  const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, Buffer,
    ADMIN_USER_METRICS_CTE_SQL, ADMIN_USER_METRICS_SELECT_SQL,
    async ensureUsersHasAdminAndMetricsColumns() {},
    async query(sql) {
      calls.push(sql);
      if (sql.includes("as initial_users")) return { rows: [{ scans_total: "9", initial_users: items }] };
      if (sql.includes("as events_birthdays")) return { rows: [{ events_birthdays: "4" }] };
      return { rows: [{ n: "101" }] };
    },
  });
  return { load: module.exports.getAdminUsersPageData, calls };
}

test("overview and initial users reuse one metrics query and cap the directory page", async () => {
  const items = Array.from({ length: 101 }, (_, index) => ({
    id: `user-${index}`, email: `user-${index}@example.test`, created_at: "2026-10-01T12:00:00+00:00",
  }));
  const h = harness(items);
  const data = await h.load();
  assert.equal(data.overview.totalUsers, 101);
  assert.equal(data.overview.totalScans, 9);
  assert.equal(data.overview.eventsByCategory.scans_birthdays, 4);
  assert.deepEqual(Array.from(data.users.items), items.slice(0, 100));
  assert.deepEqual(JSON.parse(Buffer.from(data.users.nextCursor, "base64").toString("utf8")), {
    created_at: items[99].created_at, id: items[99].id,
  });
  assert.equal(h.calls.length, 5);
  assert.equal(h.calls.filter((sql) => sql.includes("with event_metrics as")).length, 1);
  assert.match(h.calls.find((sql) => sql.includes("as initial_users")), /order by created_at desc nulls last, id desc\s+limit 101/);
});

for (const items of [[], [{ id: "only-user", email: "only@example.test", created_at: null }]]) {
  test(`a complete directory of ${items.length} users has no next cursor`, async () => {
    const data = await harness(items).load();
    assert.deepEqual(Array.from(data.users.items), items);
    assert.equal(data.users.nextCursor, null);
  });
}
