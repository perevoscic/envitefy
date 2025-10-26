/*
  Generate a multi-size favicon.ico from src/assets/Logo.png
*/

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  const { default: toIco } = await import("png-to-ico");
  const srcPath = path.resolve(__dirname, "../src/assets/Logo.png");
  const outDir = path.resolve(__dirname, "../src/app");
  const sizes = [16, 24, 32, 48, 64];

  if (!fs.existsSync(srcPath)) {
    console.error(`[favicon] Source logo not found at ${srcPath}`);
    process.exit(1);
  }

  await ensureDir(outDir);

  // Create size variants in-memory
  const pngBuffers = [];
  for (const size of sizes) {
    const buf = await sharp(srcPath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push(buf);
  }

  const icoOutput = path.join(outDir, "favicon.ico");
  const icoBuffer = await toIco(pngBuffers);
  await fs.promises.writeFile(icoOutput, icoBuffer);
  console.log(`[favicon] Done → ${icoOutput}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


