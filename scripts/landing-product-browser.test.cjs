const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/landing-product");
const fixture = path.resolve("scripts/fixtures/landing-product");
const publicRoot = path.resolve("public");
const base = "http://landing-product.test";

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  const navigation = path.join(fixture, "navigation.tsx");
  const login = path.join(fixture, "LoginForm.tsx");
  const signup = path.join(fixture, "SignupForm.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: path.join(fixture, "entry.tsx"),
      output: {
        path: output,
        filename: "fixture.js",
        chunkFilename: "[id].js",
        publicPath: "/bundles/",
      },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/navigation": navigation,
          "next/link": navigation,
          "next-auth/react": navigation,
          "next/image": path.join(fixture, "image.tsx"),
          "next/dynamic": path.join(fixture, "dynamic.tsx"),
          "@/app/sidebar-context": navigation,
          "@/lib/pwa/install-state": navigation,
          "@/components/auth/LoginForm": login,
          "@/components/auth/SignupForm": signup,
          "./LoginForm$": login,
          "./SignupForm$": signup,
          "@/components/landing/LandingLiveCardShowcase": path.join(fixture, "Showcase.tsx"),
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
  const sourcePaths = [
    "../app/landing/LandingExperience.tsx",
    "../app/landing/sections/ProductLandingHero.tsx",
    "../components/auth/AuthModal.tsx",
    "../components/branding/EnvitefyWordmark.tsx",
    "../components/navigation/ScrollAwareBottomNav.tsx",
    "../components/navigation/BottomNav.tsx",
    "../components/navigation/CreateActionSheet.tsx",
    "../components/navigation/MenuBottomSheet.tsx",
    "../components/navigation/ConciergeSheet.tsx",
    "../components/AppearanceSelector.tsx",
  ];
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n' +
        sourcePaths.map((sourcePath) => `@source "${sourcePath}";`).join("\n"),
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
    "Google",
    "Chrome",
    "Application",
    "chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

function contentType(filename) {
  return (
    {
      ".js": "text/javascript",
      ".css": "text/css",
      ".webp": "image/webp",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".ttf": "font/ttf",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    }[path.extname(filename)] || "application/octet-stream"
  );
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
    if (url.pathname.startsWith("/bundles/")) {
      const filename = path.resolve(
        output,
        decodeURIComponent(url.pathname.slice("/bundles/".length)),
      );
      if (filename.startsWith(output + path.sep) && fs.existsSync(filename)) {
        return route.fulfill({
          contentType: contentType(filename),
          body: fs.readFileSync(filename),
        });
      }
    }
    const filename = path.resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    if (
      filename.startsWith(publicRoot + path.sep) &&
      fs.existsSync(filename) &&
      fs.statSync(filename).isFile()
    ) {
      return route.fulfill({ contentType: contentType(filename), body: fs.readFileSync(filename) });
    }
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body class="font-vars"><div id="root"></div><script src="/bundles/fixture.js"></script></body></html>',
      });
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    `${label}: horizontal overflow ${JSON.stringify(dimensions)}`,
  );
}

