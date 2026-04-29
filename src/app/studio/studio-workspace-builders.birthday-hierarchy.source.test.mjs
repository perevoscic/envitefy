import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio builders make birthday name and age the default title anchor", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(source, /function buildBirthdayHeadline\(details: EventDetails\)/);
  assert.match(source, /return `\$\{name\}'s \$\{toOrdinal\(age\)\} Birthday`;/);
  assert.match(source, /return `\$\{name\} Celebrates \$\{age\}`;/);
  assert.match(source, /buildBirthdayHeadline\(details\)/);
  assert.match(source, /export function getStudioThemeLine\(details: EventDetails\)/);
  assert.match(source, /details\.category === "Birthday"/);
  assert.match(source, /sanitizeStudioDesignIdea\(details\.theme\)/);
  assert.match(
    source,
    /pickFirst\(\s*sanitizeStudioDesignIdea\(details\.theme\),\s*details\.activityNote,\s*buildDescription\(details\),\s*details\.category,\s*\)/s,
  );
});
