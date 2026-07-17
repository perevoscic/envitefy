import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("OcrFactCards coalesces host fragments and avoids 2-col for short pairs", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src/components/OcrFactCards.tsx"), "utf8");

  assert.match(source, /coalesceFactValues/);
  assert.match(source, /fact\.values\.length >= 3 && fact\.values\.every/);
  assert.match(source, /grid grid-cols-2 gap-x-4 gap-y-2/);
  assert.match(source, /space-y-2/);
});
