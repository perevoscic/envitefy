import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const customizePages = [
  "appointments",
  "baby-showers",
  "birthdays",
  "cheerleading",
  "dance-ballet",
  "football-season",
  "gender-reveal",
  "general",
  "gymnastics",
  "soccer",
  "special-events",
  "sport-events",
  "weddings",
  "workshops",
].map((eventType) => ({
  eventType,
  source: readFileSync(new URL(`./${eventType}/customize/page.tsx`, import.meta.url), "utf8"),
}));

const legacyTemplateEditors = ["CheerleadingTemplate", "DanceBalletTemplate"].map(
  (templateName) => ({
    eventType: templateName,
    source: readFileSync(
      new URL(`../../components/event-templates/${templateName}.tsx`, import.meta.url),
      "utf8",
    ),
  }),
);

test("event customize previews fill the responsive workspace", () => {
  for (const { eventType, source } of customizePages) {
    assert.match(source, /^(?:\/\/ @ts-nocheck\s*)?["']use client["'];/, `${eventType} remains a client editor`);
    assert.match(source, /<EventEditorWorkspace/, `${eventType} uses the shared editor`);
    assert.match(source, /useEventPageEditor\(/, `${eventType} uses the shared save lifecycle`);
    assert.match(source, /EventEditorFields/, `${eventType} uses the same fields and section controls`);
    assert.match(source, /sectionEditors=\{(?:\{|sectionEditors\})/, `${eventType} supplies scoped inline section editors`);
    assert.doesNotMatch(source, /<LegacyTemplateDraftButton|const handlePublish\s*=/, `${eventType} cannot maintain another save workflow`);
  }
  for (const { eventType, source } of legacyTemplateEditors) {
    assert.doesNotMatch(source, /function _?createSimpleCustomizePage|const MenuCard\s*=/, `${eventType} cannot retain an unused legacy editor`);
    assert.match(source, /export \{\s*config,/, `${eventType} keeps reusable section configuration`);
  }
});

test("native and custom editors keep section management separate from hero layout", () => {
  const workspace = readFileSync(new URL("../../components/events/EventEditorWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /<EventSectionPalette\s*\/>/);
  assert.match(workspace, /<EventPageLayoutPicker/);
  const custom = readFileSync(new URL("../../components/events/custom/EventCustomEditor.tsx", import.meta.url), "utf8");
  assert.match(custom, /<EventSectionBuilderProvider/);
  assert.match(custom, /<EventSectionPalette\s*\/>/);
  assert.match(custom, /<CustomEventLayoutPicker/);
  const native = readFileSync(new URL("../../components/events/EventPageLayoutPicker.tsx", import.meta.url), "utf8");
  assert.match(native, /<EventHeroLayoutPicker/);
  assert.doesNotMatch(native, /CustomEventLayoutPicker|Template layout|original section arrangement|mode="sections"/);
  const customPicker = readFileSync(new URL("../../components/events/custom/CustomEventLayoutPicker.tsx", import.meta.url), "utf8");
  assert.match(customPicker, /<EventHeroLayoutPicker/);
  assert.doesNotMatch(customPicker, /EVENT_DESIGN_LAYOUT_OPTIONS|Section layout|Sections in two columns|Information cards in two columns/);
  const picker = readFileSync(new URL("../../components/events/EventHeroLayoutPicker.tsx", import.meta.url), "utf8");
  assert.match(picker, /EVENT_HERO_LAYOUT_PRESETS/);
  assert.doesNotMatch(picker, /<(?:select|input|textarea)\b/, "hero layout consists of premade thumbnail buttons");
  assert.doesNotMatch(picker, /EVENT_DESIGN_LAYOUT_OPTIONS|Section layout|Sections in two columns|Information cards in two columns/);
});

test("the common workspace reserves one desktop column and switches mounted views on mobile", () => {
  const shell = readFileSync(new URL("../../components/events/event-editor.module.css", import.meta.url), "utf8");
  assert.match(shell, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(320px, 400px\)/);
  assert.match(shell, /@media \(max-width: 767px\)/);
  assert.match(shell, /data-mobile-editing="true"[\s\S]*display: none/);

  const globals = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(
    globals,
    /\.nav-chrome-mobile-drawer,\s*\.nav-chrome-footer-trigger\s*\{\s*position:\s*relative/,
    "global drawer styling must not override responsive position utilities",
  );
});

test("legacy wedding edit route verifies ownership before opening the current editor", () => {
  const page = readFileSync(new URL("./weddings/customize/[id]/page.tsx", import.meta.url), "utf8");


  assert.match(page, /event\.user_id !== userId/);
  assert.match(page, /redirect\(resolveEditHref\(event\.id, event\.data, event\.title\)\)/);
  assert.doesNotMatch(page, /max-w-6xl/);
  assert.doesNotMatch(page, /WeddingCustomizeClient/);
});

test("category editors retain the earlier layout, typography inside Design and separate RSVP settings", () => {
  for (const { eventType, source } of customizePages) {
    assert.doesNotMatch(source, /<EventEditorToolsRow wrap>|<EventEditorSharedTools/, `${eventType} cannot substitute an icon grid for the earlier menu`);
    assert.doesNotMatch(source, /title="Font style"/, `${eventType} has no separate Font style tile`);
    assert.match(source, /renderRsvpEditor/, `${eventType} retains RSVP editing`);
    if (eventType !== "gymnastics") assert.match(source, /const renderDesignEditor[\s\S]*?<EventEditorFontStyle \/>/, `${eventType} places font styling inside Design`);
  }
  const workspace = readFileSync(new URL("../../components/events/EventEditorWorkspace.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(workspace, /title="Font style"|sharedToolsVisible/);
  const custom = readFileSync(new URL("../../components/events/custom/EventCustomEditor.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(custom, /id: "font-style"/);
  assert.match(custom, /id: "design"[\s\S]*?<FontPairingSelect/);
  assert.match(custom, /id: "rsvp",/);
});

test("every native event type shares the RSVP header toggle and hides settings without clearing them", () => {
  for (const { eventType, source } of customizePages) {
    assert.match(source, /<EventEditorRsvpSection[^>]*enabled=\{data\.rsvp(?:Enabled|\.isEnabled)\}/, `${eventType} uses the shared RSVP behavior`);
  }
  const section = readFileSync(new URL("../../components/events/EventEditorRsvpSection.tsx", import.meta.url), "utf8");
  assert.match(section, /action=\{toggle\}/);
  assert.match(section, /hidden=\{!enabled\}/);
  assert.doesNotMatch(section, /rsvpDeadline:|rsvpEmail:|rsvpPhone:/);
});
