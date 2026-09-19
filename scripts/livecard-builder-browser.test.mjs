import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

test("Live Card builder: concurrent editing, explicit saves, failure recovery, guest toggles, resume, mobile and landscape", {
  timeout: 120000,
}, async () => {
  execSync("bun scripts/build-livecard-builder-fixture.mjs", { timeout: 60000, stdio: "pipe" });
  const out = path.resolve(".qa/livecard-builder");
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/artwork.webp") {
      res.setHeader("Content-Type", "image/webp");
      res.end(await fs.readFile("public/studio/birthday.webp"));
      return;
    }
    if (["/entry.js", "/entry.css", "/global.css"].includes(pathname)) {
      res.setHeader("Content-Type", pathname.endsWith(".js") ? "text/javascript" : "text/css");
      res.end(await fs.readFile(path.join(out, pathname.slice(1))));
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><html lang="en"><head><title>Live Card builder test</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="background:#f7f4fa"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  const saves = [];
  const generations = [];
  let stored;
  let failSave = false;
  let failGeneration = false;
  let releaseGeneration;
  let generationStarted;
  const started = new Promise((resolve) => {
    generationStarted = resolve;
  });
  const gate = new Promise((resolve) => {
    releaseGeneration = resolve;
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (!request.url().startsWith(origin)) return route.abort();
    const url = new URL(request.url());
    if (url.pathname === "/api/studio/generate") {
      generations.push(request.postDataJSON());
      generationStarted();
      await gate;
      if (failGeneration)
        return route.fulfill({
          status: 500,
          json: {
            ok: false,
            errors: {
              image: {
                code: "test_error",
                message: "We couldn't finish the design. Please retry.",
                retryable: true,
                provider: "openai",
              },
            },
          },
        });
      return route.fulfill({
        contentType: "application/x-ndjson",
        body: `${JSON.stringify({
          type: "complete",
          result: {
            ok: true,
            mode: "both",
            product: "live_card",
            imageUrl: `${origin}/artwork.webp`,
            artworkTextMode: "headline",
            warnings: [],
            liveCard: null,
            invitation: null,
          },
        })}\n`,
      });
    }
    if (url.pathname.startsWith("/api/history")) {
      if (request.method() === "GET")
        return route.fulfill({
          json: stored || { error: "Not found" },
          status: stored ? 200 : 404,
        });
      const body = request.postDataJSON();
      saves.push(body);
      if (failSave)
        return route.fulfill({ status: 500, json: { error: "Test save failed. Please retry." } });
      stored = { ...body, id: body.clientDraftId || stored.id, public_slug: "movie-night" };
      return route.fulfill({ status: request.method() === "POST" ? 201 : 200, json: stored });
    }
    if (url.pathname.startsWith("/api/")) throw new Error(`Unexpected API call: ${request.url()}`);
    return route.continue();
  });
  const openSection = async (name) => {
    await page.getByRole("tab", { name: new RegExp(`^${name}`) }).click();
    assert.equal(await page.getByRole("tabpanel").count(), 1, "only one section is mounted");
  };
  try {
    await page.goto(`${origin}/livacards-invites`);
    await page.getByLabel("Event title or name").fill("Livia's Movie Night");
    await page.getByLabel("Event type", { exact: true }).selectOption("Birthday");
    await page
      .getByLabel("How would you like your card to look?")
      .fill("Pink movie night with popcorn and stars");
    await page.screenshot({ path: path.join(out, "desktop-design.png"), fullPage: true });
    assert.equal(saves.length, 0, "typing never saves a draft");
    await page.getByRole("button", { name: "Create design & continue" }).click();
    await started;
    await page.getByLabel("About your event").fill("A movie and dinner with friends.");
    assert.equal(await page.getByLabel("Event date", { exact: true }).count(), 0);
    await page.getByRole("tab", { name: "Overview", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.getByRole("tab", { name: "When", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await page.getByLabel("Event date", { exact: true }).fill("2026-10-04");
    await page.getByLabel("Start time", { exact: true }).fill("18:00");
    await page.getByLabel("Timezone").selectOption("America/Chicago");
    await openSection("Where");
    await page.getByLabel("Venue name (optional)", { exact: true }).fill("Cinema");
    await page.getByLabel("Address or meeting link", { exact: true }).fill("123 Main St, Chicago");
    await page.getByRole("button", { name: "Add another location" }).click();
    await page.getByLabel("What happens here?").fill("Dinner");
    await page.getByLabel("Address or meeting link", { exact: true }).fill("456 Lake St, Chicago");
    assert.equal(
      await page.getByLabel("Address or meeting link", { exact: true }).count(),
      1,
      "only the active location expands",
    );
    await openSection("RSVP");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await page.getByLabel("Host name", { exact: true }).fill("Mia");
    await page.getByLabel("Host email (optional)").fill("mia@example.com");
    await openSection("Registry");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByLabel("Registry or gift-list link").fill("https://example.com/gifts");
    await page.getByLabel("Gift message (optional)").fill("Your presence is our present.");
    assert.equal(saves.length, 0, "generation and continued form editing never create a draft");
    // An explicit save is allowed while artwork is still running.
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved. Find it in Drafts anytime.").waitFor();
    assert.equal(stored.data.status, "draft");
    releaseGeneration();
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    await openSection("Overview");
    assert.equal(
      await page.getByLabel("About your event").inputValue(),
      "A movie and dinner with friends.",
    );
    await openSection("Where");
    assert.equal(
      await page.getByLabel("Address or meeting link", { exact: true }).inputValue(),
      "456 Lake St, Chicago",
    );
    assert.equal(
      await page.getByRole("button", { name: "Save draft", exact: true }).isEnabled(),
      true,
      "artwork arriving after a draft save is still unsaved progress",
    );
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "RSVP", exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Overview", exact: true }).click();
    await dialog.getByText("A movie and dinner with friends.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await openSection("RSVP");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await openSection("Registry");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    assert.equal(await dialog.getByRole("button", { name: "RSVP", exact: true }).count(), 0);
    assert.equal(await dialog.getByRole("button", { name: "Registry", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await openSection("RSVP");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    assert.equal(await page.getByLabel("Host name", { exact: true }).inputValue(), "Mia");
    await openSection("Registry");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    assert.equal(
      await page.getByLabel("Registry or gift-list link").inputValue(),
      "https://example.com/gifts",
    );
    await page.getByRole("button", { name: "Preview & share", exact: false }).click();
    failSave = true;
    await page.getByRole("button", { name: "Publish & share", exact: true }).click();
    await page.getByText("Test save failed. Please retry.").waitFor();
    assert.equal(stored.data.status, "draft");
    failSave = false;
    await page.getByRole("button", { name: "Publish & share", exact: true }).click();
    await page.getByLabel("Live card share link").waitFor();
    assert.equal(stored.data.description, "A movie and dinner with friends.");
    assert.equal(stored.data.startISO, "2026-10-04T23:00:00.000Z");
    assert.equal(stored.data.additionalLocations[0].label, "Dinner");
    assert.equal(stored.data.studioCard.invitationData.eventDetails.actionVisibility.rsvp, true);
    assert.equal(generations.length, 1, "editing guest details and publishing reuse the artwork");
    await page.screenshot({ path: path.join(out, "desktop-review.png"), fullPage: true });
    await page.reload();
    await page.getByLabel("About your event").waitFor();
    assert.equal(
      await page.getByLabel("About your event").inputValue(),
      "A movie and dinner with friends.",
    );
    assert.equal(
      await page.getByRole("button", { name: "Save changes", exact: true }).isDisabled(),
      true,
      "restoring a saved card starts clean",
    );
    await page.getByLabel("About your event").fill("Updated welcome");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Your live card is updated.", { exact: true }).waitFor();
    assert.equal(stored.data.description, "Updated welcome");
    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "Your design" }).click();
    await page.getByLabel("Event title or name").fill("Updated title");
    await page.getByRole("button", { name: "Preview & share", exact: false }).click();
    assert.equal(
      await page.getByRole("button", { name: "Save changes", exact: true }).last().isDisabled(),
      true,
      "a stale artwork title cannot be published",
    );
    await page.getByRole("button", { name: "Your design" }).click();
    failGeneration = true;
    await page.getByRole("button", { name: "Update design & continue" }).click();
    await page.getByRole("button", { name: "Retry design", exact: true }).waitFor();
    assert.equal(await page.getByLabel("About your event").inputValue(), "Updated welcome");
    failGeneration = false;
    await page.getByRole("button", { name: "Retry design", exact: true }).click();
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 320, height: 740 },
    ]) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const name of ["Overview", "When", "Where", "RSVP", "Registry"]) {
        await openSection(name);
        assert.equal(await page.getByRole("tabpanel").count(), 1);
        const panel = await page.getByRole("tabpanel").boundingBox();
        assert.ok(
          panel.height < 780,
          `${name} remains a compact section at ${viewport.width}px: ${panel.height}`,
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        );
        await page.screenshot({
          path: path.join(out, `tab-${name.toLowerCase()}-${viewport.width}.png`),
          fullPage: true,
        });
      }
      await openSection("Overview");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.screenshot({
        path: path.join(out, `details-${viewport.width}.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      const bounds = await dialog.locator("[data-live-card-artwork]").boundingBox();
      assert.ok(bounds && bounds.width > 100 && bounds.height > 100);
      assert.ok(
        bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= viewport.width + 1 &&
          bounds.y + bounds.height <= viewport.height + 1,
        JSON.stringify(bounds),
      );
      await page.screenshot({ path: path.join(out, `preview-${viewport.width}.png`) });
      await page.getByRole("button", { name: "Close preview", exact: true }).click();
    }
    await page.locator("#leave").click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await page.getByLabel("About your event").inputValue(), "Updated welcome");
    assert.deepEqual(runtimeErrors, []);
    await fs.writeFile(
      path.join(out, "results.json"),
      JSON.stringify(
        {
          generationRequests: generations.length,
          saveRequests: saves.length,
          runtimeErrors,
          verified: [
            "concurrent edits",
            "compact tabs and keyboard navigation",
            "save during generation",
            "explicit drafts",
            "publish",
            "save failure",
            "regeneration failure and retry",
            "toggle visibility",
            "toggle value retention",
            "saved resume",
            "stable share URL",
            "unsaved navigation",
            "mobile and landscape",
          ],
          mocked: [
            "image generation",
            "history storage",
            "calendar provider chooser",
            "Next image and router shell",
          ],
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await page.screenshot({ path: path.join(out, "failure.png"), fullPage: true }).catch(() => {});
    console.error("Browser errors:", runtimeErrors);
    throw error;
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
