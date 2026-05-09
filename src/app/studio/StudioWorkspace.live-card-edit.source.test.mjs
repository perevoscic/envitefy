import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("live card non-visual updates reuse the current image in the studio generation request", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(
    source,
    /const existingLiveCardImageUrl =\s*type === "page" && existingItem\?\.type === "page" \? clean\(existingItem\.url\) : "";/,
  );
  assert.match(
    source,
    /const shouldEditExistingLiveCardImage = Boolean\(\s*existingLiveCardImageUrl &&\s*!hasLiveCardVisualDirectionChanged\(currentDetails, existingItem\?\.details\),\s*\);/,
  );
  assert.match(
    source,
    /const sourceImageDataUrl = shouldEditExistingLiveCardImage \? existingLiveCardImageUrl : "";/,
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
    /const imageEditPrompt = sourceImageDataUrl\s*\?\s*resolveExistingLiveCardImageEditPrompt\(currentDetails, existingItem\?\.details, editPrompt\)\s*:\s*undefined;/,
  );
  assert.match(
    source,
    /const generationMode = sourceImageDataUrl \? "image" : type === "page" \? "both" : "image";/,
  );
  assert.match(
    source,
    /requestStudioGeneration\(\s*currentDetails,\s*generationMode,\s*generationSurface,\s*imageEditPrompt,\s*sourceImageDataUrl \|\| undefined,\s*sourceImageDataUrl \? existingItem\?\.details : undefined,\s*\)/,
  );
  assert.match(
    source,
    /response\.imageUrl \|\|\s*response\.imageDataUrl \|\|\s*existingItem\?\.url \|\|\s*getFallbackThumbnail\(currentDetails\)/,
  );
  assert.match(source, /persistStudioLibraryImageUrl/);
  assert.match(
    source,
    /requestStudioGeneration\(\s*savedItem\.details,\s*"image",\s*"page",\s*prompt,\s*sourceImageDataUrl,\s*\)/,
  );
});

test("studio editEvent links hydrate the existing event before showing the create picker", () => {
  const pageSource = readSource("src/app/studio/page.tsx");
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(
    pageSource,
    /const editEventId = readSearchParam\(awaitedSearchParams\?\.editEvent\);/,
  );
  assert.match(pageSource, /const userId = await resolveSessionUserId\(session\);/);
  assert.match(pageSource, /const row = await getEventHistoryById\(editEventId\);/);
  assert.match(pageSource, /initialEditEventRow = JSON\.parse\(JSON\.stringify\(row\)\);/);
  assert.match(pageSource, /initialEditEventId=\{editEventId \|\| null\}/);
  assert.match(pageSource, /initialEditEventRow=\{initialEditEventRow\}/);
  assert.match(pageSource, /initialEditEventError=\{initialEditEventError\}/);
  assert.match(
    workspaceSource,
    /const initialEditItem = createStudioMediaItemFromHistoryRow\(initialEditEventRow\);/,
  );
  assert.match(
    workspaceSource,
    /initialEditItem \? "details" : parseStudioCreateStep\(searchParams\.get\("step"\)\)/,
  );
  assert.match(
    workspaceSource,
    /const \[currentProject, setCurrentProject\] = useState<MediaItem \| null>\(\(\) => initialEditItem\);/,
  );
  assert.match(
    workspaceSource,
    /const \[activePage, setActivePage\] = useState<MediaItem \| null>\(\(\) => initialEditItem\);/,
  );
  assert.match(workspaceSource, /initialEditEventRowRef = useRef<unknown>\(initialEditEventRow\)/);
  assert.match(workspaceSource, /initialEditEventIdRef = useRef\(clean\(initialEditEventId\)\)/);
});

test("live card visual-direction edits force full regeneration instead of surgical image edit", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(
    source,
    /function hasLiveCardVisualDirectionChanged\(\s*currentDetails: EventDetails,\s*previousDetails: EventDetails \| undefined,\s*\): boolean/,
  );
  assert.match(
    source,
    /const currentIdea = sanitizeStudioDesignIdea\(currentDetails\.theme\)\.toLowerCase\(\);/,
  );
  assert.match(
    source,
    /const previousIdea = sanitizeStudioDesignIdea\(previousDetails\.theme\)\.toLowerCase\(\);/,
  );
  assert.match(source, /if \(currentIdea !== previousIdea\) return true;/);
  assert.match(source, /const LIVE_CARD_VISUAL_DIRECTION_FIELDS: Array<keyof EventDetails> = \[/);
  assert.match(source, /"visualPreferences",/);
  assert.match(source, /"imageFinishPreset",/);
  assert.match(source, /"visualStyleMode",/);
  assert.match(source, /normalizeLiveCardVisualDirectionUrls\(currentDetails\.guestImageUrls\)/);
  assert.match(source, /normalizeLiveCardVisualDirectionUrls\(currentDetails\.propertyImageUrls\)/);
  assert.match(source, /normalizeLiveCardVisualDirectionUrls\(currentDetails\.realtorImageUrls\)/);
  assert.match(source, /normalizeLiveCardVisualDirectionUrls\(currentDetails\.realtorLogoUrls\)/);
  assert.match(
    source,
    /!hasLiveCardVisualDirectionChanged\(currentDetails, existingItem\?\.details\)/,
  );
});

