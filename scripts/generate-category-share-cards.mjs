import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

// Pre-render public JPEGs so message crawlers never need JavaScript or a renderer.
const root = fileURLToPath(new URL("../", import.meta.url));
const cards = JSON.parse(await fs.readFile(path.join(root, "src/data/category-share-cards.json"), "utf8"));
const output = path.join(root, "public/og/categories");
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
async function asset(source, mime) {
  const bytes = await fs.readFile(path.join(root, "public", source.replace(/^\//, "")));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const [serif, sans, wordmark] = await Promise.all([
  asset("/fonts/gallery/cormorantinfant-918ac7694663.woff2", "font/woff2"),
  asset("/fonts/Josefin_Sans/JosefinSans-VariableFont_wght.ttf", "font/ttf"),
  asset("/brand/wordmark-v2/envitefy-wordmark.webp", "image/webp"),
]);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [category, card] of Object.entries(cards)) {
    const photo = await asset(card.photo, "image/webp");
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
      @font-face{font-family:Editorial;src:url("${serif}") format("woff2");font-weight:400}
      @font-face{font-family:Brand;src:url("${sans}") format("truetype");font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
      body{background:${card.paper};color:${card.ink};font-family:Brand,sans-serif}
      .wordmark{position:absolute;left:56px;top:40px;width:206px;height:72px;object-fit:contain}
      .copy{position:absolute;left:58px;top:166px;width:548px}
      .category{margin:0 0 27px;font-size:20px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${card.accent}}
      h1{margin:0;font-family:Editorial,serif;font-weight:400;font-size:85px;line-height:.99;letter-spacing:-2.2px}
      h1 span{display:block;white-space:nowrap}h1 span:last-child{color:${card.accent}}
      .description{margin:29px 0 0;max-width:475px;font-size:26px;font-weight:400;line-height:1.35}
      .address{position:absolute;left:58px;bottom:39px;font-size:18px;letter-spacing:.3px}
      .photo{position:absolute;left:648px;top:30px;width:520px;height:570px;border-radius:260px 260px 18px 18px;object-fit:cover;object-position:${card.position}}
      .rule{position:absolute;left:58px;bottom:84px;width:476px;height:1px;background:${card.accent};opacity:.3}
    </style></head><body>
      <img class="wordmark" src="${wordmark}" alt="Envitefy">
      <div class="copy"><p class="category">${escape(card.name)}</p>
      <h1>${card.headline.map((line) => `<span>${escape(line)}</span>`).join("")}</h1>
      <p class="description">${escape(card.description)}</p></div>
      <div class="rule"></div><div class="address">envitefy.com/${category}</div>
      <img class="photo" src="${photo}" alt="">
    </body></html>`, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
    const overflow = await page.evaluate(() => [...document.querySelectorAll("h1 span")].some((line) => line.scrollWidth > line.clientWidth));
    if (overflow) throw new Error(`${category}: share card headline overflows`);
    const image = await page.screenshot({ type: "png" });
    const destination = path.join(output, `${category}-v1.jpg`);
    await sharp(image).jpeg({ quality: 88, mozjpeg: true }).toFile(destination);
    console.log(path.relative(root, destination));
  }
} finally {
  await browser.close();
}
