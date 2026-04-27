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
  assert.match(formSource, /const mobileBirthdayLeadFields =/);
  assert.match(formSource, /\["name", "age"\]\.includes\(field\.key\)/);
  assert.match(formSource, /const mobileSharedLeadFields = isMobileViewport/);
  assert.match(formSource, /\["eventDate", "startTime"\]\.includes\(field\.key\)/);
  assert.match(formSource, /grid-cols-\[minmax\(0,1fr\)_6\.5rem\]/);
  assert.match(formSource, /grid-cols-\[minmax\(7\.75rem,1\.12fr\)_minmax\(8\.15rem,0\.94fr\)\] gap-x-4 gap-y-8/);
  assert.match(formSource, /STUDIO_COMPACT_CATEGORY_FORM_CONFIG\[details\.category\]/);
  assert.match(formSource, /isMobileViewport=\{isMobileViewport\}/);

  assert.match(fieldConfigSource, /label: "Person's Name"/);
  assert.match(fieldConfigSource, /label: "RSVP"/);
  assert.match(fieldConfigSource, /placeholder: "Phone or Email"/);
  assert.match(fieldConfigSource, /label: "Gift List Link"[\s\S]*key: "registryLink"/);
  assert.match(
    fieldConfigSource,
    /pickCategoryFields\("Birthday", \["name", "age", "registryLink"\]\)/,
  );
  assert.match(
    fieldConfigSource,
    /pickCategoryFields\("Wedding", \["coupleNames", "eventTitle", "registryLink"\]\)/,
  );
  assert.match(
    fieldConfigSource,
    /pickCategoryFields\("Bridal Shower", \["honoreeNames", "hostedBy", "registryLink"\]\)/,
  );
  assert.match(
    fieldConfigSource,
    /pickCategoryFields\("Housewarming", \["honoreeNames", "registryLink"\]\)/,
  );

  assert.match(
    fieldControlsSource,
    /function usesIconInput\(fieldKey: keyof EventDetails, renderedInputType: string\)/,
  );
  assert.match(fieldControlsSource, /renderedInputType === "date"/);
  assert.match(fieldControlsSource, /renderedInputType === "time"/);
  assert.match(fieldControlsSource, /function usesNativePickerIndicator\(renderedInputType: string\)/);
  assert.match(fieldControlsSource, /\[&::-webkit-calendar-picker-indicator\]:opacity-0/);
  assert.match(fieldControlsSource, /WebkitAppearance: "none", appearance: "none"/);
  assert.match(fieldControlsSource, /function isMonthDayOnlyEventDateField/);
  assert.match(
    fieldControlsSource,
    /const renderedInputType = isMonthDayOnlyField && !isMobileViewport \? "text" : field\.type;/,
  );
  assert.match(fieldControlsSource, /const renderedPlaceholder = isMonthDayOnlyField \? "mm\/dd" : field\.placeholder;/);
  assert.match(fieldControlsSource, /function normalizeStudioMonthDayInput/);
  assert.match(fieldControlsSource, /function formatStudioMonthDayValue/);
  assert.match(fieldControlsSource, /function fieldWidthClass\(field: SupportedField, isMobileViewport: boolean\)/);
  assert.match(fieldControlsSource, /function mobileCompactFieldTextClass\(/);
  assert.match(fieldControlsSource, /field\.key === "eventDate"/);
  assert.match(fieldControlsSource, /field\.key === "startTime"/);
  assert.match(fieldControlsSource, /isMobileViewport\s*\?\s*"right-0"\s*:\s*"right-3"/);
  assert.match(fieldControlsSource, /isMobileViewport \? "max-w-\[7\.85rem\] sm:max-w-\[7rem\]" : "max-w-\[6\.6rem\] sm:max-w-\[7rem\]"/);
  assert.match(fieldControlsSource, /isMobileViewport \? "max-w-\[8\.3rem\] sm:max-w-\[9rem\]" : "max-w-\[8\.6rem\] sm:max-w-\[9rem\]"/);
  assert.match(fieldControlsSource, /text-\[1\.4rem\] sm:text-2xl/);
  assert.match(fieldControlsSource, /text-\[1\.32rem\] tracking-\[-0\.01em\] sm:text-2xl sm:tracking-normal/);
  assert.match(fieldControlsSource, /function formatStudioMonthDayPickerValue/);
  assert.match(fieldControlsSource, /function openNativePicker\(input: HTMLInputElement\)/);
  assert.match(fieldControlsSource, /showPicker/);
});