test("live card existing-image detail edits pass previous details for surgical prompts", () => {
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");
  const generateSource = readSource("src/lib/studio/generate.ts");

  assert.match(
    workspaceSource,
    /function resolveExistingLiveCardImageEditPrompt\(\s*currentDetails: EventDetails,\s*previousDetails: EventDetails \| undefined,\s*explicitPrompt: string,/,
  );
  assert.match(workspaceSource, /if \(prompt\) return prompt;/);
  assert.match(
    workspaceSource,
    /currentIdea\.slice\(previousIdea\.length\)\.replace\(\/\^\[\\s,.;:!\?-]\+\/, ""\)/,
  );
  assert.match(workspaceSource, /sourceImageDataUrl \? existingItem\?\.details : undefined,/);
  assert.match(
    workspaceSource,
    /data: refreshLiveCardInvitationData\(details, draftedProject\.data \|\| undefined\),/,
  );
  assert.match(
    workspaceSource,
    /if \(!currentProjectWithVisualDraft \|\| currentProjectWithVisualDraft\.status !== "ready"\) return;/,
  );
  assert.match(
    builderSource,
    /function buildExistingImageEditInstruction\(\s*details: EventDetails,\s*refinement: string,\s*previousDetails\?: EventDetails,/,
  );
  assert.match(
    builderSource,
    /const previousScheduleLine = previousDetails\s*\?\s*buildDeterministicScheduleLine\(previousDetails\)\s*:\s*"";/,
  );
  assert.match(
    builderSource,
    /const nextScheduleLine = buildDeterministicScheduleLine\(details\);/,
  );
  assert.match(builderSource, /Replace only the existing visible date\/time line/);
  assert.match(builderSource, /do not convert it to numeric date format/);
  assert.match(builderSource, /must visibly reflect that requested edit/);
  assert.match(builderSource, /choose the most visually matching subject or prop/);
  assert.doesNotMatch(builderSource, /soda cups|drink cups|requested animal or animals/);
  assert.match(
    generateSource,
    /buildExistingInvitationImageEditPrompt\(normalizedRequest\.imageEdit\?\.editInstruction\)/,
  );
  assert.doesNotMatch(
    generateSource,
    /editingExistingImage: Boolean\(normalizedRequest\.imageEdit\?\.sourceImageDataUrl\)/,
  );
});

test("live card modal hides preview-only image edit and design controls without in-modal text editor", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");
  const editorStep = readSource("src/app/studio/workspace/StudioFormStep.tsx");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");

  assert.match(source, /function openLiveCardImageEdit\(item: MediaItem\)/);
  assert.match(source, /function renderEditImagePanel\(\s*item: MediaItem,/);
  assert.match(
    source,
    /const liveCardPreviewTools = renderLiveCardPreviewTools\(activePageRecord\);/,
  );
  assert.doesNotMatch(
    source,
    /renderEditImagePanel\(page,\s*\{\s*layout:\s*"liveCardTools"\s*\}\)/,
  );
  assert.match(source, /openLiveCardImageEdit=\{openLiveCardImageEdit\}/);
  assert.match(source, /const STUDIO_MOBILE_TOP_CHROME = /);
  assert.match(source, /style=\{studioLiveCardModalStyle\}/);
  assert.match(source, /style=\{studioLiveCardFrameStyle\}/);
  assert.match(source, /!isLiveCardToolsDrawerOpen && liveCardPreviewTools \?/);
  assert.match(source, /isLiveCardToolsDrawerOpen && liveCardPreviewTools \?/);
  assert.match(
    source,
    /style=\{\s*studioLiveCardControlTop \? \{ top: studioLiveCardControlTop \} : undefined\s*\}/,
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
  assert.doesNotMatch(source, />\s*Design Mode\s*</);
  assert.match(surfaceSource, /data-live-card-panel/);
  assert.match(surfaceSource, /data-live-card-trigger/);
  assert.match(
    surfaceSource,
    /import \{ getLiveCardRailLayout \} from "@\/lib\/live-card-rail-layout";/,
  );
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
  assert.match(
    workspaceSource,
    /const \[deleteConfirmationItem, setDeleteConfirmationItem\] = useState<MediaItem \| null>\(null\);/,
  );
  assert.match(
    workspaceSource,
    /if \(item\.type === "page"\) \{\s*setDeleteConfirmationItem\(item\);\s*return;\s*\}/s,
  );
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
  assert.match(
    librarySource,
    /onClick=\{\(event\) => \{\s*event\.stopPropagation\(\);\s*deleteMedia\(item\);\s*\}\}/s,
  );
  assert.doesNotMatch(librarySource, /onClickCapture=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.doesNotMatch(workspaceSource, /window\.confirm\(confirmMessage\)/);
});
