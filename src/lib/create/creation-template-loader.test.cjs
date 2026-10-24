const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");
const cache = new Map();
const load = relative => loadTs(path.resolve(__dirname, relative), {}, cache);

const { loadPublicTemplates } = load("../public-template-loaders.ts");
const { loadCreationCatalog, cachedCreationCatalog } = load("./creation-template-loader.ts");

test("a failed category import can retry and concurrent reads share the request", async () => {
  let attempts = 0;
  const stubs = {};
  Object.defineProperty(stubs, "./public-template-catalogs/weddings", {
    get() {
      if (++attempts === 1) throw new Error("Fixture chunk unavailable");
      return load("../public-template-catalogs/weddings.ts");
    },
  });
  const { loadPublicTemplates: retryPublicTemplates } = loadTs(path.resolve(__dirname, "../public-template-loaders.ts"), stubs);
  const first = retryPublicTemplates("weddings");
  assert.equal(retryPublicTemplates("weddings"), first);
  await assert.rejects(first, /Fixture chunk unavailable/);
  const retry = retryPublicTemplates("weddings");
  assert.notEqual(retry, first);
  assert.ok((await retry).length > 0);
  assert.equal(attempts, 2);
});

test("selected public and creation catalogs exactly retain synchronous catalog outputs", async () => {
  const { TEMPLATE_CATEGORIES } = load("../template-categories.ts");
  const { getPublicTemplates } = load("../public-template-catalog.ts");
  const { getCreationTemplates } = load("./template-selection.ts");
  const { CREATE_CATEGORIES, CREATE_SPORT_KEYS } = load("./create-intent.ts");
  const { HOLIDAY_COLLECTIONS } = load("../holiday-collections.ts");
  for (const { slug } of TEMPLATE_CATEGORIES) assert.deepEqual(await loadPublicTemplates(slug), getPublicTemplates(slug), slug);
  const guesses = [
    ...CREATE_CATEGORIES.map(category => ({ category, sport: null })),
    ...CREATE_SPORT_KEYS.map(sport => ({ category: "sports", sport })),
    ...HOLIDAY_COLLECTIONS.map(({ id }) => ({ category: "holidays-seasonal", sport: null, occasion: id })),
  ];
  for (const guess of guesses) {
    const first = loadCreationCatalog(guess);
    assert.equal(loadCreationCatalog({ ...guess }), first);
    const catalog = await first;
    assert.deepEqual(catalog.templates, getCreationTemplates(guess), JSON.stringify(guess));
    assert.equal(cachedCreationCatalog(guess), catalog);
    for (const template of catalog.templates) {
      const preview = catalog.previews[template.id];
      if (preview) assert.equal(preview.artwork, template.imageUrl);
    }
  }
});

test("lightweight occasion metadata retains all authored names, dates, aliases and identities", () => {
  const { HOLIDAY_COLLECTIONS } = load("../holiday-collections.ts");
  const { HOLIDAY_OCCASIONS } = load("../holiday-occasions.ts");
  assert.deepEqual(HOLIDAY_OCCASIONS, HOLIDAY_COLLECTIONS.map(({ designs, ...occasion }) => occasion));
  const { EVENT_PAGE_THEMED_DESIGNS } = load("../../data/event-page-themed-designs.ts");
  const legacy = load("../../data/event-page-themed-legacy.json");
  const { isPotentialThemedTemplateId } = load("../themed-template-id.ts");
  assert.ok([...EVENT_PAGE_THEMED_DESIGNS, ...legacy.designs].every(design => isPotentialThemedTemplateId(design.id)));
  assert.equal(isPotentialThemedTemplateId("tuscan-lemon-grove"), false);
});

function eagerImports(entry, files = new Set()) {
  const absolute = path.resolve(entry);
  if (files.has(absolute)) return files;
  files.add(absolute);
  if (!/\.[jt]sx?$/.test(absolute)) return files;
  const source = ts.createSourceFile(absolute, fs.readFileSync(absolute, "utf8"), ts.ScriptTarget.Latest, true);
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      if (clause?.isTypeOnly) continue;
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings) && !clause.name && clause.namedBindings.elements.every(item => item.isTypeOnly)) continue;
    } else if (node.isTypeOnly || (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.every(item => item.isTypeOnly))) continue;
    const name = node.moduleSpecifier.text;
    if (!name.startsWith("@/") && !name.startsWith(".")) continue;
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(absolute), name);
    const file = [base, ...[".ts", ".tsx", ".mjs", ".js", ".json", "/index.ts", "/index.tsx"].map(ext => base + ext)].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (file) eagerImports(file, files);
  }
  return files;
}

test("the category picker and public weddings exclude unrelated catalogs and editor modules", () => {
  const picker = eagerImports("src/app/create/UnifiedCreatePageClient.tsx");
  for (const file of ["src/lib/public-template-catalog.ts", "src/lib/holiday-collections.ts", "src/lib/general-event-designs.ts", "src/lib/event-page-themed-designs.ts", "src/lib/create/editor-handoff.ts", "src/components/event-create/CreationTemplateGallery.tsx"]) assert.equal(picker.has(path.resolve(file)), false, file);
  const wedding = eagerImports("src/components/templates/category-galleries/weddings.tsx");
  for (const file of ["src/lib/public-template-catalog.ts", "src/lib/holiday-collections.ts", "src/data/birthday-design-catalog.ts", "src/components/templates/TemplateEditorContext.tsx", "src/components/smart-signup-form/SignupCustomThemeDialog.tsx", "src/components/weddings/WeddingRenderer.tsx"]) assert.equal(wedding.has(path.resolve(file)), false, file);
  const preview = eagerImports("src/components/templates/category-thumbnails/weddings.tsx");
  assert.equal(preview.has(path.resolve("src/lib/holiday-backgrounds.ts")), false);
  assert.equal(preview.has(path.resolve("src/components/weddings/WeddingRenderer.tsx")), false);
});
