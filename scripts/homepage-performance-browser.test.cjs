const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium, request } = require("playwright");

const configuredOrigin = process.env.ENVITEFY_PERFORMANCE_ORIGIN;
const output = path.resolve("output/homepage-performance");
const compactIcon = "/brand/responsive-v1/concierge-gold-168.webp";
const catalogPattern = /\/fonts\/gallery\/catalog-[a-f0-9]+\.css/;
const runtimeUtilityPattern = /\/styles\/runtime-utilities-[a-f0-9]+\.css/;
const runtimeUtilitySelector = 'link[rel="stylesheet"][href*="/styles/runtime-utilities-"]';
const homepageFonts = [
  "/fonts/marketing/homepage-v1/inter-latin-extended.woff2",
  "/fonts/marketing/homepage-v1/playfairdisplay-latin-extended.woff2",
];

function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google",
    "Chrome",
    "Application",
    "chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

function links(html) {
  return (html.match(/<link\b[^>]*>/g) || []).map((tag) =>
    Object.fromEntries(
      [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1].toLowerCase(), match[2]]),
    ),
  );
}

function descriptionLocations(html) {
  const headEnd = html.indexOf("</head>");
  return [...html.matchAll(/<meta\b[^>]*>/g)].flatMap((match) => {
    const attributes = Object.fromEntries(
      [...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map((attribute) => [
        attribute[1].toLowerCase(),
        attribute[2],
      ]),
    );
    return attributes.name === "description"
      ? [{ content: attributes.content || "", location: match.index < headEnd ? "head" : "body" }]
      : [];
  });
}

async function metadataSnapshot(page) {
  return page.evaluate(() => ({
    head: [...document.head.querySelectorAll('meta[name="description"]')].map(
      (meta) => meta.content,
    ),
    body: [...document.body.querySelectorAll('meta[name="description"]')].map(
      (meta) => meta.content,
    ),
    title: document.title,
  }));
}

async function noJavaScriptVisibility(page) {
  return page.evaluate(() => {
    const heading = document.querySelector("h1");
    const rect = heading?.getBoundingClientRect();
    const hiddenAncestors = [];
    for (let node = heading; node; node = node.parentElement) {
      if (node.hidden || getComputedStyle(node).display === "none") {
        hiddenAncestors.push({
          tag: node.tagName,
          id: node.id,
          hidden: node.hidden,
          display: getComputedStyle(node).display,
        });
      }
    }
    return {
      visibleTextLength: document.body.innerText.trim().length,
      fontSize: heading ? parseFloat(getComputedStyle(heading).fontSize) : null,
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      hiddenAncestors,
    };
  });
}

async function runtimeStylesheetOrder(page) {
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="stylesheet"], style')].map((node, index) => ({
      index,
      source: node.tagName === "STYLE" ? "inline" : "link",
      inHead: document.head.contains(node),
      href:
        node.getAttribute("href") ||
        node.getAttribute("data-href") ||
        node.getAttribute("data-n-href"),
      precedence: node.getAttribute("data-precedence"),
      inlineCharacters: node.tagName === "STYLE" ? node.textContent.length : 0,
      layers: node.sheet
        ? [...node.sheet.cssRules]
            .map((rule) => rule.name)
            .filter((name) => typeof name === "string")
        : [],
    })),
  );
  const runtime = order.find((entry) => runtimeUtilityPattern.test(entry.href || ""));
  const critical = order.filter(
    (entry) =>
      entry.layers.includes("utilities") &&
      (entry.source === "inline" || /\/_next\/static\/css\//.test(entry.href || "")),
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve("config/runtime-utilities.generated.json"), "utf8"),
  );
  const criticalSelectors = new Set(manifest.criticalSelectors.flatMap((key) => JSON.parse(key)));
  assert.equal(
    criticalSelectors.has(".bg-white"),
    true,
    "cascade probe includes a real critical utility",
  );
  assert.equal(
    criticalSelectors.has(".bg-zinc-900"),
    false,
    "cascade probe includes a real noncritical utility",
  );
  const catalog = fs.readFileSync(
    path.resolve("public", manifest.href.replace(/^\/+/, "")),
    "utf8",
  );
  const whiteIndex = catalog.indexOf(".bg-white{");
  const zincIndex = catalog.indexOf(".bg-zinc-900{");
  assert.ok(
    whiteIndex >= 0 && zincIndex > whiteIndex,
    "canonical full utilities place zinc after white",
  );
  const probe = await page.evaluate(() => {
    const stage = document.createElement("div");
    stage.setAttribute("data-appearance-scope", "authored");
    stage.style.cssText = "position:fixed;inset:0;z-index:-1;opacity:0;pointer-events:none";
    document.body.append(stage);
    try {
      return Object.fromEntries(
        ["bg-white", "bg-zinc-900", "bg-white bg-zinc-900"].map((className) => {
          const node = document.createElement("div");
          node.className = className;
          stage.append(node);
          return [className, getComputedStyle(node).backgroundColor];
        }),
      );
    } finally {
      stage.remove();
    }
  });
  assert.notEqual(probe["bg-white"], probe["bg-zinc-900"], "the two actual utility colors differ");
  assert.equal(
    probe["bg-white bg-zinc-900"],
    probe["bg-zinc-900"],
    `critical/noncritical class conflict preserves the full stylesheet cascade: ${JSON.stringify(probe)}`,
  );
  assert.ok(
    runtime && critical.length > 0,
    "actual document includes critical and full utility stylesheets",
  );
  assert.ok(
    critical.every((entry) => entry.index < runtime.index),
    "full runtime utilities follow critical Next utilities in the actual document cascade",
  );
  return { links: order.filter((entry) => entry.source === "link"), stylesheets: order, probe };
}

