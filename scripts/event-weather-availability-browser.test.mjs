import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";

test("enabled weather stays hidden until a forecast is available and appears automatically", { timeout: 60000 }, async () => {
  execFileSync(process.env.BUN_EXECUTABLE || "bun", ["scripts/build-category-custom-design-fixture.mjs"], { stdio: "pipe" });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const origin = "http://localhost:43131";
  const eventId = "11111111-1111-4111-8111-111111111111";
  const fixture = {
    version: 1, category: "general",
    artwork: "/templates/signup/photographic/clubs-and-groups/gardening-group.webp",
    design: { version: 1, name: "Coastal day", description: "Coastal park", layout: "editorial", font: "modern", colors: { page: "#e8f3f5", surface: "#ffffff", ink: "#183941", accent: "#305865" } },
    details: { title: "Gateway Field Trip", description: "Explore the park.", date: "2026-11-02", time: "09:30", endDate: "", endTime: "", timezone: "America/Chicago", venue: "Camp Helen State Park", location: "Panama City Beach, Florida", host: "Gateway", rsvpEmail: "", rsvpPhone: "", rsvpEnabled: false, sections: [], registryLinks: [], weather: { enabled: true, units: "c" } },
  };
  const forecast = { status: "available", location: fixture.details.location, date: fixture.details.date, time: "09:00", summary: "Partly cloudy", tempF: 75, tempC: 24, highF: 82, highC: 28, lowF: 68, lowC: 20, rainChance: 20, windMph: 8, windKph: 13, checkedAt: "2026-11-01T15:00:00Z" };
  try {
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [], calls = [];
      let weatherState = { status: "outside_window" };
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((value) => { window.testEditorPage = value; }, fixture);
      await page.route("**/*", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === "/api/events/weather") {
          calls.push(request.postDataJSON());
          return route.fulfill({ json: weatherState });
        }
        if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname)) return route.fulfill({ contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css", body: await fs.readFile(path.resolve("output/category-custom-design", url.pathname.slice(1))) });
        if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/")) return route.fulfill({ body: await fs.readFile(path.resolve("public", url.pathname.slice(1))) });
        return route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>' });
      });
      await page.clock.install();
      const weather = page.getByRole("region", { name: "Event weather" });
      for (const status of ["outside_window", "unavailable", "missing_details", "location_unavailable", "past", "unconfigured"]) {
        weatherState = { status };
        const response = page.waitForResponse("**/api/events/weather");
        await page.goto(`${origin}/guest?guest=1&eventId=${eventId}`);
        await page.getByRole("heading", { name: fixture.details.title, exact: true }).waitFor();
        assert.equal(await weather.count(), 0, "No placeholder while loading");
        await page.clock.runFor(600);
        await response;
        await weather.waitFor({ state: "hidden" });
        assert.deepEqual(calls.at(-1), { eventId });
      }
      weatherState = forecast;
      const response = page.waitForResponse("**/api/events/weather");
      await page.clock.runFor(15 * 60_000 + 600);
      await response;
      await weather.getByText("Partly cloudy", { exact: true }).waitFor();
      assert.ok((await weather.textContent()).includes("24°C"));
      assert.deepEqual(calls.at(-1), { eventId });
      weatherState = { status: "unavailable" };
      await weather.getByRole("button", { name: "Refresh weather" }).click();
      await page.clock.runFor(1);
      await weather.getByText(/Couldn't refresh/).waitFor();
      assert.ok((await weather.textContent()).includes("24°C"));
      weatherState = { status: "outside_window" };
      await weather.getByRole("button", { name: "Refresh weather" }).click();
      await page.clock.runFor(1);
      await weather.waitFor({ state: "hidden" });
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser.close(); }
});
