import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("ocr skin background schema validates motifs and builds title-aware fallbacks", () => {
  const source = readSource("src/lib/ocr/skin-background.ts");

  assert.match(source, /export type OcrSkinBackground = \{/);
  assert.match(source, /objectKinds: OcrSkinBackgroundObjectKind\[\];/);
  assert.match(source, /colors\?: string\[\];/);
  assert.match(
    source,
    /birthday: \["confetti", "streamer", "dot", "star", "balloon", "cake", "gift", "party-hat"\]/,
  );
  assert.match(source, /wedding: \[[\s\S]*"ring"[\s\S]*"diamond"[\s\S]*"floral-arch"/);
  assert.match(source, /"baby-shower": \[[\s\S]*"baby-bottle"[\s\S]*"rattle"[\s\S]*"onesie"/);
  assert.match(source, /engagement: \[[\s\S]*"diamond"[\s\S]*"ring"[\s\S]*"heart"/);
  assert.match(source, /housewarming: \["house", "key"[\s\S]*"gift"\]/);
  assert.match(
    source,
    /basketball: \[[\s\S]*"basketball"[\s\S]*"hoop"[\s\S]*"jersey"[\s\S]*"scoreboard"/,
  );
  assert.match(
    source,
    /football: \[[\s\S]*"football"[\s\S]*"helmet"[\s\S]*"pennant"[\s\S]*"megaphone"[\s\S]*"scoreboard"/,
  );
  assert.match(source, /"sneaker"/);
  assert.match(
    source,
    /pickleball: \[[\s\S]*"pickleball"[\s\S]*"paddle"[\s\S]*"scoreboard"[\s\S]*"whistle"/,
  );
  assert.match(
    source,
    /graduation: \["cap", "tassel", "diploma", "book", "medal", "star", "banner", "confetti"\]/,
  );
  assert.match(source, /religious: \["candle", "dove"/);
  assert.match(source, /general: \["calendar", "ticket"/);
  assert.match(source, /export function isBasketballOcrSkinCandidate/);
  assert.match(source, /export function isFootballOcrSkinCandidate/);
  assert.match(source, /export function isPickleballOcrSkinCandidate/);
  assert.match(source, /sportKind\?: OcrSportKind \| string \| null;/);
  assert.match(source, /SPORT_KIND_OBJECT_KINDS/);
  assert.match(source, /"sport events"/);
  assert.match(source, /entry\\s\+fee/);
  assert.match(source, /senior\\s\+night/);
  assert.match(source, /student\\s\+section/);
  assert.match(source, /open\\s\+run/);
  assert.match(source, /function normalizeObjectKinds/);
  assert.match(source, /allowed\.has\(objectKind\)/);
  assert.match(source, /function completeObjectKinds/);
  assert.match(source, /function normalizeColors/);
  assert.match(source, /const seedSource = \[/);
  assert.match(source, /safeString\(context\.title\)/);
  assert.match(source, /export function resolveOcrSkinBackground/);
});
