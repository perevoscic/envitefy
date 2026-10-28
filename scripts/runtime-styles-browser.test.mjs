import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import sharp from "sharp";

const origin = (process.env.RUNTIME_STYLES_ORIGIN || "http://localhost:3117").replace(/\/$/, "");
const output = path.resolve("output/runtime-styles-browser");
const manifest = JSON.parse(await readFile("src/generated/runtime-styles.json", "utf8"));
const leanPath = manifest.landing.href;
const fullPath = manifest.application.href;
let browser;
let fullCss;

function executablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe");
  return existsSync(chrome) ? chrome : undefined;
}

before(async () => {
  await mkdir(output, { recursive: true });
  const response = await fetch(new URL(fullPath, origin), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, "run this suite against a production Next server with the generated styles");
  fullCss = await response.text();
  assert.ok(fullCss.includes("@font-face"));
  browser = await chromium.launch({ headless: true, executablePath: executablePath() });
});

after(async () => { await browser?.close(); });

async function newContext(width, theme) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    colorScheme: theme,
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  // This exercises the real before-paint appearance bootstrap and provider.
  await context.addInitScript((value) => localStorage.setItem("envitefy:appearance:v1", value), theme);
  // Account forms are opened for styling only. Keep the external CAPTCHA badge
  // from covering the Concierge button; attempting authentication still fails.
  await context.route("https://www.google.com/recaptcha/api.js?*", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "window.grecaptcha={ready:function(callback){callback();},execute:function(){throw new Error('Authentication is outside this appearance test');}};",
  }));
  return context;
}

async function settled(page) {
  await page.locator("h1:visible").first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((image) => {
      const box = image.getBoundingClientRect();
      return box.top < innerHeight && box.bottom > 0;
    }).map((image) => image.decode().catch(() => {})));
  });
  await page.waitForFunction(() => document.documentElement.dataset.appearancePreference !== undefined);
}

