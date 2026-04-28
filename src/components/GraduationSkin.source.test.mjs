import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("graduation skin uses the widened scanned invite details layout", () => {
  const source = readSource("src/components/GraduationSkin.tsx");

  assert.match(source, /<ScannedInviteSkin/);
  assert.match(source, /ocrFacts=\{ocrFacts\}/);
  assert.match(source, /detailLayout="wideDetails"/);
});
