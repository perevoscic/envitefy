import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio workspace does not force type step when URL has no step param", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /const stepParam = searchParams\.get\("step"\);/);
  assert.match(source, /const nextCreateStep = stepParam \? parseStudioCreateStep\(stepParam\) : null;/);
  assert.match(source, /if \(nextView === "create" && nextCreateStep\) \{/);
});
