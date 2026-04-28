import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

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
  assert.match(
    source,
    /const normalizedThumbnailFocus = normalizeThumbnailFocus\(ocrMeta\?\.thumbnailFocus\);/,
  );
  assert.match(source, /isBasketballOcrSkinCandidate/);
  assert.match(source, /isPickleballOcrSkinCandidate/);
  assert.match(source, /const isPickleballOcrEvent =/);
  assert.match(source, /normalizedOcrSkin\?\.sportKind === "pickleball"/);
  assert.match(source, /normalizedOcrCategory = "Sport Events";/);
  assert.match(source, /const isBasketballOcrEvent =/);
  assert.match(source, /normalizedOcrSkin\?\.category === "basketball"/);
  assert.match(source, /if \(isBasketballOcrEvent\) \{\s*normalizedOcrCategory = "Sport Events";/);
  assert.match(source, /isBasketballOcrEvent \|\|\s*isPickleballOcrEvent/);
  assert.match(source, /flyerColors = normalizedOcrSkin\.palette;/);
  assert.match(
    source,
    /ocrSkin:\s*isInviteOcrEvent \? normalizedOcrSkin \|\| undefined : undefined,/,
  );
  assert.match(source, /thumbnailFocus:\s*isInviteOcrEvent && normalizedThumbnailFocus/);
  assert.match(source, /"ocr-pickleball-skin"/);
  assert.match(source, /"ocr-basketball-skin"/);
  assert.match(source, /"ocr-invite-skin"/);
  assert.match(
    source,
    /variationId: isBirthdayOcrEvent\s*\?\s*normalizedOcrSkin\?\.category === "birthday"/,
  );
  assert.match(source, /normalizedOcrSkin\.skinId/);
  assert.match(source, /const venueFromScan =/);
  assert.match(source, /venue: venueFromScan \|\| undefined/);
  assert.match(source, /venue:\s*typeof eventInput\.venue === "string"/);
  assert.match(source, /const extractRsvpName =/);
  assert.match(source, /rsvpName: rsvpNameFromScan \|\| undefined/);
  assert.match(source, /rsvpName:\s*typeof eventInput\.rsvpName === "string"/);
});
