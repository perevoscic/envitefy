const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();
const cache = new Map();
function loadTs(filename) {
  if (!path.extname(filename)) filename += ".ts";
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: (name) => name.startsWith(".") ? loadTs(path.resolve(path.dirname(filename), name)) : require(name) }, { filename });
  return module.exports;
}
const { buildAppearanceBootstrap, normalizeAppearance, resolveAppearance } = loadTs(path.resolve("src/lib/appearance.ts"));

test("appearance preference validates inputs and explicit choices override the device", () => {
  assert.equal(normalizeAppearance("invalid"), "system");
  assert.equal(normalizeAppearance(null), "system");
  assert.equal(resolveAppearance("light", true), "light");
  assert.equal(resolveAppearance("dark", false), "dark");
  assert.equal(resolveAppearance("system", true), "dark");
});

test("appearance applies before paint, persists, synchronizes tabs and preserves editing and authored designs", { timeout: 180000 }, async () => {
  const output = path.resolve("output/appearance-browser");
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/appearance.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@": path.resolve("src"), "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"), "next/link": path.resolve("scripts/fixtures/concierge/navigation.tsx") } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../../scripts/fixtures/appearance.tsx"; @source "../components/AppearanceSelector.tsx"; @source "../components/EventPreviewViewport.tsx"; @source "../components/EventPreviewActions.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"), "utf8");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const context = await browser.newContext({ colorScheme: "dark", viewport: { width: 1200, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    await context.route("http://appearance.test/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: script });
      if (/\.(woff2?|ttf)$/.test(url.pathname)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"><meta name="theme-color" content="#8998ED"><meta name="color-scheme" content="light dark"><style>${css}</style></head><body><script>${buildAppearanceBootstrap()}</script><script>window.initialAppearance={theme:document.documentElement.dataset.theme,background:getComputedStyle(document.documentElement).getPropertyValue('--background')};</script><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://appearance.test/");
    assert.deepEqual(errors, []);
    await page.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    assert.equal(await page.evaluate(() => window.initialAppearance.theme), "general-dark");
    assert.equal(await page.evaluate(() => window.initialAppearance.background.trim()), "#181818");
    assert.deepEqual(await page.locator("#auth-email").evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderColor, color: getComputedStyle(el).color })), { background: "rgb(48, 39, 56)", border: "rgb(133, 114, 148)", color: "rgb(242, 234, 250)" });
    const authored = await page.locator("#authored-canvas p").evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
    const authoredInput = await page.locator("#authored-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color }));
    await page.locator("#unsaved").fill("Unsaved host title");
    await page.evaluate(() => { window.originalField = document.getElementById("unsaved"); });
    await page.getByLabel("Appearance", { exact: true }).selectOption("light");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "general-light");
    assert.deepEqual(await page.locator("#authored-canvas p").evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color })), authored);
    assert.deepEqual(await page.locator("#authored-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color })), authoredInput);
    assert.equal(await page.locator("#unsaved").inputValue(), "Unsaved host title");
    assert.equal(await page.evaluate(() => document.getElementById("unsaved") === window.originalField), true);
    await page.getByText("Open event preview", { exact: true }).click();
    const frame = page.frameLocator('iframe[title="Authored iframe — event content"]');
    await frame.locator("#iframe-input").waitFor().catch(async (error) => {
      throw new Error(`${error.message}\n${JSON.stringify({ errors, frames: await page.locator("iframe").evaluateAll((elements) => elements.map((el) => ({ title: el.title, html: el.contentDocument?.body.innerHTML.slice(0, 900), width: el.clientWidth, height: el.clientHeight }))) })}`);
    });
    const frameOriginal = await frame.locator("#iframe-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color }));
    await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
    await frame.locator('html[data-theme="general-dark"]').waitFor();
    assert.deepEqual(await frame.locator("#iframe-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color })), frameOriginal);
    await page.getByLabel("Appearance", { exact: true }).selectOption("light");
    await frame.locator('html[data-theme="general-light"]').waitFor();
    assert.equal(await frame.locator("html").evaluate((el) => el.style.getPropertyValue("--mobile-chrome-top-clouds").trim()), await page.locator("html").evaluate((el) => getComputedStyle(el).getPropertyValue("--mobile-chrome-top-clouds").trim()));
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "general-light");
    await page.reload();
    await page.getByTestId("appearance-state").filter({ hasText: "light:light" }).waitFor();
    const second = await context.newPage();
    await second.goto("http://appearance.test/");
    await second.getByLabel("Appearance", { exact: true }).selectOption("dark");
    await page.getByTestId("appearance-state").filter({ hasText: "dark:dark" }).waitFor();
    await page.getByText("Open dialog", { exact: true }).click();
    assert.equal(await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(37, 31, 45)");
    await page.getByText("Close dialog", { exact: true }).click();
    await page.getByLabel("Appearance", { exact: true }).selectOption("system");
    await page.emulateMedia({ colorScheme: "light" });
    await page.getByTestId("appearance-state").filter({ hasText: "system:light" }).waitFor();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    await page.screenshot({ path: path.join(output, "dark-desktop.png") });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(output, "dark-mobile.png") });
    assert.deepEqual(errors, []);
    const restricted = await browser.newContext({ colorScheme: "dark" });
    await restricted.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }); });
    // Context routes are intentionally independent: copy the fixture route.
    await restricted.route("http://appearance.test/**", async (route) => route.fulfill({ contentType: route.request().url().endsWith("fixture.js") ? "application/javascript" : "text/html", body: route.request().url().endsWith("fixture.js") ? script : `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><script>${buildAppearanceBootstrap()}</script><div id="root"></div><script src="/fixture.js"></script></body></html>` }));
    const blocked = await restricted.newPage();
    await blocked.goto("http://appearance.test/");
    await blocked.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    await blocked.getByLabel("Appearance", { exact: true }).selectOption("light");
    await blocked.getByTestId("appearance-state").filter({ hasText: "light:light" }).waitFor();
    await restricted.close();
    await context.close();
  } finally { await browser.close(); }
});
