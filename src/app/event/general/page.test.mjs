import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import loadTs from "../../../../scripts/lib/event-messages-test-loader.cjs";

function load(file, mocks = {}, cache = new Map()) {
  return loadTs(file, {
    "lucide-react": new Proxy({}, { get: () => () => null }),
    ...mocks,
  }, cache);
}
const { GENERAL_EVENT_DESIGNS, getGeneralEventDesign } = load("src/lib/general-event-designs.ts");
const { AVAILABLE_HOLIDAY_TEMPLATE_IDS } = load("src/assets/holiday-template-availability.ts");
const { getHolidayBackground, getHolidayBackgroundChoice } = load("src/lib/holiday-backgrounds.ts");
const { config } = load("src/components/event-templates/GeneralEventsTemplate.tsx");
const Container = ({ children }) => React.createElement("div", null, children);
const Empty = () => null;

test("every General Event template has real artwork and the matching editor palette", () => {
  assert.equal(GENERAL_EVENT_DESIGNS.length, 12 + AVAILABLE_HOLIDAY_TEMPLATE_IDS.length);
  assert.equal(new Set(GENERAL_EVENT_DESIGNS.map((design) => design.id)).size, GENERAL_EVENT_DESIGNS.length);
  for (const design of GENERAL_EVENT_DESIGNS) {
    assert.ok(existsSync(path.join("public", design.artwork)), design.artwork);
    assert.deepEqual(getGeneralEventDesign(design.id), design);
    assert.deepEqual(config.themes.find((theme) => theme.id === design.id), { id: design.id, name: design.name, ...design.theme });
  }
  assert.equal(config.themes[0].id, "civic_blue", "legacy default stays intact");
  assert.equal(getGeneralEventDesign("missing-template"), undefined);
});

test("General Events renders template links directly to the editor and preserves the chosen date", () => {
  const Gallery = load("src/app/event/general/page.tsx", {
    "next/navigation": { useSearchParams: () => new URLSearchParams("d=2026-10-15"), useRouter: () => ({}) },
    "next/link": ({ children, prefetch: _prefetch, ...props }) => React.createElement("a", props, children),
    "@/components/EventCreateWysiwyg": Empty,
    "next/dynamic": () => Empty,
    "next-auth/react": { useSession: () => ({ status: "authenticated" }) },
  }).default;
  const markup = renderToStaticMarkup(React.createElement(Gallery));
  for (const design of GENERAL_EVENT_DESIGNS.slice(0, 12)) {
    assert.ok(markup.includes(`/event/general/customize?templateId=${design.id}&amp;d=2026-10-15`));
  }
  assert.match(markup, /Search designs/);
  assert.match(markup, /Create with Envitefy/);
  assert.doesNotMatch(markup, /\/chat|customize\/ai/);
});

test("choosing a template opens the real editor with its artwork, theme, and empty event facts", async (t) => {
  const representative = GENERAL_EVENT_DESIGNS.filter((design, index) => index < 22 || (index - 12) % 10 === 0);
  let progress, selectedDesign;
  const Editor = load("src/app/event/general/customize/page.tsx", {
      "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams({ templateId: selectedDesign.id }) },
      "next/image": ({ src, alt }) => React.createElement("img", { src, alt }),
      "@/components/EventCanvas": Container,
      "@/components/events/TemplateImageTone": Container,
      "@/components/events/HeroImageEditor": Empty,
      "@/components/event-create/CreationTemplateGallery": Empty,
      "@/components/events/useCreationEditorHydration": { useCreationEditorHydration: () => true },
      "@/components/ScrollHandoffContainer": Container,
      "@/components/branding/EnvitefyEventBranding": Empty,
      "@/components/event-templates/EventGuestActions": Empty,
      "@/components/event-templates/EventGuestPlanningEditor": Empty,
      "@/components/event-templates/EventGuestPlanningNotes": Empty,
      "@/components/events/useEventPageEditor": { useEventPageEditor: (options) => { progress = options; return { ready: true, authenticated: true }; } },
      "next/link": ({ children, ...props }) => React.createElement("a", props, children),
      "@/components/UnsavedProgressProvider": { useProgressNavigation: () => ({ allowNavigation() {} }) },
      "@/hooks/useMobileDrawer": { useMobileDrawer: () => ({ mobileMenuOpen: true, previewTouchHandlers: {}, drawerTouchHandlers: {} }) },
      "@/utils/media-upload-client": { persistImageMediaValue() { throw new Error("Opening a template must not upload"); } },
  }).default;
  for (const design of representative) {
    await t.test(design.id, () => {
      selectedDesign = design;
      const markup = renderToStaticMarkup(React.createElement(Editor));
      assert.equal(progress.snapshot.themeId, design.id, "selected design identity");
      assert.equal(progress.snapshot.data.hero, design.artwork, "selected artwork");
      let expectedPalette = { backgroundColor: design.background, color: design.ink };
      if (design.occasion) {
        const background = getHolidayBackground(design.id);
        assert.ok(background, "holiday template has an authored background");
        assert.equal(progress.snapshot.data.creationCollection, "holidays-seasonal");
        assert.equal(progress.snapshot.data.holidayOccasion, design.occasion);
        assert.deepEqual(progress.snapshot.data.pageBackground, getHolidayBackgroundChoice(background.id, "template"), "the template background choice is retained for saving");
        assert.ok(markup.includes(`data-holiday-background="${background.id}"`), "rendered background matches the saved preset");
        expectedPalette = { backgroundColor: background.page, color: background.ink };
      } else {
        assert.equal(progress.snapshot.data.pageBackground, undefined, "ordinary templates do not gain holiday backgrounds");
        assert.ok(markup.includes(design.theme.bg), `rendered theme includes ${design.theme.bg}`);
      }
      assert.deepEqual(progress.snapshot.theme.bgStyle, expectedPalette, "saved palette matches the selected background");
      const page = markup.match(/<div\b[^>]*data-event-page-design="[^"]*"[^>]*>/)?.[0];
      assert.ok(page?.includes(`background-color:${expectedPalette.backgroundColor};color:${expectedPalette.color}`), "page renders the selected background and ink");
      for (const field of ["title", "date", "time", "city", "state", "venue", "details", "rsvpDeadline"]) {
        assert.equal(progress.snapshot.data[field], "", `${field} stays empty`);
      }
      assert.ok(Object.values(progress.snapshot.data.extra).every((value) => value === ""), "extra event facts stay empty");
      assert.ok(markup.includes(design.artwork), "selected artwork is rendered");
      assert.doesNotMatch(markup, /Invalid Date|Chicago|Community Guild|organizer@email/);
    });
  }
});

