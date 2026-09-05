import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const outDir = join(process.cwd(), "public", "email");
mkdirSync(outDir, { recursive: true });

const strokeColor = "#4E4E50";
const redditMarkData = readFileSync(join(outDir, "social-reddit-mark.png")).toString("base64");

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
  <path d="M7.48 5.5a2 2 0 0 0-2 2v33a2 2 0 0 0 2 2h33.04a2 2 0 0 0 2-2v-33a2 2 0 0 0-2-2H7.48Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 16 32 24 20 32Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  "social-tiktok": `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M7.48 5.5a2 2 0 0 0-2 2v33a2 2 0 0 0 2 2h33.04a2 2 0 0 0 2-2v-33a2 2 0 0 0-2-2H7.48Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20.838 23.04A6.33 6.33 0 1 0 27.162 29.4V12.3A6.33 6.33 0 0 0 33.492 18.63" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  "social-reddit": `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
  <defs>
    <filter id="reddit-ink" color-interpolation-filters="sRGB">
      <feFlood flood-color="${strokeColor}" result="ink"/>
      <feComposite in="ink" in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>
  <path d="M7.48 5.5a2 2 0 0 0-2 2v33a2 2 0 0 0 2 2h33.04a2 2 0 0 0 2-2v-33a2 2 0 0 0-2-2H7.48Z" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <image x="10" y="10" width="28" height="28" href="data:image/png;base64,${redditMarkData}" filter="url(#reddit-ink)"/>
</svg>`,
};

const requestedIcons = new Set(process.argv.slice(2));
for (const name of requestedIcons) {
  if (!Object.hasOwn(icons, name)) throw new Error(`Unknown email icon: ${name}`);
}

for (const [name, svg] of Object.entries(icons)) {
  if (requestedIcons.size > 0 && !requestedIcons.has(name)) continue;
  const svgPath = join(outDir, `${name}.svg`);
  const pngPath = join(outDir, `${name}.png`);
  writeFileSync(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg))
    .resize({ width: 36, height: 36, fit: "contain" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pngPath);
  console.log(`Generated ${svgPath} and ${pngPath}`);
}
