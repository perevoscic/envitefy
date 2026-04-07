import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("birthday presets resolve a single audience from birthday details", () => {
  const builders = readSource("src/app/studio/studio-workspace-builders.ts");
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(builders, /function inferBirthdayGenderFromName\(nameValue: string\)/);
  assert.match(builders, /function getBirthdayPresetAudience\(details: EventDetails\)/);
  assert.match(builders, /function buildBirthdayAudiencePresets\(/);
  assert.match(builders, /buildBirthdayAudiencePresets\(details\.age, audience, 12\)/);
  assert.match(builders, /return presets\.slice\(0, limit\);/);
  assert.match(workspace, /const nextGender = inferBirthdayGenderFromName\(details\.name\) \|\| "Neutral";/);
  assert.match(
    builders,
    /return audience\s*\?[\s\S]*buildBirthdayAudiencePresets\(details\.age, audience, 12\)[\s\S]*:\s*\[\.\.\.birthdayPresets\.female, \.\.\.birthdayPresets\.male\];/,
  );
});

test("birthday form reads gender from the name field and falls back to a neutral split", () => {
  const fieldConfig = readSource("src/app/studio/studio-workspace-field-config.ts");
  const studioUi = readSource("src/app/studio/StudioWorkspace.tsx");
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const combined = `${studioUi}\n${formStep}`;

  const birthdaySectionMatch = fieldConfig.match(/Birthday:\s*\[([\s\S]*?)\],\s*Wedding:/);

  assert.ok(birthdaySectionMatch, "Expected to find the Birthday field configuration block.");
  const birthdaySection = birthdaySectionMatch[1];

  assert.doesNotMatch(birthdaySection, /label: "Boy \/ Girl \/ Neutral"/);
  assert.match(studioUi, /details\.category === "Birthday" \? buildBirthdayPresets/);
  assert.match(
    readSource("src/app/studio/studio-workspace-builders.ts"),
    /function getBirthdayPresetAudience\(details: EventDetails\)/,
  );
  assert.match(
    readSource("src/app/studio/studio-workspace-builders.ts"),
    /return audience\s*\?[\s\S]*:\s*\[\.\.\.birthdayPresets\.female, \.\.\.birthdayPresets\.male\];/,
  );
  assert.doesNotMatch(combined, /\(\[\{ key: "female" \}, \{ key: "male" \}\] as const\)\.map/);
});
