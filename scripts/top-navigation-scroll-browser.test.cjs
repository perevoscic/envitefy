const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/top-navigation-scroll");
const fixture = path.resolve("scripts/fixtures/landing-product");
const publicRoot = path.resolve("public");
const base = "http://top-navigation.test";

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "entry.tsx"),
    `
    import { createRoot } from "react-dom/client";
    import LandingExperience from "@/app/landing/LandingExperience";
    import HeroTopNav from "@/components/navigation/HeroTopNav";
    import MarketingPage from "@/components/marketing/MarketingPage";
    import ThemeProvider from "@/components/AppearanceProvider";
    window.__landingProductNavigation = [];
    window.__landingProductAuth = [];
    function App() {
      const params = new URLSearchParams(location.search);
      const editorial = params.has("editorial");
      const gallery = params.has("gallery");
      const primaryLabel = gallery ? "Let's create" : params.has("wide") ? "Browse all invitation and event page templates" : "Create your event";
      const links = gallery
        ? [{ label: "Home", href: "/" }, { label: "Bridal showers", href: "/bridal-showers" }, { label: "All categories", href: "/#categories" }]
        : params.has("wide")
        ? ["Introduction", "Template collections", "Live preview", "How it works", "Planning tools", "Guest responses", "Questions"].map((label) => ({ label, href: "#examples" }))
        : [{ label: "Examples", href: "#examples" }, { label: "Questions", href: "#questions" }];
      return <ThemeProvider>
        {editorial ? <MarketingPage tone={(params.get("tone") || "celebration") as "celebration" | "sports" | "product"}>
          <HeroTopNav editorialTone={(params.get("tone") || "celebration") as "celebration" | "sports" | "product"}
            navLinks={links} primaryCtaLabel={primaryLabel}
            editorialAccountAction={gallery ? "login" : "signup"}
            hideEditorialPrimary={gallery}
            authenticatedPrimaryHref="/create" guestPrimaryHref={params.has("href") ? "/birthdays/templates" : undefined}
            loginSuccessRedirectUrl="/category-login"
            onGuestLoginAction={() => window.__landingProductAuth.push({ mode: "login", redirect: "/category-login" })}
            onGuestSignupAction={params.has("signup") || gallery ? () => window.__landingProductAuth.push({ mode: "signup", redirect: "/category-signup" }) : undefined}
            onGuestPrimaryAction={() => window.__landingProductAuth.push({ mode: "signup", redirect: "/category-create" })} />
          <main style={{ minHeight: 6000, paddingTop: 140 }}>
            <h1>Public category page</h1>
            <section id="examples" style={{ marginTop: 900, scrollMarginTop: 100 }}>Examples</section>
            <section id="questions" style={{ marginTop: 900, scrollMarginTop: 100 }}>Questions</section>
          </main>
        </MarketingPage> : params.has("hero") ? <MarketingPage>
          <HeroTopNav navLinks={[{ label: "Examples", href: "#examples" }]}
            authenticatedPrimaryHref="/create" onGuestLoginAction={() => {}}
            onGuestPrimaryAction={() => {}} />
          <main style={{ minHeight: 6000, paddingTop: 140 }}>
            <h1>Category page</h1><section id="examples">Examples</section>
          </main>
        </MarketingPage> : <LandingExperience />}
        <div id="nested-scroll" tabIndex={0} aria-label="Nested scroll area"
          style={{ position: "fixed", right: 0, bottom: 0, width: 80, height: 80,
            overflowY: "auto", zIndex: 40, background: "white" }}>
          <div style={{ height: 800 }}>Nested scrolling</div>
        </div>
      </ThemeProvider>;
    }
    createRoot(document.getElementById("root")).render(<App />);
  `,
  );
  const navigation = path.join(fixture, "navigation.tsx");
  const login = path.join(fixture, "LoginForm.tsx");
  const signup = path.join(fixture, "SignupForm.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: path.join(output, "entry.tsx"),
      output: {
        path: output,
        filename: "fixture.js",
        chunkFilename: "[id].js",
        publicPath: "/bundles/",
      },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
          "process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID": JSON.stringify(""),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/navigation": navigation,
          "next/link": navigation,
          "next-auth/react": navigation,
          "next/image": path.join(fixture, "image.tsx"),
          "next/dynamic": path.join(fixture, "dynamic.tsx"),
          "@/app/sidebar-context": navigation,
          "@/lib/pwa/install-state": navigation,
          "@/components/auth/LoginForm": login,
          "@/components/auth/SignupForm": signup,
          "./LoginForm$": login,
          "./SignupForm$": signup,
          "@/components/landing/LandingLiveCardShowcase": path.join(fixture, "Showcase.tsx"),
          "@": path.resolve("src"),
        },
      },
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
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const sources = [
    "../app/landing/LandingExperience.tsx",
    "../app/landing/sections/ProductLandingHero.tsx",
    "../components/navigation/HeroTopNav.tsx",
    "../components/navigation/ConciergeLauncher.tsx",
    "../components/navigation/MenuBottomSheet.tsx",
    "../components/navigation/ConciergeSheet.tsx",
    "../components/auth/AuthModal.tsx",
    "../components/AppearanceSelector.tsx",
    "../components/branding/EnvitefyWordmark.tsx",
  ];
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n' +
        sources.map((source) => `@source "${source}";`).join("\n"),
    );
  return (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
}

async function serve(context, css, unexpected) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== base || route.request().method() !== "GET") {
      unexpected.push(route.request().url());
      return route.abort();
    }
    if (url.pathname === "/global.css")
      return route.fulfill({ contentType: "text/css", body: css });
    const root = url.pathname.startsWith("/bundles/") ? output : publicRoot;
    const relative = root === output ? url.pathname.slice(9) : `.${url.pathname}`;
    const filename = path.resolve(root, decodeURIComponent(relative));
    if (
      filename.startsWith(root + path.sep) &&
      fs.existsSync(filename) &&
      fs.statSync(filename).isFile()
    ) {
      const types = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".webp": "image/webp",
        ".ttf": "font/ttf",
        ".woff2": "font/woff2",
      };
      return route.fulfill({
        contentType: types[path.extname(filename)] || "application/octet-stream",
        body: fs.readFileSync(filename),
      });
    }
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><body class="font-vars"><div id="root"></div><script src="/bundles/fixture.js"></script>',
      });
    unexpected.push(url.href);
    return route.abort();
  });
}

