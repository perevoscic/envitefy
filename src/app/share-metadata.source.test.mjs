import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("production metadata stays ahead of linked stylesheets", () => {
  const nextConfig = readSource("next.config.ts");
  assert.doesNotMatch(nextConfig, /inlineCss:\s*true/);
});

test("every public event route uses the shared artwork resolver for OG and Twitter", () => {
  for (const relativePath of ["src/app/card/[id]/page.tsx", "src/app/e/[slug]/page.tsx",
    "src/app/event/[id]/page.tsx", "src/app/smart-signup-form/[id]/page.tsx"]) {
    const source = readSource(relativePath);
    assert.match(source, /resolveEventShareImage/);
    assert.match(source, /openGraph:/);
    assert.match(source, /twitter:/);
    assert.match(source, /summary_large_image/);
    assert.doesNotMatch(source, /\/og-default\.jpg/);
  }
});

test("share metadata uses crawler-accessible media routes", () => {
  const resolver = readSource("src/lib/share-image.ts");
  const middleware = readSource("src/middleware.ts");
  const mediaRoute = readSource("src/app/media/[...path]/route.ts");
  const thumbnailRoute = readSource("src/app/media/events/[id]/thumbnail/route.ts");
  const signupPage = readSource("src/app/smart-signup-form/[id]/page.tsx");

  assert.match(resolver, /\/media\/event-media\//);
  assert.match(resolver, /\/media\/events\//);
  assert.match(middleware, /pathname\.startsWith\("\/media\/"\)/);
  assert.match(mediaRoute, /public, max-age=31536000, immutable/);
  assert.match(thumbnailRoute, /variantParam === "signup-cover"/);
  assert.match(signupPage, /resolveEventShareImage\(/);
  assert.match(signupPage, /eventId: row\.id, media: row\.media/);
});
