import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("birthday form still infers gender from the name field without a gender toggle", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const fieldConfig = readSource("src/app/studio/studio-workspace-field-config.ts");

  assert.match(
    workspace,
    /const nextGender = inferBirthdayGenderFromName\(details\.name\) \|\| "Neutral";/,
  );
  const birthdaySectionMatch = fieldConfig.match(/Birthday:\s*\[([\s\S]*?)\],\s*Wedding:/);
  assert.ok(birthdaySectionMatch, "Expected to find the Birthday field configuration block.");
  assert.doesNotMatch(birthdaySectionMatch[1], /label: "Boy \/ Girl \/ Neutral"/);
});

test("studio theme controls are manual-input-only with no preset chooser or preset fallback art", () => {
  const studioUi = readSource("src/app/studio/StudioWorkspace.tsx");
  const builders = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(studioUi, /Invitation Prompt/);
  assert.match(studioUi, /Invitation Idea/);
  assert.match(
    studioUi,
    /Describe your invitation in your own words\. We&apos;ll generate it for you\./,
  );
  assert.doesNotMatch(studioUi, /Visual direction/);
  assert.doesNotMatch(studioUi, /\bPresets\b/);
  assert.doesNotMatch(studioUi, /buildBirthdayPresets/);
  assert.doesNotMatch(studioUi, /getPresetsForDetails/);
  assert.doesNotMatch(builders, /getPresetsForDetails\(details\)\.find/);
  assert.doesNotMatch(builders, /generic preset, category, or celebration styling/);
  assert.match(
    builders,
    /return svgThumbnail\(getDisplayTitle\(details\), "#111827", "#7c3aed"\);/,
  );
});
