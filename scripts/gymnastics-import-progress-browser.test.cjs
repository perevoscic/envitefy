const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const buildBunFixture = require("./lib/build-bun-fixture.cjs");

test("gymnastics imports use one responsive progress dialog and open the core draft before artwork completes", { timeout: 150000 }, async () => {
  buildBunFixture("scripts/build-gymnastics-import-progress-fixture.mjs");
  const output = path.resolve("output/gymnastics-import-progress");
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const css = fs.readFileSync(path.join(output, "fixture.css"), "utf8");
  const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (fs.existsSync(chromium.executablePath()) ? chromium.executablePath() : chrome) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(12000);
  const errors = [], intakes = [], cancels = [], polls = [];
  let ready = false, fail = false, holdIntake = false;
  const held = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/discovery/intake") {
      const id = `import-${intakes.length + 1}`;
      intakes.push({ id, body: request.postData(), contentType: request.headers()["content-type"] });
      if (holdIntake) await new Promise(resolve => held.push(resolve));
      return route.fulfill(fail ? { status: 503, json: { error: "Source could not be read." } } : { json: { eventId: id, discoveryId: `discovery-${id}` } }).catch(() => {});
    }
    if (/\/api\/discovery\/[^/]+\/run$/.test(url.pathname)) return route.fulfill({ status: 202, json: { accepted: true } });
    if (/\/api\/discovery\/[^/]+\/status$/.test(url.pathname)) {
      polls.push(url.pathname);
      return route.fulfill({ json: { processingStage: ready ? "enrich" : "parse", lastSuccessfulStage: ready ? "map" : "extract", draftReady: ready, builderReady: false, artwork: { status: "generating" } } });
    }
    if (/\/api\/discovery\/[^/]+\/cancel$/.test(url.pathname)) { cancels.push(url.pathname); return route.fulfill({ json: { cancelled: true } }); }
    if (url.pathname.startsWith("/api/")) throw Error(`Unexpected API request: ${url.pathname}`);
    if (/\.(woff2?|ttf|jpe?g|png|webp)$/.test(url.pathname)) return route.abort();
    return route.fulfill({ contentType: "text/html", body: `<!doctype html><html class="${url.searchParams.has("dark") ? "dark" : ""}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css} :root{--card:#fff;--card-foreground:#292038;--foreground:#292038;--border:#d8d0e1;--muted:#eee9f4} html.dark{--card:#282334;--card-foreground:#f6efff;--foreground:#f6efff;--border:#655775;--muted:#393044}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:var(--card);color:var(--foreground)}body>div>main{padding:24px}button:focus-visible{outline:2px solid currentColor;outline-offset:3px}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
  });
  const dialog = page.getByRole("dialog", { name: "Importing meet details", exact: true });
  async function open(width, dark, variant = "panel") {
    ready = false; fail = false; holdIntake = false;
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`http://import-progress.test/?variant=${variant}${dark ? "&dark" : ""}`);
  }
  const visibleUrl = () => page.getByRole("textbox", { name: "Public meet URL", exact: true }).filter({ visible: true });
  async function startLink() {
    await visibleUrl().fill("https://organizer.test/meet");
    await visibleUrl().press("Enter");
    await dialog.waitFor();
  }
  try {
    for (const width of [1440, 390, 320]) for (const dark of [false, true]) {
      await open(width, dark);
      await startLink();
      await dialog.getByRole("progressbar").waitFor();
      assert.equal(await page.getByRole("button", { name: "Cancel import", exact: true }).count(), 1);
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= 845);
      if (width < 768) { assert.equal(Math.round(bounds.width), width); assert.equal(Math.round(bounds.height), 844); }
      else { assert.ok(bounds.width <= 480 && bounds.height < 450); await page.mouse.click(8, 8); assert.equal(await dialog.isVisible(), true); }
      await page.keyboard.press("Tab");
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, "keyboard focus stays in the modal");
      await page.screenshot({ path: path.join(output, `progress-${width}-${dark ? "dark" : "light"}.png`) });
      if (width === 320 && dark) {
        await page.setViewportSize({ width, height: 460 });
        const enlarged = await page.addStyleTag({ content: '[role="dialog"] p { font-size: 28px; } [role="dialog"] button { font-size: 18px; }' });
        const cancelBox = await dialog.getByRole("button", { name: "Cancel import", exact: true }).boundingBox();
        assert.ok(cancelBox.y >= 0 && cancelBox.y + cancelBox.height <= 461, "Cancel stays visible with enlarged text and a short phone viewport");
        assert.equal(await dialog.evaluate(element => element.scrollWidth > element.clientWidth), false);
        await page.screenshot({ path: path.join(output, "progress-320-large-type.png") });
        await enlarged.evaluate(element => element.remove());
        await page.setViewportSize({ width, height: 844 });
      }
      const beforeCancel = cancels.length;
      await dialog.getByRole("button", { name: "Cancel import", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === null && document.activeElement?.getAttribute("type") === "url");
      assert.ok(cancels.length === beforeCancel || cancels.length === beforeCancel + 1);
      assert.equal(await page.locator("[data-destination]").count(), 0);
    }
    // Escape cancels a real pipeline, and a subsequent import starts cleanly.
    await open(1440, false);
    await startLink();
    await page.waitForRequest("**/api/discovery/*/status");
    const beforeEscape = cancels.length;
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.waitForTimeout(50);
    assert.equal(cancels.length, beforeEscape + 1);
    await startLink();
    const beforeDraft = cancels.length;
    const beforeHandoff = intakes.length;
    await page.evaluate(() => { window.fixtureNavigationDelay = 800; });
    ready = true;
    await page.waitForFunction(() => window.navigations?.length > 0);
    assert.equal(await dialog.isVisible(), true, "progress remains visible until the editor actually mounts");
    assert.equal(await dialog.getByRole("button", { name: "Cancel import", exact: true }).isDisabled(), true, "the completed import cannot be cancelled during navigation");
    await page.locator('input[type="url"]').evaluate(input => input.form.requestSubmit());
    assert.equal(intakes.length, beforeHandoff);
    await page.getByRole("heading", { name: "Editable meet draft", exact: true }).waitFor();
    assert.equal(await dialog.count(), 0);
    assert.equal(cancels.length, beforeDraft, "navigation never cancels the background import/image job");
    assert.equal(new URL(await page.locator("[data-destination]").getAttribute("data-destination"), "http://fixture").searchParams.get("templateId"), "moonbeam-balance");
    await page.getByText("Generating your image…", { exact: true }).waitFor();

    // Packet selection shows the same modal before the upload has responded.
    await open(390, true);
    holdIntake = true;
    await page.getByRole("button", { name: "Upload packet", exact: true }).click();
    await page.getByLabel("Meet packet", { exact: true }).setInputFiles({ name: "meet-packet.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nfixture") });
    await dialog.waitFor();
    await dialog.getByText("Uploading meet file...", { exact: true }).first().waitFor();
    assert.equal(await dialog.getByRole("button").count(), 1);
    assert.ok(intakes.at(-1).body.includes("meet-packet.pdf"));
    await dialog.getByRole("button", { name: "Cancel import", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("button", { name: "Upload packet", exact: true }).evaluate(element => element === document.activeElement), true);
    held.splice(0).forEach(resolve => resolve());
    await page.getByLabel("Meet packet", { exact: true }).setInputFiles({ name: "meet-packet.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nfixture") });
    await dialog.waitFor();
    await page.waitForTimeout(50);
    ready = true; holdIntake = false; held.splice(0).forEach(resolve => resolve());
    await page.getByRole("heading", { name: "Editable meet draft", exact: true }).waitFor();

    // Legacy launcher pages also submit with Enter and expose no inline Cancel copies.
    await open(1440, false, "page");
    await startLink();
    assert.equal(await page.getByRole("button", { name: /Cancel (?:import|upload|sync)/ }).count(), 1);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    // An invalid URL never opens progress or submits a source.
    await open(390, false);
    const beforeInvalid = intakes.length;
    await visibleUrl().fill("javascript:alert(1)");
    await visibleUrl().press("Enter");
    await page.getByText("Enter a valid URL.", { exact: true }).waitFor();
    assert.equal(await dialog.count(), 0);
    assert.equal(intakes.length, beforeInvalid);

    // Repeated submissions in one browser event still start only one import.
    await visibleUrl().fill("https://organizer.test/meet");
    holdIntake = true;
    await visibleUrl().evaluate(input => { input.form.requestSubmit(); input.form.requestSubmit(); });
    await dialog.waitFor();
    await page.waitForTimeout(50);
    assert.equal(intakes.length, beforeInvalid + 1);
    await dialog.getByRole("button", { name: "Cancel import", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    holdIntake = false;
    const beforeRetry = intakes.length;
    await startLink();
    held.splice(0).forEach(resolve => resolve());
    await page.waitForTimeout(100);
    assert.equal(await dialog.isVisible(), true, "a cancelled attempt cannot close its replacement popup");
    assert.equal(intakes.length, beforeRetry + 1);
    await dialog.getByRole("button", { name: "Cancel import", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });

    await open(390, false);
    fail = true;
    holdIntake = true;
    await startLink();
    held.splice(0).forEach(resolve => resolve());
    await dialog.waitFor({ state: "hidden" });
    await page.getByText("Source could not be read.", { exact: true }).waitFor();
    assert.equal(await visibleUrl().inputValue(), "https://organizer.test/meet");
    assert.deepEqual(errors, []);
  } finally { held.splice(0).forEach(resolve => resolve()); await browser.close(); }
});
