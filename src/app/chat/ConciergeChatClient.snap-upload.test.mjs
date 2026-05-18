import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("chat snap upload scans in chat instead of routing through dashboard upload action", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /runSnapOcrUpload\(\{ file, scanAttemptId \}\)/);
  assert.match(source, /action: "ocr_result"/);
  assert.match(source, /buildChatFieldsGuess/);
  assert.match(source, /birthdayHint\.honoreeName/);
  assert.match(source, /saveReadyDraftToEvent/);
  assert.match(source, /The extracted event details are locked to the upload/);
  assert.match(source, /Review it, keep editing, or generate a preview/);
  assert.doesNotMatch(source, /await saveOcrReadyDraftToEvent/);
  assert.doesNotMatch(source, /savePendingSnapUpload/);
  assert.doesNotMatch(source, /router\.push\(`\/\?action=upload/);
});

test("chat snap upload exposes retry controls on failure", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /Retry file/);
  assert.match(source, /Upload different/);
  assert.match(source, /Continue manually/);
  assert.match(source, /failedSnapUpload/);
});

test("chat upload asks for product choice before opening a fresh upload", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /isUploadProductChoiceOpen/);
  assert.match(source, /Choose what this upload should become\./);
  assert.match(source, /ariaLabel="Choose upload product format"/);
  assert.match(source, /function handleUploadProductChoice\(option: ProductOption\)/);
  assert.match(source, /openSnapUploadPicker\(\)/);
});

test("chat live-card uploads can drive the preview image", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /createObjectUrlPreview\(file\)/);
  assert.match(source, /setUploadedPreviewImageUrl\(uploadPreviewUrl\)/);
  assert.match(
    source,
    /effectiveSelectedProductOutput === "live_card" \? uploadedPreviewImageUrl : null/,
  );
  assert.match(source, /uploadedLiveCardSourceImageUrl/);
  assert.match(source, /sourceImageUrl,\s*\}\)/);
});
