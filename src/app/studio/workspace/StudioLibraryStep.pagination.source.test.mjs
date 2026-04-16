import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("library tab uses desktop paging, mobile full-list mode, and sample-style dots", () => {
  const source = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(source, /const LIBRARY_ITEMS_PER_PAGE = 8;/);
  assert.match(source, /const \[libraryPage, setLibraryPage\] = useState\(0\);/);
  assert.match(source, /const \[isMobile, setIsMobile\] = useState\(false\);/);
  assert.match(source, /const libraryPageCount = isMobile\s*\?\s*1\s*:\s*Math\.max\(/);
  assert.match(source, /const libraryVisibleItems = useMemo\(/);
  assert.match(source, /if \(isMobile\) return mediaList;/);
  assert.match(source, /window\.innerWidth < 768/);
  assert.match(source, /aria-label={`Show library page \$\{index \+ 1\}`}/);
  assert.match(source, /!isMobile && libraryPageCount > 1/);
  assert.match(source, /setLibraryPage\(index\)/);
  assert.match(source, /libraryVisibleItems\.map\(\(item\) => \{/);
  assert.doesNotMatch(source, /function getLibraryGalleryItemsPerPage\(viewportWidth: number\)/);
  assert.doesNotMatch(source, /function handleLibraryTouchStart\(/);
  assert.doesNotMatch(source, /function handleLibraryTouchEnd\(/);
  assert.doesNotMatch(source, /aria-label="Show previous library cards"/);
  assert.doesNotMatch(source, /aria-label="Show more library cards"/);
  assert.doesNotMatch(source, /Swipe to browse/);
});
