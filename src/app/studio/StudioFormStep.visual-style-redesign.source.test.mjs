import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio details step uses a visual-style picker and single live-card CTA", () => {
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const phonePane = readSource("src/app/studio/workspace/StudioPhonePreviewPane.tsx");

  assert.match(formStep, /const \[showStylePicker, setShowStylePicker\] = useState\(false\);/);
  assert.match(formStep, /getStudioImageFinishPresets\(details\.category\)/);
  assert.match(formStep, /resolveStudioImageFinishPreset\(/);
  assert.match(formStep, /CHOOSE A STYLE \(OPTIONAL\)/);
  assert.match(formStep, /Select Style/);
  assert.match(formStep, /generateMedia\("page"\)/);
  assert.match(formStep, /Preview Live Card/);
  assert.match(formStep, /lg:w-3\/5 lg:flex-none lg:border-r lg:border-\[#eff3f8\]/);
  assert.match(formStep, /flex w-2\/5 shrink-0 flex-col bg-\[#121a34\]/);
  assert.doesNotMatch(formStep, /Generate Image/);
  assert.doesNotMatch(formStep, />\s*Draft\s*</);
  assert.doesNotMatch(formStep, />\s*Publish\s*</);

  assert.match(phonePane, /saveCurrentProjectToLibrary: \(\) => void;/);
  assert.match(phonePane, /absolute right-3 top-5 z-20 inline-flex/);
  assert.match(phonePane, /\{currentProjectSaveLabel\}/);
});
