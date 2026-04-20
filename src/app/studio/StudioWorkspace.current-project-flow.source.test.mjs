import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio workspace separates the current project from the saved library", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");
  const libraryStep = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");
  const phonePane = readSource("src/app/studio/workspace/StudioPhonePreviewPane.tsx");
  const previewStep = readSource("src/app/studio/workspace/StudioMobilePreviewStep.tsx");

  assert.match(source, /function upsertLibraryItem\(item: MediaItem\)/);
  assert.match(source, /function saveWorkingProject\(project: MediaItem \| null\)/);
  assert.match(source, /function saveCurrentProjectToLibrary\(\)/);
  assert.match(source, /function clearCurrentProject\(options\?: \{ resetDetails\?: boolean \}\)/);
  assert.match(source, /function confirmDiscardCurrentProject\(/);
  assert.match(source, /setCurrentProject\(loadingItem\);/);
  assert.match(source, /setCurrentProject\(nextItem\);/);
  assert.match(
    source,
    /const shareableWorkingItem = isCurrentProjectItem\s*\?\s*\(saveWorkingProject\(workingItem\) \?\? workingItem\)\s*:\s*workingItem;/s,
  );
  assert.match(source, /upsertLibraryItem\(syncedItem\);/);
  assert.match(source, /clearCurrentProject\(\{ resetDetails: true \}\);/);
  assert.match(phonePane, /getStudioCategoryShowcasePreview\(details\.category\)/);
  assert.match(phonePane, /<StudioShowcaseLiveCard/);
  assert.match(source, /const currentProjectSaveLabel = /);
  assert.match(phonePane, /\{currentProjectSaveLabel\}/);
  assert.doesNotMatch(phonePane, /Save this project to keep it in Library\./);
  assert.doesNotMatch(phonePane, /Discard/);
  assert.match(source, /<StudioMobilePreviewStep/);
  assert.match(previewStep, /showSaveButton=\{false\}/);
  assert.doesNotMatch(previewStep, /openLiveCardEditor/);
  assert.doesNotMatch(previewStep, /setActivePage/);
  assert.match(source, /function prepareProjectForLibrarySave\(project: MediaItem\): MediaItem/);
  assert.match(source, /id: createId\(\),/);
  assert.match(source, /publishedEventId: undefined,/);
  assert.match(source, /sharePath: undefined,/);

  assert.match(libraryStep, /setActivePage: \(item: MediaItem \| null\) => void;/);
  assert.match(libraryStep, /function openLibraryItem\(item: MediaItem\)/);
  assert.match(libraryStep, /setActivePage\(item\);/);
});
