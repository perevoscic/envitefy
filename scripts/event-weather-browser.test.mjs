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
    for (const width of [1280, 900, 390])
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
            title: "Gateway Field Trip - Camp Helen State Park",
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
            sections: [
              { title: "Schedule", body: "Meet at the park entrance at 9:30 AM. Explore the shoreline with your group.\n".repeat(10) },
              { title: "What to bring", body: "Bring comfortable shoes, a water bottle and a picnic.\n".repeat(10) },
            ],
            registryLinks: [{ label: "Supplies", url: "https://example.test/supplies" }],
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
        const headline = await view.getByRole("heading", { level: 1 }).boundingBox();
        const artwork = await view.locator("header > div > img").boundingBox();
        const details = await weather.evaluate((element) => element.parentElement.getBoundingClientRect().toJSON());
        assert.ok(headline.y + headline.height <= artwork.y + 1, "The title sits above the artwork");
        assert.ok(headline.y + headline.height <= details.y + 1, "The title sits above the event details and weather");
        if (width === 1280 && !dark) assert.ok(headline.width > details.width + artwork.width, "The title spans both editorial columns");
        assert.equal(await weather.evaluate((element) => Boolean(element.closest("header"))), true, "Weather lives in the main event section");
        assert.ok((await weather.boundingBox()).height < 285, "Weather stays compact");
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
        if (width > 700) assert.equal(await view.evaluate((element) => {
          const panel = element.closest('[aria-label="Event page preview panel"]');
          return panel.scrollWidth <= panel.clientWidth;
        }), true, "The preview content fits its own pane, including in a narrow desktop window");
        weatherState = { ...forecast, tempC: 25, tempF: 77 };
        await weather.getByRole("button", { name: "Refresh weather" }).click();
        await weather.getByText("25", { exact: false }).first().waitFor();
        assert.equal(weatherCalls.at(-1).refresh, true);
        weatherState = { status: "unavailable" };
        await weather.getByRole("button", { name: "Refresh weather" }).click();
        await weather.getByText(/Couldn't refresh/).waitFor();
        assert.ok((await weather.textContent()).includes("25°C"), "Provider failure preserves the last forecast");
        weatherState = forecast;
        await weather.getByRole("button", { name: "Refresh weather" }).click();
        await weather.getByText("24", { exact: false }).first().waitFor();
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
        if (width > 700) {
          const controls = page.getByRole("group", { name: "Event editing controls", exact: true });
          const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
          await controls.evaluate((element) => { element.scrollTop = 0; });
          await preview.evaluate((element) => { element.scrollTop = 0; });
          const positions = () => page.evaluate(() => ({
            controls: document.querySelector('fieldset[aria-label="Event editing controls"]').scrollTop,
            preview: document.querySelector('[aria-label="Event page preview panel"]').scrollTop,
            document: window.scrollY,
            editor: document.querySelector('fieldset[aria-label="Event editing controls"]').closest("main").scrollTop,
          }));
          const left = await controls.boundingBox(), right = await preview.boundingBox();
          await page.mouse.move(left.x + left.width / 2, left.y + 100);
          await page.mouse.wheel(0, 450);
          await page.waitForFunction(() => document.querySelector('fieldset[aria-label="Event editing controls"]').scrollTop > 0);
          const afterLeft = await positions();
          assert.equal(afterLeft.preview, 0);
          assert.equal(afterLeft.document, 0);
          assert.equal(afterLeft.editor, 0);
          await page.mouse.move(right.x + right.width / 2, right.y + 100);
          await page.mouse.wheel(0, 450);
          await page.waitForFunction(() => document.querySelector('[aria-label="Event page preview panel"]').scrollTop > 0);
          const afterRight = await positions();
          assert.equal(afterRight.controls, afterLeft.controls);
          assert.equal(afterRight.document, 0);
          assert.equal(afterRight.editor, 0);
          await controls.evaluate((element) => { element.scrollTop = element.scrollHeight; });
          await page.mouse.move(left.x + left.width / 2, left.y + 100);
          await page.mouse.wheel(0, 600);
          await page.waitForTimeout(150);
          assert.equal((await positions()).document, 0, "At the panel's end, scrolling must not chain into the document");
          assert.equal((await positions()).preview, afterRight.preview);
          await preview.focus();
          await page.keyboard.press("PageDown");
          await page.waitForFunction((previous) => document.querySelector('[aria-label="Event page preview panel"]').scrollTop > previous, afterRight.preview);
          assert.equal((await positions()).document, 0);
        }
        const order = page.getByRole("list", { name: "Page section order" });
        await order.getByRole("button", { name: "Move What to bring up", exact: true }).click();
        await order.getByRole("button", { name: "Move What to bring up", exact: true }).click();
        assert.deepEqual(await order.locator("li > span").allTextContents(), ["What to bring", "Welcome & overview", "Schedule", "Registry"]);
        assert.deepEqual(await page.locator('article[aria-label="Event page preview"] [data-event-section]').evaluateAll((items) => items.map((item) => item.dataset.eventSection)), ["section:1", "overview", "section:0", "registry"]);
        if (width > 700) {
          const toolbarBox = await page.getByRole("button", { name: "Save draft", exact: true }).boundingBox();
          const scrollDetails = await page.evaluate(() => {
            const editor = document.querySelector('fieldset[aria-label="Event editing controls"]').closest("main");
            return { window: window.scrollY, body: document.body.scrollTop, html: document.documentElement.scrollTop, editor: editor.scrollTop, rect: editor.getBoundingClientRect().toJSON(), height: getComputedStyle(editor).height, sizing: getComputedStyle(editor).boxSizing, viewport: innerHeight };
          });
          assert.ok(toolbarBox.y >= 0, `The toolbar stays visible when a section is focused or moved: ${JSON.stringify({ width, dark, toolbarBox, scrollDetails })}`);
          assert.equal(await page.evaluate(() => document.querySelector('fieldset[aria-label="Event editing controls"]').closest("main").scrollTop), 0);
        }
        if (width === 1280 && !dark) {
          await page.getByRole("region", { name: "Event page preview panel", exact: true }).evaluate((element) => { element.scrollTop = 0; });
          await page.screenshot({ path: path.join(out, "editor-sections-and-weather.png") });
        }
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
        assert.deepEqual(writes[0].data.customEventPage.details.sectionOrder, ["section:1", "overview", "section:0", "registry"]);
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
        assert.deepEqual(await page.locator('[data-event-section]').evaluateAll((items) => items.map((item) => item.dataset.eventSection)), ["section:1", "overview", "section:0", "registry"]);
        assert.ok((await weather.textContent()).includes("24°C"));
        weatherState = { status: "unavailable" };
        await page.reload();
        await weather.getByText(/couldn't load the forecast/).waitFor();
        weatherState = { status: "outside_window" };
        await weather.getByRole("button", { name: "Refresh weather" }).click();
        await weather.getByText(/available closer to the event/).waitFor();
        assert.equal(await weather.getByText("Partly cloudy", { exact: true }).count(), 0);
        assert.deepEqual(weatherCalls.at(-1), { eventId, refresh: true });
        assert.deepEqual(errors, []);
        await context.close();
      }
  } finally {
    await browser.close();
  }
});
