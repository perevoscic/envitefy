import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("birthday presets resolve a single audience from birthday details", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function inferBirthdayGenderFromName\(nameValue: string\)/);
  assert.match(source, /function getBirthdayPresetAudience\(details: EventDetails\)/);
  assert.match(source, /function buildBirthdayAudiencePresets\(/);
  assert.match(source, /inferBirthdayGenderFromName\(details\.name\)/);
  assert.match(source, /buildBirthdayAudiencePresets\(details\.age, audience, 12\)/);
  assert.match(source, /return presets\.slice\(0, limit\);/);
  assert.match(source, /const nextGender = inferBirthdayGenderFromName\(details\.name\) \|\| "Neutral";/);
  assert.match(
    source,
    /return audience\s*\?\s*buildBirthdayAudiencePresets\(details\.age, audience, 12\)\s*:\s*\[\.\.\.birthdayPresets\.female, \.\.\.birthdayPresets\.male\];/,
  );
});

test("birthday form reads gender from the name field and falls back to a neutral split", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");
  const birthdaySectionMatch = source.match(/Birthday:\s*\[([\s\S]*?)\],\s*Wedding:/);

  assert.ok(birthdaySectionMatch, "Expected to find the Birthday field configuration block.");
  const birthdaySection = birthdaySectionMatch[1];

  assert.doesNotMatch(birthdaySection, /label: "Boy \/ Girl \/ Neutral"/);
  assert.match(source, /Showing 12/);
  assert.match(source, /birthdayPresetAudience === "female" \? "girl" : "boy"/);
  assert.match(
    source,
    /return audience[\s\S]*:\s*\[\.\.\.birthdayPresets\.female, \.\.\.birthdayPresets\.male\];/,
  );
  assert.doesNotMatch(source, /\(\[\{ key: "female" \}, \{ key: "male" \}\] as const\)\.map/);
});
