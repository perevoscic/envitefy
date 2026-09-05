import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("open house extraction preserves realtor portrait focus", () => {
  const promptSource = readSource("src/lib/ocr/extraction-prompt.ts");
  const cropSource = readSource("src/lib/ocr/open-house.ts");

  assert.match(promptSource, /visualAssets may contain at most one realtor-headshot crop/);
  assert.match(promptSource, /No property photo crops/);

  assert.match(promptSource, /No property photo crops, logos, QR codes or contact-card crops/);
  assert.match(promptSource, /covering the whole face\/hair\/shoulders with margin/);
  assert.match(promptSource, /normalized 0..1/);

  assert.match(cropSource, /function clampRealtorPortraitCrop/);
  assert.match(cropSource, /clampCrop\(asset, imageWidth, imageHeight, 0\.72\)/);
  assert.match(cropSource, /const minHeight = Math\.max\(112, Math\.round\(minSide \* 1\.18\)\)/);
  assert.match(cropSource, /Math\.round\(targetWidth \* 0\.95\)/);
  assert.match(cropSource, /if \(!isRealtor\) continue;/);
  assert.match(cropSource, /delete next\.propertyImages;/);
  assert.doesNotMatch(cropSource, /propertyImages\.push/);
});
