const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

async function settleControl(control) {
  await control.evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
  });
}

async function assertExpandedControl(control, text) {
  await settleControl(control);
  const result = await control.evaluate(element => {
    const label = element.querySelector("span");
    const icon = element.querySelector("svg");
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d");
    const luminance = color => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    };
    const ink = luminance(getComputedStyle(label).color);
    const contrast = ["--preview-gradient-from", "--preview-gradient-to"].map(property => {
      const background = luminance(style.getPropertyValue(property));
      return (Math.max(ink, background) + 0.05) / (Math.min(ink, background) + 0.05);
    });
    return { width: element.getBoundingClientRect().width, label: label.textContent.trim(), labelOpacity: getComputedStyle(label).opacity, iconOpacity: getComputedStyle(icon).opacity, gradientOpacity: getComputedStyle(element, "::before").opacity, gradient: getComputedStyle(element, "::before").backgroundImage, contrast };
  });
  assert.ok(result.width > 120, "hover or keyboard focus expands the icon into a labeled button");
  assert.equal(result.label, text);
  assert.equal(result.labelOpacity, "1");
  assert.equal(result.iconOpacity, "0");
  assert.equal(result.gradientOpacity, "1");
  assert.match(result.gradient, /linear-gradient/);
  assert.ok(result.contrast.every(ratio => ratio >= 4.5), "labels remain readable against both gradient endpoints");
}

async function assertToolbarIconSpacing(page) {
  await page.mouse.move(0, 0);
  await page.locator("header").evaluate(element => {
    if (element.contains(document.activeElement)) document.activeElement.blur();
  });
  await settleControl(page.locator("header"));
  const bounds = await page.locator("header").locator("button:visible, a:visible").evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  assert.equal(bounds.length, 8, "the toolbar contains two view controls and six event actions");
  for (let index = 0; index < bounds.length; index++) {
    assert.ok(Math.abs(bounds[index].width - 44) < 1 && Math.abs(bounds[index].height - 44) < 1, "all collapsed toolbar actions use equal 44px circles");
    if (index) assert.ok(Math.abs(bounds[index].x - bounds[index - 1].x - bounds[index - 1].width - 12) < 1, "every adjacent icon has the same 12px gap, including across groups");
  }
}

async function assertTabletControlPlacement(page, label) {
  const control = page.getByRole("button", { name: label, exact: true });
  const tablet = page.locator('[data-event-preview-frame="tablet"]:visible');
  const [button, screen, content] = await Promise.all([
    control.boundingBox(), tablet.locator("[data-event-preview-screen]").boundingBox(), tablet.locator("iframe").boundingBox(),
  ]);
  assert.ok(Math.abs(button.x + button.width / 2 - screen.x - screen.width / 2) < 1, "orientation control stays centered inside the iPad screen");
  assert.ok(button.y >= screen.y && button.y <= screen.y + 12, "orientation control stays at the top of the iPad screen");
  assert.ok(button.width >= 43.5 && button.height >= 43.5, "the control retains a 44px target when the device is scaled");
  assert.ok(content.y >= button.y + button.height, "the event starts below the orientation control");
  assert.equal(await control.evaluate(element => Boolean(element.closest("header"))), false, "the control no longer occupies the page toolbar");
}

