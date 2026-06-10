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

test("chat upload queues the picked file before product selection", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /type PendingChatUpload/);
  assert.match(source, /type PendingUploadComposerSubmission/);
  assert.match(source, /isUploadStarterTile\(selectedStarterCategory\)/);
  assert.match(source, /setPendingUploadSubmission\(\{/);
  assert.match(source, /setPendingChatUpload\(\{ file, source \}\)/);
  assert.match(source, /routeSelectedSnapFile\(upload\.file, upload\.source, option\.output\)/);
  assert.match(source, /openSnapUploadPicker\(\)/);
  assert.match(source, />\s*\+1\s*<\/span>/);
  assert.match(source, /`\$\{userEchoOverride\.trim\(\)\} - Uploaded 1 file`/);
  assert.match(source, /User note: \$\{uploadPrompt\.trim\(\)\}/);
  assert.doesNotMatch(source, /Choose what this upload should become\./);
  assert.doesNotMatch(source, /ariaLabel="Choose upload product format"/);
  assert.doesNotMatch(source, /Uploaded \$\{uploadedFileLabel\(file\)\}/);
});

test("chat upload status renders as a concierge bubble", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");
  const statusBranch = source.match(
    /message\.type === "upload_status" \? \([\s\S]*?\) : message\.role === "user"/,
  )?.[0];

  assert.ok(statusBranch);
  assert.match(statusBranch, /<ConciergeChatAvatar \/>/);
  assert.match(statusBranch, /role="status"/);
  assert.doesNotMatch(statusBranch, /inline-flex items-center gap-2 rounded-full/);
});

test("date confirmation replies bypass streaming and object errors are normalized", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /function conciergeClientErrorMessage\(value: unknown, fallback: string\)/);
  assert.match(source, /cleaned !== "\[object Object\]"/);
  assert.match(source, /const isDateConfirmationReply = draft\?\.currentQuestion === "date_confirmation"/);
  assert.match(source, /!isDateConfirmationReply &&/);
  assert.doesNotMatch(source, /throw new Error\(payload\?\.error \|\| "Concierge request failed\."\)/);
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
