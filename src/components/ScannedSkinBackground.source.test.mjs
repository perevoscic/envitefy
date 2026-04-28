import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("scanned skin background keeps sport motifs round on portrait screens", () => {
  const source = readSource("src/components/ScannedSkinBackground.tsx");

  assert.match(source, /preserveAspectRatio="xMidYMid slice"/);
  assert.doesNotMatch(source, /preserveAspectRatio="none"/);
  assert.match(source, /case "basketball":/);
  assert.match(source, /stroke="rgba\(0,0,0,0\.55\)"/);
  assert.match(source, /case "hoop":/);
  assert.match(source, /rx=\{s \* 0\.42\}/);
  assert.match(source, /L \$\{s \* \(offset \* 0\.58\)\} \$\{s \* 0\.82\}/);
});

test("scanned skin background renders category-specific generated motifs", () => {
  const source = readSource("src/components/ScannedSkinBackground.tsx");
  const motifCases = [
    "cupcake",
    "sparkle",
    "crown",
    "music-note",
    "arcade-token",
    "ring-box",
    "champagne-bubble",
    "wine-glass",
    "lace",
    "vow-book",
    "ribbon",
    "bouquet",
    "wax-seal",
    "rose",
    "photo-frame",
    "pacifier",
    "teddy-bear",
    "cloud",
    "bib",
    "stroller",
    "teacup",
    "bow",
    "front-door",
    "welcome-mat",
    "plant",
    "lamp",
    "mug",
    "court-arc",
    "backboard",
    "net",
    "shot-clock",
    "trophy",
    "football-trophy",
    "yard-marker",
    "playbook",
    "cleat",
    "foam-finger",
    "paddle-pair",
    "pickleball-court",
    "serve-line",
    "water-bottle",
    "notebook",
    "school-building",
    "scroll",
    "laurel",
    "stained-glass",
    "olive-branch",
    "lantern",
    "map-pin",
    "announcement-card",
  ];

  for (const motifCase of motifCases) {
    assert.match(source, new RegExp(`case "${motifCase}":`));
  }

  assert.match(source, /spec\.objectKinds\.includes\("football-trophy"\)/);
  assert.match(source, /function buildPinnedFootballItems/);
  assert.match(source, /kind: "football"/);
  assert.match(source, /kind: "goalpost"/);
  assert.match(source, /kind: "field-line"/);
  assert.match(source, /kind: "helmet"/);
  assert.match(source, /kind: "yard-marker"/);
  assert.match(source, /kind: "foam-finger"/);
  assert.match(source, /x: 9/);
  assert.match(source, /y: 27/);
});
