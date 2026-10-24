import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ownerEventEditorReturnHref } from "../../lib/event-preview-viewport.ts";

const read = (path) => fs.readFileSync(path, "utf8");

test("football restores public landing and design-first creation routes", () => {
  assert.match(read("src/app/football/page.tsx"), /<FootballLanding \/>/);
  assert.match(read("src/app/event/football/page.tsx"), /<FootballDesignGallery \/>/);
  assert.match(
    read("src/app/football/templates/page.tsx"),
    /<FootballDesignGallery publicView \/>/,
  );
  assert.match(read("src/app/event/football/page.tsx"), /params.append\(key, item\)/);
  assert.match(read("src/app/event/football/page.tsx"), /\/event\/football\/customize\?/);
  assert.match(read("src/app/sitemap.ts"), /path: "\/football"/);
  const middleware = read("src/middleware.ts");
  assert.doesNotMatch(middleware, /url.search = "\?sport=football"/);
  assert.match(middleware, /normalizedPathname === "\/event\/football\/customize"/);
  assert.match(middleware, /normalizedPathname === "\/event\/football-season\/customize"/);
});

test("football uses shared gallery loading and an inert artwork picker", () => {
  assert.match(
    read("src/components/football-season-templates/FootballDesignGallery.tsx"),
    /<EventDesignGallery/,
  );
  const picker = read("src/components/football-season-templates/TemplateSelector.tsx");
  assert.match(picker, /<TemplateAutoLoader[^>]*scrollRoot=\{scrollRoot\}/);
  assert.match(picker, /<TemplateScrollToTop scrollRoot=\{scrollRoot\}/);
  assert.match(picker, /<FootballThumbnail/);
  assert.match(
    read("src/components/football-season-templates/FootballThumbnail.tsx"),
    /scaled=\{false\}/,
  );
  assert.ok(fs.existsSync("public/images/football/templates/launchpad-editorial.webp"));
});

test("football selection initializes the editor and Cancel protects saved work", () => {
  const editor = read("src/app/event/football-season/customize/page.tsx");
  const lifecycle = read("src/components/events/useEventPageEditor.ts");
  const workspace = read("src/components/events/EventEditorWorkspace.tsx");
  assert.match(
    editor,
    /isGymMeetTemplateId\(selected\) \? selected : DEFAULT_GYM_MEET_TEMPLATE_ID/,
  );
  assert.match(editor, /const editor = useEventPageEditor\(\{/);
  assert.match(editor, /eventId: editEventId/);
  assert.match(editor, /<EventEditorWorkspace[\s\S]*?editor=\{editor\}/);
  assert.match(workspace, /editor\.cancel\(\)/);
  assert.match(lifecycle, /ownerEventEditorReturnHref\(search\)/);
  assert.match(
    lifecycle,
    /buildEventPath\(id\.current, loaded\?\.title, \{ tab: "event" \}, loaded\?\.public_slug\)/,
  );
  const cancel = lifecycle.split("const cancel = () => {")[1]?.split("return {")[0];
  assert.ok(cancel, "the shared editor exposes a cancellation handler");
  assert.match(cancel, /const href = published/);
  assert.match(cancel, /progress\.requestLeave\(\(\) =>/);
  assert.match(cancel, /router\.push\(href\)/);
  assert.doesNotMatch(cancel, /perform\(|fetch\(|method:|\.remove\(|\.delete\(/);
  assert.match(editor, /requestLeave\(\(\) =>/);
  assert.doesNotMatch(editor, /method: "DELETE"/);
  assert.match(lifecycle, /const progress = useEventProgress\(\{/);
  assert.match(lifecycle, /snapshot: content/);
});

test("football owner return links preserve the saved event canvas and reject external destinations", () => {
  const search = new URLSearchParams({
    editor: "menu",
    edit: "football-season-123",
    returnTo: "/event/hawthorne-football?preview=owner&embed=dashboard-preview#schedule",
  });
  assert.equal(ownerEventEditorReturnHref(search), "/event/hawthorne-football?tab=event#schedule");
  assert.equal(
    ownerEventEditorReturnHref(
      new URLSearchParams({
        editor: "menu",
        edit: "football-season-123",
        returnTo: "https://example.com/leave",
      }),
    ),
    "/event/football-season-123?tab=event",
  );
  assert.equal(ownerEventEditorReturnHref(new URLSearchParams("edit=football-season-123")), null);
});
