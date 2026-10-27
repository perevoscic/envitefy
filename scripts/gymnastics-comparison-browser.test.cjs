const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/gymnastics-comparison");
const publicRoot = path.resolve("public");
const base = "http://gymnastics-comparison.test";
const fixtureStyles =
  '@font-face{font-family:"Playfair Display";font-style:normal;font-weight:400 900;font-display:swap;src:url(/fonts/birthday/playfairdisplay.ttf) format("truetype")}' +
  '@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/birthday/inter.ttf) format("truetype")}' +
  ':root{--font-playfair:"Playfair Display",Georgia,"Times New Roman",serif;--font-geist-sans:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;--font-sans:var(--font-geist-sans)}' +
  "*{box-sizing:border-box}body{margin:0}button,input{font:inherit}button{cursor:pointer}a{color:inherit}svg{flex-shrink:0}";

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: path.resolve("scripts/fixtures/gymnastics-comparison.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.resolve("src") } },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: path.resolve("scripts/lib/create-guest-ts-loader.cjs"),
          },
          { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        ],
      },
      performance: { hints: false },
    });
    compiler.run((error, stats) =>
      compiler.close(() => {
        if (error || stats?.hasErrors())
          reject(error || new Error(stats.toString({ all: false, errors: true })));
        else resolve();
      }),
    );
  });
}

function executablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google/Chrome/Application/chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

