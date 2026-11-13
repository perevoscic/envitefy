const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const { createJiti } = require("jiti");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("native themed pages and current General Event Pages retain selected artwork through save, reload and guest rendering", { timeout: 240000 }, async () => {
  const output = path.resolve(".qa/themed-event-editor-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/themed-event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }), new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/data/event-page-themed-artwork-availability.json": path.resolve("scripts/fixtures/themed-event-artwork-availability.ts"),
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
  const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") } });
  const { EVENT_PAGE_THEMED_DESIGNS } = jiti("../src/data/event-page-themed-designs.ts");
  const { GENERAL_EVENT_DESIGNS } = jiti("../src/lib/general-event-designs.ts");
  const { getHolidayBackground } = jiti("../src/lib/holiday-backgrounds.ts");
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/events"; @source "../src/components/templates"; @source "../src/components/ScrollHandoffContainer.tsx"; @source "../src/app/event/sport-events/customize/page.tsx"; @source "../src/app/event/baby-showers/customize/page.tsx"; @source "../src/app/event/general/customize/page.tsx"; @source "../src/data/event-page-themed-designs.ts";',
    { from: path.resolve("scripts/themed-event-editor-fixture.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(15000);
  const errors = [], records = new Map(), writes = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.addInitScript(() => { window.__fixtureErrors = []; window.addEventListener("error", (event) => window.__fixtureErrors.push({ message: event.message, filename: event.filename, line: event.lineno, column: event.colno })); });
  await page.route("**/*", async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
    if (url.origin === "http://localhost:43139" && url.pathname.endsWith(".js")) {
      const chunk = path.join(output, path.basename(url.pathname));
      if (fs.existsSync(chunk)) return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: fs.readFileSync(chunk) });
    }
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (request.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...records.get(id), permissions: { role: "owner", canEdit: true, canManageCollaborators: true } }) });
      const body = request.postDataJSON();
      const row = { id: id || `saved-${writes.length}`, title: body.title, data: body.data, revision: `v${writes.length}`, public_slug: id || `saved-${writes.length}` };
      records.set(row.id, row); writes.push(row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (/\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(`${path.resolve("public")}${path.sep}`) && fs.existsSync(asset)) return route.fulfill({ path: asset });
      return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#4c6b54"/></svg>' });
    }
    if (url.origin === "http://localhost:43139") return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  try {
    for (const collection of ["bridal-showers", "dance"]) {
      const design = EVENT_PAGE_THEMED_DESIGNS.find(item => item.collection === collection);
      assert.ok(design);
      const pathname = `/${collection === "bridal-showers" ? "bridal-showers" : "sport-events"}/templates/${design.id}/customize`;
      await page.goto(`http://localhost:43139${pathname}?collection=${collection}&templateId=${design.id}`);
      const header = page.locator(`[data-themed-event-header="${design.id}"]`);
      await header.waitFor();
      assert.equal(await header.locator("img").first().getAttribute("src"), design.artwork);
      assert.equal(await header.getAttribute("data-composition"), design.composition);
      assert.equal(await header.getAttribute("data-page-layout"), design.editorLayout);
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).has("edit"));
      const row = writes.at(-1);
      assert.equal(row.data.bodyDesignId, design.id);
      assert.equal(row.data.heroImage, design.artwork);
      assert.equal(row.data.themeId, design.id);
      assert.equal(row.data.fontFamily || row.data.theme.fontFamily, design.font);
      assert.equal(row.data.theme.bgStyle.backgroundColor, design.background);
      assert.equal(row.data.templateEditor.templateId, design.id);
      await page.reload();
      await page.locator(`[data-themed-event-header="${design.id}"]`).waitFor();
      await page.goto(`http://localhost:43139/event/guest?guest=1&id=${row.id}&collection=${collection}`);
      const guest = page.locator(`[data-themed-event-header="${design.id}"]`);
      await guest.waitFor();
      assert.equal(await guest.locator("img").first().getAttribute("src"), design.artwork);
      assert.equal(await guest.getAttribute("data-composition"), design.composition);
      assert.equal(await guest.getAttribute("data-page-layout"), design.editorLayout);
      assert.ok(await page.locator("[data-template-body-layout]").count());
    }
    const holidayDesigns = GENERAL_EVENT_DESIGNS.filter(design => design.occasion === "cinco-de-mayo");
    assert.equal(holidayDesigns.length, 10);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      const graduation = EVENT_PAGE_THEMED_DESIGNS.find(design => design.collection === "graduations");
      for (const design of [graduation, ...holidayDesigns]) {
        const collection = design.collection || "holidays-seasonal";
        await page.goto(`http://localhost:43139/event/design/customize?collection=${collection}&templateId=${design.id}`);
        const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
        await controls.waitFor();
        await controls.getByRole("button", { name: /^Event details/ }).click();
        assert.equal(await page.getByLabel("Event title", { exact: true }).inputValue(), "", "a catalog design does not invent an event title");
        assert.equal(await page.getByLabel("Date", { exact: true }).inputValue(), "", "a holiday design does not assign its calendar date");
        const before = writes.length;
        await page.getByRole("button", { name: "Preview", exact: true }).click();
        await page.getByRole("button", { name: "Close preview", exact: true }).waitFor();
        const authored = page.locator('article[data-layout]');
        assert.equal(await authored.locator("img").first().getAttribute("src"), design.artwork);
        assert.equal(await authored.getByRole("heading", { level: 1 }).innerText(), "Your event title");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.equal(writes.length, before, "preview never saves the event");
        await authored.screenshot({ path: path.join(output, `current-${design.id}-${width}.png`) });
        await page.getByRole("button", { name: "Close preview", exact: true }).click();
        await page.getByRole("button", { name: "Save draft", exact: true }).click();
        await page.getByText("Draft saved.", { exact: true }).waitFor();
        const row = writes.at(-1);
        assert.equal(row.data.createdVia, "custom-event-page");
        assert.equal(row.data.customEventPage.sourceTemplateId, design.id);
        assert.equal(row.data.customEventPage.artwork, design.artwork);
        assert.equal(row.data.customEventPage.design.fontFamily, design.font || design.fontFamily);
        assert.equal(row.data.customEventPage.design.colors.page, getHolidayBackground(design.id)?.page || design.background);
        assert.equal(row.data.customEventPage.details.title, "");
        assert.equal(row.data.customEventPage.details.date, "");
        assert.equal(row.data.creationCollection, collection);
        await page.reload();
        await page.getByRole("complementary", { name: "Event editing controls", exact: true }).waitFor();
        await page.getByRole("button", { name: "Preview", exact: true }).click();
        await page.getByRole("button", { name: "Close preview", exact: true }).waitFor();
        assert.equal(await authored.locator("img").first().getAttribute("src"), design.artwork);
        await page.goto(`http://localhost:43139/event/guest?guest=1&id=${row.id}&collection=${collection}`);
        await authored.waitFor();
        assert.equal(await authored.locator("img").first().getAttribute("src"), design.artwork);
        assert.equal(await authored.getAttribute("data-layout"), row.data.customEventPage.design.layout);
      }
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    fs.writeFileSync(path.join(output, "failed-writes.json"), JSON.stringify(writes, null, 2));
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
    throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}\nError locations: ${JSON.stringify(await page.evaluate(() => window.__fixtureErrors))}\nRendered page: ${(await page.locator("body").innerText()).slice(0, 1400)}`);
  } finally { await browser.close(); }
});
