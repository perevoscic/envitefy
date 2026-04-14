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
    /requestStudioGeneration\(\s*currentDetails,\s*type === "page" \? "both" : "image",\s*type,\s*sourceImageDataUrl \? editPrompt : undefined,\s*sourceImageDataUrl \|\| undefined,\s*\)/,
  );
  assert.match(
    source,
    /response\.imageDataUrl \|\| existingItem\?\.url \|\| getFallbackThumbnail\(currentDetails\)/,
  );
  assert.match(source, /persistStudioLibraryImageUrl/);
  assert.match(
    source,
    /requestStudioGeneration\(\s*item\.details,\s*"image",\s*"page",\s*prompt,\s*sourceImageDataUrl,\s*\)/,
  );
});

test("live card modal keeps text editing in context and image editing background-only", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function openLiveCardImageEdit\(item: MediaItem\)/);
  assert.match(source, /function openLiveCardTextEdit\(item: MediaItem\)/);
  assert.match(source, /function saveLiveCardTextEdits\(item: MediaItem\)/);
  assert.match(source, /refreshLiveCardInvitationData\(nextDetails,\s*item\.data\)/);
  assert.match(source, /function renderEditImagePanel\(item: MediaItem\)/);
  assert.match(source, /renderEditImagePanel\(page\)/);
  assert.match(source, /renderLiveCardPreviewTools\(activePageRecord\)/);
  assert.match(source, /renderEditTextPanel\(page\)/);
  assert.match(source, />\s*Edit Text\s*</);
  assert.match(source, /<LiveCardTextEditor/);
  assert.match(source, /setLiveCardTextDetails\(item\.details\)/);
  assert.match(source, /sharePath:\s*undefined,/);
  assert.match(source, /openLiveCardImageEdit=\{openLiveCardImageEdit\}/);
  assert.match(source, /openLiveCardTextEdit=\{openLiveCardTextEdit\}/);
  assert.match(source, /const STUDIO_MOBILE_TOP_CHROME = /);
  assert.match(source, /style=\{studioLiveCardModalStyle\}/);
  assert.match(source, /style=\{studioLiveCardFrameStyle\}/);
  assert.match(source, /className="fixed right-3 z-\[115\]/);
  assert.match(source, /style=\{studioLiveCardControlTop \? \{ top: studioLiveCardControlTop \} : undefined\}/);
  assert.match(source, /initial=\{\{ x: "100%" \}\}/);
  assert.match(source, /className="absolute bottom-0 right-0 top-0 z-10 flex w-\[min\(22rem,88vw\)\][\s\S]*border-l border-white\/10/);
  assert.match(source, /Edit current background/);
  assert.match(source, /<LiveCardHeroTextOverlay invitationData=\{activePageRecord\.data\} \/>/);
  assert.match(
    source,
    /function openLiveCardTextEdit\(item: MediaItem\) \{[\s\S]*setLiveCardTextDetails\(item\.details\);[\s\S]*setIsLiveCardTextEditorOpen\(true\);[\s\S]*\}/,
  );
  assert.doesNotMatch(
    source,
    /function openLiveCardTextEdit\(item: MediaItem\) \{[\s\S]*beginLiveCardDetailEdit\(item\);[\s\S]*\}/,
  );
});
