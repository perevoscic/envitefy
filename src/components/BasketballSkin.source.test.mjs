import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("basketball skin does not invent event details when OCR did not provide them", () => {
  const source = readSource("src/components/BasketballSkin.tsx");

  assert.doesNotMatch(source, /BASKETBALL_ACTIVITY_DEFAULTS/);
  assert.doesNotMatch(source, /detailCopy=\{detailCopy \|\|/);
  assert.doesNotMatch(source, /activities=\{displayActivities\.length \?/);
  assert.doesNotMatch(source, /attire=\{attire \|\|/);

  assert.match(source, /detailCopy=\{detailCopy\}/);
  assert.match(source, /activities=\{displayActivities\}/);
  assert.match(source, /attire=\{attire\}/);
  assert.match(source, /categoryLabel=\{displayCategoryLabel\}/);
  assert.match(source, /ocrFacts=\{ocrFacts\}/);
  assert.match(source, /detailLayout="wideDetails"/);
  assert.match(source, /background=\{basketballBackground\}/);
});

test("basketball skin uses visual chip copy and filters title-like activity summaries", () => {
  const source = readSource("src/components/BasketballSkin.tsx");

  assert.match(source, /BASKETBALL_CHIP_LABELS/);
  assert.match(source, /BASKETBALL_BACKGROUND_OBJECT_KINDS/);
  assert.match(source, /"basketball",\s*"hoop"/);
  assert.match(source, /buildBasketballBackground/);
  assert.match(source, /getBasketballChipLabel/);
  assert.match(source, /isBasketballSummaryActivity/);
  assert.match(source, /\^\(\?:pickup \)\?basketball \(\?:open \)\?run\$/);
  assert.doesNotMatch(source, /"Celebration"/);
});