test("themed General editor retains authored ink on dark palettes instead of applying legacy white and beige text", () => {
  const { EVENT_PAGE_THEMED_DESIGNS } = load("src/data/event-page-themed-designs.ts");
  const designs = ["dark", "paper"].map((surface) => EVENT_PAGE_THEMED_DESIGNS.find((design) => design.collection === "graduations" && design.bodyPresentation.surface === surface));
  for (const design of designs) {
    assert.ok(design);
    const Editor = load("src/app/event/general/customize/page.tsx", {
      "@/data/event-page-themed-artwork-availability.json": { version: 1, readyDesignIds: [design.id] },
      "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams({ templateId: design.id, collection: design.collection }) },
      "next/image": ({ src, alt }) => React.createElement("img", { src, alt }),
      "@/components/EventCanvas": Container,
      "@/components/events/EventEditorWorkspace": ({ preview }) => preview,
      "@/components/events/TemplateImageTone": ({ children }) => children,
      "@/components/events/HeroImageEditor": Empty,
      "@/components/event-create/CreationTemplateGallery": Empty,
      "@/components/events/useCreationEditorHydration": { useCreationEditorHydration: () => true },
      "@/components/ScrollHandoffContainer": Container,
      "@/components/branding/EnvitefyEventBranding": Empty,
      "@/components/event-templates/EventGuestActions": Empty,
      "@/components/event-templates/EventGuestPlanningEditor": Empty,
      "@/components/event-templates/EventGuestPlanningNotes": Empty,
      "@/components/events/useEventPageEditor": { useEventPageEditor: () => ({ ready: true, authenticated: true }) },
      "@/lib/event-history-client": { useEventHistoryClient: () => ({}) },
      "@/components/UnsavedProgressProvider": { useProgressNavigation: () => ({ allowNavigation() {} }) },
      "@/hooks/useMobileDrawer": { useMobileDrawer: () => ({ mobileMenuOpen: false, previewTouchHandlers: {}, drawerTouchHandlers: {} }) },
    }).default;
    const markup = renderToStaticMarkup(React.createElement(Editor));
    assert.match(markup, new RegExp(`background-color:${design.background};color:${design.ink}`));
    const title = markup.match(/<h1\b[^>]*>/)?.[0];
    assert.ok(title?.includes(`color:${design.ink}`), `${design.id}: title retains authored ink`);
    assert.ok(title?.includes("text-inherit"), `${design.id}: title inherits the authored palette`);
    assert.ok(!title?.includes("text-white"), `${design.id}: legacy white override stays inactive`);
    assert.ok(!title?.includes("#f5e6d3"), `${design.id}: legacy beige override stays inactive`);
    assert.ok(markup.includes("--body-heading-font:"), `${design.id}: body headings receive the selected font`);
  }
});

