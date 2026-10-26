const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const allowed = { policy: "standard", allowedProducts: ["event_page"], allowedCategories: ["weddings"] };
const denied = { policy: "restricted", allowedProducts: [], allowedCategories: [] };

test("guest template edits survive first sign-in while account switches and denied grants stay isolated", { timeout: 60000 }, async () => {
  const output = path.resolve("output/template-access-boundary-browser");
  const entry = path.resolve("scripts/fixtures/template-access-boundary.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry, output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next-auth/react": entry,
        "@/hooks/useCreationAccess": entry,
        "@": path.resolve("src"),
      } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname.startsWith("/api/history/")) return route.fulfill({ status: 403, json: { error: "No editing permission" } });
    if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: '<!doctype html><html><body><div id="root"></div><script src="/fixture.js"></script></body></html>' });
    return route.abort();
  });
  const set = next => page.evaluate(value => window.templateAccessFixture.set(value), next);
  const field = page.getByRole("textbox", { name: "Event title" });
  try {
    await page.goto("http://template-access.test/");
    await field.fill("Guest wedding edits");
    const mount = await field.getAttribute("data-mount");
    await set({ status: "loading" });
    assert.equal(await field.inputValue(), "Guest wedding edits");
    await set({ status: "authenticated", identity: "first@example.com", loading: false });
    assert.equal(await field.inputValue(), "Guest wedding edits", "the first authenticated render precedes the access hook's loading effect");
    await set({ loading: true });
    assert.equal(await field.getAttribute("data-mount"), mount, "the guest editor remains mounted while fetching grants");
    await set({ access: allowed, loading: false });
    assert.equal(await field.inputValue(), "Guest wedding edits");
    assert.equal(await field.getAttribute("data-mount"), mount, "adopting verified access keeps the editor instance");

    await set({ identity: "second@example.com", access: null, loading: true });
    assert.equal(await field.count(), 0, "a new account cannot see prior fields while its permissions load");
    await set({ access: allowed, loading: false });
    assert.equal(await field.inputValue(), "", "the next account receives fresh mounted state");
    await field.fill("Second account private edits");
    await set({ status: "unauthenticated", identity: "", access: null });
    assert.equal(await field.inputValue(), "", "sign-out cannot expose account state through the public template");

    await field.fill("Another guest draft");
    await set({ status: "authenticated", identity: "restricted@example.com", loading: true });
    assert.equal(await field.inputValue(), "Another guest draft");
    await set({ access: denied, loading: false });
    await page.getByRole("heading", { name: "Access to this event type is required" }).waitFor();
    assert.equal(await field.count(), 0, "guest continuity never grants denied creation permission");

    await set({ status: "unauthenticated", identity: "", access: null, eventId: "private-event" });
    await page.getByRole("heading", { name: "Editing access is required" }).waitFor();
    assert.equal(await field.count(), 0, "saved event access is never covered by guest admission");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
