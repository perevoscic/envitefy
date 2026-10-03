import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

test("optional Weather follows the theme on desktop and mobile and persists only through explicit saves", {
  timeout: 180000,
}, async () => {
  execFileSync(
    process.env.BUN_EXECUTABLE ||
      (process.platform === "win32"
        ? path.join(process.env.APPDATA, "npm/node_modules/bun/bin/bun.exe")
        : "bun"),
    ["scripts/build-category-custom-design-fixture.mjs"],
    { stdio: "pipe" },
  );
  const out = path.resolve("output/event-weather");
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  const origin = "http://localhost:43131";
  const eventId = "11111111-1111-4111-8111-111111111111";
  try {
    for (const width of [1280, 390])
      for (const dark of [false, true]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const errors = [],
          writes = [],
          weatherCalls = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const colors = dark
          ? { page: "#15243b", surface: "#182940", ink: "#ffffff", accent: "#725620" }
          : { page: "#e8f3f5", surface: "#ffffff", ink: "#183941", accent: "#305865" };
        const initial = {
          version: 1,
          category: "general",
          artwork: "/templates/signup/photographic/clubs-and-groups/gardening-group.webp",
          design: {
            version: 1,
            name: "Coastal day",
            description: "Coastal park",
            layout: dark ? "split" : "editorial",
            font: "modern",
            colors,
          },
          details: {
            title: "Gateway Field Trip",
            description: "Explore the dune lake.",
            date: "2026-10-05",
            time: "09:30",
            endDate: "",
            endTime: "12:30",
            timezone: "America/Chicago",
            venue: "Camp Helen State Park",
            location: "Panama City Beach, Florida",
            host: "Gateway",
            rsvpEmail: "",
            rsvpPhone: "",
            rsvpEnabled: false,
            sections: [],
            registryLinks: [],
          },
        };
        const forecast = {
          status: "available",
          location: "Panama City Beach, Florida",
          date: "2026-10-05",
          time: "09:00",
          summary: "Partly cloudy",
          tempF: 75,
          tempC: 24,
          highF: 82,
          highC: 28,
          lowF: 68,
          lowC: 20,
          rainChance: 20,
          windMph: 8,
          windKph: 13,
          checkedAt: "2026-10-03T15:00:00Z",
        };
        let weatherState = forecast;
        await page.addInitScript((value) => {
          window.testEditorPage =
            JSON.parse(localStorage.getItem("weatherTestPage") || "null") || value;
        }, initial);
        await page.route("**/*", async (route) => {
          const request = route.request(),
            url = new URL(request.url());
          if (url.origin !== origin) return route.abort();
          if (url.pathname === "/api/events/weather") {
            weatherCalls.push(request.postDataJSON());
            return route.fulfill({ json: weatherState });
          }
          if (["POST", "PATCH"].includes(request.method())) {
            const body = request.postDataJSON();
            if (url.pathname === "/api/event-themes/generate")
              return route.fulfill({ json: { details: body.currentDetails } });
            writes.push(body);
            return route.fulfill({ json: { id: eventId, data: body.data } });
          }
          if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname))
            return route.fulfill({
              contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css",
              body: await fs.readFile(
                path.resolve("output/category-custom-design", url.pathname.slice(1)),
              ),
            });
          if (url.pathname.startsWith("/templates/") || url.pathname.startsWith("/fonts/")) {
            try {
              return await route.fulfill({
                body: await fs.readFile(path.resolve("public", url.pathname.slice(1))),
              });
            } catch {
              return route.fulfill({ status: 404 });
            }
          }
          return route.fulfill({
            contentType: "text/html",
            body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Event weather check</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>',
          });
        });
        await page.goto(`${origin}/editor?editor=1`);
        const toggle = page.getByRole("checkbox", { name: "Show weather on the event page" });
        await toggle.waitFor();
        assert.equal(await toggle.isChecked(), false);
        assert.equal(weatherCalls.length, 0);
        await toggle.check();
        await page.getByLabel("Temperature units").selectOption("c");
        const openPreview = async () => {
          await page.getByRole("button", { name: "Preview", exact: true }).click();
          return page.getByRole("dialog", { name: "Event Page preview" });
        };
        const view =
          width < 700
            ? await openPreview()
            : page.locator('article[aria-label="Event page preview"]');
        let weather = view.getByRole("region", { name: "Event weather" });
        await weather.getByText("Partly cloudy", { exact: true }).waitFor();
        assert.ok((await weather.textContent()).includes("24°C"));
        assert.ok((await weather.textContent()).includes("13 km/h"));
        assert.equal(
          await weather.evaluate((element) => getComputedStyle(element).color),
          dark ? "rgb(255, 255, 255)" : "rgb(24, 57, 65)",
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        const a11y = await new AxeBuilder({ page })
          .include('section[aria-label="Event weather"]')
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        assert.deepEqual(
          a11y.violations.map((item) => ({
            id: item.id,
            targets: item.nodes.map((node) => node.target),
          })),
          [],
        );
        await weather.screenshot({
          path: path.join(out, `weather-${dark ? "dark" : "light"}-${width}.png`),
        });
        if (width < 700) await view.getByRole("button", { name: "Close", exact: true }).click();
        await toggle.uncheck();
        await toggle.check();
        assert.equal(await page.getByLabel("Temperature units").inputValue(), "c");
        assert.deepEqual(
          writes,
          [],
          "Toggling weather and opening previews must not save an event",
        );
        await page.getByRole("button", { name: "Save draft", exact: true }).click();
        await page.getByRole("status").filter({ hasText: "Draft saved." }).waitFor();
        assert.deepEqual(writes[0].data.customEventPage.details.weather, {
          enabled: true,
          units: "c",
        });
        assert.equal(await page.evaluate(() => window.editorProgress.dirty), false);
        await page.getByRole("button", { name: "Publish", exact: true }).click();
        await page.waitForFunction(() => !window.editorProgress.busy && window.navigations?.length);
        assert.deepEqual(writes[1].data.customEventPage.details.weather, {
          enabled: true,
          units: "c",
        });

        // Render the same saved page on the guest surface; the lookup must use only its identity.
        await page.evaluate(
          (value) => localStorage.setItem("weatherTestPage", JSON.stringify(value)),
          writes[1].data.customEventPage,
        );
        await page.goto(`${origin}/guest?guest=1&eventId=${eventId}`);
        weather = page.getByRole("region", { name: "Event weather" });
        await weather.getByText("Partly cloudy", { exact: true }).waitFor();
        assert.deepEqual(weatherCalls.at(-1), { eventId });
        assert.ok((await weather.textContent()).includes("24°C"));
        weatherState = { status: "unavailable" };
        await page.reload();
        await weather.getByRole("button", { name: "Retry weather" }).waitFor();
        weatherState = { status: "outside_window" };
        await weather.getByRole("button", { name: "Retry weather" }).click();
        await weather.getByText(/available closer to the event/).waitFor();
        assert.equal(await weather.getByText("Partly cloudy", { exact: true }).count(), 0);
        assert.deepEqual(errors, []);
        await context.close();
      }
  } finally {
    await browser.close();
  }
});
