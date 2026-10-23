const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const sharp = require("sharp");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("planned holiday page editions render with installed review photography at phone and desktop widths", { timeout: 180000 }, async () => {
  const output = path.resolve("output/holiday-expansion-preview");
  fs.mkdirSync(output, { recursive: true });
  const plan = JSON.parse(fs.readFileSync("docs/holiday-template-artwork.json", "utf8"));
  const originalIds = new Set(require("../scripts/lib/event-messages-test-loader.cjs")("src/lib/holiday-collections.ts")
    .HOLIDAY_COLLECTIONS.flatMap(collection => collection.designs.slice(0, 10).map(design => `holidays--${collection.id}--${design.slug}`)));
  const occasion = process.env.HOLIDAY_PREVIEW_OCCASION || "halloween";
  const installed = plan.assets.filter(asset => asset.collection === occasion && !originalIds.has(asset.id)
    && asset.status === "generated" && asset.verifiedDecode && fs.existsSync(asset.output));
  assert.ok(installed.length >= 5, "Install and decode at least five expanded holiday images before running this review fixture");
  const config = { occasion, artwork: installed.slice(0, 5).map(asset => `/${asset.output.replace(/^public\//, "")}`) };
  const availability = path.join(output, "preview-availability.cjs");
  fs.writeFileSync(availability, "exports.isHolidayTemplateAvailable = () => true;\n");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/holiday-expansion-preview.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".cjs", ".json"], alias: {
        "@/lib/holiday-template-availability$": availability, "@": path.resolve("src"),
      } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const css = "*{box-sizing:border-box}body{margin:0;background:#fff}.fixturePage{max-width:1100px;margin:auto;padding:24px 32px}.fixtureArtwork img{display:block;width:100%;height:100%;object-fit:cover}h1{font-weight:400;font-size:clamp(36px,5vw,66px);line-height:1.05;margin:16px 0}p{line-height:1.65}.eyebrow{font:12px/1.4 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase}h2{font-size:24px}footer{text-align:center;padding:30px;font-size:18px}.previewNote{max-width:1100px;margin:8px auto;padding:8px 16px;font:12px/1.5 system-ui;background:#f5f3f7;color:#30243a}@media(max-width:600px){.fixturePage{padding:18px 14px}}";
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [], missing = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("http://holiday-preview.test/**", route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/")) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(path.resolve("public") + path.sep) && fs.existsSync(asset)) return route.fulfill({ path: asset });
      missing.push(url.pathname);
      return route.fulfill({ status: 404, body: "No pending artwork is served" });
    }
    return route.fulfill({ contentType: "text/html", body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>window.holidayExpansionPreviewConfig=${JSON.stringify(config)}</script><script src="/fixture.js"></script></body></html>` });
  });
  try {
    await page.goto("http://holiday-preview.test/");
    await page.waitForFunction(() => Boolean(window.showHolidayExpansionDirection));
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const tiles = [];
      for (const index of [10, 11, 20, 21, 30, 31, 40, 41, 50, 51]) {
        await page.evaluate(index => window.showHolidayExpansionDirection(index), index);
        await page.waitForFunction(index => document.querySelector(".previewNote")?.textContent.includes(`preview ${index + 1} of`), index);
        const wrapper = page.locator(".fixturePage");
        const image = wrapper.locator("img");
        await image.evaluate(async element => { await element.decode(); });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${index}: fits ${width}`);
        assert.ok(config.artwork.includes(await image.getAttribute("src")), "only installed review artwork is requested");
        const capture = await wrapper.screenshot({ type: "jpeg", quality: 75 });
        tiles.push(await sharp(capture).resize({ width: 220, height: 600, fit: "contain", background: "#faf8f3" }).jpeg().toBuffer());
      }
      await sharp({ create: { width: 1100, height: 1200, channels: 3, background: "#faf8f3" } })
        .composite(tiles.map((input, index) => ({ input, left: index % 5 * 220, top: Math.floor(index / 5) * 600 })))
        .jpeg({ quality: 90 }).toFile(path.join(output, `${occasion}-structures-${width}.jpg`));
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
  } finally { await browser.close(); }
});
