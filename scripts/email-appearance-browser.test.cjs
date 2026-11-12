const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const { spawnSync } = require("node:child_process");
const sharp = require("sharp");
const fixtures = require("./lib/email-appearance-fixtures.cjs");

test("all email families render accessible text and white assets in light/dark inboxes", { timeout: 120_000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  const output = path.resolve("output/email-appearance");
  fs.mkdirSync(output, { recursive: true });
  try {
    const context = await browser.newContext();
    await context.route("https://**/*", route => {
      const url = new URL(route.request().url());
      const local = path.resolve("public", `.${url.pathname}`);
      if (url.hostname === "envitefy.com" && url.pathname.startsWith("/email/") && fs.existsSync(local)) return route.fulfill({ body: fs.readFileSync(local), contentType: local.endsWith(".png") ? "image/png" : local.endsWith(".gif") ? "image/gif" : "image/webp" });
      return route.abort();
    });
    const results = [];
    for (const fixture of await fixtures()) for (const mode of ["light", "dark", "outlook-dark"]) {
      const page = await context.newPage();
      await page.setViewportSize({ width: 600, height: 900 });
      await page.emulateMedia({ colorScheme: mode === "dark" ? "dark" : "light" });
      await page.setContent(fixture.html, { waitUntil: "load" });
      if (mode === "outlook-dark") await page.locator("body").evaluate(body => body.setAttribute("data-ogsc", ""));
      const failures = await page.evaluate(() => {
        const rgb = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
        const luminance = values => values.reduce((sum, value, index) => { const channel = value / 255; return sum + (channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][index]; }, 0);
        const failures = [];
        for (const node of document.querySelectorAll("body *")) {
          if (node.closest("[data-email-authored]")) continue;
          const text = [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join("").trim();
          if (!text || text === "|" || !node.getClientRects().length) continue;
          const style = getComputedStyle(node);
          if (style.visibility === "hidden" || style.opacity === "0") continue;
          let parent = node;
          while (parent && getComputedStyle(parent).backgroundColor === "rgba(0, 0, 0, 0)") parent = parent.parentElement;
          if (!parent) continue;
          const foreground = luminance(rgb(style.webkitTextFillColor || style.color));
          const background = luminance(rgb(getComputedStyle(parent).backgroundColor));
          const ratio = (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          if (ratio + .01 < (large ? 3 : 4.5)) failures.push({ text: text.slice(0, 90), color: style.color, background: getComputedStyle(parent).backgroundColor, ratio });
        }
        return failures;
      });
      assert.deepEqual(failures, [], `${fixture.name} (${mode}) text contrast`);
      const assets = await page.locator('img[src*="/email/white-v1/"],img[src*="/email/wordmark-v2/"]').evaluateAll(images => images.map(image => ({ src: image.src, loaded: image.complete && image.naturalWidth > 0 })));
      assert.ok(assets.length >= 7, `${fixture.name}: emblem, wordmark and five social icons`);
      assert.ok(assets.every(asset => asset.loaded), `${fixture.name}: all brand assets load`);
      assert.ok(assets.every(asset => asset.src.endsWith(".webp")), `${fixture.name}: WebP delivery assets`);
      for (const width of [320, 375, 600, 800]) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        const overflowing = overflow ? await page.evaluate(() => [...document.querySelectorAll("body *")].map(node => ({ tag: node.tagName, className: node.className, text: node.textContent.trim().slice(0, 40), width: node.getBoundingClientRect().width, x: node.getBoundingClientRect().x })).filter(node => node.width + node.x > innerWidth + 1).slice(-12)) : [];
        assert.equal(overflow, false, `${fixture.name} (${mode}, ${width}px) horizontal overflow: ${JSON.stringify(overflowing)}`);
        const distorted = await page.locator(".email-brand-band img").evaluateAll(images => images.filter(image => {
          const box = image.getBoundingClientRect();
          return Math.abs((box.width / box.height) / (image.naturalWidth / image.naturalHeight) - 1) > .01;
        }).map(image => image.src));
        assert.deepEqual(distorted, [], `${fixture.name} (${mode}, ${width}px) logo proportions`);
        if (fixture.name === "sendCoHostInvitationEmail" && [375, 800].includes(width)) {
          const filename = path.join(output, `cohost-${mode}-${width}.webp`);
          const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0", "-c:v", "libwebp", "-q:v", "85", "-compression_level", "6", filename], { input: await page.screenshot({ fullPage: true }) });
          assert.equal(encoded.status, 0, encoded.stderr?.toString());
        }
      }
      if (fixture.name === "sendCoHostInvitationEmail") {
        // Model an inbox that drops head CSS and recolors links in dark mode.
        await page.locator("style").evaluateAll(styles => { for (const style of styles) style.remove(); });
        await page.addStyleTag({ content: "a,span{color:#C0B3D0!important;}" });
        const button = await page.locator("[data-email-cta] .email-cta-label").evaluate(label => ({
          fill: getComputedStyle(label).webkitTextFillColor,
          background: getComputedStyle(label.closest("a")).backgroundImage,
          text: label.textContent,
        }));
        assert.deepEqual(button, { fill: "rgb(37, 16, 62)", background: "linear-gradient(rgb(197, 167, 255), rgb(197, 167, 255))", text: "Accept invitation" });
        const fallbackLogo = await page.locator('img[alt="Envitefy logo"]').evaluate(image => {
          image.removeAttribute("style");
          const box = image.getBoundingClientRect();
          return Math.abs((box.width / box.height) / (image.naturalWidth / image.naturalHeight) - 1);
        });
        assert.ok(fallbackLogo < .01, "logo HTML dimensions preserve proportions when inline CSS is stripped");
      }
      if (["standard-marketing", "features-oct26", "magazine-1", "sendSignupConfirmationEmail"].includes(fixture.name)) {
        const filename = path.join(output, `${fixture.name}-${mode}.webp`);
        const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0", "-c:v", "libwebp", "-q:v", "85", "-compression_level", "6", filename], { input: await page.screenshot({ fullPage: true }) });
        assert.equal(encoded.status, 0, encoded.stderr?.toString());
        assert.equal((await sharp(filename).metadata()).format, "webp");
      }
      results.push({ name: fixture.name, mode, assets: assets.length, textContrast: "pass" });
      await page.close();
    }
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
});
