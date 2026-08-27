import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("event OG metadata shares saved artwork at its natural aspect ratio", () => {
  const pageSource = readSource("src/app/event/[id]/page.tsx");
  const resolverSource = readSource("src/lib/share-image.ts");

  assert.match(pageSource, /resolveEventShareImage/);
  assert.match(pageSource, /async function resolveAbsoluteEventShareImage/);
  assert.match(pageSource, /await resolveAbsoluteEventShareImage\(data\)/);
  assert.match(pageSource, /await absoluteUrl\("\/og-default\.jpg"\)/);
  assert.match(resolverSource, /toPublicShareMediaUrl/);
  assert.match(resolverSource, /attachmentThumbnail && selectedRepresentsAttachmentArtwork/);

  const metadataBlock = pageSource.match(
    /export async function generateMetadata[\s\S]*?(?=\nexport async function generateViewport)/,
  )?.[0];
  assert.ok(metadataBlock, "expected event metadata generator");
  assert.match(metadataBlock, /images: \[openGraphImage\]/);
  assert.match(metadataBlock, /images: \[\{ url: img, alt: title \}\]/);
  assert.doesNotMatch(metadataBlock, /width: 1200/);
  assert.doesNotMatch(metadataBlock, /height: 630/);
});

test("event share metadata has no duplicate generated image pipeline", () => {
  assert.equal(fs.existsSync(path.join(process.cwd(), "src/app/event/[id]/opengraph-image.tsx")), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), "src/app/api/events/[id]/og-data/route.ts")), false);
});
