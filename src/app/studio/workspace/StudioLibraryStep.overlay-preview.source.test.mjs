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
  assert.match(source, /item\.type === "page" \? "h-8 w-8" : "h-10 w-10"/);
  assert.match(source, /item\.type === "page" \? "h-3\.5 w-3\.5" : "h-4 w-4"/);
  assert.match(source, /item\.type === "image" \? \(\s*<ImageIcon className="h-3 w-3 text-\[#007AFF\]" \/>/s);
  assert.doesNotMatch(source, /<Activity className="h-3 w-3 text-\[#007AFF\]" \/>/);
});
