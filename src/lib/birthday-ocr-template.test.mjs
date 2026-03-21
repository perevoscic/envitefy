import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("birthday OCR helper defines stable theme routing and OCR birthday renderer guard", () => {
  const source = readSource("src/lib/birthday-ocr-template.ts");

  assert.match(source, /editorial_ballerina_bloom/);
  assert.match(source, /editorial_blue_allstar/);
  assert.match(source, /editorial_confetti_neutral/);
  assert.match(source, /selectBirthdayOcrThemeId/);
  assert.match(source, /isOcrBirthdayRenderer/);
  assert.match(source, /ballerina/);
  assert.match(source, /all-star/);
  assert.match(source, /themeId: selectBirthdayOcrThemeId\(audience\)/);
});
