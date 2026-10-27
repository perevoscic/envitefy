const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToString } = require("react-dom/server");
const postcss = require("postcss");
const ts = require("typescript");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/category-editorial-heroes");
const fixture = path.resolve("scripts/fixtures/category-editorial-heroes.tsx");
const publicRoot = path.resolve("public");
const base = "http://category-editorial.test";
const serverCss = new Set();
const moduleCache = new Map();

// Match the browser fixture's CSS module loader while retaining real server markup.
function loadLocal(filename) {
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
  const module = { exports: {} };
  moduleCache.set(filename, module);
  if (filename.endsWith(".css")) {
    const names = {};
    const prefix = path.basename(filename).replace(/\W/g, "_");
    const css = postcss.parse(fs.readFileSync(filename, "utf8"));
    css.walkRules((rule) => {
      const globals = [];
      const selector = rule.selector.replace(/:global\(([^()]*)\)/g, (_, value) => {
        globals.push(value);
        return `__fixture_global_${globals.length - 1}__`;
      });
      rule.selector = selector
        .replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
          names[name] = `${prefix}_${name}`;
          return `.${names[name]}`;
        })
        .replace(/__fixture_global_(\d+)__/g, (_, index) => globals[Number(index)]);
    });
    serverCss.add(css.toString());
    module.exports = { __esModule: true, default: names };
    return module.exports;
  }
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name === "lucide-react")
      return {
        ArrowRight: loadLocal(
          path.resolve("node_modules/lucide-react/dist/esm/icons/arrow-right.js"),
        ).default,
        ArrowDownRight: loadLocal(
          path.resolve("node_modules/lucide-react/dist/esm/icons/arrow-down-right.js"),
        ).default,
      };
    if (name === "next/link" || /(?:^|[/\\])PublicCreationLink$/.test(name)) {
      return {
        __esModule: true,
        default: ({ children, ...props }) => React.createElement("a", props, children),
      };
    }
    if (name === "next/image") {
      return loadLocal(path.resolve("scripts/fixtures/landing-product/image.tsx"));
    }
    if (name.startsWith("@/") || name.startsWith(".")) {
      const target = name.startsWith("@/")
        ? path.resolve("src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const resolved = [target, `${target}.tsx`, `${target}.ts`, `${target}.mjs`].find(
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      assert.ok(resolved, `Resolve ${name} from ${filename}`);
      return loadLocal(resolved);
    }
    return require(name);
  };
  new Function("require", "module", "exports", source)(localRequire, module, module.exports);
  return module.exports;
}

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  const navigation = path.resolve("scripts/fixtures/landing-product/navigation.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: fixture,
      output: { path: output, filename: "fixture.js" },
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/link": navigation,
          "next/image": path.resolve("scripts/fixtures/landing-product/image.tsx"),
          "@": path.resolve("src"),
        },
      },
      plugins: [
        new compiled.webpack.NormalModuleReplacementPlugin(
          /(?:^|[/\\])PublicCreationLink(?:\.tsx)?$/,
          (resource) => {
            resource.request = navigation;
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
  return loadLocal(fixture);
}

const baseStyles =
  '@font-face{font-family:"Playfair Display";font-style:normal;font-weight:400 900;font-display:swap;src:url(/fonts/birthday/playfairdisplay.ttf) format("truetype")}' +
  '@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/birthday/inter.ttf) format("truetype")}' +
  ':root{--font-playfair:"Playfair Display",Georgia,serif;--font-geist-sans:"Inter",system-ui,sans-serif}*{box-sizing:border-box}body{margin:0}button,input{font:inherit}svg{flex-shrink:0}';

function contentType(filename) {
  return (
    {
      ".js": "text/javascript",
      ".webp": "image/webp",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    }[path.extname(filename)] || "application/octet-stream"
  );
}

async function serve(context, Component, unexpected) {
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
      const category = url.searchParams.get("category") || undefined;
      const markup = renderToString(React.createElement(Component, { category }));
      return route.fulfill({
        contentType: "text/html",
        body:
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' +
          baseStyles +
          [...serverCss].join("\n") +
          '</style></head><body><div id="root">' +
          markup +
          '</div><script src="/fixture.js"></script></body></html>',
      });
    }
    const filename = path.resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    if (
      filename.startsWith(publicRoot + path.sep) &&
      fs.existsSync(filename) &&
      fs.statSync(filename).isFile()
    ) {
      return route.fulfill({ contentType: contentType(filename), body: fs.readFileSync(filename) });
    }
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

async function ready(page, category) {
  await page.goto(`${base}/?category=${category || ""}`);
  await page.locator("[data-marketing-hero]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
}

async function assertLayout(page, category) {
  assert.equal(await page.locator("h1").count(), 1, `${category}: a single readable main heading`);
  const hero = page.locator("[data-marketing-hero]");
  assert.ok(
    (await hero.locator("h1").innerText()).trim().length > 12,
    `${category}: useful heading`,
  );
  assert.equal(
    await hero.getByRole("link", { name: "See the details" }).getAttribute("href"),
    "#details",
  );
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      overflow: root.scrollWidth - root.clientWidth,
      text: [
        ...document.querySelectorAll("h1,[data-marketing-hero] a,[data-appearance-scope=authored]"),
      ].map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          label: node.textContent.trim().slice(0, 60),
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        };
      }),
      viewport: innerWidth,
      overflows: [...document.querySelectorAll("body *")]
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            tag: node.tagName,
            className: typeof node.className === "string" ? node.className : "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            text: node.textContent.trim().slice(0, 40),
          };
        })
        .filter((box) => box.right > innerWidth + 1 || box.left < -1)
        .slice(0, 15),
    };
  });
  assert.ok(
    geometry.overflow <= 1,
    `${category} at ${geometry.viewport}px: no horizontal overflow (${geometry.overflow}px): ${JSON.stringify(geometry.overflows)}`,
  );
  for (const box of geometry.text) {
    assert.ok(box.width > 0 && box.height > 0, `${category}: ${box.label} has readable geometry`);
    assert.ok(
      box.left >= -1 && box.right <= geometry.viewport + 1,
      `${category}: ${box.label} fits the viewport`,
    );
  }
  const preview = page.getByRole("complementary", { name: "Sample guest page" });
  assert.equal(await preview.count(), 1, `${category}: keep the original readable preview`);
  assert.deepEqual(
    await preview.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      color: getComputedStyle(node).color,
    })),
    { background: "rgb(255, 252, 246)", color: "rgb(73, 59, 60)" },
    `${category}: authored preview colors`,
  );
  if (category) {
    assert.equal(await hero.getAttribute("data-category-hero"), category);
    assert.equal(await page.locator(`[data-category-preview="${category}"]`).count(), 1);
    assert.ok((await hero.locator("img").count()) > 0, `${category}: relevant hero media`);
    const headingTypography = await page
      .locator(`[data-category-preview="${category}"] > div > div > h2`)
      .evaluate((node) => ({
        fontFamily: getComputedStyle(node).fontFamily,
        fontWeight: getComputedStyle(node).fontWeight,
      }));
    assert.match(
      headingTypography.fontFamily,
      /Envitefy Category Editorial/,
      `${category}: route styles preserve the editorial preview heading font`,
    );
    assert.equal(
      headingTypography.fontWeight,
      "500",
      `${category}: route styles preserve the editorial preview heading weight`,
    );
  } else {
    assert.equal(
      await hero.getAttribute("data-category-hero"),
      null,
      "generic marketing pages retain the original hero",
    );
  }
}

