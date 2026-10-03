import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";

test("published custom Event Page edits save changes to the same live page and cancel through unsaved protection", { timeout: 120000 }, async () => {
  execFileSync(process.env.BUN_EXECUTABLE || (process.platform === "win32" ? path.join(process.env.APPDATA, "npm/node_modules/bun/bin/bun.exe") : "bun"), ["scripts/build-category-custom-design-fixture.mjs"], { stdio: "pipe" });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const origin = "http://localhost:43131";
  const eventId = "published-event";
  const publicSlug = "gateway-field-trip-camp-helen";
  const eventPath = `/event/${publicSlug}`;
  const image = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#85b6c2" } }).webp().toBuffer();
  const initial = {
    version: 1, category: "general",
    artwork: `data:image/webp;base64,${image.toString("base64")}`,
    design: { version: 1, name: "Park", description: "Coastal park", layout: "split", font: "editorial", colors: { page: "#e9f4f6", surface: "#ffffff", ink: "#193840", accent: "#60508e" } },
    details: { title: "Gateway Field Trip - Camp Helen State Park", description: "Explore the dune lake.", date: "2026-10-05", time: "09:30", endDate: "", endTime: "12:30", timezone: "America/Chicago", venue: "Camp Helen State Park", location: "Panama City Beach", host: "Gateway", rsvpEmail: "", rsvpPhone: "", rsvpEnabled: false, sections: [{ title: "Schedule", body: "Meet at 9:30 AM." }, { title: "What to bring", body: "Comfortable shoes." }], registryLinks: [] },
  };
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      page.setDefaultTimeout(10000);
      const errors = [], writes = [], wording = [];
      let rejectSave = false;
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === `/api/history/${eventId}` && request.method() === "GET") {
          return route.fulfill({ json: { id: eventId, public_slug: publicSlug, revision: "revision-1", data: { status: "published", title: initial.details.title, publicSlug, customEventPage: initial } } });
        }
        if (url.pathname === "/api/event-themes/generate") {
          const body = request.postDataJSON();
          assert.equal(body.mode, "wording");
          wording.push(body);
          return route.fulfill({ json: { details: body.currentDetails } });
        }
        if (["POST", "PATCH"].includes(request.method())) {
          writes.push({ path: url.pathname, method: request.method(), headers: request.headers(), body: request.postDataJSON() });
          return route.fulfill(rejectSave
            ? { status: 503, json: { error: "The event could not be saved. Try again." } }
            : { json: { id: eventId, public_slug: publicSlug, revision: "revision-2" } });
        }
        if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname)) {
          return route.fulfill({ contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css", body: await fs.readFile(path.resolve("output/category-custom-design", url.pathname.slice(1))) });
        }
        if (url.pathname.startsWith("/api/blob/")) return route.fulfill({ contentType: "image/webp", body: image });
        if (url.pathname.startsWith("/fonts/")) return route.fulfill({ status: 404 });
        return route.fulfill({ contentType: "text/html", body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Published event edit check</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>' });
      });
      const open = async (ready = false) => {
        await page.goto(`${origin}/editor?editor=1&edit=${eventId}${ready ? "&ready=1" : ""}`);
        await page.getByRole("button", { name: "Cancel", exact: true }).waitFor();
        await page.waitForFunction(() => window.editorProgress && !window.editorProgress.dirty);
      };
      const toolbar = page.locator("main > header");
      const save = page.getByRole("button", { name: "Save changes", exact: true });
      const cancel = page.getByRole("button", { name: "Cancel", exact: true });
      const title = page.locator("#event-field-title");
      const checkActions = async () => {
        for (const name of ["Preview →", "Save draft", "Publish", "Publish changes"]) {
          assert.equal(await toolbar.getByRole("button", { name, exact: true }).count(), 0, name);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      };
      const assertNavigation = async () => {
        await page.waitForFunction(() => window.navigations?.length === 1);
        assert.deepEqual(await page.evaluate(() => window.navigations), [eventPath]);
      };
      const assertLiveSave = (write, expectedTitle) => {
        assert.equal(write.path, `/api/history/${eventId}`);
        assert.equal(write.method, "PATCH");
        assert.equal(write.headers["if-match"], "revision-1");
        assert.equal(write.body.data.status, "published");
        assert.equal(write.body.data.customEventPageDraft, null);
        assert.equal(write.body.data.customEventPage.details.title, expectedTitle);
        assert.equal(write.body.data.publicSlug, publicSlug);
      };

      // Both views start clean, and Cancel returns without saving or preparing wording.
      for (const ready of [false, true]) {
        await open(ready);
        await checkActions();
        assert.equal(await save.count(), 0);
        const cancelBox = await cancel.boundingBox();
        assert.ok(cancelBox.height >= 44);
        await cancel.focus();
        await page.keyboard.press("Enter");
        await assertNavigation();
        assert.equal(await page.getByRole("dialog").count(), 0);
      }
      assert.equal(writes.length, 0);
      assert.equal(wording.length, 0);

      await open();
      const order = page.getByRole("list", { name: "Page section order" });
      await order.getByRole("button", { name: "Move What to bring up", exact: true }).click();
      await save.waitFor();
      await order.getByRole("button", { name: "Move What to bring down", exact: true }).click();
      await page.waitForFunction(() => !window.editorProgress.dirty);
      assert.equal(await save.count(), 0, "Reverting section order keeps a legacy page clean");
      assert.equal(writes.length, 0, "Moving sections does not save automatically");
      await title.fill("Updated field trip");
      await save.waitFor();
      await page.getByRole("button", { name: "View event page", exact: true }).click();
      assert.equal(await title.isVisible(), false);
      await save.waitFor();
      await checkActions();
      await page.getByRole("button", { name: "Edit details & design", exact: true }).click();
      await title.fill(initial.details.title);
      await page.waitForFunction(() => !window.editorProgress.dirty);
      assert.equal(await save.count(), 0, "Reverting a change hides Save changes");
      const layout = page.getByLabel("Layout");
      await layout.selectOption("banner");
      await save.waitFor();
      await layout.selectOption("split");
      await page.waitForFunction(() => !window.editorProgress.dirty);
      assert.equal(await save.count(), 0, "View changes alone do not dirty saved content");

      await title.fill("Trip with unsaved edits");
      await cancel.click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
      assert.equal(await title.inputValue(), "Trip with unsaved edits");
      assert.deepEqual(await page.evaluate(() => window.navigations || []), []);
      assert.equal(writes.length, 0);
      await cancel.click();
      await dialog.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await assertNavigation();
      assert.equal(writes.length, 0, "Discard does not write over the published event");

      // Save failures retain edits and stay in the editor; retry updates the live event.
      await open();
      await title.fill("Saved field trip update");
      rejectSave = true;
      await save.click();
      await page.getByRole("alert").filter({ hasText: "The event could not be saved. Try again." }).waitFor();
      assert.equal(await title.inputValue(), "Saved field trip update");
      assert.deepEqual(await page.evaluate(() => window.navigations || []), []);
      await page.waitForFunction(() => !window.editorProgress.busy);
      assert.equal(await save.isEnabled(), true);
      rejectSave = false;
      await save.click();
      await assertNavigation();
      assert.equal(writes.length, 2);
      for (const write of writes) assertLiveSave(write, "Saved field trip update");

      // Save and leave keeps the selected destination and saves published changes once.
      await open();
      await title.fill("Changes saved while leaving");
      await cancel.click();
      await dialog.getByRole("button", { name: "Save and leave", exact: true }).click();
      await assertNavigation();
      assert.equal(writes.length, 3);
      assertLiveSave(writes[2], "Changes saved while leaving");
      await open();
      await title.fill("Visible saved changes action");
      await save.waitFor();
      await page.screenshot({ path: `output/category-custom-design/published-editor-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "View event page", exact: true }).click();
      await page.screenshot({ path: `output/category-custom-design/published-page-view-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
