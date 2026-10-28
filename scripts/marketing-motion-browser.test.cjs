const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/marketing-motion-browser");

async function buildFixture() {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "entry.tsx"),
    `
    import { useState } from "react";
    import { createRoot } from "react-dom/client";
    import MarketingMotion from "../../src/components/marketing/MarketingMotion";
    const originalRAF = window.requestAnimationFrame.bind(window);
    window.motionFrames = 0;
    window.motionMeasurementBatch = 0;
    window.motionLateReads = {};
    const originalRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function() {
      if (this.id === "late") {
        const batch = window.motionMeasurementBatch;
        window.motionLateReads[batch] = (window.motionLateReads[batch] || 0) + 1;
      }
      return originalRect.call(this);
    };
    window.requestAnimationFrame = callback => {
      window.motionFrames++;
      return originalRAF(time => { window.motionMeasurementBatch++; callback(time); });
    };
    function App() {
      const [enabled, setEnabled] = useState(true);
      return <div data-marketing-page>
        {enabled && <MarketingMotion />}
        <button id="unmount" style={{position:"fixed",right:0,top:0,zIndex:10}} onClick={() => setEnabled(false)}>Stop enhancement</button>
        <p id="initial" data-motion-reveal>Initially visible</p>
        <div style={{height:1000}} />
        <section id="contained" data-motion-scene data-motion-range="contain" style={{height:1600,"--scene-progress":"0.25"}}>Sticky scene</section>
        <section id="traverse" data-motion-scene style={{height:400}}>Traversal scene</section>
        <section id="exit" data-motion-scene data-motion-range="exit" data-motion-target="[data-exit-target]" style={{"--scene-progress":"0.18"}}><div data-exit-target style={{height:600}}>Exit geometry target</div><div style={{height:900}}>Following content does not delay exit</div></section>
        <section id="exit-self" data-motion-scene data-motion-range="exit" style={{height:400}}>Exit using the scene itself</section>
        <section id="exit-invalid" data-motion-scene data-motion-range="exit" data-motion-target="[" style={{height:400}}>Invalid selector falls back to the scene</section>
        <section id="exit-custom" data-motion-scene data-motion-range="exit" data-motion-exit-start="0.85" data-motion-exit-end="0.1" style={{height:400}}>Custom exit edges</section>
        <section id="exit-invalid-range" data-motion-scene data-motion-range="exit" data-motion-exit-start="0.1" data-motion-exit-end="0.85" style={{height:400}}>Invalid range uses defaults</section>
        <section id="read" data-motion-scene data-motion-range="read" style={{height:260,"--scene-progress":"0.33"}}>A heading read as it moves into view</section>
        <div style={{height:600}} />
        <section id="late" data-motion-scene data-motion-reveal style={{"--motion-index":2}}><button id="late-focus">Keyboard destination</button></section>
        <div style={{height:1000}} />
      </div>;
    }
    createRoot(document.getElementById("app")).render(<App />);
  `,
  );
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.join(output, "entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"] },
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

