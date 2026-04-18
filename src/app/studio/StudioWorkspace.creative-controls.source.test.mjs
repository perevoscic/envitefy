import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio sidebar only shows creative controls for subject-photo flows", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");

  assert.match(workspace, /const showStudioCreativeControls = hasStudioSubjectReferencePhotos\(details\);/);
  assert.match(formStep, /Creative Upgrade/);
  assert.match(formStep, /Likeness Strength/);
  assert.match(formStep, /Visual Style/);
  assert.match(
    formStep,
    /subjectTransformMode:\s*"premium_makeover"/,
  );
  assert.match(formStep, /\{showStudioCreativeControls \? \(/);
  assert.doesNotMatch(formStep, /Transform Subject/);
});

test("studio preview shows the final live card inline instead of an open-live-card CTA", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const phonePane = readSource("src/app/studio/workspace/StudioPhonePreviewPane.tsx");

  assert.match(phonePane, /<LiveCardHeroTextOverlay\s+invitationData=\{currentProjectWithVisualDraft\.data\}/);
  assert.match(workspace, /const \[currentProjectPreviewTab, setCurrentProjectPreviewTab\] = useState<ActiveTab>\("none"\);/);
  assert.match(phonePane, /<StudioLiveCardActionSurface[\s\S]*activeTab=\{currentProjectPreviewTab\}/);
  assert.match(phonePane, /aspect-\[9\/16\]/);
  assert.doesNotMatch(phonePane, /Open Live Card/);
  assert.doesNotMatch(phonePane, /Open current live card/);
});
