const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { buildAppearanceBootstrap } = loadTs("src/lib/appearance.ts");
compiled.init();

async function buildFixture(output) {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/template-appearance.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/signup-editor/auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/signup-editor/auth.tsx"),
        "@/components/CalendarAction": path.resolve("scripts/fixtures/signup-editor/calendar.tsx"),
        "./SignupDesignPanel": path.resolve("scripts/fixtures/signup-editor/design.tsx"),
        "@": path.resolve("src"),
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
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../components/smart-signup-form"; @source "../components/events"; @source "../components/AppearanceSelector.tsx"; @source "../components/EventAccessDialog.tsx"; @source "../components/templates/TemplateEditorContext.tsx"; @source "../components/UnsavedProgressProvider.tsx"; @source "../app/templates/signup/page.tsx"; @source "../../scripts/fixtures/template-appearance.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  return { script: fs.readFileSync(path.join(output, "fixture.js")), css };
}

async function measure(locator) {
  return locator.evaluate((element) => {
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
    const style = getComputedStyle(element);
    let background = ancestors.reduce((color, node) => blend(rgba(getComputedStyle(node).backgroundColor), color), [255, 255, 255]);
    // Browser autofill paints may be covered by the production inset fill.
    if (style.boxShadow.includes("inset") && /(?:^|\s)(?:[2-9]\d\d|\d{4,})px(?:\s|$)/.test(style.boxShadow)) {
      const insetColor = style.boxShadow.match(/(?:rgba?|oklch|color)\([^)]*\)/)?.[0];
      if (insetColor) background = blend(rgba(insetColor), background);
    }
    const actualTextColor = element.matches("input,textarea") ? style.webkitTextFillColor || style.color : style.color;
    const ink = rgba(actualTextColor);
    ink[3] *= ancestors.reduce((opacity, node) => opacity * Number(getComputedStyle(node).opacity), 1);
    const luminance = (channels) => channels.map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const light = luminance(background);
    const foreground = luminance(blend(ink, background));
    return {
      color: style.color, textFill: style.webkitTextFillColor, background: style.backgroundColor, border: style.borderColor,
      colorScheme: style.colorScheme, caret: style.caretColor,
      boxShadow: style.boxShadow,
      effectiveBackground: background.map((channel) => Math.round(channel)),
      contrast: (Math.max(light, foreground) + 0.05) / (Math.min(light, foreground) + 0.05),
      minimum: parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5,
    };
  });
}
async function assertReadable(locator, label) {
  const result = await measure(locator);
  assert.ok(result.contrast >= result.minimum, `${label}: ${result.contrast.toFixed(2)}:1 must reach ${result.minimum}:1 (${JSON.stringify(result)})`);
  return result;
}
async function toggle(page, dark) {
  const control = page.getByRole("switch", { name: "Dark mode", exact: true });
  if (await control.isChecked() !== dark) await control.click();
  await page.waitForFunction((expected) => document.documentElement.classList.contains("dark") === expected, dark);
}
async function changeDeviceAppearance(page, dark) {
  await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });
  await page.waitForFunction((expected) => document.documentElement.classList.contains("dark") === expected, dark);
}
async function forceAutofill(page, selector, enabled) {
  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector });
  await session.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: enabled ? ["autofill"] : [] });
  assert.equal(await page.locator(selector).evaluate((element) => element.matches(":autofill")), enabled, "Chromium must exercise its real autofill state");
  return session;
}

