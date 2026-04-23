import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("ocr skin inference dispatches through the resolved studio provider", () => {
  const source = readSource("src/lib/ocr/skin.ts");

  assert.match(source, /import \{ resolveStudioProvider \} from "@\/lib\/studio\/provider";/);
  assert.match(source, /export const ocrSkinDeps = \{/);
  assert.match(source, /resolveStudioProvider,/);
  assert.match(source, /const provider = ocrSkinDeps\.resolveStudioProvider\(\);/);
  assert.match(source, /provider === "openai"/);
  assert.match(source, /inferWithOpenAi/);
  assert.match(source, /inferWithGemini/);
  assert.match(source, /scanned-birthday-bento-pop/);
  assert.match(source, /scanned-wedding-noir-modern/);
});

test("ocr pipeline adds provider-aware ocrSkin only for birthday and wedding scans", () => {
  const source = readSource("src/lib/ocr/pipeline.ts");

  assert.match(source, /import \{ inferOcrSkinSelection \} from "@\/lib\/ocr\/skin";/);
  assert.match(source, /const ocrSkin =/);
  assert.match(source, /category === "Birthdays" \|\| category === "Weddings"/);
  assert.match(source, /await inferOcrSkinSelection\(\{/);
  assert.match(source, /ocrSkin,/);
});
