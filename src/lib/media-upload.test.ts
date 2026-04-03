import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import {
  processImageBufferForUpload,
  processImageBufferWithVariants,
} from "./media-upload";

test("processImageBufferForUpload generates bounded webp display and thumb assets", async () => {
  const input = await sharp({
    create: {
      width: 2400,
      height: 1200,
      channels: 3,
      background: { r: 120, g: 80, b: 40 },
    },
  })
    .jpeg()
    .toBuffer();

  const result = await processImageBufferForUpload(input);
  const displayMeta = await sharp(result.display.bytes).metadata();
  const thumbMeta = await sharp(result.thumb.bytes).metadata();

  assert.equal(result.original.width, 2400);
  assert.equal(displayMeta.format, "webp");
  assert.equal(thumbMeta.format, "webp");
  assert.equal(result.display.width, 1900);
  assert.ok(result.display.height > 0);
  assert.ok(result.thumb.width <= 400);
  assert.ok(result.thumb.height > 0);
});

test("processImageBufferWithVariants supports display-only optimization", async () => {
  const input = await sharp({
    create: {
      width: 2200,
      height: 1100,
      channels: 3,
      background: { r: 40, g: 90, b: 140 },
    },
  })
    .png()
    .toBuffer();

  const result = await processImageBufferWithVariants(input, {
    displayMaxWidth: 1600,
    includeThumb: false,
  });
  const displayMeta = await sharp(result.display.bytes).metadata();

  assert.equal(displayMeta.format, "webp");
  assert.equal(result.display.width, 1600);
  assert.equal(result.thumb, null);
});
