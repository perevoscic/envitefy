import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("dashboard scan saves forward ocrSkin metadata and uses it for birthday and wedding OCR persistence", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /ocrSkin\?: OcrSkinSelection \| null;/);
  assert.match(source, /ocrSkin: data\?\.ocrSkin \|\| null,/);
  assert.match(source, /const normalizedOcrSkin =/);
  assert.match(source, /flyerColors = normalizedOcrSkin\.palette;/);
  assert.match(source, /ocrSkin:\s*normalizedOcrSkin/);
  assert.match(source, /variationId: isBirthdayOcrEvent\s*\?\s*normalizedOcrSkin\?\.category === "birthday"/);
  assert.match(source, /normalizedOcrSkin\.skinId/);
});
