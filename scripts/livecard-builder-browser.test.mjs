import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import sharp from "sharp";
import jsQR from "jsqr";

test("Live Card: location retries, explicit saves, invitation download and responsive preview", {
  timeout: 120000,
}, async () => {
  execSync("bun scripts/build-livecard-builder-fixture.mjs", { timeout: 60000, stdio: "pipe" });
  const out = path.resolve("output/livecard-builder");
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
    if (pathname === "/headline.webp") {
      const params = new URL(req.url, "http://localhost").searchParams;
      const escapeXml = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500"><rect width="1000" height="1500" fill="#f0d9f9"/><text x="500" y="360" text-anchor="middle" fill="#652d83" font-size="40">${escapeXml(params.get("intro") || "")}</text><text x="500" y="530" text-anchor="middle" fill="#652d83" font-size="70" font-style="italic">${escapeXml(params.get("title") || "")}</text></svg>`);
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
  server.unref();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, timezoneId: "Asia/Tokyo" });
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  const saves = [];
  const generations = [];
  const headlines = [];
  let holdHeadline = false;
  let releaseHeadline;
  let headlineStarted;
  let failHeadline = false;
  const locationRequests = [];
  await page.addInitScript(() => {
    window.__sharedCards = [];
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", { configurable: true, value: async (data) => { window.__sharedCards.push(data); } });
    window.__cardDraws = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
      window.__cardDraws.push(text);
      window.__cardFonts ||= [];
      window.__cardFonts.push(this.font);
      return original.call(this, text, ...rest);
    };
  });
  let stored;
  let failSave = false;
  let holdSave = false;
  let releaseSave;
  let saveStarted;
  let failGeneration = false;
  let failProofread = false;
  let releaseProofread;
  let proofreadStarted;
  let holdProofread = false;
  const wordingRequests = [];
  const checkMobileEditor = async () => {
    const bounds = await page.locator("form").evaluate((form) => {
      const editor = form.parentElement.getBoundingClientRect();
      const workspace = form.parentElement.parentElement.getBoundingClientRect();
      return { editorWidth: editor.width, workspaceWidth: workspace.width };
    });
    assert.ok(Math.abs(bounds.editorWidth - bounds.workspaceWidth) < 1, "mobile editor uses the full workspace width");
    const preview = page.locator('aside[aria-label="Artwork preview"]');
    assert.equal(await preview.locator("[data-live-card-artwork]").first().isVisible(), false, "artwork opens on a separate screen on mobile");
    assert.equal(await page.getByText("Your design starts here.", { exact: true }).isVisible(), false, "no empty thumbnail crowds the mobile form");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile editor stays within the viewport");
  };
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
      const { form, mode } = request.postDataJSON();
      assert.equal(mode, "wording", "only automatic proofreading calls the assistance API");
      if (mode === "wording") {
        wordingRequests.push(form);
        if (holdProofread) {
          holdProofread = false;
          await new Promise((resolve) => { releaseProofread = resolve; proofreadStarted(); });
        }
        return route.fulfill(failProofread ? { status: 503, json: { error: "Proofreading unavailable" } } : {
          json: { form: {
            ...form,
            title: form.title.replace(/\bamc\b/g, "AMC"),
            overview: form.overview.replace("freinds", "friends").replace(/\bamc\b/g, "AMC"),
          }, questions: [] },
        });
      }

    }
    if (url.pathname === "/api/livecard-builder/location") {
      const body = request.postDataJSON();
      locationRequests.push(body);
      if (body.query === "Unavailable venue")
        return route.fulfill({ status: 503, json: { error: "Location lookup is unavailable. Enter your address and confirm the local time zone." } });
      if (body.query === "Unlisted venue")
        return route.fulfill({ json: { candidates: [], location: null, message: "We couldn’t identify this venue. Add its city or full address." } });
      const place = { placeId: "amc", venue: "AMC Grand Boulevard 10", address: "465 Grand Boulevard, Miramar Beach, FL", city: "Miramar Beach", latitude: 30.3, longitude: -86.3 };
      if (body.query === "AMC" && !body.placeId)
        return route.fulfill({ json: { candidates: [place, { ...place, placeId: "other-amc", venue: "AMC Destin", address: "Other street, Destin, FL" }], location: null, message: "Which venue is yours? Choose below, or add a city to narrow the search." } });
      if (body.query === "456 Lake St, Chicago") return route.fulfill({ json: { location: {
        ...place, id: body.id, venue: "Dinner", address: body.query, city: "Chicago", timezone: "America/Chicago", resolution: "verified",
      } } });
      assert.ok(body.query === "AMC Grand Boulevard" || (body.query === "AMC" && body.placeId === "amc"));
      return route.fulfill({ json: { location: { ...place, id: body.id, label: "", time: "", note: "", timezone: "America/Chicago", resolution: "verified" } } });

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
      return route.fulfill({ json: { design: { version: 1, backgroundUrl: `${origin}/artwork.webp`, font: "classic", typography: "cinematic", ink: "#542235", accent: "#875226", surface: "#fff4ec" } } });
    }
    if (url.pathname === "/api/livecard-builder/headline") {
      const { form, design } = request.postDataJSON();
      headlines.push({ form, design });
      if (holdHeadline) {
        holdHeadline = false;
        await new Promise((resolve) => { releaseHeadline = resolve; headlineStarted(); });
      }
      if (failHeadline) return route.fulfill({ status: 503, json: { error: "The title artwork could not be verified. Your card is unchanged. Select Review to try again." } });
      return route.fulfill({ json: { headline: { imageUrl: `${origin}/headline.webp?${new URLSearchParams({ title: form.title.trim(), intro: form.headlineIntro.trim() })}`, title: form.title.trim(), intro: form.headlineIntro.trim() } } });
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
      if (holdSave) {
        holdSave = false;
        await new Promise((resolve) => { releaseSave = resolve; saveStarted(); });
      }
      if (failSave)
        return route.fulfill({ status: 500, json: { error: "Test save failed. Please retry." } });
      stored = { ...body, id: body.clientDraftId || stored.id, public_slug: "movie-night" };
      return route.fulfill({ status: request.method() === "POST" ? 201 : 200, json: stored });
    }
    if (url.pathname.startsWith("/api/")) throw new Error(`Unexpected API call: ${request.url()}`);
    return route.continue();
  });
  const checkActionChrome = async (scope) => {
    const buttons = scope.locator("[data-live-card-trigger]");
    for (const button of await buttons.all()) {
      const circle = button.locator(":scope > div");
      const label = button.locator(":scope > span");
      assert.equal(await circle.isVisible(), true, "the familiar action icon is visible");
      assert.equal(await circle.locator("svg").isVisible(), true);
      const iconBox = await circle.boundingBox();
      const labelBox = await label.boundingBox();
      assert.ok(Math.abs(iconBox.width - iconBox.height) < 1, "icon surface stays circular");
      assert.ok(labelBox.y >= iconBox.y + iconBox.height, "label stays below its icon");
      const chrome = await button.evaluate((node) => ({ icon: getComputedStyle(node.querySelector("svg")).color, label: getComputedStyle(node.querySelector(":scope > span")).color }));
      assert.equal(chrome.icon, "rgb(255, 255, 255)", "icons retain the original white treatment");
      assert.equal(chrome.label, "rgb(255, 255, 255)", "labels are white, never artwork palette colors");
    }
  };
  const openSection = async (name) => {
    await page.getByRole("tab", { name: new RegExp(`^${name}`) }).click();
    assert.equal(await page.getByRole("tabpanel").count(), 1, "only one section is mounted");
  };
  try {
    await page.goto(`${origin}/live-cards`);
    assert.equal(await page.getByRole("group", { name: "Invitation format" }).count(), 0);
    assert.equal(await page.getByText(/LIVE CARDS & INVITES|both versions|Two beautiful ways/).count(), 0);
    await page.getByRole("heading", { name: "Create your Live Card", exact: true }).waitFor();
    assert.equal(await page.getByRole("region", { name: "Both included", exact: true }).count(), 0);
    assert.equal(await page.getByRole("navigation", { name: "Card creation steps" }).getByRole("button").count(), 3);
    assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).isDisabled(), false);
    assert.equal(await page.getByRole("button", { name: "3 Review", exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Event date", { exact: true }).count(), 0);
    assert.equal(await page.getByLabel("Add a reference image", { exact: false }).count(), 1, "reference artwork belongs in the first step");
    assert.equal(await page.getByText("Use a photo or image to guide the design.", { exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).getAttribute("aria-current"), "step");
    assert.equal(await page.getByLabel("Event title or name").count(), 0, "design starts before title and logistics");
    assert.equal(await page.getByLabel("Event description", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Describe a change", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Fill from a description", { exact: false }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Preview", exact: true }).count(), 0);
    await page.screenshot({ path: path.join(out, "desktop-start.png"), fullPage: true });
    const startingIdeas = page.getByRole("region", { name: "General event design ideas" });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await checkMobileEditor();
      assert.equal(await page.getByRole("group", { name: "Save and publish", exact: true }).count(), 0, "mobile Design has no detached save/publish row");
      await startingIdeas.getByRole("list").getByRole("button").nth(3).waitFor();
      assert.equal(await startingIdeas.isVisible(), true, "mobile shows starting ideas before choosing an event type");
      assert.equal(await page.getByLabel("Event type", { exact: true }).inputValue(), "");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "starting ideas fit the phone width");
      await page.screenshot({ path: path.join(out, `mobile-start-${width}.png`), fullPage: true });
    }
    const startingIdea = startingIdeas.getByRole("list").getByRole("button").first();
    const startingPrompt = await startingIdea.getAttribute("title");
    await startingIdea.click();
    assert.equal(await page.getByLabel("Describe your design").inputValue(), startingPrompt);
    assert.equal(await page.getByLabel("Event type", { exact: true }).inputValue(), "", "choosing a starting idea does not pick an event type");
    await page.screenshot({ path: path.join(out, "mobile-start.png"), fullPage: true });
    assert.equal(await page.getByRole("button", { name: "Generate & continue", exact: true }).isDisabled(), true);
    await page.getByLabel("Describe your design").fill("   ");
    assert.equal(await page.getByRole("button", { name: "Generate & continue", exact: true }).isDisabled(), true, "whitespace is not a design description");
    assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).getAttribute("aria-current"), "step");
    assert.equal(generations.length, 0);
    assert.equal(saves.length, 0);
    await page.reload();
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.getByLabel("Describe your design").fill("Pink movie night with popcorn and stars");
    assert.equal(await page.getByRole("button", { name: "Generate & continue", exact: true }).isDisabled(), true, "design needs the occasion before generation");
    await page.locator("form").evaluate((form) => form.requestSubmit());
    await page.getByText("Choose an event type.", { exact: true }).waitFor();
    assert.equal(generations.length, 0, "the submit handler also requires an event type");
    await page.getByLabel("Event type", { exact: true }).selectOption("Birthday");
    assert.equal(await startingIdeas.count(), 0, "choosing an event type replaces the general starting ideas");
    const birthdayIdeas = page.getByRole("region", { name: "Birthday design ideas" });
    const ideaButtons = birthdayIdeas.getByRole("list").getByRole("button");
    await ideaButtons.nth(3).waitFor();
    assert.equal(await ideaButtons.count(), 4);
    const firstTitles = await birthdayIdeas.locator("strong").allTextContents();
    const suggestion = await ideaButtons.first().getAttribute("title");
    await ideaButtons.first().focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.getByLabel("Describe your design").inputValue(), suggestion);
    assert.equal(await page.getByLabel("Describe your design").evaluate((node) => node === document.activeElement), true);
    assert.equal(await birthdayIdeas.getByRole("button", { pressed: true }).count(), 1);
    await page.getByLabel("Describe your design").fill("My own colors and artwork");
    assert.deepEqual(await birthdayIdeas.locator("strong").allTextContents(), firstTitles, "typing keeps ideas stable");
    await birthdayIdeas.getByRole("button", { name: "Shuffle design ideas" }).click();
    const shuffledTitles = await birthdayIdeas.locator("strong").allTextContents();
    assert.ok(shuffledTitles.every((title) => !firstTitles.includes(title)), "shuffle shows four different scenes");
    assert.equal(await page.getByLabel("Describe your design").inputValue(), "My own colors and artwork");
    await page.getByLabel("Event type", { exact: true }).selectOption("Graduation");
    const graduationIdeas = page.getByRole("region", { name: "Graduation design ideas" });
    await graduationIdeas.getByRole("list").getByRole("button").nth(3).waitFor();
    assert.equal(await birthdayIdeas.count(), 0);
    assert.equal(await page.getByLabel("Describe your design").inputValue(), "My own colors and artwork", "changing category never replaces a description");
    assert.equal(generations.length, 0, "choosing and shuffling never generate artwork");
    assert.equal(saves.length, 0, "suggestions never save a draft");
    const checkSuggestionGrid = async () => {
      const boxes = await Promise.all((await graduationIdeas.getByRole("list").getByRole("button").all()).map((button) => button.boundingBox()));
      assert.equal(boxes.length, 4);
      assert.equal(boxes[0].y, boxes[1].y, "first two suggestions share a row");
      assert.equal(boxes[2].y, boxes[3].y, "last two suggestions share a row");
      assert.ok(boxes[1].x >= boxes[0].x + boxes[0].width, "columns do not overlap");
      assert.ok(boxes[2].y >= boxes[0].y + boxes[0].height, "rows do not overlap");
    };
    await checkSuggestionGrid();
    await page.screenshot({ path: path.join(out, "desktop-design-ideas.png"), fullPage: true });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await checkMobileEditor();
      await checkSuggestionGrid();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "suggestions fit narrow phones");
      for (const button of await graduationIdeas.getByRole("button").all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, "suggestions and shuffle have accessible tap targets");
      }
      await page.screenshot({ path: path.join(out, `mobile-design-ideas-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.getByLabel("Event type", { exact: true }).selectOption("Birthday");
    await page.getByLabel("Describe your design").fill("Pink movie night with popcorn and stars");
    assert.equal(await page.getByRole("button", { name: "Generate & continue", exact: true }).isEnabled(), true);
    assert.equal(saves.length, 0, "typing stays in memory");
    assert.equal(generations.length, 0, "generation needs an explicit action");
    await page.screenshot({ path: path.join(out, "desktop-design.png"), fullPage: true });
    await page.getByRole("button", { name: "Generate & continue", exact: true }).click();
    await started;
    await page.getByLabel("Event title or name").waitFor();
    assert.equal(await page.getByRole("button", { name: "2 Event details", exact: true }).getAttribute("aria-current"), "step", "generation opens Event details immediately");
    assert.equal(generations[0].form.title, "");
    assert.equal(generations[0].form.eventType, "Birthday", "the occasion is sent with the design request");
    assert.equal(generations[0].form.date, "");
    const generationPanel = page.getByRole("region", { name: "Design generation", exact: true });
    const generationProgress = generationPanel.getByRole("progressbar", { name: "Creating your design", exact: true });
    await generationProgress.waitFor();
    assert.equal(await generationProgress.getAttribute("aria-valuenow"), null, "generation is indeterminate, never a made-up percentage");
    assert.equal(await generationProgress.getAttribute("aria-valuetext"), "Drawing your artwork");
    assert.equal(await generationPanel.getByRole("status").textContent(), "Drawing your artwork");
    assert.ok(await generationPanel.evaluate((element) => element.getAnimations({ subtree: true }).some((animation) => animation.playState === "running")), "the generation preview animates");
    await generationPanel.screenshot({ path: path.join(out, "generation-progress.png") });
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await generationPanel.evaluate((element) => element.getAnimations({ subtree: true }).length), 0, "reduced motion stops decorative animations and shimmer");
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await checkMobileEditor();
      assert.ok(await generationPanel.evaluate((element) => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1), "progress fits portrait and landscape without clipping");
      await generationPanel.screenshot({ path: path.join(out, `generation-progress-${viewport.width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 1080 });
    assert.equal(await page.getByRole("button", { name: "Publish", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "3 Review", exact: true }).isDisabled(), true);
    // Returning to Design while the request runs must not start a duplicate job.
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByRole("button", { name: "Continue to event details", exact: true }).click();
    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByLabel("Event type", { exact: true }).selectOption("Gender reveal");
    await page.getByRole("button", { name: "Continue to event details", exact: true }).click();
    const eventTitle = page.getByLabel("Event title or name");
    const guestMessage = page.getByLabel("Message to guests (optional)", { exact: true });
    assert.equal(await eventTitle.getAttribute("placeholder"), "Our Gender Reveal");
    assert.equal(await eventTitle.inputValue(), "", "category examples stay placeholders");
    assert.match(await guestMessage.getAttribute("placeholder"), /surprise/);
    assert.equal(await guestMessage.inputValue(), "");
    await page.screenshot({ path: path.join(out, "gender-reveal-placeholders.png"), fullPage: true });
    await eventTitle.fill("Our little surprise");
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByLabel("Event type", { exact: true }).selectOption("Wedding");
    await page.getByRole("button", { name: "Continue to event details", exact: true }).click();
    assert.equal(await eventTitle.getAttribute("placeholder"), "Our Wedding Celebration");
    assert.equal(await eventTitle.inputValue(), "Our little surprise", "changing category never overwrites the host's title");
    await eventTitle.fill("");
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByLabel("Event type", { exact: true }).selectOption("Birthday");
    await page.getByRole("button", { name: "Continue to event details", exact: true }).click();
    assert.equal(await eventTitle.getAttribute("placeholder"), "Birthday Celebration");
    assert.equal(await eventTitle.inputValue(), "");
    assert.equal(generations.length, 1, "updating examples never starts another artwork request");
    assert.equal(saves.length, 0, "updating examples never saves progress");
    for (const label of ["Message to guests (optional)", "Anything else guests should know? (optional)"]) {
      assert.equal(await page.getByRole("button", { name: label, exact: true }).getAttribute("aria-expanded"), "false");
      assert.equal(await page.getByLabel(label, { exact: true }).isVisible(), false);
    }
    await page.getByLabel("Event title or name").fill("Livia's Movie Night");
    assert.equal(await page.getByLabel("Event type", { exact: true }).count(), 0, "event type is only edited in Design");
    await page.screenshot({ path: path.join(out, "desktop-details.png"), fullPage: true });
    await page.getByRole("button", { name: "Message to guests (optional)", exact: true }).click();
    await page.getByLabel("Message to guests (optional)").fill("A movie and dinner with friends.");
    await page.getByRole("button", { name: "Message to guests (optional)", exact: true }).click();
    assert.equal(await page.getByLabel("Message to guests (optional)").isVisible(), false);
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "A movie and dinner with friends.", "collapsing preserves the guest message");
    assert.equal(await page.getByRole("button", { name: "Anything else guests should know? (optional)", exact: true }).getAttribute("aria-expanded"), "false", "the fields expand independently");
    await page.getByRole("button", { name: "Message to guests (optional)", exact: true }).click();
    const extraDetails = page.getByRole("button", { name: "Anything else guests should know? (optional)", exact: true });
    await extraDetails.focus();
    await page.keyboard.press("Enter");
    await page.getByLabel("Anything else guests should know? (optional)", { exact: true }).fill("Bring a jacket.");
    await extraDetails.focus();
    await page.keyboard.press("Space");
    assert.equal(await page.getByLabel("Anything else guests should know? (optional)", { exact: true }).isVisible(), false);
    assert.equal(await page.getByLabel("Anything else guests should know? (optional)", { exact: true }).inputValue(), "Bring a jacket.");

    assert.equal(await page.getByLabel("Event date", { exact: true }).count(), 0);
    await page.getByRole("tab", { name: "Basics", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.getByRole("tab", { name: "When & Where", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await page.getByLabel("Event date", { exact: true }).fill("2026-10-04");
    await page.getByLabel("Start time", { exact: true }).fill("18:00");
    await page.getByLabel("End time (optional)", { exact: true }).fill("21:00");
    assert.equal(await page.getByRole("button", { name: "Find", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Enter address manually", exact: true }).count(), 0, "only venue name is requested initially");
    await page.getByLabel("Venue name", { exact: true }).fill("AMC Grand");
    await page.getByLabel("Venue name", { exact: true }).fill("AMC Grand Boulevard");
    await page.waitForTimeout(900);
    assert.equal(locationRequests.length, 0, "typing a venue never starts lookup or shows provider failures");
    await page.getByRole("button", { name: "Add another location" }).click();
    await page.getByLabel("What happens here?").fill("Dinner");
    await page.getByLabel("Venue name", { exact: true }).fill("456 Lake St, Chicago");
    assert.equal(await page.getByLabel("Local time zone", { exact: true }).count(), 0);
    await openSection("RSVP");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await page.getByLabel("Host name", { exact: true }).fill("Mia");
    await page.getByLabel("Host phone", { exact: true }).fill("850-555-0199");
    assert.equal(await page.getByLabel("Host phone", { exact: true }).getAttribute("required"), "");
    assert.equal(await page.getByLabel("Host email (optional)").getAttribute("required"), null);
    assert.ok(await page.locator("#livecard-hostPhone").evaluate((phone) => Boolean(
      phone.compareDocumentPosition(document.getElementById("livecard-hostEmail")) & Node.DOCUMENT_POSITION_FOLLOWING
    )), "host phone appears before optional email");
    await page.getByLabel("Host email (optional)").fill("mia@example.com");
    await openSection("Registry");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByLabel("Registry or gift-list link").fill("https://example.com/gifts");
    await page.getByLabel("Gift message (optional)").fill("Your presence is our present.");
    assert.equal(saves.length, 0, "generation and continued form editing never create a draft");
    // An explicit save is allowed while artwork is still running.
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved. Find it in Drafts anytime.").waitFor();
    await page.getByRole("heading", { name: "Edit your Live Card", exact: true }).waitFor();
    assert.equal(stored.data.status, "draft");
    releaseGeneration();
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    await page.getByText("Temporary lettering preview", { exact: true }).waitFor();
    assert.equal(await page.getByRole("progressbar", { name: "Creating your design", exact: true }).count(), 0, "the progress animation is removed when artwork arrives");
    const shareButton = page.getByRole("button", { name: "Share Live Card", exact: true });
    assert.equal(await shareButton.isDisabled(), true, "a saved draft does not expose a public share link");
    const cardBounds = await page.getByRole("complementary", { name: "Artwork preview" }).locator("[data-live-card-artwork]").boundingBox();
    const shareBounds = await shareButton.boundingBox();
    const eyeBounds = await page.getByRole("button", { name: "Preview Live Card", exact: true }).boundingBox();
    assert.ok(shareBounds.x >= cardBounds.x && shareBounds.x < cardBounds.x + 24 && shareBounds.y < cardBounds.y + 24, "Share sits inside the card's top-left corner");
    assert.ok(eyeBounds.x + eyeBounds.width <= cardBounds.x + cardBounds.width && eyeBounds.x > cardBounds.x + cardBounds.width / 2 && eyeBounds.y < cardBounds.y + 24, "the eye button sits inside the top-right corner");
    await openSection("Basics");
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Livia's Movie Night");
    assert.equal(await page.getByRole("button", { name: "Publish", exact: true }).isEnabled(), true, "entering event details during generation does not invalidate artwork");
    assert.equal(await page.getByRole("button", { name: /Review Live Card|Review & publish/ }).count(), 0, "only Publish is offered beneath the card");
    const cardActions = await page.getByRole("group", { name: "Save and publish", exact: true }).boundingBox();
    const currentCardBounds = await page.getByRole("complementary", { name: "Artwork preview" }).locator("[data-live-card-artwork]").boundingBox();
    assert.ok(cardActions.y >= currentCardBounds.y + currentCardBounds.height, "Save and Publish sit below the Live Card");
    assert.ok(cardActions.x >= currentCardBounds.x - 45 && cardActions.x + cardActions.width <= currentCardBounds.x + currentCardBounds.width + 45, "actions stay in the card column");
    assert.equal(
      await page.getByLabel("Message to guests (optional)").inputValue(),
      "A movie and dinner with friends.",
    );
    await openSection("When & Where");
    assert.equal(await page.getByLabel("Venue name", { exact: true }).inputValue(), "456 Lake St, Chicago");
    assert.equal(locationRequests.length, 0, "draft saving and background artwork do not trigger venue lookup");
    assert.equal(
      await page.getByRole("button", { name: "Save draft", exact: true }).isEnabled(),
      true,
      "artwork arriving after a draft save is still unsaved progress",
    );
    const dateBeforeReview = await page.getByLabel("Event date", { exact: true }).inputValue();
    await page.getByLabel("Event date", { exact: true }).fill("");
    await openSection("Basics");
    const reviewButton = page.getByRole("button", { name: "3 Review", exact: true });
    const reviewTab = page.getByRole("button", { name: "3 Review", exact: true });
    assert.equal(await reviewButton.isDisabled(), true);
    assert.equal(await reviewTab.isDisabled(), true, "step navigation cannot bypass required details");
    const savesBeforeEarlyPreview = saves.length;
    failProofread = true;
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    await page.getByRole("button", { name: "Retry wording", exact: true }).waitFor();
    assert.equal(locationRequests.length, 0, "failed preview wording never resolves venues");
    assert.equal(headlines.length, 0, "failed preview wording never draws lettering");
    failProofread = false;
    await page.getByRole("button", { name: "Retry wording", exact: true }).click();
    const earlyPreview = page.getByRole("dialog");
    await earlyPreview.waitFor();
    await earlyPreview.getByText("Temporary lettering preview", { exact: true }).waitFor();
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const notice = earlyPreview.getByRole("status").filter({ hasText: "Temporary lettering preview" });
      const bounds = await notice.boundingBox();
      assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height, "temporary lettering guidance stays visible in phone previews");
      for (const name of ["Save draft", "Publish", "Close preview"]) {
        const control = await earlyPreview.getByRole("button", { name, exact: true }).boundingBox();
        assert.ok(control && control.y >= 0 && control.y + control.height <= viewport.height, `${name} stays visible with the temporary lettering notice`);
      }
      await page.screenshot({ path: path.join(out, `temporary-lettering-preview-${viewport.width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1080 });
    assert.equal(await earlyPreview.getByRole("button", { name: "Share Live Card", exact: true }).isDisabled(), true);
    assert.equal(locationRequests.length, 0, "preview does not require location resolution");
    assert.equal(headlines.length, 0, "the eye button does not generate lettering");
    assert.equal(saves.length, savesBeforeEarlyPreview, "preview does not save");
    const backdropPixel = await earlyPreview.evaluate((dialog) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.fillStyle = getComputedStyle(dialog.previousElementSibling).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    });
    assert.ok(backdropPixel.slice(0, 3).every((channel) => channel < 30) && backdropPixel[3] === 255, "full-screen preview has an opaque dark viewing background");
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    const requiredDetails = page.getByRole("region", { name: "Required details", exact: true });
    await requiredDetails.getByRole("button", { name: "Event date", exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.id === "livecard-date");
    assert.equal(await page.getByRole("tab", { name: "When & Where", exact: true }).getAttribute("aria-selected"), "true");
    await page.getByLabel("Event date", { exact: true }).fill(dateBeforeReview);
    assert.equal(await reviewButton.isEnabled(), true);
    const timeBeforeReview = await page.getByLabel("Start time", { exact: true }).inputValue();
    await page.getByLabel("Start time", { exact: true }).fill("");
    assert.equal(await reviewButton.isDisabled(), true);
    await page.getByLabel("Start time", { exact: true }).fill(timeBeforeReview);
    await openSection("Basics");
    await page.getByLabel("Event title or name").fill("   ");
    assert.equal(await reviewButton.isDisabled(), true);
    const wordingBeforeInvalidSubmit = wordingRequests.length;
    await page.locator("form").evaluate((form) => form.requestSubmit());
    assert.equal(await page.getByRole("button", { name: "2 Event details", exact: true }).getAttribute("aria-current"), "step");
    assert.equal(wordingRequests.length, wordingBeforeInvalidSubmit, "invalid submit cannot start review preparation");
    await page.getByLabel("Event title or name").fill("Livia's Movie Night");
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    assert.equal(await page.getByLabel("Event type", { exact: true }).inputValue(), "Birthday");
    await page.getByLabel("Event type", { exact: true }).selectOption("");
    assert.equal(await page.getByRole("button", { name: "Continue to event details", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    assert.equal(await reviewButton.isDisabled(), true);
    await requiredDetails.getByRole("button", { name: "Event type", exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.id === "livecard-eventType");
    assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).getAttribute("aria-current"), "step", "missing event type links back to Design");
    await page.getByLabel("Event type", { exact: true }).selectOption("Birthday");
    await page.getByRole("button", { name: "Continue to event details", exact: true }).click();
    await openSection("RSVP");
    await page.getByLabel("Host name", { exact: true }).fill("");
    assert.equal(await reviewButton.isDisabled(), true, "enabled RSVP needs its required host name");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    assert.equal(await reviewButton.isEnabled(), true, "disabled RSVP requires no host details");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await page.getByLabel("Host name", { exact: true }).fill("Mia");
    await page.getByLabel("Host phone", { exact: true }).fill("");
    assert.equal(await reviewButton.isDisabled(), true, "email cannot replace the required host phone");
    await requiredDetails.getByRole("button", { name: "Host phone", exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.id === "livecard-hostPhone");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    assert.equal(await reviewButton.isEnabled(), true, "disabled RSVP requires no phone");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    await page.getByLabel("Host phone", { exact: true }).fill("123");
    assert.equal(await reviewButton.isDisabled(), true, "invalid host phone blocks review");
    await page.getByLabel("Host phone", { exact: true }).fill("850-555-0199");
    await page.getByLabel("Host email (optional)").fill("");
    assert.equal(await reviewButton.isEnabled(), true, "host email remains optional");
    await page.getByLabel("Host email (optional)").fill("mia@example.com");
    await openSection("Registry");
    await page.getByLabel("Registry or gift-list link").fill("");
    assert.equal(await reviewButton.isDisabled(), true, "enabled registry needs a valid link");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    assert.equal(await reviewButton.isEnabled(), true, "disabled registry requires no link");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByLabel("Registry or gift-list link").fill("https://example.com/gifts");
    assert.equal(await reviewButton.isEnabled(), true);
    assert.equal(generations.length, 1, "fixing logistics never regenerates design");
    await openSection("When & Where");
    await page.getByLabel("Venue name", { exact: true }).fill("Unavailable venue");
    const savesBeforeLocationFailure = saves.length;
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByText("Confirm the highlighted location before publishing. Your other details are still here.", { exact: true }).waitFor();
    assert.equal(await page.locator("[data-publish-progress]").count(), 0, "location failures close progress and return to the relevant form");
    assert.equal(saves.length, savesBeforeLocationFailure, "location failure cannot publish");
    await page.getByText("We couldn’t check this location right now. Select Review to retry.", { exact: true }).waitFor();
    assert.equal(locationRequests.filter((request) => request.query === "AMC Grand Boulevard").length, 1);
    assert.equal(await page.getByText("Location lookup is unavailable. Enter your address and confirm the local time zone.", { exact: true }).count(), 0);
    assert.equal(await page.getByLabel("Local time zone", { exact: true }).count(), 0);
    await page.getByLabel("Venue name", { exact: true }).fill("Unlisted venue");
    await reviewButton.click();
    await page.getByText("We couldn’t identify this venue. Add its city or full address.", { exact: true }).waitFor();
    assert.equal(locationRequests.filter((request) => request.query === "AMC Grand Boulevard").length, 1, "a failed second stop does not discard or recheck the verified primary location");
    assert.equal(await page.getByRole("button", { name: "2 Event details", exact: true }).getAttribute("aria-current"), "step");
    await page.getByLabel("Venue name", { exact: true }).fill("AMC");
    await reviewButton.click();
    await page.getByRole("list", { name: "Matching venues" }).waitFor();
    await page.getByRole("button", { name: /AMC Grand Boulevard 10.*465 Grand Boulevard/ }).click();
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).waitFor();
    assert.ok(locationRequests.some((request) => request.placeId === "amc"), "choosing a branch resumes final preparation");
    assert.equal(saves.length, 1, "venue resolution and clarification never save automatically");
    await page.getByRole("button", { name: "Location", exact: true }).click();
    const directions = page.getByRole("button", { name: /Get directions to .*AMC Grand Boulevard 10/ });
    await directions.waitFor();
    assert.equal((await directions.textContent()).trim(), "Get directions");
    await page.getByRole("button", { name: "Location", exact: true }).click();
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await openSection("When & Where");
    await page.getByRole("button", { name: "Change location", exact: true }).click();
    await page.getByLabel("Change venue", { exact: true }).fill("456 Lake St, Chicago");
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    assert.equal(headlines.length, 1, "Review draws title lettering once; later date and venue edits reuse it");
    assert.equal(headlines[0].form.title, "Livia's Movie Night");
    await page.getByRole("dialog").locator('img[src*="/headline.webp"]').waitFor();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "RSVP", exact: true }).waitFor();
    await checkActionChrome(dialog);
    await dialog.getByRole("button", { name: "Overview", exact: true }).click();
    await dialog.getByText("A movie and dinner with friends.", { exact: true }).waitFor();
    assert.equal(await dialog.getByRole("group", { name: "Preview view", exact: true }).count(), 0, "expanded previews are Live Card only");
    assert.equal(generations.length, 1, "preview reuses the same artwork");
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    assert.equal(await page.getByRole("group", { name: "Preview view", exact: true }).count(), 0, "editor has no Invite switch");
    await openSection("RSVP");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    const inlinePreview = page.getByRole("complementary", { name: "Artwork preview" });
    await checkActionChrome(inlinePreview);
    const fourActionRows = await inlinePreview.locator("[data-live-card-trigger]").evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().y)));
    assert.equal(fourActionRows.length, 4);
    assert.equal(new Set(fourActionRows).size, 1, "four actions share one row on a full-width card");
    await inlinePreview.screenshot({ path: path.join(out, "restored-circular-actions.png") });
    await openSection("Registry");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    assert.equal(await dialog.getByRole("button", { name: "RSVP", exact: true }).count(), 0);
    assert.equal(await dialog.getByRole("button", { name: "Registry", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await openSection("RSVP");
    await page.getByRole("switch", { name: /Collect RSVPs/ }).click();
    assert.equal(await page.getByLabel("Host name", { exact: true }).inputValue(), "Mia");
    await openSection("Registry");
    await page.getByRole("switch", { name: /registry or gift list/ }).click();
    assert.equal(
      await page.getByLabel("Registry or gift-list link").inputValue(),
      "https://example.com/gifts",
    );
    await openSection("Basics");
    await page.getByLabel("Message to guests (optional)").fill("A movie and dinner with freinds.");
    const savedBeforeProofreading = saves.length;
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("region", { name: "Review your Live Card", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Check grammar & spelling", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Use reviewed wording", exact: true }).count(), 0);
    assert.equal(await page.getByRole("region", { name: "Review Overview wording", exact: true }).count(), 0);
    assert.equal(saves.length, savedBeforeProofreading, "automatic proofreading never saves or publishes");
    assert.match(await page.locator("dl").textContent(), /Oct 4, 2026, 6:00 PM–9:00 PM/, "Review includes both times in Chicago despite a Tokyo browser");
    assert.equal(await page.getByText("Temporary lettering preview", { exact: true }).count(), 0, "finished lettering has no temporary-font notice");
    assert.equal(await page.getByLabel("Live card share link").count(), 0);
    await page.waitForFunction(() => document.activeElement?.textContent === "Your Live Card");
    await page.getByRole("region", { name: "Live Card output", exact: true }).getByRole("button", { name: "Preview Live Card", exact: true }).focus();
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement?.textContent), /Save draft/, "keyboard reaches the save actions below the card");
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement?.textContent), /Publish/);
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement?.textContent), /Download invitation/);
    await page.screenshot({ path: path.join(out, "desktop-review.png"), fullPage: true });
    failSave = true;
    holdSave = true;
    const publishing = new Promise((resolve) => { saveStarted = resolve; });
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await publishing;
    await page.locator('[data-publish-progress="publishing"]').waitFor();
    assert.equal(await page.getByRole("button", { name: "Cancel and keep editing", exact: true }).count(), 0, "persistence cannot be canceled halfway through");
    releaseSave();
    await page.getByText("Test save failed. Please retry.").waitFor();
    assert.equal(await page.locator("[data-publish-progress]").count(), 0, "failed saves close progress");
    assert.equal(stored.data.status, "draft");
    failSave = false;
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByRole("heading", { name: "Owner dashboard", exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("tab"), "dashboard");
    assert.equal(stored.data.description, "A movie and dinner with friends.\n\nBring a jacket.", "collapsed instructions are still included when publishing");
    assert.equal(stored.data.startISO, "2026-10-04T23:00:00.000Z");
    assert.equal(stored.data.additionalLocations[0].label, "Dinner");
    assert.equal(stored.data.studioCard.invitationData.eventDetails.actionVisibility.rsvp, true);
    assert.equal(generations.length, 1, "editing guest details and publishing reuse the artwork");
    await page.goto(`${origin}/live-cards?edit=${stored.id}`);
    await shareButton.waitFor();
    assert.equal(await shareButton.isEnabled(), true, "published saved cards can be shared");
    assert.equal(await page.getByRole("button", { name: "Publish", exact: true }).count(), 0, "published cards use one save action");
    assert.equal(await page.getByRole("button", { name: "Cancel", exact: true }).isEnabled(), true);

    await shareButton.click();
    await page.waitForFunction(() => window.__sharedCards.length === 1);
    const shared = await page.evaluate(() => window.__sharedCards[0]);
    assert.equal(new URL(shared.url).origin, "https://envitefy.com");
    assert.ok(shared.url.includes("movie-night"), "share uses the saved public slug");
    await page.getByRole("button", { name: "Message to guests (optional)", exact: true }).click();
    await page.getByLabel("Message to guests (optional)").waitFor();
    assert.equal(
      await page.getByLabel("Message to guests (optional)").inputValue(),
      "A movie and dinner with friends.",
    );
    assert.equal(
      await page.getByRole("button", { name: "Save changes", exact: true }).isDisabled(),
      true,
      "restoring a saved card starts clean",
    );
    await page.getByLabel("Message to guests (optional)").fill("Updated welcome");
    assert.equal(await shareButton.isDisabled(), true, "unsaved edits disable Share until saved");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(stored.data.description, "Updated welcome\n\nBring a jacket.");
    assert.equal(stored.data.status, "published", "Save changes updates the live event without creating a draft");
    assert.equal(await page.getByRole("button", { name: "Publish", exact: true }).count(), 0);

    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await openSection("Basics");
    const beforeTitleEdits = headlines.length;
    const beforeTitleSaves = saves.length;
    const savedTitle = await page.getByLabel("Event title or name").inputValue();
    const savedIntro = await page.getByLabel("Opening line (optional)").inputValue();
    await page.getByLabel("Opening line (optional)").fill("A new opening line");
    await page.getByText("Temporary lettering preview", { exact: true }).waitFor();
    await page.getByLabel("Opening line (optional)").fill(savedIntro);
    assert.equal(await page.getByText("Temporary lettering preview", { exact: true }).count(), 0, "restoring approved words restores the finished lettering state");
    await page.getByLabel("Event title or name").fill("Temporary title edit");
    await page.getByText("Temporary lettering preview", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, "temporary-lettering-edit.png"), fullPage: true });
    await page.getByLabel("Event title or name").fill(savedTitle);
    assert.equal(await page.getByText("Temporary lettering preview", { exact: true }).count(), 0);
    assert.equal(headlines.length, beforeTitleEdits, "explaining temporary lettering never generates artwork");
    assert.equal(saves.length, beforeTitleSaves, "explaining temporary lettering never saves progress");
    await page.getByLabel("Event title or name").fill("Superseded title");
    holdHeadline = true;
    const drawingHeadline = new Promise((resolve) => { headlineStarted = resolve; });
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await drawingHeadline;
    await page.getByRole("complementary", { name: "Artwork preview" }).getByText("Bringing your title to life", { exact: true }).waitFor();
    await page.getByLabel("Event title or name").fill("Updated title");
    releaseHeadline();
    await page.getByText("Your title or design changed while the lettering was being drawn. Select Review to prepare the latest version.", { exact: true }).waitFor();
    assert.equal(headlines.length, beforeTitleEdits + 1, "a stale title result does not start another paid request automatically");
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Updated title");
    assert.equal(saves.length, beforeTitleSaves, "lettering preparation never saves progress");
    holdHeadline = true;
    const reviewToCancel = new Promise((resolve) => { headlineStarted = resolve; });
    await page.getByRole("button", { name: "Retry lettering", exact: true }).click();
    await reviewToCancel;
    const cancelledHeadline = releaseHeadline;
    const preparingRegion = page.getByRole("region", { name: "Preparing your Live Card", exact: true });
    await preparingRegion.waitFor();
    assert.equal(await preparingRegion.getByRole("progressbar").getAttribute("aria-valuenow"), null);
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await preparingRegion.locator("svg").evaluate((node) => getComputedStyle(node).animationName), "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await preparingRegion.getByRole("button", { name: "Cancel and keep editing", exact: true }).click();
    await page.getByText("Preparation canceled. Your edits are still here.", { exact: true }).waitFor();
    assert.equal(saves.length, beforeTitleSaves);
    holdHeadline = true;
    const preparingPublish = new Promise((resolve) => { headlineStarted = resolve; });
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await preparingPublish;
    cancelledHeadline();
    const progress = page.locator('[data-publish-progress="lettering"]');
    await progress.waitFor();
    assert.equal(await progress.getByRole("progressbar").getAttribute("aria-valuenow"), null, "progress has no invented percentage");
    await page.keyboard.press("Tab");
    assert.equal(await progress.evaluate((dialog) => dialog.contains(document.activeElement)), true, "keyboard focus stays in progress");
    for (const viewport of [{ width: 1440, height: 1080 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const bounds = await progress.boundingBox();
      assert.equal(Math.round(bounds.width), viewport.width);
      assert.equal(Math.round(bounds.height), viewport.height);
      assert.equal(await progress.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth && dialog.scrollHeight <= dialog.clientHeight), true, "progress fits the whole viewport");
      await page.screenshot({ path: path.join(out, `publish-progress-${viewport.width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await progress.evaluate((dialog) => [...dialog.querySelectorAll("*")].every((el) => getComputedStyle(el).animationName === "none")), true, "reduced motion disables progress animations");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "Cancel and keep editing", exact: true }).click();
    await page.getByText("Saving canceled. Your edits are still here.", { exact: true }).waitFor();
    releaseHeadline();
    assert.equal(saves.length, beforeTitleSaves, "canceling preparation never saves or publishes");
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Updated title");
    await page.setViewportSize({ width: 1440, height: 1080 });
    failHeadline = true;
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("The title artwork could not be verified. Your card is unchanged. Select Review to try again.", { exact: true }).waitFor();
    assert.equal(await page.locator("[data-publish-progress]").count(), 0, "lettering failures close progress");
    assert.equal(saves.length, beforeTitleSaves, "lettering failure cannot publish");
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Updated title");
    failHeadline = false;
    const locationsBeforeRetry = locationRequests.length;
    const wordingBeforeRetry = wordingRequests.length;
    await page.getByRole("button", { name: "Retry lettering", exact: true }).click();
    await page.getByRole("region", { name: "Review your Live Card", exact: true }).waitFor();
    assert.equal(locationRequests.length, locationsBeforeRetry, "lettering retry reuses verified venues");
    assert.equal(wordingRequests.length, wordingBeforeRetry, "lettering retry reuses approved wording");
    assert.equal(saves.length, beforeTitleSaves, "retry of a failed save prepares Review without silently saving");
    assert.equal(headlines.at(-1).form.title, "Updated title");
    assert.equal(
      await page.getByRole("button", { name: "Save changes", exact: true }).isDisabled(),
      false,
      "editable headlines do not invalidate the background",
    );
    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByLabel("Describe your design").fill("Pink curtains with gold stars");
    failGeneration = true;
    await page.getByRole("button", { name: "Generate updated design" }).click();
    await page.getByRole("button", { name: "Retry design", exact: true }).waitFor();
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "Updated welcome");
    failGeneration = false;
    await page.getByRole("button", { name: "Retry design", exact: true }).click();
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    // Live Card creation reuses the background; only download composes the invitation text.
    const generationCount = generations.length;
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "Updated welcome");
    await page.getByText("Your design is ready.", { exact: true }).waitFor();
    assert.equal(generations.length, generationCount);
    await openSection("When & Where");
    await page.getByLabel("Start time", { exact: true }).fill("19:30");
    await openSection("Basics");
    assert.equal(generations.length, generationCount);
    const savesBeforePreviews = saves.length;
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("region", { name: "Live Card output", exact: true }).waitFor();
    const headlineCount = headlines.length;
    assert.equal(await page.getByRole("region", { name: "Invite output", exact: true }).count(), 0, "the builder renders only the Live Card");
    assert.equal(await page.getByRole("button", { name: "Preview Invite", exact: true }).count(), 0);
    assert.doesNotMatch(await page.evaluate(() => window.__cardDraws.join("\n")), /7:30 PM/, "Live Card previews do not compose invitation logistics");
    await page.evaluate(() => {
      const encode = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        if (args[0] === "image/jpeg") {
          HTMLCanvasElement.prototype.toDataURL = encode;
          throw new Error("Test encoding failed. Please retry.");
        }
        return encode.apply(this, args);
      };
    });
    await page.getByRole("button", { name: "Download invitation", exact: true }).click();
    await page.getByText("Test encoding failed. Please retry.", { exact: true }).waitFor();
    assert.equal(await page.getByText("Download started", { exact: true }).count(), 0, "encoding failure never claims a download started");
    assert.equal(await page.getByRole("button", { name: "Download invitation", exact: true }).isEnabled(), true, "encoding failure leaves download retry available");
    await page.evaluate(() => {
      const fetchImage = window.fetch;
      const ready = new Promise((resolve) => { window.__releaseDownload = resolve; });
      window.fetch = async function (input, init) {
        if (typeof input === "string" && input.startsWith("data:image/jpeg")) {
          await ready;
          window.fetch = fetchImage;
        }
        return fetchImage.call(this, input, init);
      };
    });
    const downloadEvent = page.waitForEvent("download");
    await page.evaluate(() => { window.__cardDraws = []; });
    await page.getByRole("button", { name: "Download invitation", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Download invitation", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Download invitation", exact: true }).getAttribute("aria-busy"), "true");
    await page.getByRole("status").filter({ hasText: "Preparing download…" }).waitFor();
    await page.evaluate(() => window.__releaseDownload());
    const download = await downloadEvent;
    await page.getByText("Download started", { exact: true }).waitFor();
    assert.match(download.suggestedFilename(), /\.jpg$/, "guest downloads use JPEG for sharing");
    const downloadPath = path.join(out, "invitation-download.jpg");
    await download.saveAs(downloadPath);
    const downloadMetadata = await sharp(downloadPath).metadata();
    assert.equal(downloadMetadata.format, "jpeg", "the exported bytes are JPEG, not renamed WebP");
    assert.equal(downloadMetadata.width, 2000);
    assert.equal(downloadMetadata.height, 3000);
    const printedText = await page.evaluate(() => window.__cardDraws.join("\n"));
    assert.match(printedText, /7:30 PM/, "download uses the corrected event time");
    assert.match(printedText, /\nenvitefy\.com\n/);
    assert.match(printedText, /\nexample\.com(?:\n|$)/);
    assert.doesNotMatch(printedText, /envitefy\.com\/|example\.com\//, "printed links contain only the domain");
    assert.doesNotMatch(printedText, /6:00 PM|4:00 PM/, "download never reuses stale time text");
    assert.doesNotMatch(printedText, /Updated title|You're invited|Updated welcome|Bring a jacket/, "generated title is reused as artwork and Overview-only wording is not printed");
    assert.equal(headlines.length, headlineCount, "logistics and downloads never regenerate title artwork");
    const decoded = await sharp(downloadPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decodedUrls = [];
    for (const box of [{ left: 550, top: 2350, width: 400, height: 400 }, { left: 1100, top: 2350, width: 400, height: 400 }]) {
      const pixels = await sharp(decoded.data, { raw: { width: decoded.info.width, height: decoded.info.height, channels: 4 } }).extract(box).raw().toBuffer();
      const code = jsQR(new Uint8ClampedArray(pixels), box.width, box.height);
      if (code) decodedUrls.push(code.data);
    }
    assert.ok(decodedUrls.includes("https://example.com/gifts"), "the exported Registry QR code decodes to its actual URL");
    assert.ok(decodedUrls.includes(shared.url), "the exported Live Card QR code opens the same published URL as Share");
    assert.equal(generations.length, generationCount, "downloading only composes existing artwork and current text");
    assert.equal(saves.length, savesBeforePreviews, "previews and downloading do not save the event");
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    await dialog.getByRole("button", { name: "RSVP", exact: true }).waitFor();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(stored.data.primaryOutput, "live_card", "invitation downloads keep the Live Card as the published event");
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).isDisabled(), true, "preview choice is not unsaved progress");
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 320, height: 740 },
    ]) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "3 Review", exact: true }).click();
      for (const name of ["Live Card output"]) {
        const output = page.getByRole("region", { name, exact: true });
        await output.scrollIntoViewIfNeeded();
        const art = await output.locator("[data-live-card-artwork]").boundingBox();
        assert.ok(art && art.width > 100 && art.height > 100, `${name} is visible at ${viewport.width}px`);
        const reviewActions = await output.getByRole("group", { name: "Cancel and save changes", exact: true }).boundingBox();
        assert.ok(reviewActions.y >= art.y + art.height, "Review keeps Save and Publish under the card");
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(out, `review-${viewport.width}.png`), fullPage: true });
      await page.getByRole("button", { name: "2 Event details", exact: true }).click();
      for (const name of ["Basics", "When & Where", "RSVP", "Registry"]) {
        await openSection(name);
        await checkMobileEditor();
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
      await openSection("Basics");
      assert.equal(await page.getByRole("group", { name: "Cancel and save changes", exact: true }).count(), 0, "mobile Event details keeps save/publish actions with the preview card");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.screenshot({
        path: path.join(out, `details-${viewport.width}.png`),
        fullPage: true,
      });
      const titleBeforePreview = await page.getByLabel("Event title or name").inputValue();
      const previewButton = page.getByRole("button", { name: "Preview Live Card", exact: true });
      const savesBeforeMobilePreview = saves.length;
      const generationsBeforeMobilePreview = generations.length;
      await previewButton.click();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
      await checkActionChrome(dialog);
      const previewActions = await dialog.getByRole("group", { name: "Cancel and save changes", exact: true }).boundingBox();
      assert.ok(previewActions.y >= bounds.y + bounds.height, "preview Save and Publish sit below the artwork");
      assert.ok(previewActions.x >= 0 && previewActions.x + previewActions.width <= viewport.width + 1);
      assert.ok(previewActions.y + previewActions.height <= viewport.height, "preview actions remain on screen, including landscape");
      for (const button of await dialog.getByRole("group", { name: "Cancel and save changes", exact: true }).getByRole("button").all()) {
        assert.ok(await button.evaluate((node) => node.scrollWidth <= node.clientWidth), "preview action labels fit without clipping");
        assert.ok((await button.locator("svg").boundingBox()).width >= 16, "preview action icons retain their size");
      }
      for (const button of await dialog.locator("[data-live-card-trigger]").all()) {
        const buttonBounds = await button.boundingBox();
        assert.ok(buttonBounds.y > bounds.y + bounds.height * 0.5, `buttons stay in the bottom of the card: ${JSON.stringify({viewport, bounds, buttonBounds})}`);
        assert.ok(buttonBounds.height >= 44, "buttons have comfortable tap targets");
        assert.ok(buttonBounds.y + buttonBounds.height <= bounds.y + bounds.height + 1, "buttons remain inside the artwork");
      }
      assert.equal(await dialog.getByRole("group", { name: "Preview view", exact: true }).count(), 0);
      await page.screenshot({ path: path.join(out, `preview-${viewport.width}.png`) });
      const settledBounds = await dialog.locator("[data-live-card-artwork]").boundingBox();
      assert.ok(settledBounds.y >= 0 && settledBounds.y + settledBounds.height <= viewport.height, "the artwork stays on screen after the preview settles");
      await page.getByRole("button", { name: "Close preview", exact: true }).click();
      assert.equal(await page.getByLabel("Event title or name").inputValue(), titleBeforePreview, "closing the mobile preview preserves form edits");
      assert.equal(await previewButton.evaluate((button) => document.activeElement === button), true, "closing returns focus to Preview");
      await page.getByRole("button", { name: "1 Design", exact: true }).click();
      await checkMobileEditor();
      await previewButton.click();
      await dialog.waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).getAttribute("aria-current"), "step");
      assert.equal(saves.length, savesBeforeMobilePreview, "opening and closing mobile previews never saves");
      assert.equal(generations.length, generationsBeforeMobilePreview, "mobile previews reuse existing artwork");
      await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    }
    await page.getByLabel("Message to guests (optional)").fill("Saved from the mobile preview.");
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(stored.data.liveCardBuilder.form.overview, "Saved from the mobile preview.");
    await page.getByLabel("Message to guests (optional)").fill("Updated welcome for our guests");
    await page.locator("#leave").click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "Updated welcome for our guests");
    const savesBeforeAutomaticCleanup = saves.length;
    const generationsBeforeAutomaticCleanup = generations.length;
    failProofread = true;
    await page.getByLabel("Message to guests (optional)").fill("A movie and dinner with freinds.");
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByText("Proofreading unavailable", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "A movie and dinner with freinds.");
    failProofread = false;
    holdProofread = true;
    const proofreading = new Promise((resolve) => { proofreadStarted = resolve; });
    await page.getByRole("button", { name: "Retry wording", exact: true }).click();
    await proofreading;
    await page.getByLabel("Message to guests (optional)").fill("My latest Overview at amc with freinds.");
    releaseProofread();
    await page.getByRole("region", { name: "Review your Live Card", exact: true }).waitFor();
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "My latest Overview at AMC with friends.", "newer manual wording is retained and automatically corrected");
    assert.equal(wordingRequests.at(-1).overview, "My latest Overview at amc with freinds.", "newer edits are checked again");
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("region", { name: "Review your Live Card", exact: true }).waitFor();
    const checksBeforeDownload = wordingRequests.length;
    const correctedDownload = page.waitForEvent("download");
    await page.evaluate(() => { window.__cardDraws = []; });
    await page.getByRole("button", { name: "Download invitation", exact: true }).click();
    await correctedDownload;
    const correctedPrint = await page.evaluate(() => window.__cardDraws.join("\n"));
    assert.doesNotMatch(correctedPrint, /My latest Overview|Bring a jacket/, "guest wording stays in Overview, including after proofreading");
    assert.doesNotMatch(correctedPrint, /\bamc\b|freinds/);
    assert.equal(wordingRequests.length, checksBeforeDownload, "unchanged wording reuses the completed check for the other output");
    assert.equal(saves.length, savesBeforeAutomaticCleanup, "cleanup and downloads remain in memory");
    assert.equal(generations.length, generationsBeforeAutomaticCleanup, "cleanup never regenerates artwork");
    const savedBeforeCancel = JSON.stringify(stored);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
    await page.getByRole("heading", { name: "Owner dashboard", exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("tab"), "dashboard");
    assert.equal(JSON.stringify(stored), savedBeforeCancel, "Cancel discards only unsaved edits and retains the saved event");
    assert.equal(saves.length, savesBeforeAutomaticCleanup);
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(`${origin}/live-cards?edit=${stored.id}`);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("heading", { name: "Owner dashboard", exact: true }).waitFor();
    assert.equal(saves.length, savesBeforeAutomaticCleanup, "clean cancellation does not save");
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`${origin}/live-cards`);
    await page.getByLabel("Event type", { exact: true }).selectOption("Birthday");
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await page.getByLabel("Event title or name").fill("Livia’s 10th Birthday");
    await openSection("When & Where");
    assert.equal(await page.getByLabel("Event date", { exact: true }).inputValue(), "", "new event dates remain blank until entered");
    assert.equal(await page.getByLabel("Start time", { exact: true }).inputValue(), "");
    await page.screenshot({ path: path.join(out, "mobile-when-where.png"), fullPage: true });
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByLabel("Describe your design").waitFor();
    assert.equal(generations.length, generationsBeforeAutomaticCleanup, "details and design steps do not generate automatically");
    assert.equal(saves.length, savesBeforeAutomaticCleanup, "new event details remain unsaved");
    assert.deepEqual(runtimeErrors, []);
    await fs.writeFile(
      path.join(out, "results.json"),
      JSON.stringify(
        {
          generationRequests: generations.length,
          saveRequests: saves.length,
          runtimeErrors,
          verified: [
            "automatic spelling and AMC capitalization before review, download and publication",
            "proofreading failures retain text and concurrent edits are rechecked",
            "Design first with immediate event entry while artwork generates",
            "description helpers and preview header removed while artwork, toggle and review previews remain",
            "optional guest message and instructions collapse independently, preserve text and support keyboard controls",
            "review readiness links directly to missing event fields",
            "venue-name lookup runs only during final card preparation",
            "background preparation resolves every location and preserves concurrent edits",
            "invitation text is composed only for download",
            "Live Card only in editor, review and fullscreen",
            "Live Card artwork fits on phones and landscape",
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
