import { getLuminance } from "./scanned-invite-palette.js";

type CaptionPlacement = {
  left: number;
  top: number;
  ink: string;
  position: string;
};

/** Find a quiet, readable area in an already cropped thumbnail. Coordinates
 * are percentages so placement follows the original image at every size. */
export function chooseThumbnailCaption({
  pixels,
  width,
  height,
  captionWidth,
  captionHeight,
  preferredInk,
  centered = false,
}: {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  captionWidth: number;
  captionHeight: number;
  preferredInk: string;
  centered?: boolean;
}): CaptionPlacement {
  const insetX = width * 0.07;
  const insetY = Math.min(width * 0.08, (height - captionHeight) / 2);
  const right = Math.max(insetX, width - insetX - captionWidth);
  const bottom = Math.max(insetY, height - insetY - captionHeight);
  const horizontal = centered
    ? ([
        ["center", (width - captionWidth) / 2],
        ["left", insetX],
        ["right", right],
      ] as const)
    : ([
        ["left", insetX],
        ["right", right],
        ["center", (width - captionWidth) / 2],
      ] as const);
  const vertical = [
    ["bottom", bottom],
    ["top", insetY],
    ["middle", (height - captionHeight) / 2],
  ] as const;
  const colors = [...new Set([preferredInk, "#111111", "#ffffff"])].map((ink) => ({
    ink,
    luminance: getLuminance(ink),
  }));
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminances: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) {
    luminances.push(
      0.2126 * linear(pixels[index]) +
        0.7152 * linear(pixels[index + 1]) +
        0.0722 * linear(pixels[index + 2]),
    );
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  let best: CaptionPlacement = {
    left: 7,
    top: (bottom / height) * 100,
    ink: preferredInk,
    position: "bottom-left",
  };
  for (const [verticalName, top] of vertical) {
    for (const [horizontalName, left] of horizontal) {
      const samples: number[] = [];
      for (
        let y = Math.max(0, Math.floor(top));
        y < Math.min(height, Math.ceil(top + captionHeight));
        y++
      ) {
        for (
          let x = Math.max(0, Math.floor(left));
          x < Math.min(width, Math.ceil(left + captionWidth));
          x++
        ) {
          samples.push(luminances[y * width + x]);
        }
      }
      if (!samples.length) continue;
      samples.sort((a, b) => a - b);
      const low = samples[Math.floor(samples.length * 0.1)];
      const high = samples[Math.floor(samples.length * 0.9)];
      for (const { ink, luminance } of colors) {
        const contrasts = samples
          .map(
            (sample) => (Math.max(sample, luminance) + 0.05) / (Math.min(sample, luminance) + 0.05),
          )
          .sort((a, b) => a - b);
        const contrast = contrasts[Math.floor(contrasts.length * 0.1)];
        const coverage = contrasts.filter((value) => value >= 4.5).length / contrasts.length;
        // Once contrast is sufficient, prefer a calm edge over the central
        // subject. Never introduce a gradient or a plate to hide the artwork.
        const score =
          Math.min(contrast, 7) +
          coverage * 3 -
          (high - low) * 2 -
          (verticalName === "middle" ? 1.5 : 0) +
          (ink === preferredInk && contrast >= 4.5 ? 0.35 : 0);
        if (score <= bestScore + 0.01) continue;
        bestScore = score;
        best = {
          left: (left / width) * 100,
          top: (top / height) * 100,
          ink,
          position: `${verticalName}-${horizontalName}`,
        };
      }
    }
  }
  return best;
}
