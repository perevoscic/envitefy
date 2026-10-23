const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const { createJiti } = require("jiti");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("themed sports, bridal and General-backed occasions retain artwork, typography, palette and body through draft saves, reloads and guest rendering", { timeout: 240000 }, async () => {
  const output = path.resolve(".qa/themed-event-editor-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/themed-event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/data/event-page-themed-artwork-availability.json": path.resolve("scripts/fixtures/themed-event-artwork-availability.ts"),
        "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") } });
  const { EVENT_PAGE_THEMED_DESIGNS } = jiti("../src/data/event-page-themed-designs.ts");
  const { GENERAL_EVENT_DESIGNS } = jiti("../src/lib/general-event-designs.ts");
  const { getThemedEventTheme } = jiti("../src/lib/event-page-themed-designs.ts");
  const { getHolidayBackground, getHolidayBackgroundChoice, getHolidayBackgrounds } = jiti("../src/lib/holiday-backgrounds.ts");
  const { getGeneralEventPageDesign } = jiti("../src/lib/general-event-presentation.ts");
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/events"; @source "../src/components/templates"; @source "../src/components/ScrollHandoffContainer.tsx"; @source "../src/app/event/sport-events/customize/page.tsx"; @source "../src/app/event/baby-showers/customize/page.tsx"; @source "../src/app/event/general/customize/page.tsx"; @source "../src/data/event-page-themed-designs.ts";',
    { from: path.resolve("scripts/themed-event-editor-fixture.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(15000);
  const errors = [], records = new Map(), writes = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.addInitScript(() => { window.__fixtureErrors = []; window.addEventListener("error", (event) => window.__fixtureErrors.push({ message: event.message, filename: event.filename, line: event.lineno, column: event.colno })); });
  await page.route("**/*", async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (request.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...records.get(id), permissions: { role: "owner", canEdit: true, canManageCollaborators: true } }) });
      const body = request.postDataJSON();
      const row = { id: id || `saved-${writes.length}`, title: body.title, data: body.data, revision: `v${writes.length}`, public_slug: id || `saved-${writes.length}` };
      records.set(row.id, row); writes.push(row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (/\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(`${path.resolve("public")}${path.sep}`) && fs.existsSync(asset)) return route.fulfill({ path: asset });
      return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#4c6b54"/></svg>' });
    }
    if (url.origin === "http://localhost:43139") return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  try {
    for (const collection of ["bridal-showers", "dance", "graduations", "holidays-seasonal"]) {
      const holiday = collection === "holidays-seasonal";
      const design = holiday ? GENERAL_EVENT_DESIGNS.find((item) => item.occasion === "cinco-de-mayo") : EVENT_PAGE_THEMED_DESIGNS.find((item) => item.collection === collection);
      assert.ok(design, `authored ${collection} definition exists`);
      const pageDesign = holiday ? getGeneralEventPageDesign(design.id) : design;
      const general = collection === "graduations" || holiday;
      const pathname = general ? "/event/general/customize" : `/${collection === "bridal-showers" ? "bridal-showers" : "sport-events"}/templates/${design.id}/customize`;
      const url = `http://localhost:43139${pathname}?collection=${collection}&templateId=${design.id}${holiday ? "&occasion=cinco-de-mayo" : ""}`;
      await page.goto(url);
      const header = page.locator(`[data-themed-event-header="${design.id}"]`);
      await header.waitFor();
      assert.equal(await header.locator("img").first().getAttribute("src"), design.artwork);
      assert.equal(await header.getAttribute("data-composition"), pageDesign.composition);
      assert.equal(await header.getAttribute("data-page-layout"), pageDesign.editorLayout);
      if (holiday) {
        assert.equal((await header.locator("h1").innerText()).trim().toLowerCase(), design.coverTitle.toLowerCase(), "holiday heading starts with the selected design title");
        assert.match(await header.innerText(), /Cinco de Mayo/i, "occasion identity remains visible");
        assert.ok(await page.locator("[data-template-body-layout]").count(), "holidays use authored body structure while editing");
      }
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).has("edit"));
      let row = writes.at(-1);
      if (general) {
        assert.equal(row.data.manualEditor.snapshot.data.bodyDesignId, design.id, "manual draft retains selected design in its editor snapshot");
        assert.equal(row.data.manualEditor.snapshot.themeId, design.id);
        await page.reload();
        await page.locator(`[data-themed-event-header="${design.id}"]`).waitFor();
        await page.getByRole("button", { name: "Publish", exact: true }).click();
        await page.waitForFunction(() => !location.pathname.endsWith("/customize"));
        row = writes.at(-1);
      }
      assert.equal(row.data.bodyDesignId, design.id, `${collection}: saved body design`);
      assert.equal(row.data.heroImage, design.artwork, `${collection}: saved artwork`);
      assert.equal(row.data.themeId, design.id, `${collection}: saved theme`);
      assert.equal(row.data.fontFamily || row.data.theme.fontFamily, design.font);
      assert.equal(row.data.theme.bgStyle.backgroundColor, holiday ? getHolidayBackground(design.id).page : design.background);
      if (holiday) assert.deepEqual(row.data.pageBackground, getHolidayBackgroundChoice(getHolidayBackground(design.id).id, "template"));
      if (general) {
        assert.equal(row.data.templateId, "general-event");
        assert.equal(row.data.creationCollection, collection);
        if (holiday) {
          assert.equal(row.data.holidayOccasion, "cinco-de-mayo");
          assert.equal(row.data.date, "", "a selected holiday never assigns an event date");
        }
      } else assert.equal(row.data.templateEditor.templateId, design.id);
      if (!general) {
        await page.reload();
        await page.locator(`[data-themed-event-header="${design.id}"]`).waitFor();
      }
      await page.goto(`http://localhost:43139/event/guest?guest=1&id=${row.id}&collection=${collection}`);
      await page.locator(`[data-themed-event-header="${design.id}"]`).waitFor();
      assert.equal(await page.locator(`[data-themed-event-header="${design.id}"] img`).first().getAttribute("src"), design.artwork);
      assert.equal(await page.locator(`[data-themed-event-header="${design.id}"]`).getAttribute("data-composition"), pageDesign.composition);
      assert.equal(await page.locator(`[data-themed-event-header="${design.id}"]`).getAttribute("data-page-layout"), pageDesign.editorLayout);
      assert.ok(await page.locator("[data-template-body-layout]").count(), "guest view keeps authored body structure");
    }
    const holidayDesigns = GENERAL_EVENT_DESIGNS.filter((design) => design.occasion === "cinco-de-mayo");
    assert.equal(holidayDesigns.length, 10);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      const signatures = new Map();
      for (const design of holidayDesigns) {
        await page.goto(`http://localhost:43139/event/general/customize?collection=holidays-seasonal&occasion=cinco-de-mayo&templateId=${design.id}`);
        await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Edit", exact: true }).waitFor();
        const header = page.locator(`[data-themed-event-header="${design.id}"]`);
        await header.waitFor();
        const pageDesign = getGeneralEventPageDesign(design.id);
        assert.equal(await header.getAttribute("data-composition"), pageDesign.composition);
        assert.equal(await header.getAttribute("data-page-layout"), pageDesign.editorLayout);
        const geometry = await header.evaluate((element) => {
          const relative = (node) => {
            const box = node.getBoundingClientRect(), origin = element.getBoundingClientRect(), style = getComputedStyle(node);
            return {
              x: Math.round(box.x - origin.x), y: Math.round(box.y - origin.y), width: Math.round(box.width), height: Math.round(box.height),
              radius: style.borderRadius, border: style.borderStyle, borderWidth: style.borderWidth, transform: style.transform,
            };
          };
          const body = element.closest("[data-event-page-design]")?.querySelector("[data-template-body-layout]");
          const shape = (node) => {
            const style = getComputedStyle(node);
            return { display: style.display, columns: style.gridTemplateColumns, gap: style.gap, padding: style.padding, radius: style.borderRadius, border: style.borderStyle, borderWidth: style.borderWidth };
          };
          return {
            header: shape(element),
            children: [...element.children].map(relative),
            body: body ? { root: shape(body), sections: [...body.querySelectorAll("[data-body-section]")].map(shape) } : null,
          };
        });
        assert.ok(geometry.body, `${design.id}: editor body keeps the selected composition at ${width}px`);
        const key = JSON.stringify(geometry);
        assert.ok(!signatures.has(key), `${design.id} duplicates ${signatures.get(key)} at ${width}px`);
        signatures.set(key, design.id);
        assert.equal((await header.locator("h1").innerText()).trim().toLowerCase(), design.coverTitle.toLowerCase());
        assert.equal(await header.locator("img").first().getAttribute("src"), design.artwork);
        assert.ok(await header.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${design.id} fits ${width}px`);
        for (const slot of ["artwork", "copy"]) {
          const bounds = await header.locator(`[data-themed-header-${slot}]`).boundingBox();
          assert.ok(bounds.width > 100 && bounds.height > 80, `${design.id}: usable ${slot} at ${width}px`);
        }
        await header.screenshot({ path: path.join(output, `${design.id}-${width}.png`) });
      }
      assert.equal(signatures.size, 10, `all ten holiday compositions remain different at ${width}px`);
    }
    // A background is a separate explicit choice, preserved through every editor lifecycle.
    await page.setViewportSize({ width: 1280, height: 1000 });
    const ghosts = GENERAL_EVENT_DESIGNS.find((design) => design.id === "holidays--halloween--friendly-ghosts");
    const defaultBackground = getHolidayBackground(ghosts.id);
    const alternateBackground = getHolidayBackgrounds("halloween").at(-1);
    assert.equal(getHolidayBackgrounds("halloween").length, 20, "the editor exposes the complete background library");
    const customHero = "/templates/custom-halloween-artwork.webp";
    const seed = {
      id: "holiday-background-owner", title: "Our Halloween gathering", revision: "background-v0", public_slug: "our-halloween-gathering",
      data: {
        status: "draft", category: "general", templateId: "general-event", creationCollection: "holidays-seasonal", holidayOccasion: "halloween",
        title: "Our Halloween gathering", description: "Bring your favorite costume.", date: "", time: "", venue: "", city: "", state: "",
        bodyDesignId: ghosts.id, themeId: ghosts.id, theme: getThemedEventTheme(ghosts), heroImage: customHero,
        pageBackground: getHolidayBackgroundChoice(defaultBackground.id, "template"),
      },
    };
    records.set(seed.id, seed);
    await page.goto(`http://localhost:43139/event/general/customize?collection=holidays-seasonal&occasion=halloween&templateId=${ghosts.id}&edit=${seed.id}`);
    await page.locator(`[data-holiday-background="${defaultBackground.id}"]`).waitFor();
    let header = page.locator(`[data-themed-event-header="${ghosts.id}"]`);
    assert.equal(await header.locator("img").first().getAttribute("src"), customHero);
    assert.notEqual(defaultBackground.page.toLowerCase(), ghosts.background.toLowerCase(), "Friendly Ghosts gets a Halloween background instead of the legacy pink paper");
    await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("button", { name: /^Background/ }).click();
    const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
    const picker = controls.getByRole("group", { name: "Choose a background", exact: true });
    assert.equal(await picker.getByRole("button", { name: "Use this design’s background", exact: true }).count(), 0, "backgrounds use tiles without a separate reset link");
    const initialPanelScroll = await controls.evaluate(node => node.scrollTop);
    const initialPreviewScroll = await preview.evaluate(node => node.scrollTop);
    await picker.getByRole("radio").first().hover();
    await page.mouse.wheel(0, 550);
    await page.waitForFunction(initial => document.querySelector('aside[aria-label="Event editing controls"]').scrollTop > initial + 100, initialPanelScroll, { timeout: 3000 });
    assert.equal(await preview.evaluate(node => node.scrollTop), initialPreviewScroll, "swiping over background tiles scrolls the controls independently of the event preview");
    const panelBounds = await controls.boundingBox();
    await page.mouse.move(panelBounds.x + panelBounds.width / 2, panelBounds.y + panelBounds.height / 2);
    await page.mouse.wheel(0, 10000);
    await page.waitForFunction(() => {
      const panel = document.querySelector('aside[aria-label="Event editing controls"]');
      return panel.scrollTop >= panel.scrollHeight - panel.clientHeight - 2;
    }, null, { timeout: 3000 });
    const finalBackgroundBounds = await picker.getByRole("radio").last().boundingBox();
    assert.ok(finalBackgroundBounds.y >= panelBounds.y && finalBackgroundBounds.y + finalBackgroundBounds.height <= panelBounds.y + panelBounds.height, "desktop trackpad scrolling reaches the twentieth background");
    await page.mouse.wheel(0, -10000);
    await page.waitForFunction(() => document.querySelector('aside[aria-label="Event editing controls"]').scrollTop <= 1, null, { timeout: 3000 });
    await page.setViewportSize({ width: 390, height: 844 });
    const touch = await page.context().newCDPSession(page);
    await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    const firstBackgroundBounds = await picker.getByRole("radio").first().boundingBox();
    const touchX = firstBackgroundBounds.x + firstBackgroundBounds.width / 2;
    const touchY = firstBackgroundBounds.y + firstBackgroundBounds.height / 2;
    const selectionBeforeSwipe = await picker.locator("input:checked").inputValue();
    const scrollBeforeSwipe = await controls.evaluate(node => node.scrollTop);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchX, y: touchY }] });
    for (let step = 1; step <= 8; step++) {
      await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: touchX, y: touchY - step * 25 }] });
      await page.waitForTimeout(20);
    }
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(initial => document.querySelector('aside[aria-label="Event editing controls"]').scrollTop > initial + 80, scrollBeforeSwipe, { timeout: 3000 });
    assert.equal(await picker.locator("input:checked").inputValue(), selectionBeforeSwipe, "a phone swipe over a background tile scrolls without selecting it");
    await touch.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await touch.detach();
    await page.setViewportSize({ width: 1280, height: 1000 });
    const writesBeforeChoice = writes.length;
    const bodyLayoutBeforeChoice = await page.locator("[data-template-body-layout]").getAttribute("data-template-body-layout");
    await page.getByRole("radio", { name: alternateBackground.name, exact: true }).check();
    await page.locator(`[data-holiday-background="${alternateBackground.id}"]`).waitFor();
    assert.equal(writes.length, writesBeforeChoice, "changing the background never saves or publishes");
    assert.equal(await header.locator("img").first().getAttribute("src"), customHero, "background choice preserves uploaded artwork");
    assert.equal(await page.locator("[data-template-body-layout]").getAttribute("data-template-body-layout"), bodyLayoutBeforeChoice, "background choice preserves the page layout");
    const expectedInk = await page.evaluate((color) => { const node = document.createElement("span"); node.style.color = color; document.body.append(node); const result = getComputedStyle(node).color; node.remove(); return result; }, alternateBackground.ink);
    assert.equal(await header.locator("h1").evaluate((node) => getComputedStyle(node).color), expectedInk, "header adopts the chosen background's readable ink");
    assert.equal(await header.evaluate((node) => getComputedStyle(node).getPropertyValue("--themed-accent").trim()), alternateBackground.accent);
    assert.equal(await page.locator("[data-template-body-layout]").evaluate((node) => node.style.getPropertyValue("--body-tint")), alternateBackground.surface, "body panels use the background's authored reading surface");
    const proofOutput = path.resolve("output/holiday-backgrounds");
    fs.mkdirSync(proofOutput, { recursive: true });
    await page.screenshot({ path: path.join(proofOutput, "halloween-background-picker.png"), fullPage: true });
    await page.getByRole("button", { name: "Back to details", exact: true }).click();
    await page.getByRole("button", { name: /^Design Artwork/ }).click();
    const nextDesign = GENERAL_EVENT_DESIGNS.find((design) => design.occasion === "halloween" && design.id !== ghosts.id);
    await page.locator(`[data-template-masonry-card="${nextDesign.id}"] button`).click();
    header = page.locator(`[data-themed-event-header="${nextDesign.id}"]`);
    await header.waitFor();
    assert.equal(await header.locator("img").first().getAttribute("src"), customHero, "changing a design preserves uploaded artwork");
    assert.ok(await page.locator(`[data-holiday-background="${alternateBackground.id}"]`).count(), "a manually chosen background survives a design change");
    assert.equal(writes.length, writesBeforeChoice, "design and background browsing retain explicit saves");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    assert.equal(writes.length, writesBeforeChoice + 1);
    let row = writes.at(-1);
    assert.deepEqual(row.data.manualEditor.snapshot.data.pageBackground, getHolidayBackgroundChoice(alternateBackground.id, "custom"));
    await page.reload();
    await page.locator(`[data-holiday-background="${alternateBackground.id}"]`).waitFor();
    header = page.locator(`[data-themed-event-header="${nextDesign.id}"]`);
    assert.equal(await header.locator("img").first().getAttribute("src"), customHero);
    assert.equal((await header.locator("h1").innerText()).trim(), seed.title);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.waitForFunction(() => !location.pathname.endsWith("/customize"));
    row = writes.at(-1);
    assert.deepEqual(row.data.pageBackground, getHolidayBackgroundChoice(alternateBackground.id, "custom"));
    assert.equal(row.data.heroImage, customHero);
    assert.equal(row.data.description, seed.data.description);
    assert.equal(row.data.date, "", "background editing never assigns a holiday date");
    assert.equal(row.data.theme.bgStyle.backgroundColor, alternateBackground.page);
    await page.goto(`http://localhost:43139/event/guest?guest=1&id=${row.id}&collection=holidays-seasonal`);
    await page.locator(`[data-holiday-background="${alternateBackground.id}"]`).waitFor();
    header = page.locator(`[data-themed-event-header="${nextDesign.id}"]`);
    assert.equal(await header.locator("h1").evaluate((node) => getComputedStyle(node).color), expectedInk, "guest page uses the saved background ink");
    assert.equal(await header.locator("img").first().getAttribute("src"), customHero);
    assert.equal(await page.locator("[data-template-body-layout]").evaluate((node) => node.style.getPropertyValue("--body-tint")), alternateBackground.surface, "guest reading surfaces match the saved background");
    await page.screenshot({ path: path.join(output, "halloween-custom-background-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator("[data-holiday-background]").evaluate((node) => node.scrollWidth <= node.clientWidth + 1), "background decoration fits phones");
    await page.screenshot({ path: path.join(output, "halloween-custom-background-phone.png"), fullPage: true });

    await page.setViewportSize({ width: 1280, height: 1000 });
    const allOccasions = { ...seed, id: "all-holiday-backgrounds", data: { ...seed.data, holidayOccasion: null, pageBackground: getHolidayBackgroundChoice(alternateBackground.id, "custom") } };
    records.set(allOccasions.id, allOccasions);
    await page.goto(`http://localhost:43139/event/general/customize?collection=holidays-seasonal&templateId=${ghosts.id}&edit=${allOccasions.id}`);
    await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("button", { name: /^Design Artwork/ }).click();
    const otherOccasion = GENERAL_EVENT_DESIGNS.find((design) => design.occasion && design.occasion !== "halloween");
    await page.locator(`[data-template-masonry-card="${otherOccasion.id}"] button`).click();
    const otherDefault = getHolidayBackground(otherOccasion.id);
    await page.locator(`[data-holiday-background="${otherDefault.id}"]`).waitFor();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    assert.deepEqual(writes.at(-1).data.manualEditor.snapshot.data.pageBackground, getHolidayBackgroundChoice(otherDefault.id, "template"), "switching occasions replaces an unrelated custom background with the new occasion's default");
    assert.equal(writes.at(-1).data.theme.bgStyle.backgroundColor, otherDefault.page, "draft owner rendering receives the effective solid background");

    // Existing authored pages keep their saved color until the owner explicitly opts in.
    const legacy = { ...seed, id: "legacy-halloween-background", data: { ...seed.data, pageBackground: undefined, status: "published" } };
    records.set(legacy.id, legacy);
    await page.goto(`http://localhost:43139/event/guest?guest=1&id=${legacy.id}&collection=holidays-seasonal`);
    await page.locator(`[data-themed-event-header="${ghosts.id}"]`).waitFor();
    assert.equal(await page.locator("[data-holiday-background]").count(), 0, "legacy published pages do not silently receive a new background");
    const legacyColor = await page.locator(`[data-themed-event-header="${ghosts.id}"]`).evaluate((node) => getComputedStyle(node.closest('[class*="min-h-"]')).backgroundColor);
    assert.equal(legacyColor, "rgb(233, 221, 230)", "the existing saved plum paper is retained");
    await page.goto(`http://localhost:43139/event/general/customize?collection=holidays-seasonal&occasion=halloween&templateId=${ghosts.id}&edit=${legacy.id}`);
    await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("button", { name: /^Background/ }).click();
    assert.equal(await page.locator('input[type="radio"]:checked').count(), 0);
    const writesBeforeReset = writes.length;
    await page.getByRole("radio", { name: defaultBackground.name, exact: true }).check();
    await page.locator(`[data-holiday-background="${defaultBackground.id}"]`).waitFor();
    assert.equal(writes.length, writesBeforeReset, "restoring a template background stays unsaved until an explicit save");
    await page.getByRole("button", { name: "Back to details", exact: true }).click();
    await page.getByRole("button", { name: /^Design Artwork/ }).click();
    await page.locator(`[data-template-masonry-card="${nextDesign.id}"] button`).click();
    await page.locator(`[data-holiday-background="${getHolidayBackground(nextDesign.id).id}"]`).waitFor();
    assert.equal(writes.length, writesBeforeReset, "template-default backgrounds follow the selected design without saving");
    assert.deepEqual(errors, []);
  } catch (error) {
    fs.writeFileSync(path.join(output, "failed-writes.json"), JSON.stringify(writes, null, 2));
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
    throw new Error(`${error.message}\nPage errors: ${JSON.stringify(errors)}\nError locations: ${JSON.stringify(await page.evaluate(() => window.__fixtureErrors))}\nRendered page: ${(await page.locator("body").innerText()).slice(0, 1400)}`);
  } finally { await browser.close(); }
});
