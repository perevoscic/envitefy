const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
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
      '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/birthdays/customize/page.tsx"; @source "../src/components/templates/TemplateEditorContext.tsx";',
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
    records = new Map();
  let failSave = false;
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
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (req.method() === "GET")
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(records.get(id)),
        });
      const body = req.postDataJSON();
      writes.push({
        path: url.pathname,
        method: req.method(),
        body,
        revision: req.headers()["if-match"],
      });
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
    if (url.origin === base)
      return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}[data-leave]{position:fixed;bottom:90px;left:20px;z-index:50}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
      });
    return route.abort();
  });
  const click = (name) => page.getByRole("button", { name, exact: true }).click();
  const workspace = page.locator("[data-event-page-editor]");
  const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
  const viewActions = page.getByRole("group", { name: "Editor view", exact: true });
  const checkActionPlacement = async () => {
    const bounds = await workspace.boundingBox();
    const actions = page.getByRole("group", { name: "Save event", exact: true });
    const footer = await actions.evaluate((element) => {
      const rect = element.parentElement.getBoundingClientRect();
      return { x: rect.x, width: rect.width, bottom: rect.bottom };
    });
    assert.ok(Math.abs(footer.bottom - (bounds.y + bounds.height)) < 1, "save actions overlay the bottom of the workspace");
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
  const checkPreviewScroll = async (context) => {
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true, includeHidden: true });
    const panelTop = await controls.evaluate((element) => element.scrollTop);
    const windowTop = await page.evaluate(() => scrollY);
    const header = await viewActions.boundingBox();
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
    assert.deepEqual(await viewActions.boundingBox(), header);
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
    await page.goto(`${base}/event/general/customize?edit=saved-event`);
    await workspace.waitFor();
    await page.getByRole("heading", { name: "School field trip", exact: true }).waitFor();
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
        await page.getByRole("button", { name: /Event details/ }).click();
        await title.fill(`${mode} event ${width}`);
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
        await click("Back to details");
        await page.getByRole("button", { name: /Page sections/ }).click();
        const controls = page.getByRole("complementary", { name: "Event editing controls" });
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
        if (removedSection)
          assert.ok(writes.at(-1).body.data.customEventPage.details.sectionLayout.hidden.includes("section:1"));
        const savedUrl = page.url();
        assert.ok(new URL(savedUrl).searchParams.has("edit"));
        await page.reload();
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
        const lastMenu = await controls.getByRole("button", { name: /^Public link/ }).boundingBox();
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
          await page.reload();
          await page.getByRole("button", { name: /Event details/ }).click();
          assert.equal(await page.getByRole("button", { name: "Save draft", exact: true }).count(), 0);
          assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
          await title.fill("Published upload update");
          await click("Save changes");
          await page.locator("[data-destination]").waitFor();
          assert.equal(writes.at(-1).path, `/api/history/${savedId}`);
          assert.equal(writes.at(-1).body.data.status, "published");
          assert.equal(writes.at(-1).body.data.customEventPage.details.title, "Published upload update");
        }
      }
    }
    for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/event/general/customize?mode=manual`);
    await workspace.waitFor();
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
    await page.getByRole("button", { name: "Choose Cards layout", exact: true }).click();
    await page.locator('[data-event-body-layout="cards"]').first().waitFor({ state: "attached" });
    await click("Back to details");
    await generalControls.getByRole("button", { name: /^Page sections/ }).click();
    await generalControls.getByRole("button", { name: "Add section", exact: true }).click();
    await page.getByRole("button", { name: /^Custom section/ }).click();
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
    assert.equal(composition.layout, "cards");
    assert.deepEqual(composition.sections.map(({ title, body }) => ({ title, body })), [{ title: "Travel & parking", body: "Use the east lot. Meet by the entrance." }]);
    assert.equal(composition.sectionLayout.order[0], composition.sections[0].id);
    await page.reload();
    await page.locator('[data-event-body-layout="cards"]').first().waitFor({ state: "attached" });
    await generalControls.getByRole("button", { name: /^Page sections/ }).click();
    await generalControls.getByRole("button", { name: "Edit Travel & parking", exact: true }).click();
    assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "Use the east lot. Meet by the entrance.");
    await click("Done");
    await page.screenshot({ path: path.join(output, `general-sections-${width}.png`) });
    if (width === 1440) {
      const firstCard = await preview.locator('[data-section-row]').nth(0).boundingBox();
      const secondCard = await preview.locator('[data-section-row]').nth(1).boundingBox();
      assert.ok(Math.abs(firstCard.y - secondCard.y) < 1, "Cards layout retains two columns while editing");
    }
    await switchView("Preview");
    await page.screenshot({ path: path.join(output, `general-preview-${width}.png`) });
    await switchView("Edit");
    await click("Back to details");
    await page.getByRole("button", { name: /^Headline/ }).click();
    assert.equal(await generalTitle.inputValue(), "Community gathering");
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
    await birthdayControls.getByRole("button", { name: "Add section", exact: true }).click();
    await page.getByRole("button", { name: /^Custom section/ }).click();
    await page.getByLabel("Section heading", { exact: true }).fill("Dress code");
    await page.getByLabel("Section content", { exact: true }).fill("Wear comfortable shoes.");
    await click("Done");
    await click("Back to details");
    await birthdayControls.getByRole("button", { name: /^Layout/ }).click();
    await page.getByRole("button", { name: "Choose Minimal layout", exact: true }).click();
    await click("Back to details");
    await click("Save draft");
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    const draft = writes.at(-1).body;
    assert.equal(draft.data.templateEditor.snapshot.data.childName, "Olivia");
    assert.equal(draft.data.templateEditor.templateId, "candy-dreams");
    assert.equal(draft.data.eventPageComposition.layout, "minimal");
    assert.equal(draft.data.eventPageComposition.sections[0].body, "Wear comfortable shoes.");
    const templateId = new URL(page.url()).searchParams.get("edit");
    const templateRow = records.get(templateId);
    templateRow.data.status = "published";
    templateRow.data.draftStatus = "published";
    templateRow.data.numberOfGuests = 7;
    const editUrl = `${base}/birthdays/templates/candy-dreams/customize?mode=template&edit=${templateId}`;
    await page.goto(editUrl);
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
    await name.waitFor();
    assert.equal(await name.inputValue(), "Updated Olivia");
    await name.fill("Reverted edit");
    await page.getByRole("button", { name: "Save changes", exact: true }).waitFor();
    await name.fill("Updated Olivia");
    await page.getByRole("button", { name: "Save changes", exact: true }).waitFor({state:"hidden"});
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.screenshot({ path: path.join(output, "birthday-editor-desktop.png") });
    const savedWriteCount = writes.length;
    await page.goto(`${base}/birthdays/templates/candy-dreams/customize?mode=template&signedOut=1`);
    await workspace.waitFor();
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
