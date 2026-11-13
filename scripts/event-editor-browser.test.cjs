const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const { resolveThemeCssVariables } = require("./lib/event-messages-test-loader.cjs")("src/themes/registry.ts");
compiled.init();

const output = path.resolve(process.env.EVENT_EDITOR_BROWSER_OUTPUT || ".qa/event-editor-browser");
let fixtureBuild;

async function buildFixture() {
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
        new compiled.webpack.DefinePlugin({
          "process.env": JSON.stringify({ NODE_ENV: "development" }),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
          "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
          "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
          "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
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
          { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
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
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(
      '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/birthdays/customize/page.tsx"; @source "../src/app/event/gymnastics/customize/page.tsx"; @source "../src/components/gym-meet-templates"; @source "../src/components/event-create/ImportedThemeControls.tsx"; @source "../src/components/events/HeroImageEditor.tsx"; @source "../src/components/SchoolMemoDates.tsx"; @source "../src/components/templates/TemplateEditorContext.tsx";',
      { from: path.resolve("scripts/event-editor-fixture.css") },
    )
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  return { css, script };
}

const fixture = () => fixtureBuild ??= buildFixture();

// Compile once outside the interaction budgets. Each case gets fresh browser
// storage, mock records and fault state; no scenario consumes another's time.
test.before(fixture, { timeout: 30000 });

async function createEditorHarness() {
  const { css, script } = await fixture();
  const state = { failSave: false, editorRole: "owner", failNextGalleryUpload: false, galleryUploadCount: 0, gymCoreCompleted: false, gymCoreStatusReads: 0 };
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(10000);
  const errors = [],
    calendarWrites = [],
    writes = [],
    urlWrites = [],
    records = new Map();
  const galleryPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=", "base64");
  const base = "http://localhost:43128";
  const saved = {
    id: "saved-event",
    title: "School field trip",
    revision: "v1",
    public_slug: "school-trip",
    data: {
      status: "published",
      numberOfGuests: 8,
      fields: {
        title: "School field trip",
        description: "Bring water.",
        sections: [{ title: "Schedule", body: "Meet at 9 AM." }],
      },
    },
  };
  records.set(saved.id, saved);
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.pathname === "/api/user/profile") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ preferredProvider: "google" }) });
    if (url.pathname === "/api/calendars") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ google: true }) });
    if (/^\/api\/events\/[^/]+\/calendar-items$/.test(url.pathname)) {
      if (req.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ additions: [] }) });
      const body = req.postDataJSON(); calendarWrites.push(body);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ results: body.itemIds.map(id => ({ id, status: "added" })) }) });
    }
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/templates/media") {
      assert.equal(req.method(), "POST");
      assert.match(req.headers()["content-type"], /^multipart\/form-data/);
      if (state.failNextGalleryUpload) {
        state.failNextGalleryUpload = false;
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Photo upload failed. Try again." }) });
      }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ url: `/test-gallery-${++state.galleryUploadCount}.png` }) });
    }
    if (/^\/test-gallery-\d+\.png$/.test(url.pathname))
      return route.fulfill({ contentType: "image/png", body: galleryPixel });
    if (url.pathname === "/api/discovery/gym-core/run")
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ accepted: true }) });
    if (url.pathname === "/api/discovery/gym-core/status") {
      state.gymCoreStatusReads += 1;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({
        draftReady: true,
        builderReady: state.gymCoreCompleted,
        processingStage: state.gymCoreCompleted ? "review_ready" : "enrich",
      }) });
    }
    if (url.pathname === "/api/events/public-slug")
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ available: true, slug: url.searchParams.get("slug") }) });
    if (/^\/api\/events\/[^/]+\/public-slug$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3];
      const previous = records.get(id);
      const body = req.postDataJSON();
      urlWrites.push({ path: url.pathname, body });
      assert.equal(req.headers()["if-match"], undefined);
      if (body.expectedRevision !== previous.revision)
        return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "Event changed" }) });
      previous.public_slug = body.publicSlug;
      previous.data.publicSlug = body.publicSlug;
      previous.revision = "custom-link-saved";
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...previous, revision: previous.revision, publicSlug: body.publicSlug, publicPath: `/event/${body.publicSlug}` }) });
    }
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (req.method() === "GET") {
        // A real history read can lag behind the first draft save. Keep that
        // transition observable instead of masking an editor remount locally.
        if (records.get(id)?.data.scanSchedule?.kind === "school-memo")
          await new Promise(resolve => setTimeout(resolve, 250));
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ...records.get(id), permissions: { role: state.editorRole, canManageCollaborators: state.editorRole === "owner" } }),
        });
      }
      const body = req.postDataJSON();
      writes.push({
        path: url.pathname,
        method: req.method(),
        body,
        revision: body.expectedRevision,
      });
      state.onSave?.();
      if (state.saveGate) await state.saveGate;
      assert.equal(req.headers()["if-match"], undefined, "event revisions must bypass HTTP entity preconditions");
      if (state.failSave)
        return route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Another co-host saved this event. Reload before saving.",
          }),
        });
      const nextId = id || `created-${records.size}`;
      const previous = records.get(nextId);
      const row = {
        id: nextId,
        title: body.title,
        data: body.data,
        revision: `v${writes.length + 1}`,
        public_slug: previous?.public_slug || nextId,
      };
      records.set(nextId, row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname === "/api/event-themes/generate") {
      const body = req.postDataJSON();
      assert.equal(body.mode, "wording", "view changes must not generate artwork");
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ details: body.currentDetails }),
      });
    }
    if (url.pathname === "/api/events/timezone") return route.fulfill({
      contentType: "application/json", body: JSON.stringify({
        timezone: req.postDataJSON().query.startsWith("333 S Franklin St, Tampa, FL 33602") ? "America/New_York" : null,
      }),
    });
    if (url.pathname.startsWith("/api/"))
      return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base && /\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(`${path.resolve("public")}${path.sep}`) && fs.existsSync(asset)) return route.fulfill({ path: asset });
    }
    if (url.origin === base)
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}[data-leave]{display:none;position:fixed;top:0;left:0;z-index:50}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
      });
    return route.abort();
  });
  const click = (name) => page.getByRole("button", { name, exact: true }).click();
  // This fixture-only navigation trigger must never cover product controls.
  const leave = async () => {
    await page.locator("[data-leave]").evaluate(element => { element.style.display = "block"; });
    await page.locator("[data-leave]").click();
    await page.evaluate(() => document.querySelector("[data-leave]")?.style.removeProperty("display"));
  };
  const workspace = page.locator("[data-event-page-editor]");
  const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
  const viewActions = workspace;
  const checkActionPlacement = async () => {
    const bounds = await workspace.boundingBox();
    const actions = page.getByRole("group", { name: "Save event", exact: true });
    const desktop = page.viewportSize().width >= 768;
    if (await workspace.getAttribute("data-previewing") === "true") {
      assert.equal(await actions.count(), 0, "read-only preview hides save actions");
      assert.equal(await workspace.getByRole("button", { name: /^(Back|Page settings)$/, exact: true }).count(), 0);
      const close = await workspace.getByRole("button", { name: "Close preview", exact: true }).boundingBox();
      assert.ok(close.width >= 44 && close.height >= 44 && close.y < bounds.y + 40 && close.x + close.width >= bounds.x + bounds.width - 25, "preview closes from the top-right corner");
      return;
    }
    const canvasEditor = await workspace.getAttribute("data-page-editing") === "true" && await workspace.getAttribute("data-embedded") === "false";
    assert.equal(await actions.getByRole("button", { name: "Back", exact: true }).count(), canvasEditor || desktop ? 0 : 1, "canvas navigation is separate from save actions");
    if (canvasEditor) {
      assert.equal(await actions.getByRole("button", { name: "Cancel", exact: true }).count(), 0, "Exit replaces duplicate Cancel");
      const exit = workspace.getByRole("button", { name: "Exit", exact: true });
      await exit.waitFor();
      const exitBox = await exit.boundingBox();
      const mobileCanvas = !desktop && await workspace.getAttribute("data-mobile-editing") === "false";
      assert.ok(mobileCanvas ? exitBox.x < bounds.x + 24 : exitBox.x + exitBox.width > bounds.x + bounds.width - 40, "Exit is left on the phone canvas and right in settings and desktop");
    }
    const footer = await actions.evaluate((element) => {
      const footer = element.parentElement;
      const rect = footer.getBoundingClientRect();
      const style = getComputedStyle(footer);
      return { x: rect.x, width: rect.width, bottom: rect.bottom, editing: element.closest("[data-event-page-editor]").getAttribute("data-editing") === "true", background: style.backgroundColor, topBorder: parseFloat(style.borderTopWidth), border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].reduce((sum, value) => sum + parseFloat(value), 0), backdrop: style.backdropFilter };
    });
    assert.ok(Math.abs(footer.bottom - (bounds.y + bounds.height)) < 1, "save actions overlay the bottom of the workspace");
    if (await workspace.getAttribute("data-page-editing") === "false" && await workspace.getAttribute("data-embedded") === "false") {
      if (desktop) {
        if (footer.editing) {
          assert.match(footer.background, /^rgb\(/, "the desktop editing footer has an opaque surface behind the actions");
          assert.equal(footer.topBorder, 1, "the desktop editing footer has a one-pixel top divider");
          assert.equal(footer.border, 1, "the desktop editing footer only has its top divider");
        } else {
          assert.ok(["transparent", "rgba(0, 0, 0, 0)"].includes(footer.background), "the desktop preview footer leaves the event artwork visible");
          assert.equal(footer.border, 0, "the desktop preview footer has no enclosing border");
        }
        assert.equal(footer.backdrop, "none", "the desktop footer does not blur the content behind it");
      }
      assert.equal(await actions.locator("..").count(), 1, "the shared footer owns the editing actions");
      assert.equal(await actions.locator("..").evaluate((element) => element.tagName === "FOOTER" && element.querySelector('[aria-label="Save event"]') !== null), true, "the view toggle shares the bottom action group");
      await page.mouse.move(0, 0);
      await actions.evaluate(async (element) => Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {}))));
      const buttons = await actions.getByRole("button").evaluateAll((elements) => elements.map((button) => {
        const { x, y, width, height } = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return { ownerRow: Boolean(button.closest('[data-owner-actions="true"]')), label: button.textContent.trim(), x, y, width, height, radius: Math.max(...[style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].map(parseFloat)), border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].reduce((sum, value) => sum + parseFloat(value), 0), background: style.backgroundColor, role: button.getAttribute("role"), pressed: button.getAttribute("aria-pressed"), selected: button.getAttribute("aria-selected") };
      }));
      assert.equal(buttons.filter(button => /^(Preview|Edit)$/.test(button.label)).length, 1, "one action changes the current view");
      for (const [index, button] of buttons.entries()) {
        assert.equal(button.radius, desktop ? 12 : 0, `${button.label} keeps ${desktop ? "regular desktop button" : "square mobile"} corners`);
        assert.notEqual(button.role, "tab", `${button.label} remains an action button`);
        assert.equal(button.pressed, null, `${button.label} does not claim a selected tool state`);
        assert.equal(button.selected, null, `${button.label} does not claim a selected tab state`);
        if (["Publish", "Save", "Saving…"].includes(button.label)) {
          assert.ok(!["transparent", "rgba(0, 0, 0, 0)"].includes(button.background), `${button.label} keeps its filled primary surface`);
        } else if (desktop) {
          assert.equal(button.border, 4, `${button.label} has a one-pixel border on each side`);
          assert.match(button.background, /^rgb\(/, `${button.label} has its own opaque desktop button surface`);
        } else {
          assert.equal(button.border, 0, `${button.label} uses the borderless top-toolbar treatment`);
          assert.ok(["transparent", "rgba(0, 0, 0, 0)"].includes(button.background), `${button.label} has a transparent idle surface`);
        }
        const rowStart = !desktop && buttons.some((candidate) => candidate.ownerRow) ? buttons.find((candidate) => candidate.ownerRow === button.ownerRow) : buttons[0];
        assert.ok(Math.abs(button.y - rowStart.y) < 1, `${button.label} stays on its action row`);
        assert.ok(button.height >= 44 && button.width >= 44, `${button.label} retains a 44px touch target`);
        assert.ok(button.x >= footer.x - 1 && button.x + button.width <= footer.x + footer.width + 1, `${button.label} fits inside the footer`);
        if (index && Math.abs(button.y - buttons[index - 1].y) < 1) assert.ok(button.x >= buttons[index - 1].x + buttons[index - 1].width - 1, `${button.label} follows the preceding action without overlap`);
      }
    }
    const panel = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    if (await panel.isVisible()) {
      const panelBounds = await panel.boundingBox();
      assert.ok(Math.abs(footer.x - panelBounds.x) < 1, "save actions start at the editor panel");
      assert.ok(Math.abs(footer.width - panelBounds.width) < 1, "save actions match the editor panel width");
      if (desktop && await preview.isVisible()) {
        const previewBounds = await preview.boundingBox();
        assert.ok(footer.x >= previewBounds.x + previewBounds.width - 1, "save actions do not cover the event while editing");
      }
    }
    if (await preview.isVisible()) {
      const previewBounds = await preview.boundingBox();
      assert.ok(Math.abs(previewBounds.y + previewBounds.height - (bounds.y + bounds.height)) < 1, "the event uses the full height without a footer row");
    }
  };
  const switchView = async (name) => {
    if (name === "Edit") {
      await openControls();
      await checkActionPlacement();
      return;
    }
    await workspace.getByRole("button", { name: "Preview", exact: true }).click();
    await workspace.getByRole("button", { name: "Close preview", exact: true }).waitFor();
    assert.equal(await workspace.getByRole("group", { name: "Save event", exact: true }).count(), 0, "clean preview omits editing and save controls");
  };
  const openControls = async () => {
    // Before the entrance frames finish, the mounted panel is hidden and its
    // opener is absent. Do not mistake that state for a collapsed editor.
    await page.locator('[data-event-page-editor][data-entered="true"]').waitFor();
    const opener = viewActions.getByRole("button", { name: /^(Edit|Page settings|Close preview)$/, exact: true });
    if (await opener.isVisible()) await opener.click();
    if (!(await page.getByRole("complementary", { name: "Event editing controls", exact: true }).isVisible()))
      await workspace.getByRole("button", { name: /^(Edit|Page settings)$/, exact: true }).click();
    await page.getByRole("complementary", { name: "Event editing controls", exact: true }).waitFor();
  };
  const authorAddress = async (field) => {
    const address = "333 S Franklin St, Tampa, FL 33602";
    if (await field.inputValue() === address) return;
    const lookup = page.waitForResponse(response => response.url().endsWith("/api/events/timezone") && response.request().postDataJSON().query.startsWith(address));
    await field.fill(address);
    assert.equal((await (await lookup).json()).timezone, "America/New_York");
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const checkPreviewScroll = async (context) => {
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true, includeHidden: true });
    const panelTop = await controls.evaluate((element) => element.scrollTop);
    const windowTop = await page.evaluate(() => scrollY);
    const viewToggle = await viewActions.boundingBox();
    const saveActions = page.getByRole("group", { name: "Save event", exact: true });
    const footer = await saveActions.count() ? await saveActions.boundingBox() : null;
    await preview.evaluate((element) => { element.scrollTop = 0; });
    const bounds = await preview.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, 450);
    try {
      await page.waitForFunction(() => document.querySelector('[aria-label="Event page preview panel"]').scrollTop > 0, undefined, { timeout: 3000 });
    } catch (error) {
      const geometry = await preview.evaluate((element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
        childHeight: element.firstElementChild?.getBoundingClientRect().height,
        childScrollHeight: element.firstElementChild?.scrollHeight,
      }));
      throw new Error(`${context}: wheel must scroll the event preview: ${JSON.stringify(geometry)}`, { cause: error });
    }
    await preview.evaluate((element) => { element.scrollTop = 0; });
    await preview.focus();
    await page.keyboard.press("PageDown");
    await page.waitForFunction(() => document.querySelector('[aria-label="Event page preview panel"]').scrollTop > 0);
    assert.equal(await controls.evaluate((element) => element.scrollTop), panelTop, `${context}: event scrolling leaves controls in place`);
    assert.equal(await page.evaluate(() => scrollY), windowTop, `${context}: event scrolling leaves the workspace in place`);
    assert.deepEqual(await viewActions.boundingBox(), viewToggle);
    assert.deepEqual(await saveActions.count() ? await saveActions.boundingBox() : null, footer);
  };
  const checkGuestActionRow = async (region, context, expected = ["To Calendar", "Directions", "Share"]) => {
    const geometry = await region.evaluate((element) => {
      const row = element.querySelector(":scope > div");
      const bounds = row.getBoundingClientRect();
      const buttons = [...row.querySelectorAll("button:not([data-remove-action]), a")].map((button) => {
        const rect = button.getBoundingClientRect();
        const label = [...button.querySelectorAll("span")].find((span) => getComputedStyle(span).display !== "none");
        const text = label.getBoundingClientRect();
        const icon = button.querySelector("svg").getBoundingClientRect();
        return { label: label.textContent.trim(), x: rect.x, right: rect.right, y: rect.y, height: rect.height, textLeft: text.left, textRight: text.right, iconLeft: icon.left, iconRight: icon.right, font: getComputedStyle(label).font, fits: text.left >= rect.left && text.right <= rect.right && icon.left >= rect.left && icon.right <= rect.right };
      });
      return { buttons, left: bounds.left, right: bounds.right, overflows: row.scrollWidth > row.clientWidth + 1 };
    });
    assert.deepEqual(geometry.buttons.map((button) => button.label), expected, context);
    assert.equal(geometry.overflows, false, `${context}: no horizontal overflow`);
    for (const [index, button] of geometry.buttons.entries()) {
      assert.ok(Math.abs(button.y - geometry.buttons[0].y) < 1, `${context}: all actions stay in one row`);
      assert.ok(button.height >= 44, `${context}: ${button.label} keeps its touch height`);
      assert.ok(button.fits, `${context}: ${button.label} and its icon fit inside the button: ${JSON.stringify(geometry)}`);
      assert.ok(button.x >= geometry.left - 1 && button.right <= geometry.right + 1, `${context}: each button fits inside the row`);
      if (index) assert.ok(button.x >= geometry.buttons[index - 1].right, `${context}: actions do not overlap`);
    }
  };
  return { browser, page, state, errors, calendarWrites, writes, urlWrites, records, base, saved, galleryPixel, click, leave, workspace, preview, viewActions, checkActionPlacement, switchView, openControls, authorAddress, checkPreviewScroll, checkGuestActionRow };
}