async function serve(context, unexpected) {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== base || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.href}`);
      return route.abort();
    }
    if (url.pathname === "/fixture.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: fs.readFileSync(path.join(output, "fixture.js")),
      });
    if (url.pathname === "/") {
      return route.fulfill({
        contentType: "text/html",
        body:
          '<!doctype html><html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' +
          fixtureStyles +
          '</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
      });
    }
    const filename = path.resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    if (
      filename.startsWith(publicRoot + path.sep) &&
      fs.existsSync(filename) &&
      fs.statSync(filename).isFile()
    ) {
      const contentType = {
        ".png": "image/png",
        ".webp": "image/webp",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      }[path.extname(filename)];
      return route.fulfill({
        contentType: contentType || "application/octet-stream",
        body: fs.readFileSync(filename),
      });
    }
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

async function ready(page) {
  await page.getByTestId("gymnastics-meet-comparison").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.getByTestId("gymnastics-meet-comparison").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("#preview img")).every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
}

async function assertSampleContent(page) {
  const event = page.getByTestId("gymnastics-comparison-event");
  assert.match(
    await event.innerText(),
    /Hosted by Team Twisters & USA Competitions\./,
    "sample identifies the packet's meet hosts",
  );
  const facts = [
    [
      "Sessions & competition order",
      [/Bronze/, /Silver/, /youngest.to.oldest/i, /Gold/, /by draw/i],
    ],
    [
      "Awards & recognition",
      [
        /\b(?:six|6)\b/i,
        /birth.date/i,
        /50%\s*\+\s*1/,
        /all.around/i,
        /\b(?:five|5)\b/i,
        /banners/i,
      ],
    ],
    ["Roster & coach check-in", [/roster/i, /birth.?dates/i, /Coaching Sign In/i]],
    ["Coach attire", [/closed.toe/i, /7.inch/i, /no jeans/i, /hats/i, /visors/i]],
    ["Coach hospitality", [/lunch/i, /dinner/i, /back.to.back/i, /water bottle/i, /outside food/i]],
  ];
  for (const [heading, expected] of facts) {
    const section = event.locator("section").filter({
      has: page.getByRole("heading", { name: heading, exact: true }),
    });
    assert.equal(await section.count(), 1, `${heading} has one dedicated section`);
    const text = (await section.innerText()).replace(/\s+/g, " ");
    for (const fact of expected) assert.match(text, fact, `${heading} retains ${fact}`);
  }

  const admission = event.locator("section").filter({
    has: page.getByRole("heading", { name: "Spectator admission", exact: true }),
  });
  assert.equal(await admission.locator("dl").count(), 1, "admission prices use a structured list");
  const admissionPrices = [
    ["Adults (13+)", "$26"],
    ["Children (5–12)", "$16"],
    ["Children under 5", "Free"],
  ];
  for (const [label, price] of admissionPrices) {
    const row = admission.locator("dl > div").filter({
      has: page.getByText(label, { exact: true }),
    });
    assert.equal(await row.count(), 1, `${label} has one admission row`);
    assert.equal(
      (await row.locator("dd").innerText()).trim(),
      price,
      `${label} retains the packet price`,
    );
  }
}

async function assertLayout(page, desktop) {
  const geometry = await page.evaluate(() => {
    const bounds = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      section: bounds("#preview"),
      layout: bounds('[data-testid="gymnastics-transformation-layout"]'),
      copy: bounds('[data-testid="gymnastics-transformation-copy"]'),
      comparison: bounds('[data-testid="gymnastics-meet-comparison"]'),
      stage: bounds("[data-comparison-viewport]"),
    };
  });
  const detail = JSON.stringify(geometry);
  assert.ok(geometry.documentWidth <= geometry.viewport + 1, `document fits viewport: ${detail}`);
  assert.ok(
    Math.abs(geometry.section.left) <= 1 &&
      Math.abs(geometry.section.right - geometry.viewport) <= 1,
    `section spans the full viewport: ${detail}`,
  );
  assert.ok(
    Math.abs(geometry.layout.left) <= 1 && Math.abs(geometry.layout.right - geometry.viewport) <= 1,
    `layout remains edge to edge without a maximum width: ${detail}`,
  );
  assert.ok(
    geometry.stage.left >= -1 && geometry.stage.right <= geometry.viewport + 1,
    `comparison fits viewport: ${detail}`,
  );
  assert.ok(
    geometry.stage.width / geometry.stage.height >= (desktop ? 1.59 : 1.32),
    `single comparison keeps a wide landscape canvas: ${detail}`,
  );
  if (desktop)
    assert.ok(geometry.stage.height <= 705, `desktop comparison height stays capped: ${detail}`);
  if (desktop)
    assert.ok(
      geometry.copy.right <= geometry.comparison.left + 1,
      `desktop explanation stays left of comparison: ${detail}`,
    );
  else
    assert.ok(
      geometry.copy.bottom <= geometry.comparison.top + 1,
      `phone explanation precedes comparison: ${detail}`,
    );
}

async function assertSourcePaper(page) {
  await page
    .locator("[data-comparison-before]")
    .evaluate((node) => node.scrollTo({ top: 0, behavior: "instant" }));
  const geometry = await page.locator("[data-comparison-before] img").evaluate((image) => {
    const rect = image.getBoundingClientRect();
    const paper = image.parentElement.getBoundingClientRect();
    const before = image.closest("[data-comparison-before]");
    const frame = before.getBoundingClientRect();
    const stage = before.closest("[data-comparison-viewport]");
    const stageRect = stage.getBoundingClientRect();
    const stageStyle = getComputedStyle(stage);
    const beforeStyle = getComputedStyle(before);
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      paperLeft: paper.left,
      paperTop: paper.top,
      paperWidth: paper.width,
      frameLeft: frame.left,
      frameTop: frame.top,
      frameWidth: before.clientWidth,
      frameHeight: before.clientHeight,
      innerLeft: stageRect.left + parseFloat(stageStyle.borderLeftWidth),
      innerTop: stageRect.top + parseFloat(stageStyle.borderTopWidth),
      padding: [
        beforeStyle.paddingTop,
        beforeStyle.paddingRight,
        beforeStyle.paddingBottom,
        beforeStyle.paddingLeft,
      ],
    };
  });
  assert.equal(geometry.naturalWidth, 692);
  assert.equal(geometry.naturalHeight, 794);
  assert.ok(
    Math.abs(geometry.width / geometry.height - 692 / 794) < 0.02,
    `source PDF retains its portrait proportions while the landscape viewport crops it: ${JSON.stringify(geometry)}`,
  );
  const detail = JSON.stringify(geometry);
  assert.ok(
    Math.abs(geometry.left - geometry.frameLeft) <= 1 &&
      Math.abs(geometry.top - geometry.frameTop) <= 1 &&
      Math.abs(geometry.paperLeft - geometry.frameLeft) <= 1 &&
      Math.abs(geometry.paperTop - geometry.frameTop) <= 1,
    `PDF and paper start at the comparison's top left edge: ${detail}`,
  );
  assert.ok(
    Math.abs(geometry.frameLeft - geometry.innerLeft) <= 1 &&
      Math.abs(geometry.frameTop - geometry.innerTop) <= 1,
    `PDF layer fills the comparison's inner edges: ${detail}`,
  );
  assert.ok(
    Math.abs(geometry.width - geometry.frameWidth) <= 1 &&
      Math.abs(geometry.paperWidth - geometry.frameWidth) <= 1 &&
      geometry.height >= geometry.frameHeight - 1,
    `PDF fills the available slider area without empty framing: ${detail}`,
  );
  assert.deepEqual(geometry.padding, ["0px", "0px", "0px", "0px"], "PDF layer adds no padding");
}

