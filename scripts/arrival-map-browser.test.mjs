import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import sharp from "sharp";

test("custom event menus toggle maps and weather, preview seven layouts, and save only explicitly", {
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
  const out = path.resolve("output/arrival-map-preview");
  await fs.mkdir(out, { recursive: true });
  const pixel = await sharp({
    create: { width: 960, height: 640, channels: 3, background: "#e8f3f5" },
  })
    .webp()
    .toBuffer();
  const sourcePixel = await sharp({
    create: { width: 355, height: 228, channels: 3, background: "#ffeecc" },
  }).webp().toBuffer();
  await fs.writeFile(path.join(out, "test-source.webp"), pixel);
  const artwork = await fs.readFile(path.resolve("public/templates/signup/photographic/clubs-and-groups/gardening-group.webp"));
  let map;
  try {
    map = JSON.parse(await fs.readFile(path.join(out, "local-map.json"), "utf8"));
  } catch {
    map = {
      version: 1,
      status: "ready",
      sourceImage: `data:image/webp;base64,${sourcePixel.toString("base64")}`,
      mapImage: `data:image/webp;base64,${pixel.toString("base64")}`,
      view: { latitude: 30.27481, longitude: -85.99046, zoom: 16, width: 960, height: 640 },
      markers: [
        {
          label: "Parking",
          kind: "parking",
          note: "Reserve closest spaces for pumpkin-patch visitors.",
          point: null,
          confirmed: false,
        },
        {
          label: "Student drop-off",
          kind: "dropoff",
          note: "Use the marked drop-off area.",
          point: null,
          confirmed: false,
        },
      ],
    };
  }
  // These locally compared positions are proposals, never accepted geographic destinations.
  map.markers[0].point = { x: 531 / 960, y: 282 / 640 };
  map.markers[1].point = { x: 539 / 960, y: 417 / 640 };
  const initial = {
    version: 1,
    category: "general",
    artwork: `data:image/webp;base64,${artwork.toString("base64")}`,
    design: {
      version: 1,
      name: "Coastal field trip",
      description: "Coastal park",
      layout: "editorial",
      font: "modern",
      colors: { page: "#e8f3f5", surface: "#ffffff", ink: "#183941", accent: "#305865" },
    },
    details: {
      title: "Gateway Field Trip - Camp Helen State Park",
      description: "Explore the dune lake and shoreline.",
      date: "2026-10-05",
      time: "09:30",
      endDate: "",
      endTime: "12:30",
      timezone: "America/Chicago",
      venue: "Camp Helen State Park",
      location: "23937 Panama City Beach Parkway, Panama City Beach, FL 32413",
      host: "Gateway",
      rsvpEmail: "",
      rsvpPhone: "",
      rsvpEnabled: false,
      sections: [
        {
          title: "Student Drop-Off & Parking",
          body: "Please park by the Rec Hall. Keep the closest parking spots available for pumpkin-patch visitors.",
          map,
        },
        { title: "Activities", body: "Explore the dune lake and shoreline." },
        { title: "Chaperone Requirements", body: "Please stay with your group." },
      ],
      registryLinks: [],
    },
  };
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  const origin = "http://localhost:43135";
  try {
    for (const size of [
      { width: 1280, height: 900 },
      { width: 375, height: 812 },
      { width: 812, height: 375 },
    ]) {
      const context = await browser.newContext({ viewport: size, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [],
        writes = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript((value) => {
        const params = new URLSearchParams(location.search);
        window.testEditorPage = params.has("noSnapshot")
          ? { ...value, details: { ...value.details, sections: value.details.sections.map((section) => section.map
              ? { ...section, map: { version: 1, sourceImage: section.map.sourceImage, status: "provider_unavailable",
                  markers: section.map.markers.map((marker) => ({ ...marker, point: null, confirmed: false })) } }
              : section) } }
          : params.has("brokenSnapshot")
            ? { ...value, details: { ...value.details, sections: value.details.sections.map((section) => section.map
                ? { ...section, map: { ...section.map, mapImage: "/api/blob/broken-map.webp" } } : section) } }
          : params.has("saved")
          ? JSON.parse(sessionStorage.getItem("savedArrivalPage"))
          : params.has("noParkingSection")
            ? { ...value, details: { ...value.details, sections: value.details.sections.slice(1) } }
            : value;
      }, initial);
      await page.route("**/*", async (route) => {
        const request = route.request(),
          url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === "/api/events/weather") return route.fulfill({ json: {
          status: "available", location: "Camp Helen State Park", date: "2026-10-05", time: "09:30",
          checkedAt: "2026-10-03T15:00:00Z", summary: "Partly cloudy", tempC: 24, tempF: 76,
          highC: 27, highF: 81, lowC: 20, lowF: 68, windMph: 5, windKph: 8, rainChance: 10,
        } });
        if (url.pathname === "/api/event-themes/generate") {
          const body = request.postDataJSON();
          if (body.mode === "arrival-map") {
            assert.equal(
              body.informationImages,
              undefined,
              "Snapshot preparation reuses the in-memory map source",
            );
            return route.fulfill({
              json: {
                map: {
                  ...map,
                  sourceImage: body.currentDetails.sections[body.arrivalMapSection].map.sourceImage,
                  markers: map.markers,
                },
              },
            });
          }
          return route.fulfill({ json: { details: body.currentDetails } });
        }
        if (["POST", "PATCH"].includes(request.method())) {
          writes.push(request.postDataJSON());
          return route.fulfill({ json: { id: "arrival-map-test" } });
        }
        if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname))
          return route.fulfill({
            contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css",
            body: await fs.readFile(
              path.resolve("output/category-custom-design", url.pathname.slice(1)),
            ),
          });
        if (url.pathname.startsWith("/fonts/")) return route.fulfill({ status: 404 });
        if (url.pathname === "/api/blob/broken-map.webp") return route.fulfill({ status: 503 });
        if (url.pathname.startsWith("/api/blob/"))
          return route.fulfill({ contentType: "image/webp", body: pixel });
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parking map preview</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>',
        });
      });
      await page.goto(`${origin}/preview?guest=1`);
      const section = page
        .getByRole("heading", { name: "Student Drop-Off & Parking" })
        .locator("..");
      await section.waitFor();
      assert.equal(await page.getByRole("link", { name: /^Directions to/ }).count(), 0);
      const screenshot = section.getByRole("img", { name: "Street map of the event area with numbered arrival locations" });
      await screenshot.waitFor();
      assert.equal(await screenshot.getAttribute("src"), map.mapImage);
      await screenshot.evaluate((img) => img.decode());
      assert.equal(await section.locator("img").count(), 1, "Only the provider screenshot is rendered");
      assert.equal(await page.locator("img").evaluateAll((images, source) => images.some((img) => img.getAttribute("src") === source), map.sourceImage), false);
      const pins = section.locator('span[style*="left:"][style*="top:"]');
      assert.equal(await pins.count(), 2, "Saved locations appear without changing confirmation state");
      const viewport = screenshot.locator("..");
      const viewportBox = await viewport.boundingBox();
      const imageBox = await screenshot.boundingBox();
      assert.ok(Math.abs(imageBox.width / viewportBox.width - 2) < 0.01, "The saved screenshot is magnified 2×");
      for (let index = 0; index < map.markers.length; index++) {
        const marker = map.markers[index];
        const box = await screenshot.boundingBox();
        const pin = await pins.nth(index).boundingBox();
        assert.ok(Math.abs(pin.x + pin.width / 2 - (box.x + marker.point.x * box.width)) < 1);
        assert.ok(Math.abs(pin.y + pin.height / 2 - (box.y + marker.point.y * box.height)) < 1);
        assert.ok(pin.x >= viewportBox.x && pin.x + pin.width <= viewportBox.x + viewportBox.width);
        assert.ok(pin.y >= viewportBox.y && pin.y + pin.height <= viewportBox.y + viewportBox.height);
        assert.equal(await section.getByText(marker.label, { exact: true }).count(), 1);
        assert.equal(await section.getByText(marker.note, { exact: true }).count(), 1);
        assert.ok((await screenshot.getAttribute("aria-description")).includes(`${index + 1}: ${marker.label}`));
      }
      const legend = section.getByRole("list", { name: "Arrival locations" });
      assert.equal(await legend.count(), 1, "Every map number has a visible label and instructions");
      assert.equal(await legend.getByRole("listitem").count(), map.markers.length);
      const mapBox = await section.locator("[data-arrival-map]").boundingBox();
      assert.ok((await legend.boundingBox()).y >= mapBox.y + mapBox.height,
        "The legend appears directly beneath the map");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await section.screenshot({ type: "png" }).then(async (bytes) => {
        // Playwright encodes PNG; FFmpeg encodes the final WebP and verifies it.
        const { createRequire } = await import("node:module");
        const loadTs = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");
        const { encodeScanArtworkWebp } = loadTs("src/lib/ocr/artwork-webp.ts");
        await fs.writeFile(
          path.join(out, `parking-section-${size.width}.webp`),
          await encodeScanArtworkWebp(bytes),
        );
      });
      const axe = await new AxeBuilder({ page })
        .include('section[data-event-section="section:0"]')
        .analyze();
      assert.deepEqual(axe.violations, []);
      for (const query of ["noSnapshot", "brokenSnapshot"]) {
        await page.goto(`${origin}/preview?guest=1&${query}=1`);
        await page.getByRole("status").filter({ hasText: "The parking map screenshot is unavailable." }).waitFor();
        assert.equal(await section.locator("img").count(), 0, "Unavailable screenshots never reveal the source");
        assert.equal(await page.locator("img").evaluateAll((images, source) => images.some((img) => img.getAttribute("src") === source), map.sourceImage), false);
        assert.equal(await section.getByText(map.markers[0].note, { exact: true }).count(), 1);
        assert.equal(await section.getByRole("list", { name: "Arrival locations" }).count(), 1);
      }
      await page.goto(`${origin}/editor?editor=1`);
      const toggle = page.getByRole("switch", { name: "Show parking map", exact: true });
      await toggle.waitFor();
      assert.equal(await page.getByRole("button", { name: /^Page options/ }).count(), 0);
      const previewImage = page.getByRole("img", { name: "Street map of the event area with numbered arrival locations", includeHidden: true });
      assert.equal(await toggle.count(), 1);
      assert.equal(await toggle.getAttribute("aria-checked"), "true");
      for (const name of ["Confirm marker position", "Clear position", "Add marker", "Refresh map from event address", "Remove all markers", "Replace source map"]) {
        assert.equal(await page.getByRole("button", { name, exact: true }).count(), 0);
      }
      assert.equal(await previewImage.count(), 1);
      await toggle.click();
      assert.equal(await previewImage.count(), 0);
      await toggle.click();
      assert.equal(await previewImage.count(), 1);
      await toggle.click();
      const weatherToggle = page.getByRole("switch", { name: "Show weather", exact: true });
      assert.equal(await weatherToggle.getAttribute("aria-checked"), "false");
      await weatherToggle.focus();
      await page.keyboard.press("Space");
      const weather = page.getByRole("region", { name: "Event weather", includeHidden: true });
      await page.getByRole("button", { name: "Celsius", exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[aria-label="Event weather"]')?.textContent.includes("24°C"));
      await weatherToggle.click();
      assert.equal(await weather.count(), 0);
      await weatherToggle.click();
      assert.equal(await page.getByRole("button", { name: "Celsius", exact: true }).getAttribute("aria-pressed"), "true");
      const menuAxe = await new AxeBuilder({ page }).include('[aria-label="Event editing controls"]').analyze();
      assert.deepEqual(menuAxe.violations, []);
      await page.getByRole("button", { name: /^Design/ }).click();
      const layouts = ["Split", "Banner", "Poster", "Editorial", "Spotlight", "Minimal", "Cards"];
      assert.equal(await page.getByRole("button", { name: /^Choose .* layout$/ }).count(), layouts.length);
      assert.equal(await page.getByRole("combobox", { name: "Layout", exact: true }).count(), 0);
      for (const label of layouts) {
        const choice = page.getByRole("button", { name: `Choose ${label} layout`, exact: true });
        await choice.click();
        assert.equal(await choice.getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator('article[aria-label="Event page preview"]').getAttribute("data-layout"), label.toLowerCase());
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      if (size.width === 1280) {
        await page.setViewportSize({ width: size.width, height: 1300 });
        const bytes = await page.getByRole("group", { name: "Layout", exact: true }).screenshot({ type: "png" });
        const { createRequire } = await import("node:module");
        const loadTs = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");
        await fs.writeFile(path.join(out, "layout-thumbnails.webp"), await loadTs("src/lib/ocr/artwork-webp.ts").encodeScanArtworkWebp(bytes));
        await page.setViewportSize(size);
      }
      assert.equal(writes.length, 0, "Visibility changes never automatically save");
      assert.equal(await page.evaluate(() => (window.imageUploads || []).length), 0);
      await page.getByRole("button", { name: "Save draft", exact: true }).first().click();
      await page.waitForFunction(() => (window.imageUploads || []).length === 3);
      assert.equal(writes.length, 1);
      const saved = writes[0].data.customEventPage;
      assert.equal(saved.design.layout, "cards");
      assert.deepEqual(saved.details.weather, { enabled: true, units: "c" });
      assert.equal(saved.details.arrivalMapEnabled, false);
      assert.deepEqual(saved.details.sections[0].map.markers, map.markers);
      assert.equal(saved.details.sections[0].map.sourceImage, "/api/blob/event-media/replacement.webp");
      assert.deepEqual(saved.details.sections.slice(1), initial.details.sections.slice(1),
        "Hiding the map preserves unrelated sections");
      await page.evaluate((value) => sessionStorage.setItem("savedArrivalPage", JSON.stringify(value)), saved);
      await page.goto(`${origin}/published?guest=1&eventId=arrival-map-test&saved=1`);
      await page.getByRole("heading", { name: "Student Drop-Off & Parking" }).waitFor();
      const activityBox = await page.getByRole("heading", { name: "Activities", exact: true }).locator("..").boundingBox();
      const chaperoneBox = await page.getByRole("heading", { name: "Chaperone Requirements", exact: true }).locator("..").boundingBox();
      if (size.width > 700) {
        assert.ok(Math.abs(activityBox.y - chaperoneBox.y) <= 1, "Cards layout has two information columns");
        assert.ok(activityBox.x + activityBox.width <= chaperoneBox.x);
      } else assert.ok(chaperoneBox.y >= activityBox.y + activityBox.height, "Cards stack on phones");
      assert.equal(await previewImage.count(), 0);
      assert.equal(await page.getByText(initial.details.sections[0].body, { exact: true }).count(), 1);
      assert.equal(await page.getByRole("link", { name: /^Directions to/ }).count(), 0);
      await page.goto(`${origin}/editor?editor=1&saved=1`);
      await toggle.waitFor();
      assert.equal(await toggle.getAttribute("aria-checked"), "false");
      await toggle.click();
      assert.equal(await previewImage.count(), 1);
      assert.equal(writes.length, 1);
      await page.goto(`${origin}/editor?editor=1&noParkingSection=1`);
      await page.getByRole("button", { name: /^Page sections/ }).click();
      assert.equal(await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).count(), 1);
      const newMapChooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).click();
      await (await newMapChooser).setFiles(path.join(out, "test-source.webp"));
      const sectionControls = page.getByRole("region", { name: "Page sections", exact: true });
      await sectionControls.getByRole("button", { name: "Edit Parking & drop-off", exact: true }).waitFor();
      await previewImage.waitFor({ state: "attached" });
      assert.equal(await previewImage.getAttribute("src"), map.mapImage, "Manual uploads also prepare the provider screenshot");
      await sectionControls.getByRole("button", { name: "Edit Parking & drop-off", exact: true }).click();
      assert.equal(await page.getByLabel("Section heading", { exact: true }).inputValue(), "Parking & drop-off");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      assert.equal(await sectionControls.getByRole("button", { name: "Edit Activities", exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).count(), 0);
      assert.equal(writes.length, 1, "Adding a dedicated parking section does not save the event");
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
