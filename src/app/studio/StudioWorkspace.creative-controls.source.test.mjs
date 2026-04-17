import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio sidebar only shows creative controls for subject-photo flows", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioEditorStep.tsx");

  assert.match(workspace, /const showStudioCreativeControls = hasStudioSubjectReferencePhotos\(details\);/);
  assert.match(editorStep, /Creative Upgrade/);
  assert.match(editorStep, /Likeness Strength/);
  assert.match(editorStep, /Visual Style/);
  assert.match(
    editorStep,
    /subjectTransformMode:\s*"premium_makeover"/,
  );
  assert.match(editorStep, /\{showStudioCreativeControls \? \(/);
  assert.doesNotMatch(editorStep, /Transform Subject/);
});

test("studio preview shows the final live card inline instead of an open-live-card CTA", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioEditorStep.tsx");

  assert.match(editorStep, /<LiveCardHeroTextOverlay invitationData=\{currentProjectWithVisualDraft\.data\} \/>/);
  assert.match(workspace, /const \[currentProjectPreviewTab, setCurrentProjectPreviewTab\] = useState<ActiveTab>\("none"\);/);
  assert.match(editorStep, /<StudioLiveCardActionSurface[\s\S]*activeTab=\{currentProjectPreviewTab\}/);
  assert.match(editorStep, /aspect-\[9\/16\] w-full/);
  assert.doesNotMatch(editorStep, /aspect-\[9\/16\] w-full max-w-\[23rem\]/);
  assert.doesNotMatch(editorStep, /Open Live Card/);
  assert.doesNotMatch(editorStep, /Open current live card/);
});
