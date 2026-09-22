import sharp from "sharp";

/** Square WebP used for uploaded and Google profile photos. */
export async function renderProfileAvatarWebp(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .rotate()
    .resize(512, 512, { fit: "cover", position: "attention" })
    .webp({ quality: 88 })
    .toBuffer();
}
