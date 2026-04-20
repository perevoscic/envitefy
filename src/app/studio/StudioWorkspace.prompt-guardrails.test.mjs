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
    /Treat the Design Idea as the theme of the invitation, while still expressing the selected category clearly\./,
  );
  assert.match(
    source,
    /Use Event Details only as supporting context for guest-facing specificity, invitation copy, and factual grounding\. Do not let Event Details override the Design Idea\./,
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
  assert.match(source, /return \{\s*mode,\s*surface,\s*event:/s);
  assert.match(source, /category:\s*details\.category,/);
  assert.match(source, /ageOrMilestone:\s*getAgeOrMilestone\(details\)\s*\|\|\s*null,/);
  assert.match(source, /userIdea:\s*clean\(details\.theme\)\s*\|\|\s*null,/);
  assert.match(
    source,
    /subjectTransformMode:\s*sanitizedGuestImageUrls\.length > 0 \? "premium_makeover" : undefined,/,
  );
  assert.match(
    source,
    /likenessStrength:\s*sanitizedGuestImageUrls\.length > 0 \? details\.likenessStrength : undefined,/,
  );
  assert.match(
    source,
    /visualStyleMode:\s*sanitizedGuestImageUrls\.length > 0 \? details\.visualStyleMode : undefined,/,
  );
  assert.match(
    source,
    /const imageFinishPreset = resolveStudioImageFinishPreset\(\s*details\.category,\s*details\.imageFinishPreset,\s*\);/s,
  );
  assert.match(
    source,
    /const imageFinishPresetDirection = imageFinishPreset\s*\?\s*`Selected image finish preset: \$\{imageFinishPreset\.label\}\. Apply a \$\{imageFinishPreset\.label\} finish with \$\{imageFinishPreset\.description\}\.`\s*:\s*"";/s,
  );
  assert.match(
    source,
    /style:\s*\[\s*visualDirection,\s*categoryGuardrails,\s*imageFinishPresetDirection,\s*refinement,\s*studioGuardrails,\s*\]\s*\.filter\(Boolean\)\s*\.join\("\. "\)\s*\|\|\s*null/s,
  );
  assert.match(source, /imageFinishPreset:\s*imageFinishPreset\?\.label,/);
});

