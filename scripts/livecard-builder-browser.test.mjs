import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

test("Live Card / Invite: AI intake, location, explicit saves, dashboard handoff, format switching and responsive preview", {
  timeout: 120000,
}, async () => {
  execSync("bun scripts/build-livecard-builder-fixture.mjs", { timeout: 60000, stdio: "pipe" });
  const out = path.resolve(".qa/livecard-builder");
  const uploads = new Map();
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname.startsWith("/event/")) {
      res.setHeader("Content-Type", "text/html");
      res.end("<!doctype html><html lang='en'><title>Owner dashboard</title><h1>Owner dashboard</h1></html>");
      return;
    }
    if (pathname === "/artwork.webp") {
      if (process.env.LIVECARD_QA_BACKGROUND) {
        res.setHeader("Content-Type", "image/webp");
        res.end(await fs.readFile(process.env.LIVECARD_QA_BACKGROUND));
        return;
      }
      res.setHeader("Content-Type", "image/svg+xml");
      res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500"><rect width="1000" height="1500" fill="#fff4ec"/><path d="M0 0H130V1500H0ZM870 0H1000V1500H870Z" fill="#e9b5c8"/><circle cx="80" cy="90" r="40" fill="#c99750"/><circle cx="920" cy="1410" r="40" fill="#c99750"/></svg>');
      return;
    }
    if (uploads.has(pathname)) {
      res.setHeader("Content-Type", "image/webp");
      res.end(uploads.get(pathname));
      return;
    }
    if (/^\/fonts\/birthday\/[a-z]+\.ttf$/.test(pathname)) {
      res.setHeader("Content-Type", "font/ttf");
      res.end(await fs.readFile(path.join("public", pathname)));
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
  await page.addInitScript(() => {
    window.__cardDraws = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
      window.__cardDraws.push(text);
      return original.call(this, text, ...rest);
    };
  });
  let stored;
  let failSave = false;
  let failGeneration = false;
  let failProofread = false;
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
    if (url.pathname === "/api/livecard-builder/assist") {
      const { form, message, mode } = request.postDataJSON();
      if (mode === "overview") return route.fulfill(failProofread ? { status: 503, json: { error: "Proofreading unavailable" } } : { json: { form: { ...form, overview: form.overview.replace("freinds", "friends") }, questions: [] } });
      assert.match(message, /AMC Grand Boulevard in Miramar Beach/);
      return route.fulfill({ json: { form: {
        ...form, title: "Livia's Movie Night", eventType: "Birthday", design: "Pink movie night with popcorn and stars",
        date: "2026-09-26", startTime: "16:00", timezone: "America/Los_Angeles",
        locations: [{ ...form.locations[0], venue: "AMC Grand Boulevard", address: "", city: "Miramar Beach", query: "AMC Grand Boulevard in Miramar Beach", resolution: "unresolved" }],
      }, questions: [] } });
    }
    if (url.pathname === "/api/livecard-builder/location") {
      const body = request.postDataJSON();
      assert.equal(body.query, "AMC Grand Boulevard in Miramar Beach", "location is read from the original description");
      const place = { placeId: "amc", venue: "AMC Boulevard 10", address: "465 Grand Boulevard, Miramar Beach, FL", city: "Miramar Beach", latitude: 30.3, longitude: -86.3 };
      return route.fulfill({ json: body.placeId ? { location: { ...place, id: body.id, label: "", time: "", note: "", timezone: "America/Chicago", resolution: "verified" } } : { candidates: [place], location: null, message: "Choose the matching venue below." } });
    }
    if (url.pathname === "/api/livecard-builder/design") {
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
      return route.fulfill({ json: { design: { version: 1, backgroundUrl: `${origin}/artwork.webp`, font: "classic", ink: "#542235", accent: "#875226", surface: "#fff4ec" } } });
    }
    if (url.pathname === "/api/upload") {
      const multipart = await new Response(request.postDataBuffer(), { headers: { "content-type": request.headers()["content-type"] } }).formData();
      const file = multipart.get("file");
      assert.ok(file && file.type === "image/webp", "composites are WebP");
      const assetPath = `/composed-${uploads.size}.webp`;
      uploads.set(assetPath, Buffer.from(await file.arrayBuffer()));
      return route.fulfill({ json: { ok: true, stored: { display: { url: `${origin}${assetPath}` } }, eventMedia: { thumbnail: `${origin}${assetPath}` } } });
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
    assert.equal(await page.getByRole("button", { name: "Live Card", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByLabel("Tell us about your event").fill("Livia's birthday at AMC Grand Boulevard in Miramar Beach on September 26, 2026 at 4 PM. Pink movie theme.");
    await page.getByRole("button", { name: "Help me create", exact: true }).click();
    await page.getByRole("region", { name: "Suggested event details" }).waitFor();
    assert.equal(saves.length, 0, "AI suggestions remain in memory");
    await page.getByRole("button", { name: "Use suggestions", exact: true }).click();
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Livia's Movie Night");
    await page.screenshot({ path: path.join(out, "desktop-design.png"), fullPage: true });
    assert.equal(saves.length, 0, "typing never saves a draft");
    await page.getByRole("button", { name: "Create design & continue" }).click();
    await started;
    await page.getByLabel("About your event").fill("A movie and dinner with friends.");
    assert.equal(await page.getByLabel("Event date", { exact: true }).count(), 0);
    await page.getByRole("tab", { name: "Overview", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.getByRole("tab", { name: "When & Where", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await page.getByLabel("Event date", { exact: true }).fill("2026-10-04");
    await page.getByLabel("Start time", { exact: true }).fill("18:00");
    await page.getByRole("button", { name: /AMC Boulevard 10.*465 Grand Boulevard/ }).click();
    assert.equal(await page.getByLabel("Local time zone", { exact: true }).count(), 0, "verified locations need no timezone selector");
    await page.getByText("465 Grand Boulevard, Miramar Beach, FL", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Change location", exact: true }).count(), 1);
    await page.getByRole("button", { name: "Add another location" }).click();
    await page.getByLabel("What happens here?").fill("Dinner");
    await page.getByRole("button", { name: "Enter address manually", exact: true }).click();
    await page.getByLabel("Address or meeting link", { exact: true }).fill("456 Lake St, Chicago");
    assert.equal(
      await page.getByLabel("Address or meeting link", { exact: true }).count(),
      1,
      "only the active location expands",
    );
    await page.getByRole("button", { name: "Confirm location & local time", exact: true }).click();
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
    await openSection("When & Where");
    assert.equal(
      await page.getByText("456 Lake St, Chicago", { exact: true }).last().textContent(),
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
    await openSection("Overview");
    await page.getByLabel("About your event").fill("A movie and dinner with freinds.");
    const savedBeforeProofreading = saves.length;
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("region", { name: "Review Overview wording", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Publish & go to dashboard", exact: true }).isDisabled(), true);
    assert.equal(saves.length, savedBeforeProofreading, "proofreading never saves or publishes");
    await page.getByRole("button", { name: "Use reviewed wording", exact: true }).click();
    assert.equal(await page.getByLabel("Live card share link").count(), 0);
    await page.screenshot({ path: path.join(out, "desktop-review.png"), fullPage: true });
    failSave = true;
    await page.getByRole("button", { name: "Publish & go to dashboard", exact: true }).click();
    await page.getByText("Test save failed. Please retry.").waitFor();
    assert.equal(stored.data.status, "draft");
    failSave = false;
    await page.getByRole("button", { name: "Publish & go to dashboard", exact: true }).click();
    await page.getByRole("heading", { name: "Owner dashboard", exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("tab"), "dashboard");
    assert.equal(stored.data.description, "A movie and dinner with friends.");
    assert.equal(stored.data.startISO, "2026-10-04T23:00:00.000Z");
    assert.equal(stored.data.additionalLocations[0].label, "Dinner");
    assert.equal(stored.data.studioCard.invitationData.eventDetails.actionVisibility.rsvp, true);
    assert.equal(generations.length, 1, "editing guest details and publishing reuse the artwork");
    await page.goto(`${origin}/livacards-invites?edit=${stored.id}`);
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
    await page.getByText("Your invitation is updated.", { exact: true }).waitFor();
    assert.equal(stored.data.description, "Updated welcome");
    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "1 Describe", exact: true }).click();
    await page.getByLabel("Event title or name").fill("Updated title");
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: "Save & go to dashboard", exact: true }).isDisabled(),
      false,
      "editable headlines do not invalidate the background",
    );
    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "1 Describe", exact: true }).click();
    await page.getByLabel("How would you like your card to look?").fill("Pink curtains with gold stars");
    failGeneration = true;
    await page.getByRole("button", { name: "Create updated design & continue" }).click();
    await page.getByRole("button", { name: "Retry design", exact: true }).waitFor();
    assert.equal(await page.getByLabel("About your event").inputValue(), "Updated welcome");
    failGeneration = false;
    await page.getByRole("button", { name: "Retry design", exact: true }).click();
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    // Both formats share one background. Text changes and format switching never generate artwork.
    const generationCount = generations.length;
    await page.getByRole("button", { name: "Invite", exact: true }).click();
    assert.equal(await page.getByLabel("About your event").inputValue(), "Updated welcome");
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    assert.equal(generations.length, generationCount);
    await openSection("When & Where");
    await page.getByLabel("Start time", { exact: true }).fill("19:30");
    await openSection("Overview");
    assert.equal(generations.length, generationCount);
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    for (const name of ["RSVP", "Overview", "Location", "Calendar", "Registry"]) {
      assert.equal(await dialog.getByRole("button", { name, exact: true }).count(), 0, `classic invite has no ${name} action`);
    }
    await page.screenshot({ path: path.join(out, "classic-invite-preview.png") });
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    const downloadEvent = page.waitForEvent("download");
    await page.evaluate(() => { window.__cardDraws = []; });
    await page.getByRole("button", { name: "Download invitation", exact: true }).click();
    const download = await downloadEvent;
    await download.saveAs(path.join(out, "invitation-download.webp"));
    const printedText = await page.evaluate(() => window.__cardDraws.join("\n"));
    assert.match(printedText, /7:30 PM/, "download uses the corrected event time");
    assert.doesNotMatch(printedText, /6:00 PM|4:00 PM/, "download never reuses stale time text");
    assert.equal(generations.length, generationCount, "downloading only composes existing artwork and current text");
    await page.getByRole("button", { name: "Live Card", exact: true }).click();
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 320, height: 740 },
    ]) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const name of ["Overview", "When & Where", "RSVP", "Registry"]) {
        await openSection(name);
        assert.equal(await page.getByRole("tabpanel").count(), 1);
        const panel = await page.getByRole("tabpanel").boundingBox();
        assert.ok(
          panel.height < 1050,
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
      assert.ok(Math.abs(bounds.width / bounds.height - 2 / 3) < 0.01, "shared artwork and text maintain their proportions");
      assert.ok(
        bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= viewport.width + 1 &&
          bounds.y + bounds.height <= viewport.height + 1,
        JSON.stringify(bounds),
      );
      for (const button of await dialog.locator("[data-live-card-trigger]").all()) {
        const buttonBounds = await button.boundingBox();
        assert.ok(buttonBounds.y > bounds.y + bounds.height * 0.5, "buttons stay in the bottom of the card");
        assert.ok(buttonBounds.height >= 44, "buttons have comfortable tap targets");
        assert.ok(buttonBounds.y + buttonBounds.height <= bounds.y + bounds.height + 1, "buttons remain inside the artwork");
      }
      await page.screenshot({ path: path.join(out, `preview-${viewport.width}.png`) });
      await page.getByRole("button", { name: "Close preview", exact: true }).click();
    }
    await page.locator("#leave").click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await page.getByLabel("About your event").inputValue(), "Updated welcome");
    failProofread = true;
    await page.getByLabel("About your event").fill("A movie and dinner with freinds.");
    await page.getByRole("button", { name: "Check grammar & spelling", exact: true }).click();
    await page.getByRole("region", { name: "Review Overview wording", exact: true }).waitFor();
    assert.equal(await page.getByLabel("About your event").inputValue(), "A movie and dinner with freinds.");
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    failProofread = false;
    await page.getByRole("button", { name: "Check grammar & spelling", exact: true }).click();
    await page.getByRole("button", { name: "Use reviewed wording", exact: true }).waitFor();
    await page.getByLabel("About your event").fill("My latest Overview.");
    await page.getByRole("button", { name: "Use reviewed wording", exact: true }).click();
    assert.equal(await page.getByLabel("About your event").inputValue(), "My latest Overview.", "a late suggestion never replaces a newer manual edit");
    assert.deepEqual(runtimeErrors, []);
    await fs.writeFile(
      path.join(out, "results.json"),
      JSON.stringify(
        {
          generationRequests: generations.length,
          saveRequests: saves.length,
          runtimeErrors,
          verified: [
            "Overview proofreading before review and publication",
            "description and venue extraction",
            "review before applying AI suggestions",
            "location address and local timezone carried forward",
            "classic invite has no guest action controls",
            "format switching retains facts and artwork",
            "publish navigates to owner dashboard",
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
