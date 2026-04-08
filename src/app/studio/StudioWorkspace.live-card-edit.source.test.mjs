import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("live card updates reuse the current image in the studio generation request", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(
    source,
    /const sourceImageDataUrl =\s*type === "page" && existingItem\?\.type === "page" \? clean\(existingItem\.url\) : "";/,
  );
  assert.match(
    source,
    /const loadingItem: MediaItem = \{[\s\S]*url: existingItem\?\.url,[\s\S]*data: existingItem\?\.data,[\s\S]*\};/,
  );
  assert.match(
    source,
    /requestStudioGeneration\(\s*currentDetails,\s*type === "page" \? "both" : "image",\s*sourceImageDataUrl \? editPrompt : undefined,\s*sourceImageDataUrl \|\| undefined,\s*\)/,
  );
  assert.match(
    source,
    /response\.imageDataUrl \|\| existingItem\?\.url \|\| getFallbackThumbnail\(currentDetails\)/,
  );
  assert.match(source, /persistStudioLibraryImageUrl/);
});

test("live card modal uses in-context image prompt panel; studio step keeps form-level image edit", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function openLiveCardImageEdit\(item: MediaItem\)/);
  assert.match(source, /function openLiveCardTextEdit\(item: MediaItem\)/);
  assert.match(source, /function renderEditImagePanel\(item: MediaItem\)/);
  assert.match(source, /renderEditImagePanel\(page\)/);
  assert.match(source, /renderLiveCardPreviewTools\(activePageRecord\)/);
  assert.match(source, /renderEditTextPanel\(page\)/);
  assert.match(source, />\s*Edit Text\s*</);
  assert.doesNotMatch(source, /openLiveCardEditor\(activePageRecord\)/);
  assert.match(source, /openLiveCardImageEdit=\{openLiveCardImageEdit\}/);
  assert.match(source, /openLiveCardTextEdit=\{openLiveCardTextEdit\}/);
  assert.match(source, /Edit current image/);
  assert.doesNotMatch(source, /Edit live card details/);
});
