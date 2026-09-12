import assert from "node:assert/strict";
import test from "node:test";
import { chooseThumbnailCaption } from "./thumbnail-caption.ts";

function image(width, height, colorAt) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      pixels.set([...colorAt(x, y), 255], offset);
    }
  }
  return { pixels, width, height };
}

test("moves a name away from a busy bottom to clear artwork above", () => {
  const result = chooseThumbnailCaption({
    ...image(96, 128, (x, y) =>
      y < 28 ? [245, 245, 245] : (x + y) % 2 ? [0, 0, 0] : [255, 255, 255],
    ),
    captionWidth: 70,
    captionHeight: 16,
    preferredInk: "#ffffff",
  });
  assert.match(result.position, /^top-/);
  assert.equal(result.ink, "#111111");
});

test("uses light ink on dark artwork and preserves readable dark design ink", () => {
  for (const [color, preferredInk, expected] of [
    [[10, 10, 10], "#18345b", "#ffffff"],
    [[245, 245, 245], "#18345b", "#18345b"],
  ]) {
    const result = chooseThumbnailCaption({
      ...image(96, 128, () => color),
      captionWidth: 65,
      captionHeight: 16,
      preferredInk,
    });
    assert.equal(result.ink, expected);
  }
});

test("wrapped names stay inside narrow thumbnails and placement is stable", () => {
  const options = {
    ...image(64, 128, (x, y) => [x * 3, y, 60]),
    captionWidth: 55,
    captionHeight: 42,
    preferredInk: "#ffffff",
    centered: true,
  };
  const result = chooseThumbnailCaption(options);
  assert.deepEqual(chooseThumbnailCaption(options), result);
  assert.ok(result.left >= 0 && result.top >= 0);
  assert.ok(result.left + (options.captionWidth / options.width) * 100 <= 100);
  assert.ok(result.top + (options.captionHeight / options.height) * 100 <= 100);
});
