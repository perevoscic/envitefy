const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("unified creation retains sources, recommends native templates and protects facts across browser journeys", { timeout: 180000 }, async t => {
  const output = path.resolve("output/qa/unified-create-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/unified-create.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/unified-create-auth.tsx"),
        "next/link": path.resolve("scripts/fixtures/unified-create-link.tsx"),
        "next/image$": path.resolve("scripts/fixtures/unified-create-image.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/unified-create-auth.tsx"),
        "@/app/sidebar-context": path.resolve("src/app/sidebar-context.tsx"),
        "@/contexts/MenuContext": path.resolve("scripts/fixtures/unified-create-menu.tsx"), "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process('@import "tailwindcss" source(none); @source "../src/app/create/UnifiedCreatePageClient.tsx"; @source "../src/app/events/EventsWorkspaceClient.tsx"; @source "../src/app/event/birthdays/customize/page.tsx"; @source "../src/app/event/general/customize/page.tsx"; @source "../src/components/templates/TemplateEditorContext.tsx"; @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/components/event-create/CreationTemplateGallery.tsx"; @source "../src/components/events/TemplateMasonryGallery.tsx"; @source "../src/components/events/TemplateAutoLoader.tsx"; @source "../src/components/events/TemplateThumbnail.tsx"; @source "../src/components/events/TemplateArtworkThumbnail.tsx"; @source "../src/components/templates/CategoryTemplateThumbnail.tsx";', { from: path.resolve("scripts/unified-create-fixture.css") })).css;
  const chromeCss = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../components/MainContentWrapper.tsx"; @source "../components/navigation/MobileNavHeader.tsx"; @source "../components/ui/gradient-backgrounds.tsx";'),
    { from: path.resolve("src/app/globals.css") },
  )).css;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", timezoneId: "America/Chicago" });
  const fixtureNow = "2026-10-22T17:00:00.000Z";
  await page.clock.setFixedTime(new Date(fixtureNow));
  page.setDefaultTimeout(10000);
  const base = "http://localhost:43139", errors = [], extracts = [], forbidden = [], renderedPublicAssets = new Set();
  let restricted = false;
  let restrictedCategories = ["birthdays"];
  let allowedProducts = ["snap", "live_card", "event_page", "signup_form"];
  let accessResponseDelay = 0;
  let delayedAccessStarted = false, delayedAccessFinished = false;
  let accessResponseGate = null, accessResponseError = "";
  let explicitCustomDesign = false;
  const generatedDesigns = [];
  let workspaceMode = false, staleFinished = false;
  let workspaceAccountTest = false, delayedEditStarted = false, delayedEditFinished = false;
  let retryUploadFailed = false, releaseCancelledRead = null, cancelledReadFinished = false;
  let sportsDiscoveryActive = false;
  const discoveryRequests = [], discoveryIntakes = new Map(), discoveryEvents = new Map(), sportsSourceUploads = [];
  const historyRequests = [], editRequests = [];
  const eventRows = [
    { id: "picnic", title: "Community Picnic", public_slug: "community-picnic", data: { primaryOutput: "event_page", ownership: "owned", status: "published", category: "General Events", start: "2027-05-03T18:00:00Z", timezone: "America/New_York", location: "Riverside Park" } },
    { id: "maya-draft", title: "Draft Maya Birthday", data: { primaryOutput: "event_page", ownership: "owned", status: "draft", category: "Birthdays", templateEditor: { category: "birthdays", templateId: "party-pop" } } },
    { id: "football", title: "Eagles Football Season", data: { primaryOutput: "event_page", ownership: "owned", status: "published", category: "sport_football_season", discoverySource: { workflow: "football" } } },
    { id: "signup", title: "Volunteer Signup", public_slug: "school-volunteers", data: { primaryOutput: "signup_form", ownership: "owned", status: "published", category: "signup-forms", signupForm: {} } },
    { id: "concert", title: "Invited Concert", data: { primaryOutput: "event_page", ownership: "invited", status: "published", category: "General Events" } },
    { id: "cohost", title: "Co-host Fundraiser", data: { primaryOutput: "event_page", ownership: "owned", collaborationRole: "cohost", status: "published", createdVia: "custom-event-page", category: "General Events", customEventPage: { version: 1 } } },
  ];
  const information = (title, category = "birthdays", venue = "Riverside Park") => ({ version: 1, kind: "information", category,
    design: { version: 1, name: "Source information", description: "", layout: "banner", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#251f3d", accent: "#675cf4" } },
    details: { title, description: "Bring a picnic blanket. Venue corrected by the host.", date: "2027-05-03", time: "15:00", endDate: "", endTime: "", timezone: "America/New_York", venue, location: "123 River Road", host: "Lee", rsvpEmail: "lee@test.com", rsvpPhone: "5551234567", rsvpEnabled: true, sections: [{ title: "Arrival", body: "Use the east entrance. Keep the handout instructions." }], registryLinks: [],
  } });
  page.on("pageerror", error => errors.push(error.stack || error.message));
  page.on("console", message => { if (/Encountered two children with the same key/.test(message.text())) errors.push(message.text()); });
  page.on("dialog", dialog => dialog.accept());
  await page.route("**/*", async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === base && url.pathname.endsWith(".js")) {
      const file = path.join(output, path.basename(url.pathname));
      if (fs.existsSync(file)) return route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(file) });
    }
    if (url.pathname === "/api/user/creation-access") {
      const body = JSON.stringify({ access: { policy: restricted ? "restricted" : "standard", allowedProducts, allowedCategories: restricted ? restrictedCategories : ["birthdays", "general", "weddings", "anniversaries", "baby-showers", "bridal-showers", "gender-reveal", "gymnastics", "football", "sport-events"] } });
      const failure = accessResponseError, gate = accessResponseGate;
      if (gate) { gate.started = true; await gate.promise; gate.finished = true; }
      if (accessResponseDelay) {
        delayedAccessStarted = true;
        await new Promise(resolve => setTimeout(resolve, accessResponseDelay));
        delayedAccessFinished = true;
      }
      return route.fulfill({ status: failure ? 503 : 200, contentType: "application/json", body: failure ? JSON.stringify({ error: failure }) : body });
    }
    if (url.pathname === "/api/create/extract") {
      const json = req.headers()["content-type"]?.includes("application/json") ? req.postDataJSON() : null;
      const raw = req.postData() || "";
      extracts.push({ json, raw });
      if (json?.url === "https://blocked.test/event/831") return route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "That page could not be opened. Paste its event text instead." }) });
      if (raw.includes("retry-flyer.png") && !retryUploadFailed) {
        retryUploadFailed = true;
        return route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "The source reader is temporarily unavailable. Retry parsing your retained file." }) });
      }
      const cancelled = raw.includes("cancelled-flyer.png");
      if (cancelled) await new Promise(resolve => { releaseCancelledRead = resolve; });
      const wedding = raw.includes("wedding-flyer"), replacement = raw.includes("elliot-flyer"), ambiguous = raw.includes("ambiguous-sport");
      const sport = raw.includes("gymnastics") ? "gymnastics" : raw.includes("football") ? "football" : null;
      const category = ambiguous || sport ? "sports" : wedding ? "weddings" : json?.url ? "general" : "birthdays";
      const title = ambiguous ? "Youth sports schedule" : sport === "gymnastics" ? "Spring gymnastics meet" : sport === "football" ? "Eagles football season" : wedding ? "Taylor and Casey's wedding" : json?.url ? "Community festival from the public page" : replacement ? "Elliot's 9th birthday" : "Maya's 7th birthday";
      if (sportsDiscoveryActive && sport && !ambiguous) {
        const clientIntakeId = json?.clientIntakeId || raw.match(/name="clientIntakeId"\r\n\r\n([^\r\n]+)/)?.[1];
        const eventId = `fixture-sport-${discoveryEvents.size + 1}`;
        const selectedSport = json?.sport || raw.match(/name="sport"\r\n\r\n([^\r\n]+)/)?.[1] || sport;
        const state = { eventId, clientIntakeId, raw, sport: selectedSport, runCount: 0, cancelled: false };
        discoveryIntakes.set(clientIntakeId, state); discoveryEvents.set(eventId, state);
        sportsSourceUploads.push(state);
        if (raw.includes("lost-response-gymnastics.pdf")) return route.fulfill({ contentType: "application/x-ndjson", body: '{"stage":"storing_source"}\n{"result":' });
        return route.fulfill({ contentType: "application/x-ndjson", body: [
          { stage: "reading" }, { stage: "classifying" }, { stage: "storing_source" },
          { result: { classification: { category, sport, confidence: "high", alternatives: [] }, sourceText: `${title}. Facts read from the actual submitted source.`, discoveryEventId: eventId } },
        ].map(value => JSON.stringify(value)).join("\n") + "\n" });
      }
      try {
        return await route.fulfill({ contentType: "application/json", body: JSON.stringify({ classification: { category, sport, confidence: ambiguous || raw.includes("uncertain-flyer") ? "low" : "high", alternatives: [] }, information: information(title, ambiguous ? "sport-events" : sport || category, replacement ? "Meadow Hall" : "Riverside Park"), sourceText: `${title}. Facts read from the actual submitted source.` }) });
      } catch (error) {
        if (!cancelled) throw error;
      } finally {
        if (cancelled) cancelledReadFinished = true;
      }
    }
    if ((sportsDiscoveryActive && url.pathname.startsWith("/api/discovery/")) || (url.pathname === "/api/discovery/intake" && req.method() === "DELETE")) {
      const method = req.method(), raw = req.postData() || "";
      const json = req.headers()["content-type"]?.includes("application/json") ? req.postDataJSON() : null;
      const multipartField = key => raw.match(new RegExp(`name="${key}"\\r\\n\\r\\n([^\\r\\n]+)`))?.[1];
      const clientIntakeId = url.searchParams.get("clientIntakeId") || json?.clientIntakeId || multipartField("clientIntakeId");
      discoveryRequests.push({ path: url.pathname, method, raw, json, clientIntakeId });
      if (url.pathname === "/api/discovery/intake" && method === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ eventId: discoveryIntakes.get(clientIntakeId)?.eventId || null }) });
      if (url.pathname === "/api/discovery/intake" && method === "POST") {
        const eventId = `fixture-sport-${discoveryEvents.size + 1}`;
        const state = { eventId, clientIntakeId, raw, runCount: 0, cancelled: false };
        discoveryIntakes.set(clientIntakeId, state); discoveryEvents.set(eventId, state);
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ eventId }) });
      }
      if (url.pathname === "/api/discovery/intake" && method === "DELETE") {
        const state = discoveryIntakes.get(clientIntakeId); if (state) state.cancelled = true;
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ cancelled: true }) });
      }
      const match = url.pathname.match(/^\/api\/discovery\/([^/]+)\/(run|status)$/), state = match && discoveryEvents.get(match[1]);
      if (state && match[2] === "run" && method === "POST") {
        state.runCount++;
        const failing = state.raw.includes("retry-gymnastics.pdf") && state.sport !== "football" && state.runCount === 1;
        return route.fulfill({ status: failing ? 503 : 200, contentType: "application/json", body: JSON.stringify(failing ? { error: "Schedule importer temporarily unavailable. Retry your retained import." } : { accepted: true }) });
      }
      if (state && match[2] === "status" && method === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ draftReady: !state.raw.includes("cancel-gymnastics.pdf"), builderReady: false, processingStage: state.raw.includes("cancel-gymnastics.pdf") ? "parse" : "enrich" }) });
      forbidden.push({ path: url.pathname, method });
      return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unexpected sports discovery request" }) });
    }
    if (workspaceMode && url.pathname === "/api/history" && req.method() === "GET") {
      const filters = Object.fromEntries(url.searchParams); historyRequests.push(filters);
      if (workspaceAccountTest && req.headers()["x-fixture-owner"] === "second-host") {
        await new Promise(resolve => setTimeout(resolve, 700));
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [{ id: "second-owner-event", title: "Second Account Event", data: { ownership: "owned", status: "published", category: "General Events" } }], nextCursor: null }) });
      }
      if (filters.q === "slow") { await new Promise(resolve => setTimeout(resolve, 900)); staleFinished = true; return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [{ id: "stale", title: "Stale Slow Event", data: { status: "published" } }], nextCursor: "stale-page" }) }).catch(() => {}); }
      if (filters.q === "fast") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [{ id: "fast", title: "Fast Current Event", data: { status: "published" } }], nextCursor: null }) });
      let items = eventRows.filter(row => filters.kind === "drafts" ? row.data.status === "draft" : filters.kind === "schedules" ? row.id === "football" : filters.kind === "signups" ? row.id === "signup" : true)
        .filter(row => filters.relation === "owned" ? row.data.ownership !== "invited" : filters.relation === "invited" ? row.data.ownership === "invited" : true)
        .filter(row => !filters.q || row.title.toLowerCase().includes(filters.q.toLowerCase()));
      let nextCursor = null;
      if (filters.kind === "all" && filters.relation === "all" && !filters.q) { if (!filters.cursor) { items = items.slice(0, 3); nextCursor = "page-2"; } else items = [eventRows[0], ...items.slice(3)]; }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items, nextCursor }) });
    }
    if (workspaceMode && /^\/api\/history\/[^/]+$/.test(url.pathname) && req.method() === "GET") {
      const id = url.pathname.split("/")[3]; editRequests.push(id);
      if (workspaceAccountTest) { delayedEditStarted = true; await new Promise(resolve => setTimeout(resolve, 500)); delayedEditFinished = true; }
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...eventRows.find(row => row.id === id), permissions: { canEdit: true, canManageCollaborators: false }, revision: "cohost-revision" }) });
    }
    if (explicitCustomDesign && url.pathname === "/api/event-themes/generate") {
      generatedDesigns.push(req.postDataJSON());
      const { kind, ...page } = information("Garden birthday chosen by the host");
      page.details.date = "";
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...page, artwork: "/templates/garden-birthday.webp" }) });
    }
    if (/\/api\/(?:history|event-themes\/generate|livecard-builder\/(?:jobs|design|headline)|signup-themes\/generate|discovery\/)/.test(url.pathname)) { forbidden.push({ path: url.pathname, method: req.method() }); return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Unexpected generation or persistence during intake" }) }); }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (["image", "font"].includes(req.resourceType())) {
      // Render the checked-in artwork for visual QA while keeping every provider offline.
      const publicRoot = path.resolve("public");
      const sourceUrl = url.origin === base && url.pathname === "/_next/image" && url.searchParams.has("url") ? new URL(url.searchParams.get("url"), base) : url;
      const asset = path.resolve(publicRoot, `.${decodeURIComponent(sourceUrl.pathname)}`);
      if (sourceUrl.origin === base && asset.startsWith(`${publicRoot}${path.sep}`) && fs.existsSync(asset) && fs.statSync(asset).isFile()) {
        const contentType = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".woff2": "font/woff2" }[path.extname(asset).toLowerCase()];
        if (contentType) {
          renderedPublicAssets.add(sourceUrl.pathname);
          return route.fulfill({ contentType, body: fs.readFileSync(asset) });
        }
      }
      return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="#eee8f3"/></svg>' });
    }
    if (url.origin === base) return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${url.searchParams.get("chrome") === "1" ? chromeCss : ""}@font-face{font-family:"Inter";src:url("/fonts/birthday/inter.ttf") format("truetype");font-weight:100 900;font-display:swap}@font-face{font-family:"Playfair Display";src:url("/fonts/birthday/playfairdisplay.ttf") format("truetype");font-weight:100 900;font-display:swap}body{margin:0;--font-geist-sans:"Inter",system-ui,sans-serif;--font-playfair:"Playfair Display",Georgia,serif}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  const modes = page.locator('[aria-label="How would you like to start?"]');
  const mode = name => modes.getByRole("button", { name: new RegExp(`^${name}`) });
  const click = name => page.getByRole("button", { name, exact: true }).click();
  const pastedText = () => page.getByRole("textbox", { name: "Paste event text", exact: true });
  const seedHistoricalNotes = value => page.evaluate(async text => {
    const id = new URL(location.href).searchParams.get("intake");
    await window.__creationBrowser.readCreationIntake("unified-host", id);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("envitefy-creation-intakes", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction("intakes", "readwrite"), store = tx.objectStore("intakes");
        const existing = store.get(`unified-host:${id}`);
        existing.onsuccess = () => { const row = existing.result; store.put({ ...row, revision: row.revision + 1, source: { ...row.source, text } }); };
        tx.oncomplete = () => { db.close(); resolve(id); };
        tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
      };
    });
  }, value);
  const capture = async name => {
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
    await page.screenshot({ path: path.join(output, name), fullPage: true });
  };
  const openEditorControls = async () => {
    const edit = page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Edit", exact: true });
    if (await edit.isVisible()) await edit.click();
  };
  const openHeadline = async () => { await page.locator("[data-native-birthday] [data-event-page-editor]").waitFor(); await openEditorControls(); if (!await page.getByLabel("Venue", { exact: true }).count()) await page.getByRole("button", { name: /^Headline/ }).click(); };
  const templates = page.getByRole("region", { name: "Matching event designs" });
  const sourceShortcuts = page.getByRole("region", { name: "Your event templates", exact: true });
  const inspiration = page.getByRole("complementary", { name: "Event page design inspiration", includeHidden: true });
  const assertNoSourceShortcuts = async context => {
    assert.equal(await sourceShortcuts.count(), 0, `${context}: source panels omit category shortcut cards`);
    assert.equal(await page.getByRole("button", { name: "Browse available event types", exact: true }).count(), 0, `${context}: source panels omit the browse footer`);
  };
  const setMenuPreferences = preferences => page.evaluate(preferences => window.__creationBrowser.setFixtureMenuPreferences(preferences), preferences);
  const reloadAccess = () => page.evaluate(() => window.dispatchEvent(new Event("envitefy:creation-access-updated")));
  const file = name => ({ name, mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
  const inspect = () => page.evaluate(async () => {
    const id = new URL(location.href).searchParams.get("intake");
    const value = id ? await window.__creationBrowser.readCreationIntake("unified-host", id) : null;
    return value ? { id: value.id, phase: value.phase, title: value.information?.details.title, venue: value.information?.details.venue, notes: value.source.text, file: value.source.files[0]?.name, fileBytes: value.source.files[0]?.size, sourceText: value.sourceText } : null;
  });
  const readCurrentIntake = () => page.evaluate(() => window.__creationBrowser.readCreationIntake("unified-host", new URL(location.href).searchParams.get("intake")));
  const assertScratchGallery = async context => {
    assert.equal(await templates.getByRole("combobox", { name: "Event type", exact: true }).count(), 0, context + ": the chosen category needs no repeated selector");
    assert.equal(await templates.getByRole("combobox", { name: "Holiday or occasion", exact: true }).count(), 0, context + ": the chosen occasion needs no repeated selector");
    assert.equal(await templates.getByText("Your event", { exact: true }).count(), 0, context + ": the repeated event summary is absent");
    assert.equal(await templates.getByText("Add your event details in the editor after choosing a design.", { exact: true }).count(), 0, context + ": the repeated summary guidance is absent");
    assert.equal(await page.locator("[data-unified-create] header p").filter({ hasText: /^Design$/ }).count(), 0, context + ": the standalone Design label is absent");
    await page.waitForFunction(() => document.querySelector("[data-unified-create] h1") === document.activeElement);
    assert.equal(await page.getByRole("heading", { level: 1, name: "Choose your design", exact: true }).evaluate(element => element === document.activeElement), true, context + ": gallery navigation focuses the main heading");
  };
  const openCreate = async query => {
    await page.goto(`${base}/create${query || ""}`);
    await page.locator("[data-unified-create]").waitFor();
    await page.waitForFunction(() => {
      const mode = document.querySelector('[aria-label="How would you like to start?"] button');
      if (!mode) return !!document.querySelector('[aria-label="Matching event designs"]');
      return !mode.disabled && !!document.querySelector('[aria-label="Choose an event type"] [data-creation-event-type]');
    });
  };
  const openUploadCreate = async () => {
    await openCreate();
    await mode("Upload").click();
  };
  const uploadFiles = async files => {
    if (await mode("Upload").count() && await mode("Upload").getAttribute("aria-pressed") !== "true") await mode("Upload").click();
    await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(files);
  };
  const waitForImportedEditor = async () => {
    await page.waitForFunction(() => location.pathname !== "/create" && !!document.querySelector("[data-native-birthday] [data-event-page-editor], [data-native-general] [data-event-page-editor], [data-destination], [data-custom-editor] [data-event-page-editor]"));
    assert.equal(await templates.count(), 0, "parsed imports open the editor without a design-selection gate");
    const id = new URL(page.url()).searchParams.get("intake");
    assert.ok(id, "automatic editor handoff retains its browser intake identity");
    return id;
  };
  const openImportedDesigns = async () => {
    const id = await waitForImportedEditor();
    await openCreate(`?intake=${encodeURIComponent(id)}&step=templates`);
    await templates.waitFor();
    return id;
  };
  const assertNoOverflow = async context => {
    const bounds = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, overflowing: Array.from(document.querySelectorAll("[data-unified-create] *")).map(element => ({ element: element.tagName, className: element.className?.baseVal ?? element.className, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })).filter(element => element.width && element.right > innerWidth + 1).slice(0, 6) }));
    assert.ok(bounds.document <= bounds.viewport + 1 && bounds.body <= bounds.viewport + 1, `${context}: ${JSON.stringify(bounds)}`);
  };
  const assertPrimaryContrast = async (locator, context) => {
    await locator.evaluate(element => new Promise(resolve => {
      const check = () => { if (!element.matches(":disabled") && Number(getComputedStyle(element).opacity) === 1) resolve(undefined); else setTimeout(check, 20); }; check();
    }));
    const colors = await locator.evaluate(element => { const style = getComputedStyle(element); return { foreground: style.color, background: style.backgroundColor, opacity: style.opacity }; });
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const values = [luminance(colors.foreground), luminance(colors.background)].sort((a, b) => a - b);
    const contrast = (values[1] + 0.05) / (values[0] + 0.05);
    assert.ok(contrast >= 4.5, `${context}: readable primary action (${JSON.stringify(colors)}, contrast ${contrast})`);
    assert.notEqual(colors.background, "rgb(255, 255, 255)", `${context}: primary remains visibly filled`);
    assert.equal(colors.opacity, "1", `${context}: enabled primary is fully opaque`);
  };
  const waitForStored = async (read, description) => {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) { if (await read()) return; await new Promise(resolve => setTimeout(resolve, 30)); }
    throw new Error(`Timed out waiting for ${description}`);
  };
  const holdAccessResponse = () => {
    let release;
    const promise = new Promise(resolve => { release = resolve; });
    accessResponseGate = { promise, release, started: false, finished: false };
    return accessResponseGate;
  };
  try {
    await t.test("mobile creation heading clears the actual topbar after navigation, method changes and restored scroll", async () => {
      const geometry = [];
      const chooseMethod = async (name, id) => {
        await mode(name).click();
        await page.waitForFunction(id => {
          const button = document.querySelector(`[data-mode="${id}"]`);
          return button?.getAttribute("aria-pressed") === "true" && !button.disabled && !!document.querySelector(`[data-source-panel="${id}"]`);
        }, id);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      };
      const readGeometry = async (state, expectedVisible = true) => {
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const row = await page.evaluate(state => {
          const measure = element => { const rect = element.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height }; };
          const title = document.querySelector("[data-unified-create] h1");
          const navbar = document.querySelector('[data-app-mobile-topbar="app"]');
          const main = document.querySelector("[data-unified-create]");
          return { state, width: innerWidth, viewportHeight: innerHeight, scrollY, scrollRestoration: history.scrollRestoration, title: measure(title), navbar: measure(navbar), main: measure(main), mainScrollMargin: getComputedStyle(main).scrollMarginTop, wrapperPadding: getComputedStyle(document.querySelector('[data-app-main-content="true"]')).paddingTop };
        }, state);
        row.expectedVisible = expectedVisible;
        geometry.push(row);
        return row;
      };
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 900 });
        await openCreate("?chrome=1");
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await readGeometry("fresh page");
        assert.equal(await page.evaluate(() => history.scrollRestoration), "manual", width + "px source view owns mobile scroll restoration");

        // Model arriving from another long workspace and the router aligning its
        // first page element. The fixed navbar must not cover the page heading.
        await page.goto(`${base}/chrome-origin?chrome=1`);
        await page.locator("[data-fixture-navigation-origin]").waitFor();
        await page.evaluate(() => { window.scrollTo({ top: 300, behavior: "instant" }); window.__creationBrowser.navigate("/create?chrome=1"); });
        await page.locator('[aria-label="Choose an event type"] [data-creation-event-type]').first().waitFor();
        await page.locator("[data-unified-create]").evaluate(element => element.scrollIntoView({ behavior: "instant" }));
        await readGeometry("route page alignment");

        await chooseMethod("Paste URL", "url");
        const urlInput = page.getByRole("textbox", { name: "Public event URL", exact: true });
        await urlInput.fill("https://school.test/retained-mobile-link");
        await chooseMethod("Start from scratch", "scratch");
        await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" }));
        const beforeUpload = await readGeometry("retained scroll before Upload", false);
        assert.ok(beforeUpload.title.top < beforeUpload.navbar.bottom, width + "px setup reproduces the heading behind the navbar before Upload: " + JSON.stringify(beforeUpload));
        await chooseMethod("Upload", "files");
        await readGeometry("Upload after retained scroll");
        await chooseMethod("Start from scratch", "scratch");
        await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" }));
        const beforeUrl = await readGeometry("retained scroll before Paste URL", false);
        assert.ok(beforeUrl.title.top < beforeUrl.navbar.bottom, width + "px setup reproduces the heading behind the navbar before Paste URL: " + JSON.stringify(beforeUrl));
        await chooseMethod("Paste URL", "url");
        await readGeometry("Paste URL after retained scroll");
        assert.equal(await urlInput.inputValue(), "https://school.test/retained-mobile-link", width + "px method changes retain the URL input");

        await chooseMethod("Start from scratch", "scratch");
        await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" }));
        const beforeRefresh = await readGeometry("retained scroll before refresh", false);
        assert.ok(beforeRefresh.title.top < beforeRefresh.navbar.bottom, width + "px setup reproduces the heading behind the navbar before refresh");
        await page.reload();
        await page.locator("[data-unified-create]").waitFor();
        await mode("Start from scratch").waitFor();
        await readGeometry("refresh after retained scroll");
        await page.screenshot({ path: path.join(output, `source-mobile-heading-${width}.png`) });
      }
      fs.writeFileSync(path.join(output, "source-mobile-heading-geometry.json"), JSON.stringify(geometry, null, 2));
      for (const row of geometry) {
        assert.ok(row.navbar.height > 0, `${row.width}px ${row.state} uses the actual mobile navbar`);
        if (!row.expectedVisible) continue;
        assert.ok(row.title.top >= row.navbar.bottom - 1, `${row.width}px ${row.state}: heading clears the actual fixed navbar: ${JSON.stringify(row)}`);
        assert.ok(row.title.left >= 0 && row.title.right <= row.width + 1 && row.title.bottom <= row.viewportHeight, `${row.width}px ${row.state}: the complete heading stays in the viewport: ${JSON.stringify(row)}`);
      }
      await page.goto(`${base}/chrome-origin?chrome=1`);
      await page.locator("[data-fixture-navigation-origin]").waitFor();
      await page.evaluate(() => { history.scrollRestoration = "auto"; window.__creationBrowser.navigate("/create?chrome=1"); });
      await page.locator("[data-unified-create]").waitFor();
      await page.waitForFunction(() => history.scrollRestoration === "manual");
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForFunction(() => history.scrollRestoration === "auto");
      assert.equal(await page.evaluate(() => history.scrollRestoration), "auto", "returning to desktop restores the prior browser setting");
      await page.setViewportSize({ width: 390, height: 900 });
      await page.waitForFunction(() => history.scrollRestoration === "manual");
      await page.evaluate(() => window.__creationBrowser.navigate("/chrome-origin?chrome=1"));
      await page.locator("[data-fixture-navigation-origin]").waitFor();
      assert.equal(await page.evaluate(() => history.scrollRestoration), "auto", "leaving the mobile source view restores the prior browser setting");
      // This first test owns the fresh browser's URL intakes. Remove them after
      // unmounting so later date tests do not expire unrelated fixture state.
      const remainingIntakes = await page.evaluate(async () => {
        await window.__creationBrowser.clearCreationIntakes("unified-host");
        return (await window.__creationBrowser.listCreationIntakes("unified-host")).length;
      });
      assert.equal(remainingIntakes, 0, "mobile chrome QA leaves no retained URL intakes for later browser journeys");
      assert.deepEqual(errors, [], "shared creation chrome renders without browser errors");
    });
    // Navigation cases retain temporary URL sources. Isolate them before later
    // calendar tests advance beyond the browser intake's seven-day lifetime.
    await page.evaluate(() => window.__creationBrowser.clearCreationIntakes("unified-host"));
    if (process.env.UNIFIED_CREATE_CHROME_QA === "1") return;
    await t.test("mobile category gestures lift the panel before exploring and return through the first category", async () => {
      const scroller = page.locator("[data-category-scroller]");
      const readsBefore = extracts.length, writesBefore = forbidden.length;
      const geometry = [];
      let touchClockPaused = false;
      const settle = () => touchClockPaused ? page.clock.runFor(34) : page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const readPosition = () => page.evaluate(() => {
        const panel = document.querySelector("[data-category-panel]");
        const list = document.querySelector("[data-category-scroller]");
        const navbar = document.querySelector('[data-app-mobile-topbar="app"]');
        const rect = list.getBoundingClientRect();
        const panelTop = panel.getBoundingClientRect().top;
        const dockTop = (navbar?.getClientRects().length ? navbar.getBoundingClientRect().bottom : 0) + 12;
        return { width: innerWidth, height: innerHeight, outer: scrollY, inner: list.scrollTop,
          innerMax: list.scrollHeight - list.clientHeight, panelTop, dockTop,
          dockY: Math.max(0, scrollY + panelTop - dockTop),
          documentMax: document.documentElement.scrollHeight - innerHeight,
          bounds: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } };
      });
      const moveMouseIntoList = async () => {
        const { bounds, height } = await readPosition();
        await page.mouse.move((bounds.left + bounds.right) / 2, Math.min(bounds.bottom - 20, height - 36));
      };
      const resetPosition = async () => {
        await scroller.evaluate(element => { element.scrollTop = 0; window.scrollTo({ top: 0, behavior: "instant" }); });
        await settle();
      };
      const cdp = await page.context().newCDPSession(page);
      let fingerX = 0, fingerY = 0, fingerTimestamp = 0, touching = false;
      const startTouch = async () => {
        const { bounds, height } = await readPosition();
        fingerX = (bounds.left + bounds.right) / 2;
        fingerY = Math.min(bounds.bottom - 20, height - 36);
        assert.ok(fingerY > bounds.top + 20, "the trusted gesture starts over the visible category list");
        fingerTimestamp = await page.evaluate(() => (performance.timeOrigin + performance.now()) / 1000);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", timestamp: fingerTimestamp, touchPoints: [{ x: fingerX, y: fingerY, id: 1 }] });
        touching = true;
      };
      const moveTouch = async deltaY => {
        const startY = fingerY, steps = Math.max(4, Math.ceil(Math.abs(deltaY) / 32));
        for (let step = 1; step <= steps; step++) {
          fingerY = startY + deltaY * step / steps;
          assert.ok(fingerY > 0 && fingerY < 900, "the trusted swipe stays inside the mobile viewport");
          // Model a continuous 60Hz gesture independently of protocol/CI latency.
          // The application's 80ms release cutoff must measure the simulated
          // finger movement, not time spent awaiting geometry over CDP.
          fingerTimestamp += 1 / 60;
          if (touchClockPaused) await page.clock.runFor(17);
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", timestamp: fingerTimestamp, touchPoints: [{ x: fingerX, y: fingerY, id: 1 }] });
        }
        await settle();
      };
      const endTouch = async () => {
        fingerTimestamp += 1 / 60;
        if (touchClockPaused) await page.clock.runFor(17);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", timestamp: fingerTimestamp, touchPoints: [] });
        touching = false;
        await settle();
      };
      await page.emulateMedia({ reducedMotion: "reduce" });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      try {
        for (const width of [320, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await openCreate("?chrome=1");
          await page.waitForFunction(() => document.querySelector("[data-category-scroller]").getAttribute("data-page-handoff") === "true");
          await page.evaluate(async () => {
            await document.fonts.ready;
            window.__categoryTrustedTouches = [];
            for (const type of ["touchstart", "touchmove", "touchend"]) {
              document.addEventListener(type, event => window.__categoryTrustedTouches.push({ type, trusted: event.isTrusted }), { passive: true });
            }
          });
          await resetPosition();
          const initial = await readPosition();
          assert.ok(initial.dockY > 120 && initial.documentMax >= initial.dockY - 2, width + "px has enough document space to lift the panel beneath navigation: " + JSON.stringify(initial));

          await startTouch();
          await moveTouch(-70);
          const lifted = await readPosition();
          assert.ok(lifted.outer > initial.outer + 40, width + "px an upward swipe first lifts the page: " + JSON.stringify(lifted));
          assert.ok(lifted.panelTop < initial.panelTop - 40 && lifted.panelTop > lifted.dockTop + 20, width + "px the panel is still approaching navigation");
          assert.equal(lifted.inner, 0, width + "px categories stay at the first item while the panel rises");
          await endTouch();

          // Cross the docking point, then reverse through the first category
          // without lifting the finger. Neither handoff may need another swipe.
          await startTouch();
          await moveTouch(-(lifted.dockY - lifted.outer + 160));
          const explored = await readPosition();
          assert.ok(Math.abs(explored.outer - explored.dockY) <= 3 && Math.abs(explored.panelTop - explored.dockTop) <= 3, width + "px the panel stops beneath the actual navbar: " + JSON.stringify(explored));
          assert.ok(explored.inner >= 130, width + "px the same swipe spends its remaining movement inside categories: " + JSON.stringify(explored));
          await moveTouch(explored.inner + 100);
          const returned = await readPosition();
          assert.ok(returned.inner <= 1, width + "px reversing reaches the first category before moving the page");
          assert.ok(returned.outer < explored.outer - 70 && returned.panelTop > returned.dockTop + 70, width + "px the same gesture continues down the page after the first category: " + JSON.stringify(returned));
          await endTouch();
          const touches = await page.evaluate(() => window.__categoryTrustedTouches);
          assert.ok(touches.filter(event => event.type === "touchmove").length >= 8 && touches.every(event => event.trusted), width + "px exercises trusted browser touch input");
          assert.equal(await templates.count(), 0, width + "px dragging over category buttons opens no design");

          await resetPosition();
          await moveMouseIntoList();
          await page.mouse.wheel(0, 80);
          await settle();
          const wheelLifted = await readPosition();
          assert.ok(wheelLifted.outer >= 75 && wheelLifted.inner <= 1, width + "px wheel input also gives the outer page priority");
          await page.mouse.wheel(0, wheelLifted.dockY - wheelLifted.outer + 200);
          await settle();
          const wheelExplored = await readPosition();
          assert.ok(Math.abs(wheelExplored.outer - wheelExplored.dockY) <= 3 && Math.abs(wheelExplored.inner - 200) <= 4, width + "px a single wheel event hands its remainder to categories: " + JSON.stringify(wheelExplored));
          await page.mouse.wheel(0, -120);
          await settle();
          const innerReturned = await readPosition();
          assert.ok(Math.abs(innerReturned.outer - wheelExplored.outer) <= 2 && Math.abs(innerReturned.inner - 80) <= 4, width + "px downward motion keeps the page docked while categories remain above");
          await page.mouse.wheel(0, -(innerReturned.inner + 100));
          await settle();
          const wheelReturned = await readPosition();
          assert.ok(wheelReturned.inner <= 1 && Math.abs(wheelReturned.outer - (wheelExplored.outer - 100)) <= 4, width + "px downward remainder returns to the page in the same wheel event: " + JSON.stringify(wheelReturned));
          geometry.push({ initial, lifted, explored, returned, wheelLifted, wheelExplored, innerReturned, wheelReturned });
          await page.screenshot({ path: path.join(output, `source-mobile-category-handoff-${width}.png`) });

          if (width === 390) {
            await page.waitForTimeout(450);
            await page.getByRole("button", { name: "Open event type search", exact: true }).click();
            await page.getByRole("searchbox", { name: "Search event types", exact: true }).fill("Wedding");
            await page.waitForFunction(() => document.querySelectorAll("[data-creation-event-type]").length === 1);
            await resetPosition();
            const filtered = await readPosition();
            assert.ok(filtered.innerMax <= 1, "one matching category needs no inner scrolling");
            await moveMouseIntoList();
            await page.mouse.wheel(0, filtered.dockY + 100);
            await settle();
            const filteredDocked = await readPosition();
            assert.ok(filteredDocked.outer >= filtered.dockY - 3 && filteredDocked.inner <= 1, "a short filtered list still lets the outer page reach navigation");
            await page.mouse.wheel(0, -100);
            await settle();
            assert.ok((await readPosition()).outer < filteredDocked.outer - 70, "a short list never traps downward movement");

            await page.evaluate(() => {
              const header = document.querySelector('[data-app-mobile-topbar="app"]');
              const replacement = header.cloneNode(true);
              replacement.style.paddingBottom = "28px";
              header.replaceWith(replacement);
            });
            await resetPosition();
            const replacedHeader = await readPosition();
            assert.ok(replacedHeader.dockTop >= filteredDocked.dockTop + 19, "the replacement navbar has a different docking height");
            await moveMouseIntoList();
            await page.mouse.wheel(0, replacedHeader.dockY + 100);
            await settle();
            const redocked = await readPosition();
            assert.ok(Math.abs(redocked.panelTop - redocked.dockTop) <= 3, "a replaced navbar continues to define the category docking position: " + JSON.stringify(redocked));
            geometry.push({ replacedHeader, redocked });
          }
        }
        await page.setViewportSize({ width: 390, height: 900 });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await openCreate("?chrome=1");
        await page.evaluate(() => document.fonts.ready);
        await page.keyboard.press("Escape");
        await resetPosition();
        const beforeFlick = await readPosition();
        await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), beforeFlick.dockY);
        await settle();
        // setFixedTime also replaces Event.timeStamp, so native CDP timestamps
        // alone cannot isolate this gesture from protocol/CI latency. Advance
        // the fixture clock explicitly while sending the same trusted touches.
        await page.clock.pauseAt(new Date(fixtureNow));
        touchClockPaused = true;
        await startTouch();
        await moveTouch(-120);
        const flickDragged = await readPosition();
        await endTouch();
        await page.clock.runFor(120);
        const flickCoasting = await readPosition();
        fs.writeFileSync(path.join(output, "category-touch-flick-geometry.json"), JSON.stringify({ flickDragged, flickCoasting }, null, 2));
        assert.ok(flickCoasting.inner > flickDragged.inner + 25, "a trusted flick retains momentum after the finger lifts: " + JSON.stringify({ flickDragged, flickCoasting }));
        assert.ok(Math.abs(flickCoasting.outer - flickCoasting.dockY) <= 3, "momentum keeps the category panel docked");
        await startTouch();
        await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
        touching = false;
        await settle();
        const flickStopped = await readPosition();
        await page.clock.runFor(200);
        assert.ok(Math.abs((await readPosition()).inner - flickStopped.inner) <= 1, "a new touch immediately stops momentum");
        await resetPosition();
        await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), beforeFlick.dockY);
        await settle();
        await startTouch();
        await moveTouch(-120);
        const heldDragged = await readPosition();
        await page.clock.runFor(100);
        await endTouch();
        await page.clock.runFor(120);
        const heldReleased = await readPosition();
        assert.ok(Math.abs(heldReleased.inner - heldDragged.inner) <= 1, "holding the finger for more than 80ms before release does not start momentum: " + JSON.stringify({ heldDragged, heldReleased }));
        assert.equal(await scroller.getAttribute("data-gesture-scroll"), null, "a held release finishes the gesture");
        assert.equal(await templates.count(), 0, "a trusted flick and stop over category buttons select no design");
        geometry.push({ flickDragged, flickCoasting, flickStopped, heldDragged, heldReleased });
        await page.clock.resume();
        touchClockPaused = false;
        await page.emulateMedia({ reducedMotion: "reduce" });
        for (const width of [768, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await openCreate("?chrome=1");
          await resetPosition();
          const nativeBefore = await readPosition();
          assert.equal(await scroller.getAttribute("data-page-handoff"), null, width + "px a roomy category layout retains native scrolling");
          await moveMouseIntoList();
          await page.mouse.wheel(0, 220);
          await page.waitForFunction(() => document.querySelector("[data-category-scroller]").scrollTop > 100);
          const nativeAfter = await readPosition();
          assert.ok(Math.abs(nativeAfter.outer - nativeBefore.outer) <= 2 && nativeAfter.inner > 100, width + "px retains native category scrolling without lifting the page");
        }
        assert.equal(extracts.length, readsBefore, "scrolling and filtering read no event source");
        assert.equal(forbidden.length, writesBefore, "scrolling and filtering generate or save nothing");
        assert.deepEqual(errors, [], "mobile handoffs produce no browser errors");
        fs.writeFileSync(path.join(output, "source-mobile-category-handoff-geometry.json"), JSON.stringify(geometry, null, 2));
      } finally {
        if (touching) await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }).catch(() => {});
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
        await cdp.detach();
        if (touchClockPaused) await page.clock.resume();
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
    });
    if (process.env.UNIFIED_CREATE_SCROLL_QA === "1") return;
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openCreate();
    assert.equal(await modes.getByRole("button").count(), 3);
    assert.deepEqual(await modes.getByRole("button").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label"))), ["Start from scratch", "Upload", "Paste URL"], "source methods follow the displayed starting order and keyboard order");
    assert.equal(await mode("Start from scratch").getAttribute("aria-pressed"), "true", "a new visit shows categories immediately");
    const manualTypes = page.getByRole("region", { name: "Choose an event type", exact: true });
    const manualCards = manualTypes.locator('[data-creation-event-type]');
    const categoryPicker = manualTypes.locator("[data-category-scroll-picker]");
    const categoryScroller = categoryPicker.locator("[data-category-scroller]");
    await manualCards.first().waitFor();
    await page.waitForFunction(() => document.querySelector("[data-creation-event-type]")?.getAttribute("data-holiday-occasion") === "halloween");
    assert.equal(await manualCards.first().getAttribute("aria-label"), "Halloween", "the default All list starts with the nearest holiday on the visitor's October 22 local day");
    assert.ok(await manualCards.count() > 4, "the first visit lists permitted event categories");
    const holidayCollections = await page.evaluate(() => window.__creationBrowser.holidayCollections.map(({ id, name }) => ({ id, name })));
    const holidayNames = holidayCollections.map(collection => collection.name);
    assert.equal(holidayCollections.length, 44, "the existing catalog supplies every supported holiday and seasonal occasion");
    const allHolidayRows = manualTypes.locator("[data-creation-event-type][data-holiday-occasion]");
    assert.deepEqual((await allHolidayRows.evaluateAll(buttons => buttons.map(button => button.getAttribute("data-holiday-occasion")))).sort(), holidayCollections.map(collection => collection.id).sort(), "All includes each supported holiday once with its own occasion identity");
    assert.equal(await manualTypes.locator('[data-creation-event-type][aria-label="Holidays & seasonal"]').count(), 0, "the main list has holiday names instead of a generic holiday row");
    assert.equal(await categoryPicker.locator("[data-category-list]").count(), 1);
    assert.equal(await manualTypes.locator('[data-category-toolbar] [aria-controls="creation-type-filters"]').count(), 1, "category filtering lives inside the category toolbar");
    assert.equal(await page.locator("[data-unified-create]").getByRole("switch", { name: "Dark mode", exact: true }).count(), 0, "Create has no page-specific appearance switch");
    assert.equal(await page.getByRole("button", { name: /^Config$/ }).count(), 0, "the visual example's configuration menu is absent");
    assert.ok(await page.locator("[data-unified-create]").evaluate(element => getComputedStyle(element).getPropertyValue("--creation-ink").trim()), "fixture renders the complete creation CSS module");
    const initialPosition = await categoryScroller.evaluate(scroller => {
      const item = scroller.querySelector("[data-creation-event-type]").getBoundingClientRect();
      const bounds = scroller.getBoundingClientRect();
      return { top: scroller.scrollTop, center: item.y + item.height / 2, viewportCenter: bounds.y + bounds.height / 2 };
    });
    assert.equal(initialPosition.top, 0, "All starts at the top of the seasonally ordered list");
    assert.ok(Math.abs(initialPosition.center - initialPosition.viewportCenter) <= 4, "the first category starts centered: " + JSON.stringify(initialPosition));
    assert.equal(await manualCards.first().getAttribute("data-active"), "true", "the initial Halloween choice is centered and accented without opening its designs");
    await capture("source-initial-categories-desktop.png");

    await t.test("broad category filters expand in flow without individual event choices or saves", async () => {
      const toolbar = manualTypes.locator("[data-category-toolbar]");
      const filter = toolbar.locator('[aria-controls="creation-type-filters"]');
      const panel = manualTypes.getByRole("region", { name: "Event type filters", exact: true, includeHidden: true });
      const total = await manualCards.count(), readsBefore = extracts.length;
      const savedBefore = await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length);
      assert.equal(await filter.getAttribute("aria-label"), "Filter event types: All");
      assert.deepEqual(await panel.getByRole("button", { includeHidden: true }).evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label") || button.textContent.trim())), ["Celebrations", "Holidays & seasonal", "Home & property", "Religious & cultural", "Gatherings & more", "Sports & teams"], "the dropdown contains only the six available broad groups with concise accessible names");
      assert.equal(await filter.getAttribute("aria-expanded"), "false");
      assert.equal(await panel.getAttribute("aria-hidden"), "true");
      assert.equal(await panel.evaluate(element => !!element.closest("[inert]")), true, "closed choices cannot receive focus");
      assert.equal(await panel.getByRole("button", { name: "All event types", exact: true, includeHidden: true }).count(), 0, "the panel omits the redundant All event types chip");
      const assertArtworkMenu = async context => {
        await panel.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
        const layout = await panel.evaluate(element => {
          const surface = element.querySelector("[data-event-type-filter-panel]");
          const grid = element.querySelector("[data-event-type-filter-groups]");
          const page = element.closest("[data-unified-create]");
          const pageStyle = getComputedStyle(page);
          const workspaceWidth = page.clientWidth - parseFloat(pageStyle.paddingLeft) - parseFloat(pageStyle.paddingRight);
          return { workspaceWidth, exampleLineLimit: innerWidth <= 639 ? 3 : 2, columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length, radius: parseFloat(getComputedStyle(surface).borderTopLeftRadius) };
        });
        assert.equal(layout.columns, layout.workspaceWidth > 760 ? 2 : 1, context + " uses the available workspace for thumbnail columns: " + JSON.stringify(layout));
        assert.ok(layout.radius >= 20, context + " retains the rounded menu panel");
        const entries = await panel.locator("[data-event-type-group]").evaluateAll(buttons => buttons.map(button => {
          const bounds = button.getBoundingClientRect();
          const artwork = button.querySelector("[data-event-type-group-artwork]");
          const imageBounds = artwork.getBoundingClientRect();
          const label = button.getAttribute("aria-label");
          const examples = button.querySelector("[data-event-type-group-examples]");
          const exampleBounds = examples.getBoundingClientRect(), exampleStyle = getComputedStyle(examples);
          const title = button.querySelector("[data-event-type-group-title]");
          const range = document.createRange(); range.selectNodeContents(title);
          const visibleTextBounds = [title.parentElement.getBoundingClientRect(), exampleBounds];
          return { label, text: button.textContent.trim(), examples: examples.textContent.trim(), describedByExamples: button.getAttribute("aria-describedby") === examples.id, width: bounds.width, height: bounds.height,
            exampleHeight: exampleBounds.height, exampleLineHeight: parseFloat(exampleStyle.lineHeight), exampleClamp: exampleStyle.getPropertyValue("-webkit-line-clamp"), exampleOverflow: exampleStyle.overflow, exampleScrollHeight: examples.scrollHeight, exampleClientHeight: examples.clientHeight,
            imageWidth: imageBounds.width, imageHeight: imageBounds.height, imageAlt: artwork.getAttribute("alt"),
            loaded: artwork.complete && artwork.naturalWidth > 0, source: artwork.currentSrc,
            fits: button.scrollWidth <= button.clientWidth + 1 && imageBounds.left >= bounds.left && imageBounds.right <= bounds.right + 1 && imageBounds.top >= bounds.top && imageBounds.bottom <= bounds.bottom + 1,
            textFits: [...range.getClientRects(), ...visibleTextBounds].every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1) };
        }));
        assert.equal(entries.length, 6, context + " offers every approved broad group");
        const expectedExamples = {
          "Celebrations": "Birthday · Wedding · Baby shower · Graduation · Anniversary · Bridal shower · Gender reveal",
          "Holidays & seasonal": "Christmas · Halloween · Thanksgiving · Easter · New Year’s Eve · Valentine’s Day · July Fourth · Mother’s Day",
          "Home & property": "Housewarming · Open house",
          "Religious & cultural": "Baptism · First Communion · Bar/Bat Mitzvah · Iftar · Confirmation · Aqiqah · Puja · Langar",
          "Gatherings & more": "Meetup · Picnic · Potluck · Game night · Book club · Networking · Garden party · Community gathering",
          "Sports & teams": "Football · Basketball · Baseball · Gymnastics · Volleyball · Softball · Tennis · Swimming",
        };
        assert.ok(entries.every(entry => {
          const expected = expectedExamples[entry.label].split(" · ");
          const shown = entry.examples.split(" · ");
          return entry.examples.length > 0 && !/\.{3}|…/.test(entry.examples) && shown.length <= expected.length && entry.examples === expected.slice(0, shown.length).join(" · ");
        }), context + " shows only complete permitted event names in their familiar order: " + JSON.stringify(entries.map(entry => ({ label: entry.label, examples: entry.examples }))));
        assert.ok(entries.every(entry => entry.exampleClamp === "none" && entry.exampleOverflow === "hidden" && entry.exampleScrollHeight <= entry.exampleClientHeight + 1 && entry.exampleLineHeight > 0 && entry.exampleHeight <= entry.exampleLineHeight * layout.exampleLineLimit + 1), context + " fits complete names within " + layout.exampleLineLimit + " lines without clipped text or ellipses: " + JSON.stringify(entries.map(entry => ({ label: entry.label, height: entry.exampleHeight, lineHeight: entry.exampleLineHeight, clamp: entry.exampleClamp, scrollHeight: entry.exampleScrollHeight, clientHeight: entry.exampleClientHeight }))));
        assert.ok(entries.every(entry => entry.describedByExamples), context + " makes the event type examples available as each group's accessible description");
        assert.ok(entries.every(entry => entry.width >= 44 && entry.height >= 44 && entry.fits && entry.textFits), context + " thumbnails and copy fit their usable targets: " + JSON.stringify(entries));
        assert.ok(entries.every(entry => entry.imageAlt === "" && entry.loaded && entry.text.length > entry.label.length), context + " shows original decorative artwork and event type examples without changing the accessible name: " + JSON.stringify(entries));
        assert.ok(entries.every(entry => {
          const requestUrl = new URL(entry.source);
          const sourceUrl = requestUrl.pathname === "/_next/image" ? new URL(requestUrl.searchParams.get("url"), base) : requestUrl;
          return sourceUrl.origin === base && renderedPublicAssets.has(sourceUrl.pathname);
        }), context + " renders checked-in artwork rather than the offline image fallback: " + JSON.stringify(entries.map(entry => ({ label: entry.label, source: entry.source }))));
        const expectedArtwork = layout.workspaceWidth <= 380 ? [72, 84] : layout.workspaceWidth <= 760 ? [88, 88] : layout.workspaceWidth <= 1000 ? [104, 96] : [132, 112];
        assert.ok(entries.every(entry => Math.abs(entry.imageWidth - expectedArtwork[0]) <= 1 && Math.abs(entry.imageHeight - expectedArtwork[1]) <= 1), context + " sizes thumbnails to the workspace: " + JSON.stringify(entries));
      };
      for (const width of [320, 390, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const collapsedPicker = await categoryPicker.boundingBox();
        const toolbarBounds = await toolbar.boundingBox(), modeBounds = await modes.boundingBox();
        const searchBounds = await toolbar.locator("[data-event-type-search]").boundingBox();
        const filterBounds = await filter.boundingBox();
        assert.ok(toolbarBounds && modeBounds && toolbarBounds.y >= modeBounds.y + modeBounds.height - 1, width + "px category controls sit below the source method strip");
        assert.ok(filterBounds && searchBounds && filterBounds.x < searchBounds.x && Math.abs(filterBounds.y + filterBounds.height / 2 - searchBounds.y - searchBounds.height / 2) <= 2, width + "px filter and search share the toolbar row");
        assert.ok(filterBounds.x <= toolbarBounds.x + 16 && searchBounds.x + searchBounds.width >= toolbarBounds.x + toolbarBounds.width - 16, width + "px filter aligns left and search aligns right");
        await filter.focus(); await page.keyboard.press("Enter");
        assert.equal(await filter.getAttribute("aria-expanded"), "true");
        assert.equal(await panel.getAttribute("aria-hidden"), "false");
        assert.equal(await panel.evaluate(element => !!element.closest("[inert]")), false);
        const panelBounds = await panel.boundingBox(), expandedPicker = await categoryPicker.boundingBox();
        assert.ok(panelBounds && expandedPicker && collapsedPicker && expandedPicker.y > collapsedPicker.y + 60, width + "px filter expansion pushes categories down");
        assert.ok(panelBounds.y + panelBounds.height <= expandedPicker.y + 1, width + "px grouped filters do not cover categories");
        await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-event-type-group-artwork]")).every(image => image.complete && image.naturalWidth > 0));
        await assertArtworkMenu(width + "px category menu");
        assert.equal(await panel.locator('[data-event-type-group][aria-pressed="true"]').count(), 0, "All leaves every broad group unselected");
        await capture("category-filters-open-" + width + ".png");
        await panel.getByRole("button", { name: "Celebrations", exact: true }).focus();
        await page.keyboard.press("Escape");
        assert.equal(await filter.getAttribute("aria-expanded"), "false");
        assert.equal(await filter.evaluate(element => element === document.activeElement), true, "Escape restores the filter trigger");
        await page.keyboard.press("Space");
        await panel.getByRole("button", { name: "Celebrations", exact: true }).click();
        assert.equal(await filter.getAttribute("aria-label"), "Filter event types: Celebrations");
        assert.equal(await filter.getAttribute("aria-expanded"), "false");
        assert.equal(await filter.evaluate(element => element === document.activeElement), true, "selecting a filter restores the trigger");
        assert.deepEqual((await manualCards.evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label")))).sort(), ["Birthday", "Wedding", "Anniversary", "Baby shower", "Bridal shower", "Gender reveal", "Graduation"].sort(), "Celebrations keeps all allowed celebration types in the scrolling list");
        await filter.click();
        assert.equal(await panel.getByRole("button", { name: "Celebrations", exact: true }).getAttribute("aria-pressed"), "true", "reopening the menu identifies the selected thumbnail entry");
        await panel.getByRole("button", { name: "Celebrations", exact: true }).click();
        assert.equal(await filter.getAttribute("aria-label"), "Filter event types: All", "choosing the selected group restores All");
        assert.equal(await filter.getAttribute("aria-expanded"), "false", "clearing a group closes the menu");
        assert.equal(await filter.evaluate(element => element === document.activeElement), true, "clearing a group restores trigger focus");
        assert.equal(await manualCards.count(), total, "clearing the selected group restores the full available list");
        await assertNoOverflow("Category toolbar and filters at " + width + "px");
      }
      const setMenuAppearance = preference => page.evaluate(preference => { const key = "envitefy:appearance:v1"; localStorage.setItem(key, preference); window.dispatchEvent(new StorageEvent("storage", { key, newValue: preference })); }, preference);
      const menuColors = [];
      for (const appearance of ["light", "dark"]) {
        await setMenuAppearance(appearance);
        await page.waitForFunction(appearance => document.documentElement.dataset.theme === "general-" + appearance, appearance);
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await filter.click();
          await assertArtworkMenu(appearance + " menu at " + width + "px");
          await assertNoOverflow(appearance + " thumbnail category menu at " + width + "px");
          const colors = await panel.locator("[data-event-type-filter-panel]").evaluate(element => {
            const background = getComputedStyle(element).backgroundColor;
            const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d"); context.fillStyle = background; context.fillRect(0, 0, 1, 1);
            return { background, alpha: context.getImageData(0, 0, 1, 1).data[3] / 255, ink: getComputedStyle(element.querySelector("[data-event-type-group]")).color };
          });
          assert.ok(colors.alpha > 0.5 && colors.alpha < 1, appearance + " menu at " + width + "px uses a slightly transparent panel surface: " + JSON.stringify(colors));
          if (width === 1440) menuColors.push(colors);
          await capture("category-filters-" + appearance + "-" + width + ".png");
          await page.keyboard.press("Escape");
        }
      }
      assert.notDeepEqual(menuColors[0], menuColors[1], "the thumbnail menu follows the shared light/dark appearance");
      await setMenuAppearance("light");
      await page.waitForFunction(() => document.documentElement.dataset.theme === "general-light");
      const parentStyle = await page.locator("#root").evaluate(parent => { const previous = parent.getAttribute("style"); parent.style.paddingLeft = "320px"; parent.style.boxSizing = "border-box"; return previous; });
      try {
        for (const width of [1024, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await filter.click();
          await assertArtworkMenu(width + "px category menu beside a 320px sidebar");
          await assertNoOverflow(width + "px thumbnail category menu beside a sidebar");
          await page.keyboard.press("Escape");
        }
      } finally {
        await page.locator("#root").evaluate((parent, previous) => { if (previous === null) parent.removeAttribute("style"); else parent.setAttribute("style", previous); }, parentStyle);
      }
      assert.equal(extracts.length, readsBefore);
      assert.equal(await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length), savedBefore, "filtering creates no browser intake");
      assert.equal(forbidden.length, 0, "filtering starts no generation or save request");
    });

    await t.test("all six broad groups retain their own event types and clear searches without creating an intake", async () => {
      const toolbar = manualTypes.locator("[data-category-toolbar]");
      const filter = toolbar.locator('[aria-controls="creation-type-filters"]');
      const panel = manualTypes.getByRole("region", { name: "Event type filters", exact: true, includeHidden: true });
      const searchToggle = toolbar.locator('[aria-controls="creation-type-search-panel"]');
      const search = toolbar.getByRole("searchbox", { name: "Search event types", exact: true, includeHidden: true });
      const labels = () => manualCards.evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label")).sort());
      const total = await manualCards.count(), readsBefore = extracts.length;
      const savedBefore = await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length);
      const groups = [
        { name: "Celebrations", labels: ["Birthday", "Wedding", "Anniversary", "Baby shower", "Bridal shower", "Gender reveal", "Graduation"], query: "shower", matches: ["Baby shower", "Bridal shower"] },
        { name: "Holidays & seasonal", labels: holidayNames, query: "Christmas", matches: ["Christmas"] },
        { name: "Home & property", labels: ["Housewarming", "Open house"], query: "open", matches: ["Open house"] },
        { name: "Religious & cultural", labels: ["Religious celebration"], query: "religious", matches: ["Religious celebration"] },
        { name: "Gatherings & more", labels: ["General event"], query: "general", matches: ["General event"] },
        { name: "Sports & teams", labels: ["Gymnastics", "Football", "Basketball", "Baseball", "Softball", "Volleyball", "Hockey", "Lacrosse", "Tennis", "Track & Field", "Swimming", "Wrestling"], query: "ball", matches: ["Football", "Basketball", "Baseball", "Softball", "Volleyball"] },
      ];
      for (const group of groups) {
        await searchToggle.click(); await search.fill("no matching occasion");
        assert.equal(await manualCards.count(), 0);
        await filter.click(); await panel.getByRole("button", { name: group.name, exact: true }).click();
        assert.equal(await search.inputValue(), "", group.name + " clears the previous search when selected");
        assert.equal(await filter.getAttribute("aria-label"), "Filter event types: " + group.name);
        assert.deepEqual(await labels(), group.labels.sort(), group.name + " displays every allowed member in the main list");
        if (group.name === "Holidays & seasonal") {
          for (const width of [320, 390, 480, 640, 768, 1024, 1440, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const rowFit = await manualTypes.locator("[data-holiday-occasion]").evaluateAll(buttons => buttons.map(button => {
              const row = button.parentElement.getBoundingClientRect();
              const control = button.getBoundingClientRect();
              const label = button.querySelector(":scope > span");
              const text = label.getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(label);
              const ink = range.getBoundingClientRect();
              const style = getComputedStyle(button);
              const arrow = button.querySelector("svg").getBoundingClientRect();
              const mobile = getComputedStyle(label).whiteSpace === "nowrap";
              const fitted = !!button.style.getPropertyValue("--category-fit-size");
              const rightGap = arrow.left - parseFloat(style.columnGap) - ink.right;
              return { name: button.getAttribute("aria-label"), rowHeight: row.height, controlHeight: control.height, labelHeight: text.height, mobile, fitted, rightGap,
                singleLine: Array.from(range.getClientRects()).every(rect => Math.abs(rect.top - ink.top) <= 1),
                fits: control.height <= row.height + 1 && text.top >= row.top - 1 && text.bottom <= row.bottom + 1 && label.scrollWidth <= label.clientWidth + 1 && button.scrollWidth <= button.clientWidth + 1 };
            }));
            assert.equal(rowFit.length, 44);
            assert.ok(rowFit.every(row => row.fits), width + "px all holiday labels fit their rows: " + JSON.stringify(rowFit.filter(row => !row.fits)));
            assert.ok(rowFit.filter(row => row.mobile).every(row => row.singleLine), `${width}px mobile holiday names stay on one line: ${JSON.stringify(rowFit.filter(row => row.mobile && !row.singleLine))}`);
            assert.ok(rowFit.filter(row => row.mobile && row.fitted).every(row => row.rightGap >= -1 && row.rightGap <= 2), `${width}px fitted names use the available width: ${JSON.stringify(rowFit.filter(row => row.mobile && row.fitted && (row.rightGap < -1 || row.rightGap > 2)))}`);
            if (width <= 390) assert.ok(rowFit.some(row => row.name === "Martin Luther King Jr. Day" && row.fitted), `${width}px fits the long name using its measured width`);
            await assertNoOverflow("Holiday group at " + width + "px");
            if (width === 1440 || width === 390) {
              await manualTypes.locator('[data-holiday-occasion="christmas"]').scrollIntoViewIfNeeded();
              await capture("holiday-group-list-" + (width === 1440 ? "desktop" : "mobile") + ".png");
            }
          }
        }
        if (await searchToggle.getAttribute("aria-expanded") !== "true") await searchToggle.click();
        await search.fill(group.query);
        assert.deepEqual(await labels(), group.matches.sort(), group.name + " search stays within the selected group");
        if (group.name === "Holidays & seasonal") {
          for (const [query, matches] of [["Halloween", ["Halloween", "Trunk-or-Treat"]], ["Xmas", ["Christmas"]], ["trick or treat", ["Halloween"]]]) {
            await search.fill(query);
            assert.deepEqual(await labels(), matches.sort(), "holiday search matches names and supported aliases: " + query);
          }
        }
        await search.press("Escape");
        assert.deepEqual(await labels(), group.labels.sort(), "clearing search restores the selected broad group");
      }
      await filter.click(); await panel.getByRole("button", { name: "Sports & teams", exact: true }).click();
      assert.equal(await manualCards.count(), total);
      assert.equal(extracts.length, readsBefore);
      assert.equal(await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length), savedBefore, "group selection and search create no browser intake");
      assert.equal(forbidden.length, 0, "group selection and search request no provider or event save");
      assert.deepEqual(errors, [], "expanded holiday names retain unique React keys across All and group searches");
    });
    if (process.env.UNIFIED_CREATE_MENU_QA === "1") return;

    await t.test("All and Holidays start at the nearest named occasion for the visitor's local day without selecting or saving an event", async () => {
      const filter = manualTypes.locator('[data-category-toolbar] [aria-controls="creation-type-filters"]');
      const panel = manualTypes.getByRole("region", { name: "Event type filters", exact: true, includeHidden: true });
      const nonHolidayLabels = () => manualCards.evaluateAll(buttons => buttons.filter(button => !button.hasAttribute("data-holiday-occasion")).map(button => button.getAttribute("aria-label")));
      const baseline = await nonHolidayLabels(), readsBefore = extracts.length;
      const savedBefore = await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length);
      const cases = [
        { time: "2026-10-22T17:00:00.000Z", day: "2026-10-22", first: "halloween" },
        { time: "2026-11-20T18:00:00.000Z", day: "2026-11-20", first: "thanksgiving" },
        { time: "2026-12-20T18:00:00.000Z", day: "2026-12-20", first: "christmas" },
        { time: "2026-12-31T18:00:00.000Z", day: "2026-12-31", first: "new-years-eve" },
        { time: "2027-01-01T18:00:00.000Z", day: "2027-01-01", first: "new-years-day" },
      ];
      try {
        for (const item of cases) {
          await page.clock.setFixedTime(new Date(item.time));
          await openCreate();
          await page.waitForFunction(first => document.querySelector("[data-creation-event-type]")?.getAttribute("data-holiday-occasion") === first, item.first);
          const browserDay = await page.evaluate(() => { const date = new Date(); return { day: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }; });
          assert.equal(browserDay.day, item.day);
          assert.equal(browserDay.timezone, "America/Chicago");
          assert.equal(await filter.getAttribute("aria-label"), "Filter event types: All", "the date never auto-selects the Holidays group");
          const allOrder = await manualCards.evaluateAll(buttons => buttons.map(button => ({ occasion: button.getAttribute("data-holiday-occasion"), label: button.getAttribute("aria-label") })));
          const allHolidayOrder = allOrder.filter(choice => choice.occasion).map(choice => choice.occasion);
          const firstOrdinary = allOrder.findIndex(choice => !choice.occasion);
          assert.equal(allOrder[0].occasion, item.first, item.day + " default All begins with its nearest named holiday before ordinary categories");
          assert.ok(firstOrdinary > 0, "timely holidays appear before the first ordinary event type");
          assert.equal(allOrder[firstOrdinary].label, baseline[0], "the original first ordinary category follows the timely holiday choices");
          assert.ok(allOrder.slice(firstOrdinary + 1).some(choice => choice.occasion), "later holiday choices retain their expanded position among the ordinary categories");
          assert.deepEqual([...allHolidayOrder].sort(), holidayCollections.map(collection => collection.id).sort(), "default All retains all 44 distinct holiday and seasonal occasions");
          assert.deepEqual(await nonHolidayLabels(), baseline, "seasonal order preserves the other event types");
          assert.equal(await manualCards.first().getAttribute("data-active"), "true", item.day + " All centers and accents its first holiday choice");
          assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "default All starts at the nearest holiday without scrolling automatically");
          assert.equal(await templates.count(), 0, "default All keeps the nearest holiday as a choice until clicked");
          assert.equal(new URL(page.url()).searchParams.has("intake"), false, "default All ordering does not create an intake URL");
          if (item.day === "2026-10-22") {
            for (const width of [1440, 390]) {
              await page.setViewportSize({ width, height: 1000 });
              await capture("seasonal-all-default-" + (width === 1440 ? "desktop" : "mobile") + ".png");
            }
          }
          await filter.click(); await panel.getByRole("button", { name: "Holidays & seasonal", exact: true }).click();
          assert.equal(await manualCards.first().getAttribute("data-holiday-occasion"), item.first, item.day + " starts with its nearest named holiday");
          assert.equal(await manualCards.first().getAttribute("data-active"), "true");
          assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0);
          const filteredHolidayOrder = await manualCards.evaluateAll(buttons => buttons.map(button => button.getAttribute("data-holiday-occasion")));
          assert.deepEqual(filteredHolidayOrder, allHolidayOrder, "the Holidays filter retains the same seasonal occasion order as All");
          assert.deepEqual([...filteredHolidayOrder].sort(), holidayCollections.map(collection => collection.id).sort(), "seasonal ordering keeps all 44 choices");
          assert.equal(await templates.count(), 0, "a nearest holiday remains a choice until clicked");
          assert.equal(new URL(page.url()).searchParams.has("intake"), false, "ordering does not create an intake URL");
          if (item.day === "2026-10-22") {
            for (const width of [1440, 390]) {
              await page.setViewportSize({ width, height: 1000 });
              await capture("seasonal-holiday-default-" + (width === 1440 ? "desktop" : "mobile") + ".png");
            }
          }
        }
        assert.equal(extracts.length, readsBefore);
        assert.equal(await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length), savedBefore, "calendar-aware ordering writes no browser intake or event date");
        assert.equal(forbidden.length, 0, "ordering invokes no provider or server event save");
      } finally {
        await page.clock.setFixedTime(new Date(fixtureNow));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await openCreate();
      }
    });

    await t.test("category search expands from the toolbar right without overlapping its filter or saving", async () => {
      const toolbar = manualTypes.locator("[data-category-toolbar]");
      const filter = toolbar.locator('[aria-controls="creation-type-filters"]');
      const filterPanel = manualTypes.getByRole("region", { name: "Event type filters", exact: true, includeHidden: true });
      const searchControl = toolbar.locator("[data-event-type-search]");
      const searchToggle = searchControl.locator('[aria-controls="creation-type-search-panel"]');
      const searchPanel = searchControl.locator("#creation-type-search-panel");
      const search = searchControl.getByRole("searchbox", { name: "Search event types", exact: true, includeHidden: true });
      const heading = page.getByRole("heading", { level: 1, name: "Create an event page", exact: true });
      const total = await manualCards.count(), readsBefore = extracts.length;
      const savedBefore = await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length);
      assert.equal(await page.locator("[data-unified-create] header [data-event-type-search]").count(), 0, "search has moved out of the page header");
      assert.equal(await searchToggle.getAttribute("aria-label"), "Open event type search");
      assert.equal(await searchPanel.getAttribute("aria-hidden"), "true");
      assert.equal(await searchPanel.evaluate(element => !!element.closest("[inert]")), true, "closed search cannot receive focus");
      assert.equal(await searchControl.getByRole("searchbox", { name: "Search event types", exact: true }).count(), 0);
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const toolbarBefore = await toolbar.boundingBox();
        const collapsed = await searchControl.boundingBox();
        assert.ok(collapsed && collapsed.width >= 44 && collapsed.height >= 44 && collapsed.width <= 48, width + "px search has a compact usable target: " + JSON.stringify(collapsed));
        await searchToggle.focus(); await page.keyboard.press("Enter");
        await search.waitFor({ state: "visible" });
        await page.waitForFunction(() => document.activeElement?.id === "creation-type-search");
        assert.equal(await searchToggle.getAttribute("aria-expanded"), "true");
        assert.equal(await searchPanel.getAttribute("aria-hidden"), "false");
        assert.equal(await searchPanel.evaluate(element => !!element.closest("[inert]")), false);
        const expanded = await searchControl.boundingBox(), filterBounds = await filter.boundingBox();
        assert.ok(expanded && expanded.width > collapsed.width + 70 && expanded.x < collapsed.x - 70, width + "px search expands left");
        fs.writeFileSync(path.join(output, "category-search-edge-" + width + ".json"), JSON.stringify({ collapsed, expanded, filterBounds }, null, 2));
        assert.ok(Math.abs(expanded.x + expanded.width - collapsed.x - collapsed.width) <= 1, width + "px search keeps its right edge: " + JSON.stringify({ collapsed, expanded, filterBounds }));
        assert.ok(filterBounds && filterBounds.x + filterBounds.width + 8 <= expanded.x, width + "px expanded search stops beside the left filter: " + JSON.stringify({ filterBounds, expanded }));
        assert.ok(Math.abs(filterBounds.y + filterBounds.height / 2 - expanded.y - expanded.height / 2) <= 1, width + "px expanded search stays on the filter row");
        assert.equal((await toolbar.boundingBox()).height, toolbarBefore.height, width + "px opening search does not add a toolbar row");
        assert.ok(expanded.x >= 0 && expanded.x + expanded.width <= width + 1, width + "px search fits the viewport");
        await capture("category-search-open-" + width + ".png");
        await search.fill("wedding");
        assert.equal(await manualCards.count(), 1);
        assert.equal(await manualCards.first().getAttribute("aria-label"), "Wedding");
        await heading.click();
        assert.equal(await searchToggle.getAttribute("aria-expanded"), "true", "outside clicks preserve an active query");
        await search.focus(); await page.keyboard.press("Enter");
        assert.equal(await templates.count(), 0, "Enter in search does not choose a category");
        await page.keyboard.press("Escape");
        assert.equal(await searchToggle.getAttribute("aria-expanded"), "false");
        assert.equal(await search.inputValue(), "");
        assert.equal(await searchToggle.evaluate(element => element === document.activeElement), true, "Escape restores the trigger focus");
        assert.equal(await manualCards.count(), total);
        await searchToggle.click(); await search.fill("no matching occasion");
        assert.equal(await manualCards.count(), 0);
        await filter.click(); await filterPanel.getByRole("button", { name: "Celebrations", exact: true }).click();
        assert.equal(await search.inputValue(), "", "selecting a broad category clears an earlier query");
        assert.equal(await manualCards.count(), 7);
        assert.ok((await manualCards.evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label")))).includes("Wedding"), "the selected group includes Wedding and its other event types");
        await filter.click(); await filterPanel.getByRole("button", { name: "Holidays & seasonal", exact: true }).click();
        if (await searchToggle.getAttribute("aria-expanded") !== "true") await searchToggle.click();
        const longFilter = await filter.boundingBox(), longSearch = await searchControl.boundingBox();
        const longInput = await search.boundingBox(), longToggle = await searchToggle.boundingBox();
        const longIcon = await searchPanel.locator("svg").boundingBox();
        assert.ok(longSearch.width >= 112 && longFilter.x + longFilter.width + 8 <= longSearch.x, width + "px long filter leaves usable search space");
        assert.ok(Math.abs(longFilter.y + longFilter.height / 2 - longSearch.y - longSearch.height / 2) <= 1, width + "px search stays beside the selected group");
        assert.ok(longInput.x + longInput.width <= longSearch.x + longSearch.width + 1 && longIcon.x + longIcon.width <= longToggle.x, width + "px long filter keeps the search field and icons inside the control");
        await capture("category-search-open-group-" + width + ".png");
        if (await searchToggle.getAttribute("aria-expanded") === "true") await searchToggle.click();
        await filter.click(); await filterPanel.getByRole("button", { name: "Holidays & seasonal", exact: true }).click();
        await searchToggle.click(); await search.fill("birthday"); await searchToggle.click();
        assert.equal(await search.inputValue(), "", "Close clears the query");
        assert.equal(await searchToggle.evaluate(element => element === document.activeElement), true);
        await searchToggle.click(); await heading.click();
        assert.equal(await searchToggle.getAttribute("aria-expanded"), "false", "outside clicks close an empty search");
        await assertNoOverflow("Category search at " + width + "px");
        await capture("category-search-" + width + ".png");
      }
      await page.emulateMedia({ reducedMotion: "no-preference" });
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (let round = 1; round <= 3; round++) {
          await searchToggle.click();
          try {
            await page.waitForFunction(() => document.activeElement?.id === "creation-type-search");
          } catch (error) {
            console.error("Normal-motion search focus:", { width, round }, await search.evaluate(element => {
              const style = getComputedStyle(element);
              return { active: document.activeElement?.outerHTML.slice(0, 500), expanded: element.closest("[data-event-type-search]")?.getAttribute("data-expanded"), visibility: style.visibility, display: style.display, opacity: style.opacity, inert: !!element.closest("[inert]"), bounds: element.getBoundingClientRect().toJSON() };
            }));
            await capture("category-search-focus-failure-" + width + "-round-" + round + ".png");
            throw error;
          }
          await page.waitForTimeout(250);
          assert.equal(await search.evaluate(element => element === document.activeElement), true, width + "px normal-motion pointer activation round " + round + " keeps focus in the opened search field");
          await search.fill("wedding");
          assert.equal(await manualCards.count(), 1);
          await page.keyboard.press("Escape");
          assert.equal(await searchToggle.evaluate(element => element === document.activeElement), true, "normal-motion closing restores the trigger focus");
          assert.equal(await manualCards.count(), total);
        }
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(extracts.length, readsBefore);
      assert.equal(await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length), savedBefore, "search creates no browser intake");
      assert.equal(forbidden.length, 0, "search starts no generation or save request");
    });

    await t.test("source panels slide in while the top method menu stays mounted and stationary", async () => {
      const assertPanelEntry = async (id, reducedMotion, context) => {
        const entry = await page.locator(`[data-source-panel="${id}"]`).evaluate(element => {
          const style = getComputedStyle(element);
          const animation = element.getAnimations().find(item => item.animationName?.includes("creation-source-enter"));
          const frames = animation?.effect.getKeyframes() || [];
          const offset = frame => !frame?.transform || frame.transform === "none" ? 0 : new DOMMatrix(frame.transform).m41;
          return { name: style.animationName, state: animation?.playState, duration: animation?.effect.getTiming().duration,
            fromX: offset(frames[0]), toX: offset(frames.at(-1)), fromOpacity: frames[0]?.opacity, toOpacity: frames.at(-1)?.opacity };
        });
        if (reducedMotion === "reduce") {
          assert.equal(entry.name, "none", `${context}: reduced motion disables panel animation`);
        } else {
          assert.match(entry.name, /creation-source-enter/, `${context}: the source panel has its entry animation`);
          assert.equal(entry.state, "running", `${context}: entry runs when the panel appears`);
          assert.equal(entry.duration, 420, `${context}: entry remains brief`);
          assert.ok(entry.fromX > 0 && entry.toX === 0, `${context}: the panel enters from the right: ${JSON.stringify(entry)}`);
          assert.equal(Number(entry.fromOpacity), 0); assert.equal(Number(entry.toOpacity), 1);
        }
      };
      const readsBefore = extracts.length;
      for (const reducedMotion of ["no-preference", "reduce"]) {
        await page.emulateMedia({ reducedMotion });
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await openCreate();
          const originalMenu = await modes.elementHandle(), menuBounds = await modes.boundingBox();
          for (const [label, id] of [["Upload", "files"], ["Paste URL", "url"], ["Start from scratch", "scratch"]]) {
            await mode(label).click();
            await assertPanelEntry(id, reducedMotion, `${width}px ${label}`);
            assert.equal(await modes.evaluate((element, original) => element === original, originalMenu), true, "switching methods keeps the same top menu mounted");
            const bounds = await modes.boundingBox();
            for (const dimension of ["x", "y", "width", "height"])
              assert.ok(Math.abs(bounds[dimension] - menuBounds[dimension]) <= 1, `${width}px ${label} keeps the top menu ${dimension} unchanged`);
            assert.equal(await inspiration.count(), 0, "method changes do not mount the inspiration panel");
          }
          await originalMenu.dispose();
          await page.reload();
          await assertPanelEntry("scratch", reducedMotion, `${width}px refreshed source`);
        }
      }
      assert.equal(extracts.length, readsBefore, "method changes and refresh start no source parsing");
      assert.equal(forbidden.length, 0);
    });

    await t.test("Upload and Paste URL omit category shortcuts while the URL form stays compact and centered", async () => {
      const readsBefore = extracts.length;
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await openCreate();
        const originalMenu = await modes.elementHandle(), menuBounds = await modes.boundingBox();
        for (const [label, id] of [["Upload", "files"], ["Paste URL", "url"]]) {
          await mode(label).click();
          const panel = page.locator(`[data-source-panel="${id}"]`);
          await panel.waitFor();
          await assertNoSourceShortcuts(`${width}px ${label}`);
          await assertNoOverflow(`${width}px ${label} without source shortcuts`);
          assert.equal(await modes.evaluate((element, original) => element === original, originalMenu), true, "source methods keep the same menu mounted");
          const bounds = await modes.boundingBox();
          for (const dimension of ["x", "y", "width", "height"])
            assert.ok(Math.abs(bounds[dimension] - menuBounds[dimension]) <= 1, `${width}px ${label} keeps the full top menu ${dimension} unchanged`);
          if (id === "url") {
            const panelBounds = await panel.boundingBox(), inputBounds = await page.getByLabel("Public event URL", { exact: true }).boundingBox();
            assert.ok(panelBounds && panelBounds.width <= 641, `${width}px URL panel respects the 640px maximum: ${JSON.stringify(panelBounds)}`);
            assert.ok(Math.abs(panelBounds.x + panelBounds.width / 2 - menuBounds.x - menuBounds.width / 2) <= 1, `${width}px URL panel centers beneath the full menu`);
            assert.ok(inputBounds && inputBounds.x >= panelBounds.x - 1 && inputBounds.x + inputBounds.width <= panelBounds.x + panelBounds.width + 1, `${width}px URL input fits its compact panel`);
            if (width === 1440) assert.ok(panelBounds.width < menuBounds.width - 100, "desktop URL content is visibly narrower than the source menu");
            await capture(`source-url-centered-${width}.png`);
          }
        }
        await originalMenu.dispose();
      }
      assert.equal(extracts.length, readsBefore, "source layout changes start no source parsing");
      assert.equal(forbidden.length, 0);
    });

    await t.test("category introduction quickly reaches the last item and returns once on load and refresh without selecting or saving", async () => {
      const readsBefore = extracts.length;
      const savedBefore = await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        if (width === 390) await openCreate();
        else { await page.reload(); await manualCards.first().waitFor(); }
        await page.evaluate(() => document.fonts.ready);
        const started = performance.now();
        const focusBefore = await page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id }));
        await page.waitForFunction(() => {
          const scroller = document.querySelector("[data-category-scroller]");
          return scroller.hasAttribute("data-intro-scroll") && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 1;
        });
        await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-creation-event-type]")).at(-1).getAttribute("data-active") === "true");
        const last = await manualCards.last().evaluate(button => button.parentElement.getBoundingClientRect().toJSON());
        const viewport = await categoryScroller.evaluate(element => ({ y: element.getBoundingClientRect().y, inset: parseFloat(getComputedStyle(element).scrollPaddingTop) }));
        assert.ok(Math.abs(last.y - viewport.y - viewport.inset) <= 4, width + "px introduction aligns the actual last item with the active row");
        await page.waitForFunction(() => !document.querySelector("[data-category-scroller]").hasAttribute("data-intro-scroll"));
        assert.ok(performance.now() - started < 2800, width + "px load/refresh introduction finishes in under 2.8 seconds after fonts are ready");
        assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "the introduction returns to the first item");
        assert.equal(await manualCards.first().getAttribute("data-active"), "true");
        await page.waitForTimeout(750);
        assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "the introduction does not repeat");
        assert.deepEqual(await page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id })), focusBefore, "automatic motion never moves keyboard focus");
        assert.equal(await templates.count(), 0);
      }
      assert.equal(extracts.length, readsBefore);
      assert.equal(await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length), savedBefore);
      assert.equal(forbidden.length, 0);
    });

    await t.test("category introduction stops for interaction, filtering, reduced motion and resizing", async () => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await openCreate();
      await page.waitForFunction(() => document.querySelector("[data-category-scroller]").scrollTop > 150);
      await categoryScroller.dispatchEvent("pointerdown", { pointerType: "touch" });
      assert.equal(await categoryScroller.getAttribute("data-intro-scroll"), null);
      assert.notEqual(await categoryScroller.evaluate(element => getComputedStyle(element).scrollSnapType), "none", "interruption restores manual scroll snapping");
      await page.waitForTimeout(350);
      const stopped = await categoryScroller.evaluate(element => element.scrollTop);
      await page.waitForTimeout(3500);
      assert.ok(stopped > 0 && Math.abs(await categoryScroller.evaluate(element => element.scrollTop) - stopped) <= 1, "touch interruption keeps the current position beyond the former return time");

      await openCreate();
      const filter = manualTypes.locator('[data-category-toolbar] [aria-controls="creation-type-filters"]');
      await filter.click();
      await manualTypes.getByRole("button", { name: "Sports & teams", exact: true }).click();
      await page.waitForTimeout(900);
      assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "filtering during the initial delay prevents a later introduction");
      await manualTypes.getByRole("button", { name: "Open event type search", exact: true }).click();
      const search = manualTypes.getByRole("searchbox", { name: "Search event types", exact: true });
      await search.fill("no-such-category");
      assert.equal(await categoryScroller.count(), 0);
      await search.fill("");
      await categoryScroller.waitFor();
      await page.waitForTimeout(900);
      assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "an empty search result cannot replay motion when the picker remounts");

      for (const interrupt of ["keyboard", "wheel", "reduced motion", "resize", "sidebar resize"]) {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await openCreate();
        await page.waitForFunction(() => document.querySelector("[data-category-scroller]").scrollTop > 150);
        if (interrupt === "keyboard") await page.keyboard.press("Escape");
        else if (interrupt === "wheel") await categoryScroller.dispatchEvent("wheel", { deltaY: 100 });
        else if (interrupt === "reduced motion") await page.emulateMedia({ reducedMotion: "reduce" });
        else if (interrupt === "resize") await page.setViewportSize({ width: 1280, height: 1000 });
        else await page.locator("#root").evaluate(element => { element.style.paddingLeft = "240px"; element.style.boxSizing = "border-box"; });
        await page.waitForFunction(() => !document.querySelector("[data-category-scroller]").hasAttribute("data-intro-scroll"));
        await page.waitForTimeout(350);
        const position = await categoryScroller.evaluate(element => element.scrollTop);
        await page.waitForTimeout(750);
        assert.ok(Math.abs(await categoryScroller.evaluate(element => element.scrollTop) - position) <= 1, interrupt + " permanently stops automatic motion");
      }

      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await openCreate();
        await page.waitForTimeout(900);
        assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "reduced motion leaves the first item at its starting row");
        if (width === 390) {
          await categoryScroller.evaluate(element => {
            const panel = element.closest("[data-category-panel]");
            const navbar = document.querySelector('[data-app-mobile-topbar="app"]');
            const inset = (navbar?.getClientRects().length ? navbar.getBoundingClientRect().bottom : 0) + 12;
            window.scrollTo({ top: Math.max(0, scrollY + panel.getBoundingClientRect().top - inset), behavior: "instant" });
          });
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "docking the mobile panel preserves the first category");
        }
        const before = await manualCards.first().boundingBox();
        await categoryScroller.hover(); await page.mouse.wheel(0, 220);
        await page.waitForFunction(() => document.querySelector("[data-category-scroller]").scrollTop > 50);
        await page.waitForFunction(() => document.querySelector('[data-creation-event-type][data-active="true"]') !== document.querySelector('[data-creation-event-type]'));
        const after = await manualCards.first().boundingBox();
        assert.ok(after.y < before.y - 50, "manual scrolling remains available with reduced motion");
        await page.waitForTimeout(350);
        const position = await categoryScroller.evaluate(element => element.scrollTop);
        await page.mouse.move(0, 0); await page.waitForTimeout(250);
        assert.ok(Math.abs(await categoryScroller.evaluate(element => element.scrollTop) - position) <= 1, "the list stops when user scrolling stops");
      }
      assert.equal(await page.getByRole("button", { name: /^(Pause|Resume) category motion$/ }).count(), 0, "the finite introduction ends within five seconds and stops on interaction");
      await page.reload(); await manualCards.first().waitFor();
      assert.equal(await categoryScroller.evaluate(element => element.scrollTop), 0, "reduced-motion refresh restores the original list position");
      assert.equal(forbidden.length, 0);
    });

    await t.test("category typography follows shared light/dark appearance and fits phones and sidebar workspaces", async () => {
      assert.equal(await page.locator("[data-unified-create]").getByRole("switch", { name: "Dark mode", exact: true }).count(), 0);
      const setFixtureAppearance = preference => page.evaluate(preference => { const key = "envitefy:appearance:v1"; localStorage.setItem(key, preference); window.dispatchEvent(new StorageEvent("storage", { key, newValue: preference })); }, preference);
      for (const dark of [false, true]) {
        await setFixtureAppearance(dark ? "dark" : "light");
        await page.waitForFunction(dark => document.documentElement.dataset.theme === (dark ? "general-dark" : "general-light"), dark);
        assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), dark ? "general-dark" : "general-light");
        for (const width of [320, 390, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await categoryScroller.evaluate(element => { element.scrollTop = 0; });
          await page.waitForFunction(() => document.querySelector('[data-creation-event-type]')?.getAttribute('data-active') === 'true');
          await assertNoOverflow("Category list in " + (dark ? "dark" : "light") + " at " + width + "px");
          if (width <= 640) {
            const placement = await categoryScroller.evaluate(element => {
              const row = element.querySelector("[data-creation-event-type]").parentElement.getBoundingClientRect();
              const bounds = element.getBoundingClientRect();
              return { top: row.top - bounds.top, height: row.height };
            });
            assert.ok(Math.abs(placement.top - 28) <= 1 && placement.height >= 60, width + "px first category starts in the first full row below the heading fade: " + JSON.stringify(placement));
          }
          const sample = await manualCards.first().evaluate(element => ({ fontSize: parseFloat(getComputedStyle(element).fontSize), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height, clipped: element.scrollWidth > element.clientWidth + 1 }));
          assert.ok(sample.width >= 44 && sample.height >= 44 && !sample.clipped, width + "px labels remain usable: " + JSON.stringify(sample));
          assert.ok(sample.fontSize >= 24, width + "px categories use prominent typography");
          await capture("categories-" + (dark ? "dark" : "light") + "-" + width + ".png");
        }
      }
      await setFixtureAppearance("light");
      const parentStyle = await page.locator("#root").evaluate(parent => { const previous = parent.getAttribute("style"); parent.style.paddingLeft = "320px"; parent.style.boxSizing = "border-box"; return previous; });
      for (const width of [1024, 1280, 1440, 1600]) {
        await page.setViewportSize({ width, height: 1000 });
        await assertNoOverflow("Categories beside a 320px sidebar at " + width + "px");
        const bounds = await categoryPicker.boundingBox();
        assert.ok(bounds && bounds.x >= 320 && bounds.x + bounds.width <= width + 1, width + "px categories fit the available workspace");
        await capture("categories-sidebar-" + width + ".png");
      }
      await page.locator("#root").evaluate((parent, previous) => { if (previous === null) parent.removeAttribute("style"); else parent.setAttribute("style", previous); }, parentStyle);
      assert.equal(extracts.length, 0, "category scrolling and appearance read no source");
      assert.equal(forbidden.length, 0);
    });
    await t.test("upload examples fit phones and sidebar workspaces without creating a separate selection step", async () => {
      const readsBefore = extracts.length;
      const geometry = [];
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openCreate("?chrome=1");
      await mode("Upload").click();
      const fan = page.locator("[data-upload-document-fan]");
      const chooseFiles = page.getByRole("button", { name: "Choose files", exact: true });
      await fan.waitFor();
      assert.equal(await fan.getAttribute("aria-hidden"), "true", "sample documents remain decorative rather than an extra step for screen readers");
      assert.equal(await fan.locator("a, button, input, select, textarea, [tabindex]").count(), 0, "example documents add no competing interactive controls");
      assert.equal(await fan.locator("[data-upload-document-example]").count(), 4, "the fan illustrates the four familiar document types");
      await page.getByText("Birthday flyers · Wedding invitations · Football schedules · Meet packets", { exact: true }).waitFor();
      const sourceAssets = await fan.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src")));
      const originalStyle = await page.locator("#root").getAttribute("style");
      try {
        for (const appearance of ["light", "dark"]) {
          await page.evaluate(preference => {
            const key = "envitefy:appearance:v1";
            localStorage.setItem(key, preference);
            window.dispatchEvent(new StorageEvent("storage", { key, newValue: preference }));
          }, appearance);
          await page.waitForFunction(preference => document.documentElement.dataset.theme === `general-${preference}`, appearance);
          for (const { width, height, inset = 0 } of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 1440, height: 1000 }, { width: 1024, height: 1000, inset: 320 }]) {
            await page.setViewportSize({ width, height });
            await page.locator("#root").evaluate((element, inset) => { element.style.paddingLeft = `${inset}px`; element.style.boxSizing = "border-box"; }, inset);
            await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
            await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-upload-document-fan] img")).every(image => image.complete && image.naturalWidth > 0));
            const context = `${appearance} upload at ${width}px${inset ? " beside a sidebar" : ""}`;
            await assertNoOverflow(context);
            const bounds = await fan.evaluate(element => {
              const measure = target => { const rect = target.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }; };
              return { workspace: measure(element.closest("[data-unified-create]")), fan: measure(element), documents: Array.from(element.querySelectorAll("[data-upload-document-example]")).map(measure) };
            });
            const action = await chooseFiles.boundingBox();
            assert.ok(bounds.fan.width > 0 && bounds.fan.height > 0, `${context}: examples retain visible space`);
            for (const document of bounds.documents) {
              assert.ok(document.width > 0 && document.height > 0 && document.left >= bounds.workspace.left - 1 && document.right <= bounds.workspace.right + 1, `${context}: rotated examples stay inside the workspace: ${JSON.stringify(bounds)}`);
            }
            assert.ok(action && action.height >= 44, `${context}: choosing files retains a usable touch target`);
            if (width <= 390) assert.ok(action.y >= bounds.fan.bottom && action.y + action.height <= height, `${context}: the upload action follows the fan and fits the first phone viewport: ${JSON.stringify(action)}`);
            assert.deepEqual(await fan.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src"))), sourceAssets, `${context}: shared appearance preserves original example artwork`);
            await chooseFiles.focus();
            assert.equal(await chooseFiles.evaluate(element => document.activeElement === element), true, `${context}: keyboard users can reach the primary action`);
            geometry.push({ appearance, width, height, inset, ...bounds, action });
            await capture(`upload-document-fan-${appearance}-${width}${inset ? "-sidebar" : ""}.png`);
          }
        }
      } finally {
        await page.locator("#root").evaluate((element, previous) => { if (previous === null) element.removeAttribute("style"); else element.setAttribute("style", previous); }, originalStyle);
        await page.evaluate(() => { const key = "envitefy:appearance:v1"; localStorage.setItem(key, "light"); window.dispatchEvent(new StorageEvent("storage", { key, newValue: "light" })); });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await openCreate();
      }
      fs.writeFileSync(path.join(output, "upload-document-fan-geometry.json"), JSON.stringify(geometry, null, 2));
      assert.equal(extracts.length, readsBefore, "viewing examples, changing appearance and resizing start no source parsing");
      assert.equal(forbidden.length, 0, "upload examples never generate or persist an event");
    });
    await mode("Upload").click();
    assert.equal(await mode("Upload").getAttribute("aria-pressed"), "true", "Upload remains available explicitly");
    await page.getByRole("button", { name: "Choose files", exact: true }).waitFor();
    await capture("source-initial-desktop.png");
    // The immediate parent is display:contents from UnsavedProgressProvider; inset its block ancestor.
    const initialParentStyle = await page.locator("#root").evaluate(parent => {
      const previous = parent.getAttribute("style");
      parent.style.paddingLeft = "320px"; parent.style.boxSizing = "border-box";
      return previous;
    });
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await assertNoOverflow(`Desktop creation with a 320px sidebar at ${width}px`);
      const bounds = await page.locator("[data-unified-create]").boundingBox();
      assert.ok(bounds && bounds.x >= 320 && bounds.width <= width - 320, `${width}px fixture reserves a real sidebar: ${JSON.stringify(bounds)}`);
      assert.equal(await inspiration.count(), 0, `${width}px keeps the source workspace free of the inspiration panel`);
      await capture(`source-sidebar-${width}.png`);
    }
    await page.locator("#root").evaluate((parent, previous) => {
      if (previous === null) parent.removeAttribute("style"); else parent.setAttribute("style", previous);
    }, initialParentStyle);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 }); await assertNoOverflow(`Source choices at ${width}px`);
      const actions = await modes.getByRole("button").all();
      for (const action of actions) { const box = await action.boundingBox(); assert.ok(box && box.height >= 44, `${width}px method controls retain usable touch targets`); }
      const nextAction = await page.getByRole("button", { name: "Choose files", exact: true }).boundingBox();
      assert.ok(nextAction && nextAction.height >= 44, `${width}px file picker retains a usable touch target`);
      assert.ok(nextAction && nextAction.y + nextAction.height <= 800, `${width}px upload primary action appears in the first phone viewport: ${JSON.stringify(nextAction)}`);
      assert.equal(await inspiration.count(), 0, `${width}px keeps the inspiration panel out of the phone task flow`);
      await assertNoSourceShortcuts(`${width}px Upload`);
      assert.equal(await page.getByRole("button", { name: "Read event information", exact: true }).count(), 0, "uploads need no separate matching-designs submission");
      t.diagnostic(`${width}px initial upload action ends at ${Math.round(nextAction.y + nextAction.height)}px`);
      await capture(`source-initial-${width}.png`);
      if (width === 320) await page.screenshot({ path: path.join(output, "source-modes-320.png") });
    }
    await mode("Start from scratch").focus(); await page.keyboard.press("Enter");
    await manualTypes.waitFor();
    assert.equal(await manualTypes.getByRole("button", { name: "Baby shower", exact: true }).count(), 1);
    assert.equal(await manualTypes.getByRole("button", { name: "Bridal shower", exact: true }).count(), 1);
    await manualTypes.getByRole("button", { name: "Bridal shower", exact: true }).focus();
    await page.keyboard.press("Enter"); await templates.waitFor();
    assert.equal((await readCurrentIntake()).guess.category, "bridal-showers");
    await assertScratchGallery("Bridal shower keyboard selection");
    assert.equal(extracts.length, 0, "Bridal selection retains its actual category without provider work");
    assert.equal(await modes.count(), 0, "source method controls leave the design-selection workspace");
    assert.deepEqual(errors, [], "combined Baby/Bridal preferences never produce duplicate React keys");
    await click("Back to your information");
    await manualTypes.waitFor();
    await click("Birthday"); await templates.waitFor();
    assert.equal((await readCurrentIntake()).guess.category, "birthdays", "Back returns to category choices before selecting a different category");
    await assertScratchGallery("Birthday selection");
    assert.equal(extracts.length, 0, "manual type selection reads no source and starts no AI work");
    assert.equal(forbidden.length, 0);
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 900 }); await assertNoOverflow(`Template cards at ${width}px`); }
    await capture("templates-390.png");
    await page.setViewportSize({ width: 1440, height: 1000 }); await capture("templates-desktop.png");

    await t.test("Christmas and Halloween directly open their available matching designs and retain the chosen occasion without an inferred date", async () => {
      const readsBefore = extracts.length;
      for (const holiday of [{ id: "christmas", name: "Christmas" }, { id: "halloween", name: "Halloween" }]) {
        await openCreate();
        const filter = manualTypes.locator('[data-category-toolbar] [aria-controls="creation-type-filters"]');
        await filter.click();
        await manualTypes.getByRole("region", { name: "Event type filters", exact: true }).getByRole("button", { name: "Holidays & seasonal", exact: true }).click();
        assert.equal(await manualCards.count(), 44, "Holidays lists each supported occasion directly");
        await manualTypes.locator('[data-holiday-occasion="' + holiday.id + '"]').click();
        await templates.waitFor();
        const selected = await readCurrentIntake();
        assert.equal(selected.guess.category, "holidays-seasonal", "the base category remains compatible with the existing gallery");
        assert.equal(selected.guess.occasion, holiday.id, "clicking " + holiday.name + " selects its own collection immediately");
        await assertScratchGallery(holiday.name + " selection");
        const links = await page.evaluate(id => window.__creationBrowser.getCreationTemplates({ category: "holidays-seasonal", sport: null, occasion: id }).map(template => template.href), holiday.id);
        assert.ok(links.length >= 10, "the original designs remain available alongside reviewed additions");
        await page.waitForFunction(({ count, prefix }) => {
          const cards = [...document.querySelectorAll("[data-template-masonry-card]")];
          return cards.length > 0 && cards.length <= count && cards.every(card => card.getAttribute("data-template-masonry-card").startsWith(prefix));
        }, { count: links.length, prefix: "holidays--" + holiday.id + "--" });
        for (const href of links) {
          const url = new URL(href, base);
          assert.equal(url.searchParams.get("collection"), "holidays-seasonal");
          assert.equal(url.searchParams.get("occasion"), holiday.id);
        }
        for (const width of [320, 390, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await assertNoOverflow(holiday.name + " designs at " + width + "px");
        }
        await capture("holiday-" + holiday.id + "-desktop.png");
        const holidayIntake = new URL(page.url()).searchParams.get("intake");
        await templates.getByRole("button", { name: new RegExp("^Select " + holiday.name) }).first().click();
        const holidayEditor = page.locator("[data-native-general] [data-event-page-design]");
        await holidayEditor.waitFor();
        assert.ok((await holidayEditor.getAttribute("data-event-page-design")).startsWith("holidays--" + holiday.id + "--"));
        const destination = new URL(page.url());
        assert.equal(destination.searchParams.get("collection"), "holidays-seasonal");
        assert.equal(destination.searchParams.get("occasion"), holiday.id);
        const retained = await page.evaluate(id => window.__creationBrowser.readCreationIntake("unified-host", id), holidayIntake);
        assert.equal(retained.guess.occasion, holiday.id);
        assert.equal(retained.information?.details?.date || "", "", "choosing " + holiday.name + " never assigns an event date");
        await openCreate("?intake=" + encodeURIComponent(holidayIntake) + "&step=templates"); await templates.waitFor();
        await page.reload(); await templates.waitFor();
        assert.equal((await readCurrentIntake()).guess.occasion, holiday.id);
        await assertScratchGallery(holiday.name + " restored gallery");
        const restoredIds = await templates.locator("[data-template-masonry-card]").evaluateAll(cards => cards.map(card => card.getAttribute("data-template-masonry-card")));
        assert.ok(restoredIds.length > 0 && restoredIds.length <= links.length, "the restored gallery retains available designs and automatic batching");
        assert.ok(restoredIds.every(id => id.startsWith("holidays--" + holiday.id + "--")));
      }
      assert.equal(extracts.length, readsBefore, "holiday selection starts no extraction or generation");
      assert.equal(forbidden.length, 0, "holiday selection prepares a browser intake without saving or publishing an event");
      assert.deepEqual(errors, [], "holiday occasion keys remain distinct from other category rows");
      await click("Back to your information");
      await manualTypes.waitFor();
      await manualTypes.getByRole("button", { name: "Birthday", exact: true }).click();
      await templates.waitFor();
      assert.equal((await readCurrentIntake()).guess.category, "birthdays", "the category picker remains available after restoring a holiday gallery");
    });

    await t.test("scratch creation keeps the original responsive gymnastics mosaic and loads designs while scrolling", async () => {
      const beforeScratchReads = extracts.length;
      await click("Back to your information");
      await manualTypes.waitFor();
      await manualTypes.getByRole("button", { name: "Gymnastics", exact: true }).click();
      await templates.waitFor();
      assert.equal((await readCurrentIntake()).guess.sport, "gymnastics");
      await assertScratchGallery("Gymnastics selection");
      const masonry = templates.locator("[data-template-masonry-grid]");
      const cards = masonry.locator("[data-template-masonry-card]");
      await cards.first().waitFor();
      assert.equal(await masonry.getAttribute("data-desktop-columns"), "4");
      assert.equal(await masonry.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length), 4, "desktop retains the original four-column mosaic");
      const heights = await cards.evaluateAll(elements => elements.slice(0, 8).map(element => Math.round(element.getBoundingClientRect().height)));
      assert.ok(new Set(heights).size > 2, `mosaic retains varied artwork heights: ${heights}`);
      assert.ok(await masonry.locator("[data-template-thumbnail-preview]").count() > 0, "gymnastics designs render their real composed cover previews");
      assert.equal(await page.getByRole("button", { name: /^Browse all/ }).count(), 0, "the full catalogue needs no Browse all gate");
      const firstBatch = await cards.count();
      const total = await page.evaluate(() => window.__creationBrowser.getCreationTemplates({ category: "sports", sport: "gymnastics" }).length);
      if (firstBatch < total) {
        await templates.locator("[data-template-autoload]").scrollIntoViewIfNeeded();
        await page.waitForFunction(count => document.querySelectorAll("[data-template-masonry-card]").length > count, firstBatch);
        assert.ok(await cards.count() > firstBatch, "scrolling automatically appends more designs");
      }
      await capture("gymnastics-mosaic-desktop.png");
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await assertNoOverflow(`Gymnastics mosaic at ${width}px`);
        assert.equal(await masonry.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length), 2, `${width}px phones retain two mosaic columns`);
      }
      await capture("gymnastics-mosaic-390.png");
      assert.equal(extracts.length, beforeScratchReads, "manual design browsing starts no source parsing");
      assert.equal(discoveryRequests.length, 0, "manual gymnastics browsing starts no schedule import");
      await page.setViewportSize({ width: 1440, height: 1000 });
    });

    await t.test("server-approved event types render while the background access refresh is still pending", async () => {
      const snapshot = { identity: "unified-host@test.com", access: { policy: "restricted", allowedProducts: ["event_page"], allowedCategories: ["birthdays"] } };
      const before = extracts.length, gate = holdAccessResponse();
      try {
        await page.evaluate(snapshot => sessionStorage.setItem("fixture-initial-creation-access", JSON.stringify(snapshot)), snapshot);
        await page.goto(`${base}/create`);
        await waitForStored(() => gate.started, "background access refresh after server preload");
        await manualCards.first().waitFor();
        assert.equal(await manualCards.count(), 1, "only this account's server-approved category is visible before the refresh completes");
        assert.equal(await manualCards.first().getAttribute("aria-label"), "Birthday");
        assert.equal(await page.getByText("Checking available event types…", { exact: true }).count(), 0);
        assert.equal(gate.finished, false, "the list did not wait for the browser request");
        assert.equal(extracts.length, before);
        await capture("preloaded-event-types.png");

        await page.evaluate(() => window.__creationBrowser.setFixtureOwner("different-bootstrap-host"));
        await page.getByText("Checking available event types…", { exact: true }).waitFor();
        assert.equal(await manualCards.count(), 0, "another account cannot inherit the server snapshot");
      } finally {
        await page.evaluate(() => sessionStorage.removeItem("fixture-initial-creation-access"));
        accessResponseGate = null; gate.release();
        await openCreate();
      }
    });

    await t.test("failed first access reads replace the checking message with recovery and retry loads the list", async () => {
      accessResponseError = "Account access is temporarily unavailable. Please retry.";
      try {
        await page.goto(`${base}/create`);
        await page.getByRole("alert").getByText(accessResponseError, { exact: true }).waitFor();
        await page.getByRole("status").filter({ hasText: "Event types could not be loaded. Try again above." }).waitFor();
        assert.equal(await page.getByText("Checking available event types…", { exact: true }).count(), 0);
        assert.equal(await manualCards.count(), 0);
        accessResponseError = "";
        await click("Try again");
        await manualCards.first().waitFor();
      } finally { accessResponseError = ""; }
    });

    await t.test("account checks run behind usable source controls and selected files parse once access arrives", async () => {
      const before = extracts.length, gate = holdAccessResponse();
      try {
        await page.goto(`${base}/create`);
        await page.locator("[data-unified-create]").waitFor();
        await waitForStored(() => gate.started, "initial account access request");
        for (const button of await modes.getByRole("button").all()) assert.equal(await button.isEnabled(), true, "source modes remain usable during account checks");
        assert.equal(await page.getByText("Loading your workspace…", { exact: true }).count(), 0);
        await mode("Upload").click();
        assert.equal(await page.getByRole("button", { name: "Choose files", exact: true }).isEnabled(), true);
        await mode("Paste URL").click();
        const publicUrl = page.getByLabel("Public event URL", { exact: true });
        await publicUrl.fill("https://school.test/ready-while-access-loads");
        assert.equal(await publicUrl.inputValue(), "https://school.test/ready-while-access-loads");
        await mode("Upload").click();
        await uploadFiles(file("background-access-flyer.png"));
        await page.getByRole("list", { name: "Selected files" }).getByText("background-access-flyer.png", { exact: true }).waitFor();
        assert.equal(extracts.length, before, "files remain local while account access is unknown");
        assert.equal(gate.finished, false);
        accessResponseGate = null; gate.release();
        await waitForImportedEditor();
        assert.equal(extracts.length, before + 1, "the selected file starts one automatic read after approval");
        assert.match(extracts.at(-1).raw, /background-access-flyer\.png/);
      } finally { accessResponseGate = null; gate.release(); }
    });

    await t.test("denied or failed account checks never process a waiting upload", async () => {
      const products = allowedProducts;
      try {
        for (const failure of [false, true]) {
          allowedProducts = failure ? products : ["snap", "live_card", "signup_form"];
          accessResponseError = failure ? "Account access is temporarily unavailable. Please retry." : "";
          const before = extracts.length, gate = holdAccessResponse();
          try {
            await page.goto(`${base}/create`);
            await page.locator("[data-unified-create]").waitFor();
            await waitForStored(() => gate.started, "held account access request");
            await uploadFiles(file(failure ? "failed-access-flyer.png" : "denied-access-flyer.png"));
            await page.getByRole("list", { name: "Selected files" }).waitFor();
            assert.equal(extracts.length, before);
            accessResponseGate = null; gate.release();
            if (failure) await page.getByRole("alert").getByText(accessResponseError, { exact: true }).waitFor();
            else await page.getByRole("heading", { name: "Event Pages aren’t enabled for this account.", exact: true }).waitFor();
            assert.equal(extracts.length, before, "an unverified or denied account never uploads or parses its waiting source");
            assert.equal(new URL(page.url()).pathname, "/create");
          } finally { accessResponseGate = null; gate.release(); }
        }
      } finally { allowedProducts = products; accessResponseError = ""; await openUploadCreate(); }
    });

    await t.test("waiting reads respect Cancel and use only the latest accepted source", async () => {
      const before = extracts.length;
      let gate = holdAccessResponse();
      try {
        await page.goto(`${base}/create`);
        await waitForStored(() => gate.started, "account check before cancellation");
        await uploadFiles(file("cancelled-before-access.png"));
        await page.getByRole("status").filter({ hasText: "Checking event access before reading…" }).waitFor();
        await click("Cancel");
        accessResponseGate = null; gate.release();
        await mode("Start from scratch").click();
        await manualCards.first().waitFor();
        await mode("Upload").click();
        await page.getByRole("list", { name: "Selected files" }).getByText("cancelled-before-access.png", { exact: true }).waitFor();
        assert.equal(extracts.length, before, "Cancel retains the source without starting it after access arrives");

        gate = holdAccessResponse();
        await page.goto(`${base}/create`);
        await waitForStored(() => gate.started, "account check before source replacement");
        await uploadFiles(file("replaced-before-access.png"));
        await click("Remove replaced-before-access.png");
        await uploadFiles(file("latest-before-access.png"));
        await page.getByRole("list", { name: "Selected files" }).getByText("latest-before-access.png", { exact: true }).waitFor();
        assert.equal(extracts.length, before);
        accessResponseGate = null; gate.release();
        await waitForImportedEditor();
        assert.equal(extracts.length, before + 1);
        assert.match(extracts.at(-1).raw, /latest-before-access\.png/);
        assert.doesNotMatch(extracts.at(-1).raw, /replaced-before-access|cancelled-before-access/);
      } finally { accessResponseGate = null; gate.release(); }
    });

    await t.test("switching accounts clears a waiting upload before either account access response can read it", async () => {
      const before = extracts.length, gate = holdAccessResponse();
      try {
        await page.goto(`${base}/create`);
        await waitForStored(() => gate.started, "first account check");
        await uploadFiles(file("private-waiting-first-account.png"));
        await page.getByRole("list", { name: "Selected files" }).waitFor();
        accessResponseGate = null;
        await page.evaluate(() => window.__creationBrowser.setFixtureOwner("waiting-second-host"));
        await mode("Start from scratch").click();
        await manualCards.first().waitFor();
        await mode("Upload").click();
        assert.equal(await page.getByRole("list", { name: "Selected files" }).count(), 0, "the second account never sees the first account's waiting source");
        gate.release();
        await waitForStored(() => gate.finished, "late first account access response");
        assert.equal(extracts.length, before, "neither the new grant nor the old late grant consumes the prior account's waiting file");
        await uploadFiles(file("current-waiting-second-account.png"));
        await waitForImportedEditor();
        assert.equal(extracts.length, before + 1);
        assert.match(extracts.at(-1).raw, /current-waiting-second-account\.png/);
        assert.doesNotMatch(extracts.at(-1).raw, /private-waiting-first-account/);
      } finally { accessResponseGate = null; gate.release(); await openUploadCreate(); }
    });

    await t.test("refocusing refreshes account access without hiding the form or resetting edits", async () => {
      await openUploadCreate(); await mode("Paste URL").click();
      const publicUrl = page.getByLabel("Public event URL", { exact: true });
      await publicUrl.fill("https://school.test/first-event");
      const before = extracts.length, gate = holdAccessResponse();
      try {
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await waitForStored(() => gate.started, "background focus refresh");
        assert.equal(await publicUrl.isEnabled(), true);
        assert.equal(await publicUrl.inputValue(), "https://school.test/first-event");
        assert.equal(await page.getByText("Loading your workspace…", { exact: true }).count(), 0);
        await publicUrl.fill("https://school.test/edited-during-refresh");
        accessResponseGate = null; gate.release();
        await waitForStored(() => gate.finished, "completed account refresh");
        assert.equal(await publicUrl.inputValue(), "https://school.test/edited-during-refresh");
        assert.equal(extracts.length, before, "account refresh alone never reads event sources");
      } finally { accessResponseGate = null; gate.release(); }
    });

    await t.test("scratch categories respect server grants through preference changes and revocation", async () => {
      const readsBefore = extracts.length;
      restricted = true; restrictedCategories = ["gymnastics", "football"];
      try {
        await openCreate();
        await setMenuPreferences({ visibleTemplateKeys: ["gymnastics", "football_season", "birthdays", "weddings"], sportPreferences: { setupCompleted: true, enabledSports: ["gymnastics", "football"], primarySport: "gymnastics" } });
        await manualTypes.getByRole("button", { name: "Gymnastics", exact: true }).waitFor();
        assert.equal(await manualTypes.getByRole("button", { name: "Football", exact: true }).count(), 1);
        for (const label of ["Birthday", "Wedding", "Baby shower", "Bridal shower", "General event"])
          assert.equal(await manualTypes.getByRole("button", { name: label, exact: true }).count(), 0, `${label} never appears outside the current category grant`);
        await assertNoSourceShortcuts("server-approved scratch choices");
        assert.equal(await inspiration.count(), 0, "server-approved choices do not restore the inspiration panel");
        await capture("source-access-sports-desktop.png");
        await page.setViewportSize({ width: 390, height: 900 }); await assertNoOverflow("Sports-only source choices on phones");
        await capture("source-access-sports-390.png");
        await page.setViewportSize({ width: 1440, height: 1000 });

        await setMenuPreferences({ visibleTemplateKeys: [], sportPreferences: { setupCompleted: true, enabledSports: [], primarySport: null } });
        assert.equal(await manualCards.count(), 2, "empty preferences retain every server-approved scratch category");
        assert.equal(await inspiration.count(), 0, "empty preferences do not restore the inspiration panel");
        await assertNoSourceShortcuts("empty category preferences");
        await manualTypes.getByRole("button", { name: "Gymnastics", exact: true }).waitFor();
        assert.equal(await manualTypes.getByRole("button", { name: "Football", exact: true }).count(), 1, "scratch reveals the available server-approved types");
        assert.equal(await manualTypes.getByRole("button", { name: "Birthday", exact: true }).count(), 0);
        assert.equal(await manualTypes.locator("[data-creation-event-type]").count(), 2, "restricted accounts see only their two permitted categories");
        assert.equal(await manualTypes.locator("[data-holiday-occasion]").count(), 0, "accounts without a holiday grant receive no expanded holiday rows");
        const filter = manualTypes.locator('[data-category-toolbar] [aria-controls="creation-type-filters"]');
        const filterPanel = manualTypes.getByRole("region", { name: "Event type filters", exact: true, includeHidden: true });
        assert.deepEqual(await filterPanel.getByRole("button", { includeHidden: true }).evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label") || button.textContent.trim())), ["Sports & teams"], "only the group with server-approved types is offered");
        assert.equal(await filterPanel.locator("[data-event-type-group-examples]").textContent(), "Football · Gymnastics", "restricted group examples show only the account's permitted sports");
        await filter.click(); await filterPanel.getByRole("button", { name: "Sports & teams", exact: true }).click();
        assert.equal(await manualTypes.locator("[data-creation-event-type]").count(), 2);
        restrictedCategories = ["football"];
        await reloadAccess();
        await manualTypes.getByRole("button", { name: "Gymnastics", exact: true }).waitFor({ state: "detached" });
        assert.equal(await manualTypes.locator("[data-creation-event-type]").count(), 1, "revocation removes an unavailable member immediately");
        assert.equal(await filter.getAttribute("aria-label"), "Filter event types: Sports & teams", "the group remains selected while an allowed sport remains");
        assert.equal(await manualTypes.getByRole("button", { name: "Football", exact: true }).count(), 1);
        assert.equal(await filterPanel.locator("[data-event-type-group-examples]").textContent(), "Football", "revocation immediately removes the unavailable sport from the group's examples");
        restrictedCategories = ["birthdays"];
        await reloadAccess();
        await manualTypes.getByRole("button", { name: "Football", exact: true }).waitFor({ state: "detached" });
        await manualTypes.getByRole("button", { name: "Birthday", exact: true }).waitFor();
        assert.equal(await filter.getAttribute("aria-label"), "Filter event types: All", "revoking the final sport restores All");
        assert.deepEqual(await filterPanel.getByRole("button", { includeHidden: true }).evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label") || button.textContent.trim())), ["Celebrations"], "the unavailable Sports group disappears from the dropdown");
        assert.equal(await filterPanel.locator("[data-event-type-group-examples]").textContent(), "Birthday", "the replacement group lists only its permitted celebration");
        restrictedCategories = ["gymnastics", "football"];
        await reloadAccess();
        await manualTypes.getByRole("button", { name: "Gymnastics", exact: true }).waitFor();
        assert.equal(await manualTypes.locator("[data-creation-event-type]").count(), 2, "restored grants restore permitted sports");
        assert.equal(await filter.getAttribute("aria-label"), "Filter event types: All", "restoring a group does not silently reselect it");
        assert.equal(extracts.length, readsBefore, "category preferences and browsing start no parsing");
        assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
      } finally {
        restricted = false; restrictedCategories = ["birthdays"];
        await openUploadCreate();
      }
    });

    await t.test("live preference, grant and account changes keep scratch choices current without restoring shortcuts", async () => {
      restricted = true; restrictedCategories = ["birthdays", "football"];
      try {
        await openCreate();
        await setMenuPreferences({ visibleTemplateKeys: ["birthdays", "football_season"], sportPreferences: { setupCompleted: true, enabledSports: ["football"], primarySport: "football" } });
        await manualTypes.getByRole("button", { name: "Birthday", exact: true }).waitFor();
        await manualTypes.getByRole("button", { name: "Football", exact: true }).waitFor();

        await setMenuPreferences({ visibleTemplateKeys: ["football_season"] });
        assert.equal(await manualTypes.getByRole("button", { name: "Birthday", exact: true }).count(), 1, "disabling a preference retains its server-approved scratch category");
        assert.equal(await manualCards.first().getAttribute("aria-label"), "Football", "preferences can order an approved category first");
        await assertNoSourceShortcuts("changed category preferences");
        assert.equal(await inspiration.count(), 0, "preference changes do not restore the inspiration panel");
        await setMenuPreferences({ hasLoadedPreferences: false, loading: true });
        assert.equal(await manualCards.count(), 2, "loading preferences retains this account's verified scratch categories");
        await assertNoSourceShortcuts("loading category preferences");
        assert.equal(await inspiration.count(), 0, "loading preferences does not mount an inspiration panel");
        await setMenuPreferences({ hasLoadedPreferences: true, loading: false });
        await manualTypes.getByRole("button", { name: "Football", exact: true }).waitFor();

        restrictedCategories = ["birthdays"];
        await reloadAccess();
        await manualTypes.getByRole("button", { name: "Football", exact: true }).waitFor({ state: "detached" });
        assert.equal(await manualTypes.getByRole("button", { name: "Football", exact: true }).count(), 0, "revoked categories disappear without a page reload");
        assert.equal(await inspiration.count(), 0, "grant changes do not restore the inspiration panel");

        await setMenuPreferences({ visibleTemplateKeys: ["birthdays", "football_season"] });
        await manualTypes.getByRole("button", { name: "Birthday", exact: true }).waitFor();
        allowedProducts = ["snap", "live_card", "signup_form"];
        await reloadAccess();
        await page.getByRole("heading", { name: "Event Pages aren’t enabled for this account.", exact: true }).waitFor();
        assert.equal(await manualTypes.count(), 0, "a category grant cannot bypass the Event Page product grant");
        assert.equal(await inspiration.count(), 0, "a removed Event Page product grant does not mount an inspiration panel");

        allowedProducts = ["snap", "live_card", "event_page", "signup_form"];
        await reloadAccess(); await manualTypes.getByRole("button", { name: "Birthday", exact: true }).waitFor();
        accessResponseDelay = 700; delayedAccessStarted = false; delayedAccessFinished = false;
        await reloadAccess(); await waitForStored(() => delayedAccessStarted, "old-account grant refresh");
        accessResponseDelay = 0; restrictedCategories = ["football"];
        await page.evaluate(() => window.__creationBrowser.setFixtureOwner("access-second-host"));
        await manualTypes.getByRole("button", { name: "Birthday", exact: true }).waitFor({ state: "detached" });
        assert.equal(await manualTypes.getByRole("button", { name: "Birthday", exact: true }).count(), 0, "session changes remove the old account's categories immediately");
        await manualTypes.getByRole("button", { name: "Football", exact: true }).waitFor();
        await waitForStored(() => delayedAccessFinished, "late old-account grant response");
        assert.equal(await manualTypes.getByRole("button", { name: "Birthday", exact: true }).count(), 0, "late old-account access never restores its categories");
        await assertNoSourceShortcuts("late old-account access response");
        assert.equal(await inspiration.count(), 0, "late account access does not restore the inspiration panel");
        assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
      } finally {
        restricted = false; restrictedCategories = ["birthdays"]; accessResponseDelay = 0;
        allowedProducts = ["snap", "live_card", "event_page", "signup_form"];
        await openUploadCreate();
      }
    });

    await t.test("unfinished creation resumes from Drafts while Create omits the recovery banner and footer", async () => {
      const title = "2027 Women's Invitational Championship and Regional Community Celebration with Extended Meet Details";
      await openUploadCreate();
      const intakeId = await page.evaluate(async title => {
        const browser = window.__creationBrowser;
        const record = browser.createCreationIntake("unified-host", { kind: "scratch", files: [], text: "" });
        await browser.writeCreationIntake({ ...record, sourceText: title, information: { version: 1, kind: "information", category: "general", details: { title } } });
        return record.id;
      }, title);
      await openUploadCreate();
      assert.equal(await page.getByRole("region", { name: "Continue creating", exact: true }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Resume", exact: true }).count(), 0);
      assert.equal(await page.getByText("A beautiful beginning for every occasion.", { exact: true }).count(), 0);
      await assertNoSourceShortcuts("unfinished creation source");
      workspaceMode = true;
      await page.goto(`${base}/events?view=drafts&q=Invitational`);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      const resume = page.getByRole("link", { name: `Resume ${title}`, exact: true });
      assert.match(await resume.getAttribute("href"), new RegExp(`/create\\?intake=${intakeId}`));
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await assertNoOverflow(`Recovered creation in Drafts at ${width}px`);
        const resumeBox = await resume.boundingBox();
        assert.ok(resumeBox && resumeBox.height >= 44, `${width}px Resume retains a usable touch target`);
        await capture(`drafts-recovered-creation-${width}.png`);
      }
      await page.getByRole("combobox", { name: "Event ownership", exact: true }).selectOption("invited");
      await page.getByRole("heading", { name: title, exact: true }).waitFor({ state: "hidden" });
      await page.getByRole("combobox", { name: "Event ownership", exact: true }).selectOption("owned");
      await resume.waitFor();
      await resume.click();
      await page.locator("[data-unified-create]").waitFor();
      await page.waitForFunction(() => new URL(location.href).searchParams.get("intake") && !document.body.textContent.includes("Restoring your unfinished event…"));
      assert.equal((await inspect()).id, intakeId);
      assert.equal((await inspect()).title, title, "Drafts restores the retained creation without replacing its facts");
      workspaceMode = false;
      await page.setViewportSize({ width: 1440, height: 1000 });
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });

    await t.test("Bridal-only accounts keep one manual choice through the legacy Baby route", async () => {
      restricted = true; restrictedCategories = ["bridal-showers"];
      try {
        await openUploadCreate();
        await assertNoSourceShortcuts("Bridal-only Upload");
        await mode("Start from scratch").click();
        assert.equal(await manualTypes.getByRole("button", { name: "Bridal shower", exact: true }).count(), 1);
        assert.equal(await manualTypes.getByRole("button", { name: "Baby shower", exact: true }).count(), 0);
        await click("Bridal shower"); await templates.waitFor();
        assert.equal((await readCurrentIntake()).guess.category, "bridal-showers");
        await assertScratchGallery("Bridal-only account selection");
        assert.deepEqual(errors, []);
      } finally { restricted = false; restrictedCategories = ["birthdays"]; }
    });

    await t.test("switching input methods retains recognized upload and unsubmitted URL sources without reading again", async () => {
      const beforeSwitchReads = extracts.length;
      await openUploadCreate();
      await uploadFiles(file("mode-switch-flyer.png"));
      await openImportedDesigns();
      assert.equal(extracts.length, beforeSwitchReads + 1, "choosing a file starts one read without a submit action");
      await click("Back to your information");
      await mode("Paste URL").click();
      await page.getByLabel("Public event URL", { exact: true }).fill("https://school.test/method-switch?keep=all");
      await mode("Upload").click();
      await page.getByRole("list", { name: "Selected files" }).getByText("mode-switch-flyer.png", { exact: true }).waitFor();
      await mode("Paste URL").click();
      assert.equal(await page.getByLabel("Public event URL", { exact: true }).inputValue(), "https://school.test/method-switch?keep=all");
      await page.getByLabel("Public event URL", { exact: true }).fill("https://school.test/newest-source?keep=latest");
      // Do not wait for the 250ms source debounce: switching methods must retain the newest input itself.
      await mode("Start from scratch").click();
      await manualTypes.getByRole("button", { name: "Birthday", exact: true }).click(); await templates.waitFor();
      assert.equal((await readCurrentIntake()).guess.category, "birthdays");
      await assertScratchGallery("Switching to scratch from a retained source");
      await click("Back to your information"); await mode("Paste URL").click();
      assert.equal(await page.getByLabel("Public event URL", { exact: true }).inputValue(), "https://school.test/newest-source?keep=latest", "switching to scratch preserves the most recent URL before debounce");
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).some(row => row.source.url === "https://school.test/newest-source?keep=latest")), "method-switch recovery with the latest source URL");
      await mode("Upload").click();
      await page.getByRole("list", { name: "Selected files" }).getByText("mode-switch-flyer.png", { exact: true }).waitFor();
      assert.equal(extracts.length, beforeSwitchReads + 1, "changing methods or choosing a scratch category never repeats extraction");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });

    await t.test("uploads parse immediately, retain retry control, and ignore cancelled responses", async () => {
      await openUploadCreate();
      const beforeInvalid = extracts.length;
      await uploadFiles(Array.from({ length: 6 }, (_, index) => file(`too-many-${index}.png`)));
      await page.getByRole("alert").filter({ hasText: "Choose one PDF or up to five photos." }).waitFor();
      assert.equal(extracts.length, beforeInvalid, "invalid file selections never start parsing");

      const beforeDrop = extracts.length;
      const dataTransfer = await page.evaluateHandle(() => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["%PDF-1.4\nDropped source bytes\n%%EOF"], "dropped-packet.pdf", { type: "application/pdf" }));
        return transfer;
      });
      await page.locator("[data-upload-drop-zone]").dispatchEvent("drop", { dataTransfer });
      await dataTransfer.dispose();
      await waitForImportedEditor();
      assert.equal(extracts.length, beforeDrop + 1, "dropping a PDF starts one read without a submit action");
      assert.match(extracts.at(-1).raw, /dropped-packet.pdf/);
      assert.equal((await inspect()).file, "dropped-packet.pdf");

      await openUploadCreate();
      const beforeFailure = extracts.length;
      await uploadFiles(file("retry-flyer.png"));
      await page.getByRole("alert").filter({ hasText: "The source reader is temporarily unavailable." }).waitFor();
      await page.getByRole("list", { name: "Selected files" }).getByText("retry-flyer.png", { exact: true }).waitFor();
      await page.waitForTimeout(450);
      assert.equal(extracts.length, beforeFailure + 1, "a failed read does not automatically retry in a loop");
      await click("Retry parsing"); await waitForImportedEditor();
      assert.equal(extracts.length, beforeFailure + 2, "retry starts exactly one fresh read of the retained file");
      assert.match(extracts.at(-1).raw, /retry-flyer.png/);

      await openUploadCreate();
      const beforeCancelled = extracts.length;
      await uploadFiles(file("cancelled-flyer.png"));
      await waitForStored(() => releaseCancelledRead !== null, "delayed upload reader");
      await page.getByRole("status").filter({ hasText: "Finding your event details" }).waitFor();
      await click("Cancel reading");
      await page.getByRole("list", { name: "Selected files" }).getByText("cancelled-flyer.png", { exact: true }).waitFor();
      await page.waitForTimeout(350);
      assert.equal(extracts.length, beforeCancelled + 1, "cancelled reading remains stopped until the host chooses another action");
      await click("Remove cancelled-flyer.png");
      await uploadFiles(file("elliot-flyer.png"));
      await waitForImportedEditor();
      const currentSource = await inspect();
      assert.equal(currentSource.file, "elliot-flyer.png"); assert.equal(currentSource.title, "Elliot's 9th birthday");
      releaseCancelledRead();
      await waitForStored(() => cancelledReadFinished, "cancelled reader response");
      assert.deepEqual(await inspect(), currentSource, "a late cancelled response cannot replace the new file or its facts");
      assert.equal(extracts.length, beforeCancelled + 2);
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });

    await t.test("uncertain recognition asks for confirmation before opening its default editor", async () => {
      await openUploadCreate();
      const beforeRead = extracts.length;
      await uploadFiles(file("uncertain-flyer.png"));
      await templates.waitFor();
      await page.getByText("Check the event type below", { exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, "/create", "low-confidence recognition keeps the category review available");
      assert.equal(await templates.getByRole("combobox", { name: "Event type", exact: true }).inputValue(), "birthdays:");
      assert.equal(extracts.length, beforeRead + 1);
      await click("Continue to editor"); await waitForImportedEditor();
      assert.equal(new URL(page.url()).pathname.startsWith("/birthdays/templates/"), true);
      assert.equal(extracts.length, beforeRead + 1, "confirming the recognized category reuses its parsed information");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });

    // Original upload bytes and historical intake corrections survive refresh and extraction.
    await page.setViewportSize({ width: 1440, height: 1000 }); await openUploadCreate(); await mode("Upload").click();
    const readsBeforeOriginal = extracts.length;
    await uploadFiles(file("maya-flyer.png"));
    await openImportedDesigns();
    assert.equal(extracts.length, readsBeforeOriginal + 1, "upload selection parses automatically");
    assert.match(extracts.at(-1).raw, /maya-flyer.png/);
    await click("Back to your information");
    await assertPrimaryContrast(page.getByRole("button", { name: "Parse files", exact: true }), "Source retry button");
    await page.screenshot({ path: path.join(output, "source-desktop.png") });
    await page.setViewportSize({ width: 390, height: 900 }); await assertNoOverflow("Uploaded source at 390px"); await page.screenshot({ path: path.join(output, "source-390.png"), fullPage: true }); await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() => new URL(location.href).searchParams.has("intake"));
    await waitForStored(() => page.evaluate(async () => { const row = await window.__creationBrowser.readCreationIntake("unified-host", new URL(location.href).searchParams.get("intake")); return row?.source.files[0]?.name === "maya-flyer.png"; }), "uploaded source bytes");
    const pending = await inspect(); assert.ok(pending.fileBytes > 0);
    const historicalNotes = "Historical correction: change the start time to 15:00 and use the east entrance.";
    await seedHistoricalNotes(historicalNotes);
    await page.reload(); await page.getByRole("list", { name: "Selected files" }).getByText("maya-flyer.png", { exact: true }).waitFor();
    assert.equal((await inspect()).notes, historicalNotes, "removing the optional control preserves existing intake notes");
    assert.equal(extracts.length, readsBeforeOriginal + 1, "returning to or restoring the source does not repeat parsing");
    await click("Parse files"); await openImportedDesigns();
    assert.equal(extracts.length, readsBeforeOriginal + 2); assert.match(extracts.at(-1).raw, /maya-flyer.png/); assert.match(extracts.at(-1).raw, /Historical correction: change the start time to 15:00/);
    const original = await inspect(); assert.equal(original.title, "Maya's 7th birthday");
    const sourceUrl = new URL(page.url());
    await page.reload(); await templates.waitFor(); assert.equal((await inspect()).title, original.title); assert.equal(extracts.length, readsBeforeOriginal + 2, "refresh restores recognized facts without reading or generating again");
    const designs = await page.evaluate(() => window.__creationBrowser.getCreationTemplates({ category: "birthdays", sport: null }).slice(0, 2));
    await page.getByRole("button", { name: new RegExp(`^Select ${designs[0].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-native-birthday] [data-event-page-editor]").waitFor();
    await openHeadline();
    assert.equal(await page.getByLabel("Event Date", { exact: true }).inputValue(), "2027-05-03");
    assert.equal(await page.getByLabel("Start Time", { exact: true }).inputValue(), "15:00");
    assert.equal(await page.getByLabel("Venue", { exact: true }).inputValue(), "Riverside Park");
    assert.equal(await page.getByLabel("Address", { exact: true }).inputValue(), "123 River Road");
    await page.getByLabel("Venue", { exact: true }).fill("Host edited venue");
    await waitForStored(() => page.evaluate(async id => (await window.__creationBrowser.readTemplateDraft("birthdays", id))?.snapshot?.data?.venue === "Host edited venue", original.id), "native field recovery");
    await page.reload(); await openHeadline();
    assert.equal(await page.getByLabel("Venue", { exact: true }).inputValue(), "Host edited venue", `native browser drafts survive refresh: ${JSON.stringify(await page.evaluate(async id => ({ id, url: location.href, draft: (await window.__creationBrowser.readTemplateDraft("birthdays", id))?.snapshot?.data?.venue }), original.id))}`);
    await page.goto(sourceUrl.href); await templates.waitFor();
    await page.getByRole("button", { name: new RegExp(`^Select ${designs[1].title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).click();
    await openHeadline();
    assert.equal(await page.getByLabel("Venue", { exact: true }).inputValue(), "Host edited venue", "changing a native design keeps host edits");
    await waitForStored(() => page.evaluate(async ({ id, template }) => (await window.__creationBrowser.readTemplateDraft("birthdays", id))?.snapshot?.data?.theme?.professionalThemeId === template, { id: original.id, template: designs[1].id }), "changed native design");
    assert.equal(forbidden.length, 0, "native selection and local editing never create a history record or generate artwork");

    // Back and replacement allocate fresh intake state; old facts cannot contaminate the next source.
    await page.goto(sourceUrl.href); await templates.waitFor(); await click("Back to your information");
    await click("Remove maya-flyer.png");
    assert.equal(await templates.count(), 0);
    await uploadFiles(file("elliot-flyer.png"));
    await waitForImportedEditor();
    const replacement = await inspect(); assert.notEqual(replacement.id, original.id); assert.equal(replacement.title, "Elliot's 9th birthday"); assert.equal(replacement.venue, "Meadow Hall");
    assert.ok(!replacement.sourceText.includes("Maya"));

    await t.test("URL imports enter the General editor and changing designs preserves facts, notes and uploaded artwork", async () => {
      await openUploadCreate(); await mode("Paste URL").click();
      const readsBefore = extracts.length;
      await page.getByLabel("Public event URL", { exact: true }).fill("https://school.test/pages/831?view=public");
      await page.getByLabel("Public event URL", { exact: true }).press("Enter");
      const id = await waitForImportedEditor();
      assert.equal(new URL(page.url()).pathname, "/event/general/customize");
      assert.equal(extracts.at(-1).json.url, "https://school.test/pages/831?view=public");
      assert.equal((await inspect()).title, "Community festival from the public page");
      const readGeneral = () => page.evaluate(id => window.__creationBrowser.readCreationIntake("unified-host", id), id);
      const designs = await page.evaluate(() => window.__creationBrowser.getCreationTemplates({ category: "general", sport: null }).slice(0, 3));
      const openSection = async name => {
        await openEditorControls();
        const back = page.getByRole("button", { name: "Back to details", exact: true });
        if (await back.isVisible()) await back.click();
        await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
      };
      await openSection("Headline");
      assert.equal(await page.getByRole("textbox", { name: "Headline", exact: true }).inputValue(), "Community festival from the public page");
      assert.equal(await page.getByLabel("Date", { exact: true }).inputValue(), "2027-05-03");
      assert.equal(await page.getByLabel("Venue", { exact: true }).inputValue(), "Riverside Park");
      await page.getByRole("textbox", { name: "Headline", exact: true }).fill("Community festival updated by the host");
      await page.getByLabel("Date", { exact: true }).fill("2027-06-14");
      await page.getByLabel("Venue", { exact: true }).fill("Host edited pavilion");
      await openSection("Details");
      await page.getByLabel("Description", { exact: true }).fill("Host notes: use the accessible north entrance and bring a blanket.");
      const assertPreservedFacts = row => {
        const data = row.editorSnapshot.data;
        assert.equal(data.title, "Community festival updated by the host");
        assert.equal(data.date, "2027-06-14"); assert.equal(data.venue, "Host edited pavilion");
        assert.equal(data.details, "Host notes: use the accessible north entrance and bring a blanket.");
        assert.equal(row.source.url, "https://school.test/pages/831?view=public");
        assert.match(row.sourceText, /Facts read from the actual submitted source/);
      };
      await openSection("Design");
      const designGallery = page.getByRole("region", { name: "General event designs", exact: true });
      await designGallery.waitFor();
      assert.equal(await designGallery.getByRole("button", { name: `Select ${designs[0].title}`, exact: true }).getAttribute("aria-pressed"), "true", "automatic import starts with the first compatible design");
      await designGallery.getByRole("button", { name: `Select ${designs[1].title}`, exact: true }).click();
      await waitForStored(async () => (await readGeneral())?.editorSnapshot?.themeId === designs[1].id, "changed General editor design");
      const changed = await readGeneral(); assertPreservedFacts(changed);
      assert.equal(changed.editorSnapshot.data.hero, designs[1].imageUrl, "selecting another catalogue design updates the catalogue artwork");
      await page.reload(); await waitForImportedEditor(); await openSection("Design");
      assert.equal(await designGallery.getByRole("button", { name: `Select ${designs[1].title}`, exact: true }).getAttribute("aria-pressed"), "true", "reload restores the selected design");
      assertPreservedFacts(await readGeneral());
      await page.getByRole("button", { name: "Back to details", exact: true }).click();
      await page.locator('input[type="file"][aria-label="Choose hero image"]').setInputFiles(file("host-general-artwork.png"));
      await waitForStored(async () => (await readGeneral())?.editorSnapshot?.data?.hero?.startsWith("data:image/png;base64,"), "uploaded General event artwork");
      const customHero = (await readGeneral()).editorSnapshot.data.hero;
      await openSection("Design");
      await designGallery.getByRole("button", { name: `Select ${designs[2].title}`, exact: true }).click();
      await waitForStored(async () => (await readGeneral())?.editorSnapshot?.themeId === designs[2].id, "General design change with custom artwork");
      const customDesign = await readGeneral(); assertPreservedFacts(customDesign);
      assert.equal(customDesign.editorSnapshot.data.hero, customHero, "choosing a design retains the host's uploaded hero image");
      await page.reload(); await waitForImportedEditor(); await openSection("Design");
      assert.equal(await designGallery.getByRole("button", { name: `Select ${designs[2].title}`, exact: true }).getAttribute("aria-pressed"), "true");
      assert.equal((await readGeneral()).editorSnapshot.data.hero, customHero);
      assertPreservedFacts(await readGeneral());
      await capture("general-editor-designs-desktop.png");
      assert.equal(extracts.length, readsBefore + 1, "design choices, local artwork and refresh never reparse the source");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
      await openCreate(`?intake=${encodeURIComponent(id)}&step=templates`); await templates.waitFor();
      await capture("url-templates-desktop.png");
    });

    // An inaccessible link can be replaced by pasted page text without resending the failing URL.
    await openUploadCreate(); await mode("Paste URL").click();
    await page.getByLabel("Public event URL", { exact: true }).fill("https://blocked.test/event/831");
    await click("Read event information"); await page.getByRole("alert").filter({ hasText: "That page could not be opened" }).waitFor();
    await click("Paste event text instead");
    await page.getByRole("textbox", { name: /^Paste event text/ }).fill("Maya's 7th birthday, May 3 at Riverside Park. Use the east entrance.");
    await waitForStored(() => page.evaluate(async () => { const row = await window.__creationBrowser.readCreationIntake("unified-host", new URL(location.href).searchParams.get("intake")); return row?.source.kind === "text" && row?.source.text.includes("Maya"); }), "pasted fallback source");
    const beforeFallback = extracts.length;
    await page.reload(); await page.getByRole("textbox", { name: /^Paste event text/ }).waitFor();
    assert.match(await page.getByRole("textbox", { name: /^Paste event text/ }).inputValue(), /east entrance/);
    await click("Read event information"); await waitForImportedEditor();
    assert.equal(extracts.length, beforeFallback + 1); assert.equal(extracts.at(-1).json.url, undefined);
    assert.match(extracts.at(-1).json.text, /Maya's 7th birthday/);
    assert.equal((await inspect()).title, "Maya's 7th birthday");

    await t.test("sports uploads open their editors directly and retain durable import identity for retry and cancellation", async () => {
      sportsDiscoveryActive = true;
      const readIntake = id => page.evaluate(async id => { const row = await window.__creationBrowser.readCreationIntake("unified-host", id); return row ? { ...row, source: { ...row.source, files: row.source.files.map(file => ({ name: file.name, size: file.size })) } } : null; }, id);
      const intakePosts = () => discoveryRequests.filter(request => request.path === "/api/discovery/intake" && request.method === "POST");
      const cancellationBaseline = discoveryRequests.filter(request => request.path === "/api/discovery/intake" && request.method === "DELETE").length;
      const cancellations = () => discoveryRequests.filter(request => request.path === "/api/discovery/intake" && request.method === "DELETE").slice(cancellationBaseline);
      try {
        for (const sport of ["gymnastics", "football"]) {
          await openUploadCreate();
          const readsBefore = extracts.length, postsBefore = intakePosts().length, uploadsBefore = sportsSourceUploads.length;
          const bytes = Buffer.from(`%PDF-1.4\nOriginal ${sport} event packet\n%%EOF`);
          await uploadFiles({ name: `${sport}-packet.pdf`, mimeType: "application/pdf", buffer: bytes });
          const id = await waitForImportedEditor(), imported = await readIntake(id), destination = new URL(page.url());
          const firstDesign = await page.evaluate(sport => window.__creationBrowser.getCreationTemplates({ category: "sports", sport })[0].id, sport);
          assert.equal(destination.pathname, `/event/${sport}/customize`);
          assert.equal(destination.searchParams.get("edit"), imported.discoveryEventId);
          assert.equal(destination.searchParams.get("templateId"), firstDesign, "the first compatible design opens automatically and remains changeable in the editor");
          assert.equal(imported.selectedTemplateId, firstDesign); assert.equal(imported.source.files[0].size, bytes.length);
          assert.equal(extracts.length, readsBefore + 1); assert.equal(intakePosts().length, postsBefore, "sports sources are never uploaded a second time");
          assert.equal(sportsSourceUploads.length, uploadsBefore + 1);
          assert.equal(sportsSourceUploads.at(-1).clientIntakeId, id);
          assert.match(sportsSourceUploads.at(-1).raw, new RegExp(`Original ${sport} event packet`));
          assert.equal(discoveryEvents.get(imported.discoveryEventId).runCount, 1);
          assert.equal(cancellations().length, 0, "successful automatic editor handoffs never cancel their durable import");
        }

        await openUploadCreate();
        const beforeRetryRead = extracts.length, beforeRetryPost = intakePosts().length;
        await uploadFiles({ name: "retry-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nRetained gymnastics packet for retry\n%%EOF") });
        await page.getByRole("alert").filter({ hasText: "Schedule importer temporarily unavailable." }).waitFor();
        await templates.waitFor();
        const failedId = new URL(page.url()).searchParams.get("intake"), failed = await readIntake(failedId);
        assert.ok(failed.discoveryEventId, "the durable event identity is retained before starting structured parsing");
        assert.equal(intakePosts().length, beforeRetryPost); assert.equal(cancellations().length, 0);
        await page.waitForTimeout(350);
        assert.equal(discoveryEvents.get(failed.discoveryEventId).runCount, 1, "a transient import failure waits for an explicit retry");
        await click("Continue to editor");
        assert.equal(await waitForImportedEditor(), failedId);
        assert.equal(new URL(page.url()).searchParams.get("edit"), failed.discoveryEventId);
        assert.equal(discoveryEvents.get(failed.discoveryEventId).runCount, 2);
        assert.equal(intakePosts().length, beforeRetryPost, "retry resumes the same shell without importing another source");
        assert.equal(extracts.length, beforeRetryRead + 1, "retry reuses parsed source details");

        await openUploadCreate();
        await uploadFiles({ name: "retry-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nChoose a different sport after importer failure\n%%EOF") });
        await page.getByRole("alert").filter({ hasText: "Schedule importer temporarily unavailable." }).waitFor();
        await templates.waitFor();
        const oldSportId = new URL(page.url()).searchParams.get("intake");
        await templates.getByRole("combobox", { name: "Event type", exact: true }).selectOption("sports:football");
        const newSportId = await waitForImportedEditor();
        assert.notEqual(newSportId, oldSportId, "a corrected sport receives a fresh durable identity before reading");
        assert.equal(new URL(page.url()).pathname, "/event/football/customize");
        assert.equal(discoveryEvents.get((await readIntake(newSportId)).discoveryEventId).sport, "football");

        await openUploadCreate();
        await uploadFiles({ name: "lost-response-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nOriginal source whose response was interrupted\n%%EOF") });
        await page.getByRole("alert").filter({ hasText: "Retry to resume your source" }).waitFor();
        const interruptedId = new URL(page.url()).searchParams.get("intake");
        assert.ok(discoveryIntakes.has(interruptedId), "the server may retain a shell before its result reaches the browser");
        await click("Remove lost-response-gymnastics.pdf");
        await uploadFiles({ name: "replacement-football.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nReplacement football source\n%%EOF") });
        const replacementId = await waitForImportedEditor();
        assert.notEqual(replacementId, interruptedId, "replacing an unrecognized submitted source never recovers the old file's shell");
        assert.equal(new URL(page.url()).pathname, "/event/football/customize");

        await openUploadCreate();
        const beforeCancelRead = extracts.length;
        await uploadFiles({ name: "cancel-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nRetained gymnastics cancellation packet\n%%EOF") });
        await waitForStored(() => [...discoveryEvents.values()].some(state => state.raw.includes("cancel-gymnastics.pdf") && state.runCount === 1), "active automatic gymnastics import");
        const cancelledId = new URL(page.url()).searchParams.get("intake"), cancelled = await readIntake(cancelledId);
        await click("Cancel import"); await templates.waitFor();
        assert.equal(cancellations().at(-1).clientIntakeId, cancelledId, "explicit cancellation targets the same durable intake identity");
        assert.equal(discoveryEvents.get(cancelled.discoveryEventId).cancelled, true);
        const retainedId = new URL(page.url()).searchParams.get("intake"), retained = await readIntake(retainedId);
        assert.notEqual(retainedId, cancelledId, "a cancelled import gets a fresh identity for a future attempt");
        assert.equal(retained.source.files[0].name, "cancel-gymnastics.pdf");
        assert.match(retained.sourceText, /Spring gymnastics meet/);
        await page.waitForTimeout(350);
        assert.equal(discoveryEvents.get(cancelled.discoveryEventId).runCount, 1, "cancellation does not automatically resume structured parsing");
        assert.equal(extracts.length, beforeCancelRead + 1);

        await openUploadCreate();
        const beforeAmbiguousPosts = intakePosts().length;
        await uploadFiles(file("ambiguous-sport.png"));
        await templates.waitFor();
        await page.getByText("Choose the sport above to see its matching designs and schedule tools.", { exact: true }).waitFor();
        assert.equal(await templates.locator("[data-template-masonry-card]").count(), 0, "ambiguous sports never silently become football");
        assert.equal(intakePosts().length, beforeAmbiguousPosts, "structured import waits only for an ambiguous sport to be clarified");
        const beforeSportChoice = extracts.length;
        await page.getByRole("combobox", { name: /Event type/ }).selectOption("sports:gymnastics");
        await waitForImportedEditor();
        assert.equal(new URL(page.url()).pathname, "/event/gymnastics/customize");
        assert.equal(intakePosts().length, beforeAmbiguousPosts + 1, "choosing the sport starts structured parsing without a template click");
        assert.equal(extracts.length, beforeSportChoice, "clarifying the sport retains source facts without another extraction");
        assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
      } finally { sportsDiscoveryActive = false; }
    });

    // Recognition remains truthful for restricted accounts, and requesting access keeps the source.
    restricted = true; await openUploadCreate(); await mode("Upload").click();
    await uploadFiles(file("wedding-flyer.png"));
    await templates.waitFor();
    await page.getByText("This event type isn’t available for your account.", { exact: true }).waitFor();
    const restrictedSource = await inspect(); assert.equal(restrictedSource.title, "Taylor and Casey's wedding"); assert.equal(restrictedSource.file, "wedding-flyer.png");
    await page.getByRole("link", { name: "Request access", exact: true }).click(); await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/settings");
    await openCreate(`?intake=${restrictedSource.id}&step=templates`); await templates.waitFor();
    assert.deepEqual(await inspect(), restrictedSource, "requesting access never discards the source or changes recognition");
    assert.equal(forbidden.length, 0);
    assert.deepEqual(errors, []);
    await t.test("gallery PDF uploads parse immediately and explicit custom designs survive refresh", async () => {
      restricted = false;
      await page.goto(`${base}/gallery?d=2027-06-04`);
      const beforeGalleryExtracts = extracts.length;
      await page.getByRole("button", { name: "Upload event information", exact: true }).waitFor();
      const galleryPicker = page.locator('input[type="file"][aria-label="Upload event information"]');
      assert.match(await galleryPicker.getAttribute("accept"), /application\/pdf/);
      const packetBytes = Buffer.from("%PDF-1.4\nSource event packet bytes\n%%EOF");
      await galleryPicker.setInputFiles({ name: "event-packet.pdf", mimeType: "application/pdf", buffer: packetBytes });
      await openImportedDesigns();
      const imported = await inspect();
      assert.equal(imported.file, "event-packet.pdf"); assert.equal(imported.fileBytes, packetBytes.length); assert.match(imported.notes, /2027-06-04/);
      assert.equal(new URL(page.url()).pathname, "/create"); assert.equal(new URL(page.url()).searchParams.get("step"), "templates");
      assert.equal(extracts.length, beforeGalleryExtracts + 1, "gallery file selection starts exactly one read without a submit action");
      assert.match(extracts.at(-1).raw, /event-packet.pdf/); assert.match(extracts.at(-1).raw, /Source event packet bytes/);
      assert.equal(forbidden.length, 0);
      await page.reload(); await templates.waitFor();
      assert.deepEqual(await inspect(), imported, "refresh restores the gallery upload and parsed facts");
      assert.equal(extracts.length, beforeGalleryExtracts + 1, "refreshing parsed gallery facts does not read the PDF again");
      await click("Back to your information");
      await page.getByRole("list", { name: "Selected files" }).getByText("event-packet.pdf", { exact: true }).waitFor();
      assert.equal(new URL(page.url()).searchParams.get("step"), "source");
      assert.equal(extracts.length, beforeGalleryExtracts + 1, "returning to the gallery source leaves parsing stopped");
      await page.reload(); await page.getByRole("list", { name: "Selected files" }).getByText("event-packet.pdf", { exact: true }).waitFor();
      assert.equal((await inspect()).fileBytes, packetBytes.length);
      await page.getByRole("button", { name: "Parse files", exact: true }).waitFor();
      assert.equal(extracts.length, beforeGalleryExtracts + 1, "refreshing the source does not restart its consumed upload handoff");

      await page.goto(`${base}/gallery?d=2027-06-04&customTheme=1`);
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Describe your event and design", { exact: true }).fill("A garden birthday with botanical artwork and warm paper");
      explicitCustomDesign = true;
      await dialog.getByRole("button", { name: "Create with Envitefy", exact: true }).click();
      await dialog.getByRole("button", { name: "Use this design", exact: true }).waitFor();
      assert.equal(generatedDesigns.length, 1, "custom generation starts only from the explicit design action");
      await dialog.getByRole("button", { name: "Use this design", exact: true }).click();
      await page.locator("[data-custom-editor] [data-event-page-editor]").waitFor();
      const customId = new URL(page.url()).searchParams.get("intake"); assert.ok(customId); assert.equal(new URL(page.url()).searchParams.has("themePreview"), false);
      const readCustom = () => page.evaluate(id => window.__creationBrowser.readCreationIntake("unified-host", id), customId);
      const custom = await readCustom(); assert.equal(custom.customPage.details.date, "2027-06-04"); assert.equal(custom.customPage.details.title, "Garden birthday chosen by the host");
      await page.reload(); await page.locator("[data-custom-editor] [data-event-page-editor]").waitFor();
      assert.match(await page.locator("[data-custom-editor]").innerText(), /Garden birthday chosen by the host/);
      assert.equal((await readCustom()).customPage.details.date, "2027-06-04"); assert.equal(generatedDesigns.length, 1, "refresh restores the approved artwork without generation");
      explicitCustomDesign = false; assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });
    await t.test("calendar-selected dates reach manual native editors without provider work and never replace imported explicit dates", async () => {
      const readsBeforeManual = extracts.length, generatedBeforeManual = generatedDesigns.length;
      await openCreate("?d=2027-07-08"); await mode("Start from scratch").click();
      await click("Birthday"); await templates.waitFor();
      const manualDate = await page.evaluate(async () => (await window.__creationBrowser.readCreationIntake("unified-host", new URL(location.href).searchParams.get("intake")))?.information?.details.date);
      assert.equal(manualDate, "2027-07-08");
      const design = await page.evaluate(() => window.__creationBrowser.getCreationTemplates({ category: "birthdays", sport: null })[0]);
      await page.getByRole("button", { name: new RegExp(`^Select ${design.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).click();
      await openHeadline(); assert.equal(await page.getByLabel("Event Date", { exact: true }).inputValue(), "2027-07-08");
      assert.equal(extracts.length, readsBeforeManual, "calendar scratch creation reads no fact provider");
      assert.equal(generatedDesigns.length, generatedBeforeManual); assert.equal(forbidden.length, 0);

      await openCreate("?d=2027-07-08"); await mode("Upload").click();
      await uploadFiles(file("calendar-explicit-date.png"));
      await waitForImportedEditor();
      const importedDate = await page.evaluate(async () => (await window.__creationBrowser.readCreationIntake("unified-host", new URL(location.href).searchParams.get("intake")))?.information?.details.date);
      assert.equal(importedDate, "2027-05-03", "the explicit source date wins over the calendar context");
      assert.equal(extracts.length, readsBeforeManual + 1); assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });
    await t.test("My Events filters, query recovery, pagination, stale responses and cohost editing work on phones", async () => {
      workspaceMode = true; await page.goto(`${base}/events?view=drafts&ownership=owned&q=Maya`);
      await page.getByRole("heading", { name: "Draft Maya Birthday", exact: true }).waitFor();
      await assertPrimaryContrast(page.getByRole("link", { name: "Create an Event Page", exact: true }), "Workspace creation button");
      assert.equal(await page.getByLabel("Search events", { exact: true }).inputValue(), "Maya");
      assert.equal(await page.getByRole("combobox", { name: /Event ownership/ }).inputValue(), "owned");
      assert.equal(await page.getByRole("link", { name: "Drafts", exact: true }).getAttribute("aria-current"), "page");
      assert.equal(historyRequests.at(-1).kind, "drafts"); assert.equal(historyRequests.at(-1).relation, "owned");
      await page.reload(); await page.getByRole("heading", { name: "Draft Maya Birthday", exact: true }).waitFor();
      assert.equal(await page.getByLabel("Search events", { exact: true }).inputValue(), "Maya");
      await page.getByLabel("Search events", { exact: true }).fill("");
      await waitForStored(() => new URL(page.url()).searchParams.get("q") === null, "cleared workspace search URL");
      await page.getByRole("link", { name: "Schedules", exact: true }).click();
      await page.getByRole("heading", { name: "Eagles Football Season", exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 1);
      await page.getByRole("link", { name: "Sign-up Forms", exact: true }).click();
      await page.getByRole("heading", { name: "Volunteer Signup", exact: true }).waitFor();
      assert.match(await page.getByRole("link", { name: "View signups", exact: true }).getAttribute("href"), /^\/smart-signup-form\/school-volunteers#signup-host-dashboard$/);
      await page.getByRole("link", { name: "All events", exact: true }).click();
      await page.getByRole("combobox", { name: /Event ownership/ }).selectOption("invited");
      await page.getByRole("heading", { name: "Invited Concert", exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 1); assert.equal(await page.getByRole("button", { name: "Edit", exact: true }).count(), 0);
      await page.getByRole("combobox", { name: /Event ownership/ }).selectOption("all");
      await page.getByRole("button", { name: "Load more events", exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 3);
      await click("Load more events"); await page.getByRole("heading", { name: "Co-host Fundraiser", exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 6, "paginated duplicate identities are deduplicated");
      assert.equal(await page.getByRole("button", { name: "Load more events", exact: true }).count(), 0);
      for (const width of [320, 390]) { await page.setViewportSize({ width, height: 900 }); await assertNoOverflow(`My Events at ${width}px`); }
      await page.screenshot({ path: path.join(output, "events-390.png") });
      await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: path.join(output, "events-desktop.png") });
      const cohost = page.locator("article").filter({ has: page.getByRole("heading", { name: "Co-host Fundraiser", exact: true }) });
      await cohost.getByRole("button", { name: "Edit", exact: true }).click(); await page.locator("[data-destination]").waitFor();
      assert.equal(editRequests.at(-1), "cohost");
      assert.equal(new URL(page.url()).pathname, "/event/design/customize"); assert.equal(new URL(page.url()).searchParams.get("edit"), "cohost");
      await page.goto(`${base}/events`); await page.getByRole("heading", { name: "Community Picnic", exact: true }).waitFor();
      await page.evaluate(() => { window.__ignoreHistoryAbort = true; });
      await page.getByLabel("Search events", { exact: true }).fill("slow");
      await waitForStored(() => historyRequests.some(request => request.q === "slow"), "slow workspace request");
      await page.getByLabel("Search events", { exact: true }).fill("fast");
      await page.getByRole("heading", { name: "Fast Current Event", exact: true }).waitFor();
      await waitForStored(() => staleFinished, "stale workspace response");
      assert.equal(await page.getByRole("heading", { name: "Stale Slow Event", exact: true }).count(), 0);
      assert.equal(await page.getByRole("heading", { name: "Fast Current Event", exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Load more events", exact: true }).count(), 0, "stale pagination cannot replace the active search");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });
    await t.test("mounted My Events account switches hide prior cards and ignore an old account's delayed edit navigation", async () => {
      workspaceMode = true; workspaceAccountTest = true;
      await page.goto(`${base}/events`); await page.getByRole("heading", { name: "Community Picnic", exact: true }).waitFor();
      const firstOwnerCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Community Picnic", exact: true }) });
      await firstOwnerCard.getByRole("button", { name: "Edit", exact: true }).click();
      await waitForStored(() => delayedEditStarted, "old account edit request");
      await page.evaluate(() => window.__creationBrowser.setFixtureOwner("second-host"));
      await page.waitForFunction(() => !document.querySelector("article"));
      assert.equal(await page.getByRole("heading", { name: "Community Picnic", exact: true }).count(), 0, "previous owner's cards disappear before the next owner loads");
      assert.equal(new URL(page.url()).pathname, "/events");
      await page.getByRole("heading", { name: "Second Account Event", exact: true }).waitFor();
      await waitForStored(() => delayedEditFinished, "old account edit response");
      assert.equal(await page.locator("article").count(), 1); assert.equal(new URL(page.url()).pathname, "/events", "an edit response from the previous owner never opens an editor");
      assert.equal(await page.getByRole("heading", { name: "Community Picnic", exact: true }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Load more events", exact: true }).count(), 0);
      workspaceAccountTest = false; assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });
    await t.test("slow IndexedDB saves retain the newest pasted source across concurrent debounces and refresh", async () => {
      workspaceMode = false; await openUploadCreate(); await mode("Paste URL").click();
      await page.getByLabel("Public event URL", { exact: true }).fill("https://blocked.test/event/831");
      await click("Read event information"); await page.getByRole("alert").filter({ hasText: "That page could not be opened" }).waitFor();
      await click("Paste event text instead");
      await page.evaluate(() => { window.__idbOpenDelayMs = 500; window.__idbDelayedOpenCount = 0; });
      await pastedText().fill("First event text while browser storage is slow");
      // Delay the real IDB open callbacks, retaining real transactions and the actual account store.
      await page.waitForFunction(() => window.__idbDelayedOpenCount >= 2);
      await pastedText().fill("Newest event details entered during the first pending save");
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).some(row => row.source.kind === "text" && row.source.text === "Newest event details entered during the first pending save")), "latest queued source revision");
      await page.evaluate(() => { window.__idbOpenDelayMs = 0; });
      await page.waitForFunction(() => new URL(location.href).searchParams.has("intake"));
      await page.reload(); await pastedText().waitFor();
      assert.equal(await pastedText().inputValue(), "Newest event details entered during the first pending save");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });
    await t.test("changing accounts in the mounted Create screen clears prior source and pending browser writes", async () => {
      workspaceMode = false; await openUploadCreate(); await mode("Upload").click();
      await uploadFiles(file("private-first-account.png"));
      await openImportedDesigns();
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).some(row => row.source.files[0]?.name === "private-first-account.png")), "first account source");
      await click("Back to your information");
      await uploadFiles(file("private-trailing-change.png"));
      await page.evaluate(() => window.__creationBrowser.setFixtureOwner("second-host"));
      await mode("Upload").waitFor();
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length === 0), "retired account browser cleanup");
      assert.equal(await page.getByText("private-first-account.png", { exact: true }).count(), 0);
      assert.equal(await page.getByText("private-trailing-change.png", { exact: true }).count(), 0);
      assert.equal(await page.getByRole("list", { name: "Selected files" }).count(), 0, "new account begins with an empty source");
      assert.equal(await templates.count(), 0);
      await mode("Upload").click();
      await uploadFiles(file("second-account.png"));
      await waitForImportedEditor();
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("second-host")).some(row => row.source.files[0]?.name === "second-account.png")), "second account scoped source");
      const secondRows = await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("second-host")).map(row => ({ fileNames: row.source.files.map(file => file.name) })));
      assert.equal(secondRows.length, 1); assert.deepEqual(secondRows[0].fileNames, ["second-account.png"]);
      assert.equal(await page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length), 0, "old delayed callbacks cannot recreate the signed-out source");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });
  } catch (error) {
    console.error("Last browser route:", page.url(), "\n", await page.locator("body").innerText().catch(() => ""));
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
});
