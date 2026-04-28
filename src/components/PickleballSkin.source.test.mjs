import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("pickleball skin does not invent event details when OCR did not provide them", () => {
  const source = readSource("src/components/PickleballSkin.tsx");

  assert.doesNotMatch(source, /PICKLEBALL_ACTIVITY_DEFAULTS/);
  assert.doesNotMatch(source, /detailCopy=\{detailCopy \|\|/);
  assert.doesNotMatch(source, /activities=\{displayActivities\.length \?/);
  assert.doesNotMatch(source, /attire=\{attire \|\|/);

  assert.match(source, /backgroundCategory="general"/);
  assert.match(source, /sportKind="pickleball"/);
  assert.match(source, /detailCopy=\{detailCopy\}/);
  assert.match(source, /activities=\{displayActivities\}/);
  assert.match(source, /attire=\{attire\}/);
  assert.match(source, /categoryLabel=\{categoryLabel\}/);
  assert.match(source, /ocrFacts=\{ocrFacts\}/);
  assert.match(source, /detailLayout="wideDetails"/);
});

test("generic scanned invite skin renders pickleball timing as named rows", () => {
  const source = readSource("src/components/ScannedInviteSkin.tsx");

  assert.match(source, /const isPickleballSkin = String\(sportKind \|\| ""\)/);
  assert.match(source, /label="Check-in"[\s\S]*?title=\{checkInTime\}/);
  assert.match(source, /label="Games starting"[\s\S]*?title=\{gamesStartTime\}/);
  assert.match(source, /isRedundantPickleballSummary/);
  assert.match(source, /isEntryFeeFact/);
  assert.match(source, /const displayEntryFee = isPickleballSkin/);
  assert.match(source, /Entry Fee/);
  assert.match(source, /className="col-span-2 flex flex-col justify-center/);
  assert.match(source, /\{displayEntryFee\}/);
  assert.match(source, /const factsForCards = normalizedOcrFacts\.filter/);
  assert.match(source, /check\[-\\s\]\?in\|games\?\\s\+start/);
  assert.match(source, /isEntryFeeFact\(fact\.label, fact\.value\)/);
});
