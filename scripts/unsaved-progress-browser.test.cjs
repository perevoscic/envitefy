const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("optional progress prompt preserves dirty navigation, focus and account saves while its chunk loads", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/unsaved-progress-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "production", target: "web", devtool: false,
      optimization: { minimize: false },
      entry: path.resolve("scripts/fixtures/unsaved-progress/entry.tsx"),
      output: { path: output, filename: "fixture.js", chunkFilename: "prompt-[id].js", publicPath: "/" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("production") })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"] },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => {
      if (error || stats?.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
      else resolve();
    }));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx";',
    { from: path.resolve("scripts/unsaved-progress-fixture.css") },
  )).css;
  const initial = fs.readFileSync(path.join(output, "fixture.js"), "utf8");
  assert.doesNotMatch(initial, /data-radix-focus-guard/, "the initial provider bundle excludes Radix dialog implementation");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let promptRequests = 0;
  let releaseChunk;
  const holdChunk = new Promise((resolve) => { releaseChunk = resolve; });
  let rejectChunk = false;
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: initial });
    if (/^\/prompt-\d+\.js$/.test(url.pathname)) {
      promptRequests++;
      await holdChunk;
      if (rejectChunk) return route.abort();
      return route.fulfill({ contentType: "text/javascript", path: path.join(output, path.basename(url.pathname)) });
    }
    return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
  });
  const start = async (title) => {
    await page.goto("http://progress.test/editor");
    await page.getByRole("button", { name: "Start editing", exact: true }).waitFor();
    assert.equal(promptRequests, 0, "an editor-free page does not request the optional prompt");
    await page.getByRole("button", { name: "Start editing", exact: true }).click();
    await page.getByLabel("Event title", { exact: true }).fill(title);
  };
  const leave = () => page.getByRole("link", { name: "Leave editor", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Save your progress?", exact: true });
  try {
    await start("Preserved pending event");
    await leave();
    await page.waitForFunction(() => document.querySelector("[inert]") !== null);
    assert.equal(new URL(page.url()).pathname, "/editor", "dirty navigation remains blocked while the delayed chunk is unavailable");
    assert.equal(await dialog.count(), 0);
    assert.ok(promptRequests > 0, "editor registration warms the optional prompt chunk");
    releaseChunk();
    await dialog.waitFor();
    await page.waitForFunction(() => document.activeElement?.textContent === "Keep editing");
    assert.equal(await dialog.getByRole("button", { name: "Keep editing", exact: true }).evaluate((element) => document.activeElement === element), true);
    await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await page.getByLabel("Event title", { exact: true }).inputValue(), "Preserved pending event");
    await page.waitForFunction(() => document.activeElement?.textContent === "Leave editor");
    assert.equal(await page.getByRole("link", { name: "Leave editor", exact: true }).evaluate((element) => document.activeElement === element), true);
    const loadedRequests = promptRequests;
    await leave();
    await page.evaluate(() => { window.__progressFixture.mode = "failure"; });
    await dialog.getByRole("button", { name: "Save and leave", exact: true }).click();
    assert.equal(await dialog.getByRole("alert").textContent(), "Fixture save failed");
    assert.equal(new URL(page.url()).pathname, "/editor");
    await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
    await leave();
    await page.evaluate(() => { window.__progressFixture.mode = "account"; });
    await dialog.getByRole("button", { name: "Save and leave", exact: true }).click();
    await page.getByRole("dialog", { name: "Account save", exact: true }).waitFor();
    assert.equal(await dialog.count(), 0, "the original prompt releases focus/inertness for the account dialog");
    assert.equal(new URL(page.url()).pathname, "/editor", "account continuation keeps the destination pending until its real save finishes");
    await page.getByRole("button", { name: "Complete account save", exact: true }).click();
    await page.getByText("Destination reached", { exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/destination");
    assert.equal(promptRequests, loadedRequests, "reopening uses the same prompt module");
    assert.deepEqual(await page.evaluate(() => ({ saves: window.__progressFixture.saves, discards: window.__progressFixture.discards })), { saves: 2, discards: 0 });

    promptRequests = 0;
    await start("Discarded fixture event");
    await leave();
    await dialog.getByRole("button", { name: "Discard and leave", exact: true }).click();
    await page.getByText("Destination reached", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__progressFixture.discards), 1);

    promptRequests = 0;
    rejectChunk = true;
    await start("Retained after chunk failure");
    await leave();
    await page.waitForFunction(() => document.querySelector("[inert]") === null);
    assert.equal(new URL(page.url()).pathname, "/editor", "failed optional code never discards or navigates away");
    assert.equal(await page.getByLabel("Event title", { exact: true }).inputValue(), "Retained after chunk failure");
    rejectChunk = false;
    await leave();
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.deepEqual(errors, []);
  } finally {
    releaseChunk();
    await browser.close();
  }
});
