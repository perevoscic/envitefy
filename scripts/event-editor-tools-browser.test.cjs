const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const { resolveThemeCssVariables } = require("./lib/event-messages-test-loader.cjs")("src/themes/registry.ts");
compiled.init();
const { EVENT_HERO_LAYOUT_PRESETS } = require("./lib/event-messages-test-loader.cjs")("src/lib/event-hero-layout.ts");
const imageDesignCount = EVENT_HERO_LAYOUT_PRESETS.filter(({ layout }) => layout.imageStyle).length;
const { createImportedEventTheme } = require("./lib/event-messages-test-loader.cjs")("src/lib/imported-event-theme.ts");

const output = path.resolve(process.env.EVENT_EDITOR_TOOLS_OUTPUT || ".qa/event-editor-tools-browser");
let fixtureBuild;
const fixture = () => fixtureBuild ??= buildFixture();
async function buildFixture() {
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
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
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(
      fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "./event"; @source "../components/events"; @source "../components/templates";'),
      { from: path.resolve("src/app/globals.css") },
    )
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));

  return { script, css };
}

async function editorToolsCase({ width = 1440, category, specialized, menuKind, zone, fonts, recovered, retainedArtwork }) {
  const { script, css } = await fixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.emulateMedia({ colorScheme: width === 320 ? "dark" : "light" });
  page.setDefaultTimeout(12000);
  const base = "http://localhost:43135", records = new Map(), writes = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && /(?:uncontrolled.*controlled|controlled.*uncontrolled)/i.test(message.text())) errors.push(message.text());
  });
  page.on("dialog", dialog => dialog.accept());
  await page.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/history" && request.method() === "POST") {
      const body = request.postDataJSON(), id = `font-pair-${writes.length}`;
      const row = { ...body, id, revision: `${id}-saved`, permissions: { role: "owner" } };
      records.set(id, row); writes.push({ id, body });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname.startsWith("/api/history/")) {
      const id = url.pathname.split("/")[3], previous = records.get(id);
      if (request.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify(previous) });
      const body = request.postDataJSON();
      assert.equal(request.method(), "PATCH", "existing events keep their identity");
      writes.push({ id, body });
      const row = { ...previous, title: body.title, data: body.data, revision: `${id}-${writes.length}` };
      records.set(id, row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname === "/api/events/timezone") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ timezone: request.postDataJSON().query.includes("Palmetto") ? "America/New_York" : null }) });
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base) return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  const categories = category ? [category] : [];
  const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
  const openControls = async () => {
    const button = page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: /^(Edit|Continue editing|Close preview)$/ });
    await Promise.race([button.waitFor({ state: "visible" }), controls.waitFor({ state: "visible" })]);
    if (await button.isVisible()) await button.click();
    await controls.waitFor();
  };
  try {
    if (recovered) {
    await page.goto(`${base}/event/sport-events/customize?toolsAudit=recovered-rsvp`);
    const recoveredSwitch = page.getByRole("switch", { name: "Enable RSVP", exact: true });
    assert.equal(await recoveredSwitch.getAttribute("aria-checked"), "false");
    await recoveredSwitch.click();
    assert.equal(await recoveredSwitch.isChecked(), true);
    assert.equal(await recoveredSwitch.getAttribute("aria-checked"), "true");
    await page.getByText("Recovered RSVP settings", { exact: true }).waitFor();
    await recoveredSwitch.click();
    assert.equal(await recoveredSwitch.isChecked(), false);
    assert.equal(await page.getByText("Recovered RSVP settings", { exact: true }).isVisible(), false);
    assert.deepEqual(errors, [], "older RSVP state stays controlled when enabled and disabled");
    }
    for (const category of categories) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: width === 320 || category === "general" ? "dark" : "light" });
      const id = `${category}-${width}`;
      records.set(id, { id, title: "Existing host event", revision: `${id}-initial`, permissions: { role: "owner" }, data: {
        title: "Existing host event", status: "draft", draftStatus: "draft", category,
        date: "2027-04-10", time: "09:30", venue: "Original venue", address: "123 Main St",
        rsvpEnabled: false, numberOfGuests: 7, createdVia: "simple-template",
        rsvpDeadline: "2027-04-03", rsvpName: "Original contact", rsvpEmail: "original@test.com", rsvpPhone: "+1 555 111 2222",
        ...(retainedArtwork ? { heroImage: "/templates/hero-images/sports.webp", importedTheme: {
          ...createImportedEventTheme({ title: "Existing host event", sport: "volleyball", city: "Chicago", seed: id }),
          enabled: false, artworkUrl: "https://assets.test/retained-sports.webp",
        } } : {}),
      }});
      const routeCategory = category === "bridal-showers" ? "baby-showers" : category;
      await page.goto(`${base}/event/${routeCategory}/customize?toolsAudit=${category}&edit=${id}${category === "bridal-showers" ? "&occasion=bridal-shower" : ""}`);
      await openControls();
      await controls.getByRole("heading", { name: "Edit event page", exact: true }).waitFor();
      assert.equal(await controls.locator('[class*="desktopNavigation"] [class*="navigationTitle"]').count(), 0, "desktop navigation only contains close and exit");
      assert.equal(await controls.getByRole("group", { name: "Page tools", exact: true }).count(), 0, "settings have one menu list");
      assert.equal(await controls.getByRole("button", { name: "Page sections", exact: true }).count(), 0, "sections are managed on the page");
      await controls.getByRole("button", { name: /^Event image settings/ }).waitFor();
      await controls.getByRole("button", { name: /^Custom URL/ }).waitFor();
      assert.equal(await controls.getByRole("button", { name: /^Custom URL/ }).count(), 1, "Custom URL appears once");
      await controls.getByRole("button", { name: /^Event image settings/ }).click();
      const imageDesigns = controls.getByRole("group", { name: "Event image designs", exact: true });
      assert.equal(await imageDesigns.getByRole("button").count(), imageDesignCount, `${category}: every image design is available`);
      const images = await imageDesigns.locator("img").evaluateAll(nodes => nodes.map(node => node.getAttribute("src")));
      assert.equal(images.length, imageDesignCount, `${category}: all designs use current artwork`);
      assert.equal(new Set(images).size, 1, `${category}: designs share the current event image`);
      if (retainedArtwork) {
        assert.equal(images[0], "https://assets.test/retained-sports.webp");
        await page.getByRole("region", { name: "Event page preview panel" }).locator('img[src="https://assets.test/retained-sports.webp"]').waitFor({ state: "attached" });
      }
      await controls.getByRole("button", { name: "Back to details", exact: true }).click();
      const actions = page.getByRole("group", { name: "Save event", exact: true });
      const actionNames = await actions.getByRole("button").allTextContents();
      assert.equal(await page.getByRole("button", { name: "Cancel", exact: true }).count(), 0, "Exit replaces duplicate Cancel");
      const exitName = width < 768 ? "Exit" : "Exit editing";
      await controls.getByRole("button", { name: exitName, exact: true }).waitFor();
      const exitBounds = await controls.getByRole("button", { name: exitName, exact: true }).boundingBox();
      const panelBounds = await controls.boundingBox();
      assert.ok(exitBounds.x > panelBounds.x + panelBounds.width / 2 &&
        panelBounds.x + panelBounds.width - exitBounds.x - exitBounds.width <= 24,
        `${category}/${width}: Exit stays on the right of the settings header`);
      if (category === "appointments" && width === 390) {
        await page.setViewportSize({ width: 320, height: 900 });
        const narrowExit = await controls.getByRole("button", { name: "Exit", exact: true }).boundingBox();
        assert.ok(narrowExit.x > 160 && narrowExit.x + narrowExit.width >= 296 && narrowExit.x + narrowExit.width <= 320, "Appointments settings keep Exit on the right at 320px");
        for (const action of await actions.getByRole("button").all()) {
          const bounds = await action.boundingBox();
          assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 320 && bounds.height >= 44, "all narrow-phone save actions remain usable");
        }
        await page.screenshot({ path: path.join(output, "appointments-tools-320.png") });
        await page.setViewportSize({ width, height: 900 });
      }
      assert.ok(actionNames.findIndex(name => name.trim() === "Save draft") < actionNames.findIndex(name => name.trim() === "Preview"));
      assert.equal(await controls.getByRole("button", { name: "Font style", exact: true }).count(), 0, "font styling never becomes a separate menu tile");
      await controls.getByRole("button", { name: /^(RSVP|Attendance|Reminders)/ }).waitFor();
      if (["weddings", "general", "sport-events"].includes(category)) {
        await page.locator("[data-leave]").evaluateAll(nodes => nodes.forEach(node => node.style.visibility = "hidden"));
        await controls.screenshot({ path: path.join(output, `${category}-tools-${width}.png`) });
      }
      await controls.getByRole("button", { name: /^(RSVP|Attendance|Reminders)/ }).click();
      const contacts = { "RSVP contact name": "Sam Rivera", "RSVP email": "sam@test.com", "RSVP phone": "+1 555 222 3333" };
      const toggle = controls.getByRole("switch").first();
      assert.equal(await toggle.getAttribute("aria-checked"), "false");
      assert.equal(await controls.getByRole("textbox").count(), 0, `${category}: all RSVP fields hide while disabled`);
      assert.equal(await controls.getByText("Preview:", { exact: true }).isVisible(), false);
      const header = await toggle.evaluate(node => {
        const heading = node.closest('div').querySelector('h2');
        const a = node.getBoundingClientRect(), b = heading.getBoundingClientRect();
        return { delta: Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)), right: a.left >= b.right };
      });
      assert.ok(header.delta < 3 && header.right, `${category}: switch shares the RSVP heading row`);
      if (category === "general") await controls.screenshot({ path: path.join(output, `rsvp-disabled-${width}.png`) });
      await toggle.click();

      assert.equal(await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).inputValue(), "Original contact");
      const deadline = controls.locator('input[type="date"]:visible');
      assert.equal(await deadline.inputValue(), "2027-04-03", `${category}: retained deadline hydrates while RSVP starts off`);
      await deadline.fill("2027-04-05");
      for (const [label, value] of Object.entries(contacts)) await controls.getByRole("textbox", { name: label, exact: true }).fill(value);
      if (category === "general") await controls.screenshot({ path: path.join(output, `rsvp-contacts-${width}.png`) });
      await controls.getByRole("button", { name: "Back to details", exact: true }).click();
      await controls.getByRole("button", { name: /^Design/ }).click();

      const font = controls.getByRole("combobox", { name: "Title font", exact: true });
      if (retainedArtwork) {
        await controls.getByRole("button", { name: /^Theme \(/ }).click();
        const custom = controls.getByRole("button", { name: "Custom", exact: true });
        assert.equal(await custom.getAttribute("aria-pressed"), "false");
        await custom.click();
        assert.equal(await custom.getAttribute("aria-pressed"), "true", "generated sports themes are selected as Custom");
        const catalog = controls.getByRole("button").filter({ hasText: "Palette preset" }).first();
        await catalog.click();
        assert.equal(await catalog.getAttribute("aria-pressed"), "true");
        assert.equal(await custom.getAttribute("aria-pressed"), "false");
        await page.getByRole("region", { name: "Event page preview panel" }).locator('img[src="https://assets.test/retained-sports.webp"]').waitFor({ state: "attached" });
        await custom.click();
        assert.equal(await custom.getAttribute("aria-pressed"), "true");
        await controls.getByRole("button", { name: "Russo One", exact: true }).click();
        const heading = page.getByRole("region", { name: "Event page preview panel" }).locator("h1").first();
        const fontBeforeAccent = await heading.evaluate(element => getComputedStyle(element).fontFamily);
        await controls.getByRole("group", { name: "Theme color combinations", exact: true }).getByRole("button", { name: "Accent", exact: true }).click();
        assert.equal(await heading.evaluate(element => getComputedStyle(element).fontFamily), fontBeforeAccent, "accent choices preserve the host's font override");
        await page.getByRole("region", { name: "Event page preview panel" }).locator('img[src="https://assets.test/retained-sports.webp"]').waitFor({ state: "attached" });
      }
      assert.equal(await font.inputValue(), "", `${category}: existing typography stays unchanged`);
      assert.equal(await font.locator("option").count(), 9);
      const before = writes.length;
      await font.selectOption("montserrat");
      const previewHeading = page.locator('[aria-label="Event page preview panel"] h1').first();
      assert.match(await previewHeading.evaluate(node => getComputedStyle(node).fontFamily), /Montserrat/, `${category}: live preview uses the selected font`);
      assert.equal(writes.length, before, "choosing a font never saves implicitly");
      await page.getByRole("button", { name: width < 768 ? "Back to page" : "Close editing menu", exact: true }).click();
      const pageSettings = page.getByRole("button", { name: "Continue editing", exact: true });
      await pageSettings.waitFor();
      assert.equal(await page.getByRole("button", { name: "Cancel", exact: true }).count(), 0, "the editable canvas also has no duplicate Cancel");
      const canvasExit = await page.getByRole("button", { name: width < 768 ? "Exit Editing" : "Exit", exact: true }).boundingBox();
      const settingsBounds = await pageSettings.boundingBox();
      assert.ok(width < 768 ? canvasExit.x < settingsBounds.x : canvasExit.x > settingsBounds.x + settingsBounds.width,
        "phone canvas places Exit on the left and Edit page on the right; desktop Exit stays right");
      assert.equal(writes.length, before, "returning to the canvas retains pending edits without saving");
      await openControls();
      assert.equal(await font.inputValue(), "montserrat", "reopening settings retains its mounted field and pending font");
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(writes.at(-1).id, id);
      assert.equal(records.get(id).data.eventPageComposition.titleFont, "montserrat", `${category}: font reaches the saved event`);
      assert.equal(records.get(id).data.date, "2027-04-10", `${category}: font changes retain the event date`);
      assert.equal(records.get(id).data.venue, "Original venue", `${category}: font changes retain the venue`);
      assert.equal(records.get(id).data.numberOfGuests, 7, `${category}: editing retains guest activity`);
      assert.equal(records.get(id).data.rsvpEnabled, true, `${category}: font changes preserve enabled RSVP`);
      assert.equal(records.get(id).data.rsvpName, "Sam Rivera");
      assert.equal(records.get(id).data.rsvpEmail, "sam@test.com");
      assert.equal(records.get(id).data.rsvpPhone, "+1 555 222 3333");
      await page.reload();
      await openControls();
      if (!(await font.isVisible())) await controls.getByRole("button", { name: /^Design/ }).click();
      assert.equal(await font.inputValue(), "montserrat", `${category}: saved font reloads`);
      await font.selectOption("");
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(records.get(id).data.eventPageComposition?.titleFont, undefined, `${category}: Design default clears the override`);
      await controls.getByRole("button", { name: "Back to details", exact: true }).click();
      await controls.getByRole("button", { name: /^(RSVP|Attendance|Reminders)/ }).click();
      for (const [label, value] of Object.entries(contacts)) assert.equal(await controls.getByRole("textbox", { name: label, exact: true }).inputValue(), value, `${category}: saved contact reloads`);
      assert.equal(await controls.locator('input[type="date"]:visible').inputValue(), "2027-04-05", `${category}: the changed deadline reloads`);
      await controls.getByRole("switch").first().click();
      assert.equal(await controls.getByRole("textbox").count(), 0, "turning RSVP off hides all fields");
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(records.get(id).data.rsvpEnabled, false);
      assert.equal(records.get(id).data.rsvpDeadline, "2027-04-05");
      assert.equal(records.get(id).data.rsvpName, "Sam Rivera");
      assert.equal(records.get(id).data.rsvpEmail, "sam@test.com");
      assert.equal(records.get(id).data.rsvpPhone, "+1 555 222 3333");
      await page.reload();
      await openControls();
      const rsvpMenu = controls.getByRole("button", { name: /^(RSVP|Attendance|Reminders)/ });
      if (await rsvpMenu.isVisible()) await rsvpMenu.click();
      assert.equal(await controls.getByRole("switch").first().getAttribute("aria-checked"), "false", `${category}: saved disabled state reloads`);
      assert.equal(await controls.getByRole("textbox").count(), 0, `${category}: reopening while disabled keeps every row hidden`);
      await controls.getByRole("switch").first().click();
      assert.equal(await controls.locator('input[type="date"]:visible').inputValue(), "2027-04-05", `${category}: re-enabling restores the saved deadline`);
      for (const [label, value] of Object.entries(contacts)) assert.equal(await controls.getByRole("textbox", { name: label, exact: true }).inputValue(), value, "turning RSVP back on preserves contact values");
      for (const label of Object.keys(contacts)) await controls.getByRole("textbox", { name: label, exact: true }).fill("");
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(records.get(id).data.rsvpName, "");
      assert.equal(records.get(id).data.rsvpEmail, "");
      assert.equal(records.get(id).data.rsvpPhone, "");
      if (["weddings", "general", "sport-events"].includes(category)) await page.screenshot({ path: path.join(output, `${category}-${width}.png`) });
    }
    for (const kind of specialized ? [specialized] : []) {
      await page.setViewportSize({ width, height: 900 });
      const id = `rsvp-persistence-${kind}-${width}`;
      if (kind === "gymnastics") records.set(id, { id, title: "Existing meet", revision: `${id}-initial`, data: {
        title: "Existing meet", status: "draft", draftStatus: "draft", createdVia: "simple-template", category: "gymnastics", pageTemplateId: "airborne-atlas",
        date: "2027-04-10", time: "09:30", timezone: "America/Chicago", venue: "Original venue",
        rsvpEnabled: true, rsvpDeadline: "2027-04-03", rsvpName: "Original contact", rsvpEmail: "original@test.com", rsvpPhone: "+1 555 111 2222",
      }});
      await page.goto(kind === "gymnastics" ? `${base}/event/gymnastics/customize?mode=gymnastics&edit=${id}` : `${base}/event/design/customize?mode=upload`);
      await openControls();
      if (kind === "gymnastics") {
        assert.equal(await controls.getByRole("button", { name: "Event basics", exact: true }).count(), 0, "event details are edited on the canvas");
        assert.equal(await controls.getByRole("button", { name: "Page sections", exact: true }).count(), 0, "gymnastics section choices live on the canvas");
        const imageLayout = controls.getByRole("button", { name: /^Event image settings/ });
        assert.equal(await imageLayout.count(), 1, "gymnastics settings retain one image layout entry");
        await imageLayout.click();
        await controls.getByRole("button", { name: "Upload image", exact: true }).waitFor();
        assert.equal(await controls.getByRole("button", { name: /^Choose .* hero layout$/ }).count(), 78);
        assert.equal(await controls.getByRole("button", { name: /^(Show full image|Fill image frame)$/ }).count(), 0);
        const beforeUpload = writes.length;
        await controls.getByLabel("Choose hero image", { exact: true }).setInputFiles({ name: "meet.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
        await controls.getByRole("button", { name: "Reset image", exact: true }).waitFor();
        assert.equal(writes.length, beforeUpload, "image upload stays local until an explicit save");
        await controls.getByRole("button", { name: "Reset image", exact: true }).click();
        await controls.screenshot({ path: path.join(output, `gymnastics-image-settings-${width}.png`) });
        const styledLayout = controls.getByRole("button", { name: "Choose Diagonal cut hero layout", exact: true });
        await styledLayout.click();
        assert.equal(await styledLayout.getAttribute("aria-pressed"), "true");
        assert.equal(records.get(id).data.eventPageComposition?.hero, undefined, "layout choices wait for an explicit save");
        await controls.getByRole("button", { name: "Back to details", exact: true }).click();
        await controls.getByRole("button", { name: /^Custom URL/ }).waitFor();
        const workspace = page.locator("[data-event-page-editor]");
        const preview = page.getByRole("region", { name: "Event page preview panel", includeHidden: true });
        const previewElement = await preview.elementHandle();
        const before = writes.length;
        assert.equal(await controls.getByRole("button", { name: "Change hero image", exact: true }).count(), 0, "the main menu has no image-change row");
        await controls.getByRole("button", { name: "Design", exact: true }).click();
        await controls.getByRole("combobox", { name: "Title font", exact: true }).waitFor();
        await controls.getByRole("button", { name: "Back to details", exact: true }).click();
        await controls.getByRole("button", { name: "Design", exact: true }).waitFor();
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.getByRole("complementary", { name: "Event editing controls", exact: true }).getByRole("button", { name: /^(Close editing menu|Back to page)$/, exact: true }).click();
        await page.waitForFunction(() => {
          const panel = document.querySelector('[aria-label="Event editing controls"]');
          return panel && getComputedStyle(panel).visibility === "hidden";
        });
        assert.equal(await workspace.locator('[aria-label="Event editing controls"]').evaluate(element => element.inert), true, "closed settings cannot receive focus");
        assert.equal(await preview.locator("[data-hero-image-control]").count(), 0, "image upload is no longer on the canvas");
        assert.equal(await preview.getByRole("button", { name: /^(Show full image|Fill image frame)$/ }).count(), 0, "the fit icon is removed");
        await workspace.getByRole("button", { name: "Continue editing", exact: true }).click();
        await page.waitForFunction(() => {
          const workspace = document.querySelector('[data-event-page-editor]');
          const panel = workspace?.querySelector('[aria-label="Event editing controls"]');
          if (!panel) return false;
          const right = panel.getBoundingClientRect().right;
          return Math.abs(right - workspace.getBoundingClientRect().right) < 1;
        });
        assert.equal(await previewElement.evaluate(element => element === document.querySelector('[aria-label="Event page preview panel"]')), true, "sliding settings preserves the mounted event");
        if (width < 768) {
          const menuBounds = await controls.boundingBox();
          assert.ok(menuBounds.x >= 0 && menuBounds.x + menuBounds.width <= width + 1, "the sliding editing menu fits the phone canvas");
          assert.equal(await preview.evaluate(element => element.inert), true, "the offscreen event cannot receive focus");
        } else {
          assert.ok(await preview.evaluate(element => element.getBoundingClientRect().width < element.parentElement.clientWidth - 300), "desktop settings push the event canvas left");
        }
        assert.equal(writes.length, before, "opening and backing out never saves");
        await page.screenshot({ path: path.join(output, `gymnastics-sliding-menu-${width}.png`) });
        await page.emulateMedia({ colorScheme: "dark" });
        await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
        await page.screenshot({ path: path.join(output, `gymnastics-sliding-menu-${width}-dark.png`) });
        await page.emulateMedia({ colorScheme: "light" });
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      await controls.getByRole("button", { name: /^(RSVP|Attendance)/ }).click();
      const switchControl = controls.getByRole("switch", { name: /Enable RSVP|Enable Attendance/ });
      if (!(await switchControl.isChecked())) await switchControl.click();
      await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).fill("Sam Rivera");
      await controls.getByRole("textbox", { name: /^RSVP email/ }).fill("sam@test.com");
      await controls.getByRole("textbox", { name: /^RSVP phone/ }).fill("+1 555 222 3333");
      await controls.locator('input[type="date"]:visible').fill("2027-04-05");
      const beforePreview = writes.length;
      await page.getByRole("group", { name: "Save event", exact: true }).getByRole("button", { name: "Preview", exact: true }).click();
      const cleanPreview = page.getByRole("region", { name: "Event page preview panel", exact: true });
      await cleanPreview.waitFor();
      assert.equal(await cleanPreview.locator("[data-editable-section]").count(), 0, "Preview removes section editing controls");
      assert.equal(await cleanPreview.getByRole("button", { name: "Add tab", exact: true }).count(), 0);
      assert.equal(await cleanPreview.getByRole("group", { name: "Event image controls", exact: true }).count(), 0, "clean preview has no image toolbar");
      assert.equal(writes.length, beforePreview, "Preview never saves");
      assert.equal(await page.getByRole("group", { name: "Save event", exact: true }).count(), 0, "preview has no save or publication actions");
      assert.equal(await page.getByRole("button", { name: /^(Continue editing|Back)$/, exact: true }).count(), 0, "preview replaces editing navigation with a close button");
      const closePreview = page.getByRole("button", { name: "Close preview", exact: true });
      const closeBounds = await closePreview.boundingBox();
      assert.ok(closeBounds.width >= 44 && closeBounds.height >= 44 && closeBounds.x + closeBounds.width >= width - 25 && closeBounds.y < 40, "preview close is a top-right touch target");
      assert.equal(await closePreview.evaluate(element => element === document.activeElement), true, "preview focuses its close action");
      await page.screenshot({ path: path.join(output, `${kind}-clean-preview-${width}.png`) });
      await openControls();
      assert.equal(await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).inputValue(), "Sam Rivera", "Preview preserves the active panel and pending fields");
      await switchControl.click();
      assert.equal(await controls.getByRole("textbox").count(), 0, `${kind}: disabled RSVP hides every contact row`);
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      const savedId = writes.at(-1).id;
      assert.equal(records.get(savedId).data.rsvpEnabled, false);
      assert.equal(records.get(savedId).data.rsvpDeadline, "2027-04-05");
      assert.equal(records.get(savedId).data.rsvpName, "Sam Rivera");
      assert.equal(records.get(savedId).data.rsvpEmail, "sam@test.com");
      assert.equal(records.get(savedId).data.rsvpPhone, "+1 555 222 3333");
      if (kind === "gymnastics") {
        assert.equal(records.get(savedId).data.eventPageComposition.hero.imageStyle, "diagonal-cut");
        assert.equal(records.get(savedId).data.eventPageComposition.hero.imagePosition, "top");
      }
      await page.reload();
      if (kind === "gymnastics") await page.waitForURL("**/gymnastics/templates/airborne-atlas/customize?edit=" + savedId);
      await openControls();
      if (kind === "gymnastics") {
        await controls.getByRole("button", { name: /^Event image settings/ }).click();
        assert.equal(await controls.getByRole("button", { name: "Choose Diagonal cut hero layout", exact: true }).getAttribute("aria-pressed"), "true", "saved gymnastics image layout reloads");
        await controls.getByRole("button", { name: "Back to details", exact: true }).click();
      }
      const menu = controls.getByRole("button", { name: /^(RSVP|Attendance)/ });
      if (await menu.isVisible()) await menu.click();
      assert.equal(await switchControl.isChecked(), false, `${kind}: the saved off state reloads`);
      assert.equal(await controls.getByRole("textbox").count(), 0);
      await switchControl.click();
      assert.equal(await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).inputValue(), "Sam Rivera");
      assert.equal(await controls.getByRole("textbox", { name: /^RSVP email/ }).inputValue(), "sam@test.com");
      assert.equal(await controls.getByRole("textbox", { name: /^RSVP phone/ }).inputValue(), "+1 555 222 3333");
      assert.equal(await controls.locator('input[type="date"]:visible').inputValue(), "2027-04-05");
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(records.get(savedId).data.rsvpEnabled, true, `${kind}: re-enabled RSVP saves with its retained details`);
      const published = records.get(savedId);
      published.data.status = published.data.draftStatus = "published";
      await page.reload();
      await openControls();
      const rsvpMenu = controls.getByRole("button", { name: /^(RSVP|Attendance)/ });
      if (await rsvpMenu.isVisible()) await rsvpMenu.click();
      await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).fill("Pending contact");
      assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).isEnabled(), true);
      const beforePublishedPreview = writes.length;
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).count(), 0, "published preview also hides Save");
      await page.getByRole("button", { name: "Close preview", exact: true }).waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).inputValue(), "Pending contact", "closing preview preserves the mounted settings and unsaved changes");
      assert.equal(await page.getByRole("button", { name: "Save changes", exact: true }).isEnabled(), true);
      assert.equal(writes.length, beforePublishedPreview, "opening and closing published preview never saves");
    }
    if (zone) {
    await page.setViewportSize({ width: 1440, height: 900 });
    records.set("location-zone-required", { id: "location-zone-required", title: "Location zone meet", revision: "location-zone-initial", permissions: { role: "owner" }, data: {
      title: "Location zone meet", status: "published", createdVia: "simple-template", category: "gymnastics", pageTemplateId: "airborne-atlas",
      date: "2027-04-10", time: "09:30", timezone: "", venue: "Original venue", address: "Unknown event location", details: "Meet details", heroImage: "https://cdn.example.test/meet.webp",
    }});
    await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=location-zone-required`);
    await openControls();
    const locationPreview = page.getByRole("region", { name: "Event page preview panel", exact: true });
    await locationPreview.getByRole("button", { name: "Edit event title", exact: true }).locator("xpath=ancestor::*[@data-inline-text-editor]").hover();
    await locationPreview.getByRole("button", { name: "Edit event title", exact: true }).click();
    await locationPreview.getByRole("textbox", { name: "Event title", exact: true }).fill("Location zone meet updated");
    await locationPreview.getByRole("button", { name: "Done editing event title", exact: true }).click();
    const beforeLocationSave = writes.length;
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Add the event city or full address so its local time can be confirmed.", { exact: true }).waitFor();
    assert.equal(writes.length, beforeLocationSave, "unresolved location clocks are rejected before writes");
    assert.equal(await page.locator("[data-event-timezone]").count(), 0);
    assert.equal(await controls.getByLabel("Event time zone", { exact: true }).count(), 0);
    const matchedLocation = page.waitForResponse(response => response.url().endsWith("/api/events/timezone") && response.request().postDataJSON().query.includes("Palmetto"));
    await locationPreview.getByRole("button", { name: "Edit address", exact: true }).locator("xpath=ancestor::*[@data-inline-text-editor]").hover();
    await locationPreview.getByRole("button", { name: "Edit address", exact: true }).click();
    await locationPreview.getByRole("textbox", { name: "Address", exact: true }).fill("One Haben Blvd., Palmetto, FL 34221");
    await locationPreview.getByRole("button", { name: "Done editing address", exact: true }).click();
    await matchedLocation;
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Changes saved.", { exact: true }).waitFor();
    assert.equal(records.get("location-zone-required").data.startISO, "2027-04-10T13:30:00.000Z");
    assert.equal(records.get("location-zone-required").data.timezoneSource, "location");
    await locationPreview.locator("h1").filter({ hasText: "Location zone meet updated" }).waitFor();
    }
    for (const kind of menuKind ? [menuKind] : []) {
      await page.setViewportSize({ width, height: 900 });
      if (kind === "general") records.set(`general-menu-${width}`, { id: `general-menu-${width}`, data: { category: "general", title: "Shared editor", date: "2027-04-10", time: "09:30", timezone: "America/Chicago", venue: "Original venue", createdVia: "simple-template", status: "draft" } });
      const url = kind === "general" ? `${base}/event/general/customize?toolsAudit=general&edit=general-menu-${width}` : kind === "signup"
        ? `${base}/signup-forms/templates/editorial--school-days/customize?toolsAudit=signup-forms`
        : `${base}/event/design/customize?mode=upload`;
      await page.goto(url);
      await openControls();
      if (kind !== "signup") {
        assert.equal(await controls.getByRole("group", { name: "Page tools", exact: true }).count(), 0);
        await controls.getByRole("button", { name: /^Event image settings/ }).waitFor();
        await controls.getByRole("button", { name: /^Custom URL/ }).waitFor();
      }
      await controls.getByRole("button", { name: /^Design/ }).click();
      if (kind === "custom" || kind === "general") {
        assert.equal(await controls.locator('input[type="color"]').count(), 0, "design colors remain authored");
        const recipes = controls.getByRole("group", { name: "Theme color combinations", exact: true });
        assert.equal(await recipes.getByRole("button").count(), 6);
        await recipes.getByRole("button", { name: "Accent", exact: true }).click();
        assert.equal(await recipes.getByRole("button", { name: "Accent", exact: true }).getAttribute("aria-pressed"), "true");
      }
      const option = controls.getByRole("button", { name: /^Modern:/ });
      await option.click();
      const before = writes.length;
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.waitForFunction(count => window.location.search.includes("edit="), before);
      assert.equal(writes.length, before + 1, `${kind}: font selection requires one explicit save`);
      if (kind === "custom" || kind === "general") assert.equal(writes.at(-1).body.data.customEventPage.design.accentCombination, 1, "accent choice persists with the explicit save");
      const saved = writes.at(-1);
      assert.equal(kind === "signup" ? saved.body.data.signupForm.appearance.fontPair : saved.body.data.customEventPage.design.font, "modern", `${kind}: native font-pair persistence is retained`);
      await page.reload();
      await openControls();
      if (!(await option.isVisible())) await controls.getByRole("button", { name: /^Design/ }).click();
      assert.equal(await option.getAttribute("aria-pressed"), "true", `${kind}: the saved font pair reloads`);
      if (kind === "custom" || kind === "general") assert.equal(await controls.getByRole("button", { name: "Accent", exact: true }).getAttribute("aria-pressed"), "true", "saved accent choice reloads");
    }
    if (fonts) {
    records.set("saved-font", { id: "saved-font", data: { eventPageComposition: { version: 1, sections: [], titleFont: "orbitron" } } });
    await page.goto(`${base}/event/general/customize?toolsAudit=saved&edit=saved-font`);
    assert.match(await page.getByRole("heading", { level: 1, name: "Saved event title", exact: true }).evaluate(node => getComputedStyle(node).fontFamily), /Orbitron/, "saved guest pages apply the same font boundary");
    assert.match(await page.getByRole("heading", { name: "Application heading", exact: true }).evaluate(node => getComputedStyle(node).fontFamily), /Arial/, "nested application controls retain app typography");
    assert.doesNotMatch(await page.locator("p").evaluate(node => getComputedStyle(node).fontFamily), /Orbitron/, "title font choices preserve body typography");
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(output, `failure-${category || specialized || menuKind || (zone ? "timezone" : fonts ? "fonts" : "recovered")}-${width}.png`) });
    throw new Error(`${error.message}\nURL: ${page.url()}\nBrowser errors: ${errors.join("; ")}`, { cause: error });
  } finally { await browser.close(); }
}

// Build once; each behavior gets fresh browser storage, records and a bounded budget.
// Keeping the category matrix in one timed case let unrelated journeys exhaust its timer.
test.before(fixture, { timeout: 30000 });
const focus = process.env.EVENT_EDITOR_RSVP_FOCUS;
if (!focus) {
  for (const width of [1440, 390, 320]) for (const category of ["appointments", "workshops", "special-events", "cheerleading", "dance-ballet", "soccer", "football-season", "sport-events", "weddings", "birthdays", "anniversaries", "baby-showers", "bridal-showers", "gender-reveal"]) {
    test(`${category} controls, Exit, fonts and RSVP save/reload at ${width}px${width === 320 ? " dark" : ""}`, { timeout: 45000 }, () => editorToolsCase({ category, width }));
  }
}
if (focus !== "timezone") {
  for (const width of [1440, 390, 320]) {
    for (const specialized of ["gymnastics", "custom"]) test(`${specialized} mounted settings and clean Preview at ${width}px`, { timeout: 45000 }, () => editorToolsCase({ specialized, width }));
    for (const menuKind of ["custom", "general", "signup"]) test(`${menuKind} font-pair persistence at ${width}px`, { timeout: 30000 }, () => editorToolsCase({ menuKind, width }));
  }
  test("saved guest title fonts preserve body and application typography", { timeout: 15000 }, () => editorToolsCase({ fonts: true }));
}
test("recovered RSVP settings remain controlled while toggled", { timeout: 15000 }, () => editorToolsCase({ recovered: true }));
test("location confirmation rejects unknown places before writes and resolves authored addresses", { timeout: 30000 }, () => editorToolsCase({ zone: true }));
for (const width of [1440, 390]) test(`retained generated sports artwork after catalog selection and saves at ${width}px`, { timeout: 45000 },
  () => editorToolsCase({ category: "sport-events", width, retainedArtwork: true }));
