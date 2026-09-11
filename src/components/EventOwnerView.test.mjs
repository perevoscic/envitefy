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
  "@radix-ui/react-dialog": {
    Root: ({ open, children }) => open ? children : null,
    Portal: ({ children }) => children,
    Overlay: () => null,
    Content: ({ children, className, style, "data-artwork-preview": artwork }) => React.createElement("div", { role: "dialog", className, style, "data-artwork-preview": artwork }, children),
    Title: ({ children }) => React.createElement("h2", null, children),
    Close: ({ children }) => children,
  },
  "lucide-react": new Proxy({}, { get: () => (props) => React.createElement("svg", props) }),
  "next/navigation": { useRouter: () => ({}) },
  "@/app/sidebar-context": { useSidebar: () => ({}) },
  "@/components/EventDeleteModal": {
    __esModule: true,
    default: (props) => React.createElement("button", { "aria-label": props.ariaLabel }, "Delete"),
  },
  "@/components/EventResponseDashboard": { __esModule: true, default: () => "Guest responses" },
  "@/components/OwnerPreviewMobileTopbarSuppressor": {
    __esModule: true,
    default: () => React.createElement("span", { "data-navigation-suppressed": true }),
  },
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
  let code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  if (file.endsWith("/EventOwnerTools.tsx")) code += "\nexports.TestProductViewer = OwnerProductViewer;";
  function require(name) {
    if (name === "./OwnerPreviewMobileTopbarSuppressor") {
      return mocks["@/components/OwnerPreviewMobileTopbarSuppressor"];
    }
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
const ProductViewer = load("src/components/EventOwnerTools.tsx").TestProductViewer;
const PreviewViewport = load("src/components/EventPreviewViewport.tsx").default;
const { withDirectRsvpInvitationData } = load("src/lib/studio/live-card-rsvp.ts");
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
    assert.match(html, /data-owner-event-view/);
    assert.match(html, /left-\[var\(--app-sidebar-width,0px\)\]/);
    assert.doesNotMatch(html, /data-navigation-suppressed/);
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

test("Live Cards and flyers open in Design without fullscreen or device controls", () => {
  for (const primaryOutput of ["live_card", "digital_flyer", "invitation", "printable_flyer"]) {
    const html = render({
      primaryOutput,
      coverImageUrl: "/card.webp",
      publicEvent: { ownerDefaultSurface: "event" },
    });
    assert.match(html, /Card artwork/);
    assert.match(html, /Edit card/);
    assert.match(html, /Preview changes/);
    assert.doesNotMatch(html, /<iframe|Preview device|data-navigation-suppressed|data-owner-event-view/);
  }
});

test("guest previews keep device controls without the owner's event actions", () => {
  const html = renderToStaticMarkup(React.createElement(PreviewViewport, {
    title: "Event preview", src: "/event/test?preview=owner&embed=dashboard-preview", returnHref: "/", fullscreen: true,
  }));
  assert.match(html, /aria-label="Close preview"/);
  assert.match(html, /aria-label="Preview device"/);
  assert.match(html, /data-navigation-suppressed/);
  assert.doesNotMatch(html, /Edit event|Delete event|Event actions/);
});

test("opening artwork previews keeps native cards in a bounded dialog; event previews retain devices", () => {
  const props = {
    open: true, heading: "Preview card", eventId: "meet", eventTitle: "Friday Night",
    publicUrl: "/card/meet", embeddedPreviewUrl: "/event/meet?preview=owner&embed=dashboard-preview",
    onClose() {}, onReturnFocus() {},
  };
  const card = renderToStaticMarkup(React.createElement(ProductViewer, {
    ...props, preview: { surface: "studio-card", imageUrl: "/card.webp", invitationData: { heroTextMode: "image" } },
  }));
  assert.match(card, /data-artwork-preview/);
  assert.match(card, /Card artwork/);
  assert.match(card, /aria-label="Close preview"/);
  assert.doesNotMatch(card, /<iframe|Preview device|data-navigation-suppressed|h-\[100dvh\]/);
  const event = renderToStaticMarkup(React.createElement(ProductViewer, {
    ...props, preview: { surface: "event-page", imageUrl: "/hero.webp" },
  }));
  assert.match(event, /aria-label="Preview device"/);
  assert.match(event, /data-navigation-suppressed/);
  assert.doesNotMatch(event, /data-artwork-preview/);
});

test("owner and public Live Cards share RSVP metadata without losing other guest details", () => {
  const invitationData = {
    eventDetails: { startTime: "19:00", location: "Panther Stadium", registryLink: "https://example.com/gifts" },
  };
  for (const data of [{ rsvpEnabled: true }, { rsvpEnabled: "true" }, { rsvp: { direct: true } }]) {
    const result = withDirectRsvpInvitationData({
      invitationData,
      row: { id: "meet", data, public_slug: "friday-night" },
      title: "Friday Night",
    });
    assert.deepEqual(result.eventDetails, {
      ...invitationData.eventDetails,
      eventId: "meet",
      rsvpEnabled: true,
      rsvpMode: "envitefy",
      rsvpName: "Host",
      rsvpUrl: "/event/friday-night#event-rsvp",
    });
  }
  assert.equal(withDirectRsvpInvitationData({
    invitationData, row: { id: "meet", data: {} }, title: "Friday Night",
  }), invitationData);
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
