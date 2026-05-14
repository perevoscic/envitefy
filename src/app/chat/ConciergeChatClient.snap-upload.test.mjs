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
  assert.match(source, /action: "save"/);
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