test("category editorial heroes retain readable media, actions and authored previews across viewport and motion settings", {
  timeout: 120000,
}, async () => {
  const { default: Component, categories } = await buildFixture();
  const fallbackChrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google/Chrome/Application/chrome.exe",
  );
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath())
      ? chromium.executablePath()
      : fs.existsSync(fallbackChrome)
        ? fallbackChrome
        : undefined);
  const browser = await chromium.launch({ headless: true, executablePath });
  const unexpected = [];
  const errors = [];
  const largeTextFailures = [];
  try {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 320, height: 740 },
      { width: 844, height: 390 },
    ]) {
      const context = await browser.newContext({ viewport });
      await serve(context, Component, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      for (const category of [...categories, undefined]) {
        await ready(page, category);
        await assertLayout(page, category);
      }
      if (viewport.width === 1440 || viewport.width === 390) {
        await page.emulateMedia({ reducedMotion: "reduce" });
        for (const category of [
          "birthdays",
          "sports",
          "weddings",
          "baby-showers",
          "bridal-showers",
        ]) {
          await ready(page, category);
          await page.screenshot({
            path: path.join(output, `${category}-${viewport.width}.png`),
            fullPage: true,
          });
        }
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await ready(page, "birthdays");
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await page.screenshot({
        path: path.join(output, `birthdays-${viewport.width}-large-text.png`),
        fullPage: true,
      });
      try {
        await assertLayout(page, "birthdays");
      } catch (error) {
        largeTextFailures.push(error.message);
      }
      await context.close();
    }
    for (const mode of ["reduced-motion", "no-javascript"]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
        javaScriptEnabled: mode !== "no-javascript",
      });
      await serve(context, Component, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      for (const category of categories) {
        await ready(page, category);
        await assertLayout(page, category);
        const hidden = await page
          .locator("[data-motion-reveal]")
          .evaluateAll(
            (nodes) => nodes.filter((node) => getComputedStyle(node).opacity !== "1").length,
          );
        assert.equal(hidden, 0, `${category}: all content visible with ${mode}`);
      }
      await page.evaluate(() => document.documentElement.classList.add("dark"));
      await assertLayout(page, categories.at(-1));
      await context.close();
    }
    assert.deepEqual(unexpected, [], "all media and fonts come from existing local assets");
    assert.deepEqual(errors, [], "no browser errors or hydration failures");
    assert.deepEqual(
      largeTextFailures,
      [],
      "headings, actions and authored previews fit with 200% text",
    );
  } finally {
    await browser.close();
  }
});
