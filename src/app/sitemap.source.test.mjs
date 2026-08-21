import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("sitemap excludes user-created event and signup URLs", () => {
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(sitemap, /export default function sitemap/);
  assert.match(sitemap, /dedupeSitemapEntries/);
  assert.doesNotMatch(sitemap, /listPublicEventSitemapRows/);
  assert.doesNotMatch(sitemap, /buildEventProductPath/);
  assert.doesNotMatch(sitemap, /\/card\//);
  assert.doesNotMatch(sitemap, /\/event\//);
  assert.doesNotMatch(sitemap, /\/smart-signup-form\//);
});
