const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const test = require("node:test");
const { chromium } = require("playwright");
const sharp = require("sharp");
const { createJiti } = require("jiti");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("all 44 occasions offer twenty distinct painted backgrounds with usable mobile selection", { timeout: 300000 }, async () => {
  const output = path.resolve("output/holiday-background-options");
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/holiday-backgrounds.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@": path.resolve("src") } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") } });
  const { HOLIDAY_COLLECTIONS } = jiti("../src/lib/holiday-collections.ts");
  const { getHolidayBackgrounds, getHolidayBackground } = jiti("../src/lib/holiday-backgrounds.ts");
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack || error.message));
  await page.route("http://background-options.test/**", route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
    if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/")) {
      const asset = path.resolve("public", `.${url.pathname}`);
      return asset.startsWith(path.resolve("public") + path.sep) && fs.existsSync(asset)
        ? route.fulfill({ path: asset }) : route.fulfill({ status: 404, body: "Missing fixture asset" });
    }
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#faf7fc;color:#302939;font-family:system-ui,sans-serif}aside{padding:20px;max-width:420px}.fixturePage{max-width:1100px;margin:auto;padding:24px}h1{font-size:42px}p{line-height:1.6}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
  });
  const rgb = hex => `rgb(${[1,3,5].map(start => parseInt(hex.slice(start,start+2),16)).join(", ")})`;
  try {
    await page.goto("http://background-options.test/");
    await page.waitForFunction(() => Boolean(window.showHoliday));
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const collection of HOLIDAY_COLLECTIONS) {
        const designId = `holidays--${collection.id}--${collection.designs[0].slug}`;
        const options = getHolidayBackgrounds(collection.id);
        await page.evaluate(id => window.showHoliday(id, undefined, true), designId);
        await page.waitForFunction(id => document.querySelector("[data-themed-event-header]")?.getAttribute("data-themed-event-header") === id, designId);
        const picker = page.getByRole("group", { name: "Choose a background", exact: true });
        await picker.getByRole("radio", { name: options[19].name, exact: true }).waitFor();
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        assert.equal(await picker.getByRole("radio").count(), 20, collection.id);
        assert.equal(await picker.getByRole("button", { name: "Use this design’s background", exact: true }).count(), 0);
        const measurements = await picker.locator("label").evaluateAll(labels => labels.map(label => {
          const tile = label.querySelector('input + span');
          const style = getComputedStyle(tile);
          const decoration = tile.querySelector('[data-holiday-treatment]');
          const inputRect = label.querySelector("input").getBoundingClientRect();
          const bounds = label.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(label.children[2]);
          const name = range.getBoundingClientRect();
          return { page: style.backgroundColor, ink: style.color,
            material: decoration?.getAttribute("data-holiday-material"),
            inert: !decoration || getComputedStyle(decoration).pointerEvents === "none",
            usable: inputRect.width >= 44 && inputRect.height >= 44,
            nameFits: name.left >= bounds.left - 1 && name.right <= bounds.right + 1 && name.bottom <= bounds.bottom + 1 };
        }));
        measurements.forEach((actual,index) => {
          assert.equal(actual.page, rgb(options[index].page), `${options[index].id}: paper paints`);
          assert.equal(actual.ink, rgb(options[index].ink), `${options[index].id}: paired ink paints`);
          assert.equal(actual.inert, true, `${options[index].id}: decoration stays inert`);
          assert.equal(actual.usable, true, `${options[index].id}: full touch target`);
          assert.equal(actual.nameFits, true, `${options[index].id}: complete label stays inside its option`);
          if (options[index].material && options[index].material !== "plain") assert.equal(actual.material, options[index].material);
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${collection.id}: no overflow at ${width}`);
        const aside = page.locator("aside");
        await aside.scrollIntoViewIfNeeded();
        const rects = await aside.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          return [...element.querySelectorAll("label")].map(label => {
            const b = label.getBoundingClientRect(), tile = label.querySelector('input + span').getBoundingClientRect();
            return { left: Math.round(b.x - bounds.x), top: Math.round(b.y - bounds.y), width: Math.round(b.width), height: Math.round(b.height), tileHeight: Math.round(tile.height) };
          });
        });
        const capture = await aside.screenshot();
        const tiles = [];
        const hashes = new Set();
        for (const rect of rects) {
          const image = sharp(capture).extract({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
          tiles.push(await image.clone().resize({ width: 200, height: 190, fit: "contain", background: "#faf7fc" }).png().toBuffer());
          const paint = await sharp(capture).extract({ left: rect.left + 4, top: rect.top + 4, width: rect.width - 8, height: rect.tileHeight - 8 }).resize(120,80).raw().toBuffer();
          hashes.add(createHash("sha256").update(paint).digest("hex"));
        }
        assert.equal(hashes.size, 20, `${collection.id}: twenty visually distinct backgrounds at ${width}`);
        await sharp({ create: { width: 1000, height: 760, channels: 3, background: "#faf7fc" } })
          .composite(tiles.map((input,index) => ({ input,left: (index % 5)*200,top: Math.floor(index/5)*190 })))
          .jpeg({ quality: 88 }).toFile(path.join(output, `${collection.id}-${width}.jpg`));
        await picker.getByRole("radio", { name: options[19].name, exact: true }).check();
        await page.locator(`.fixturePage[data-holiday-background="${options[19].id}"]`).waitFor();
        await picker.getByRole("radio", { name: options[19].name, exact: true }).press("ArrowLeft");
        assert.equal(await picker.getByRole("radio", { name: options[18].name, exact: true }).isChecked(), true);
        await picker.getByRole("radio", { name: getHolidayBackground(designId).name, exact: true }).check();
        await page.locator(`.fixturePage[data-holiday-background="${getHolidayBackground(designId).id}"]`).waitFor();
      }
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
