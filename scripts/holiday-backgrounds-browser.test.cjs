const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const sharp = require("sharp");
const { createJiti } = require("jiti");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();
const pickerOnly = process.env.HOLIDAY_BACKGROUND_PICKER_ONLY === "1";

test(pickerOnly ? "holiday native background controls and signup preview/save keep the selected design" : "all available holiday backgrounds paint with readable full-page designs at phone and desktop widths", { timeout: 900000 }, async () => {
  const output = path.resolve("output/holiday-backgrounds");
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
  const { AVAILABLE_HOLIDAY_TEMPLATE_IDS } = jiti("../src/assets/holiday-template-availability.ts");
  const available = new Set(AVAILABLE_HOLIDAY_TEMPLATE_IDS);
  const { getHolidayBackground, getHolidayBackgrounds } = jiti("../src/lib/holiday-backgrounds.ts");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack || error.message));
  const css = `*{box-sizing:border-box}body{margin:0;background:#fff}aside{padding:20px;max-width:420px;font-family:system-ui,sans-serif}.fixturePage{max-width:1100px;margin:auto;padding:24px 32px}.fixtureArtwork img{display:block;width:100%;height:100%;object-fit:cover}h1{font-weight:400;font-size:clamp(36px,5vw,66px);line-height:1.05;margin:16px 0}p{line-height:1.65}.eyebrow{font:12px/1.4 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase}h2{font-size:24px}footer{text-align:center;padding:30px;font-size:18px}@media(max-width:600px){.fixturePage{padding:18px 14px}}`;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const utilityCss = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none);\n@source "../components/smart-signup-form";\n@source "../components/branding";',
    { from: path.resolve("src/app/globals.css") },
  )).css;
  await page.route("http://holiday.test/**", route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
    if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/brand/") || url.pathname.startsWith("/email/")) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(path.resolve("public") + path.sep) && fs.existsSync(asset)) return route.fulfill({ path: asset });
      return route.fulfill({ status: 404, body: "Missing local fixture asset" });
    }
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${utilityCss}${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
  });
  try {
    await page.goto("http://holiday.test/");
    await page.waitForFunction(() => Boolean(window.showHoliday));
    for (const width of pickerOnly ? [] : [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const collection of HOLIDAY_COLLECTIONS) {
        const tiles = [];
        for (const design of collection.designs) {
          const id = `holidays--${collection.id}--${design.slug}`;
          if (!available.has(id)) continue;
          const background = getHolidayBackground(id);
          await page.evaluate(id => window.showHoliday(id), id);
          const wrapper = page.locator(`[data-holiday-background="${background.id}"]`);
          await page.waitForFunction(id => document.querySelector("[data-themed-event-header]")?.getAttribute("data-themed-event-header") === id, id);
          await wrapper.locator("img").evaluate(async image => { if (!image.complete) await new Promise(resolve => { image.onload = resolve; image.onerror = resolve; }); });
          const measurements = await wrapper.evaluate(element => {
            const image = element.querySelector("img");
            const h1 = element.querySelector("h1");
            const styles = getComputedStyle(element);
            const decoration = element.querySelector('[data-holiday-treatment]');
            return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
              page: styles.backgroundColor, ink: getComputedStyle(h1).color,
              decoded: image.complete && image.naturalWidth > 0,
              inert: !decoration || getComputedStyle(decoration).pointerEvents === "none" };
          });
          const rgb = hex => `rgb(${[1,3,5].map(start => parseInt(hex.slice(start,start + 2),16)).join(", ")})`;
          assert.equal(measurements.overflow, false, `${id} fits ${width}`);
          assert.equal(measurements.page, rgb(background.page), `${id} uses its assigned paper`);
          assert.equal(measurements.ink, rgb(background.ink), `${id} retains readable title ink`);
          assert.equal(measurements.decoded, true, `${id} retains original artwork`);
          assert.equal(measurements.inert, true, `${id} decoration cannot intercept editing`);
          const capture = await wrapper.screenshot({ type: "jpeg", quality: 65 });
          tiles.push(await sharp(capture).resize({ width: 220, height: 440, fit: "contain", background: background.page }).jpeg({ quality: 75 }).toBuffer());
          if (id === "holidays--halloween--friendly-ghosts") await wrapper.screenshot({ path: path.join(output, `friendly-ghosts-${width}.png`) });
        }
        if (!tiles.length) continue;
        await sharp({ create: { width: 1100, height: Math.ceil(tiles.length / 5) * 440, channels: 3, background: "#e5e5e5" } })
          .composite(tiles.map((input,index) => ({ input,left: (index % 5)*220,top: Math.floor(index/5)*440 })))
          .jpeg({ quality: 83 }).toFile(path.join(output, `${collection.id}-${width}.jpg`));
      }
    }
    // The shared native radio picker has real keyboard operation and a default tile.
    const id = "holidays--halloween--friendly-ghosts";
    await page.evaluate(id => window.showHoliday(id, undefined, true), id);
    const presets = getHolidayBackgrounds("halloween");
    for (const preset of presets) {
      await page.getByRole("radio", { name: preset.name, exact: true }).check();
      await page.locator(`.fixturePage[data-holiday-background="${preset.id}"]`).waitFor();
    }
    assert.equal(await page.getByRole("button", { name: "Use this design’s background", exact: true }).count(), 0);
    await page.getByRole("radio", { name: getHolidayBackground(id).name, exact: true }).check();
    await page.locator(`.fixturePage[data-holiday-background="${getHolidayBackground(id).id}"]`).waitFor();
    await page.getByRole("radio", { name: presets[0].name, exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("radio", { name: presets[1].name, exact: true }).isChecked(), true);
    // The actual signup Design panel and guest renderer use the same choice,
    // with light form fields on dark holiday paper and explicit save semantics.
    const darkPreset = presets.find(preset => {
      const rgb = [1, 3, 5].map(start => parseInt(preset.page.slice(start, start + 2), 16));
      return rgb.every(channel => channel < 130);
    });
    assert.ok(darkPreset);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(id => window.showHolidaySignup(id), id);
      const defaultPreset = getHolidayBackground(id);
      const signup = page.locator(".fixtureSignup > [data-holiday-background]");
      await signup.waitFor();
      assert.equal(await signup.getAttribute("data-holiday-background"), defaultPreset.id);
      await page.getByRole("radio", { name: darkPreset.name, exact: true }).check();
      await page.waitForFunction(preset => document.querySelector(".fixtureSignup > [data-holiday-background]")?.getAttribute("data-holiday-background") === preset, darkPreset.id);
      await page.waitForFunction(color => getComputedStyle(document.querySelector(".fixtureSignup [data-signup-board]")).getPropertyValue("--signup-canvas-page").trim() === color, darkPreset.page);
      assert.equal(await page.evaluate(() => window.holidaySignupWrites), 0);
      const colors = await signup.evaluate(element => {
        const board = element.querySelector("[data-signup-board]");
        const footer = element.querySelector("footer");
        const wordmark = footer.querySelector('[aria-label="envitefy"] > span');
        return {
          page: getComputedStyle(element).backgroundColor,
          childPage: getComputedStyle(element.querySelector("[data-signup-background]")).backgroundColor,
          surface: getComputedStyle(board).backgroundColor,
          text: getComputedStyle(board).color,
          footerInk: getComputedStyle(footer).color,
          whiteWordmark: getComputedStyle(wordmark).webkitTextFillColor,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      const rgb = hex => `rgb(${[1,3,5].map(start => parseInt(hex.slice(start,start + 2),16)).join(", ")})`;
      assert.equal(colors.page, rgb(darkPreset.page));
      assert.equal(colors.childPage, "rgba(0, 0, 0, 0)", "the signup page leaves its holiday backdrop visible");
      assert.equal(colors.surface, "rgb(255, 253, 247)");
      assert.equal(colors.text, "rgb(37, 36, 33)");
      assert.equal(colors.footerInk, rgb(darkPreset.ink));
      assert.equal(colors.whiteWordmark, "rgb(255, 255, 255)");
      assert.equal(colors.overflow, false);
      await page.getByRole("button", { name: "Preview signup", exact: true }).click();
      assert.equal(await signup.getAttribute("data-holiday-background"), darkPreset.id);
      assert.equal(await page.evaluate(() => window.holidaySignupWrites), 0);
      await page.getByRole("button", { name: "Save signup fixture", exact: true }).click();
      const saved = await page.evaluate(() => ({ form: JSON.parse(window.holidaySignupSaved), writes: window.holidaySignupWrites }));
      assert.deepEqual(saved.form.appearance.pageBackground, { version: 1, presetId: darkPreset.id, source: "custom" });
      assert.equal(saved.writes, 1);
      assert.equal(await signup.getAttribute("data-holiday-background"), darkPreset.id);
      await signup.screenshot({ path: path.join(output, `friendly-ghosts-signup-${width}.png`) });
      await page.getByRole("button", { name: "Edit signup", exact: true }).click();
      assert.equal(await page.getByRole("button", { name: "Use this design’s background", exact: true }).count(), 0);
      await page.getByRole("radio", { name: defaultPreset.name, exact: true }).check();
      await page.waitForFunction(preset => document.querySelector(".fixtureSignup > [data-holiday-background]")?.getAttribute("data-holiday-background") === preset, defaultPreset.id);
      assert.equal(await page.evaluate(() => window.holidaySignupWrites), 1, "choosing the template default remains pending until explicitly saved");
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    fs.writeFileSync(path.join(output, "fixture-failure.html"), await page.content());
    await page.screenshot({ path: path.join(output, "fixture-failure.png") });
    throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}`);
  } finally { await browser.close(); }
});
