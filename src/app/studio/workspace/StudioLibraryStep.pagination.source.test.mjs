import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("library tab pages the gallery with arrows, dots, responsive windows, and swipe", () => {
  const source = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(source, /function getLibraryGalleryItemsPerPage\(viewportWidth: number\)/);
  assert.match(source, /const \[libraryPage, setLibraryPage\] = useState\(0\);/);
  assert.match(source, /const \[libraryItemsPerPage, setLibraryItemsPerPage\] = useState\(10\);/);
  assert.match(source, /const libraryPageCount = Math\.max\(/);
  assert.match(source, /const libraryVisibleItems = useMemo\(/);
  assert.match(source, /const libraryVisibleRangeLabel =/);
  assert.match(source, /function goToLibraryPage\(nextPage: number\)/);
  assert.match(source, /function handleLibraryTouchStart\(/);
  assert.match(source, /function handleLibraryTouchEnd\(/);
  assert.match(source, /onTouchStart=\{handleLibraryTouchStart\}/);
  assert.match(source, /onTouchEnd=\{handleLibraryTouchEnd\}/);
  assert.match(source, /aria-label="Show previous library cards"/);
  assert.match(source, /aria-label="Show more library cards"/);
  assert.match(source, /aria-label={`Show library page \$\{index \+ 1\}`}/);
  assert.match(source, /Swipe to browse/);
  assert.match(source, /libraryVisibleItems\.map\(\(item\) => \(/);
});
