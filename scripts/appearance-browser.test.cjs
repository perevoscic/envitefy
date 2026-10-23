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

const appearanceSwitch = (scope) => scope.getByRole("switch", { name: "Dark mode", exact: true });

async function assertPreviewControlContrast(controls) {
  const measurements = await controls.evaluateAll((elements) => elements.filter((element) => element.checkVisibility()).map((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    const rgba = (color) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((value, index) => index === 3 ? value / 255 : value);
    };
    const blend = (top, bottom) => top.slice(0, 3).map((value, index) => value * top[3] + bottom[index] * (1 - top[3]));
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
    const background = ancestors.reduce((color, node) => blend(rgba(getComputedStyle(node).backgroundColor), color), [255, 255, 255]);
    const foreground = rgba(getComputedStyle(element).color);
    foreground[3] *= ancestors.reduce((opacity, node) => opacity * Number(getComputedStyle(node).opacity), 1);
    const luminance = (channels) => channels.map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const light = luminance(background);
    const ink = luminance(blend(foreground, background));
    return { name: element.getAttribute("aria-label") || element.textContent.trim(), ratio: (Math.max(light, ink) + 0.05) / (Math.min(light, ink) + 0.05), minimum: element.textContent.trim() ? 4.5 : 3 };
  }));
  assert.ok(measurements.length > 0, "preview controls must be visible");
  for (const result of measurements) assert.ok(result.ratio >= result.minimum, `${result.name} contrast ${result.ratio.toFixed(2)}:1 must reach ${result.minimum}:1`);
}

