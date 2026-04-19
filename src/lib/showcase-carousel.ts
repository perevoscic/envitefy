export function clampShowcaseIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

export function getShowcaseCardCenters(
  cards: ReadonlyArray<{ offsetLeft: number; offsetWidth: number }>,
) {
  return cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
}

export function getClosestShowcaseIndex(
  cardCenters: ReadonlyArray<number>,
  scrollLeft: number,
  clientWidth: number,
) {
  if (cardCenters.length === 0) return 0;

  const containerCenter = scrollLeft + clientWidth / 2;
  let nextActiveIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const [index, cardCenter] of cardCenters.entries()) {
    const distance = Math.abs(cardCenter - containerCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      nextActiveIndex = index;
    }
  }

  return nextActiveIndex;
}

export function getCenteredShowcaseScrollLeft(params: {
  index: number;
  cards: ReadonlyArray<{ offsetLeft: number; offsetWidth: number }>;
  clientWidth: number;
  scrollWidth: number;
}) {
  const nextIndex = clampShowcaseIndex(params.index, params.cards.length);
  const card = params.cards[nextIndex];
  if (!card) return 0;

  const targetLeft = card.offsetLeft - (params.clientWidth - card.offsetWidth) / 2;
  const maxScrollLeft = Math.max(params.scrollWidth - params.clientWidth, 0);
  return Math.min(Math.max(targetLeft, 0), maxScrollLeft);
}
