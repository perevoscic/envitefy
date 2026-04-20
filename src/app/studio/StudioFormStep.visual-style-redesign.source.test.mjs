import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio details step uses a visual-style picker and single live-card CTA", () => {
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const phonePane = readSource("src/app/studio/workspace/StudioPhonePreviewPane.tsx");

  assert.match(formStep, /const \[showStylePicker, setShowStylePicker\] = useState\(false\);/);
  assert.match(formStep, /getStudioImageFinishPresets\(details\.category\)/);
  assert.match(formStep, /resolveStudioImageFinishPreset\(/);
  assert.match(formStep, /CHOOSE A STYLE \(OPTIONAL\)/);
  assert.match(formStep, /Select Style/);
  assert.match(formStep, /generateMedia\("page"\)/);
  assert.match(formStep, /Preview Live Card/);
  assert.doesNotMatch(formStep, /Generate Image/);
  assert.doesNotMatch(formStep, />\s*Draft\s*</);
  assert.doesNotMatch(formStep, />\s*Publish\s*</);

  assert.match(workspace, /function saveCurrentProjectAsImageToLibrary\(\)/);
  assert.match(phonePane, /saveCurrentProjectAsImageToLibrary: \(\) => void;/);
  assert.match(phonePane, /currentProjectSaveImageLabel: string;/);
  assert.match(phonePane, /\{currentProjectSaveImageLabel\}/);
});
