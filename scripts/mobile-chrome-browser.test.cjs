const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium, webkit } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { buildAppearanceBootstrap } = loadTs("src/lib/appearance.ts");
const { applicationChromeColors } = loadTs("src/themes/chrome.ts");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();
const output = path.resolve("output/mobile-chrome-browser");

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false, cache: false,
      entry: path.resolve("scripts/fixtures/mobile-chrome.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("development") })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "@": path.resolve("src"), "next/navigation": path.resolve("scripts/fixtures/concierge/navigation.tsx"),
      } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
      performance: { hints: false },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  return { css, bundle: fs.readFileSync(path.join(output, "fixture.js"), "utf8") };
}

async function assertChrome(page, color, tone, ios) {
  await page.waitForFunction(({ color, tone }) => {
    const root = document.documentElement;
    return [...document.querySelectorAll('meta[name="theme-color"]')].every(meta => meta.content.toLowerCase() === color.toLowerCase())
      && document.querySelector('meta[name="color-scheme"]').content === tone
      && root.style.getPropertyValue("--mobile-chrome-top").toLowerCase() === color.toLowerCase()
      && root.style.getPropertyValue("--mobile-chrome-bottom").toLowerCase() === color.toLowerCase();
  }, { color, tone });
  const values = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      before: getComputedStyle(document.body, "::before").backgroundColor,
      after: getComputedStyle(document.body, "::after").backgroundColor,
      background: getComputedStyle(root).backgroundColor,
      images: ["::before", "::after"].map(pseudo => getComputedStyle(document.body, pseudo).backgroundImage),
      status: [...document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]')].map(meta => meta.content),
      ios: root.dataset.iosBrowserChrome,
      authored: getComputedStyle(document.querySelector('[data-appearance-scope="authored"]')).backgroundColor,
    };
  });
  const rgb = `rgb(${[1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16)).join(", ")})`;
  assert.equal(values.before, rgb);
  assert.equal(values.after, rgb);
  assert.equal(values.background, rgb);
  assert.ok(values.images.every(image => image.split(",").every(layer => layer.trim() === "none")), "safe areas contain no accent gradients");
  assert.ok(values.status.every(style => style === (tone === "dark" ? "black-translucent" : "default")));
  assert.equal(values.ios, ios ? "true" : undefined);
  assert.equal(values.authored, "rgb(17, 27, 58)");
}

