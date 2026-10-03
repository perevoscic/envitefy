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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => { window.__opened = []; window.__copied = []; window.__shared = []; window.open = (url) => { window.__opened.push(String(url)); return null; }; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (value) => window.__copied.push(value) } }); Object.defineProperty(navigator, "share", { configurable: true, value: async (value) => window.__shared.push(value) }); });
  const jobs = new Map(); let dispatches = 0, saves = [], stored;
  const raster = async (color) => `data:image/webp;base64,${(await sharp({ create: { width: 100, height: 150, channels: 4, background: color } }).webp({ lossless: true }).toBuffer()).toString("base64")}`;
  const design = { version: 1, quality: "medium", backgroundUrl: await raster("#374268"), font: "classic", ink: "#ffffff", accent: "#ffcc88", surface: "#374268" };
  const composed = await raster("#374269"), layer = await raster({ r: 255, g: 255, b: 255, alpha: 0.2 });
  const uploadAttempts = [];
  await page.route("**/api/**", async (route) => {
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
    throw new Error(`Unexpected API request ${req.url()}`);
  });
  try {
    await page.goto(origin);
    await page.getByLabel("Event type", { exact: true }).selectOption("General event");
    await page.getByLabel("Event title", { exact: true }).fill("Movie Under the Stars");
    assert.equal(await page.getByLabel("Generation quality", { exact: true }).inputValue(), "high");
    await page.getByLabel("Generation quality", { exact: true }).selectOption("medium");
    await page.getByLabel("Opening line (optional)", { exact: true }).fill("You’re invited");
    await page.getByLabel("Describe your design").fill("Navy outdoor cinema with golden lettering");
    await page.getByRole("button", { name: "Generate & continue", exact: true }).click();
    await page.getByLabel("Event title or name").waitFor();
    assert.equal(dispatches, 1);
    await page.getByRole("tab", { name: "When & Where", exact: true }).click();
    await page.getByLabel("Event date", { exact: true }).fill("2026-11-15");
    await page.getByLabel("Start time", { exact: true }).fill("19:00");
    await page.getByLabel("Venue name", { exact: true }).fill("Online Event");
    // Browser recovery must reconnect to this same running job, without a POST.
    await page.waitForTimeout(300); await page.reload();
    await page.getByLabel("Event title or name").waitFor();
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Movie Under the Stars");
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
    assert.equal(await page.getByRole("button", { name: "Review invitation", exact: true }).isEnabled(), true, "the usable selected version remains reviewable during an alternative job");
    const alternateComposite = await raster("#374270");
    const alternateBackground = await raster("#374271");
    const alternate = jobs.get("job-2");
    alternate.design = { ...job.design, quality: "high", backgroundUrl: alternateBackground, headline: { ...job.design.headline, imageUrl: alternateComposite } };
    alternate.state = "ready"; alternate.stage = "ready";
    await page.getByRole("button", { name: "Apply this version", exact: true }).waitFor();
    assert.equal(await page.locator("[data-live-card-artwork] img").first().getAttribute("src"), composed, "higher-quality output cannot silently replace selection");
    await page.waitForTimeout(300); await page.reload();
    await page.getByRole("button", { name: "Apply this version", exact: true }).waitFor();
    assert.equal(dispatches, 2, "alternative recovery does not create another job");
    await page.getByRole("button", { name: "Apply this version", exact: true }).click();
    assert.equal(await page.locator("[data-live-card-artwork] img").first().getAttribute("src"), alternateComposite);
    await page.getByRole("region", { name: "Earlier artwork versions", exact: true }).waitFor();
    await page.getByRole("button", { name: "Review invitation", exact: true }).click();
    await page.getByRole("button", { name: "Publish invitation", exact: true }).waitFor();
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
    assert.equal(saves.filter((value) => value.data.status === "published").length, 1);
    assert.equal(dispatches, 2);
    assert.equal(uploadAttempts.length, 4, "upload retry repeats only the failed asset");
    assert.equal(new Set(uploadAttempts).size, 3, "background, composite and layer each retain their generated pixels");
    await page.getByRole("button", { name: "Copy guest link", exact: true }).click();
    await page.getByRole("button", { name: "Share invitation", exact: true }).click();
    assert.equal(await page.evaluate(() => window.__copied.length), 1);
    assert.equal(await page.evaluate(() => window.__shared.length), 1);
    assert.equal(await page.evaluate(() => window.__copied[0]), await page.evaluate(() => window.__shared[0].url));
    assert.equal(saves.length, 1, "copying and sharing never publish again"); assert.equal(dispatches, 2);
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
    assert.deepEqual(errors, []);
  } catch (error) { console.error((await page.locator("body").innerText()).slice(-5000)); await page.screenshot({ path: path.join(out, "failure.png"), fullPage: true }); throw error; }
  finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
});
