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
      const escape = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500"><rect width="1000" height="1500" fill="#f0d9f9"/><text x="500" y="360" text-anchor="middle" fill="#652d83" font-size="40">${escape(params.get("intro") || "")}</text><text x="500" y="530" text-anchor="middle" fill="#652d83" font-size="70" font-style="italic">${escape(params.get("title") || "")}</text></svg>`);
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
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
    window.__cardDraws = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
      window.__cardDraws.push(text);
      (window.__cardFonts ||= []).push(this.font);
      return original.call(this, text, ...rest);
    };
  });
  let stored;
  let failSave = false;
  let failGeneration = false;
  let failProofread = false;
  let releaseProofread;
  let proofreadStarted;
  let holdProofread = false;
  const wordingRequests = [];
  const checkRightHandPreview = async () => {
    const form = await page.locator("form").boundingBox();
    const preview = await page.getByRole("complementary", { name: "Artwork preview" }).boundingBox();
    assert.ok(form && preview && preview.x >= form.x + form.width, "mobile preview stays to the right of the editor");
    assert.ok(preview.x + preview.width <= page.viewportSize().width, "right preview fits inside the phone viewport");
    const artwork = page.getByRole("complementary", { name: "Artwork preview" }).locator("[data-live-card-artwork]");
    const art = await artwork.count() ? await artwork.boundingBox() : null;
    if (art) for (const button of await page.getByRole("complementary", { name: "Artwork preview" }).locator("[data-live-card-trigger]").all()) {
      const box = await button.boundingBox();
      assert.ok(box.y > art.y + art.height * 0.5, "thumbnail controls do not cover the title");
      assert.ok(box.x >= art.x - 1 && box.x + box.width <= art.x + art.width + 1, "thumbnail controls stay inside the card");
    }
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
        return route.fulfill({ json: { candidates: [], location: null, message: "We couldn’t find that venue. Add its city or address, or enter the address manually." } });
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
    await page.goto(`${origin}/livacards-invites`);
    assert.equal(await page.getByRole("group", { name: "Invitation format" }).count(), 0);
    assert.equal(await page.getByText(/LIVE CARDS & INVITES|both versions|Two beautiful ways/).count(), 0);
    await page.getByRole("heading", { name: "Create your Live Card", exact: true }).waitFor();
    assert.equal(await page.getByRole("region", { name: "Both included", exact: true }).count(), 0);
    assert.equal(await page.getByRole("navigation", { name: "Card creation steps" }).getByRole("button").count(), 3);
    assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).isDisabled(), false);
    assert.equal(await page.getByRole("button", { name: "3 Review", exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Event date", { exact: true }).count(), 0);
    assert.equal(await page.getByLabel("Add a reference image", { exact: false }).count(), 1, "reference artwork belongs in the first step");
    assert.equal(await page.getByRole("button", { name: "1 Design", exact: true }).getAttribute("aria-current"), "step");
    assert.equal(await page.getByLabel("Event title or name").count(), 0, "design starts before title and logistics");
    assert.equal(await page.getByLabel("Event description", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Describe a change", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Fill from a description", { exact: false }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Preview", exact: true }).count(), 0);
    await page.screenshot({ path: path.join(out, "desktop-start.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
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
      await checkRightHandPreview();
      assert.ok(await generationPanel.evaluate((element) => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1), "progress fits portrait and landscape without clipping");
      await generationPanel.screenshot({ path: path.join(out, `generation-progress-${viewport.width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 1080 });
    assert.equal(await page.getByRole("button", { name: "Creating your design…", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "3 Review", exact: true }).isDisabled(), true);
    // Returning to Design while the request runs must not start a duplicate job.
    await page.getByRole("button", { name: "1 Design", exact: true }).click();
    await page.getByRole("button", { name: "Continue to event details", exact: true }).click();
    assert.equal(generations.length, 1);
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
    assert.equal(await page.getByRole("progressbar", { name: "Creating your design", exact: true }).count(), 0, "the progress animation is removed when artwork arrives");
    await openSection("Basics");
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Livia's Movie Night");
    assert.equal(await page.getByRole("button", { name: "Review Live Card", exact: true }).isEnabled(), true, "entering event details during generation does not invalidate artwork");
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
    const reviewButton = page.getByRole("button", { name: "Review Live Card", exact: true });
    const reviewTab = page.getByRole("button", { name: "3 Review", exact: true });
    assert.equal(await reviewButton.isDisabled(), true);
    assert.equal(await reviewTab.isDisabled(), true, "step navigation cannot bypass required details");
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
    await reviewButton.click();
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
    assert.equal(await page.getByLabel("Live card share link").count(), 0);
    await page.waitForFunction(() => document.activeElement?.textContent === "Your Live Card");
    await page.getByRole("button", { name: "Download invitation", exact: true }).focus();
    await page.keyboard.press("Tab");
    assert.match(await page.evaluate(() => document.activeElement?.textContent), /Edit event details/, "keyboard follows the visible review order");
    await page.screenshot({ path: path.join(out, "desktop-review.png"), fullPage: true });
    failSave = true;
    await page.getByRole("button", { name: "Publish & go to dashboard", exact: true }).click();
    await page.getByText("Test save failed. Please retry.").waitFor();
    assert.equal(stored.data.status, "draft");
    failSave = false;
    await page.getByRole("button", { name: "Publish & go to dashboard", exact: true }).click();
    await page.getByRole("heading", { name: "Owner dashboard", exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("tab"), "dashboard");
    assert.equal(stored.data.description, "A movie and dinner with friends.\n\nBring a jacket.", "collapsed instructions are still included when publishing");
    assert.equal(stored.data.startISO, "2026-10-04T23:00:00.000Z");
    assert.equal(stored.data.additionalLocations[0].label, "Dinner");
    assert.equal(stored.data.studioCard.invitationData.eventDetails.actionVisibility.rsvp, true);
    assert.equal(generations.length, 1, "editing guest details and publishing reuse the artwork");
    await page.goto(`${origin}/livacards-invites?edit=${stored.id}`);
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
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Your Live Card is updated.", { exact: true }).waitFor();
    assert.equal(stored.data.description, "Updated welcome\n\nBring a jacket.");
    assert.equal(generations.length, 1);
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await openSection("Basics");
    const beforeTitleEdits = headlines.length;
    const beforeTitleSaves = saves.length;
    await page.getByLabel("Event title or name").fill("Superseded title");
    holdHeadline = true;
    const drawingHeadline = new Promise((resolve) => { headlineStarted = resolve; });
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await drawingHeadline;
    await page.getByRole("complementary", { name: "Artwork preview" }).getByText("Drawing your title and opening line…", { exact: true }).waitFor();
    await page.getByLabel("Event title or name").fill("Updated title");
    releaseHeadline();
    await page.getByText("Your title or design changed while the lettering was being drawn. Select Review to prepare the latest version.", { exact: true }).waitFor();
    assert.equal(headlines.length, beforeTitleEdits + 1, "a stale title result does not start another paid request automatically");
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Updated title");
    assert.equal(saves.length, beforeTitleSaves, "lettering preparation never saves progress");
    failHeadline = true;
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByText("The title artwork could not be verified. Your card is unchanged. Select Review to try again.", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Event title or name").inputValue(), "Updated title");
    failHeadline = false;
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("region", { name: "Review your Live Card", exact: true }).waitFor();
    assert.equal(headlines.at(-1).form.title, "Updated title");
    assert.equal(
      await page.getByRole("button", { name: "Save & go to dashboard", exact: true }).isDisabled(),
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
    const downloadEvent = page.waitForEvent("download");
    await page.evaluate(() => { window.__cardDraws = []; });
    await page.getByRole("button", { name: "Download invitation", exact: true }).click();
    const download = await downloadEvent;
    await download.saveAs(path.join(out, "invitation-download.webp"));
    const printedText = await page.evaluate(() => window.__cardDraws.join("\n"));
    assert.match(printedText, /7:30 PM/, "download uses the corrected event time");
    assert.doesNotMatch(printedText, /6:00 PM|4:00 PM/, "download never reuses stale time text");
    assert.doesNotMatch(printedText, /Updated title|You're invited|Updated welcome|Bring a jacket/, "generated title is reused as artwork and Overview-only wording is not printed");
    assert.equal(headlines.length, headlineCount, "logistics and downloads never regenerate title artwork");
    const decoded = await sharp(path.join(out, "invitation-download.webp")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decodedUrls = [];
    for (const box of [{ left: 550, top: 2350, width: 400, height: 400 }, { left: 1100, top: 2350, width: 400, height: 400 }]) {
      const pixels = await sharp(decoded.data, { raw: { width: decoded.info.width, height: decoded.info.height, channels: 4 } }).extract(box).raw().toBuffer();
      const code = jsQR(new Uint8ClampedArray(pixels), box.width, box.height);
      if (code) decodedUrls.push(code.data);
    }
    assert.ok(decodedUrls.includes("https://example.com/gifts"), "the exported Registry QR code decodes to its actual URL");
    assert.ok(decodedUrls.includes("https://envitefy.com/event/movie-night"), "the exported Live Card QR code opens the published public URL");
    assert.equal(generations.length, generationCount, "downloading only composes existing artwork and current text");
    assert.equal(saves.length, savesBeforePreviews, "previews and downloading do not save the event");
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
    await dialog.getByRole("button", { name: "RSVP", exact: true }).waitFor();
    await page.getByRole("button", { name: "Close preview", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Your Live Card is updated.", { exact: true }).waitFor();
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
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(out, `review-${viewport.width}.png`), fullPage: true });
      await page.getByRole("button", { name: "2 Event details", exact: true }).click();
      for (const name of ["Basics", "When & Where", "RSVP", "Registry"]) {
        await openSection(name);
        await checkRightHandPreview();
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
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.screenshot({
        path: path.join(out, `details-${viewport.width}.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByRole("button", { name: "Preview Live Card", exact: true }).click();
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
      for (const button of await dialog.locator("[data-live-card-trigger]").all()) {
        const buttonBounds = await button.boundingBox();
        assert.ok(buttonBounds.y > bounds.y + bounds.height * 0.5, "buttons stay in the bottom of the card");
        assert.ok(buttonBounds.height >= 44, "buttons have comfortable tap targets");
        assert.ok(buttonBounds.y + buttonBounds.height <= bounds.y + bounds.height + 1, "buttons remain inside the artwork");
      }
      assert.equal(await dialog.getByRole("group", { name: "Preview view", exact: true }).count(), 0);
      await page.screenshot({ path: path.join(out, `preview-${viewport.width}.png`) });
      await page.getByRole("button", { name: "Close preview", exact: true }).click();
      await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    }
    await page.getByLabel("Message to guests (optional)").fill("Updated welcome for our guests");
    await page.locator("#leave").click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "Updated welcome for our guests");
    const savesBeforeAutomaticCleanup = saves.length;
    const generationsBeforeAutomaticCleanup = generations.length;
    failProofread = true;
    await page.getByLabel("Message to guests (optional)").fill("A movie and dinner with freinds.");
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
    await page.getByText("We couldn’t finish preparing your Live Card. Your details are safe. Please try again.", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Message to guests (optional)").inputValue(), "A movie and dinner with freinds.");
    failProofread = false;
    holdProofread = true;
    const proofreading = new Promise((resolve) => { proofreadStarted = resolve; });
    await page.getByRole("button", { name: "3 Review", exact: true }).click();
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
    page.once("dialog", (dialog) => dialog.accept());
    await page.goto(`${origin}/livacards-invites`);
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
