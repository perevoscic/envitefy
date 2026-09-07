import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import sharp from "sharp";

const read = (file) => fs.readFileSync(file, "utf8");
const catalog = JSON.parse(read("templates/weddings/index.json"));
const collection = catalog.filter((design) => design.family === "atelier");

test("the twenty new wedding artworks are distinct, valid, locally hosted WebP assets", async () => {
  assert.equal(collection.length, 20);
  const hashes = new Set();
  for (const design of collection) {
    const bytes = fs.readFileSync(`public${design.heroImage}`);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp", design.id);
    assert.ok(metadata.width >= 1500 && metadata.height >= 1000, design.id);
    assert.equal(design.thumbnail, design.heroImage);
  }
  assert.equal(
    hashes.size,
    20,
    "new designs must not reuse the same image under different filenames",
  );
});

test("the complete collection stays wired through gallery, customization and published rendering", () => {
  const published = read("src/components/WeddingTemplateView.tsx");
  const renderer = read("src/app/event/weddings/_renderers/atelier-wedding-layouts.tsx");
  const stylesheet = read("src/app/event/weddings/_renderers/atelier-wedding-layouts.module.css");
  const customize = read("src/app/event/weddings/customize/page.tsx");
  for (const design of collection) {
    assert.ok(published.includes(`"${design.id}":`), `${design.id} must survive publishing`);
    assert.ok(customize.includes(`"${design.id}":`), `${design.id} must open in the editor`);
    assert.ok(
      renderer.includes(`case "${design.id}":`),
      `${design.id} must have its own composition`,
    );
    assert.ok(
      stylesheet.includes(`[data-atelier-layout="${design.id}"] .schedule`),
      `${design.id} needs its own programme styling`,
    );
  }
  assert.match(renderer, /event\.customHeroImage[\s\S]*theme\.decorations\?\.heroImage/);
  assert.match(
    customize,
    /font: TEMPLATE_CONFIGS\[draftThemeId\]\?\.family === "atelier" \? "template"/,
  );
  assert.match(stylesheet, /@container \(max-width: 440px\)/);
});
