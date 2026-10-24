import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("invitation maker owns the create-an-invite search intent", () => {
  const page = readSource("src/app/invitation-maker/page.tsx");

  assert.match(page, /Online Invitation Maker with RSVP \| Envitefy/);
  assert.match(page, /alternates: \{ canonical: "\/invitation-maker" \}/);
  assert.match(page, /Create an online invitation with RSVP/);
  assert.match(page, /How do you create an invite online\?/);
  assert.match(page, /"@type": "WebApplication"/);
  assert.match(page, /"@type": "FAQPage"/);
  assert.match(page, /"@type": "BreadcrumbList"/);
  assert.match(page, /href="\/live-cards"/);
  assert.match(page, /href="\/snap"/);
  assert.match(page, /href="\/showcase"/);
});

test("invitation maker is public, discoverable, and internally linked", () => {
  const sitemap = readSource("src/app/sitemap.ts");
  const middleware = readSource("src/middleware.ts");
  const navigation = readSource("src/config/navigation.ts");
  const footer = readSource("src/components/ConditionalFooter.tsx");
  const llms = readSource("public/llms.txt");

  for (const source of [sitemap, middleware, navigation, footer, llms]) {
    assert.match(source, /invitation-maker/);
  }
  assert.match(llms, /create an invite/);
  assert.match(llms, /online invitation maker/);
});

test("homepage keeps one stable invitation-focused H1", () => {
  const landing = readSource("src/app/landing/sections/ProductLandingHero.tsx");

  for (const phrase of ["Beautiful invites.", "All the details.", "One link."])
    assert.ok(landing.includes(phrase));
  assert.equal((landing.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(landing, /<h1[\s\S]*?\{activeSlide\.title\}[\s\S]*?<\/h1>/);
});