async function assertEventFits(page) {
  const geometry = await page.getByTestId("gymnastics-comparison-event").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const stage = node.closest("[data-comparison-viewport]").getBoundingClientRect();
    const contentRight = rect.left + node.clientLeft + node.clientWidth;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const textOverflow = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      for (const textRect of range.getClientRects()) {
        if (
          textRect.left < stage.left - 1 ||
          textRect.right > contentRight + 1 ||
          textRect.top - rect.top + node.scrollTop < -1 ||
          textRect.bottom - rect.top + node.scrollTop > node.scrollHeight + 1
        ) {
          textOverflow.push({
            text: walker.currentNode.textContent,
            left: textRect.left,
            right: textRect.right,
            top: textRect.top,
            bottom: textRect.bottom,
          });
        }
      }
    }
    return {
      width: node.clientWidth,
      contentWidth: node.scrollWidth,
      height: node.clientHeight,
      contentHeight: node.scrollHeight,
      overflowY: getComputedStyle(node).overflowY,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      stageLeft: stage.left,
      stageRight: stage.right,
      stageTop: stage.top,
      stageBottom: stage.bottom,
      textOverflow,
    };
  });
  assert.ok(
    geometry.contentWidth <= geometry.width + 1 &&
      geometry.contentHeight > geometry.height &&
      ["auto", "scroll"].includes(geometry.overflowY) &&
      geometry.left >= geometry.stageLeft - 1 &&
      geometry.right <= geometry.stageRight + 1 &&
      geometry.top >= geometry.stageTop - 1 &&
      geometry.bottom <= geometry.stageBottom + 1 &&
      geometry.textOverflow.length === 0,
    `event text fits horizontally and remains inside its scrollable content: ${JSON.stringify(geometry)}`,
  );
}

async function assertPosition(page, expected, tolerance = 0) {
  const slider = page.getByRole("slider", {
    name: "Compare meet packet and event page",
    exact: true,
  });
  const position = Number(await slider.inputValue());
  assert.ok(
    Math.abs(position - expected) <= tolerance,
    `comparison position ${position} is within ${tolerance} of ${expected}`,
  );
  assert.equal(
    await slider.getAttribute("aria-valuetext"),
    `${position}% meet packet, ${100 - position}% event page`,
  );
  const layers = await page.evaluate(() => ({
    clip: document.querySelector("[data-comparison-before]").style.clipPath,
    divider: document.querySelector("[data-comparison-divider]").style.left,
  }));
  assert.equal(layers.clip, `inset(0px ${100 - position}% 0px 0px)`);
  assert.equal(layers.divider, `${position}%`);
}

async function showMiddle(slider) {
  await slider.press("Home");
  for (let step = 0; step < 50; step++) await slider.press("ArrowRight");
}

async function authoredAppearance(page) {
  return page.getByTestId("gymnastics-comparison-event").evaluate((node) => {
    const style = (element) => {
      const computed = getComputedStyle(element);
      return {
        color: computed.color,
        background: computed.backgroundColor,
        textFill: computed.webkitTextFillColor,
      };
    };
    return [node, ...node.querySelectorAll("h3, dt, dd, section, p")].map(style);
  });
}

async function swipe(client, from, to) {
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  for (let step = 1; step <= 8; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: from.x + ((to.x - from.x) * step) / 8, y: from.y + ((to.y - from.y) * step) / 8 },
      ],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function scrollState(page) {
  return page.evaluate(() => ({
    pdf: document.querySelector("[data-comparison-before]").scrollTop,
    event: document.querySelector('[data-testid="gymnastics-comparison-event"]').scrollTop,
    outer: scrollY,
  }));
}

