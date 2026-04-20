import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio prompt date logic only includes event year for weddings", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(source, /function shouldIncludeStudioEventYear\(details: EventDetails\): boolean \{/);
  assert.match(source, /return details\.category === "Wedding";/);
  assert.match(source, /function formatStudioPromptDate\(details: EventDetails\): string \{/);
  assert.match(source, /const rawDate = getStudioEventDate\(details\);/);
  assert.match(source, /if \(shouldIncludeStudioEventYear\(details\)\) return rawDate;/);
  assert.match(source, /const match = rawDate\.match\(\/\^\\d\{4\}-\(\\d\{2\}\)-\(\\d\{2\}\)\$\/\);/);
  assert.match(source, /return `\$\{match\[1\]\}\/\$\{match\[2\]\}`;/);
  assert.match(
    source,
    /eventYear: shouldIncludeStudioEventYear\(details\) \? getStudioEventYear\(details\) \|\| null : null,/,
  );
  assert.match(source, /date: formatStudioPromptDate\(details\) \|\| null,/);
  assert.match(source, /function formatStudioVisibleDate\(details: EventDetails\): string \{/);
  assert.match(source, /if \(shouldIncludeStudioEventYear\(details\)\) \{/);
  assert.match(source, /return formatMonthDayOrdinalEn\(/);
});

test("studio field controls switch non-wedding dates to month/day entry", () => {
  const source = readSource("src/app/studio/workspace/StudioFieldControls.tsx");

  assert.match(source, /function usesIconInput\(fieldKey: keyof EventDetails, renderedInputType: string\) \{/);
  assert.match(source, /renderedInputType === "date"/);
  assert.match(source, /renderedInputType === "time"/);
  assert.match(source, /function usesNativePickerIndicator\(renderedInputType: string\) \{/);
  assert.match(source, /\[&::-webkit-calendar-picker-indicator\]:opacity-0/);
  assert.match(source, /WebkitAppearance: "none", appearance: "none"/);
  assert.match(source, /function isMonthDayOnlyEventDateField/);
  assert.match(
    source,
    /const renderedInputType = isMonthDayOnlyField && !isMobileViewport \? "text" : field\.type;/,
  );
  assert.match(source, /const renderedPlaceholder = isMonthDayOnlyField \? "mm\/dd" : field\.placeholder;/);
  assert.match(source, /function normalizeStudioMonthDayInput/);
  assert.match(source, /function formatStudioMonthDayValue/);
  assert.match(source, /function formatStudioMonthDayPickerValue/);
  assert.match(source, /new Date\(\)\.getFullYear\(\)/);
  assert.match(source, /function openNativePicker\(input: HTMLInputElement\) \{/);
  assert.match(source, /showPicker/);
  assert.match(
    source,
    /renderedInputType === "date"\s*\?\s*formatStudioMonthDayPickerValue\(rawValue\)\s*:\s*formatStudioMonthDayValue\(rawValue\)/,
  );
});

test("studio workspace only requires a full year for wedding event dates", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function isValidMonthDayInput\(value: string\): boolean \{/);
  assert.match(source, /if \(field\.key === "eventDate"\) \{/);
  assert.match(source, /if \(details\.category === "Wedding"\) \{/);
  assert.match(source, /return \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(value\);/);
  assert.match(source, /return \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(value\) \|\| isValidMonthDayInput\(value\);/);
});
