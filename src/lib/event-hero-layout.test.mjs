import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  if (filename.endsWith(".json")) return JSON.parse(readFileSync(filename, "utf8"));
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  function require(name) {
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync));
  }
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}

const { normalizeEventHeroLayout, EVENT_HERO_LAYOUT_PRESETS } = load("src/lib/event-hero-layout.ts");
const { normalizeEventPageComposition } = load("src/lib/event-page-composition.ts");
const { normalizeCustomEventPage, emptyCustomEventDetails, customEventPageData } = load("src/lib/event-custom-design.ts");
const { buildTemplateDraftPayload } = load("src/lib/template-draft-payload.ts");
const choice = EVENT_HERO_LAYOUT_PRESETS.find((preset) => preset.id === "arch").layout;

test("premade hero choices provide twelve distinct arrangements without any section layout settings", () => {
  assert.deepEqual(EVENT_HERO_LAYOUT_PRESETS.map(({ id, label }) => ({ id, label })), [
    { id: "banner", label: "Wide banner" },
    { id: "title-first", label: "Title first" },
    { id: "image-left", label: "Image left" },
    { id: "image-right", label: "Image right" },
    { id: "circle", label: "Circle portrait" },
    { id: "arch", label: "Arch portrait" },
    { id: "square-stack", label: "Square portrait" },
    { id: "portrait", label: "Tall portrait" },
    { id: "circle-centered", label: "Centered circle" },
    { id: "circle-right", label: "Circle right" },
    { id: "arch-left", label: "Arch left" },
    { id: "arch-right", label: "Arch right" },
  ]);
  assert.equal(new Set(EVENT_HERO_LAYOUT_PRESETS.map(({ layout }) => JSON.stringify(layout))).size, 12);
  for (const { layout } of EVENT_HERO_LAYOUT_PRESETS) {
    assert.deepEqual(normalizeEventHeroLayout(layout), layout);
    assert.equal(layout.sectionLayout, undefined);
    assert.equal(layout.columns, undefined);
    assert.equal(layout.sections, undefined);
  }
});

test("hero preferences remain optional for existing pages and reject non-record input", () => {
  for (const value of [undefined, null, false, 10, "left", []])
    assert.equal(normalizeEventHeroLayout(value), undefined);
  assert.equal(normalizeEventPageComposition({ version: 1, sections: [] }), undefined);
});

test("hero normalization retains every supported image and title choice through serialization", () => {
  for (const imagePosition of ["top", "left", "right"])
    for (const imageShape of ["landscape", "square", "portrait", "circle", "arch"])
      for (const imageFit of ["cover", "contain"])
        for (const imagePositionY of [0, 50, 100])
          for (const titlePosition of ["above", "below"])
            for (const titleAlign of ["left", "center", "right"]) {
              const raw = { ...choice, imagePosition, imageShape, imageFit, imagePositionY, titlePosition, titleAlign };
              const normalized = normalizeEventHeroLayout(JSON.parse(JSON.stringify(raw)));
              assert.ok(normalized);
              for (const field of ["imagePosition", "imageShape", "imageFit", "imagePositionY", "titlePosition", "titleAlign"])
                assert.equal(normalized[field], raw[field], field);
              assert.deepEqual(normalizeEventHeroLayout(normalized), normalized, "repeated validation is stable");
            }
});

test("untrusted hero settings cannot inject unsupported shapes, fit modes, or unbounded crop positions", () => {
  for (const imagePositionY of [-100, 250, NaN, Infinity, "25", null]) {
    const normalized = normalizeEventHeroLayout({ ...choice, imagePositionY });
    if (normalized) {
      assert.equal(typeof normalized.imagePositionY, "number");
      assert.ok(Number.isFinite(normalized.imagePositionY));
      assert.ok(normalized.imagePositionY >= 0 && normalized.imagePositionY <= 100);
    }
  }
  const normalized = normalizeEventHeroLayout({
    ...choice, imagePosition: "fixed", imageShape: "url(javascript:bad)", imageFit: "fill",
    titlePosition: "overlay", titleAlign: "justify", sectionColumns: 3, html: "<script>bad</script>",
  });
  if (normalized) {
    assert.ok(["top", "left", "right"].includes(normalized.imagePosition));
    assert.ok(["landscape", "square", "portrait", "circle", "arch"].includes(normalized.imageShape));
    assert.ok(["cover", "contain"].includes(normalized.imageFit));
    assert.ok(["above", "below"].includes(normalized.titlePosition));
    assert.ok(["left", "center", "right"].includes(normalized.titleAlign));
    assert.equal(normalized.sectionColumns, undefined);
    assert.equal(normalized.html, undefined);
  }
});

test("native draft hero settings preserve section content, visibility, order and the saved body layout", () => {
  const hero = normalizeEventHeroLayout(choice);
  const before = {
    version: 1, layout: "cards", sections: [{ id: "info:arrival", title: "Arrival", body: "Use the east gate." }],
    sectionLayout: { version: 1, order: ["info:arrival", "details"], hidden: ["details"], added: ["info:arrival"] },
  };
  const composition = normalizeEventPageComposition({ ...before, hero });
  assert.deepEqual(composition, { ...before, hero });
  const data = { title: "Community picnic", description: "Bring water.", venue: "Meadow Park" };
  const draft = buildTemplateDraftPayload({ data, pageComposition: composition }, "birthdays", "America/Chicago");
  assert.deepEqual(draft.data.eventPageComposition, composition);
  assert.equal(draft.data.title, data.title);
  assert.equal(draft.data.description, data.description);
  assert.equal(draft.data.venue, data.venue);
  assert.deepEqual(before.sections, composition.sections);
  assert.deepEqual(before.sectionLayout, composition.sectionLayout);
  assert.deepEqual(normalizeEventPageComposition({ ...composition, hero: undefined }), before, "reset removes only the hero override");
});

test("custom page hero settings survive save data without changing the authored layout or information", () => {
  const page = {
    version: 1, category: "general", artwork: "/templates/example.webp",
    design: {
      version: 1, name: "Park", description: "A leafy park", layout: "split", font: "editorial",
      colors: { page: "#ffffff", surface: "#f5f1fa", ink: "#342d38", accent: "#60508e" },
    },
    details: { ...emptyCustomEventDetails(), title: "Community picnic", description: "Bring water.", sections: [{ title: "Arrival", body: "Use the east gate." }] },
  };
  const original = normalizeCustomEventPage(page);
  assert.ok(original);
  assert.equal(original.design.hero, undefined, "legacy custom designs do not acquire a hero override");
  const selected = normalizeCustomEventPage({ ...page, design: { ...page.design, hero: choice } });
  assert.ok(selected);
  assert.deepEqual(selected.design.hero, normalizeEventHeroLayout(choice));
  assert.equal(selected.design.layout, original.design.layout);
  assert.deepEqual(selected.details, original.details);
  const saved = customEventPageData(selected);
  assert.deepEqual(normalizeCustomEventPage(JSON.parse(JSON.stringify(saved.customEventPage))), selected);
});
