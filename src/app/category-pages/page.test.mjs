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
  assert.match(view, /<LandingHeroMedia/);
  assert.doesNotMatch(view, /rgba\(10,7,14,0\.84\)/);
  assert.doesNotMatch(landingExperience, /rgba\(18,15,20,0\.66\)/);
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
    "Haute Couture Digital Invitations for Your Forever After",
    "bridal shower page",
    "Baby shower invitations",
    "gymnastics meet flyers",
    "Online signup forms",
    "Gender reveal invitations",
    "Birthday party invitations",
  ]) {
    assert.match(data, new RegExp(phrase));
  }

  const weddingsPage = readSource("src/app/weddings/page.tsx");
  const weddingsView = readSource("src/app/weddings/WeddingsLandingView.tsx");
  assert.match(weddingsPage, /WeddingsLandingView/);
  assert.match(weddingsView, /SignedOutPageChrome/);
  assert.match(weddingsView, /topNavVariant="transparent-dark"/);
  assert.match(weddingsView, /<LandingHeroMedia/);
  assert.match(weddingsView, /landingHeroGalleries\.weddings/);
  assert.doesNotMatch(weddingsView, /rgba\(18,12,10,0\.88\)/);
  assert.match(weddingsView, /!text-white/);

  const birthdaysPage = readSource("src/app/birthdays/page.tsx");
  const birthdaysView = readSource("src/app/birthdays/BirthdaysLandingView.tsx");
  assert.match(birthdaysPage, /BirthdaysLandingView/);
  assert.match(birthdaysView, /SignedOutPageChrome/);
  assert.match(birthdaysView, /topNavVariant="transparent-dark"/);
  assert.match(birthdaysView, /<LandingHeroMedia/);
  assert.match(birthdaysView, /landingHeroGalleries\.birthdays/);
  assert.match(birthdaysView, /!text-white/);
  assert.match(birthdaysView, /Household RSVP/);
  assert.match(birthdaysView, /Host bar/);
  assert.doesNotMatch(birthdaysView, /landingHeroGalleries\.(weddings|gender-reveal)/);
});

test("each category landing hero rotates four full-bleed images every 7 seconds", () => {
  const galleries = readSource("src/lib/landing-hero-galleries.ts");
  const heroMedia = readSource("src/components/landing/LandingHeroMedia.tsx");
  const categoryView = readSource("src/app/category-pages/CategoryLandingView.tsx");
  const gymnasticsLanding = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");
  const sportsLanding = readSource("src/components/sports-landing/SportsLandingPage.tsx");

  assert.match(galleries, /export const LANDING_HERO_ROTATE_MS = 7000/);
  assert.match(heroMedia, /LANDING_HERO_ROTATE_MS/);
  assert.match(heroMedia, /<HeroImageScrim/);
  assert.match(categoryView, /<LandingHeroMedia/);
  const birthdaysLanding = readSource("src/app/birthdays/BirthdaysLandingView.tsx");
  assert.match(birthdaysLanding, /landingHeroGalleries\.birthdays/);
  assert.match(birthdaysLanding, /<LandingHeroMedia/);
  assert.match(gymnasticsLanding, /landingHeroGalleries\.gymnastics/);
  assert.match(sportsLanding, /landingHeroGalleries\.sports/);

  const galleryKeys = [
    "weddings",
    "bridal-showers",
    "baby-showers",
    "gymnastics",
    "sports",
    "signup-forms",
    "gender-reveal",
    "birthdays",
  ];

  for (const key of galleryKeys) {
    const keyPattern = key.includes("-") ? `"${key}"` : key;
    const blockMatch = galleries.match(
      new RegExp(`${keyPattern}: \\[([\\s\\S]*?)\\],\\n`, "m"),
    );
    assert.ok(blockMatch, `missing gallery for ${key}`);
    const srcMatches = [...blockMatch[1].matchAll(/src: "([^"]+)"/g)].map((match) => match[1]);
    assert.equal(srcMatches.length, 4, `${key} should have 4 hero frames`);
    for (const src of srcMatches) {
      assert.equal(exists(`public${src}`), true, `missing hero asset ${src}`);
    }
  }
});
