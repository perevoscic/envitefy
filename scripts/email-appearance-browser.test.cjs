const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
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
      if (url.hostname === "envitefy.com" && url.pathname.startsWith("/email/") && fs.existsSync(local)) return route.fulfill({ body: fs.readFileSync(local), contentType: local.endsWith(".png") ? "image/png" : "image/webp" });
      return route.abort();
    });
    const results = [];
    for (const fixture of await fixtures()) for (const mode of ["light", "dark"]) {
      const page = await context.newPage();
      await page.setViewportSize({ width: 600, height: 900 });
      await page.emulateMedia({ colorScheme: mode });
      await page.setContent(fixture.html, { waitUntil: "load" });
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
          const foreground = luminance(rgb(style.color));
          const background = luminance(rgb(getComputedStyle(parent).backgroundColor));
          const ratio = (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          if (ratio + .01 < (large ? 3 : 4.5)) failures.push({ text: text.slice(0, 90), color: style.color, background: getComputedStyle(parent).backgroundColor, ratio });
        }
        return failures;
      });
      assert.deepEqual(failures, [], `${fixture.name} (${mode}) text contrast`);
      const assets = await page.locator('img[src*="white-v1"]').evaluateAll(images => images.map(image => ({ src: image.src, loaded: image.complete && image.naturalWidth > 0 })));
      assert.ok(assets.length >= 7, `${fixture.name}: emblem, wordmark and five social icons`);
      assert.ok(assets.every(asset => asset.loaded), `${fixture.name}: all brand assets load`);
      for (const width of [320, 375, 600]) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        const overflowing = overflow ? await page.evaluate(() => [...document.querySelectorAll("body *")].map(node => ({ tag: node.tagName, className: node.className, text: node.textContent.trim().slice(0, 40), width: node.getBoundingClientRect().width, x: node.getBoundingClientRect().x })).filter(node => node.width + node.x > innerWidth + 1).slice(-12)) : [];
        assert.equal(overflow, false, `${fixture.name} (${mode}, ${width}px) horizontal overflow: ${JSON.stringify(overflowing)}`);
      }
      if (["standard-marketing", "features-oct26", "magazine-1", "sendSignupConfirmationEmail"].includes(fixture.name)) await page.screenshot({ path: path.join(output, `${fixture.name}-${mode}.png`), fullPage: true });
      results.push({ name: fixture.name, mode, assets: assets.length, textContrast: "pass" });
      await page.close();
    }
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
});
