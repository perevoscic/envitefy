import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("service worker controller changes do not hard reload the app shell", () => {
  const source = readSource("src/app/providers.tsx");

  assert.match(source, /function RegisterServiceWorker\(\)/);
  assert.match(source, /navigator\.serviceWorker\.register\("\/sw\.js"/);
  assert.match(source, /nav\.addEventListener\("controllerchange", onControllerChange\)/);
  assert.match(source, /controller change detected; keeping current page/);
  assert.doesNotMatch(source, /window\.location\.reload\(\)/);
  assert.doesNotMatch(source, /__snap_sw_reloaded__/);
});
