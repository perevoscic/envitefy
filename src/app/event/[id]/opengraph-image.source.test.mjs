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
  assert.match(pageSource, /EVENT_OG_IMAGE_VERSION/);
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

test("event OG image route uses the request-aware public origin for self fetches", () => {
  const imageSource = readSource("src/app/event/[id]/opengraph-image.tsx");

  assert.match(imageSource, /import \{ absoluteUrl \} from "@\/lib\/absolute-url"/);
  assert.doesNotMatch(imageSource, /process\.env\.VERCEL_URL/);
  assert.match(
    imageSource,
    /\/api\/events\/\$\{encodeURIComponent\(awaitedParams\.id\)\}\/og-data/,
  );
  assert.doesNotMatch(
    imageSource,
    /iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk\+M9Q/,
  );
});
