import sharp from "sharp";
import { encodeScanArtworkWebp } from "./artwork-webp.ts";

/** Normalize phone orientation in memory, then let FFmpeg encode the viewing copy. */
export async function encodeScanDisplayWebp(original: Buffer) {
  const normalized = await sharp(original)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const bytes = await encodeScanArtworkWebp(normalized);
  const metadata = await sharp(bytes).metadata();
  return { bytes, width: metadata.width, height: metadata.height };
}
