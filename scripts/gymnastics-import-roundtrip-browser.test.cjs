const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
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
  const base = "http://localhost:43129", records = new Map(), writes = [], errors = [];
  page.on("pageerror", error => errors.push(error.stack || error.message));
  page.on("dialog", dialog => dialog.accept());
  await page.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname.startsWith("/api/history/")) {
      const id = url.pathname.split("/")[3], previous = records.get(id);
      if (request.method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify(previous) });
      const body = request.postDataJSON();
      assert.equal(request.method(), "PATCH", "reopening keeps the same saved import");
      assert.equal(body.expectedRevision, previous.revision, "the save retains the owner/co-host revision baseline");
      writes.push(body);
      const row = { ...previous, title: body.title, data: body.data, revision: `${id}-${writes.length}` };
      records.set(id, row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base) return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` });
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
    publicPageSections: sections, extractionMeta: {}, enrichment: { state: "completed", pending: false },
  };
  const preview = page.getByRole("region", { name: "Event page preview panel", exact: true });
  const regionText = async () => preview.getByRole("region").evaluateAll(elements => elements.map(element => ({ name: element.getAttribute("aria-label") || element.querySelector("h2")?.innerText || "", text: element.innerText })));
  try {
    for (const variant of ["legacy", "v2"]) {
      const id = `gasparilla-${variant}`;
      const event = { title: "2026 Women’s Gasparilla Classic", date: "2026-03-06", time: "", endDate: "2026-03-08", endTime: "", timezone: "America/New_York", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", pageTemplateId: "airborne-atlas", extra: { meetDateRangeLabel: "March 6–8, 2026" } };
      const advancedSections = { meet: { doorsOpen: "7:00 AM each day." } };
      const data = { ...event, status: "draft", draftStatus: "draft", category: "gymnastics", createdVia: variant === "v2" ? "meet-discovery-v2" : "meet-discovery", createdManually: false, discoverySource: source, advancedSections, numberOfGuests: 4 };
      if (variant === "v2") Object.assign(data, {
        builderDraft: { event, venue: { venue: event.venue, address: event.address }, advancedSections, canonicalLinks: { links: [] }, reviewFlags: [] },
        publicArtifacts: { pipelineVersion: "gym-public-v3", hero: { title: event.title, dateLabel: "March 6–8, 2026", venue: event.venue, badges: [] }, sections, quickAccess: [], publishAssessment: { state: "ready", reasons: [] } },
        pipelineSummary: { discoveryId: "discovery-gasparilla", processingStage: "review_ready", publishReady: true },
      });
      records.set(id, { id, title: event.title, revision: `${id}-initial`, data, permissions: { canManageCollaborators: variant !== "v2" } });
      await page.goto(`${base}/event/gymnastics/customize?edit=${id}`);
      await preview.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      const before = await regionText();
      assert.ok(before.some(section => /Venue Details/.test(section.name) && /East, Central and West Halls/.test(section.text)));
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
        assert.deepEqual(writes.at(-1).data.pipelineSummary, data.pipelineSummary);
      }
      // Earlier saves mislabeled imports as manual templates. Their surviving
      // source metadata must also restore the imported layout on reopening.
      records.get(id).data.createdVia = "template";
      records.get(id).data.createdManually = true;
      await page.reload();
      await page.waitForURL(`**/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await preview.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      assert.deepEqual(await regionText(), before, `${variant}: imported sections, list formatting and links survive the template redirect`);
      assert.equal(writes.length, count + 1, "reopening never persists automatically");

      // A subsequent wrapper save must retain explicit clears and native fields.
      await preview.getByRole("button", { name: "Edit welcome message", exact: true }).click();
      await preview.getByLabel("Welcome message", { exact: true }).fill("");
      await preview.getByRole("button", { name: "Done editing welcome message", exact: true }).click();
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      await page.getByText("Draft saved.", { exact: true }).waitFor();
      assert.equal(writes.at(-1).data.templateEditor.snapshot.data.gymnasticsPageText.invitation, "");
      assert.equal(writes.at(-1).data.createdVia, data.createdVia, "explicit saving repairs an older import's creation marker");
      assert.equal(writes.at(-1).data.createdManually, false);
      await page.reload();
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
      await page.getByText("Enter by the West and Central Hall near the Coffee Bar.", { exact: true }).waitFor();
      await page.goto(`${base}/gymnastics/templates/airborne-atlas/customize?edit=${id}`);
      await preview.getByRole("button", { name: "Edit address", exact: true }).click();
      assert.equal(await preview.getByLabel("Address", { exact: true }).inputValue(), "");
      assert.equal(writes.length, count + 3, "guest rendering and reopening are read-only");
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
