import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio create and library entry views do not hide content on initial mount", () => {
  const categoryStep = readSource("src/app/studio/workspace/StudioCategoryStep.tsx");
  const categoryTile = readSource("src/app/studio/workspace/StudioCategoryTile.tsx");
  const uploadTile = readSource("src/app/studio/workspace/StudioCategoryUploadTile.tsx");
  const libraryStep = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(categoryStep, /initial=\{false\}/);
  assert.match(categoryTile, /initial=\{false\}/);
  assert.match(uploadTile, /initial=\{false\}/);
  assert.match(libraryStep, /initial=\{false\}/);

  assert.doesNotMatch(categoryStep, /initial=\{\s*opacity:\s*0,\s*y:\s*20\s*\}/);
  assert.doesNotMatch(categoryTile, /initial=\{\s*opacity:\s*0,\s*scale:\s*0\.95\s*\}/);
  assert.doesNotMatch(uploadTile, /initial=\{\s*opacity:\s*0,\s*scale:\s*0\.95\s*\}/);
  assert.doesNotMatch(libraryStep, /initial=\{\s*opacity:\s*0,\s*y:\s*20\s*\}/);
});
