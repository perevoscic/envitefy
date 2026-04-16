import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
  assert.match(source, /pickFirst\(details\.theme, details\.activityNote, buildDescription\(details\), details\.category\)/);
});