async function state(page) {
  return page.locator("h1:visible").first().evaluate((heading) => {
    const box = heading.getBoundingClientRect();
    const style = getComputedStyle(heading);
    return {
      title: heading.innerText.replace(/\s+/g, " ").trim(),
      heading: { x: box.x, y: box.y, width: box.width, height: box.height },
      font: style.fontFamily,
      fontSize: style.fontSize,
      dark: document.documentElement.classList.contains("dark"),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      runtimeStyles: [...document.querySelectorAll('link[rel="stylesheet"]')]
        .map((link) => new URL(link.href).pathname).filter((href) => href.startsWith("/styles/runtime/")),
      fonts: [...document.fonts].map((face) => ({ family: face.family.replace(/["']/g, ""), status: face.status })),
    };
  });
}

async function imageGeometry(page) {
  return page.locator("img").evaluateAll((images) => images.flatMap((image) => {
    const box = image.getBoundingClientRect();
    if (box.top >= innerHeight || box.bottom <= 0 || !box.width || !box.height) return [];
    return [{ source: image.getAttribute("src"), x: box.x, y: box.y, width: box.width, height: box.height,
      objectFit: getComputedStyle(image).objectFit }];
  }));
}

async function differentPixels(first, second) {
  const a = await sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(second).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(a.info, b.info, "both screenshots have matching pixel dimensions");
  let changed = 0;
  for (let offset = 0; offset < a.data.length; offset += 4) {
    if ([0, 1, 2].some((channel) => Math.abs(a.data[offset + channel] - b.data[offset + channel]) > 16)) changed++;
  }
  return changed / (a.info.width * a.info.height);
}

async function componentState(locator) {
  return locator.evaluate((root) => {
    const outer = root.getBoundingClientRect();
    const round = (value) => Math.round(value * 100) / 100;
    const sample = (node) => {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        width: round(box.width), height: round(box.height),
        x: round(box.x - outer.x), y: round(box.y - outer.y),
        display: style.display, position: style.position,
        color: style.color, background: style.backgroundColor,
        padding: style.padding, border: style.border,
        font: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight,
      };
    };
    return {
      root: sample(root),
      children: [...root.querySelectorAll("h1, h2, p, summary, input, textarea, button")]
        .filter((node) => node.getClientRects().length > 0).slice(0, 8).map(sample),
    };
  });
}

function assertComponentParity(actual, expected, label, at = "root") {
  if (typeof actual === "number" && typeof expected === "number") {
    // Sticky elements can settle on adjacent subpixels after native scrolling.
    assert.ok(Math.abs(actual - expected) <= 0.75, `${label}: ${at} changed ${actual} / ${expected}`);
  } else if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    assert.deepEqual(Object.keys(actual), Object.keys(expected), `${label}: ${at} fields`);
    for (const key of Object.keys(actual)) assertComponentParity(actual[key], expected[key], label, `${at}.${key}`);
  } else {
    assert.equal(actual, expected, `${label}: ${at}`);
  }
}

async function bounded(promise, message, timeoutMs = 15000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

async function originalGlobalCascade(page, runtimePath) {
  await page.evaluate((href) => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const runtime = links.find((link) => new URL(link.href).pathname === href);
    const firstModule = links.find((link) => !new URL(link.href).pathname.startsWith("/styles/runtime/"));
    if (!runtime || !firstModule) throw new Error("Expected runtime and Next module stylesheets for cascade-order comparison");
    document.head.insertBefore(runtime, firstModule);
  }, runtimePath);
  await page.waitForFunction((href) => [...document.querySelectorAll('link[rel="stylesheet"]')]
    .some((link) => new URL(link.href).pathname === href && link.sheet), runtimePath);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function publicInteractions(page, width, label) {
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByRole("button", { name: "Create your event", exact: true }).first().click();
  const account = page.getByRole("dialog", { name: "Create an account", exact: true });
  await account.waitFor();
  await page.evaluate(() => document.fonts.ready);
  const result = { account: await componentState(account) };
  const email = account.locator('input[type="email"]').first();
  assert.ok((await email.boundingBox()).width > 150, "account fields keep their authored layout");
  await page.screenshot({ path: path.join(output, `account-${label}.png`), animations: "disabled" });
  await account.getByRole("button", { name: "Close", exact: true }).click();
  await account.waitFor({ state: "detached" });

  await page.getByRole("button", { name: "Open Envitefy Concierge", exact: true }).click();
  const concierge = page.getByRole("dialog", { name: "Envitefy Concierge", exact: true });
  await concierge.waitFor();
  await page.evaluate(() => document.fonts.ready);
  result.concierge = await componentState(concierge);
  const chatBox = await concierge.boundingBox();
  assert.ok(chatBox.width >= 280 && chatBox.x >= 0 && chatBox.x + chatBox.width <= width + 1,
    "the deferred Concierge panel fits the viewport");
  await page.screenshot({ path: path.join(output, `concierge-${label}.png`), animations: "disabled" });
  await concierge.getByRole("button", { name: "Close Envitefy Concierge", exact: true }).click();
  await concierge.waitFor({ state: "detached" });

  if (width < 1024) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "Menu", exact: true });
    await menu.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    result.menu = await componentState(menu);
    await menu.getByRole("button", { name: "Sign In", exact: true }).click();
    const login = page.getByRole("dialog", { name: "Sign in", exact: true });
    await login.locator('input[type="email"]').waitFor();
    await page.waitForTimeout(400);
    result.menuLogin = await componentState(login);
    await page.screenshot({ path: path.join(output, `menu-login-${label}.png`), animations: "disabled" });
    await login.getByRole("button", { name: "Close menu", exact: true }).click();
    await login.waitFor({ state: "detached" });
  }

  result.sections = {};
  for (const selector of ["#how-it-works", "[data-art-mosaic]", "[data-landing-faq]"]) {
    const section = page.locator(selector);
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    if (selector === "[data-landing-faq]") await section.locator("summary").first().click();
    result.sections[selector] = await componentState(section);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  return result;
}

test("cold homepage styles preserve the complete stylesheet's mobile and desktop appearance", { timeout: 240000 }, async () => {
  const evidence = [];
  for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
    const context = await newContext(width, theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      // Cover the middleware rewrite at / and the explicit /landing route.
      await page.goto(`${origin}${theme === "light" ? "/" : "/landing"}`, { waitUntil: "domcontentloaded" });
      await settled(page);
      const lean = await state(page);
      assert.deepEqual(lean.runtimeStyles, [leanPath], "cold landing receives only the reduced stylesheet");
      assert.equal(lean.dark, theme === "dark");
      assert.equal(lean.overflow, false);
      assert.ok(parseFloat(lean.fontSize) >= 28, "the public hero retains its display typography");
      const leanImages = await imageGeometry(page);
      // Next Image can upgrade an already decoded low-resolution candidate as
      // the cache warms. Compare every image's DOM geometry and mask only its
      // pixels so image sharpness does not masquerade as a CSS regression.
      const reduced = await page.screenshot({ path: path.join(output, `landing-${theme}-${width}.png`),
        animations: "disabled", mask: [page.locator("img")], maskColor: "#808080" });

      // The actual full application CSS is the baseline, with identical markup,
      // images and appearance. This catches missing utility or font declarations.
      await context.route(`**${leanPath}`, (route) => route.fulfill({ contentType: "text/css", body: fullCss }));
      await page.reload({ waitUntil: "domcontentloaded" });
      await settled(page);
      await originalGlobalCascade(page, leanPath);
      const complete = await state(page);
      assert.deepEqual(lean.heading, complete.heading, "headline geometry is unchanged by utility/font splitting");
      assert.equal(lean.font, complete.font);
      assert.equal(lean.fontSize, complete.fontSize);
      assert.deepEqual(await imageGeometry(page), leanImages, "all visible image assets and their layout remain identical");
      const full = await page.screenshot({ path: path.join(output, `landing-full-${theme}-${width}.png`),
        animations: "disabled", mask: [page.locator("img")], maskColor: "#808080" });
      const changedFraction = await differentPixels(reduced, full);
      assert.ok(changedFraction < 0.002, `lean/full first-screen pixel difference ${(changedFraction * 100).toFixed(3)}%`);
      assert.deepEqual(errors, [], "the production landing hydrates without runtime errors");
      evidence.push({ width, theme, changedFraction, state: lean });
    } finally { await context.close(); }
  }
  await writeFile(path.join(output, "landing-parity.json"), `${JSON.stringify(evidence, null, 2)}\n`);
});

test("deferred public controls and belowfold sections retain complete stylesheet layouts", { timeout: 240000 }, async () => {
  const evidence = [];
  for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
    const context = await newContext(width, theme);
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/landing`, { waitUntil: "domcontentloaded" });
      await settled(page);
      const lean = await publicInteractions(page, width, `lean-${theme}-${width}`);
      assert.ok(!(await state(page)).runtimeStyles.includes(fullPath), "public controls do not require application CSS");
      await context.route(`**${leanPath}`, (route) => route.fulfill({ contentType: "text/css", body: fullCss }));
      await page.reload({ waitUntil: "domcontentloaded" });
      await settled(page);
      await originalGlobalCascade(page, leanPath);
      const complete = await publicInteractions(page, width, `full-${theme}-${width}`);
      assertComponentParity(lean, complete, "menu, account, Concierge and belowfold geometry/styles are unchanged");
      evidence.push({ width, theme, lean, complete });
    } finally { await context.close(); }
  }
  await writeFile(path.join(output, "public-controls-parity.json"), `${JSON.stringify(evidence, null, 2)}\n`);
});

test("cold galleries retain complete catalog font descriptors and responsive authored previews", { timeout: 240000 }, async () => {
  for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
    const context = await newContext(width, theme);
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/birthdays/templates`, { waitUntil: "domcontentloaded" });
      await page.locator("[data-birthday-template-hero]:visible").waitFor();
      await settled(page);
      const gallery = await state(page);
      assert.deepEqual(gallery.runtimeStyles, [fullPath], "the gallery receives the complete application stylesheet on first render");
      assert.equal(gallery.dark, theme === "dark");
      assert.equal(gallery.overflow, false);
      assert.match(gallery.title, /Every birthday deserves a little magic/);
      assert.ok(gallery.fonts.length > 500, "catalog font definitions remain available");
      for (const family of ["Poppins", "Dancing Script", "Inter", "Playfair Display"]) {
        assert.ok(gallery.fonts.some((face) => face.family === family), `${family} retains its font descriptors`);
      }
      assert.ok(gallery.fonts.filter((face) => face.status === "loaded").length < gallery.fonts.length / 2,
        "catalog font binaries remain demand loaded");
      const previews = page.locator("[data-birthday-hero-template]:visible");
      assert.equal(await previews.count(), 3);
      const geometry = await previews.evaluateAll((nodes) => nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.x, right: box.right, width: box.width };
      }));
      assert.ok(geometry.every((box) => box.width > 80 && box.x >= -1 && box.right <= width + 1), "authored hero designs fit the viewport");
      const hero = page.locator("[data-birthday-template-hero]:visible");
      const beforeOrder = { hero: await componentState(hero), previews: [] };
      for (let index = 0; index < 3; index++) beforeOrder.previews.push(await componentState(previews.nth(index)));
      await originalGlobalCascade(page, fullPath);
      const originalOrder = { hero: await componentState(hero), previews: [] };
      for (let index = 0; index < 3; index++) originalOrder.previews.push(await componentState(previews.nth(index)));
      assertComponentParity(beforeOrder, originalOrder, "gallery typography and authored previews preserve the original global-before-module cascade");
      await page.screenshot({ path: path.join(output, `gallery-${theme}-${width}.png`), animations: "disabled" });
    } finally { await context.close(); }
  }
  for (const href of [leanPath, fullPath]) {
    const response = await fetch(new URL(href, origin), { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/css/);
    assert.match(response.headers.get("cache-control"), /max-age=31536000/);
    assert.match(response.headers.get("cache-control"), /immutable/);
  }
});

