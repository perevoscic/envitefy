import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("meet discovery extracts schedule page images during gymnastics core parse for structural repair", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(
    source,
    /const shouldExtractSchedulePageImages = resolvedOptions\.workflow === "gymnastics";/
  );
  assert.doesNotMatch(
    source,
    /const shouldExtractSchedulePageImages =[\s\S]*resolvedOptions\.mode === "enrich";/
  );
});

test("meet discovery no longer gates visual schedule repair behind enrich mode", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(source, /scheduleImagesForSelectedPages\.length === 0/);
  assert.doesNotMatch(source, /mode !== "enrich"/);
});
