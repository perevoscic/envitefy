import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("sitemap appends published public event pages without indexing restricted signups", () => {
  const sitemap = readSource("src/app/sitemap.ts");
  const db = readSource("src/lib/db.ts");

  assert.match(sitemap, /export const runtime = "nodejs"/);
  assert.match(sitemap, /export const dynamic = "force-dynamic"/);
  assert.match(sitemap, /listPublicEventSitemapRows/);
  assert.match(sitemap, /export default async function sitemap/);
  assert.match(sitemap, /buildEventProductPath/);
  assert.match(sitemap, /path\.startsWith\("\/smart-signup-form\/"\)/);
  assert.match(sitemap, /dedupeSitemapEntries/);

  assert.match(db, /export async function listPublicEventSitemapRows/);
  assert.match(db, /lower\(coalesce\(\$\{dataSql\}->>'status', ''\)\) = 'published'/);
  assert.match(db, /accessControl,requirePasscode/);
  assert.match(db, /accessControl,passcodeHash/);
  assert.match(db, /jsonb_strip_nulls\(jsonb_build_object/);
});