async function scrollTo(page, top) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), top);
  await page.waitForFunction((top) => Math.abs(window.scrollY - top) < 1, top);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function placeWordmarkEdge(page, bottom) {
  const wordmark = page.locator("[data-landing-wordmark]");
  // Native opening motion scales and translates this element as the page moves.
  // Follow its rendered edge instead of treating its initial offset as constant.
  for (let attempt = 0; attempt < 8; attempt++) {
    const edge = await wordmark.evaluate((node) => node.getBoundingClientRect().bottom);
    if (Math.abs(edge - bottom) < 1) return;
    await scrollTo(page, await page.evaluate((delta) => scrollY + delta, edge - bottom));
  }
  const edge = await wordmark.evaluate((node) => node.getBoundingClientRect().bottom);
  assert.ok(Math.abs(edge - bottom) < 1, `Rendered wordmark bottom ${edge}px matches ${bottom}px`);
}

async function assertVisibility(header, visible, label) {
  await header
    .page()
    .waitForFunction(
      ({ selector, hidden }) =>
        document.querySelector(selector)?.getAttribute("data-scroll-hidden") === hidden,
      { selector: "header[data-scroll-hidden]", hidden: String(!visible) },
    )
    .catch(async (error) => {
      const state = await header.page().evaluate(() => {
        const target = document.querySelector("[data-landing-wordmark]");
        return {
          hidden: document.querySelector("header[data-scroll-hidden]")?.dataset.scrollHidden,
          scroll: scrollY,
          wordmark: target?.getBoundingClientRect().toJSON(),
          focused: document.activeElement?.outerHTML.slice(0, 160),
        };
      });
      throw new Error(`${label}: ${JSON.stringify(state)}`, { cause: error });
    });
  await header.page().waitForFunction((visible) => {
    const rect = document.querySelector("header[data-scroll-hidden]").getBoundingClientRect();
    return visible ? rect.top >= -1 && rect.bottom > 0 : rect.bottom <= 1;
  }, visible);
  const rect = await header.boundingBox();
  assert.ok(visible ? rect.y >= -1 : rect.y + rect.height <= 1, label);
}

async function assertLogo(header, hidden, label, focused = false) {
  await header.page().waitForFunction(
    ({ hidden, focused }) => {
      const brand = document.querySelector("header [data-logo-hidden]");
      return (
        brand?.getAttribute("data-logo-hidden") === String(hidden) &&
        Number(getComputedStyle(brand).opacity) === (hidden && !focused ? 0 : 1)
      );
    },
    { hidden, focused },
  );
  const brand = header.locator("[data-logo-hidden]");
  assert.equal(await brand.getAttribute("data-logo-hidden"), String(hidden), label);
  if (focused)
    assert.equal(await brand.evaluate((node) => node.matches(":focus-visible")), true, label);
}

async function headerPresentation(header, primaryLabel = "Create your event") {
  return header.evaluate((node, label) => {
    const read = (element, properties) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      return Object.fromEntries(properties.map((property) => [property, style[property]]));
    };
    const text = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "color"];
    const action = [...text, "display", "alignItems", "justifyContent", "minHeight", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "backgroundColor", "borderTopColor", "borderTopStyle", "borderTopWidth", "borderRadius", "boxShadow"];
    const join = [...node.querySelectorAll("button")].find((button) => ["Join", "Let's create"].includes(button.textContent.trim()));
    const primary = [...node.querySelectorAll("button, a")].find((control) => control.textContent.trim() === label);
    const menu = node.querySelector('button[aria-label="Open navigation"]');
    const brand = node.querySelector('a[aria-label="Envitefy home"]');
    const nav = node.querySelector("nav");
    const layout = node.firstElementChild?.tagName === "DIV" ? node.firstElementChild : node;
    const rect = node.getBoundingClientRect();
    return {
      header: read(node, ["display", "alignItems", "minHeight", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "backgroundColor", "borderBottomColor", "borderBottomStyle", "borderBottomWidth", "borderRadius", "boxShadow", "backdropFilter"]),
      layout: read(layout, ["display", "alignItems", "justifyContent"]),
      geometry: { x: rect.x, width: rect.width, height: rect.height },
      brand: read(brand, ["display", "alignItems", "minHeight"]),
      images: [...(brand?.querySelectorAll("img") || [])].map((image) => ({ src: image.getAttribute("src"), width: getComputedStyle(image).width, height: getComputedStyle(image).height })),
      join: read(join, action),
      primary: read(primary, action),
      primaryIcon: read(primary?.querySelector("svg"), ["width", "height"]),
      menu: read(menu, ["display", "alignItems", "justifyContent", "width", "height", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "backgroundColor", "borderTopStyle", "borderTopWidth", "borderRadius", "boxShadow", "color"]),
      menuIcon: read(menu?.querySelector("svg"), ["width", "height"]),
      nav: read(nav, ["display"]),
      navLink: read(nav?.querySelector("a"), text),
    };
  }, primaryLabel);
}

