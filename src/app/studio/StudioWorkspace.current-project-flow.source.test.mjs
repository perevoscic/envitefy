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
  const editorStep = readSource("src/app/studio/workspace/StudioEditorStep.tsx");

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
  assert.match(editorStep, /No current project yet/);
  assert.match(source, /const currentProjectSaveLabel = /);
  assert.match(editorStep, /\{currentProjectSaveLabel\}/);
  assert.doesNotMatch(editorStep, /Current Project/);
  assert.doesNotMatch(editorStep, /Save this project to keep it in Library\./);
  assert.doesNotMatch(editorStep, /Discard/);
  assert.match(source, /function prepareProjectForLibrarySave\(project: MediaItem\): MediaItem/);
  assert.match(source, /id: createId\(\),/);
  assert.match(source, /publishedEventId: undefined,/);
  assert.match(source, /sharePath: undefined,/);

  assert.match(libraryStep, /setActivePage: \(item: MediaItem \| null\) => void;/);
  assert.match(libraryStep, /function openLibraryItem\(item: MediaItem\)/);
  assert.match(libraryStep, /setActivePage\(item\);/);
});
