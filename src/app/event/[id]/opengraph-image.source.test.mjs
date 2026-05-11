import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("event OG metadata uses the canonical public slug image route", () => {
  const pageSource = readSource("src/app/event/[id]/page.tsx");

  assert.match(pageSource, /const ogImageSegment = row/);
  assert.match(pageSource, /buildEventSlugSegment\(row\.id, title, publicSlug\)/);
  assert.match(pageSource, /\/event\/\$\{ogImageSegment\}\/opengraph-image/);
});

test("event OG data route resolves public slugs and chooses saved event artwork", () => {
  const routeSource = readSource("src/app/api/events/[id]/og-data/route.ts");

  assert.match(routeSource, /getEventHistoryPublicRenderBySlugOrId/);
  assert.match(routeSource, /value: awaitedParams\.id/);
  assert.match(routeSource, /data\.coverImageUrl/);
  assert.match(routeSource, /studioCard\?\.imageUrl/);
  assert.match(routeSource, /data\.customHeroImage/);
  assert.match(routeSource, /data\.heroImage/);
  assert.match(routeSource, /data\.thumbnail/);
  assert.match(routeSource, /attachmentImageUrl/);
  assert.match(routeSource, /req\.nextUrl\.origin/);
});

test("event OG image route avoids stale APP_URL before public app origins", () => {
  const imageSource = readSource("src/app/event/[id]/opengraph-image.tsx");
  const nextAuthIndex = imageSource.indexOf("process.env.NEXTAUTH_URL");
  const appUrlIndex = imageSource.indexOf("process.env.APP_URL");

  assert.ok(nextAuthIndex > 0, "NEXTAUTH_URL should remain a fallback for local dev");
  assert.ok(appUrlIndex > nextAuthIndex, "APP_URL should not outrank the canonical app origins");
  assert.match(imageSource, /\/api\/events\/\$\{encodeURIComponent\(awaitedParams\.id\)\}\/og-data/);
});
