const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const buildFixture = require("./lib/build-bun-fixture.cjs");

test("event navigation is compact, follows event paper and hides only on deliberate scrolling", { timeout: 90000 }, async () => {
  const built = buildFixture("scripts/build-event-navigation-fixture.mjs");
  const out = built.toString().match(/Built event navigation fixture in (.+)/)?.[1].trim();
  assert.ok(out, "the fixture reports its isolated output directory");
  const css = fs.readFileSync(path.join(out, "fixture.css"), "utf8");
  const bundle = fs.readFileSync(path.join(out, "event-navigation.js"), "utf8");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    for (const [width, height] of [[320, 844], [375, 844], [390, 844], [844, 390], [1023, 844], [1280, 844]]) for (const dark of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on("pageerror", error => { errors.push(error.message); console.error(error.message); });
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.hostname !== "event-navigation.test") return route.abort();
        if (url.pathname.endsWith(".js")) return route.fulfill({ contentType: "text/javascript", body: bundle });
        if (url.pathname.startsWith("/brand/")) {
          const filename = path.resolve("public", `.${url.pathname}`);
          if (!filename.startsWith(path.resolve("public") + path.sep) || !fs.existsSync(filename)) return route.abort();
          return route.fulfill({ body: fs.readFileSync(filename), contentType: "image/webp" });
        }
        return route.fulfill({ contentType: "text/html", body: `<!doctype html><html class="${dark ? "dark" : ""}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
      });
      await page.goto(`http://event-navigation.test/event/${width === 375 ? "gymnastics-meet" : "test-meet"}`);
      const header = page.locator('[data-app-mobile-topbar="app"]');
      await page.waitForFunction(() => document.documentElement.dataset.eventPageColor === "#111b3a");
      const scroll = async y => {
        await page.evaluate(y => window.scrollTo(0, y), y);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      };
      const hidden = expected => page.waitForFunction(expected => document.querySelector('[data-app-mobile-topbar="app"]').dataset.scrollHidden === String(expected), expected);
      if (width >= 1024) {
        assert.equal(await header.evaluate(el => getComputedStyle(el).display), "none");
        await scroll(220);
        await hidden(false);
      } else {
        const geometry = await header.evaluate(el => ({ height: el.getBoundingClientRect().height, background: getComputedStyle(el).backgroundColor, transition: getComputedStyle(el).transitionDuration }));
        assert.equal(geometry.height, 60, "event header takes 60px without a safe-area inset");
        assert.equal(geometry.background, "rgb(17, 27, 58)");
        if (dark) assert.equal(await header.locator(".nav-chrome-glass-header").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(37, 31, 45)");
        assert.equal(geometry.transition, "0s", "reduced motion removes the slide animation");
        const heroY = await page.getByTestId("hero").evaluate(el => el.getBoundingClientRect().top);
        assert.equal(heroY, 76, "event content clears the 60px header with its existing 16px section spacing");
        await page.screenshot({ path: path.join(out, `${width}-${dark ? "dark" : "light"}-dark-event.png`) });
        const button = page.getByRole("button", { name: "Open navigation", exact: true });
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44);
        if (width === 375) {
          const logo = page.getByRole("img", { name: "Envitefy Gymnastics", exact: true });
          await logo.evaluate(image => image.decode());
          const logoBox = await logo.boundingBox();
          assert.ok(logoBox.height <= 44 && logoBox.y >= 0 && logoBox.y + logoBox.height <= 60, "the complete category logo fits inside compact navigation");
        }
        await scroll(70); await hidden(false);
        await scroll(140); await hidden(true);
        assert.ok(await header.evaluate(el => el.getBoundingClientRect().bottom <= 0));
        await scroll(135); await hidden(true);
        await scroll(133); await hidden(true);
        await scroll(125); await hidden(false);
        assert.equal(await page.getByTestId("hero").evaluate(el => el.getBoundingClientRect().top + window.scrollY), heroY, "hiding never shifts document content");
        await scroll(210); await hidden(true);
        await button.focus(); await hidden(false);
        await scroll(260); await hidden(false);
        await button.click();
        await page.getByRole("button", { name: "Close navigation", exact: true }).click();
        await hidden(false);
        await page.evaluate(() => document.activeElement?.blur());
        await scroll(320); await hidden(true);
        await page.getByRole("button", { name: "Light event", exact: true }).evaluate(el => el.click());
        await hidden(false);
        assert.equal(await header.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(246, 241, 231)");
        await scroll(0); await hidden(false);
        await page.screenshot({ path: path.join(out, `${width}-${dark ? "dark" : "light"}.png`) });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        assert.equal(await header.evaluate(el => getComputedStyle(el).transitionDuration), "0.2s");
        await page.getByRole("button", { name: "Leave event", exact: true }).evaluate(el => el.click());
        await page.waitForFunction(() => !document.documentElement.hasAttribute("data-event-page-color"));
        assert.ok(await header.evaluate(el => el.getBoundingClientRect().height > 60), "app navigation restores its original spacing");
        await scroll(400); await hidden(false);
        assert.equal(await page.getByLabel("Unsaved event title").inputValue(), "Keep this title");
        if (width === 375) {
          await page.getByRole("button", { name: "Dark event", exact: true }).evaluate(el => el.click());
          await scroll(0);
          await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
          const bounds = await header.evaluate(el => {
            const box = el.getBoundingClientRect();
            return { width: box.width, scrollWidth: el.scrollWidth, controls: [...el.querySelectorAll("a,button")].map(control => {
              const rect = control.getBoundingClientRect();
              return { left: rect.left, right: rect.right, height: rect.height };
            }) };
          });
          assert.ok(bounds.scrollWidth <= bounds.width, "200% text size keeps navigation inside the phone");
          assert.ok(bounds.controls.every(control => control.left >= 0 && control.right <= width && control.height >= 44));
        }
      }
      assert.deepEqual(errors, []);
      if (width === 390 && dark) {
        await page.goto("http://event-navigation.test/event/test-meet?preview=1");
        const content = page.frameLocator("iframe");
        await content.getByRole("heading", { name: "Saved owner event content" }).waitFor();
        assert.equal((await page.locator("iframe").boundingBox()).y, 0, "the owner document fills the area behind the sliding header");
        const frame = page.frames().find(frame => frame !== page.mainFrame());
        const scrollFrame = async y => {
          await frame.evaluate(y => window.scrollTo(0, y), y);
          await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        };
        await scrollFrame(180); await hidden(true);
        assert.equal((await page.locator("iframe").boundingBox()).y, 0, "hiding leaves no empty navbar strip above the iframe");
        assert.equal(await page.evaluate(() => window.scrollY), 0, "the saved event scrolls inside its iframe");
        await scrollFrame(175); await hidden(true);
        await scrollFrame(160); await hidden(false);
        await scrollFrame(250); await hidden(true);
        await page.locator("iframe").evaluate(frame => { frame.srcdoc = frame.srcdoc; });
        await content.getByRole("heading", { name: "Saved owner event content" }).waitFor();
        await hidden(false);
        assert.deepEqual(errors, []);
      }
      await page.close();
    }
  } finally { await browser.close(); }
});
