const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { createJiti } = require("jiti");

const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") } });
const {
  EVENT_PAGE_THEMED_COLLECTIONS: collections,
  EVENT_PAGE_THEMED_DESIGNS: designs,
  EVENT_PAGE_THEMED_BRIEFS: briefs,
} = jiti("../data/event-page-themed-designs.ts");
const { getThemedEventBodyPresentation: body, getThemedEventDesign: resolve } = jiti(
  "./event-page-themed-designs.ts",
);
const manifest = require("../../docs/event-page-themed-artwork.json");

test("all eighteen collections have sixty different visible page treatments, including a lone Details section", () => {
  for (const collection of collections) {
    const selected = designs.filter((design) => design.collection === collection.id);
    assert.equal(selected.length, 60, collection.id);
    const presentations = selected.map((design) => body(design.id));
    assert.ok(presentations.every(Boolean), `${collection.id}: no generic body fallback`);
    assert.equal(
      new Set(
        presentations.map((presentation) => `${presentation.surface}/${presentation.heading}`),
      ).size,
      60,
      `${collection.id}: every design differs visibly even before the host adds more sections`,
    );
    assert.equal(
      new Set(presentations.map((presentation) => presentation.layout)).size,
      12,
      `${collection.id}: all body structures available`,
    );
    assert.equal(
      new Set(selected.map((design) => design.editorLayout)).size,
      7,
      `${collection.id}: all header layouts available`,
    );
  }
});

test("presentation changes retain all 1080 authored artwork IDs, paths, crops, colors and typography", () => {
  assert.equal(designs.length, 1080);
  const assets = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  for (const design of designs) {
    const asset = assets.get(design.id);
    assert.ok(asset, `${design.id}: existing artwork record retained`);
    assert.equal(design.artwork, asset.publicPath, `${design.id}: original image`);
    const theme = briefs[design.collection].find((item) => item.subtype === design.subtype);
    const scene = theme.scenes.find((item) => item.name === design.coverTitle);
    for (const field of ["composition", "background", "ink", "accent", "font"]) {
      assert.equal(design[field], scene.page[field], `${design.id}: authored ${field}`);
    }
    assert.ok(design.presentationDirection, `${design.id}: explicit presentation direction`);
    assert.deepEqual(resolve(design.id), design, `${design.id}: stable direct lookup`);
  }
});

test("the sixty frozen Bridal designs retain their complete original metadata", () => {
  const legacy = require("../data/event-page-themed-legacy.json");
  assert.equal(legacy.designs.length, 60);
  for (const design of legacy.designs) assert.deepEqual(resolve(design.id), design, design.id);
});
