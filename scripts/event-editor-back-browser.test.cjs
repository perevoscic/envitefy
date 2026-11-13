const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { resolveThemeCssVariables } = loadTs("src/themes/registry.ts");
const appearanceBootstrap = loadTs("src/lib/appearance.ts").buildAppearanceBootstrap();
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("Current Event Pages retain blank drafts, recover edits and protect navigation", {
  timeout: 180000,
}, async () => {
  const output = path.resolve(".qa/event-editor-back-browser", String(process.pid));
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }), new compiled.webpack.DefinePlugin({
        "process.env": JSON.stringify({ NODE_ENV: "development" }),
      })],
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
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => {
      if (error || stats?.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
      else resolve();
    }));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/general/customize/page.tsx"; @source "../src/app/event/gymnastics/customize/page.tsx"; @source "../src/components/events"; @source "../src/components/templates/TemplateEditorContext.tsx";',
    { from: path.resolve("scripts/event-editor-fixture.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const themeVariables = mode => Object.entries(resolveThemeCssVariables("general", mode)).map(([key, value]) => `${key}:${value}`).join(";");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(10000);
  const errors = [], writes = [], records = new Map();
  const base = "http://localhost:43129";
  records.set("published-event", {
    id: "published-event", title: "School field trip", revision: "published-v1", public_slug: "school-trip",
    data: { status: "published", fields: { title: "School field trip", description: "Bring water.", sections: [] } },
  });
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/*", async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (request.method() === "GET") {
        const row = records.get(id);
        return route.fulfill({ status: row ? 200 : 404, contentType: "application/json", body: JSON.stringify(row ? { ...row, permissions: { role: "owner", canManageCollaborators: true } } : { error: "Not found" }) });
      }
      const body = request.postDataJSON();
      writes.push({ path: url.pathname, method: request.method(), body });
      const nextId = id || `draft-${writes.length}`;
      const previous = records.get(nextId);
      const row = {
        id: nextId, title: body.title, data: body.data, revision: `saved-${writes.length}`,
        public_slug: previous?.public_slug || (body.title === "Event draft" ? "event-draft" : nextId),
      };
      records.set(nextId, row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname === "/api/event-themes/generate") {
      const body = request.postDataJSON();
      assert.equal(body.mode, "wording", "Back must never generate artwork");
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ details: body.currentDetails }) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base && /\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(`${path.resolve("public")}${path.sep}`) && fs.existsSync(asset)) return route.fulfill({ path: asset });
    }
    if (url.origin === base) return route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}:root{${themeVariables("light")}}html.dark{${themeVariables("dark")}}body{margin:0}[data-leave]{display:none;position:fixed;top:0;left:0;z-index:50}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
    });
    return route.abort();
  });
  const workspace = page.locator("[data-event-page-editor]");
  const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
  const actions = page.getByRole("group", { name: "Save event", exact: true });
  const leaveEditor = async () => {
    await workspace.getByRole("button", { name: /^Exit(?: [Ee]diting)?$/, exact: true }).click();
  };
  const openDetails = async () => {
    const edit = workspace.getByRole("button", { name: /^(Edit|Continue editing|Close preview)$/ });
    if (await edit.isVisible()) await edit.click();
    await controls.waitFor();
    const menu = controls.getByRole("button", { name: /^Event details/ });
    if (await menu.isVisible()) await menu.click();
    await page.getByLabel("Event title", { exact: true }).waitFor();
  };
  try {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/event/design/customize?mode=create`);
      await workspace.waitFor();
      await openDetails();
      for (const box of await actions.getByRole("button").evaluateAll(buttons => buttons.map(button => {
        const box = button.getBoundingClientRect(); return { x: box.x, right: box.right, width: box.width, height: box.height };
      }))) assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.right <= width + 1, "current editor actions fit the viewport with full touch targets");
      const title = page.getByLabel("Event title", { exact: true });
      const undo = actions.getByRole("button", { name: "Undo", exact: true });
      assert.equal(await undo.isEnabled(), false);
      await title.fill("First pending title");
      await title.fill("Whole focused title edit");
      await undo.click();
      await page.getByRole("button", { name: "Undo last change", exact: true }).click();
      assert.equal(await title.inputValue(), "School field trip", "typing in one field is one undo step");
      await page.getByRole("button", { name: "Back to details", exact: true }).click();
      await controls.getByRole("button", { name: /^Design/ }).click();
      const accents = controls.getByRole("group", { name: "Theme color combinations", exact: true });
      assert.equal(await controls.locator('input[type="color"]').count(), 0);
      assert.equal(await accents.getByRole("button", { name: "Original", exact: true }).getAttribute("aria-pressed"), "true");
      const canvas = page.locator('[data-layout][data-appearance-scope="authored"]');
      const originalBackground = await canvas.evaluate(element => getComputedStyle(element).backgroundColor);
      await accents.getByRole("button", { name: "Accent", exact: true }).click();
      await accents.getByRole("button", { name: "Deep", exact: true }).click();
      assert.equal(await canvas.evaluate(element => getComputedStyle(element).backgroundColor), originalBackground, "accent edits retain the authored background");
      await undo.click();
      await page.getByRole("button", { name: "Undo last change", exact: true }).click();
      assert.equal(await accents.getByRole("button", { name: "Accent", exact: true }).getAttribute("aria-pressed"), "true", "single undo keeps the earlier accent edit");
      await undo.click();
      await page.getByRole("button", { name: "Undo all unsaved changes", exact: true }).click();
      assert.equal(await accents.getByRole("button", { name: "Original", exact: true }).getAttribute("aria-pressed"), "true");
      assert.equal(await canvas.evaluate(element => getComputedStyle(element).backgroundColor), originalBackground, "reset restores the rendered background");
      assert.equal(await undo.isEnabled(), false);
      await page.screenshot({ path: path.join(output, `undo-background-${width}.png`) });
      await page.getByRole("button", { name: "Back to details", exact: true }).click();
      await openDetails();
      await title.fill("");
      const before = writes.length;
      await actions.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const id = new URL(page.url()).searchParams.get("edit");
      assert.ok(id);
      assert.equal(records.get(id).data.customEventPage.details.title, "");
      assert.equal(records.get(id).data.status, "draft");
      assert.equal(writes.length, before + 1);
      await page.reload();
      await openDetails();
      assert.equal(await title.inputValue(), "");
      await title.fill(`Pending current page ${width}`);
      await page.getByRole("button", { name: "Back to details", exact: true }).click();
      assert.equal(await controls.getByRole("button", { name: /^Event details/ }).isVisible(), true);
      assert.equal(writes.length, before + 1, "local Back never saves");
      await actions.getByRole("button", { name: "Preview", exact: true }).click();
      await workspace.getByRole("button", { name: "Close preview", exact: true }).waitFor();
      assert.equal(await actions.count(), 0, "clean preview has no save or editing controls");
      await workspace.getByRole("button", { name: "Close preview", exact: true }).click();
      await leaveEditor();
      await page.getByRole("button", { name: "Keep editing", exact: true }).click();
      await openDetails();
      assert.equal(await title.inputValue(), `Pending current page ${width}`);
      await leaveEditor();
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/create");
      assert.equal(records.get(id).data.customEventPage.details.title, "", "discard preserves the saved draft");
      assert.equal(writes.length, before + 1);
    }
    const legacy = { category: "General Events", createdVia: "template", templateId: "general", bodyDesignId: "holidays--halloween--autumn-doorstep",
      title: "Saved host title", date: "2027-04-10", venue: "State park", timezone: "America/Chicago", status: "published", heroImage: "/templates/signup/holidays/halloween/autumn-doorstep.webp",
      rsvpEnabled: false, rsvpDeadline: "2027-04-01", rsvpName: "Reply host", rsvpEmail: "reply@example.test", rsvpPhone: "+1 555 123 4567", numberOfGuests: 7, responses: [{ id: "retained-response" }] };
    records.set("legacy-general", { id: "legacy-general", title: legacy.title, revision: "legacy-v1", public_slug: "saved-host-title", data: structuredClone(legacy) });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const before = writes.length;
      await page.goto(`${base}/event/design/customize?mode=create&edit=legacy-general`);
      await openDetails();
      const title = page.getByLabel("Event title", { exact: true });
      assert.equal(await title.inputValue(), records.get("legacy-general").data.title);
      assert.equal(writes.length, before, "opening a legacy event never migrates or saves it automatically");
      await title.fill(`Current host title ${width}`);
      await actions.getByRole("button", { name: "Save changes", exact: true }).click();
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      assert.equal(writes.at(-1).path, "/api/history/legacy-general");
      assert.equal(writes.at(-1).method, "PATCH");
      const saved = records.get("legacy-general").data;
      assert.equal(saved.customEventPage.details.title, `Current host title ${width}`);
      assert.equal(saved.customEventPage.artwork, legacy.heroImage);
      assert.deepEqual(saved.responses, legacy.responses);
      assert.equal(saved.numberOfGuests, 7);
      for (const key of ["rsvpName", "rsvpEmail", "rsvpPhone", "rsvpDeadline", "rsvpEnabled"]) assert.equal(saved.customEventPage.details[key], legacy[key]);
      assert.equal(await actions.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
      await title.fill("Unsaved wording");
      await actions.getByRole("button", { name: "Undo", exact: true }).click();
      await page.getByRole("button", { name: "Undo all unsaved changes", exact: true }).click();
      assert.equal(await title.inputValue(), `Current host title ${width}`, "reset uses the latest explicit save");
      assert.equal(await actions.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
      const afterSave = writes.length;
      await leaveEditor();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/event/saved-host-title", "clean Exit leaves the editor for the saved event");
      assert.equal(writes.length, afterSave, "clean Exit never saves");
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const id = `undo-meet-${width}`;
      records.set(id, { id, title: "Undo meet", revision: "meet-v1", data: {
        title: "Undo meet", status: "published", category: "gymnastics", createdVia: "simple-template",
        pageTemplateId: "airborne-atlas", date: "2027-04-10", time: "", timezone: "America/New_York",
        venue: "Original venue", rsvpEnabled: false, hero: "/templates/hero-images/general-sport-hero.webp",
        responses: [{ id: "preserved-response" }],
      } });
      const openImageSettings = async () => {
        await workspace.waitFor();
        const edit = workspace.getByRole("button", { name: /^(Continue editing|Edit|Close preview)$/ });
        if (await edit.isVisible()) await edit.click();
        await controls.waitFor();
        const image = controls.getByRole("button", { name: /^Event image settings/ });
        if (await image.isVisible()) await image.click();
        await controls.getByRole("button", { name: "Choose Diagonal cut hero layout", exact: true }).waitFor();
      };
      const editorHref = `${base}/event/gymnastics/customize?mode=gymnastics&edit=${id}`;
      await page.goto(editorHref);
      await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "light"));
      await page.addScriptTag({ content: appearanceBootstrap });
      await workspace.getByRole("button", { name: /^Exit(?: [Ee]diting)?$/, exact: true }).waitFor();
      if (width < 768) {
        const checkMenuAlignment = async () => {
          const backdrop = workspace.getByRole("button", { name: "Close editing menu", exact: true });
          assert.equal(await backdrop.isVisible(), true, "the open menu covers the event page with a dismissible backdrop");
          const effect = await backdrop.evaluate(element => {
            const style = getComputedStyle(element);
            return { blur: style.backdropFilter, color: style.backgroundColor };
          });
          assert.equal(effect.blur, "blur(3px)", "the event page is subtly blurred behind the menu");
          const opacity = Number(effect.color.match(/,\s*([\d.]+)\)$/)?.[1]);
          assert.ok(opacity > 0 && opacity <= 0.2, "the event page is lightly dimmed behind the menu");
          const panel = await controls.boundingBox();
          const footer = await workspace.locator("footer[data-bottom-settings]").boundingBox();
          const rows = await controls.locator('button[class*="_menuCard"]').evaluateAll(elements => elements
            .filter(element => element.getClientRects().length && !element.closest("[hidden]"))
            .map(element => {
              const box = element.getBoundingClientRect();
              return { label: element.textContent.trim(), x: box.x, right: box.right, height: box.height };
            }));
          assert.ok(rows.length >= 6, "Sections and the existing settings remain in the menu");
          for (const row of rows) {
            assert.ok(Math.abs(row.x - rows[0].x) < 1 && Math.abs(row.right - rows[0].right) < 1,
              `${row.label} shares the Sections row width`);
            assert.ok(row.height >= 44, `${row.label} keeps its touch target`);
          }
          assert.ok(Math.abs(footer.x - panel.x) < 1 && Math.abs(footer.width - panel.width) < 1,
            "the action bar stays inside the editing menu's column");
          assert.ok(panel.width <= 420 && panel.x >= 0, "the content-sized menu fits the viewport");
        };
        await checkMenuAlignment();
        await page.screenshot({ path: path.join(output, `gymnastics-menu-${width}.png`) });
        await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "dark"));
        await page.addScriptTag({ content: appearanceBootstrap });
        await checkMenuAlignment();
        await page.screenshot({ path: path.join(output, `gymnastics-menu-${width}-dark.png`) });
        await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "light"));
        await page.addScriptTag({ content: appearanceBootstrap });
        await page.setViewportSize({ width: 640, height: 390 });
        await checkMenuAlignment();
        await page.screenshot({ path: path.join(output, `gymnastics-menu-${width}-landscape.png`) });
        await page.setViewportSize({ width, height: 900 });
      }
      const checkNavigation = async () => {
        const exit = workspace.getByRole("button", { name: /^Exit(?: [Ee]diting)?$/, exact: true });
        assert.equal(await exit.count(), 1, "each editor view has one reachable Exit");
        assert.equal(await workspace.getByRole("button", { name: "Cancel", exact: true }).count(), 0, "Exit replaces duplicate Cancel");
        const box = await exit.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width, `${width}px Exit keeps a full touch target`);
        assert.equal(await exit.locator("svg.lucide-log-out").count(), 1, "Exit has its exit icon");
        const mobileCanvas = width < 768 && await workspace.getAttribute("data-mobile-editing") === "false";
        assert.equal(await exit.textContent(), mobileCanvas ? "Exit Editing" : width >= 768 && await controls.isVisible() ? "Exit editing" : "Exit", "the left canvas control names the editing session");
        assert.equal(await exit.locator("svg.lucide-log-out").evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a < 0), mobileCanvas,
          "the left canvas arrow points left; the settings and desktop arrows point right");
        if (mobileCanvas) {
          assert.equal(await workspace.getByRole("button", { name: "Edit event", exact: true }).count(), 0,
            "the phone canvas omits the duplicate circled edit-menu pencil");
          const edit = workspace.getByRole("button", { name: "Continue editing", exact: true });
          const editBounds = await edit.boundingBox();
          assert.ok(box.x <= 24 && editBounds.x > box.x + box.width && editBounds.x + editBounds.width >= width - 24, `${width}px phone canvas puts Exit left and Edit page right`);
          assert.equal(await edit.locator("svg.lucide-pencil").count(), 1, "Edit page uses a pencil");
          assert.equal(await edit.locator("svg.lucide-menu").count(), 0, "Edit page has no hamburger icon");
        } else {
          assert.ok(box.x + box.width >= width - 24, `${width}px settings and desktop keep Exit right`);
        }
        assert.equal(await exit.evaluate(element => {
          const box = element.getBoundingClientRect();
          return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
        }), true, "Exit remains uncovered");
        assert.equal(await workspace.evaluate(element => Math.abs(element.getBoundingClientRect().top - element.firstElementChild.getBoundingClientRect().top) < 1), true, "no top strip displaces the editor canvas");
        return box;
      };
      await checkNavigation();
      assert.equal(await workspace.getByRole("button", { name: "Hide settings", exact: true }).count(), 0,
        "the header replaces the redundant footer Hide settings action");
      if (width >= 768) {
        const panel = await controls.boundingBox();
        const heading = await controls.getByRole("heading", { name: "Edit meet page", exact: true }).boundingBox();
        const close = controls.getByRole("button", { name: "Close editing menu", exact: true });
        const back = await close.boundingBox();
        assert.equal(await close.locator("svg.lucide-x").count(), 1, "the desktop header uses an X");
        assert.equal(await controls.getByRole("button", { name: "Back", exact: true }).count(), 0, "the desktop header has no Back button");
        assert.ok(heading.y >= back.y + back.height + 16 && heading.x >= panel.x + 16,
          "Edit meet page sits below the desktop controls as a content heading");
        assert.ok(back.width >= 44 && back.height >= 44,
          "the desktop X sits on the left with a full touch target");
        const headingStyle = await controls.getByRole("heading", { name: "Edit meet page", exact: true }).evaluate(element => {
          const style = getComputedStyle(element);
          return { font: style.fontFamily, size: style.fontSize };
        });
        await page.screenshot({ path: path.join(output, "gymnastics-main-menu-desktop.png") });
        await controls.getByRole("button", { name: "Design", exact: true }).click();
        const designStyle = await controls.getByRole("heading", { name: "Design", exact: true }).evaluate(element => {
          const style = getComputedStyle(element);
          return { font: style.fontFamily, size: style.fontSize };
        });
        assert.deepEqual(headingStyle, designStyle, "Edit meet page uses the same heading typography as Design");
        assert.equal(await controls.getByRole("heading", { name: "Edit meet page", exact: true }).count(), 0,
          "a settings panel keeps its own heading without a duplicate menu title");
        await controls.getByRole("button", { name: "Back to details", exact: true }).click();
      }
      await controls.getByRole("button", { name: /^(Close editing menu|Back to page)$/, exact: true }).click();
      await workspace.getByRole("button", { name: "Continue editing", exact: true }).waitFor();
      const canvasFooter = workspace.locator('footer[data-bottom-settings="true"]');
      assert.equal(await canvasFooter.getByRole("button", { name: "Save changes", exact: true }).count(), 0,
        "a clean collapsed canvas has no Save changes button");
      assert.equal(await workspace.getByRole("button", { name: "Close editing menu", exact: true }).count(), 0, "returning to the canvas removes its dimming and blur");
      await checkNavigation();
      await page.screenshot({ path: path.join(output, `gymnastics-canvas-navigation-${width}.png`) });
      for (const box of await canvasFooter.getByRole("button").evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { label: element.textContent.trim(), x: rect.x, right: rect.right, width: rect.width, height: rect.height };
      }))) assert.ok(box.x >= 0 && box.right <= width + 1 && box.width >= 44 && box.height >= 44, `${width}px canvas ${box.label} stays reachable`);
      assert.equal(await canvasFooter.getByRole("button", { name: "Preview", exact: true }).count(), 0, "the collapsed menu has no redundant Preview");
      await workspace.getByRole("button", { name: "Continue editing", exact: true }).click();
      await actions.getByRole("button", { name: "Preview", exact: true }).click();
      await workspace.getByRole("button", { name: "Close preview", exact: true }).waitFor();
      assert.equal(await workspace.getByRole("button", { name: /^Exit(?: Editing)?$/, exact: true }).count(), 0, "Preview hides editor navigation");
      await workspace.getByRole("button", { name: "Close preview", exact: true }).click();
      await controls.waitFor();
      await controls.getByRole("button", { name: /^(Close editing menu|Back to page)$/, exact: true }).click();
      await workspace.getByRole("button", { name: "Continue editing", exact: true }).waitFor();
      await checkNavigation();
      const beforeExit = writes.length;
      await leaveEditor();
      await page.locator("[data-destination]").waitFor();
      assert.equal(writes.length, beforeExit, "clean canvas Exit leaves without saving");
      await page.goto(editorHref);
      await openImageSettings();
      const beforeScroll = await checkNavigation();
      await controls.evaluate(element => { element.scrollTop = 350; });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const afterScroll = await checkNavigation();
      assert.ok(Math.abs(beforeScroll.y - afterScroll.y) < 1, "Exit stays visible while settings scroll");
      await controls.evaluate(element => { element.scrollTop = 0; });
      const checkSaveRow = async () => {
        const buttons = await actions.getByRole("button").evaluateAll(elements => elements.map(element => {
          const box = element.getBoundingClientRect();
          return { label: element.textContent.trim(), x: box.x, y: box.y, right: box.right, width: box.width, height: box.height, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
        }));
        const actionBounds = await actions.boundingBox();
        assert.ok(Math.abs(buttons.at(-1).right - actionBounds.x - actionBounds.width) <= 1,
          "Preview is aligned to the right edge of the menu's action bar");
        const dirty = await actions.getByRole("button", { name: "Save changes", exact: true }).count() > 0;
        assert.deepEqual(buttons.map(button => button.label), dirty ? ["Undo", "Save changes", "Preview"] : ["Undo", "Preview"]);
        for (const button of buttons) {
          assert.ok(Math.abs(button.y - buttons[0].y) < 1, `${width}px ${button.label} stays in the same row`);
          assert.ok(button.width >= 44 && button.height >= 44 && button.x >= 0 && button.right <= width + 1, `${width}px ${button.label} has a visible touch target`);
          assert.ok(button.scrollWidth <= button.clientWidth + 1, `${width}px ${button.label} text fits its button`);
        }
      };
      await checkSaveRow();
      await page.screenshot({ path: path.join(output, `gymnastics-save-row-${width}.png`) });
      const diagonal = controls.getByRole("button", { name: "Choose Diagonal cut hero layout", exact: true });
      const split = controls.getByRole("button", { name: "Choose Crossing lines hero layout", exact: true });
      const undo = actions.getByRole("button", { name: "Undo", exact: true });
      await diagonal.click();
      await workspace.getByRole("button", { name: width >= 768 ? "Close editing menu" : "Back to page", exact: true }).click();
      await workspace.getByRole("button", { name: "Continue editing", exact: true }).waitFor();
      const canvasSave = actions.getByRole("button", { name: "Save changes", exact: true });
      const saveBounds = await canvasSave.boundingBox();
      assert.ok(saveBounds.width >= 44 && saveBounds.width < 200,
        "Save changes follows its label width rather than stretching across the canvas");
      assert.equal(await canvasSave.evaluate(element => element.scrollWidth <= element.clientWidth), true,
        "the complete Save changes label fits its button");
      await page.screenshot({ path: path.join(output, `gymnastics-pending-save-${width}.png`) });
      await actions.getByRole("button", { name: "Save changes", exact: true }).click();
      await page.getByText("Changes saved.", { exact: true }).waitFor();
      assert.equal(await canvasSave.count(), 0, "successful canvas saves remove Save changes until another edit");
      await openImageSettings();
      const saved = structuredClone(records.get(id));
      await split.click();
      await undo.click();
      await page.getByRole("button", { name: "Undo last change", exact: true }).click();
      assert.equal(await diagonal.getAttribute("aria-pressed"), "true");
      assert.equal(await actions.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
      await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await openImageSettings();
      await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "dark"));
      await page.addScriptTag({ content: appearanceBootstrap });
      await split.click();
      await undo.click();
      await page.getByRole("button", { name: "Undo all unsaved changes", exact: true }).click();
      assert.equal(await diagonal.getAttribute("aria-pressed"), "true");
      await split.click();
      await checkSaveRow();
      await page.screenshot({ path: path.join(output, `gymnastics-save-row-${width}-dark.png`) });
      await leaveEditor();
      await page.getByRole("button", { name: "Keep editing", exact: true }).click();
      assert.equal(await controls.isVisible(), true, "Keep editing preserves the open image settings menu");
      await openImageSettings();
      assert.equal(await split.getAttribute("aria-pressed"), "true", "Keep editing retains pending layout changes");
      await leaveEditor();
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.deepEqual(records.get(id), saved, "Exit never writes layout, artwork or responses");
      const recovery = await page.evaluate(async id => {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open("envitefy-template-drafts", 1);
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
        const rows = await new Promise((resolve, reject) => {
          const request = db.transaction("drafts").objectStore("drafts").getAll();
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
        db.close();
        return rows.filter(row => row.eventId === id);
      }, id);
      assert.equal(recovery.length, 0, "discard removes the stale browser copy");
      await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await openImageSettings();
      assert.equal(await diagonal.getAttribute("aria-pressed"), "true", "reopen retains the saved design");
      assert.equal(await actions.getByRole("button", { name: "Save changes", exact: true }).count(), 0);
      await split.click();
      const beforeSaveAndExit = writes.length;
      await leaveEditor();
      await page.getByRole("button", { name: "Save and leave", exact: true }).click();
      await page.locator("[data-destination]").waitFor();
      assert.equal(writes.length, beforeSaveAndExit + 1, "Save and leave saves once before navigating");
      assert.equal(writes.at(-1).path, `/api/history/${id}`);
      assert.equal(writes.at(-1).method, "PATCH", "Save and leave updates the original event");
      assert.deepEqual(records.get(id).data.responses, saved.data.responses);
      assert.equal(records.get(id).data.hero, saved.data.hero, "Save and leave retains artwork");
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    fs.writeFileSync(path.join(output, "failure.json"), JSON.stringify({ url: page.url(), errors, writes, body: await page.locator("body").innerText() }, null, 2));
    await page.screenshot({ path: path.join(output, "failure.png") });
    throw error;
  } finally { await browser.close(); }
});