async function controlStyle(control, description, minimum = 40) {
  await control.waitFor({ state: "visible" });
  const result = await control.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      width: rect.width,
      height: rect.height,
      display: style.display,
      position: style.position,
      color: style.color,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      parentBackground: getComputedStyle(node.parentElement).backgroundColor,
      parentDisplay: getComputedStyle(node.parentElement).display,
      paddingLeft: parseFloat(style.paddingLeft),
      paddingTop: parseFloat(style.paddingTop),
      radius: parseFloat(style.borderRadius),
      fontSize: parseFloat(style.fontSize),
      shadow: style.boxShadow,
    };
  });
  assert.ok(
    result.width >= minimum && result.height >= minimum,
    `${description}: retained utility styles produce a ${minimum}px target (${JSON.stringify(result)})`,
  );
  return result;
}

async function exerciseHomepageWidgets(page, outputName, onProgress) {
  const width = page.viewportSize().width;
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "closed homepage dialogs have no initial DOM",
  );
  assert.equal(
    await page.locator("#showcase-cards, [data-showcase-card]").count(),
    0,
    "the real live-card showcase stays deferred before scrolling",
  );
  assert.equal(
    await page.locator(runtimeUtilitySelector).count(),
    0,
    "anonymous homepage widgets are checked without the full runtime utility stylesheet",
  );
  const requests = [];
  const observeRequest = (request) =>
    requests.push({ method: request.method(), url: request.url() });
  page.on("request", observeRequest);
  const result = { viewportWidth: width, menu: null, auth: null, concierge: null, showcase: null };
  onProgress(result);
  try {
    if (width < 1024) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      const menu = page.getByRole("dialog", { name: "Menu", exact: true });
      const menuStyle = await controlStyle(menu, "first-open menu", Math.min(340, width - 32));
      assert.equal(menuStyle.position, "absolute");
      assert.equal(menuStyle.display, "flex");
      assert.ok(
        menuStyle.paddingLeft >= 16 && menuStyle.radius >= 20 && menuStyle.shadow !== "none",
      );
      await controlStyle(
        menu.getByRole("button", { name: "Sign In", exact: true }),
        "menu Sign In",
        44,
      );
      await menu.getByRole("button", { name: "Sign In", exact: true }).click();
      const menuLogin = page.getByRole("dialog", { name: "Sign in", exact: true });
      const inlineEmail = await controlStyle(
        menuLogin.locator('input[type="email"]'),
        "menu email field",
      );
      assert.ok(inlineEmail.paddingLeft >= 8 && inlineEmail.radius > 0);
      // Menu authentication slides into place over its authored 280ms transition.
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(output, `${outputName}-menu-login.png`),
        fullPage: false,
      });
      await page.keyboard.press("Escape");
      await menuLogin.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await page.getByRole("dialog", { name: "Menu", exact: true }).waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: "Menu", exact: true }).waitFor({ state: "hidden" });
      result.menu = { menuStyle, inlineEmail, reopened: true };
      onProgress(result);
    }

    await page.locator("header").getByRole("button", { name: "Login", exact: true }).click();
    let account = page.getByRole("dialog", { name: "Log in", exact: true });
    const accountStyle = await controlStyle(account, "first-open account dialog");
    assert.equal(accountStyle.position, "fixed");
    assert.equal(accountStyle.display, "flex");
    const card = await controlStyle(account.locator(".auth-card-gradient"), "account card", 200);
    assert.ok(
      card.width <= Math.min(480, width * 0.92) + 1 && card.paddingLeft >= 24 && card.radius >= 20,
    );
    const email = account.locator('input[type="email"]');
    const emailStyle = await controlStyle(email, "account email field");
    assert.ok(emailStyle.paddingLeft >= 8 && emailStyle.radius > 0);
    assert.notEqual(
      emailStyle.background,
      "rgba(0, 0, 0, 0)",
      "account fields retain an explicit app surface",
    );
    assert.notEqual(
      emailStyle.color,
      emailStyle.background,
      "account fields retain paired ink and surface",
    );
    await email.fill("performance-smoke@example.test");
    await account.locator('input[type="password"]').fill("preview-only-no-submission");
    await account.getByRole("button", { name: "Show password", exact: true }).click();
    assert.equal(
      await account.locator('input[placeholder="Password"]').getAttribute("type"),
      "text",
    );
    await account.getByRole("button", { name: "Hide password", exact: true }).click();
    await controlStyle(
      account.getByRole("button", { name: "Close", exact: true }),
      "account close",
      44,
    );
    await page.screenshot({
      path: path.join(output, `${outputName}-account-login.png`),
      fullPage: false,
    });
    await account.getByRole("button", { name: "Close", exact: true }).click();
    await account.waitFor({ state: "hidden" });
    result.auth = {
      accountStyle,
      card,
      emailStyle,
      passwordToggle: true,
      signupSwitch: false,
      submitted: false,
    };
    onProgress(result);

    const launcher = page.getByRole("button", { name: "Open Envitefy Concierge", exact: true });
    await launcher.click();
    const concierge = page.getByRole("dialog", { name: "Envitefy Concierge", exact: true });
    const conciergeStyle = await controlStyle(
      concierge,
      "first-open Concierge",
      Math.min(340, width - 32),
    );
    assert.equal(conciergeStyle.position, "fixed");
    assert.equal(conciergeStyle.display, "flex");
    assert.ok(
      conciergeStyle.width <= 384 &&
        conciergeStyle.height <= 545 &&
        conciergeStyle.radius >= 16 &&
        conciergeStyle.shadow !== "none",
    );
    const composer = await controlStyle(
      concierge.getByRole("textbox", { name: "Question for Envitefy Concierge", exact: true }),
      "Concierge composer",
    );
    assert.equal(composer.parentDisplay, "flex");
    assert.notEqual(composer.parentBackground, "rgba(0, 0, 0, 0)");
    assert.notEqual(
      composer.color,
      composer.parentBackground,
      "Concierge composer retains paired ink and surface",
    );
    const closeStyle = await controlStyle(
      concierge.getByRole("button", { name: "Close Envitefy Concierge", exact: true }),
      "Concierge close",
      44,
    );
    await concierge
      .getByRole("button", { name: "Do my guests need an app or account?", exact: true })
      .click();
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll(
          '[role="dialog"][aria-label="Envitefy Concierge"] [aria-live]',
        ),
      ].some((node) =>
        node.textContent.includes("without creating an account or installing an app"),
      ),
    );
    assert.equal(
      requests.filter((request) => /\/api\/guest-chat(?:\?|$)/.test(request.url)).length,
      0,
      "the authored starter answer remains local in the real production app",
    );
    await concierge.getByRole("button", { name: "New conversation", exact: true }).click();
    assert.equal(
      await concierge.getByRole("button", { name: "New conversation", exact: true }).count(),
      0,
    );
    await page.screenshot({
      path: path.join(output, `${outputName}-concierge.png`),
      fullPage: false,
    });
    await concierge.getByRole("button", { name: "Close Envitefy Concierge", exact: true }).click();
    await concierge.waitFor({ state: "hidden" });
    await launcher.click();
    await concierge.waitFor();
    assert.equal(
      await concierge.getByRole("button", { name: "New conversation", exact: true }).count(),
      0,
      "reopening starts a fresh conversation",
    );
    await page.keyboard.press("Escape");
    await concierge.waitFor({ state: "hidden" });
    result.concierge = {
      conciergeStyle,
      composer,
      closeStyle,
      localAnswer: true,
      reset: true,
      reopened: true,
    };
    onProgress(result);

    assert.equal(
      await page.locator("#showcase-cards, [data-showcase-card]").count(),
      0,
      "opening homepage widgets does not eagerly mount the distant showcase",
    );
    const placeholder = page.locator('#showcase > [aria-busy="true"]');
    await placeholder.evaluate((node) =>
      window.scrollTo({
        top: node.getBoundingClientRect().top + scrollY - innerHeight * 0.3,
        behavior: "instant",
      }),
    );
    const showcase = page.locator("#showcase-cards");
    await showcase.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole("button", { name: "Show showcase card 4", exact: true }).click();
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-showcase-card-index="3"]');
      const rect = card?.getBoundingClientRect();
      return (
        card?.getAttribute("data-showcase-active") === "true" &&
        Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 2
      );
    });
    // The existing carousel transition scales inactive cards for 700ms.
    await page.waitForTimeout(750);
    const activeCard = showcase.locator('[data-showcase-card-index="3"]');
    await activeCard.evaluate((node) =>
      window.scrollTo({
        top: node.getBoundingClientRect().top + scrollY - innerHeight * 0.2,
        behavior: "instant",
      }),
    );
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-showcase-card-index="3"]');
      const rect = card?.getBoundingClientRect();
      return (
        card?.getAttribute("data-showcase-active") === "true" &&
        rect.top >= 0 &&
        rect.bottom <= innerHeight &&
        Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 2
      );
    });
    const cardStyle = await controlStyle(activeCard, "deferred live showcase card", 240);
    assert.ok(cardStyle.width <= 330, "the real card retains its responsive utility width");
    const trigger = activeCard.locator('[data-live-card-trigger][aria-label="Overview"]');
    await controlStyle(trigger, "native live card Details", 44);
    await trigger.click();
    const panel = activeCard.locator('[data-live-card-panel-kind="details"]');
    await panel.waitFor();
    const panelState = await panel.evaluate((node) => ({
      cardIndex: node.closest("[data-showcase-card]")?.getAttribute("data-showcase-card-index"),
      active: node.closest("[data-showcase-card]")?.getAttribute("data-showcase-active"),
      inert: Boolean(node.closest("[inert]")),
      ariaHidden: Boolean(node.closest('[aria-hidden="true"]')),
    }));
    result.showcase = { cardStyle, panelState, detailsOpened: true, detailsClosed: false };
    onProgress(result);
    assert.equal(panelState.active, "true", "opened details stay in the settled active card");
    assert.equal(panelState.inert, false);
    assert.equal(panelState.ariaHidden, false);
    await controlStyle(
      panel.getByRole("button", { name: "Close card details", exact: true }),
      "live card details close",
    );
    await page.screenshot({
      path: path.join(output, `${outputName}-showcase-details.png`),
      fullPage: false,
    });
    await panel.getByRole("button", { name: "Close card details", exact: true }).click();
    await panel.waitFor({ state: "hidden" });
    assert.equal(
      await page.locator(runtimeUtilitySelector).count(),
      0,
      "all homepage interactions use the critical utility set",
    );
    await page.screenshot({
      path: path.join(output, `${outputName}-showcase.png`),
      fullPage: false,
    });
    result.showcase = {
      cards: await showcase.locator("[data-showcase-card]").count(),
      cardStyle,
      panelState,
      detailsOpened: true,
      detailsClosed: true,
    };
    onProgress(result);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.locator("header").getByRole("button", { name: "Login", exact: true }).click();
    account = page.getByRole("dialog", { name: "Log in", exact: true });
    await account.getByRole("button", { name: "Sign up", exact: true }).click();
    account = page.getByRole("dialog", { name: "Create an account", exact: true });
    await controlStyle(account.locator('input[type="email"]'), "signup email field");
    await page.screenshot({
      path: path.join(output, `${outputName}-account-signup.png`),
      fullPage: false,
    });
    await account.getByRole("button", { name: "Close", exact: true }).click();
    await account.waitFor({ state: "hidden" });
    result.auth.signupSwitch = true;
    onProgress(result);
    return result;
  } finally {
    page.off("request", observeRequest);
  }
}

