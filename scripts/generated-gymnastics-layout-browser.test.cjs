const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const buildBunFixture = require("./lib/build-bun-fixture.cjs");
const { GYMNASTICS_PRESENTATIONS } = require("jiti").createJiti(__filename, { fsCache: false })(
  path.resolve("src/components/gym-meet-templates/gymnasticsPresentations.ts"),
);

const output = path.resolve("output/generated-gymnastics-layout");
const origin = "http://localhost:43130";

function executablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE)
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google/Chrome/Application/chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

test("generated gymnastics chapters stay single-column until the host pairs sections", {
  timeout: 90_000,
}, async () => {
  buildBunFixture("scripts/build-generated-gymnastics-layout-fixture.mjs");
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const css = fs.readFileSync(path.join(output, "fixture.css"), "utf8");
  const routeCss = fs.readFileSync(path.join(output, "template-editor-route.css"), "utf8");
  const browser = await chromium.launch({ headless: true, executablePath: executablePath() });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [];
  const timezoneQueries = [];
  let releaseSlowTimezone;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/api/events/timezone") {
      const { query } = route.request().postDataJSON();
      timezoneQueries.push(query);
      if (query.includes("Slow")) await new Promise(resolve => { releaseSlowTimezone = resolve; });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ timezone: /Palmetto|Slow/.test(query) ? "America/New_York" : query.includes("Pensacola") ? "America/Chicago" : null }) }).catch(() => {});
    }
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: script });
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html${url.searchParams.has("dark") ? ' class="dark" style="--app-surface:#251f2e;--app-surface-alt:#302738;--app-field-background:#302738;--app-foreground:#eee7f4;--app-muted-foreground:#bfb2cb;--app-border:#50445d;--app-input:#887596;--app-primary:#c4a5fa;--app-primary-foreground:#251f2e"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${url.searchParams.has("route-styles") ? routeCss : css}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:${url.searchParams.has("dark") ? "#111a3a" : "#f6f0e5"}}button{background:transparent;border:0;font-family:inherit}a{color:inherit}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
    });
  });

  async function open(query) {
    await page.goto(`${origin}/?design=moonbeam-balance&generated&${query}`);
    await page.getByRole("tab", { name: "Meet Details", exact: true }).click();
    await page.getByRole("heading", { name: /^Meet Details/ }).waitFor();
  }
  const geometry = () =>
    page.locator("[data-body-sections]").evaluate((canvas) => {
      const box = (element) => {
        const bounds = element.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y, width: bounds.width, right: bounds.right };
      };
      return {
        canvas: box(canvas),
        columns: getComputedStyle(canvas).gridTemplateColumns,
        chapters: [...canvas.querySelectorAll(":scope > section")].map(box),
        rows: [...canvas.querySelectorAll(":scope > [data-section-row]")].map((row) => ({
          box: box(row),
          chapters: [...row.querySelectorAll("section")].map(box),
        })),
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });

  try {
    // Tab rails scroll horizontally on small canvases, never vertically.
    for (const editing of [false, true]) for (const dark of [false, true]) {
      await page.setViewportSize({ width: 768, height: 900 });
      await open(`tabs&width=400${editing ? "&editing" : ""}${dark ? "&dark" : ""}`);
      const rail = page.getByRole("tablist", { name: "Event information", exact: true });
      const names = await rail.getByRole("tab").allTextContents();
      assert.ok(await rail.evaluate(el => el.scrollWidth > el.clientWidth));
      const label = await rail.getByRole("tab").first().boundingBox();
      await page.mouse.move(label.x + 80, label.y + label.height / 2);
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(80);
      assert.equal(await rail.evaluate(el => el.scrollTop), 0, "vertical wheel gestures cannot hide tabs");
      if (editing) {
        const pencil = rail.getByRole("button", { name: "Edit meet details navigation label", exact: true });
        await pencil.focus();
        assert.equal(await rail.evaluate(el => el.scrollTop), 0, "focusing label tools cannot shift tabs vertically");
        await pencil.click();
        await page.getByRole("textbox", { name: "Meet Details navigation label", exact: true }).press("Escape");
      }
      await rail.evaluate(el => { el.scrollLeft = 0; });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      const bounds = await rail.boundingBox();
      const point = { x: bounds.x + bounds.width - 35, y: bounds.y + bounds.height / 2 };
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      for (let dx = 10; dx <= 90; dx += 10) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, x: point.x - dx }] });
        await page.waitForTimeout(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForFunction(() => [...document.querySelectorAll('[role="tablist"]')].some(el => el.scrollLeft > 30));
      assert.equal(await rail.evaluate(el => el.scrollTop), 0);
      assert.deepEqual(await rail.getByRole("tab").allTextContents(), names, "horizontal swiping preserves tab order");
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
      await cdp.detach();
      await rail.getByRole("tab", { name: "Competition Schedule", exact: true }).click();
      assert.equal(await rail.getByRole("tab", { name: "Competition Schedule", exact: true }).getAttribute("aria-selected"), "true");
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await open("layout=template&width=1200");
    const generated = await geometry();
    assert.equal(generated.rows.length, 3);
    assert.ok(generated.rows.every(row => row.chapters.length === 1));
    assert.equal(generated.overflow, 0);
    for (const chapter of generated.rows.flatMap(row => row.chapters).filter(chapter => chapter.width > 0)) {
      assert.ok(Math.abs(chapter.x - generated.canvas.x) <= 1, JSON.stringify(generated));
      assert.ok(Math.abs(chapter.width - generated.canvas.width) <= 1);
    }

    await open("layout=template&width=1200&explicit=split");
    const split = await geometry();
    assert.equal(split.rows.length, 2);
    assert.equal(split.rows[0].chapters.length, 2);
    assert.ok(Math.abs(split.rows[0].chapters[0].y - split.rows[0].chapters[1].y) <= 1);
    assert.ok(split.rows[0].chapters[1].x >= split.rows[0].chapters[0].right);

    await page.setViewportSize({ width: 390, height: 844 });
    await open("layout=template&width=1200");
    const phone = await geometry();
    assert.equal(phone.rows.length, 3);
    assert.equal(phone.overflow, 0);

    for (const width of [1280, 375]) for (const dark of [false, true]) for (const editing of [false, true]) for (const planningOnly of [false, true]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/?design=moonbeam-balance&tabs&planning&hotels=short${planningOnly ? "&planning-only" : ""}${dark ? "&dark" : ""}${editing ? "&editing" : ""}`);
      const details = page.getByRole("tab", { name: "Meet Details", exact: true });
      assert.equal(await details.count(), 1);
      assert.equal(await page.getByRole("tab", { name: "Guest information", exact: true }).count(), 0);
      await details.click();
      const panel = page.getByRole("tabpanel", { name: "Meet Details", exact: true });
      await panel.getByRole("heading", { name: "Before you arrive", exact: true }).waitFor();
      assert.equal(await panel.getByText("Arrive 30 minutes before your session.", { exact: true }).isVisible(), true);
      assert.equal(await panel.getByText("Bring your grips and water bottle.", { exact: true }).isVisible(), true);
      if (!planningOnly) assert.equal(await panel.getByText(/Arrive at Tampa Convention Center/).isVisible(), true);
      if (!planningOnly) {
        const failures = await page.locator("[data-layout-fixture]").evaluate((article, designs) => {
          const failures = [];
          for (const [id, presentation] of Object.entries(designs)) {
            article.dataset.gymDesign = id;
            for (const key of ["layout", "surface", "cards", "heading", "attendance", "navigation"])
              article.dataset[key] = presentation[key];
            for (const chapter of article.querySelectorAll("section[data-section-kind]")) {
              if (!chapter.getBoundingClientRect().width) continue;
              const heading = chapter.querySelector(":scope > header");
              const blocks = heading.nextElementSibling;
              if (blocks.getBoundingClientRect().top < heading.getBoundingClientRect().bottom - 1)
                failures.push(`${id}: section heading and body split into columns`);
            }
            const notes = article.querySelector('[aria-label="Before you arrive"] dl');
            const [first, second] = [...notes.children].map(element => element.getBoundingClientRect());
            if (second.top < first.bottom - 1 || Math.abs(first.x - second.x) > 1)
              failures.push(`${id}: preparation notes split into columns`);
          }
          return failures;
        }, GYMNASTICS_PRESENTATIONS);
        assert.deepEqual(failures, [], `Every gymnastics design stacks headings, bodies and notes at ${width}px`);
      }
      await page.getByRole("tab", { name: "Hotels & Travel", exact: true }).click();
      assert.equal(await page.getByRole("heading", { name: "Before you arrive", exact: true }).isVisible(), false);
      await details.click();
      await page.screenshot({ path: path.join(output, `meet-preparation-${width}-${dark ? "dark" : "light"}-${editing ? "editor" : "guest"}${planningOnly ? "-only" : ""}.png`) });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }

    for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 375, height: 812 }, { width: 812, height: 375 }]) {
      await page.setViewportSize(viewport);
      for (const dark of [false, true]) {
        for (const editing of [false, true]) {
          for (const content of ["short", "long"]) {
            const context = `${viewport.width}/${dark ? "dark" : "light"}/${editing ? "editor" : "guest"}/${content}`;
            await open(`tabs&hotels=${content}&width=1400${dark ? "&dark" : ""}${editing ? "&editing" : ""}`);
            await page.getByRole("tab", { name: "Meet Details", exact: true }).click();
            assert.equal(await page.getByRole("heading", { name: /^Hotels & Travel/ }).isVisible(), false, context);
            const hotelTab = page.getByRole("tab", { name: "Hotels & Travel", exact: true });
            await hotelTab.click();
            await page.getByRole("heading", { name: /^Hotels & Travel/ }).waitFor();
            assert.equal(await page.getByRole("heading", { name: /^Meet Details/ }).isVisible(), false, context);
            const cards = await page.locator("[data-place-card]").evaluateAll(elements => elements.map(element => {
              const rect = element.getBoundingClientRect();
              return { x: rect.x, y: rect.y, width: rect.width, overflow: element.scrollWidth - element.clientWidth, title: element.querySelector("h4").textContent };
            }));
            assert.equal(cards.length, 5, context);
            assert.ok(cards.every(card => card.overflow <= 1), context);
            const detailLayouts = await page.locator("[data-place-card] dl:last-of-type").evaluateAll(elements => elements.map(element => {
              const rows = [...element.children].map(row => {
                const rect = row.getBoundingClientRect();
                return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, overflow: row.scrollWidth - row.clientWidth };
              });
              return { cardWidth: element.closest("[data-place-card]").clientWidth, rows };
            }));
            for (const { rows } of detailLayouts) {
              assert.equal(rows.length, 4, context);
              assert.ok(rows.every(row => row.overflow <= 1), `${context}: detail text stays within its column`);
              assert.ok(rows.every((row, index) => !index || row.y >= rows[index - 1].bottom), `${context}: card details stay in one column`);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, context);
            if (viewport.width === 1440) {
              const firstRow = cards.filter(card => Math.abs(card.y - cards[0].y) < 1);
              assert.equal(firstRow.length, 1, `${context}: hotel cards default to one column`);
            }
            if (!editing && content === "long" && [1440, 375].includes(viewport.width))
              await page.screenshot({ path: path.join(output, `hotels-${viewport.width}-${dark ? "dark" : "light"}.png`), fullPage: true });
            await hotelTab.focus();
            await page.keyboard.press("Home");
            assert.equal(await page.getByRole("tab", { name: "Meet Details", exact: true }).getAttribute("aria-selected"), "true", context);
            assert.equal(await page.getByRole("heading", { name: /^Meet Details/ }).isVisible(), true, context);
          }
        }
      }
    }
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      for (const dark of [false, true]) {
        await open(`tabs&hotels=short&editing${dark ? "&dark" : ""}`);
        assert.equal(await page.getByRole("button", { name: "Manage tabs", exact: true }).count(), 0);
        await page.getByRole("button", { name: "Page sections", exact: true }).click();
        const settings = page.getByRole("region", { name: "Page sections", exact: true });
        const order = settings.getByRole("list", { name: "Page section order", exact: true });
        const names = () => order.locator("li > button").allTextContents();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await settings.getByRole("button", { name: "Select Hotels & Travel section", exact: true }).click();
        await settings.getByRole("button", { name: "Move Hotels & Travel up", exact: true }).click();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await settings.getByRole("button", { name: "Edit Hotels & Travel", exact: true }).click();
        await page.getByLabel("Title", { exact: true }).fill("Host hotels");
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await settings.getByRole("button", { name: "Remove Host hotels section", exact: true }).click();
        assert.equal(await page.getByRole("tab", { name: "Host hotels", exact: true }).count(), 0);
        await settings.getByRole("button", { name: "Host hotels", exact: true }).click();
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await settings.getByRole("button", { name: /^Custom/ }).click();
        await page.getByLabel("Title", { exact: true }).fill("Parent notes");
        await page.getByLabel("Section content", { exact: true }).fill("Bring a water bottle and check in with your coach.");
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await page.getByRole("tab", { name: "Parent notes", exact: true }).click();
        await page.getByText("Bring a water bottle and check in with your coach.", { exact: true }).waitFor();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await page.screenshot({ path: path.join(output, `page-sections-${viewport.width}-${dark ? "dark" : "light"}.png`) });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
    }
    // Adding an empty document beside the only information tab must keep both
    // the canvas and settings usable until the host uploads the schedule.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await open("documents&editing");
      await page.getByRole("group", { name: "Meet Details section", exact: true }).focus();
      await page.keyboard.press("Tab");
      await page.getByRole("group", { name: "Meet Details section", exact: true }).focus();
      await page.getByRole("button", { name: "Place another section beside Meet Details", exact: true }).click();
      await page.getByRole("button", { name: "Documents & links Add beside", exact: true }).click();
      await page.getByRole("button", { name: "Close section panel", exact: true }).click();
      assert.deepEqual(await page.getByRole("tab").allTextContents(), ["Meet Details", "Documents & links"]);
      await page.getByRole("tab", { name: "Meet Details", exact: true }).click();
      const panel = page.getByRole("tabpanel", { name: "Meet Details", exact: true });
      await panel.getByRole("heading", { name: /^Meet Details/ }).waitFor({ timeout: 3000 }).catch(async (error) => {
        fs.writeFileSync(path.join(output, "documents-failure.html"), await page.content());
        await page.screenshot({ path: path.join(output, "documents-failure.png"), fullPage: true });
        throw error;
      });
      const documentSection = panel.getByRole("group", { name: "Documents & links section", exact: true });
      await page.keyboard.press("Tab"); await documentSection.focus();
      await panel.getByRole("button", { name: "Edit Documents & links", exact: true }).waitFor();
      assert.equal(await page.locator('[data-section-row="meet-details documents"]').count(), 1);
      await page.getByRole("button", { name: "Page sections", exact: true }).click();
      const settings = page.getByRole("region", { name: "Page sections", exact: true });
      await settings.getByRole("button", { name: "Select Documents & links section", exact: true }).click();
      await settings.getByRole("button", { name: "Edit Documents & links", exact: true }).click();
      await page.getByText("Edit section details.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Close section panel", exact: true }).click();
      assert.equal(await settings.getByRole("button", { name: "Documents & links", exact: true }).count(), 0);
      await page.screenshot({ path: path.join(output, `documents-beside-details-${viewport.width}.png`), fullPage: true });
      await settings.getByRole("button", { name: "Remove Documents & links section", exact: true }).click();
      const remainingRow = page.locator('[data-section-row="meet-details"]');
      const remainingCell = remainingRow.locator(':scope > [data-section-width]');
      assert.equal(await remainingCell.getAttribute("data-section-width"), "12");
      assert.equal(await panel.getByRole("button", { name: "Move Meet Details to its own row", exact: true }).count(), 0);
      const size = await remainingCell.evaluate(cell => ({ cell: cell.getBoundingClientRect().width, row: cell.parentElement.getBoundingClientRect().width }));
      assert.ok(Math.abs(size.cell - size.row) <= 1, "removing the neighbor immediately fills the available row");
      await page.screenshot({ path: path.join(output, `remaining-section-full-width-${viewport.width}.png`), fullPage: true });
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      assert.equal(await page.locator('[data-section-row="meet-details documents"]').count(), 1, "Undo restores the paired row");
    }
    // Reproduce a paired document missing from the rail and an empty Travel tab
    // disappearing when the editor tools are removed for preview or guest reload.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      for (const dark of [false, true]) {
        await page.goto(`${origin}/`);
        await page.evaluate(() => localStorage.removeItem("gymnastics-tab-sync"));
        await open(`documents&editing&saved-tabs&context-layout${dark ? "&dark" : ""}`);
        await page.getByRole("group", { name: "Meet Details section", exact: true }).focus();
      await page.keyboard.press("Tab");
      await page.getByRole("group", { name: "Meet Details section", exact: true }).focus();
      await page.getByRole("button", { name: "Place another section beside Meet Details", exact: true }).click();
        await page.getByRole("button", { name: "Documents & links Add beside", exact: true }).click();
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await page.getByRole("button", { name: "Page sections", exact: true }).click();
        const settings = page.getByRole("region", { name: "Page sections", exact: true });
        await settings.getByRole("button", { name: "Travel & parking", exact: true }).click();
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await settings.getByRole("button", { name: "Select Travel & parking section", exact: true }).click();
        await settings.getByRole("button", { name: "Move Travel & parking up", exact: true }).click();
        const expected = await settings.getByRole("list", { name: "Page section order", exact: true }).locator("li > button").allTextContents();
        const tabNames = () => page.getByRole("tab").evaluateAll(tabs => tabs.map(tab => tab.getAttribute("aria-label") || tab.textContent));
        assert.deepEqual(await tabNames(), expected);
        await page.getByRole("tab", { name: "Travel & parking", exact: true }).click();
        await page.getByRole("tabpanel").getByRole("heading", { name: /^Travel & parking/ }).waitFor();
        await page.getByRole("button", { name: "Preview page", exact: true }).click();
        assert.deepEqual(await tabNames(), expected, "preview keeps every editor tab in order");
        await page.getByRole("tab", { name: "Travel & parking", exact: true }).click();
        await page.getByRole("tabpanel").getByRole("heading", { name: "Travel & parking", exact: true }).waitFor();
        await page.getByRole("button", { name: "Save fixture", exact: true }).click();
        await page.goto(`${origin}/?design=moonbeam-balance&documents&saved-tabs${dark ? "&dark" : ""}`);
        assert.deepEqual(await tabNames(), expected, "saved guest reload keeps paired and empty added tabs");
        await page.getByRole("tab", { name: "Documents & links", exact: true }).click();
        await page.getByRole("tabpanel").getByRole("heading", { name: "Documents & links", exact: true }).waitFor();
        await page.getByRole("tab", { name: "Travel & parking", exact: true }).click();
        await page.getByRole("tabpanel").getByRole("heading", { name: "Travel & parking", exact: true }).waitFor();
        await page.screenshot({ path: path.join(output, `saved-tab-sync-${viewport.width}-${dark ? "dark" : "light"}.png`), fullPage: true });
      }
    }
    // Canvas-only section choices, repeatable custom tabs and the real schedule editor.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      for (const dark of [false, true]) {
        await page.goto(`${origin}/`);
        await page.evaluate(() => localStorage.removeItem("gymnastics-tab-sync"));
        await open(`schedule-editor&editing&saved-tabs&route-styles${dark ? "&dark" : ""}`);
        await page.getByRole("button", { name: "Add tab", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: "Schedule", exact: true }).click();
        await dialog.getByRole("button", { name: "Done", exact: true }).click();
        assert.equal(await page.getByRole("tab", { name: "Schedule", exact: true }).getAttribute("aria-selected"), "true");
        await page.getByRole("button", { name: "Add schedule", exact: true }).click();
        assert.equal(await dialog.getByLabel("Title", { exact: true }).count(), 0, "schedule content does not rename the parent tab");
        assert.equal(await dialog.getByRole("button", { name: "Schedule settings", exact: true }).count(), 0);
        assert.equal(await dialog.getByText("Public Meet Schedule", { exact: true }).count(), 0);
        const panelStyles = await dialog.evaluate(el => ({
          display: getComputedStyle(el).display,
          footer: getComputedStyle(el.lastElementChild).display,
          gap: getComputedStyle(el.lastElementChild).gap,
        }));
        assert.deepEqual(panelStyles, { display: "flex", footer: "flex", gap: "12px" }, "route CSS styles the panel and footer without the lazy editor stylesheet");
        await page.screenshot({ path: path.join(output, `schedule-actions-${viewport.width}-${dark ? "dark" : "light"}.png`) });
        await dialog.getByRole("button", { name: "Done", exact: true }).click();
        await page.getByRole("tabpanel").getByRole("button", { name: /^Add section at position/ }).first().click();
        await dialog.getByRole("heading", { name: "Add to schedule", exact: true }).waitFor();
        await dialog.getByRole("button", { name: "Add Day", exact: true }).click();
        await dialog.getByLabel("Date", { exact: true }).fill("2027-04-10");
        await dialog.getByRole("button", { name: "Add to event", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        const scheduleCanvas = page.getByRole("region", { name: "Meet schedule", exact: true });
        await scheduleCanvas.getByRole("button", { name: "Edit Saturday, April 10, 2027", exact: true }).click();
        await dialog.getByRole("heading", { name: "Saturday, Apr 10", exact: true }).waitFor();
        await dialog.getByLabel("Day title", { exact: true }).fill("Saturday • Apr 10");
        await dialog.getByLabel("Day title", { exact: true }).blur();
        await dialog.getByRole("heading", { level: 2, name: "Saturday • Apr 10", exact: true }).waitFor();
        await dialog.getByRole("button", { name: "Add Session", exact: true }).click();
        await dialog.getByRole("heading", { name: "New session", exact: true }).waitFor();
        await dialog.getByPlaceholder("Session FR1", { exact: true }).fill("Junior competition");
        await dialog.getByLabel("Session title", { exact: true }).blur();
        await dialog.getByRole("heading", { name: "Junior competition", exact: true }).waitFor();
        const panelBounds = await dialog.boundingBox();
        assert.ok(panelBounds.width <= (viewport.width > 767 ? 442 : viewport.width), "schedule panel stays within its sheet");
        assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false);
        await page.screenshot({ path: path.join(output, `schedule-subsection-${viewport.width}-${dark ? "dark" : "light"}.png`) });
        await dialog.getByRole("button", { name: "Done", exact: true }).click();
        await page.getByRole("heading", { name: "Junior competition", exact: true }).waitFor();
        await scheduleCanvas.getByRole("button", { name: "Edit Saturday, April 10, 2027", exact: true }).click();
        assert.equal(await dialog.getByLabel("Date", { exact: true }).inputValue(), "2027-04-10");
        assert.equal(await dialog.getByLabel("Calendar date (YYYY-MM-DD)", { exact: true }).count(), 0);
        await dialog.getByLabel("Date", { exact: true }).fill("2027-04-11");
        assert.equal(await dialog.getByLabel("Day title", { exact: true }).inputValue(), "Saturday • Apr 10", "changing the date retains an authored day title");
        await dialog.getByLabel("Date", { exact: true }).fill("2027-04-10");
        await dialog.getByRole("button", { name: "Junior competition · Edit session", exact: true }).click();
        assert.equal(await dialog.getByPlaceholder("Session FR1", { exact: true }).inputValue(), "Junior competition");
        await dialog.getByRole("button", { name: "Done", exact: true }).click();
        const previousTabNames = await page.getByRole("tab").allTextContents();
        await page.getByRole("tabpanel").getByRole("button", { name: /^Add section at position/ }).first().click();
        await dialog.getByRole("heading", { name: "Add to schedule", exact: true }).waitFor();
        assert.equal(await dialog.getByRole("button", { name: /^Custom/ }).count(), 0);
        await dialog.getByRole("button", { name: "Edit Saturday, April 10, 2027", exact: true }).click();
        await dialog.getByRole("button", { name: "Add Session", exact: true }).click();
        await dialog.getByLabel("Session title", { exact: true }).fill("Afternoon awards");
        await dialog.getByRole("button", { name: "Done", exact: true }).click();
        await page.getByRole("heading", { name: "Afternoon awards", exact: true }).waitFor();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), previousTabNames);
        await page.getByRole("button", { name: "Edit schedule", exact: true }).click();
        assert.deepEqual((await dialog.getByRole("button").allTextContents()).slice(1, 6).map(text => text.trim()), ["Upload schedule", "Take a photo", "Add Day", "Add Week", "Add Month"]);
        await dialog.getByLabel("Schedule notes", { exact: true }).fill("Check the final session assignment before travelling.");
        await dialog.getByRole("button", { name: "Add Week", exact: true }).click();
        await dialog.getByLabel("Week starting", { exact: true }).fill("2027-04-08");
        await dialog.getByRole("button", { name: "Add to event", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        assert.equal(await scheduleCanvas.getByRole("button", { name: /^Edit / }).count(), 7);
        await scheduleCanvas.getByRole("heading", { name: "Apr 8 – Apr 14, 2027", exact: true }).waitFor();
        await page.getByRole("button", { name: "Edit schedule", exact: true }).click();
        await dialog.getByRole("button", { name: "Add Month", exact: true }).click();
        await dialog.getByRole("button", { name: "Add to event", exact: true }).click();
        await dialog.getByRole("alert").getByText("Choose a calendar month.", { exact: true }).waitFor();
        assert.equal(await dialog.getByRole("button", { name: "Done", exact: true }).count(), 0, "the footer adds the month instead of dismissing it");
        assert.equal(await dialog.locator('input[type="month"]').count(), 0);
        const month = dialog.getByRole("combobox", { name: "Month", exact: true });
        const year = dialog.getByRole("combobox", { name: "Year", exact: true });
        assert.equal(await month.getByRole("option").count(), 13);
        const current = await page.evaluate(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }));
        await month.selectOption("12");
        await year.selectOption(String(current.year));
        if (current.month > 1) {
          await month.selectOption("01");
          assert.equal(await year.inputValue(), "");
          assert.equal(await year.locator(`option[value="${current.year}"]`).count(), 0, "January excludes an elapsed year/month combination");
        }
        await month.selectOption({ label: "April" });
        await year.selectOption("2027");
        assert.equal(await month.inputValue(), "04");
        await page.screenshot({ path: path.join(output, `schedule-month-dropdowns-${viewport.width}-${dark ? "dark" : "light"}.png`) });
        await dialog.getByRole("button", { name: "Add to event", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await scheduleCanvas.getByRole("heading", { name: "April 2027", exact: true }).waitFor();
        assert.equal(await scheduleCanvas.getByRole("button", { name: /^Edit / }).count(), 30);
        assert.equal(await scheduleCanvas.getByRole("button", { name: "Edit day", exact: true }).count(), 0);
        await page.screenshot({ path: path.join(output, `schedule-calendar-${viewport.width}-${dark ? "dark" : "light"}.png`) });
        await scheduleCanvas.getByRole("group", { name: "Schedule periods", exact: true }).getByRole("button", { name: "Apr 8 – Apr 14, 2027", exact: true }).click();
        assert.equal(await scheduleCanvas.getByRole("button", { name: /^Edit / }).count(), 7);
        await page.getByRole("button", { name: "Edit schedule", exact: true }).click();
        await dialog.getByRole("button", { name: "Add Month", exact: true }).click();
        await year.selectOption("2027");
        await month.selectOption({ label: "April" });
        await dialog.getByRole("button", { name: "Add to event", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        assert.equal(await scheduleCanvas.getByRole("button", { name: /^Edit / }).count(), 30, "a repeated month creates no duplicate dates");
        await scheduleCanvas.getByRole("button", { name: "Edit Saturday, April 10, 2027", exact: true }).click();
        await dialog.getByRole("button", { name: "Junior competition · Edit session", exact: true }).waitFor();
        await dialog.getByRole("button", { name: "Afternoon awards · Edit session", exact: true }).waitFor();
        await dialog.getByRole("button", { name: "Done", exact: true }).click();
        await page.getByRole("button", { name: "Move Schedule tab left", exact: true }).click();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), ["Schedule", "Meet Details"]);
        assert.equal(await page.getByRole("button", { name: "Move Schedule tab left", exact: true }).isDisabled(), true);
        await page.getByRole("button", { name: "Move Schedule tab right", exact: true }).click();
        if (viewport.width > 640) {
          const handle = page.getByRole("button", { name: "Drag Schedule tab", exact: true });
          await handle.focus();
          await page.keyboard.press("Space");
          await page.waitForFunction(() => document.querySelector('button[aria-label="Drag Schedule tab"]')?.getAttribute("aria-pressed") === "true");
          await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes("moved over droppable area schedule")));
          // KeyboardSensor installs its document listener on the next timer turn.
          await page.waitForTimeout(100);
          const keyboardStart = await handle.boundingBox();
          for (const key of ["ArrowUp", "ArrowDown"]) {
            await page.keyboard.press(key);
            const position = await handle.boundingBox();
            assert.ok(Math.abs(position.y - keyboardStart.y) <= 1, `${key} cannot move a tab vertically`);
          }
          await page.keyboard.press("ArrowLeft");
          await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes("moved over droppable area meet-details")));
          await page.keyboard.press("Space");
          await page.waitForFunction(() => document.querySelector('[role="tab"]')?.textContent === "Schedule");
          assert.deepEqual(await page.getByRole("tab").allTextContents(), ["Schedule", "Meet Details"]);
          const start = await handle.boundingBox();
          const target = await page.getByRole("tab", { name: "Meet Details", exact: true }).boundingBox();
          await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
          await page.mouse.down();
          for (const dy of [-100, 100]) {
            await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + dy, { steps: 8 });
            await page.waitForFunction(() => document.querySelector('button[aria-label="Drag Schedule tab"]')?.getAttribute("aria-pressed") === "true");
            const position = await handle.boundingBox();
            assert.ok(Math.abs(position.y - start.y) <= 1, "dragging up or down keeps the tab on its horizontal rail");
          }
          await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2 + 100, { steps: 12 });
          assert.ok(Math.abs((await handle.boundingBox()).y - start.y) <= 1, "diagonal dragging moves a tab horizontally only");
          await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes("moved over droppable area meet-details")));
          await page.mouse.up();
          await page.waitForFunction(() => document.querySelector('[role="tab"]')?.textContent === "Meet Details");
          // dnd-kit absorbs the drop click for 50ms before a separate action can start.
          await page.waitForTimeout(60);
        }
        for (const title of ["Parent notes", "Team reminders"]) {
          await page.getByRole("button", { name: "Add tab", exact: true }).click();
          await dialog.getByRole("button", { name: /^Custom/ }).waitFor();
          const choices = await dialog.getByRole("button").allTextContents();
          assert.match(choices.at(-1), /^Custom/);
          await dialog.getByRole("button", { name: /^Custom/ }).click();
          await dialog.getByLabel("Title", { exact: true }).fill(title);
          await dialog.getByLabel("Section content", { exact: true }).fill(`${title} content`);
          await dialog.getByRole("button", { name: "Done", exact: true }).click();
          assert.equal(await page.getByRole("tab", { name: title, exact: true }).getAttribute("aria-selected"), "true");
        }
        const swipe = async (dx, dy = 0) => page.getByRole("tabpanel").evaluate((panel, { dx, dy }) => {
          const point = { identifier: 1, target: panel, clientX: 180, clientY: 300 };
          panel.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [new Touch(point)] }));
          panel.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [new Touch({ ...point, clientX: 180 + dx, clientY: 300 + dy })] }));
        }, { dx, dy });
        await swipe(100);
        assert.equal(await page.getByRole("tab", { name: "Parent notes", exact: true }).getAttribute("aria-selected"), "true", "swipe right opens the previous tab");
        await swipe(-100, 100);
        assert.equal(await page.getByRole("tab", { name: "Parent notes", exact: true }).getAttribute("aria-selected"), "true", "vertical scrolling does not switch tabs");
        await swipe(-100);
        assert.equal(await page.getByRole("tab", { name: "Team reminders", exact: true }).getAttribute("aria-selected"), "true", "swipe left opens the next tab");
        const expected = await page.getByRole("tab").allTextContents();
        await page.screenshot({ path: path.join(output, `canvas-tab-controls-${viewport.width}-${dark ? "dark" : "light"}.png`), fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.getByRole("button", { name: "Save fixture", exact: true }).click();
        await page.goto(`${origin}/?schedule-editor&saved-tabs${dark ? "&dark" : ""}`);
        assert.deepEqual(await page.getByRole("tab").allTextContents(), expected);
        await page.getByRole("tab", { name: "Schedule", exact: true }).click();
        const savedSchedule = page.getByRole("region", { name: "Meet schedule", exact: true });
        await savedSchedule.getByRole("heading", { name: "April 2027", exact: true }).waitFor();
        assert.equal(await savedSchedule.getByRole("button", { name: /^View / }).count(), 30);
        await savedSchedule.getByRole("button", { name: "View Saturday, April 10, 2027", exact: true }).click();
        await savedSchedule.getByRole("heading", { name: "Junior competition", exact: true }).waitFor();
        await savedSchedule.getByRole("heading", { name: "Afternoon awards", exact: true }).waitFor();
        await savedSchedule.getByRole("button", { name: "View Thursday, April 1, 2027", exact: true }).click();
        await savedSchedule.getByText("Sessions to be announced.", { exact: true }).waitFor();
        await savedSchedule.getByText("Check the final session assignment before travelling.", { exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Add tab", exact: true }).count(), 0, "guest view has no tab editing tools");
      }
    }
    // The Page settings entry uses the same subsection heading without a dialog.
    await page.goto(`${origin}/?schedule-settings`);
    await page.getByRole("button", { name: "Add Day", exact: true }).click();
    await page.getByLabel("Date", { exact: true }).fill("2027-04-11");
    await page.getByRole("button", { name: "Add to event", exact: true }).click();
    await page.getByRole("button", { name: "Edit Sunday, April 11, 2027", exact: true }).click();
    await page.getByLabel("Day title", { exact: true }).fill("Sunday finals");
    await page.getByLabel("Day title", { exact: true }).blur();
    await page.getByRole("heading", { name: "Sunday finals", exact: true }).waitFor();
    await page.getByRole("button", { name: "Add Session", exact: true }).click();
    await page.getByLabel("Session title", { exact: true }).fill("Final awards");
    await page.getByLabel("Session title", { exact: true }).blur();
    await page.getByRole("heading", { name: "Final awards", exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to day", exact: false }).click();
    await page.getByRole("heading", { name: "Sunday finals", exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to schedule", exact: false }).click();
    await page.getByRole("heading", { name: "Schedule", exact: true }).waitFor();
    // The same section controls work without the gymnastics presentation or native tabs.
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${origin}/`);
      await page.evaluate(() => localStorage.removeItem("gymnastics-tab-sync"));
      await page.goto(`${origin}/?shared&editing&tabs&saved-tabs`);
      const navigation = page.getByRole("navigation", { name: "Page navigation", exact: true });
      await navigation.getByRole("link", { name: "Competition Schedule", exact: true }).click();
      await page.getByRole("button", { name: "Move Competition Schedule tab left", exact: true }).click();
      assert.deepEqual(await navigation.getByRole("link").allTextContents(), ["Competition Schedule", "Meet Details", "Parking and Arrival"]);
      await page.getByRole("button", { name: "Add tab", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: /^Custom/ }).click();
      await page.getByLabel("Title", { exact: true }).fill("Guest notes");
      await page.getByLabel("Section content", { exact: true }).fill("Native page custom content.");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await navigation.getByRole("link", { name: "Guest notes", exact: true }).click();
      await page.getByRole("button", { name: "Edit Guest notes content", exact: true }).click();
      assert.equal(await page.getByLabel("Section content", { exact: true }).inputValue(), "Native page custom content.");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await page.getByRole("button", { name: "Save fixture", exact: true }).click();
      await page.goto(`${origin}/?shared&tabs&saved-tabs`);
      assert.deepEqual(await navigation.getByRole("link").allTextContents(), ["Competition Schedule", "Meet Details", "Parking and Arrival", "Guest notes"]);
      assert.equal(await page.getByRole("button", { name: "Add tab", exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    // A host's Chicago device/legacy zone must not override Palmetto's geographic zone.
    await page.goto(`${origin}/`);
    await page.evaluate(() => localStorage.removeItem("location-timezone-fixture"));
    await page.goto(`${origin}/?timezone`);
    await page.waitForFunction(() => document.querySelector("[data-zone]")?.textContent === "America/New_York");
    assert.equal(await page.locator("[data-event-timezone]").count(), 0, "timezone controls are never rendered");
    await page.getByLabel("Event address", { exact: true }).fill("999 Slow Street, Palmetto, FL");
    await page.waitForFunction(() => document.querySelector("[data-zone-state]")?.textContent === "finding");
    // A newer event address wins over a late response for the old location.
    for (let attempt = 0; !releaseSlowTimezone && attempt < 30; attempt++) await page.waitForTimeout(50);
    assert.ok(releaseSlowTimezone);
    await page.getByLabel("Event address", { exact: true }).fill("45 Garden Road, Pensacola, FL");
    await page.waitForFunction(() => document.querySelector("[data-zone]")?.textContent === "America/Chicago");
    releaseSlowTimezone();
    await page.getByRole("button", { name: "Save time zone", exact: true }).click();
    const before = timezoneQueries.length;
    await page.reload();
    await page.waitForTimeout(750);
    assert.equal(await page.locator("[data-zone]").textContent(), "America/Chicago");
    assert.equal(timezoneQueries.length, before, "saved location matches are reused without a timezone interface");
    await page.getByLabel("Event address", { exact: true }).fill("Unknown event location");
    await page.waitForFunction(() => document.querySelector("[data-zone]")?.textContent === "");
    await page.waitForTimeout(750);
    assert.equal(await page.locator("[data-zone]").textContent(), "", "unresolved locations do not fall back to the device zone");
    // Resizing never creates automatic detail columns.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open("tabs&hotels=long&width=1400");
    await page.getByRole("tab", { name: "Hotels & Travel", exact: true }).click();
    const firstCard = page.locator("[data-place-card]").first();
    for (const width of [300, 420, 300]) {
      await firstCard.evaluate((card, width) => { card.style.width = `${width}px`; }, width);
      const rows = await firstCard.locator("dl:last-of-type > div").evaluateAll(elements =>
        elements.map(element => element.getBoundingClientRect().y));
      assert.ok(rows.every((y, index) => !index || y > rows[index - 1]),
        `details stay in one column at ${width}px without reloading`);
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true })
      .catch(screenshotError => console.error("Could not save the failure screenshot:", screenshotError.message));
    throw error;
  } finally {
    await browser.close();
  }
});