async function assertPageReady(page, scheme, width) {
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.waitForFunction(
    (expected) => document.documentElement.dataset.theme === `general-${expected}`,
    scheme,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("#root img")].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  const styles = await page.locator("#landing-hero").evaluate((hero) => ({
    ink: getComputedStyle(hero).color,
    layout: getComputedStyle(hero.firstElementChild).display,
    padding: parseFloat(getComputedStyle(hero).paddingLeft),
    titleSize: parseFloat(getComputedStyle(hero.querySelector("h1")).fontSize),
  }));
  assert.equal(styles.layout, "grid", "The delivered hero CSS supplies its responsive grid");
  assert.ok(
    styles.padding >= 16 && styles.titleSize >= 40,
    `Hero module CSS loaded: ${JSON.stringify(styles)}`,
  );
  const channels = styles.ink.match(/[\d.]+/g).map(Number);
  assert.equal(channels[0] > 200, scheme === "dark", `Hero ink follows the ${scheme} appearance`);
  const headerLogo = page.locator("header").getByRole("img", { name: "Envitefy", exact: true });
  assert.equal(await headerLogo.count(), 1, "The approved logo retains its accessible name");
  const logos = await headerLogo.locator("img").evaluateAll((images) =>
    images.map((image) => ({
      src: image.getAttribute("src"),
      visible: getComputedStyle(image).display !== "none",
      loaded: image.naturalWidth > 0,
    })),
  );
  assert.ok(
    logos.every((logo) => logo.loaded),
    "Both approved wordmark assets actually decode",
  );
  assert.equal(
    logos.filter((logo) => logo.visible).length,
    1,
    `Exactly one approved wordmark layer is visible in ${scheme} appearance`,
  );
  assert.ok(
    logos
      .find((logo) => logo.visible)
      .src.includes(scheme === "dark" ? "wordmark-white.webp" : "wordmark.webp"),
  );
  const eventPaper = await page
    .locator("#landing-hero [data-appearance-scope=authored]")
    .evaluate((card) => ({
      background: getComputedStyle(card).backgroundColor,
      colorScheme: getComputedStyle(card).colorScheme,
    }));
  assert.equal(
    eventPaper.colorScheme,
    "light",
    "The sample invitation keeps its authored appearance",
  );
  assert.equal(eventPaper.background, "rgb(255, 252, 247)");
  assert.equal(await page.locator("[data-category]").count(), 8);
  assert.equal(
    await page.getByRole("button", { name: "Install", exact: true }).count(),
    0,
    "First-time landing content stays free of the install prompt",
  );
  for (const id of [
    "landing-hero",
    "how-it-works",
    "examples",
    "categories",
    "guest-flow",
    "showcase",
    "creation-paths",
  ]) {
    assert.equal(
      await page.locator(`[id="${id}"]`).count(),
      1,
      `The ${id} anchor exists before deferred content opens`,
    );
  }
  const createTarget = await page
    .locator("#landing-hero")
    .getByRole("button", { name: "Create your event", exact: true })
    .boundingBox();
  assert.ok(
    createTarget.height >= 44 && createTarget.width >= 44,
    `Create retains a 44px target at ${width}px`,
  );
  await assertNoOverflow(page, `${scheme} ${width}px initial`);
}

