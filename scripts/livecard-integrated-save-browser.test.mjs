import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import sharp from "sharp";
const load = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");

test("integrated card preserves its composed pixels, verified wording and renderer through phone/desktop save and reload", {
  timeout: 90000,
}, async () => {
  execFileSync("bun", ["scripts/build-livecard-builder-fixture.mjs"], {
    timeout: 60000,
    stdio: "pipe",
  });
  const bytes = await sharp({
    create: { width: 100, height: 150, channels: 3, background: "#302041" },
  })
    .webp()
    .toBuffer();
  const imageUrl = `data:image/webp;base64,${bytes.toString("base64")}`;
  const { createLiveCardForm, sharedCardDesignKey } = load("src/lib/livecard-builder.ts");
  const form = {
    ...createLiveCardForm(),
    title: "MIDNIGHT BLOOM",
    headlineIntro: "Sofía’s 30th",
    design: "Sculpted chrome lettering within purple peonies",
    date: "2027-09-18",
    startTime: "19:00",
    timezone: "America/Chicago",
    locations: [
      {
        id: "primary",
        venue: "The Garden Room",
        address: "123 Test Lane",
        query: "The Garden Room",
        timezone: "America/Chicago",
        resolution: "manual",
      },
    ],
  };
  const design = {
    version: 1,
    composition: "integrated-v1",
    backgroundUrl: imageUrl,
    font: "classic",
    ink: "#ffffff",
    accent: "#ffffff",
    surface: "#302041",
    headline: {
      renderer: "artwork-v1",
      wordingVerified: true,
      imageUrl,
      title: form.title,
      intro: form.headlineIntro,
      validation: { status: "passed", issues: [], visibleText: [form.title, form.headlineIntro] },
    },
  };
  let stored = {
    id: "integrated-card",
    public_slug: "midnight-bloom",
    title: form.title,
    data: {
      createdVia: "livecard-builder",
      status: "draft",
      isDraft: true,
      rsvpEnabled: false,
      liveCardBuilder: { version: 3, form, designKey: sharedCardDesignKey(form) },
      studioCard: {
        imageUrl,
        invitationData: {
          title: form.title,
          headlineIntro: form.headlineIntro,
          heroTextMode: "image",
          sharedDesign: design,
        },
      },
    },
  };
  const assets = new Map();
  let jobs = 0;
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (assets.has(pathname)) {
      res.setHeader("Content-Type", "image/webp");
      res.end(assets.get(pathname));
      return;
    }
    if (["/entry.js", "/entry.css", "/global.css"].includes(pathname)) {
      res.setHeader("Content-Type", pathname.endsWith(".js") ? "text/javascript" : "text/css");
      res.end(await fs.readFile(path.join("output/livecard-builder", pathname.slice(1))));
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  server.unref();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 850 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (url.pathname.endsWith("/jobs") || url.pathname.endsWith("/headline")) {
        jobs++;
        return route.fulfill({
          status: 500,
          json: { error: "Saving verified artwork must not regenerate lettering" },
        });
      }
      if (url.pathname.startsWith("/api/history")) {
        if (req.method() !== "GET")
          stored = { ...req.postDataJSON(), id: "integrated-card", public_slug: "midnight-bloom" };
        return route.fulfill({ json: stored });
      }
      if (url.pathname === "/api/upload") {
        const body = await new Response(req.postDataBuffer(), {
          headers: { "content-type": req.headers()["content-type"] },
        }).formData();
        const name = `/asset-${assets.size}.webp`;
        assets.set(name, Buffer.from(await body.get("file").arrayBuffer()));
        return route.fulfill({
          json: {
            ok: true,
            stored: { display: { url: origin + name } },
            eventMedia: { thumbnail: origin + name },
          },
        });
      }
      return route.fulfill({ json: {} });
    });
    await page.goto(`${origin}/?edit=integrated-card`);
    await page.getByRole("button", { name: "Preview card", exact: true }).click();
    const viewer = page.getByRole("dialog", { name: "Preview your Live Card", exact: true });
    await viewer.waitFor();
    assert.equal(await viewer.locator("img").first().getAttribute("src"), imageUrl);
    assert.equal(
      await page.getByRole("button", { name: "Update card text", exact: true }).count(),
      0,
    );
    await viewer.getByRole("button", { name: "Close preview", exact: true }).click();
    await page.getByRole("button", { name: "Message to guests (optional)", exact: true }).click();
    await page
      .getByLabel("Message to guests (optional)", { exact: true })
      .fill("Keep this behind Overview.");
    await page.getByRole("button", { name: "Preview card", exact: true }).click();
    await viewer.waitFor();
    await viewer.getByRole("button", { name: "Save draft", exact: true }).click();
    await viewer.getByText("Draft saved. Find it in Drafts anytime.", { exact: true }).waitFor();
    await viewer.waitFor({ state: "hidden" });
    const saved = stored.data.studioCard.invitationData.sharedDesign;
    assert.equal(saved.composition, "integrated-v1");
    assert.equal(saved.headline.renderer, "artwork-v1");
    assert.equal(saved.headline.wordingVerified, true);
    assert.equal(saved.headline.layerUrl, undefined);
    assert.ok(assets.get(new URL(saved.headline.imageUrl, origin).pathname).equals(bytes));
    assert.equal(stored.data.liveCardBuilder.form.overview, "Keep this behind Overview.");
    assert.equal(jobs, 0);
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.reload();
    await page.locator(`aside img[src="${saved.headline.imageUrl}"]`).first().waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Update card text", exact: true }).count(),
      0,
    );
    assert.equal(jobs, 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
