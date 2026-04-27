import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("event OCR prompt includes dashboard thumbnail focus contract", () => {
  const promptSource = readFileSync(new URL("./prompts.ts", import.meta.url), "utf8");
  const typesSource = readFileSync(new URL("./types.ts", import.meta.url), "utf8");
  const pipelineSource = readFileSync(new URL("./pipeline.ts", import.meta.url), "utf8");

  assert.match(promptSource, /THUMBNAIL FOCUS/);
  assert.match(promptSource, /target="face"/);
  assert.match(promptSource, /target="title"/);
  assert.match(promptSource, /target="center"/);
  assert.match(promptSource, /thumbnailFocus/);
  assert.match(typesSource, /thumbnailFocus\?: ThumbnailFocus \| null/);
  assert.match(pipelineSource, /normalizeThumbnailFocus\(llmImage\?\.thumbnailFocus\)/);
  assert.match(pipelineSource, /thumbnailFocus,/);
});
