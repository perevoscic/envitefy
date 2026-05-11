import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin user table shows the last event date instead of scan-only activity", () => {
  const source = readSource("src/app/admin/page.tsx");

  assert.match(source, /Last event/);
  assert.match(source, /formatDate\(u\.last_event_created_at, \{ forceUsNumeric: true \}\)/);
});

test("admin event breakdown popup exposes development event URLs", () => {
  const source = readSource("src/app/admin/page.tsx");

  assert.match(source, /import \{ buildEventProductPath \} from "@\/utils\/event-product-route";/);
  assert.match(source, /eventLinks=\{eventLinks\}/);
  assert.match(source, /eventLinks=\{scanLinks\}/);
  assert.match(source, /Dev event URLs/);
  assert.match(source, /Dev scan URLs/);
  assert.match(source, /No saved scan URLs yet/);
  assert.match(source, /getUserEventDebugLinks/);
  assert.match(source, /getUserScanDebugLinks/);
  assert.match(source, /source\?\.\[key\]/);
  assert.match(source, /buildAdminEventDebugHref/);
});
