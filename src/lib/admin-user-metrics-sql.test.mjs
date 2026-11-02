import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ADMIN_USER_METRICS_CTE_SQL, ADMIN_USERS_PAGE_SQL } from "./admin-user-metrics-sql.ts";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin scan metrics include snap source context rows", () => {
  const source = readSource("src/lib/admin-user-metrics-sql.ts");

  assert.match(source, /in \('upload', 'snap', 'ocr_text'\)/);
  assert.match(source, /max\(case when is_scan then created_at else null end\) as last_scan_created_at/);
});

test("admin user metrics expose last event separately from last scan", () => {
  const source = readSource("src/lib/admin-user-metrics-sql.ts");

  assert.match(source, /max\(created_at\) as last_event_created_at/);
  assert.match(source, /last_event_created_at, last_scan_created_at/);
});

test("admin user metrics do not carry debug link payloads in list responses", () => {
  const source = ADMIN_USER_METRICS_CTE_SQL;

  assert.doesNotMatch(source, /jsonb_agg\(/);
  assert.doesNotMatch(source, /event_debug_links/);
  assert.doesNotMatch(source, /scan_debug_links/);
});

test("admin statistics materialize event facts once and retain ownerless events in global totals", () => {
  assert.match(ADMIN_USER_METRICS_CTE_SQL, /with event_rows as materialized/);
  const eventRows = ADMIN_USER_METRICS_CTE_SQL.split("event_metrics as")[0];
  assert.doesNotMatch(eventRows, /where user_id is not null/);
  assert.match(ADMIN_USER_METRICS_CTE_SQL, /from event_rows\s+where user_id is not null/);
  assert.equal((ADMIN_USERS_PAGE_SQL.match(/from event_history/g) || []).length, 1);
  assert.equal((ADMIN_USERS_PAGE_SQL.match(/data->>'category'/g) || []).length, 1);
  assert.match(ADMIN_USERS_PAGE_SQL, /count\(\*\)::text as total_events/);
  assert.match(ADMIN_USERS_PAGE_SQL, /from event_rows\s+\),\s+user_totals/);
});

test("admin user debug links are loaded through a user-scoped query", () => {
  const source = readSource("src/lib/admin/users.ts");
  const route = readSource("src/app/api/admin/users/[id]/debug-links/route.ts");

  assert.match(source, /getAdminUserDebugLinks/);
  assert.match(source, /where user_id = \$1::uuid/);
  assert.match(source, /limit \$2/);
  assert.match(source, /'publicSlug'/);
  assert.match(source, /'primaryOutput'/);
  assert.match(source, /'sourceContext'->>'type'/);
  assert.match(route, /getAdminUserDebugLinks\(id, kind\)/);
  assert.match(route, /eventLinks: kind === "events"/);
  assert.match(route, /scanLinks: kind === "scans"/);
  assert.match(route, /getAdminUserScanAttemptLinks\(id\)/);
  assert.match(route, /scanAttempts/);
  assert.match(route, /kind must be events or scans/);
});
