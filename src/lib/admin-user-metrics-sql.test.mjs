import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

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

test("admin user metrics include capped debug event links for research", () => {
  const source = readSource("src/lib/admin-user-metrics-sql.ts");

  assert.match(source, /jsonb_agg\(/);
  assert.match(source, /'publicSlug'/);
  assert.match(source, /'primaryOutput'/);
  assert.match(source, /filter \(where event_rank <= 20\)/);
  assert.match(source, /event_debug_links/);
});

test("admin user metrics include capped scan debug links for saved scan rows", () => {
  const source = readSource("src/lib/admin-user-metrics-sql.ts");

  assert.match(source, /'createdVia'/);
  assert.match(source, /'sourceType'/);
  assert.match(source, /filter \(where is_scan and scan_rank <= 20\)/);
  assert.match(source, /scan_debug_links/);
});
