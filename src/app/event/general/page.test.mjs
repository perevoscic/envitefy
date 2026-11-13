import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
const load = createRequire(import.meta.url)("../../../../scripts/lib/event-messages-test-loader.cjs");

test("General and holiday template choices open the current Event Page editor", () => {
  const Gallery = load("src/app/event/general/page.tsx", {
    "lucide-react": { CalendarDays: () => null },
    "next/navigation": { useSearchParams: () => new URLSearchParams("d=2026-10-15") },
    "@/components/events/custom/EventCustomEditor": () => null,
    "@/components/events/EventDesignGallery": ({ designs, getHref }) => React.createElement("div", null, designs.slice(0, 12).map(design => React.createElement("a", { key: design.id, href: getHref(design) }, design.name))),
  }).default;
  const html = renderToStaticMarkup(React.createElement(Gallery));
  assert.match(html, /\/event\/design\/customize\?templateId=/);
  assert.match(html, /d=2026-10-15/);
  assert.doesNotMatch(html, /\/event\/general\/customize/);
});

test("the old General address is a compatibility alias with no legacy editor implementation", () => {
  const source = readFileSync(new URL("./customize/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<EventCustomEditor/);
  assert.doesNotMatch(source, /createSimpleCustomizePage|GeneralEventsTemplate|renderHeadlineEditor|renderRsvpEditor/);
  const gallery = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(gallery, /EventCreateWysiwyg/);
});
