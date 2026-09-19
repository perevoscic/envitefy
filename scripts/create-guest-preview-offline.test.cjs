const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const { createHash } = require("node:crypto");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { chromium } = require("playwright");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const css = [];
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@/components/EventRsvpPrompt") return () => null;
  if (request === "@/components/CalendarAction") return { __esModule: true, default: () => React.createElement("button", null, "Add to Calendar"), useCalendarAction: () => ({ links: {}, label: "Add to Calendar", dialog: null, open() {}, hasDefault: false, isOpen: false }) };
  if (request === "@/components/EventTrackedLink") return ({ children, href }) => React.createElement("a", { href }, children);
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent); mod.paths = Module._nodeModulePaths(path.dirname(file)); mod._compile(fs.readFileSync(file, "utf8"), file); return mod.exports;
  }
  if (request === "@radix-ui/react-dialog") return {
    Root: ({ children, open }) => open ? children : null, Portal: ({ children }) => children,
    Content: ({ children, ...props }) => { delete props.onCloseAutoFocus; return React.createElement("div", props, children); },
    Overlay: (props) => React.createElement("div", props), Title: ({ children, ...props }) => React.createElement("h2", props, children), Close: ({ children }) => children,
  };
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request, parent, ...rest);
};
for (const ext of [".ts", ".tsx"]) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, file);
Module._extensions[".css"] = (mod, file) => {
  const names = {};
  const prefix = path.basename(file).split(".")[0];
  css.push(fs.readFileSync(file, "utf8").replace(/\.([a-zA-Z][\w-]*)/g, (_, name) => { names[name] = `${prefix}_${name}`; return `.${names[name]}`; }));
  mod.exports = names;
};
const Website = require("../src/components/concierge/ConciergeEventWebsite.tsx").default;
const Card = require("../src/components/studio/StudioShowcaseLiveCard.tsx").default;
const ArtworkDialog = require("../src/components/ArtworkPreviewDialog.tsx").default;
const campaign = path.join(process.cwd(), ".qa/create-campaign/2026-09-18");
function artworkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? artworkFiles(path.join(dir, entry.name)) : entry.name.endsWith(".webp") ? [path.join(dir, entry.name)] : []);
}
function hashes(files) { return files.map((file) => ({ path: path.relative(process.cwd(), file).replaceAll("\\", "/"), sha256: createHash("sha256").update(fs.readFileSync(file)).digest("hex") })); }
function contrastRatio(foreground, surface, underneath) {
  const values = (color) => color.match(/[\d.]+/g).map(Number);
  const fg = values(foreground); const bg = values(surface); const alpha = bg[3] ?? 1;
  const channels = bg.slice(0, 3).map((channel) => channel * alpha + underneath * (1 - alpha));
  const luminance = (rgb) => rgb.slice(0, 3).map((value) => { const n = value / 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const a = luminance(fg); const b = luminance(channels); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("archived artwork stays fully visible and controls stay outside it at mobile and desktop sizes", { timeout: 120000 }, async () => {
  const artifacts = artworkFiles(path.join(campaign, "cases"));
  if (process.env.REQUIRE_CREATE_CAMPAIGN_ARCHIVES === "1") assert.ok(artifacts.length >= 200, "full campaign verification requires all archived images");
  const before = hashes(artifacts);
  const globalSource = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/ArtworkPreviewDialog.tsx";\n@source "../components/concierge/ConciergeEventWebsite.tsx";\n@source "../components/studio/StudioShowcaseLiveCard.tsx";\n@source "../components/studio/StudioLiveCardActionSurface.tsx";');
  const builtCss = path.resolve(".next-dev/static/css/app/layout.css");
  const stylesheet = fs.existsSync(builtCss) ? { css: fs.readFileSync(builtCss, "utf8") } : await postcss([tailwind()]).process(globalSource, { from: path.resolve("src/app/globals.css") });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let blockedRequests = 0;
  await page.route("**/*", (route) => { blockedRequests++; return route.abort(); });
  const imageUrl = artifacts.length ? `data:image/webp;base64,${fs.readFileSync(artifacts[0]).toString("base64")}` : `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="white" stroke="black" stroke-width="16"/><text x="20" y="45" font-size="28">September 23 test fixture</text><text x="20" y="875" font-size="28">Full composition edge</text></svg>').toString("base64")}`;
  const preview = { id: "offline-regression", title: "September 23 workshop", imageUrl, invitationData: { heroTextMode: "image", eventDetails: { eventDate: "2026-09-23", startTime: "14:00", endTime: "16:00", timezone: "America/Chicago", venueName: "Maple Center", location: "Room B, 23 Oak Street", rsvpEnabled: true } } };
  const html = renderToStaticMarkup(React.createElement(ArtworkDialog, { open: true, title: "Artwork preview", onClose() {} }, React.createElement(Card, { preview, previewMode: true })));
  const outDir = path.join(campaign, "implementation");
  fs.mkdirSync(outDir, { recursive: true });
  const measurements = [];
  const contrasts = [];
  try {
    for (const [width, height] of [[320, 640], [360, 740], [390, 844], [430, 932], [768, 1024], [1440, 900], [844, 390], [320, 480]]) {
      await page.setViewportSize({ width, height });
      await page.setContent(`<style>${stylesheet.css}\n${css.join("\n")}</style>${html}`);
      const result = await page.evaluate(() => {
        const frame = document.querySelector("[data-live-card-artwork]").getBoundingClientRect();
        const image = document.querySelector("[data-live-card-artwork] img");
        const imageBox = image.getBoundingClientRect();
        const rail = document.querySelector("[data-live-card-actions-placement]").getBoundingClientRect();
        const close = document.querySelector('[aria-label="Close preview"]').getBoundingClientRect();
        return { width: innerWidth, height: innerHeight, frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height, bottom: frame.bottom }, image: { width: imageBox.width, height: imageBox.height, fit: getComputedStyle(image).objectFit }, rail: { y: rail.y, bottom: rail.bottom }, close: { bottom: close.bottom }, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      measurements.push(result);
      assert.ok(Math.abs(result.frame.width / result.frame.height - 2 / 3) < 0.002, JSON.stringify(result));
      assert.equal(result.image.fit, "contain");
      assert.ok(result.rail.y >= result.frame.bottom - 1, "guest rail must not cover artwork");
      assert.ok(result.close.bottom <= result.frame.y, "close control must not cover artwork");
      assert.equal(result.overflow, false);
      if (width === 390 || width === 844) await page.screenshot({ path: path.join(outDir, `guest-preview-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const file of artifacts) {
      const source = `data:image/webp;base64,${fs.readFileSync(file).toString("base64")}`;
      await page.locator("[data-live-card-artwork] img").evaluate(async (image, src) => { image.src = src; await image.decode(); }, source);
      assert.equal(await page.locator("[data-live-card-artwork] img").evaluate((image) => getComputedStyle(image).objectFit), "contain");
    }
    for (const foreground of ["light", "dark"]) {
      const website = renderToStaticMarkup(React.createElement(Website, { eventId: "offline", title: "September 23 Workshop", category: "Workshop", imageUrl, guestInstructions: ["Bring goggles.", "No gifts, please."], venueName: "Maple Center", location: "Room B, 23 Oak Street", whenLabel: "September 23, 2026 at 2–4 PM", pageTypography: { scale: 1.2, foreground } }));
      await page.setContent(`<style>${stylesheet.css}\n${css.join("\n")}</style>${website}`);
      const colors = await page.locator("[data-event-page-hero] h1").evaluate((heading) => ({ foreground: getComputedStyle(heading).color, surface: getComputedStyle(heading.parentElement).backgroundColor, size: getComputedStyle(heading).fontSize }));
      assert.equal(colors.foreground, foreground === "light" ? "rgb(255, 255, 255)" : "rgb(15, 23, 42)");
      assert.ok(parseFloat(colors.size) >= 48);
      const ratio = contrastRatio(colors.foreground, colors.surface, foreground === "light" ? 255 : 0);
      assert.ok(ratio >= 4.5, `${foreground} conservative contrast ${ratio}`);
      contrasts.push({ mode: foreground, ...colors, conservativeContrastRatio: ratio });
      await page.screenshot({ path: path.join(outDir, `guest-event-page-${foreground}.png`), fullPage: true });
    }
    assert.deepEqual(hashes(artifacts), before, "archived evidence must remain byte-for-byte unchanged");
    fs.writeFileSync(path.join(outDir, "guest-preview-bounds.json"), JSON.stringify({ archivedImages: artifacts.length, fixtureMode: artifacts.length ? "archived-negative-art" : "synthetic-geometry-only", measurements, contrasts, blockedRequests, noGenerationCalls: true, stubs: ["Radix modal primitives for static markup", "Calendar provider dialog", "RSVP client interaction", "event tracking"] }, null, 2));
    fs.writeFileSync(path.join(outDir, "guest-archived-artwork-hashes.json"), JSON.stringify(before, null, 2));
  } finally { await browser.close(); }
});
