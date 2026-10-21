import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
export const WHITE_BRAND_ASSET_SOURCES = [
  ["public/brand/e-only.png", "public/brand/white-v1/e-only.png"],
  ["public/brand/e-only.png", "public/email/white-v1/e-only.png"],
  ["public/brand/envitefy-wordmark.png", "public/brand/white-v1/envitefy-wordmark.png"],
  ["public/email/envitefy-wordmark-email.png", "public/email/white-v1/envitefy-wordmark-email.png"],
  ...["instagram", "facebook", "youtube", "tiktok", "reddit"].map((network) => [
    `public/email/social-${network}.png`,
    `public/email/white-v1/social-${network}.png`,
  ]),
];

// Recolor pixels rather than rerendering the geometry: antialiasing and alpha are exact.
export async function generateWhiteBrandAssets() {
  for (const [source, destination] of WHITE_BRAND_ASSET_SOURCES) {
    const { data, info } = await sharp(join(root, source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let offset = 0; offset < data.length; offset += info.channels) {
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
    }
    const output = join(root, destination);
    await mkdir(dirname(output), { recursive: true });
    await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
  }

  for (const network of ["instagram", "facebook", "youtube", "tiktok", "reddit"]) {
    const source = await readFile(join(root, `public/email/social-${network}.svg`), "utf8");
    // Preserve the source paths, viewBox, widths, and the approved Reddit silhouette.
    await writeFile(
      join(root, `public/email/white-v1/social-${network}.svg`),
      source.replaceAll(/#4e4e50/gi, "#FFFFFF"),
    );
  }

  const matteDirectory = join(root, "public/email/white-v1/matte");
  await mkdir(matteDirectory, { recursive: true });
  for (const [, destination] of WHITE_BRAND_ASSET_SOURCES.filter(([, target]) => target.startsWith("public/email/"))) {
    const filename = destination.split("/").at(-1);
    await sharp(join(root, destination))
      .flatten({ background: "#251F2D" })
      .png({ compressionLevel: 9 })
      .toFile(join(matteDirectory, filename));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await generateWhiteBrandAssets();
  console.log(`Generated ${WHITE_BRAND_ASSET_SOURCES.length} white PNGs, five SVGs, and seven email matte PNGs; original assets unchanged.`);
}
