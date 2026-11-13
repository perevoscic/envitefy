const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const load = require("./lib/event-messages-test-loader.cjs");
const { createImportedEventTheme } = load("src/lib/imported-event-theme.ts");
const { resolveThemeCssVariables } = load("src/themes/registry.ts");
compiled.init();

const output = path.resolve(".qa/gymnastics-text-controls");
const origin = "http://localhost:43148";

async function fixture() {
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
        new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/gymnastics/customize/page.tsx"; @source "../src/components/events"; @source "../src/components/gym-meet-templates";',
    { from: path.resolve("scripts/gymnastics-text-controls-fixture.css") },
  )).css;
  return { script: fs.readFileSync(path.join(output, "fixture.js")), css };
}

let assets, browser;
test.before(async () => {
  assets = await fixture();
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
});
test.after(async () => { await browser?.close(); });

for (const mobile of [false, true]) for (const dark of [false, true]) {
  test(`standalone text controls and saved placement: ${mobile ? "phone" : "desktop"}, ${dark ? "dark, reduced motion" : "light, animated"}`, { timeout: 60_000 }, async () => {
    const { script, css } = assets;
    const context = await browser.newContext({ viewport: { width: mobile ? 390 : 1440, height: 900 },
      isMobile: mobile, hasTouch: mobile, reducedMotion: dark ? "reduce" : "no-preference" });
    const page = await context.newPage();
    try {
      page.setDefaultTimeout(10_000);
      const errors = [], writes = [];
      page.on("pageerror", error => errors.push(error.stack || error.message));
      const id = `text-controls-${mobile}-${dark}`;
      const importedTheme = { ...createImportedEventTheme({ title: "Coastal Invitational", sport: "gymnastics", seed: id,
        branding: { version: 1, origin: "pdf", tone: dark ? "dark" : "light", colors: dark ? ["#111b3a", "#ff78b7"] : ["#fff7e2", "#245048"] },
      }), artworkUrl: "/media/event-media/retained/original.webp" };
      let record = { id, title: "Coastal Invitational", revision: "initial", data: {
        title: "Coastal Invitational", category: "gymnastics", createdVia: "meet-discovery", createdManually: false,
        status: "draft", draftStatus: "draft", pageTemplateId: "airborne-atlas", importedTheme,
        date: "2027-03-06", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602",
        guestPlanning: { arrival: "Arrive 30 minutes early.", preparation: "Bring grips and water." },
        gymnasticsPageText: { invitation: "Bring your team spirit", signoffLeft: "Tampa Bay Turners Gymnastics" },
        discoverySource: { workflow: "gymnastics", pipelineVersion: "gym-public-v3", enrichment: { state: "completed", pending: false },
          publicPageSections: { meetDetails: { title: "Meet Details", visibility: "visible", bullets: ["Doors open at 8 AM.", "Bring your water bottle."], provenance: "pdf_grounded", confidence: 1 } },
        },
      } };
      await page.route("**/*", async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
        if (url.pathname === `/api/history/${id}`) {
          if (request.method() === "GET") return route.fulfill({ json: record });
          const body = request.postDataJSON();
          assert.equal(request.method(), "PATCH");
          assert.equal(body.expectedRevision, record.revision);
          writes.push(body);
          record = { ...record, title: body.title, data: { ...record.data, ...body.data }, revision: `save-${writes.length}` };
          return route.fulfill({ json: record });
        }
        if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
        if (url.pathname.startsWith("/media/")) return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#345b62"/></svg>' });
        return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
      });
      const editUrl = `${origin}/event/gymnastics/customize?edit=${id}`;
      const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
      const source = () => page.locator('[data-text-placement-source="Welcome message"]');
      const floating = () => page.locator('[data-text-positioned="Welcome message"]');
      async function openEditor() {
        await page.goto(editUrl);
        await page.evaluate(({ dark, variables }) => {
          document.documentElement.classList.toggle("dark", dark);
          for (const [name, value] of Object.entries(variables)) document.documentElement.style.setProperty(name, value);
        }, { dark, variables: resolveThemeCssVariables("general", dark ? "dark" : "light") });
        if (mobile) await page.getByRole("complementary", { name: "Event editing controls", exact: true }).getByRole("button", { name: /^(Close editing menu|Back to page)$/, exact: true }).click();
        try { await source().waitFor(); } catch (error) {
          await page.screenshot({ path: path.join(output, `failure-${mobile}-${dark}.png`), fullPage: true });
          throw new Error(`${error.message}\n${errors.join("\n")}\n${(await page.locator("body").innerHTML()).slice(0, 1200)}`);
        }
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await Promise.all(document.getAnimations().filter(animation =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
          ).map(animation => animation.finished.catch(() => {})));
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
      }
      async function options(root = source()) {
        await root.scrollIntoViewIfNeeded();
        if (mobile) await root.getByRole("button", { name: "Edit welcome message text", exact: true }).click();
        else await root.hover();
        await page.getByRole("group", { name: "Welcome message actions", exact: true }).waitFor();
        await page.getByRole("group", { name: "Welcome message actions", exact: true }).evaluate(async element => {
          await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
        });
      }
      async function save() {
        await page.getByRole("button", { name: "Save draft", exact: true }).click();
        await page.getByText("Draft saved.", { exact: true }).waitFor();
      }
      await openEditor();
      if (mobile) {
        for (const button of await page.getByRole("button", { name: /^Options for /, includeHidden: true }).all())
          assert.equal(await button.isVisible(), false, "unselected text has no visible options");
        const pageBounds = await preview.boundingBox();
        const menuButton = page.getByRole("button", { name: "Continue editing", exact: true });
        const menuBounds = await menuButton.boundingBox();
        assert.ok(menuBounds.y + menuBounds.height <= pageBounds.y, "header reserves space above the canvas");
        await page.screenshot({ path: path.join(output, `canvas-mobile-${dark ? "dark" : "light"}.png`), fullPage: true });
        await menuButton.click();
        const menu = page.getByRole("dialog", { name: "Edit event page", exact: true });
        await menu.waitFor();
        const exit = await menu.getByRole("button", { name: "Exit", exact: true }).boundingBox();
        const back = await menu.getByRole("button", { name: "Back to page", exact: true }).boundingBox();
        assert.ok(exit.x > back.x + back.width, "Exit stays on the right");
        await page.screenshot({ path: path.join(output, `menu-mobile-${dark ? "dark" : "light"}.png`), fullPage: true });
        await menu.getByRole("button", { name: /^Sections Add, rename/ }).click();
        await menu.getByRole("region", { name: "Page sections", exact: true }).waitFor();
        await menu.getByRole("button", { name: "Select Meet Details section", exact: true }).click();
        const pairAction = menu.getByRole("button", { name: "Place another section beside Meet Details", exact: true });
        await pairAction.click();
        const pairDialog = page.getByRole("dialog", { name: "Place beside Meet Details", exact: true });
        await pairDialog.waitFor();
        await pairDialog.getByRole("button", { name: "Close section panel", exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Place another section beside Meet Details");
        await menu.getByRole("button", { name: "Back to details", exact: true }).click();
        await page.keyboard.press("Escape");
        await menu.waitFor({ state: "hidden" });
        assert.equal(await menuButton.evaluate(el => el === document.activeElement), true);
        assert.equal(writes.length, 0, "opening and closing editing tools never saves");
      }
      await preview.getByRole("tab", { name: "Meet Details", exact: true }).click();
      const detailsPanel = page.getByRole("dialog", { name: "Meet Details", exact: true });
      await preview.getByText("What families need to know", { exact: true }).click();
      await detailsPanel.waitFor();
      await page.waitForFunction(id => document.activeElement?.id === id,
        await detailsPanel.getByLabel("What families need to know label", { exact: true }).getAttribute("id")).catch(async error => {
          throw new Error(`${id}: ${error.message}; focus=${await page.evaluate(() => document.activeElement?.outerHTML)}`);
        });
      await detailsPanel.getByLabel("What families need to know label", { exact: true }).fill("Family essentials");
      await detailsPanel.getByLabel("What families need to know line 1", { exact: true }).fill("Host-reviewed meet information.");
      await detailsPanel.getByRole("button", { name: "Done", exact: true }).click();
      await preview.getByText("Family essentials", { exact: true }).waitFor();
      assert.equal(await preview.getByRole("button", { name: /^Edit what families/ }).count(), 0);
      await preview.getByText("Bring grips and water.", { exact: true }).click();
      await detailsPanel.waitFor();
      await page.waitForFunction(id => document.activeElement?.id === id,
        await detailsPanel.getByLabel("What to bring & prepare", { exact: true }).getAttribute("id"));
      await detailsPanel.getByLabel("Arrival & check-in", { exact: true }).fill("Arrive 45 minutes early.");
      await detailsPanel.getByRole("button", { name: "Done", exact: true }).click();
      const section = preview.getByRole("group", { name: "Edit Meet Details section content", exact: true });
      await section.click({ position: { x: 8, y: 8 } });
      await detailsPanel.waitFor();
      assert.equal(await detailsPanel.getByLabel("Arrival & check-in", { exact: true }).inputValue(), "Arrive 45 minutes early.");
      await page.screenshot({ path: path.join(output, `section-panel-${mobile ? "mobile" : "desktop"}-${dark ? "dark" : "light"}.png`), fullPage: true });
      await detailsPanel.getByRole("button", { name: "Done", exact: true }).click();
      await detailsPanel.waitFor({ state: "hidden" });
      await section.press("Enter");
      await detailsPanel.waitFor();
      await detailsPanel.getByRole("button", { name: "Done", exact: true }).click();
      assert.equal(writes.length, 0, "section panel edits remain pending until explicit save");
      await source().scrollIntoViewIfNeeded();
      await source().getByRole("button", { name: "Edit welcome message text", exact: true }).click();
      if (mobile) await page.getByRole("button", { name: "Edit welcome message", exact: true }).click();
      await page.getByLabel("Welcome message", { exact: true }).fill("Temporary welcome");
      await page.getByRole("button", { name: "Cancel editing welcome message", exact: true }).click();
      await source().getByText("Bring your team spirit", { exact: true }).waitFor();
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await page.mouse.move(0, 0);
      const toolbar = page.getByRole("group", { name: "Welcome message actions", exact: true, includeHidden: true });
      await page.waitForFunction(isMobile => {
        const element = document.querySelector('[data-text-placement-source="Welcome message"] [role="group"]');
        return isMobile ? !element : element && getComputedStyle(element).opacity === "0";
      }, mobile);
      if (!mobile) assert.equal(await toolbar.evaluate(el => getComputedStyle(el).transitionDuration.includes("0.16s")), !dark);
      if (mobile) {
        const dots = source().getByRole("button", { name: "Options for welcome message", exact: true });
        assert.equal(await dots.isVisible(), false, "options are hidden after deselection");
      }
      await options();
      if (mobile) {
        const sheet = page.getByRole("dialog", { name: "Welcome message", exact: true });
        assert.equal(await sheet.evaluate(el => el.matches(":modal")), true);
        assert.equal(await sheet.evaluate(el => el.parentElement === document.body), true, "sheet escapes authored opacity and clipping");
        const bounds = await sheet.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.y + bounds.height <= 901);
        await page.setViewportSize({ width: 320, height: 740 });
        const narrowBounds = await sheet.boundingBox();
        assert.ok(narrowBounds.x >= 0 && narrowBounds.x + narrowBounds.width <= 320 && narrowBounds.y + narrowBounds.height <= 741);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `text-options-320-${dark ? "dark" : "light"}.png`), fullPage: true });
        await sheet.screenshot({ path: path.join(output, `text-sheet-320-${dark ? "dark" : "light"}.png`) });
        await page.setViewportSize({ width: 390, height: 900 });
        for (const action of await toolbar.getByRole("button").all()) {
          const box = await action.boundingBox();
          assert.ok(box.height >= 44 && box.width >= 44);
          assert.ok((await action.innerText()).trim(), "mobile actions have visible labels");
        }
      }
      if (!mobile) {
        const editAction = await toolbar.getByRole("button", { name: "Edit welcome message", exact: true }).boundingBox();
        await page.mouse.move(editAction.x + editAction.width / 2, editAction.y + editAction.height / 2, { steps: 12 });
        await page.waitForFunction(() => {
          const actions = document.querySelector('[data-text-placement-source="Welcome message"] [role="group"]');
          return actions && getComputedStyle(actions).opacity === "1";
        });
      }
      await page.screenshot({ path: path.join(output, `controls-${mobile ? "mobile" : "desktop"}-${dark ? "dark" : "light"}.png`), fullPage: true });
      await toolbar.getByRole("button", { name: "Duplicate welcome message", exact: true }).click();
      const copy = page.locator('[data-text-placement-source="Welcome message copy"]');
      await copy.waitFor();
      if (mobile) await copy.getByRole("button", { name: "Edit welcome message copy text", exact: true }).click();
      else {
        await copy.hover();
        const copyActions = copy.getByRole("group", { name: "Welcome message copy actions", exact: true });
        // Cross from the duplicated text into every real pointer target. The
        // original toolbar and Share must not cover or dismiss these actions.
        for (const button of await copyActions.getByRole("button").all()) {
          await button.hover();
          await button.click({ trial: true });
          assert.equal(await button.evaluate(element => {
            const rect = element.getBoundingClientRect();
            return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
          }), true, `${await button.getAttribute("aria-label")} receives pointer events`);
        }
      }
      await page.getByRole("button", { name: "Delete welcome message copy", exact: true }).click();
      await copy.waitFor({ state: "hidden" });
      assert.equal(writes.length, 0, "text actions do not save automatically");
      await options();
      const handle = toolbar.getByRole("button", { name: "Move welcome message", exact: true });
      if (mobile) await handle.click();
      const box = await (mobile ? source().locator("[data-inline-text-editor]") : handle).boundingBox();
      assert.ok(box);
      const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const target = { x: mobile ? 120 : 850, y: Math.max(120, Math.min(680, start.y - 180)) };
      const cdp = mobile ? await context.newCDPSession(page) : null;
      if (mobile) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
        for (let i = 1; i <= 12; i++) {
          await page.evaluate(() => new Promise(requestAnimationFrame));
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start.x + (target.x - start.x) * i / 12, y: start.y + (target.y - start.y) * i / 12 }] });
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } else {
        await page.mouse.move(start.x, start.y); await page.mouse.down();
        await page.mouse.move(target.x, target.y, { steps: 12 }); await page.mouse.up();
      }
      await floating().waitFor();
      assert.equal(writes.length, 0, "dropping text is pending until explicit save");
      assert.equal(await floating().locator("xpath=..").getAttribute("data-text-canvas"), "");
      const beforeCancel = await floating().getAttribute("style");
      await options(floating());
      if (mobile) await page.getByRole("button", { name: "Move welcome message", exact: true }).click();
      const cancelHandle = await (mobile ? floating().locator("[data-inline-text-editor]") : floating().getByRole("button", { name: "Move welcome message", exact: true })).boundingBox();
      const cancelStart = { x: cancelHandle.x + cancelHandle.width / 2, y: cancelHandle.y + cancelHandle.height / 2 };
      if (mobile) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [cancelStart] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cancelStart.x + 30, y: cancelStart.y + 60 }] });
        await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      } else {
        await page.mouse.move(cancelStart.x, cancelStart.y); await page.mouse.down();
        await page.mouse.move(cancelStart.x - 40, cancelStart.y + 50, { steps: 4 });
        await page.keyboard.press("Escape"); await page.mouse.up();
      }
      await page.waitForFunction(expected => document.querySelector('[data-text-positioned="Welcome message"]')?.getAttribute("style") === expected, beforeCancel);
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      if (!(await controls.isVisible())) await page.getByRole("button", { name: "Continue editing", exact: true }).click();
      const mountedControls = await controls.elementHandle();
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await page.getByRole("button", { name: "Close preview", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: /^Options for / }).count(), 0);
      assert.equal(writes.length, 0, "clean preview does not save pending placement");
      await page.getByRole("button", { name: "Close preview", exact: true }).click();
      await controls.waitFor({ state: "visible" });
      assert.equal(await mountedControls.evaluate(element => element.isConnected), true, "Preview retains the original editing controls");
      assert.equal(await controls.isVisible(), true, "closing Preview returns to its mounted editing menu");
      await save();
      const saved = writes.at(-1).data.templateEditor.snapshot.data;
      const placement = JSON.parse(saved.gymnasticsPageText["placement:invitation"]);
      const device = mobile ? "mobile" : "desktop";
      assert.ok(placement[device].x >= 0 && placement[device].x <= 1);
      assert.ok(placement[device].y >= 0 && placement[device].y <= 1);
      assert.equal(saved.date, "2027-03-06");
      assert.equal(saved.guestPlanning.arrival, "Arrive 45 minutes early.");
      assert.equal(saved.gymnasticsPageText.invitation, "Bring your team spirit");
      await openEditor();
      await floating().waitFor();
      await page.waitForFunction(expected => {
        const element = document.querySelector('[data-text-positioned="Welcome message"]');
        if (!element) return false;
        const rect = element.getBoundingClientRect(), canvas = element.parentElement.getBoundingClientRect();
        return Math.abs((rect.left - canvas.left) / (canvas.width - rect.width) - expected.x) < 0.002 &&
          Math.abs((rect.top - canvas.top) / (canvas.height - rect.height) - expected.y) < 0.002;
      }, placement[device]);
      const actual = await floating().evaluate(el => {
        const rect = el.getBoundingClientRect(), canvas = el.parentElement.getBoundingClientRect();
        return { x: (rect.left - canvas.left) / (canvas.width - rect.width), y: (rect.top - canvas.top) / (canvas.height - rect.height) };
      });
      assert.ok(Math.abs(actual.x - placement[device].x) < 0.002);
      assert.ok(Math.abs(actual.y - placement[device].y) < 0.002);
      await floating().scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `${device}-${dark ? "dark" : "light"}.png`), fullPage: true });
      await page.goto(`${origin}/event/gymnastics/customize?mode=gymnastics-guest&edit=${id}`);
      await floating().waitFor();
      assert.equal(await page.getByRole("button", { name: /^(Options for|Move welcome|Edit welcome|Duplicate welcome|Delete welcome)/ }).count(), 0);
      assert.equal(await floating().innerText(), "Bring your team spirit");
      await page.getByRole("tab", { name: "Meet Details", exact: true }).click();
      await page.getByText("Family essentials", { exact: true }).waitFor();
      await page.getByText("Host-reviewed meet information.", { exact: true }).waitFor();
      await page.getByText("Arrive 45 minutes early.", { exact: true }).waitFor();
      assert.equal(await page.locator("[data-section-content-editor]").count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await openEditor();
      await floating().waitFor();
      await options(floating());
      if (!mobile) {
        await floating().getByRole("button", { name: "Move welcome message", exact: true }).focus();
        await page.keyboard.press("Enter");
        const oldLeft = await floating().evaluate(el => el.style.left);
        await page.keyboard.press("Shift+ArrowLeft");
        await page.waitForFunction(previous => document.querySelector('[data-text-positioned="Welcome message"]')?.style.left !== previous, oldLeft);
        await page.keyboard.press("Escape");
        await options(floating());
      }
      await page.getByRole("button", { name: "Reset welcome message position", exact: true }).click();
      try { await floating().waitFor({ state: "hidden" }); } catch (error) {
        await page.screenshot({ path: path.join(output, `reset-failure-${device}-${dark}.png`), fullPage: true });
        throw new Error(`${id}: ${error.message}`);
      }
      await save();
      assert.equal(writes.at(-1).data.templateEditor.snapshot.data.gymnasticsPageText["placement:invitation"], undefined);
      await page.goto(`${origin}/event/gymnastics/customize?mode=gymnastics-guest&edit=${id}`);
      await page.getByText("Bring your team spirit", { exact: true }).waitFor();
      assert.equal(await floating().count(), 0, "reset placement survives save and guest reload");
      assert.deepEqual(errors, []);
    } catch (error) {
      await page.screenshot({ path: path.join(output, `failure-${mobile ? "phone" : "desktop"}-${dark ? "dark" : "light"}.png`), fullPage: true }).catch(() => {});
      throw error;
    } finally { await context.close(); }
  });
}
