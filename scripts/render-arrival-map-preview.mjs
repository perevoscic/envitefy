import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
const loadTs = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");
const { encodeScanArtworkWebp } = loadTs("src/lib/ocr/artwork-webp.ts");
const out = path.resolve("output/arrival-map-preview");
const savedReview = process.argv.includes("--saved-event");
let information = JSON.parse(await fs.readFile(path.join(out, "information.json"), "utf8"));
if (savedReview) {
  const before = JSON.parse(await fs.readFile(path.join(out, "gateway-before-map.json"), "utf8"));
  const saved = JSON.parse(await fs.readFile(path.join(out, "gateway-map-save.json"), "utf8"));
  const localImage = async (name) => `data:image/webp;base64,${(await fs.readFile(path.join(out, name))).toString("base64")}`;
  information = structuredClone(before.data.customEventPage);
  information.details.location = saved.location;
  information.details.sections[saved.sectionIndex].map = {
    ...saved.map,
    sourceImage: await localImage("source-0.webp"),
    mapImage: await localImage("map-0.webp"),
  };
  information.details.sections[saved.sectionIndex].body = "Use the map below to find the parking and student drop-off areas marked on the handout. Please park by the Rec Hall and leave the closest spaces for pumpkin-patch visitors. Follow staff guidance upon arrival.";
}
const mappedSection = information.details.sections.find((s) => s.map);
if (!mappedSection) throw new Error("No extracted source map is available.");
execFileSync(
  process.env.BUN_EXECUTABLE || path.join(process.env.APPDATA, "npm/node_modules/bun/bin/bun.exe"),
  ["scripts/build-category-custom-design-fixture.mjs"],
  { stdio: "pipe" },
);
const preview = {
  ...information,
  artwork: mappedSection.map.mapImage,
  design: {
    ...information.design,
    colors: { page: "#e8f3f5", surface: "#ffffff", ink: "#183941", accent: "#305865" },
  },
};
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const origin = "http://localhost:43136";
try {
  for (const width of [1280, 375]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript((value) => {
      window.testEditorPage = value;
    }, preview);
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (["/entry.js", "/entry.css", "/global.css"].includes(url.pathname))
        return route.fulfill({
          contentType: url.pathname.endsWith(".js") ? "text/javascript" : "text/css",
          body: await fs.readFile(
            path.resolve("output/category-custom-design", url.pathname.slice(1)),
          ),
        });
      if (url.pathname.startsWith("/fonts/")) return route.fulfill({ status: 404 });
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gateway parking preview</title><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/entry.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>',
      });
    });
    await page.goto(`${origin}/preview?guest=1`);
    const section = page
      .getByRole("heading", { name: mappedSection.title, exact: true })
      .locator("..");
    await section.waitFor();
    await section
      .getByRole("img", { name: "Street map of the event area with numbered arrival locations" })
      .waitFor();
    const bytes = await section.screenshot({ type: "png" });
    await fs.writeFile(
      path.join(out, `${savedReview ? "gateway-saved" : "live"}-parking-section-${width}.webp`),
      await encodeScanArtworkWebp(bytes),
    );
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(path.join(out, `${savedReview ? "gateway-saved" : "live"}-parking-section-1280.webp`));
