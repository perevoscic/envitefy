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
  for (const id of ["hero", "features", "how-it-works", "preview", "use-cases", "why-envitefy"])
    assert.ok(landing.includes(`id="${id}"`), id);
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
  assert.match(landing, /prefers-reduced-motion/);
});

test("gymnastics demonstrates sample logistics without publishing a real event", () => {
  const landing = readSource("src/components/gymnastics-landing/GymnasticsLanding.tsx");
  assert.match(landing, /data-authored-preview/);
  assert.match(landing, /Sample meet page/);
  assert.match(landing, /Coach check-in/);
  assert.match(landing, /MeetPreview/);
  assert.match(landing, /gymanstic-1-landing\.png/);
  assert.match(landing, /gymanstic-2-landing\.png/);
  assert.doesNotMatch(landing, /fetch\(|method:.*POST/);
});