async function assertBoundedHeader(page, header, label) {
  const geometry = await header.evaluate((node) => {
    const viewport = document.documentElement.clientWidth;
    const controls = [...node.querySelectorAll('a[aria-label="Envitefy home"], button, a')]
      .filter((control) => !control.closest("nav"))
      .map((control) => control.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    return {
      viewport,
      pageWidth: document.documentElement.scrollWidth,
      controls: controls.map((rect) => ({ left: rect.left, right: rect.right })),
    };
  });
  assert.ok(geometry.pageWidth <= geometry.viewport + 1, `${label}: navigation does not widen the document`);
  for (const rect of geometry.controls) {
    assert.ok(rect.left >= -1 && rect.right <= geometry.viewport + 1, `${label}: visible header actions fit inside the viewport`);
  }
}

async function waitForArrowFill(page, selector, expanded) {
  await page.waitForFunction(({ selector, expanded }) => {
    const button = document.querySelector(selector);
    const surface = button?.querySelector("[data-arrow-fill-surface]");
    if (!surface) return false;
    const fill = surface.getBoundingClientRect(), bounds = button.getBoundingClientRect();
    const scale = (selector) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(button.querySelector(selector)).transform);
      return Math.hypot(matrix.a, matrix.b);
    };
    const surfaceReady = expanded
      ? Math.abs(fill.width - bounds.width) < 2.1 && Math.abs(fill.height - bounds.height) < 2.1
      : Math.abs(fill.width - fill.height) < 0.2 && fill.width < bounds.width / 2;
    const clip = getComputedStyle(button.querySelector("[data-arrow-fill-label-overlay]")).clipPath.split("round")[0];
    const overlayReady = !expanded || clip.match(/[\d.]+/g)?.every((value) => Number(value) < 0.01);
    return surfaceReady && overlayReady && Math.abs(scale("[data-arrow-fill-arrow-current]") - (expanded ? 0 : 1)) < 0.01 &&
      Math.abs(scale("[data-arrow-fill-arrow-next]") - (expanded ? 1 : 0)) < 0.01;
  }, { selector, expanded });
}

