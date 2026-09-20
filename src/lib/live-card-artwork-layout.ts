/** Mobile master artwork: decorative edges can adapt to nearby phone ratios. */
export const LIVE_CARD_ARTWORK = {
  width: 1024,
  height: 2176,
  size: "1024x2176",
  aspectRatio: 8 / 17,
  verticalCropLimit: 0.24,
  horizontalCropLimit: 0.1,
} as const;

export function liveCardArtworkFit(imageRatio: number, frameRatio: number): "contain" | "cover" {
  if (!Number.isFinite(imageRatio) || !Number.isFinite(frameRatio) || frameRatio <= 0)
    return "contain";
  // Legacy artwork has no guaranteed decorative margin; preserve all four edges.
  if (Math.abs(imageRatio / LIVE_CARD_ARTWORK.aspectRatio - 1) > 0.02)
    return "contain";
  const verticalCrop = Math.max(0, 1 - imageRatio / frameRatio);
  const horizontalCrop = Math.max(0, 1 - frameRatio / imageRatio);
  return verticalCrop <= LIVE_CARD_ARTWORK.verticalCropLimit &&
    horizontalCrop <= LIVE_CARD_ARTWORK.horizontalCropLimit ? "cover" : "contain";
}
