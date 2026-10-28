import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { chromium } from "playwright";

test("Live Card generation has one working cancel action and no timing diagnostics on desktop and phones", { timeout: 60000 }, async () => {
  execSync("bun scripts/build-livecard-builder-fixture.mjs", { timeout: 60000, stdio: "pipe" });
  const out = path.resolve("output/livecard-builder");
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (["/entry.js", "/entry.css", "/global.css"].includes(pathname)) {
      res.setHeader("Content-Type", pathname.endsWith(".js") ? "text/javascript" : "text/css");
      res.end(await fs.readFile(path.join(out, pathname.slice(1))));
    } else if (pathname.startsWith("/fonts/")) res.end(await fs.readFile(path.join("public", pathname)));
    else { res.setHeader("Content-Type", "text/html"); res.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>'); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    for (const viewport of [{ width: 1440, height: 1080 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const page = await browser.newPage({ viewport });
      let cancelled = 0;
      const job = { id: `progress-${viewport.width}`, state: "running", stage: "lettering", mode: "generate", created_at: new Date().toISOString(), attempt: 1, elapsed_ms: 51000 };
      await page.route("**/api/**", async route => {
        if (new URL(route.request().url()).pathname.endsWith("/location")) return route.fulfill({ json: { location: { ...route.request().postDataJSON(), venue: "The Garden Room", address: "123 Test Lane", timezone: "UTC", resolution: "manual" } } });
        if (new URL(route.request().url()).pathname.endsWith("/jobs")) {
          if (route.request().method() === "PATCH") { cancelled++; job.state = "cancel_requested"; }
          return route.fulfill({ json: { job } });
        }
        return route.fulfill({ json: {} });
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.getByLabel("Event title", { exact: true }).fill("Cheers to 30");
      await page.getByLabel("Describe the look").fill("Colorful garden birthday party");
      await page.getByLabel("Event date", { exact: true }).fill("2027-11-15");
      await page.getByLabel("Start time", { exact: true }).fill("18:30");
      await page.getByLabel("Venue name", { exact: true }).fill("The Garden Room");
      await page.getByRole("button", { name: "Generate invitation", exact: true }).click();
      if (viewport.width <= 850) {
        const dialog = page.getByRole("dialog", { name: "Preview your Live Card", exact: true });
        assert.equal(await dialog.count(), 0, "generation leaves guest details available");
        await page.getByRole("button", { name: "Preview card", exact: true }).click();
        await dialog.waitFor();
        await dialog.getByRole("heading", { name: "Creating your design", exact: true }).waitFor();
        await dialog.getByRole("button", { name: "Cancel generation", exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Cancel generation", exact: true }).count(), 1, "one accessible cancellation control in the loading viewer");
        await dialog.evaluate(async node => { await Promise.all(node.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))); });
        await page.screenshot({ path: path.join(out, `generation-viewer-${viewport.width}.png`) });
        await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: "Preview card", exact: true }).waitFor();
        assert.equal(await page.locator('[aria-label="Card wording preview"]').isVisible(), false, "phone loading words stay in the card viewer, not above the form");
      } else {
        const editor = await page.locator("form").boundingBox();
        const card = await page.getByRole("complementary", { name: "Artwork preview", exact: true }).boundingBox();
        assert.ok(card.x >= editor.x + editor.width - 1, "the loading card stays to the right of Event details");
        assert.ok(card.height >= 300, "the loading preview retains a portrait card frame");
        const slot = await page.locator("[data-builder-artwork-slot]").first().boundingBox();
        assert.ok(Math.abs(slot.width / slot.height - 2 / 3) < .01, "the loading card already uses the final 2:3 composition");
      }
      const preparing = page.getByRole("region", { name: "Preparing your Live Card", exact: true });
      await preparing.waitFor();
      const cancel = page.getByRole("button", { name: "Cancel generation", exact: true });
      assert.equal(await cancel.count(), 1);
      assert.equal(await preparing.getByRole("button", { name: "Cancel", exact: true }).count(), 0);
      assert.doesNotMatch(await page.locator("body").innerText(), /· attempt \d|seconds elapsed|· started/);
      await page.screenshot({ path: path.join(out, `generation-progress-${viewport.width}.png`), fullPage: true });
      if (viewport.width <= 850) {
        await page.getByRole("button", { name: "Preview card", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Preview your Live Card", exact: true });
        await dialog.waitFor();
        if (viewport.width !== 320) {
          await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
          await dialog.waitFor({ state: "hidden" });
        }
      }
      await cancel.click();
      if (viewport.width === 320) await page.getByRole("dialog", { name: "Preview your Live Card", exact: true }).waitFor({ state: "hidden" });
      assert.equal(cancelled, 1, "one click requests durable cancellation exactly once");
      await cancel.waitFor({ state: "hidden" });
      await preparing.waitFor({ state: "hidden" });
      await page.close();
    }
  } finally {
    await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});
