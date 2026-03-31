import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("gymnastics launcher renders authenticated technical details for failed discovery polls", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /createDiscoveryStatusClientError\(statusJson, "Meet discovery failed\."\)/);
  assert.match(source, /status === "authenticated" && error\.technicalDetails/);
  assert.match(source, /<details className=/);
  assert.match(source, /Technical details/);
  assert.match(source, /Copy technical details/);
});
