import assert from "node:assert/strict";
import test from "node:test";
import {
  clampShowcaseIndex,
  getCenteredShowcaseScrollLeft,
  getClosestShowcaseIndex,
  getShowcaseCardCenters,
} from "./showcase-carousel.ts";

test("showcase carousel centers the first, middle, and last cards when edge spacers exist", () => {
  const cards = [
    { offsetLeft: 330, offsetWidth: 300 },
    { offsetLeft: 654, offsetWidth: 300 },
    { offsetLeft: 978, offsetWidth: 300 },
    { offsetLeft: 1302, offsetWidth: 300 },
    { offsetLeft: 1626, offsetWidth: 300 },
  ];

  const clientWidth = 960;
  const scrollWidth = 2256;
  const cardCenters = getShowcaseCardCenters(cards);

  for (const index of [0, 2, 4]) {
    const targetLeft = getCenteredShowcaseScrollLeft({
      index,
      cards,
      clientWidth,
      scrollWidth,
    });
    const activeIndex = getClosestShowcaseIndex(cardCenters, targetLeft, clientWidth);
    assert.equal(activeIndex, index);
  }
});

test("showcase carousel clamps requested indices to the available range", () => {
  assert.equal(clampShowcaseIndex(-4, 5), 0);
  assert.equal(clampShowcaseIndex(2, 5), 2);
  assert.equal(clampShowcaseIndex(99, 5), 4);
  assert.equal(clampShowcaseIndex(8, 0), 0);
});

test("showcase carousel keeps narrow mobile cards centered when cards shrink below desktop width", () => {
  const cards = [
    { offsetLeft: 24, offsetWidth: 232 },
    { offsetLeft: 272, offsetWidth: 232 },
    { offsetLeft: 520, offsetWidth: 232 },
  ];

  const clientWidth = 288;
  const scrollWidth = 776;
  const cardCenters = getShowcaseCardCenters(cards);

  const middleTargetLeft = getCenteredShowcaseScrollLeft({
    index: 1,
    cards,
    clientWidth,
    scrollWidth,
  });
  assert.equal(middleTargetLeft, 244);
  assert.equal(getClosestShowcaseIndex(cardCenters, middleTargetLeft, clientWidth), 1);

  const lastTargetLeft = getCenteredShowcaseScrollLeft({
    index: 2,
    cards,
    clientWidth,
    scrollWidth,
  });
  assert.equal(lastTargetLeft, 488);
  assert.equal(getClosestShowcaseIndex(cardCenters, lastTargetLeft, clientWidth), 2);
});
