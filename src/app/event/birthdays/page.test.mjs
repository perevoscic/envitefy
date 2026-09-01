import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
  });

test("birthday creation starts with a rotating, filterable 104-design gallery", () => {
  const pageSource = readSource("src/app/event/birthdays/page.tsx");
  const gallerySource = readSource("src/components/birthdays/BirthdayDesignGallery.tsx");

  assert.match(pageSource, /<BirthdayDesignGallery\s*\/>/);
  assert.doesNotMatch(pageSource, /router\.replace/);
  assert.match(gallerySource, /BIRTHDAY_DESIGN_CATALOG\.filter/);
  assert.match(gallerySource, /Featured mix/);
  assert.match(gallerySource, /sessionStorage\.getItem/);
  assert.match(gallerySource, /Original 24/);
  assert.match(gallerySource, /New kids/);
  assert.match(gallerySource, /Adult birthdays/);
  assert.match(gallerySource, /Anniversaries/);
  assert.match(gallerySource, /label="Milestone"/);
  assert.match(gallerySource, /label="Style"/);
  assert.match(gallerySource, /params\.set\("templateId", templateId\)/);
});

test("the generated birthday collection contains 30 kids, 40 adult, and 10 anniversary WebPs", () => {
  const generatedRoot = path.join(repoRoot, "public/templates/birthdays/generated");
  const kids = walkFiles(path.join(generatedRoot, "kids"));
  const adults = walkFiles(path.join(generatedRoot, "adults"));
  const anniversaries = walkFiles(path.join(generatedRoot, "anniversaries"));
  const generated = [...kids, ...adults, ...anniversaries];

  assert.equal(kids.length, 30);
  assert.equal(adults.length, 40);
  assert.equal(anniversaries.length, 10);
  assert.equal(generated.length, 80);
  assert.ok(generated.every((filePath) => filePath.endsWith(".webp")));
  assert.equal(generated.filter((filePath) => filePath.endsWith(".png")).length, 0);
  assert.equal(
    new Set(generated.map((filePath) => fs.readFileSync(filePath).toString("base64"))).size,
    80,
  );
});

test("the original 24 designs remain first and new selections reach the birthday renderer", () => {
  const dataSource = readSource("src/data/birthday-template-data.ts");
  const catalogSource = readSource("src/data/birthday-design-catalog.ts");
  const galleryCatalogSource = readSource(
    "src/components/event-create/BirthdayTemplateGallery.tsx",
  );
  const customizeSource = readSource("src/app/event/birthdays/customize/page.tsx");

  assert.match(dataSource, /NEW_KIDS_BIRTHDAY_DESIGNS/);
  assert.match(dataSource, /NEW_ADULT_BIRTHDAY_DESIGNS/);
  assert.match(dataSource, /NEW_ANNIVERSARY_DESIGNS/);
  assert.match(catalogSource, /\.\.\.ORIGINAL_BIRTHDAY_DESIGNS/);
  assert.match(catalogSource, /\.\.\.NEW_BIRTHDAY_DESIGNS/);
  assert.match(galleryCatalogSource, /\.\.\.baseBirthdayTemplateCatalog\.map/);
  assert.match(galleryCatalogSource, /\.\.\.generatedBirthdayTemplateCatalog/);
  assert.match(customizeSource, /\.\.\.BIRTHDAY_DESIGN_CATALOG/);
  assert.match(customizeSource, /professionalThemeId: selectedTheme\?\.id/);
  assert.match(customizeSource, /All celebration designs/);
});

test("primary birthday creation links open the gallery", () => {
  const sources = [
    "src/components/home/EnvitefyBuilderHero.tsx",
    "src/app/category-pages/category-page-data.ts",
    "src/config/feature-visibility.ts",
    "src/lib/signup-intent.ts",
    "src/app/birthdays/birthday-landing-data.ts",
  ].map(readSource);

  for (const source of sources) {
    assert.match(source, /["']\/event\/birthdays["']/);
  }
});