test("mobile browser hints, safe areas and event colors follow appearance across navigation", { timeout: 180000 }, async t => {
  const fixture = await buildFixture();
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe");
  const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (fs.existsSync(chromium.executablePath()) ? chromium.executablePath() : chrome);
  const engines = [{ name: "Chromium", type: chromium, options: { executablePath: chromiumPath } }];
  if (fs.existsSync(webkit.executablePath())) engines.push({ name: "WebKit", type: webkit, options: {} });
  else t.diagnostic("Playwright WebKit is not installed; iOS cases exercise platform detection in Chromium, not Safari rendering.");
  for (const engine of engines) {
    const browser = await engine.type.launch({ headless: true, ...engine.options });
    try {
      for (const scenario of [
        { name: "Android tab", ios: false, standalone: false, width: 390 },
        { name: "Android PWA", ios: false, standalone: true, width: 320 },
        { name: "iOS Safari", ios: true, standalone: false, width: 390 },
        { name: "iOS Chrome", ios: true, standalone: false, width: 320, crios: true },
        { name: "iOS PWA", ios: true, standalone: true, width: 390 },
      ]) {
        await t.test(`${engine.name}: ${scenario.name}`, async () => {
          const context = await browser.newContext({ viewport: { width: scenario.width, height: 844 }, colorScheme: "dark", reducedMotion: "reduce",
            userAgent: scenario.ios ? `Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 ${scenario.crios ? "CriOS/143.0.0.0" : "Version/26.0"} Mobile/15E148 Safari/604.1` : undefined });
          try {
            await context.addInitScript(({ standalone }) => {
              localStorage.setItem("envitefy:appearance:v1", "light");
              Object.defineProperty(navigator, "standalone", { value: standalone });
              const matchMedia = window.matchMedia.bind(window);
              window.matchMedia = query => query === "(display-mode: standalone)" ? { matches: standalone } : matchMedia(query);
            }, scenario);
            await context.route("http://mobile-chrome.test/**", route => {
              if (route.request().url().endsWith("fixture.js")) return route.fulfill({ contentType: "text/javascript", body: fixture.bundle });
              return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" media="(prefers-color-scheme: light)" content="#8998ED"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#181818"><meta name="theme-color" content="#8998ED"><meta name="color-scheme" content="light dark"><meta name="apple-mobile-web-app-status-bar-style" content="default"><style>${fixture.css}</style></head><body><script>${buildAppearanceBootstrap()}</script><script>window.beforeHydration={colors:[...document.querySelectorAll('meta[name="theme-color"]')].map(m=>m.content),status:document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content};</script><div id="root"></div><script src="/fixture.js"></script></body></html>` });
            });
            const page = await context.newPage();
            page.setDefaultTimeout(10000);
            const errors = [];
            page.on("pageerror", error => errors.push(error.message));
            await page.goto("http://mobile-chrome.test/");
            const initial = await page.evaluate(() => window.beforeHydration);
            assert.deepEqual(initial.colors, Array(3).fill(applicationChromeColors.light), "saved light corrects dark-device hints before hydration");
            assert.equal(initial.status, "default");
            await page.getByText("light:light", { exact: true }).waitFor();
            const iosTab = scenario.ios && !scenario.standalone;
            await assertChrome(page, applicationChromeColors.light, "light", iosTab);
            await page.getByLabel("Unsaved event title").fill("Keep pending edits");
            await page.getByRole("button", { name: "Dark", exact: true }).click();
            await assertChrome(page, applicationChromeColors.dark, "dark", iosTab);
            await page.getByRole("button", { name: "Light event", exact: true }).click();
            await assertChrome(page, "#f6f1e7", "light", false);
            await page.getByRole("button", { name: "Light", exact: true }).click();
            await page.getByRole("button", { name: "Dark event", exact: true }).click();
            await assertChrome(page, "#111b3a", "dark", false);
            await page.evaluate(() => {
              document.querySelector('meta[name="theme-color"]').content = "#ff0000";
              const meta = document.createElement("meta"); meta.name = "theme-color"; meta.content = "#ff0000"; document.head.append(meta);
            });
            await assertChrome(page, "#111b3a", "dark", false);
            // Ensure observing metadata settles, even when event and app tones differ.
            const writes = await page.evaluate(async () => {
              await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
              let changes = 0;
              const observer = new MutationObserver(records => changes += records.length);
              observer.observe(document.head, { attributes: true, subtree: true });
              await new Promise(resolve => setTimeout(resolve, 120));
              observer.disconnect(); return changes;
            });
            assert.equal(writes, 0, "metadata synchronization must settle");
            await page.getByRole("button", { name: "Leave event", exact: true }).click();
            await assertChrome(page, applicationChromeColors.light, "light", iosTab);
            await page.getByRole("button", { name: "System", exact: true }).click();
            await assertChrome(page, applicationChromeColors.dark, "dark", iosTab);
            await page.emulateMedia({ colorScheme: "light" });
            await assertChrome(page, applicationChromeColors.light, "light", iosTab);
            assert.equal(await page.getByLabel("Unsaved event title").inputValue(), "Keep pending edits");
            await page.screenshot({ path: path.join(output, `${engine.name}-${scenario.name.replaceAll(" ", "-")}.png`) });
            assert.deepEqual(errors, []);
          } finally { await context.close(); }
        });
      }
    } finally { await browser.close(); }
  }
});
