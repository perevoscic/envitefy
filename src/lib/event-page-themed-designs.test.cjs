const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.resolve("src", request.slice(2)) : request, parent, ...rest);
};
for (const extension of [".ts", ".tsx"]) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file);

const manifest = require("../data/event-page-themed-designs.ts");
const registrySource = ts.transpileModule(fs.readFileSync(path.resolve("src/lib/event-page-themed-designs.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
function registry(ids) {
  const output = { exports: {} };
  new Function("require", "module", "exports", registrySource)((name) => {
    if (name.includes("artwork-availability")) return { version: 1, readyDesignIds: ids };
    if (name.includes("event-page-themed-designs")) return manifest;
    throw new Error(`Unexpected registry dependency: ${name}`);
  }, output, output.exports);
  return output.exports;
}

test("replacement selectors wait for all 60 delivered designs and keep persisted IDs resolvable", () => {
  const collectionId = manifest.EVENT_PAGE_THEMED_COLLECTIONS[0].id;
  const designs = manifest.EVENT_PAGE_THEMED_DESIGNS.filter((design) => design.collection === collectionId);
  assert.equal(designs.length, 60);
  const incomplete = registry(designs.slice(0, 59).map((design) => design.id));
  assert.deepEqual(incomplete.getActiveThemedEventDesigns(collectionId), []);
  assert.equal(incomplete.getCompleteThemedEventCollection(collectionId), undefined);
  assert.equal(incomplete.getThemedEventDesign(designs[59].id).id, designs[59].id);
  assert.equal(incomplete.getDeliveredThemedEventDesign(designs[59].id), undefined);
  assert.equal(incomplete.isThemedEventArtworkAvailable(designs[59].id), false);
  assert.equal(incomplete.getDeliveredThemedEventDesign(designs[0].id).id, designs[0].id);
  const complete = registry(designs.map((design) => design.id));
  assert.equal(complete.getActiveThemedEventDesigns(collectionId).length, 60);
  assert.equal(complete.getCompleteThemedEventCollection(collectionId).id, collectionId);
  assert.deepEqual(complete.getActiveThemedEventDesigns("softball"), []);
  assert.equal(complete.getThemedEventDesign("not-a-real-id"), undefined);
});

test("authored colors, typography and body structure are independent of gallery ordering", () => {
  const runtime = registry([]);
  const design = manifest.EVENT_PAGE_THEMED_DESIGNS.find((item) => item.collection === "bridal-showers");
  const theme = runtime.getThemedEventTheme(design);
  assert.equal(theme.id, design.id);
  assert.equal(theme.bgStyle.backgroundColor, design.background);
  assert.equal(theme.bgStyle.color, design.ink);
  assert.equal(theme.accentColor, design.accent);
  assert.equal(theme.fontFamily, design.font);
  const body = runtime.getThemedEventBodyPresentation(design.id);
  assert.ok(body.layout);
  assert.ok(body.surface);
  assert.equal(body.flow, "invitation");
  assert.equal(body.borderRadius, design.bodyPresentation.borderRadius);
  assert.equal(body.spacing, design.bodyPresentation.spacing);
  assert.equal(body.surfaceTone, design.bodyPresentation.surface);
  assert.equal(runtime.getThemedEventBodyPresentation("unknown"), undefined);
});

test("retired basic IDs stay resolvable and unavailable artwork never opens through public template lookup", () => {
  const { getPublicTemplate, getPublicTemplates, BRIDAL_PRESETS } = require("./public-template-catalog.ts");
  const available = require("../data/event-page-themed-artwork-availability.json");
  const readyIds = new Set(available.readyDesignIds);
  assert.ok(getPublicTemplate("sport-events", "football--stadium"));
  assert.ok(getPublicTemplate("sport-events", "baseball--club"));
  assert.equal(getPublicTemplate("sport-events", "baseball--toString"), undefined);
  assert.equal(getPublicTemplates("sport-events").some((design) => design.id.startsWith("football--")), false);
  for (const legacy of BRIDAL_PRESETS) assert.equal(getPublicTemplate("bridal-showers", legacy.id).id, legacy.id);
  for (const collection of ["bridal-showers", "dance"]) {
    const pending = manifest.EVENT_PAGE_THEMED_DESIGNS.find((design) => design.collection === collection && !readyIds.has(design.id));
    if (pending) assert.equal(getPublicTemplate(collection === "bridal-showers" ? collection : "sport-events", pending.id), undefined);
  }
});
