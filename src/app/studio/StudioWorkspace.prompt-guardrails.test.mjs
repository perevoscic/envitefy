import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio prompt includes category-specific and anti-hallucination guardrails", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(source, /function buildStudioThemeFramingGuidance\(details: EventDetails\)/);
  assert.match(source, /function buildStudioCategoryGuardrails\(details: EventDetails\)/);
  assert.match(source, /Generate a birthday invitation image\./);
  assert.match(source, /Generate a wedding invitation image\./);
  assert.match(
    source,
    /Interpret the user's theme words as a birthday-party version of that idea, not a generic standalone scene\./,
  );
  assert.match(
    source,
    /You may add generic category-appropriate celebration decor and styling cues when needed to make the selected event type obvious/,
  );
  assert.match(
    source,
    /Do not hallucinate specific people, animals, venue features, branded signage, logos/,
  );
  assert.match(
    source,
    /Treat the user's words as the theme of the invitation, while still expressing the selected category clearly\./,
  );
  assert.match(
    source,
    /If an important visual detail is missing, keep it generic and restrained instead of inventing specifics\./,
  );
  assert.match(
    source,
    /Never fabricate names, phone numbers, addresses, schedules, or event copy\./,
  );
  assert.match(source, /const categoryGuardrails = buildStudioCategoryGuardrails\(details\);/);
  assert.match(source, /return \{\s*mode,\s*surface,\s*event:/s);
  assert.match(source, /category:\s*details\.category,/);
  assert.match(source, /ageOrMilestone:\s*getAgeOrMilestone\(details\)\s*\|\|\s*null,/);
  assert.match(source, /userIdea:\s*clean\(details\.theme\)\s*\|\|\s*null,/);
  assert.match(
    source,
    /style:\s*\[visualDirection, categoryGuardrails, refinement, studioGuardrails\]\s*\.filter\(Boolean\)\s*\.join\("\. "\)\s*\|\|\s*null/s,
  );
});

test("studio prompt sources keep the bottom overlay zone text-safe without reserving a fake footer", () => {
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");
  const promptSource = readSource("src/lib/studio/prompts.ts");

  assert.match(
    builderSource,
    /Keep important copy away from the bottom button area, but do not instruct the model to make that area visually empty or separated\./,
  );
  assert.match(promptSource, /Keep essential text out of the bottom action-button zone\./);
  assert.match(
    promptSource,
    /Let the background and artwork continue naturally behind the bottom buttons as full-bleed art\./,
  );
  assert.match(
    promptSource,
    /These layout instructions are not visible copy\. Never print phrases such as action buttons, button row, safe area, safe band, or any other instruction text in the artwork\./,
  );
  assert.match(
    promptSource,
    /Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom\./,
  );
  assert.match(
    promptSource,
    /The finished image must read first as a professional hosted event invitation, not merely a cinematic still, venue ad, mascot portrait, or mood board\./,
  );
  assert.match(
    promptSource,
    /If the concept uses a theater, cinema, screening, or movie-party setting, keep the staging physically correct: seats and audience face the screen, sightlines make sense, and screen-to-seat geometry is believable\./,
  );
  assert.match(
    promptSource,
    /Never show theater chairs or audience rows facing away from the screen or arranged in impossible directions relative to the screen\./,
  );
  assert.match(
    promptSource,
    /Do not invent marquee text, venue branding, logos, signage, or event facts that are not explicitly supported by the supplied details, approved invitation copy, or source image\./,
  );
  assert.match(promptSource, /Core creative inputs:/);
  assert.match(
    promptSource,
    /Treat the user's idea as the main creative concept when one is provided\./,
  );
  assert.match(
    promptSource,
    /Visible text is forbidden in the final raster for page\/live-card backgrounds\./,
  );
  assert.match(
    promptSource,
    /Preserve clean negative space and readable contrast through the upper and middle zones/,
  );
  assert.match(promptSource, /line\("Age or Milestone", event\.ageOrMilestone\)/);
  assert.match(promptSource, /line\("User Idea", event\.userIdea\)/);
  assert.doesNotMatch(
    builderSource,
    /Keep the lower button area visually clear and avoid placing important copy near the bottom of the card\./,
  );
  assert.doesNotMatch(
    promptSource,
    /Reserve roughly the bottom 28-30% of the card for app action buttons and overlays\./,
  );
  assert.doesNotMatch(
    promptSource,
    /The lower button area should be visually quiet: use mostly background art or empty space there, not copy-heavy content\./,
  );
  assert.doesNotMatch(
    promptSource,
    /Reserve a fully text-free safe band behind the bottom button row\./,
  );
});
