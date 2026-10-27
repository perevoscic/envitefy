const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/category-landing-dark");
const publicRoot = path.resolve("public");
const base = "http://category-landing-dark.test";
const categories = [
  "baby-showers",
  "birthdays",
  "bridal-showers",
  "weddings",
  "anniversaries",
  "gender-reveal",
  "signup-forms",
  "sports",
  "football",
  "gymnastics",
];

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  const navigation = path.resolve("scripts/fixtures/landing-product/navigation.tsx");
  const omitted = path.resolve("scripts/fixtures/category-landing-dark-stubs.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: path.resolve("scripts/fixtures/category-landing-dark.tsx"),
      output: { path: output, filename: "fixture.js", publicPath: "/bundles/" },
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/link": navigation,
          "next/navigation": navigation,
          "next-auth/react": navigation,
          "next/image": path.resolve("scripts/fixtures/landing-product/image.tsx"),
          "next/script": path.resolve("scripts/fixtures/category-landing-dark-script.tsx"),
          "@": path.resolve("src"),
        },
      },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
        new compiled.webpack.NormalModuleReplacementPlugin(
          /(?:^|[/\\])(?:SignedOutPageChrome|HeroTopNav|PublicConciergeWidget|AuthModal)(?:\.tsx)?$/,
          (resource) => {
            resource.request = omitted;
          },
        ),
        new compiled.webpack.NormalModuleReplacementPlugin(
          /(?:^|[/\\])PublicTemplateGallery(?:\.tsx)?$/,
          (resource) => {
            resource.request = path.resolve("scripts/fixtures/category-landing-dark-gallery.tsx");
          },
        ),
        new compiled.webpack.NormalModuleReplacementPlugin(
          /(?:^|[/\\])PublicCreationLink(?:\.tsx)?$/,
          (resource) => {
            resource.request = path.resolve(
              "scripts/fixtures/category-landing-dark-creation-link.tsx",
            );
          },
        ),
      ],
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
  const sourcePaths = [
    "../app/baby-showers",
    "../app/birthdays",
    "../app/bridal-showers",
    "../app/weddings",
    "../app/category-pages",
    "../components/marketing",
    "../components/sports-landing",
    "../components/football-landing",
    "../components/football-season-templates",
    "../components/events/TemplateThumbnail.tsx",
    "../components/gymnastics-landing",
  ];
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n' +
        sourcePaths.map((entry) => `@source "${entry}";`).join("\n"),
    );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  fs.writeFileSync(path.join(output, "global.css"), css);
}