test("schedule add and remove controls work on the canvas and in the menu without changing saved data before Save", {
  timeout: 60_000,
}, async () => {
  buildBunFixture("scripts/build-generated-gymnastics-layout-fixture.mjs");
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const css = fs.readFileSync(path.join(output, "template-editor-route.css"), "utf8");
  const load = require("./lib/event-messages-test-loader.cjs");
  const { createGymnasticsScheduleDay, gymnasticsScheduleRangeDates } = load("src/lib/gymnastics-schedule-range.ts");
  const browser = await chromium.launch({ headless: true, executablePath: executablePath() });
  try {
    for (const mobile of [false, true]) for (const dark of [false, true]) {
      const page = await browser.newPage({ viewport: { width: mobile ? 375 : 1280, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
      page.setDefaultTimeout(8_000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
        return route.fulfill({ contentType: "text/html", body: `<html${dark ? ' class="dark" style="--app-surface:#251f2e;--app-field-background:#302738;--app-foreground:#eee7f4;--app-muted-foreground:#bfb2cb;--app-border:#50445d;--app-input:#887596;--app-primary:#c4a5fa;--app-primary-foreground:#251f2e"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}*{box-sizing:border-box}body{margin:0;background:${dark ? "#111b3a" : "#f6f0e5"};color:${dark ? "#fff" : "#1b3040"}}button{background:transparent;border:0;font-family:inherit;color:inherit}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
      });
      const days = gymnasticsScheduleRangeDates("month", "2027-01").map((date, index) => createGymnasticsScheduleDay(date, `day-${index + 1}`));
      days[9].sessions = [
        { id: "junior", label: "Junior competition", group: "Level 8", startTime: "09:00", warmupTime: "08:30", clubs: [{ id: "club", name: "Host gym" }] },
        { id: "awards", label: "Afternoon awards", clubs: [] },
      ];
      const seed = { layout: { version: 1, order: ["meet-details", "schedule"], added: ["schedule"], hidden: [] }, schedule: {
        enabled: true, venueLabel: "Retained venue", supportEmail: "meet@example.test", notes: ["Retained schedule notes"], source: { packet: "original" }, days,
        periods: [{ kind: "day", startDate: "2027-01-10" }, { kind: "week", startDate: "2027-01-08" }, { kind: "month", startDate: "2027-01-01" }],
      } };
      await page.goto(origin);
      await page.evaluate(value => localStorage.setItem("gymnastics-tab-sync", JSON.stringify(value)), seed);
      const editUrl = `${origin}/?schedule-editor&editing&saved-tabs${dark ? "&dark" : ""}`;
      await page.goto(editUrl);
      await page.getByRole("tab", { name: "Schedule", exact: true }).click();
      const canvas = page.getByRole("region", { name: "Meet schedule", exact: true });
      const dialog = page.getByRole("dialog");
      const dayTen = () => canvas.getByRole("button", { name: "Edit Sunday, January 10, 2027", exact: true });
      const confirm = async kind => {
        await dialog.getByRole("button", { name: `Remove ${kind} from schedule`, exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
      };
      await canvas.getByRole("button", { name: "Remove month: January 2027", exact: true }).click();
      await dialog.getByText("This removes 24 days and 0 sessions from your schedule.", { exact: true }).waitFor();
      await dialog.getByRole("button", { name: "Keep month", exact: true }).click();
      await dialog.getByRole("button", { name: "Remove month: January 2027", exact: true }).click();
      await confirm("month");
      assert.equal(await canvas.getByRole("button", { name: /^Edit / }).count(), 7);
      await canvas.getByRole("button", { name: "Remove week: Jan 8 – Jan 14, 2027", exact: true }).click();
      await confirm("week");
      assert.equal(await canvas.getByRole("button", { name: /^Edit / }).count(), 1);
      const plus = canvas.getByRole("button", { name: "Add to schedule", exact: true });
      if (mobile) await plus.tap(); else await plus.click();
      await dialog.getByRole("heading", { name: "Add to schedule", exact: true }).waitFor();
      await dialog.getByRole("button", { name: "Add Day", exact: true }).click();
      await dialog.getByLabel("Date", { exact: true }).fill("2027-01-15");
      await dialog.getByRole("button", { name: "Add to event", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await canvas.getByRole("button", { name: "Edit Friday, January 15, 2027", exact: true }).click();
      await dialog.getByRole("button", { name: "Remove Day", exact: true }).click();
      await dialog.getByRole("button", { name: "Keep day", exact: true }).click();
      assert.equal(await dialog.getByLabel("Date", { exact: true }).inputValue(), "2027-01-15");
      await dialog.getByRole("button", { name: "Remove Day", exact: true }).click();
      await confirm("day");
      await dayTen().click();
      await dialog.getByRole("button", { name: "Junior competition · Edit session", exact: true }).click();
      await dialog.getByRole("button", { name: "Remove Session", exact: true }).click();
      await dialog.getByRole("button", { name: "Keep session", exact: true }).click();
      assert.equal(await dialog.getByLabel("Session title", { exact: true }).inputValue(), "Junior competition");
      await dialog.getByRole("button", { name: "Remove Session", exact: true }).click();
      await confirm("session");
      assert.equal(await canvas.getByRole("heading", { name: "Junior competition", exact: true }).count(), 0);
      await canvas.getByRole("heading", { name: "Afternoon awards", exact: true }).waitFor();
      await canvas.getByRole("button", { name: "Remove session: Afternoon awards", exact: true }).click();
      await confirm("session");
      await canvas.getByText("Sessions to be announced.", { exact: true }).waitFor();
      await canvas.getByRole("button", { name: "Remove day: Sunday, Jan 10", exact: true }).click();
      await confirm("day");
      await page.getByRole("button", { name: "Add schedule", exact: true }).waitFor();
      const beforeSave = await page.evaluate(() => JSON.parse(localStorage.getItem("gymnastics-tab-sync")));
      assert.equal(beforeSave.schedule.days.length, 31, "removal stays unsaved until explicit Save");
      await page.getByRole("button", { name: "Save fixture", exact: true }).click();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("gymnastics-tab-sync")));
      assert.equal(saved.schedule.days.length, 0);
      assert.equal(saved.schedule.venueLabel, "Retained venue");
      assert.equal(saved.schedule.supportEmail, "meet@example.test");
      assert.deepEqual(saved.schedule.source, { packet: "original" });
      assert.deepEqual(saved.schedule.notes, ["Retained schedule notes"]);
      await page.screenshot({ path: path.join(output, `removed-schedule-${mobile ? "phone" : "desktop"}-${dark ? "dark" : "light"}.png`) });
      // Guest and clean preview calendars expose viewing controls only.
      await page.evaluate(value => localStorage.setItem("gymnastics-tab-sync", JSON.stringify(value)), seed);
      await page.goto(`${origin}/?schedule-editor&saved-tabs${dark ? "&dark" : ""}`);
      await page.getByRole("tab", { name: "Schedule", exact: true }).click();
      assert.equal(await page.getByRole("button", { name: /^Remove / }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Add to schedule", exact: true }).count(), 0);
      await page.getByRole("button", { name: "View Sunday, January 10, 2027", exact: true }).click();
      await page.getByRole("heading", { name: "Junior competition", exact: true }).waitFor();
      await page.getByText("Host gym", { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
});