async function assertAppearanceLayout(page) {
  const group = page.getByRole("group", { name: "Appearance", exact: true });
  assert.equal(await group.getByRole("switch", { name: "Dark mode", exact: true }).count(), 1);
  assert.equal(await group.getByRole("button").count(), 0, "appearance has no separate Device or System button");
  const target = await appearanceSwitch(group).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { name: element.getAttribute("aria-label") || element.textContent.trim(), width: rect.width, height: rect.height, left: rect.left, right: rect.right };
  });
  assert.ok(target.width >= 44 && target.height >= 44, `${target.name} hit area must be at least 44px: ${JSON.stringify(target)}`);
  assert.ok(target.left >= 0 && target.right <= page.viewportSize().width, `${target.name} hit area must remain inside the viewport`);
  const hasSmallTrack = await appearanceSwitch(group).evaluate((element) => [...element.querySelectorAll("*")].some((child) => {
    const rect = child.getBoundingClientRect();
    return Math.abs(rect.width - 56) < 0.1 && Math.abs(rect.height - 28) < 0.1;
  }));
  assert.equal(hasSmallTrack, true, "the visible switch track stays 56px by 28px inside its larger hit area");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "appearance toggle must not create horizontal overflow");
}

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
    assert.equal(await appearanceSwitch(page).isChecked(), true);
    await assertAppearanceLayout(page);
    const switchAppearance = await appearanceSwitch(page).evaluate((element) => {
      const styles = [element, ...element.querySelectorAll("*")].flatMap((node) => [getComputedStyle(node), getComputedStyle(node, "::before"), getComputedStyle(node, "::after")]);
      return {
        shadows: styles.map((style) => style.boxShadow),
        durations: styles.flatMap((style) => [style.transitionDuration, style.animationDuration]).flatMap((value) => value.split(",").map(parseFloat)),
      };
    });
    assert.ok(switchAppearance.shadows.some((shadow) => shadow !== "none"), "the appearance switch retains its dimensional shadow");
    assert.ok(switchAppearance.durations.every((duration) => duration === 0), "the switch respects reduced motion");
    assert.equal(await page.evaluate(() => window.initialAppearance.theme), "general-dark");
    assert.equal(await page.evaluate(() => window.initialAppearance.background.trim()), "#181818");
    assert.deepEqual(await page.locator("#auth-email").evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderColor, color: getComputedStyle(el).color })), { background: "rgb(48, 39, 56)", border: "rgb(133, 114, 148)", color: "rgb(242, 234, 250)" });
    assert.equal(await page.evaluate(() => localStorage.getItem("envitefy:appearance:v1")), null, "a fresh browser has no explicit appearance override");
    await page.emulateMedia({ colorScheme: "light" });
    await page.getByTestId("appearance-state").filter({ hasText: "system:light" }).waitFor();
    assert.equal(await appearanceSwitch(page).isChecked(), false, "fresh browsers follow light device appearance");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    assert.equal(await appearanceSwitch(page).isChecked(), true, "fresh browsers follow dark device appearance until the first toggle");
    const authored = await page.locator("#authored-canvas p").evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
    const authoredInput = await page.locator("#authored-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color }));
    await page.locator("#unsaved").fill("Unsaved host title");
    await page.evaluate(() => { window.originalField = document.getElementById("unsaved"); });
    await appearanceSwitch(page).click();
    assert.equal(await appearanceSwitch(page).isChecked(), false);
    await page.getByTestId("appearance-state").filter({ hasText: "light:light" }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("envitefy:appearance:v1")), "light", "toggling saves an explicit appearance override");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "general-light");
    assert.deepEqual(await page.locator("#authored-canvas p").evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color })), authored);
    assert.deepEqual(await page.locator("#authored-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color })), authoredInput);
    assert.equal(await page.locator("#unsaved").inputValue(), "Unsaved host title");
    assert.equal(await page.evaluate(() => document.getElementById("unsaved") === window.originalField), true);
    await appearanceSwitch(page).focus();
    await page.keyboard.press("Space");
    assert.equal(await appearanceSwitch(page).isChecked(), true, "Space enables dark appearance");
    assert.equal(await appearanceSwitch(page).evaluate((element) => document.activeElement === element), true, "keyboard activation retains control focus");
    await page.keyboard.press("Space");
    assert.equal(await appearanceSwitch(page).isChecked(), false, "Space returns to light appearance");
    await page.keyboard.press("Enter");
    assert.equal(await appearanceSwitch(page).isChecked(), true, "Enter enables dark appearance");
    await page.keyboard.press("Enter");
    assert.equal(await appearanceSwitch(page).isChecked(), false, "Enter returns to light appearance");
    assert.equal(await page.locator("#unsaved").inputValue(), "Unsaved host title");
    await page.screenshot({ path: path.join(output, "light-desktop.png") });
    await page.getByText("Open event preview", { exact: true }).click();
    const frame = page.frameLocator('iframe[title="Authored iframe — event content"]');
    await frame.locator("#iframe-input").waitFor().catch(async (error) => {
      throw new Error(`${error.message}\n${JSON.stringify({ errors, frames: await page.locator("iframe").evaluateAll((elements) => elements.map((el) => ({ title: el.title, html: el.contentDocument?.body.innerHTML.slice(0, 900), width: el.clientWidth, height: el.clientHeight }))) })}`);
    });
    const frameOriginal = await frame.locator("#iframe-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color }));
    await appearanceSwitch(page).check();
    await frame.locator('html[data-theme="general-dark"]').waitFor();
    assert.deepEqual(await frame.locator("#iframe-input").evaluate((el) => ({ color: getComputedStyle(el).color, placeholder: getComputedStyle(el, "::placeholder").color })), frameOriginal);
    const preview = page.getByRole("region", { name: "Authored iframe preview", exact: true });
    const desktopControls = preview.locator('header button, header a');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(233, 244, 246)");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).color === "rgb(242, 234, 250)");
    assert.equal(await frame.locator("#iframe-paper").evaluate((element) => getComputedStyle(element).color), "rgb(242, 234, 250)", "the regression includes pale inherited app ink over light event paper");
    await assertPreviewControlContrast(desktopControls);
    await preview.screenshot({ path: path.join(output, "event-controls-dark-app-light-paper.png") });
    await page.getByText("Change event paper", { exact: true }).click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(24, 38, 49)");
    await assertPreviewControlContrast(desktopControls);
    await appearanceSwitch(page).uncheck();
    await assertPreviewControlContrast(desktopControls);
    await page.getByText("Change event paper", { exact: true }).click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(233, 244, 246)");
    await assertPreviewControlContrast(desktopControls);
    await appearanceSwitch(page).check();
    await page.setViewportSize({ width: 375, height: 812 });
    const moreActions = frame.getByRole("button", { name: "More event actions", exact: true });
    await moreActions.waitFor();
    for (let paper = 0; paper < 2; paper++) {
      if (paper) {
        await page.getByText("Change event paper", { exact: true }).click();
        await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(24, 38, 49)");
      }
      await assertPreviewControlContrast(moreActions);
      await moreActions.click();
      await assertPreviewControlContrast(frame.getByRole("group", { name: "Event actions", exact: true }).locator("button"));
      await moreActions.press("Escape");
      assert.equal(await moreActions.getAttribute("aria-expanded"), "false");
      assert.equal(await moreActions.evaluate((element) => element.ownerDocument.activeElement === element), true);
    }
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.getByText("Change event paper", { exact: true }).click();
    await appearanceSwitch(page).uncheck();
    await frame.locator('html[data-theme="general-light"]').waitFor();
    assert.equal(await frame.locator("html").evaluate((el) => el.style.getPropertyValue("--mobile-chrome-top-clouds").trim()), await page.locator("html").evaluate((el) => getComputedStyle(el).getPropertyValue("--mobile-chrome-top-clouds").trim()));
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "general-light");
    await page.reload();
    await page.getByTestId("appearance-state").filter({ hasText: "light:light" }).waitFor();
    const second = await context.newPage();
    await second.goto("http://appearance.test/");
    await appearanceSwitch(second).check();
    await page.getByTestId("appearance-state").filter({ hasText: "dark:dark" }).waitFor();
    assert.equal(await appearanceSwitch(page).isChecked(), true, "the switch synchronizes from the other tab");
    await page.getByText("Open dialog", { exact: true }).click();
    assert.equal(await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(37, 31, 45)");
    await page.getByText("Close dialog", { exact: true }).click();
    await page.emulateMedia({ colorScheme: "light" });
    await page.getByTestId("appearance-state").filter({ hasText: "dark:dark" }).waitFor();
    assert.equal(await appearanceSwitch(page).isChecked(), true, "a synchronized dark override ignores later device appearance changes");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByTestId("appearance-state").filter({ hasText: "dark:dark" }).waitFor();
    await page.screenshot({ path: path.join(output, "dark-desktop.png") });
    await page.setViewportSize({ width: 375, height: 812 });
    await assertAppearanceLayout(page);
    await page.screenshot({ path: path.join(output, "dark-mobile.png") });
    await appearanceSwitch(page).uncheck();
    await page.screenshot({ path: path.join(output, "light-mobile.png") });
    await page.setViewportSize({ width: 320, height: 640 });
    await assertAppearanceLayout(page);
    await page.screenshot({ path: path.join(output, "light-mobile-320.png") });
    assert.deepEqual(errors, []);
    const restricted = await browser.newContext({ colorScheme: "dark" });
    await restricted.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }); });
    // Context routes are intentionally independent: copy the fixture route.
    await restricted.route("http://appearance.test/**", async (route) => route.fulfill({ contentType: route.request().url().endsWith("fixture.js") ? "application/javascript" : "text/html", body: route.request().url().endsWith("fixture.js") ? script : `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><script>${buildAppearanceBootstrap()}</script><div id="root"></div><script src="/fixture.js"></script></body></html>` }));
    const blocked = await restricted.newPage();
    await blocked.goto("http://appearance.test/");
    await blocked.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    await appearanceSwitch(blocked).uncheck();
    await blocked.getByTestId("appearance-state").filter({ hasText: "light:light" }).waitFor();
    await restricted.close();
    await context.close();
  } finally { await browser.close(); }
});