test("client navigation waits for application CSS before showing a gallery and supports Back", { timeout: 180000 }, async () => {
  for (const width of [390, 1440]) {
    const context = await newContext(width, "light");
    const page = await context.newPage();
    let release;
    let received;
    const requested = new Promise((resolve) => { received = resolve; });
    const blocked = new Promise((resolve) => { release = resolve; });
    await context.route(`**${fullPath}`, async (route) => {
      received();
      await blocked;
      await route.continue();
    });
    try {
      await page.goto(`${origin}/landing`, { waitUntil: "domcontentloaded" });
      await settled(page);
      await page.evaluate(() => { window.__runtimeStyleNavigationMarker = true; });
      const link = page.locator('a[href="/birthdays/templates"]').first();
      const destination = page.waitForResponse((response) =>
        new URL(response.url()).pathname === "/birthdays/templates" && response.request().headers().rsc === "1",
      { timeout: 30000 });
      void destination.catch(() => {});
      await link.scrollIntoViewIfNeeded();
      const clicking = link.click({ timeout: 30000 });
      void clicking.catch(() => {});
      let timeoutId;
      try {
        const timeout = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Application CSS was not requested within 30 seconds")), 30000);
        });
        await Promise.race([requested, timeout]);
      } finally { clearTimeout(timeoutId); }
      console.log(`Navigation ${width}px: application stylesheet requested`);
      const response = await bounded(destination, "Destination RSC response headers did not arrive");
      // The browser can pause consumption of the streamed Flight response while
      // waiting for CSS. Independently finish the same request without rendering
      // to establish that server data is ready before checking the commit gate.
      const ready = await context.request.get(response.url(), {
        headers: await response.request().allHeaders(), timeout: 15000,
      });
      assert.equal(ready.status(), 200, "destination data is ready while the browser stylesheet is delayed");
      assert.ok((await ready.body()).length > 0);
      await page.waitForTimeout(400);
      assert.equal(await page.locator("[data-birthday-template-hero]:visible").count(), 0,
        "the destination is not committed while its required stylesheet is pending");
      assert.equal(await page.evaluate(() => window.__runtimeStyleNavigationMarker), true, "navigation preserves the active document");
      release();
      await clicking;
      await page.locator("[data-birthday-template-hero]:visible").waitFor();
      await settled(page);
      assert.equal(await page.evaluate(() => window.__runtimeStyleNavigationMarker), true, "Next performs a client transition");
      const gallery = await state(page);
      assert.ok(gallery.runtimeStyles.includes(fullPath));
      assert.equal(gallery.overflow, false);
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.locator('a[href="/birthdays/templates"]').first().waitFor();
      assert.match(page.url(), /\/landing(?:[?#]|$)/);
      assert.equal((await state(page)).overflow, false);
      await page.screenshot({ path: path.join(output, `navigation-back-${width}.png`), animations: "disabled" });
    } finally { release(); await context.close(); }
  }
});
