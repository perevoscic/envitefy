import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio generation fails image creation when any attached reference photo cannot be resolved", () => {
  const source = readSource("src/lib/studio/generate.ts");

  assert.match(
    source,
    /const requestedRefCount = request\.event\.referenceImageUrls\?\.length \?\? 0;/,
  );
  assert.match(
    source,
    /const referenceImages = await resolveStudioReferenceImages\(request\.event\.referenceImageUrls\);/,
  );
  assert.match(
    source,
    /if \(requestedRefCount > 0 && referenceImages\.length !== requestedRefCount\) \{/,
  );
  assert.match(source, /function buildReferenceImageError\(provider:/);
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

  assert.match(source, /const imagePrompt = buildInvitationImagePrompt\(request\.event, request\.guidance, liveCard, \{/);
  assert.match(source, /surface,/);
  assert.match(source, /editingExistingImage: Boolean\(request\.imageEdit\?\.sourceImageDataUrl\),/);
  assert.match(source, /referenceImageCount: referenceImages\.length,/);
  assert.match(source, /mode === "both"/);
  assert.match(
    source,
    /const surface = request\.surface \|\| \(mode === "both" \|\| mode === "text" \? "page" : "image"\);/,
  );
  assert.doesNotMatch(source, /posterTextInImage/);
  assert.doesNotMatch(source, /isPosterFirstBirthdayOrWedding/);
});
