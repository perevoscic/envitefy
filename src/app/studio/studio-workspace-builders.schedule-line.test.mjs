import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio builders format visible schedule lines with weekday ordinal copy and no year", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(source, /export function buildDeterministicScheduleLine\(details: EventDetails\)/);
  assert.match(source, /function formatVisibleCardTime\(timeValue: string\): string/);
  assert.match(source, /const twentyFourHourMatch = trimmed\.match/);
  assert.match(source, /return `\$\{hour12\}:\$\{minute\} \$\{hour >= 12 \? "PM" : "AM"\}`;/);
  assert.match(
    source,
    /formatWeekdayMonthDayOrdinalEn\(getStudioEventDate\(details\), \{\s*includeComma: false,\s*\}\)/s,
  );
  assert.match(source, /if \(date && time\) return `\$\{date\} at \$\{time\}`;/);
  assert.doesNotMatch(source, /const date = formatDate\(getStudioEventDate\(details\)\);/);
});

test("studio invitation sanitizing reuses deterministic visible-card schedule line fallback", () => {
  const source = readSource("src/app/studio/studio-workspace-sanitize.ts");

  assert.match(source, /buildDeterministicScheduleLine,/);
  assert.match(
    source,
    /scheduleLine:\s*readString\(value\.scheduleLine\) \|\| buildDeterministicScheduleLine\(fallbackDetails\),/,
  );
});
