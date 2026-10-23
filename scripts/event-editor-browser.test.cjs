const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const { resolveThemeCssVariables } = require("./lib/event-messages-test-loader.cjs")("src/themes/registry.ts");
compiled.init();

test("one Event Page editor protects saves and navigation across creation modes and screen sizes", {
  timeout: 180000,
}, async () => {
  const output = path.resolve(".qa/event-editor-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [
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
      '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/birthdays/customize/page.tsx"; @source "../src/app/event/gymnastics/customize/page.tsx"; @source "../src/components/gym-meet-templates"; @source "../src/components/events/HeroImageEditor.tsx"; @source "../src/components/templates/TemplateEditorContext.tsx";',
      { from: path.resolve("scripts/event-editor-fixture.css") },
    )
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
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
    writes = [],
    urlWrites = [],
    records = new Map();
  let failSave = false;
  let failNextGalleryUpload = false;
  let galleryUploadCount = 0;
  const galleryPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=", "base64");
  let gymCoreCompleted = false;
  let gymCoreStatusReads = 0;
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
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/templates/media") {
      assert.equal(req.method(), "POST");
      assert.match(req.headers()["content-type"], /^multipart\/form-data/);
      if (failNextGalleryUpload) {
        failNextGalleryUpload = false;
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Photo upload failed. Try again." }) });
      }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ url: `/test-gallery-${++galleryUploadCount}.png` }) });
    }
    if (/^\/test-gallery-\d+\.png$/.test(url.pathname))
      return route.fulfill({ contentType: "image/png", body: galleryPixel });
    if (url.pathname === "/api/discovery/gym-core/run")
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ accepted: true }) });
    if (url.pathname === "/api/discovery/gym-core/status") {
      gymCoreStatusReads += 1;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({
        draftReady: true,
        builderReady: gymCoreCompleted,
        processingStage: gymCoreCompleted ? "review_ready" : "enrich",
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
      if (req.method() === "GET")
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ ...records.get(id), permissions: { role: "owner", canManageCollaborators: true } }),
        });
      const body = req.postDataJSON();
      writes.push({
        path: url.pathname,
        method: req.method(),
        body,
        revision: body.expectedRevision,
      });
      assert.equal(req.headers()["if-match"], undefined, "event revisions must bypass HTTP entity preconditions");
      if (failSave)
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
    if (url.pathname.startsWith("/api/"))
      return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base && /\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(`${path.resolve("public")}${path.sep}`) && fs.existsSync(asset)) return route.fulfill({ path: asset });
    }
    if (url.origin === base)
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}[data-leave]{position:fixed;bottom:90px;left:20px;z-index:50}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
      });
    return route.abort();
  });
  const click = (name) => page.getByRole("button", { name, exact: true }).click();
  const leave = () => page.locator("[data-leave]").click();
  const workspace = page.locator("[data-event-page-editor]");
  const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
  const viewActions = page.getByRole("group", { name: "Editor view", exact: true });
  const checkActionPlacement = async () => {
    const bounds = await workspace.boundingBox();
    const actions = page.getByRole("group", { name: "Save event", exact: true });
    assert.equal(await actions.getByRole("button", { name: "Back", exact: true }).count(), 0, "the footer Back action stays outside the accessibility tree");
    assert.equal(await actions.getByRole("button", { name: "Back", exact: true, includeHidden: true }).isVisible(), false, "the footer Back action is hidden");
    const footer = await actions.evaluate((element) => {
      const footer = element.parentElement;
      const rect = footer.getBoundingClientRect();
      const style = getComputedStyle(footer);
      return { x: rect.x, width: rect.width, bottom: rect.bottom, editing: element.closest("[data-event-page-editor]").getAttribute("data-editing") === "true", background: style.backgroundColor, topBorder: parseFloat(style.borderTopWidth), border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].reduce((sum, value) => sum + parseFloat(value), 0), backdrop: style.backdropFilter };
    });
    assert.ok(Math.abs(footer.bottom - (bounds.y + bounds.height)) < 1, "save actions overlay the bottom of the workspace");
    if (await workspace.getAttribute("data-page-editing") === "false" && await workspace.getAttribute("data-embedded") === "false") {
      const desktop = page.viewportSize().width >= 768;
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
      assert.equal(await viewActions.count(), 1, "the shared footer owns one mounted view toggle");
      assert.equal(await viewActions.evaluate((element) => element.closest('[aria-label="Save event"]') !== null && element.closest("footer") !== null), true, "the view toggle shares the bottom action group");
      await page.mouse.move(0, 0);
      await actions.evaluate(async (element) => Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {}))));
      const buttons = await actions.getByRole("button").evaluateAll((elements) => elements.map((button) => {
        const { x, y, width, height } = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return { label: button.textContent.trim(), x, y, width, height, radius: Math.max(...[style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].map(parseFloat)), border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].reduce((sum, value) => sum + parseFloat(value), 0), background: style.backgroundColor, role: button.getAttribute("role"), pressed: button.getAttribute("aria-pressed"), selected: button.getAttribute("aria-selected") };
      }));
      assert.match(buttons[0].label, /^(Preview|Edit)$/, "the view toggle starts the visible bottom action bar");
      for (const [index, button] of buttons.entries()) {
        assert.equal(button.radius, desktop ? 12 : 0, `${button.label} keeps ${desktop ? "regular desktop button" : "square mobile"} corners`);
        assert.notEqual(button.role, "tab", `${button.label} remains an action button`);
        assert.equal(button.pressed, null, `${button.label} does not claim a selected tool state`);
        assert.equal(button.selected, null, `${button.label} does not claim a selected tab state`);
        if (["Publish", "Save changes", "Saving…"].includes(button.label)) {
          assert.ok(!["transparent", "rgba(0, 0, 0, 0)"].includes(button.background), `${button.label} keeps its filled primary surface`);
        } else if (desktop) {
          assert.equal(button.border, 4, `${button.label} has a one-pixel border on each side`);
          assert.match(button.background, /^rgb\(/, `${button.label} has its own opaque desktop button surface`);
        } else {
          assert.equal(button.border, 0, `${button.label} uses the borderless top-toolbar treatment`);
          assert.ok(["transparent", "rgba(0, 0, 0, 0)"].includes(button.background), `${button.label} has a transparent idle surface`);
        }
        assert.ok(Math.abs(button.y - buttons[0].y) < 1, `${button.label} stays on the same bottom row`);
        assert.ok(button.height >= 44 && button.width >= 44, `${button.label} retains a 44px touch target`);
        assert.ok(button.x >= footer.x - 1 && button.x + button.width <= footer.x + footer.width + 1, `${button.label} fits inside the footer`);
        if (index) assert.ok(button.x >= buttons[index - 1].x + buttons[index - 1].width - 1, `${button.label} follows the preceding action without overlap`);
      }
    }
    const panel = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    if (await panel.isVisible()) {
      const panelBounds = await panel.boundingBox();
      assert.ok(Math.abs(footer.x - panelBounds.x) < 1, "save actions start at the editor panel");
      assert.ok(Math.abs(footer.width - panelBounds.width) < 1, "save actions match the editor panel width");
      if (await preview.isVisible()) {
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
    assert.equal(await viewActions.getByRole("button").count(), 1, "one action changes the current view");
    await viewActions.getByRole("button", { name, exact: true }).click();
    await viewActions.getByRole("button", { name: name === "Preview" ? "Edit" : "Preview", exact: true }).waitFor();
    assert.equal(await viewActions.getByRole("button").count(), 1);
    await checkActionPlacement();
  };
  const openControls = async () => {
    await workspace.waitFor();
    const opener = viewActions.getByRole("button", { name: /^(Edit|Page settings)$/, exact: true });
    if (await opener.isVisible()) await opener.click();
    await page.getByRole("complementary", { name: "Event editing controls", exact: true }).waitFor();
  };
  const checkPreviewScroll = async (context) => {
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true, includeHidden: true });
    const panelTop = await controls.evaluate((element) => element.scrollTop);
    const windowTop = await page.evaluate(() => scrollY);
    const viewToggle = await viewActions.boundingBox();
    const footer = await page.getByRole("group", { name: "Save event", exact: true }).boundingBox();
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
    assert.deepEqual(await page.getByRole("group", { name: "Save event", exact: true }).boundingBox(), footer);
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
  try {
    for (const { width, height } of [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 667, height: 375 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize({ width, height });
      const before = writes.length;
      await page.goto(`${base}/event/general/customize?mode=manual&templateId=holidays--cinco-de-mayo--community-table&collection=holidays-seasonal&occasion=cinco-de-mayo`);
      await workspace.waitFor();
      await viewActions.getByRole("button", { name: "Preview", exact: true }).waitFor();
      const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true, includeHidden: true });
      await controls.waitFor();
      assert.equal(await controls.isVisible(), true, `editing starts expanded at ${width}×${height}`);
      assert.equal(await preview.isVisible(), width >= 768, "the expanded panel shares desktop space and replaces the phone canvas");
      await checkActionPlacement();
      await switchView("Preview");
      assert.equal(await preview.isVisible(), true, `Preview shows the clean template at ${width}×${height}`);
      assert.equal(await controls.isVisible(), false, "Preview collapses the editing panel");
      assert.equal(await preview.getByRole("button", { name: "Add section", exact: true }).count(), 0, "clean page hides section editing tools");
      assert.equal(await preview.getByRole("button", { name: "Change", exact: true }).count(), 0, "clean page hides artwork replacement controls");
      assert.equal(await preview.locator("[data-hero-image-control]").count(), 0, "initial page omits the artwork editing surface");
      const checkTouchActions = async () => {
        const actions = page.getByRole("group", { name: "Save event", exact: true });
        assert.deepEqual(await actions.getByRole("button").allTextContents(), [await viewActions.getByRole("button").innerText(), "Save draft", "Publish"], "draft actions show the view toggle, Save draft and Publish in order");
        for (const button of await actions.getByRole("button").all()) {
          if (!(await button.isVisible())) continue;
          const bounds = await button.boundingBox();
          assert.ok(bounds.height >= 44 && bounds.width >= 44, `editor action keeps a 44px touch target at ${width}×${height}`);
          assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y >= -1 && bounds.y + bounds.height <= height + 1, `editor action stays inside ${width}×${height}`);
        }
        await checkActionPlacement();
      };
      await checkTouchActions();
      await page.screenshot({ path: path.join(output, `preview-${width}-${height}.png`) });
      await leave();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/chosen-destination", `a clean template can leave through app navigation at ${width}×${height}`);
      assert.equal(await page.getByRole("dialog").count(), 0, "a clean template exits without an unsaved-changes prompt");
      assert.equal(writes.length, before, "leaving a clean template never saves or publishes");
      await page.goto(`${base}/event/general/customize?mode=manual&templateId=holidays--cinco-de-mayo--community-table&collection=holidays-seasonal&occasion=cinco-de-mayo`);
      await openControls();
      assert.ok(await workspace.locator('[aria-label="Event page preview panel"] [data-hero-image-control]').count() > 0, "Edit restores artwork tools on the mounted page");
      const toolRow = controls.getByRole("group", { name: "Page tools", exact: true });
      const rail = await toolRow.evaluate((element) => {
        const style = getComputedStyle(element);
        const { x, width } = element.getBoundingClientRect();
        return { x, width, background: style.backgroundColor, radius: parseFloat(style.borderRadius) };
      });
      assert.ok(!["transparent", "rgba(0, 0, 0, 0)"].includes(rail.background), "page tools share one visible rail");
      assert.ok(rail.radius > 0, "the page-tools rail has rounded corners");
      const tools = await Promise.all([/^Page sections/, /^Layout/, /^Custom URL/].map(async (name) => controls.getByRole("button", { name }).boundingBox()));
      assert.deepEqual(await toolRow.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-pressed"))), ["false", "false", "false"], "page tools start without an active tool");
      assert.ok(await toolRow.getByRole("button").evaluateAll((buttons) => buttons.every((button) => {
        const style = getComputedStyle(button);
        return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].every((value) => parseFloat(value) === 0);
      })), "tools use one rail without separate card borders");
      const menus = await Promise.all([/^Headline/, /^Design/, /^Details/, /^RSVP/, /^Passcode/].map(async (name) => controls.getByRole("button", { name }).boundingBox()));
      const panel = await controls.boundingBox();
      for (const tile of tools) {
        assert.ok(Math.abs(tile.width - tools[0].width) < 1 && Math.abs(tile.y - tools[0].y) < 1, "page tools form one row of equal-width buttons");
        assert.ok(tile.height >= 44, "page tools retain touch targets");
      }
      for (const menu of menus) {
        assert.ok(Math.abs(menu.width - menus[0].width) < 1 && Math.abs(menu.x - menus[0].x) < 1, "settings menu rows share a consistent width and left edge");
        assert.ok(menu.height >= 44 && menu.height <= 92, "settings menu rows stay compact and usable");
      }
      assert.ok(Math.abs(rail.x - menus[0].x) < 1 && Math.abs(rail.x + rail.width - menus[0].x - menus[0].width) < 1, "the tools rail and settings rows share their outer gutters");
      assert.ok(menus[0].x - panel.x >= 8 && panel.x + panel.width - menus[0].x - menus[0].width >= 8, "settings have breathing room on both sides");
      await page.screenshot({ path: path.join(output, `compact-settings-top-${width}-${height}.png`) });
      await controls.getByRole("button", { name: /^Headline/ }).click();
      const headline = page.getByLabel("Headline", { exact: true }), venue = page.getByLabel("Venue", { exact: true }), date = page.getByLabel("Date", { exact: true });
      assert.equal(await date.inputValue(), "", "opening a template and its editor never fills an event date");
      await headline.fill(`Preserved title ${width}`);
      await headline.evaluate((element) => { window.savedNativeHeadlineNode = element; });
      await venue.fill("The host's chosen venue");
      await controls.evaluate((element) => { element.scrollTop = Math.min(100, element.scrollHeight - element.clientHeight); });
      const settingsTop = await controls.evaluate((element) => element.scrollTop);
      await switchView("Preview");
      await preview.evaluate((element) => { element.scrollTop = Math.min(140, element.scrollHeight - element.clientHeight); });
      const previewTop = await preview.evaluate((element) => element.scrollTop);
      await switchView("Edit");
      assert.equal(await headline.inputValue(), `Preserved title ${width}`);
      assert.equal(await venue.inputValue(), "The host's chosen venue");
      assert.equal(await date.inputValue(), "");
      assert.ok(Math.abs(await controls.evaluate((element) => element.scrollTop) - settingsTop) <= 1, "settings scroll position survives viewing the page");
      await switchView("Preview");
      assert.ok(Math.abs(await preview.evaluate((element) => element.scrollTop) - previewTop) <= 1, "page scroll position survives opening Edit");
      await checkTouchActions();
      await switchView("Edit");
      for (const name of ["Page sections", "Layout", "Custom URL", "Layout", "Page sections"]) {
        await toolRow.getByRole("button", { name, exact: true }).click();
        assert.equal(await toolRow.isVisible(), true, "native tools stay visible while a tool is open");
        for (const label of ["Page sections", "Layout", "Custom URL"]) {
          assert.equal(await toolRow.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), String(label === name), `${label} reflects direct tool switching`);
        }
        assert.equal(await headline.evaluate((element) => element === window.savedNativeHeadlineNode), true, "tool switching retains the mounted native headline field");
        assert.equal(await headline.inputValue(), `Preserved title ${width}`);
        assert.equal(await venue.inputValue(), "The host's chosen venue");
        assert.equal(writes.length, before, "switching native page tools never saves or publishes");
      }
      const assertMainEditMenu = async (context) => {
        assert.equal(await controls.isVisible(), true, `${context}: Back keeps Edit open`);
        assert.equal(await controls.getByRole("button", { name: /^Headline/ }).isVisible(), true, `${context}: Back returns to the main Edit menu`);
        assert.equal(await headline.isVisible(), false, `${context}: Back also closes the native submenu beneath a shared tool`);
        assert.deepEqual(await toolRow.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-pressed"))), ["false", "false", "false"], `${context}: no shared tool remains active`);
        assert.equal(await page.getByRole("dialog").count(), 0, `${context}: local Back never asks to discard edits`);
        assert.equal(new URL(page.url()).pathname, "/event/general/customize", `${context}: local Back stays in the editor`);
        assert.equal(writes.length, before, `${context}: local Back never saves or publishes`);
      };
      for (const name of ["Page sections", "Layout", "Custom URL"]) {
        if (name !== "Page sections") {
          await controls.getByRole("button", { name: /^Headline/ }).click();
          await toolRow.getByRole("button", { name, exact: true }).click();
        }
        await click("Back to details");
        await assertMainEditMenu(name);
      }
      await controls.getByRole("button", { name: /^Headline/ }).click();
      assert.equal(await headline.isVisible(), true, "reopening Headline restores its preserved values");
      assert.equal(await headline.inputValue(), `Preserved title ${width}`, "all shared-tool Back steps retain the pending headline");
      assert.equal(await venue.inputValue(), "The host's chosen venue", "all shared-tool Back steps retain the pending venue");
      await click("Back to details");
      await assertMainEditMenu("Headline");
      await controls.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      const last = await controls.getByRole("button", { name: /^Passcode/ }).boundingBox();
      const footerTop = await page.getByRole("group", { name: "Save event", exact: true }).evaluate((element) => element.closest("footer").getBoundingClientRect().top);
      assert.ok(last.y + last.height <= footerTop + 1, "last settings row scrolls clear of sticky actions even in landscape");
      await checkTouchActions();
      assert.equal(writes.length, before, "opening Edit and Preview never saves or publishes");
      await page.screenshot({ path: path.join(output, `compact-settings-${width}-${height}.png`) });
      await switchView("Preview");
      assert.equal(await controls.isVisible(), false, "Preview from the main Edit menu collapses the editing panel");
      assert.equal(await preview.isVisible(), true);
      await viewActions.getByRole("button", { name: "Edit", exact: true }).waitFor();
      assert.equal(await page.getByRole("dialog").count(), 0, "returning to preview retains unsaved edits without a prompt");
      assert.equal(writes.length, before, "returning to preview never saves or publishes");
      await leave();
      await page.getByRole("dialog").waitFor();
      assert.equal(new URL(page.url()).pathname, "/event/general/customize", "app navigation protects unsaved template edits from preview");
      await click("Keep editing");
      await switchView("Edit");
      await controls.getByRole("button", { name: /^Headline/ }).click();
      assert.equal(await headline.inputValue(), `Preserved title ${width}`);
      await click("Back to details");
      await assertMainEditMenu("Headline after cancelling exit");
      await switchView("Preview");
      await leave();
      await click("Discard and leave");
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/chosen-destination", `discarding holiday edits follows app navigation at ${width}×${height}`);
      assert.equal(writes.length, before, "discarding a template never saves or publishes");
    }
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
    assert.equal(await page.getByRole("dialog").count(), 0, "leaving temporary hotel fields never prompts to discard");
    await click("Back to details");
    assert.equal(await weddingControls.getByRole("button", { name: /^Travel/ }).isVisible(), true, "Travel Back returns to the main Edit menu");
    assert.equal(await viewActions.getByRole("button", { name: "Preview", exact: true }).isVisible(), true);
    assert.equal(await page.getByRole("dialog").count(), 0);
    await switchView("Preview");
    assert.equal(await weddingControls.isVisible(), false, "wedding Preview collapses the editing panel");
    assert.equal(await preview.isVisible(), true);
    assert.equal(await page.getByRole("dialog").count(), 0);
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
    assert.equal(await viewActions.getByRole("button", { name: "Edit", exact: true }).isVisible(), true);
    assert.equal(await page.getByRole("dialog").count(), 0, "all wedding Back steps within the editor stay prompt-free");
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeWeddingNavigation, "wedding menu navigation never writes event content or URLs");
    await leave();
    await page.getByRole("dialog").waitFor();
    await click("Discard and leave");
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/chosen-destination");
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeWeddingNavigation);

    // Embedded editors retain subsection navigation and protect app navigation without a footer Back action.
    const beforeEmbeddedNavigation = { event: writes.length, url: urlWrites.length };
    await page.goto(`${base}/event/general/customize?embed=1`);
    await workspace.waitFor();
    const embeddedControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    assert.equal(await workspace.getAttribute("data-embedded"), "true");
    assert.equal(await embeddedControls.isVisible(), true);
    assert.equal(await viewActions.count(), 0, "embedded editors expose no unavailable Preview/Edit toggle");
    await embeddedControls.getByRole("button", { name: /^Event details/ }).click();
    const embeddedTitle = page.getByLabel("Event title", { exact: true });
    await embeddedTitle.fill("Pending embedded event");
    await click("Back to details");
    assert.equal(await embeddedControls.getByRole("button", { name: /^Event details/ }).isVisible(), true, "embedded subsection Back returns to its main menu");
    assert.equal(await embeddedControls.isVisible(), true, "embedded Back never opens an unavailable preview view");
    assert.equal(await embeddedTitle.isVisible(), false);
    assert.equal(await embeddedTitle.inputValue(), "Pending embedded event");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeEmbeddedNavigation);
    await leave();
    await page.getByRole("dialog").waitFor();
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
    assert.equal(await preview.isVisible(), true, "desktop Event Pages retain the page beside the expanded panel");
    assert.equal(await page.getByRole("complementary", { name: "Event editing controls", exact: true }).isVisible(), true, "saved Event Pages open with expanded editing controls");
    await viewActions.getByRole("button", { name: "Preview", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Save draft", exact: true }).count(), 0);
    await switchView("Preview");
    await switchView("Edit");
    assert.equal(writes.length, 0);
    await page.getByRole("button", { name: /Event details/ }).click();
    const title = page.getByLabel("Event title", { exact: true });
    await title.fill("Changed field trip");
    await page.getByRole("button", { name: "Save changes", exact: true }).waitFor();
    await title.fill("School field trip");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .waitFor({ state: "hidden" });
    await title.fill("Updated field trip");
    await click("Save changes");
    await page.locator("[data-destination]").waitFor();
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
    await page.locator("[data-leave]").click();
    await page.getByRole("dialog").waitFor();
    await click("Save and leave");
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/chosen-destination");
    assert.equal(writes.at(-1).body.data.status, "published");
    assert.equal(writes.at(-1).body.data.fields.title, "Saved before leaving");

    await page.goto(`${base}/event/general/customize?edit=saved-event`);
    await openControls();
    await page.getByRole("button", { name: /Event details/ }).click();
    await title.fill("Keep this unsaved title");
    failSave = true;
    await click("Save changes");
    await page.getByRole("alert").filter({ hasText: "Another co-host saved" }).waitFor();
    assert.equal(await title.inputValue(), "Keep this unsaved title");
    assert.equal(new URL(page.url()).pathname, "/event/general/customize");
    failSave = false;
    await page.locator("[data-leave]").click();
    await click("Discard and leave");

    // Exercise the actual generated/uploaded editor, native sections and artwork, at both sizes.
    for (const mode of ["create", "upload"]) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        const before = writes.length;
        await page.goto(`${base}/event/design/customize?mode=${mode}`);
        await workspace.waitFor();
        await page.getByRole("complementary", { name: "Event editing controls", exact: true }).waitFor();
        assert.equal(await preview.isVisible(), width >= 768, `${mode} shares the desktop canvas and hides the phone canvas while expanded`);
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
        assert.equal(await page.getByRole("dialog").count(), 0, "custom subsection Back never prompts to discard edits");
        await switchView("Preview");
        assert.equal(await controls.isVisible(), false, "custom Preview collapses the editing panel");
        assert.equal(await preview.isVisible(), true);
        assert.equal(await page.getByRole("dialog").count(), 0, "custom Preview keeps unsaved content without prompting");
        assert.equal(writes.length, before, "custom subsection and Preview transitions never save or publish");
        await switchView("Edit");
        await controls.getByRole("button", { name: /^Event details/ }).click();
        assert.equal(await title.inputValue(), `${mode} event ${width}`);
        await page.getByRole("button", { name: /Page sections/ }).click();
        await click("Back to details");
        assert.equal(await controls.getByRole("button", { name: /^Event details/ }).isVisible(), true, "custom shared-tool Back closes its underlying details submenu");
        assert.equal(await title.isVisible(), false);
        assert.equal(await title.inputValue(), `${mode} event ${width}`);
        assert.equal(await page.getByRole("dialog").count(), 0);
        assert.equal(writes.length, before, "custom shared-tool Back keeps content in memory");
        await page.getByRole("button", { name: /Page sections/ }).click();
        assert.equal(await controls.getByRole("button", { name: "Add section", exact: true }).count(), 0, "section choices are available without opening a chooser");
        assert.equal(await controls.getByRole("button", { name: /^Schedule Times/ }).count(), 0, "an existing custom schedule is reused");
        await controls.getByRole("button", { name: /^Accessibility Access/ }).click();
        assert.equal(await page.getByRole("dialog").count(), 1, "a preset opens its fields directly");
        assert.equal(await page.getByLabel("Section heading", { exact: true }).inputValue(), "Accessibility");
        assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "", "presets do not invent event facts");
        await page.getByLabel("Section content", { exact: true }).fill("Step-free entrance beside the north lot.");
        await click("Done");
        await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Edit Accessibility");
        await controls.getByRole("button", { name: "Edit Schedule", exact: true }).click();
        await page.getByLabel("Section heading", { exact: true }).fill("Itinerary");
        await click("Done");
        const removedSection = mode === "upload" && width === 390;
        if (removedSection) {
          await controls.getByRole("button", { name: "Remove Parking section", exact: true }).click();
          assert.equal(await controls.getByRole("button", { name: "Edit Parking", exact: true }).count(), 0);
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
        await page.getByRole("button", { name: /Page sections/ }).click();
        if (removedSection)
          assert.equal(await controls.getByRole("button", { name: "Edit Parking", exact: true }).count(), 0);
        await controls.getByRole("button", { name: "Edit Itinerary", exact: true }).click();
        assert.equal(
          await page.getByLabel("Section heading", { exact: true }).inputValue(),
          "Itinerary",
        );
        await click("Done");
        await checkActionPlacement();
        await click("Back to details");
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
          assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
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
          await click("Save changes");
          await page.locator("[data-destination]").waitFor();
          assert.equal(writes.at(-1).path, `/api/history/${savedId}`);
          assert.equal(writes.at(-1).body.data.status, "published");
          assert.equal(writes.at(-1).body.data.customEventPage.details.title, "Published upload update");
          assert.equal(writes.at(-1).body.data.customEventPage.details.date, "2026-11-02");
          assert.equal(writes.at(-1).revision, "custom-link-saved");
          assert.equal(writes.at(-1).body.data.publicSlug, "gateway-field-trip-2nd-grade-2026");
        }
      }
    }
    for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/event/general/customize?mode=manual`);
    await workspace.waitFor();
    await openControls();
    assert.equal(await preview.isVisible(), width >= 768, `General starts with expanded controls at ${width}px`);
    await page.getByRole("button", { name: /^Headline/ }).click();
    const generalTitle = page.getByLabel("Headline", { exact: true });
    await generalTitle.fill("Community gathering");
    if (width === 1440) await checkPreviewScroll("native General desktop editor");
    await switchView("Preview");
    if (width === 390) await checkGuestActionRow(preview.getByRole("region", { name: "Plan your visit", exact: true }), "native General mobile preview");
    await checkPreviewScroll(`native General ${width}px preview`);
    await switchView("Edit");
    const generalControls = page.getByRole("complementary", { name: "Event editing controls" });
    const beforeComposition = writes.length;
    await generalControls.getByRole("button", { name: /^Layout/ }).click();
    assert.equal(await page.getByText("Template layout", { exact: true }).count(), 0);
    assert.equal(await generalControls.getByRole("combobox").count(), 0, "Layout offers premade hero thumbnails without form controls");
    assert.equal(await generalControls.getByRole("slider").count(), 0);
    await page.getByRole("button", { name: "Choose Image right hero layout", exact: true }).click();
    await page.locator('[data-event-hero][data-image-position="right"][data-image-shape="square"]').first().waitFor({ state: "attached" });
    const nativeReset = generalControls.getByRole("button", { name: "Reset", exact: true });
    assert.equal(await nativeReset.evaluate((node) => node.parentElement.querySelector("h2")?.textContent), "Layout", "native Reset shares the Layout heading row");
    const nativeResetBox = await nativeReset.boundingBox();
    const nativeLayoutHeadingBox = await generalControls.getByRole("heading", { name: "Layout", exact: true }).boundingBox();
    assert.ok(nativeResetBox.x >= nativeLayoutHeadingBox.x + nativeLayoutHeadingBox.width - 1, "native Reset sits beside Layout");
    assert.ok(Math.abs(nativeResetBox.y + nativeResetBox.height / 2 - nativeLayoutHeadingBox.y - nativeLayoutHeadingBox.height / 2) < 1, "native Reset aligns with Layout");
    await click("Back to details");
    await generalControls.getByRole("button", { name: /^Page sections/ }).click();
    assert.equal(await generalControls.getByRole("button", { name: "Add section", exact: true }).count(), 0);
    const starters = generalControls.getByRole("group", { name: "Predefined sections" });
    assert.equal(await starters.getByRole("button").count(), 14, "all thirteen starters and Other are inline");
    assert.match(await starters.getByRole("button").last().textContent(), /^Other/, "Other stays last");
    await page.addStyleTag({ content: fs.readFileSync("src/styles/app-appearance.css", "utf8") });
    for (const appearance of ["light", "dark"]) {
      await page.evaluate(({ appearance, variables }) => {
        document.documentElement.classList.toggle("dark", appearance === "dark");
        for (const [name, value] of Object.entries(variables)) document.documentElement.style.setProperty(name, value);
      }, { appearance, variables: resolveThemeCssVariables("general", appearance) });
      const geometry = await starters.evaluate((element) => ({
        overflow: element.scrollWidth - element.clientWidth,
        buttons: [...element.querySelectorAll("button")].map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height, background: getComputedStyle(button).backgroundColor };
        }),
      }));
      assert.ok(geometry.overflow <= 1, `${appearance} section choices fit the ${width}px panel`);
      assert.ok(geometry.buttons.every(({ width, height, background }) => width >= 44 && height >= 44 && background !== "rgba(0, 0, 0, 0)"), "section choices keep readable surfaces and touch targets");
      await page.screenshot({ path: path.join(output, `section-library-${appearance}-${width}.png`) });
    }
    await page.evaluate(() => { document.documentElement.classList.remove("dark"); document.documentElement.removeAttribute("style"); });
    await starters.getByRole("button", { name: /^Parking & arrival/ }).click();
    assert.equal(await page.getByRole("dialog").count(), 1, "the choice goes straight to section editing");
    assert.equal(await page.getByLabel("Section heading", { exact: true }).inputValue(), "Parking & arrival");
    assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "");
    await page.getByLabel("Section heading", { exact: true }).fill("Travel & parking");
    await page.getByLabel("Section content", { exact: true }).fill("Use the east lot. Meet by the entrance.");
    await click("Done");
    // Undo an addition without throwing away the new section's text; it can be restored.
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await generalControls.getByRole("button", { name: "Edit Travel & parking", exact: true }).count(), 0);
    await generalControls.getByRole("button", { name: "Travel & parking", exact: true }).click();
    assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "Use the east lot. Meet by the entrance.");
    await click("Done");
    await generalControls.getByRole("button", { name: "Move Travel & parking up", exact: true }).click();
    await generalControls.getByRole("button", { name: "Move Travel & parking up", exact: true }).click();
    assert.match(await generalControls.getByRole("list", { name: "Page section order" }).locator("li").first().textContent(), /Travel & parking/);
    await generalControls.getByRole("button", { name: "Edit Details", exact: true }).click();
    await page.getByLabel("Description", { exact: true }).fill("Bring water and join the gathering.");
    await click("Done");
    await generalControls.getByRole("button", { name: "Remove Travel & parking section", exact: true }).click();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(writes.length, beforeComposition, "section and layout edits stay in memory");
    await click("Save draft");
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    const generalId = new URL(page.url()).searchParams.get("edit");
    assert.equal(writes.at(-1).body.data.manualEditor.snapshot.data.title, "Community gathering");
    const composition = writes.at(-1).body.data.eventPageComposition;
    assert.equal(composition.layout, undefined, "hero edits do not create a body layout override");
    assert.equal(composition.hero.imagePosition, "right");
    assert.equal(composition.hero.imageShape, "square");
    assert.deepEqual(composition.sections.map(({ title, body }) => ({ title, body })), [{ title: "Travel & parking", body: "Use the east lot. Meet by the entrance." }]);
    assert.equal(composition.sectionLayout.order[0], composition.sections[0].id);
    await page.reload();
    await openControls();
    await page.locator('[data-event-hero][data-image-position="right"][data-image-shape="square"]').first().waitFor({ state: "attached" });
    await generalControls.getByRole("button", { name: /^Page sections/ }).click();
    await generalControls.getByRole("button", { name: "Edit Travel & parking", exact: true }).click();
    assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "Use the east lot. Meet by the entrance.");
    await click("Done");
    await page.screenshot({ path: path.join(output, `general-sections-${width}.png`) });
    if (width === 1440) {
      const firstCard = await preview.locator('[data-section-row]').nth(0).boundingBox();
      const secondCard = await preview.locator('[data-section-row]').nth(1).boundingBox();
      assert.ok(secondCard.y >= firstCard.y + firstCard.height - 1, "hero layout changes keep native sections stacked while editing");
    }
    await switchView("Preview");
    await page.screenshot({ path: path.join(output, `general-preview-${width}.png`) });
    await switchView("Edit");
    await click("Back to details");
    await page.getByRole("button", { name: /^Headline/ }).click();
    assert.equal(await generalTitle.inputValue(), "Community gathering");
    await generalTitle.fill("Pending native event title");
    await generalTitle.evaluate((element) => { window.savedNativeHeadlineNode = element; });
    const savedTools = generalControls.getByRole("group", { name: "Page tools", exact: true });
    const beforeToolSwitching = { event: writes.length, url: urlWrites.length };
    await savedTools.getByRole("button", { name: "Custom URL", exact: true }).click();
    const pendingUrl = page.getByRole("textbox", { name: "Custom URL", exact: true });
    await pendingUrl.fill(`pending-native-${width}-address`);
    await pendingUrl.evaluate((element) => { window.savedNativeUrlNode = element; });
    for (const label of ["Layout", "Page sections", "Custom URL"]) {
      await savedTools.getByRole("button", { name: label, exact: true }).click();
      assert.equal(await savedTools.isVisible(), true, "saved native pages retain the tools row while switching panels");
      assert.equal(await savedTools.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), "true");
      assert.equal(await generalTitle.evaluate((element) => element === window.savedNativeHeadlineNode), true, "saved native tool switching preserves the title node");
      assert.equal(await generalTitle.inputValue(), "Pending native event title");
    }
    assert.equal(await pendingUrl.inputValue(), `pending-native-${width}-address`, "native tool switching preserves unsaved URL text");
    assert.equal(await pendingUrl.evaluate((element) => element === window.savedNativeUrlNode), true, "native tools retain the mounted URL field");
    assert.deepEqual({ event: writes.length, url: urlWrites.length }, beforeToolSwitching, "native tool switching saves neither event content nor its URL");
    await click("Back to details");
    await generalControls.getByRole("button", { name: /^Headline/ }).click();
    await generalTitle.fill("Community gathering");
    await click("Publish");
    await page.locator("[data-destination]").waitFor();
    assert.equal(writes.at(-1).path, `/api/history/${generalId}`);
    assert.equal(writes.at(-1).body.data.status, "published");
    assert.equal(writes.at(-1).body.data.manualEditor, null);
    assert.deepEqual(writes.at(-1).body.data.eventPageComposition, composition);
    }
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
    await birthdayControls.getByRole("button", { name: /^Page sections/ }).click();
    await page.getByRole("button", { name: /^Other/ }).click();
    await page.getByLabel("Section heading", { exact: true }).fill("Dress code");
    await page.getByLabel("Section content", { exact: true }).fill("Wear comfortable shoes.");
    await click("Done");
    await click("Back to details");
    await birthdayControls.getByRole("button", { name: /^Layout/ }).click();
    await page.getByRole("button", { name: "Choose Title first hero layout", exact: true }).click();
    await click("Back to details");
    await click("Save draft");
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    const draft = writes.at(-1).body;
    assert.equal(draft.data.templateEditor.snapshot.data.childName, "Olivia");
    assert.equal(draft.data.templateEditor.templateId, "candy-dreams");
    assert.equal(draft.data.eventPageComposition.layout, undefined);
    assert.equal(draft.data.eventPageComposition.hero.imageShape, "landscape");
    assert.equal(draft.data.eventPageComposition.hero.titlePosition, "above");
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
    assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
    await name.fill("Updated Olivia");
    await click("Save changes");
    await page.locator("[data-destination]").waitFor();
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
    await page.getByRole("button", { name: "Save changes", exact: true }).waitFor();
    await name.fill("Updated Olivia");
    await page.getByRole("button", { name: "Save changes", exact: true }).waitFor({state:"hidden"});
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.screenshot({ path: path.join(output, "birthday-editor-desktop.png") });

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
      await preview.getByRole("button", { name: `Edit ${label.toLowerCase()}`, exact: true }).click();
      await preview.getByLabel(label, { exact: true }).fill(value);
      await preview.getByRole("button", { name: `Done editing ${label.toLowerCase()}`, exact: true }).click();
    };
    if (process.env.EVENT_EDITOR_SKIP_GYM_WORDING !== "1") for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 760 });
      await page.goto(gymUrl);
      await openControls();
      await gymControls.getByRole("button", { name: /^Custom URL/ }).click();
      await page.getByRole("textbox", { name: "Custom URL", exact: true }).waitFor();
      await page.getByRole("button", { name: "Back to details", exact: true }).click();
      await gymControls.getByRole("button", { name: /^Event basics/ }).click();
      await page.getByLabel("Event Title", { exact: true }).waitFor();
      const beforeGym = writes.length;
      if (width === 390) await viewActions.getByRole("button", { name: "Close settings", exact: true }).click();
      for (const [label, value] of Object.entries(wording)) await editWording(label, value);
      await editWording("Event title", `Gasparilla Classic ${width}`);
      await editWording("Display date", "March 6–8, 2027");
      await editWording("Venue", "Tampa Convention Center — East Hall");
      await editWording("Address", "");
      await preview.getByRole("button", { name: "Edit address", exact: true }).click();
      await preview.getByLabel("Address", { exact: true }).fill("333 S Franklin St, Tampa, FL 33602");
      await preview.getByRole("button", { name: "Done editing address", exact: true }).click();
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
      await gymControls.getByRole("button", { name: /^Image position/ }).click();
      await page.getByRole("combobox", { name: "Image fit", exact: true }).selectOption("contain");
      assert.equal(await page.getByRole("slider", { name: "Vertical position", exact: true }).isDisabled(), true);
      await page.getByRole("combobox", { name: "Image fit", exact: true }).selectOption("cover");
      const position = page.getByRole("slider", { name: "Vertical position", exact: true });
      await position.focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowRight");
      await click("Back to details");
      await gymControls.getByRole("button", { name: /^Design/ }).click();
      await page.getByLabel("Title font", { exact: true }).selectOption("montserrat");
      assert.equal(writes.length, beforeGym, "wording and settings remain unsaved until an explicit save");
      if (width === 390) await viewActions.getByRole("button", { name: "Close settings", exact: true }).click();
      assert.match(await preview.locator("h1").evaluate((element) => element.style.fontFamily), /Gym Montserrat/);
      await preview.getByRole("button", { name: "Preview event", exact: true }).click();
      const fullscreen = page.getByRole("dialog", { name: "Event preview", exact: true });
      await fullscreen.waitFor();
      assert.equal(await fullscreen.locator('button[aria-label^="Edit "]').count(), 0, "fullscreen preview has no wording editors");
      assert.equal(await fullscreen.getByRole("button", { name: "Change hero image", exact: true }).count(), 0);
      await click("Close preview");
      if (width === 390) await viewActions.getByRole("button", { name: "Page settings", exact: true }).click();
      assert.equal(await page.getByLabel("Title font", { exact: true }).inputValue(), "montserrat");
      await click("Save draft");
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const gymSaved = writes.at(-1).body.data;
      assert.equal(gymSaved.gymnasticsTitleFont, "montserrat");
      assert.equal(gymSaved.heroImageSettings.positionY, 1);
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
        await gymControls.getByRole("button", { name: /^Design/ }).click();
      }
      assert.equal(await page.getByLabel("Title font", { exact: true }).inputValue(), "montserrat", "saved font reloads in the actual editor");
      await viewActions.getByRole("button", { name: "Close settings", exact: true }).click();
      const settingsButton = viewActions.getByRole("button", { name: "Page settings", exact: true });
      assert.equal(await settingsButton.evaluate((element) => Boolean(element.closest("footer")?.querySelector('[aria-label="Save event"]'))), true, "Page settings shares the bottom bar with save actions");
      const settingsToggle = await settingsButton.boundingBox();
      const saveButtons = await page.getByRole("group", { name: "Save event", exact: true }).boundingBox();
      assert.ok(settingsToggle.y + settingsToggle.height <= 760, "Page settings stays inside the viewport");
      if (width === 390) assert.ok(settingsToggle.y + settingsToggle.height <= saveButtons.y, "phone settings sit above the save row without overlapping");
      for (const value of Object.values(wording)) assert.ok((await preview.textContent()).includes(value), `saved wording reloads: ${value}`);
      assert.match(await preview.locator("h1").evaluate((element) => element.style.fontFamily), /Gym Montserrat/);
      await page.screenshot({ path: path.join(output, `gymnastics-wording-${width}.png`) });
    }

    // Typed sections retain uploaded photos and working links through each editor's save/reload path.
    for (const { editorPath, custom, width, dark } of [
      { editorPath: "/event/general/customize?mode=manual", custom: false, width: 1440, dark: false },
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
      await controls.getByRole("button", { name: /^Page sections/ }).click();
      const choices = controls.getByRole("group", { name: "Predefined sections", exact: true });
      assert.match(await choices.getByRole("button").last().textContent(), /^Other/, "Other stays last in both editors");
      await choices.getByRole("button", { name: /^Photo gallery/ }).click();
      assert.equal(await page.getByLabel("Section heading", { exact: true }).inputValue(), "Photo gallery");
      failNextGalleryUpload = !custom;
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
      await choices.getByRole("button", { name: /^Links Useful/ }).click();
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
      await choices.getByRole("button", { name: /^Other/ }).click();
      assert.equal(await page.getByLabel("Section heading", { exact: true }).inputValue(), "Information");
      await page.getByLabel("Section heading", { exact: true }).fill("Guest notes");
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
      await controls.getByRole("button", { name: /^Page sections/ }).click();
      await controls.getByRole("button", { name: "Edit Photo gallery", exact: true }).click();
      assert.equal(await page.getByLabel("Photo 1 caption", { exact: true }).inputValue(), "Group picnic");
      await click("Remove photo 2");
      assert.equal(await page.getByLabel("Photo 2 caption", { exact: true }).count(), 0);
      await click("Done");
      await controls.getByRole("button", { name: "Remove Links section", exact: true }).click();
      await click("Undo");
      await controls.getByRole("button", { name: "Edit Links", exact: true }).click();
      assert.equal(await page.getByLabel("Link 1 URL", { exact: true }).inputValue(), "https://example.com/parking");
      await click("Done");
    }

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
    await gymControls.getByRole("button", { name: /^Event basics/ }).click();
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
    assert.ok(gymCoreStatusReads > 0, "the editor polls optional enrichment after opening the core draft");
    const completedEvent = { ...coreEvent, title: "Provider's later title", venue: "Enriched arena", address: "Verified address", extra: { meetDateRangeLabel: "November 6–8, 2026" } };
    records.set(coreRow.id, {
      ...coreRow, title: completedEvent.title, revision: "core-v2",
      data: {
        ...coreRow.data, ...completedEvent,
        builderDraft: { ...coreRow.data.builderDraft, event: completedEvent, venue: { venue: completedEvent.venue, address: completedEvent.address }, advancedSections: { meet: { judgingNotes: "New judging details from enrichment." } } },
        pipelineSummary: { ...coreRow.data.pipelineSummary, processingStage: "review_ready" },
      },
    });
    gymCoreCompleted = true;
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
    await click("Leave for chosen destination");
    await click("Save and leave");
    await page.getByRole("alert").filter({ hasText: "Save and continue" }).waitFor();
    assert.equal(writes.length, savedWriteCount, "leaving cannot claim to save an unsigned event");
    assert.equal(await page.locator("[data-destination]").count(), 0);
    await click("Keep editing");
    assert.equal(await name.inputValue(), "Unsigned host changes");
  } catch (failure) {
    await page.screenshot({ path: path.join(output, "failure.png") });
    throw new Error(
      `${failure.message}\nURL: ${page.url()}\nAlerts: ${JSON.stringify(await page.getByRole("alert").allTextContents())}\nWrites: ${JSON.stringify(writes)}\nBrowser errors: ${errors.join("\n")}`,
      { cause: failure },
    );
  } finally {
    await browser.close();
  }
});
