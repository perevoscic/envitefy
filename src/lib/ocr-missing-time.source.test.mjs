import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("OCR pipeline marks whether a visible time was found", () => {
  const source = readSource("src/lib/ocr/pipeline.ts");

  assert.match(source, /function hasExplicitTimeText\(text: string\): boolean/);
  assert.match(source, /const rawHasExplicitTime = hasExplicitTimeText\(raw\);/);
  assert.match(source, /let parsedHadExplicitTime = false;/);
  assert.match(source, /timeFound: rawHasExplicitTime \|\| parsedHadExplicitTime/);
});

test("OCR history save preserves missing-time metadata and avoids inferred ends", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /timeFound\?: boolean \| null;/);
  assert.match(source, /const hasExplicitTime = input\.timeFound !== false;/);
  assert.match(source, /timeFound: eventInput\.timeFound/);
});

test("public OCR event pages hide inferred midnight start times", () => {
  const source = readSource("src/app/event/[id]/page.tsx");

  assert.match(source, /const shouldHideMissingOcrStartTime = \(/);
  assert.match(source, /payload\.timeFound === false/);
  assert.match(source, /isMidnightDateTime\(startInput, timeZone \|\| null\)/);
  assert.match(source, /hideTime: hideMissingOcrStartTime/);
  assert.match(source, /const calendarAllDay = Boolean\(data\?\.allDay\) \|\| hideMissingOcrStartTime;/);
});
