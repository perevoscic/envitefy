import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio prompt includes category-specific and anti-hallucination guardrails", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function buildStudioCategoryGuardrails\(details: EventDetails\)/);
  assert.match(source, /Generate a birthday invitation image\./);
  assert.match(source, /Generate a wedding invitation image\./);
  assert.match(source, /Do not hallucinate people, animals, venue features, decorations, dates, times, logos, outfits, gifts, cakes, rings, balloons, or activities/);
  assert.match(source, /If an important visual detail is missing, keep it generic and restrained instead of inventing specifics\./);
  assert.match(source, /Never fabricate names, phone numbers, addresses, schedules, or event copy\./);
  assert.match(source, /const categoryGuardrails = buildStudioCategoryGuardrails\(details\);/);
  assert.match(
    source,
    /style:\s*\[visualDirection, categoryGuardrails, refinement, studioGuardrails\]\s*\.filter\(Boolean\)\s*\.join\("\. "\)\s*\|\|\s*null/s,
  );
});
