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
    /const shouldExtractSchedulePageImages =\s*resolvedOptions\.workflow === "gymnastics" && GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;/
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

test("meet discovery uses json schema output for schedule text parsing", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(source, /json_schema:\s*GYMNASTICS_SCHEDULE_JSON_SCHEMA/);
  assert.doesNotMatch(
    source,
    /callOpenAiScheduleParse[\s\S]*response_format:\s*\{\s*type:\s*"json_object"/
  );
});

test("meet discovery defaults staged structured parsing to gpt-5.4-nano", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(source, /return safeString\(process\.env\.OPENAI_DISCOVERY_PARSE_MODEL\) \|\| "gpt-5\.4-nano";/);
  assert.match(source, /callOpenAiClassification/);
  assert.match(source, /callOpenAiTargetedParse/);
});

test("meet discovery always routes staged parsing through attendee profiles and bypasses schedule derivation", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(
    source,
    /return uniqueBy\(\["overview_core", "parent_public"\], \(item\) => item\)\.slice\(0, 2\);/
  );
  assert.doesNotMatch(source, /return \["athlete_session"/);
  assert.doesNotMatch(source, /return \["registration_coach"/);
  assert.doesNotMatch(source, /const withCoachRouting = routeCoachDeadlines\(mergeCoachFeesFromAdmission\(sanitized\)\);/);
  assert.match(source, /extractionMeta\.schedulePageImages = \[\];/);
  assert.match(source, /extractionMeta\.schedulePageTexts = \[\];/);
});

test("meet discovery only enters structured hotel mode when travelAccommodation exists", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(source, /const firecrawlInPlay = Boolean\(travelAccommodation\);/);
  assert.doesNotMatch(
    source,
    /Boolean\(safeString\(process\.env\.FIRECRAWL_API_KEY\)\) \|\| Boolean\(travelAccommodation\)/,
  );
});

test("meet discovery advances regex scans even when skipping invalid anchors or empty json-ld blocks", () => {
  const source = readSource("src/lib/meet-discovery.ts");

  assert.match(
    source,
    /for \(let match = jsonLdRegex\.exec\(html\); match; match = jsonLdRegex\.exec\(html\)\) \{/
  );
  assert.match(
    source,
    /for \(let match = anchorRegex\.exec\(html\); match; match = anchorRegex\.exec\(html\)\) \{/
  );
  assert.doesNotMatch(source, /while \(match\) \{[\s\S]*if \(!content\) continue;[\s\S]*jsonLdRegex\.exec\(html\);/);
  assert.doesNotMatch(source, /while \(match\) \{[\s\S]*if \(!url\) continue;[\s\S]*anchorRegex\.exec\(html\);/);
});
