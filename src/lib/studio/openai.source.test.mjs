import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio openai adapter uses structured text generation and image generate/edit endpoints", () => {
  const source = readSource("src/lib/studio/openai.ts");

  assert.match(source, /import OpenAI from "openai";/);
  assert.match(source, /import \{ toFile \} from "openai\/uploads";/);
  assert.match(source, /const OPENAI_LIVE_CARD_RESPONSE_FORMAT = \{/);
  assert.match(source, /name: "studio_live_card"/);
  assert.match(source, /strict: true/);
  assert.match(source, /await client\.chat\.completions\.create\(/);
  assert.match(source, /response_format: OPENAI_LIVE_CARD_RESPONSE_FORMAT as any/);
  assert.match(source, /await client\.images\.generate\(/);
  assert.match(source, /await client\.images\.edit\(/);
  assert.match(source, /process\.env\.STUDIO_OPENAI_TEXT_MODEL \|\| "gpt-5\.4-mini"/);
  assert.match(source, /process\.env\.STUDIO_OPENAI_IMAGE_MODEL \|\| "gpt-image-2"/);
  assert.match(source, /process\.env\.STUDIO_OPENAI_IMAGE_EDIT_MODEL \|\| "gpt-image-2"/);
  assert.match(source, /if \(model === "gpt-image-2" && raw === "transparent"\) return "opaque";/);
});

test("studio openai image prep accepts same-origin relative asset urls and forwards reference images", () => {
  const source = readSource("src/lib/studio/openai.ts");

  assert.match(
    source,
    /import \{\s*resolveStudioSourceImage,\s*type StudioResolvedSourceImage,\s*\} from "@\/lib\/studio\/source-image";/s,
  );
  assert.match(source, /const sourceImage = await openAiStudioDeps\.resolveStudioSourceImage\(sourceImageDataUrl\);/);
  assert.doesNotMatch(source, /absoluteUrl/);
  assert.doesNotMatch(source, /resolveInlineImageSource/);
  assert.match(source, /referenceImages && referenceImages\.length > 5/);
  assert.match(source, /OpenAI preserves the first 5 reference images with higher fidelity\./);
  assert.match(source, /referenceImages\.map\(\(image, index\) =>/);
});
