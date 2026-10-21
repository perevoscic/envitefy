import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
const require = createRequire(import.meta.url);
const { resolveLiveCardOverlayActions } = require("./lib/event-messages-test-loader.cjs")("src/lib/live-card-overlay-actions.ts");

test("durable generation reconnects; Review never generates or publishes; published guest actions keep their destinations", { timeout: 120000 }, async () => {
  execSync("bun scripts/build-livecard-builder-fixture.mjs", { timeout: 60000, stdio: "pipe" });
  const out = path.resolve("output/livecard-job-browser"); await fs.mkdir(out, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (["/entry.js", "/entry.css", "/global.css"].includes(pathname)) {
      res.setHeader("Content-Type", pathname.endsWith(".js") ? "text/javascript" : "text/css");
      res.end(await fs.readFile(path.join("output/livecard-builder", pathname.slice(1)))); return;
    }
    if (pathname === "/artwork.svg") { res.setHeader("Content-Type", "image/svg+xml"); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500"><rect width="1000" height="1500" fill="#374268"/><text x="200" y="300" fill="white" font-size="50">Movie Under the Stars</text><text x="200" y="220" fill="white" font-size="30">You’re invited</text></svg>'); return; }
    if (pathname.startsWith("/fonts/")) { res.end(await fs.readFile(path.join("public", pathname))); return; }
    res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html><head><title>Live Card job QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); server.unref();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => { window.__opened = []; window.__copied = []; window.__shared = []; window.open = (url) => { window.__opened.push(String(url)); return null; }; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (value) => window.__copied.push(value) } }); Object.defineProperty(navigator, "share", { configurable: true, value: async (value) => window.__shared.push(value) }); });
  const jobs = new Map(); let dispatches = 0, saves = [], stored;
  const raster = async (color) => `data:image/webp;base64,${(await sharp({ create: { width: 100, height: 150, channels: 4, background: color } }).webp({ lossless: true }).toBuffer()).toString("base64")}`;
  const design = { version: 1, quality: "medium", backgroundUrl: await raster("#374268"), font: "classic", ink: "#ffffff", accent: "#ffcc88", surface: "#374268" };
  const composed = await raster("#374269"), layer = await raster({ r: 255, g: 255, b: 255, alpha: 0.2 });
  const uploadAttempts = [];
  const waitForDetails = async (target) => {
    const detailsStep = target.getByRole("button", { name: "2 Event details", exact: true });
    await detailsStep.waitFor();
    if (await detailsStep.getAttribute("aria-current") !== "step") await detailsStep.click();
    await target.getByRole("button", { name: "Edit card text", exact: true }).waitFor();
    assert.equal(await target.getByRole("region", { name: "Words on your card", exact: true }).count(), 0, "the repeated wording summary is not mounted");
  };
  const readCardWords = async (target) => {
    await target.getByRole("button", { name: "Edit card text", exact: true }).click();
    const dialog = target.getByRole("dialog", { name: "Edit card text", exact: true });
    const words = {
      title: await dialog.getByLabel("Event title", { exact: true }).inputValue(),
      intro: await dialog.getByLabel("Opening line (optional)", { exact: true }).inputValue(),
    };
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    return words;
  };
  const assertCardToolbarGeometry = async (surface, artwork, context, expanded = false) => {
    const card = await artwork.boundingBox();
    assert.ok(card, `${context}: artwork is rendered`);
    assert.equal(await surface.getByRole("button", { name: "Copy guest link", exact: true }).count(), 0, `${context}: Share owns link access without a separate Copy icon`);
    const buttons = ["Share Live Card", "Download invitation", ...(expanded ? ["Close preview"] : ["Preview Live Card", "Close editor", "Close review"])];
    const bounds = [];
    for (const name of buttons) {
      const button = surface.getByRole("button", { name, exact: true });
      if (["Download invitation", "Close editor", "Close review"].includes(name) && await button.count() === 0) continue;
      assert.equal(await button.count(), 1, `${context}: ${name} has one icon control`);
      const box = await button.boundingBox();
      assert.ok(box && box.width >= 44 && box.height >= 44, `${context}: ${name} retains a usable target`);
      assert.ok(box.x >= card.x - 1 && box.y >= card.y - 1 && box.x + box.width <= card.x + card.width + 1 && box.y + box.height <= card.y + card.height + 1, `${context}: ${name} stays within the artwork: ${JSON.stringify({ box, card })}`);
      for (const previous of bounds) {
        const overlap = Math.min(box.x + box.width, previous.box.x + previous.box.width) - Math.max(box.x, previous.box.x) > 1 && Math.min(box.y + box.height, previous.box.y + previous.box.height) - Math.max(box.y, previous.box.y) > 1;
        assert.equal(overlap, false, `${context}: ${name} does not overlap ${previous.name}`);
      }
      bounds.push({ name, box });
    }
  };
  const assertNoLetteringDiagnostics = async (target, context) => {
    assert.equal(await target.getByRole("region", { name: "Lettering findings", exact: true }).count(), 0, `${context}: lettering findings are not mounted`);
    for (const name of ["Retry verification", "Repair lettering"]) {
      assert.equal(await target.getByRole("button", { name, exact: true }).count(), 0, `${context}: ${name} is not offered`);
    }
    assert.doesNotMatch(await target.locator("body").innerText(), /Lettering concern:|Expected title:|Expected opening line:|Observed wording:|Verification unavailable \(|The provider refused lettering verification\./, `${context}: checker diagnostics are not shown`);
  };
  const assertNoLetteringDiagnosticsAcrossSurfaces = async (target, context) => {
    for (const stepName of ["1 Your card", "2 Event details", "3 Review"]) {
      await target.getByRole("button", { name: stepName, exact: true }).click();
      await target.waitForFunction((name) => [...document.querySelectorAll('nav[aria-label="Card creation steps"] button')].some((button) => button.textContent?.replace(/\s+/g, "") === name.replace(/\s+/g, "") && button.getAttribute("aria-current") === "step" && !button.disabled), stepName);
      await assertNoLetteringDiagnostics(target, `${context}, ${stepName}`);
      if (stepName === "3 Review") {
        for (const name of ["Edit your card", "Edit card text", "Edit event details"]) {
          assert.equal(await target.getByRole("button", { name, exact: true }).count(), 0, `${context}: Review omits ${name}`);
        }
        assert.equal(await target.getByText(/Review your Live Card, then publish/).count(), 0, `${context}: Review omits publishing instructions`);
        assert.equal(await target.getByRole("button", { name: "Back to edit", exact: true }).isVisible(), true, `${context}: Review offers one clear route back to editing`);
      }
      await target.getByRole("button", { name: "Preview Live Card", exact: true }).click();
      await target.getByRole("button", { name: "Close preview", exact: true }).waitFor();
      await assertNoLetteringDiagnostics(target, `${context}, ${stepName} full-screen preview`);
      const dialog = target.getByRole("dialog", { name: "Preview your Live Card", exact: true });
      await assertCardToolbarGeometry(dialog, dialog.locator("[data-live-card-artwork]"), `${context}, ${stepName} full-screen preview`, true);
      await target.getByRole("button", { name: "Close preview", exact: true }).click();
    }
    await target.reload();
    await waitForDetails(target);
    await assertNoLetteringDiagnostics(target, `${context}, reload`);
  };
  const assertPersistentDesktopArtwork = async (stepName, viewport) => {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: stepName, exact: true }).click();
    await page.waitForFunction((name) => [...document.querySelectorAll('nav[aria-label="Card creation steps"] button')].some((button) => button.textContent?.replace(/\s+/g, "") === name.replace(/\s+/g, "") && button.getAttribute("aria-current") === "step" && !button.disabled), stepName);
    assert.equal(await page.getByRole("button", { name: stepName, exact: true }).getAttribute("aria-current"), "step");
    await assertNoLetteringDiagnostics(page, `${stepName} desktop preview`);
    await page.evaluate(() => {
      for (let node = document.querySelector("form"); node; node = node.parentElement) node.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    const preview = page.getByRole("complementary", { name: "Artwork preview", exact: true });
    const artwork = preview.locator("[data-live-card-artwork]");
    assert.equal(await artwork.count(), 1, `${stepName}: one inline Live Card is mounted`);
    const editor = page.locator("form").locator("..");
    const context = `${stepName} at ${viewport.width}x${viewport.height}`;
    const waitForSettledGeometry = async (phase) => {
      const result = await preview.evaluate((pane) => new Promise((resolve) => {
        const samples = [];
        let previous = "", unchanged = 0, frames = 0, finished = false;
        let deadline;
        const finish = (stable) => {
          if (finished) return;
          finished = true;
          clearTimeout(deadline);
          resolve({ stable, samples: samples.slice(stable ? -4 : -8) });
        };
        const measure = () => {
          if (finished) return;
          const boxes = [pane.querySelector("[data-live-card-artwork]"), pane.querySelector('[role="group"][aria-label="Save and publish"]')].map((node) => {
            const box = node?.getBoundingClientRect();
            return box ? [box.x, box.y, box.width, box.height].map((value) => Math.round(value * 100) / 100) : null;
          });
          const sample = JSON.stringify(boxes);
          samples.push(boxes);
          unchanged = sample === previous ? unchanged + 1 : 0;
          if (unchanged >= 3) return finish(true);
          previous = sample;
          if (++frames >= 60) return finish(false);
          requestAnimationFrame(measure);
        };
        deadline = setTimeout(() => finish(false), 2000);
        requestAnimationFrame(measure);
      }));
      assert.equal(result.stable, true, `${context}, ${phase}: artwork and actions settle within 60 animation frames and two seconds: ${JSON.stringify(result.samples)}`);
    };
    const assertGeometry = async (phase) => {
      const [card, form] = await Promise.all([artwork.boundingBox(), editor.boundingBox()]);
      assert.ok(card && form, `${context}, ${phase}: card and editor are rendered`);
      assert.ok(card.width >= 180 && card.height >= 270, `${context}, ${phase}: portrait artwork retains a readable desktop size: ${JSON.stringify(card)}`);
      assert.ok(card.x >= form.x + form.width - 1, `${context}, ${phase}: artwork stays to the right of the editor: ${JSON.stringify({ card, form })}`);
      assert.ok(card.x >= 0 && card.y >= -1 && card.x + card.width <= viewport.width + 1 && card.y + card.height <= viewport.height + 1, `${context}, ${phase}: the entire artwork stays in the viewport: ${JSON.stringify(card)}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${context}, ${phase}: no horizontal overflow`);
      await assertCardToolbarGeometry(preview, artwork, `${context}, ${phase}`);
      const actions = preview.getByRole("group", { name: "Save and publish", exact: true });
      const actionBounds = await actions.boundingBox();
      assert.ok(actionBounds && actionBounds.y >= card.y + card.height - 1, `${context}, ${phase}: save actions stay below the artwork`);
      assert.ok(actionBounds.x >= card.x - 1 && actionBounds.x + actionBounds.width <= card.x + card.width + 1, `${context}, ${phase}: save actions stay within the artwork width: ${JSON.stringify({ card, actionBounds })}`);
      for (const button of await actions.getByRole("button").all()) {
        const bounds = await button.boundingBox();
        assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44, `${context}, ${phase}: card action keeps its usable target`);
        assert.equal(await button.evaluate((node) => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1), true, `${context}, ${phase}: ${await button.innerText()} fits its action button`);
      }
      return card;
    };
    await waitForSettledGeometry("before scrolling");
    const initial = await assertGeometry("before scrolling");
    const scrollPositions = await page.evaluate(() => {
      const positions = [window.scrollY];
      for (let node = document.querySelector("form"); node; node = node.parentElement) positions.push(node.scrollTop);
      return positions;
    });
    const form = await editor.boundingBox();
    await page.mouse.move(form.x + form.width / 2, Math.min(viewport.height - 60, Math.max(60, form.y + 100)));
    await page.mouse.wheel(0, 600);
    await page.waitForFunction((before) => {
      const positions = [window.scrollY];
      for (let node = document.querySelector("form"); node; node = node.parentElement) positions.push(node.scrollTop);
      return positions.some((position, index) => position > before[index] + 1);
    }, scrollPositions);
    await waitForSettledGeometry("after scrolling over the editor");
    const scrolled = await assertGeometry("after scrolling over the editor");
    assert.ok(Math.abs(scrolled.x - initial.x) <= 1, `${context}: scrolling does not move the card horizontally: ${JSON.stringify({ initial, scrolled })}`);
    assert.ok(scrolled.y <= initial.y + 1, `${context}: scrolling keeps the card pinned rather than moving it down`);
    await page.mouse.wheel(0, 1800);
    await waitForSettledGeometry("at the end of the form");
    await assertGeometry("at the end of the form");
    await page.screenshot({ path: path.join(out, `desktop-${stepName.slice(2).toLowerCase().replaceAll(" ", "-")}-${viewport.width}x${viewport.height}.png`) });
  };
  const routeApi = async (route) => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname === "/api/upload") {
      const multipart = await new Response(req.postDataBuffer(), { headers: { "content-type": req.headers()["content-type"] } }).formData();
      const bytes = Buffer.from(await multipart.get("file").arrayBuffer());
      uploadAttempts.push(bytes.toString("base64"));
      if (uploadAttempts.length === 2) return route.fulfill({ status: 503, json: { error: "Controlled upload failure" } });
      return route.fulfill({ json: { ok: true, stored: { display: { url: `${origin}/artwork.svg?asset=${uploadAttempts.length}` } }, eventMedia: { thumbnail: `${origin}/artwork.svg?asset=${uploadAttempts.length}` } } });
    }
    if (url.pathname.endsWith("/jobs")) {
      if (req.method() === "POST") {
        const input = req.postDataJSON(); dispatches++;
        const job = { id: `job-${dispatches}`, mode: input.mode, stage: "background_generating", state: "running", form: input.form, created_at: new Date().toISOString(), design: input.design || null };
        jobs.set(job.id, job); return route.fulfill({ json: { job } });
      }
      return route.fulfill({ json: { job: jobs.get(url.searchParams.get("id")) } });
    }
    if (url.pathname.endsWith("/assist")) return route.fulfill({ status: 503, json: { error: "Controlled checker outage" } });
    if (url.pathname.endsWith("/location")) {
      const input = req.postDataJSON();
      return route.fulfill({ json: { location: { ...input, venue: "Online Event", address: "https://example.com/meeting?token=qa", timezone: "America/Chicago", resolution: "online" } } });
    }
    if (url.pathname.startsWith("/api/history")) {
      if (req.method() === "GET") return route.fulfill({ json: stored });
      const body = req.postDataJSON(); saves.push(body); stored = { ...body, id: "private-qa", public_slug: "private-qa" }; return route.fulfill({ status: 201, json: stored });
    }
    if (/^\/api\/events\/[^/]+\/collaborators$/.test(url.pathname)) {
      assert.equal(req.method(), "GET");
      return route.fulfill({ json: { people: [] } });
    }
    throw new Error(`Unexpected API request ${req.url()}`);
  };
  await page.route("**/api/**", routeApi);
  try {
    await page.goto(origin);
    assert.equal(await page.getByRole("button", { name: /^(Invite co-host|Manage access)$/ }).count(), 0, "a new card does not offer co-host invitations before publication");
    assert.equal(await page.getByRole("button", { name: "1 Your card", exact: true }).getAttribute("aria-current"), "step");
    assert.equal(await page.getByLabel("Occasion (optional)", { exact: true }).inputValue(), "General event");
    assert.equal(await page.getByLabel("Occasion (optional)", { exact: true }).getAttribute("required"), null, "occasion is optional before generation");
    assert.equal(await page.getByLabel("Opening line (optional)", { exact: true }).isVisible(), false, "new opening lines start collapsed and blank");
    await page.getByLabel("Event title", { exact: true }).fill("Movie Under the Stars");
    assert.equal(await page.getByText("Generation options", { exact: true }).count(), 0);
    assert.equal(await page.getByLabel("Generation quality", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Add an opening line (optional)", exact: true }).click();
    assert.equal(await page.getByLabel("Opening line (optional)", { exact: true }).inputValue(), "");
    await page.getByLabel("Opening line (optional)", { exact: true }).fill("You’re invited");
    await page.getByLabel("Describe the look").fill("Navy outdoor cinema with golden lettering");
    await page.getByRole("button", { name: "Generate & continue", exact: true }).click();
    await waitForDetails(page);
    assert.equal(await page.getByLabel("Event title", { exact: true }).count(), 0, "Details does not duplicate the title field");
    assert.equal(await page.getByLabel("Opening line (optional)", { exact: true }).count(), 0);
    assert.deepEqual(await readCardWords(page), { title: "Movie Under the Stars", intro: "You’re invited" }, "the focused wording editor retains the canonical words without a repeated summary");
    assert.equal(await page.getByRole("tab", { name: "When & Where", exact: true }).getAttribute("aria-selected"), "true");
    assert.equal(jobs.get("job-1").form.eventType, "General event", "an unspecified occasion stays general without automatic inference");
    assert.equal(jobs.get("job-1").form.generationQuality, "high", "new cards use high quality without a generation-options control");
    assert.equal(dispatches, 1);
    await page.getByRole("tab", { name: "When & Where", exact: true }).click();
    await page.getByLabel("Event date", { exact: true }).fill("2026-11-15");
    await page.getByLabel("Start time", { exact: true }).fill("19:00");
    await page.getByLabel("Venue name", { exact: true }).fill("Online Event");
    // Browser recovery must reconnect to this same running job, without a POST.
    await page.waitForTimeout(300); await page.reload();
    await waitForDetails(page);
    assert.deepEqual(await readCardWords(page), { title: "Movie Under the Stars", intro: "You’re invited" }, "browser recovery retains the canonical words");
    assert.equal(dispatches, 1);
    const slowJob = jobs.get("job-1"); slowJob.elapsed_ms = 240001;
    await page.getByText(/This stage has taken over four minutes/).waitFor();
    await page.getByRole("button", { name: "Reconnect to artwork", exact: true }).click();
    assert.equal(dispatches, 1, "four-minute recovery reconnects without new generation");
    const job = jobs.get("job-1"); job.state = "ready"; job.stage = "ready";
    job.design = { ...design, headline: { imageUrl: composed, layerUrl: layer, layout: { left: 12, top: 27, width: 40, height: 40, canvasWidth: 100, canvasHeight: 150 }, title: job.form.title, intro: job.form.headlineIntro, validation: { status: "passed", issues: [] } } };
    await page.getByRole("tab", { name: "When & Where", exact: true }).click();
    assert.equal(await page.getByLabel("Event date", { exact: true }).inputValue(), "2026-11-15");
    await page.getByRole("tab", { name: "RSVP", exact: true }).click();
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await page.getByLabel("Host phone", { exact: true }).fill("3125550100");
    await page.getByLabel("Host name", { exact: true }).fill("QA Host");
    await page.getByRole("tab", { name: "Registry", exact: true }).click();
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByLabel("Registry or gift-list link").fill("https://example.com/gifts?list=qa");
    await page.getByLabel(/Gift message|Gift note|Message about gifts/).fill("Your presence is our present.");
    await page.getByRole("button", { name: "Generate higher-quality alternative", exact: true }).click();
    assert.equal(dispatches, 2); assert.equal(jobs.get("job-2").mode, "background");
    assert.equal(jobs.get("job-2").form.generationQuality, "high");
    await page.getByRole("button", { name: "Review invitation", exact: true }).waitFor({ state: "visible" });
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent?.trim() === "Review invitation" && !button.disabled));
    assert.equal(await page.getByRole("button", { name: "Review invitation", exact: true }).isEnabled(), true, "the usable selected version remains reviewable during an alternative job");
    const alternateComposite = await raster("#374270");
    const alternateBackground = await raster("#374271");
    const alternate = jobs.get("job-2");
    alternate.design = { ...job.design, quality: "high", backgroundUrl: alternateBackground, headline: { ...job.design.headline, imageUrl: alternateComposite, validation: {
      status: "failed", issues: ["missing_copy"],
      findings: Array.from({ length: 5 }, (_, index) => ({
        field: "title", region: `Upper-center lettering, detail ${index + 1}`, concernType: "missing_copy",
        explanation: "The checker reports an advisory concern about the decorative lettering treatment while retaining this usable image. ".repeat(3),
        expectedWording: "Movie Under the Stars", observedWording: "Movie Under the Stars",
      })),
      repairInstructions: ["Optional repair may adjust lettering while preserving the existing background. ".repeat(4)],
    } } };
    alternate.state = "ready"; alternate.stage = "ready";
    await page.getByRole("button", { name: "Apply this version", exact: true }).waitFor();
    assert.equal(await page.locator("[data-live-card-artwork] img").first().getAttribute("src"), composed, "higher-quality output cannot silently replace selection");
    await page.waitForTimeout(300); await page.reload();
    await page.getByRole("button", { name: "Apply this version", exact: true }).waitFor();
    assert.equal(dispatches, 2, "alternative recovery does not create another job");
    await page.getByRole("button", { name: "Apply this version", exact: true }).click();
    assert.equal(await page.locator("[data-live-card-artwork] img").first().getAttribute("src"), alternateComposite);
    await page.getByRole("region", { name: "Earlier artwork versions", exact: true }).waitFor();
    await assertNoLetteringDiagnosticsAcrossSurfaces(page, "retained non-safety findings");
    // Retained checker data never becomes an editor panel or displaces the
    // persistent desktop card in any step.
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1100, height: 700 }]) {
      for (const stepName of ["1 Your card", "2 Event details", "3 Review"]) {
        await assertPersistentDesktopArtwork(stepName, viewport);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await page.getByRole("button", { name: "Review invitation", exact: true }).click();
    await page.getByRole("button", { name: "Publish invitation", exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to edit", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "2 Event details", exact: true }).getAttribute("aria-current"), "step", "Back to edit opens Event details without generating or saving");
    await waitForDetails(page);
    assert.equal(dispatches, 2); assert.equal(saves.length, 0);
    await page.getByRole("button", { name: "Review invitation", exact: true }).click();
    await page.getByRole("button", { name: "Publish invitation", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: /^(Invite co-host|Manage access)$/ }).count(), 0, "Review keeps co-host invitations in the published owner workspace");
    assert.equal(await page.getByRole("complementary", { name: "Artwork preview", exact: true }).getByRole("button", { name: "Download invitation", exact: true }).count(), 1, "prepared Review offers one download icon on the card");
    assert.equal(dispatches, 2); assert.equal(saves.length, 0);
    assert.equal(await page.getByText("Share a link", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Registry", exact: true }).click();
    await page.getByText("Your presence is our present.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Visit Registry", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__opened.at(-1)), "https://example.com/gifts?list=qa");
    await page.getByRole("button", { name: "Close card details", exact: true }).click();
    await page.getByRole("button", { name: "Publish invitation", exact: true }).click();
    await page.getByText("Controlled upload failure", { exact: false }).waitFor();
    assert.equal(dispatches, 2); assert.equal(saves.length, 0);
    await page.getByRole("button", { name: "Publish invitation", exact: true }).click();
    await page.getByText("Your Live Card is published. It's ready to share.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: /^(Invite co-host|Manage access)$/ }).count(), 0, "published cards keep co-host access in the owner workspace rather than the builder");
    assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).isDisabled(), true, "a clean published card has one disabled Save changes action until the host edits it");
    assert.equal(await page.getByRole("status").filter({ hasText: "No changes to save." }).isVisible(), true, "a clean published card explains why Save changes is disabled");
    assert.equal(saves.filter((value) => value.data.status === "published").length, 1);
    assert.equal(stored.data.studioCard.invitationData.sharedDesign.headline.validation.status, "failed", "non-safety checker concerns remain advisory when the host publishes");
    assert.deepEqual(stored.data.studioCard.invitationData.sharedDesign.headline.validation.issues, ["missing_copy"]);
    assert.equal(dispatches, 2);
    assert.equal(uploadAttempts.length, 4, "upload retry repeats only the failed asset");
    assert.equal(new Set(uploadAttempts).size, 3, "background, composite and layer each retain their generated pixels");
    assert.equal(await page.getByRole("button", { name: "Copy guest link", exact: true }).count(), 0, "published cards do not repeat link access beside Share");
    await page.getByRole("button", { name: "Share Live Card", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__copied.length), 0, "native Share does not also copy the link");
    assert.equal(await page.evaluate(() => window.__shared.length), 1);
    const sharedUrl = await page.evaluate(() => window.__shared[0].url);
    assert.equal(new URL(sharedUrl).origin, "https://envitefy.com");
    assert.equal(new URL(sharedUrl).pathname, "/card/private-qa", "Share uses the saved public card address");
    await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
    await page.getByRole("button", { name: "Share Live Card", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__copied.length), 1, "Share still copies the link when native sharing is unavailable");
    assert.equal(await page.evaluate(() => window.__copied[0]), await page.evaluate(() => window.__shared[0].url));
    assert.equal(saves.length, 1, "native Share and its copy fallback never publish again"); assert.equal(dispatches, 2);
    // Actual public guest component, with the exact stored published invitation metadata.
    const invitationData = stored.data.studioCard.invitationData;
    const labels = { rsvp: "RSVP", details: "Overview", location: "Location", calendar: "To Calendar", registry: "Registry", logo: "Logo" };
    for (const kind of ["online", "physical", "hybrid"]) {
      const guest = await browser.newPage(); guest.on("pageerror", (error) => errors.push(error.message));
      const details = { ...invitationData.eventDetails, rsvpEnabled: true, rsvpContact: "host@example.com", rsvpName: "QA Host", venueName: kind === "online" ? "Online Event" : "Lake Cinema", location: kind === "online" ? "https://example.com/meeting?token=qa" : "123 Lake Street, Chicago, IL", additionalLocations: kind === "hybrid" ? [{ venue: "Online Event", location: "https://example.com/meeting?token=qa" }] : [] };
      const published = { eventId: "private-qa", title: stored.title, imageUrl: design.backgroundUrl, invitationData: { ...invitationData, eventDetails: details }, shareUrl: `${origin}/card/private-qa` };
      await guest.addInitScript((value) => { window.__publishedCard = value; window.__opened = []; window.open = (url) => { window.__opened.push(String(url)); return null; }; }, published);
      await guest.goto(`${origin}/card/private-qa`);
      const actions = resolveLiveCardOverlayActions({ rsvpEnabled: true, hasLocation: true, hasRegistry: true });
      for (const action of actions) {
        await guest.getByRole("button", { name: labels[action], exact: true }).click();
        if (action === "registry") {
          await guest.getByText("Your presence is our present.", { exact: true }).waitFor();
          await guest.getByRole("button", { name: "Visit Registry", exact: true }).click();
          assert.equal(await guest.evaluate(() => window.__opened.at(-1)), "https://example.com/gifts?list=qa");
        } else if (action === "location") {
          if (kind !== "physical") assert.equal(await guest.getByRole("link", { name: "Join Online Event", exact: true }).getAttribute("href"), "https://example.com/meeting?token=qa");
          const links = await guest.getByRole("link").evaluateAll((nodes) => nodes.map((node) => node.href));
          if (kind === "online") assert.ok(!links.some((href) => /maps|directions/.test(href)));
          else {
            await guest.getByRole("button", { name: /Get directions to/ }).first().click();
            const href = await guest.evaluate(() => window.__opened.at(-1));
            assert.ok(/maps/.test(href)); assert.ok(decodeURIComponent(href.replace(/\+/g, " ")).includes("123 Lake Street"));
          }
        } else if (action === "calendar") {
          await guest.getByRole("button", { name: "Open in Google Calendar", exact: true }).click();
          const calendarHref = await guest.evaluate(() => window.__opened.at(-1));
          assert.ok(calendarHref.includes("calendar.google.com"));
          assert.ok(decodeURIComponent(calendarHref).includes("Movie Under the Stars"));
          continue;
        } else if (action === "rsvp") await guest.getByText("QA Host", { exact: true }).waitFor();
        else if (action === "details") await guest.getByText("Movie Under the Stars", { exact: true }).first().waitFor();
        await guest.getByRole("button", { name: "Close card details", exact: true }).click();
      }
      await guest.screenshot({ path: path.join(out, `published-${kind}.png`) }); await guest.close();
    }
    const unavailable = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    unavailable.on("pageerror", (error) => errors.push(error.message));
    const unavailableStored = structuredClone(stored);
    unavailableStored.data.studioCard.invitationData.sharedDesign.headline.validation = {
      status: "unavailable", issues: [], unavailableReason: "checker_error",
      visibleText: ["Stored checker-only observed wording"],
      repairInstructions: ["Stored checker-only repair instructions"],
    };
    await unavailable.route("**/api/**", async (route) => {
      if (new URL(route.request().url()).pathname.startsWith("/api/history") && route.request().method() === "GET") {
        return route.fulfill({ json: unavailableStored });
      }
      return routeApi(route);
    });
    const beforeUnavailable = dispatches;
    await unavailable.goto(`${origin}/?edit=private-qa`);
    await waitForDetails(unavailable);
    await assertNoLetteringDiagnosticsAcrossSurfaces(unavailable, "saved unavailable lettering verification");
    assert.equal(await unavailable.getByText("Stored checker-only observed wording", { exact: false }).count(), 0);
    assert.equal(await unavailable.getByText("Stored checker-only repair instructions", { exact: false }).count(), 0);
    assert.equal(dispatches, beforeUnavailable, "unavailable verification never triggers generation or another check on navigation, preview or reload");
    await unavailable.close();
    const verified = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    verified.on("pageerror", (error) => errors.push(error.message));
    await verified.route("**/api/**", routeApi);
    await verified.goto(`${origin}/?edit=private-qa`);
    await waitForDetails(verified);
    assert.equal(await verified.getByRole("status").filter({ hasText: "No changes to save." }).isVisible(), true, "the disabled-Save changes explanation survives reopening a published card");
    await assertNoLetteringDiagnostics(verified, "reopened published advisory validation");
    const beforeVerification = dispatches;
    const beforeVerificationSaves = saves.length;
    const verificationId = "legacy-pending-verification";
    const verification = {
      id: verificationId, mode: "verify", state: "running", stage: "checking",
      form: structuredClone(stored.data.liveCardBuilder.form), created_at: new Date().toISOString(),
      design: structuredClone(stored.data.studioCard.invitationData.sharedDesign),
    };
    jobs.set(verificationId, verification);
    // Recovery can contain the same selected image in an earlier version and
    // in an unapplied alternative, plus verification requested by an older UI.
    // Reconnect that existing job without retaining a diagnostic retry button.
    await verified.waitForFunction(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("envitefy-template-drafts", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const draft = await new Promise((resolve, reject) => {
        const request = db.transaction("drafts", "readonly").objectStore("drafts").get(sessionStorage.getItem("envitefy:live-card-recovery:private-qa"));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return Boolean(draft?.snapshot?.artwork);
    });
    await verified.evaluate(async (jobId) => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("envitefy-template-drafts", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise((resolve, reject) => {
        const tx = db.transaction("drafts", "readwrite");
        const store = tx.objectStore("drafts");
        const request = store.get(sessionStorage.getItem("envitefy:live-card-recovery:private-qa"));
        request.onsuccess = () => {
          const draft = request.result;
          draft.snapshot.versions = [structuredClone(draft.snapshot.artwork)];
          draft.snapshot.alternative = structuredClone(draft.snapshot.artwork);
          draft.snapshot.jobId = jobId;
          store.put(draft);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => reject(tx.error);
      });
      db.close();
    }, verificationId);
    await verified.reload();
    await verified.getByRole("button", { name: "Apply this version", exact: true }).waitFor();
    await verified.getByRole("button", { name: "Cancel generation", exact: true }).waitFor();
    assert.equal(dispatches, beforeVerification, "recovery reconnects the pending verification without requesting generation or another check");
    await assertNoLetteringDiagnostics(verified, "reconnected legacy verification");
    assert.equal(verification.mode, "verify");
    assert.equal(verification.design.headline.imageUrl, stored.data.studioCard.invitationData.sharedDesign.headline.imageUrl);
    verification.state = "failed";
    verification.stage = "checking";
    verification.error_code = "safety_refused";
    verification.error = "Controlled same-image safety rejection";
    await verified.getByText("Controlled same-image safety rejection", { exact: true }).waitFor();
    await verified.getByRole("button", { name: "Save changes", exact: true }).click();
    await verified.getByText("This artwork contains blocked content. Change the design instructions before generating again.", { exact: true }).waitFor();
    assert.equal(saves.length, beforeVerificationSaves, "same-image safety rejection prevents publication of retained artwork");
    await verified.reload();
    await waitForDetails(verified);
    await assertNoLetteringDiagnostics(verified, "recovered blocked lettering validation");
    await verified.getByRole("button", { name: "Save changes", exact: true }).click();
    await verified.getByText("This artwork contains blocked content. Change the design instructions before generating again.", { exact: true }).waitFor();
    assert.equal(saves.length, beforeVerificationSaves, "recovery retains the same-image safety rejection");
    await verified.getByRole("button", { name: "Apply this version", exact: true }).click();
    await verified.getByRole("button", { name: "Save changes", exact: true }).click();
    await verified.getByText("This artwork contains blocked content. Change the design instructions before generating again.", { exact: true }).waitFor();
    assert.equal(saves.length, beforeVerificationSaves, "an alternative copy cannot restore validation from before the safety finding");
    await verified.getByRole("button", { name: "Preview earlier version 1", exact: true }).click();
    await verified.getByRole("button", { name: "Apply this version", exact: true }).click();
    await verified.getByRole("button", { name: "Save changes", exact: true }).click();
    await verified.getByText("This artwork contains blocked content. Change the design instructions before generating again.", { exact: true }).waitFor();
    assert.equal(saves.length, beforeVerificationSaves, "an earlier-version copy cannot restore validation from before the safety finding");
    assert.equal(dispatches, beforeVerification, "reload never starts image generation or repeats verification");
    await verified.screenshot({ path: path.join(out, "verified-safety-recovery.png"), fullPage: true });
    await verified.close();
    const failed = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    failed.on("pageerror", (error) => errors.push(error.message));
    await failed.route("**/api/**", routeApi);
    await failed.goto(origin);
    await failed.getByLabel("Event title", { exact: true }).fill("Lanterns of Kindness");
    await failed.getByLabel("Describe the look").fill("Warm lanterns in a peaceful garden");
    await failed.getByRole("button", { name: "Generate & continue", exact: true }).click();
    await waitForDetails(failed);
    await failed.getByLabel("Event date", { exact: true }).fill("2026-10-26");
    const failedJob = jobs.get(`job-${dispatches}`);
    failedJob.stage = "background_checking";
    failedJob.state = "failed";
    failedJob.error = "Controlled background failure";
    await failed.getByText("Controlled background failure", { exact: true }).waitFor();
    assert.equal(await failed.getByRole("region", { name: "Artwork job status", exact: true }).count(), 0, "a failed background check no longer claims to be checking");
    assert.equal(await failed.getByRole("button", { name: "Cancel generation", exact: true }).count(), 0);
    assert.equal(await failed.getByRole("button", { name: "Reconnect to artwork", exact: true }).count(), 0);
    assert.equal(await failed.getByLabel("Event date", { exact: true }).inputValue(), "2026-10-26");
    await failed.screenshot({ path: path.join(out, "terminal-failure.png"), fullPage: true });
    const previousDispatches = dispatches;
    await failed.getByRole("button", { name: "Retry design", exact: true }).click();
    await failed.getByRole("button", { name: "Cancel generation", exact: true }).waitFor();
    assert.equal(dispatches, previousDispatches + 1, "an explicit retry starts a new job after terminal failure");
    const blocked = jobs.get(`job-${dispatches}`);
    blocked.stage = "ready";
    blocked.state = "ready";
    blocked.design = { ...design, headline: { ...job.design.headline, title: blocked.form.title, intro: blocked.form.headlineIntro, validation: { status: "failed", issues: ["safety_mismatch"] } } };
    await failed.getByText("This artwork contains blocked content. Change the design instructions before generating again.", { exact: true }).waitFor();
    assert.equal(await failed.locator("[data-live-card-artwork] img").count(), 0, "legacy ready jobs containing a safety finding never apply their image");
    assert.equal(await failed.getByRole("region", { name: "Artwork job status", exact: true }).count(), 0);
    assert.equal(await failed.getByRole("button", { name: "Retry design", exact: true }).count(), 0);
    assert.equal(await failed.getByLabel("Event date", { exact: true }).inputValue(), "2026-10-26");
    await failed.screenshot({ path: path.join(out, "safety-block.png"), fullPage: true });
    await failed.close();
    assert.deepEqual(errors, []);
  } catch (error) { console.error((await page.locator("body").innerText()).slice(-5000)); await page.screenshot({ path: path.join(out, "failure.png"), fullPage: true }); throw error; }
  finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
});
