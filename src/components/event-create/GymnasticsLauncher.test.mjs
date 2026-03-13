import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("gymnastics launcher switches fake parse progress to indeterminate processing after 90 percent", () => {
  const source = readSource("src/components/event-create/GymnasticsLauncher.tsx");

  assert.match(source, /const PROCESSING_PROGRESS_CAP = 90;/);
  assert.match(source, /parseProgress = Math\.min\(parseProgress \+ 3, PROCESSING_PROGRESS_CAP\)/);
  assert.match(source, /"Processing\.\.\."/);
  assert.match(source, /uploadIndeterminate/);
  assert.match(source, /launcher-indeterminate-bar/);
  assert.doesNotMatch(source, /\b96\b/);
});