test("production homepage assets, full font delivery and responsive appearance survive real Next navigation", {
  skip:
    !configuredOrigin &&
    "Set ENVITEFY_PERFORMANCE_ORIGIN to an already-running production Next server; this smoke test never starts a development server.",
  timeout: 240000,
}, async () => {
  const originUrl = new URL(configuredOrigin);
  assert.ok(
    ["http:", "https:"].includes(originUrl.protocol),
    "performance origin must use HTTP or HTTPS",
  );
  assert.equal(originUrl.pathname, "/", "provide an origin without a route path");
  assert.equal(originUrl.search, "");
  const origin = originUrl.origin;
  fs.mkdirSync(output, { recursive: true });
  const evidence = {
    origin,
    startedAt: new Date().toISOString(),
    passed: false,
    ssr: [],
    versionedStyles: [],
    navigation: null,
    noJavaScript: null,
    appearance: [],
    interactions: [],
    metadata: [],
    externalVerification: {
      accountSubmissionAttempted: false,
      providerVerificationAttempted: false,
      conciergeAfterSignupVerified: false,
      reason: ["localhost", "127.0.0.1", "[::1]"].includes(originUrl.hostname)
        ? "Signup runs last. The configured public reCAPTCHA key rejects localhost; live provider verification and Concierge after signup require an authorized public domain."
        : "This visual smoke does not submit account forms or verify identity providers. Signup runs last, so Concierge after signup is not exercised.",
    },
    authenticatedHome: {
      verified: false,
      reason:
        "Set ENVITEFY_PERFORMANCE_AUTH_STATE to an existing authorized Playwright storage-state file.",
    },
  };
  const save = () =>
    fs.writeFileSync(path.join(output, "delivery.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  const api = await request.newContext({ baseURL: origin });
  let browser;
  let activePage;
  try {
    const versionedStyles = new Set();
    for (const route of ["/", "/landing", "/birthdays/templates"]) {
      const response = await api.get(route);
      assert.equal(response.status(), 200, `${route}: production response`);
      const html = await response.text();
      assert.doesNotMatch(
        html,
        /\/_next\/static\/chunks\/react-refresh|__next_dev_client__|webpack-hmr/,
        "run this check against a production build",
      );
      const resources = links(html);
      const catalogs = resources.filter(
        (link) => link.rel === "stylesheet" && catalogPattern.test(link.href || ""),
      );
      const utilityStyles = resources.filter(
        (link) => link.rel === "stylesheet" && runtimeUtilityPattern.test(link.href || ""),
      );
      const icon = resources.find(
        (link) => link.rel === "preload" && link.as === "image" && link.href === compactIcon,
      );
      if (route === "/birthdays/templates") {
        assert.equal(
          catalogs.length,
          1,
          "gallery direct requests must server-render the complete versioned font catalog",
        );
        assert.equal(catalogs[0]["data-precedence"], "font-catalog");
        assert.equal(
          utilityStyles.length,
          1,
          "gallery direct requests server-render the full runtime utility stylesheet",
        );
        assert.equal(utilityStyles[0]["data-precedence"], "runtime-utilities");
        versionedStyles.add(catalogs[0].href);
        versionedStyles.add(utilityStyles[0].href);
      } else {
        assert.equal(
          catalogs.length,
          0,
          `${route}: anonymous homepage omits the full gallery catalog`,
        );
        assert.equal(
          utilityStyles.length,
          0,
          `${route}: anonymous homepage omits full runtime utilities`,
        );
        assert.ok(icon, `${route}: the compact Concierge image is discoverable from initial HTML`);
        assert.equal(icon.fetchpriority, "high");
        assert.equal(icon.type, "image/webp");
        assert.equal(
          icon.crossorigin,
          "anonymous",
          "Native images and their preload must use the same CORS fetch mode",
        );
        for (const href of homepageFonts) {
          const preload = resources.find(
            (link) => link.rel === "preload" && link.as === "font" && link.href === href,
          );
          assert.ok(
            preload,
            `${route}: the above-fold ${href} font is discoverable before stylesheet parsing`,
          );
          assert.equal(preload.crossorigin, "anonymous");
        }
      }
      evidence.ssr.push({
        route,
        status: response.status(),
        catalog: catalogs[0]?.href || null,
        runtimeUtilities: utilityStyles[0]?.href || null,
        compactIconPreload: icon || null,
        descriptions: descriptionLocations(html),
        htmlBytes: Buffer.byteLength(html),
      });
      save();
    }
    for (const href of versionedStyles) {
      const response = await api.get(href, { headers: { "Accept-Encoding": "gzip" } });
      assert.equal(response.status(), 200, `${href}: versioned stylesheet response`);
      const headers = response.headers();
      assert.match(headers["cache-control"] || "", /\bpublic\b/);
      assert.match(headers["cache-control"] || "", /\bmax-age=31536000\b/);
      assert.match(headers["cache-control"] || "", /\bimmutable\b/);
      if (runtimeUtilityPattern.test(href))
        assert.match(
          headers["content-encoding"] || "",
          /gzip|br/,
          "the full utility stylesheet transfers compressed",
        );
      evidence.versionedStyles.push({
        href,
        cacheControl: headers["cache-control"],
        contentEncoding: headers["content-encoding"] || null,
        contentLength: headers["content-length"] || null,
        decodedBytes: (await response.body()).length,
      });
      save();
    }
    const crawlerResponse = await api.get("/", { headers: { "User-Agent": "Twitterbot/1.0" } });
    assert.equal(crawlerResponse.status(), 200);
    const crawlerDescriptions = descriptionLocations(await crawlerResponse.text());
    assert.ok(
      crawlerDescriptions.some(
        (description) => description.location === "head" && description.content.trim(),
      ),
      "HTML-only crawlers receive a nonempty description in the initial head",
    );
    evidence.metadata.push({
      route: "/",
      context: "HTML-only crawler SSR",
      userAgent: "Twitterbot/1.0",
      descriptions: crawlerDescriptions,
    });
    const ordinaryDescriptions = evidence.ssr.find((entry) => entry.route === "/").descriptions;
    evidence.metadataDiagnosis = {
      lighthouseGathererScope: "Lighthouse 13.4.1 gathers head meta only",
      streamedMetadataPattern:
        ordinaryDescriptions.some((description) => description.location === "body") &&
        !ordinaryDescriptions.some((description) => description.location === "head") &&
        crawlerDescriptions.some((description) => description.location === "head"),
    };
    save();
    const iconResponse = await api.get(compactIcon);
    assert.equal(iconResponse.status(), 200);
    const iconBytes = (await iconResponse.body()).length;
    assert.ok(iconBytes < 5000, `compact Concierge image should stay below 5 KB, got ${iconBytes}`);
    evidence.compactIconBytes = iconBytes;

    browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
    const navigationContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    await navigationContext.addInitScript(() => performance.setResourceTimingBufferSize(3000));
    const page = await navigationContext.newPage();
    activePage = page;
    const pageErrors = [];
    const network = [];
    const runtimeUtilityResponses = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (req) => network.push({ url: req.url(), type: req.resourceType() }));
    page.on("response", (response) => {
      if (!runtimeUtilityPattern.test(response.url())) return;
      const headers = response.headers();
      runtimeUtilityResponses.push({
        url: response.url(),
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
        contentEncoding: headers["content-encoding"] || null,
        cacheControl: headers["cache-control"] || null,
      });
    });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.locator("[data-marketing-motion-scope]").waitFor();
    assert.equal(
      await page.locator('link[rel="stylesheet"][href*="/fonts/gallery/catalog-"]').count(),
      0,
    );
    assert.equal(await page.locator(runtimeUtilitySelector).count(), 0);
    evidence.metadata.push({
      route: "/",
      context: "hydrated desktop homepage",
      ...(await metadataSnapshot(page)),
    });
    await page.evaluate(() => {
      window.__performanceSmokeDocument = "homepage-next-navigation";
    });
    await page
      .getByRole("navigation", { name: "Find your event type", exact: true })
      .getByRole("link", { name: "Birthdays", exact: true })
      .click();
    await page.waitForURL((url) => url.pathname === "/birthdays");
    assert.equal(
      await page.evaluate(() => window.__performanceSmokeDocument),
      "homepage-next-navigation",
      "homepage to birthday uses the mounted Next app",
    );
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll('link[rel="stylesheet"][href*="/styles/runtime-utilities-"]'),
      ].some((link) => link.sheet && link.sheet.cssRules.length > 0),
    );
    assert.equal(await page.locator(runtimeUtilitySelector).count(), 1);
    const categoryHeading = await page
      .locator("h1")
      .first()
      .evaluate((node) => ({
        fontSize: parseFloat(getComputedStyle(node).fontSize),
        width: node.getBoundingClientRect().width,
      }));
    assert.ok(
      categoryHeading.fontSize >= 30 && categoryHeading.width > 100,
      "client category navigation receives its full styles before rendering",
    );
    await page.getByRole("link", { name: "Browse all templates", exact: false }).click();
    await page.waitForURL((url) => url.pathname === "/birthdays/templates");
    assert.equal(
      await page.evaluate(() => window.__performanceSmokeDocument),
      "homepage-next-navigation",
      "birthday to gallery uses client navigation",
    );
    const catalogLink = page.locator('link[rel="stylesheet"][href*="/fonts/gallery/catalog-"]');
    await catalogLink.waitFor({ state: "attached" });
    assert.equal(await catalogLink.count(), 1);
    assert.equal(
      await page.locator(runtimeUtilitySelector).count(),
      1,
      "subsequent client navigation retains one utility resource",
    );
    const catalogHref = await catalogLink.getAttribute("href");
    const fonts = await page.evaluate(async () => {
      const loaded = await document.fonts.load('32px "Instrument Serif"', "An invitation");
      await document.fonts.ready;
      return loaded.map((face) => ({
        family: face.family,
        status: face.status,
        weight: face.weight,
        style: face.style,
      }));
    });
    assert.ok(
      fonts.length > 0 &&
        fonts.every((font) => font.status === "loaded" && /Instrument Serif/.test(font.family)),
      "custom saved typography resolves a registered loaded font face",
    );
    const fontRequests = network.filter((entry) =>
      /\/fonts\/gallery\/instrumentserif-.*\.woff2/.test(entry.url),
    );
    assert.ok(
      fontRequests.length > 0,
      "the browser fetches a real Instrument Serif WOFF2 resource",
    );
    assert.deepEqual(pageErrors, [], "real navigation has no uncaught browser errors");
    await page.screenshot({
      path: path.join(output, "birthday-gallery-client-navigation.png"),
      fullPage: false,
    });
    const utilityTransfer = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => /\/styles\/runtime-utilities-[a-f0-9]+\.css/.test(entry.name))
        .map((entry) => ({
          url: entry.name,
          encodedBodySize: entry.encodedBodySize,
          decodedBodySize: entry.decodedBodySize,
          transferSize: entry.transferSize,
          deliveryType: entry.deliveryType,
          workerStart: entry.workerStart,
        })),
    );
    evidence.navigation = {
      from: "/",
      through: "/birthdays",
      to: "/birthdays/templates",
      clientNavigation: true,
      catalogHref,
      runtimeUtilities: await page.locator(runtimeUtilitySelector).getAttribute("href"),
      utilityTransfer,
      runtimeUtilityResponses,
      categoryHeading,
      fonts,
      fontRequests,
      pageErrors,
    };
    save();
    const stylesheetOrder = await runtimeStylesheetOrder(page);
    evidence.navigation.stylesheetOrder = stylesheetOrder;
    save();
    const directlyVerified = evidence.versionedStyles.find(
      (entry) => entry.href === evidence.navigation.runtimeUtilities,
    );
    const compressedNetworkTransfer = utilityTransfer.some(
      (entry) => entry.encodedBodySize > 0 && entry.decodedBodySize > entry.encodedBodySize,
    );
    const verifiedCachedTransfer =
      directlyVerified &&
      /gzip|br/.test(directlyVerified.contentEncoding || "") &&
      utilityTransfer.some(
        (entry) =>
          entry.transferSize === 0 &&
          entry.decodedBodySize === directlyVerified.decodedBytes &&
          (entry.deliveryType === "cache" || entry.workerStart > 0),
      );
    evidence.navigation.transferVerification = {
      compressedNetworkTransfer,
      verifiedCachedTransfer: Boolean(verifiedCachedTransfer),
    };
    save();
    assert.ok(
      runtimeUtilityResponses.some(
        (response) => response.status === 200 && /gzip|br/.test(response.contentEncoding || ""),
      ),
      "actual browser runtime CSS response retains compressed HTTP delivery headers",
    );
    assert.ok(
      compressedNetworkTransfer || verifiedCachedTransfer,
      "client navigation uses a compressed network response or the same verified CSS through cache/service worker",
    );
    await navigationContext.close();

    const noJsContext = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const noJsPage = await noJsContext.newPage();
    activePage = noJsPage;
    await noJsPage.goto(origin, { waitUntil: "load" });
    const noJsHomepage = {
      route: "/",
      ...(await noJavaScriptVisibility(noJsPage)),
      runtimeUtilityCount: await noJsPage.locator(runtimeUtilitySelector).count(),
    };
    evidence.noJavaScript = { homepage: noJsHomepage };
    save();
    await noJsPage.screenshot({
      path: path.join(output, "homepage-no-javascript.png"),
      fullPage: false,
    });
    await noJsPage.goto(`${origin}/birthdays`, { waitUntil: "load" });
    const noJsCategory = {
      route: "/birthdays",
      ...(await noJavaScriptVisibility(noJsPage)),
      runtimeUtilityCount: await noJsPage.locator(runtimeUtilitySelector).count(),
      designCount: await noJsPage.locator('a[href*="/birthdays/templates/"]').count(),
    };
    evidence.noJavaScript.category = noJsCategory;
    save();
    await noJsPage.screenshot({
      path: path.join(output, "birthday-category-no-javascript.png"),
      fullPage: false,
    });
    await noJsPage.goto(`${origin}/birthdays/templates`, { waitUntil: "load" });
    const noJsCatalog = noJsPage.locator('link[rel="stylesheet"][href*="/fonts/gallery/catalog-"]');
    const noJsGallery = {
      route: "/birthdays/templates",
      ...(await noJavaScriptVisibility(noJsPage)),
      runtimeUtilityCount: await noJsPage.locator(runtimeUtilitySelector).count(),
      catalogCount: await noJsCatalog.count(),
      designCount: await noJsPage.locator('a[href*="/birthdays/templates/"]').count(),
    };
    evidence.noJavaScript.gallery = noJsGallery;
    save();
    const noJsFonts = await noJsPage.evaluate(async () => {
      const loaded = await document.fonts.load('32px "Instrument Serif"', "An invitation");
      return loaded.map((face) => ({ family: face.family, status: face.status }));
    });
    await noJsPage.screenshot({
      path: path.join(output, "birthday-gallery-no-javascript.png"),
      fullPage: false,
    });
    const noJsDesign = await noJsPage
      .locator('a[href*="/birthdays/templates/"]')
      .first()
      .evaluate((node) => ({
        width: node.getBoundingClientRect().width,
        height: node.getBoundingClientRect().height,
      }));
    evidence.noJavaScript = {
      ...evidence.noJavaScript,
      design: noJsDesign,
      runtimeUtilities: await noJsPage.locator(runtimeUtilitySelector).getAttribute("href"),
      catalogHref: await noJsCatalog.getAttribute("href"),
      fonts: noJsFonts,
    };
    save();
    const assertNoJavaScriptVisibility = () => {
      assert.equal(noJsHomepage.runtimeUtilityCount, 0);
      assert.ok(
        noJsHomepage.width > 100 && noJsHomepage.visibleTextLength > 0,
        `no-JavaScript homepage is visible without full utilities: ${JSON.stringify(noJsHomepage)}`,
      );
      assert.equal(noJsCategory.runtimeUtilityCount, 1);
      assert.ok(
        noJsCategory.fontSize >= 30 &&
          noJsCategory.width > 100 &&
          noJsCategory.visibleTextLength > 0,
        `no-JavaScript category is visible with its real layout: ${JSON.stringify(noJsCategory)}`,
      );
      assert.ok(
        noJsCategory.designCount >= 8,
        "no-JavaScript category retains its selectable featured designs",
      );
      assert.equal(noJsGallery.catalogCount, 1);
      assert.equal(noJsGallery.runtimeUtilityCount, 1);
      assert.ok(
        noJsGallery.width > 100 && noJsGallery.visibleTextLength > 0,
        `no-JavaScript gallery is visible with its real layout: ${JSON.stringify(noJsGallery)}`,
      );
      assert.ok(noJsFonts.length > 0 && noJsFonts.every((font) => font.status === "loaded"));
      assert.ok(
        noJsGallery.designCount > 0,
        "server HTML contains selectable designs without JavaScript",
      );
      assert.ok(
        noJsDesign.width >= 100 && noJsDesign.height >= 100,
        "no-JavaScript gallery cards retain their actual layout",
      );
    };
    const noJsStylesheetOrder = await runtimeStylesheetOrder(noJsPage);
    evidence.noJavaScript.stylesheetOrder = noJsStylesheetOrder;
    save();
    await noJsContext.close();

    for (const viewport of [
      { width: 390, height: 844, dpr: 2 },
      { width: 1440, height: 1000, dpr: 1 },
    ]) {
      for (const appearance of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.dpr,
          colorScheme: appearance,
          reducedMotion: "reduce",
        });
        await context.addInitScript(
          (value) => localStorage.setItem("envitefy:appearance:v1", value),
          appearance,
        );
        const appearancePage = await context.newPage();
        activePage = appearancePage;
        const iconRequests = [];
        const portraitRequests = [];
        const interactionPageErrors = [];
        appearancePage.on("pageerror", (error) => interactionPageErrors.push(error.message));
        appearancePage.on("request", (request) => {
          if (new URL(request.url()).pathname === compactIcon) iconRequests.push(request.url());
          if (new URL(request.url()).pathname.includes("/hero/portrait-v1/")) portraitRequests.push(request.url());
        });
        await appearancePage.goto(origin, { waitUntil: "domcontentloaded" });
        await appearancePage.locator("[data-marketing-motion-scope]").waitFor();
        await appearancePage.waitForFunction(
          (dark) => document.documentElement.classList.contains("dark") === dark,
          appearance === "dark",
        );
        await appearancePage.waitForFunction(() =>
          [...document.querySelectorAll("[data-landing-wordmark] img")].some(
            (image) =>
              getComputedStyle(image).display !== "none" &&
              image.complete &&
              image.naturalWidth > 0,
          ),
        );
        await appearancePage.waitForFunction(() => {
          const image = document.querySelector('#landing-hero picture img');
          return image?.complete && image.naturalWidth > 0;
        });
        const initial = await appearancePage.evaluate(() => {
          const describe = (image) => ({
            src: image.getAttribute("src"),
            currentSrc: image.currentSrc,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: image.getBoundingClientRect().width,
            display: getComputedStyle(image).display,
            loading: image.loading,
            fetchPriority: image.fetchPriority,
            sizes: image.sizes,
            srcset: image.srcset,
          });
          const header = document.querySelector('header a[aria-label="Envitefy home"]');
          return {
            hero: [...document.querySelectorAll("[data-landing-wordmark] img")].map(describe),
            portrait: describe(document.querySelector('#landing-hero picture img')),
            headerHidden: header.getAttribute("data-logo-hidden"),
            header: [...header.querySelectorAll("img")].map(describe),
          };
        });
        const visible = initial.hero.filter((image) => image.display !== "none");
        assert.equal(initial.portrait.fetchPriority, "high", "the visible portrait receives an explicit high-priority hint");
        assert.equal(initial.portrait.loading, "eager");
        if (viewport.width === 390) {
          assert.match(initial.portrait.currentSrc, /\/portrait-v1\/garden-brunch-480\.avif$/);
          assert.equal(portraitRequests.length, 1, "the matched picture preload downloads one mobile portrait");
          assert.ok(initial.portrait.renderedWidth <= 232.1);
        } else {
          assert.equal(portraitRequests.length, 0, "desktop retains its original photograph delivery");
          assert.match(initial.portrait.currentSrc, /\/_next\/image\?/);
        }
        assert.equal(
          visible.length,
          1,
          `${appearance}/${viewport.width}: exactly one hero appearance variant is displayed`,
        );
        assert.ok(
          visible[0].naturalWidth > 0 &&
            visible[0].naturalHeight > 0 &&
            visible[0].renderedWidth > 0,
          "the displayed brand image decodes with actual dimensions",
        );
        assert.equal(
          /wordmark-white/.test(visible[0].currentSrc),
          appearance === "dark",
          "actual selected source matches appearance",
        );
        assert.ok(
          await appearancePage.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          "responsive header and artwork must not widen the document",
        );
        assert.ok(
          visible[0].srcset.includes("/brand/responsive-v1/"),
          "hero offers prepared responsive artwork",
        );
        if (viewport.width === 390)
          assert.match(
            visible[0].currentSrc,
            /\/brand\/responsive-v1\/wordmark-(?:white-)?\d+\.webp$/,
            "phone downloads a responsive derivative",
          );
        assert.equal(
          initial.headerHidden,
          "true",
          "small header logo stays hidden while the large wordmark is visible",
        );
        for (const image of initial.header) {
          assert.equal(image.loading, "lazy", "both initially hidden header variants are lazy");
          assert.notEqual(
            image.fetchPriority,
            "high",
            "hidden header variants do not compete at high priority",
          );
        }
        await appearancePage.screenshot({
          path: path.join(output, `homepage-${appearance}-${viewport.width}.png`),
          fullPage: false,
        });
        evidence.metadata.push({
          route: "/",
          context: `${appearance}/${viewport.width} hydrated homepage`,
          ...(await metadataSnapshot(appearancePage)),
        });
        const interaction = { appearance, viewport };
        evidence.interactions.push(interaction);
        save();
        await exerciseHomepageWidgets(
          appearancePage,
          `${appearance}-${viewport.width}`,
          (partial) => {
            Object.assign(interaction, partial);
            save();
          },
        );
        assert.equal(
          iconRequests.length,
          1,
          "matching anonymous CORS preload and native image produce one request per fresh homepage",
        );
        evidence.interactions.at(-1).iconRequestCount = iconRequests.length;
        assert.deepEqual(
          interactionPageErrors,
          [],
          "actual production widgets have no uncaught browser errors",
        );
        evidence.interactions.at(-1).pageErrors = interactionPageErrors;
        save();
        await appearancePage.evaluate(() =>
          window.scrollTo(
            0,
            document.querySelector("#landing-hero").getBoundingClientRect().bottom +
              window.scrollY +
              200,
          ),
        );
        await appearancePage.evaluate(() => window.scrollBy(0, -96));
        await appearancePage.waitForFunction(
          () =>
            document
              .querySelector('header a[aria-label="Envitefy home"]')
              .getAttribute("data-logo-hidden") === "false",
        );
        await appearancePage.waitForFunction(() =>
          [...document.querySelectorAll('header a[aria-label="Envitefy home"] img')].some(
            (image) =>
              getComputedStyle(image).display !== "none" &&
              image.complete &&
              image.naturalWidth > 0,
          ),
        );
        const revealedHeader = await appearancePage
          .locator('header a[aria-label="Envitefy home"] img')
          .evaluateAll((images) =>
            images.map((image) => ({
              currentSrc: image.currentSrc,
              naturalWidth: image.naturalWidth,
              display: getComputedStyle(image).display,
              loading: image.loading,
            })),
          );
        assert.equal(
          revealedHeader.filter((image) => image.display !== "none" && image.naturalWidth > 0)
            .length,
          1,
          "header logo decodes after becoming available",
        );
        evidence.appearance.push({ appearance, viewport, initial, revealedHeader });
        save();
        await context.close();
      }
    }
    if (process.env.ENVITEFY_PERFORMANCE_AUTH_STATE) {
      const storageState = path.resolve(process.env.ENVITEFY_PERFORMANCE_AUTH_STATE);
      assert.ok(
        fs.existsSync(storageState),
        "configured authorized authentication state must exist",
      );
      const context = await browser.newContext({
        storageState,
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
      });
      const authenticatedPage = await context.newPage();
      activePage = authenticatedPage;
      try {
        await authenticatedPage.goto(origin, { waitUntil: "domcontentloaded" });
        const session = await (await context.request.get(`${origin}/api/auth/session`)).json();
        assert.ok(session.user, "provided storage state resolves an authenticated session");
        await authenticatedPage.locator(runtimeUtilitySelector).waitFor({ state: "attached" });
        assert.equal(await authenticatedPage.locator(runtimeUtilitySelector).count(), 1);
        evidence.authenticatedHome = {
          verified: true,
          runtimeUtilities: await authenticatedPage
            .locator(runtimeUtilitySelector)
            .getAttribute("href"),
        };
      } finally {
        await context.close();
      }
    }
    assertNoJavaScriptVisibility();
    evidence.passed = true;
  } catch (error) {
    evidence.error = { message: error.message, stack: error.stack };
    if (activePage && !activePage.isClosed())
      await activePage
        .screenshot({ path: path.join(output, "failure.png"), fullPage: false })
        .catch(() => {});
    throw error;
  } finally {
    evidence.finishedAt = new Date().toISOString();
    save();
    await browser?.close();
    await api.dispose();
  }
});
