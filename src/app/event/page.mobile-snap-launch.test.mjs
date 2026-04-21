import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("/event landing uses direct client launch cards instead of action=camera links", () => {
  const page = readSource("src/app/event/page.tsx");
  const launchCards = readSource("src/app/event/SnapLaunchCards.tsx");

  assert.match(page, /import SnapLaunchCards from "\.\/SnapLaunchCards"/);
  assert.match(page, /<SnapLaunchCards \/>/);
  assert.doesNotMatch(page, /href="\/\?action=camera"/);
  assert.match(launchCards, /cameraInputRef\.current\?\.click\(\)/);
  assert.match(launchCards, /uploadInputRef\.current\?\.click\(\)/);
});

test("/event upload launch persists the selected file before navigation", () => {
  const launchCards = readSource("src/app/event/SnapLaunchCards.tsx");

  assert.match(launchCards, /await savePendingSnapUpload\(\{ file, previewUrl \}\);/);
  assert.match(launchCards, /router\.push\("\/\?action=upload"\);/);
  assert.doesNotMatch(launchCards, /__pendingSnapUpload/);
});

test("/event launch cards stack on mobile and hide helper copy on small screens", () => {
  const launchCards = readSource("src/app/event/SnapLaunchCards.tsx");

  assert.match(launchCards, /className="mt-10 grid grid-cols-1 gap-3 pb-10 sm:grid-cols-2 sm:gap-6"/);
  assert.match(launchCards, /min-h-\[180px\]/);
  assert.match(launchCards, /text-sm text-white\/80 sm:block/);
  assert.match(launchCards, /src="\/images\/snap\.webp"/);
  assert.match(launchCards, /src="\/images\/upload\.webp"/);
});
