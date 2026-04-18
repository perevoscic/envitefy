import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio birthday form uses paired mobile rows for name/age and date/time", () => {
  const formSource = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const fieldConfigSource = readSource("src/app/studio/studio-workspace-field-config.ts");
  const fieldControlsSource = readSource("src/app/studio/workspace/StudioFieldControls.tsx");

  assert.match(formSource, /const isBirthday = details\.category === "Birthday";/);
  assert.match(formSource, /const birthdayMobileTopRowFields = primaryCategoryFields\.filter/);
  assert.match(formSource, /\["name", "age"\]\.includes\(field\.key\)/);
  assert.match(formSource, /const birthdayMobileSecondRowFields = primaryCategoryFields\.filter/);
  assert.match(formSource, /field\.key === "rsvpContact"/);
  assert.match(formSource, /const birthdayMobileDateTimeFields = sharedPrimaryFields\.filter/);
  assert.match(formSource, /\["eventDate", "startTime"\]\.includes\(field\.key\)/);
  assert.match(formSource, /columnsClassName="grid grid-cols-2 gap-x-6 gap-y-8"/);
  assert.match(formSource, /const birthdayMobileLocationFields = sharedPrimaryFields\.filter/);

  assert.match(fieldConfigSource, /label: "Person's Name"/);
  assert.match(fieldConfigSource, /label: "RSVP"/);
  assert.match(fieldConfigSource, /placeholder: "Phone or Email"/);

  assert.match(fieldControlsSource, /function usesCompactDatePlaceholderOverlay\(field: SupportedField, details: EventDetails\)/);
  assert.match(fieldControlsSource, /details\.category !== "Wedding"/);
  assert.match(fieldControlsSource, /function getCompactDatePlaceholderClass\(/);
  assert.match(fieldControlsSource, /\[&::-webkit-datetime-edit-year-field\]:text-transparent/);
  assert.match(fieldControlsSource, />\s*mm\/dd\s*</);
});
