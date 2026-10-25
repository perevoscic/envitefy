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
      const primaryLabel = params.has("wide") ? "Browse all invitation and event page templates" : "Create your event";
      const links = params.has("wide")
        ? ["Introduction", "Template collections", "Live preview", "How it works", "Planning tools", "Guest responses", "Questions"].map((label) => ({ label, href: "#examples" }))
        : [{ label: "Examples", href: "#examples" }, { label: "Questions", href: "#questions" }];
      return <ThemeProvider>
        {editorial ? <MarketingPage tone={(params.get("tone") || "celebration") as "celebration" | "sports" | "product"}>
          <HeroTopNav editorialTone={(params.get("tone") || "celebration") as "celebration" | "sports" | "product"}
            navLinks={links} primaryCtaLabel={primaryLabel}
            authenticatedPrimaryHref="/create" guestPrimaryHref={params.has("href") ? "/birthdays/templates" : undefined}
            loginSuccessRedirectUrl="/category-login"
            onGuestLoginAction={() => window.__landingProductAuth.push({ mode: "login", redirect: "/category-login" })}
            onGuestSignupAction={params.has("signup") ? () => window.__landingProductAuth.push({ mode: "signup", redirect: "/category-signup" }) : undefined}
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
            await header.getByRole("link", { name: "Templates", exact: true }).focus();
            await page.keyboard.press("Enter");
            await page.waitForFunction(() => {
              const target = document.getElementById("examples").getBoundingClientRect();
              const navigation = document
                .querySelector("header[data-scroll-hidden]")
                .getBoundingClientRect();
              return (
                location.hash === "#examples" &&
                target.top >= navigation.bottom &&
                target.top <= 120
              );
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
            for (const part of ["header", "layout", "geometry", "brand", "images", "join", "primary", "primaryIcon", "menu", "menuIcon", "nav", "navLink"]) {
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
