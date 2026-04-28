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
    /birthday: \[[\s\S]*"cupcake"[\s\S]*"crown"[\s\S]*"music-note"[\s\S]*"arcade-token"/,
  );
  assert.match(
    source,
    /wedding: \[[\s\S]*"ring-box"[\s\S]*"lace"[\s\S]*"vow-book"[\s\S]*"wax-seal"/,
  );
  assert.match(source, /"baby-shower": \[[\s\S]*"pacifier"[\s\S]*"teddy-bear"[\s\S]*"stroller"/);
  assert.match(source, /engagement: \[[\s\S]*"ring-box"[\s\S]*"sparkle"[\s\S]*"rose"/);
  assert.match(source, /housewarming: \[[\s\S]*"front-door"[\s\S]*"welcome-mat"[\s\S]*"mug"/);
  assert.match(
    source,
    /basketball: \[[\s\S]*"court-arc"[\s\S]*"backboard"[\s\S]*"net"[\s\S]*"shot-clock"/,
  );
  assert.match(
    source,
    /football: \[[\s\S]*"football-trophy"[\s\S]*"playbook"[\s\S]*"cleat"[\s\S]*"foam-finger"/,
  );
  assert.match(source, /"sneaker"/);
  assert.match(
    source,
    /pickleball: \[[\s\S]*"paddle-pair"[\s\S]*"pickleball-court"[\s\S]*"serve-line"[\s\S]*"water-bottle"/,
  );
  assert.match(
    source,
    /graduation: \[[\s\S]*"notebook"[\s\S]*"school-building"[\s\S]*"scroll"[\s\S]*"laurel"/,
  );
  assert.match(source, /religious: \[[\s\S]*"stained-glass"[\s\S]*"olive-branch"[\s\S]*"lantern"/);
  assert.match(source, /general: \[[\s\S]*"map-pin"[\s\S]*"announcement-card"/);
  assert.match(source, /anniversary: \[[\s\S]*"wine-glass"[\s\S]*"photo-frame"/);
  assert.match(source, /cupcakes: "cupcake"/);
  assert.match(source, /"wine glasses": "wine-glass"/);
  assert.match(source, /"front door": "front-door"/);
  assert.match(source, /"map pins": "map-pin"/);
  assert.match(source, /"super bowl trophy": "football-trophy"/);
  assert.match(source, /"lombardi trophy": "football-trophy"/);
  assert.match(source, /skinId\.startsWith\("scanned-football-"\)/);
  assert.match(source, /return category === "football" \? \["football-trophy"\] : \[\]/);
  assert.match(source, /category === "football" && objectKind === "trophy"/);
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
  assert.match(source, /allowed\.has\(contextualObjectKind\)/);
  assert.match(source, /function completeObjectKinds/);
  assert.match(source, /function normalizeColors/);
  assert.match(source, /const seedSource = \[/);
  assert.match(source, /safeString\(context\.title\)/);
  assert.match(source, /export function resolveOcrSkinBackground/);
});
