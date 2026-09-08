import sharp from "sharp";
import { productContract, type StudioProduct } from "./product-contract.ts";
import type { StudioEventDetails, StudioLiveCardMetadata } from "./types.ts";

export { flyerTextBlocks } from "./artwork-copy.ts";

/** Export the verified composition intact, including its designed lettering. */
export async function composeFlyerExport(
  artwork: string,
  _event: StudioEventDetails,
  _copy: StudioLiveCardMetadata | null,
  product: StudioProduct,
): Promise<string> {
  if (product !== "digital_flyer" && product !== "printable_flyer") return artwork;
  if (!/^data:image\/[\w.+-]+;base64,/.test(artwork)) {
    throw new Error("Flyer export requires an inline generated image.");
  }
  const { width, height, dpi } = productContract(product);
  const input = Buffer.from(artwork.slice(artwork.indexOf(",") + 1), "base64");
  const { dominant } = await sharp(input).stats();
  const png = await sharp(input)
    .resize(width, height, { fit: "contain", background: dominant })
    .withMetadata({ density: dpi })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
