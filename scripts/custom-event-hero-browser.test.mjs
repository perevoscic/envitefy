import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";

test("custom Event Page hero replacement stays local until explicit save on desktop and mobile", { timeout: 120000 }, async () => {
  execFileSync(process.env.BUN_EXECUTABLE || "bun", ["scripts/build-category-custom-design-fixture.mjs"], { stdio: "pipe" });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const initialImage = await sharp({ create: { width: 120, height: 80, channels: 3, background: "green" } }).webp().toBuffer();
    const replacement = await sharp({ create: { width: 300, height: 200, channels: 4, background: { r: 20, g: 50, b: 150, alpha: 0.5 } } }).png().toBuffer();
    const initial = {
      version: 1, category: "general",
      artwork: `data:image/webp;base64,${initialImage.toString("base64")}`,
      design: { version: 1, name: "Park", description: "Coastal park", layout: "banner", font: "editorial", colors: { page: "#ffffff", surface: "#f5f1fa", ink: "#342d38", accent: "#60508e" } },
      details: { title: "Gateway Field Trip", description: "Explore the dune lake.", date: "2026-10-05", time: "09:30", endDate: "", endTime: "12:30", timezone: "America/Chicago", venue: "Camp Helen State Park", location: "Panama City Beach", host: "", rsvpEmail: "", rsvpPhone: "", rsvpEnabled: false, sections: [{ title: "What to bring", body: "Bring a disposable lunch and reusable water bottle." }], registryLinks: [] },
    };
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const errors = [], writes = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((value) => { window.testEditorPage = value; }, initial);
      await page.route("**/*", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== "http://localhost:43130") return route.abort();
        if (request.method() === "POST") {
          const body = request.postDataJSON();
          if (url.pathname === "/api/event-themes/generate") {
            assert.equal(body.mode, "wording");
            return route.fulfill({ json: { details: body.currentDetails } });
          }
          writes.push(body);
          return route.fulfill({ json: { id: "saved-event", data: body.data } });
        }
        if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname)) {
          return route.fulfill({ contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css", body: await fs.readFile(path.resolve("output/category-custom-design", url.pathname.slice(1))) });
        }
        if (url.pathname.startsWith("/fonts/")) return route.fulfill({ status: 404 });
        return route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hero replacement check</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>' });
      });
      await page.goto("http://localhost:43130/editor?editor=1");
      const button = page.getByRole("button", { name: "Replace hero image", exact: true });
      await button.waitFor();
      assert.ok(await button.isEnabled());
      const chooser = page.waitForEvent("filechooser");
      await button.click();
      await (await chooser).setFiles({ name: "park.png", mimeType: "image/png", buffer: replacement });
      const hero = page.locator('article[aria-label="Event page preview"] img').first();
      await page.waitForFunction((old) => document.querySelector('article[aria-label="Event page preview"] img')?.getAttribute("src") !== old && !window.editorProgress.busy, initial.artwork);
      const selected = await hero.getAttribute("src");
      assert.match(selected, /^data:image\/webp;base64,/);
      const metadata = await sharp(Buffer.from(selected.split(",")[1], "base64")).metadata();
      assert.equal(metadata.width, 300);
      assert.equal(metadata.height, 200);
      assert.equal(metadata.hasAlpha, true);
      assert.equal(await page.locator("#event-field-title").inputValue(), initial.details.title);
      assert.equal(await page.locator("#event-field-venue").inputValue(), initial.details.venue);
      assert.deepEqual(writes, []);
      assert.deepEqual(await page.evaluate(() => window.imageUploads || []), []);
      assert.equal(await page.evaluate(() => window.editorProgress.dirty), true);
      await page.getByLabel("Choose hero image", { exact: true }).setInputFiles({ name: "bad.png", mimeType: "image/png", buffer: Buffer.from("corrupt image") });
      await page.getByRole("alert").filter({ hasText: "could not be decoded" }).waitFor();
      assert.equal(await hero.getAttribute("src"), selected);
      assert.equal(await page.getByRole("button", { name: "Save draft", exact: true }).isEnabled(), true);
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "Draft saved." }).waitFor();
      assert.equal(writes.length, 1);
      assert.equal(writes[0].data.customEventPage.artwork, "https://example.com/replacement.webp");
      assert.deepEqual(writes[0].data.customEventPage.details, initial.details);
      assert.deepEqual(await page.evaluate(() => window.imageUploads), [selected]);
      assert.equal(await page.evaluate(() => window.editorProgress.dirty), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: `output/category-custom-design/hero-replacement-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
