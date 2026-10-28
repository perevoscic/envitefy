const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const postcss = require("postcss");
const { chromium } = require("playwright");

const modulePath = "src/app/landing/LandingExperience.module.css";
const css = fs.readFileSync(modulePath, "utf8");
const unicodeRange = "U+0000-024F, U+1E00-1EFF, U+2000-206F, U+20A0-20CF, U+2100-214F, U+2190-21FF, U+2212, U+FEFF, U+FFFD";
const fonts = [
  { slug: "inter", alias: "Envitefy Homepage Inter", original: "Inter", maxBytes: 51000 },
  { slug: "playfairdisplay", alias: "Envitefy Homepage Playfair", original: "Playfair Display", maxBytes: 30000 },
];
const asset = (font) => `/fonts/marketing/homepage-v1/${font.slug}-latin-extended.woff2`;
const originalAsset = (font) => `/fonts/birthday/${font.slug}.woff2`;

function faces(source) {
  const result = [];
  postcss.parse(source).walkAtRules("font-face", (face) => result.push(face));
  return result;
}

function executable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  return path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
}

test("homepage subsets use new aliases and retain complete fonts as the Unicode fallback", () => {
  const parsed = postcss.parse(css);
  const root = parsed.nodes.find((node) => node.type === "rule" && node.selector === ".root");
  const footer = fs.readFileSync("src/components/marketing/marketing-footer.module.css", "utf8");
  const page = fs.readFileSync("src/app/landing/page.tsx", "utf8");
  const originals = faces(fs.readFileSync("src/components/birthdays/redesign/birthday-fonts.css", "utf8"));
  for (const font of fonts) {
    const face = faces(css).find((rule) => rule.nodes.some((node) => node.prop === "font-family" && node.value === `"${font.alias}"`));
    assert.ok(face, `missing homepage face ${font.alias}`);
    const declaration = Object.fromEntries(face.nodes.filter((node) => node.type === "decl").map((node) => [node.prop, node.value]));
    assert.equal(declaration["font-weight"], "400", "preserve the authored regular face and existing browser synthesis");
    assert.equal(declaration["font-style"], "normal");
    assert.equal(declaration["unicode-range"], unicodeRange);
    assert.ok(declaration.src.includes(asset(font)));
    assert.ok(root.toString().includes(`"${font.alias}", "${font.original}"`));
    assert.ok(footer.includes(`"${font.alias}", "${font.original}"`));
    assert.ok(page.includes(`href="${asset(font)}"`));
    assert.ok(!page.includes(`href="${originalAsset(font)}"`));
    assert.ok(originals.some((rule) => rule.toString().includes(`font-family: '${font.original}'`) && rule.toString().includes(originalAsset(font))), "complete authored registration remains available");
    assert.ok(fs.statSync(path.join("public", asset(font))).size <= font.maxBytes);
  }
});

test("homepage aliases preserve glyph pixels and metrics across Latin and full-font fallback", { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true, executablePath: executable() });
  try {
    const page = await browser.newPage();
    await page.route("http://homepage-fonts.test/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      return route.fulfill(pathname.startsWith("/fonts/")
        ? { contentType: "font/woff2", body: fs.readFileSync(path.join("public", pathname)) }
        : { contentType: "text/html", body: "<!doctype html><meta charset=utf-8>" });
    });
    await page.goto("http://homepage-fonts.test/");
    const result = await page.evaluate(async ({ fonts, unicodeRange }) => {
      const failures = [];
      let cases = 0;
      for (const { slug } of fonts) {
        const full = new FontFace(`${slug}-full`, `url(/fonts/birthday/${slug}.woff2)`);
        const subset = new FontFace(`${slug}-subset`, `url(/fonts/marketing/homepage-v1/${slug}-latin-extended.woff2)`, { unicodeRange });
        document.fonts.add(await full.load());
        document.fonts.add(await subset.load());
        for (const text of ["Beautiful invites. All the details. One link.", "Envitefy · Àéœ – 0123456789 • fi ffi fl ffl", "Bản mời · Célébration · Einladung € £ →", "Latin + Ελληνικά Кириллица + ﬃ"]) {
          for (const style of ["normal", "italic"]) for (const weight of [400, 600, 700, 900]) {
            const renders = ["full", "subset"].map((suffix) => {
              const canvas = document.createElement("canvas"); canvas.width = 2000; canvas.height = 100;
              const context = canvas.getContext("2d");
              context.font = `${style} ${weight} 32px "${slug}-${suffix}", "${slug}-full"`;
              context.fillText(text, 10, 60);
              return { width: context.measureText(text).width, pixels: context.getImageData(0, 0, 2000, 100).data };
            });
            cases++;
            if (renders[0].width !== renders[1].width || renders[0].pixels.some((value, index) => value !== renders[1].pixels[index])) failures.push({ slug, text, style, weight });
          }
        }
      }
      return { cases, failures };
    }, { fonts, unicodeRange });
    assert.equal(result.cases, 64);
    assert.deepEqual(result.failures, []);
    await page.close();

    const fallback = await browser.newPage();
    const requests = [];
    const originalFaces = faces(fs.readFileSync("src/components/birthdays/redesign/birthday-fonts.css", "utf8"))
      .filter((face) => fonts.some((font) => face.toString().includes(`font-family: '${font.original}'`))).map(String).join("\n");
    const declarations = faces(css).map(String).join("\n") + originalFaces;
    await fallback.route("http://homepage-fallback.test/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      requests.push(pathname);
      return route.fulfill(pathname.startsWith("/fonts/")
        ? { contentType: "font/woff2", body: fs.readFileSync(path.join("public", pathname)) }
        : { contentType: "text/html", body: `<!doctype html><meta charset=utf-8><style>${declarations}</style>${fonts.map((font) => `<p id="${font.slug}" style='font:32px "${font.alias}", "${font.original}"'>Beautiful invites. Célébration € →</p>`).join("")}` });
    });
    await fallback.goto("http://homepage-fallback.test/");
    await fallback.evaluate(() => document.fonts.ready);
    for (const font of fonts) {
      assert.ok(requests.includes(asset(font)), "Latin homepage content requests its subset");
      assert.ok(!requests.includes(originalAsset(font)), "Latin content does not request the complete font");
    }
    await fallback.evaluate(() => {
      for (const paragraph of document.querySelectorAll("p")) paragraph.textContent = "Ж Кириллица";
    });
    await fallback.evaluate(() => document.fonts.ready);
    for (const font of fonts) assert.ok(requests.includes(originalAsset(font)), "characters outside the subset load the complete original face");
    await fallback.close();
  } finally { await browser.close(); }
});
