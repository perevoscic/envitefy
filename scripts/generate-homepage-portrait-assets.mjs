import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
export const source = "public/images/landing/hero/garden-brunch-desktop.webp";
export const destination = "public/images/landing/hero/portrait-v1";
export const variants = [
  { format: "avif", width: 480, height: 576, quality: 35 },
  { format: "avif", width: 768, height: 922, quality: 35 },
  { format: "webp", width: 480, height: 576, quality: 25 },
  { format: "webp", width: 768, height: 922, quality: 25 },
];

export function portraitCrop(width, height) {
  // CSS cover in the unchanged 5:6 phone frame, object-position: 59% center.
  const visibleWidth = (height * 5) / 6;
  const left = (width - visibleWidth) * 0.59;
  return {
    exact: { left, top: 0, width: visibleWidth, height },
    extract: { left: Math.round(left), top: 0, width: Math.round(visibleWidth), height },
  };
}

export async function generate() {
  const original = await readFile(path.join(root, source));
  const metadata = await sharp(original).metadata();
  if (metadata.width !== 1672 || metadata.height !== 941) {
    throw new Error("Review phone crop geometry when the original photograph changes dimensions.");
  }
  const crop = portraitCrop(metadata.width, metadata.height);
  const directory = path.join(root, destination);
  await mkdir(directory, { recursive: true });
  const outputs = [];
  for (const variant of variants) {
    const filename = `garden-brunch-${variant.width}.${variant.format}`;
    const pipeline = sharp(original)
      .extract(crop.extract)
      .resize(variant.width, variant.height, { fit: "fill" });
    const bytes = await (variant.format === "avif"
      ? pipeline.avif({ quality: variant.quality, effort: 6 })
      : pipeline.webp({ quality: variant.quality, effort: 6 })).toBuffer();
    await writeFile(path.join(directory, filename), bytes);
    outputs.push({
      ...variant,
      filename,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  const manifest = {
    source,
    sourceSha256: createHash("sha256").update(original).digest("hex"),
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    objectPosition: "59% center",
    frame: "5 / 6",
    crop,
    outputs,
  };
  await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

if (import.meta.main) await generate();
