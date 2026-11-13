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

async function assertMeetImportPalette(page, output, theme) {
  const panel = page.getByRole("region", { name: "Import meet details", exact: true });
  const field = panel.getByRole("textbox", { name: "Public meet URL", exact: true });
  assert.equal(await field.isVisible(), true);
  assert.equal(await field.getAttribute("placeholder"), "Paste link");
  const upload = panel.getByRole("button", { name: "Upload packet", exact: true });
  const submit = panel.getByRole("button", { name: "Import meet link", exact: true });
  await upload.focus();
  const resting = await field.locator("xpath=../..").boundingBox();
  assert.equal(await upload.locator("span").isVisible(), true);
  await field.focus();
  const [uploadBox, formBox] = await Promise.all([upload.boundingBox(), field.locator("xpath=../..").boundingBox()]);
  assert.ok(formBox.width > resting.width, "focusing the link field expands it to the left");
  assert.ok(Math.abs(uploadBox.width - 44) < 1, "Upload packet becomes a 44px icon button");
  assert.equal(await upload.locator("span").isVisible(), false);
  assert.ok(Math.abs(uploadBox.y + uploadBox.height / 2 - formBox.y - formBox.height / 2) < 1, "upload and link entry share one row");
  await field.fill("https://meet-site.test/retained-details");
  const [inputBounds, submitBounds] = await Promise.all([field.boundingBox(), submit.boundingBox()]);
  assert.ok(inputBounds.x + inputBounds.width <= submitBounds.x, "the text field never extends under its submit button");
  for (const control of [upload, submit, field]) {
    const target = await control.boundingBox();
    assert.ok(target.height >= 44 && target.width >= 44, "meet import controls retain 44px targets");
    await control.focus();
    const focused = await control.evaluate(element => {
      const target = element.matches("input") ? element.closest("form") : element;
      return parseFloat(getComputedStyle(target).outlineWidth) >= 2;
    });
    assert.equal(focused, true, "meet import keyboard focus stays visible on the control or shared input frame");
  }
  assert.equal(await field.evaluate(element => getComputedStyle(element).outlineStyle), "none", "the input has no overlapping inner focus outline");
  for (const hovered of [null, upload, submit]) {
    if (hovered) await hovered.hover();
    const measurements = await panel.evaluate(element => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      const rgba = color => {
        context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].map((value, index) => index === 3 ? value / 255 : value);
      };
      const blend = (top, bottom) => top.slice(0, 3).map((value, index) => value * top[3] + bottom[index] * (1 - top[3]));
      const luminance = color => color.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      const backdrop = getComputedStyle(element).backgroundImage.match(/rgba?\([^)]*\)/g).map(color => rgba(color).slice(0, 3));
      return [...element.querySelectorAll("p,button,input[type=url],button svg")].map(node => {
        let surfaces = backdrop;
        const ancestors = [];
        for (let current = node; current && current !== element; current = current.parentElement) ancestors.unshift(current);
        for (const ancestor of ancestors) surfaces = surfaces.map(color => blend(rgba(getComputedStyle(ancestor).backgroundColor), color));
        const style = getComputedStyle(node);
        const ink = rgba(node.matches("input") ? style.webkitTextFillColor : style.color);
        const contrast = Math.min(...surfaces.map(background => {
          const light = luminance(background), foreground = luminance(blend(ink, background));
          return (Math.max(light, foreground) + .05) / (Math.min(light, foreground) + .05);
        }));
        return { name: node.getAttribute("aria-label") || node.textContent.trim() || node.tagName, contrast };
      });
    });
    for (const result of measurements) assert.ok(result.contrast >= 4.5, `${theme} meet import ${result.name}: ${result.contrast.toFixed(2)}:1`);
  }
  assert.equal(await field.inputValue(), "https://meet-site.test/retained-details");
  await panel.screenshot({ path: path.join(output, `meet-import-${theme}-${page.viewportSize().width}.png`) });
}

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