async function settleScroll(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const read = () =>
          [
            document.querySelector("[data-comparison-before]").scrollTop,
            document.querySelector('[data-testid="gymnastics-comparison-event"]').scrollTop,
            scrollY,
          ].join(",");
        let previous = read();
        let stable = 0;
        let frames = 0;
        const check = () => {
          const current = read();
          stable = current === previous ? stable + 1 : 0;
          previous = current;
          if (stable >= 4 || frames++ > 120) resolve();
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      }),
  );
}

async function resetScroll(page) {
  await page.evaluate(() => {
    for (const node of document.querySelectorAll(
      '[data-comparison-before], [data-testid="gymnastics-comparison-event"]',
    ))
      node.scrollTo({ top: 0, behavior: "instant" });
  });
  await settleScroll(page);
}

async function assertSurfaceScroll(page, surface, action) {
  const before = await scrollState(page);
  await action();
  await page.waitForFunction(
    ([target, previous]) => {
      const node = document.querySelector(
        target === "pdf"
          ? "[data-comparison-before]"
          : '[data-testid="gymnastics-comparison-event"]',
      );
      return node.scrollTop > previous + 10;
    },
    [surface, before[surface]],
  );
  await settleScroll(page);
  const after = await scrollState(page);
  const other = surface === "pdf" ? "event" : "pdf";
  assert.ok(
    Math.abs(after[other] - before[other]) <= 1,
    `${surface} scroll leaves the ${other} position unchanged: ${JSON.stringify({ before, after })}`,
  );
  assert.ok(
    Math.abs(after.outer - before.outer) <= 1,
    `${surface} scroll stays inside the comparison: ${JSON.stringify({ before, after })}`,
  );
}

async function assertInnerPositions(page, expected, description) {
  const current = await scrollState(page);
  assert.ok(
    Math.abs(current.pdf - expected.pdf) <= 1 && Math.abs(current.event - expected.event) <= 1,
    `${description}: ${JSON.stringify({ expected, current })}`,
  );
}

async function mouseDrag(page, slider, position) {
  const stage = await page.locator("[data-comparison-viewport]").boundingBox();
  const rail = await slider.boundingBox();
  assert.ok(rail.width <= 49, "only the divider rail intercepts dragging");
  await page.mouse.move(rail.x + rail.width / 2, rail.y + rail.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + (stage.width * position) / 100, stage.y + stage.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await assertPosition(page, position, 1);
}

async function assertLastDetailsReachable(page) {
  const event = page.getByTestId("gymnastics-comparison-event");
  await event.evaluate((node) =>
    node.scrollTo({ top: node.scrollHeight - node.clientHeight, behavior: "instant" }),
  );
  const last = page.getByTestId("gymnastics-comparison-event-details").locator("p").last();
  const geometry = await last.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const article = node.closest('[data-testid="gymnastics-comparison-event"]');
    const frame = article.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      frameTop: frame.top,
      frameBottom: frame.bottom,
      scrollTop: article.scrollTop,
    };
  });
  assert.ok(
    geometry.scrollTop > 0 &&
      geometry.top >= geometry.frameTop - 1 &&
      geometry.bottom <= geometry.frameBottom + 1,
    `lower meet details are reachable inside the event: ${JSON.stringify(geometry)}`,
  );
}

