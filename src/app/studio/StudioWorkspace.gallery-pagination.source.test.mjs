import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio tab keeps a single current project instead of paging the saved library", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioEditorStep.tsx");

  assert.match(source, /const \[currentProject, setCurrentProject\] = useState<MediaItem \| null>\(null\);/);
  assert.match(source, /const currentProjectWithVisualDraft = useMemo\(/);
  assert.match(source, /const currentProjectHasUnsavedChanges = useMemo\(/);
  assert.match(source, /const currentProjectSaveLabel = /);
  assert.match(editorStep, /No current project yet/);
  assert.match(source, /Save to Library/);
  assert.doesNotMatch(editorStep, /Discard/);
  assert.doesNotMatch(editorStep, /Current Project/);
  assert.doesNotMatch(editorStep, /Save this project to keep it in Library\./);

  assert.doesNotMatch(source, /function getStudioGalleryItemsPerPage\(viewportWidth: number\)/);
  assert.doesNotMatch(source, /const \[studioGalleryPage, setStudioGalleryPage\] = useState\(0\);/);
  assert.doesNotMatch(source, /aria-label="Show previous studio cards"/);
  assert.doesNotMatch(source, /aria-label="Show more studio cards"/);
  assert.doesNotMatch(source, /studioGalleryVisibleItems\.map\(\(item\) => \(/);
});
