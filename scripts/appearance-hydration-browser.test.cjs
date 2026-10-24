const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToString } = require("react-dom/server");
const { chromium } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/appearance-hydration");
const fixture = path.resolve("scripts/fixtures/appearance-hydration.tsx");
const styles = new Proxy({}, {
  get: (_, name) => name === "__esModule" ? false : `appearance_selector_module_css_${String(name)}`,
});
const { buildAppearanceBootstrap } = loadTs("src/lib/appearance.ts");

function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
  return fs.existsSync(chrome) ? chrome : undefined;
}

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false, cache: false,
      entry: fixture, output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("development") })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@": path.resolve("src") } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
      performance: { hints: false },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  return fs.readFileSync(path.join(output, "fixture.js"), "utf8");
}

test("deferred appearance switches hydrate against server attributes after the provider resolves appearance", { timeout: 120000 }, async () => {
  const { AppearanceHydrationFixture } = loadTs(fixture, {
    "./appearance-selector.module.css": styles,
    "lucide-react": await import("lucide-react"),
  });
  const bundle = await buildFixture();
  const markup = renderToString(React.createElement(AppearanceHydrationFixture));
  assert.match(markup, /aria-checked="false"/);
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  try {
    for (const scenario of [
      { label: "device dark", colorScheme: "dark", saved: null, expected: "system:dark", dark: true },
      { label: "saved dark overrides light device", colorScheme: "light", saved: "dark", expected: "dark:dark", dark: true },
      { label: "device light", colorScheme: "light", saved: null, expected: "system:light", dark: false },
      { label: "saved light overrides dark device", colorScheme: "dark", saved: "light", expected: "light:light", dark: false },
    ]) {
      const context = await browser.newContext({ colorScheme: scenario.colorScheme });
      const page = await context.newPage();
      const diagnostics = [];
      page.on("pageerror", (error) => diagnostics.push(error.message));
      page.on("console", (message) => {
        if (["warning", "error"].includes(message.type()) && /hydrat|server rendered|server HTML|did not match/i.test(message.text())) diagnostics.push(message.text());
      });
      await context.addInitScript((saved) => {
        if (saved === null) localStorage.removeItem("envitefy:appearance:v1");
        else localStorage.setItem("envitefy:appearance:v1", saved);
      }, scenario.saved);
      await page.route("http://appearance-hydration.test/**", (route) => route.request().url().endsWith("fixture.js")
        ? route.fulfill({ contentType: "text/javascript", body: bundle })
        : route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script>${buildAppearanceBootstrap()}</script><div id="root">${markup}</div><script src="/fixture.js"></script></body></html>` }));
      await page.goto("http://appearance-hydration.test/");
      await page.getByTestId("appearance-state").filter({ hasText: scenario.expected }).waitFor();
      assert.equal(await page.getByRole("switch", { name: "Dark mode", exact: true }).getAttribute("aria-checked"), "false", `${scenario.label}: deferred markup retains the server snapshot`);
      await page.evaluate(() => window.releaseAppearanceHydration());
      await page.waitForFunction(() => document.documentElement.dataset.switchHydrated === "true");
      assert.deepEqual(await page.evaluate(() => window.recoverableErrors), [], `${scenario.label}: React reports no recovery`);
      assert.deepEqual(diagnostics, [], `${scenario.label}: React reports no hydration warning or error`);
      const toggle = page.getByRole("switch", { name: "Dark mode", exact: true });
      await page.waitForFunction((dark) => document.querySelector('[role="switch"]').getAttribute("aria-checked") === String(dark), scenario.dark);
      assert.equal(await toggle.getAttribute("data-state"), scenario.dark ? "checked" : "unchecked", `${scenario.label}: switch resolves its state after hydration`);
      assert.equal(await toggle.getAttribute("title"), scenario.dark ? "Use light theme" : "Use dark theme");
      await toggle.click();
      await page.getByTestId("appearance-state").filter({ hasText: scenario.dark ? "light:light" : "dark:dark" }).waitFor();
      assert.equal(await toggle.isChecked(), !scenario.dark, `${scenario.label}: hydrated switch remains interactive`);
      assert.equal(await page.evaluate(() => localStorage.getItem("envitefy:appearance:v1")), scenario.dark ? "light" : "dark");
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
