import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readSource = (file) => fs.readFileSync(file, "utf8");

test("gymnastics keeps public browsing and all local navigation targets", () => {
  const landing = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");
  assert.match(readSource("src/app/gymnastics/page.tsx"), /<GymnasticsLanding \/>/);
  assert.match(landing, /marketingPageNavLinks\("\/gymnastics"\)/);
  assert.match(landing, /<MarketingPage tone="sports"/);
  assert.match(landing, /<PublicTemplateGallery category="gymnastics" featured \/>/);
  assert.doesNotMatch(landing, /href="#templates"|getElementById\("templates"\)/);
  assert.match(landing, /guestPrimaryHref="\/gymnastics\/templates"/);
  assert.match(landing, /authenticatedPrimaryHref="\/gymnastics\/templates"/);
  for (const id of ["hero", "features", "how-it-works", "use-cases", "why-envitefy"])
    assert.ok(landing.includes(`id="${id}"`), id);
  assert.match(landing, /<GymnasticsMeetTransformation \/>/);
  assert.match(
    readSource("src/components/gymnastics-landing/GymnasticsMeetTransformation.tsx"),
    /id="preview"/,
  );
  assert.match(
    readSource("src/components/gymnastics-landing/GymnasticsLandingFaq.tsx"),
    /id="faq"/,
  );
  assert.doesNotMatch(landing, /LandingHeroMedia|ScenicBackground|5x/);
});

test("gymnastics preserves query-driven authentication and the meet launch destination", () => {
  const landing = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");
  assert.match(landing, /const auth = searchParams\?\.get\("auth"\)/);
  assert.match(landing, /auth === "signup" \|\| auth === "login"/);
  assert.match(landing, /onGuestLoginAction=\{\(\) => openAuth\("login"\)\}/);
  assert.match(landing, /signupSource="gymnastics"/);
  assert.match(
    landing,
    /successRedirectUrl=\{authMode === "signup" \? "\/event\/gymnastics" : "\/"\}/,
  );
  assert.match(landing, /href="\/event\/gymnastics"/);
  assert.match(landing, /onClick=\{\(\) => openAuth\("signup"\)\}/);
});

test("gymnastics demonstrates sample logistics without publishing a real event", () => {
  const landing = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");
  const demo = readSource("src/components/gymnastics-landing/GymnasticsMeetDemo.tsx");
  const comparison = readSource("src/components/gymnastics-landing/GymnasticsMeetComparison.tsx");
  const transformation = readSource(
    "src/components/gymnastics-landing/GymnasticsMeetTransformation.tsx",
  );
  assert.match(demo, /data-authored-preview/);
  assert.match(demo, /Sample meet page/);
  assert.match(demo, /Coach check-in/);
  assert.match(landing, /MeetPreview/);
  assert.match(transformation, /<GymnasticsMeetComparison \/>/);
  assert.match(comparison, /gymanstic-1-landing\.png/);
  assert.doesNotMatch(comparison, /meet-page-phone|gymanstic-2-landing/);
  assert.doesNotMatch(landing + demo + comparison + transformation, /fetch\(|method:.*POST/);
});
