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
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/studio/SharedStudioCardPage.tsx";\n@source "../components/studio/StudioLiveCardActionSurface.tsx";\n@source "../components/ArtworkDownloadButton.tsx";\n@source "../components/ArtworkPreviewDialog.tsx";\n@source "../components/EventOwnerTools.tsx";\n@source "../components/EventResponseDashboard.tsx";\n@source "../components/EventMessagesPanel.tsx";\n@source "../components/OwnerRsvpEditor.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, hasTouch: true });
  page.setDefaultTimeout(10000);
  const writes = [];
  const linkWrites = [];
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
    if (url.pathname === "/api/events/qa-card/messages") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ audienceCount: 0, replyTo: "host@example.test", eventUrl: `${base}/card/home-sweet-home`, messages: [] }) });
    if (url.pathname === "/api/history/qa-card") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: "qa-card", revision: "v1", data: { rsvpEnabled: true, rsvpName: "Host", rsvpPhone: "+15555550123" } }) });
    if (url.pathname === "/api/events/qa-card/rsvp") {
      if (req.method() === "GET") {
        const scenario = new URL(page.url()).searchParams;
        const populated = scenario.has("populated");
        const responses = populated ? [
          { name: "Alex Rivera", email: "alex@example.test", phone: "+15555550123", response: "yes", message: "Bringing dessert", updatedAt: "2026-10-27T12:00:00Z" },
          { name: "Jordan Lee", email: "jordan@example.test", response: "maybe", message: "Will confirm tomorrow", updatedAt: "2026-10-27T13:00:00Z" },
          { name: "Sam Taylor", email: "sam@example.test", response: "no", message: "Out of town", updatedAt: "2026-10-27T14:00:00Z" },
        ] : [];
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, stats: { yes: populated ? 1 : 0, no: populated ? 1 : 0, maybe: populated ? 1 : 0 }, numberOfGuests: scenario.has("unknownTarget") ? 0 : 8, filled: responses.length, remaining: scenario.has("unknownTarget") ? 0 : 8 - responses.length, responses }) });
      }
      writes.push(req.postDataJSON());
      return route.fulfill({ contentType: "application/json", body: '{"ok":true}' });
    }
    if (url.pathname === "/api/events/qa-card/public-slug") {
      const payload = req.postDataJSON();
      linkWrites.push(payload);
      return payload.publicSlug === "taken-link"
        ? route.fulfill({ status: 409, contentType: "application/json", body: '{"error":"This link is already in use."}' })
        : route.fulfill({ contentType: "application/json", body: JSON.stringify({ publicPath: `/card/${payload.publicSlug}` }) });
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
    assert.equal(await page.getByRole("link", { name: "Guests", exact: true }).getAttribute("aria-current"), "page");
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
    await page.goto(`${base}/?mode=workspace&tab=rsvps&realResponses=1`);
    await page.getByRole("button", { name: "Edit RSVP", exact: true }).waitFor();
    await page.getByRole("button", { name: "Edit RSVP", exact: true }).click();
    await page.getByRole("form", { name: "Edit RSVP details", exact: true }).waitFor();
    await page.goto(`${base}/?mode=workspace&tab=dashboard&published=1`);
    await page.getByRole("status").filter({ hasText: "Published. Your invitation is ready to share." }).waitFor();
    assert.equal(await page.getByRole("region", { name: "Share invitation", exact: true }).count(), 0, "Overview keeps URLs in Invitation");
    await page.getByRole("button", { name: "Dismiss", exact: true }).click();
    await page.goto(`${base}/?mode=workspace&tab=design`);
    const sharing = page.getByRole("region", { name: "Share invitation", exact: true });
    await sharing.waitFor();
    assert.match(await page.getByRole("link", { name: "Edit invitation", exact: true }).getAttribute("href"), /live-cards.*edit=qa-card/);
    assert.equal(await page.getByRole("button", { name: "Copy link", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Edit RSVP", exact: true }).count(), 0);

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
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 1000 }]) {
      await page.setViewportSize(viewport);
      for (const mode of ["", "&mode=owner"]) {
        await page.goto(`${base}/?published=1&rsvpDisabled=1${mode}`);
        await page.locator("[data-live-card-artwork]").waitFor();
        assert.equal(await page.getByRole("button", { name: "RSVP", exact: true }).count(), 0, "disabled RSVP has no guest or preview button despite stale contacts, URL, and visibility");
        assert.equal(await page.getByRole("dialog", { name: /RSVP/ }).count(), 0);
      }
    }
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
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 1000 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/?mode=workspace&tab=design&shared=1&past=1&dark=1`);
      const edit = page.getByRole("button", { name: "Edit invitation", exact: true });
      await edit.waitFor();
      assert.equal(await edit.isDisabled(), true, "past shared designs cannot open the editor");
      assert.equal(await page.getByRole("button", { name: "Change link", exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole("textbox", { name: "Public link slug" }).count(), 0);
      assert.equal(await page.getByRole("link", { name: "Edit invitation", exact: true }).count(), 0);
      const colors = await page.getByRole("heading", { name: "Your invitation" }).evaluate(el => ({ ink: getComputedStyle(el).color, panel: getComputedStyle(el.parentElement).backgroundImage }));
      assert.ok(Number(colors.ink.match(/\d+/)[0]) > 180, "heading uses light ink");
      assert.equal(colors.panel, "none", "Invitation uses the flat editorial layout");
      await page.screenshot({ path: path.join(output, `past-dark-${viewport.width}.png`) });
      await page.goto(`${base}/?mode=workspace&tab=design&shared=1&dark=1`);
      await page.getByRole("link", { name: "Edit invitation", exact: true }).waitFor();
      await page.goto(`${base}/?mode=workspace&tab=design&past=1&dark=1`);
      assert.equal(await page.getByRole("button", { name: "Preview changes", exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isDisabled(), true);
    }
    for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      for (const theme of ["light", "dark"]) {
        await page.goto(`${base}/?mode=workspace&tab=rsvps&realResponses=1${theme === "dark" ? "&dark=1" : ""}`);
        await page.getByRole("heading", { name: "Awaiting your first RSVP", exact: true }).waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "RSVP workspace fits the viewport");
        assert.equal(await page.getByRole("region", { name: "Response summary", exact: true }).locator("article").count(), 4, "Guests contains the response totals");
        const panel = page.getByRole("region", { name: "Guest responses", exact: true });
        const colors = await panel.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, image: getComputedStyle(el).backgroundImage, authored: !!el.closest('[data-appearance-scope="authored"]') }));
        assert.equal(colors.authored, false);
        assert.equal(colors.image, "none", "editorial panels use solid surfaces");
        assert.equal(colors.background, theme === "dark" ? "rgb(37, 31, 45)" : "rgb(255, 255, 255)");
        const share = page.getByRole("button", { name: "Share", exact: true });
        assert.equal(await share.evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)", "Share remains the existing unfilled control");
        assert.equal(await page.getByRole("button", { name: "Share invitation", exact: true }).count(), 0, "no new large Share action");
        assert.equal(await page.getByRole("link", { name: "Guests", exact: true }).getAttribute("aria-current"), "page");
        await page.screenshot({ path: path.join(output, `responses-${theme}-${viewport.width}.png`), fullPage: true });
      }
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      for (const theme of ["light", "dark"]) {
        await page.goto(`${base}/?mode=workspace&tab=rsvps&realResponses=1&populated=1&eventPage=1${theme === "dark" ? "&dark=1" : ""}`);
        const search = page.getByRole("searchbox", { name: "Search guests" });
        await search.waitFor();
        const table = page.getByRole("table", { name: "Guest responses", exact: true });
        assert.equal(await table.isVisible(), viewport.width > 1000, "phones use guest cards; wide workspaces use the table");
        const panel = page.getByRole("region", { name: "Guest responses", exact: true });
        assert.equal(await panel.getByText("Alex Rivera", { exact: true }).filter({ visible: true }).count(), 1, "one visible guest presentation");
        await search.fill("dessert");
        assert.equal(await panel.getByText("Alex Rivera", { exact: true }).filter({ visible: true }).count(), 1, "search includes guest notes");
        assert.equal(await panel.getByText("Jordan Lee", { exact: true }).count(), 0);
        await search.fill("");
        const filter = page.getByRole("combobox", { name: "Filter RSVP status" });
        await filter.selectOption("no");
        assert.equal(await panel.getByText("Sam Taylor", { exact: true }).filter({ visible: true }).count(), 1, "declined filter retains the correct guest");
        assert.equal(await panel.getByText("Alex Rivera", { exact: true }).count(), 0);
        await search.fill("no match");
        await page.getByRole("heading", { name: "No guests match this view" }).waitFor();
        await page.getByRole("button", { name: "Clear filters", exact: true }).click();
        assert.equal(await search.inputValue(), "");
        assert.equal(await filter.inputValue(), "all");
        assert.equal(await panel.getByText("Jordan Lee", { exact: true }).filter({ visible: true }).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `populated-${theme}-${viewport.width}.png`), fullPage: true });
      }
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      for (const theme of ["light", "dark"]) {
        await page.goto(`${base}/?mode=workspace&tab=dashboard&realResponses=1${theme === "dark" ? "&dark=1" : ""}`);
        await page.getByRole("heading", { name: "No responses yet", exact: true }).waitFor();
        assert.equal(await page.getByRole("link", { name: "Overview", exact: true }).getAttribute("aria-current"), "page");
        assert.equal(await page.locator(".owner-workspace-glass-panel").count(), 0, "Dashboard summary and activity no longer use legacy glass panels");
        assert.equal(await page.getByRole("region", { name: "Share invitation", exact: true }).count(), 0);
        assert.equal(await page.getByRole("region", { name: "Response summary", exact: true }).count(), 0, "Overview keeps the chart without the totals row");
        assert.equal(await page.getByRole("region", { name: "RSVP breakdown", exact: true }).count(), 1);
        assert.equal(await page.getByText("When", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Where", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Response overview", { exact: true }).count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Dashboard fits mobile and desktop");
        await page.screenshot({ path: path.join(output, `dashboard-${theme}-${viewport.width}.png`), fullPage: true });
      }
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      for (const theme of ["light", "dark"]) {
        await page.goto(`${base}/?mode=workspace&tab=design&shared=1${theme === "dark" ? "&dark=1" : ""}`);
        const sharing = page.getByRole("region", { name: "Share invitation", exact: true });
        const colors = await sharing.evaluate(el => ({ image: getComputedStyle(el).backgroundImage, radius: getComputedStyle(el).borderRadius }));
        assert.equal(colors.image, "none", "Invitation sharing uses solid editorial surfaces");
        assert.equal(colors.radius, "12px");
        assert.equal(await page.getByRole("button", { name: "Share", exact: true }).evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)");
        assert.equal(await page.getByRole("textbox", { name: "Public link slug" }).count(), 0);
        assert.equal(await page.getByRole("button", { name: "Copy link", exact: true }).count(), 1);
        await page.getByRole("button", { name: "Change link", exact: true }).click();
        const slug = page.getByRole("textbox", { name: "Public link slug" });
        await slug.waitFor();
        const originalSlug = await slug.inputValue();
        await slug.fill("temporary-link");
        await page.getByRole("form", { name: "Change guest link" }).getByRole("button", { name: "Cancel", exact: true }).click();
        assert.equal(await slug.count(), 0);
        await page.getByRole("button", { name: "Change link", exact: true }).click();
        assert.equal(await slug.inputValue(), originalSlug);
        await page.getByRole("form", { name: "Change guest link" }).getByRole("button", { name: "Cancel", exact: true }).click();

        assert.equal(await page.getByRole("button", { name: "Edit RSVP", exact: true }).count(), 0);
        assert.equal(await page.getByRole("link", { name: "Edit invitation", exact: true }).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `invitation-${theme}-${viewport.width}.png`), fullPage: true });
        await page.goto(`${base}/?mode=workspace&tab=messages&realResponses=1${theme === "dark" ? "&dark=1" : ""}`);
        await page.getByRole("heading", { name: "Email guests", exact: true }).waitFor();
        await page.getByRole("textbox", { name: "Subject", exact: true }).waitFor();
        assert.equal(await page.locator(".owner-workspace-glass-panel").count(), 0);
        assert.equal(await page.getByRole("region", { name: "Share invitation", exact: true }).count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `messages-${theme}-${viewport.width}.png`), fullPage: true });
      }
    }
    assert.deepEqual(linkWrites, [], "opening and cancelling the link editor never saves");
    await page.goto(`${base}/?mode=workspace&tab=design`);
    const sections = page.getByRole("navigation", { name: "Owner workspace sections" });
    assert.deepEqual(await sections.getByRole("link").allTextContents(), ["Overview", "Guests", "Messages", "Invitation"]);
    assert.equal(await sections.getByRole("link", { name: "Invitation", exact: true }).getAttribute("aria-current"), "page");
    await page.getByRole("button", { name: "Change link", exact: true }).click();
    const linkSlug = page.getByRole("textbox", { name: "Public link slug" });
    await linkSlug.fill("taken-link");
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "This link is already in use." }).waitFor();
    assert.equal(await linkSlug.inputValue(), "taken-link", "failed saves retain the requested address");
    await linkSlug.fill("our-housewarming");
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await page.getByRole("region", { name: "Share invitation", exact: true }).getByRole("link", { name: /our-housewarming/ }).waitFor();
    assert.equal(await linkSlug.count(), 0, "successful saves collapse the editor");
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.copiedGuestLink = value; } } }));
    await page.getByRole("button", { name: "Copy link", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Link copied" }).waitFor();
    assert.equal(await page.evaluate(() => window.copiedGuestLink), `${base}/card/our-housewarming`);

    await page.getByRole("button", { name: "Change link", exact: true }).click();
    assert.equal(await linkSlug.inputValue(), "our-housewarming");
    assert.equal(await page.getByRole("button", { name: "Save link", exact: true }).isDisabled(), true);
    await page.getByRole("form", { name: "Change guest link" }).getByRole("button", { name: "Cancel", exact: true }).click();
    await page.goto(`${base}/?mode=workspace&tab=dashboard&rsvpOff=1`);
    assert.equal(await page.getByRole("link", { name: "Overview", exact: true }).getAttribute("aria-current"), "page");
    await page.getByRole("heading", { name: "Your event at a glance", exact: true }).waitFor();
    const brief = page.getByRole("region", { name: "Event overview", exact: true });
    await brief.getByText("Published", { exact: true }).waitFor();
    await page.getByRole("navigation", { name: "Hosting shortcuts", exact: true }).waitFor();
    await brief.getByRole("heading", { name: "Message to guests", exact: true }).waitFor();
    for (const dark of [false, true]) for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(dark => window.setOwnerAppearance(dark), dark);
      await page.waitForFunction(dark => [...document.querySelectorAll('a[aria-current="page"]')].some(node => node.textContent === "Overview" && getComputedStyle(node).color === (dark ? "rgb(229, 177, 193)" : "rgb(128, 0, 32)")), dark);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.getByRole("navigation", { name: "Hosting shortcuts", exact: true }).getByRole("link").count(), 3);
      if (dark) assert.equal(await page.getByRole("link", { name: "Overview", exact: true }).evaluate(node => getComputedStyle(node).color), "rgb(229, 177, 193)", "dark navigation retains readable rose ink");
      await page.screenshot({ path: path.join(output, `overview-refreshed-${dark ? "dark" : "light"}-${width}.png`), fullPage: true });
    }
    await page.goto(`${base}/?mode=workspace&tab=design&shared=1&rsvpOff=1`);
    await page.getByRole("region", { name: "Invitation details", exact: true }).getByRole("heading", { name: "Your invitation", exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, "invitation-refreshed.png"), fullPage: true });
    await page.goto(`${base}/?mode=workspace&tab=dashboard&rsvpOff=1`);
    assert.equal(await page.getByRole("button", { name: "Copy link", exact: true }).count(), 0);
    await page.goto(`${base}/?mode=workspace&tab=rsvps&rsvpOff=1&realResponses=1`);
    await page.getByRole("button", { name: "Edit RSVP", exact: true }).waitFor();
    await page.goto(`${base}/?mode=workspace&tab=dashboard&realResponses=1&populated=1&unknownTarget=1`);
    await page.getByRole("heading", { name: "3 responses", exact: true }).waitFor();
    assert.equal(await page.getByText(/% complete/).count(), 0, "unknown guest targets never imply completion");
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  } catch (error) {
    console.error({ url: page.url(), errors, unexpected, text: await page.locator("body").innerText() });
    throw error;
  } finally { await browser.close(); }
});