async function assertPreviewTheme(page, surfaces) {
  const expected = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "background-color:var(--surface);color:var(--foreground);border-color:var(--border)";
    document.documentElement.append(probe);
    const style = getComputedStyle(probe);
    const colors = { background: style.backgroundColor, color: style.color, border: style.borderColor };
    probe.remove();
    return colors;
  });
  const actual = await surfaces.evaluateAll(elements => elements.filter(element => element.checkVisibility()).map(element => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, color: style.color, border: style.borderColor };
  }));
  assert.ok(actual.length > 0, "the preview exposes theme-aware control surfaces");
  for (const colors of actual) assert.deepEqual(colors, expected, "preview controls follow the application theme independently of the event palette");
}

async function assertMeetCreationTiles(page, output, theme) {
  const gallery = page.getByTestId("meet-import-gallery");
  const imported = gallery.getByRole("region", { name: "Import meet details", exact: true });
  const generated = gallery.getByRole("region", { name: "Generate with Envitefy", exact: true });
  const button = generated.getByRole("button", { name: "Generate with Envitefy", exact: true });
  assert.equal(await button.count(), 1);
  assert.match(await generated.innerText(), /page for coaches and families/);
  const [left, right, target] = await Promise.all([imported.boundingBox(), generated.boundingBox(), button.boundingBox()]);
  assert.ok(target.width >= 44 && target.height >= 44);
  assert.ok(right.x >= 0 && right.x + right.width <= page.viewportSize().width);
  if (page.viewportSize().width >= 1024) {
    assert.ok(Math.abs(left.y - right.y) < 1, "desktop creation tiles sit beside each other");
    assert.ok(Math.abs(left.height - right.height) < 1, "desktop creation tiles retain equal heights, including with the link field open");
    assert.ok(right.x >= left.x + left.width, "desktop creation tiles do not overlap");
  } else if (page.viewportSize().width < 768) {
    assert.ok(right.y >= left.y + left.height, "phone creation tiles stack in reading order");
  }
  const panelColors = await Promise.all([imported, generated].map(panel => panel.evaluate(element => {
    const style = getComputedStyle(element);
    return { background: style.backgroundImage, color: style.color };
  })));
  assert.deepEqual(panelColors[1], panelColors[0], "both tiles use the original import panel palette");
  assert.equal(await gallery.getByText("Your meet details, in one place.", { exact: true }).count(), 0, "the public gallery has no wide generation callout");
  assert.equal(await gallery.getByRole("button", { name: "Create with Envitefy", exact: true }).count(), 0);
  const favorite = gallery.locator('[data-event-category-favorite="gymnastics"]');
  assert.equal(await favorite.count(), 1, "the gallery has one compact favorite control");
  assert.equal((await favorite.innerText()).trim(), "", "favorite uses a compact star");
  assert.equal(await gallery.locator('[data-meet-gallery-badges] [data-event-category-favorite="gymnastics"]').count(), 1);
  const [badgeBox, favoriteBox] = await Promise.all([
    gallery.locator("[data-meet-gallery-badges] p").boundingBox(), favorite.boundingBox(),
  ]);
  assert.ok(favoriteBox.width >= 44 && favoriteBox.height >= 44);
  assert.ok(Math.abs((badgeBox.y + badgeBox.height / 2) - (favoriteBox.y + favoriteBox.height / 2)) < 1, "favorite sits next to the design count");
  await button.focus();
  assert.equal(await button.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth) >= 2), true);
  await gallery.locator("header").screenshot({ path: path.join(output, `meet-creation-${theme}-${page.viewportSize().width}.png`) });
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
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@/components/navigation/SignedOutPageChrome": path.resolve("scripts/fixtures/appearance-public-chrome.tsx"), "@/contexts/MenuContext": path.resolve("scripts/fixtures/appearance-public-chrome.tsx"), "@": path.resolve("src"), "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"), "next-auth/react": path.resolve("scripts/fixtures/appearance-auth.tsx"), "next/link": path.resolve("scripts/fixtures/concierge/navigation.tsx") } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../../scripts/fixtures/appearance.tsx"; @source "../components/AppearanceSelector.tsx"; @source "../components/EventPreviewViewport.tsx"; @source "../components/EventPreviewActions.tsx"; @source "../components/event-create/GymnasticsLauncher.tsx"; @source "../components/event-create/DiscoveryProgressPanel.tsx"; @source "../components/gym-meet-templates/GymnasticsGalleryHeader.tsx"; @source "../components/events/CreateWithEnvitefyCallout.tsx"; @source "../components/events/custom/EventCustomThemeDialog.tsx"; @source "../components/templates/PublicTemplateGalleryContents.tsx"; @source "../components/events/TemplateMasonryGallery.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"), "utf8");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const context = await browser.newContext({ colorScheme: "dark", viewport: { width: 1200, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    let pinnedCategoryIds = ["gymnastics"];
    let failFavoriteSave = false;
    await context.route("http://appearance.test/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/user/creation-access") return route.fulfill({ json: {
        access: { policy: "restricted", allowedProducts: ["event_page"], allowedCategories: ["gymnastics"] },
      } });
      if (url.pathname === "/api/user/feature-visibility") {
        if (route.request().method() === "PUT") {
          if (failFavoriteSave) return route.fulfill({ status: 503, json: { error: "Could not save preferences" } });
          pinnedCategoryIds = route.request().postDataJSON().pinnedCategoryIds;
          return route.fulfill({ json: { featureVisibility: { pinnedCategoryIds } } });
        }
        return route.fulfill({ json: { visibleTemplateKeys: [], pinnedCategoryIds } });
      }
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: script });
      if (url.pathname.endsWith(".js")) {
        const chunk = path.join(output, path.basename(url.pathname));
        if (fs.existsSync(chunk)) return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: fs.readFileSync(chunk) });
      }
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
    await assertMeetImportPalette(page, output, "dark");
    await assertMeetCreationTiles(page, output, "dark");
    const favorite = page.locator('[data-event-category-favorite="gymnastics"]');
    await favorite.click();
    await page.waitForFunction(() => document.querySelector('[data-event-category-favorite="gymnastics"]')?.getAttribute("aria-pressed") === "false");
    assert.deepEqual(pinnedCategoryIds, [], "the compact star saves an explicit unpin");
    await favorite.click();
    await page.waitForFunction(() => document.querySelector('[data-event-category-favorite="gymnastics"]')?.getAttribute("aria-pressed") === "true");
    assert.deepEqual(pinnedCategoryIds, ["gymnastics"]);
    failFavoriteSave = true;
    await favorite.click();
    const retryFavorite = page.getByRole("button", { name: "Retry favorites", exact: true });
    await retryFavorite.waitFor();
    assert.match(await retryFavorite.getAttribute("title"), /Could not save your favorites/);
    assert.equal(await page.locator("[data-meet-gallery-badges]").evaluate(element => element.getBoundingClientRect().height <= 44), true, "a failed save does not stretch the badge row");
    failFavoriteSave = false;
    await retryFavorite.click();
    await page.waitForFunction(() => document.querySelector('[data-event-category-favorite="gymnastics"]')?.getAttribute("aria-pressed") === "false");
    assert.deepEqual(pinnedCategoryIds, [], "Retry favorites resends the failed unpin instead of just reloading preferences");
    await favorite.click();
    await page.waitForFunction(() => document.querySelector('[data-event-category-favorite="gymnastics"]')?.getAttribute("aria-pressed") === "true");
    await page.getByRole("region", { name: "Generate with Envitefy", exact: true }).getByRole("button", { name: "Generate with Envitefy", exact: true }).click();
    await page.getByRole("dialog", { name: "Your meet details, in one place.", exact: true }).waitFor({ timeout: 5000 }).catch(error => {
      throw new Error(`${error.message}\nBrowser errors: ${JSON.stringify(errors)}`);
    });
    await page.getByRole("button", { name: "Close custom design dialog", exact: true }).click();
    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("region", { name: "Import meet details", exact: true }).getByRole("button", { name: "Upload packet", exact: true }).click();
    const chooser = await chooserPromise;
    assert.equal(await chooser.element().getAttribute("accept"), ".pdf,image/png,image/jpeg,image/jpg", "Upload packet keeps the native supported-file chooser");
    await chooser.setFiles([]);
    let pendingIntake;
    const stallIntake = route => { pendingIntake = route; };
    await page.route("**/api/discovery/intake", stallIntake);
    const importPanel = page.getByRole("region", { name: "Import meet details", exact: true });
    const intakeStarted = page.waitForRequest("**/api/discovery/intake");
    await importPanel.getByRole("button", { name: "Import meet link", exact: true }).click();
    await intakeStarted;
    const busyPanel = page.locator('[aria-label="Import meet details"]');
    assert.equal(await busyPanel.locator('button[aria-label="Upload packet"]').isDisabled(), true);
    assert.equal(await busyPanel.locator('button[aria-label="Import meet link"]').isDisabled(), true);
    assert.equal(await busyPanel.locator('input[type="url"]').isDisabled(), true);
    const progressDialog = page.getByRole("dialog", { name: "Importing meet details", exact: true });
    const cancelImport = progressDialog.getByRole("button", { name: "Cancel import", exact: true });
    await assertPreviewControlContrast(cancelImport);
    await cancelImport.hover();
    await assertPreviewControlContrast(cancelImport);
    await cancelImport.focus();
    assert.equal(await cancelImport.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth) >= 2), true);
    await progressDialog.screenshot({ path: path.join(output, "meet-import-dark-busy.png") });
    await cancelImport.click();
    await importPanel.getByRole("button", { name: "Import meet link", exact: true }).waitFor();
    assert.equal(await importPanel.getByRole("button", { name: "Upload packet", exact: true }).isEnabled(), true);
    await pendingIntake?.abort().catch(() => {});
    await page.unroute("**/api/discovery/intake", stallIntake);
    await page.emulateMedia({ colorScheme: "light" });
    await page.getByTestId("appearance-state").filter({ hasText: "system:light" }).waitFor();
    assert.equal(await appearanceSwitch(page).isChecked(), false, "fresh browsers follow light device appearance");
    await assertMeetImportPalette(page, output, "light");
    await page.setViewportSize({ width: 390, height: 900 });
    await assertMeetImportPalette(page, output, "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    assert.equal(await appearanceSwitch(page).isChecked(), true, "fresh browsers follow dark device appearance until the first toggle");
    await assertMeetImportPalette(page, output, "dark");
    await page.setViewportSize({ width: 1200, height: 900 });
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
    await assertMeetCreationTiles(page, output, "light");
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
    const desktopSurfaces = preview.locator('header button:not([aria-pressed="true"]):not(:hover):not(:focus-visible), header a:not(:hover):not(:focus-visible)');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(233, 244, 246)");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).color === "rgb(242, 234, 250)");
    assert.equal(await frame.locator("#iframe-paper").evaluate((element) => getComputedStyle(element).color), "rgb(242, 234, 250)", "the regression includes pale inherited app ink over light event paper");
    await assertPreviewControlContrast(desktopControls);
    await assertPreviewTheme(page, desktopSurfaces);
    await preview.screenshot({ path: path.join(output, "event-controls-dark-app-light-paper.png") });
    await page.getByText("Change event paper", { exact: true }).click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(24, 38, 49)");
    await assertPreviewControlContrast(desktopControls);
    await assertPreviewTheme(page, desktopSurfaces);
    await appearanceSwitch(page).uncheck();
    await assertPreviewControlContrast(desktopControls);
    await assertPreviewTheme(page, desktopSurfaces);
    await page.getByText("Change event paper", { exact: true }).click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Authored iframe preview"]')).backgroundColor === "rgb(233, 244, 246)");
    await assertPreviewControlContrast(desktopControls);
    await assertPreviewTheme(page, desktopSurfaces);
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
      await assertPreviewTheme(page, moreActions);
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
    await assertMeetCreationTiles(page, output, "dark");
    await page.screenshot({ path: path.join(output, "dark-mobile.png") });
    await appearanceSwitch(page).uncheck();
    await assertMeetCreationTiles(page, output, "light");
    await page.screenshot({ path: path.join(output, "light-mobile.png") });
    await page.setViewportSize({ width: 320, height: 640 });
    await assertAppearanceLayout(page);
    await assertMeetCreationTiles(page, output, "light");
    await page.screenshot({ path: path.join(output, "light-mobile-320.png") });
    assert.deepEqual(errors, []);
    const restricted = await browser.newContext({ colorScheme: "dark" });
    await restricted.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }); });
    // Context routes are intentionally independent: copy the fixture route.
    await restricted.route("http://appearance.test/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "application/javascript", body: script });
      if (url.pathname.endsWith(".js")) {
        const chunk = path.join(output, path.basename(url.pathname));
        if (fs.existsSync(chunk)) return route.fulfill({ contentType: "application/javascript", body: fs.readFileSync(chunk) });
      }
      return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><script>${buildAppearanceBootstrap()}</script><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    });
    const blocked = await restricted.newPage();
    await blocked.goto("http://appearance.test/");
    await blocked.getByTestId("appearance-state").filter({ hasText: "system:dark" }).waitFor();
    await appearanceSwitch(blocked).uncheck();
    await blocked.getByTestId("appearance-state").filter({ hasText: "light:light" }).waitFor();
    await restricted.close();
    await page.setViewportSize({ width: 1662, height: 900 });
    await page.goto("http://appearance.test/gymnastics/templates?publicLayout=1");
    const countTop = await page.locator("[data-meet-gallery-badges]").evaluate(element => element.getBoundingClientRect().top);
    assert.ok(countTop <= 128, `the public hero has reduced top padding: ${countTop}px`);
    const ropePosition = await page.locator('[data-gallery-category="gymnastics"]').evaluate(backdrop => {
      const svg = backdrop.querySelector("svg");
      const rope = [...svg.querySelectorAll("path")].find(path => path.getAttribute("d") === "M617-1000V102M708-1000V102");
      const matrix = rope.getScreenCTM();
      const start = new DOMPoint(617, -1000).matrixTransform(matrix);
      const end = new DOMPoint(617, 102).matrixTransform(matrix);
      const ribbon = [...svg.querySelectorAll("path")].find(path => path.getAttribute("d")?.startsWith("M357 360"));
      const ribbonEnd = new DOMPoint(357, 360).matrixTransform(ribbon.getScreenCTM());
      const navBottom = document.querySelector("[data-fixture-public-nav]").getBoundingClientRect().bottom;
      return { top: backdrop.getBoundingClientRect().top, bottom: backdrop.getBoundingClientRect().bottom, ribbonBottom: ribbonEnd.y, overflow: getComputedStyle(svg).overflow, start: start.y, end: end.y, x: start.x, navBottom };
    });
    assert.ok(ropePosition.top <= ropePosition.navBottom && ropePosition.overflow === "visible" && ropePosition.start <= ropePosition.navBottom,
      `the rope reaches above the navigation's lower edge through the full public layout: ${JSON.stringify(ropePosition)}`);
    assert.ok(ropePosition.end > ropePosition.navBottom && ropePosition.x > 0 && ropePosition.x < 1662, "the rope remains visible below the navigation");
    assert.ok(Math.abs(ropePosition.ribbonBottom - ropePosition.bottom) < 1, "the ribbon reaches the header's bottom divider");
    const publicTiles = page.getByRole("region", { name: /^(Import meet details|Generate with Envitefy)$/ });
    const closedBoxes = await publicTiles.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    assert.ok(Math.abs(closedBoxes[0] - closedBoxes[1]) < 1, "public creation tiles have equal height while the link field is closed");
    const publicField = page.getByRole("textbox", { name: "Public meet URL", exact: true });
    await publicField.focus();
    assert.equal(await publicField.evaluate(element => document.activeElement === element), true);
    const openedBoxes = await publicTiles.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    assert.ok(Math.abs(openedBoxes[0] - openedBoxes[1]) < 1, "public creation tiles have equal height while the link field is focused");
    await page.screenshot({ path: path.join(output, "gymnastics-full-public-layout.png") });
    await context.close();
  } finally { await browser.close(); }
});
