const assert = require("node:assert/strict");
const test = require("node:test");
const { chromium } = require("playwright");

const base = process.env.TEMPLATE_GALLERY_BASE_URL;
test("public template routes retain the shared mosaic on desktop and phones", { skip: !base, timeout: 240000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 }, colorScheme: "dark" });
      for (const category of ["weddings", "birthdays", "anniversaries", "baby-showers", "bridal-showers", "gender-reveal", "gymnastics", "sport-events", "signup-forms", "football"]) {
        await page.goto(`${base}/${category}/templates`);
        const cards = page.locator("[data-template-masonry-card]");
        await cards.first().waitFor();
        const boxes = await cards.evaluateAll((nodes) => nodes.slice(0, 12).map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y, width, height };
        }));
        const columns = width >= 1024 ? 4 : 2;
        assert.equal(new Set(boxes.slice(0, columns).map((box) => Math.round(box.x))).size, columns, `${category} columns at ${width}`);
        assert.ok(boxes.every((box) => box.width < width / columns && box.height > 0), `${category} bounded artwork`);
        assert.ok(new Set(boxes.map((box) => Math.round(box.height))).size > 1, `${category} varied mosaic heights`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${category} fits viewport`);
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          assert.ok(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1, `${category} cards do not overlap`);
        }
        assert.match(await cards.first().locator("a").getAttribute("href"), /customize/);
        const search = page.getByRole("searchbox");
        await search.fill("zzzz-no-matching-template");
        await cards.first().waitFor({ state: "detached" });
        await search.fill("");
        await cards.first().waitFor();
        console.log(`${category}: mosaic and search passed at ${width}px`);
      }
      await page.goto(`${base}/gender-reveal/templates`);
      await page.locator("[data-template-masonry-card]").first().waitFor();
      await page.locator("[data-template-masonry-grid]").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/template-mosaic-${width}.png` });
      await page.close();
    }
    // A category's deferred CSS must not own the gallery's structural layout.
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.route(/category-galleries.*\.css/, (route) => route.abort());
    await page.goto(`${base}/gender-reveal/templates`);
    const grid = page.locator("[data-template-masonry-grid]");
    await grid.waitFor();
    assert.equal(await grid.evaluate((node) => getComputedStyle(node).display), "grid");
    assert.equal(await grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length), 4);
    await page.close();
  } finally { await browser.close(); }
});
