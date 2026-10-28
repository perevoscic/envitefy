/*
  Generate a multi-size favicon.ico from public/favicon.png
*/

const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  const srcPath = path.resolve(__dirname, "../public/favicon.png");
  const outDir = path.resolve(__dirname, "../src/app");
  const sizes = [16, 24, 32, 48, 64];

  if (!fs.existsSync(srcPath)) {
    console.error("[favicon] Source logo not found at public/favicon.png");
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
  // ICO permits lossless PNG entries. Keep all five sizes without the larger
  // uncompressed bitmap copies that compete with first-load page resources.
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(pngBuffers[index].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += pngBuffers[index].length;
  });
  const icoBuffer = Buffer.concat([header, ...pngBuffers]);
  await fs.promises.writeFile(icoOutput, icoBuffer);
  console.log(`[favicon] Source: ${path.relative(process.cwd(), srcPath)} → ${icoOutput}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