test("General editor design changes and recovery retain imported facts, custom artwork, and legacy holiday palettes", () => {
  const [first, second, third] = GENERAL_EVENT_DESIGNS;
  const states = [];
  let stateIndex = 0, hydration, progress;
  const Gallery = () => null;
  const Editor = load("src/app/event/general/customize/page.tsx", {
    react: {
      ...React,
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
      useCallback: (callback) => callback,
      useMemo: (factory) => factory(),
      useEffect() {},
      useRef: (current) => ({ current }),
    },
    "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams({ templateId: first.id, intake: "imported-general" }) },
    "next/image": Empty,
    "@/components/EventCanvas": Container,
    "@/components/events/TemplateImageTone": Container,
    "@/components/events/HeroImageEditor": Empty,
    "@/components/event-create/CreationTemplateGallery": Gallery,
    "@/components/events/useCreationEditorHydration": { useCreationEditorHydration: (options) => { hydration = options; return true; } },
    "@/components/ScrollHandoffContainer": Container,
    "@/components/branding/EnvitefyEventBranding": Empty,
    "@/components/event-templates/EventGuestActions": Empty,
    "@/components/event-templates/EventGuestPlanningEditor": Empty,
    "@/components/event-templates/EventGuestPlanningNotes": Empty,
    "@/components/events/useEventPageEditor": { useEventPageEditor: (options) => { progress = options; return { ready: true, authenticated: true }; } },
    "@/lib/event-history-client": { useEventHistoryClient: () => ({}) },
    "@/components/UnsavedProgressProvider": { useProgressNavigation: () => ({ allowNavigation() {} }) },
    "@/hooks/useMobileDrawer": { useMobileDrawer: () => ({ mobileMenuOpen: true, previewTouchHandlers: {}, drawerTouchHandlers: {} }) },
  }).default;
  const render = () => { stateIndex = 0; return Editor(); };
  const findGallery = (element) => {
    if (!React.isValidElement(element)) return null;
    if (element.type === Gallery) return element;
    return React.Children.toArray(element.props.children).map(findGallery).find(Boolean);
  };
  const select = (page, design) => {
    const gallery = findGallery(page.props.sectionEditors.design());
    assert.equal(gallery.props.compact, true);
    gallery.props.onSelect(gallery.props.templates.find((template) => template.id === design.id));
  };

  render();
  const imported = {
    ...progress.snapshot,
    data: { ...progress.snapshot.data, title: "Neighborhood picnic", date: "2027-06-04", venue: "Riverside Park", details: "Bring lunch and games", extra: { host: "Community Guild", parking: "North gate" } },
    advancedState: { arrival: "Use the north entrance" },
  };
  hydration.restore(imported);
  select(render(), second);
  let page = render();
  assert.equal(progress.snapshot.themeId, second.id);
  assert.deepEqual(progress.snapshot.data, { ...imported.data, hero: second.artwork, bodyDesignId: second.id });
  assert.deepEqual(progress.snapshot.advancedState, imported.advancedState);
  assert.equal(findGallery(page.props.sectionEditors.design()).props.selectedTemplateId, second.id);

  const recovered = { ...progress.snapshot, data: { ...progress.snapshot.data, hero: "https://media.envitefy.com/hosts/approved-artwork.webp" }, themeId: third.id };
  hydration.restore(recovered);
  page = render();
  assert.equal(progress.snapshot.themeId, third.id, "the recovered design is restored alongside its facts");
  select(page, first);
  render();
  assert.equal(progress.snapshot.themeId, first.id);
  assert.deepEqual(progress.snapshot.data, { ...recovered.data, bodyDesignId: first.id }, "switching a design retains the host's uploaded artwork and facts while updating its design identity");

  for (const occasion of ["new-years-day", "halloween"]) {
    const design = GENERAL_EVENT_DESIGNS.find((item) => item.occasion === occasion);
    assert.ok(design, `${occasion}: delivered legacy template`);
    const legacy = {
      ...progress.snapshot,
      themeId: design.id,
      data: { ...progress.snapshot.data, bodyDesignId: design.id, creationCollection: "holidays-seasonal", holidayOccasion: occasion },
    };
    delete legacy.data.pageBackground;
    hydration.restore(legacy);
    const markup = renderToStaticMarkup(render());
    assert.deepEqual(progress.snapshot.data, legacy.data, `${design.id}: recovery retains saved facts and custom artwork without adding a background choice`);
    assert.deepEqual(progress.snapshot.theme.bgStyle, { backgroundColor: design.background, color: design.ink }, `${design.id}: legacy pages retain their original authored palette`);
    assert.ok(markup.includes(design.theme.bg), `${design.id}: original theme class stays active`);
    const page = markup.match(/<div\b[^>]*data-event-page-design="[^"]*"[^>]*>/)?.[0];
    assert.ok(page?.includes(`background-color:${design.background};color:${design.ink}`), `${design.id}: original background and ink are rendered`);
    assert.doesNotMatch(markup, /data-holiday-background=/, `${design.id}: recovery does not activate a newly recommended preset`);
  }
});
