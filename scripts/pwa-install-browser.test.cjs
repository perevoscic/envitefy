const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const buildFixture = require("./lib/build-bun-fixture.cjs");

test("install offers recover stale flags, appear on landing pages and preserve installed/embed/dismissal guards", { timeout: 90000 }, async () => {
  const built = buildFixture("scripts/build-pwa-install-fixture.mjs");
  const out = built.toString().match(/Built PWA install fixture in (.+)/)?.[1].trim();
  assert.ok(out);
  const bundle = fs.readFileSync(path.join(out, "entry.js"));
  const css = fs.readFileSync(path.join(out, "fixture.css"), "utf8");
  const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
  const bridge = layout.match(/<Script id="pwa-bridge"[^>]*>\{`([\s\S]*?)`\}<\/Script>/)?.[1];
  assert.ok(bridge, "exercise the real early install-event bridge");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const errors = [];
  const open = async (route, config = {}) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(7000);
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(config => {
      if (config.stored) for (const key of ["envitefy:pwa-installed", "snapmydate:pwa-installed"]) localStorage.setItem(key, "1");
      window.__promptCalls = 0;
      window.__makeInstallPrompt = (outcome = "accepted") => Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: async () => { window.__promptCalls++; }, userChoice: Promise.resolve({ outcome, platform: "web" }),
      });
      if (config.cached) window.__snapInstallDeferredPrompt = window.__makeInstallPrompt(config.outcome);
      Object.defineProperty(navigator, "getInstalledRelatedApps", { configurable: true, value: config.slow
        ? () => new Promise(resolve => { window.__releaseRelatedApps = resolve; })
        : async () => config.installed ? [{ id: "envitefy" }] : [],
      });
      if (config.standalone) {
        const original = window.matchMedia.bind(window);
        window.matchMedia = query => {
          const result = original(query);
          if (query === "(display-mode: standalone)") Object.defineProperty(result, "matches", { value: true });
          return result;
        };
      }
    }, config);
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "pwa-install.test") return route.abort();
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle });
      if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>' });
      return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><script>${bridge}</script></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    });
    await page.goto(`https://pwa-install.test${route}`);
    await page.waitForFunction(() => window.__pwaMounted);
    return page;
  };
  try {
    for (const route of ["/", "/landing"]) {
      const page = await open(route, { cached: true, stored: true });
      const install = page.getByRole("button", { name: "Install", exact: true });
      await install.waitFor();
      assert.deepEqual(await page.evaluate(() => [localStorage.getItem("envitefy:pwa-installed"), localStorage.getItem("snapmydate:pwa-installed")]), [null, null]);
      await page.screenshot({ path: path.join(out, route === "/" ? "homepage-install.png" : "landing-install.png") });
      await install.click();
      await install.waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => window.__promptCalls), 1);
      assert.equal(await page.evaluate(() => window.__snapInstallDeferredPrompt), null);
      await page.close();
    }
    const late = await open("/event/test", { stored: true, slow: true });
    assert.equal(await late.getByRole("button", { name: "Install", exact: true }).count(), 0);
    assert.equal(await late.evaluate(() => { const event = window.__makeInstallPrompt("dismissed"); window.dispatchEvent(event); return event.defaultPrevented; }), true);
    await late.getByRole("button", { name: "Install", exact: true }).waitFor();
    await late.evaluate(() => window.__releaseRelatedApps([{ id: "stale-result" }]));
    await late.getByRole("button", { name: "Install", exact: true }).click();
    await late.getByRole("button", { name: "Install", exact: true }).waitFor({ state: "hidden" });
    assert.equal(await late.evaluate(() => window.__promptCalls), 1);
    assert.equal(await late.evaluate(() => window.__snapInstallDeferredPrompt), null);
    assert.ok(Number(await late.evaluate(() => localStorage.getItem("pwa-install-dismissed"))) > Date.now());
    await late.close();

    const dismissed = await open("/landing", { cached: true });
    await dismissed.getByRole("button", { name: "Dismiss", exact: true }).click();
    await dismissed.reload();
    await dismissed.waitForTimeout(2300);
    assert.equal(await dismissed.getByRole("button", { name: "Install", exact: true }).count(), 0, "dismissal survives reload");
    await dismissed.close();

    for (const [route, config] of [["/", { standalone: true, cached: true }], ["/", { installed: true }], ["/event/test?embed=1", { cached: true }], ["/", {}]]) {
      const page = await open(route, config);
      await page.waitForTimeout(2300);
      assert.equal(await page.getByRole("button", { name: "Install", exact: true }).count(), 0, JSON.stringify({ route, config }));
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
