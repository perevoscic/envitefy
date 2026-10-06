const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("desktop Concierge slides past the hero and preserves the question chat and mobile navigation", {
  timeout: 120000,
}, async () => {
  const output = path.resolve("output/concierge-scroll");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/concierge/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "next/navigation": path.resolve("scripts/fixtures/concierge/navigation.tsx"),
          "next/link": path.resolve("scripts/fixtures/concierge/navigation.tsx"),
          "@": path.resolve("src"),
        },
      },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
      ],
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
    });
    compiler.run((error, stats) =>
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n@source "../components/navigation/ScrollAwareBottomNav.tsx";\n@source "../components/navigation/BottomNav.tsx";\n@source "../components/navigation/ConciergeSheet.tsx";\n@source "../components/navigation/CreateActionSheet.tsx";',
    );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(7000);
  const errors = [],
    unexpected = [],
    questions = [];
  const base = "http://concierge-scroll.test";
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== base) {
      unexpected.push(url.href);
      return route.abort();
    }
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/guest-chat") {
      questions.push(route.request().postDataJSON());
      if (questions.length === 2) {
        const events = [
          { type: "delta", text: "Start in the Live Card " },
          { type: "delta", text: "builder." },
          {
            type: "done",
            ok: true,
            answer:
              "Start in the Live Card builder.\n\nWant to try it now? Create an account to get started.",
            signupSuggested: true,
          },
        ];
        return route.fulfill({
          contentType: "application/x-ndjson",
          body: `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        });
      }
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ok: true, answer: "Guests can RSVP from the shared event page." }),
      });
    }
    if (url.pathname === "/logo-colored.png")
      return route.fulfill({
        contentType: "image/png",
        body: fs.readFileSync("public/logo-colored.png"),
      });
    if (url.pathname.startsWith("/fonts/")) return route.fulfill({ status: 204 });
    if (url.pathname !== "/") {
      unexpected.push(url.href);
      return route.abort();
    }
    return route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
    });
  });
  const launcher = page.locator("div[data-visible]");
  const button = launcher.getByRole("button", {
    name: "Open Envitefy Concierge",
    includeHidden: true,
  });
  const scroll = (top) =>
    page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  const traceSlide = (top) =>
    page.evaluate(
      (y) =>
        new Promise((resolve) => {
          const frames = [],
            start = performance.now();
          const sample = () => {
            const button = document.querySelector('[aria-label="Open Envitefy Concierge"]');
            frames.push({
              x: button.getBoundingClientRect().x,
              opacity: Number(getComputedStyle(button).opacity),
              scrollWidth: document.documentElement.scrollWidth,
              viewport: innerWidth,
            });
            if (performance.now() - start < 420) requestAnimationFrame(sample);
            else resolve(frames);
          };
          sample();
          window.scrollTo({ top: y, behavior: "instant" });
        }),
      top,
    );
  try {
    await page.goto(base);
    await launcher.waitFor({ state: "attached" });
    assert.equal(
      await launcher.getAttribute("data-visible"),
      "false",
      "desktop launch is hidden on the hero",
    );
    assert.equal(
      await launcher.evaluate((node) => node.inert),
      true,
      "hidden launch is not keyboard focusable",
    );
    await scroll(899);
    await page.waitForTimeout(80);
    assert.equal(
      await launcher.getAttribute("data-visible"),
      "false",
      "one visible hero pixel keeps launch hidden",
    );
    const entering = await traceSlide(901);
    assert.equal(await launcher.getAttribute("data-visible"), "true");
    assert.ok(
      entering.some(
        (frame) => frame.x > entering.at(-1).x + 20 && frame.opacity > 0 && frame.opacity < 1,
      ),
      "launch slides from right to left",
    );
    assert.ok(
      entering.every((frame) => frame.scrollWidth <= frame.viewport),
      "sliding does not widen the page",
    );
    assert.equal(questions.length, 0, "scrolling alone makes no chat request");
    await page.screenshot({ path: path.join(output, "desktop-launcher.png") });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Envitefy Concierge" });
    await dialog.waitFor();
    await page.waitForTimeout(350);
    const bounds = await dialog.boundingBox();
    assert.ok(
      bounds.width <= 400 && bounds.x > 800 && bounds.y > 100,
      "desktop panel stays compact in the bottom-right",
    );
    assert.equal(await dialog.getAttribute("aria-modal"), "false");
    assert.notEqual(
      await page.evaluate(() => document.documentElement.style.overflow),
      "hidden",
      "desktop page remains scrollable",
    );
    await dialog.getByLabel("Question for Envitefy Concierge").fill("How do RSVPs work?");
    await dialog.getByRole("button", { name: "Send Envitefy Concierge message" }).click();
    await dialog.getByText("Guests can RSVP from the shared event page.").waitFor();
    assert.equal(questions.length, 1);
    assert.equal(questions[0].message, "How do RSVPs work?");
    assert.equal(questions[0].stream, true);
    assert.deepEqual(questions[0].history, [{ role: "user", text: "How do RSVPs work?" }]);
    await dialog.getByLabel("Question for Envitefy Concierge").fill("How do I create a Live Card?");
    await dialog.getByRole("button", { name: "Send Envitefy Concierge message" }).click();
    await dialog.getByText(/Start in the Live Card builder\.\s+Want to try it now\?/).waitFor();
    await dialog.getByRole("button", { name: "Create account" }).waitFor();
    await page.screenshot({ path: path.join(output, "desktop-concierge.png") });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await button.evaluate((node) => node === document.activeElement),
      true,
      "closing returns focus to the launcher",
    );
    const leaving = await traceSlide(0);
    assert.equal(await launcher.getAttribute("data-visible"), "false");
    assert.ok(
      leaving.some(
        (frame) => frame.x > leaving[0].x + 20 && frame.opacity > 0 && frame.opacity < 1,
      ),
      "launch slides back to the right",
    );
    assert.ok(leaving.every((frame) => frame.scrollWidth <= frame.viewport));
    await page.screenshot({ path: path.join(output, "desktop-hero-hidden.png") });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await scroll(901);
    await page.waitForFunction(
      () => document.querySelector("div[data-visible]")?.dataset.visible === "true",
    );
    assert.equal(await button.evaluate((node) => getComputedStyle(node).transitionDuration), "0s");
    await button.click();
    await dialog.waitFor();
    assert.equal(await dialog.evaluate((node) => getComputedStyle(node).transform), "none");
    await page.getByRole("button", { name: "Close Envitefy Concierge", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });

    await page.setViewportSize({ width: 390, height: 844 });
    await scroll(0);
    await page.waitForTimeout(80);
    assert.equal(
      await launcher.isVisible(),
      false,
      "phones keep only the existing mobile navigation",
    );
    const nav = page.getByRole("navigation", { name: "Signed-out mobile navigation" });
    assert.equal(await nav.count(), 0, "mobile nav is hidden on the hero");
    await scroll(845);
    await nav.waitFor();
    await nav.getByRole("button", { name: /Answer questions about Envitefy/ }).click();
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute("aria-modal"), "true");
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
    await page.screenshot({ path: path.join(output, "mobile-concierge.png") });
    await page.getByRole("button", { name: "Close Envitefy Concierge", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/?noHero`);
    await page.waitForFunction(
      () => document.querySelector("div[data-visible]")?.dataset.visible === "true",
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  } finally {
    await browser.close();
  }
});
