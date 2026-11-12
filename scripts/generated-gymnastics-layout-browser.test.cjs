const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const buildBunFixture = require("./lib/build-bun-fixture.cjs");

const output = path.resolve("output/generated-gymnastics-layout");
const origin = "http://generated-gymnastics-layout.test";

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
    await page.getByRole("heading", { name: "Meet Details", exact: true }).waitFor();
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
    assert.equal(generated.chapters.length, 3);
    assert.equal(generated.rows.length, 0);
    assert.equal(generated.overflow, 0);
    for (const chapter of generated.chapters) {
      assert.ok(Math.abs(chapter.x - generated.canvas.x) <= 1);
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
    assert.equal(phone.chapters.length, 3);
    assert.equal(phone.overflow, 0);

    for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 375, height: 812 }, { width: 812, height: 375 }]) {
      await page.setViewportSize(viewport);
      for (const dark of [false, true]) {
        for (const editing of [false, true]) {
          for (const content of ["short", "long"]) {
            const context = `${viewport.width}/${dark ? "dark" : "light"}/${editing ? "editor" : "guest"}/${content}`;
            await open(`tabs&hotels=${content}&width=1400${dark ? "&dark" : ""}${editing ? "&editing" : ""}`);
            await page.getByRole("tab", { name: "Overview", exact: true }).click();
            assert.equal(await page.getByRole("heading", { name: "Hotels & Travel", exact: true }).isVisible(), false, context);
            const hotelTab = page.getByRole("tab", { name: "Hotels", exact: true });
            await hotelTab.click();
            await page.getByRole("heading", { name: "Hotels & Travel", exact: true }).waitFor();
            assert.equal(await page.getByRole("heading", { name: "Meet Details", exact: true }).isVisible(), false, context);
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
            assert.equal(await page.getByRole("tab", { name: "Overview", exact: true }).getAttribute("aria-selected"), "true", context);
            assert.equal(await page.getByRole("heading", { name: "Meet Details", exact: true }).isVisible(), true, context);
          }
        }
      }
    }
    // Changing the available card width must reflow details without navigation or a saved layout choice.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open("tabs&hotels=long&width=1400");
    await page.getByRole("tab", { name: "Hotels", exact: true }).click();
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