test("full-width packet reveal keeps one landscape comparison usable across screens", {
  timeout: 90000,
}, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: executablePath() });
  const unexpected = [];
  const errors = [];
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await serve(desktop, unexpected);
    const page = await desktop.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await ready(page);
    const comparison = page.getByTestId("gymnastics-meet-comparison");
    const slider = page.getByRole("slider", {
      name: "Compare meet packet and event page",
      exact: true,
    });
    assert.equal(
      await page.locator("[data-comparison-viewport]").count(),
      1,
      "one viewport reveals both views",
    );
    assert.equal(
      await page.locator("[data-comparison-panel]").count(),
      0,
      "separate preview cards are absent",
    );
    assert.equal(
      await page.getByTestId("gymnastics-comparison-track").count(),
      0,
      "horizontal card track is absent",
    );
    assert.equal(
      await page.locator('img[src*="phone"]').count(),
      0,
      "event page has no phone frame asset",
    );
    assert.equal(await slider.getAttribute("min"), "0");
    assert.equal(await slider.getAttribute("max"), "100");
    await assertPosition(page, 50);
    assert.equal(
      await page
        .getByRole("link", { name: "Create your meet page", exact: true })
        .getAttribute("href"),
      "/gymnastics/templates",
    );
    assert.equal(
      await page
        .getByTestId("gymnastics-comparison-event")
        .getByText("April 10–12, 2027", { exact: true })
        .count(),
      1,
    );
    assert.equal(await comparison.getByText("April 10-12, 2027", { exact: true }).count(), 1);
    await assertSampleContent(page);
    assert.equal(
      await page.getByTestId("gymnastics-comparison-event").getAttribute("data-appearance-scope"),
      "authored",
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.fonts.check('400 16px "Playfair Display"') &&
          document.fonts.check('400 16px "Inter"'),
      ),
      true,
      "bundled application fonts loaded",
    );

    await slider.focus();
    await slider.press("ArrowRight");
    await assertPosition(page, 51);
    await slider.press("ArrowLeft");
    await assertPosition(page, 50);
    await slider.press("Home");
    await assertPosition(page, 0);
    await slider.press("End");
    await assertPosition(page, 100);
    const focus = await page.locator("[data-comparison-viewport]").evaluate((node) => ({
      style: getComputedStyle(node).outlineStyle,
      width: parseFloat(getComputedStyle(node).outlineWidth),
    }));
    assert.ok(
      focus.style !== "none" && focus.width > 0,
      "keyboard focus has a visible comparison outline",
    );
    await comparison.getByRole("button", { name: "Show event page", exact: true }).click();
    await assertPosition(page, 0);
    await comparison.getByRole("button", { name: "Show meet packet", exact: true }).click();
    await assertPosition(page, 100);
    await page.locator("#preview").screenshot({ path: path.join(output, "desktop-before.png") });

    await showMiddle(slider);
    await mouseDrag(page, slider, 25);
    await mouseDrag(page, slider, 75);

    await showMiddle(slider);
    for (const width of [1440, 1920, 2560, 1024]) {
      await page.setViewportSize({ width, height: 1000 });
      await assertLayout(page, true);
      await assertSourcePaper(page);
      await assertEventFits(page);
      await page.locator("#preview").screenshot({
        path: path.join(output, width === 1440 ? "desktop.png" : `desktop-${width}.png`),
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await comparison.getByRole("button", { name: "Show event page", exact: true }).click();
    await assertEventFits(page);
    await page.locator("#preview").screenshot({ path: path.join(output, "desktop-after.png") });

    await showMiddle(slider);
    await resetScroll(page);
    await page.locator("[data-comparison-viewport]").scrollIntoViewIfNeeded();
    const stageBox = await page.locator("[data-comparison-viewport]").boundingBox();
    await assertSurfaceScroll(page, "pdf", async () => {
      await page.mouse.move(stageBox.x + stageBox.width * 0.25, stageBox.y + stageBox.height / 2);
      await page.mouse.wheel(0, 180);
    });
    await assertSurfaceScroll(page, "event", async () => {
      await page.mouse.move(stageBox.x + stageBox.width * 0.75, stageBox.y + stageBox.height / 2);
      await page.mouse.wheel(0, 180);
    });
    await resetScroll(page);
    const pdfRegion = page.getByRole("region", { name: "Meet packet PDF", exact: true });
    assert.equal(await pdfRegion.getAttribute("tabindex"), "0");
    const eventRegion = page.getByTestId("gymnastics-comparison-event");
    assert.equal(await eventRegion.getAttribute("tabindex"), "0");
    await pdfRegion.focus();
    await assertSurfaceScroll(page, "pdf", () => pdfRegion.press("PageDown"));
    await eventRegion.focus();
    await assertSurfaceScroll(page, "event", () => eventRegion.press("PageDown"));
    await assertLastDetailsReachable(page);
    const preserved = await scrollState(page);
    await mouseDrag(page, slider, 75);
    await assertInnerPositions(page, preserved, "dragging preserves independent scroll positions");
    await comparison.getByRole("button", { name: "Show meet packet", exact: true }).click();
    await assertInnerPositions(page, preserved, "showing PDF preserves both scroll positions");
    await comparison.getByRole("button", { name: "Show event page", exact: true }).click();
    await assertInnerPositions(page, preserved, "showing event preserves both scroll positions");
    const darkAppearance = await authoredAppearance(page);
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    assert.deepEqual(
      await authoredAppearance(page),
      darkAppearance,
      "authored event colors remain stable through a live theme change",
    );
    await assertInnerPositions(
      page,
      preserved,
      "theme change preserves independent scroll positions",
    );
    await resetScroll(page);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const copyBox = await page.getByTestId("gymnastics-transformation-copy").boundingBox();
    const ordinaryScroll = await scrollState(page);
    await page.mouse.move(copyBox.x + copyBox.width / 2, copyBox.y + copyBox.height / 2);
    await page.mouse.wheel(0, 180);
    await page.waitForFunction((previous) => scrollY > previous + 40, ordinaryScroll.outer);
    await assertInnerPositions(
      page,
      ordinaryScroll,
      "ordinary page scrolling leaves both previews unchanged",
    );
    await desktop.close();

    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await serve(phone, unexpected);
    const mobilePage = await phone.newPage();
    mobilePage.setDefaultTimeout(10000);
    mobilePage.on("pageerror", (error) => errors.push(error.message));
    await mobilePage.goto(base);
    await ready(mobilePage);
    const mobileSlider = mobilePage.getByRole("slider", {
      name: "Compare meet packet and event page",
      exact: true,
    });
    await assertPosition(mobilePage, 50);
    const touch = await phone.newCDPSession(mobilePage);
    const mobileRange = await mobileSlider.boundingBox();
    const mobileViewport = await mobilePage.locator("[data-comparison-viewport]").boundingBox();
    await swipe(
      touch,
      { x: mobileRange.x + mobileRange.width * 0.5, y: mobileRange.y + mobileRange.height / 2 },
      {
        x: mobileViewport.x + mobileViewport.width * 0.75,
        y: mobileViewport.y + mobileViewport.height / 2,
      },
    );
    await assertPosition(mobilePage, 75, 1);
    await showMiddle(mobileSlider);
    await resetScroll(mobilePage);
    const stage = await mobilePage.locator("[data-comparison-viewport]").boundingBox();
    await assertSurfaceScroll(mobilePage, "pdf", () =>
      swipe(
        touch,
        { x: stage.x + stage.width * 0.25, y: stage.y + stage.height * 0.8 },
        { x: stage.x + stage.width * 0.25, y: stage.y + stage.height * 0.2 },
      ),
    );
    await assertSurfaceScroll(mobilePage, "event", () =>
      swipe(
        touch,
        { x: stage.x + stage.width * 0.75, y: stage.y + stage.height * 0.8 },
        { x: stage.x + stage.width * 0.75, y: stage.y + stage.height * 0.2 },
      ),
    );
    await assertLastDetailsReachable(mobilePage);
    const phonePreserved = await scrollState(mobilePage);
    await mobilePage.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const phoneCopy = await mobilePage.getByTestId("gymnastics-transformation-copy").boundingBox();
    const previousScroll = await mobilePage.evaluate(() => scrollY);
    await swipe(
      touch,
      { x: phoneCopy.x + phoneCopy.width / 2, y: phoneCopy.y + phoneCopy.height * 0.7 },
      { x: phoneCopy.x + phoneCopy.width / 2, y: phoneCopy.y + phoneCopy.height * 0.7 - 140 },
    );
    await mobilePage.waitForFunction((previous) => scrollY > previous + 40, previousScroll);
    await assertInnerPositions(
      mobilePage,
      phonePreserved,
      "ordinary phone scrolling leaves both previews unchanged",
    );
    for (const width of [390, 320]) {
      await mobilePage.setViewportSize({ width, height: 844 });
      await showMiddle(mobileSlider);
      await resetScroll(mobilePage);
      await assertLayout(mobilePage, false);
      await assertSourcePaper(mobilePage);
      await assertEventFits(mobilePage);
      await mobilePage
        .locator("#preview")
        .screenshot({ path: path.join(output, width === 390 ? "phone.png" : "phone-320.png") });
      await mobilePage.getByRole("button", { name: "Show event page", exact: true }).click();
      await assertPosition(mobilePage, 0);
      await mobilePage.locator("#preview").screenshot({
        path: path.join(output, width === 390 ? "phone-after.png" : "phone-320-after.png"),
      });
    }
    await phone.close();
    assert.deepEqual(errors, [], "transformation has no browser errors");
    assert.deepEqual(unexpected, [], "transformation only reads local fixture assets");
  } finally {
    await browser.close();
  }
});