test("studio prompt sources require baked-in invitation text while keeping the bottom action zone clear", () => {
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");
  const promptSource = readSource("src/lib/studio/prompts.ts");

  assert.match(
    builderSource,
    /For live cards, the invitation text should feel like part of the designed image itself, not a detached app overlay\./,
  );
  assert.match(
    builderSource,
    /Keep the copy concentrated in the upper and middle portions of the card\./,
  );
  assert.match(
    builderSource,
    /never place visible text, faux buttons, icons, chips, circles, bars, or device chrome in the bottom action-button area\./,
  );
  assert.match(
    builderSource,
    /Keep the top edge decorative too: no status bar, carrier text, clock text, battery icons, notches, camera cutouts, or phone chrome\./,
  );
  assert.match(
    promptSource,
    /Bake the invitation text directly into the image itself so it feels like part of the printed or designed artwork, not a separate overlay\./,
  );
  assert.match(
    promptSource,
    /Selected image finish preset: \$\{imageFinishPreset\.label\} - \$\{imageFinishPreset\.description\}\./,
  );
  assert.match(
    promptSource,
    /Treat the selected image finish preset as a high-priority finishing direction for mood, polish, lighting, palette handling, and contrast while still obeying the selected event type, approved event details, and the user's Design Idea\./,
  );
  assert.match(
    promptSource,
    /Create one single seamless full-bleed invitation image with one unified continuous scene from top to bottom\./,
  );
  assert.match(promptSource, /Do not split the composition into separate top and bottom scenes\./);
  assert.match(promptSource, /Never compose the image as top scene plus text band plus bottom scene\./);
  assert.match(
    promptSource,
    /Treat all visible text as integrated invitation typography inside the scene, not as interface chrome or floating app labels\./,
  );
  assert.match(
    promptSource,
    /Use a restrained premium invitation hierarchy: one clear headline, optional short subtitle or opening line, and short event-detail lines only when supported by the event details\./,
  );
  assert.match(
    promptSource,
    /Use at most one short supporting line beyond the title and event details\. Do not create body-paragraph blocks, prose descriptions, or multi-sentence copy sections\./,
  );
  assert.match(promptSource, /Do not repeat or duplicate any visible words or phrases in the image\./);
  assert.match(
    promptSource,
    /Do not duplicate or mirror scene elements\. Avoid repeated tables, repeated floral arrangements, repeated gazebos, repeated desserts, repeated arches, repeated portraits, or second copies of the main scene stacked elsewhere in the card\./,
  );
  assert.match(
    promptSource,
    /Do not create an unrelated solid bar, footer slab, color block, green strip, dark strip, or banner panel near the bottom of the card\./,
  );
  assert.match(
    promptSource,
    /Do not generate any UI elements, interface overlays, app controls, buttons, icons, badges, arrows, floating controls, share symbols, chat symbols, phone symbols, plus buttons, camera buttons, circular controls, watermarks, or screenshot-style overlays\./,
  );
  assert.match(promptSource, /Approved invitation copy to use verbatim if visible text appears in the artwork:/);
  assert.match(
    promptSource,
    /Use only the approved invitation copy below for visible wording in the artwork\. Preserve spelling exactly and do not duplicate lines\./,
  );
  assert.match(promptSource, /The output must read as one clean continuous invitation image, not a screenshot, poster mockup, or app capture\./);
  assert.match(
    promptSource,
    /Let the background and artwork continue naturally behind the bottom buttons as full-bleed art\./,
  );
  assert.match(
    promptSource,
    /Keep the bottom area art-led and decorative, not blank, but never let it read like a mobile app UI or control tray\./,
  );
  assert.match(
    promptSource,
    /Keep the top edge art-led and decorative, not blank, but never let it read like a mobile status bar or phone frame\./,
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
    /Do not create a colored footer slab, tinted rectangle, or unrelated graphic block at the bottom edge\./,
  );
  assert.match(
    promptSource,
    /The finished result must still read first as a hosted invitation or greeting-card design, not a fan poster, character sheet, collage, or movie still\./,
  );
  assert.match(
    promptSource,
    /Keep the top edge free of faux phone UI: no carrier names, clock text, battery icons, signal icons, status icons, notches, camera cutouts, or device chrome\./,
  );
  assert.match(
    promptSource,
    /Keep the bottom action-button zone art-only and text-free\. End the final visible text line well above the bottom controls area\./,
  );
  assert.match(
    promptSource,
    /Treat the lower edge as artwork continuation behind the app action buttons\./,
  );
  assert.match(
    promptSource,
    /The lower zone must stay decorative rather than UI-like: do not invent buttons, icons, icon clusters, circular controls, pills, chips, chat bars, nav bars, progress dots, home indicators, or device chrome\./,
  );
  assert.match(
    promptSource,
    /Do not place captions, labels, taglines, schedule lines, location lines, decorative badges, or faux footer details in the bottom button area\./,
  );
  assert.match(
    promptSource,
    /Do not draw interface elements in the raster: no buttons, icons, circular controls, pill-shaped bars, chat inputs, nav bars, status bars, carrier labels, clock readouts, battery indicators, notches, home indicators, camera cutouts, or device chrome\./,
  );
  assert.match(
    promptSource,
    /Keep the typography elegant, readable, and invitation-first, not like a flyer app screenshot or a dense poster wall of text\./,
  );
  assert.match(promptSource, /Core creative inputs:/);
  assert.match(
    promptSource,
    /Treat the Design Idea as the main visual concept when one is provided\./,
  );
  assert.match(
    promptSource,
    /Let Event Details sharpen specificity and approved wording, but do not let them replace the Design Idea\./,
  );
  assert.match(
    promptSource,
    /Design Idea is private art direction, not default visible invitation copy\./,
  );
  assert.match(
    promptSource,
    /Do not quote, restate, or lightly paraphrase raw Design Idea wording as a title, subtitle, theme line, opening line, schedule line, or other visible invitation copy unless the user explicitly asked for that exact wording to appear\./,
  );
  assert.match(
    promptSource,
    /Never print raw Design Idea wording or prompt fragments in the artwork unless the user explicitly requested that exact phrase as visible copy\./,
  );
  assert.match(
    promptSource,
    /Visible invitation text is required in the final raster for page\/live-card images, but keep it sparse, readable, and intentionally designed\./,
  );
  assert.match(promptSource, /line\("Age or Milestone", event\.ageOrMilestone\)/);
  assert.match(promptSource, /line\("Design Idea", event\.userIdea\)/);
  assert.match(promptSource, /line\("Event Details", event\.description\)/);
  assert.match(promptSource, /line\("Image Finish Preset", imageFinishPreset\?\.label\)/);
  assert.match(
    promptSource,
    /Keep the top edge free of faux phone UI: no carrier names, clock text, battery icons, signal icons, status icons, notches, camera cutouts, or device chrome\./,
  );
  assert.doesNotMatch(promptSource, /Treat all visible text as post-production overlay, not part of the generated image\./);
  assert.doesNotMatch(promptSource, /Visible text is forbidden in the final raster for page\/live-card backgrounds\./);
  assert.doesNotMatch(promptSource, /Leave soft clean negative space where text and app controls can be placed later as overlays\./);
});
