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
      body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}*{box-sizing:border-box}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
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
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