async function exerciseSample(page) {
  const hero = page.locator("#landing-hero");
  const rsvp = hero.getByRole("button", { name: "RSVP to the brunch", exact: true });
  await rsvp.click();
  assert.equal(await rsvp.getAttribute("aria-expanded"), "true");
  await hero.getByRole("button", { name: "Going", exact: true }).click();
  assert.equal(
    await hero.getByRole("button", { name: "Going", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  assert.match(
    await hero.getByRole("status").textContent(),
    /Sample reply: Going\. Nothing has been sent\./,
  );
  await hero.getByRole("button", { name: "Close sample details", exact: true }).click();
  assert.equal(await page.locator("#landing-sample-action").isVisible(), false);
  await hero.getByRole("button", { name: "Directions", exact: true }).click();
  assert.match(
    await page.locator("#landing-sample-action").textContent(),
    /sample venue is illustrative/,
  );
  await hero.getByRole("button", { name: "Close sample details", exact: true }).click();
  await hero.getByRole("button", { name: "Add to calendar", exact: true }).click();
  assert.match(
    await page.locator("#landing-sample-action").textContent(),
    /date, time and location to their calendar/,
  );
  await hero.getByRole("button", { name: "Close sample details", exact: true }).click();
}

async function exerciseAuthentication(page) {
  await page
    .locator("#landing-hero")
    .getByRole("button", { name: "Create your event", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Create an account", exact: true });
  await dialog.waitFor();
  assert.equal(await dialog.locator("form").getAttribute("data-auth-redirect"), "/create");
  await dialog.getByRole("button", { name: "Create account", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__landingProductAuth), [
    { mode: "signup", redirect: "/create" },
  ]);
  await dialog.getByRole("button", { name: "Switch to login", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Log in", exact: true });
  assert.equal(
    await dialog.locator("form").getAttribute("data-auth-redirect"),
    "/create",
    "The creation destination survives a mode switch",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.locator("header").getByRole("button", { name: "Log in", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Log in", exact: true });
  assert.equal(
    await dialog.locator("form").getAttribute("data-auth-redirect"),
    "/",
    "Ordinary login resets the previous creation destination",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
}

test("product landing delivers light and dark layouts, sample actions and explicit creation across phone and desktop", {
  timeout: 120000,
}, async () => {
  const css = await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  const results = [];
  try {
    for (const scheme of ["light", "dark"]) {
      for (const width of [1280, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme: scheme,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(7000);
        const errors = [],
          unexpected = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await serveContext(context, css, unexpected);
        try {
          await page.goto(base);
          await assertPageReady(page, scheme, width);
          if (scheme === "light" && width === 1280) {
            await page.waitForTimeout(2200);
            assert.equal(
              await page.getByText("Install Envitefy", { exact: true }).count(),
              0,
              "An eligible install prompt stays hidden after its normal reveal timer on the signed-out homepage",
            );
          }
          const device = width === 375 ? "mobile" : "desktop";
          await page.screenshot({ path: path.join(output, `${scheme}-${device}.png`) });
          await page
            .locator("#landing-hero")
            .screenshot({ path: path.join(output, `${scheme}-${device}-hero.png`) });
          await exerciseSample(page);
          await exerciseAuthentication(page);
          await page
            .locator("header")
            .getByRole("button", { name: "Open navigation", exact: true })
            .click();
          const menu = page.getByRole("dialog", { name: "Menu", exact: true });
          await menu.waitFor();
          assert.equal(
            await menu
              .getByRole("navigation", { name: "Signed-out mobile menu", exact: true })
              .count(),
            1,
          );
          assert.equal(
            await menu.getByRole("link", { name: "Birthdays", exact: true }).getAttribute("href"),
            "/birthdays",
          );
          assert.equal(
            await menu.getByRole("switch", { name: "Dark mode", exact: true }).isVisible(),
            true,
          );
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden" });
          const summary = page.locator("summary").filter({ hasText: "Do my guests need an app?" });
          await summary.click();
          assert.equal(await summary.locator("..").getAttribute("open"), "");
          await summary.click();
          assert.equal(await summary.locator("..").getAttribute("open"), null);
          if (width === 1280) {
            await page
              .getByRole("navigation", { name: "Main navigation", exact: true })
              .getByRole("link", { name: "Templates", exact: true })
              .click();
            assert.equal(await page.evaluate(() => location.hash), "#examples");
          } else {
            await page.locator("#creation-paths").scrollIntoViewIfNeeded();
            const bottom = page.getByRole("navigation", {
              name: "Signed-out mobile navigation",
              exact: true,
            });
            await bottom.waitFor({ state: "visible" });
            await bottom.getByRole("button", { name: "Create your event", exact: true }).click();
            const dialog = page.getByRole("dialog", { name: "Create an account", exact: true });
            assert.equal(
              await dialog.locator("form").getAttribute("data-auth-redirect"),
              "/create",
            );
            await page.keyboard.press("Escape");
          }
          await assertNoOverflow(page, `${scheme} ${width}px after sample actions and accordion`);
          assert.deepEqual(errors, [], "The page has no browser exceptions");
          assert.deepEqual(unexpected, [], "The landing sample sends no API or external requests");
          results.push({ scheme, width, result: "passed" });
        } finally {
          await context.close();
        }
      }
    }
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    try {
      await serveContext(context, css, []);
      const page = await context.newPage();
      await page.goto(`${base}/?authenticated=1`);
      await page
        .locator("#landing-hero")
        .getByRole("button", { name: "Create your event", exact: true })
        .click();
      assert.deepEqual(
        await page.evaluate(() => window.__landingProductNavigation),
        ["/create"],
        "An authenticated host goes directly to Create",
      );
      assert.equal(await page.getByRole("dialog").count(), 0);
    } finally {
      await context.close();
    }
    fs.writeFileSync(
      path.join(output, "verification.json"),
      `${JSON.stringify(
        {
          results,
          screenshots:
            "Fresh isolated browser contexts; auth forms/router and lower showcase mocked.",
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await browser.close();
  }
});
