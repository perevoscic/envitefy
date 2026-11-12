const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const { chromium } = require("playwright");
const inventory = require("./lib/application-color-inventory.cjs");
const load = require("./lib/event-messages-test-loader.cjs");
const { buildAppearanceBootstrap } = load("src/lib/appearance.ts");

test("application surface, status and ink utilities throughout the codebase stay paired and preserve authored designs", { timeout: 120000 }, async () => {
  const output = path.resolve("output/theme-audit");
  fs.mkdirSync(output, { recursive: true });
  const source = inventory();
  fs.writeFileSync(path.join(output, "application-color-inventory.json"), JSON.stringify(source, null, 2));
  const surfaces = Object.keys(source.surfaces);
  const inks = Object.keys(source.inks);
  const tokens = [...surfaces, ...inks, "bg-surface", "text-foreground", "dark:bg-black", "dark:text-white"];
  const globals = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', `@import "tailwindcss" source(none);\n@source inline(${JSON.stringify(tokens.join(" "))});`);
  const css = (await postcss([tailwind()]).process(globals, { from: path.resolve("src/app/globals.css") })).css;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ colorScheme: "light", viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await page.route("**/*", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><style>${css}</style><script>${buildAppearanceBootstrap()}</script></head><body style="background:var(--background);color:var(--foreground)"><main></main></body></html>` }));
    await page.goto("https://application-colors.test/");
    await page.locator("main").evaluate((main, { surfaces, inks }) => {
      main.className = "bg-surface text-foreground";
      for (const surface of surfaces) {
        const row = document.createElement("section");
        row.dataset.surface = surface;
        row.className = surface;
        row.style.padding = "8px";
        for (const ink of inks) {
          const text = document.createElement("span");
          text.className = ink;
          text.textContent = "Readable application text";
          text.dataset.ink = ink;
          row.append(text);
        }
        main.append(row);
      }
      const authored = document.createElement("section");
      authored.dataset.appearanceScope = "authored";
      authored.id = "authored";
      for (const surface of surfaces.filter(token => !token.includes(":"))) {
        const sample = document.createElement("p");
        sample.className = `${surface} text-slate-900 dark:bg-black dark:text-white`;
        sample.textContent = "Original design";
        authored.append(sample);
      }
      main.append(authored);
    }, { surfaces, inks });
    const authoredColors = () => page.locator("#authored p").evaluateAll(elements => elements.map(element => ({ background: getComputedStyle(element).backgroundColor, ink: getComputedStyle(element).color })));
    const original = await authoredColors();
    await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "dark"));
    await page.evaluate(buildAppearanceBootstrap());
    assert.deepEqual(await authoredColors(), original, "all authored neutral utilities retain their original colors");
    const results = [];
    for (const surface of surfaces) {
      const row = page.locator(`[data-surface="${surface}"]`);
      if (surface.startsWith("hover:")) await row.hover();
      results.push(...await row.evaluate(element => {
        const context = document.createElement("canvas").getContext("2d");
        const rgba = value => { context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; };
        const blend = (top, bottom) => top.slice(0, 3).map((value, index) => value * top[3] / 255 + bottom[index] * (1 - top[3] / 255));
        const luminance = rgb => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
        const ancestors = [];
        for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
        let background = [24, 24, 24];
        for (const node of ancestors) background = blend(rgba(getComputedStyle(node).backgroundColor), background);
        return [...element.children].map(text => {
          const foreground = blend(rgba(getComputedStyle(text).color), background);
          const ratio = (Math.max(luminance(foreground), luminance(background)) + .05) / (Math.min(luminance(foreground), luminance(background)) + .05);
          return { surface: element.dataset.surface, ink: text.dataset.ink, ratio };
        });
      }));
    }
    fs.writeFileSync(path.join(output, "application-color-results.json"), JSON.stringify({ filesScanned: source.filesScanned, combinations: results.length, results }, null, 2));
    const failures = results.filter(result => result.ratio < 4.5);
    assert.equal(failures.length, 0, `source-derived surface/ink pairings require 4.5:1 contrast: ${JSON.stringify(failures.slice(0, 12))}; see output/theme-audit/application-color-results.json`);
  } finally { await browser.close(); }
});
