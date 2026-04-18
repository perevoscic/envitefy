import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio birthday form uses the unified prototype layout with shared field grids", () => {
  const formSource = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const fieldConfigSource = readSource("src/app/studio/studio-workspace-field-config.ts");
  const fieldControlsSource = readSource("src/app/studio/workspace/StudioFieldControls.tsx");

  assert.match(formSource, /const isBirthday = details\.category === "Birthday";/);
  assert.match(formSource, /const sharedPrimaryFields = SHARED_BASICS\.filter/);
  assert.match(formSource, /\["eventDate", "startTime", "location"\]\.includes\(field\.key\)/);
  assert.match(formSource, /STUDIO_COMPACT_CATEGORY_FORM_CONFIG\[details\.category\]/);

  assert.match(fieldConfigSource, /label: "Person's Name"/);
  assert.match(fieldConfigSource, /label: "RSVP"/);
  assert.match(fieldConfigSource, /placeholder: "Phone or Email"/);

  assert.match(fieldControlsSource, /function usesIconInput\(fieldKey: keyof EventDetails\)/);
  assert.match(fieldControlsSource, /return fieldKey === "location" \|\| fieldKey === "eventDate";/);
  assert.match(fieldControlsSource, /type=\{field\.type\}/);
  assert.match(fieldControlsSource, /value=\{String\(value\)\}/);
  assert.doesNotMatch(fieldControlsSource, /normalizeCompactMonthDayInput/);
  assert.doesNotMatch(fieldControlsSource, />\s*mm\/dd\s*</);
});
