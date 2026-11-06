import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("sports workflow uses a shared popular-sports builder and keeps gymnastics specialized", () => {
  const presets = readSource("src/lib/sport-event-presets.ts");
  const signedInHub = readSource("src/app/event/sport-events/SportEventsPageClient.tsx");
  const signedOutHub = readSource("src/components/sports-landing/SportsLandingPage.tsx");
  const discoveryLauncher = readSource(
    "src/components/event-create/SportsDiscoveryLauncher.tsx",
  );
  const customize = readSource("src/app/event/sport-events/customize/page.tsx");
  const footballPage = readSource("src/app/football/page.tsx");
  const footballLanding = readSource("src/components/football-landing/FootballLanding.tsx");
  const sportsCatalog = readSource("src/lib/public-template-catalogs/sport-events.ts");
  const templateCategories = readSource("src/lib/template-categories.ts");
  const middleware = readSource("src/middleware.ts");
  const signupIntent = readSource("src/lib/signup-intent.ts");

  for (const sport of [
    "football",
    "baseball",
    "basketball",
    "soccer",
    "volleyball",
    "softball",
    "hockey",
    "tennis",
    "track-field",
    "swimming",
    "wrestling",
    "lacrosse",
    "cheerleading",
    "dance",
  ]) {
    assert.match(presets, new RegExp(`key: "${sport}"`));
  }

  assert.match(signedInHub, /SportCreationGate/);
  assert.match(signedInHub, /Smart \{selectedSport\.shortLabel\} builder/);
  assert.match(signedInHub, /Add your event information/);
  assert.match(signedInHub, /SportsDiscoveryLauncher/);
  assert.doesNotMatch(signedInHub, /Choose a starting look/);
  assert.doesNotMatch(signedInHub, /styleOptions/);
  assert.doesNotMatch(discoveryLauncher, /style: string/);

  assert.match(discoveryLauncher, /formData\.append\("workflow", "sports"\)/);
  assert.match(discoveryLauncher, /formData\.append\("activityProfile", preset\.key\)/);
  assert.match(discoveryLauncher, /draftReady/);
  assert.match(discoveryLauncher, /\/event\/sport-events\/customize/);

  assert.match(signedOutHub, /<SignedOutPageChrome/);
  assert.match(signedOutHub, /topNavVariant="transparent-light"/);
  assert.match(signedOutHub, /brandHref="\/"/);
  assert.match(signedOutHub, /<MarketingHero\s+category="sports"/);
  assert.match(signedOutHub, /<PublicTemplateGallery category="sport-events" featured/);
  assert.match(signedOutHub, /SPORT_EVENT_PRESETS\.map/);
  assert.match(signedOutHub, /const primaryHref = "#templates"/);
  assert.match(templateCategories, /slug: "sport-events",[\s\S]*?editor: "\/event\/sport-events\/customize"/);
  assert.match(sportsCatalog, /SPORT_EVENT_PRESETS\.filter\(\(sport\) => sport\.key !== "football"\)/);
  assert.match(signedOutHub, /href="\/gymnastics"/);
  assert.match(signedOutHub, /label="Gymnastics meet pages"/);

  assert.match(customize, /buildSportSpecificConfig/);
  assert.match(customize, /getSportEventPreset\(themedDesign\?\.collection \|\| search\?\.get\("sport"\) \|\| activeTemplateId\.split\("--"\)\[0\]\)/);
  assert.match(customize, /search\?\.get\("style"\)/);
  assert.match(customize, /slug: `sport-event-\$\{sportPreset\.key\}`/);
  assert.match(customize, /sportLabel: sportPreset\.label/);

  assert.match(footballPage, /<FootballLanding\s*\/>/);
  assert.match(footballLanding, /category="football"/);
  assert.match(footballLanding, /href="\/football\/templates"/);
  assert.match(footballLanding, /\/event\/football\/customize\?templateId=/);
  assert.match(middleware, /if \(normalizedPathname === "\/event\/football"\) return ok\(\)/);
  assert.match(middleware, /normalizedPathname === "\/event\/football\/customize"/);
  assert.match(middleware, /normalizedPathname === "\/event\/football-season\/customize"/);
  assert.match(signupIntent, /"\/sports": "sport_events"/);
  assert.match(signupIntent, /"\/sport-events": "sport_events"/);
  assert.match(signupIntent, /ctaLabel: "\+ Sports Event"/);
});
