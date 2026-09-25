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
const { config } = load("src/components/event-templates/GeneralEventsTemplate.tsx");
const Container = ({ children }) => React.createElement("div", null, children);
const Empty = () => null;

test("every General Event template has real artwork and the matching editor palette", () => {
  assert.equal(GENERAL_EVENT_DESIGNS.length, 452);
  assert.equal(new Set(GENERAL_EVENT_DESIGNS.map((design) => design.id)).size, 452);
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
      "@/components/ScrollHandoffContainer": Container,
      "@/components/branding/EnvitefyEventBranding": Empty,
      "@/components/event-templates/EventGuestActions": Empty,
      "@/components/event-templates/EventGuestPlanningEditor": Empty,
      "@/components/event-templates/EventGuestPlanningNotes": Empty,
      "@/hooks/useManualEventProgress": { useManualEventProgress: (options) => { progress = options; } },
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
