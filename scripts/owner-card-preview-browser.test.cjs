const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("owner card previews keep RSVP choices local, while the public card still saves responses", { timeout: 120000 }, async () => {
  const output = path.resolve("output/owner-card-preview");
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
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/studio/SharedStudioCardPage.tsx";\n@source "../components/studio/StudioLiveCardActionSurface.tsx";\n@source "../components/ArtworkDownloadButton.tsx";\n@source "../components/ArtworkPreviewDialog.tsx";');
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
      assert.equal(await page.getByText("Try the RSVP form. Responses are not sent from this preview.").count(), 0);
      assert.equal(await page.locator('a[href^="sms:"], a[href^="mailto:"]').count(), 0);
      for (const choice of ["Yes", "No", "Maybe"]) {
        await page.getByRole("button", { name: choice, exact: true }).click();
        assert.equal(await page.getByRole("button", { name: "Send response", exact: true }).isDisabled(), true);
      }
      const sendResponse = page.getByRole("button", { name: "Send response", exact: true });
      await page.getByLabel("Your name", { exact: true }).fill("Preview guest");
      assert.equal(await sendResponse.isDisabled(), true, "email is required");
      await page.getByLabel("Email", { exact: true }).fill("invalid-email");
      assert.equal(await sendResponse.isDisabled(), true, "email must be valid");
      await page.getByLabel("Email", { exact: true }).fill("guest@example.test");
      await page.getByLabel("Your name", { exact: true }).fill("   ");
      assert.equal(await sendResponse.isDisabled(), true, "whitespace is not a name");
      await page.getByLabel("Your name", { exact: true }).fill("Preview guest");
      assert.equal(await sendResponse.isEnabled(), true, "complete preview can show its confirmation");
      await sendResponse.click();
      await page.getByText("Thank you for RSVP-ing.", { exact: true }).waitFor();
      assert.equal(page.url(), `${base}/?${query}`);
      assert.equal(writes.length, 0);
    }
    await page.goto(`${base}/?published=1`);
    await page.getByRole("button", { name: "RSVP", exact: true }).click();
    await page.getByRole("button", { name: "Yes", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Send response", exact: true }).isDisabled(), true);
    await page.getByLabel("Your name", { exact: true }).fill("Real guest");
    await page.getByLabel("Email", { exact: true }).fill("guest@example.test");
    await page.getByRole("button", { name: "Send response", exact: true }).click();
    await page.getByText("Thank you for RSVP-ing.", { exact: true }).waitFor();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].response, "yes");
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/?product=invite&published=1`);
      for (const name of ["RSVP", "Overview", "Location", "Calendar", "Registry"]) assert.equal(await page.getByRole("button", { name, exact: true }).count(), 0);
      await page.getByRole("button", { name: "Share invitation", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Download artwork", exact: true }).count(), 0, "guests cannot download, even for classic invites");
      await page.goto(`${base}/?mode=owner&product=invite&published=1`);
      const download = page.getByRole("button", { name: "Download artwork", exact: true });
      await download.waitFor();
      const frame = await page.locator("[data-live-card-artwork]").boundingBox();
      const bounds = await download.boundingBox();
      const close = await page.getByRole("button", { name: "Close preview", exact: true }).boundingBox();
      assert.ok(bounds && frame && bounds.x >= frame.x && bounds.y >= frame.y && bounds.x + bounds.width <= frame.x + frame.width && bounds.y + bounds.height <= frame.y + frame.height, "owner download stays on the artwork");
      assert.ok(close && bounds.x + bounds.width <= close.x && Math.abs(bounds.y - close.y) < 1, "download is next to Close");
      assert.ok(bounds.width >= 44 && bounds.height >= 44, "icon keeps a usable touch target");
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  } catch (error) {
    console.error({ url: page.url(), errors, unexpected, text: await page.locator("body").innerText() });
    throw error;
  } finally { await browser.close(); }
});
