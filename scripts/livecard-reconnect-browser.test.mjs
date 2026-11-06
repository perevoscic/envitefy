import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import buildBunFixture from "./lib/build-bun-fixture.cjs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
const require = createRequire(import.meta.url);
const loadTs = require("./lib/event-messages-test-loader.cjs");

test("artistic font cards recover HTML status and ambiguous starts without duplicate generation on phones", { timeout: 90000 }, async () => {
  buildBunFixture("scripts/build-livecard-builder-fixture.mjs");
  const image = await sharp({ create: { width: 1000, height: 1500, channels: 3, background: "#ddd3b7" } }).png().toBuffer();
  const { renderCardFontLettering } = loadTs("src/lib/card-font-lettering.ts");
  const design = { version: 1, backgroundUrl: `data:image/png;base64,${image.toString("base64")}`, typography: "botanical", font: "classic", ink: "#24482e", accent: "#ac7d22", surface: "#fff8ed" };
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
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
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
    const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
    let job, requests = [], starts = 0, reads = 0;
    await page.route("**/api/**", async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.pathname.endsWith("/assist")) return route.fulfill({ status: 503, json: { error: "Optional check unavailable" } });
      if (url.pathname.endsWith("/location")) return route.fulfill({ json: { location: { ...req.postDataJSON(), venue: "The Garden Room", address: "123 Test Lane", timezone: "UTC", resolution: "manual" } } });
      if (!url.pathname.endsWith("/jobs")) return route.fulfill({ json: {} });
      if (req.method() === "POST") {
        const input = req.postDataJSON(); requests.push(input);
        if (!job) {
          starts++;
          const result = await renderCardFontLettering(image, input.form, design);
          job = { id: "original-job", state: "ready", stage: "ready", mode: input.mode, form: input.form, created_at: new Date().toISOString(), design: { ...design, headline: { renderer: "font-v1", title: input.form.title, intro: input.form.headlineIntro, imageUrl: `data:image/webp;base64,${result.composite.toString("base64")}`, layerUrl: `data:image/webp;base64,${result.layer.toString("base64")}`, layout: result.layout, validation: { status: "passed", issues: [] } } } };
          return route.fulfill({ status: 502, contentType: "text/html", body: "<!DOCTYPE html><html>Unknown outcome</html>" });
        }
        assert.equal(input.key, requests[0].key, "ambiguous start retries reuse the exact key");
        return route.fulfill({ status: 202, json: { job: { ...job, state: "running", stage: "lettering" } } });
      }
      assert.equal(url.searchParams.get("id"), "original-job"); reads++;
      if (reads <= 2) return route.fulfill({ status: reads === 1 ? 502 : 200, contentType: "text/html", body: "<!DOCTYPE html><html>Proxy response</html>" });
      return route.fulfill({ json: { job } });
    });
    await page.goto(origin);
    await page.getByLabel("Event title", { exact: true }).fill("Comets Team Celebration");
    await page.getByRole("button", { name: "Add an opening line (optional)", exact: true }).click();
    await page.getByLabel("Opening line (optional)", { exact: true }).fill("Read, relax, and connect");
    await page.getByLabel("Describe the look").fill("A botanical tropical garden");
    await page.getByLabel("Event date", { exact: true }).fill("2027-11-15");
    await page.getByLabel("Start time", { exact: true }).fill("18:30");
    await page.getByLabel("Venue name", { exact: true }).fill("The Garden Room");
    await page.getByRole("button", { name: "Generate invitation", exact: true }).click();
    assert.equal(await page.getByRole("dialog", { name: "Preview your Live Card", exact: true }).count(), 0, "guest details stay open during generation");
    await page.getByText(/Could not confirm the artwork request/).waitFor();
    assert.doesNotMatch(await page.locator("body").innerText(), /Unexpected token|DOCTYPE/);
    await page.reload();
    await page.getByText("Artwork request confirmation was interrupted. Reconnect to check the original request.", { exact: true }).waitFor();
    assert.equal(requests.length, 1, "refresh does not automatically replay an uncertain start");
    await page.getByRole("button", { name: "Reconnect to artwork", exact: true }).click();
    await page.getByRole("region", { name: "Artwork job status", exact: true }).getByText("Connection interrupted. Reconnecting to your artwork…", { exact: true }).waitFor();
    await page.getByRole("region", { name: "Artwork job status", exact: true }).getByText("Connection interrupted. Reconnecting to your artwork…", { exact: true }).waitFor({ state: "hidden", timeout: 15000 });
    await page.getByRole("region", { name: "Artwork job status", exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Preview card", exact: true }).waitFor({ timeout: 15000 });
    assert.equal(starts, 1); assert.equal(requests.length, 2); assert.equal(reads, 3);
    await page.getByRole("button", { name: "Preview card", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Preview your Live Card", exact: true });
    await dialog.waitFor();
    await dialog.evaluate(async node => {
      await Promise.all(node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    assert.equal(await dialog.locator("img").first().getAttribute("src"), job.design.headline.imageUrl, "preview uses the exact locally rendered title and opening line");
    const cardBounds = await dialog.boundingBox();
    assert.ok(cardBounds.x >= 0 && cardBounds.x + cardBounds.width <= 320 && cardBounds.y >= 0 && cardBounds.y + cardBounds.height <= 800, "the settled phone artwork fits on screen");
    assert.ok(cardBounds.width >= 288, "the 320px phone retains the full preview width");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await fs.mkdir("output/livecard-reconnect-browser", { recursive: true });
    await page.screenshot({ path: "output/livecard-reconnect-browser/phone-320.png" });
    await context.close();

    const secondContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const second = await secondContext.newPage(); second.on("pageerror", error => errors.push(error.message));
    let authenticated = false, secondStarts = 0, upgraded = false;
    const secondModes = [];
    await second.route("**/api/**", async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.pathname.endsWith("/location")) return route.fulfill({ json: { location: { ...req.postDataJSON(), venue: "The Garden Room", address: "123 Test Lane", timezone: "UTC", resolution: "manual" } } });
      if (!url.pathname.endsWith("/jobs")) return route.fulfill({ json: {} });
      if (req.method() === "POST") {
        secondStarts++; const input = req.postDataJSON(); secondModes.push(input.mode);
        if (input.mode === "repair") { upgraded = true; assert.equal(input.design.backgroundUrl, design.backgroundUrl, "legacy upgrade reuses the existing background"); }
        return route.fulfill({ status: 202, json: { job: { ...job, mode: input.mode, state: "running", stage: "lettering" } } });
      }
      if (!authenticated) return route.fulfill({ status: 401, contentType: "text/html", body: "<html>Login</html>" });
      return route.fulfill({ json: { job: { ...job, mode: upgraded ? "repair" : "generate", design: { ...job.design, headline: { ...job.design.headline, renderer: upgraded ? "font-v1" : undefined } } } } });
    });
    await second.goto(origin);
    await second.getByLabel("Event title", { exact: true }).fill("Comets Team Celebration");
    await second.getByRole("button", { name: "Add an opening line (optional)", exact: true }).click();
    await second.getByLabel("Opening line (optional)", { exact: true }).fill("Read, relax, and connect");
    await second.getByLabel("Describe the look").fill("A botanical tropical garden");
    await second.getByLabel("Event date", { exact: true }).fill("2027-11-15");
    await second.getByLabel("Start time", { exact: true }).fill("18:30");
    await second.getByLabel("Venue name", { exact: true }).fill("The Garden Room");
    await second.getByRole("button", { name: "Generate invitation", exact: true }).click();
    assert.equal(await second.getByRole("dialog", { name: "Preview your Live Card", exact: true }).count(), 0, "guest details stay open during generation");
    await second.getByText("Sign in again, then reconnect to your artwork.", { exact: true }).waitFor();
    assert.equal(await second.getByRole("button", { name: "Retry design", exact: true }).count(), 0);
    authenticated = true;
    await second.getByRole("button", { name: "Reconnect to artwork", exact: true }).click();
    await second.getByRole("button", { name: "Preview card", exact: true }).waitFor();
    assert.equal(secondStarts, 1, "manual authentication recovery uses GET on the same job");
    await Promise.all([
      second.waitForResponse(response => new URL(response.url()).pathname.endsWith("/jobs") && response.request().method() === "POST"),
      second.getByRole("button", { name: "Improve text readability", exact: true }).click(),
    ]);
    await second.getByRole("button", { name: "Improve text readability", exact: true }).waitFor({ state: "hidden" });
    await second.getByRole("button", { name: "Cancel generation", exact: true }).waitFor({ state: "hidden" });
    assert.deepEqual(secondModes, ["generate", "repair"], "legacy text upgrades explicitly without regenerating the background");
    assert.deepEqual(errors, []);
    await secondContext.close();

    const thirdContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const third = await thirdContext.newPage();
    third.on("pageerror", error => errors.push(error.message));
    await third.clock.install();
    let failing = true, thirdStarts = 0, failedReads = 0;
    await third.route("**/api/**", async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.pathname.endsWith("/location")) return route.fulfill({ json: { location: { ...req.postDataJSON(), venue: "The Garden Room", address: "123 Test Lane", timezone: "UTC", resolution: "manual" } } });
      if (!url.pathname.endsWith("/jobs")) return route.fulfill({ json: {} });
      if (req.method() === "POST") { thirdStarts++; return route.fulfill({ status: 202, json: { job: { ...job, state: "running", stage: "lettering" } } }); }
      failedReads++;
      if (failing) return route.fulfill({ status: 503, contentType: "text/html", body: "<!DOCTYPE html><html>Unavailable</html>" });
      return route.fulfill({ json: { job } });
    });
    await third.goto(origin);
    await third.getByLabel("Event title", { exact: true }).fill("Comets Team Celebration");
    await third.getByRole("button", { name: "Add an opening line (optional)", exact: true }).click();
    await third.getByLabel("Opening line (optional)", { exact: true }).fill("Read, relax, and connect");
    await third.getByLabel("Describe the look").fill("A botanical tropical garden");
    await third.getByLabel("Event date", { exact: true }).fill("2027-11-15");
    await third.getByLabel("Start time", { exact: true }).fill("18:30");
    await third.getByLabel("Venue name", { exact: true }).fill("The Garden Room");
    await third.getByRole("button", { name: "Generate invitation", exact: true }).click();
    assert.equal(await third.getByRole("dialog", { name: "Preview your Live Card", exact: true }).count(), 0, "guest details stay open during generation");
    await third.getByRole("region", { name: "Artwork job status", exact: true }).getByText("Connection interrupted. Reconnecting to your artwork…", { exact: true }).waitFor();
    for (const [index, delay] of [2000, 4000, 8000, 15000].entries()) {
      await third.clock.runFor(delay + 50);
      await assert.doesNotReject(async () => {
        for (let n = 0; n < 100 && failedReads < index + 2; n++) await new Promise(resolve => setTimeout(resolve, 10));
        assert.equal(failedReads, index + 2);
      });
    }
    await third.getByText("The artwork connection is still unavailable. Reconnect to check the same job.", { exact: true }).waitFor();
    assert.equal(await third.getByRole("button", { name: "Retry design", exact: true }).count(), 0);
    failing = false;
    await third.getByRole("button", { name: "Reconnect to artwork", exact: true }).click();
    await third.getByRole("button", { name: "Preview card", exact: true }).waitFor();
    await third.getByRole("region", { name: "Artwork job status", exact: true }).waitFor({ state: "hidden" });
    assert.equal(thirdStarts, 1, "exhausted retries and manual recovery never POST another job");
    assert.equal(failedReads, 6);
    assert.deepEqual(errors, []);
    await thirdContext.close();
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
