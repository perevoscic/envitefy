import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(path, "utf8");

test("football restores public landing and design-first creation routes", () => {
  assert.match(read("src/app/football/page.tsx"), /<FootballLanding \/>/);
  assert.match(read("src/app/event/football/page.tsx"), /<FootballDesignGallery \/>/);
  assert.match(read("src/app/football/templates/page.tsx"), /<FootballDesignGallery \/>/);
  assert.match(read("src/app/event/football/page.tsx"), /params.append\(key, item\)/);
  assert.match(read("src/app/event/football/page.tsx"), /\/event\/football\/customize\?/);
  assert.match(read("src/app/sitemap.ts"), /path: "\/football"/);
  const middleware = read("src/middleware.ts");
  assert.doesNotMatch(middleware, /url.search = "\?sport=football"/);
  assert.match(middleware, /normalizedPathname === "\/event\/football\/customize"/);
  assert.match(middleware, /normalizedPathname === "\/event\/football-season\/customize"/);
});

test("football uses shared gallery loading and an inert artwork picker", () => {
  assert.match(read("src/components/football-season-templates/FootballDesignGallery.tsx"), /<EventDesignGallery/);
  const picker = read("src/components/football-season-templates/TemplateSelector.tsx");
  assert.match(picker, /<TemplateAutoLoader[^>]*scrollRoot=\{scrollRoot\}/);
  assert.match(picker, /<TemplateScrollToTop scrollRoot=\{scrollRoot\}/);
  assert.match(picker, /<FootballThumbnail/);
  assert.match(read("src/components/football-season-templates/FootballThumbnail.tsx"), /scaled=\{false\}/);
  assert.ok(fs.existsSync("public/images/football/templates/launchpad-editorial.webp"));
});

test("football selection initializes the editor and Cancel protects saved work", () => {
  const editor = read("src/app/event/football-season/customize/page.tsx");
  assert.match(editor, /isGymMeetTemplateId\(selected\) \? selected : DEFAULT_GYM_MEET_TEMPLATE_ID/);
  assert.match(editor, /ownerEventEditorReturnHref\(search\)/);
  assert.match(editor, /buildEventPath\(editEventId, undefined, \{ tab: "event" \}\)/);
  assert.match(editor, /requestLeave\(\(\) =>/);
  assert.doesNotMatch(editor, /method: "DELETE"/);
  assert.match(editor, /useManualEventProgress\(/);
});
