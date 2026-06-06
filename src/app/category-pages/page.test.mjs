import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(repoRoot, relativePath));

const categoryRoutes = [
  "/weddings",
  "/bridal-showers",
  "/baby-showers",
  "/gymnastics",
  "/signup-forms",
  "/gender-reveal",
  "/birthdays",
];

const rootCategoryPageFiles = [
  "src/app/weddings/page.tsx",
  "src/app/bridal-showers/page.tsx",
  "src/app/baby-showers/page.tsx",
  "src/app/gymnastics/page.tsx",
  "src/app/signup-forms/page.tsx",
  "src/app/gender-reveal/page.tsx",
  "src/app/birthdays/page.tsx",
];

const legacyRouteMap = new Map([
  ["/use-cases/wedding-rsvp-tracker", "/weddings"],
  ["/use-cases/bridal-shower-rsvp-tracker", "/bridal-showers"],
  ["/use-cases/baby-shower-rsvp-tracker", "/baby-showers"],
  ["/use-cases/gymnastics-meet-schedule", "/gymnastics"],
  ["/use-cases/online-signup-forms", "/signup-forms"],
  ["/use-cases/gender-reveal-party-rsvp", "/gender-reveal"],
  ["/use-cases/birthday-party-rsvp", "/birthdays"],
]);

test("category landing pages use root URLs and keep old use-case paths redirect-only", () => {
  const categoryHelper = readSource("src/app/category-pages/category-page.tsx");
  const view = readSource("src/app/category-pages/CategoryLandingView.tsx");
  const data = readSource("src/app/category-pages/category-page-data.ts");
  const navigation = readSource("src/config/navigation.ts");
  const middleware = readSource("src/middleware.ts");
  const sitemap = readSource("src/app/sitemap.ts");
  const footer = readSource("src/components/ConditionalFooter.tsx");
  const landingData = readSource("src/app/landing/landing-data.ts");
  const landingExperience = readSource("src/app/landing/LandingExperience.tsx");
  const featureCarousel = readSource("src/components/ui/feature-carousel.tsx");
  const signedOutPageChrome = readSource("src/components/navigation/SignedOutPageChrome.tsx");
  const llms = readSource("public/llms.txt");

  assert.equal(exists("src/app/use-cases/page.tsx"), false);
  assert.equal(exists("src/app/use-cases/[slug]/page.tsx"), false);
  assert.match(categoryHelper, /buildUseCaseCategoryMetadata/);
  assert.match(categoryHelper, /UseCaseCategoryPage/);
  assert.match(categoryHelper, /absoluteUrl\(page\.path\)/);
  assert.match(view, /https:\/\/envitefy\.com\$\{page\.path\}/);
  assert.match(view, /JSON\.stringify\(faqLd\)/);
  assert.match(view, /HeroPreview/);
  assert.match(view, /brandHref="\/"/);
  assert.match(view, /topNavVariant="transparent-dark"/);
  assert.match(signedOutPageChrome, /topNavVariant = "default"/);
  assert.match(signedOutPageChrome, /variant=\{topNavVariant\}/);

  for (const filePath of rootCategoryPageFiles) {
    assert.equal(exists(filePath), true);
  }

  for (const route of categoryRoutes) {
    const escapedRoute = route.replaceAll("/", "\\/");
    assert.match(data, new RegExp(`path: "${escapedRoute}"`));
    assert.match(navigation, new RegExp(`href: "${escapedRoute}"`));
    assert.match(sitemap, new RegExp(`path: "${escapedRoute}"`));
    assert.match(footer, new RegExp(`href: "${escapedRoute}"`));
    assert.match(llms, new RegExp(`https://envitefy\\.com${escapedRoute}`));
    assert.match(middleware, new RegExp(`"${escapedRoute}"`));
  }

  for (const [legacyRoute, categoryRoute] of legacyRouteMap) {
    assert.match(
      middleware,
      new RegExp(
        `\\["${legacyRoute.replaceAll("/", "\\/")}", "${categoryRoute.replaceAll("/", "\\/")}"\\]`,
      ),
    );
  }

  for (const publicSource of [navigation, sitemap, footer, landingData, llms]) {
    assert.doesNotMatch(publicSource, /\/use-cases/);
    assert.doesNotMatch(publicSource, /https:\/\/envitefy\.com\/use-cases/);
  }

  assert.match(middleware, /if \(normalized === "\/use-cases"\) return "\/";/);
  assert.doesNotMatch(middleware, /normalized\.startsWith\("\/use-cases\/"\) return true/);
  assert.match(landingData, /href: "\/weddings"/);
  assert.match(landingData, /href: "\/baby-showers"/);
  assert.match(landingData, /href: "\/birthdays"/);
  assert.match(landingData, /href: "\/gender-reveal"/);
  assert.match(landingExperience, /href=\{activeSlide\.href \?\? "#showcase"\}/);
  assert.match(featureCarousel, /href\?: string/);
  assert.match(featureCarousel, /href=\{feature\.href\}/);

  for (const phrase of [
    "Wedding website, RSVPs, registry links",
    "bridal shower page",
    "Baby shower invitations",
    "gymnastics meet flyers",
    "Online signup forms",
    "Gender reveal invitations",
    "Birthday party invitations",
  ]) {
    assert.match(data, new RegExp(phrase));
  }
});
