const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const buildBunFixture = require("./lib/build-bun-fixture.cjs");

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
  const browser = await chromium.launch({ headless: true, executablePath: executablePath() });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript", body: script });
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:${url.searchParams.has("dark") ? "#111a3a" : "#f6f0e5"}}button{background:transparent;border:0;font-family:inherit}a{color:inherit}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
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
            for (const { cardWidth, rows } of detailLayouts) {
              assert.equal(rows.length, 4, context);
              assert.ok(rows.every(row => row.overflow <= 1), `${context}: detail text stays within its column`);
              if (cardWidth >= 360) {
                assert.ok(Math.abs(rows[0].y - rows[1].y) <= 1, `${context}: parking and breakfast share a row`);
                assert.ok(Math.abs(rows[2].y - rows[3].y) <= 1, `${context}: booking deadline and phone share a row`);
                assert.ok(rows[1].x >= rows[0].right, `${context}: detail columns do not overlap`);
              } else {
                assert.ok(rows[1].y >= rows[0].bottom, `${context}: narrow cards stack their details`);
              }
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, context);
            if (viewport.width === 1440) {
              const firstRow = cards.filter(card => Math.abs(card.y - cards[0].y) < 1);
              assert.equal(firstRow.length, content === "long" ? 2 : 3, `${context}: density follows content`);
              if (content === "long") assert.ok(cards.every(card => card.width > 500), context);
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
        const names = () => order.locator("li > span:first-child").allTextContents();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await settings.getByRole("button", { name: "Move Hotels & Travel up", exact: true }).click();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await settings.getByRole("button", { name: "Edit Hotels & Travel", exact: true }).click();
        await page.getByLabel("Section name", { exact: true }).fill("Host hotels");
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        assert.deepEqual(await page.getByRole("tab").allTextContents(), await names());
        await settings.getByRole("button", { name: "Remove Host hotels section", exact: true }).click();
        assert.equal(await page.getByRole("tab", { name: "Host hotels", exact: true }).count(), 0);
        await settings.getByRole("button", { name: "Host hotels", exact: true }).click();
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await settings.getByRole("button", { name: /^Other/ }).click();
        await page.getByLabel("Section heading", { exact: true }).fill("Parent notes");
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
      await page.getByRole("button", { name: "Place another section beside Meet Details", exact: true }).click();
      await page.getByRole("button", { name: "Documents & links Add beside", exact: true }).click();
      await page.getByRole("button", { name: "Close section panel", exact: true }).click();
      assert.deepEqual(await page.getByRole("tab").allTextContents(), ["Meet Details", "Documents & links"]);
      const panel = page.getByRole("tabpanel", { name: "Meet Details", exact: true });
      await panel.getByRole("heading", { name: /^Meet Details/ }).waitFor({ timeout: 3000 }).catch(async (error) => {
        fs.writeFileSync(path.join(output, "documents-failure.html"), await page.content());
        await page.screenshot({ path: path.join(output, "documents-failure.png"), fullPage: true });
        throw error;
      });
      await panel.getByRole("button", { name: "Edit Documents & links", exact: true }).waitFor();
      assert.equal(await page.locator('[data-section-row="meet-details documents"]').count(), 1);
      await page.getByRole("button", { name: "Page sections", exact: true }).click();
      const settings = page.getByRole("region", { name: "Page sections", exact: true });
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
        await page.getByRole("button", { name: "Place another section beside Meet Details", exact: true }).click();
        await page.getByRole("button", { name: "Documents & links Add beside", exact: true }).click();
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await page.getByRole("button", { name: "Page sections", exact: true }).click();
        const settings = page.getByRole("region", { name: "Page sections", exact: true });
        await settings.getByRole("button", { name: "Travel & parking", exact: true }).click();
        await page.getByRole("button", { name: "Close section panel", exact: true }).click();
        await settings.getByRole("button", { name: "Move Travel & parking up", exact: true }).click();
        const expected = await settings.getByRole("list", { name: "Page section order", exact: true }).locator("li > span:first-child").allTextContents();
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
    // Changing the available card width must reflow details without navigation or a saved layout choice.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open("tabs&hotels=long&width=1400");
    await page.getByRole("tab", { name: "Hotels & Travel", exact: true }).click();
    const firstCard = page.locator("[data-place-card]").first();
    for (const width of [300, 420, 300]) {
      await firstCard.evaluate((card, width) => { card.style.width = `${width}px`; }, width);
      const rows = await firstCard.locator("dl:last-of-type > div").evaluateAll(elements =>
        elements.map(element => element.getBoundingClientRect().y));
      assert.equal(Math.abs(rows[0] - rows[1]) <= 1, width >= 360,
        `details automatically reflow at ${width}px without reloading`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