test("device frames fit the stage, scroll event content and preserve responsive preview interactions", { timeout: 120000 }, async () => {
  const output = path.resolve("output/event-preview-frame-browser");
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-preview-frame.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "test" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: {
        "@": path.resolve("src"),
        "next/link": path.resolve("scripts/fixtures/concierge/navigation.tsx"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../components/EventPreviewViewport.tsx"; @source "../components/EventPreviewActions.tsx"; @source "../../scripts/fixtures/event-preview-frame.tsx";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath()) ? chromium.executablePath() : fs.existsSync(chrome) ? chrome : undefined) });
  try {
    const firstPaint = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await firstPaint.route("http://preview-first-paint.test/**", route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: fs.readFileSync(path.join(output, "fixture.js")) });
      if (pathname.startsWith("/images/event-preview/")) return route.fulfill({ contentType: "image/webp", body: fs.readFileSync(path.join("public", pathname)) });
      return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    });
    await firstPaint.goto("http://preview-first-paint.test/?serverMarkup&owner&dark");
    const initialControls = firstPaint.getByRole("group", { name: "Preview device", exact: true });
    assert.deepEqual(await initialControls.getByRole("button").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label"))), ["Desktop view", "Tablet and mobile view"], "server HTML shows the current desktop controls before hydration");
    assert.equal(await initialControls.getByRole("button", { name: "Tablet and mobile view", exact: true }).getAttribute("aria-pressed"), "true");
    await initialControls.screenshot({ path: path.join(output, "loading-toolbar.png") });
    await firstPaint.setViewportSize({ width: 820, height: 1180 });
    assert.deepEqual(await initialControls.getByRole("button").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label"))), ["Desktop view", "iPad / tablet view", "Mobile view"], "tablet controls also work before hydration");
    await firstPaint.close();
    for (const owner of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("http://preview-frame.test/**", route => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname.startsWith("/images/event-preview/")) return route.fulfill({ contentType: "image/webp", body: fs.readFileSync(path.join("public", pathname)) });
        if (pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: fs.readFileSync(path.join(output, "fixture.js")) });
        if (pathname === "/event-fixture") return route.fulfill({ contentType: "text/html", body: `<!doctype html><html data-owner-preview-open="true"><head><style>${css}</style></head><body><main data-app-main-content style="min-height:1800px;background:#111b3a;color:white;padding:24px"><h1>Saved event</h1><button style="margin-top:1500px">Saved event end</button></main></body></html>` });
        return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0"><div id="root"></div><script src="/fixture.js"></script></body></html>` });
      });
      await page.goto(`http://preview-frame.test/${owner ? "?owner&remote&dark" : ""}`);
      const primarySelector = 'iframe[title="Harbor Invitational — event content"]';
      const iframe = page.locator(primarySelector);
      const content = page.frameLocator(primarySelector);
      await content.getByRole("heading", { name: owner ? "Saved event" : "Harbor Invitational", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Desktop view", exact: true }).evaluate(element => getComputedStyle(element).backgroundColor), owner ? "rgb(37, 31, 45)" : "rgb(251, 247, 242)", "the preview toolbar follows the application theme");
      if (owner) {
        await assertToolbarIconSpacing(page);
        const share = page.getByRole("button", { name: "Share event", exact: true });
        await share.hover();
        await assertExpandedControl(share, "Share");
        await page.locator("header").screenshot({ path: path.join(output, "toolbar-share-hover.png") });
        await share.click();
        assert.equal(await page.locator("[data-preview-action]").textContent(), "Share event", "styling preserves the Share action");
        await page.mouse.move(0, 0);
        const url = page.getByRole("button", { name: "Custom URL", exact: true });
        await url.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await assertExpandedControl(url, "Custom URL");
        await url.press("Enter");
        assert.equal(await page.locator("[data-preview-action]").textContent(), "Custom URL", "keyboard activation preserves the selected action");
        await assertToolbarIconSpacing(page);
      }
      if (!owner) await content.getByRole("textbox", { name: "Guest name" }).fill("Retained guest");
      const activeIconStyles = [];
      const inactiveIconStyles = [];
      for (const [device, label, width] of [["mobile", "Tablet and mobile view", 390], ["desktop", "Desktop view", 1440], ["mobile", "Tablet and mobile view", 390]]) {
        await page.getByRole("button", { name: label, exact: true }).click();
        await page.waitForFunction(({ selector, expected }) => document.querySelector(selector).dataset.previewDevice === expected, { selector: primarySelector, expected: device });
        await page.waitForFunction(({ selector, expected }) => document.querySelector(selector).contentWindow.innerWidth === expected, { selector: primarySelector, expected: width });
        assert.equal(await page.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), "true");
        await page.getByRole("group", { name: "Preview device", exact: true }).evaluate(async element => {
          await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
        });
        for (const [pressed, measurements] of [["true", activeIconStyles], ["false", inactiveIconStyles]]) {
          measurements.push(await page.getByRole("group", { name: "Preview device", exact: true }).locator(`button[aria-pressed="${pressed}"]:visible svg`).evaluate(element => {
            const styles = getComputedStyle(element);
            return { color: styles.color, stroke: styles.stroke, strokeWidth: styles.strokeWidth, width: element.getBoundingClientRect().width, opacity: getComputedStyle(element.parentElement).opacity };
          }));
        }
        if (device === "desktop") assert.equal(await page.locator("[data-event-preview-frame]:visible").count(), 0);
        else for (const framedDevice of ["mobile", "tablet"]) {
          const shell = page.locator(`[data-event-preview-frame="${framedDevice}"]`);
          const [frameBounds, stageBounds, toolbarBounds, screenBounds] = await Promise.all([
            shell.boundingBox(), page.locator("[data-event-preview-stage]").first().boundingBox(), page.locator("header").boundingBox(), shell.locator("[data-event-preview-screen]").boundingBox(),
          ]);
          assert.ok(frameBounds.height <= stageBounds.height + 1, "device fits the available height");
          assert.ok(frameBounds.width <= stageBounds.width + 1);
          assert.ok(frameBounds.y >= toolbarBounds.y + toolbarBounds.height, "toolbar stays above the device");
          assert.ok(screenBounds.x > frameBounds.x && screenBounds.y > frameBounds.y, "event is inset inside the bezel");
          assert.equal(await shell.locator("[data-device-frame-artwork]").getAttribute("aria-hidden"), "true");
          const expected = framedDevice === "mobile" ? 840 / 1777 : 979 / 1355;
          assert.ok(Math.abs(frameBounds.width / frameBounds.height - expected) < 0.001, "supplied artwork keeps its original aspect ratio");
          assert.equal(await shell.locator("image").getAttribute("href"), framedDevice === "mobile" ? "/images/event-preview/phone-graphite.webp" : "/images/event-preview/tablet-space-black.webp");
        }
        if (!owner) assert.equal(await content.getByRole("textbox", { name: "Guest name" }).inputValue(), "Retained guest");
      }
      for (const measurements of [activeIconStyles, inactiveIconStyles]) {
        assert.deepEqual(measurements[0], measurements[1], "desktop and combined-device icons share stroke weight, size, color and state opacity");
      }
      const [phone, tablet] = await Promise.all([page.locator('[data-event-preview-frame="mobile"]').boundingBox(), page.locator('[data-event-preview-frame="tablet"]').boundingBox()]);
      assert.ok(tablet.x + tablet.width < phone.x, "tablet and phone appear side by side");
      assert.ok(Math.abs(phone.height - tablet.height) < 1, "both frames share the same visual height");
      assert.equal(await page.locator("[data-device-pair-icon]").getAttribute("stroke-width"), "1.8", "the supplied tablet-and-phone motif uses the desktop icon's stroke weight");
      const end = content.getByRole("button", { name: owner ? "Saved event end" : "End of event", exact: true });
      await end.scrollIntoViewIfNeeded();
      await end.click();
      assert.ok(await iframe.evaluate(element => element.contentWindow.scrollY > 0), "long content scrolls inside the device");
      assert.equal(await page.evaluate(() => scrollY), 0, "the preview stage does not scroll the outer page");
      if (!owner) assert.equal(await content.getByRole("button", { name: "Response retained" }).count(), 1);
      await iframe.evaluate(element => element.contentWindow.scrollTo(0, 0));
      const tabletContent = page.frameLocator('iframe[data-preview-device="tablet"]');
      const tabletEnd = tabletContent.getByRole("button", { name: owner ? "Saved event end" : "End of event", exact: true });
      await tabletEnd.scrollIntoViewIfNeeded();
      await tabletEnd.click();
      assert.ok(await page.locator('iframe[data-preview-device="tablet"]').evaluate(element => element.contentWindow.scrollY > 0));
      await page.locator('iframe[data-preview-device="tablet"]').evaluate(element => element.contentWindow.scrollTo(0, 0));
      const screenshot = await page.screenshot({ path: path.join(output, owner ? "paired-saved-event.png" : "paired-preview.png") });
      for (const framedDevice of ["mobile", "tablet"]) {
        const screen = await page.locator(`[data-event-preview-frame="${framedDevice}"] [data-event-preview-screen]`).boundingBox();
        const pixel = await require("sharp")(screenshot).extract({ left: Math.floor(screen.x + screen.width / 2), top: Math.floor(screen.y + screen.height * 0.8), width: 1, height: 1 }).removeAlpha().raw().toBuffer();
        assert.deepEqual([...pixel], [17, 27, 58], "the event's navy background remains visible through the supplied frame in either app theme");
      }
      await page.setViewportSize({ width: 820, height: 1180 });
      await page.getByRole("button", { name: "iPad / tablet view", exact: true }).click();
      await assertTabletControlPlacement(page, "View in landscape");
      await page.screenshot({ path: path.join(output, owner ? "tablet-saved-event.png" : "tablet-preview.png") });
      for (const [width, height] of [[820, 1180], [1024, 600]]) {
        await page.setViewportSize({ width, height });
        await page.waitForFunction(() => {
          const stage = document.querySelector("[data-event-preview-stage]").getBoundingClientRect();
          const frame = document.querySelector("[data-event-preview-frame]").getBoundingClientRect();
          return frame.height <= stage.height + 1 && frame.width <= stage.width + 1;
        });
      }
      await page.setViewportSize({ width: 820, height: 1180 });
      await page.getByRole("button", { name: "Mobile view", exact: true }).click();
      for (const [width, height] of [[390, 844], [320, 640], [667, 375]]) {
        await page.setViewportSize({ width, height });
        await page.waitForFunction(({ selector, expected }) => document.querySelector(selector).contentWindow.innerWidth === expected, { selector: primarySelector, expected: width });
        await page.waitForFunction(() => !document.querySelector("[data-event-preview-frame]"));
        assert.equal(await page.locator("[data-event-preview-frame]").count(), 0, "a real phone retains its full-width native preview");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      if (!owner) {
        await content.getByRole("textbox", { name: "Guest name" }).press("Escape");
        await page.getByText("Preview closed", { exact: true }).waitFor();
      }
      assert.deepEqual(errors, []);
      await page.close();
    }

    // Reproduce a fast phone document, a slow tablet document and cold frame
    // images without relying on a particular machine's seven-second delay.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
    const documents = [];
    const artworkRequests = [];
    let releaseArtwork = false;
    const documentReady = Promise.withResolvers();
    const artworkReady = Promise.withResolvers();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const eventHtml = '<!doctype html><html data-owner-preview-open="true"><body style="margin:0"><main data-app-main-content style="min-height:1800px;background:#111b3a;color:white;padding:24px"><h1>Retained event</h1><label>Guest <input aria-label="Retained guest" /></label></main></body></html>';
    await page.route("http://preview-loading.test/**", async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.startsWith("/images/event-preview/")) {
        if (releaseArtwork) return route.fulfill({ contentType: "image/webp", body: fs.readFileSync(path.join("public", pathname)) });
        artworkRequests.push({ route, pathname });
        if (new Set(artworkRequests.map(request => request.pathname)).size === 2) artworkReady.resolve();
        return;
      }
      if (pathname === "/event-fixture") {
        const element = await route.request().frame().frameElement();
        documents.push({ route, title: await element.getAttribute("title") });
        if (documents.length === 2) documentReady.resolve();
        return;
      }
      if (pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: fs.readFileSync(path.join(output, "fixture.js")) });
      return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0"><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    });
    await page.goto("http://preview-loading.test/?owner&remote&dark", { waitUntil: "domcontentloaded" });
    let requestTimeout;
    try {
      await Promise.race([
        Promise.all([documentReady.promise, artworkReady.promise]),
        new Promise((_, reject) => { requestTimeout = setTimeout(() => reject(new Error("Both preview documents and frame images must start before either event response")), 10000); }),
      ]);
    } finally { clearTimeout(requestTimeout); }
    assert.equal(documents.length, 2, "both event documents start concurrently without clicking a device control");
    assert.equal(await page.getByRole("button", { name: "Tablet and mobile view", exact: true }).getAttribute("aria-pressed"), "true", "desktop opens in the framed device view");
    const phoneDocument = documents.find(entry => entry.title === "Harbor Invitational — event content");
    const tabletDocument = documents.find(entry => entry.title === "Harbor Invitational — tablet — event content");
    assert.ok(phoneDocument && tabletDocument);
    await phoneDocument.route.fulfill({ contentType: "text/html", body: eventHtml });
    const phoneFrame = page.frameLocator('iframe[title="Harbor Invitational — event content"]');
    await phoneFrame.getByRole("heading", { name: "Retained event", exact: true }).waitFor({ state: "attached" });
    assert.equal(await page.locator('iframe[title="Harbor Invitational — event content"]').isVisible(), false, "fast event content waits for both device images instead of floating without its frame");
    releaseArtwork = true;
    await Promise.all(artworkRequests.map(({ route, pathname }) => route.fulfill({ contentType: "image/webp", body: fs.readFileSync(path.join("public", pathname)) })));
    await page.waitForFunction(() => document.querySelectorAll('[data-event-preview-frame][data-frame-artwork-ready="true"]').length === 2);
    await phoneFrame.getByRole("heading", { name: "Retained event", exact: true }).waitFor();
    assert.equal(await page.getByRole("status").filter({ hasText: "Loading event…" }).count(), 1, "the visible iPad frame explains the pending event load");
    await page.screenshot({ path: path.join(output, "devices-before-slow-tablet.png") });
    await tabletDocument.route.fulfill({ contentType: "text/html", body: eventHtml });
    const tabletFrame = page.frameLocator('iframe[data-preview-device="tablet"]');
    const tabletInput = tabletFrame.getByRole("textbox", { name: "Retained guest", exact: true });
    await tabletInput.fill("Retained through rotation");
    await page.locator('iframe[data-preview-device="tablet"]').evaluate(element => { window.retainedTabletWindow = element.contentWindow; });
    const rotate = page.getByRole("button", { name: "View in landscape", exact: true });
    await assertTabletControlPlacement(page, "View in landscape");
    const landscapeIcon = await rotate.locator("[data-orientation-device]").boundingBox();
    assert.ok(landscapeIcon.width > landscapeIcon.height, "portrait preview offers a landscape device icon");
    await rotate.hover();
    await assertExpandedControl(rotate, "View in landscape");
    await page.locator('[data-event-preview-frame="tablet"] [data-tablet-orientation-bar]').screenshot({ path: path.join(output, "ipad-landscape-action-hover.png") });
    await page.mouse.move(0, 0);
    await settleControl(rotate);
    await rotate.focus();
    await rotate.press("Enter");
    await page.waitForFunction(() => {
      const frame = document.querySelector('iframe[data-preview-device="tablet"]');
      return frame.contentWindow.innerWidth > 1024 && frame.contentWindow.innerWidth > frame.contentWindow.innerHeight;
    });
    const tabletArtwork = page.locator('[data-event-preview-frame="tablet"] [data-device-frame-artwork]');
    await page.waitForFunction(() => document.getAnimations().filter(animation => /::view-transition-(old|new)\(envitefy-ipad-/.test(animation.effect?.pseudoElement || "")).length === 2);
    const rotationAnimations = await page.evaluate(() => document.getAnimations().filter(animation => /::view-transition-(old|new)\(envitefy-ipad-/.test(animation.effect?.pseudoElement || "")).map(animation => ({
      duration: animation.effect.getTiming().duration,
      easing: animation.effect.getTiming().easing,
    })));
    assert.deepEqual(rotationAnimations, [
      { duration: 500, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      { duration: 500, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    ], "the captured frame and event turn together using the same timing");
    assert.equal(await page.locator('[data-event-preview-frame="tablet"]').evaluate(element => element.style.viewTransitionName.startsWith("envitefy-ipad-") && Boolean(element.querySelector("iframe"))), true, "the synchronized visual layer contains both the frame and event content");
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        if (animation.effect?.pseudoElement?.includes("envitefy-ipad-")) {
          animation.pause();
          animation.currentTime = 150;
        }
      }
    });
    await page.screenshot({ path: path.join(output, "ipad-content-rotating.png") });
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) if (animation.effect?.pseudoElement?.includes("envitefy-ipad-")) animation.play();
    });
    await page.waitForFunction(() => document.querySelector('[data-tablet-orientation-bar] button').getAttribute("aria-disabled") === "false");
    const landscapeBounds = await page.locator('[data-event-preview-frame="tablet"]').boundingBox();
    assert.ok(landscapeBounds.width > landscapeBounds.height);
    await assertTabletControlPlacement(page, "View in portrait");
    const camera = await tabletArtwork.evaluate(svg => {
      // Lens center in the unchanged supplied iPad PNG, transformed to the page.
      const point = svg.createSVGPoint();
      point.x = 1003;
      point.y = 715;
      const position = point.matrixTransform(svg.querySelector("image").getScreenCTM());
      return { x: position.x, y: position.y };
    });
    const landscapeScreen = await page.locator('[data-event-preview-frame="tablet"] [data-event-preview-screen]').boundingBox();
    assert.ok(camera.y < landscapeScreen.y, "the landscape camera sits above the screen rather than below it");
    assert.ok(camera.x > landscapeBounds.x + landscapeBounds.width * 0.4 && camera.x < landscapeBounds.x + landscapeBounds.width * 0.6);
    const portraitIcon = await page.getByRole("button", { name: "View in portrait", exact: true }).locator("[data-orientation-device]").evaluate(element => ({ width: Number(element.getAttribute("width")), height: Number(element.getAttribute("height")) }));
    assert.ok(portraitIcon.height > portraitIcon.width, "landscape preview offers a portrait iPad icon");
    assert.equal(await page.getByRole("button", { name: "View in portrait", exact: true }).locator("[data-orientation-device]").count(), 1, "the orientation action uses a single iPad icon");
    const landscapeControl = await page.getByRole("button", { name: "View in portrait", exact: true }).boundingBox();
    assert.ok(landscapeControl.y > camera.y, "the landscape orientation control sits below the top camera");
    assert.equal(await tabletInput.inputValue(), "Retained through rotation");
    assert.equal(documents.length, 2, "rotation resizes the existing event document without reloading it");
    await assertExpandedControl(page.getByRole("button", { name: "View in portrait", exact: true }), "View in portrait");
    await page.screenshot({ path: path.join(output, "ipad-landscape.png") });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "View in portrait", exact: true }).click();
    await page.waitForFunction(() => document.querySelector('iframe[data-preview-device="tablet"]').contentWindow.innerWidth === 820);
    assert.equal(await tabletArtwork.evaluate(element => getComputedStyle(element).transitionDuration), "0s", "reduced motion omits the rotation animation");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => { document.startViewTransition = undefined; });
    await page.getByRole("button", { name: "View in landscape", exact: true }).click();
    const fallback = await page.locator('[data-event-preview-frame="tablet"]').evaluate(element => element.getAnimations().map(animation => ({ duration: animation.effect.getTiming().duration, includesContent: animation.effect.target === element && Boolean(element.querySelector("iframe")) })));
    assert.deepEqual(fallback, [{ duration: 500, includesContent: true }], "browsers without snapshot transitions also rotate the complete frame and content together");
    await page.waitForFunction(() => document.querySelector('[data-tablet-orientation-bar] button').getAttribute("aria-disabled") === "false");
    await page.getByRole("button", { name: "Desktop view", exact: true }).click();
    await page.getByRole("button", { name: "Tablet and mobile view", exact: true }).click();
    await tabletInput.waitFor();
    assert.equal(await tabletInput.inputValue(), "Retained through rotation");
    assert.equal(await page.locator('iframe[data-preview-device="tablet"]').evaluate(element => element.contentWindow === window.retainedTabletWindow), true);
    assert.equal(documents.length, 2, "returning to device view keeps the already-loaded iPad document");
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser.close();
  }
});
