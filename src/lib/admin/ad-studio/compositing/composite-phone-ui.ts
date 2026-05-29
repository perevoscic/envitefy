import type { RenderedAsset } from "@/lib/admin/ad-studio/types";

export async function renderPhoneUiCompositeBuffer(
  asset: RenderedAsset,
  width: number,
  height: number,
) {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(asset.svg), { density: 220 }).resize(width, height).png().toBuffer();
}
