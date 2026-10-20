import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const module = { exports: {} };
  cache.set(absolute, module);
  const source = ts.transpileModule(readFileSync(absolute, "utf8"), {
    fileName: absolute,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  function require(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
    if (name.endsWith(".css")) return new Proxy({}, { get: (_, key) => String(key) });
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(absolute), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
    assert.ok(target, name);
    return load(target, mocks, cache);
  }
  new Function("require", "module", "exports", source)(require, module, module.exports);
  return module.exports;
}
const { GENERAL_EVENT_DESIGNS, getGeneralEventDesign } = load("src/lib/general-event-designs.ts");
const { AVAILABLE_HOLIDAY_TEMPLATE_IDS } = load("src/assets/holiday-template-availability.ts");
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

test("choosing a template opens the real editor with its artwork, theme, and empty event facts", () => {
  const representative = GENERAL_EVENT_DESIGNS.filter((design, index) => index < 22 || (index - 12) % 10 === 0);
  for (const design of representative) {
    let progress;
    const Editor = load("src/app/event/general/customize/page.tsx", {
      "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams({ templateId: design.id }) },
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
    const markup = renderToStaticMarkup(React.createElement(Editor));
    assert.equal(progress.snapshot.themeId, design.id);
    assert.equal(progress.snapshot.data.hero, design.artwork);
    for (const field of ["title", "date", "time", "city", "state", "venue", "details", "rsvpDeadline"]) {
      assert.equal(progress.snapshot.data[field], "", `${design.id}: ${field}`);
    }
    assert.ok(Object.values(progress.snapshot.data.extra).every((value) => value === ""));
    assert.ok(markup.includes(design.artwork));
    assert.ok(markup.includes(design.theme.bg));
    assert.doesNotMatch(markup, /Invalid Date|Chicago|Community Guild|organizer@email/);
  }
});

test("General editor design changes and recovery retain imported facts and custom artwork", () => {
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
  assert.deepEqual(progress.snapshot.data, { ...imported.data, hero: second.artwork });
  assert.deepEqual(progress.snapshot.advancedState, imported.advancedState);
  assert.equal(findGallery(page.props.sectionEditors.design()).props.selectedTemplateId, second.id);

  const recovered = { ...progress.snapshot, data: { ...progress.snapshot.data, hero: "https://media.envitefy.com/hosts/approved-artwork.webp" }, themeId: third.id };
  hydration.restore(recovered);
  page = render();
  assert.equal(progress.snapshot.themeId, third.id, "the recovered design is restored alongside its facts");
  select(page, first);
  render();
  assert.equal(progress.snapshot.themeId, first.id);
  assert.deepEqual(progress.snapshot.data, recovered.data, "switching a design retains the host's uploaded artwork and facts");
});
