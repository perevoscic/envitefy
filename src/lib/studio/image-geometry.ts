import sharp from "sharp";
import { resolveStudioSourceImage } from "./source-image.ts";
import type { StudioProduct } from "./product-contract.ts";
import type { ImageGenerationOptions } from "./openai-image-stream.ts";

export type StudioImageGeometry = { width: number; height: number; size: NonNullable<ImageGenerationOptions["size"]> };
export type StudioImageGeometryCheck = { ok: true; width: number; height: number } | { ok: false; issue: "invalid_image" | "image_geometry_mismatch"; message: string };
export const imageGeometryDeps = { resolveStudioSourceImage };

async function decodedDimensions(bytes: Buffer): Promise<{ width: number; height: number }> {
  // Reading metadata alone accepts some truncated files. Decode actual pixels too.
  const decoder = sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 });
  const metadata = await decoder.metadata();
  if (!metadata.width || !metadata.height || (metadata.pages || 1) !== 1) throw new Error("Invalid static image");
  const decoded = await decoder.clone().rotate().raw().toBuffer({ resolveWithObject: true });
  return { width: decoded.info.width, height: decoded.info.height };
}

/** Read accepted source geometry once, before any paid operation. */
export async function prepareStudioImageGeometry(product: StudioProduct, sourceImageDataUrl?: string): Promise<StudioImageGeometry> {
  if (!sourceImageDataUrl) return product === "event_page" ? { width: 1536, height: 1024, size: "1536x1024" } : { width: 1024, height: 1536, size: "1024x1536" };
  const source = await imageGeometryDeps.resolveStudioSourceImage(sourceImageDataUrl);
  if (!source) throw new Error("The previous image could not be opened. Reattach that image before editing.");
  let dimensions: { width: number; height: number };
  try { dimensions = await decodedDimensions(Buffer.from(source.data, "base64")); }
  catch { throw new Error("The previous image is damaged or is not a supported static image. Reattach the original before editing."); }
  const ratio = dimensions.width / dimensions.height;
  const near = (expected: number) => Math.abs(ratio / expected - 1) <= 0.02;
  const size: StudioImageGeometry["size"] = near(1) ? "1024x1024" : near(1.5) ? "1536x1024" : near(2 / 3) ? "1024x1536" : "auto";
  return { ...dimensions, size };
}

export async function validateStudioImageGeometry(artwork: string, expected: StudioImageGeometry): Promise<StudioImageGeometryCheck> {
  if (!/^data:image\/(?:png|jpeg|webp);base64,/i.test(artwork)) return { ok: false, issue: "invalid_image", message: "The generated file is not a supported image. Your previous image is unchanged." };
  let dimensions: { width: number; height: number };
  try { dimensions = await decodedDimensions(Buffer.from(artwork.slice(artwork.indexOf(",") + 1), "base64")); }
  catch { return { ok: false, issue: "invalid_image", message: "The generated image could not be decoded completely. Your previous image is unchanged." }; }
  const expectedRatio = expected.width / expected.height;
  const actualRatio = dimensions.width / dimensions.height;
  if (Math.abs(actualRatio / expectedRatio - 1) > 0.02 || dimensions.width < Math.min(expected.width, 512) || dimensions.height < Math.min(expected.height, 512)) {
    return { ok: false, issue: "image_geometry_mismatch", message: `Keep the complete composition at the original ${expected.width}:${expected.height} aspect ratio and readable resolution; do not crop or change its orientation.` };
  }
  return { ok: true, ...dimensions };
}
