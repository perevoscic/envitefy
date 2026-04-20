import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio create-step transitions route through workspace navigation helpers", () => {
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const categoryStep = readSource("src/app/studio/workspace/StudioCategoryStep.tsx");
  const formStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const previewStep = readSource("src/app/studio/workspace/StudioMobilePreviewStep.tsx");
  const ideaComposer = readSource("src/app/studio/workspace/StudioIdeaComposer.tsx");

  assert.match(workspace, /function handleCategorySelect\(category: InviteCategory\) \{/);
  assert.match(workspace, /setDetails\(\(prev\) => \(\{\s*\.\.\.prev,\s*category,\s*\}\)\);/);
  assert.match(workspace, /navigateWorkspace\("create", "details"\);/);
  assert.match(workspace, /onSelectCategory=\{handleCategorySelect\}/);
  assert.match(workspace, /onOpenDetailsStep=\{openDetailsStep\}/);
  assert.match(workspace, /function openIdeaComposer\(\)/);
  assert.match(workspace, /function openEventDetailsFromIdeaComposer\(\)/);
  assert.match(workspace, /onOpenEventDetails=\{openEventDetailsFromIdeaComposer\}/);
  assert.doesNotMatch(workspace, /setCreateStep=\{setCreateStep\}/);

  assert.match(categoryStep, /onSelectCategory: \(category: InviteCategory\) => void;/);
  assert.match(categoryStep, /onSelect=\{onSelectCategory\}/);
  assert.doesNotMatch(categoryStep, /setDetails=/);
  assert.doesNotMatch(categoryStep, /setCreateStep\("details"\)/);

  assert.match(formStep, /onOpenTypeStep: \(\) => void;/);
  assert.match(formStep, /type="button"/);
  assert.doesNotMatch(formStep, /setCreateStep\("editor"\)/);
  assert.match(previewStep, /onOpenDetailsStep: \(\) => void;/);
  assert.match(previewStep, /onOpenIdeaComposer: \(\) => void;/);
  assert.match(previewStep, /ideaActionLabel: string;/);
  assert.match(previewStep, /onClick=\{onOpenIdeaComposer\}/);
  assert.doesNotMatch(previewStep, /setActivePage/);
  assert.match(ideaComposer, /onOpenEventDetails: \(\) => void;/);
});
