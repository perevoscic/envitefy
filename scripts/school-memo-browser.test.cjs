const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("school memo dates require an explicit selected-calendar action on phone and desktop", { timeout: 120000 }, async t => {
  const output = path.resolve("output/qa/school-memo-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/school-memo.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "@/hooks/useCalendarPreference": path.resolve("scripts/fixtures/school-memo-calendar-preference.ts"),
        "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process('@import "tailwindcss" source(none); @source "../src/components/SchoolMemoDates.tsx"; @source "../src/components/ScheduleReviewDialog.tsx";', { from: path.resolve("scripts/school-memo-fixture.css") })).css;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    for (const width of [390, 1440]) {
      await t.test(`${width}px selection, export, connected provider and private review`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", timezoneId: "America/Chicago" });
        page.setDefaultTimeout(10000);
        const requests = [], errors = [];
        let stallNextPath = "";
        page.on("pageerror", error => { errors.push(error.message); console.error("School memo fixture:", error.stack || error.message); });
        await page.route("**/*", async route => {
          const request = route.request(), url = new URL(request.url());
          if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(output, "fixture.js")) });
          if (url.pathname.startsWith("/api/")) {
            requests.push({ path: url.pathname, body: request.postDataJSON() });
            if (url.pathname === stallNextPath) {
              stallNextPath = "";
              await new Promise(resolve => setTimeout(resolve, 300));
              // The client must have aborted its real fetch by this point. A
              // late provider response must not become a phantom success.
              return route.fulfill({ contentType: "application/json", body: JSON.stringify({ results: request.postDataJSON().itemIds?.map(itemId => ({ itemId, status: "added" })) || [] }) }).catch(() => {});
            }
            if (url.pathname === "/api/events/ics/bulk") return route.fulfill({ contentType: "text/calendar", body: "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n" });
            if (url.pathname.endsWith("/calendar-items")) return route.fulfill({ contentType: "application/json", body: JSON.stringify({ results: request.postDataJSON().itemIds.map(itemId => ({ itemId, status: "added" })) }) });
            throw new Error("Unexpected live API request: " + url.pathname);
          }
          return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;font-family:Arial,sans-serif;background:#f7f3fa}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
        });
        const base = "http://school-memo.test/memo";
        const action = () => page.getByRole("button", { name: /^Add selected dates to calendar/ });
        const checks = () => page.getByRole("checkbox");
        await page.goto(base);
        await action().waitFor();
        assert.equal(await checks().count(), 6);
        assert.equal(await checks().evaluateAll(items => items.filter(item => item.checked).length), 6);
        assert.equal(requests.length, 0, "mounting a memo never writes calendar events");
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
        assert.match(await action().innerText(), /\(5\)/);
        assert.equal(await checks().count(), 6, "excluding a date keeps the memo row");
        await page.getByRole("button", { name: "Clear all", exact: true }).click();
        assert.equal(await action().isDisabled(), true);
        await page.getByRole("button", { name: "Select all", exact: true }).click();
        assert.match(await action().innerText(), /\(6\)/);
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
        await action().click();
        await page.getByRole("dialog", { name: "Add 5 selected dates", exact: true }).waitFor();
        assert.equal(requests.length, 0, "opening the chooser never writes calendar events");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.activeElement?.textContent?.startsWith("Add selected dates to calendar"));
        assert.equal(await page.getByRole("dialog").count(), 0);
        await action().click();
        const download = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).click();
        assert.equal((await download).suggestedFilename(), "school-memo-dates.ics");
        await page.getByRole("status").waitFor();
        assert.match(await page.getByRole("status").innerText(), /downloaded/);
        assert.equal(requests.length, 1);
        const exported = requests[0].body.events;
        assert.equal(exported.length, 5);
        assert.equal(exported.some(event => event.title.includes("Bible")), false);
        assert.equal(exported.filter(event => event.title.includes("Spelling")).length, 1);
        assert.equal(exported.find(event => event.title.includes("Spirit")).end, "2026-10-31");
        assert.equal(exported.find(event => event.title.includes("Pumpkin")).allDay, true);
        await page.screenshot({ path: path.join(output, `selected-export-${width}.png`), fullPage: true });

        await page.goto(base + "?connected=google,microsoft&provider=microsoft");
        await action().waitFor();
        const beforeConnected = requests.length;
        await page.getByRole("button", { name: "Clear all", exact: true }).click();
        assert.equal(await action().isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: "Calendar options", exact: true }).isDisabled(), true, "an empty selection cannot open a no-op calendar chooser");
        await page.getByRole("button", { name: "Select all", exact: true }).click();
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
        await action().click();
        await page.getByRole("status").waitFor();
        assert.equal(requests.length, beforeConnected + 1);
        assert.equal(requests.at(-1).path, "/api/events/memo-fixture/calendar-items");
        assert.deepEqual(requests.at(-1).body, { provider: "microsoft", itemIds: ["spirit", "spelling", "pumpkin", "closure", "turkey"] });
        assert.match(await page.getByRole("status").innerText(), /5 added/);
        assert.equal(await page.getByRole("dialog").count(), 0, "the verified default calendar opens directly");

        const options = page.getByRole("button", { name: "Calendar options", exact: true });
        await options.click();
        await page.getByRole("dialog", { name: "Add 5 selected dates", exact: true }).waitFor();
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Calendar options");
        await options.click();
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Calendar options");
        assert.equal(requests.length, beforeConnected + 1, "canceling calendar options never writes anything");
        await options.click();
        const connectedDownload = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).click();
        await connectedDownload;
        await page.getByRole("status").filter({ hasText: "downloaded" }).waitFor();
        assert.equal(requests.at(-1).path, "/api/events/ics/bulk", "connected accounts retain access to calendar file export");
        assert.equal(requests.at(-1).body.events.length, 5);
        await page.screenshot({ path: path.join(output, `final-connected-${width}.png`), fullPage: true });

        await page.evaluate(() => {
          const timeout = AbortSignal.timeout.bind(AbortSignal);
          window.__calendarTimeouts = [];
          AbortSignal.timeout = milliseconds => {
            window.__calendarTimeouts.push(milliseconds);
            return timeout(milliseconds === 160000 || milliseconds === 30000 ? 80 : milliseconds);
          };
        });
        stallNextPath = "/api/events/memo-fixture/calendar-items";
        const beforeStall = requests.length;
        await action().click();
        await page.getByRole("alert").filter({ hasText: "took too long" }).waitFor();
        assert.equal(requests.length, beforeStall + 1);
        assert.equal(await action().isDisabled(), false, "a stalled connected response releases the action");
        assert.equal(await page.getByRole("status").count(), 0, "an aborted request cannot claim dates were added");
        await action().click();
        await page.getByRole("status").filter({ hasText: "5 added" }).waitFor();
        assert.equal(requests.length, beforeStall + 2, "the user can retry after a bounded connected timeout");
        assert.equal(await page.getByRole("alert").count(), 0);

        stallNextPath = "/api/events/ics/bulk";
        await options.click();
        await page.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).click();
        await page.getByRole("alert").filter({ hasText: "took too long" }).waitFor();
        assert.equal(await action().isDisabled(), false, "a stalled calendar file releases the action");
        assert.equal(await page.getByRole("status").count(), 0, "a file timeout cannot claim a download");
        await options.click();
        const retriedDownload = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).click();
        await retriedDownload;
        await page.getByRole("status").filter({ hasText: "downloaded" }).waitFor();
        const deadlines = await page.evaluate(() => window.__calendarTimeouts);
        assert.ok(deadlines.includes(160000), "connected writes use the bounded bulk deadline");
        assert.ok(deadlines.includes(30000), "file export has its own shorter deadline");

        const beforeReview = requests.length;
        await page.goto(base + "?review=1");
        await page.getByRole("dialog", { name: "Review your school memo", exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: /Publish/ }).count(), 0);
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
        await page.getByRole("button", { name: "Clear all", exact: true }).click();
        assert.equal(await checks().evaluateAll(items => items.filter(item => item.checked).length), 0);
        await page.getByRole("button", { name: "Select all", exact: true }).click();
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
        await page.getByRole("button", { name: "Save memo", exact: true }).click();
        await action().waitFor();
        assert.match(await action().innerText(), /\(5\)/);
        assert.equal(requests.length, beforeReview, "saving a memo never writes to calendars");
        const saved = await page.evaluate(() => window.__memoSaves);
        assert.equal(saved.length, 1);
        assert.equal(saved[0].status, "draft");
        assert.equal(saved[0].schedule.items.length, 6);
        assert.equal(saved[0].schedule.items.find(item => item.id === "bible").calendarSelected, false);
        assert.equal(saved[0].schedule.items.find(item => item.id === "pumpkin").startTime, null);
        await page.goto(base + "?restore=1");
        await action().waitFor();
        assert.match(await action().innerText(), /\(5\)/);
        assert.equal(await checks().count(), 6);
        assert.equal(requests.length, beforeReview);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: path.join(output, `restored-${width}.png`), fullPage: true });
        await page.close();
      });
    }
  } finally { await browser.close(); }
});
