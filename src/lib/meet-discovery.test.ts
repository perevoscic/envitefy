import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("meet discovery classifier contract no longer includes session-heavy routing", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(
    source,
    /type ParseContentMix = \{\s*registrationHeavy: boolean;\s*parentPacketHeavy: boolean;\s*mixed: boolean;\s*\};/,
  );
  assert.match(
    source,
    /const documentProfile =\s*value\.documentProfile === "parent_packet" \|\|[\s\S]*"registration_packet" \|\|[\s\S]*"meet_overview"/,
  );
  assert.match(
    source,
    /const signalBuckets = \[registrationHeavy, parentPacketHeavy\]\.filter\(Boolean\)\.length;/,
  );
});

test("meet discovery targeted parse routing only uses overview and parent-public prompts", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(
    source,
    /const profileEvidenceByType: Record<ParsePromptProfile, Record<string, unknown>> = \{\s*overview_core:[\s\S]*parent_public:/,
  );
  assert.doesNotMatch(source, /const profileEvidenceByType[\s\S]*registration_coach:/);
  assert.doesNotMatch(source, /const profileEvidenceByType[\s\S]*athlete_session:/);
  assert.match(
    source,
    /const focusByProfile: Record<ParsePromptProfile, string\[]> = \{\s*overview_core:[\s\S]*parent_public:/,
  );
});

test("meet discovery public artifact filtering no longer treats session_ops as a special audience", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");
  const publicContentSource = readSource(
    "src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts",
  );

  assert.doesNotMatch(source, /"session_ops"/);
  assert.doesNotMatch(publicContentSource, /"session_ops"/);
  assert.match(source, /if \(audience === "coach_ops"\) \{/);
  assert.match(publicContentSource, /if \(audience === "coach_ops"\) \{/);
});

test("mapParseResultToGymData stops emitting schedule and session-derived fields", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.doesNotMatch(source, /sessionNumber:\s*usePublicPageV2/);
  assert.doesNotMatch(source, /sessionWindows:\s*usePublicPageV2/);
  assert.doesNotMatch(source, /schedule:\s*\(\(\) => \{/);
  assert.doesNotMatch(source, /athlete\.session/);
});

test("__testUtils no longer exports schedule-session helpers", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(source, /export const __testUtils = \{/);
  assert.doesNotMatch(source, /export const __testUtils = \{[\s\S]*deriveScheduleFromExtractedText/);
  assert.doesNotMatch(source, /export const __testUtils = \{[\s\S]*mergeScheduleWithFallback/);
  assert.doesNotMatch(source, /export const __testUtils = \{[\s\S]*classifySchedulePageText/);
  assert.doesNotMatch(source, /export const __testUtils = \{[\s\S]*isStaleDerivedSchedule/);
});

test("meet discovery targeted parse calls run concurrently with deterministic merge order", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(source, /const targetedParseResults = await Promise\.all\(/);
  assert.match(source, /const selectedEvidenceCache = buildSelectedParseEvidenceCache\(/);
  assert.match(
    source,
    /const extractedResults = targetedParseResults[\s\S]*mergeParseResultsByProfile\(extractedResults\)/,
  );
});

test("gymnastics PDF vision handoff persists raster images before OpenAI calls", () => {
  const source = readSource("src/lib/meet-discovery/core.ts");

  assert.match(source, /async function persistVisionInputDebugArtifact\(/);
  assert.match(source, /path\.join\(process\.cwd\(\), "qa-artifacts", "discovery-ai-inputs"\)/);
  assert.match(source, /const GYM_LAYOUT_PDF_MAX_PAGES = 10;/);
  assert.match(source, /stage:\s*"pdf-raster-page"/);
  assert.match(source, /const image = await rasterizePdfPageToPng\(pdfBuffer, pageIndex\);/);
  assert.match(source, /await persistVisionInputDebugArtifact\(buffer,\s*\{/);
  assert.match(source, /stage:\s*"pdf-ocr-page"/);
  assert.match(source, /stage:\s*"pdf-layout-ocr-page"/);
  assert.match(source, /stage:\s*"pdf-layout-page"/);
  assert.match(source, /stage:\s*"pdf-layout-zones"/);
});
