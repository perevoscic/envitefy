const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("mobile owners discover and swipe card previews without losing progress; preview RSVPs stay local", { timeout: 120000 }, async () => {
  const output = path.resolve("output/owner-card-preview");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/owner-card-preview/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: {
        "@/app/sidebar-context": path.resolve("scripts/fixtures/owner-card-preview/sidebar.ts"),
        "@/components/EventResponseDashboard": path.resolve("scripts/fixtures/owner-card-preview/responses.tsx"),
        "@/components/EventDeleteModal": path.resolve("scripts/fixtures/owner-card-preview/delete.tsx"),
        "next/navigation": path.resolve("scripts/fixtures/owner-card-preview/navigation.ts"),
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
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/studio/SharedStudioCardPage.tsx";\n@source "../components/studio/StudioLiveCardActionSurface.tsx";\n@source "../components/ArtworkDownloadButton.tsx";\n@source "../components/ArtworkPreviewDialog.tsx";\n@source "../components/EventOwnerTools.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, hasTouch: true });
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
    if (url.pathname === "/card.webp") return route.fulfill({ contentType: "image/webp", body: fs.readFileSync("public/studio/housewarming.webp") });
    if (url.pathname === "/card/home-sweet-home") return route.fulfill({ contentType: "text/html", body: "<p>Event page preview</p>" });
    if (url.pathname === "/api/events/qa-card/rsvp") {
      writes.push(req.postDataJSON());
      return route.fulfill({ contentType: "application/json", body: '{"ok":true}' });
    }
    if (url.pathname.startsWith("/fonts/")) {
      const file = path.resolve("public", url.pathname.slice(1));
      const root = path.resolve("public/fonts");
      if (file.startsWith(`${root}${path.sep}`) && fs.existsSync(file)) {
        return route.fulfill({ contentType: "font/woff2", body: fs.readFileSync(file) });
      }
    }
    if (url.pathname !== "/") { unexpected.push(req.url()); return route.abort(); }
    return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><style>${css}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
  });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/?mode=workspace`);
    const teaser = page.getByRole("button", { name: "View Live Card", exact: true });
    const preview = page.locator("[data-artwork-preview]");
    const peek = page.locator('[class*="OwnerCardPreviewTeaser_peek"]');
    await teaser.waitFor();
    await peek.waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "hint does not add horizontal scrolling");
    await peek.waitFor({ state: "hidden" });
    await page.screenshot({ path: path.join(output, "mobile-owner-workspace.png") });
    await page.reload();
    await teaser.waitFor();
    // Wait past the hint delay: repeat visits must stay still.
    await page.waitForTimeout(1200);
    assert.equal(await peek.count(), 0, "hint is shown only once");
    const touch = await page.context().newCDPSession(page);
    const swipe = async (x, y, dx, dy) => {
      await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let step = 1; step <= 6; step++) {
        await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * step / 6, y: y + dy * step / 6 }] });
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    const traceTransition = async (action, name) => {
      const sampling = page.evaluate(() => new Promise((resolve) => {
        const frames = [];
        const start = performance.now();
        const sample = () => {
          const card = document.querySelector("[data-artwork-preview]");
          const workspace = document.querySelector("[data-owner-card-swipe]");
          const bounds = card?.getBoundingClientRect();
          frames.push({
            state: card?.getAttribute("data-state") || "absent",
            scrollX, scrollY, scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
            rootOverflow: getComputedStyle(document.documentElement).overflowY,
            paddingTop: workspace ? getComputedStyle(workspace).paddingTop : null,
            cardX: bounds?.x, cardY: bounds?.y, cardWidth: bounds?.width, cardHeight: bounds?.height,
          });
          if (performance.now() - start < 650) requestAnimationFrame(sample);
          else resolve(frames);
        };
        requestAnimationFrame(sample);
      }));
      await action();
      const frames = await sampling;
      fs.writeFileSync(path.join(output, `${name}-frames.json`), JSON.stringify(frames, null, 2));
      return frames;
    };
    await page.getByLabel("Guest search").fill("Keep this edit");
    await page.getByLabel("Guest search").blur();
    await page.evaluate(() => window.scrollTo({ top: 240, behavior: "instant" }));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const openingFrames = await traceTransition(() => swipe(280, 560, -160, 4), "opening");
    await preview.waitFor();
    await page.waitForTimeout(320);
    assert.notEqual(await preview.evaluate((element) => getComputedStyle(element).animationName), "none", "preview slides in on mobile");
    await page.screenshot({ path: path.join(output, "mobile-card-preview.png") });
    await page.getByRole("button", { name: "RSVP", exact: true }).click();
    await page.locator("[data-live-card-panel]").waitFor();
    await swipe(90, 390, 160, 0);
    assert.equal(await preview.isVisible(), true, "guest popup gestures do not close preview");
    await page.keyboard.press("Escape");
    await page.locator("[data-live-card-panel]").waitFor({ state: "hidden" });
    const closingFrames = await traceTransition(() => swipe(90, 390, 160, 0), "closing");
    assert.ok(closingFrames.every((frame) => frame.scrollWidth <= frame.viewportWidth), "exit animation must not widen the page while the card is sliding away");
    assert.equal(new Set([...openingFrames, ...closingFrames].map((frame) => frame.paddingTop)).size, 1, "workspace spacing must stay fixed throughout preview transitions");
    for (const frames of [openingFrames, closingFrames]) {
      const visible = frames.filter((frame) => frame.state !== "absent");
      assert.ok(visible.every((frame) => frame.rootOverflow === "hidden"), "scroll lock lasts through the entire slide");
      assert.equal(new Set(visible.map((frame) => `${frame.cardY.toFixed(2)}:${frame.cardWidth.toFixed(2)}:${frame.cardHeight.toFixed(2)}`)).size, 1, "the sliding card must not resize or jump vertically");
      assert.ok(frames.every((frame) => frame.scrollY === scrollBefore && frame.scrollX === 0), "the dashboard must not move behind the animation");
    }
    await preview.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => window.scrollY), scrollBefore, "swiping back preserves workspace scroll");
    assert.equal(await page.getByLabel("Guest search").inputValue(), "Keep this edit");
    assert.equal(await page.getByRole("tab", { name: "RSVPs", exact: true }).first().getAttribute("aria-selected"), "true");
    await swipe(270, 550, -15, -180);
    assert.equal(await preview.count(), 0, "vertical scrolling does not open preview");
    await page.evaluate(() => window.scrollTo(0, 0));
    const inputBounds = await page.getByLabel("Guest search").boundingBox();
    await swipe(inputBounds.x + inputBounds.width - 30, inputBounds.y + inputBounds.height / 2, -80, 0);
    assert.equal(await preview.count(), 0, "form interaction does not open preview");
    const teaserBounds = await teaser.boundingBox();
    await swipe(teaserBounds.x + teaserBounds.width - 35, teaserBounds.y + teaserBounds.height / 2, -130, 0);
    await preview.waitFor();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await preview.waitFor({ state: "hidden" });
    await teaser.click();
    await preview.waitFor();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await preview.waitFor({ state: "hidden" });
    assert.equal(await teaser.evaluate((element) => element === document.activeElement), true, "close restores keyboard focus");
    await teaser.focus();
    await page.keyboard.press("Enter");
    await preview.waitFor();
    await page.keyboard.press("Escape");
    await preview.waitFor({ state: "hidden" });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bottomScroll = await page.evaluate(() => window.scrollY);
    await swipe(280, 550, -150, 0);
    await preview.waitFor();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await preview.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => window.scrollY), bottomScroll, "closing at the bottom restores scroll after navigation chrome returns");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await teaser.waitFor();
    await page.waitForTimeout(1200);
    assert.equal(await peek.count(), 0, "reduced motion suppresses hint");
    await teaser.click();
    assert.equal(await preview.evaluate((element) => getComputedStyle(element).animationName), "none", "reduced motion suppresses slide");
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await preview.waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 844, height: 390 });
    await teaser.click();
    const landscape = await preview.boundingBox();
    assert.ok(landscape && landscape.x >= 0 && landscape.y >= 0 && landscape.x + landscape.width <= 844 && landscape.y + landscape.height <= 390, "landscape artwork fits the viewport");
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await page.setViewportSize({ width: 1280, height: 1000 });
    assert.equal(await teaser.isVisible(), false, "desktop retains the side-by-side layout");
    await swipe(700, 550, -180, 0);
    assert.equal(await preview.count(), 0, "desktop does not use mobile swipes");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/?mode=workspace&eventPage=1`);
    assert.equal(await teaser.count(), 0, "event pages do not offer a Live Card teaser");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${base}/?mode=workspace&tab=dashboard`);
    await teaser.waitFor();
    const tabBounds = () => page.getByRole("tablist").first().getByRole("tab").evaluateAll((tabs) => tabs.map((tab) => {
      const rect = tab.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height];
    }));
    const settledTabs = await tabBounds();
    // Cover two of the old automatic hint ticks, while the dashboard is idle.
    await page.waitForTimeout(4300);
    assert.deepEqual(await tabBounds(), settledTabs, "dashboard tabs stay still until the host chooses a tab");
    await page.setViewportSize({ width: 1280, height: 1000 });

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
