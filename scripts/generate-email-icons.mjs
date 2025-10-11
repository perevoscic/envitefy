import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join(process.cwd(), "public", "email");
mkdirSync(outDir, { recursive: true });

const strokeColor = "#4E4E50";

const icons = {
  "social-instagram": `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M35.38 10.46a2.19 2.19 0 1 0 2.16 2.22v-.06a2.18 2.18 0 0 0-2.16-2.16Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M40.55 5.5H7.45a2 2 0 0 0-1.95 2v33.1a2 2 0 0 0 2 2h33.1a2 2 0 0 0 2-2V7.45a2 2 0 0 0-2-1.95Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24 15.72a8.28 8.28 0 1 0 8.28 8.28A8.28 8.28 0 0 0 24 15.72Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  "social-facebook": `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M24 42.5V18.57a5.07 5.07 0 0 1 5.08-5.07c2.49 0 4.05.74 5.12 2.12" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="19.7" y1="23.29" x2="29.85" y2="23.29" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.48 5.5a2 2 0 0 0-2 2v33a2 2 0 0 0 2 2h33.04a2 2 0 0 0 2-2v-33a2 2 0 0 0-2-2H7.48Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  "social-youtube": `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M43.1124 14.394a5.0056 5.0056 0 0 0-3.5332-3.5332c-2.3145-.8936-24.7326-1.3314-31.2358.0256A5.0059 5.0059 0 0 0 4.81 14.42c-1.0446 4.583-1.1239 14.4914.0256 19.1767A5.006 5.006 0 0 0 8.369 37.13c4.5829 1.0548 26.3712 1.2033 31.2358 0a5.0057 5.0057 0 0 0 3.5332-3.5333c1.1138-4.993 1.1931-14.2867-.0256-19.2027Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M30.5669 23.9952 20.1208 18.004V29.9863Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`,
};

for (const [name, svg] of Object.entries(icons)) {
  const svgPath = join(outDir, `${name}.svg`);
  const pngPath = join(outDir, `${name}.png`);
  writeFileSync(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg))
    .resize({ width: 36, height: 36, fit: "contain" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pngPath);
  console.log(`Generated ${svgPath} and ${pngPath}`);
}
