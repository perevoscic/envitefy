import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("chat snap upload scans in chat instead of routing through dashboard upload action", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /runSnapOcrUpload\(\{ file, scanAttemptId, signal: uploadController.signal \}\)/);
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

test("chat upload waits for Send and carries the chosen format and user notes", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /type PendingChatUpload/);
  assert.doesNotMatch(source, /PendingUploadComposerSubmission|isUploadStarterTile|selectedStarterCategory/);
  assert.match(source, /setPendingChatUpload\(\{ file, source \}\)/);
  assert.match(source, /if \(pendingChatUpload\) \{\s*if \(!canAttachFlyer\) return;\s*const upload = pendingChatUpload;/);
  assert.match(
    source,
    /routeSelectedSnapFile\(upload\.file, upload\.source, selectedProductOutput \|\| undefined, typedValue, typedValue \|\| undefined\)/,
  );
  assert.match(source, /openSnapUploadPicker\(\)/);
  assert.match(source, /ref=\{fileInputRef\}[\s\S]{0,140}type="file"[\s\S]{0,140}getUploadAcceptAttribute\("attachment"\)/);
  assert.match(source, /handleSelectedSnapFile\(event\.currentTarget\.files\?\.\[0\], "upload"\)/);
  assert.match(source, /label=\{pendingChatUpload.file.name\}/);
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
  assert.match(source, /\(!isDateConfirmationReply \|\| params\.retryReply\) &&/);
  assert.match(source, /retryReply: failedRequest\.retryReply/);
  assert.doesNotMatch(source, /throw new Error\(payload\?\.error \|\| "Concierge request failed\."\)/);
});

test("chat live-card and event-page uploads can drive the preview image", () => {
  const source = readSource("src/app/chat/ConciergeChatClient.tsx");

  assert.match(source, /createObjectUrlPreview\(file\)/);
  assert.match(source, /setUploadedPreviewImageUrl\(uploadPreviewUrl\)/);
  assert.match(
    source,
    /canUploadFlyerToOutput\(effectiveSelectedProductOutput\) \? uploadedPreviewImageUrl : null/,
  );
  assert.match(source, /uploadedFlyerSourceImageUrl/);
  assert.match(source, /sourceImageUrl,\s*\}\)/);
});
