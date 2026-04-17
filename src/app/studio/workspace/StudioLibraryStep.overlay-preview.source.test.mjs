import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("library previews render overlay text for legacy overlay-mode live cards", () => {
  const source = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(source, /import LiveCardHeroTextOverlay from "@\/components\/studio\/LiveCardHeroTextOverlay";/);
  assert.match(source, /item\.type === "page" \? \(\s*<LiveCardHeroTextOverlay invitationData=\{item\.data\} \/>/s);
});
