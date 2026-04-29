import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("open house extraction preserves realtor portrait focus", () => {
  const promptSource = readSource("src/lib/ocr/prompts.ts");
  const cropSource = readSource("src/lib/ocr/open-house.ts");

  assert.match(promptSource, /Return openHouse\.visualAssets only for the realtor portrait\/headshot/);
  assert.match(promptSource, /Do not return property photo crops/);
  assert.match(promptSource, /realtor portrait\/photo/);
  assert.match(promptSource, /not the entire realtor\/contact card/);
  assert.match(promptSource, /include the full visible face, hair, and enough shoulder\/background margin/);
  assert.match(promptSource, /Prefer a larger portrait box over a tight face crop/);

  assert.match(cropSource, /function clampRealtorPortraitCrop/);
  assert.match(cropSource, /clampCrop\(asset, imageWidth, imageHeight, 0\.72\)/);
  assert.match(cropSource, /const minHeight = Math\.max\(112, Math\.round\(minSide \* 1\.18\)\)/);
  assert.match(cropSource, /Math\.round\(targetWidth \* 0\.95\)/);
  assert.match(cropSource, /if \(!isRealtor\) continue;/);
  assert.match(cropSource, /delete next\.propertyImages;/);
  assert.doesNotMatch(cropSource, /propertyImages\.push/);
});
