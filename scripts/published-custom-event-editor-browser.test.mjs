import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";

const loadTs = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");
const appearanceBootstrap = loadTs("src/lib/appearance.ts").buildAppearanceBootstrap();

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
    for (const width of [1280, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      page.setDefaultTimeout(10000);
      const errors = [], writes = [], wording = [];
      let rejectSave = false;
      let role = "owner";
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === `/api/history/${eventId}` && request.method() === "GET") {
          return route.fulfill({ json: { id: eventId, public_slug: publicSlug, revision: "revision-1", permissions: { role, canManageCollaborators: role === "owner" }, data: { status: "published", title: initial.details.title, publicSlug, customEventPage: initial } } });
        }
        if (url.pathname === "/api/events/public-slug") return route.fulfill({ json: { available: true, slug: url.searchParams.get("slug") } });
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
        return route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Published event edit check</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><script>${appearanceBootstrap}</script><div id="root"></div><script type="module" src="/entry.js"></script></body></html>` });
      });
      const open = async (ready = false) => {
        await page.goto(`${origin}/editor?editor=1&edit=${eventId}${ready ? "&ready=1" : ""}`);
        await page.getByRole("button", { name: "Cancel", exact: true }).waitFor();
        const edit = page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Edit", exact: true });
        await edit.waitFor();
        assert.equal(await page.getByRole("region", { name: "Event page preview panel", exact: true }).isVisible(), true, "published page opens before its editing controls");
        await edit.click();
        await page.getByRole("button", { name: /^Event details/ }).click();
        await title.waitFor();
        assert.equal(await title.inputValue(), initial.details.title);
        if (ready) await page.getByRole("button", { name: "Preview", exact: true }).click();
      };
      const toolbar = page.getByRole("group", { name: "Editor view", exact: true });
      const save = page.getByRole("button", { name: "Save changes", exact: true });
      const cancel = page.getByRole("button", { name: "Cancel", exact: true });
      const title = page.locator("#event-field-title");
      const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
      const tools = page.getByRole("group", { name: "Page tools", exact: true });
      const setAppearance = async (mode) => {
        await page.evaluate((value) => localStorage.setItem("envitefy:appearance:v1", value), mode);
        await page.addScriptTag({ content: appearanceBootstrap });
        assert.equal(await page.locator("html").getAttribute("data-theme"), `general-${mode}`);
      };
      const openSection = async (name) => {
        const back = page.getByRole("button", { name: "Back to details", exact: true });
        if (await back.isVisible()) await back.click();
        await page.getByRole("button", { name }).click();
      };
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
        assert.equal(write.headers["if-match"], undefined, "event revisions bypass HTTP entity preconditions");
        assert.equal(write.body.expectedRevision, "revision-1");
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

      // Saved pages use the creation tools in both appearances without replacing mounted fields.
      await open();
      await title.fill("Pending title while using page tools");
      await title.evaluate((element) => { window.savedEventTitleNode = element; });
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      const previewScroll = await preview.evaluate((element) => {
        element.scrollTop = Math.min(120, element.scrollHeight - element.clientHeight);
        return element.scrollTop;
      });
      assert.ok(previewScroll > 0, "the saved event has a real preview scroll position to preserve");
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      const assertPendingState = async () => {
        assert.equal(await title.evaluate((element) => element === window.savedEventTitleNode), true, "page tools retain the same title input node");
        assert.equal(await title.inputValue(), "Pending title while using page tools");
        if (width < 768) await page.getByRole("button", { name: "Preview", exact: true }).click();
        assert.equal(await preview.evaluate((element) => element.scrollTop), previewScroll, "page tools preserve preview scroll");
        if (width < 768) await page.getByRole("button", { name: "Edit", exact: true }).click();
        assert.equal(writes.length, 0, "opening page tools never saves pending event details");
      };
      for (const appearance of ["light", "dark"]) {
        await setAppearance(appearance);
        const rail = await tools.evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, radius: parseFloat(style.borderRadius) };
        });
        assert.ok(!["transparent", "rgba(0, 0, 0, 0)"].includes(rail.background), `${appearance} page tools share one visible rail`);
        assert.ok(rail.radius > 0, "the shared page-tools rail has rounded corners");
        assert.deepEqual(await tools.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label"))), ["Page sections", "Layout", "Custom URL"]);
        const boxes = await tools.getByRole("button").evaluateAll((buttons) => buttons.map((button) => {
          const { x, y, width, height } = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return { x, y, width, height, border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].reduce((sum, value) => sum + parseFloat(value), 0) };
        }));
        for (const box of boxes) {
          assert.ok(Math.abs(box.width - boxes[0].width) < 1 && Math.abs(box.y - boxes[0].y) < 1, `${appearance} ${width}px page tools form one equal-width row`);
          assert.ok(box.width >= 44 && box.height >= 44, `${appearance} ${width}px page tools retain touch targets`);
          assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `${appearance} ${width}px page tools fit the viewport`);
          assert.equal(box.border, 0, "page tools do not have separate card borders");
        }
        const assertActiveTool = async (name) => {
          assert.equal(await tools.isVisible(), true, "the tools row stays visible above its active panel");
          for (const label of ["Page sections", "Layout", "Custom URL"]) {
            assert.equal(await tools.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), String(label === name), `${label} reports its active state`);
          }
        };
        await assertActiveTool(null);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const name of ["Page sections", "Layout", "Custom URL"]) {
          await tools.getByRole("button", { name, exact: true }).click();
          await assertActiveTool(name);
          await assertPendingState();
          if (name === "Custom URL") {
            const urlInput = page.getByRole("textbox", { name: "Custom URL", exact: true });
            await urlInput.fill("pending-field-trip-address");
            await urlInput.evaluate((element) => { window.savedEventUrlNode = element; });
          }
        }
        for (const name of ["Layout", "Page sections", "Custom URL"]) {
          await tools.getByRole("button", { name, exact: true }).focus();
          await page.keyboard.press("Enter");
          await assertActiveTool(name);
          await assertPendingState();
        }
        const urlInput = page.getByRole("textbox", { name: "Custom URL", exact: true });
        assert.equal(await urlInput.inputValue(), "pending-field-trip-address", "switching tools retains an unsaved URL value");
        assert.equal(await urlInput.evaluate((element) => element === window.savedEventUrlNode), true, "switching tools retains the mounted URL field");
        await page.getByRole("button", { name: "Back to details", exact: true }).click();
        await assertActiveTool(null);
        await openSection(/^Event details/);
        await assertPendingState();
        await page.screenshot({ path: `output/category-custom-design/published-tools-${appearance}-${width}.png` });
      }
      await title.fill(initial.details.title);
      await save.waitFor({ state: "hidden" });
      await setAppearance("light");

      await open();
      await openSection(/^Page sections/);
      const order = page.getByRole("list", { name: "Page section order" });
      await order.getByRole("button", { name: "Move What to bring up", exact: true }).click();
      await save.waitFor();
      await order.getByRole("button", { name: "Move What to bring down", exact: true }).click();
      await save.waitFor({ state: "hidden" });
      assert.equal(await save.count(), 0, "Reverting section order keeps a legacy page clean");
      assert.equal(writes.length, 0, "Moving sections does not save automatically");
      await openSection(/^Event details/);
      await title.fill("Updated field trip");
      await save.waitFor();
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      assert.equal(await title.isVisible(), false);
      await save.waitFor();
      await checkActions();
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      await title.fill(initial.details.title);
      await save.waitFor({ state: "hidden" });
      assert.equal(await save.count(), 0, "Reverting a change hides Save changes");
      await openSection(/^Layout/);
      await page.getByRole("button", { name: "Choose Banner layout", exact: true }).click();
      await save.waitFor();
      await page.getByRole("button", { name: "Choose Split layout", exact: true }).click();
      await save.waitFor({ state: "hidden" });
      assert.equal(await save.count(), 0, "View changes alone do not dirty saved content");

      await openSection(/^Event details/);
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
      await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Save changes" && !button.disabled));
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
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await page.screenshot({ path: `output/category-custom-design/published-page-view-${width}.png`, fullPage: true });

      role = "cohost";
      await open();
      assert.deepEqual(await tools.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label"))), ["Page sections", "Layout"], "co-hosts retain page tools without owner URL controls");
      assert.equal(await page.getByRole("button", { name: "Custom URL", exact: true, includeHidden: true }).count(), 0);
      assert.equal(await page.getByRole("textbox", { name: "Custom URL", exact: true, includeHidden: true }).count(), 0);
      await title.fill("Co-host event details update");
      await save.click();
      await assertNavigation();
      assertLiveSave(writes.at(-1), "Co-host event details update");
      assert.equal(await page.getByRole("button", { name: "Custom URL", exact: true, includeHidden: true }).count(), 0, "content-only save responses do not reveal owner URL controls");
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