test("marketing motion follows native scroll, respects live reduced motion, and cleans up", {
  timeout: 30000,
}, async () => {
  await buildFixture();
  const chrome =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (fs.existsSync(chromium.executablePath())
      ? chromium.executablePath()
      : path.join(
          process.env.PROGRAMFILES || "C:\\Program Files",
          "Google/Chrome/Application/chrome.exe",
        ));
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const html = `<!doctype html><style>body{margin:0}p{margin:0;padding:20px}section{box-sizing:border-box}</style>
    <div id="app"><section data-motion-reveal id="static">Visible without JavaScript</section></div><script src="/fixture.js"></script>`;
  try {
    const noJs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 800 },
    });
    await noJs.route("http://motion.test/**", (route) =>
      route.fulfill({ contentType: "text/html", body: html }),
    );
    const staticPage = await noJs.newPage();
    await staticPage.goto("http://motion.test");
    assert.equal(
      await staticPage.locator("#static").evaluate((node) => getComputedStyle(node).opacity),
      "1",
    );
    await noJs.close();

    const context = await browser.newContext({
      viewport: { width: 390, height: 800 },
      reducedMotion: "no-preference",
    });
    await context.route("http://motion.test/**", (route) =>
      route.fulfill({
        contentType: route.request().url().endsWith("fixture.js") ? "text/javascript" : "text/html",
        body: route.request().url().endsWith("fixture.js")
          ? fs.readFileSync(path.join(output, "fixture.js"))
          : html,
      }),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://motion.test");
    await page.waitForFunction(
      () => document.querySelector("#contained")?.getAttribute("data-motion-ready") === "true",
    );
    assert.equal(await page.locator("#initial").getAttribute("data-motion-visible"), "true");
    assert.equal(await page.locator("#late").getAttribute("data-motion-visible"), "false");
    assert.ok(
      await page.evaluate(() => Object.values(window.motionLateReads).every((reads) => reads <= 1)),
      "A node used for both scene progress and reveal is measured once per update",
    );

    await page.evaluate(() => {
      const scene = document.querySelector("#contained");
      window.scrollTo(0, scene.offsetTop + (scene.offsetHeight - innerHeight) / 2);
    });
    await page.waitForFunction(
      () =>
        Math.abs(
          Number(document.querySelector("#contained").style.getPropertyValue("--scene-progress")) -
            0.5,
        ) < 0.01,
    );
    await page.evaluate(() => {
      const scene = document.querySelector("#traverse");
      window.scrollTo(0, scene.offsetTop - (innerHeight - scene.offsetHeight) / 2);
    });
    await page.waitForFunction(
      () =>
        Math.abs(
          Number(document.querySelector("#traverse").style.getPropertyValue("--scene-progress")) -
            0.5,
        ) < 0.01,
    );

    for (const [fraction, expected] of [
      [-0.25, 0],
      [0.5, 0.5],
      [1.25, 1],
      [0.25, 0.25],
    ]) {
      await page.evaluate((position) => {
        const target = document.querySelector("[data-exit-target]");
        window.scrollTo(
          0,
          scrollY +
            target.getBoundingClientRect().bottom -
            innerHeight +
            innerHeight * 0.7 * position,
        );
      }, fraction);
      await page.waitForFunction(
        (progress) =>
          Math.abs(
            Number(document.querySelector("#exit").style.getPropertyValue("--scene-progress")) -
              progress,
          ) < 0.01,
        expected,
      );
    }
    for (const id of ["exit-self", "exit-invalid", "exit-invalid-range"]) {
      await page.evaluate((targetId) => {
        const target = document.getElementById(targetId);
        window.scrollTo(0, scrollY + target.getBoundingClientRect().bottom - innerHeight * 0.65);
      }, id);
      await page.waitForFunction(
        (targetId) =>
          Math.abs(
            Number(document.getElementById(targetId).style.getPropertyValue("--scene-progress")) -
              0.5,
          ) < 0.01,
        id,
      );
    }

    for (const [edge, progress] of [
      [0.9, 0],
      [0.475, 0.5],
      [0.05, 1],
      [0.6625, 0.25],
    ]) {
      await page.locator("#exit-custom").evaluate((node, fraction) => {
        window.scrollTo(0, scrollY + node.getBoundingClientRect().bottom - innerHeight * fraction);
      }, edge);
      await page.waitForFunction(
        (expected) =>
          Math.abs(
            Number(
              document.querySelector("#exit-custom").style.getPropertyValue("--scene-progress"),
            ) - expected,
          ) < 0.01,
        progress,
      );
    }
    const stationaryScroll = await page.evaluate(() => scrollY);
    await page.locator("#exit-custom").evaluate((node) => {
      node.dataset.motionExitStart = "0.7";
      node.dataset.motionExitEnd = "0.2";
    });
    await page.waitForFunction(
      () =>
        Math.abs(
          Number(
            document.querySelector("#exit-custom").style.getPropertyValue("--scene-progress"),
          ) - 0.075,
        ) < 0.01,
    );
    assert.equal(
      await page.evaluate(() => scrollY),
      stationaryScroll,
      "Range measurements refresh without another scroll",
    );

    for (const [fraction, expected] of [
      [-0.25, 0],
      [0.5, 0.5],
      [1.25, 1],
      [0.25, 0.25],
    ]) {
      await page.evaluate((position) => {
        const target = document.querySelector("#read");
        const rect = target.getBoundingClientRect();
        window.scrollTo(
          0,
          scrollY + rect.top - innerHeight * 0.8 + (rect.height + innerHeight * 0.35) * position,
        );
      }, fraction);
      await page.waitForFunction(
        (progress) =>
          Math.abs(
            Number(document.querySelector("#read").style.getPropertyValue("--scene-progress")) -
              progress,
          ) < 0.01,
        expected,
      );
    }

    await page.locator("#late-focus").focus();
    assert.equal(await page.locator("#late").getAttribute("data-motion-instant"), "true");
    assert.equal(
      await page.locator("#late").evaluate((node) => getComputedStyle(node).opacity),
      "1",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () =>
        document.querySelector("[data-marketing-page]").getAttribute("data-motion-enhanced") ===
        "false",
    );
    assert.equal(await page.locator("#contained").getAttribute("data-motion-ready"), null);
    for (const id of [
      "exit",
      "exit-self",
      "exit-invalid",
      "exit-custom",
      "exit-invalid-range",
      "read",
    ]) {
      assert.equal(await page.locator(`#${id}`).getAttribute("data-motion-ready"), null);
      assert.equal(
        await page
          .locator(`#${id}`)
          .evaluate((node) => Number(node.style.getPropertyValue("--scene-progress"))),
        1,
      );
    }
    assert.equal(
      await page
        .locator("#contained")
        .evaluate((node) => Number(node.style.getPropertyValue("--scene-progress"))),
      1,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(
      () => document.querySelector("#contained").getAttribute("data-motion-ready") === "true",
    );

    await page.waitForTimeout(100);
    const idleFrames = await page.evaluate(() => window.motionFrames);
    await page.waitForTimeout(150);
    assert.equal(
      await page.evaluate(() => window.motionFrames),
      idleFrames,
      "no animation frames requested while idle",
    );
    await page.locator("#unmount").click();
    await page.waitForFunction(
      () => !document.querySelector("[data-marketing-page]").hasAttribute("data-motion-enhanced"),
    );
    assert.equal(
      await page
        .locator("#contained")
        .evaluate((node) => node.style.getPropertyValue("--scene-progress")),
      "0.25",
    );
    assert.equal(await page.locator("#late").getAttribute("data-motion-visible"), null);
    assert.equal(
      await page
        .locator("#exit")
        .evaluate((node) => node.style.getPropertyValue("--scene-progress")),
      "0.18",
    );
    assert.equal(
      await page
        .locator("#exit-self")
        .evaluate((node) => node.style.getPropertyValue("--scene-progress")),
      "",
    );
    assert.equal(
      await page
        .locator("#read")
        .evaluate((node) => node.style.getPropertyValue("--scene-progress")),
      "0.33",
    );
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
  }
});