test("template editing, saved forms and nested application controls preserve readable colors across appearance changes", { timeout: 240000 }, async () => {
  const output = path.resolve("output/template-appearance-browser");
  const { script, css } = await buildFixture(output);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const base = "http://localhost:43129";
  const editorPath = "/signup-forms/templates/editorial--school-days/customize?edit=saved-form";
  const measurements = [];
  try {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, colorScheme: "dark", reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.stack || error.message));
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== base) return route.abort();
        if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
        if (url.pathname.startsWith("/api/")) return route.fulfill({ json: { people: [], recipients: [], events: [] } });
        const publicFile = path.resolve("public", url.pathname.slice(1));
        if (publicFile.startsWith(path.resolve("public") + path.sep) && fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) return route.fulfill({ body: fs.readFileSync(publicFile) });
        if (/\.(?:woff2?|ttf|webp|png|svg|jpe?g)$/.test(url.pathname)) return route.fulfill({ status: 404, body: "" });
        return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><script>${buildAppearanceBootstrap()}</script><div id="root"></div><script src="/fixture.js"></script></body></html>` });
      });
      try {
        await page.goto(`${base}/?fixture=inline`);
        await page.getByRole("button", { name: "Edit template message", exact: true }).click();
        const inline = page.getByRole("textbox", { name: "Template message", exact: true });
        await inline.fill("Typed template wording");
        const inlineDark = await assertReadable(inline, `inline template while typing at ${width}px`);
        assert.equal(inlineDark.colorScheme, "light");
        assert.deepEqual((await measure(page.locator("#nested-app-input"))).background, "rgb(48, 39, 56)", "an application dialog inside an authored page re-enters the dark app palette");
        await assertReadable(page.locator("#nested-app-input"), "nested app dialog input");
        const deepDark = await assertReadable(page.locator("#deep-authored-input"), "authored input nested inside application dialog");
        assert.equal(deepDark.background, "rgb(255, 255, 255)", "a deeper authored scope restores its original light surface");
        const deepLabelDark = await assertReadable(page.locator("#deep-authored-label"), "authored label nested inside application dialog");
        const autofillSession = await forceAutofill(page, 'input[aria-label="Template message"]', true);
        const autofilledDark = await assertReadable(inline, "autofilled inline template");
        assert.deepEqual(autofilledDark.effectiveBackground, inlineDark.effectiveBackground, "autofill preserves the authored input's painted paper");
        assert.equal(autofilledDark.textFill, inlineDark.textFill, "autofill preserves the authored input's painted ink");
        assert.equal(autofilledDark.caret, inlineDark.color, "the autofill caret remains visible on authored paper");
        await autofillSession.detach();
        await page.evaluate(() => { window.originalInline = document.querySelector('input[aria-label="Template message"]'); });
        await changeDeviceAppearance(page, false);
        const autofilledLight = await assertReadable(inline, "autofilled inline template in light appearance");
        assert.equal(autofilledLight.color, inlineDark.color, "autofill preserves the authored input ink");
        assert.deepEqual(await measure(page.locator("#deep-authored-input")), deepDark, "an authored scope inside an application dialog remains independent of app appearance");
        assert.deepEqual(await measure(page.locator("#deep-authored-label")), deepLabelDark, "nested authored utility text stays readable in both modes");
        assert.equal(await inline.inputValue(), "Typed template wording");
        assert.equal(await page.evaluate(() => window.originalInline === document.querySelector('input[aria-label="Template message"]')), true, "changing appearance keeps the mounted editing field");
        await changeDeviceAppearance(page, true);
        await assertReadable(inline, "inline template after toggling dark again");
        await page.screenshot({ path: path.join(output, `inline-dark-${width}.png`) });

        await page.goto(`${base}${editorPath}`);
        await page.getByRole("heading", { name: "Questions for participants", exact: true }).waitFor();
        const toolbar = page.getByRole("navigation", { name: "Signup editor", exact: true });
        for (const button of await toolbar.getByRole("button").all()) {
          if (await button.isVisible() && await button.isEnabled()) await assertReadable(button, `signup toolbar ${await button.innerText()}`);
        }
        await assertReadable(page.getByRole("heading", { name: "Your signup page", exact: true }), "signup page introduction heading");
        await assertReadable(page.locator("#signup-questions h2"), "questions heading");
        await assertReadable(page.locator("#signup-questions > p"), "questions help text");
        const question = page.locator("#signup-questions input:not([type=checkbox])").first();
        await question.fill("What should we prepare for you?");
        await assertReadable(question, "typed participant question");
        assert.equal(await page.locator("#signup-questions select").first().evaluate((element) => getComputedStyle(element).colorScheme), "dark", "editor selects use matching native dark controls on dark app paper");
        const sharing = page.getByRole("region", { name: "Share signup", exact: true });
        await assertReadable(sharing.getByRole("heading", { name: "Share your signup", exact: true }), "share panel heading");
        await assertReadable(sharing.locator("p").first(), "share panel help text");
        await page.locator("#signup-questions").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `questions-dark-${width}.png`) });
        await sharing.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `sharing-dark-${width}.png`) });
        await page.getByRole("button", { name: "Edit date and time", exact: true }).click();
        await assertReadable(page.locator("#signup-start"), "inline schedule field");
        assert.equal(await page.locator("#signup-start").evaluate((element) => getComputedStyle(element).colorScheme), "dark", "date picker glyphs match the dark editor panel");
        await assertReadable(page.getByRole("button", { name: "Done", exact: true }), "inline schedule action");
        await page.getByRole("button", { name: "Done", exact: true }).click();
        await page.getByRole("button", { name: "Edit group or organization", exact: true }).click();
        const group = page.getByRole("textbox", { name: "Group or organization", exact: true });
        await group.fill("Maple Grove community");
        const groupDark = await assertReadable(group, "typed signup header");
        await group.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `signup-header-typing-dark-${width}.png`) });
        await changeDeviceAppearance(page, false);
        assert.deepEqual(await measure(group), groupDark, "signup header input retains authored colors in light mode");
        assert.equal(await group.inputValue(), "Maple Grove community");
        await changeDeviceAppearance(page, true);
        assert.equal(await page.evaluate(() => window.__templateWrites.length), 0, "typing and appearance switching never save implicitly");
        await page.getByRole("button", { name: "Done editing group or organization", exact: true }).click();
        await page.getByRole("button", { name: "Save as draft", exact: true }).click();
        await page.waitForFunction(() => window.__templateWrites.length === 1);
        const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("template-appearance:saved")));
        assert.equal(persisted.data.signupForm.header.groupName, "Maple Grove community");
        assert.equal(persisted.data.signupForm.questions[0].prompt, "What should we prepare for you?");
        await page.reload();
        await page.getByText("Maple Grove community", { exact: true }).waitFor();
        assert.equal(await page.locator("#signup-questions input:not([type=checkbox])").first().inputValue(), "What should we prepare for you?");
        await assertReadable(page.locator("#signup-questions h2"), "saved/reloaded question heading");
        await assertReadable(page.getByRole("region", { name: "Share signup" }).getByRole("heading"), "saved/reloaded share panel");
        await page.screenshot({ path: path.join(output, `saved-editor-dark-${width}.png`), fullPage: true });
        await page.goto(`${base}/?fixture=viewer`);
        await page.getByText("Maple Grove community", { exact: true }).waitFor();
        const savedTitle = page.getByRole("heading", { level: 1 });
        const savedDark = await assertReadable(savedTitle, "saved guest page title");
        await toggle(page, false);
        assert.deepEqual(await measure(savedTitle), savedDark, "saved public pages preserve authored title/paper colors");
        await page.goto(`${base}/?fixture=custom`);
        await page.locator("#signup-questions select").waitFor();
        await toggle(page, true);
        const customSelect = page.locator("#signup-questions select");
        const customDark = await assertReadable(customSelect, "custom dark signup native select");
        assert.equal(customDark.colorScheme, "dark", "an authored dark signup recipe owns its native control scheme");
        await toggle(page, false);
        assert.deepEqual(await measure(customSelect), customDark, "an authored dark recipe retains readable paper/ink/native controls in a light application");
        measurements.push({ width, inline: inlineDark, signupHeader: groupDark, savedTitle: savedDark });
        assert.deepEqual(errors, []);
      } catch (error) {
        await page.screenshot({ path: path.join(output, `failure-${width}.png`), fullPage: true });
        throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}\nPage text: ${(await page.locator("body").innerText()).slice(0, 2200)}`);
      } finally { await context.close(); }
    }
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", colorScheme: "dark" });
    const catalogErrors = [];
    page.on("pageerror", (error) => catalogErrors.push(error.stack || error.message));
    await page.route(`${base}/**`, async (route) => route.request().url().endsWith("/fixture.js")
      ? route.fulfill({ contentType: "text/javascript", body: script })
      : route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html><head><meta charset="utf-8"><style>${css}</style></head><body><script>${buildAppearanceBootstrap()}</script><div id="root"></div><script src="/fixture.js"></script></body></html>` }));
    await page.goto(`${base}/?fixture=catalog`);
    try { await page.getByTestId("catalog-count").waitFor(); }
    catch (error) { throw new Error(`${error.message}\nCatalog errors: ${JSON.stringify(catalogErrors)}\nCatalog text: ${(await page.locator("body").innerText()).slice(0, 2000)}`); }
    const count = await page.getByTestId("catalog-count").textContent();
    const catalogSnapshot = () => page.locator("[data-template-case]").evaluateAll((elements) => elements.map((element) => {
      const canvas = element.querySelector('[data-appearance-scope="authored"]');
      const copy = element.querySelector('[data-testid="catalog-copy"] header p');
      const style = getComputedStyle(canvas);
      return { id: element.getAttribute("data-template-case"), page: style.backgroundColor, ink: getComputedStyle(copy).color, scheme: style.colorScheme, surface: style.getPropertyValue("--signup-surface") };
    }));
    const darkCatalog = await catalogSnapshot();
    const paletteContrast = [];
    for (const sample of await page.locator("[data-template-case]").all()) {
      const id = await sample.getAttribute("data-template-case");
      paletteContrast.push({ id, ...(await assertReadable(sample.getByTestId("catalog-copy").locator("header > p").first(), `${id} authored signup palette body copy`)) });
      await assertReadable(sample.locator("[data-palette-soft]"), `${id} muted copy on soft paper`);
      await assertReadable(sample.locator("[data-palette-accent]"), `${id} accent copy on signup paper`);
    }
    await toggle(page, false);
    assert.deepEqual(await catalogSnapshot(), darkCatalog, `all ${count.split(":")[0]} signup templates preserve every distinct authored color palette`);
    assert.ok(darkCatalog.length > 10, "catalog sweep covers light and dark authored palette variants");
    measurements.push({ catalogTemplates: Number(count.split(":")[0]), catalogPaletteCombinations: Number(count.split(":")[2]), renderedPaletteVariants: darkCatalog.length, palettes: darkCatalog, paletteContrast });
    await fs.promises.writeFile(path.join(output, "measurements.json"), JSON.stringify(measurements, null, 2));
  } finally { await browser.close(); }
});