async function arrowFillAppearance(button) {
  return button.evaluate((node) => {
    const token = (name, fallback) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${name}${fallback ? `, ${fallback}` : ""})`;
      node.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const style = getComputedStyle(node);
    const overlay = getComputedStyle(node.querySelector("[data-arrow-fill-label-overlay]"));
    const surface = getComputedStyle(node.querySelector("[data-arrow-fill-surface]"));
    const { x, y, width, height } = node.getBoundingClientRect();
    return {
      geometry: { x, y, width, height }, font: style.font, base: style.backgroundColor, ink: style.color,
      fill: surface.backgroundColor, transition: surface.transitionDuration,
      overlay: overlay.color, textFill: overlay.webkitTextFillColor, clip: overlay.clipPath,
      arrow: getComputedStyle(node.querySelector("[data-arrow-fill-icon]")).color,
      tokens: { base: token("--arrow-fill-base"), ink: token("--arrow-fill-ink"),
        fill: token("--arrow-fill-color"), overlay: token("--arrow-fill-hover-ink"),
        arrow: token("--arrow-fill-arrow-ink", "var(--arrow-fill-hover-ink, var(--public-header-paper, #fcf8f3))") },
    };
  });
}

function assertArrowFillPalette(state, label, resting = false) {
  for (const part of [...(resting ? ["base", "ink"] : []), "fill", "overlay", "arrow"]) {
    assert.equal(state[part], state.tokens[part], `${label}: ${part} follows its existing theme token`);
  }
  assert.equal(state.textFill, state.tokens.overlay, `${label}: revealed WebKit text keeps matching theme ink`);
}

test("public headers follow scroll direction while the homepage avoids duplicate wordmarks", {
  timeout: 120000,
}, async () => {
  const css = await buildFixture();
  const chrome =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath())
      ? chromium.executablePath()
      : path.join(
          process.env.PROGRAMFILES || "C:\\Program Files",
          "Google/Chrome/Application/chrome.exe",
        ));
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const results = [];
  try {
    for (const kind of ["landing", "hero"])
      for (const width of [390, 1280]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "no-preference",
        });
        const errors = [],
          unexpected = [];
        await serve(context, css, unexpected);
        const page = await context.newPage();
        page.setDefaultTimeout(7000);
        page.on("pageerror", (error) => errors.push(error.message));
        const label = `${kind} ${width}px`;
        try {
          await page.goto(`${base}/${kind === "hero" ? "?hero" : ""}`);
          const header = page.locator("header[data-scroll-hidden]").first();
          await header.waitFor();
          await page.evaluate(() => document.fonts.ready);
          await assertVisibility(header, true, `${label}: navigation controls initially visible`);
          const control = header.getByRole("button", {
            name: width < 1024 ? "Open navigation" : kind === "landing" ? /^(?:Join|Let's create)$/ : "Login",
            exact: true,
          });
          assert.equal(
            await control.isVisible(),
            true,
            `${label}: initial navigation action available`,
          );

          if (kind === "landing") {
            const wordmark = page.locator("[data-landing-wordmark]");
            await wordmark.waitFor();
            await wordmark.evaluate((node) =>
              Promise.all(node.getAnimations().map((animation) => animation.finished)),
            );
            await assertLogo(header, true, `${label}: display wordmark hides only small logo`);
            await placeWordmarkEdge(page, 2);
            await assertLogo(header, true, `${label}: last visible pixels keep small logo hidden`);
            await placeWordmarkEdge(page, -2);
            await assertLogo(
              header,
              false,
              `${label}: small logo returns after large wordmark leaves`,
            );
            await placeWordmarkEdge(page, 2);
            await assertLogo(header, true, `${label}: upward wordmark reentry hides small logo`);
            await scrollTo(page, 0);
            await assertVisibility(
              header,
              true,
              `${label}: top keeps navigation controls available`,
            );
            await assertLogo(header, true, `${label}: page top has one visible wordmark`);
          }

          await scrollTo(page, 500);
          await assertVisibility(header, false, `${label}: down hides the complete header`);
          for (const nestedTop of [300, 100]) {
            await page.locator("#nested-scroll").evaluate((node, top) => {
              node.scrollTop = top;
            }, nestedTop);
            await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve)),
                ),
            );
            assert.equal(
              await page.evaluate(() => scrollY),
              500,
              `${label}: nested list retains outer scroll`,
            );
            assert.equal(
              await header.getAttribute("data-scroll-hidden"),
              "true",
              `${label}: nested list does not reveal header`,
            );
          }
          await scrollTo(page, 498);
          assert.equal(
            await header.getAttribute("data-scroll-hidden"),
            "true",
            `${label}: 2px upward jitter stays hidden`,
          );
          await scrollTo(page, 470);
          await assertVisibility(header, true, `${label}: reversing 30px reveals header`);
          await scrollTo(page, 472);
          assert.equal(
            await header.getAttribute("data-scroll-hidden"),
            "false",
            `${label}: 2px downward jitter stays visible`,
          );
          await scrollTo(page, 0);
          await assertVisibility(header, true, `${label}: page top reveals header`);
          await scrollTo(page, 500);
          await assertVisibility(header, false, `${label}: hidden before keyboard access`);
          await page.keyboard.press("Tab");
          await header
            .locator("a")
            .first()
            .evaluate((node) => node.focus({ preventScroll: true }));
          await assertVisibility(header, true, `${label}: keyboard focus reveals navigation`);
          if (kind === "landing") {
            await scrollTo(page, 20);
            await assertVisibility(
              header,
              true,
              `${label}: focused header stays visible over hero`,
            );
            await assertLogo(
              header,
              true,
              `${label}: keyboard focus reveals hidden home wordmark`,
              true,
            );
          }
          await scrollTo(page, 650);
          await assertVisibility(header, true, `${label}: focused navigation stays visible`);
          if (kind === "landing")
            await assertLogo(
              header,
              false,
              `${label}: focused logo remains visible below display wordmark`,
            );
          await page.evaluate(() => document.activeElement?.blur());

          if (width < 1024) {
            await scrollTo(page, 620);
            await assertVisibility(header, true, `${label}: visible before menu`);
            await header.getByRole("button", { name: "Open navigation", exact: true }).click();
            const dialog = page.getByRole("dialog", {
              name: kind === "hero" ? "Hero navigation" : "Menu",
              exact: true,
            });
            await dialog.waitFor();
            await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
            assert.equal(
              await header.getAttribute("data-scroll-hidden"),
              "false",
              `${label}: open menu pins header`,
            );
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "hidden" });
            await page.waitForFunction(() => Math.abs(scrollY - 620) < 1);
            await assertVisibility(
              header,
              true,
              `${label}: menu close preserves header and scroll position`,
            );
            await page.evaluate(() => document.activeElement?.blur());
          }

          await page.emulateMedia({ reducedMotion: "reduce" });
          const transition = await header.evaluate(
            (node) => getComputedStyle(node).transitionDuration,
          );
          assert.ok(
            transition.split(",").every((duration) => parseFloat(duration) === 0),
            `${label}: reduced motion removes header transition`,
          );
          await scrollTo(page, 900);
          await assertVisibility(header, false, `${label}: reduced motion still hides down`);
          await scrollTo(page, 870);
          await assertVisibility(header, true, `${label}: reduced motion still reveals up`);
          if (kind === "landing") {
            await assertLogo(
              header,
              false,
              `${label}: reduced motion shows small logo below wordmark`,
            );
            await scrollTo(page, 0);
            await assertVisibility(
              header,
              true,
              `${label}: reduced motion keeps top controls visible`,
            );
            await assertLogo(header, true, `${label}: reduced motion hides duplicate small logo`);
            await scrollTo(page, 1130);
            await page.reload();
            await page.waitForFunction(() => Math.abs(scrollY - 1130) < 1);
            await assertVisibility(
              header,
              true,
              `${label}: restored deep scroll starts with navigation visible`,
            );
            await assertLogo(header, false, `${label}: restored deep scroll shows small logo`);
          }
          if (kind === "landing" && width >= 1024) {
            await header.getByRole("link", { name: "Categories", exact: true }).focus();
            await page.keyboard.press("Enter");
            await page.waitForFunction(() => {
              const target = document.getElementById("categories").getBoundingClientRect();
              return location.hash === "#categories" && Math.abs(target.top) < 2;
            });
          }
          assert.deepEqual(errors, [], `${label}: no browser errors`);
          assert.deepEqual(unexpected, [], `${label}: no external or write requests`);
          await page.screenshot({ path: path.join(output, `${kind}-${width}.png`) });
          results.push(label);
        } finally {
          await context.close();
        }
      }

    // Compare the opted-in public header with the real, unchanged homepage.
    // Positioning and content-dependent widths/gaps may differ; the public
    // header keeps its fixed placement and each page's own destinations.
    for (const scheme of ["light", "dark"])
      for (const width of [390, 768, 961, 1024, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme: scheme,
          reducedMotion: "reduce",
        });
        const errors = [], unexpected = [];
        await serve(context, css, unexpected);
        const page = await context.newPage();
        page.setDefaultTimeout(7000);
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.goto(base);
          const mainHeader = page.locator("header[data-scroll-hidden]").first();
          await mainHeader.waitFor();
          await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, scheme === "dark");
          await page.evaluate(() => document.fonts.ready);
          const reference = await headerPresentation(mainHeader);

          for (const tone of ["celebration", "sports", "product"]) {
            const label = `${tone} ${scheme} ${width}px`;
            await page.goto(`${base}/?editorial&tone=${tone}`);
            const header = page.locator("header[data-public-landing-header]");
            await header.waitFor();
            await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, scheme === "dark");
            await page.evaluate(() => document.fonts.ready);
            const actual = await headerPresentation(header);
            // Page-specific account and creation controls are checked by the per-action assertions below.
            for (const part of ["header", "layout", "geometry", "brand", "images", "menu", "menuIcon", "nav", "navLink"]) {
              assert.deepEqual(actual[part], reference[part], `${label}: ${part} matches the current main landing header`);
            }
            assert.equal(await header.evaluate((node) => getComputedStyle(node).position), "fixed", `${label}: other public pages retain fixed positioning`);
            assert.equal(await header.getByRole("link", { name: "Envitefy home", exact: true }).isVisible(), true, `${label}: other pages always show the approved brand`);
            const join = header.getByRole("button", { name: "Let's create", exact: true });
            assert.equal(await join.isVisible(), true, `${label}: Let's create stays available at every width`);
            await join.click();
            assert.deepEqual(await page.evaluate(() => window.__landingProductAuth), [{ mode: "signup", redirect: "/category-create" }], `${label}: Let's create falls back to this page's signup action`);
            const create = header.getByRole("button", { name: "Create your event", exact: true });
            assert.equal(await create.isVisible(), width > 960, `${label}: primary action follows the main landing breakpoint`);
            if (width > 960) {
              await create.click();
              assert.deepEqual((await page.evaluate(() => window.__landingProductAuth)).at(-1), { mode: "signup", redirect: "/category-create" }, `${label}: primary action invokes this page's creation action`);
            }
            const menu = header.getByRole("button", { name: "Open navigation", exact: true });
            assert.equal(await menu.isVisible(), width < 1024, `${label}: menu switches to inline navigation at 1024px`);
            assert.equal(await header.getByRole("navigation", { name: "Hero navigation", exact: true }).isVisible(), width >= 1024);
            await assertBoundedHeader(page, header, label);

            await page.evaluate(() => document.activeElement?.blur());
            await scrollTo(page, 500);
            await assertVisibility(header, false, `${label}: downward reading hides the public header`);
            await scrollTo(page, 470);
            await assertVisibility(header, true, `${label}: upward reading reveals the public header`);
            if (width < 1024) {
              await menu.click();
              const dialog = page.getByRole("dialog", { name: "Hero navigation", exact: true });
              await dialog.waitFor();
              const menuLogin = dialog.getByRole("button", { name: "Login", exact: true });
              await menuLogin.waitFor();
              assertArrowFillPalette(await arrowFillAppearance(menuLogin), `${label} mobile menu Login`, true);
              assert.equal(await header.getAttribute("data-scroll-hidden"), "false", `${label}: open navigation keeps the header visible`);
              await page.keyboard.press("Escape");
              await dialog.waitFor({ state: "hidden" });
              await page.waitForFunction(() => Math.abs(scrollY - 470) < 1);
              assert.equal(await menu.evaluate((node) => node === document.activeElement), true, `${label}: Escape restores the menu button's focus`);
            }
            results.push(label);
          }

          {
            const label = `separate signup action ${scheme} ${width}px`;
            await page.goto(`${base}/?editorial&signup`);
            const header = page.locator("header[data-public-landing-header]");
            await header.waitFor();
            await header.getByRole("button", { name: "Let's create", exact: true }).click();
            assert.deepEqual(await page.evaluate(() => window.__landingProductAuth), [{ mode: "signup", redirect: "/category-signup" }], `${label}: Let's create invokes the explicit signup action`);
            if (width > 960) {
              await header.getByRole("button", { name: "Create your event", exact: true }).click();
              assert.deepEqual((await page.evaluate(() => window.__landingProductAuth)).at(-1), { mode: "signup", redirect: "/category-create" }, `${label}: the primary action keeps its separate creation callback`);
            }
            results.push(label);
          }

          if (width >= 1024) {
            const label = `wide header ${scheme} ${width}px`;
            await page.goto(`${base}/?editorial&wide&href`);
            const header = page.locator("header[data-public-landing-header]");
            await header.waitFor();
            const primary = header.getByRole("link", { name: "Browse all invitation and event page templates", exact: true });
            assert.equal(await primary.getAttribute("href"), "/birthdays/templates", `${label}: a page-specific primary link remains a link`);
            await assertBoundedHeader(page, header, label);
            const finalLink = header.getByRole("navigation", { name: "Hero navigation", exact: true }).getByRole("link", { name: "Questions", exact: true });
            await page.keyboard.press("Tab");
            await finalLink.focus();
            const focused = await finalLink.boundingBox();
            const viewport = await page.evaluate(() => document.documentElement.clientWidth);
            assert.ok(focused.x >= -1 && focused.x + focused.width <= viewport + 1, `${label}: all seven local links remain reachable by keyboard`);
            assert.equal(await finalLink.evaluate((node) => node === document.activeElement), true);
            const ring = await finalLink.evaluate((node) => {
              const style = getComputedStyle(node);
              const nav = node.closest("nav");
              const navStyle = getComputedStyle(nav);
              const link = node.getBoundingClientRect();
              const container = nav.getBoundingClientRect();
              return {
                focusVisible: node.matches(":focus-visible"),
                extent: style.outlineStyle === "none" ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)),
                overflowX: navStyle.overflowX,
                overflowY: navStyle.overflowY,
                link: { top: link.top, bottom: link.bottom, left: link.left, right: link.right },
                nav: { top: container.top, bottom: container.bottom, left: container.left, right: container.right },
              };
            });
            assert.equal(ring.focusVisible, true, `${label}: local navigation exposes keyboard focus`);
            assert.ok(ring.extent > 0, `${label}: local navigation has a visible focus outline`);
            if (ring.overflowY !== "visible") {
              assert.ok(ring.link.top - ring.extent >= ring.nav.top - 1 && ring.link.bottom + ring.extent <= ring.nav.bottom + 1, `${label}: scrolling navigation does not clip the focus outline vertically`);
            }
            if (ring.overflowX !== "visible") {
              assert.ok(ring.link.left - ring.extent >= ring.nav.left - 1 && ring.link.right + ring.extent <= ring.nav.right + 1, `${label}: the last local link keeps its complete focus outline inside the scrollport`);
            }
          }
          assert.deepEqual(errors, [], `${scheme} ${width}px: no browser errors`);
          assert.deepEqual(unexpected, [], `${scheme} ${width}px: no external or write requests`);
        } finally {
          await context.close();
        }
      }

    // Compact public pages still fit small phones, including the longer
    // authenticated Dashboard label. The main landing remains unchanged.
    for (const scheme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 }, colorScheme: scheme, reducedMotion: "reduce" });
      const unexpected = [];
      await serve(context, css, unexpected);
      const page = await context.newPage();
      try {
        for (const authenticated of [false, true]) {
          const label = `small phone ${scheme} ${authenticated ? "authenticated" : "guest"}`;
          await page.goto(`${base}/?editorial${authenticated ? "&authenticated" : ""}`);
          const header = page.locator("header[data-public-landing-header]");
          await header.waitFor();
          await page.evaluate(() => document.fonts.ready);
          await assertBoundedHeader(page, header, label);
          const account = header.getByRole(authenticated ? "link" : "button", { name: authenticated ? "Dashboard" : "Let's create", exact: true });
          assert.equal(await account.isVisible(), true, `${label}: account action remains available`);
          if (authenticated) assert.equal(await account.getAttribute("href"), "/", `${label}: Dashboard keeps its existing destination`);
          assert.equal(await header.getByRole("button", { name: "Open navigation", exact: true }).isVisible(), true);
          assert.equal(await header.locator("[data-header-primary]").isVisible(), false);
        }
        assert.deepEqual(unexpected, [], `small phone ${scheme}: no external or write requests`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
});

