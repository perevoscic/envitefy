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
