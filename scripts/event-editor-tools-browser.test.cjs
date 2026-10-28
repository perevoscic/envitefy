const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const { resolveThemeCssVariables } = require("./lib/event-messages-test-loader.cjs")("src/themes/registry.ts");
compiled.init();

test("event editors keep the earlier layout with fonts inside Design and separate RSVP settings", {
  timeout: 300000,
}, async () => {
  const output = path.resolve(".qa/event-editor-tools-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [
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

  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ reducedMotion: "reduce" });
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
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base) return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  const categories = process.env.EVENT_EDITOR_RSVP_FOCUS === "specialized" ? [] : ["general", "appointments", "workshops", "special-events", "cheerleading", "dance-ballet", "soccer", "football-season", "sport-events", "weddings", "birthdays", "anniversaries", "baby-showers", "bridal-showers", "gender-reveal"];
  const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
  const openControls = async () => {
    const button = page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: /^(Edit|Page settings)$/ });
    await Promise.race([button.waitFor({ state: "visible" }), controls.waitFor({ state: "visible" })]);
    if (await button.isVisible()) await button.click();
    await controls.waitFor();
  };
  try {
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
    for (const width of [1440, 390]) for (const category of categories) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: category === "general" ? "dark" : "light" });
      const id = `${category}-${width}`;
      records.set(id, { id, title: "Existing host event", revision: `${id}-initial`, permissions: { role: "owner" }, data: {
        title: "Existing host event", status: "draft", draftStatus: "draft", category,
        date: "2027-04-10", time: "09:30", venue: "Original venue", address: "123 Main St",
        rsvpEnabled: false, numberOfGuests: 7, createdVia: "simple-template",
        rsvpDeadline: "2027-04-03", rsvpName: "Original contact", rsvpEmail: "original@test.com", rsvpPhone: "+1 555 111 2222",
      }});
      const routeCategory = category === "bridal-showers" ? "baby-showers" : category;
      await page.goto(`${base}/event/${routeCategory}/customize?toolsAudit=${category}&edit=${id}${category === "bridal-showers" ? "&occasion=bridal-shower" : ""}`);
      await openControls();
      const tools = controls.getByRole("group", { name: "Page tools", exact: true });
      for (const name of ["Page sections", "Layout"]) await tools.getByRole("button", { name, exact: true }).waitFor();
      await controls.getByRole("button", { name: /^Custom URL/ }).waitFor();
      assert.equal(await tools.getByRole("button").count(), category === "football-season" ? 2 : 3, `${category}: the original three-tool toolbar is preserved`);
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
      assert.equal(await font.inputValue(), "", `${category}: existing typography stays unchanged`);
      assert.equal(await font.locator("option").count(), 9);
      const before = writes.length;
      await font.selectOption("montserrat");
      const previewHeading = page.locator('[aria-label="Event page preview panel"] h1').first();
      assert.match(await previewHeading.evaluate(node => getComputedStyle(node).fontFamily), /Montserrat/, `${category}: live preview uses the selected font`);
      assert.equal(writes.length, before, "choosing a font never saves implicitly");
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
    for (const width of [1440, 390]) for (const kind of ["gymnastics", "custom"]) {
      await page.setViewportSize({ width, height: 900 });
      const id = `rsvp-persistence-${kind}-${width}`;
      if (kind === "gymnastics") records.set(id, { id, title: "Existing meet", revision: `${id}-initial`, data: {
        title: "Existing meet", status: "draft", draftStatus: "draft", createdVia: "simple-template", category: "gymnastics", pageTemplateId: "airborne-atlas",
        date: "2027-04-10", time: "09:30", timezone: "America/Chicago", venue: "Original venue",
        rsvpEnabled: true, rsvpDeadline: "2027-04-03", rsvpName: "Original contact", rsvpEmail: "original@test.com", rsvpPhone: "+1 555 111 2222",
      }});
      await page.goto(kind === "gymnastics" ? `${base}/event/gymnastics/customize?mode=gymnastics&edit=${id}` : `${base}/event/design/customize?mode=upload`);
      await openControls();
      await controls.getByRole("button", { name: /^(RSVP|Attendance)/ }).click();
      const switchControl = controls.getByRole("switch", { name: /Enable RSVP|Enable Attendance/ });
      if (!(await switchControl.isChecked())) await switchControl.click();
      await controls.getByRole("textbox", { name: "RSVP contact name", exact: true }).fill("Sam Rivera");
      await controls.getByRole("textbox", { name: /^RSVP email/ }).fill("sam@test.com");
      await controls.getByRole("textbox", { name: /^RSVP phone/ }).fill("+1 555 222 3333");
      await controls.locator('input[type="date"]:visible').fill("2027-04-05");
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
      await page.reload();
      if (kind === "gymnastics") await page.waitForURL("**/gymnastics/templates/airborne-atlas/customize?edit=" + savedId);
      await openControls();
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
    }
    for (const width of [1440, 390]) for (const kind of ["custom", "signup"]) {
      await page.setViewportSize({ width, height: 900 });
      const url = kind === "signup"
        ? `${base}/signup-forms/templates/editorial--school-days/customize?toolsAudit=signup-forms`
        : `${base}/event/design/customize?mode=upload`;
      await page.goto(url);
      await openControls();
      await controls.getByRole("button", { name: /^Design/ }).click();
      const option = controls.getByRole("button", { name: /^Modern:/ });
      await option.click();
      const before = writes.length;
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.waitForFunction(count => window.location.search.includes("edit="), before);
      assert.equal(writes.length, before + 1, `${kind}: font selection requires one explicit save`);
      const saved = writes.at(-1);
      assert.equal(kind === "signup" ? saved.body.data.signupForm.appearance.fontPair : saved.body.data.customEventPage.design.font, "modern", `${kind}: native font-pair persistence is retained`);
      await page.reload();
      await openControls();
      if (!(await option.isVisible())) await controls.getByRole("button", { name: /^Design/ }).click();
      assert.equal(await option.getAttribute("aria-pressed"), "true", `${kind}: the saved font pair reloads`);
    }
    records.set("saved-font", { id: "saved-font", data: { eventPageComposition: { version: 1, sections: [], titleFont: "orbitron" } } });
    await page.goto(`${base}/event/general/customize?toolsAudit=saved&edit=saved-font`);
    assert.match(await page.getByRole("heading", { level: 1, name: "Saved event title", exact: true }).evaluate(node => getComputedStyle(node).fontFamily), /Orbitron/, "saved guest pages apply the same font boundary");
    assert.match(await page.getByRole("heading", { name: "Application heading", exact: true }).evaluate(node => getComputedStyle(node).fontFamily), /Arial/, "nested application controls retain app typography");
    assert.doesNotMatch(await page.locator("p").evaluate(node => getComputedStyle(node).fontFamily), /Orbitron/, "title font choices preserve body typography");
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: path.join(output, "failure.png") });
    throw new Error(`${error.message}\nURL: ${page.url()}\nBrowser errors: ${errors.join("; ")}`, { cause: error });
  } finally { await browser.close(); }
});
