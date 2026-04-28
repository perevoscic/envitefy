import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("ocr skin background schema validates motifs and builds title-aware fallbacks", () => {
  const source = readSource("src/lib/ocr/skin-background.ts");

  assert.match(source, /export type OcrSkinBackground = \{/);
  assert.match(source, /objectKinds: OcrSkinBackgroundObjectKind\[\];/);
  assert.match(source, /colors\?: string\[\];/);
  assert.match(source, /birthday: \["confetti", "streamer", "dot", "star", "balloon"\]/);
  assert.match(source, /wedding: \["botanical-sprig", "leaf", "frame-corner", "ring", "pearl"\]/);
  assert.match(
    source,
    /basketball: \["basketball", "hoop", "court-line", "star", "banner", "dot"\]/,
  );
  assert.match(source, /graduation: \["cap", "tassel", "diploma", "star", "banner", "confetti"\]/);
  assert.match(source, /export function isBasketballOcrSkinCandidate/);
  assert.match(source, /"sport events"/);
  assert.match(source, /open\\s\+run/);
  assert.match(source, /function normalizeObjectKinds/);
  assert.match(source, /allowed\.has\(objectKind\)/);
  assert.match(source, /function normalizeColors/);
  assert.match(source, /const seedSource = \[/);
  assert.match(source, /safeString\(context\.title\)/);
  assert.match(source, /export function resolveOcrSkinBackground/);
});
