import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio marketing showcase uses a centered active-card carousel", () => {
  const source = readSource("src/app/studio/StudioMarketingPage.tsx");

  assert.match(source, /const \[activeIndex, setActiveIndex\] = useState\(0\);/);
  assert.match(
    source,
    /const \[showcaseOverlayIndex, setShowcaseOverlayIndex\] = useState<number \| null>\(null\);/,
  );
  assert.match(
    source,
    /const \[fullscreenShowcaseIndex, setFullscreenShowcaseIndex\] = useState<number \| null>\(null\);/,
  );
  assert.match(
    source,
    /const \[fullscreenActiveTab, setFullscreenActiveTab\] = useState<LiveCardActiveTab>\("none"\);/,
  );
  assert.match(source, /const \[canScrollLeft, setCanScrollLeft\] = useState\(false\);/);
  assert.match(
    source,
    /const \[canScrollRight, setCanScrollRight\] = useState\(showcaseCards\.length > 1\);/,
  );
  assert.match(source, /const scrollToShowcaseIndex = \(index: number\) => \{/);
  assert.match(source, /setShowcaseOverlayIndex\(null\);/);
  assert.match(
    source,
    /const handleShowcaseCardClick = \(index: number, event\?: React\.MouseEvent<HTMLDivElement>\) => \{/,
  );
  assert.match(
    source,
    /target\.closest\("\[data-live-card-trigger\], \[data-live-card-panel\], button, a"\)/,
  );
  assert.match(source, /if \(index !== activeIndex\) \{\s*scrollToShowcaseIndex\(index\);/);
  assert.match(
    source,
    /setShowcaseOverlayIndex\(\(current\) => \(current === index \? null : index\)\);/,
  );
  assert.match(source, /data-showcase-card/);
  assert.match(
    source,
    /className="no-scrollbar flex items-start gap-6 overflow-x-auto scroll-smooth px-\[max\(2rem,calc\(50vw-150px\)\)\] py-8 snap-x snap-mandatory"/,
  );
  assert.match(source, /onClick=\{\(event\) => handleShowcaseCardClick\(index, event\)\}/);
  assert.doesNotMatch(
    source,
    /typeof navigator\.canShare === "function"\s*&&\s*!navigator\.canShare\(candidate as ShareData\)/,
  );
  assert.match(
    source,
    /className="w-\[min\(300px,calc\(100vw-4rem\)\)\] shrink-0 snap-center cursor-pointer"/,
  );
  assert.match(source, /activeIndex === index\s*\?\s*"scale-100 opacity-100 blur-0"/);
  assert.match(source, /:\s*"scale-\[0\.85\] opacity-40 blur-\[2px\]"/);
  assert.match(source, /showcaseOverlayIndex === index && activeIndex === index/);
  assert.match(source, /Open live card/);
  assert.match(source, /preview=\{showcaseCards\[fullscreenShowcaseIndex\]\.preview\}/);
  assert.match(source, /aria-label="Close live card"/);
  assert.doesNotMatch(
    source,
    /renderLiveCardPreviewTools\(showcaseCards\[fullscreenShowcaseIndex\]/,
  );
  assert.match(source, /showcaseCards\.map\(\(item, index\) => \(/);
  assert.match(source, /aria-label=\{`Show showcase card \$\{index \+ 1\}`\}/);
  assert.match(source, /Swipe to explore/);
  assert.match(source, /aria-label="Scroll showcase left"/);
  assert.match(source, /aria-label="Scroll showcase right"/);
  assert.match(source, /md:inline-flex/);
  assert.match(
    source,
    /<StudioMarketingLiveCard\s+preview=\{item\.preview\}\s+compactChrome\s+showcaseMode\s+imageLoading="lazy"\s+showcaseOverlay=/,
  );
});
