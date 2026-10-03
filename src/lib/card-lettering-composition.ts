import sharp from "sharp";

/** Composition never lets a provider replace scene pixels. Layout needs no AI call. */
export async function composeCardLettering(background: Buffer, isolated: Buffer, placement?: { left: number; top: number; width: number; height: number }) {
  const metadata = await sharp(background, { limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Background dimensions are missing.");
  const { data, info } = await sharp(isolated, { limitInputPixels: 40_000_000 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const alpha = data[(y * info.width + x) * 4 + 3];
    if (alpha === 0) transparent++;
    if (alpha > 8) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  // Reject opaque rectangles and empty assets, rather than claiming transparency.
  if (transparent / (info.width * info.height) < (placement ? 0.01 : 0.3) || right < left || bottom < top)
    throw new Error("The lettering is not a usable isolated transparent asset.");
  const canvasWidth = metadata.width, canvasHeight = metadata.height;
  const region = placement || { left: Math.round(canvasWidth * 0.12), top: Math.round(canvasHeight * 0.18), width: Math.floor(canvasWidth * 0.76), height: Math.floor(canvasHeight * 0.30) };
  if (![region.left, region.top, region.width, region.height].every(Number.isInteger) || region.left < 0 || region.top < 0 || region.width <= 0 || region.height <= 0 || region.left + region.width > canvasWidth || region.top + region.height > canvasHeight)
    throw new Error("Lettering placement must fit inside the saved background.");
  const layer = await sharp(isolated).extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(region.width, region.height, { fit: "inside" }).webp({ lossless: true }).toBuffer();
  const croppedPixels = await sharp(layer).ensureAlpha().raw().toBuffer();
  let clearPixels = 0;
  for (let i = 3; i < croppedPixels.length; i += 4) if (croppedPixels[i] === 0) clearPixels++;
  if (clearPixels / (croppedPixels.length / 4) < 0.01) throw new Error("The lettering crop contains an opaque panel instead of isolated strokes.");
  const placed = await sharp(layer).metadata();
  const layout = { left: region.left + Math.floor((region.width - placed.width!) / 2), top: region.top, width: placed.width!, height: placed.height!, canvasWidth, canvasHeight };
  const composite = await sharp(background).composite([{ input: layer, left: layout.left, top: layout.top }]).webp({ lossless: true }).toBuffer();
  return { layer, composite, layout };
}
