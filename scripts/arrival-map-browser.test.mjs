import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import sharp from "sharp";

test("arrival maps keep source evidence, support keyboard placement, and save only explicitly", {
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
  await fs.writeFile(path.join(out, "test-source.webp"), pixel);
  let map;
  try {
    map = JSON.parse(await fs.readFile(path.join(out, "local-map.json"), "utf8"));
  } catch {
    map = {
      version: 1,
      status: "ready",
      sourceImage: `data:image/webp;base64,${pixel.toString("base64")}`,
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
    artwork: `data:image/webp;base64,${pixel.toString("base64")}`,
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
          body: "Please park by the Rec Hall. Keep the closest parking spots available for pumpkin-patch visitors. Compare the marked areas with the original handout.",
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
        window.testEditorPage = new URLSearchParams(location.search).has("noParkingSection")
          ? { ...value, details: { ...value.details, sections: value.details.sections.slice(1) } }
          : value;
      }, initial);
      await page.route("**/*", async (route) => {
        const request = route.request(),
          url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === "/api/event-themes/generate") {
          const body = request.postDataJSON();
          if (body.mode === "arrival-map") {
            assert.equal(
              body.informationImages,
              undefined,
              "Refresh never sends the source image to vision",
            );
            return route.fulfill({
              json: {
                map: {
                  ...map,
                  sourceImage: body.currentDetails.sections[body.arrivalMapSection].map.sourceImage,
                  markers: map.markers.map((m) => ({ ...m, point: null, confirmed: false })),
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
      assert.equal(await section.locator('[data-confirmed="false"]').count(), 2);
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
      await page.goto(`${origin}/editor?editor=1`);
      await page.getByRole("button", { name: "Replace source map", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Replace source map", exact: true }).count(), 1);
      await page.getByRole("button", { name: "Remove map", exact: true }).click();
      assert.equal(await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).count(), 1,
        "One page-level control replaces the repeated per-section controls");
      assert.equal(await page.getByRole("button", { name: "Replace source map", exact: true }).count(), 0);
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).click();
      await (await chooser).setFiles(path.join(out, "test-source.webp"));
      await page.getByRole("button", { name: "Replace source map", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).count(), 0);
      assert.equal(await page.getByLabel("Section heading", { exact: true }).count(), 3,
        "The upload reuses the existing parking section");
      await page
        .getByRole("button", { name: "Refresh map from event address", exact: true })
        .click();
      const canvas = page.getByRole("button", { name: /^Place Parking on the map/ });
      await canvas.waitFor();
      await canvas.focus();
      await page.keyboard.press("ArrowRight");
      await page.getByRole("button", { name: "Confirm marker position", exact: true }).click();
      assert.equal(await canvas.locator('[data-confirmed="true"]').count(), 1);
      assert.equal(writes.length, 0);
      assert.equal(await page.evaluate(() => (window.imageUploads || []).length), 0);
      await page.getByRole("button", { name: "Save draft", exact: true }).first().click();
      await page.waitForFunction(() => (window.imageUploads || []).length === 3);
      assert.equal(writes.length, 1);
      assert.equal(
        writes[0].data.customEventPage.details.sections[0].map.markers[0].confirmed,
        true,
      );
      assert.equal(
        writes[0].data.customEventPage.details.sections[0].map.markers[1].confirmed,
        false,
      );
      assert.deepEqual(writes[0].data.customEventPage.details.sections.slice(1), initial.details.sections.slice(1),
        "Adding the arrival map preserves unrelated sections");
      await page.goto(`${origin}/published?guest=1&eventId=arrival-map-test`);
      await page.getByRole("heading", { name: "Student Drop-Off & Parking" }).waitFor();
      assert.equal(
        await page.locator('[data-confirmed="false"]').count(),
        0,
        "Unconfirmed positions are hidden from guests",
      );
      assert.equal(await page.getByRole("link", { name: /^Directions to/ }).count(), 0);
      assert.equal(
        await page.locator("details[open]").filter({ hasText: "View source handout map" }).count(),
        1,
        "The annotated source stays visible while guest marker positions are unconfirmed",
      );
      await page.goto(`${origin}/editor?editor=1&noParkingSection=1`);
      await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).count(), 1);
      const newMapChooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Add parking / drop-off map", exact: true }).click();
      await (await newMapChooser).setFiles(path.join(out, "test-source.webp"));
      await page.getByRole("button", { name: "Replace source map", exact: true }).waitFor();
      assert.equal(await page.getByLabel("Section heading", { exact: true }).count(), 3);
      assert.equal(await page.locator("#event-field-section-2-title").inputValue(), "Parking & drop-off");
      assert.equal(await page.locator("#event-field-section-0-title").inputValue(), "Activities");
      assert.equal(writes.length, 1, "Adding a dedicated parking section does not save the event");
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
});
