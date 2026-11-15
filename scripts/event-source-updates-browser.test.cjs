const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const load = require("./lib/event-messages-test-loader.cjs");
const { emptyCustomEventDetails } = load("src/lib/event-custom-design.ts");
const { informationSourceFacts } = load("src/lib/event-source-updates.ts");
compiled.init();
const output = path.resolve(".qa/source-updates-browser");
let script;
test.before(
  async () => {
    await new Promise((resolve, reject) => {
      const compiler = compiled.webpack({
        mode: "development",
        target: "web",
        devtool: false,
        entry: path.resolve("scripts/fixtures/event-editor.tsx"),
        output: { path: output, filename: "fixture.js" },
        plugins: [
          new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
          new compiled.webpack.DefinePlugin({
            "process.env": JSON.stringify({ NODE_ENV: "development" }),
          }),
        ],
        resolve: {
          extensions: [".tsx", ".ts", ".js", ".json"],
          alias: {
            "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
            "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
            "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
            "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
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
            { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
          ],
        },
      });
      compiler.run((error, stats) =>
        compiler.close(() =>
          error || stats?.hasErrors()
            ? reject(error || new Error(stats.toString({ all: false, errors: true })))
            : resolve(),
        ),
      );
    });
    script = fs.readFileSync(path.join(output, "fixture.js"));
  },
  { timeout: 60000 },
);

for (const width of process.env.SOURCE_UPDATES_WIDTH
  ? [Number(process.env.SOURCE_UPDATES_WIDTH)]
  : [320, 390, 1280])
  test(`URL source review, explicit save/reopen, and ended controls at ${width}px`, {
    timeout: 60000,
  }, async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const page = await browser.newPage({
      viewport: { width, height: 850 },
      colorScheme: width === 320 ? "dark" : "light",
    });
    const errors = [],
      writes = [],
      base = "http://localhost:43147";
    let checks = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    page.setDefaultTimeout(15000);
    const original = {
      ...emptyCustomEventDetails(),
      title: "Winter Meet",
      description: "Original description",
      date: "2099-04-10",
      venue: "Original arena",
      location: "123 Arena Road",
      timezone: "America/Chicago",
    };
    let row = {
      id: "source-event",
      title: "Winter Meet",
      permissions: { role: "owner", canEdit: true },
      data: {
        status: "published",
        draftStatus: "published",
        category: "General Events",
        sourceUpdates: {
          version: 1,
          url: "https://example.com/meet",
          facts: informationSourceFacts(original),
        },
        customEventPage: {
          version: 1,
          category: "general",
          artwork: "/api/blob/saved-artwork.webp",
          design: {
            version: 1,
            name: "Saved",
            description: "",
            layout: "banner",
            font: "editorial",
            colors: { page: "#ffffff", surface: "#ffffff", ink: "#111111", accent: "#675cf4" },
          },
          details: { ...original, venue: "Host's corrected arena" },
        },
      },
    };
    await page.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      const json = (body) =>
        route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
      if (url.pathname === "/fixture.js")
        return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
      if (url.pathname === "/api/history/source-event") {
        if (request.method() === "PATCH") {
          const body = request.postDataJSON();
          writes.push(body);
          row = { ...row, title: body.title, data: { ...row.data, ...body.data } };
        }
        return json(row);
      }
      if (url.pathname.endsWith("/source-updates")) {
        if (request.method() === "GET")
          return json({ eligible: true, url: row.data.sourceUpdates.url, ended: false });
        checks++;
        return json({
          previous: row.data.sourceUpdates.facts,
          incoming: informationSourceFacts({
            ...original,
            description: "New schedule published",
            venue: "Source's changed arena",
          }),
          warnings: [],
          checkedAt: "2026-11-14T18:00:00Z",
        });
      }
      if (url.pathname === "/api/event-themes/generate")
        return json({ details: request.postDataJSON().currentDetails });
      if (url.pathname.startsWith("/api/")) return json({});
      if (url.origin === base)
        return route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: `<html class="${width === 320 ? "dark" : ""}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial;--surface:${width === 320 ? "#181424" : "white"};--foreground:${width === 320 ? "white" : "#302a3a"};--border:#8e839e;--primary:#675cf4;--primary-foreground:white}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
        });
      return route.abort();
    });
    try {
      await page.goto(`${base}/event/design/customize?mode=upload&edit=source-event`);
      const check = page.getByRole("button", { name: "Check original link for updates", exact: true });
      const openMenu = async () => {
        const opener = page.getByRole("button", { name: "Continue editing", exact: true });
        await Promise.race([check.waitFor(), opener.waitFor()]);
        if (await opener.isVisible()) await opener.click();
        await check.waitFor();
      };
      await openMenu();
      await page.locator("[data-event-page-editor] aside").evaluate(async panel => {
        await Promise.all(panel.getAnimations().map(animation => animation.finished.catch(() => {})));
      });
      const placement = await check.evaluate(button => {
        const menu = button.closest("aside");
        const design = [...(menu?.querySelectorAll("button") || [])].find(item => item.textContent.trim().startsWith("Design"));
        const bounds = button.getBoundingClientRect();
        return {
          inEditingMenu: Boolean(menu) && !button.closest("footer"),
          afterSections: button.previousElementSibling?.textContent.trim().startsWith("Sections"),
          beforeDesign: Boolean(design && (button.compareDocumentPosition(design) & Node.DOCUMENT_POSITION_FOLLOWING)),
          top: bounds.top, bottom: bounds.bottom, height: bounds.height,
          viewport: innerHeight,
        };
      });
      assert.equal(placement.inEditingMenu, true, "source updates belong to the editing menu");
      assert.equal(placement.afterSections, true, "source updates sit directly below Sections");
      assert.equal(placement.beforeDesign, true, "content updates precede visual design tools");
      assert.ok(placement.top >= 0 && placement.bottom <= placement.viewport && placement.height >= 44, "source updates are discoverable without scrolling");
      assert.match(await check.innerText(), /Review new information from example\.com\./);
      await page.screenshot({ path: path.join(output, `menu-${width}.png`), fullPage: true });
      assert.equal(checks, 0, "loading an editor never checks automatically");
      await check.click();
      const dialog = page.getByRole("dialog", { name: "Review source updates" });
      await dialog.waitFor();
      const conflict = dialog.locator("article").filter({ hasText: "You edited this" });
      assert.equal(await conflict.getByRole("checkbox").isChecked(), false);
      assert.equal(writes.length, 0, "checking never writes an event");
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
      await page.screenshot({ path: path.join(output, `review-${width}.png`) });
      await dialog.getByRole("button", { name: "Apply selected (1)", exact: true }).click();
      await page.waitForFunction(() =>
        document.activeElement?.textContent?.includes("Check original link for updates"),
      );
      assert.equal(writes.length, 0, "applying only edits mounted fields");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await page.waitForFunction(
        () =>
          !document.querySelector(
            '[role="group"][aria-label="Save event"] button[aria-busy="true"]',
          ),
      );
      assert.equal(writes.length, 1);
      assert.equal(row.data.customEventPage.details.description, "New schedule published");
      assert.equal(row.data.customEventPage.details.venue, "Host's corrected arena");
      assert.equal(row.data.customEventPage.artwork, "/api/blob/saved-artwork.webp");
      assert.equal(row.id, "source-event");
      await page.reload();
      await openMenu();
      await check.click();
      await dialog.waitFor();
      assert.equal(
        await dialog.locator("article").count(),
        1,
        "an unchecked conflict remains reviewable after save/reopen",
      );
      assert.equal(await dialog.locator("article").getByRole("checkbox").isChecked(), false);
      await dialog.getByRole("button", { name: "Close source updates", exact: true }).click();
      row.data.customEventPage.details.date = "2020-04-10";
      await page.reload();
      await openMenu();
      assert.equal(await check.isDisabled(), true);
      assert.equal(checks, 2);
      assert.deepEqual(errors, []);
    } catch (error) {
      await page.screenshot({ path: path.join(output, `failure-${width}.png`) });
      throw new Error(
        `${error.message}\nBrowser errors: ${errors.join("; ")}\nPage: ${(await page.locator("body").innerText()).slice(0, 4000)}`,
        { cause: error },
      );
    } finally {
      await browser.close();
    }
  });

test("gymnastics source updates change a session in place and retain host rows, notes and artwork through save/reopen", {
  timeout: 60000,
}, async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  page.setDefaultTimeout(15000);
  const base = "http://localhost:43148",
    errors = [],
    writes = [];
  let metadataReads = 0,
    sourceChecks = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  const original = {
    title: "Winter Meet",
    date: "2099-04-10",
    time: "",
    endDate: "2099-04-10",
    endTime: "",
    venue: "Arena",
    address: "123 Arena Road",
    advancedSections: {
      schedule: {
        enabled: true,
        days: [
          {
            id: "day-original",
            isoDate: "2099-04-10",
            shortDate: "Saturday",
            sessions: [
              {
                id: "session-original",
                code: "A1",
                label: "Gym A",
                group: "Level 6",
                startTime: "09:00",
                warmupTime: "08:30",
                note: "Original note",
                clubs: [],
              },
            ],
          },
        ],
      },
    },
  };
  const incoming = structuredClone(original);
  incoming.advancedSections.schedule.days[0].sessions[0].startTime = "10:00";
  incoming.advancedSections.schedule.days[0].sessions.push({
    id: "new-session",
    code: "A2",
    label: "Gym A",
    group: "Level 7",
    startTime: "",
    warmupTime: "",
    note: "",
    clubs: [],
  });
  const mounted = structuredClone(original);
  mounted.advancedSections.schedule.days[0].sessions[0].note = "Host instruction";
  mounted.advancedSections.schedule.days[0].sessions.push({
    id: "host-session",
    code: "B1",
    label: "Host finals",
    startTime: "16:00",
    clubs: [],
  });
  let row = {
    id: "gym-source",
    title: original.title,
    revision: "original",
    permissions: { role: "owner", canEdit: true },
    data: {
      ...mounted,
      status: "published",
      draftStatus: "published",
      category: "gymnastics",
      createdVia: "meet-discovery",
      createdManually: false,
      timezone: "America/Chicago",
      timezoneSource: "manual",
      pageTemplateId: "airborne-atlas",
      heroImage: "/api/blob/retained-gym.webp",
      discoverySource: {
        workflow: "gymnastics",
        pipelineVersion: "gym-public-v2",
        input: null,
        parseResult: {},
        extractionMeta: {},
        publicPageSections: {},
        enrichment: { state: "completed", pending: false },
      },
    },
  };
  await page.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const json = (body) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    if (url.pathname === "/fixture.js")
      return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
    if (url.pathname === "/api/history/gym-source") {
      if (request.method() === "PATCH") {
        const body = request.postDataJSON();
        writes.push(body);
        row = {
          ...row,
          title: body.title,
          revision: `save-${writes.length}`,
          data: { ...row.data, ...body.data },
        };
      }
      return json(row);
    }
    if (url.pathname.endsWith("/source-updates")) {
      if (request.method() === "GET") {
        metadataReads++;
        return json({ eligible: true, url: "https://example.com/meet", ended: false });
      }
      sourceChecks++;
      return json({
        previous: row.data.sourceUpdates?.facts || original,
        incoming,
        warnings: [],
        checkedAt: "2026-11-14T18:00:00Z",
      });
    }
    if (url.pathname.startsWith("/api/")) return json({});
    if (url.origin === base)
      return route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>',
      });
    return route.abort();
  });
  try {
    await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=gym-source`);
    const check = page.getByRole("button", { name: "Check original link for updates", exact: true });
    await check.waitFor();
    assert.equal(metadataReads, 1, "the original URL is recovered from protected import metadata");
    assert.equal(sourceChecks, 0, "metadata lookup never crawls the source");
    assert.equal(writes.length, 0);
    assert.equal(
      await page.getByRole("button", { name: "Save changes", exact: true }).count(),
      0,
      "source metadata hydration stays clean",
    );
    await page.locator("[data-event-page-editor] aside").evaluate(async panel => {
      await Promise.all(panel.getAnimations().map(animation => animation.finished.catch(() => {})));
    });
    await page.screenshot({ path: path.join(output, "gym-menu-refresh.png"), fullPage: true });
    await check.screenshot({ path: path.join(output, "gym-original-url-recovered-button.png") });
    await check.click();
    const dialog = page.getByRole("dialog", { name: "Review source updates" });
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Apply selected (2)", exact: true }).click();
    assert.equal(writes.length, 0);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    const day = row.data.advancedSections.schedule.days[0];
    assert.equal(day.id, "day-original");
    assert.equal(day.sessions.length, 3);
    assert.equal(day.sessions[0].id, "session-original");
    assert.equal(day.sessions[0].startTime, "10:00");
    assert.equal(day.sessions[0].note, "Host instruction");
    assert.equal(day.sessions.find((session) => session.id === "host-session").startTime, "16:00");
    assert.equal(row.data.heroImage, "/api/blob/retained-gym.webp");
    await page.reload();
    await check.waitFor();
    await check.click();
    await dialog.waitFor();
    await dialog.getByText("No changes found.", { exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Close source updates", exact: true }).click();
    const beforeTemplateMetadataReads = metadataReads;
    const beforeTemplateChecks = sourceChecks;
    const beforeTemplateWrites = writes.length;
    delete row.data.sourceUpdates;
    row.data.templateEditor = { category: "gymnastics", templateId: "airborne-atlas", snapshot: {} };
    await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?mode=gymnastics-template&edit=gym-source&editor=menu`);
    await check.waitFor();
    assert.equal(metadataReads, beforeTemplateMetadataReads + 1, "the gallery template route reads its parent provider's event cache");
    assert.equal(sourceChecks, beforeTemplateChecks, "opening the template editor never checks the source automatically");
    assert.equal(writes.length, beforeTemplateWrites);
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(output, "failure-gym.png") });
    throw new Error(
      `${error.message}\nBrowser errors: ${errors.join("; ")}\nPage: ${(await page.locator("body").innerText()).slice(0, 3000)}`,
      { cause: error },
    );
  } finally {
    await browser.close();
  }
});
