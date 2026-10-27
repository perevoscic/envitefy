const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { buildAppearanceBootstrap } = loadTs("src/lib/appearance.ts");
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
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../components/SchoolMemoDates.tsx"; @source "../components/ScheduleReviewDialog.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    for (const width of [390, 1440]) {
      await t.test(`${width}px selection, export, connected provider and private review`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", timezoneId: "America/Chicago" });
        page.setDefaultTimeout(10000);
        const requests = [], errors = [];
        let stallNextPath = "";
        const additions = new Map();
        let failBible = false;
        page.on("pageerror", error => { errors.push(error.message); console.error("School memo fixture:", error.stack || error.message); });
        await page.route("**/*", async route => {
          const request = route.request(), url = new URL(request.url());
          if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(output, "fixture.js")) });
          if (url.pathname.startsWith("/api/")) {
            if (request.method() === "GET" && url.pathname.endsWith("/calendar-items"))
              return route.fulfill({ contentType: "application/json", body: JSON.stringify({ additions: [...additions].map(([id, addedAt]) => ({ id, addedAt })) }) });
            requests.push({ path: url.pathname, body: request.postDataJSON() });
            if (url.pathname === stallNextPath) {
              stallNextPath = "";
              await new Promise(resolve => setTimeout(resolve, 300));
              // The client must have aborted its real fetch by this point. A
              // late provider response must not become a phantom success.
              return route.fulfill({ contentType: "application/json", body: JSON.stringify({ results: request.postDataJSON().itemIds?.map(itemId => ({ itemId, status: "added" })) || [] }) }).catch(() => {});
            }
            if (url.pathname === "/api/events/ics/bulk") return route.fulfill({ contentType: "text/calendar", body: "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n" });
            if (url.pathname.endsWith("/calendar-items")) {
              const results = request.postDataJSON().itemIds.map(id => {
                if (failBible && id === "bible") return { id, status: "failed", message: "Please retry this date." };
                additions.set(id, "2026-10-27T01:35:00.000Z");
                return { id, status: "added", addedAt: additions.get(id) };
              });
              return route.fulfill({ contentType: "application/json", body: JSON.stringify({ results }) });
            }
            throw new Error("Unexpected live API request: " + url.pathname);
          }
          return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;font-family:Arial,sans-serif;background:#f7f3fa}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
        });
        const base = "https://school-memo.test/memo";
        const action = () => page.getByRole("button", { name: /^Add selected dates to your calendar/ });
        const checks = () => page.getByRole("checkbox");
        await page.goto(base + "?draft=1&connected=google&provider=google");
        await page.getByRole("heading", { name: "Review dates from this memo" }).waitFor();
        assert.equal(await checks().count(), 0);
        assert.equal(await action().count(), 0);
        assert.equal(await page.getByRole("button", { name: "Download calendar file (.ics)" }).count(), 0);
        await page.getByRole("button", { name: "Edit Bible Test", exact: true }).click();
        await page.getByLabel("Title", { exact: true }).fill("Updated Bible Test");
        await page.getByLabel("Date", { exact: true }).fill("2026-11-02");
        await page.getByLabel("Notes", { exact: true }).fill("Bring your workbook");
        await page.getByRole("button", { name: "Add date", exact: true }).click();
        await page.getByLabel("Title", { exact: true }).last().fill("Extra date");
        await page.getByLabel("Date", { exact: true }).last().fill("2026-11-03");
        await page.getByRole("button", { name: "Remove date", exact: true }).last().click();
        assert.equal(await page.locator("[data-school-memo-dates] > ul > li").count(), 6);
        await page.getByRole("button", { name: "Save draft", exact: true }).click();
        assert.equal(await action().count(), 0, "saving a draft does not enable calendar actions");
        assert.equal(requests.length, 0);
        await page.getByRole("button", { name: "Publish", exact: true }).click();
        await action().waitFor();
        assert.equal(requests.length, 0, "publishing never writes calendar events");
        assert.match(await page.locator("[data-school-memo-dates]").innerText(), /Updated Bible Test/);
        assert.match(await page.locator("[data-school-memo-dates]").innerText(), /Nov 2, 2026/);
        assert.equal(await page.getByRole("button", { name: "Edit Updated Bible Test" }).count(), 0);
        await page.goto(base);
        await action().waitFor();
        const memoDates = page.locator("[data-school-memo-dates]");
        assert.doesNotMatch(await memoDates.innerText(), /Year inferred from the memo context|Source text|Time not provided/);
        assert.match(await memoDates.innerText(), /\(info sent in SeeSaw\)/);
        const bullets = page.locator("[data-memo-event-bullets]");
        assert.equal(await bullets.locator("li").count(), 4);
        assert.equal(await bullets.locator("li").first().innerText(), "Spirit Week October 26 - 30 (info sent in SeeSaw)");
        assert.equal(await bullets.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length), width < 1024 ? 2 : 3);
        assert.equal(await memoDates.locator(":scope > ul").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length), width < 1024 ? 1 : 3);
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
        await page.getByRole("dialog", { name: "Set your default calendar", exact: true }).waitFor();
        assert.equal(requests.length, 0, "opening the chooser never writes calendar events");
        assert.equal(await page.getByRole("link", { name: "Connect a default calendar" }).getAttribute("href"), "/settings#calendars");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.activeElement?.textContent?.startsWith("Add selected dates to your calendar"));
        assert.equal(await page.getByRole("dialog").count(), 0);
        await action().click();
        const download = page.waitForEvent("download");
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await page.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).click();
        assert.equal((await download).suggestedFilename(), "school-memo-dates.ics");
        await page.getByRole("status").waitFor();
        assert.match(await page.getByRole("status").innerText(), /downloaded/);
        assert.equal(await page.locator("[data-school-memo-dates] time").count(), 0, "a file download cannot confirm a calendar import");
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
        assert.equal(await page.getByRole("button", { name: "Calendar options", exact: true }).count(), 0, "the duplicate calendar options action is removed");
        await page.getByRole("button", { name: "Select all", exact: true }).click();
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
        await action().click();
        await page.getByRole("status").waitFor();
        assert.equal(requests.length, beforeConnected + 1);
        assert.equal(requests.at(-1).path, "/api/events/memo-fixture/calendar-items");
        assert.deepEqual(requests.at(-1).body, { provider: "microsoft", itemIds: ["spirit", "spelling", "pumpkin", "closure", "turkey"] });
        assert.match(await page.getByRole("status").innerText(), /5 added/);
        await page.locator("[data-school-memo-dates] time").first().waitFor();
        assert.equal(await page.locator("[data-school-memo-dates] time").count(), 5);
        assert.match(await page.locator("[data-school-memo-dates] time").first().innerText(), /Oct 26, 2026.*8:35 PM CDT/);
        await page.reload();
        await page.locator("[data-school-memo-dates] time").first().waitFor();
        assert.equal(await page.locator("[data-school-memo-dates] time").count(), 5, "saved addition status survives reload");
        assert.equal(await page.getByRole("dialog").count(), 0, "the verified default calendar opens directly");

        await page.goto(base + "?connected=google,microsoft");
        await action().click();
        await page.getByRole("dialog", { name: "Set your default calendar", exact: true }).waitFor();
        const dialog = page.getByRole("dialog", { name: "Set your default calendar", exact: true });
        for (const theme of ["light", "dark"]) {
          await page.evaluate(theme => localStorage.setItem("envitefy:appearance:v1", theme), theme);
          await page.addScriptTag({ content: buildAppearanceBootstrap() });
          const contrasts = await dialog.evaluate(element => {
            const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
            const luminance = value => rgb(value).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
            return [element.querySelector("h2"), element.querySelector("p"), ...element.querySelectorAll("button")].map(node => {
              const style = getComputedStyle(node);
              const background = node.matches("button") ? style.backgroundColor : getComputedStyle(element).backgroundColor;
              const a = luminance(style.color), b = luminance(background);
              return { text: node.textContent, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
            });
          });
          for (const { text, ratio } of contrasts) assert.ok(ratio >= 4.5, `${theme} ${text}: contrast ${ratio}`);
          await page.screenshot({ path: path.join(output, `calendar-dialog-${width}-${theme}.png`) });
        }
        await page.evaluate(() => localStorage.setItem("envitefy:appearance:v1", "light"));
        await page.addScriptTag({ content: buildAppearanceBootstrap() });
        const beforeDefault = requests.length;
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.textContent?.startsWith("Add selected dates to your calendar"));
        assert.equal(requests.length, beforeDefault, "canceling setup never writes dates");
        await action().click();
        await page.getByRole("button", { name: "Use Google Calendar as default", exact: true }).click();
        await page.getByRole("status").filter({ hasText: "6 added" }).waitFor();
        assert.equal(await page.evaluate(() => window.__rememberedCalendar), "google");
        assert.equal(requests.at(-1).body.provider, "google");
        await action().click();
        await page.getByRole("status").filter({ hasText: "6 added" }).waitFor();
        assert.equal(await page.getByRole("dialog").count(), 0, "the new default is used directly");

        await page.goto(base + "?connected=google&failDefault=1");
        const beforeFailedDefault = requests.length;
        await action().click();
        await page.getByRole("button", { name: "Use Google Calendar as default", exact: true }).click();
        await page.getByRole("dialog").getByRole("alert").waitFor();
        assert.equal(requests.length, beforeFailedDefault, "failed default saves never add dates");

        await page.goto(base + "?connected=google");
        await action().click();
        await page.getByRole("dialog", { name: "Set your default calendar", exact: true }).waitFor();
        assert.equal(requests.length, beforeFailedDefault, "even one connection must be explicitly made default");
        await page.getByRole("button", { name: "Use Google Calendar as default", exact: true }).click();
        await page.getByRole("status").waitFor();
        await page.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
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
        await page.getByRole("button", { name: "Download calendar file (.ics)", exact: true }).click();
        await page.getByRole("alert").filter({ hasText: "took too long" }).waitFor();
        assert.equal(await action().isDisabled(), false, "a stalled calendar file releases the action");
        assert.equal(await page.getByRole("status").count(), 0, "a file timeout cannot claim a download");
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
        additions.clear();
        failBible = true;
        await page.goto(base + "?connected=google&provider=google");
        await action().click();
        await page.getByRole("status").filter({ hasText: "5 added" }).waitFor();
        assert.equal(await page.locator("[data-school-memo-dates] time").count(), 5);
        const bibleRow = page.locator("[data-school-memo-dates] li").filter({ hasText: "Bible Test" });
        assert.equal(await bibleRow.locator("time").count(), 0, "failed dates must not show Added on");
        failBible = false;
        await action().click();
        await page.getByRole("status").filter({ hasText: "6 added" }).waitFor();
        assert.equal(await bibleRow.locator("time").count(), 1, "a successful retry marks the date added");
        await page.close();
      });
    }
  } finally { await browser.close(); }
});
