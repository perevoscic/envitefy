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
    /const generationSurface = resolveStudioGenerationSurface\(currentDetails, type, \{/,
  );
  assert.match(
    source,
    /const loadingItem: MediaItem = \{[\s\S]*url: existingItem\?\.url,[\s\S]*data: existingItem\?\.data,[\s\S]*\};/,
  );
  assert.match(
    source,
    /requestStudioGeneration\(\s*currentDetails,\s*type === "page" \? "both" : "image",\s*generationSurface,\s*sourceImageDataUrl[\s\S]*editPrompt[\s\S]*sourceImageDataUrl \|\| undefined,\s*\)/,
  );
  assert.match(
    source,
    /response\.imageDataUrl \|\| existingItem\?\.url \|\| getFallbackThumbnail\(currentDetails\)/,
  );
  assert.match(source, /persistStudioLibraryImageUrl/);
  assert.match(
    source,
    /requestStudioGeneration\(\s*savedItem\.details,\s*"image",\s*"page",\s*prompt,\s*sourceImageDataUrl,\s*\)/,
  );
});

test("live card modal exposes image edit tools without in-modal text editor", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(source, /function openLiveCardImageEdit\(item: MediaItem\)/);
  assert.match(source, /function renderEditImagePanel\(\s*item: MediaItem,/);
  assert.match(source, /renderEditImagePanel\(page,\s*\{\s*layout:\s*"liveCardTools"\s*\}\)/);
  assert.match(source, /renderLiveCardPreviewTools\(activePageRecord\)/);
  assert.match(source, /openLiveCardImageEdit=\{openLiveCardImageEdit\}/);
  assert.match(source, /const STUDIO_MOBILE_TOP_CHROME = /);
  assert.match(source, /style=\{studioLiveCardModalStyle\}/);
  assert.match(source, /style=\{studioLiveCardFrameStyle\}/);
  assert.match(source, /className="fixed right-3 z-\[7015\]/);
  assert.match(
    source,
    /style=\{studioLiveCardControlTop \? \{ top: studioLiveCardControlTop \} : undefined\}/,
  );
  assert.match(source, /initial=\{\{ x: "100%" \}\}/);
  assert.match(
    source,
    /className="absolute bottom-0 right-0 top-0 z-10 flex w-\[min\(22rem,88vw\)\][\s\S]*border-l border-white\/10/,
  );
  assert.doesNotMatch(editorStep, /Edit current background/);
  assert.doesNotMatch(editorStep, /Edit current invitation art/);
  assert.match(source, /<LiveCardHeroTextOverlay invitationData=\{activePageRecord\.data\} \/>/);
  assert.match(source, /<StudioLiveCardActionSurface[\s\S]*activeTab=\{activeTab\}/);
  assert.match(surfaceSource, /data-live-card-panel/);
  assert.match(surfaceSource, /data-live-card-trigger/);
  assert.match(surfaceSource, /import \{ getLiveCardRailLayout \} from "@\/lib\/live-card-rail-layout";/);
  assert.match(surfaceSource, /const showcaseRailLayout = getLiveCardRailLayout\(\{/);
  assert.match(surfaceSource, /data-live-card-rail-layout=\{showcaseRailLayout\}/);
  assert.doesNotMatch(surfaceSource, /inline-flex w-fit max-w-\[calc\(100%-0\.25rem\)\]/);
  assert.doesNotMatch(surfaceSource, /justify-between gap-0/);

  assert.doesNotMatch(source, /LiveCardTextEditor/);
  assert.doesNotMatch(source, />\s*Edit Text\s*</);
  assert.doesNotMatch(source, /openLiveCardTextEdit/);
});

test("image edit preview stages URL and layout; commit patches media item", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  const previewBlock = source.match(
    /async function previewStudioImageEdit[\s\S]*?(?=\n {2}function commitStudioVisualDraft)/,
  );
  assert.ok(previewBlock, "expected previewStudioImageEdit block");
  assert.doesNotMatch(previewBlock[0], /patchMediaItem/);
  assert.match(previewBlock[0], /setStudioVisualDraft/);
  assert.match(previewBlock[0], /persistStudioLibraryImageUrl/);

  assert.match(source, /function commitStudioVisualDraft/);
  assert.match(source, /patchMediaItem\(item\.id, \{ \.\.\.patch, status: "ready" \}\)/);

  assert.match(source, /function updatePosition\(/);
  const updateBlock = source.match(/function updatePosition\([\s\S]*?\n {2}\}/);
  assert.ok(updateBlock, "expected updatePosition block");
  assert.doesNotMatch(updateBlock[0], /setMediaList/);
  assert.match(updateBlock[0], /setStudioVisualDraft/);
});

test("live card library delete asks for confirmation before removal", () => {
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");
  const librarySource = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(workspaceSource, /function deleteMedia\(item: MediaItem\)/);
  assert.match(workspaceSource, /const \[deleteConfirmationItem, setDeleteConfirmationItem\] = useState<MediaItem \| null>\(null\);/);
  assert.match(workspaceSource, /if \(item\.type === "page"\) \{\s*setDeleteConfirmationItem\(item\);\s*return;\s*\}/s);
  assert.match(workspaceSource, /function performDeleteMedia\(item: MediaItem\)/);
  assert.match(workspaceSource, /function confirmDeleteMedia\(\)/);
  assert.match(workspaceSource, /performDeleteMedia\(deleteConfirmationItem\);/);
  assert.match(workspaceSource, /Delete live card\?/);
  assert.match(
    workspaceSource,
    /Remove this live card from your Studio library\. This action cannot be undone\./,
  );
  assert.match(workspaceSource, /Keep live card/);
  assert.match(workspaceSource, /Delete live card/);
  assert.match(librarySource, /deleteMedia: \(item: MediaItem\) => void;/);
  assert.match(librarySource, /onClick=\{\(event\) => \{\s*event\.stopPropagation\(\);\s*deleteMedia\(item\);\s*\}\}/s);
  assert.doesNotMatch(librarySource, /onClickCapture=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.doesNotMatch(workspaceSource, /window\.confirm\(confirmMessage\)/);
});
