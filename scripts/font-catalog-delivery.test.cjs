const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToString } = require("react-dom/server");
const postcss = require("postcss");
const { chromium } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();
const { FONT_CATALOG_STYLESHEET } = loadTs("src/lib/font-catalog-stylesheet.ts");
const output = path.resolve("output/font-catalog-delivery");

function fontFaces(css) {
  const faces = [];
  postcss.parse(css).walkAtRules("font-face", (face) => faces.push(face.toString()));
  return faces;
}

test("versioned catalog keeps every authored descriptor and root keeps shared body faces", () => {
  const source = fs.readFileSync("src/app/gallery-fonts.css", "utf8");
  assert.equal(fs.readFileSync(path.join("public", FONT_CATALOG_STYLESHEET), "utf8"), source);
  const catalogFaces = fontFaces(source);
  assert.ok(catalogFaces.length > 600);
  const shared = fontFaces(fs.readFileSync("src/app/shared-gallery-fonts.css", "utf8"));
  assert.equal(shared.length, 5);
  for (const face of shared) assert.ok(catalogFaces.includes(face), "shared face preserves every descriptor and Unicode range");
  const globals = fs.readFileSync("src/app/globals.css", "utf8");
  assert.match(globals, /@import "\.\/shared-gallery-fonts\.css"/);
  assert.doesNotMatch(globals, /@import "\.\/gallery-fonts\.css"/);
  assert.match(globals, /url\("\/fonts\/Josefin_Slab\/JosefinSlab-VariableFont_wght\.ttf"\)/);
});

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false, cache: false,
      entry: path.resolve("scripts/fixtures/font-catalog-delivery.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("development") })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "@": path.resolve("src"),
        "next/navigation$": path.resolve("scripts/fixtures/font-catalog-runtime.tsx"),
        "next-auth/react$": path.resolve("scripts/fixtures/font-catalog-runtime.tsx"),
      } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
      performance: { hints: false },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  return fs.readFileSync(path.join(output, "fixture.js"), "utf8");
}

function serverMarkup(initialPath, initialStatus) {
  const cache = new Map();
  const runtime = loadTs("scripts/fixtures/font-catalog-runtime.tsx", {}, cache);
  const { FontCatalogFixture } = loadTs("scripts/fixtures/font-catalog-delivery.tsx", {
    "next/navigation": runtime, "next-auth/react": runtime,
  }, cache);
  return renderToString(React.createElement(FontCatalogFixture, { initialPath, initialStatus }));
}

function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
  return fs.existsSync(chrome) ? chrome : undefined;
}

test("catalog is server-rendered for saved fonts and loads across homepage/editor/auth transitions", { timeout: 120000 }, async () => {
  const bundle = await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  try {
    for (const scenario of [
      { path: "/landing", status: "unauthenticated", needsCatalog: false },
      { path: "/", status: "unauthenticated", needsCatalog: false },
      { path: "/", status: "authenticated", needsCatalog: true },
      { path: "/event/saved-custom-font", status: "unauthenticated", needsCatalog: true },
    ]) {
      const markup = serverMarkup(scenario.path, scenario.status);
      assert.equal(markup.includes(FONT_CATALOG_STYLESHEET), scenario.needsCatalog, `${scenario.path}: SSR catalog delivery`);
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      const requests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (/hydrat|did not match/i.test(message.text())) errors.push(message.text()); });
      page.on("request", (request) => requests.push(new URL(request.url()).pathname));
      await context.route("http://font-delivery.test/**", async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: bundle });
        if (pathname.startsWith("/fonts/")) return route.fulfill({ contentType: pathname.endsWith(".css") ? "text/css" : "font/woff2", body: fs.readFileSync(path.join("public", pathname)) });
        return route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"></head><body data-initial-path="${scenario.path}" data-initial-status="${scenario.status}"><div id="root">${markup}</div><script src="/fixture.js"></script></body></html>` });
      });
      await page.goto(`http://font-delivery.test${scenario.path}`);
      await page.getByTestId("route").waitFor();
      assert.equal(requests.includes(FONT_CATALOG_STYLESHEET), scenario.needsCatalog);
      if (!scenario.needsCatalog) {
        await page.getByRole("button", { name: "Open editor" }).click();
        await page.waitForFunction(() => document.querySelector('[data-testid="route"]').textContent.startsWith("/birthdays/templates/customize"));
      }
      await page.evaluate(async () => { await document.fonts.load('32px "Instrument Serif"'); await document.fonts.ready; });
      assert.equal(await page.evaluate(() => document.fonts.check('32px "Instrument Serif"')), true);
      assert.ok(requests.some((url) => /instrumentserif-.*\.woff2$/.test(url)), "saved/custom font binary loads from full catalog");
      assert.equal(await page.locator(`link[rel="stylesheet"][href="${FONT_CATALOG_STYLESHEET}"]`).count(), 1);
      await page.getByRole("button", { name: "Home", exact: true }).click();
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="route"]').textContent === "/:authenticated");
      assert.equal(await page.locator(`link[rel="stylesheet"][href="${FONT_CATALOG_STYLESHEET}"]`).count(), 1, "React retains one shared catalog across authentication/navigation");
      assert.deepEqual(errors, []);
      await context.close();
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJs.newPage();
    await noJs.route("http://font-no-js.test/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      return route.fulfill(pathname.startsWith("/fonts/")
        ? { contentType: pathname.endsWith(".css") ? "text/css" : "font/woff2", body: fs.readFileSync(path.join("public", pathname)) }
        : { contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"></head><body>${serverMarkup("/event/saved-custom-font", "unauthenticated")}</body></html>` });
    });
    await noJsPage.goto("http://font-no-js.test/event/saved-custom-font");
    assert.equal(await noJsPage.evaluate(() => document.fonts.check('32px "Instrument Serif"')), true, "saved custom typography loads without hydration");
    await noJs.close();
  } finally { await browser.close(); }
});

test("WOFF2 fonts render the same glyph pixels and metrics as their original TTFs", { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.route("http://font-equivalence.test/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      return route.fulfill(pathname.startsWith("/fonts/")
        ? { contentType: pathname.endsWith(".woff2") ? "font/woff2" : "font/ttf", body: fs.readFileSync(path.join("public", pathname)) }
        : { contentType: "text/html", body: "<!doctype html><html><head></head><body></body></html>" });
    });
    await page.goto("http://font-equivalence.test/");
    const differences = await page.evaluate(async () => {
      const failures = [];
      for (const name of ["inter", "playfairdisplay"]) {
        for (const [suffix, extension] of [["original", "ttf"], ["compressed", "woff2"]]) {
          const face = new FontFace(`${name}-${suffix}`, `url(/fonts/birthday/${name}.${extension})`);
          document.fonts.add(await face.load());
        }
        for (const weight of [400, 600, 700, 900]) {
          const rendered = ["original", "compressed"].map((suffix) => {
            const canvas = document.createElement("canvas"); canvas.width = 1600; canvas.height = 100;
            const ctx = canvas.getContext("2d"); ctx.font = `${weight} 32px "${name}-${suffix}"`; ctx.fillText("Envitefy · Àéœ – 0123456789 • Ελληνικά Кириллица", 10, 60);
            return { width: ctx.measureText("Envitefy · Àéœ – 0123456789 • Ελληνικά Кириллица").width, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height).data };
          });
          if (rendered[0].width !== rendered[1].width || rendered[0].pixels.some((value, index) => value !== rendered[1].pixels[index])) failures.push(`${name}:${weight}`);
        }
      }
      return failures;
    });
    assert.deepEqual(differences, []);
    await context.close();
  } finally { await browser.close(); }
});
