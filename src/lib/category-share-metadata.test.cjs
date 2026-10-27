const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const sharp = require("sharp");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const cards = require("../data/category-share-cards.json");
const { buildCategoryShareMetadata } = loadTs("src/lib/category-share-metadata.ts");

const input = {
  title: "Our category page | Envitefy",
  description: "The details for this category.",
  url: "https://preview.envitefy.test/our-category/templates",
};

test("every category supplies the same category-specific card and copy to messaging and Twitter", () => {
  const imageUrls = new Set();
  for (const [category, card] of Object.entries(cards)) {
    const metadata = buildCategoryShareMetadata(category, input);
    assert.equal(metadata.openGraph.type, "website");
    assert.equal(metadata.openGraph.siteName, "Envitefy");
    assert.equal(metadata.openGraph.url, input.url);
    assert.equal(metadata.twitter.card, "summary_large_image");
    for (const preview of [metadata.openGraph, metadata.twitter]) {
      assert.equal(preview.title, input.title);
      assert.equal(preview.description, input.description);
      assert.deepEqual(preview.images, [{
        url: `/og/categories/${category}-v1.jpg`,
        width: 1200,
        height: 630,
        alt: `Envitefy ${card.name} preview`,
      }]);
    }
    assert.deepEqual(buildCategoryShareMetadata(category, input), metadata,
      `${category} does not randomly change its share image`);
    imageUrls.add(metadata.openGraph.images[0].url);
  }
  assert.equal(imageUrls.size, 10, "all ten categories have their own image");
});

test("sports aliases share one card while football and unknown categories retain explicit boundaries", () => {
  const sports = buildCategoryShareMetadata("sports", input);
  assert.deepEqual(buildCategoryShareMetadata("sport-events", input), sports);
  const football = buildCategoryShareMetadata("football", input);
  assert.notEqual(football.openGraph.images[0].url, sports.openGraph.images[0].url);
  for (const unknown of ["unknown-category", "toString", "__proto__", ""]) {
    assert.throws(() => buildCategoryShareMetadata(unknown, input),
      /Missing category share card:/, `${unknown} cannot silently use a generic image`);
  }
});

test("all category cards decode as distinct 1200 by 630 JPEG files at their public URLs", async () => {
  const hashes = new Set();
  for (const category of Object.keys(cards)) {
    const imageUrl = buildCategoryShareMetadata(category, input).openGraph.images[0].url;
    const imagePath = path.join(process.cwd(), "public", imageUrl);
    const bytes = fs.readFileSync(imagePath);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "jpeg", imageUrl);
    assert.equal(metadata.width, 1200, imageUrl);
    assert.equal(metadata.height, 630, imageUrl);
    await sharp(bytes).raw().toBuffer();
    hashes.add(crypto.createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(hashes.size, Object.keys(cards).length,
    "a category cannot accidentally deliver a copy of another category's card");
});

test("every public category landing exports explicit matching OG and Twitter metadata", async () => {
  const component = { __esModule: true, default: () => null };
  const stubs = {
    "next/script": component,
    "@/lib/absolute-url": { absoluteUrl: async (pathname) => `https://preview.envitefy.test${pathname}` },
  };
  for (const name of [
    "@/components/gymnastics-landing/GymnasticsLanding",
    "@/components/football-landing/FootballLanding",
    "@/components/sports-landing/SportsLandingPage",
    "@/components/marketing/MarketingHero",
    "@/components/marketing/MarketingPage",
    "@/components/navigation/SignedOutPageChrome",
    "@/components/templates/PublicTemplateGallery",
    "./CategoryLandingView",
    "./WeddingsLandingView",
    "./BirthdaysLandingView",
    "./BabyShowersLandingView",
    "./BridalShowersLandingView",
    "../category-pages/CelebrationPreview",
  ]) stubs[name] = component;
  const cache = new Map();
  for (const route of [
    "weddings", "birthdays", "baby-showers", "bridal-showers", "gender-reveal",
    "signup-forms", "gymnastics", "anniversaries", "football", "sport-events", "sports",
  ]) {
    const page = loadTs(`src/app/${route}/page.tsx`, stubs, cache);
    const metadata = page.metadata || await page.generateMetadata();
    const category = route === "sport-events" ? "sports" : route;
    const canonical = route === "sports" ? "/sport-events" : `/${route}`;
    assert.equal(new URL(metadata.alternates.canonical, "https://envitefy.test").pathname, canonical, route);
    assert.equal(new URL(metadata.openGraph.url, "https://envitefy.test").pathname, canonical, route);
    assert.equal(metadata.openGraph.type, "website", route);
    assert.equal(metadata.twitter.card, "summary_large_image", route);
    assert.ok(metadata.openGraph.title.length > 0, route);
    assert.ok(metadata.openGraph.description.length > 0, route);
    assert.equal(metadata.twitter.title, metadata.openGraph.title, route);
    assert.equal(metadata.twitter.description, metadata.openGraph.description, route);
    assert.equal(metadata.openGraph.images[0].url, `/og/categories/${category}-v1.jpg`, route);
    assert.deepEqual(metadata.twitter.images, metadata.openGraph.images, route);
  }
  const footballGallery = loadTs("src/app/football/templates/page.tsx", {
    "@/components/football-season-templates/FootballDesignGallery": component,
  }).metadata;
  assert.equal(footballGallery.openGraph.images[0].url, "/og/categories/football-v1.jpg");
  assert.deepEqual(footballGallery.twitter.images, footballGallery.openGraph.images);
  assert.equal(footballGallery.openGraph.url, "/football/templates");
});

test("public template galleries preserve their category and canonical URL in share metadata", async () => {
  const component = { __esModule: true, default: () => null };
  const gallery = loadTs("src/app/[category]/templates/page.tsx", {
    "@/components/templates/PublicTemplateGallery": component,
    "@/components/templates/TemplateGalleryLayout": component,
  });
  const { TEMPLATE_CATEGORIES } = loadTs("src/lib/template-categories.ts");
  for (const category of TEMPLATE_CATEGORIES) {
    const metadata = await gallery.generateMetadata({ params: Promise.resolve({ category: category.slug }) });
    const canonical = `/${category.slug}/templates`;
    const imageCategory = category.slug === "sport-events" ? "sports" : category.slug;
    assert.equal(metadata.alternates.canonical, canonical);
    assert.equal(metadata.openGraph.url, canonical);
    assert.equal(metadata.openGraph.title, `${category.name} templates | Envitefy`);
    assert.equal(metadata.twitter.title, metadata.openGraph.title);
    assert.equal(metadata.openGraph.images[0].url, `/og/categories/${imageCategory}-v1.jpg`);
  }
  assert.deepEqual(await gallery.generateMetadata({ params: Promise.resolve({ category: "missing" }) }), {});
});