test("gallery liquid-metal create action stays beside Sign in on desktop and phones", {
  timeout: 180000,
}, async () => {
  const css = await buildFixture();
  const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath()) ? chromium.executablePath()
      : path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"));
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const results = [];
  const readCreatePalette = (create) => create.evaluate((node) => {
    const shader = node.querySelector("[data-liquid-metal-shader]");
    const inset = shader.nextElementSibling;
    const label = inset.nextElementSibling;
    const tokenColor = (token) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      node.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    return {
      fill: getComputedStyle(inset).backgroundColor,
      label: getComputedStyle(label).color,
      textFill: getComputedStyle(label).webkitTextFillColor,
      accent: tokenColor("--public-header-accent"),
      paper: tokenColor("--public-header-paper"),
      hover: tokenColor("--public-header-ink"),
    };
  });
  try {
    for (const scheme of ["light", "dark"])
      for (const width of [320, 375, 390, 768, 1024, 1440]) {
        const label = `gallery create ${scheme} ${width}px`;
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce" });
        const errors = [], unexpected = [];
        await serve(context, css, unexpected);
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.goto(`${base}/?editorial&gallery`);
          const header = page.locator("header[data-public-landing-header]");
          await header.waitFor();
          await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, scheme === "dark");
          await page.evaluate(() => document.fonts.ready);
          const signIn = header.getByRole("button", { name: "Sign in", exact: true });
          const create = header.getByRole("button", { name: "Let's create", exact: true });
          assert.equal(await signIn.isVisible(), true, `${label}: Sign in remains visible`);
          assert.equal(await create.isVisible(), true, `${label}: Let's create is visible beside Sign in`);
          assert.notEqual(await create.getAttribute("data-header-create"), null, `${label}: the gallery owns the creation action`);
          assert.equal(await header.locator("[data-header-primary]").count(), 0, `${label}: the former hidden primary action stays absent`);
          await page.mouse.move(0, 300);
          assert.notEqual(await signIn.getAttribute("data-arrow-fill-button"), null, `${label}: Sign in has the supplied arrow-fill treatment`);
          assert.equal(await signIn.locator("[data-arrow-fill-label]").textContent(), "Sign in", `${label}: Sign in keeps its original label`);
          for (const selector of ["[data-arrow-fill-surface]", "[data-arrow-fill-label-overlay]", "[data-arrow-fill-icon]"]) {
            assert.equal(await signIn.locator(selector).getAttribute("aria-hidden"), "true", `${label}: ${selector} is decorative`);
            assert.equal(await signIn.locator(selector).evaluate((node) => getComputedStyle(node).pointerEvents), "none", `${label}: ${selector} leaves native pointer access intact`);
          }
          await waitForArrowFill(page, "[data-header-join]", false);
          const signInRest = await arrowFillAppearance(signIn);
          assertArrowFillPalette(signInRest, label, true);
          await signIn.hover();
          await waitForArrowFill(page, "[data-header-join]", true);
          const signInHover = await arrowFillAppearance(signIn);
          assertArrowFillPalette(signInHover, `${label} hover`);
          assert.deepEqual(signInHover.geometry, signInRest.geometry, `${label}: the expanding fill keeps Sign in geometry`);
          assert.equal(signInHover.font, signInRest.font, `${label}: the expanding fill keeps Sign in typography`);
          assert.ok(signInHover.transition.split(",").every((duration) => parseFloat(duration) === 0), `${label}: reduced motion makes the fill immediate`);
          await page.mouse.move(0, 300);
          await waitForArrowFill(page, "[data-header-join]", false);
          const palette = await readCreatePalette(create);
          assert.equal(palette.fill, palette.accent, `${label}: creation uses the native primary fill`);
          assert.equal(palette.label, palette.paper, `${label}: creation uses matching theme text`);
          assert.equal(palette.textFill, palette.paper, `${label}: WebKit text follows the theme`);
          await create.hover();
          await page.waitForFunction(() => {
            const node = document.querySelector("[data-header-create]");
            const inset = node.querySelector("[data-liquid-metal-shader]").nextElementSibling;
            return getComputedStyle(inset).backgroundColor === getComputedStyle(node.closest("header")).color;
          });
          const hoverPalette = await readCreatePalette(create);
          assert.equal(hoverPalette.fill, hoverPalette.hover, `${label}: hover uses native theme ink`);
          assert.equal(hoverPalette.label, palette.paper, `${label}: hover retains matching theme text`);
          await page.mouse.move(0, 300);
          if (width === 1440) {
            await page.emulateMedia({ colorScheme: scheme === "dark" ? "light" : "dark" });
            await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, scheme !== "dark");
            const switchedPalette = await readCreatePalette(create);
            assert.equal(switchedPalette.fill, switchedPalette.accent, `${label}: a live appearance change updates the native fill`);
            assert.equal(switchedPalette.label, switchedPalette.paper, `${label}: a live appearance change updates matching text`);
            assert.notEqual(switchedPalette.fill, palette.fill, `${label}: both appearances have distinct primary colors`);
            await page.emulateMedia({ colorScheme: scheme });
            await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, scheme === "dark");
          }
          await assertBoundedHeader(page, header, label);
          const geometry = await header.evaluate((node) => {
            const visible = (selector) => [...node.querySelectorAll(selector)]
              .map((control) => ({ label: control.getAttribute("aria-label") || control.textContent.trim(), ...control.getBoundingClientRect().toJSON() }))
              .filter((box) => box.width > 0 && box.height > 0);
            return visible('a[aria-label="Envitefy home"], [data-header-join], [data-header-create], button[aria-label="Open navigation"]');
          });
          for (const box of geometry) {
            assert.ok(box.height >= 44 && box.width >= 44, `${label}: ${box.label} retains a 44px target`);
          }
          for (let index = 1; index < geometry.length; index++) {
            const previous = geometry[index - 1], current = geometry[index];
            assert.ok(previous.right <= current.left + 0.5, `${label}: ${previous.label} and ${current.label} do not overlap`);
            assert.ok(Math.abs((previous.top + previous.height / 2) - (current.top + current.height / 2)) < 1, `${label}: header actions remain on one row`);
          }
          await page.keyboard.press("Tab");
          for (const control of [signIn, create]) {
            await control.focus();
            const focus = await control.evaluate((node) => {
              const style = getComputedStyle(node);
              return { visible: node.matches(":focus-visible"), outline: style.outlineStyle, width: parseFloat(style.outlineWidth), active: node === document.activeElement };
            });
            assert.ok(focus.active && focus.visible && focus.outline !== "none" && focus.width >= 2, `${label}: both actions expose keyboard focus`);
            await waitForArrowFill(page, "[data-header-join]", control === signIn);
          }
          await create.click();
          await signIn.click();
          assert.deepEqual(await page.evaluate(() => window.__landingProductAuth), [
            { mode: "signup", redirect: "/category-signup" },
            { mode: "login", redirect: "/category-login" },
          ], `${label}: creation and Sign in keep their separate account callbacks`);
          await page.waitForFunction(() => Boolean(document.querySelector("[data-liquid-metal-shader]")?.paperShaderMount));
          const shader = await create.locator("[data-liquid-metal-shader]").evaluate(async (node) => {
            const mount = node.paperShaderMount;
            const before = mount.getCurrentFrame();
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const after = mount.getCurrentFrame();
            // Render the same static frame immediately before reading WebGL pixels.
            mount.setFrame(after);
            const canvas = node.querySelector("canvas"), gl = canvas.getContext("webgl2");
            const pixels = new Uint8Array(canvas.width * canvas.height * 4);
            gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            let min = 255, max = 0, opaque = 0;
            for (let index = 0; index < pixels.length; index += 4) {
              min = Math.min(min, pixels[index], pixels[index + 1], pixels[index + 2]);
              max = Math.max(max, pixels[index], pixels[index + 1], pixels[index + 2]);
              if (pixels[index + 3] > 0) opaque++;
            }
            return { before, after, min, max, opaque, width: canvas.width, height: canvas.height, hidden: node.getAttribute("aria-hidden"), pointerEvents: getComputedStyle(node).pointerEvents };
          });
          assert.equal(shader.after, shader.before, `${label}: reduced motion holds the liquid metal still`);
          assert.ok(shader.width > 0 && shader.height > 0 && shader.opaque > 0 && shader.max - shader.min > 30, `${label}: the shader renders varied effect pixels`);
          assert.equal(shader.hidden, "true", `${label}: the decorative effect stays outside the accessible label`);
          assert.equal(shader.pointerEvents, "none", `${label}: the shader cannot intercept the button`);
          await page.evaluate(() => document.activeElement?.blur());
          if ([320, 375, 1440].includes(width)) await page.screenshot({ path: path.join(output, `gallery-create-${scheme}-${width}.png`) });
          await page.goto(`${base}/?editorial&gallery&authenticated`);
          const dashboard = header.getByRole("link", { name: "Dashboard", exact: true });
          await dashboard.waitFor();
          assert.equal(await dashboard.getAttribute("href"), "/", `${label}: authenticated Dashboard keeps its destination`);
          assert.equal(await header.locator("[data-header-create], [data-liquid-metal-button]").count(), 0, `${label}: authenticated accounts do not receive the guest signup effect`);
          await assertBoundedHeader(page, header, `${label} authenticated`);
          assert.deepEqual(errors, [], `${label}: no browser errors`);
          assert.deepEqual(unexpected, [], `${label}: no external or write requests`);
          results.push({ label, shader });
        } finally {
          await context.close();
        }
      }

    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
      const errors = [], unexpected = [];
      await serve(context, css, unexpected);
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${base}/?editorial&gallery`);
        await page.waitForFunction(() => Boolean(document.querySelector("[data-liquid-metal-shader]")?.paperShaderMount));
        const start = await page.locator("[data-liquid-metal-shader]").evaluate((node) => node.paperShaderMount.getCurrentFrame());
        await page.waitForFunction((start) => document.querySelector("[data-liquid-metal-shader]").paperShaderMount.getCurrentFrame() > start, start);
        await page.emulateMedia({ reducedMotion: "reduce" });
        const frames = await page.locator("[data-liquid-metal-shader]").evaluate(async (node) => {
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const start = node.paperShaderMount.getCurrentFrame();
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          return [start, node.paperShaderMount.getCurrentFrame()];
        });
        assert.equal(frames[0], frames[1], "a live reduced-motion change immediately freezes the liquid metal");
        assert.deepEqual(errors, [], "animated liquid metal produces no browser errors");
        assert.deepEqual(unexpected, [], "animated liquid metal makes no external or write requests");
      } finally {
        await context.close();
      }
    }

    {
      const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
      const errors = [], unexpected = [];
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        window.__blockedWebGLCalls = 0;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          if (kind === "webgl2") {
            window.__blockedWebGLCalls++;
            return null;
          }
          return original.call(this, kind, ...args);
        };
      });
      await serve(context, css, unexpected);
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(`${base}/?editorial&gallery`);
        const create = page.locator("[data-header-create]");
        await create.waitFor();
        await page.waitForFunction(() => window.__blockedWebGLCalls > 0 && !document.querySelector("[data-liquid-metal-shader] canvas"));
        const fallback = await create.evaluate((node) => ({ background: getComputedStyle(node).backgroundImage, color: getComputedStyle(node).color, text: node.querySelector('[data-arrow-fill-label]').textContent.trim() }));
        assert.match(fallback.background, /linear-gradient/, "WebGL failure retains the theme-colored CSS rim");
        assert.equal(fallback.text, "Let's create", "WebGL failure keeps the button label");
        await create.click();
        assert.deepEqual(await page.evaluate(() => window.__landingProductAuth), [{ mode: "signup", redirect: "/category-signup" }], "WebGL failure keeps account creation usable");
        await page.screenshot({ path: path.join(output, "gallery-create-webgl-fallback-390.png") });
        assert.deepEqual(errors, [], "WebGL failure is handled without a browser error");
        assert.deepEqual(unexpected, [], "WebGL fallback makes no external or write requests");
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(output, "gallery-create-results.json"), JSON.stringify(results, null, 2));
});

test("public Sign in and Login actions expand their arrow fill on hover and keyboard focus", { timeout: 180000 }, async () => {
  const css = await buildFixture();
  const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath()) ? chromium.executablePath()
      : path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"));
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  try {
    for (const scheme of ["light", "dark"]) {
      for (const entry of [
        { query: "editorial&gallery", width: 1440, name: "Sign in" },
        { query: "editorial&gallery", width: 390, name: "Sign in" },
        { query: "hero", width: 1440, name: "Login" },
      ]) {
        const label = `${entry.name} ${scheme} ${entry.width}px`;
        const context = await browser.newContext({ viewport: { width: entry.width, height: 900 }, colorScheme: scheme, reducedMotion: "no-preference" });
        const errors = [], unexpected = [];
        await serve(context, css, unexpected);
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.goto(`${base}/?${entry.query}`);
          const header = page.locator("header[data-scroll-hidden]").first();
          const action = header.getByRole("button", { name: entry.name, exact: true });
          await action.waitFor();
          await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, scheme === "dark");
          await page.evaluate(() => document.fonts.ready);
          await action.evaluate((node) => Promise.all(node.getAnimations()
            .filter((animation) => animation.constructor.name === "CSSTransition")
            .map((animation) => animation.finished.catch(() => {}))));
          await page.mouse.move(0, 300);
          assert.notEqual(await action.getAttribute("data-arrow-fill-button"), null, `${label}: native account button uses the supplied treatment`);
          await waitForArrowFill(page, "[data-arrow-fill-button]", false);
          const rest = await arrowFillAppearance(action);
          assertArrowFillPalette(rest, label, entry.name === "Sign in");
          assert.ok(rest.transition.split(",").every((duration) => duration.trim() === "0.45s"), `${label}: fill uses the supplied 450ms transition`);
          const foreground = await action.locator("[data-arrow-fill-label]").boundingBox();
          await action.hover();
          await waitForArrowFill(page, "[data-arrow-fill-button]", true);
          const hover = await arrowFillAppearance(action);
          assertArrowFillPalette(hover, `${label} hover`);
          assert.deepEqual(hover.geometry, rest.geometry, `${label}: hover preserves the native target`);
          assert.equal(hover.font, rest.font, `${label}: hover preserves native typography`);
          assert.deepEqual(await action.locator("[data-arrow-fill-label]").boundingBox(), foreground, `${label}: foreground label remains stationary`);
          assert.ok(hover.clip.split("round")[0].match(/[\d.]+/g)?.every((value) => Number(value) < 0.01), `${label}: the full fill reveals its matching label`);
          await action.screenshot({ path: path.join(output, `account-arrow-fill-${entry.name.toLowerCase().replaceAll(" ", "-")}-${scheme}-${entry.width}.png`) });
          await page.mouse.move(0, 300);
          await waitForArrowFill(page, "[data-arrow-fill-button]", false);
          await page.keyboard.press("Tab");
          await action.focus();
          assert.equal(await action.evaluate((node) => node.matches(":focus-visible")), true, `${label}: keyboard access exposes visible focus`);
          await waitForArrowFill(page, "[data-arrow-fill-button]", true);
          await action.evaluate((node) => node.blur());
          await waitForArrowFill(page, "[data-arrow-fill-button]", false);
          await action.hover();
          await waitForArrowFill(page, "[data-arrow-fill-button]", true);
          await page.emulateMedia({ reducedMotion: "reduce" });
          const reduced = await arrowFillAppearance(action);
          assert.ok(reduced.transition.split(",").every((duration) => parseFloat(duration) === 0), `${label}: live reduced motion removes fill transitions`);
          await page.mouse.move(0, 300);
          await waitForArrowFill(page, "[data-arrow-fill-button]", false);
          await assertBoundedHeader(page, header, label);
          assert.deepEqual(errors, [], `${label}: no browser runtime errors`);
          assert.deepEqual(unexpected, [], `${label}: animation makes no network writes`);
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
});
