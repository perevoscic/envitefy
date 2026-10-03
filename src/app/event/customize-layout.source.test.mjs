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
    assert.match(source, /sectionEditors=\{\{/, `${eventType} supplies scoped inline section editors`);
    assert.doesNotMatch(source, /<LegacyTemplateDraftButton|const handlePublish\s*=/, `${eventType} cannot maintain another save workflow`);
  }
  for (const { eventType, source } of legacyTemplateEditors) {
    assert.match(
      source,
      /flex-1 min-w-0 (?:min-h-0 )?relative overflow-y-auto scrollbar-hide/,
      `${eventType} should let the preview fill the desktop workspace without flex overflow`,
    );
    assert.match(
      source,
      /className="w-full min-w-0 (?:my-4 md:my-8|mb-12 md:mb-16)/,
      `${eventType} should keep the preview page fluid at desktop and mobile widths`,
    );
    assert.doesNotMatch(
      source,
      /max-w-\[calc\(100%-(?:40|420)px\)\]|xl:max-w-\[(?:1000|1120)px\]|md:mr-\[420px\]/,
      `${eventType} should not cap or double-reserve the preview width`,
    );
  }
});

test("native category pages share section and layout controls with generated and uploaded pages", () => {
  const workspace = readFileSync(new URL("../../components/events/EventEditorWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /<EventSectionPalette\s*\/>/);
  assert.match(workspace, /<EventPageLayoutPicker/);
  const custom = readFileSync(new URL("../../components/events/custom/EventCustomEditor.tsx", import.meta.url), "utf8");
  assert.match(custom, /<EventSectionBuilderProvider/);
  assert.match(custom, /<EventSectionPalette\s*\/>/);
  assert.match(custom, /<CustomEventLayoutPicker/);
  const native = readFileSync(new URL("../../components/events/EventPageLayoutPicker.tsx", import.meta.url), "utf8");
  assert.match(native, /<CustomEventLayoutPicker[\s\S]*mode="sections"/);
});

test("the common workspace reserves one desktop column and switches mounted views on mobile", () => {
  const shell = readFileSync(new URL("../../components/events/event-editor.module.css", import.meta.url), "utf8");
  assert.match(shell, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(320px, 400px\)/);
  assert.match(shell, /@media \(max-width: 767px\)/);
  assert.match(shell, /data-mobile-editing="true"[\s\S]*display: none/);
  for (const { eventType, source } of legacyTemplateEditors) {
    assert.match(
      source,
      /md:w-\[400px\] md:shrink-0/,
      `${eventType} should keep a stable 400px desktop editor column`,
    );
    assert.match(
      source,
      /absolute md:relative/,
      `${eventType} should overlay the editor on mobile and place it beside the preview on desktop`,
    );
  }

  const globals = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(
    globals,
    /\.nav-chrome-mobile-drawer,\s*\.nav-chrome-footer-trigger\s*\{\s*position:\s*relative/,
    "global drawer styling must not override responsive position utilities",
  );
});

test("legacy wedding edit route verifies ownership before opening the current editor", () => {
  const page = readFileSync(new URL("./weddings/customize/[id]/page.tsx", import.meta.url), "utf8");
  const client = readFileSync(
    new URL("./weddings/customize/[id]/WeddingCustomizeClient.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /event\.user_id !== userId/);
  assert.match(page, /redirect\(resolveEditHref\(event\.id, event\.data, event\.title\)\)/);
  assert.doesNotMatch(page, /max-w-6xl/);
  assert.match(client, /lg:grid-cols-\[minmax\(0,1fr\)_400px\]/);
});
