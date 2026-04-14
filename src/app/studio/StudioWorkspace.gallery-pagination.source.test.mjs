import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio tab pages the media gallery with arrows and mobile swipe", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function getStudioGalleryItemsPerPage\(viewportWidth: number\)/);
  assert.match(source, /const \[studioGalleryPage, setStudioGalleryPage\] = useState\(0\);/);
  assert.match(
    source,
    /const \[studioGalleryItemsPerPage, setStudioGalleryItemsPerPage\] = useState\(10\);/,
  );
  assert.match(source, /const studioGalleryPageCount = Math\.max\(/);
  assert.match(source, /const studioGalleryVisibleItems = useMemo\(/);
  assert.match(source, /function goToStudioGalleryPage\(nextPage: number\)/);
  assert.match(source, /function handleStudioGalleryTouchStart\(/);
  assert.match(source, /function handleStudioGalleryTouchEnd\(/);
  assert.match(source, /onTouchStart=\{handleStudioGalleryTouchStart\}/);
  assert.match(source, /onTouchEnd=\{handleStudioGalleryTouchEnd\}/);
  assert.match(source, /aria-label="Show previous studio cards"/);
  assert.match(source, /aria-label="Show more studio cards"/);
  assert.match(source, /Swipe to browse/);
  assert.match(source, /studioGalleryVisibleItems\.map\(\(item\) => \(/);
});
