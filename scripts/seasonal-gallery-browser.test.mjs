import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

test("seasonal galleries mix upcoming occasions, retain filters and links, and fit desktop and phones", { timeout: 180000 }, async () => {
  execFileSync("bun", ["scripts/build-seasonal-gallery-fixture.mjs"], { stdio: "pipe" });
  const out = path.resolve("output/seasonal-gallery");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: "America/Chicago", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-09-25T17:00:00Z") });
  const origin = "http://localhost:43131", errors = [], writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (request.method() !== "GET") { writes.push(url.pathname); return route.fulfill({ json: {} }); }
    if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname)) return route.fulfill({ path: path.join(out, url.pathname.slice(1)), contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css" });
    if (/^\/(templates|fonts|images)\//.test(url.pathname)) {
      const file = path.resolve("public", url.pathname.slice(1));
      if (file.startsWith(path.resolve("public") + path.sep)) {
        try { return await route.fulfill({ body: await fs.readFile(file) }); } catch {}
      }
      return route.fulfill({ status: 404 });
    }
    return route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="en"><head><title>Seasonal gallery check</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body class="font-vars" style="margin:0"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>` });
  });
  const cards = () => page.locator("[data-template-masonry-card]");
  const ids = () => cards().evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-template-masonry-card")));
  const goto = async (category, extras = "") => {
    await page.goto(`${origin}/gallery?category=${category}${extras}`);
    await page.waitForFunction(() => Boolean(window.galleryFixture));
    await page.waitForFunction(() => document.querySelectorAll("[data-template-masonry-card]").length > 0);
  };
  const setDay = async (iso) => {
    await page.clock.setFixedTime(new Date(iso));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  };
  try {
    for (const category of ["signup-forms", "general"]) {
      await setDay("2026-09-25T17:00:00Z");
      await goto(category, "&status=unauthenticated&d=2027-02-03");
      await page.waitForFunction(() => [...document.querySelectorAll("[data-template-masonry-card]")].slice(0, 12).some((n) => n.getAttribute("data-template-masonry-card").includes("corn-maze")));
      for (const occasion of ["corn-maze", "trunk-or-treat", "halloween"]) assert.ok((await ids()).slice(0, 12).some((id) => id.includes(occasion)), `${category}: ${occasion}`);
      assert.equal(await page.getByRole("button", { name: "Create with Envitefy", exact: true }).isDisabled(), true);
      const occasionSelect = page.getByRole("combobox", { name: "Holiday or occasion", exact: true });
      const orderSelect = page.getByRole("combobox", { name: "Template order", exact: true });
      const availableCollections = await page.evaluate(() => [...new Set(window.galleryFixture.generalDesigns.map((design) => design.occasion).filter(Boolean))]);
      const expectedCollections = new Set([...availableCollections, ...(category === "signup-forms" ? ["fall-harvest", "friendsgiving", "back-to-school", "graduation", "hanukkah"] : [])]);
      assert.equal(await occasionSelect.locator("option").count(), expectedCollections.size + 1);
      await occasionSelect.selectOption("corn-maze");
      await page.waitForFunction((count) => document.querySelectorAll("[data-template-masonry-card]").length === count, category === "signup-forms" ? 11 : 10);
      const selectedIds = await ids();
      assert.ok(selectedIds.every((id) => id.includes("corn-maze")));
      const href = await cards().filter({ has: page.locator('[href*="holidays--corn-maze"]') }).first().locator("a").getAttribute("href");
      assert.ok(href.includes(category === "general" ? "/event/general/customize?templateId=holidays--corn-maze" : "/signup-forms/templates/holidays--corn-maze"));
      if (category === "general") assert.ok(href.includes("d=2027-02-03"), "the host's explicit date stays untouched");
      for (const width of [1280, 640, 320]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${category} overflow at ${width}`);
        for (const select of [occasionSelect, orderSelect]) {
          const bounds = await select.boundingBox();
          assert.ok(bounds.height >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= width);
        }
        await cards().first().scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('[data-template-masonry-card] img')].slice(0, 2).every((img) => img.complete && img.naturalWidth > 0));
        await page.screenshot({ path: path.join(out, `${category}-corn-maze-${width}.png`) });
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      await orderSelect.focus();
      await page.keyboard.press("o");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.querySelector('select[aria-label="Template order"]').value === "original");
      const a11y = await new AxeBuilder({ page }).include('select[aria-label="Holiday or occasion"]').include('select[aria-label="Template order"]').withTags(["wcag2a", "wcag2aa"]).analyze();
      assert.deepEqual(a11y.violations.map((v) => v.id), []);
      const search = page.getByRole("searchbox");
      await search.fill("Memorial Day");
      assert.equal(await cards().count(), 0, "occasion and text filters combine");
      await occasionSelect.selectOption("");
      await page.waitForFunction(() => document.querySelectorAll("[data-template-masonry-card]").length === 10);
      assert.ok((await ids()).every((id) => id.includes("memorial-day")));
      await search.fill("");
      const original = await page.evaluate((category) => (category === "general" ? window.galleryFixture.generalDesigns : window.galleryFixture.getPublicTemplates(category)).slice(0, 12).map((item) => item.id), category);
      assert.deepEqual((await ids()).slice(0, 12), original);
      await orderSelect.selectOption("seasonal");
      await setDay("2026-05-01T17:00:00Z");
      await page.waitForFunction(() => [...document.querySelectorAll("[data-template-masonry-card]")].slice(0, 12).some((n) => n.getAttribute("data-template-masonry-card").includes("july-fourth")));
      for (const occasion of ["memorial-day", "july-fourth", "summer-camp"]) assert.ok((await ids()).slice(0, 12).some((id) => id.includes(occasion)), `${category}: May should include ${occasion}: ${JSON.stringify((await ids()).slice(0, 12))}`);
      await setDay("2026-11-01T17:00:00Z");
      await page.waitForFunction(() => ![...document.querySelectorAll("[data-template-masonry-card]")].slice(0, 12).some((n) => n.getAttribute("data-template-masonry-card").includes("halloween")));
    }
    await page.clock.setSystemTime(new Date("2026-10-31T23:59:30-05:00"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => [...document.querySelectorAll("[data-template-masonry-card]")].slice(0, 12).some((n) => n.getAttribute("data-template-masonry-card").includes("halloween")));
    await page.clock.fastForward(31000);
    await page.waitForFunction(() => ![...document.querySelectorAll("[data-template-masonry-card]")].slice(0, 12).some((n) => n.getAttribute("data-template-masonry-card").includes("halloween")));
    for (const category of ["signup-forms", "general"]) {
      await goto(category);
      await page.getByRole("combobox", { name: "Holiday or occasion", exact: true }).selectOption("diwali");
      await page.waitForFunction(() => document.querySelectorAll("[data-template-masonry-card]").length === 10);
      assert.ok((await ids()).every((id) => id.startsWith("holidays--diwali--")));
      await cards().locator("img").evaluateAll((images) => images.forEach((img) => { img.loading = "eager"; }));
      await page.waitForFunction(() => [...document.querySelectorAll('[data-template-masonry-card] img')].every((img) => img.complete && img.naturalWidth === 1536));
      await cards().locator("img").evaluateAll((images) => Promise.all(images.map((img) => img.decode())));
      for (const width of [1280, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await cards().first().scrollIntoViewIfNeeded();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(out, `${category}-diwali-${width}.png`) });
      }
    }
    await goto("signup-forms", "&featured=1");
    assert.equal(await page.getByRole("combobox", { name: "Template order" }).count(), 0);
    assert.equal(await cards().count(), 6);
    await goto("weddings");
    assert.equal(await page.getByRole("combobox", { name: "Template order" }).inputValue(), "seasonal");
    await goto("birthdays");
    assert.equal(await page.getByRole("combobox", { name: "Template order" }).inputValue(), "seasonal");
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, [], "browsing and filtering never save or generate");
  } finally {
    await browser.close();
  }
});
