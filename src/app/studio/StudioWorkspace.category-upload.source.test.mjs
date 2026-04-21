import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio category upload accepts attachments and opens a poster-first live card preview", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /const \[isInvitationUploading, setIsInvitationUploading\] = useState\(false\);/);
  assert.match(source, /const \[invitationUploadError, setInvitationUploadError\] = useState<string \| null>\(null\);/);
  assert.match(source, /async function handleCategoryStepUpload\(file: File\)/);
  assert.match(source, /validateClientUploadFile\(file, "attachment"\)/);
  assert.match(source, /uploadMediaFile\(\{ file, usage: "attachment" }\)/);
  assert.match(source, /parseStudioFlyerDetails\(file\)/);
  assert.match(source, /const nextCategory = parsedCategory \|\| "Custom Invite";/);
  assert.match(source, /sourceMediaMode: "flyer",/);
  assert.match(source, /sourceFlyerPreviewUrl: previewUrl,/);
  assert.match(
    source,
    /const nextInvitationData = refreshLiveCardInvitationData\(nextDetails, \{\s*heroTextMode: "image",\s*\}\);/s,
  );
  assert.match(
    source,
    /const nextItem: MediaItem = \{[\s\S]*type: "page",[\s\S]*status: "ready",[\s\S]*positions: \{ \.\.\.EMPTY_POSITIONS \},[\s\S]*\};/s,
  );
  assert.match(source, /upsertLibraryItem\(nextItem\);/);
  assert.match(source, /setCurrentProject\(nextItem\);/);
  assert.match(source, /setActivePage\(nextItem\);/);
  assert.match(source, /setPreviewOrigin\("library"\);/);
  assert.match(source, /navigateWorkspace\("library"\);/);
  assert.doesNotMatch(source, /navigateWorkspace\("create", "details", nextDetails\.category\);/);
  assert.match(source, /onUploadInvitation=\{handleCategoryStepUpload\}/);
  assert.match(source, /isInvitationUploading=\{isInvitationUploading\}/);
  assert.match(source, /invitationUploadError=\{invitationUploadError\}/);
});
