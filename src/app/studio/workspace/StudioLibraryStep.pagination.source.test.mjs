import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("library tab uses infinite scroll batches with an intersection observer sentinel", () => {
  const source = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(source, /const LIBRARY_ITEMS_PER_BATCH = 10;/);
  assert.match(source, /const \[isMobile, setIsMobile\] = useState\(false\);/);
  assert.match(source, /const \[visibleCount, setVisibleCount\] = useState\(LIBRARY_ITEMS_PER_BATCH\);/);
  assert.match(source, /const libraryLoadMoreRef = useRef<HTMLDivElement \| null>\(null\);/);
  assert.match(source, /const libraryVisibleItems = useMemo\(/);
  assert.match(source, /return mediaList\.slice\(0, visibleCount\);/);
  assert.match(source, /const hasMoreLibraryItems = libraryVisibleItems\.length < mediaList\.length;/);
  assert.match(source, /className="mx-auto w-full max-w-\[1400px\] space-y-8 text-\[#111111\]"/);
  assert.match(source, /window\.innerWidth < 768/);
  assert.match(source, /grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5/);
  assert.match(source, /new IntersectionObserver\(/);
  assert.match(source, /rootMargin: "0px 0px 320px 0px"/);
  assert.match(source, /setVisibleCount\(\(current\) => Math\.min\(current \+ LIBRARY_ITEMS_PER_BATCH, mediaList\.length\)\)/);
  assert.match(source, /ref=\{libraryLoadMoreRef\}/);
  assert.match(source, /libraryVisibleItems\.map\(\(item\) => \{/);
  assert.doesNotMatch(source, /function getLibraryGalleryItemsPerPage\(viewportWidth: number\)/);
  assert.doesNotMatch(source, /function handleLibraryTouchStart\(/);
  assert.doesNotMatch(source, /function handleLibraryTouchEnd\(/);
  assert.doesNotMatch(source, /const \[libraryPage, setLibraryPage\] = useState\(0\);/);
  assert.doesNotMatch(source, /libraryPageCount/);
  assert.doesNotMatch(source, /Show library page/);
  assert.doesNotMatch(source, /aria-label="Show previous library cards"/);
  assert.doesNotMatch(source, /aria-label="Show more library cards"/);
  assert.doesNotMatch(source, /Swipe to browse/);
});
