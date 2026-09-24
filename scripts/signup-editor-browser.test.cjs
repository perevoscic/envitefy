const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("signup builder keeps mobile actions in one row, moves dates, protects navigation and duplicates without saving", { timeout: 180000 }, async () => {
  const output = path.resolve(".qa/signup-editor");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/signup-editor/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/signup-editor/auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/signup-editor/auth.tsx"),
        "@/components/CalendarAction": path.resolve("scripts/fixtures/signup-editor/calendar.tsx"),
        "./SignupDesignPanel": path.resolve("scripts/fixtures/signup-editor/design.tsx"),
        "@": path.resolve("src"),
      } },
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
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none);\n@source "../components/smart-signup-form";\n@source "../components/templates/TemplateEditorContext.tsx";\n@source "../components/UnsavedProgressProvider.tsx";\n@source "../app/templates/signup/page.tsx";',
    { from: path.resolve("src/app/globals.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(10000);
  const errors = [];
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  const base = "http://localhost:43125";
  const editorPath = "/signup-forms/templates/editorial--school-days/customize";
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (req.method() !== "GET") {
      writes.push({ path: url.pathname, method: req.method(), data: req.postDataJSON() });
      return route.fulfill({ status: 200, json: { id: "new-copy", data: req.postDataJSON().data } });
    }
    if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/")) {
      const file = path.resolve("public", url.pathname.slice(1));
      if (file.startsWith(path.resolve("public") + path.sep) && fs.existsSync(file)) return route.fulfill({ body: fs.readFileSync(file) });
      return route.fulfill({ status: 404 });
    }
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}body{margin:0}button{cursor:pointer}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
  });
  const click = (name) => page.getByRole("button", { name, exact: true }).click();
  const sameRow = async (locators) => {
    const boxes = await Promise.all(locators.map((locator) => locator.boundingBox()));
    assert.ok(boxes.every(Boolean));
    assert.ok(boxes.every((box) => Math.abs(box.y - boxes[0].y) < 2), JSON.stringify(boxes));
    assert.ok(boxes.every((box) => box.height >= 44 && box.x >= 0 && box.x + box.width <= page.viewportSize().width));
  };
  try {
    await page.goto(`${base}/previous`);
    await page.goto(`${base}${editorPath}?edit=saved-form`);
    await page.getByRole("button", { name: "Duplicate event", exact: true }).waitFor();
    for (const width of [320, 375, 430, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 812 });
      const nav = page.getByRole("navigation", { name: "Signup editor" });
      await sameRow([nav.getByRole("button", { name: "← Back", exact: true }), nav.getByRole("button", { name: "Start over", exact: true }), nav.getByRole("button", { name: "Save as draft", exact: true })]);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await click("Reopen signups");
    await click("Edit date and time");
    await page.locator("#signup-start").fill("2026-10-31T15:00");
    assert.equal(await page.locator("#signup-end").inputValue(), "2026-10-31T16:00");
    await page.locator("#signup-end").fill("2026-10-22T16:00");
    await click("Done");
    await click("Preview & publish →");
    await page.getByRole("button", { name: /Ends is before or at Starts/ }).click();
    await page.waitForFunction(() => document.activeElement?.id === "signup-end");
    await page.locator("#signup-end").fill("2026-10-31T16:00");
    await click("Done");
    await page.screenshot({ path: path.join(output, "mobile-builder.png") });
    assert.equal(await page.getByRole("textbox", { name: "Signup link", exact: true }).inputValue(), `${base}/smart-signup-form/saved-form`);
    await click("Preview & publish →");
    for (const width of [320, 375, 430]) {
      await page.setViewportSize({ width, height: 812 });
      await sameRow([page.getByRole("button", { name: "Back to editing", exact: true }), page.getByRole("button", { name: "Publish signup", exact: true })]);
      assert.equal(await page.getByRole("button", { name: "Cancel", exact: true }).isVisible(), false);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.getByText("Update these details", { exact: true }).count(), 0);
    assert.equal(await page.getByText(/This signup is closed/).count(), 0);
    await page.screenshot({ path: path.join(output, "mobile-preview.png") });
    await click("Back to editing");
    await click("← Back");
    await page.getByRole("dialog", { name: "Save your progress?" }).waitFor();
    await click("Keep editing");
    await click("Duplicate event");
    await click("Discard and leave");
    await page.getByText("Maple Grove Parent Conferences (copy)", { exact: true }).waitFor();
    await page.getByText("Publish your signup to get a shareable link.", { exact: true }).waitFor();
    assert.equal(writes.length, 0, "copy, preview and date edits never save or publish");
    const databases = await page.evaluate(() => indexedDB.databases());
    assert.equal(databases.some((db) => db.name === "envitefy-template-drafts"), false, "duplicate stays in memory");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await sameRow([page.getByRole("button", { name: "Cancel", exact: true }), page.getByRole("button", { name: "Preview & publish →", exact: true })]);
    await page.screenshot({ path: path.join(output, "desktop-builder.png") });
    await click("Preview & publish →");
    await sameRow([page.getByRole("button", { name: "Cancel", exact: true }), page.getByRole("button", { name: "Publish signup", exact: true })]);
    await click("Publish signup");
    await page.getByText("Previous page: /smart-signup-form/new-copy", { exact: true }).waitFor();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, "/api/history");
    assert.equal(writes[0].method, "POST");
    assert.equal(writes[0].data.data.signupForm.end, "2026-10-31T16:00");
    assert.deepEqual(writes[0].data.data.signupForm.responses, []);
    await page.goto(`${base}/previous`);
    await page.goto(`${base}${editorPath}?edit=saved-form`);
    await page.getByRole("button", { name: "Duplicate event", exact: true }).waitFor();
    await click("← Back");
    await page.getByText("Previous page: /previous", { exact: true }).waitFor();
    await page.goto(`${base}${editorPath}?edit=saved-form`);
    await page.getByRole("button", { name: "Duplicate event", exact: true }).waitFor();
    await click("Cancel");
    await page.getByText("Previous page: /previous", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(output, "failure.png") });
    throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}\nVisible text: ${(await page.locator("body").innerText()).slice(0, 2500)}`);
  } finally { await browser.close(); }
});
