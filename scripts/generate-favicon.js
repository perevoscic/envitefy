/*
  Generate a multi-size favicon.ico from src/assets/LogoEonly.png (falls back to logo.png)
*/

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function resolveSource() {
  const candidates = ["../src/assets/LogoEonly.png", "../src/assets/logo.png"];
  for (const candidate of candidates) {
    const fullPath = path.resolve(__dirname, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function main() {
  const { default: toIco } = await import("png-to-ico");
  const srcPath = resolveSource();
  const outDir = path.resolve(__dirname, "../src/app");
  const sizes = [16, 24, 32, 48, 64];

  if (!srcPath) {
    console.error("[favicon] Source logo not found (expected LogoEonly.png or logo.png)");
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

  // Generate favicon.ico in src/app (Next.js App Router)
  // Note: Do NOT also create public/favicon.ico as it conflicts with Next.js App Router's
  // automatic serving of src/app/favicon.ico at /favicon.ico
  const icoOutput = path.join(outDir, "favicon.ico");
  const icoBuffer = await toIco(pngBuffers);
  await fs.promises.writeFile(icoOutput, icoBuffer);
  console.log(`[favicon] Source: ${path.relative(process.cwd(), srcPath)} → ${icoOutput}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

