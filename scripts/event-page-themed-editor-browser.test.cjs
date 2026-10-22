const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const { createJiti } = require("jiti");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("themed sports and bridal designs retain artwork, typography, palette and body through draft saves, reloads and guest rendering", { timeout: 180000 }, async () => {
  const output = path.resolve(".qa/themed-event-editor-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/themed-event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
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
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/events"; @source "../src/components/templates"; @source "../src/app/event/sport-events/customize/page.tsx"; @source "../src/app/event/baby-showers/customize/page.tsx"; @source "../src/data/event-page-themed-designs.ts";',
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
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (request.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...records.get(id), permissions: { role: "owner", canManageCollaborators: true } }) });
      const body = request.postDataJSON();
      const row = { id: id || `saved-${writes.length}`, title: body.title, data: body.data, revision: `v${writes.length}`, public_slug: id || `saved-${writes.length}` };
      records.set(row.id, row); writes.push(row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (/\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#4c6b54"/></svg>' });
    if (url.origin === "http://localhost:43139") return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  try {
    for (const collection of ["bridal-showers", "dance"]) {
      const design = EVENT_PAGE_THEMED_DESIGNS.find((item) => item.collection === collection);
      assert.ok(design, `authored ${collection} definition exists`);
      const url = `http://localhost:43139/${collection === "bridal-showers" ? "bridal-showers" : "sport-events"}/templates/${design.id}/customize?collection=${collection}&templateId=${design.id}`;
      await page.goto(url);
      const header = page.locator(`[data-themed-event-header="${design.id}"]`);
      await header.waitFor();
      assert.equal(await header.locator("img").first().getAttribute("src"), design.artwork);
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).has("edit"));
      const row = writes.at(-1);
      assert.equal(row.data.bodyDesignId, design.id);
      assert.equal(row.data.heroImage, design.artwork);
      assert.equal(row.data.themeId, design.id);
      assert.equal(row.data.fontFamily, design.font);
      assert.equal(row.data.theme.bgStyle.backgroundColor, design.background);
      assert.equal(row.data.templateEditor.templateId, design.id);
      await page.reload();
      await page.locator(`[data-themed-event-header="${design.id}"]`).waitFor();
      await page.goto(`http://localhost:43139/event/guest?guest=1&id=${row.id}&collection=${collection}`);
      await page.locator(`[data-themed-event-header="${design.id}"]`).waitFor();
      assert.equal(await page.locator(`[data-themed-event-header="${design.id}"] img`).first().getAttribute("src"), design.artwork);
      assert.ok(await page.locator("[data-template-body-layout]").count(), "guest view keeps authored body structure");
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
    throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}\nError locations: ${JSON.stringify(await page.evaluate(() => window.__fixtureErrors))}\nRendered page: ${(await page.locator("body").innerText()).slice(0, 1400)}`);
  } finally { await browser.close(); }
});
