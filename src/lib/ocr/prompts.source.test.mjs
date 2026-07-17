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

test("event OCR prompt and pipeline preserve generic OCR facts", () => {
  const promptSource = readFileSync(new URL("./prompts.ts", import.meta.url), "utf8");
  const typesSource = readFileSync(new URL("./types.ts", import.meta.url), "utf8");
  const pipelineSource = readFileSync(new URL("./pipeline.ts", import.meta.url), "utf8");

  assert.match(promptSource, /OCR facts: return ocrFacts/);
  assert.match(promptSource, /venueName/);
  assert.match(promptSource, /Graduation flyers: graduate\/honoree names belong in title only/);
  assert.match(promptSource, /return venueName as null instead of copying that title/);
  assert.match(typesSource, /venueName\?: string \| null/);
  assert.match(pipelineSource, /llmImage\.venueName/);
  assert.match(promptSource, /meaningful flyer detail not already represented/);
  assert.match(promptSource, /"ocrFacts": Array<\{ "label": string, "value": string \}>\|null/);
  assert.match(typesSource, /ocrFacts\?: OcrFact\[\] \| null/);
  assert.match(pipelineSource, /normalizeOcrFacts\(llmImage\?\.ocrFacts \|\| llmImage\?\.facts\)/);
  assert.match(pipelineSource, /extractCommonOcrFactsFromFlyerText\(raw\)/);
  assert.match(pipelineSource, /ocrFacts: ocrFacts\.length \? ocrFacts : null/);
});

test("event OCR prompt separates host/org from venue place", () => {
  const promptSource = readFileSync(new URL("./prompts.ts", import.meta.url), "utf8");

  assert.match(promptSource, /ADDRESS \/ VENUE \(strict host ≠ place\)/);
  assert.match(promptSource, /A top-of-flyer brand\/org alone is NOT the venue/);
  assert.match(promptSource, /Pompano Joes Beach Access/);
  assert.match(promptSource, /Never put the organizer\/header brand in venueName/);
  assert.match(promptSource, /Prefer null venue over guessing the host's facility/);
  assert.match(
    promptSource,
    /Never put parking notes, overflow parking, or driving directions in address/,
  );
  assert.doesNotMatch(
    promptSource,
    /For example, "US Gold Gymnastics" goes in venueName and the street\/city line goes in address/,
  );
});

test("event OCR prompt keeps RSVP contact guidance generic", () => {
  const promptSource = readFileSync(new URL("./prompts.ts", import.meta.url), "utf8");

  assert.doesNotMatch(promptSource, /Questions\? Text \(555\)/);
  assert.match(promptSource, /Classify contact-instruction labels before assigning fields/);
  assert.match(promptSource, /When a contact-instruction line has a phone\/email\/link/);
  assert.match(promptSource, /use any nearby host\/sponsor line for hostName/);
});

test("event OCR prompt separates food vendor menu facts from location and RSVP", () => {
  const promptSource = readFileSync(new URL("./prompts.ts", import.meta.url), "utf8");

  assert.match(promptSource, /Food truck\/vendor\/school visit flyers/);
  assert.match(promptSource, /Menu Prices/);
  assert.match(promptSource, /Flavors/);
  assert.match(promptSource, /Do not put prices or flavor names in address\/location\/venueName/);
  assert.match(promptSource, /leave RSVP fields null/);
});
