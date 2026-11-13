const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const buildFixture = require("./lib/build-bun-fixture.cjs");

test("calendar buttons request preferences on demand and share pending reads", { timeout: 60000 }, async () => {
  buildFixture("scripts/build-calendar-demand-fixture.mjs");
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
      (fs.existsSync(chromium.executablePath()) ? chromium.executablePath() : fs.existsSync(chrome) ? chrome : undefined),
  });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const requests = [];
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith("/api/")) {
          requests.push({ path: url.pathname, route });
          return; // Hold responses to prove opening the chooser does not wait for APIs.
        }
        if (url.pathname === "/fixture.js") return route.fulfill({
          contentType: "text/javascript",
          body: fs.readFileSync(path.resolve("output/calendar-demand-browser/fixture.js")),
        });
        return route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script src="/fixture.js"></script>' });
      });
      await page.goto("http://calendar-demand.test");
      const buttons = page.getByRole("button", { name: "Add to calendar", exact: true });
      await buttons.first().waitFor();
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await page.waitForTimeout(100);
      assert.equal(requests.length, 0, "mounting two buttons and focusing the page makes no API requests");
      await buttons.first().click();
      await page.getByRole("dialog", { name: "Add to calendar", exact: true }).waitFor();
      await page.waitForFunction(() => document.querySelector('[role="dialog"]') !== null);
      await page.waitForTimeout(100);
      assert.deepEqual(requests.map(request => request.path).sort(), ["/api/calendars", "/api/user/profile"]);
      await page.keyboard.press("Escape");
      await buttons.nth(1).click();
      await page.getByRole("dialog", { name: "Add to calendar", exact: true }).waitFor();
      await page.waitForTimeout(100);
      assert.equal(requests.length, 2, "another button shares the pending profile and connection reads");
      for (const request of requests) await request.route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(request.path === "/api/calendars"
          ? { google: true, microsoft: false, apple: false }
          : { preferredProvider: "google" }),
      });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Add to Google Calendar", exact: true }).first().waitFor();
      assert.equal(await page.getByRole("button", { name: "Add to Google Calendar", exact: true }).count(), 2);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
