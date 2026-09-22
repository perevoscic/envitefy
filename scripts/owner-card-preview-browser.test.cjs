const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("owner card previews keep RSVP choices local, while the public card still saves responses", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/owner-card-preview");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/owner-card-preview/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.resolve("src") } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) }), { apply(compiler) {
        compiler.hooks.compilation.tap("FixtureCss", (compilation) => {
          compiled.webpack.NormalModule.getCompilationHooks(compilation).loader.tap("FixtureCss", (context) => {
            context.currentTraceSpan = require("next/dist/trace").trace("fixture-css");
          });
        });
      } }],
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: [require.resolve("next/dist/build/webpack/loaders/next-style-loader"), { loader: require.resolve("next/dist/build/webpack/loaders/css-loader/src"), options: {
          modules: { getLocalIdent: (context, _template, name) => `${path.basename(context.resourcePath, ".module.css")}_${name}` },
          postcss: async () => ({ postcss: require("postcss") }),
        } }] },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/studio/SharedStudioCardPage.tsx";\n@source "../components/studio/StudioLiveCardActionSurface.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  const writes = [];
  const errors = [];
  const unexpected = [];
  const base = "http://owner-preview.test";
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== base) { unexpected.push(req.url()); return route.abort(); }
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/events/qa-card/rsvp") {
      writes.push(req.postDataJSON());
      return route.fulfill({ contentType: "application/json", body: '{"ok":true}' });
    }
    if (url.pathname !== "/") { unexpected.push(req.url()); return route.abort(); }
    return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><style>${css}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
  });
  try {
    for (const query of ["mode=embedded", "mode=embedded&contact=email", "mode=embedded&published=1", "mode=owner&published=1", "mode=embedded&placement=above"]) {
      await page.goto(`${base}/?${query}`);
      await page.getByRole("button", { name: "RSVP", exact: true }).click();
      await page.getByText("Try the RSVP form. Responses are not sent from this preview.").waitFor();
      assert.equal(await page.locator('a[href^="sms:"], a[href^="mailto:"]').count(), 0);
      for (const choice of ["Yes", "No", "Maybe"]) {
        await page.getByRole("button", { name: choice, exact: true }).click();
        assert.equal(await page.getByRole("button", { name: "Preview only", exact: true }).isDisabled(), true);
      }
      await page.getByLabel("Your name", { exact: true }).fill("Preview guest");
      await page.getByLabel("Email", { exact: true }).fill("guest@example.test");
      // Even a programmatic submit must hit the preview guard.
      await page.locator("form").evaluate((form) => form.requestSubmit());
      assert.equal(page.url(), `${base}/?${query}`);
      assert.equal(writes.length, 0);
    }
    await page.goto(`${base}/?published=1`);
    await page.getByRole("button", { name: "RSVP", exact: true }).click();
    await page.getByRole("button", { name: "Yes", exact: true }).click();
    await page.getByLabel("Your name", { exact: true }).fill("Real guest");
    await page.getByLabel("Email", { exact: true }).fill("guest@example.test");
    await page.getByRole("button", { name: "Send RSVP", exact: true }).click();
    await page.getByText("Thank you for RSVP-ing.", { exact: true }).waitFor();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].response, "yes");
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/?product=invite&published=1`);
      for (const name of ["RSVP", "Overview", "Location", "Calendar", "Registry"]) assert.equal(await page.getByRole("button", { name, exact: true }).count(), 0);
      await page.getByRole("button", { name: "Share invitation", exact: true }).waitFor();
      const download = page.getByRole("button", { name: "Download artwork", exact: true });
      await download.waitFor();
      const bounds = await download.boundingBox();
      assert.ok(bounds && bounds.y + bounds.height <= viewport.height, "classic invite download stays within the viewport");
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  } catch (error) {
    console.error({ url: page.url(), errors, unexpected, text: await page.locator("body").innerText() });
    throw error;
  } finally { await browser.close(); }
});
