const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/landing-showcase");
const publicRoot = path.resolve("public");
const base = "http://landing-showcase.test";

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: path.resolve("scripts/fixtures/landing-showcase/entry.tsx"),
      output: { path: output, filename: "fixture.js", publicPath: "/bundles/" },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
          "process.env": JSON.stringify({ NODE_ENV: "development" }),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/image": path.resolve("scripts/fixtures/landing-product/image.tsx"),
          "@": path.resolve("src"),
        },
      },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: path.resolve("scripts/lib/create-guest-ts-loader.cjs"),
          },
          { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        ],
      },
      performance: { hints: false },
    });
    compiler.run((error, stats) =>
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace(
    '@import "tailwindcss";',
    '@import "tailwindcss" source(none);\n' +
      '@source "../components/landing/LandingLiveCardShowcase.tsx";\n' +
      '@source "../components/studio";\n' +
      '@source "../components/CalendarAction.tsx";',
  );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  fs.writeFileSync(path.join(output, "global.css"), css);
  return css;
}

function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google", "Chrome", "Application", "chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

function contentType(filename) {
  return {
    ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp",
    ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf",
    ".woff": "font/woff", ".woff2": "font/woff2",
  }[path.extname(filename)] || "application/octet-stream";
}

async function serveContext(context, css, unexpected) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== base || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.href}`);
      return route.abort();
    }
    if (url.pathname === "/global.css")
      return route.fulfill({ contentType: "text/css", body: css });
    const root = url.pathname.startsWith("/bundles/") ? output : publicRoot;
    const relative = url.pathname.startsWith("/bundles/")
      ? url.pathname.slice("/bundles/".length)
      : `.${url.pathname}`;
    const filename = path.resolve(root, decodeURIComponent(relative));
    if (filename.startsWith(root + path.sep) && fs.existsSync(filename) && fs.statSync(filename).isFile())
      return route.fulfill({ contentType: contentType(filename), body: fs.readFileSync(filename) });
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body><div id="root"></div><script src="/bundles/fixture.js"></script></body></html>',
      });
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

async function centerCard(page, index) {
  await page.getByRole("button", { name: `Show showcase card ${index + 1}`, exact: true }).click();
  await page.waitForFunction((index) => {
    const card = document.querySelector(`[data-showcase-card-index="${index}"]`);
    const rect = card?.getBoundingClientRect();
    return card?.dataset.showcaseActive === "true" &&
      Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 2;
  }, index);
  // The inactive card's scale animates for 700ms; sample its settled geometry.
  await page.waitForTimeout(750);
  await assertCenteredCard(page, index, "settled carousel");
}

async function assertCenteredCard(page, index, label) {
  const state = await page.evaluate((index) => {
    const card = document.querySelector(`[data-showcase-card-index="${index}"]`);
    const rect = card?.getBoundingClientRect();
    const active = document.querySelector('[data-showcase-active="true"]');
    return {
      activeIndex: active ? Number(active.dataset.showcaseCardIndex) : null,
      centerOffset: rect ? rect.left + rect.width / 2 - innerWidth / 2 : null,
      scrollLeft: card?.parentElement.scrollLeft,
    };
  }, index);
  assert.equal(state.activeIndex, index, `${label}: expected active card ${index}: ${JSON.stringify(state)}`);
  assert.ok(state.centerOffset !== null && Math.abs(state.centerOffset) < 2,
    `${label}: expected centered card ${index}: ${JSON.stringify(state)}`);
}

async function assertVisibleArtwork(page, label) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-showcase-card]")].every((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.right <= 0 || rect.left >= innerWidth) return true;
      const image = card.querySelector("img");
      return image?.complete && image.naturalWidth > 0;
    }),
  );
  const cards = await page.locator("[data-showcase-card]").evaluateAll((cards) =>
    cards.flatMap((card) => {
      const slot = card.getBoundingClientRect();
      if (slot.right <= 0 || slot.left >= innerWidth) return [];
      const image = card.querySelector("img");
      const rect = image.getBoundingClientRect();
      return [{
        index: Number(card.dataset.showcaseCardIndex),
        active: card.dataset.showcaseActive === "true",
        width: rect.width,
        height: rect.height,
        source: image.getAttribute("src"),
      }];
    }),
  );
  const active = cards.find((card) => card.active);
  assert.ok(active, `${label}: one active artwork is visible`);
  for (const card of cards) {
    assert.ok(card.source.startsWith("/images/landing/live-cards/"), `${label}: card ${card.index} uses local artwork`);
    assert.ok(Math.abs(card.width / card.height - 2 / 3) < 0.005,
      `${label}: card ${card.index} keeps the native 2:3 artwork ratio: ${JSON.stringify(card)}`);
    if (!card.active)
      assert.ok(card.height < active.height - 30,
        `${label}: inactive card ${card.index} is shorter than the active card`);
  }
  return cards;
}

test("landing showcase fills visible side cards and keeps distant cards interactive when centered", {
  timeout: 120_000,
}, async () => {
  const css = await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  const unexpected = [];
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1913, height: 1000 } });
    await serveContext(context, css, unexpected);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.locator("[data-showcase-card]").first().waitFor({ state: "attached", timeout: 10_000 })
      .catch((error) => { throw new Error(`Showcase did not mount. Browser errors: ${JSON.stringify(errors)}; requests: ${JSON.stringify(unexpected)}`, { cause: error }); });
    await centerCard(page, 6);
    const visible = await assertVisibleArtwork(page, "wide housewarming showcase");
    assert.ok(visible.some((card) => card.index === 3), "the formerly blank left edge is visible");
    assert.ok(visible.some((card) => card.index === 9), "the formerly blank right edge is visible");
    // Full-page captures resize the mobile layout viewport and disturb native scroll snapping.
    await page.screenshot({ path: path.join(output, "desktop.png"), fullPage: false });
    await assertCenteredCard(page, 6, "desktop capture");

    for (const index of [3, 9]) {
      await centerCard(page, index);
      await assertVisibleArtwork(page, `centered card ${index}`);
      const card = page.locator(`[data-showcase-card-index="${index}"]`);
      assert.ok(await card.locator("[data-live-card-trigger]").count() > 0,
        `former distant card ${index} mounts its live actions`);
      await card.locator('[data-live-card-trigger][aria-label="Overview"]').press("Enter");
      await card.locator("[data-live-card-panel]").waitFor({ state: "visible" });
      await card.getByRole("button", { name: "Close card details" }).press("Enter");
      await card.locator("[data-live-card-panel]").waitFor({ state: "detached" });
      await card.click({ position: { x: 150, y: 160 } });
      await card.getByRole("button", { name: "Open live card" }).click();
      await page.getByRole("button", { name: "Close live card" }).waitFor({ state: "visible" });
      assert.ok(await page.locator(".fixed.inset-0 [data-live-card-trigger]").count() > 0,
        `former distant card ${index} keeps fullscreen actions`);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Close live card" }).waitFor({ state: "detached" });
    }
    await context.close();

    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    });
    await serveContext(phone, css, unexpected);
    const phonePage = await phone.newPage();
    phonePage.on("pageerror", (error) => errors.push(error.message));
    await phonePage.goto(base);
    await phonePage.locator("[data-showcase-card]").first().waitFor();
    await centerCard(phonePage, 6);
    await assertVisibleArtwork(phonePage, "phone showcase");
    assert.ok(await phonePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      "phone carousel does not overflow the page");
    await phonePage.screenshot({ path: path.join(output, "phone.png"), fullPage: false });
    await assertCenteredCard(phonePage, 6, "phone capture");
    await phone.close();
    assert.deepEqual(unexpected, [], "the standalone showcase makes no unexpected requests");
    assert.deepEqual(errors, [], "the real showcase has no browser errors");
  } finally {
    await browser.close();
  }
});
