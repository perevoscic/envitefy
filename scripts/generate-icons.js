/*
  Generate PWA icons from src/assets/logo.png
  Requires: sharp (already in dependencies)
*/

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generate() {
  const srcPath = path.resolve(__dirname, "../src/assets/logo.png");
  const outDir = path.resolve(__dirname, "../public/icons");
  await ensureDir(outDir);

  if (!fs.existsSync(srcPath)) {
    console.error(`[icons] Source logo not found at ${srcPath}`);
    process.exit(0);
  }

  const iconSizes = [48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512];
  const maskableSizes = [192, 512];

  console.log(`[icons] Generating ${iconSizes.length + maskableSizes.length} icons…`);

  await Promise.all(
    iconSizes.map(async (size) => {
      const out = path.join(outDir, `icon-${size}.png`);
      await sharp(srcPath)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(out);
    })
  );

  // Maskable icons (add padding to improve safe zone for Android adaptive icons)
  await Promise.all(
    maskableSizes.map(async (size) => {
      const out = path.join(outDir, `maskable-icon-${size}.png`);
      const padded = Math.round(size * 0.9);
      await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .png()
        .composite([
          {
            input: await sharp(srcPath)
              .resize(padded, padded, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png()
              .toBuffer(),
            gravity: "center",
          },
        ])
        .toFile(out);
    })
  );

  // Apple touch icon preferred size
  const appleSizes = [120, 152, 167, 180];
  await Promise.all(
    appleSizes.map(async (size) => {
      const out = path.join(outDir, `apple-touch-icon-${size}.png`);
      await sharp(srcPath)
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(out);
    })
  );

  console.log(`[icons] Done → ${outDir}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});


