import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("meet discovery no longer exposes schedule or session fields in the active parse contract", () => {
  const facade = readSource("src/lib/meet-discovery.ts");
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(facade, /from "@\/lib\/meet-discovery\/extract"/);
  assert.match(facade, /from "@\/lib\/meet-discovery\/parse"/);
  assert.match(facade, /from "@\/lib\/meet-discovery\/map"/);
  assert.doesNotMatch(facade, /schedulePageImages/);
  assert.doesNotMatch(facade, /schedulePageTexts/);
  assert.doesNotMatch(source, /schedulePageImages/);
  assert.doesNotMatch(source, /schedulePageTexts/);
  assert.doesNotMatch(source, /scheduleDiagnostics/);
  assert.doesNotMatch(source, /session:\s*string \| null;/);
  assert.doesNotMatch(source, /session:\s*jsonNullable\(JSON_STRING\)/);
  assert.doesNotMatch(source, /schedule:\s*GYMNASTICS_SCHEDULE_SCHEMA/);
});

test("meet discovery removes schedule-session prompt profiles and schedule-grid compatibility branches", () => {
  const facade = readSource("src/lib/meet-discovery.ts");
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(facade, /from "@\/lib\/meet-discovery\/parse"/);
  assert.match(
    source,
    /type ParsePromptProfile =\s*\|\s*"overview_core"\s*\|\s*"parent_public";/,
  );
  assert.doesNotMatch(source, /GYM_DISCOVERY_SCHEDULE_GRID_ENABLED/);
  assert.doesNotMatch(source, /stripGymScheduleGridsFromParseResult/);
});

test("meet discovery removes schedule-grid compatibility surfaces from the active source file", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.doesNotMatch(source, /export const GYM_DISCOVERY_SCHEDULE_GRID_ENABLED/);
});

test("meet discovery classifier and schema only model the surviving attendee-first flow", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(source, /contentMix:\s*jsonObject\(\{\s*registrationHeavy: JSON_BOOLEAN,/);
  assert.match(
    source,
    /enum: \["parent_packet", "registration_packet", "meet_overview", "unknown"\]/,
  );
  assert.match(
    source,
    /return uniqueBy\(\["overview_core", "parent_public"\], \(item\) => item\)\.slice\(0, 2\);/,
  );
});

test("meet discovery defaults staged structured parsing to gpt-5.4-nano", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(
    source,
    /return safeString\(process\.env\.OPENAI_DISCOVERY_PARSE_MODEL\) \|\| "gpt-5\.4-nano";/,
  );
  assert.match(source, /callOpenAiClassification/);
  assert.match(source, /callOpenAiTargetedParse/);
});
