import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import { wordmarkWidths } from "./generate-performance-brand-assets.mjs";

const root = new URL("../", import.meta.url);

test("the compact Concierge mask preserves every resized alpha pixel", async () => {
  const original = new URL("public/brand/concierge-chat.webp", root);
  const prepared = new URL("public/brand/responsive-v1/concierge-168.webp", root);
  const [expected, actual] = await Promise.all([
    sharp(await readFile(original)).resize({ height: 168 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(await readFile(prepared)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  assert.equal(actual.info.width, expected.info.width);
  assert.equal(actual.info.height, expected.info.height);
  for (let offset = 3; offset < actual.data.length; offset += 4) {
    assert.equal(actual.data[offset], expected.data[offset], `mask alpha changed at ${offset}`);
  }
  assert.ok((await stat(prepared)).size < 5000, "the 56px control must not fetch the 41KB original");
});

test("the native Concierge image retains the exact mask alpha and authored gold", async () => {
  const [mask, icon] = await Promise.all(["concierge-168", "concierge-gold-168"].map(async (name) => sharp(await readFile(new URL(`public/brand/responsive-v1/${name}.webp`, root))).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  assert.deepEqual(icon.info, mask.info);
  for (let offset = 0; offset < icon.data.length; offset += 4) {
    assert.equal(icon.data[offset + 3], mask.data[offset + 3]);
    if (icon.data[offset + 3]) assert.deepEqual([...icon.data.subarray(offset, offset + 3)], [249, 223, 148]);
  }
});

test("prepared wordmarks are transparent WebPs with responsive dimensions and smaller transfers", async () => {
  for (const name of ["wordmark", "wordmark-white"]) {
    const original = new URL(`public/brand/wordmark-v2/envitefy-${name}.webp`, root);
    for (const width of wordmarkWidths) {
      const asset = new URL(`public/brand/responsive-v1/${name}-${width}.webp`, root);
      const metadata = await sharp(await readFile(asset)).metadata();
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.width, width);
      assert.ok(Math.abs(metadata.height - width * 402 / 1194) <= 0.5);
      assert.equal(metadata.hasAlpha, true);
      if (width <= 600) assert.ok((await stat(asset)).size < (await stat(original)).size);
    }
  }
});
