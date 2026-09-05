import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio prompt includes category-specific and anti-hallucination guardrails", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(source, /function buildStudioThemeFramingGuidance\(details: EventDetails\)/);
  assert.match(source, /function buildStudioCategoryGuardrails\(details: EventDetails\)/);
  assert.match(source, /Generate a birthday invitation image\./);
  assert.match(source, /Generate a wedding invitation image\./);
  assert.match(source, /Generate a game day invitation image\./);
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
    /Apply the Design Idea to artwork, palette, composition, mood, and themeStyle while still expressing the selected category clearly\./,
  );
  assert.match(
    source,
    /Use Event Details as the source for guest-facing specificity, invitation copy, and factual grounding\. Do not let Design Idea-only nouns become visible copy\./,
  );
  assert.match(
    source,
    /If an important visual detail is missing, keep it generic and restrained instead of inventing specifics\./,
  );
  assert.match(
    source,
    /Never fabricate names, phone numbers, addresses, schedules, or event copy\./,
  );
  assert.match(
    source,
    /Do not hallucinate team logos, mascots, scoreboard text, jersey numbers, sponsor marks, branded venue signage, or specific players\./,
  );
  assert.match(
    source,
    /Frame it as an upcoming educational visit rather than a souvenir or tourism poster, and avoid making one specific student group feel like they authored the invite unless reference photos were provided\./,
  );
  assert.match(
    source,
    /Keep the concept future-facing and destination-led; do not imply that the pictured students designed, printed, or are personally presenting the invitation\./,
  );
  assert.match(source, /const categoryGuardrails = buildStudioCategoryGuardrails\(details\);/);
  assert.match(source, /return \{\s*mode,\s*surface,\s*product,\s*event:/s);
  assert.match(source, /category:\s*details\.category,/);
  assert.match(source, /ageOrMilestone:\s*getAgeOrMilestone\(details\)\s*\|\|\s*null,/);
  assert.match(source, /const designIdea = sanitizeStudioDesignIdea\(details\.theme\);/);
  assert.match(source, /userIdea:\s*designIdea\s*\|\|\s*null,/);
  assert.match(
    source,
    /subjectTransformMode:\s*sanitizedGuestImageUrls\.length > 0 \|\|\s*sanitizedPropertyImageUrls\.length > 0\s*\?\s*"premium_makeover"\s*:\s*undefined,/,
  );
  assert.match(
    source,
    /likenessStrength:\s*sanitizedGuestImageUrls\.length > 0 \|\|\s*sanitizedPropertyImageUrls\.length > 0\s*\?\s*details\.likenessStrength\s*:\s*undefined,/,
  );
  assert.match(
    source,
    /visualStyleMode:\s*sanitizedGuestImageUrls\.length > 0 \|\|\s*sanitizedPropertyImageUrls\.length > 0\s*\?\s*details\.visualStyleMode\s*:\s*undefined,/,
  );
  assert.match(
    source,
    /const imageFinishPreset = resolveStudioImageFinishPreset\(\s*details\.category,\s*details\.imageFinishPreset,\s*\);/s,
  );
  assert.match(
    source,
    /const imageFinishPresetDirection = imageFinishPreset\s*\?\s*`Selected image finish preset: \$\{imageFinishPreset\.label\}\. Apply a \$\{imageFinishPreset\.label\} finish with \$\{imageFinishPreset\.description\}\.`\s*:\s*"";/s,
  );
  assert.match(source, /visualPreferences:\s*clean\(details\.visualPreferences\)\s*\|\|\s*null,/);
  assert.match(
    source,
    /style:\s*\[\s*visualDirection,\s*guestPhotoHint,[\s\S]*?imageFinishPresetDirection,\s*internalInstructions,\s*refinement,[\s\S]*?product === "live_card" \? studioGuardrails[\s\S]*?\.filter\(Boolean\)\s*\.join\("\. "\)/s,
  );
  assert.match(source, /imageFinishPreset:\s*imageFinishPreset\?\.label,/);
});

test("studio public copy strips internal generation instructions from descriptions and share notes", () => {
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");
  const promptSource = readSource("src/lib/studio/prompts.ts");
  const buildDescriptionMatch = builderSource.match(
    /export function buildDescription\(details: EventDetails\) \{[\s\S]*?\n\}/,
  );

  assert.ok(buildDescriptionMatch, "buildDescription should be present");
  assert.doesNotMatch(buildDescriptionMatch[0], /details\.specialInstructions/);
  assert.match(
    builderSource,
    /const internalInstructions = clean\(details\.specialInstructions\);/,
  );
  assert.match(
    builderSource,
    /stripStudioInternalInstructions\(previous\?\.description\) \|\|\s*buildDescription\(details\)/,
  );
  assert.match(
    builderSource,
    /stripStudioInternalInstructions\(previous\?\.interactiveMetadata\?\.shareNote\) \|\|\s*publicSocialCaption/,
  );
  assert.match(builderSource, /\\bUse the \[\^\.\]\{1,80\}\? Envitefy template family\\\.\?/);
  assert.match(
    builderSource,
    /\\bPreserve the full event flow in the generated live card and guest-facing details\\\.\?/,
  );
  assert.match(promptSource, /function stripInternalInstructionCopy/);
  assert.match(promptSource, /const trimmed = stripInternalInstructionCopy\(value\);/);
});

test("studio product contracts separate live-card title art from typeset flyers and website heroes", () => {
  const prompts = readSource("src/lib/studio/product-prompts.ts");
  const contracts = readSource("src/lib/studio/product-contract.ts");
  assert.match(prompts, /complete visible-text whitelist/);
  assert.match(prompts, /No visible words, letters, numbers/);
  assert.match(contracts, /bottom 30% free/);
  assert.match(contracts, /5 × 7 inch printable flyer/);
  assert.match(contracts, /Text-free website hero/);
});
