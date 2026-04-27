import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";

import {
  processImageBufferForUpload,
  processImageBufferWithVariants,
} from "./media-upload.ts";
import { SHARP_UPLOAD_PRESETS } from "./upload-config.ts";

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
  assert.equal(result.display.width, SHARP_UPLOAD_PRESETS.displayMaxWidth);
  assert.ok(result.display.height > 0);
  assert.ok(result.thumb.width <= SHARP_UPLOAD_PRESETS.thumbWidth);
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

test("image upload source path cannot collide with generated display asset", () => {
  const source = readFileSync(new URL("./media-upload.ts", import.meta.url), "utf8");

  assert.match(
    source,
    /pathname: `event-media\/\$\{params\.scopeId\}\/\$\{params\.usage\}\/source\/\$\{getOriginalOutputName\(/,
  );
  assert.match(
    source,
    /pathname: `event-media\/\$\{params\.scopeId\}\/\$\{params\.usage\}\/\$\{params\.assetKind\}\.webp`/,
  );
});
