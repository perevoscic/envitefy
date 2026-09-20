import assert from "node:assert/strict";
import test from "node:test";
import { LIVE_CARD_ARTWORK, liveCardArtworkFit } from "./live-card-artwork-layout.ts";

test("tall masters fill common phone frames with only decorative-edge cropping", () => {
  for (const [width, height] of [[390, 844], [412, 915], [360, 640], [430, 932]]) {
    assert.equal(liveCardArtworkFit(LIVE_CARD_ARTWORK.aspectRatio, (width - 32) / (height * 0.9)), "cover");
  }
  assert.equal(liveCardArtworkFit(860 / 1828, 358 / 759.6), "cover");
});
test("extreme proportions and old artwork show the entire composition", () => {
  assert.equal(liveCardArtworkFit(LIVE_CARD_ARTWORK.aspectRatio, 1), "contain");
  assert.equal(liveCardArtworkFit(LIVE_CARD_ARTWORK.aspectRatio, 0.35), "contain");
  assert.equal(liveCardArtworkFit(2 / 3, 8 / 17), "contain");
  assert.equal(liveCardArtworkFit(1, 8 / 17), "contain");
  assert.equal(liveCardArtworkFit(0, 0), "contain");
});
