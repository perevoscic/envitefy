import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio sidebar only shows creative controls for subject-photo flows", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(workspace, /const showStudioCreativeControls = hasStudioSubjectReferencePhotos\(details\);/);
  assert.match(workspace, /Creative Upgrade/);
  assert.match(workspace, /Likeness Strength/);
  assert.match(workspace, /Visual Style/);
  assert.match(
    workspace,
    /subjectTransformMode:\s*"premium_makeover"/,
  );
  assert.match(workspace, /\{showStudioCreativeControls \? \(/);
  assert.doesNotMatch(workspace, /Transform Subject/);
});

test("studio preview shows the final live card inline instead of an open-live-card CTA", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(workspace, /<LiveCardHeroTextOverlay invitationData=\{currentProjectWithVisualDraft\.data\} \/>/);
  assert.match(workspace, /const \[currentProjectPreviewTab, setCurrentProjectPreviewTab\] = useState<ActiveTab>\("none"\);/);
  assert.match(workspace, /<StudioLiveCardActionSurface[\s\S]*activeTab=\{currentProjectPreviewTab\}/);
  assert.match(workspace, /aspect-\[9\/16\] w-full/);
  assert.doesNotMatch(workspace, /aspect-\[9\/16\] w-full max-w-\[23rem\]/);
  assert.doesNotMatch(workspace, /Open Live Card/);
  assert.doesNotMatch(workspace, /Open current live card/);
});
