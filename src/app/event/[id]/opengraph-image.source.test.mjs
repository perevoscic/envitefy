import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("event OG metadata shares saved artwork at its natural aspect ratio", () => {
  const pageSource = readSource("src/app/event/[id]/page.tsx");

  assert.match(pageSource, /resolveCoverImageUrlFromEventData/);
  assert.match(pageSource, /async function resolveEventShareImageUrl/);
  assert.match(pageSource, /await resolveEventShareImageUrl\(data\)/);
  assert.match(pageSource, /await absoluteUrl\("\/og-default\.jpg"\)/);
  assert.doesNotMatch(pageSource, /const ogImageSegment = row/);

  const metadataBlock = pageSource.match(
    /export async function generateMetadata[\s\S]*?(?=\nexport async function generateViewport)/,
  )?.[0];
  assert.ok(metadataBlock, "expected event metadata generator");
  assert.match(metadataBlock, /images: \[\s*\{\s*url: img,\s*alt: title,/);
  assert.doesNotMatch(metadataBlock, /width: 1200/);
  assert.doesNotMatch(metadataBlock, /height: 630/);
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
