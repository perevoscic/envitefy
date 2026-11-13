const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const { createImportedEventTheme } = require("./lib/event-messages-test-loader.cjs")("src/lib/imported-event-theme.ts");
compiled.init();

// Exercise the actual native editor, template redirect, account handoff and
// renderer. Every transport is intercepted; this never calls a provider or DB.
test("imported gymnastics venue guidance and curated sections survive explicit saves and reopening", { timeout: 180000 }, async () => {
  const output = path.resolve(".qa/gymnastics-import-roundtrip");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
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
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/gymnastics/customize/page.tsx"; @source "../src/components/events"; @source "../src/components/gym-meet-templates"; @source "../src/components/templates/TemplateEditorContext.tsx";',
    { from: path.resolve("scripts/gymnastics-roundtrip-fixture.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", timezoneId: "America/Chicago" });
  page.setDefaultTimeout(15000);
  const base = "http://localhost:43129", records = new Map(), writes = [], errors = [], artwork = new Map(), imageRequests = [], conflicts = [];
  page.on("pageerror", error => errors.push(error.stack || error.message));
  page.on("dialog", dialog => dialog.accept());
  await page.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (/\/api\/events\/[^/]+\/theme-artwork$/.test(url.pathname)) {
      const id = url.pathname.split("/")[3];
      if (request.method() === "POST") {
        const body = request.postDataJSON();
        imageRequests.push({ id, ...body });
        await new Promise(resolve => setTimeout(resolve, 800));
        artwork.set(id, { themeId: body.theme.id, status: "ready", imageUrl: `/media/event-media/${id}/original.webp`, updatedAt: new Date().toISOString() });
        return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ artwork: { themeId: body.theme.id, status: "generating" } }) });
      }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ artwork: artwork.get(id) || null }) });
    }
    if (url.pathname.startsWith("/api/history/")) {
      const id = url.pathname.split("/")[3], previous = records.get(id);
      if (request.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify(previous) });
      const body = request.postDataJSON();
      assert.equal(request.method(), "PATCH", "reopening keeps the same saved import");
      if (body.expectedRevision !== previous.revision) {
        conflicts.push(body);
        return route.fulfill({ status: 409, json: { code: "event_changed", error: "This event changed since you opened it." } });
      }
      assert.equal(body.expectedRevision, previous.revision, "the save retains the owner/co-host revision baseline");
      writes.push(body);
      const row = { ...previous, title: body.title, data: { ...previous.data, ...body.data }, revision: `${id}-${writes.length}` };
      records.set(id, row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base) return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}[data-leave]{position:fixed;top:0;left:0;z-index:50}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  const publicSection = (title, bullets) => ({ title, visibility: "visible", bullets, provenance: "pdf_grounded", confidence: 1 });
  const sections = {
    meetDetails: publicSection("Meet Details", ["The Gasparilla Classic takes place March 6–8, 2026.", "Doors open at 7:00 AM each day."]),
    venue: publicSection("Venue Details", ["Competition is in the East, Central and West Halls.", "Enter by the West and Central Hall near the Coffee Bar."]),
    spectatorInfo: publicSection("Spectator Info", ["Daily admission only; no weekend passes.", "Outside food is prohibited except for dietary restrictions or food allergies."]),
    documents: { ...publicSection("Documents", []), links: [{ label: "Visitor guide", url: "https://example.test/visitor-guide.pdf" }] },
  };
  const source = {
    workflow: "gymnastics", pipelineVersion: "gym-public-v3", input: { type: "file", fileName: "2026wgaspparentinfo.pdf" },
    parseResult: { dates: "March 6–8, 2026", meetDetails: { doorsOpen: "7:00 AM each day." }, admission: [{ label: "Adults", price: "$25" }] },
    websiteImport: { version: 1, eventYear: 2026, sources: [], participatingClubs: [], attractions: [],
      coverage: [{ section: "venue", status: "collected", reason: "Imported venue", sourceUrls: ["https://example.test/venue"] }],
      schedule: { status: "unknown", notice: "", links: [] } },
    publicPageSections: sections, extractionMeta: {}, enrichment: { state: "completed", pending: false },
  };
  const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
  const imageSettings = page.getByRole("complementary", { name: "Event editing controls", exact: true });
  const openImageSettings = () => imageSettings.getByRole("button", { name: "Image position", exact: true }).click();
  const regionText = async () => preview.getByRole("region").evaluateAll(elements => elements.map(element => ({ name: element.getAttribute("aria-label") || element.querySelector("h2")?.innerText || "", text: element.innerText })));
  try {
    for (const variant of ["legacy", "v2"]) {
      const id = `gasparilla-${variant}`;
      const event = { title: "2026 Women’s Gasparilla Classic", date: "2026-03-06", time: "", endDate: "2026-03-08", endTime: "", timezone: "America/New_York", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", pageTemplateId: "airborne-atlas", extra: { meetDateRangeLabel: "March 6–8, 2026" } };
      const advancedSections = { meet: { doorsOpen: "7:00 AM each day." } };
      const data = { ...event, status: "draft", draftStatus: "draft", category: "gymnastics", createdVia: variant === "v2" ? "meet-discovery-v2" : "meet-discovery", createdManually: false, discoverySource: source, advancedSections, numberOfGuests: 4 };
      data.importedTheme = { ...createImportedEventTheme({ title: event.title, sport: "gymnastics", city: "Tampa, FL", seed: id }), preserveTemplateStyle: true };
      if (variant === "v2") Object.assign(data, {
        builderDraft: { event, venue: { venue: event.venue, address: event.address }, advancedSections, canonicalLinks: { links: [] }, reviewFlags: [] },
        publicArtifacts: { pipelineVersion: "gym-public-v3", hero: { title: event.title, dateLabel: "March 6–8, 2026", venue: event.venue, badges: [] }, sections, quickAccess: [], publishAssessment: { state: "ready", reasons: [] } },
        pipelineSummary: { discoveryId: "discovery-gasparilla", processingStage: "review_ready", publishReady: true },
      });
      records.set(id, { id, title: event.title, revision: `${id}-initial`, data, permissions: { canManageCollaborators: variant !== "v2" } });
      await page.goto(`${base}/event/gymnastics/customize?edit=${id}`);
      await preview.getByText("Preparing your image…", { exact: true }).waitFor();
      assert.equal(await preview.locator("img.template-hero-image").count(), 0, "fresh imports never show a catalog gymnast");
      if (variant === "v2") {
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          if (width === 390)
            await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Close settings", exact: true }).click();
          const placeholder = preview.locator("[data-artwork-placeholder]");
          await placeholder.scrollIntoViewIfNeeded();
          assert.equal(await placeholder.isVisible(), true);
          assert.equal(await placeholder.evaluate(element => {
            const frame = element.getBoundingClientRect();
            const label = element.querySelector("span").getBoundingClientRect();
            return label.left >= frame.left && label.right <= frame.right;
          }), true, "loading copy stays inside the artwork frame");
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          await page.screenshot({ path: path.join(output, `artwork-preparing-${width}.png`) });
          if (width === 390)
            await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Page settings", exact: true }).click();
        }
        artwork.set(id, { themeId: data.importedTheme.id, status: "failed", error: "The event image could not be generated." });
        await page.reload();
        await preview.getByText("Event image unavailable", { exact: true }).waitFor();
        assert.equal(await preview.getByRole("button", { name: "Retry event image", exact: true }).count(), 0);
        await openImageSettings();
        await imageSettings.getByRole("button", { name: "Retry event image", exact: true }).waitFor();
        assert.equal(await preview.locator("img.template-hero-image").count(), 0, "failure never restores a catalog gymnast");
        artwork.delete(id);
        await page.reload();
        await preview.getByText("Preparing your image…", { exact: true }).waitFor();
      }
      await preview.getByRole("tab", { name: "Venue Details", exact: true }).click();
      await preview.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      const before = await regionText();
      assert.ok(before.some(section => /Venue Details/.test(section.name) && /East, Central and West Halls/.test(section.text)));
      assert.equal(await page.getByText(/Website sources:/).count(), 0, "source diagnostics stay out of the meet editor");
      if (variant === "v2") {
        const pending = records.get(id);
        pending.revision = `${id}-background-progress`;
        pending.data.pipelineSummary = { ...pending.data.pipelineSummary, progress: 100 };
      }
      const count = writes.length;
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(writes.length, count + 1);
      assert.equal(writes.at(-1).data.createdVia, data.createdVia);
      assert.equal(writes.at(-1).data.createdManually, false);
      assert.deepEqual(writes.at(-1).data.discoverySource, source);
      assert.equal(writes.at(-1).data.numberOfGuests, 4);
      if (variant === "v2") {
        assert.deepEqual(writes.at(-1).data.publicArtifacts, data.publicArtifacts);
        assert.deepEqual(records.get(id).data.pipelineSummary, data.pipelineSummary);
        assert.equal(writes.at(-1).data.pipelineSummary, undefined, "safe retry leaves the current server progress intact");
        assert.equal(conflicts.length, 1, "background progress exercises the real conflict and safe retry");
      }
      // Earlier saves mislabeled imports as manual templates. Their surviving
      // source metadata must also restore the imported layout on reopening.
      records.get(id).data.createdVia = "template";
      records.get(id).data.createdManually = true;
      await page.reload();
      await page.waitForURL(`**/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await preview.getByRole("tab", { name: "Venue Details", exact: true }).click();
      await preview.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      assert.deepEqual(await regionText(), before, `${variant}: imported sections, list formatting and links survive the template redirect`);
      assert.equal(writes.length, count + 1, "reopening never persists automatically");

      assert.equal(await preview.getByRole("button", { name: "Generate event image", exact: true }).count(), 0);
      await openImageSettings();
      await imageSettings.getByRole("button", { name: "Generate event image", exact: true }).click();
      await preview.getByText("Generating your image…", { exact: true }).waitFor();
      assert.equal(await preview.getByText("Creating event image…", { exact: true }).count(), 0);
      assert.equal(await preview.locator("img.template-hero-image").count(), 0);
      await imageSettings.getByRole("button", { name: "Back to details", exact: true }).click();
      await preview.locator(`img[src="/media/event-media/${id}/original.webp"]`).waitFor();
      assert.equal(await preview.locator("[data-artwork-placeholder]").count(), 0);
      await openImageSettings();
      await imageSettings.getByRole("button", { name: "Replace event image", exact: true }).waitFor();
      assert.equal(await preview.getByRole("button", { name: "Replace event image", exact: true }).count(), 0);
      await imageSettings.getByRole("button", { name: "Back to details", exact: true }).click();
      assert.equal(writes.length, count + 1, "image generation updates editor memory without saving the event");
      const imageRequest = imageRequests.at(-1);
      assert.equal(imageRequest.theme.context.title, event.title);
      assert.equal(imageRequest.theme.context.city, "Tampa, FL", "the image request retains the city printed in the address");
      assert.equal(imageRequest.theme.context.venue, event.venue);
      assert.equal(imageRequest.theme.context.address, event.address);
      assert.equal(imageRequest.theme.context.date, event.date);
      assert.equal(imageRequest.theme.preserveTemplateStyle, true);

      if (variant === "v2") {
        const beforeSwaps = imageRequests.length;
        const retainedImage = preview.locator(`img[src="/media/event-media/${id}/original.webp"]`);
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await imageSettings.getByRole("button", { name: "Design", exact: true }).click();
          const search = imageSettings.getByRole("searchbox", { name: "Search meet designs", exact: true });
          await search.fill("moonbeam");
          await imageSettings.locator('[data-template-masonry-card="moonbeam-balance"] button').click();
          await page.locator('[data-gym-design="moonbeam-balance"]').first().waitFor();
          assert.equal(await page.locator('[aria-label="Event page preview panel"] img[src$="/original.webp"]').count(), 1);
          if (width === 1440) {
            await imageSettings.getByRole("button", { name: "Redesign", exact: true }).click();
            await retainedImage.waitFor();
            await imageSettings.getByRole("button", { name: "Use template style", exact: true }).click();
            await retainedImage.waitFor();
            await imageSettings.getByRole("button", { name: "Use event theme", exact: true }).click();
            await retainedImage.waitFor();
          }
          await search.fill("airborne");
          await imageSettings.locator('[data-template-masonry-card="airborne-atlas"] button').click();
          await imageSettings.getByRole("button", { name: "Back to details", exact: true }).click();
          if (width === 390) {
            const views = page.getByRole("group", { name: "Editor view", exact: true });
            await views.getByRole("button", { name: "Close settings", exact: true }).click();
            await retainedImage.waitFor();
            await views.getByRole("button", { name: "Page settings", exact: true }).click();
          }
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        assert.equal(imageRequests.length, beforeSwaps, "template swaps, Redesign and styling toggles never generate another image");
      }

      // A subsequent wrapper save must retain explicit clears and native fields.
      await preview.getByRole("button", { name: "Edit welcome message", exact: true }).click();
      await preview.getByLabel("Welcome message", { exact: true }).fill("");
      await preview.getByRole("button", { name: "Done editing welcome message", exact: true }).click();
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(writes.at(-1).data.templateEditor.snapshot.data.gymnasticsPageText.invitation, "");
      assert.equal(writes.at(-1).data.createdVia, data.createdVia, "explicit saving repairs an older import's creation marker");
      assert.equal(writes.at(-1).data.createdManually, false);
      assert.equal(writes.at(-1).data.templateEditor.snapshot.data.importedTheme.artworkUrl, `/media/event-media/${id}/original.webp`);
      await page.reload();
      await preview.locator(`img[src="/media/event-media/${id}/original.webp"]`).waitFor();
      await preview.getByRole("tab", { name: "Venue Details", exact: true }).click();
      await preview.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      await preview.getByRole("button", { name: "Edit welcome message", exact: true }).click();
      assert.equal(await preview.getByLabel("Welcome message", { exact: true }).inputValue(), "");
      await preview.getByRole("button", { name: "Done editing welcome message", exact: true }).click();
      assert.equal(writes.length, count + 2);

      const correctedTitle = "Host's updated Gasparilla meet";
      const correctedVenue = "Tampa Convention Center — East Hall";
      for (const [field, value] of [["Event title", correctedTitle], ["Venue", correctedVenue], ["Address", ""]]) {
        await preview.getByRole("button", { name: `Edit ${field.toLowerCase()}`, exact: true }).click();
        await preview.getByLabel(field, { exact: true }).fill(value);
        await preview.getByRole("button", { name: `Done editing ${field.toLowerCase()}`, exact: true }).click();
      }
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      if (variant === "v2") {
        const nested = writes.at(-1).data.builderDraft;
        assert.equal(nested.event.title, correctedTitle);
        assert.equal(nested.event.venue, correctedVenue);
        assert.equal(nested.venue.venue, correctedVenue);
        assert.equal(nested.venue.address, "", "an address clear replaces the source address in the inflated guest data");
      }
      await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics-guest&edit=${id}`);
      await page.getByRole("heading", { level: 1, name: correctedTitle, exact: true }).waitFor();
      await page.getByText(correctedVenue, { exact: true }).first().waitFor();
      assert.equal(await page.getByText(event.address, { exact: true }).count(), 0, "saved guest rendering does not revive the old address");
      await page.getByRole("tab", { name: "Venue Details", exact: true }).click();
      await page.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      await page.locator(`img[src="/media/event-media/${id}/original.webp"]`).waitFor();
      await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await preview.getByRole("button", { name: "Edit address", exact: true }).click();
      assert.equal(await preview.getByLabel("Address", { exact: true }).inputValue(), "");
      assert.equal(writes.length, count + 3, "guest rendering and reopening are read-only");
    }
    // Older embedded links retain the same tools and explicit save lifecycle.
    const embeddedRecord = structuredClone(records.get("gasparilla-v2"));
    embeddedRecord.id = "gasparilla-embedded";
    delete embeddedRecord.data.templateEditor;
    records.set(embeddedRecord.id, embeddedRecord);
    await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics&edit=gasparilla-embedded&embed=1`);
    const embeddedControls = page.getByRole("complementary", { name: "Event editing controls", exact: true });
    await embeddedControls.getByRole("button", { name: "Page sections", exact: true }).click();
    await embeddedControls.getByRole("button", { name: "Back to details", exact: true }).click();
    await embeddedControls.getByRole("button", { name: "Layout", exact: true }).click();
    await embeddedControls.getByRole("button", { name: "Back to details", exact: true }).click();
    await embeddedControls.getByRole("button", { name: "Design", exact: true }).click();
    await embeddedControls.getByLabel("Title font", { exact: true }).selectOption("orbitron");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    assert.equal(writes.at(-1).data.gymnasticsTitleFont, "orbitron");
    await page.reload();
    await page.waitForURL("**/gymnastics/templates/airborne-atlas/customize?edit=gasparilla-embedded");
    await embeddedControls.waitFor({ state: "visible" });
    await embeddedControls.getByRole("button", { name: "Design", exact: true }).click();
    assert.equal(await embeddedControls.getByLabel("Title font", { exact: true }).inputValue(), "orbitron");
    // Tab choices use the real editor save and guest renderer, without dropping source facts or artwork.
    for (const width of [1440, 390]) {
      const id = `tabs-${width}`;
      const record = structuredClone(records.get("gasparilla-v2"));
      record.id = id;
      record.revision = `${id}-initial`;
      records.set(id, record);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      const settings = page.getByRole("complementary", { name: "Event editing controls", exact: true });
      await settings.getByRole("button", { name: "Page sections", exact: true }).click();
      const palette = settings.getByRole("region", { name: "Page sections", exact: true });
      const sectionOrder = palette.getByRole("list", { name: "Page section order", exact: true });
      const beforeWrites = writes.length;
      assert.equal(await page.getByRole("button", { name: "Manage tabs", exact: true }).count(), 0);
      const venueIndex = (await sectionOrder.locator("li > span:first-child").allTextContents()).indexOf("Venue Details");
      await palette.getByRole("button", { name: "Move Venue Details up", exact: true }).click();
      await palette.getByRole("button", { name: "Edit Venue Details", exact: true }).click();
      await page.getByLabel("Section name", { exact: true }).fill("Venue & arrival");
      await page.getByRole("button", { name: "Close section panel", exact: true }).click();
      assert.equal(await sectionOrder.locator("li > span:first-child").nth(venueIndex - 1).innerText(), "Venue & arrival");
      await palette.getByRole("button", { name: "Remove Venue & arrival section", exact: true }).click();
      await palette.getByRole("button", { name: /^Other/ }).click();
      await page.getByLabel("Section heading", { exact: true }).fill("Parent notes");
      await page.getByLabel("Section content", { exact: true }).fill("Bring a water bottle.");
      await page.getByRole("button", { name: "Close section panel", exact: true }).click();
      assert.equal(writes.length, beforeWrites, "section changes wait for explicit save");
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.deepEqual(records.get(id).data.discoverySource, record.data.discoverySource);
      await page.reload();
      await settings.getByRole("button", { name: "Page sections", exact: true }).click();
      const savedNames = await sectionOrder.locator("li > span:first-child").allTextContents();
      if (width === 390)
        await settings.getByRole("button", { name: "Close settings", exact: true }).click();
      assert.deepEqual(await preview.getByRole("tab").allTextContents(), savedNames);
      await preview.getByRole("tab", { name: "Parent notes", exact: true }).click();
      await preview.getByText("Bring a water bottle.", { exact: true }).waitFor();
      assert.equal(await preview.getByRole("tab", { name: "Venue & arrival", exact: true }).count(), 0);
      await page.goto(`${base}/event/gymnastics/customize?mode=gymnastics-guest&edit=${id}`);
      assert.deepEqual(await page.getByRole("tab").allTextContents(), savedNames);
      await page.getByRole("tab", { name: "Parent notes", exact: true }).click();
      await page.getByText("Bring a water bottle.", { exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Manage tabs", exact: true }).count(), 0);
      assert.equal(await page.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).isVisible(), false);
      await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await settings.getByRole("button", { name: "Page sections", exact: true }).click();
      await palette.getByRole("button", { name: "Venue & arrival", exact: true }).click();
      await page.getByRole("button", { name: "Close section panel", exact: true }).click();
      if (width === 390)
        await settings.getByRole("button", { name: "Close settings", exact: true }).click();
      await preview.getByRole("tab", { name: "Venue & arrival", exact: true }).click();
      await preview.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      assert.equal(writes.length, beforeWrites + 1, "reload, guest viewing and restore do not save automatically");
    }
    // Exit stays separate from closing settings and never writes or generates artwork.
    for (const width of [1440, 390, 320]) for (const published of [false, true]) {
      const id = `exit-${width}-${published}`;
      const record = structuredClone(records.get("gasparilla-v2"));
      record.id = id;
      record.revision = `${id}-initial`;
      record.data.status = record.data.draftStatus = published ? "published" : "draft";
      records.set(id, record);
      const href = `${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}&editor=menu&returnTo=${encodeURIComponent("/event/meet-return?tab=event")}`;
      const actions = page.getByRole("group", { name: "Save event", exact: true });
      const view = page.getByRole("group", { name: "Editor view", exact: true });
      const cancel = actions.getByRole("button", { name: "Cancel", exact: true });
      const beforeWrites = writes.length, beforeImages = imageRequests.length;
      const expectExit = async () => {
        await page.locator("[data-destination]").waitFor();
        assert.equal(new URL(page.url()).pathname, published ? "/event/meet-return" : "/create");
        if (published) assert.equal(new URL(page.url()).searchParams.get("tab"), "event");
        assert.equal(writes.length, beforeWrites, "Cancel never saves or publishes");
        assert.equal(imageRequests.length, beforeImages, "Cancel never generates artwork");
      };
      await page.setViewportSize({ width, height: 900 });
      await page.goto(href);
      await embeddedControls.waitFor({ state: "visible" });
      await cancel.waitFor({ state: "visible" });
      assert.equal(await page.getByRole("button", { name: /^Preview(?: event)?$/, exact: false }).count(), 0, "both editor Preview controls are removed");
      const bounds = await cancel.boundingBox();
      assert.ok(bounds.width >= 44 && bounds.height >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 900, "Cancel is a visible touch target within the viewport");
      await page.screenshot({ path: path.join(output, `exit-settings-${width}-${published}.png`) });
      await cancel.click();
      await expectExit();
      assert.equal(await page.getByRole("dialog").count(), 0, "clean Cancel exits directly from settings");

      await page.goto(href);
      await embeddedControls.waitFor({ state: "visible" });
      await view.getByRole("button", { name: "Close settings", exact: true }).click();
      await embeddedControls.waitFor({ state: "hidden" });
      assert.equal(await cancel.isVisible(), true, "the clean canvas retains its exit action");
      await page.screenshot({ path: path.join(output, `exit-canvas-${width}-${published}.png`) });
      await cancel.click();
      await expectExit();
      assert.equal(await page.getByRole("dialog").count(), 0, "clean exit does not prompt");

      await page.goto(href);
      await embeddedControls.getByRole("button", { name: "Event basics", exact: true }).click();
      const title = embeddedControls.getByLabel("Event Title", { exact: true });
      await title.fill("Unsaved meet title");
      await cancel.click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
      assert.equal(await title.inputValue(), "Unsaved meet title", "Keep editing retains the unsaved title");
      await view.getByRole("button", { name: "Close settings", exact: true }).click();
      await embeddedControls.waitFor({ state: "hidden" });
      await cancel.click();
      await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
      await view.getByRole("button", { name: "Page settings", exact: true }).click();
      assert.equal(await title.inputValue(), "Unsaved meet title", "canvas exit protection retains mounted settings");
      await view.getByRole("button", { name: "Close settings", exact: true }).click();
      await cancel.click();
      await dialog.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await expectExit();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
