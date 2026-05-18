import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

function readSource(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("snap upload OCR prepares large/mobile images before posting to OCR", () => {
  const source = readSource("src/lib/snap-upload-pipeline.ts");

  assert.match(source, /prepareOcrUploadFile/);
  assert.match(source, /const preparedFile = await prepareOcrUploadFile\(params\.file\);/);
  assert.match(source, /const fileToUpload = await cloneFileForUpload\(preparedFile\);/);
  assert.match(source, /fetch\("\/api\/ocr\?fast=0"/);
});
