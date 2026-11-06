import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import buildBunFixture from "./lib/build-bun-fixture.cjs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
const load = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");

test("main info precedes generation, guest edits survive it, and title-only artwork persists on phone/desktop", { timeout: 90000 }, async () => {
  buildBunFixture("scripts/build-livecard-builder-fixture.mjs");
  const bg = await sharp({ create: { width: 1000, height: 1500, channels: 3, background: "#243933" } }).webp().toBuffer();
  const material = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#ac7d22" } }).webp().toBuffer();
  const direction = { version: 1, titleFont: "classic", introFont: "cormorant", direction: "Warm candlelit botanical elegance", artworkDirection: "Quiet dark green garden", texturePrompt: "Softly brushed warm brass", preferredTop: 180, ornament: false, includeEventDetails: true, textureUrl: `data:image/webp;base64,${material.toString("base64")}` };
  const design = { version: 1, backgroundUrl: `data:image/webp;base64,${bg.toString("base64")}`, typography: "editorial", font: "classic", ink: "#fff8ed", accent: "#e8c289", surface: "#17212b", letteringStyle: direction };
  const { renderCardFontLettering } = load("src/lib/card-font-lettering.ts");
  const assets = new Map();
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (assets.has(pathname)) { res.setHeader("Content-Type", "image/webp"); res.end(assets.get(pathname)); return; }
    if (["/entry.js", "/entry.css", "/global.css"].includes(pathname)) {
      res.setHeader("Content-Type", pathname.endsWith(".js") ? "text/javascript" : "text/css");
      res.end(await fs.readFile(path.join("output/livecard-builder", pathname.slice(1)))); return;
    }
    if (pathname.startsWith("/fonts/")) { res.end(await fs.readFile(path.join("public", pathname))); return; }
    res.setHeader("Content-Type", "text/html");
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); server.unref();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    let job, stored, starts = 0, release = false, cleanups = 0;
    await page.route("**/api/**", async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.pathname.endsWith("/jobs")) {
        if (req.method() === "POST") {
          starts++;
          const input = req.postDataJSON();
          const result = await renderCardFontLettering(bg, input.form, design, material);
          job = { id: "material-job", state: "ready", stage: "ready", mode: input.mode, form: input.form, created_at: new Date().toISOString(), design: { ...design, headline: { renderer: "font-v1", title: input.form.title, intro: input.form.headlineIntro, imageUrl: `data:image/webp;base64,${result.composite.toString("base64")}`, layerUrl: `data:image/webp;base64,${result.layer.toString("base64")}`, layout: result.layout, detailLines: result.detailLines, validation: { status: "passed", issues: [] } } } };
        }
        return route.fulfill({ json: { job: release ? job : { ...job, state: "running", stage: "background_generating", design: null } }, status: req.method() === "POST" ? 202 : 200 });
      }
      if (url.pathname.endsWith("/headline")) {
        cleanups++;
        const input = req.postDataJSON();
        const rendered = await renderCardFontLettering(bg, input.form, input.design, material);
        return route.fulfill({ json: { headline: { renderer: "font-v1", title: input.form.title, intro: input.form.headlineIntro, imageUrl: `data:image/webp;base64,${rendered.composite.toString("base64")}`, layerUrl: `data:image/webp;base64,${rendered.layer.toString("base64")}`, layout: rendered.layout, validation: { status: "passed", issues: [] } } } });
      }
      if (url.pathname.endsWith("/location")) {
        const input = req.postDataJSON();
        return route.fulfill({ json: { location: { ...input, venue: "The Garden Room", address: "123 Test Lane", timezone: "America/Chicago", resolution: "manual" } } });
      }
      if (url.pathname === "/api/upload") {
        const multipart = await new Response(req.postDataBuffer(), { headers: { "content-type": req.headers()["content-type"] } }).formData();
        const file = multipart.get("file");
        const name = `/saved-${assets.size}.webp`;
        assets.set(name, Buffer.from(await file.arrayBuffer()));
        return route.fulfill({ json: { ok: true, stored: { display: { url: `${origin}${name}` } }, eventMedia: { thumbnail: `${origin}${name}` } } });
      }
      if (url.pathname.startsWith("/api/history")) {
        if (req.method() !== "GET") stored = { ...req.postDataJSON(), id: "saved-material-card", public_slug: "winter-evening" };
        return route.fulfill({ json: stored, status: req.method() === "POST" ? 201 : 200 });
      }
      return route.fulfill({ json: {} });
    });
    await page.goto(origin);
    await page.getByLabel("Event title", { exact: true }).fill("Élodie’s Winter Evening");
    await page.getByRole("button", { name: "Add an opening line (optional)", exact: true }).click();
    await page.getByLabel("Opening line (optional)", { exact: true }).fill("Mission: celebrate!");
    await page.getByLabel("Describe the look").fill("Cozy winter gathering, candlelight, velvet, vintage European elegance");
    assert.equal(await page.getByLabel("Event date", { exact: true }).isVisible(), true);
    assert.equal(await page.getByLabel("Start time", { exact: true }).isVisible(), true);
    await page.getByRole("button", { name: "Generate invitation", exact: true }).click();
    await page.getByText("Choose your event date.", { exact: true }).waitFor();
    assert.equal(starts, 0, "missing main info never starts a job");
    await page.getByLabel("Event date", { exact: true }).fill("2027-11-15");
    await page.getByLabel("Start time", { exact: true }).fill("18:30");
    await page.getByLabel("Venue name", { exact: true }).fill("The Garden Room");
    await page.getByRole("button", { name: "Generate invitation", exact: true }).click();
    await page.getByText("Your design is generating. You can finish RSVP, registry and messages.", { exact: true }).waitFor();
    const viewer = page.getByRole("dialog", { name: "Preview your Live Card", exact: true });
    assert.equal(await viewer.count(), 0, "generation keeps guest fields available on phones");
    await page.getByRole("button", { name: "Message to guests (optional)", exact: true }).click();
    await page.getByLabel("Message to guests (optional)", { exact: true }).fill("Entered while the design generates.");
    await page.getByRole("tab", { name: "Registry", exact: true }).click();
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByLabel("Registry or gift-list link").fill("https://example.com/gifts");
    await page.getByRole("tab", { name: "RSVP", exact: true }).click();
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await page.getByLabel("Host name", { exact: true }).fill("Test Host");
    await page.getByLabel("Host phone", { exact: true }).fill("3125550100");
    release = true;
    await page.getByText("Your design is generating. You can finish RSVP, registry and messages.", { exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Preview card", exact: true }).click();
    await viewer.waitFor();
    await viewer.getByRole("button", { name: "Save draft", exact: true }).click();
    await viewer.getByText("Draft saved. Find it in Drafts anytime.", { exact: true }).waitFor();
    await viewer.waitFor({ state: "hidden" });
    const saved = stored.data.studioCard.invitationData.sharedDesign;
    assert.equal(assets.size, 4, "background, composed card, isolated lettering, and reusable material uploaded only on save");
    assert.equal(saved.letteringStyle.direction, direction.direction);
    assert.match(saved.letteringStyle.textureUrl, /\/saved-\d+\.webp$/);
    assert.ok(assets.get(new URL(saved.letteringStyle.textureUrl, origin).pathname).equals(material));
    await fs.mkdir("output/livecard-lettering", { recursive: true });
    await fs.writeFile("output/livecard-lettering/composed-fixture.webp", assets.get(new URL(saved.headline.imageUrl, origin).pathname));
    assert.equal(saved.headline.renderer, "font-v1");
    assert.equal(saved.headline.title, "Élodie’s Winter Evening");
    assert.equal(saved.headline.intro, "Mission: celebrate!");
    assert.equal(saved.headline.detailLines, undefined, "no event details are printed on the Live Card");
    assert.equal(stored.data.liveCardBuilder.form.date, "2027-11-15");
    assert.equal(stored.data.liveCardBuilder.form.locations[0].venue, "The Garden Room");
    assert.equal(stored.data.liveCardBuilder.form.overview, "Entered while the design generates.");
    assert.equal(stored.data.liveCardBuilder.form.registryUrl, "https://example.com/gifts");
    assert.equal(stored.data.liveCardBuilder.form.hostPhone, "3125550100");
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: width === 320 ? 800 : 1080 });
      await page.reload();
      if (width === 320) {
      await page.getByRole("button", { name: "Preview card", exact: true }).click();
      await viewer.waitFor();
      await viewer.evaluate(async node => { await Promise.all(node.getAnimations({ subtree: true }).filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
      assert.equal(await viewer.locator("img").first().getAttribute("src"), saved.headline.imageUrl);
      } else {
        await page.locator(`aside img[src="${saved.headline.imageUrl}"]`).first().waitFor();
      }
      const visibleImage = width === 320 ? viewer.locator("img").first() : page.locator(`aside img[src="${saved.headline.imageUrl}"]`).first();
      await visibleImage.evaluate(async image => { await image.decode(); });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await fs.mkdir("output/livecard-lettering", { recursive: true });
      await page.screenshot({ path: `output/livecard-lettering/saved-${width}.png` });
      if (width === 320) {
      await viewer.getByRole("button", { name: "Close preview", exact: true }).click();
      await viewer.waitFor({ state: "hidden" });
      }
    }
    stored.data.studioCard.invitationData.sharedDesign.headline.detailLines = ["Incorrectly printed date and venue"];
    await page.reload();
    await page.getByRole("button", { name: "Update card text", exact: true }).click();
    await page.getByRole("button", { name: "Update card text", exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved. Find it in Drafts anytime.", { exact: true }).waitFor();
    assert.equal(stored.data.studioCard.invitationData.sharedDesign.headline.detailLines, undefined);
    assert.equal(cleanups, 1, "erroneous detail-bearing layers are cleaned by the local font endpoint");
    assert.equal(starts, 1, "save, reload and cleanup never create a new artwork job");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
