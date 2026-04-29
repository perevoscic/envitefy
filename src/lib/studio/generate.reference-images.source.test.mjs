import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio generation fails image creation when any attached reference photo cannot be resolved", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(
    source,
    /const orderedReferenceImageUrls = editingExistingImage\s*\?\s*undefined\s*:\s*getOrderedStudioReferenceImageUrls\(normalizedRequest\.event\);/s,
  );
  assert.match(source, /const requestedRefCount = orderedReferenceImageUrls\?\.length \?\? 0;/);
  assert.match(
    source,
    /const referenceImages =\s*await studioGenerationDeps\.resolveStudioReferenceImages\(\s*orderedReferenceImageUrls\s*\);/s,
  );
  assert.match(source, /\.\.\.\(event\.propertyImageUrls \|\| \[\]\)/);
  assert.doesNotMatch(source, /\.\.\.\(event\.realtorImageUrls \|\| \[\]\)/);
  assert.doesNotMatch(source, /\.\.\.\(event\.realtorLogoUrls \|\| \[\]\)/);
  assert.match(
    source,
    /if \(requestedRefCount > 0 && referenceImages\.length !== requestedRefCount\) \{/,
  );
  assert.match(source, /function buildReferenceImageError\(\s*provider:/);
  assert.match(source, /code: "reference_images_unavailable"/);
  assert.match(
    source,
    /The invite was not generated because attached reference photos could not be used\./,
  );
  assert.match(source, /errors\.image = buildReferenceImageError\(provider\);/);
  assert.doesNotMatch(source, /The artwork was created without them\./);
});

test("studio image generation passes background-only image prompt options without poster text flags", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(
    source,
    /const imagePrompt = editingExistingImage\s*\?\s*buildExistingInvitationImageEditPrompt\(normalizedRequest\.imageEdit\?\.editInstruction\)\s*:\s*buildInvitationImagePrompt\(\s*normalizedRequest\.event,\s*normalizedRequest\.guidance,\s*liveCard,\s*\{/s,
  );
  assert.match(source, /surface,/);
  assert.match(source, /editingExistingImage: false,/);
  assert.match(source, /referenceImageCount: referenceImages\.length,/);
  assert.match(source, /mode === "both"/);
  assert.match(
    source,
    /const surface = request\.surface \|\| \(mode === "both" \|\| mode === "text" \? "page" : "image"\);/,
  );
  assert.doesNotMatch(source, /posterTextInImage/);
  assert.doesNotMatch(source, /isPosterFirstBirthdayOrWedding/);
});

test("studio generation normalizes risky themes before prompt building and returns metadata", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(
    source,
    /import \{\s*applyStudioThemeNormalization,\s*normalizeStudioTheme,\s*\} from "@\/lib\/studio\/theme-normalization";/s,
  );
  assert.match(
    source,
    /const themeNormalization = await studioGenerationDeps\.normalizeStudioTheme\(\{\s*provider,\s*event: request\.event,\s*guidance: request\.guidance,\s*\}\);/s,
  );
  assert.match(
    source,
    /const normalizedRequest =\s*themeNormalization\.riskLevel === "block"\s*\?\s*request\s*:\s*studioGenerationDeps\.applyStudioThemeNormalization\(request, themeNormalization\);/s,
  );
  assert.match(
    source,
    /buildLiveCardPrompt\(normalizedRequest\.event, normalizedRequest\.guidance\)/,
  );
  assert.match(
    source,
    /buildInvitationImagePrompt\(\s*normalizedRequest\.event,\s*normalizedRequest\.guidance,\s*liveCard,/s,
  );
  assert.match(source, /themeNormalization,/);
  assert.match(source, /code: "policy_blocked"/);
});
