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

const customizeSurfaces = [...customizePages, ...legacyTemplateEditors];

test("event customize previews fill the responsive workspace", () => {
  for (const { eventType, source } of customizeSurfaces) {
    assert.match(
      source,
      /flex-1 min-w-0 (?:min-h-0 )?relative overflow-y-auto scrollbar-hide/,
      `${eventType} should let the preview fill the desktop workspace without flex overflow`,
    );
    assert.match(
      source,
      /className="w-full min-w-0 my-4 md:my-8/,
      `${eventType} should keep the preview page fluid at desktop and mobile widths`,
    );
    assert.doesNotMatch(
      source,
      /max-w-\[calc\(100%-(?:40|420)px\)\]|xl:max-w-\[(?:1000|1120)px\]|md:mr-\[420px\]/,
      `${eventType} should not cap or double-reserve the preview width`,
    );
  }
});

test("event customize drawers overlay mobile and reserve one desktop column", () => {
  for (const { eventType, source } of customizeSurfaces) {
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

test("legacy wedding edit route also uses the full responsive page", () => {
  const page = readFileSync(new URL("./weddings/customize/[id]/page.tsx", import.meta.url), "utf8");
  const client = readFileSync(
    new URL("./weddings/customize/[id]/WeddingCustomizeClient.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /className="min-h-screen w-full bg-slate-100"/);
  assert.doesNotMatch(page, /max-w-6xl/);
  assert.match(client, /lg:grid-cols-\[minmax\(0,1fr\)_400px\]/);
});
