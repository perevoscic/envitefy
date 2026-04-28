import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football skin passes through OCR facts and does not invent event details", () => {
  const source = readSource("src/components/FootballSkin.tsx");

  assert.match(source, /import ScannedInviteSkin from "@\/components\/ScannedInviteSkin";/);
  assert.match(source, /backgroundCategory="football"/);
  assert.match(source, /categoryLabel=\{categoryLabel \|\| "Football"\}/);
  assert.match(source, /const footballPalette =/);
  assert.match(source, /palette=\{footballPalette\}/);
  assert.match(source, /detailCopy=\{detailCopy\}/);
  assert.match(source, /activities=\{displayActivities\}/);
  assert.match(source, /attire=\{attire\}/);
  assert.match(source, /ocrFacts=\{ocrFacts\}/);
  assert.match(source, /detailLayout="wideDetails"/);

  assert.doesNotMatch(source, /FOOTBALL_ACTIVITY_DEFAULTS/);
  assert.doesNotMatch(source, /detailCopy=\{detailCopy \|\|/);
  assert.doesNotMatch(source, /activities=\{displayActivities\.length \?/);
  assert.doesNotMatch(source, /attire=\{attire \|\|/);
});