async function serve(context, unexpected) {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== base || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.href}`);
      return route.abort();
    }
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html data-theme="general-light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body class="font-vars antialiased"><div id="root"></div><script src="/fixture.js"></script></body></html>',
      });
    const generated = ["/fixture.js", "/global.css"].includes(url.pathname);
    const filename = path.resolve(
      generated ? output : publicRoot,
      `.${decodeURIComponent(url.pathname)}`,
    );
    if (
      fs.existsSync(filename) &&
      fs.statSync(filename).isFile() &&
      (filename.startsWith(output + path.sep) || filename.startsWith(publicRoot + path.sep))
    ) {
      const mime = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".webp": "image/webp",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      };
      return route.fulfill({
        contentType: mime[path.extname(filename)] || "application/octet-stream",
        body: fs.readFileSync(filename),
      });
    }
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

// The fixture inspects real text/background pairs, including transparent layers.
// Photograph overlays require visual inspection; authored preview colors are also
// checked across theme transitions below.
async function auditText(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    const rgba = (value) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].map((x, i) => (i === 3 ? x / 255 : x));
    };
    const mix = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
    const luminance = (rgb) =>
      rgb
        .slice(0, 3)
        .map((c) => c / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
        .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const failures = [];
    let checked = 0;
    for (const node of document.querySelectorAll("main *")) {
      if (
        ["STYLE", "SCRIPT", "SVG", "PATH", "NOSCRIPT"].includes(node.tagName) ||
        node.closest("svg,[aria-hidden=true],[data-fixture-gallery]")
      )
        continue;
      const ownText = [...node.childNodes]
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent.trim())
        .join(" ");
      if (!ownText) continue;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (!rect.width || !rect.height || style.visibility === "hidden" || style.opacity === "0")
        continue;
      let background = [255, 255, 255, 1];
      const ancestors = [];
      for (let parent = node; parent; parent = parent.parentElement) ancestors.unshift(parent);
      let image = false;
      for (const ancestor of ancestors) {
        const surface = getComputedStyle(ancestor);
        const color = rgba(surface.backgroundColor);
        if (color[3] === 1) image = false;
        background = mix(color, background);
        if (surface.backgroundImage !== "none") image = true;
        if (
          [...ancestor.children].some((child) => {
            if (child.tagName !== "IMG" || getComputedStyle(child).position !== "absolute")
              return false;
            const photo = child.getBoundingClientRect();
            return (
              photo.left <= rect.left &&
              photo.right >= rect.right &&
              photo.top <= rect.top &&
              photo.bottom >= rect.bottom
            );
          })
        )
          image = true;
      }
      // Text over the route's photographs is checked in the saved screenshots.
      if (image) continue;
      const foreground = mix(rgba(style.color), background);
      const l1 = luminance(foreground);
      const l2 = luminance(background);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      checked++;
      if (ratio + 0.03 < (large ? 3 : 4.5))
        failures.push({
          text: ownText.slice(0, 80),
          ratio: Number(ratio.toFixed(2)),
          required: large ? 3 : 4.5,
          className: node.className,
          color: style.color,
          background: background.slice(0, 3).map(Math.round),
          authored: !!node.closest('[data-appearance-scope="authored"]'),
        });
    }
    return { checked, failures };
  });
}

async function authoredColors(page) {
  return page.locator('[data-appearance-scope="authored"]').evaluateAll((nodes) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    const color = (value) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    return nodes.map((node) => ({
      background: color(getComputedStyle(node).backgroundColor),
      descendants: [node, ...node.querySelectorAll("h2,h3,p,span,a,button")]
        .filter((child) =>
          [...child.childNodes].some(
            (part) => part.nodeType === Node.TEXT_NODE && part.textContent.trim(),
          ),
        )
        .map((child) => ({
          text: child.textContent.trim().slice(0, 40),
          color: color(getComputedStyle(child).color),
          background: color(getComputedStyle(child).backgroundColor),
        })),
    }));
  });
}

async function checkInteractiveState(page, category, state, width, results, failures) {
  await page.waitForTimeout(550);
  const dark = await authoredColors(page);
  const audit = await auditText(page);
  results.push({ category, state, width, ...audit });
  if (audit.failures.length)
    failures.push(`${category} ${state} ${width}px: ${JSON.stringify(audit.failures)}`);
  await page.evaluate(() => window.__setLandingAppearance("light"));
  await page.waitForTimeout(550);
  if (JSON.stringify(await authoredColors(page)) !== JSON.stringify(dark))
    failures.push(`${category} ${state} ${width}px: theme toggling changed authored paper or ink`);
  await page.evaluate(() => window.__setLandingAppearance("dark"));
  await page.waitForTimeout(550);
}

test("all category landing sections preserve readable dark colors and authored samples on desktop and phone", {
  timeout: 180000,
}, async () => {
  await buildFixture();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google/Chrome/Application/chrome.exe",
  );
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath())
      ? chromium.executablePath()
      : fs.existsSync(chrome)
        ? chrome
        : undefined);
  const browser = await chromium.launch({ headless: true, executablePath });
  const unexpected = [],
    errors = [],
    results = [],
    failures = [];
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      await serve(context, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      for (const category of categories) {
        await page.goto(`${base}/?category=${category}`);
        await page.locator("main h1").waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          for (const image of document.images) image.loading = "eager";
        });
        await page.waitForFunction(
          () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
          null,
          { timeout: 10000 },
        );
        const authoredLight = await authoredColors(page);
        await page.evaluate(() => window.__setLandingAppearance("dark"));
        await page.waitForTimeout(550);
        const authoredDark = await authoredColors(page);
        if (JSON.stringify(authoredDark) !== JSON.stringify(authoredLight))
          failures.push(
            `${category} ${viewport.width}px: authored samples changed paper or ink in dark mode`,
          );
        const audit = await auditText(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        );
        const authoredChanges = authoredLight
          .map((light, index) => ({ light, dark: authoredDark[index] }))
          .filter(({ light, dark }) => JSON.stringify(light) !== JSON.stringify(dark));
        results.push({ category, width: viewport.width, overflow, ...audit, authoredChanges });
        if (audit.failures.length)
          failures.push(`${category} ${viewport.width}px: ${JSON.stringify(audit.failures)}`);
        if (overflow > 1)
          failures.push(`${category} ${viewport.width}px: horizontal overflow ${overflow}px`);
        await page.screenshot({
          path: path.join(output, `${category}-${viewport.width}-dark.png`),
          fullPage: true,
        });
        if (category === "baby-showers") {
          const registry = page.locator("[data-baby-registry-preview]");
          assert.equal(await registry.count(), 1, "the baby registry example remains visible");
          assert.equal(
            await registry.locator("[data-baby-registry-row]").count(),
            3,
            "all three registry destinations remain visible",
          );
          assert.equal(
            await registry.locator("[data-baby-calendar-example]").count(),
            1,
            "the calendar example remains visible",
          );
          await registry.screenshot({
            path: path.join(output, `baby-registry-${viewport.width}-dark.png`),
          });
        }
        if (category === "birthdays") {
          await page
            .getByRole("tablist", { name: "Birthday prompts" })
            .locator('xpath=ancestor::*[@data-appearance-scope="authored"][1]')
            .screenshot({ path: path.join(output, `birthday-prompts-${viewport.width}-dark.png`) });
          await page
            .getByText("The host view", { exact: true })
            .locator("xpath=ancestor::section[1]")
            .screenshot({ path: path.join(output, `birthday-host-${viewport.width}-dark.png`) });
        }
        if (category === "weddings")
          await page
            .locator("main > section")
            .last()
            .screenshot({ path: path.join(output, `wedding-cta-${viewport.width}-dark.png`) });
        if (category === "bridal-showers")
          await page
            .locator("#bridal-studio")
            .screenshot({ path: path.join(output, `bridal-studio-${viewport.width}-dark.png`) });
        await page.evaluate(() => window.__setLandingAppearance("light"));
        await page.waitForTimeout(550);
        if (JSON.stringify(await authoredColors(page)) !== JSON.stringify(authoredLight))
          failures.push(
            `${category} ${viewport.width}px: returning to light mode changed authored colors`,
          );
        if (category === "birthdays" || category === "weddings") {
          await page.evaluate(() => window.__setLandingAppearance("dark"));
          if (category === "birthdays") {
            for (const panel of ["Details", "Gifts", "RSVP"]) {
              await page.getByRole("tab", { name: panel, exact: true }).click();
              assert.equal(
                await page
                  .getByRole("tab", { name: panel, exact: true })
                  .getAttribute("aria-selected"),
                "true",
              );
              await checkInteractiveState(
                page,
                category,
                `guest-${panel}`,
                viewport.width,
                results,
                failures,
              );
            }
            const prompts = page
              .getByRole("tablist", { name: "Birthday prompts" })
              .getByRole("tab");
            for (let index = 1; index < (await prompts.count()); index++) {
              await prompts.nth(index).click();
              assert.equal(await prompts.nth(index).getAttribute("aria-selected"), "true");
              await checkInteractiveState(
                page,
                category,
                `prompt-${index}`,
                viewport.width,
                results,
                failures,
              );
            }
          } else {
            for (const theme of ["Classic Ivory", "Midnight Noir", "Champagne Gold"]) {
              await page.getByRole("button", { name: theme, exact: true }).click();
              await checkInteractiveState(page, category, theme, viewport.width, results, failures);
            }
          }
        }
      }
      await context.close();
    }
    fs.writeFileSync(path.join(output, "contrast.json"), JSON.stringify(results, null, 2));
    assert.deepEqual(unexpected, [], "all fixture requests use existing local resources");
    assert.deepEqual(errors, [], "real landing views render without browser errors");
    assert.deepEqual(
      failures,
      [],
      "all non-photographic text/background pairs meet WCAG AA contrast",
    );
  } finally {
    await browser.close();
  }
});
