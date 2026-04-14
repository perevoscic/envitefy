import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio request preparation persists and strictly validates attached reference photos", () => {
  const source = readSource("src/app/studio/studio-workspace-api.ts");

  assert.match(
    source,
    /import \{ isAllowedStudioReferenceImageUrl \} from "@\/lib\/studio\/reference-image-url";/,
  );
  assert.match(source, /import \{ persistImageMediaValue \} from "@\/utils\/media-upload-client";/);
  assert.match(source, /const STUDIO_REFERENCE_IMAGE_ERROR =/);
  assert.match(
    source,
    /async function prepareStudioDetailsForGeneration\(details: EventDetails\): Promise<EventDetails>/,
  );
  assert.match(source, /const persisted = await persistImageMediaValue\(/);
  assert.match(source, /const finalUrl = toAllowedStudioReferenceImageUrl\(persisted \|\| raw\);/);
  assert.match(
    source,
    /if \(!finalUrl \|\| !isAllowedStudioReferenceImageUrl\(finalUrl\)\) \{\s*throw new Error\(STUDIO_REFERENCE_IMAGE_ERROR\);/s,
  );
  assert.match(
    source,
    /const preparedDetails = await prepareStudioDetailsForGeneration\(details\);/,
  );
  assert.match(
    source,
    /buildStudioRequest\(preparedDetails, mode, surface, editPrompt, sourceImageDataUrl\)/,
  );
});
