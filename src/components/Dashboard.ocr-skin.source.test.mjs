import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("dashboard scan saves forward ocrSkin metadata for invite OCR persistence", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /ocrSkin\?: OcrSkinSelection \| null;/);
  assert.match(source, /thumbnailFocus\?: ThumbnailFocus \| null;/);
  assert.match(source, /ocrSkin: data\?\.ocrSkin \|\| null,/);
  assert.match(source, /thumbnailFocus: normalizeThumbnailFocus\(data\?\.thumbnailFocus\),/);
  assert.match(source, /const normalizedOcrSkin =/);
  assert.match(source, /const normalizedThumbnailFocus = normalizeThumbnailFocus\(ocrMeta\?\.thumbnailFocus\);/);
  assert.match(source, /isBasketballOcrSkinCandidate/);
  assert.match(source, /const isBasketballOcrEvent =/);
  assert.match(source, /normalizedOcrSkin\?\.category === "basketball"/);
  assert.match(source, /const isInviteOcrEvent = isOcrInviteCategory\(normalizedOcrCategory\) \|\| isBasketballOcrEvent;/);
  assert.match(source, /flyerColors = normalizedOcrSkin\.palette;/);
  assert.match(source, /ocrSkin:\s*isInviteOcrEvent \? normalizedOcrSkin \|\| undefined : undefined,/);
  assert.match(source, /thumbnailFocus:\s*isInviteOcrEvent && normalizedThumbnailFocus/);
  assert.match(source, /"ocr-basketball-skin"/);
  assert.match(source, /"ocr-invite-skin"/);
  assert.match(source, /variationId: isBirthdayOcrEvent\s*\?\s*normalizedOcrSkin\?\.category === "birthday"/);
  assert.match(source, /normalizedOcrSkin\.skinId/);
});
