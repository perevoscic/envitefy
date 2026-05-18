import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./[id]/rsvp/route.ts", import.meta.url),
  "utf8",
);

test("RSVP route resolves an event image for confirmation email", () => {
  assert.match(source, /function resolveRsvpEmailEventImageUrl/);
  assert.match(source, /data\?\.coverImageUrl/);
  assert.match(source, /data\?\.thumbnail, inlineVariant: "thumbnail"/);
  assert.match(source, /studioCard\?\.imageUrl/);
  assert.match(source, /publicEvent\?\.imageUrl/);
  assert.match(source, /const eventImageUrl = resolveRsvpEmailEventImageUrl\(eventId, eventRow\.data\)/);
  assert.match(source, /eventImageUrl,/);
});

test("RSVP route converts inline images to the thumbnail endpoint", () => {
  assert.match(source, /\^data:image\\\//);
  assert.match(source, /\/api\/events\/\$\{eventId\}\/thumbnail\?\$\{params\.toString\(\)\}/);
  assert.match(source, /buildPublicAssetUrl/);
});
