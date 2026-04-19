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
  assert.match(source, /const showcaseSwipeStateRef = useRef<\{/);
  assert.match(source, /const fullscreenSwipeStateRef = useRef<\{/);
  assert.match(source, /const suppressShowcaseClickRef = useRef\(false\);/);
  assert.match(
    source,
    /const handleShowcasePointerDown = \(\s*index: number,\s*event: React\.PointerEvent<HTMLDivElement>,/,
  );
  assert.match(
    source,
    /if \(!event\.isPrimary \|\| event\.pointerType === "mouse" \|\| event\.pointerType === "touch"\) return;/,
  );
  assert.match(
    source,
    /const handleShowcasePointerMove = \(event: React\.PointerEvent<HTMLDivElement>\) => \{/,
  );
  assert.match(source, /const deltaX = event\.clientX - swipeState\.startX;/);
  assert.match(source, /const deltaY = event\.clientY - swipeState\.startY;/);
  assert.match(source, /scrollToShowcaseIndex\(swipeState\.index \+ \(deltaX < 0 \? 1 : -1\)\);/);
  assert.match(
    source,
    /target\.closest\("\[data-live-card-trigger\], \[data-live-card-panel\], button, a"\)/,
  );
  assert.match(
    source,
    /if \(index !== activeIndex\) \{\s*event\?\.preventDefault\(\);\s*event\?\.stopPropagation\(\);\s*scrollToShowcaseIndex\(index\);\s*return;\s*\}/,
  );
  assert.match(
    source,
    /setShowcaseOverlayIndex\(\(current\) => \(current === index \? null : index\)\);/,
  );
  assert.match(source, /data-showcase-card/);
  assert.match(source, /onClickCapture=\{handleShowcaseClickCapture\}/);
  assert.match(source, /onPointerDownCapture=\{\(event\) => handleShowcasePointerDown\(index, event\)\}/);
  assert.match(source, /onPointerMoveCapture=\{handleShowcasePointerMove\}/);
  assert.match(source, /onPointerUpCapture=\{clearShowcaseSwipeState\}/);
  assert.match(source, /onPointerCancelCapture=\{clearShowcaseSwipeState\}/);
  assert.match(
    source,
    /const navigateFullscreenShowcase = \(direction: "left" \| "right"\) => \{/,
  );
  assert.match(
    source,
    /const nextIndex =\s*\(fullscreenShowcaseIndex \+ step \+ showcaseCards\.length\) % showcaseCards\.length;/,
  );
  assert.match(source, /setFullscreenActiveTab\("none"\);/);
  assert.match(source, /scrollToShowcaseIndex\(nextIndex\);/);
  assert.match(
    source,
    /const handleFullscreenPointerDown = \(event: React\.PointerEvent<HTMLDivElement>\) => \{/,
  );
  assert.match(
    source,
    /if \(!event\.isPrimary \|\| event\.pointerType === "mouse"\) return;/,
  );
  assert.match(
    source,
    /const handleFullscreenPointerMove = \(event: React\.PointerEvent<HTMLDivElement>\) => \{/,
  );
  assert.match(
    source,
    /navigateFullscreenShowcase\(deltaX < 0 \? "right" : "left"\);/,
  );
  assert.match(source, /onPointerDownCapture=\{handleFullscreenPointerDown\}/);
  assert.match(source, /onPointerMoveCapture=\{handleFullscreenPointerMove\}/);
  assert.match(source, /onPointerUpCapture=\{clearFullscreenSwipeState\}/);
  assert.match(source, /onPointerCancelCapture=\{clearFullscreenSwipeState\}/);
  assert.match(
    source,
    /className="no-scrollbar flex touch-auto items-start gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-0 py-8 snap-x snap-mandatory sm:px-\[max\(2rem,calc\(50vw-150px\)\)\]"/,
  );
  assert.doesNotMatch(source, /w-\[calc\(50%-150px\)\] shrink-0/);
  assert.match(source, /data-showcase-active=\{activeIndex === index \? "true" : "false"\}/);
  assert.match(source, /onClick=\{\(event\) => handleShowcaseCardClick\(index, event\)\}/);
  assert.match(source, /import StudioShowcaseLiveCard from "@\/components\/studio\/StudioShowcaseLiveCard";/);
  assert.match(
    source,
    /className="w-screen shrink-0 snap-center cursor-pointer sm:w-\[min\(300px,calc\(100vw-4rem\)\)\]"/,
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
    /<StudioShowcaseLiveCard\s+preview=\{item\.preview\}\s+compactChrome\s+showcaseMode\s+interactive=\{activeIndex === index\}\s+imageLoading="lazy"\s+showcaseOverlay=/,
  );
});
