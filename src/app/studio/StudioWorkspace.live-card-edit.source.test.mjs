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
    /url: response\.imageDataUrl \|\| existingItem\?\.url \|\| getFallbackThumbnail\(currentDetails\),/,
  );
});

test("live card modal exposes one combined edit action and the form-level current-image prompt", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /<p className="text-sm font-semibold text-white">Edit live card<\/p>/);
  assert.match(source, /Update details and current artwork/);
  assert.match(source, /Edit current image/);
  assert.match(
    source,
    /Update this live card by editing the current artwork in place while\s*applying your detail changes\./,
  );
  assert.match(
    source,
    /Update Invitation will keep your current card details and button placement while editing the current image\./,
  );
  assert.doesNotMatch(source, /Edit live card details/);
});
