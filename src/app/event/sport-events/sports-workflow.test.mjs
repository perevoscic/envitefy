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
  const signedOutHub = readSource("src/app/sport-events/SportsLandingPage.tsx");
  const customize = readSource("src/app/event/sport-events/customize/page.tsx");
  const footballPage = readSource("src/app/football/page.tsx");
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

  assert.match(signedInHub, /sportsBuilderSteps/);
  assert.match(signedInHub, /"Choose sport"/);
  assert.match(signedInHub, /"Upload info"/);
  assert.match(signedInHub, /"Organize sections"/);
  assert.match(signedInHub, /"Preview & publish"/);
  assert.match(signedInHub, /SPORT_EVENT_PRESETS\.map/);
  assert.match(signedInHub, /buildSportEventCustomizeHref/);
  assert.match(signedInHub, /href="\/event\/gymnastics"/);

  assert.match(signedOutHub, /<SignedOutPageChrome/);
  assert.match(signedOutHub, /SPORT_EVENT_PRESETS\.map/);
  assert.match(signedOutHub, /buildSportEventCustomizeHref/);
  assert.match(signedOutHub, /\/event\/gymnastics\?auth=signup/);

  assert.match(customize, /buildSportSpecificConfig/);
  assert.match(customize, /getSportEventPreset\(search\?\.get\("sport"\)\)/);
  assert.match(customize, /slug: `sport-event-\$\{sportPreset\.key\}`/);
  assert.match(customize, /sportLabel: sportPreset\.label/);

  assert.match(footballPage, /redirect\("\/sport-events\?sport=football"\)/);
  assert.match(middleware, /url\.pathname = "\/event\/sport-events\/customize"/);
  assert.match(middleware, /url\.search = "\?sport=football"/);
  assert.match(signupIntent, /"\/sports": "sport_events"/);
  assert.match(signupIntent, /"\/sport-events": "sport_events"/);
  assert.match(signupIntent, /ctaLabel: "\+ Sports Event"/);
});