async function openGymCalendarDetails(page) {
  // Keep coverage of the specialized calendar form through its supported deep link.
  for (const view of ["design", "headline"]) {
    await page.evaluate((view) => {
      const url = new URL(location.href);
      url.searchParams.set("view", view);
      history.replaceState(null, "", url);
      dispatchEvent(new PopStateEvent("popstate"));
    }, view);
    if (view === "design") await page.getByRole("heading", { name: "Design", exact: true }).waitFor();
    else await page.getByLabel("Event Title", { exact: true }).waitFor();
  }
}

function editorCase(name, run, timeout = 30000) {
  test(name, { timeout }, async (t) => {
    const harness = await createEditorHarness();
    const { browser, page, writes, errors } = harness;
    t.after(() => browser.close());
    // A timed-out case must release pending Playwright actions immediately.
    t.signal.addEventListener("abort", () => { void browser.close(); }, { once: true });
    try {
      await run(harness);
      assert.equal(errors.length, 0, errors.join("\n"));
    } catch (failure) {
      const filename = `failure-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      await page.screenshot({ path: path.join(output, filename) }).catch(() => {});
      const recentWrites = writes.slice(-3).map(({ path, method, body }) => ({
        path, method, title: body.title, status: body.data?.status,
        memoItems: body.data?.scanSchedule?.items.map(({ id, calendarSelected }) => ({ id, calendarSelected })),
      }));
      const alerts = await page.getByRole("alert").allTextContents().catch(() => []);
      throw new Error(`${failure.message}\nURL: ${page.url()}\nAlerts: ${JSON.stringify(alerts)}\nWrites: ${writes.length} total; last three: ${JSON.stringify(recentWrites)}\nBrowser errors: ${errors.join("\n")}`, { cause: failure });
    }
  });
}

test.describe("Event Page editor saves and navigation", () => {
  editorCase("opening controls waits for the entrance frames and preserves preview return", async ({ page, base, writes, openControls, switchView }) => {
    // A busy renderer can expose the workspace before its entrance frames.
    // Reproduce that window instead of relying on the runner's frame timing.
    await page.addInitScript(() => {
      const frame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => frame(time => setTimeout(() => callback(time), 100));
    });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/event/design/customize?mode=create`);
      await page.locator('[data-event-page-editor][data-entered="false"]').waitFor();
      await openControls();
      await page.getByRole("button", { name: /^Event details/ }).click();
      const title = page.getByLabel("Event title", { exact: true });
      await title.fill(`Pending title ${width}`);
      await switchView("Preview");
      await openControls();
      assert.equal(await title.inputValue(), `Pending title ${width}`, "returning to controls retains pending fields");
      assert.equal(writes.length, 0, "opening controls and Preview never save");
    }
  });

  editorCase("draft and publication progress belongs to the selected action on desktop and phone", async ({ page, state, writes, records, base, workspace, preview, openControls, authorAddress }) => {
    for (const width of [1440, 390]) for (const route of [
        "/gymnastics/templates/airborne-atlas/customize",
      "/event/general/customize?mode=create",
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}${route}`);
      await openControls();
      if (route.includes("gymnastics")) {
        await workspace.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
        await preview.getByRole("button", { name: "Edit address text", exact: true }).click();
        if (width < 768) await page.getByRole("button", { name: "Edit address", exact: true }).click();
        await authorAddress(preview.getByRole("textbox", { name: "Address", exact: true }));
        await preview.getByRole("button", { name: "Done editing address", exact: true }).click();
        await openControls();
      } else {
        const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
        await controls.getByRole("button", { name: /^Event details/ }).click();
        await authorAddress(controls.getByRole("textbox", { name: "Address or location", exact: true }));
      }
      const actions = page.getByRole("group", { name: "Save event", exact: true });
      const runHeldSave = async (action, pending, other, fail = false) => {
        let release;
        state.saveGate = new Promise(resolve => { release = resolve; });
        const started = new Promise(resolve => { state.onSave = resolve; });
        state.failSave = fail;
        const before = writes.length;
        try {
          await actions.getByRole("button", { name: action, exact: true }).click();
          const active = actions.getByRole("button", { name: pending, exact: true });
          await active.waitFor();
          assert.equal(await active.isDisabled(), true);
          assert.equal(await active.getAttribute("aria-busy"), "true");
          const inactive = actions.getByRole("button", { name: other, exact: true });
          assert.equal(await inactive.isDisabled(), true, "the other action cannot start a competing save");
          assert.equal(await inactive.getAttribute("aria-busy"), "false", "only the selected action reports progress");
          await started;
          assert.equal(writes.length, before + 1, "one click starts one write");
          await page.screenshot({ path: path.join(output, `save-progress-${width}-${route.includes("gymnastics") ? "gymnastics" : route.includes("create") ? "custom" : "native"}-${action === "Publish" ? "publish" : "draft"}.png`) });
        } finally {
          release();
          state.saveGate = undefined;
          state.onSave = undefined;
        }
      };
      await runHeldSave("Save draft", "Saving draft…", "Publish");
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const id = writes.at(-1).path.split("/")[3] || new URL(page.url()).searchParams.get("edit");
      assert.equal(records.get(id).data.status, "draft");
      await actions.getByRole("button", { name: "Save draft", exact: true }).waitFor();
      assert.equal(await actions.getByRole("button", { name: "Publish", exact: true }).isEnabled(), true);

      await runHeldSave("Publish", "Publishing…", "Save draft", true);
      await page.getByRole("alert").filter({ hasText: "Another co-host saved" }).waitFor();
      assert.equal(records.get(id).data.status, "draft", "failed publication preserves the saved draft");
      assert.equal(await actions.getByRole("button", { name: "Publish", exact: true }).isEnabled(), true, "failed publication clears its progress state for retry");
      assert.equal(await actions.getByRole("button", { name: "Save draft", exact: true }).isEnabled(), true);

      await runHeldSave("Publish", "Publishing…", "Save draft");
      await page.locator("[data-destination]").waitFor();
      assert.equal(records.get(id).data.status, "published");
      assert.match(new URL(page.url()).pathname, new RegExp(`^/event/(?:[a-z0-9-]+-)?${id}$`), "publication opens the saved event with its public title slug");
    }
  }, 60000);

  editorCase("first publication and published updates report distinct success feedback", async ({ page, state, records, base, saved }) => {
    const id = "publication-feedback";
    records.set(id, { ...structuredClone(saved), id, public_slug: id, data: { ...structuredClone(saved.data), status: "draft", draftStatus: "draft" } });
    await page.route(`${base}/editor-frame-host`, route => route.fulfill({
      contentType: "text/html",
      body: `<script>window.editorMessages=[];window.addEventListener("message",event=>window.editorMessages.push(event.data));</script><iframe title="Embedded editor" style="width:1440px;height:900px" src="/event/general/customize?edit=${id}&embed=1"></iframe>`,
    }));
    await page.goto(`${base}/editor-frame-host`);
    const frame = page.frameLocator('iframe[title="Embedded editor"]');
    await frame.getByRole("button", { name: "Publish", exact: true }).click();
    await frame.getByText("Event published.", { exact: true }).waitFor();
    assert.equal(records.get(id).data.status, "published");
    assert.equal(await frame.getByText("Changes saved.", { exact: true }).count(), 0);
    await frame.getByRole("button", { name: /Event details/ }).click();
    await frame.getByLabel("Event title", { exact: true }).fill("Updated published event");
    let release;
    state.saveGate = new Promise(resolve => { release = resolve; });
    try {
      await frame.getByRole("button", { name: "Save", exact: true }).click();
      const saving = frame.getByRole("button", { name: "Saving…", exact: true });
      await saving.waitFor();
      assert.equal(await saving.getAttribute("aria-busy"), "true");
      assert.equal(await frame.getByRole("button", { name: "Publishing…", exact: true }).count(), 0);
    } finally {
      release();
      state.saveGate = undefined;
    }
    await frame.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(records.get(id).data.fields.title, "Updated published event");
    assert.equal(await frame.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
    assert.equal(await page.evaluate(() => window.editorMessages.filter(message => message.type === "envitefy:discovery-edit-saved").length), 1, "only first publication asks the parent to leave the editor");
  });

  editorCase("published gymnastics saves retain the mounted editor and disable only fully saved content", async ({ page, state, writes, records, base, openControls }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const id = `gym-save-in-place-${width}`;
      records.set(id, { id, title: "Tampa Bay Turners Invitational", revision: "gym-save-v1", data: {
        title: "Tampa Bay Turners Invitational", status: "published", category: "gymnastics", createdVia: "template",
        date: "2027-01-15", time: "09:00", timezone: "America/New_York", venue: "Bradenton Area Convention Center",
        numberOfGuests: 8, pageTemplateId: "airborne-atlas",
      } });
      await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=${id}&editor=menu`);
      await openControls();
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      await openGymCalendarDetails(page);
      const title = controls.getByRole("textbox", { name: "Event Title", exact: true });
      await title.waitFor();
      const save = page.getByRole("button", { name: "Save", exact: true });
      assert.equal(await save.isEnabled(), false);
      const href = page.url();
      await title.evaluate(element => { window.savedTitleInput = element; });
      await title.fill("Tampa Bay Turners updated");
      await save.click();
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      assert.equal(page.url(), href, "saving leaves the event and settings panel mounted");
      assert.equal(await title.isVisible(), true);
      assert.equal(await title.evaluate(element => element === window.savedTitleInput), true);
      assert.equal(await save.isEnabled(), false);

      await title.fill("Save this version");
      let release;
      state.saveGate = new Promise(resolve => { release = resolve; });
      try {
        await save.click();
        await page.getByRole("button", { name: "Saving…", exact: true }).waitFor();
        assert.equal(await title.evaluate(element => Boolean(element.closest("[inert]"))), true,
          "the existing save lock protects mounted fields while the request is pending");
      } finally {
        release();
        state.saveGate = undefined;
      }
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      assert.equal(records.get(id).data.title, "Save this version");
      assert.equal(await save.isEnabled(), false);
      await title.fill("Keep this later edit");
      assert.equal(await title.inputValue(), "Keep this later edit");
      assert.equal(await save.isEnabled(), true, "the next edit re-enables Save");
      await save.click();
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      assert.equal(await save.isEnabled(), false);
      assert.equal(records.get(id).data.title, "Keep this later edit");
      assert.equal(records.get(id).data.numberOfGuests, 8);
      assert.equal(writes.filter(write => write.path === `/api/history/${id}`).length, 3);
      assert.equal(page.url(), href);
      await page.screenshot({ path: path.join(output, `save-in-place-${width}.png`) });
    }
  }, 60000);

  editorCase("published template and custom saves stay in their current settings with a disabled clean action", async ({ page, records, base, openControls, authorAddress }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const kind of ["template", "custom"]) {
        const entry = kind === "template"
          ? "/birthdays/templates/candy-dreams/customize?mode=template"
          : "/event/design/customize?mode=create";
        await page.goto(`${base}${entry}`);
        await openControls();
        const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
        const openFields = async () => {
          const menu = controls.getByRole("button", { name: kind === "template" ? /^Headline/ : /^Event details/ });
          if (await menu.isVisible()) await menu.click();
        };
        await openFields();
        await authorAddress(controls.getByRole("textbox", { name: kind === "template" ? "Address" : "Address or location", exact: true }));
        const title = controls.getByRole("textbox", { name: kind === "template" ? "Child's Name" : "Event title", exact: true });
        await title.fill(`Saved ${kind} ${width}`);
        await page.getByRole("button", { name: "Save draft", exact: true }).click();
        await page.getByText("Draft saved.", { exact: true }).waitFor();
        const href = page.url();
        const id = new URL(href).searchParams.get("edit");
        assert.ok(id);
        const row = records.get(id);
        row.data.status = row.data.draftStatus = "published";
        row.data.numberOfGuests = 8;
        await page.goto(href);
        await openControls();
        await openFields();
        await title.waitFor();
        const save = page.getByRole("button", { name: "Save", exact: true });
        assert.equal(await save.isEnabled(), false);
        await title.evaluate(element => { window.savedTitleInput = element; });
        for (const version of ["First update", "Second update"]) {
          await title.fill(`${version} ${kind}`);
          await save.click();
          await page.getByText("Changes saved.", { exact: true }).waitFor();
          assert.equal(page.url(), href);
          assert.equal(await title.isVisible(), true);
          assert.equal(await title.evaluate(element => element === window.savedTitleInput), true);
          assert.equal(await save.isEnabled(), false);
          assert.equal(records.get(id).data.numberOfGuests, 8);
        }
      }
    }
  }, 60000);

  editorCase("gymnastics Exit leaves clean pages and protects pending edits on desktop and phone", async ({ page, writes, base, openControls, preview }) => {
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    const actions = page.getByRole("group", { name: "Save event", exact: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const href = `${base}/gymnastics/templates/airborne-atlas/customize`;
      await page.goto(href);
      await openControls();
      await page.getByRole("button", { name: "Exit", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/create", "clean Exit leaves the editor");
      assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
      assert.equal(await actions.getByRole("button", { name: "Cancel", exact: true }).count(), 0, "clean preview has no redundant Cancel action");

      await page.goto(href);
      await openControls();
      await openGymCalendarDetails(page);
      const title = page.getByLabel("Event Title", { exact: true });
      const pending = `Pending meet ${width}`;
      await title.fill(pending);
      await page.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
      await controls.waitFor({ state: "hidden" });
      await preview.waitFor();
      assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0, "returning to the page does not discard");
      assert.equal(new URL(page.url()).pathname, new URL(href).pathname);
      await openControls();
      assert.equal(await title.inputValue(), pending, "returning to the page retains pending title edits");
      await page.getByRole("button", { name: "Exit", exact: true }).click();
      await page.getByRole("dialog", { name: "Save your progress?", exact: true }).waitFor();
      await page.getByRole("button", { name: "Keep editing", exact: true }).click();
      assert.equal(await title.inputValue(), pending, "Keep editing retains pending edits");
      await page.getByRole("button", { name: "Exit", exact: true }).click();
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/create");
      assert.equal(writes.length, 0, "Exit and changing views never save or publish");
    }
  }, 60000);

  editorCase("Exit protects saved content across every native Event Page category", async ({ page, writes, records, base, openControls }) => {
    const categories = ["general", "appointments", "workshops", "special-events", "cheerleading", "dance-ballet", "soccer", "football-season", "sport-events", "weddings", "birthdays", "anniversaries", "baby-showers", "bridal-showers", "gender-reveal", "gymnastics"];
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    const cancel = page.getByRole("button", { name: /^(Exit|Cancel)$/, exact: true });
    for (const width of [1440, 390]) for (const category of categories) {
      await page.setViewportSize({ width, height: 900 });
      const id = `cancel-${category}-${width}`;
      const original = {
        title: "Original event", status: "published", draftStatus: "published", createdVia: "simple-template", category,
        date: "2027-04-10", time: "09:30", timezone: "America/Chicago", venue: "Original venue",
        pageTemplateId: category === "gymnastics" ? "airborne-atlas" : undefined,
        rsvpEnabled: false, rsvp: { isEnabled: false }, numberOfGuests: 7,
      };
      records.set(id, { id, title: "Original event", public_slug: id, revision: "original", data: original });
      const routeCategory = category === "bridal-showers" ? "baby-showers" : category;
      const href = `${base}/event/${routeCategory}/customize?edit=${id}${category === "gymnastics" ? "&mode=gymnastics" : `&toolsAudit=${category}`}${category === "bridal-showers" ? "&occasion=bridal-shower" : ""}`;
      const before = writes.length;
      await page.goto(href);
      await openControls();
      await controls.getByRole("button", { name: /^(RSVP|Attendance|Reminders)/ }).click();
      await controls.getByRole("switch").first().waitFor();
      await cancel.click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, `/event/${id}`, `${category}: clean Exit returns to the saved event at ${width}px`);
      assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);

      await page.goto(href);
      await openControls();
      await controls.getByRole("button", { name: /^(RSVP|Attendance|Reminders)/ }).click();
      const toggle = controls.getByRole("switch").first();
      await toggle.click();
      assert.equal(await toggle.isChecked(), true);
      await cancel.click();
      await page.getByRole("dialog", { name: "Save your progress?", exact: true }).waitFor();
      await page.getByRole("button", { name: "Keep editing", exact: true }).click();
      assert.equal(await toggle.isChecked(), true, `${category}: Keep editing retains the pending change`);
      await cancel.click();
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, `/event/${id}`);
      assert.equal(writes.length, before, `${category}: Cancel never writes content`);
      assert.deepEqual(records.get(id).data, original, `${category}: discarding preserves saved content and responses`);
    }
  }, 180000);

  editorCase("Exit remains available after a meet loading failure", async ({ page, writes, base, workspace }) => {
    await page.route("**/api/history/unavailable-meet", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "History unavailable" }) }));
    await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=unavailable-meet`);
    await workspace.waitFor();
    const actions = page.getByRole("group", { name: "Save event", exact: true });
    await actions.getByRole("button", { name: "Save draft", exact: true }).waitFor();
    assert.equal(await actions.getByRole("button", { name: "Save draft", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Exit", exact: true }).isEnabled(), true, "leaving does not depend on successfully loading editable content");
    await page.getByRole("button", { name: "Exit", exact: true }).click();
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/create", "Exit leaves even if content cannot load");
    assert.equal(writes.length, 0);
  });

  editorCase("Exit in generated and uploaded editors preserves drafts and failed saves", async ({ page, writes, records, state, base, openControls }) => {
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    const cancel = page.getByRole("button", { name: /^(Exit|Cancel)$/, exact: true });
    for (const width of [1440, 390]) for (const mode of ["create", "upload"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/event/general/customize?mode=${mode}`);
      await openControls();
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const id = new URL(page.url()).searchParams.get("edit");
      const original = structuredClone(records.get(id).data);
      const before = writes.length;
      await cancel.click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/create", "Exit leaves a saved draft without publishing it");
      assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
      assert.equal(writes.length, before, "clean Cancel does not resave the draft");

      await page.goto(`${base}/event/general/customize?mode=${mode}&edit=${id}`);
      await openControls();
      await controls.getByRole("button", { name: /^Event details/ }).click();
      const title = page.getByLabel("Event title", { exact: true });
      await title.fill(`Pending custom event ${width} ${mode}`);
      await cancel.click();
      await page.getByRole("button", { name: "Keep editing", exact: true }).click();
      assert.equal(await title.inputValue(), `Pending custom event ${width} ${mode}`);
      await cancel.click();
      state.failSave = true;
      await page.getByRole("button", { name: "Save and leave", exact: true }).click();
      await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).getByRole("alert").waitFor();
      assert.equal(await page.locator("[data-destination]").count(), 0, "failed Save and leave stays in the editor");
      assert.deepEqual(records.get(id).data, original, "failed save preserves the previous draft");
      state.failSave = false;
      const afterFailure = writes.length;
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/create");
      assert.equal(writes.length, afterFailure, "discard does not retry the failed save");
      assert.deepEqual(records.get(id).data, original);
    }
  }, 90000);

  editorCase("guest template Exit leaves clean pages and protects pending edits", async ({ page, writes, base, openControls }) => {
    const cancel = page.getByRole("button", { name: /^(Exit|Cancel)$/, exact: true });
    for (const width of [1440, 390]) for (const category of ["birthdays", "gymnastics"]) {
      await page.setViewportSize({ width, height: 900 });
      const href = category === "birthdays"
        ? `${base}/birthdays/templates/candy-dreams/customize?mode=template&signedOut=1`
        : `${base}/gymnastics/templates/airborne-atlas/customize?signedOut=1`;
      await page.goto(href);
      await openControls();
      await cancel.click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, `/${category}/templates`, "clean guest Exit returns to the template gallery");
      assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
      await page.goto(href);
      await openControls();
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      if (category === "birthdays") await controls.getByRole("button", { name: /^Headline/ }).click();
      else await openGymCalendarDetails(page);
      await page.getByLabel(category === "birthdays" ? "Child's Name" : "Event Title", { exact: true }).fill("Unsaved guest event");
      await cancel.click();
      await page.getByRole("dialog", { name: "Save your progress?", exact: true }).waitFor();
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, `/${category}/templates`);
      assert.equal(writes.length, 0, "guest exits do not save or publish");
    }
  }, 60000);

  editorCase("RSVP saves stay clean when verification of the unchanged location finishes later", async ({ page, records, writes, base, openControls }) => {
    let finishLookup, lookupGate;
    await page.route("**/api/events/timezone", async route => {
      await lookupGate;
      await route.fulfill({ json: { timezone: "America/New_York" } });
    });
    for (const width of [1440, 390]) {
      const id = `rsvp-delayed-location-${width}`;
      records.set(id, { id, title: "RSVP audit", revision: "rsvp-v1", data: {
        title: "RSVP audit", status: "published", createdVia: "template", category: "gymnastics",
        date: "2027-04-10", time: "14:00", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", timezone: "America/New_York", rsvpEnabled: false,
        responses: [{ id: "retained-response" }],
      } });
      lookupGate = new Promise(resolve => { finishLookup = resolve; });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=${id}`);
      await openControls();
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      await controls.getByRole("button", { name: /^RSVP/ }).click();
      await controls.getByRole("switch").click();
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      const writesAfterSave = writes.length;
      const response = page.waitForResponse("**/api/events/timezone");
      finishLookup();
      await response;
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false, "background verification does not make a completed RSVP save dirty");
      assert.equal(await page.getByRole("button", { name: "Undo", exact: true }).isEnabled(), false, "verification is not an undoable host edit");
      assert.equal(records.get(id).data.rsvpEnabled, true);
      assert.equal(writes.length, writesAfterSave, "verification never saves automatically");
      await controls.getByRole("switch").click();
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      assert.equal(records.get(id).data.rsvpEnabled, false, "a later explicit edit still saves");
      assert.equal(records.get(id).data.timezoneSource, "location", "explicit saves retain verification metadata");
      assert.equal(records.get(id).data.timezoneLocation, "333 s franklin st, tampa, fl 33602");
      assert.deepEqual(records.get(id).data.responses, [{ id: "retained-response" }]);
    }
  });

  editorCase("RSVP enable/save/reopen/disable across five categories on desktop and phone", async ({ page, records, base, openControls }) => {
    // RSVP remains reachable even when disabled and survives an explicit save/reopen.
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const mode of ["gymnastics", "football", "soccer", "sport-events", "dance-ballet"]) {
        const id = `rsvp-${mode}-${width}`;
        records.set(id, { id, title: "RSVP audit", revision: "rsvp-v1", data: {
          title: "RSVP audit", status: "published", createdVia: "template", category: mode,
          date: "2027-04-10", time: "14:00", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", timezone: "America/New_York", rsvpEnabled: false, rsvp: { isEnabled: false, deadline: "2026-01-01" },
        } });
        const url = `${base}/event/${mode}/customize?mode=${mode}&edit=${id}`;
        await page.goto(url);
        await openControls();
        const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
        await controls.getByRole("button", { name: /^(RSVP|Attendance)/ }).first().click();
        const toggle = controls.getByRole("switch");
        await toggle.click();
        await page.getByRole("button", { name: "Save", exact: true }).click();
        await page.getByText("Changes saved.", { exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
        assert.equal(records.get(id).data.rsvpEnabled, true, `${mode} saves enabled RSVP at ${width}`);
        assert.equal(typeof records.get(id).data.rsvp, "string", "flat saves replace stale structured settings");
        await page.goto(url);
        await openControls();
        await controls.getByRole("button", { name: /^(RSVP|Attendance)/ }).first().click();
        const restoredToggle = toggle;
        assert.equal(await restoredToggle.getAttribute("aria-checked"), "true");
        await restoredToggle.click();
        await page.getByRole("button", { name: "Save", exact: true }).click();
        await page.getByText("Changes saved.", { exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
        assert.equal(records.get(id).data.rsvpEnabled, false, `${mode} saves disabled RSVP at ${width}`);
      }
    }
  });

  editorCase("wedding nested Travel navigation retains pending hotel and airport fields", async ({ page, writes, urlWrites, base, click, leave, workspace, preview, viewActions, switchView, openControls }) => {
    // Wedding Travel contains a second menu level; Back unwinds it one step at a time.
    await page.setViewportSize({ width: 390, height: 844 });
    const beforeWeddingNavigation = { event: writes.length, url: urlWrites.length };
    await page.goto(`${base}/event/weddings/customize?mode=wedding`);
    await openControls();
    const weddingControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    await weddingControls.getByRole("button", { name: /^Travel/ }).click();
    await weddingControls.getByRole("button", { name: "Add Hotel", exact: true }).click();
    await page.getByLabel("Hotel Name", { exact: true }).fill("Pending wedding hotel");
    await click("Back to details");
    assert.equal(await weddingControls.getByRole("heading", { name: "Travel", exact: true }).isVisible(), true, "hotel Back returns to Travel");
    assert.equal(await weddingControls.getByRole("button", { name: "Add Hotel", exact: true }).isVisible(), true);
    assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0, "leaving temporary hotel fields never prompts to discard");
    await click("Back to details");
    assert.equal(await weddingControls.getByRole("button", { name: /^Travel/ }).isVisible(), true, "Travel Back returns to the main Edit menu");
    assert.equal(await workspace.getByRole("button", { name: "Preview", exact: true }).isVisible(), true);
    assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
    await switchView("Preview");
    assert.equal(await weddingControls.isVisible(), false, "wedding Preview collapses the editing panel");
    assert.equal(await preview.isVisible(), true);
    assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
    await switchView("Edit");
    await weddingControls.getByRole("button", { name: /^Travel/ }).click();
    await weddingControls.getByRole("button", { name: "Add Hotel", exact: true }).click();
    assert.equal(await page.getByLabel("Hotel Name", { exact: true }).inputValue(), "Pending wedding hotel", "temporary hotel content survives every local Back step");
    await click("Back to details");
    await weddingControls.getByRole("button", { name: "Add Airport", exact: true }).click();
    await page.getByLabel("Airport Name", { exact: true }).fill("Pending arrival airport");
    await click("Back to details");
    assert.equal(await weddingControls.getByRole("heading", { name: "Travel", exact: true }).isVisible(), true, "airport Back also returns to Travel");
    await click("Back to details");
    await switchView("Preview");
    assert.equal(await viewActions.getByRole("button", { name: "Close preview", exact: true }).isVisible(), true);
    assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0, "all wedding Back steps within the editor stay prompt-free");
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeWeddingNavigation, "wedding menu navigation never writes event content or URLs");
    await leave();
    await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).waitFor();
    await click("Discard and leave");
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/chosen-destination");
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeWeddingNavigation);
  });

  editorCase("embedded editor navigation protects pending content without a preview toggle", async ({ page, writes, urlWrites, base, click, leave, workspace, viewActions }) => {
    // Embedded editors retain subsection navigation and protect app navigation without a footer Back action.
    const beforeEmbeddedNavigation = { event: writes.length, url: urlWrites.length };
    await page.goto(`${base}/event/general/customize?embed=1`);
    await workspace.waitFor();
    const embeddedControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    assert.equal(await workspace.getAttribute("data-embedded"), "true");
    assert.equal(await embeddedControls.isVisible(), true);
    assert.equal(await workspace.getByRole("group", { name: "Editor view", exact: true }).count(), 0, "embedded editors expose no unavailable Preview/Edit toggle");
    await embeddedControls.getByRole("button", { name: /^Event details/ }).click();
    const embeddedTitle = page.getByLabel("Event title", { exact: true });
    await embeddedTitle.fill("Pending embedded event");
    await click("Back to details");
    assert.equal(await embeddedControls.getByRole("button", { name: /^Event details/ }).isVisible(), true, "embedded subsection Back returns to its main menu");
    assert.equal(await embeddedControls.isVisible(), true, "embedded Back never opens an unavailable preview view");
    assert.equal(await embeddedTitle.isVisible(), false);
    assert.equal(await embeddedTitle.inputValue(), "Pending embedded event");
    assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeEmbeddedNavigation);
    await leave();
    await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/event/general/customize", "app navigation protects unsaved embedded content before leaving");
    await click("Keep editing");
    await embeddedControls.getByRole("button", { name: /^Event details/ }).click();
    assert.equal(await embeddedTitle.inputValue(), "Pending embedded event");
    await click("Back to details");
    await leave();
    await click("Discard and leave");
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/chosen-destination");
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeEmbeddedNavigation, "discarding an embedded draft never writes event content or URLs");
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  editorCase("guest action geometry, owner permissions and published save recovery", async ({ page, state, writes, base, click, leave, workspace, preview, viewActions, checkActionPlacement, switchView, openControls, checkGuestActionRow }) => {
    for (const mode of ["guest", "editor", "missing-details"]) {
      await page.goto(`${base}/event/general/customize?mode=guest-actions${mode !== "guest" ? "&editing=1" : ""}${mode === "missing-details" ? "&missingDetails=1" : ""}`);
      const region = page.getByRole("region", { name: "Plan your visit", exact: true });
      await region.waitFor();
      for (const width of [320, 390, 480]) {
        await page.setViewportSize({ width, height: 900 });
        await checkGuestActionRow(region, `${mode} at ${width}px`);
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const width of [200, 220, 260, 390]) {
        for (const font of ["Arial, sans-serif", "Georgia, serif", "Verdana, sans-serif"]) {
          await page.locator("[data-guest-actions-fixture]").evaluate((element, { width, font }) => { element.style.width = `${width}px`; element.style.fontFamily = font; }, { width, font });
          await checkGuestActionRow(region, `${mode} in a ${width}px ${font} container`);
        }
      }
      if (mode === "guest") {
        await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
        await page.getByRole("dialog", { name: "Add to calendar", exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Google Calendar", exact: true }).count(), 1);
        await click("Close calendar options");
        assert.equal(await page.getByRole("link", { name: "Get directions", exact: true }).getAttribute("target"), "_blank");
        await page.evaluate(() => {
          Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
          Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (url) => { window.__copiedEventUrl = url; } } });
        });
        await click("Share event");
        await page.getByRole("status").filter({ hasText: "Event link copied." }).waitFor();
        assert.equal(await page.evaluate(() => window.__copiedEventUrl), `${base}/event/mobile-action-fixture`);
        await checkGuestActionRow(region, "copied state", ["To Calendar", "Directions", "Copied"]);
      } else {
        await click("Remove Get directions");
        await page.getByRole("button", { name: "+ Restore Directions", exact: true }).click();
        await checkGuestActionRow(region, `${mode} after restoring directions`);
      }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`${base}/event/general/customize?mode=guest-actions&editing=1`);
    await page.getByRole("region", { name: "Plan your visit" }).waitFor();
    await page.screenshot({ path: path.resolve("output/event-editor/mobile-guest-actions-320.png") });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/event/general/customize?mode=guest-actions`);
    const desktopActions = page.getByRole("region", { name: "Plan your visit" });
    assert.match(await desktopActions.innerText(), /Add to calendar\s+Get directions\s+Share event/);
    for (const query of ["edit=saved-event", "edit=saved-event&editor=menu&returnTo=%2Fevent%2Fschool-trip"]) {
      await page.goto(`${base}/event/general/customize?${query}`);
      await workspace.waitFor();
      await page.getByRole("heading", { name: "School field trip", exact: true }).waitFor();
      await checkActionPlacement();
      await leave();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/chosen-destination", "clean saved events follow app navigation");
      assert.equal(writes.length, 0, "leaving a saved event never writes");
    }
    await page.goto(`${base}/event/general/customize?edit=saved-event`);
    await workspace.waitFor();
    await page.getByRole("heading", { name: "School field trip", exact: true }).waitFor();
    await page.getByRole("complementary", { name: "Event editing controls", exact: true }).waitFor();
    assert.equal(await preview.isVisible(), true, "desktop Event Pages retain the page beside the expanded panel");
    assert.equal(await page.getByRole("complementary", { name: "Event editing controls", exact: true }).isVisible(), true, "saved Event Pages open with expanded editing controls");
    await workspace.getByRole("button", { name: "Preview", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
    assert.equal(await page.getByRole("button", { name: "Save draft", exact: true }).count(), 0);
    await switchView("Preview");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await viewActions.getByRole("button", { name: "Close preview", exact: true }).waitFor();
      const share = viewActions.getByRole("button", { name: "Share event", exact: true });
      const remove = viewActions.getByRole("button", { name: "Delete event", exact: true });
      assert.equal(await share.isVisible(), true);
      assert.equal(await remove.isVisible(), true);
      await page.evaluate(() => {
        navigator.share = async (data) => { window.__previewShared = data; };
        navigator.canShare = () => true;
      });
      await share.click();
      assert.equal(await page.evaluate(() => window.__previewShared.url), `${base}/event/school-trip`);
      await remove.click();
      await page.getByRole("heading", { name: "Delete Event", exact: true }).waitFor();
      await page.getByRole("dialog", { name: "Delete Event", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
      assert.equal(writes.length, 0, "preview sharing and cancelling deletion never save or publish");
      await page.screenshot({ path: path.join(output, `preview-owner-actions-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    state.editorRole = "cohost";
    await page.reload();
    await workspace.getByRole("button", { name: "Preview", exact: true }).waitFor();
    await switchView("Preview");
    assert.equal(await viewActions.getByRole("button", { name: "Share event", exact: true }).count(), 0);
    assert.equal(await viewActions.getByRole("button", { name: "Delete event", exact: true }).count(), 0);
    state.editorRole = "owner";
    await page.reload();
    await workspace.getByRole("button", { name: "Preview", exact: true }).waitFor();
    await switchView("Preview");
    await switchView("Edit");
    assert.equal(writes.length, 0);
    await page.getByRole("button", { name: /Event details/ }).click();
    const title = page.getByLabel("Event title", { exact: true });
    await title.fill("Changed field trip");
    await page.getByRole("button", { name: "Save", exact: true }).waitFor();
    await title.fill("School field trip");
    await page
      .getByRole("button", { name: "Save", exact: true })
      .evaluate(button => { if (!button.disabled) throw new Error("Reverted edits must disable Save"); });
    await title.fill("Updated field trip");
    await click("Save");
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].method, "PATCH");
    assert.equal(writes[0].path, "/api/history/saved-event");
    assert.equal(writes[0].body.data.status, "published");
    assert.equal(writes[0].revision, "v1");
    assert.equal(writes[0].body.data.numberOfGuests, 8);

    // Save and leave must persist a published update before following the chosen destination.
    await page.goto(`${base}/event/general/customize?edit=saved-event`);
    await openControls();
    await page.getByRole("button", { name: /Event details/ }).click();
    await title.fill("Saved before leaving");
    await leave();
    await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).waitFor();
    await click("Save and leave");
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/chosen-destination");
    assert.equal(writes.at(-1).body.data.status, "published");
    assert.equal(writes.at(-1).body.data.fields.title, "Saved before leaving");

    await page.goto(`${base}/event/general/customize?edit=saved-event`);
    await openControls();
    await page.getByRole("button", { name: /Event details/ }).click();
    await title.fill("Keep this unsaved title");
    state.failSave = true;
    await click("Save");
    await page.getByRole("alert").filter({ hasText: "Another co-host saved" }).waitFor();
    assert.equal(await title.inputValue(), "Keep this unsaved title");
    assert.equal(new URL(page.url()).pathname, "/event/general/customize");
    state.failSave = false;
    await leave();
    await click("Discard and leave");
  });

  editorCase("generated and uploaded pages preserve native sections, URLs and publication state", async ({ page, writes, records, base, click, workspace, preview, checkActionPlacement, switchView, openControls, checkPreviewScroll }) => {
    const title = page.getByLabel("Event title", { exact: true });
    // Exercise the actual generated/uploaded editor, native sections and artwork, at both sizes.
    for (const mode of ["create", "upload"]) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        const before = writes.length;
        await page.goto(`${base}/event/design/customize?mode=${mode}`);
        await workspace.waitFor();
        await openControls();
        await page.getByRole("complementary", { name: "Event editing controls", exact: true }).waitFor();
        assert.equal(await preview.isVisible(), true, `${mode} keeps its canvas mounted beside desktop controls and behind the phone sheet`);
        assert.equal(await preview.getAttribute("inert"), width >= 768 ? null : "", "the phone sheet prevents interaction with the canvas behind it");
        assert.equal(await page.getByRole("complementary", { name: "Event editing controls", exact: true }).isVisible(), true, `${mode} opens expanded at ${width}px`);
        await openControls();
        await page.getByRole("button", { name: /Event details/ }).click();
        await title.fill(`${mode} event ${width}`);
        await title.evaluate((element) => { window.savedCustomEventTitleNode = element; });
        if (width === 1440) await checkPreviewScroll(`${mode} desktop editor`);
        await switchView("Preview");
        assert.equal(
          await page
            .getByRole("heading", { name: `${mode} event ${width}`, exact: true })
            .isVisible(),
          true,
        );
        await checkPreviewScroll(`${mode} preview at ${width}px`);
        if (mode === "upload" && width === 1440)
          await page.screenshot({ path: path.join(output, "scroll-preview-desktop.png") });
        await switchView("Edit");
        assert.equal(await title.inputValue(), `${mode} event ${width}`);
        assert.equal(writes.length, before, "viewing and editing must not implicitly save");
        const controls = page.getByRole("complementary", { name: "Event editing controls" });
        await click("Back to details");
        assert.equal(await controls.getByRole("button", { name: /^Event details/ }).isVisible(), true, `${mode} subsection Back returns to the main Edit menu at ${width}px`);
        assert.equal(await title.isVisible(), false);
        assert.equal(await title.evaluate((element) => element === window.savedCustomEventTitleNode), true, "custom subsection Back retains its mounted title input");
        assert.equal(await title.inputValue(), `${mode} event ${width}`);
        assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0, "custom subsection Back never prompts to discard edits");
        await switchView("Preview");
        assert.equal(await controls.isVisible(), false, "custom Preview collapses the editing panel");
        assert.equal(await preview.isVisible(), true);
        assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0, "custom Preview keeps unsaved content without prompting");
        assert.equal(writes.length, before, "custom subsection and Preview transitions never save or publish");
        await switchView("Edit");
        await controls.getByRole("button", { name: /^Event details/ }).click();
        assert.equal(await title.inputValue(), `${mode} event ${width}`);
        await click("Back to details");
        await controls.getByRole("button", { name: /^Event image settings/ }).click();
        await click("Back to details");
        assert.equal(await controls.getByRole("button", { name: /^Event details/ }).isVisible(), true, "custom shared-tool Back closes its underlying details submenu");
        assert.equal(await title.isVisible(), false);
        assert.equal(await title.inputValue(), `${mode} event ${width}`);
        assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 0);
        assert.equal(writes.length, before, "custom shared-tool Back keeps content in memory");
        await page.getByRole("button", { name: /^(Hide settings|Back to page)$/ }).click();
        await preview.getByRole("button", { name: /^Add section at position \d+$/ }).first().click();
        const sectionDialog = page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') });
        await sectionDialog.getByRole("button", { name: /^Accessibility Access/ }).click();
        assert.equal(await page.getByRole("dialog").filter({ hasNot: page.locator('aside[aria-label="Event editing controls"]') }).count(), 1, "a preset opens its fields directly");
        assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "Accessibility");
        assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "", "presets do not invent event facts");
        await page.getByLabel("Section content", { exact: true }).fill("Step-free entrance beside the north lot.");
        await sectionDialog.getByRole("button", { name: "Close section panel", exact: true }).click();
        await preview.getByRole("group", { name: "Schedule section", exact: true }).click();
        await preview.getByRole("button", { name: "Edit Schedule", exact: true }).click();
        await page.getByLabel("Title", { exact: true }).fill("Itinerary");
        await sectionDialog.getByRole("button", { name: "Close section panel", exact: true }).click();
        const removedSection = mode === "upload" && width === 390;
        if (removedSection) {
          const parking = preview.getByRole("group", { name: "Parking section", exact: true });
          await parking.click();
          await parking.getByRole("button", { name: "Remove Parking section", exact: true }).click();
          assert.equal(await preview.getByRole("button", { name: "Edit Parking", exact: true }).count(), 0);
        }
        await click("Save draft");
        await page.getByText("Draft saved.", { exact: true }).first().waitFor();
        assert.equal(writes.at(-1).body.data.status, "draft");
        assert.equal(
          writes.at(-1).body.data.customEventPage.details.sections[0].title,
          "Itinerary",
        );
        assert.deepEqual(writes.at(-1).body.data.customEventPage.details.sections[2], { title: "Accessibility", body: "Step-free entrance beside the north lot." });
        if (removedSection)
          assert.ok(writes.at(-1).body.data.customEventPage.details.sectionLayout.hidden.includes("section:1"));
        const savedUrl = page.url();
        assert.ok(new URL(savedUrl).searchParams.has("edit"));
        await page.reload();
        await openControls();
        await page.getByRole("button", { name: /^(Hide settings|Back to page)$/ }).click();
        if (removedSection)
          assert.equal(await preview.getByRole("group", { name: "Parking section", exact: true }).count(), 0);
        await preview.getByRole("group", { name: "Itinerary section", exact: true }).click();
        await preview.getByRole("button", { name: "Edit Itinerary", exact: true }).click();
        assert.equal(
          await page.getByLabel("Title", { exact: true }).inputValue(),
          "Itinerary",
        );
        await sectionDialog.getByRole("button", { name: "Close section panel", exact: true }).click();
        await openControls();
        await checkActionPlacement();
        const panelBounds = await controls.boundingBox();
        await page.mouse.move(panelBounds.x + panelBounds.width / 2, panelBounds.y + panelBounds.height / 2);
        await page.mouse.wheel(0, 10000);
        await page.waitForFunction(() => {
          const panel = document.querySelector('aside[aria-label="Event editing controls"]');
          return panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
        });
        const lastMenu = await controls.getByRole("button", { name: /^Custom URL/ }).boundingBox();
        const footerTop = await page.getByRole("group", { name: "Save event", exact: true }).evaluate((element) => element.parentElement.getBoundingClientRect().top);
        assert.ok(lastMenu.y + lastMenu.height <= footerTop + 1, "the last editor menu item scrolls above the floating save actions");
        await page.screenshot({ path: path.join(output, `actions-overlay-${mode}-${width}.png`) });
        const footer = await page
          .getByRole("group", { name: "Save event", exact: true })
          .boundingBox();
        assert.ok(footer.y + footer.height <= 901, "save actions remain inside the viewport");
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        if (mode === "upload" && width === 390) {
          const savedId = new URL(savedUrl).searchParams.get("edit");
          records.get(savedId).data.status = "published";
          records.get(savedId).data.draftStatus = "published";
          records.get(savedId).data.customEventPage.details.date = "2026-10-05";
          await page.reload();
          await openControls();
          await page.getByRole("button", { name: /Event details/ }).click();
          assert.equal(await page.getByRole("button", { name: "Save draft", exact: true }).count(), 0);
          assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
          await page.getByLabel("Date", { exact: true }).fill("2026-11-02");
          await click("Back to details");
          await controls.getByRole("button", { name: /^Custom URL/ }).click();
          await page.getByRole("textbox", { name: "Custom URL", exact: true }).fill("gateway-field-trip-2nd-grade-2026");
          await click("Save link");
          await page.getByText("Link updated. Previous links still work.", { exact: true }).waitFor();
          await click("Back to details");
          await controls.getByRole("button", { name: /Event details/ }).click();
          assert.equal(await page.getByLabel("Date", { exact: true }).inputValue(), "2026-11-02", "saving the URL preserves unsaved date edits");
          await title.fill("Published upload update");
          await click("Save");
          await page.getByText("Changes saved.", { exact: true }).waitFor();
          assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
          assert.equal(writes.at(-1).path, `/api/history/${savedId}`);
          assert.equal(writes.at(-1).body.data.status, "published");
          assert.equal(writes.at(-1).body.data.customEventPage.details.title, "Published upload update");
          assert.equal(writes.at(-1).body.data.customEventPage.details.date, "2026-11-02");
          assert.equal(writes.at(-1).revision, "custom-link-saved");
          assert.equal(writes.at(-1).body.data.publicSlug, "gateway-field-trip-2nd-grade-2026");
        }
      }
    }
  }, 60000);

  editorCase("Birthday template drafts, published updates and reverted edits retain identity", async ({ page, errors, writes, records, base, click, workspace, preview, switchView, openControls, checkPreviewScroll, authorAddress }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/birthdays/templates/candy-dreams/customize?mode=template`);
    await workspace.waitFor();
    assert.equal(await preview.isVisible(), true, "native Birthday opens the template page");
    await openControls();
    await page.getByRole("button", { name: /^Headline/ }).click();
    const name = page.getByLabel("Child's Name", { exact: true });
    await name.fill("Olivia");
    const age = page.getByLabel("Age", { exact: true });
    await age.fill("0");
    assert.equal(await age.inputValue(), "0", "zero remains an editable numeric value");
    await age.fill("6");
    await page.getByLabel("Event Date", { exact: true }).fill("2026-11-03");
    await page.getByLabel("Start Time", { exact: true }).fill("14:00");
    await authorAddress(page.getByLabel("Address", { exact: true }));
    await checkPreviewScroll("birthday template desktop editor");
    await switchView("Preview");
    await checkPreviewScroll("birthday template desktop preview");
    await switchView("Edit");
    await page.setViewportSize({ width: 390, height: 900 });
    await switchView("Preview");
    await checkPreviewScroll("birthday template phone preview");
    await switchView("Edit");
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await name.inputValue(), "Olivia");
    const birthdayControls = page.getByRole("complementary", { name: "Event editing controls" });
    await page.getByRole("button", { name: "Hide settings", exact: true }).click();
    await preview.getByRole("button", { name: /^Add section at position \d+$/ }).first().click();
    const sectionDialog = page.getByRole("dialog", { name: "Add section", exact: true });
    await sectionDialog.getByRole("button", { name: /^Custom Add your own/ }).click();
    await page.getByLabel("Title", { exact: true }).fill("Dress code");
    await page.getByLabel("Section content", { exact: true }).fill("Wear comfortable shoes.");
    await page.getByRole("button", { name: "Close section panel", exact: true }).click();
    await openControls();
    await click("Back to details");
    await birthdayControls.getByRole("button", { name: /^Event image settings/ }).click();
    await page.getByRole("button", { name: "Choose Crossing lines hero layout", exact: true }).click();
    await click("Back to details");
    await click("Save draft");
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    const draft = writes.at(-1).body;
    assert.equal(draft.data.templateEditor.snapshot.data.childName, "Olivia");
    assert.equal(draft.data.templateEditor.templateId, "candy-dreams");
    assert.equal(draft.data.eventPageComposition.layout, undefined);
    assert.equal(draft.data.eventPageComposition.hero.imageShape, "landscape");
    assert.equal(draft.data.eventPageComposition.hero.imageStyle, "crossing-lines");
    assert.equal(draft.data.eventPageComposition.sections[0].body, "Wear comfortable shoes.");
    const templateId = new URL(page.url()).searchParams.get("edit");
    const templateRow = records.get(templateId);
    templateRow.data.status = "published";
    templateRow.data.draftStatus = "published";
    templateRow.data.numberOfGuests = 7;
    const editUrl = `${base}/birthdays/templates/candy-dreams/customize?mode=template&edit=${templateId}`;
    await page.goto(editUrl);
    await openControls();
    if (await birthdayControls.getByRole("button", { name: /^Headline/ }).isVisible()) await birthdayControls.getByRole("button", { name: /^Headline/ }).click();
    await name.waitFor();
    assert.equal(await name.inputValue(), "Olivia");
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
    await name.fill("Updated Olivia");
    await click("Save");
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
    assert.equal(writes.at(-1).path, `/api/history/${templateId}`);
    assert.equal(writes.at(-1).body.data.status, "published");
    assert.equal(writes.at(-1).body.data.numberOfGuests, 7);
    assert.equal(writes.at(-1).body.data.templateEditor.snapshot.data.childName, "Updated Olivia");
    assert.deepEqual(writes.at(-1).body.data.eventPageComposition, draft.data.eventPageComposition);
    // Earlier published pages did not store status flags.
    delete records.get(templateId).data.status;
    delete records.get(templateId).data.draftStatus;
    await page.goto(editUrl);
    await openControls();
    if (await birthdayControls.getByRole("button", { name: /^Headline/ }).isVisible()) await birthdayControls.getByRole("button", { name: /^Headline/ }).click();
    await name.waitFor();
    assert.equal(await name.inputValue(), "Updated Olivia");
    await name.fill("Reverted edit");
    await page.getByRole("button", { name: "Save", exact: true }).waitFor();
    await name.fill("Updated Olivia");
    assert.equal(await page.getByRole("button", { name: "Save", exact: true }).isEnabled(), false);
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.screenshot({ path: path.join(output, "birthday-editor-desktop.png") });
  });

  editorCase("gymnastics six template accent combinations preserve backgrounds through desktop and phone saves", async ({ page, writes, records, base, click, workspace, openControls }) => {
    const load = require("./lib/event-messages-test-loader.cjs");
    const { createImportedEventTheme, templateAccentColorCombinations, importedEventAccentPalette } = load("src/lib/imported-event-theme.ts");
    const { getGymMeetTemplateMeta } = load("src/components/gym-meet-templates/registry.ts");
    const imageRequests = [];
    page.on("request", request => {
      if (request.method() === "POST" && request.url().endsWith("/theme-artwork")) imageRequests.push(request.url());
    });
    const root = workspace.locator('[data-gym-design]').first();
    const backgrounds = () => root.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        paper: style.getPropertyValue('--gym-paper'), ink: style.getPropertyValue('--gym-ink'), accent: style.getPropertyValue('--gym-accent'), font: style.getPropertyValue('--gym-font'),
        surfaces: [...element.querySelectorAll('[class*="_page"], [class*="_shell"], [class*="_scene"], [class*="_chapter"], [class*="_detailCard"], [class*="_artwork"]')].map(el => {
          const css = getComputedStyle(el);
          return [el.className, css.backgroundColor, css.backgroundImage];
        }),
      };
    });
    for (const width of [1440, 390]) for (const templateId of ["airborne-atlas", "neon-runway"]) {
      const template = getGymMeetTemplateMeta(templateId);
      const id = `template-accents-${templateId}-${width}`;
      const importedTheme = { ...createImportedEventTheme({ title: "Coastal Invitational", sport: "gymnastics", city: "Tampa, FL", seed: id, branding: { version: 1, origin: "pdf", tone: "dark", colors: ["#111b3a", "#ff78b7", "#b787ff"] } }), artworkUrl: "/media/event-media/retained.webp" };
      const palette = importedEventAccentPalette(template, importedTheme);
      const expected = templateAccentColorCombinations(palette);
      records.set(id, { id, title: "Coastal Invitational", revision: "colors-v1", data: {
        title: "Coastal Invitational", status: "draft", createdVia: "simple-template", category: "Gymnastics", details: "Doors open at 8 AM.",
        templateId: "gymnastics", pageTemplateId: templateId, date: "2026-11-06", time: "09:00", timezone: "America/New_York",
        venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", rsvpEnabled: true, importedTheme,
      } });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=${id}`);
      await openControls();
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      await controls.getByRole("button", { name: "Design", exact: true }).click();
      const group = controls.getByRole("group", { name: "Theme color combinations", exact: true });
      const choices = group.getByRole("button");
      assert.equal(await choices.count(), 6);
      assert.equal(await choices.first().getAttribute('aria-pressed'), 'true');
      const before = await backgrounds();
      assert.equal(before.paper.trim(), importedTheme.colors.page, "generated pages retain their saved background");
      const count = writes.length;
      for (let index = 0; index < 6; index++) {
        await choices.nth(index).click();
        assert.equal(await choices.nth(index).getAttribute("aria-pressed"), "true");
        assert.equal(await group.locator('button[aria-pressed="true"]').count(), 1);
        assert.deepEqual(await backgrounds(), before, `${templateId}/${width}/${index}: every authored surface and font stays intact`);
        assert.equal(await workspace.locator('img.template-hero-image[src="/media/event-media/retained.webp"]').count(), 1);
        if (index) {
          await page.waitForFunction(({ color }) => {
            const expected = document.createElement('span'); expected.style.color = color;
            return getComputedStyle(document.querySelector('[data-gym-design] h1')).color === expected.style.color;
          }, { color: expected[index].heading });
          const title = await root.locator('h1').evaluate(el => getComputedStyle(el).color);
          assert.notEqual(title, await page.evaluate(color => { const el = document.createElement('span'); el.style.color = color; return el.style.color; }, palette.foreground), 'the main event title changes color');
          const css = await root.locator('[class*="_secondaryButton"]').first().evaluate(el => getComputedStyle(el).color);
          const expectedCss = await page.evaluate(color => { const el = document.createElement('span'); el.style.color = color; return el.style.color; }, expected[index].link);
          assert.equal(css, expectedCss, 'control colors change without recoloring their canvas');
        }
      }
      for (const name of ["Redesign", "Use template style", "Use generated image", "Replace event image", "Change hero image"]) {
        assert.equal(await controls.getByRole("button", { name, exact: true }).count(), 0);
      }
      assert.equal(await controls.getByLabel("Image fit", { exact: true }).count(), 0);
      assert.equal(await controls.getByLabel("Vertical position", { exact: true }).count(), 0);
      assert.equal(writes.length, count, "theme choices remain unsaved until an explicit save");
      await group.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `gymnastics-template-accents-${templateId}-${width}.png`) });
      await click("Save draft");
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const saved = writes.at(-1).body.data.templateEditor.snapshot.data.importedTheme;
      assert.equal(saved.id, importedTheme.id);
      assert.equal(saved.artworkUrl, importedTheme.artworkUrl);
      assert.deepEqual(saved.colors, importedTheme.colors, 'accent choices never rewrite source surfaces');
      assert.deepEqual(saved.templateColorCombination, { templateId, index: 5 });
      await page.reload();
      await openControls();
      if (!(await group.isVisible())) await controls.getByRole("button", { name: "Design", exact: true }).click();
      assert.equal(await choices.count(), 6);
      assert.equal(await group.getByRole("button", { name: "Tonal", exact: true }).getAttribute("aria-pressed"), "true");
      assert.deepEqual(await backgrounds(), before, 'saved guest styling retains the effective saved background');
      assert.equal(writes.length, count + 1, "reopening never saves automatically");
      const oldSwatches = await group.locator('[style]').evaluateAll(els => els.map(el => el.style.backgroundColor));
      const nextId = templateId === 'airborne-atlas' ? 'neon-runway' : 'airborne-atlas';
      await controls.getByRole('searchbox', { name: 'Search meet designs', exact: true }).fill(nextId === 'neon-runway' ? 'neon' : 'airborne');
      await controls.locator(`[data-template-masonry-card="${nextId}"] button`).click();
      assert.notDeepEqual(await group.locator('[style]').evaluateAll(els => els.map(el => el.style.backgroundColor)), oldSwatches, 'swapping templates offers its own six palettes');
      assert.equal(await group.getByRole('button', { name: 'Original', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal((await backgrounds()).paper.trim(), getGymMeetTemplateMeta(nextId).background);
      await group.getByRole('button', { name: 'Deep', exact: true }).click();
      await group.getByRole('button', { name: 'Original', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('[data-gym-design]')?.hasAttribute('data-gym-color-combination'));
      assert.equal(await root.getAttribute('data-gym-color-combination'), null, 'Original restores native controls');
    }
    assert.deepEqual(imageRequests, [], "changing accents never requests another image");
  }, 45000);

  editorCase("gymnastics wording, fonts and canvas image saves survive desktop and phone reloads", async ({ page, state, writes, records, base, galleryPixel, click, workspace, preview, viewActions, openControls }) => {
    // Gymnastics has one authoring surface: wording stays editable beside its settings.
    records.set("gym-event", {
      id: "gym-event", title: "Gasparilla Classic", revision: "gym-v1",
      data: {
        title: "Gasparilla Classic", status: "draft", createdVia: "simple-template",
        category: "Gymnastics", templateId: "gymnastics", pageTemplateId: "airborne-atlas",
        date: "2026-11-06", time: "09:00", timezone: "America/New_York",
        venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602",
        details: "Doors open at 8 AM.", rsvpEnabled: false,
      },
    });
    const gymUrl = `${base}/event/gymnastics/customize?mode=gymnastics&edit=gym-event`;
    const gymControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    const wording = {
      "Top-left label": "Our championship",
      "Top-right label": "A weekend to remember",
      "Welcome message": "Ready to soar",
      "Encouragement": "Together, we shine.",
      "Bottom-left label": "Our gymnasts",
      "Bottom-right label": "See you in Tampa",
    };
    const editWording = async (label, value) => {
      const parent = preview.getByRole("button", { name: `Edit ${label.toLowerCase()} text`, exact: true }).locator("xpath=ancestor::*[@data-inline-text-editor]");
      if (page.viewportSize().width < 768) await parent.getByRole("button", { name: `Edit ${label.toLowerCase()} text`, exact: true }).click();
      else { await page.mouse.move(1, 1); await parent.focus(); }
      await page.getByRole("button", { name: `Edit ${label.toLowerCase()}`, exact: true }).click();
      await preview.getByLabel(label, { exact: true }).fill(value);
      await preview.getByRole("button", { name: `Done editing ${label.toLowerCase()}`, exact: true }).click();
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 760 });
      await page.goto(gymUrl);
      await openControls();
      assert.equal(await gymControls.getByRole("group", { name: "Page tools", exact: true }).count(), 0, "meet settings use one menu list");
      assert.equal(await gymControls.getByRole("button", { name: /^(Page sections|Layout|Image position)$/ }).count(), 0, "canvas and image tools have no duplicate menu entries");
      await gymControls.getByRole("button", { name: /^Custom URL/ }).waitFor();
      assert.equal(await gymControls.getByRole("button", { name: "Event basics", exact: true }).count(), 0);
      await gymControls.getByRole("button", { name: /^Event image settings/ }).waitFor();
      for (const name of ["Design", "RSVP", "Passcode"]) await gymControls.getByRole("button", { name, exact: true }).waitFor();
      assert.equal(await gymControls.getByRole("button", { name: "Font style", exact: true }).count(), 0);
      assert.equal(await gymControls.getByText("Edit wording with the pencils on your page.", { exact: true }).count(), 0);
      await page.screenshot({ path: path.join(output, `gymnastics-tools-${width}.png`) });
      await gymControls.getByRole("button", { name: /^Custom URL/ }).click();
      await page.getByRole("textbox", { name: "Custom URL", exact: true }).waitFor();
      await page.getByRole("button", { name: "Back to details", exact: true }).click();
      await openGymCalendarDetails(page);
      await page.getByLabel("Event Title", { exact: true }).waitFor();
      const beforeGym = writes.length;
      if (width === 390) await page.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
      for (const [label, value] of Object.entries(wording)) await editWording(label, value);
      await editWording("Event title", `Gasparilla Classic ${width}`);
      await editWording("Display date", "March 6–8, 2027");
      await editWording("Venue", "Tampa Convention Center — East Hall");
      await editWording("Address", "");
      await editWording("Address", "333 S Franklin St, Tampa, FL 33602");
      if (width === 390) await viewActions.getByRole("button", { name: "Page settings", exact: true }).click();
      assert.equal(await page.getByLabel("Event Title", { exact: true }).inputValue(), `Gasparilla Classic ${width}`, "inline wording and settings share canonical event data");
      assert.equal(await page.getByLabel("Display Date", { exact: true }).inputValue(), "March 6–8, 2027");
      assert.equal(await page.getByLabel("Venue", { exact: true }).inputValue(), "Tampa Convention Center — East Hall");
      assert.equal(await page.getByLabel("Date", { exact: true }).inputValue(), "2026-11-06", "inline display wording keeps the explicit calendar date");

      // Wheel from inside the form must reach the final input above the save overlay.
      await gymControls.evaluate((element) => { element.scrollTop = 0; });
      const controlsBox = await gymControls.boundingBox();
      await page.mouse.move(controlsBox.x + controlsBox.width / 2, controlsBox.y + controlsBox.height / 2);
      await page.mouse.wheel(0, 10000);
      await page.waitForFunction(() => {
        const panel = document.querySelector('aside[aria-label="Event editing controls"]');
        return panel.scrollTop > 0 && panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
      });
      const addressInput = page.getByLabel("Address", { exact: true });
      const addressBox = await addressInput.boundingBox();
      const saveTop = await page.getByRole("group", { name: "Save event", exact: true }).evaluate((element) => element.parentElement.getBoundingClientRect().top);
      assert.ok(addressBox.y + addressBox.height <= saveTop + 1, `address clears save controls at ${width}px`);
      await addressInput.click();
      await addressInput.fill(`333 S Franklin St, Tampa, FL 33602, Hall ${width}`);
      await page.screenshot({ path: path.join(output, `gymnastics-address-${width}.png`) });
      await click("Back to details");
      await gymControls.getByRole("button", { name: /^Design/ }).click();
      assert.equal(await gymControls.getByRole("combobox", { name: "Image fit", exact: true }).count(), 0);
      assert.equal(await gymControls.getByRole("slider", { name: "Vertical position", exact: true }).count(), 0);
      const themeChoices = gymControls.getByRole("group", { name: "Theme color combinations", exact: true }).getByRole("button");
      assert.equal(await themeChoices.count(), 6);
      await themeChoices.nth(1).click();
      const titleFont = page.getByLabel("Title font", { exact: true });
      assert.equal(await titleFont.locator("option").count(), 9);
      await titleFont.selectOption("anton");
      await titleFont.selectOption("");
      assert.doesNotMatch(await workspace.locator('[aria-label="Event page preview panel"] h1').evaluate((element) => element.style.fontFamily), /Gym Anton/);
      await titleFont.selectOption("montserrat");
      await gymControls.getByRole("button", { name: "Large", exact: true }).click();
      await page.screenshot({ path: path.join(output, `gymnastics-font-style-${width}.png`) });
      assert.equal(writes.length, beforeGym, "wording and settings remain unsaved until an explicit save");
      assert.equal(await preview.locator("[data-hero-image-control]").count(), 0, "image controls are inside settings");
      assert.match(await preview.locator("h1").evaluate((element) => element.style.fontFamily), /Gym Montserrat/);
      await page.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
      assert.equal(await preview.getByRole("button", { name: "Preview event", exact: true }).count(), 0, "the page canvas replaces the separate fullscreen preview");
      assert.equal(await page.getByRole("dialog", { name: "Event preview", exact: true }).count(), 0);
      await preview.getByRole("button", { name: "Edit event title text", exact: true }).waitFor();
      assert.equal(await preview.locator("[data-hero-image-control]").count(), 0);
      await viewActions.getByRole("button", { name: "Page settings", exact: true }).click();
      assert.equal(await page.getByLabel("Title font", { exact: true }).inputValue(), "montserrat");
      await click("Save draft");
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const gymSaved = writes.at(-1).body.data;
      assert.equal(gymSaved.gymnasticsTitleFont, "montserrat");
      assert.equal(gymSaved.fontSize, "large");
      assert.equal(gymSaved.heroImageSettings.positionY, 50);
      assert.equal(gymSaved.address, `333 S Franklin St, Tampa, FL 33602, Hall ${width}`);
      assert.equal(gymSaved.venue, "Tampa Convention Center — East Hall");
      assert.equal(gymSaved.customFields?.meetDateRangeLabel ?? gymSaved.extra?.meetDateRangeLabel, "March 6–8, 2027");
      assert.deepEqual(gymSaved.gymnasticsPageText, Object.fromEntries(Object.entries(wording).map(([label, value]) => [{ "Top-left label": "mastheadLeft", "Top-right label": "mastheadRight", "Welcome message": "invitation", Encouragement: "tagline", "Bottom-left label": "signoffLeft", "Bottom-right label": "signoffRight" }[label], value])));
      await page.goto(gymUrl);
      await page.waitForURL("**/gymnastics/templates/airborne-atlas/customize?edit=gym-event");
      await openControls();
      await gymControls.waitFor();
      // Browser recovery may restore the Design panel that was open when saved.
      if (!(await page.getByLabel("Title font", { exact: true }).isVisible())) {
        await gymControls.getByRole("button", { name: "Design", exact: true }).click();
      }
      assert.equal(await page.getByLabel("Title font", { exact: true }).inputValue(), "montserrat", "saved font reloads in the actual editor");
      assert.equal(await gymControls.getByRole("button", { name: "Large", exact: true }).getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
      const settingsButton = viewActions.getByRole("button", { name: "Page settings", exact: true });
      assert.equal(await settingsButton.evaluate(element => Boolean(element.closest("header"))), true, "Page settings uses the separate header above the canvas");
      const settingsToggle = await settingsButton.boundingBox();
      const saveButtons = await page.getByRole("group", { name: "Save event", exact: true }).boundingBox();
      assert.ok(settingsToggle.y + settingsToggle.height <= 760, "Page settings stays inside the viewport");
      if (width === 390) assert.ok(settingsToggle.y + settingsToggle.height <= saveButtons.y, "phone settings sit above the save row without overlapping");
      for (const value of Object.values(wording)) assert.ok((await preview.textContent()).includes(value), `saved wording reloads: ${value}`);
      assert.match(await preview.locator("h1").evaluate((element) => element.style.fontFamily), /Gym Montserrat/);
      await page.screenshot({ path: path.join(output, `gymnastics-wording-${width}.png`) });
    }

  }, 60000);

  editorCase("image designs reuse generated artwork and refresh every thumbnail on replacement without automatic saves", async ({ page, state, writes, records, base, galleryPixel, workspace, openControls }) => {
    const load = require("./lib/event-messages-test-loader.cjs");
    const { createImportedEventTheme } = load("src/lib/imported-event-theme.ts");
    const { emptyCustomEventDetails } = load("src/lib/event-custom-design.ts");
    const imageRequests = [];
    page.on("request", request => {
      if (request.method() === "POST" && request.url().endsWith("/theme-artwork")) imageRequests.push(request.url());
    });
    await page.route("**/media/event-media/design-*.webp", route => route.fulfill({ contentType: "image/png", body: galleryPixel }));
    await page.route("**/api/blob/event-media/design-*.webp", route => route.fulfill({ contentType: "image/png", body: galleryPixel }));
    await page.route("**/api/templates/media", route => {
      const url = `/api/blob/event-media/design-upload-${++state.galleryUploadCount}.webp`;
      return route.fulfill({ json: { url } });
    });
    await page.route("**/api/upload", route => {
      assert.equal(route.request().method(), "POST");
      assert.match(route.request().headers()["content-type"], /^multipart\/form-data/);
      const url = `/api/blob/event-media/design-upload-${++state.galleryUploadCount}.webp`;
      return route.fulfill({ json: { ok: true, stored: { source: { url }, display: { url } }, eventMedia: { thumbnail: url } } });
    });
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    const choices = controls.getByRole("group", { name: "Event image designs", exact: true });
    const openDesigns = async () => {
      await openControls();
      await controls.getByRole("button", { name: /^Event image settings/ }).click();
      await choices.waitFor();
    };
    const assertAllImages = async expected => {
      const sources = await choices.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src")));
      assert.equal(sources.length, 48, "all image designs contain the event image");
      assert.deepEqual([...new Set(sources)], [expected], "every design uses the same current event image");
      assert.ok(await workspace.locator('[aria-label="Event page preview panel"] img').evaluateAll((images, src) => images.some(image => image.getAttribute("src") === src), expected), "thumbnail artwork matches the event page, including the mounted phone canvas");
    };
    for (const width of [1440, 390]) for (const kind of ["gymnastics", "football", "sport-events", "custom"]) {
      await page.setViewportSize({ width, height: 900 });
      const id = `design-image-${kind}-${width}`;
      const artwork = `${kind === "custom" ? "/api/blob" : "/media"}/event-media/design-${kind}-${width}.webp`;
      const importedTheme = { ...createImportedEventTheme({ title: "Artwork preview event", sport: kind === "gymnastics" ? "gymnastics" : "football", city: "Tampa, FL", seed: id }), artworkUrl: artwork };
      const data = kind === "custom" ? {
        title: "Artwork preview event", status: "draft", createdVia: "custom-event-page", responses: [{ id: "retained-response" }],
        customEventPage: { version: 1, category: "general", artwork,
          design: { version: 1, name: "Generated event", description: "Event artwork", layout: "split", font: "editorial", colors: { page: "#e9f4f5", surface: "#ffffff", ink: "#203c40", accent: "#35787e" } },
          details: { ...emptyCustomEventDetails(), title: "Artwork preview event", date: "2027-04-10", time: "09:30", timezone: "America/New_York", venue: "Event venue" } },
      } : {
        title: "Artwork preview event", status: "draft", category: kind === "football" ? "football-season" : kind,
        createdVia: "simple-template", pageTemplateId: kind === "gymnastics" ? "airborne-atlas" : kind === "football" ? "launchpad-editorial" : undefined,
        hero: "", importedTheme, date: "2027-04-10", time: "09:30", timezone: "America/New_York", venue: "Event venue", responses: [{ id: "retained-response" }],
      };
      records.set(id, { id, title: "Artwork preview event", revision: "design-image-v1", data });
      const route = kind === "custom" ? "design" : kind === "football" ? "football-season" : kind;
      const mode = kind === "custom" ? "create" : kind;
      const href = `${base}/event/${route}/customize?mode=${mode}&edit=${id}`;
      await page.goto(href);
      await openDesigns();
      await assertAllImages(artwork);
      const beforeWrites = writes.length, beforeUploads = state.galleryUploadCount;
      await choices.getByRole("button", { name: "Choose Crossing lines hero layout", exact: true }).click();
      await assertAllImages(artwork);
      const chooser = page.waitForEvent("filechooser");
      await controls.getByRole("button", { name: /^(Upload image|Change hero image)$/, exact: true }).click();
      await (await chooser).setFiles({ name: "replacement.png", mimeType: "image/png", buffer: galleryPixel });
      await page.waitForFunction(() => [...document.querySelectorAll('[aria-label="Event image designs"] img')].every(image => image.getAttribute("src")?.startsWith("data:image/")));
      const replacement = await choices.locator("img").first().getAttribute("src");
      await assertAllImages(replacement);
      assert.equal(writes.length, beforeWrites, "image and layout selection never save automatically");
      assert.equal(state.galleryUploadCount, beforeUploads, "replacement stays local until explicit save");
      assert.equal(kind === "custom" ? records.get(id).data.customEventPage.artwork : records.get(id).data.importedTheme.artworkUrl, artwork, "pending replacement preserves saved artwork");
      await page.screenshot({ path: path.join(output, `actual-image-designs-${kind}-${width}.png`) });
      await workspace.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(writes.length, beforeWrites + 1, "explicit save writes once");
      assert.equal(writes.at(-1).path, `/api/history/${id}`, "replacement keeps the original event identity");
      const saved = records.get(id).data;
      const savedImage = kind === "custom" ? saved.customEventPage.artwork : saved.heroImage || saved.hero;
      assert.match(savedImage, /^\/api\/blob\/event-media\/design-upload-\d+\.webp$/);
      assert.deepEqual(saved.responses, [{ id: "retained-response" }]);
      await page.reload();
      await openDesigns();
      await assertAllImages(savedImage);
      assert.equal(await choices.getByRole("button", { name: "Choose Crossing lines hero layout", exact: true }).getAttribute("aria-pressed"), "true", "saved layout retains the replacement image");
      assert.equal(writes.length, beforeWrites + 1, "reopening thumbnails does not save again");
    }
    assert.deepEqual(imageRequests, [], "thumbnail previews and replacements never request generated artwork");
  }, 120000);

  editorCase("Event image settings uploads retain explicit saves and shared media on desktop and phone", async ({ page, state, writes, records, base, galleryPixel, click, workspace, preview, openControls }) => {
    records.set("gym-event", { id: "gym-event", title: "Meet image settings", revision: "images-v1", data: {
      title: "Meet image settings", status: "draft", createdVia: "simple-template", category: "Gymnastics", templateId: "gymnastics", pageTemplateId: "airborne-atlas",
      date: "2027-04-10", time: "09:30", timezone: "America/New_York", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", rsvpEnabled: false,
    }});
    const gymControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    // Image upload lives inside Event image settings and remains local until saved.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=gym-event`);
      await openControls();
      await gymControls.getByRole("button", { name: /^Design/ }).click();
      assert.equal(await gymControls.getByRole("button", { name: "Upload image", exact: true }).count(), 0, "upload stays hidden while Design is open");
      await click("Back to details");
      await gymControls.getByRole("button", { name: /^Event image settings/ }).click();
      const imageTools = gymControls.locator("[data-hero-image-control]");
      const changeImage = imageTools.getByRole("button", { name: "Upload image", exact: true });
      await changeImage.waitFor();
      assert.equal(await preview.locator("[data-hero-image-control]").count(), 0, "the canvas has no image picker");
      const resetImage = imageTools.getByRole("button", { name: "Use template image", exact: true });
      if (await resetImage.isVisible()) await resetImage.click();
      const writesBefore = writes.length, uploadsBefore = state.galleryUploadCount;
      const chooser = page.waitForEvent("filechooser");
      await changeImage.click();
      await (await chooser).setFiles({ name: "meet-image.png", mimeType: "image/png", buffer: galleryPixel });
      await imageTools.getByRole("button", { name: "Use template image", exact: true }).waitFor();
      assert.equal(writes.length, writesBefore, "image selection never saves automatically");
      assert.equal(state.galleryUploadCount, uploadsBefore, "image selection stays local until saving");
      await click("Save draft");
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.ok(state.galleryUploadCount > uploadsBefore, "explicit save persists the selected image");
      assert.match(writes.at(-1).body.data.heroImage || writes.at(-1).body.data.hero, /^\/test-gallery-\d+\.png$/);
      const savedImage = writes.at(-1).body.data.heroImage || writes.at(-1).body.data.hero;
      const uploadsAfterSave = state.galleryUploadCount;
      const sharedRow = records.get("gym-event");
      sharedRow.title = sharedRow.data.title = `Another host's latest meet ${width}`;
      sharedRow.data.templateEditor.snapshot.data.title = sharedRow.title;
      sharedRow.revision = `other-host-${width}`;
      state.editorRole = "cohost";
      await page.reload();
      await openControls();
      await workspace.locator(`[aria-label="Event page preview panel"] img.template-hero-image[src="${savedImage}"]`).waitFor({ state: "attached" });
      assert.equal(await preview.locator("[data-hero-image-control]").count(), 0, "reopening keeps image upload off the canvas");
      await gymControls.getByRole("button", { name: /^Event image settings/ }).click();
      await gymControls.getByRole("button", { name: "Upload image", exact: true }).waitFor();
      assert.equal(writes.length, writesBefore + 1, "saved image reloads without another save");
      const backToDetails = gymControls.getByRole("button", { name: "Back to details", exact: true });
      if (await backToDetails.isVisible()) await backToDetails.click();
      await openGymCalendarDetails(page);
      assert.equal(await page.getByLabel("Event Title", { exact: true }).inputValue(), sharedRow.title, "a clean recovery copy yields to the other host's latest save");
      await page.getByLabel("Event Title", { exact: true }).fill(`Shared meet ${width}`);
      await click("Save draft");
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(writes.at(-1).path, "/api/history/gym-event", "co-host saves the same event ID");
      assert.equal(writes.at(-1).method, "PATCH");
      assert.equal(state.galleryUploadCount, uploadsAfterSave, "reopening and editing never copies saved photos");
      assert.equal(writes.at(-1).body.data.heroImage || writes.at(-1).body.data.hero, savedImage);
      state.editorRole = "owner";
      await page.screenshot({ path: path.join(output, `gymnastics-image-settings-${width}.png`) });
    }
  }, 60000);

  editorCase("native and custom photo/link sections retain uploads, retries and explicit saves", async ({ page, state, writes, base, galleryPixel, click, preview, switchView, openControls }) => {
    // Typed sections retain uploaded photos and working links through each editor's save/reload path.
    for (const { editorPath, custom, width, dark } of [
      { editorPath: "/birthdays/templates/candy-dreams/customize?mode=template", custom: false, width: 1440, dark: false },
      { editorPath: "/event/design/customize?mode=upload", custom: true, width: 390, dark: true },
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}${editorPath}`);
      await openControls();
      if (dark) await page.evaluate((variables) => {
        document.documentElement.classList.add("dark");
        for (const [key, value] of Object.entries(variables)) document.documentElement.style.setProperty(key, value);
      }, resolveThemeCssVariables("general", "dark"));
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      const before = writes.length;
      const canvas = async () => {
        const close = page.getByRole("button", { name: "Close preview", exact: true });
        if (await close.isVisible()) await close.click();
        if (await controls.isVisible()) await page.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
      };
      const library = async () => {
        await canvas();
        await preview.getByRole("button", { name: "Add tab", exact: true }).click();
        return page.getByRole("dialog", { name: "Add section", exact: true });
      };
      const add = async (name) => {
        const dialog = await library();
        const choices = dialog.getByRole("group", { name: "Predefined sections", exact: true });
        assert.match(await choices.getByRole("button").last().textContent(), /^Custom/, "repeatable Custom sections stay last");
        await choices.getByRole("button", { name }).click();
      };
      const editExisting = async (name) => {
        const dialog = await library();
        await dialog.getByRole("button", { name: new RegExp(`^${name} Already on page`) }).click();
      };
      await add(/^Photo gallery/);
      assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "Photo gallery");
      state.failNextGalleryUpload = !custom;
      await page.getByLabel("Upload photos", { exact: true }).setInputFiles([
        { name: "overlook.png", mimeType: "image/png", buffer: galleryPixel },
        { name: "picnic.png", mimeType: "image/png", buffer: galleryPixel },
      ]);
      if (!custom) {
        await page.getByRole("button", { name: "Retry failed uploads", exact: true }).waitFor();
        assert.equal(await page.getByLabel("Photo 1 caption", { exact: true }).count(), 1, "successful files survive a partial upload failure");
        await click("Retry failed uploads");
      }
      await page.getByLabel("Photo 2 caption", { exact: true }).waitFor();
      assert.equal(await page.getByLabel("Photo 3 caption", { exact: true }).count(), 0, "retry does not duplicate successful photos");
      await page.getByLabel("Photo 1 caption", { exact: true }).fill("Trail overlook");
      await page.getByLabel("Photo 2 caption", { exact: true }).fill("Group picnic");
      await click("Move photo 2 up");
      assert.equal(await page.getByLabel("Photo 1 caption", { exact: true }).inputValue(), "Group picnic");
      await click("Done");
      await add(/^Links Useful/);
      await click("Add link");
      await page.getByLabel("Link 1 label", { exact: true }).fill("Venue guide");
      await page.getByLabel("Link 1 URL", { exact: true }).fill("javascript:alert(1)");
      assert.equal(await preview.locator('a[href^="javascript:"]').count(), 0, "invalid addresses never become guest links");
      await page.getByLabel("Link 1 URL", { exact: true }).fill("https://example.com/venue");
      await click("Add link");
      await page.getByLabel("Link 2 label", { exact: true }).fill("Parking map");
      await page.getByLabel("Link 2 URL", { exact: true }).fill("https://example.com/parking");
      await click("Move link 2 up");
      await click("Remove link 2");
      assert.equal(await page.getByLabel("Link 1 label", { exact: true }).inputValue(), "Parking map");
      await click("Done");
      await add(/^Custom/);
      assert.equal(await page.getByLabel("Title", { exact: true }).inputValue(), "Information");
      await page.getByLabel("Title", { exact: true }).fill("Guest notes");
      await page.getByLabel("Section content", { exact: true }).fill("Leave room for a quiet break.");
      await click("Done");
      assert.equal(writes.length, before, "adding photos, links and Other does not save the event");
      await click("Save draft");
      await page.getByText("Draft saved.", { exact: true }).first().waitFor();
      const data = writes.at(-1).body.data;
      const sections = custom ? data.customEventPage.details.sections : data.eventPageComposition.sections;
      const photos = sections.find((section) => section.kind === "photos");
      assert.deepEqual(photos.photos.map(({ caption }) => caption), ["Group picnic", "Trail overlook"]);
      assert.deepEqual(sections.find((section) => section.kind === "links").links, [{ label: "Parking map", url: "https://example.com/parking" }]);
      assert.ok(sections.some((section) => section.title === "Guest notes" && section.body === "Leave room for a quiet break."));
      await page.reload();
      await openControls();
      await switchView("Preview");
      await preview.waitFor();
      assert.equal(await preview.getByRole("img", { name: "Group picnic", exact: true }).count(), 1);
      assert.equal(await preview.getByRole("img", { name: "Trail overlook", exact: true }).count(), 1);
      const link = preview.getByRole("link", { name: /Parking map/ });
      assert.equal(await link.getAttribute("href"), "https://example.com/parking");
      assert.match(await link.getAttribute("rel"), /noopener/);
      await preview.getByRole("heading", { name: "Photo gallery", exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `extra-sections-${custom ? "custom" : "native"}-${width}.png`) });
      await openControls();
      await editExisting("Photo gallery");
      assert.equal(await page.getByLabel("Photo 1 caption", { exact: true }).inputValue(), "Group picnic");
      await click("Remove photo 2");
      assert.equal(await page.getByLabel("Photo 2 caption", { exact: true }).count(), 0);
      await click("Done");
      if (width < 768) {
        await openControls();
        await controls.getByRole("button", { name: /^Sections Add, rename/ }).click();
        await controls.getByRole("button", { name: "Select Links section", exact: true }).click();
        await controls.getByRole("button", { name: "Remove Links section", exact: true }).click();
      } else {
        await canvas();
        await preview.getByRole("button", { name: "Remove Links section", exact: true }).click();
      }
      await page.getByRole("status").filter({ hasText: "Links removed from page." }).locator("..").getByRole("button", { name: "Undo", exact: true }).click();
      await editExisting("Links");
      assert.equal(await page.getByLabel("Link 1 URL", { exact: true }).inputValue(), "https://example.com/parking");
      await click("Done");
    }
  });

  editorCase("gymnastics background enrichment retains current edits and cleared locations", async ({ page, state, errors, writes, records, base, click, openControls }) => {
    const gymControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    // A usable imported draft stays editable while optional details finish on the server.
    await page.setViewportSize({ width: 1440, height: 900 });
    const coreEvent = {
      title: "Core meet draft", date: "2026-11-06", time: "09:00", timezone: "America/New_York",
      venue: "Source arena", address: "Source street address", details: "Initial meet details.",
      pageTemplateId: "airborne-atlas", extra: { meetDateRangeLabel: "November 6, 2026" },
    };
    const coreRow = {
      id: "gym-core", title: coreEvent.title, revision: "core-v1",
      data: {
        ...coreEvent, status: "draft", createdVia: "meet-discovery-v2", category: "gymnastics",
        templateId: "gymnastics-schedule",
        builderDraft: { event: coreEvent, venue: { venue: coreEvent.venue, address: coreEvent.address }, advancedSections: { meet: { judgingNotes: "" } }, reviewFlags: [] },
        publicArtifacts: { pipelineVersion: "gym-public-v3", hero: { title: coreEvent.title, dateLabel: "", venue: "", badges: [] }, sections: {}, quickAccess: [], publishAssessment: { state: "needs_review", reasons: [] } },
        pipelineSummary: { discoveryId: "discovery-core", processingStage: "enrich", workflow: "gymnastics" },
      },
    };
    records.set(coreRow.id, coreRow);
    await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=gym-core`);
    await openControls();
    await openGymCalendarDetails(page);
    const coreTitle = page.getByLabel("Event Title", { exact: true });
    await coreTitle.waitFor();
    await page.getByText("Finishing venue, parking, and attendee details in the background.", { exact: true }).waitFor();
    await page.evaluate(() => {
      window.__gymCoreLoadingFlash = false;
      new MutationObserver(() => {
        if (/Loading event(?:…| preview\.\.\.)/.test(document.body.innerText)) window.__gymCoreLoadingFlash = true;
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    const beforeCoreWrites = writes.length;
    await coreTitle.fill("Host's corrected meet");
    await page.getByLabel("Venue", { exact: true }).fill("");
    await page.getByLabel("Address", { exact: true }).fill("");
    assert.ok(state.gymCoreStatusReads > 0, "the editor polls optional enrichment after opening the core draft");
    const completedEvent = { ...coreEvent, title: "Provider's later title", venue: "Enriched arena", address: "Verified address", extra: { meetDateRangeLabel: "November 6–8, 2026" } };
    records.set(coreRow.id, {
      ...coreRow, title: completedEvent.title, revision: "core-v2",
      data: {
        ...coreRow.data, ...completedEvent,
        builderDraft: { ...coreRow.data.builderDraft, event: completedEvent, venue: { venue: completedEvent.venue, address: completedEvent.address }, advancedSections: { meet: { judgingNotes: "New judging details from enrichment." } } },
        pipelineSummary: { ...coreRow.data.pipelineSummary, processingStage: "review_ready" },
      },
    });
    state.gymCoreCompleted = true;
    const coreDisplayDateId = await page.getByLabel("Display Date", { exact: true }).getAttribute("id");
    await page.waitForFunction((id) => document.getElementById(id)?.value === "November 6–8, 2026", coreDisplayDateId);
    assert.equal(await coreTitle.inputValue(), "Host's corrected meet", "completion keeps the host's current title");
    assert.equal(await page.getByLabel("Venue", { exact: true }).inputValue(), "", "completion preserves an intentional venue clear");
    assert.equal(await page.getByLabel("Address", { exact: true }).inputValue(), "", "completion preserves an intentional address clear");
    assert.equal(await page.evaluate(() => window.__gymCoreLoadingFlash), false, "background refresh never replaces the mounted editor with a loading screen");
    assert.equal(writes.length, beforeCoreWrites, "background completion does not save the editor");
    await click("Save draft");
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    const coreSaved = writes.at(-1).body.data.templateEditor.snapshot;
    assert.equal(coreSaved.data.title, "Host's corrected meet");
    assert.equal(coreSaved.data.venue, "");
    assert.equal(coreSaved.data.address, "");
    assert.equal(coreSaved.data.extra.meetDateRangeLabel, "November 6–8, 2026");
    assert.equal(coreSaved.advancedState.meet.judgingNotes, "New judging details from enrichment.");
    assert.equal(errors.length, 0, errors.join("\n"));
  });

  for (const width of [390, 1440]) {
    for (const { schoolTemplate: kind, id: schoolDesignId } of require("./lib/event-messages-test-loader.cjs")("src/lib/school-event-designs.ts").SCHOOL_EVENT_DESIGNS) {
      editorCase(`school design ${schoolDesignId} saves and reopens at ${width}px`, async ({ page, writes, base, click, preview, switchView, openControls }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${base}/event/design/customize?mode=create&templateId=${schoolDesignId}&collection=school`);
        await openControls();
        await page.getByRole("button", { name: /^Event details/ }).click();
        await page.getByLabel("Event title", { exact: true }).fill(`Oak School ${kind}`);
        await switchView("Preview");
        await preview.getByText(`Oak School ${kind}`, { exact: true }).first().waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${kind} fits ${width}px`);
        await page.screenshot({ path: path.join(output, `school-${schoolDesignId}-${width}.png`) });
        await switchView("Edit");
        await click("Save draft");
        await page.getByText("Draft saved.", { exact: true }).first().waitFor();
        const schoolData = writes.at(-1).body.data;
        assert.equal(schoolData.category, "School & classroom");
        assert.equal(schoolData.schoolTemplate, kind);
        assert.equal(schoolData.bodyDesignId, schoolDesignId);
        assert.equal(schoolData.creationCollection, "school");
        assert.equal(schoolData.customEventPage.details.date, "");
        assert.equal(schoolData.customEventPage.details.venue, "");
        const sections = schoolData.customEventPage.details.sections;
        assert.ok(sections.length >= 3 && sections.every(section => section.title && !section.body), "school templates seed useful empty sections without inventing facts");
        await page.reload();
        await openControls();
        await page.getByRole("button", { name: /^Event details/ }).click();
        assert.equal(await page.getByLabel("Event title", { exact: true }).inputValue(), `Oak School ${kind}`);
        assert.equal(new URL(page.url()).pathname, "/event/design/customize", "school uses the current Event Page editor");
      }, 15000);

    }
  }

  for (const width of [390, 1440]) {
    editorCase(`school memo review, publication and explicit calendar selection at ${width}px`, async ({ page, calendarWrites, writes, records, base, click, workspace, preview, switchView, openControls }) => {
      await page.goto(`${base}/event/general/customize?mode=manual`);
      await workspace.waitFor();
        await page.setViewportSize({ width, height: 900 });
        const importedHref = await page.evaluate(() => window.__seedSchoolMemoCreate());
        const importedUrl = new URL(importedHref, base);
        importedUrl.searchParams.set("mode", "manual");
        importedUrl.searchParams.set("schoolCalendar", "1");
        await page.goto(importedUrl.toString());
        await openControls();
        const openMemoCanvas = async () => {
          await openControls();
          await page.getByRole("button", { name: /^(Hide settings|Back to page)$/, exact: true }).click();
          await preview.waitFor();
        };
        const memoControls = page.getByRole("complementary", { name: "Event editing controls" });
        await memoControls.getByRole("button", { name: /^Dates from this memo/ }).click();
        const datePanel = memoControls;
        await datePanel.getByRole("button", { name: "Edit Bible Test", exact: true }).click();
        const dateFields = datePanel.locator("[data-memo-date-editor]");
        await dateFields.getByLabel("Date", { exact: true }).fill("2026-11-02");
        await dateFields.getByLabel("Start time (optional)", { exact: true }).fill("09:30");
        await dateFields.getByLabel("End time (optional)", { exact: true }).fill("10:00");
        await dateFields.getByLabel("Notes", { exact: true }).fill("Bring your study guide.");
        await datePanel.getByRole("button", { name: "Back to details", exact: true }).click();
        await openMemoCanvas();
        await preview.locator("[data-school-memo-dates]").waitFor();
        const inlineDates = preview.locator("[data-school-memo-dates]");
        await inlineDates.getByRole("button", { name: "Edit Spelling Test", exact: true }).click();
        await inlineDates.locator("[data-memo-date-editor]").getByLabel("Location (optional)", { exact: true }).fill("Classroom 2");
        await inlineDates.getByRole("button", { name: "Done editing Spelling Test", exact: true }).click();
        assert.equal(await preview.getByRole("region", { name: "Plan your visit" }).count(), 0, "memo preview omits the generic parent calendar controls");
        assert.match(await preview.textContent(), /Binders are returned to school daily/);
        const biblePanel = preview.locator("[data-event-section]").filter({ has: page.getByRole("heading", { name: "Bible", exact: true }) }).first();
        assert.match(await biblePanel.textContent(), /near.”\nMatthew 3:2\n\nTest: Friday October 30th/);
        assert.doesNotMatch(await biblePanel.textContent(), /R e p e n t|M a t t h e w/);
        assert.equal(await biblePanel.locator("p").first().evaluate(node => getComputedStyle(node).whiteSpace), "pre-wrap");
        const memoDates = preview.locator("[data-school-memo-dates]");
        const assertReviewOnly = async () => {
          assert.equal(await memoDates.getByRole("checkbox").count(), 0, "editor dates are for review, including after saving");
          assert.equal(await memoDates.getByRole("button", { name: /Clear all|Select all|calendar/i }).count(), 0, "calendar actions require the published saved page");
        };
        const beforeMemoCalendars = calendarWrites.length;
        await assertReviewOnly();
        assert.equal(await preview.getByText("Add a short description so guests know what to expect.", { exact: true }).count(), 0);
        await page.screenshot({ path: path.join(output, `school-upload-memo-${width}.png`) });
        await memoDates.evaluate(node => { window.__memoDatesBeforeSave = node; });
        await click("Save draft");
        await page.getByText("Draft saved.", { exact: true }).first().waitFor();
        assert.equal(await page.evaluate(() => window.__memoDatesBeforeSave.isConnected), true, "first draft save keeps the memo controls mounted");
        await assertReviewOnly();
        assert.equal(calendarWrites.length, beforeMemoCalendars, "draft saves never add dates to a calendar");
        const importedData = writes.at(-1).body.data;
        assert.equal(importedData.schoolTemplate, "weekly-memo");
        assert.equal(importedData.startISO, null);
        assert.equal(importedData.visibility, "private");
        assert.deepEqual(importedData.scanSchedule.items.map(item => item.id), ["bible", "spelling"]);
        assert.deepEqual(importedData.scanSchedule.items.map(item => item.calendarSelected), [true, false], "draft saves retain stored per-item selections without exposing calendar controls");
        assert.equal(importedData.scanSchedule.items[0].date, "2026-11-02");
        assert.equal(importedData.scanSchedule.items[0].startAt, "2026-11-02T15:30:00.000Z");
        assert.equal(importedData.scanSchedule.items[0].notes, "Bring your study guide.");
        assert.equal(importedData.scanSchedule.items[0].yearInferred, false);
        assert.equal(importedData.scanSchedule.items[1].locationText, "Classroom 2");
        await page.reload();
        await openControls();
        await openMemoCanvas();
        await preview.locator("[data-school-memo-dates]").waitFor();
        assert.equal(await preview.locator("[data-school-memo-issue-date] time").textContent(), "October 26, 2026");
        assert.match(await preview.textContent(), /Bible Test/);
        assert.match(await preview.textContent(), /Spelling Test/);
        await preview.getByRole("button", { name: "Edit Bible Test", exact: true }).click();
        const restoredDateFields = preview.locator("[data-memo-date-editor]");
        assert.equal(await restoredDateFields.getByLabel("Date", { exact: true }).inputValue(), "2026-11-02");
        assert.equal(await restoredDateFields.getByLabel("Start time (optional)", { exact: true }).inputValue(), "09:30");
        assert.equal(await restoredDateFields.getByLabel("Notes", { exact: true }).inputValue(), "Bring your study guide.");
        await restoredDateFields.getByLabel("Notes", { exact: true }).fill("Bring your study guide and pencil.");
        await assertReviewOnly();
        await preview.getByRole("button", { name: "Done editing Bible Test", exact: true }).click();
        await click("Save draft");
        await page.getByText("Draft saved.", { exact: true }).first().waitFor();
        await assertReviewOnly();
        assert.deepEqual(writes.at(-1).body.data.scanSchedule.items.map(item => item.calendarSelected), [true, false]);
        const groups = preview.locator("[data-section-row]");
        const geometry = await groups.evaluateAll(elements => elements.map(node => ({ width: node.getBoundingClientRect().width, parent: node.parentElement.getBoundingClientRect().width })));
        assert.ok(geometry.length >= 2, "the supporting memo notes retain their paired rows");
        assert.ok(geometry.every(box => box.width > box.parent * 0.9), "memo rows use the whole reading width");
        const pair = preview.locator('[data-section-row*="section:0"]').first();
        const cells = await pair.locator(":scope > [data-section-width]").evaluateAll(nodes => nodes.map(node => ({ x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y })));
        assert.equal(cells.length, 2);
        assert.equal(Math.abs(cells[0].y - cells[1].y) < 2, width >= 768, "notes sit beside one another on desktop and stack on phones");
        const savedId = new URL(page.url()).searchParams.get("edit");
        const savedMemo = records.get(savedId);
        await openControls();
        await click("Publish");
        await page.locator("[data-destination]").waitFor();
        assert.equal(records.get(savedId).data.status, "published");
        assert.equal(records.get(savedId).data.createdVia, "custom-event-page");
        await page.goto(`${base}/event/general/customize?mode=school-saved&edit=${savedId}`);
        const publishedDates = page.locator("[data-school-memo-dates]");
        await publishedDates.waitFor();
        await publishedDates.getByRole("button", { name: "Clear all", exact: true }).click();
        await publishedDates.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).check();
        assert.equal(await publishedDates.getByRole("checkbox", { checked: true }).count(), 1);
        await publishedDates.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).waitFor();
        assert.equal(calendarWrites.length, beforeMemoCalendars, "opening the published memo never adds dates automatically");
        await publishedDates.getByRole("button", { name: /^Add selected dates to your calendar \(1\)$/, exact: true }).click();
        await publishedDates.getByRole("status").filter({ hasText: "1 added" }).waitFor();
        assert.deepEqual(calendarWrites.at(-1), { provider: "google", itemIds: ["bible"] });
        assert.equal(await page.locator("[data-school-memo-issue-date] time").textContent(), "October 26, 2026");
        assert.equal(await publishedDates.evaluate(node => Boolean(node.closest('article[data-appearance-scope="authored"]'))), true, "published dates are inside the authored memo body");
        const branding = page.locator("[data-envitefy-event-branding]");
        assert.equal(await publishedDates.evaluate((node, footer) => Boolean(node.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING), await branding.elementHandle()), true, "calendar section precedes the actual page footer");
        assert.equal(await page.getByText("No description provided.", { exact: true }).count(), 0);
        assert.deepEqual(await page.locator("[data-body-section]").evaluateAll(nodes => nodes.filter(node => !node.textContent.trim() && !node.querySelector("img,iframe,input,button")).map(node => node.getAttribute("data-body-section"))), [], "memo omits empty logistics and placeholder panels");
        await page.screenshot({ path: path.join(output, `school-published-memo-${width}.png`), fullPage: true });
        await page.getByRole("link", { name: "Edit school memo", exact: true }).click();
        assert.equal(new URL(page.url()).pathname, "/event/design/customize", "owner Edit opens the current memo editor");
        await workspace.waitFor();
        assert.equal(await page.getByRole("dialog", { name: "Review your school memo", exact: true }).count(), 0);
        await openMemoCanvas();
        await preview.locator("[data-school-memo-dates]").waitFor();
        assert.match(await preview.textContent(), /Binders are returned to school daily/);
        await assertReviewOnly();
        assert.deepEqual(records.get(savedId).data.scanSchedule.items.map(item => item.calendarSelected), [true, false], "owner editing retains stored selection while hiding calendar controls");
    });

  }

  editorCase("unsigned Birthday save-and-leave retains edits and never claims an account save", async ({ page, writes, base, click, leave, workspace, openControls }) => {
    const name = page.getByLabel("Child's Name", { exact: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const savedWriteCount = writes.length;
    await page.goto(`${base}/birthdays/templates/candy-dreams/customize?mode=template&signedOut=1`);
    await workspace.waitFor();
    await openControls();
    // Browser storage can resume the section that was open before signing out.
    const headlineMenu = page.getByRole("button", { name: /^Headline/ });
    if (await headlineMenu.count()) await headlineMenu.click();
    await name.waitFor();
    await name.fill("Unsigned host changes");
    await leave();
    await click("Save and leave");
    await page.getByRole("alert").filter({ hasText: "Save and continue" }).waitFor();
    assert.equal(writes.length, savedWriteCount, "leaving cannot claim to save an unsigned event");
    assert.equal(await page.locator("[data-destination]").count(), 0);
    await click("Keep editing");
    assert.equal(await name.inputValue(), "Unsigned host changes");
  });

});
