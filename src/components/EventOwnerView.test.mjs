import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const mocks = {
  "lucide-react": new Proxy({}, { get: () => (props) => React.createElement("svg", props) }),
  "next/navigation": { useRouter: () => ({}) },
  "@/app/sidebar-context": { useSidebar: () => ({}) },
  "@/components/EventDeleteModal": {
    __esModule: true,
    default: (props) => React.createElement("button", { "aria-label": props.ariaLabel }, "Delete"),
  },
  "@/components/EventResponseDashboard": { __esModule: true, default: () => "Guest responses" },
  "@/components/OwnerPreviewMobileTopbarSuppressor": { __esModule: true, default: () => null },
  "@/components/UnsavedProgressProvider": { useUnsavedProgress() {} },
  "@/components/studio/SharedStudioCardPage": { SharedStudioCardFrame: () => "Card artwork" },
  "@/lib/dashboard-data": { hasActionableRsvp: (data) => data?.rsvpEnabled === true },
  "@/lib/card-edit-client": {
    requestCardEdit() {
      throw new Error("Preview must not edit artwork");
    },
  },
  "@/utils/event-edit-route": {
    resolveEditHref: (id) => `/event/${id}?edit=${id}`,
    resolveArtworkEditHref: (_id, data) => (data?.coverImageUrl ? "/studio?editEvent=meet" : null),
  },
  "@/utils/event-tracking-client": { trackEventInteraction() {} },
};
function load(relative, cache = new Map()) {
  const file = path.resolve(relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  function require(name) {
    if (name in mocks) return mocks[name];
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/")
      ? path.resolve("src", name.slice(2))
      : path.resolve(path.dirname(file), name);
    return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync), cache);
  }
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const OwnerTools = load("src/components/EventOwnerTools.tsx").default;
const PreviewViewport = load("src/components/EventPreviewViewport.tsx").default;
const render = (data, initialTab = "design") =>
  renderToStaticMarkup(
    React.createElement(OwnerTools, {
      eventId: "meet",
      eventTitle: "Fright Invite",
      eventData: data,
      eventHref: "/event/meet",
      eventOwnerHref: "/event/meet",
      initialTab,
      numberOfGuests: 0,
    }),
  );

test("event pages open directly with owner actions and responsive device controls", () => {
  for (const data of [
    { category: "sport_gymnastics", createdVia: "meet-discovery" },
    { category: "wedding", primaryOutput: "event_page" },
    {
      primaryOutput: "event_page",
      coverImageUrl: "/hero.webp",
      publicEvent: { ownerDefaultSurface: "card" },
      studioCard: { imageUrl: "/hero.webp" },
    },
  ]) {
    const html = render(data);
    assert.match(html, /aria-label="Event actions"/);
    assert.match(html, /aria-label="Edit event"/);
    assert.match(html, /aria-label="Share event"/);
    assert.match(html, /aria-label="Delete event"/);
    assert.match(html, /aria-label="Back to My Events"/);
    assert.match(html, /fixed inset-0/);
    assert.doesNotMatch(
      html,
      /Manage your event|Your event page|Event basics|data-event-page-editor/,
    );
    assert.match(html, /aria-label="Desktop view"/);
    assert.match(html, /aria-label="iPad \/ tablet view"/);
    assert.match(html, /aria-label="Mobile view"/);
    assert.match(html, /preview=owner&amp;(?:returnTo=[^"&]+&amp;)?embed=dashboard-preview/);
    assert.doesNotMatch(html, /Edit card|Add card artwork|Design idea|Card artwork/);
    assert.match(html, /href="\/event\/meet\?edit=meet"/);
  }
});

test("Live Cards retain artwork editing and RSVP dashboards remain available", () => {
  const card = render({ primaryOutput: "live_card", coverImageUrl: "/card.webp" });
  assert.match(card, /Edit card/);
  assert.match(card, /Card artwork/);
  assert.doesNotMatch(card, /data-event-page-editor/);
  const dashboard = render({ primaryOutput: "event_page", rsvpEnabled: true }, "dashboard");
  assert.match(dashboard, /Guest responses/);
  assert.doesNotMatch(dashboard, /data-event-page-editor/);
});

test("guest previews keep device controls without the owner's event actions", () => {
  const html = renderToStaticMarkup(React.createElement(PreviewViewport, {
    title: "Event preview", src: "/event/test?preview=owner&embed=dashboard-preview", returnHref: "/", fullscreen: true,
  }));
  assert.match(html, /aria-label="Close preview"/);
  assert.match(html, /aria-label="Preview device"/);
  assert.doesNotMatch(html, /Edit event|Delete event|Event actions/);
});

test("gymnastics editor retains support for existing section links", () => {
  const route = readFileSync("src/app/event/[id]/page.tsx", "utf8");
  const editor = readFileSync("src/app/event/gymnastics/customize/page.tsx", "utf8");
  assert.match(route, /GYM_EVENT_EDITOR_VIEWS\.find/);
  assert.match(route, /&view=\$\{requestedEditorView\}/);
  assert.match(route, /discoveryEditConfig\s*\? \{ edit: row\.id, view: requestedEditorView \}/);
  assert.match(
    editor,
    /if \(\(!editEventId && !templateEditor\) \|\| loadingExisting\) return;[\s\S]*search\?\.get\("view"\)/,
  );
  assert.match(editor, /openedWorkspaceView\.current === key/);
  assert.match(editor, /openEditorView\(view\)/);
});
