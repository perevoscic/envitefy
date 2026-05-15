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

  assert.match(launchCards, /const scanAttemptId = createClientAttemptId\("scan"\);/);
  assert.match(launchCards, /await savePendingSnapUpload\(\{ file, scanAttemptId \}\);/);
  assert.match(launchCards, /uploadActionHref = "\/\?action=upload"/);
  assert.match(launchCards, /router\.push\(uploadActionHref\);/);
  assert.match(launchCards, /processInPage = false/);
  assert.match(launchCards, /__processSnapUploadFile/);
  assert.doesNotMatch(launchCards, /readFileAsDataUrl/);
  assert.doesNotMatch(launchCards, /__pendingSnapUpload/);
});

test("/event launch validates explicit supported upload types", () => {
  const launchCards = readSource("src/app/event/SnapLaunchCards.tsx");

  assert.match(launchCards, /validateClientUploadFile\(file, "attachment"\)/);
  assert.match(launchCards, /accept=\{getUploadAcceptAttribute\("header"\)\}/);
  assert.match(launchCards, /accept=\{getUploadAcceptAttribute\("attachment"\)\}/);
  assert.doesNotMatch(launchCards, /accept="image\/\*"/);
});

test("/event launch buttons match the chat starter tile treatment", () => {
  const launchCards = readSource("src/app/event/SnapLaunchCards.tsx");

  assert.match(launchCards, /const snapLaunchTileClass =/);
  assert.match(launchCards, /h-28 w-28/);
  assert.match(launchCards, /sm:h-40 sm:w-40/);
  assert.match(launchCards, /max-md:h-\[clamp\(6rem,17dvh,8rem\)\]/);
  assert.match(launchCards, /bg-\[#eff1f8\]/);
  assert.match(launchCards, /shadow-\[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff\]/);
  assert.match(
    launchCards,
    /shadow-\[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff\]/,
  );
  assert.match(launchCards, /grid-cols-2 content-center justify-items-center/);
  assert.match(launchCards, /max-md:gap-\[clamp\(0\.9rem,2\.2dvh,1\.4rem\)\]/);
  assert.match(launchCards, /<Camera/);
  assert.match(launchCards, /<Upload/);
  assert.doesNotMatch(launchCards, /src="\/images\/snap\.webp"/);
  assert.doesNotMatch(launchCards, /src="\/images\/upload\.webp"/);
});
