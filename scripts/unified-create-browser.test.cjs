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
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/unified-create-auth.tsx"),
        "@/app/sidebar-context": path.resolve("scripts/fixtures/unified-create-auth.tsx"),
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
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(10000);
  const base = "http://localhost:43139", errors = [], extracts = [], forbidden = [];
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
      const asset = path.resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
      if (asset.startsWith(`${publicRoot}${path.sep}`) && fs.existsSync(asset) && fs.statSync(asset).isFile()) {
        const contentType = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".woff2": "font/woff2" }[path.extname(asset).toLowerCase()];
        if (contentType) return route.fulfill({ contentType, body: fs.readFileSync(asset) });
      }
      return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="#eee8f3"/></svg>' });
    }
    if (url.origin === base) return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}@font-face{font-family:"Inter";src:url("/fonts/birthday/inter.ttf") format("truetype");font-weight:100 900;font-display:swap}@font-face{font-family:"Playfair Display";src:url("/fonts/birthday/playfairdisplay.ttf") format("truetype");font-weight:100 900;font-display:swap}body{margin:0;--font-geist-sans:"Inter",system-ui,sans-serif;--font-playfair:"Playfair Display",Georgia,serif}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
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
  const openHeadline = async () => { await page.locator("[data-native-birthday] [data-event-page-editor]").waitFor(); if (!await page.getByLabel("Venue", { exact: true }).count()) await page.getByRole("button", { name: /^Headline/ }).click(); };
  const templates = page.getByRole("region", { name: "Matching event designs" });
  const suggestions = page.getByRole("region", { name: "Your event templates", exact: true });
  const inspiration = page.getByRole("complementary", { name: "Event page design inspiration", includeHidden: true });
  const setMenuPreferences = preferences => page.evaluate(preferences => window.__creationBrowser.setFixtureMenuPreferences(preferences), preferences);
  const reloadAccess = () => page.evaluate(() => window.dispatchEvent(new Event("envitefy:creation-access-updated")));
  const file = name => ({ name, mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
  const inspect = () => page.evaluate(async () => {
    const id = new URL(location.href).searchParams.get("intake");
    const value = id ? await window.__creationBrowser.readCreationIntake("unified-host", id) : null;
    return value ? { id: value.id, phase: value.phase, title: value.information?.details.title, venue: value.information?.details.venue, notes: value.source.text, file: value.source.files[0]?.name, fileBytes: value.source.files[0]?.size, sourceText: value.sourceText } : null;
  });
  const openCreate = async query => {
    await page.goto(`${base}/create${query || ""}`);
    await page.locator("[data-unified-create]").waitFor();
    await page.waitForFunction(() => {
      const mode = document.querySelector('[aria-label="How would you like to start?"] button');
      if (!mode) return !!document.querySelector('[aria-label="Matching event designs"]');
      return !mode.disabled && !!document.querySelector('[aria-label="Your event templates"], [aria-label="Choose an event type"] button');
    });
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
    const bounds = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
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
    return accessResponseGate = { promise, release, started: false, finished: false };
  };
  try {
    await openCreate();
    assert.equal(await modes.getByRole("button").count(), 3);
    assert.equal(await mode("Upload").getAttribute("aria-pressed"), "true", "a new visit starts with a usable upload task");
    await page.getByRole("button", { name: "Choose files", exact: true }).waitFor();
    assert.ok(await page.locator("[data-unified-create]").evaluate(element => getComputedStyle(element).getPropertyValue("--creation-ink").trim()), "fixture renders the complete creation CSS module");
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
      assert.equal(await page.getByRole("complementary", { name: "Event page design inspiration", includeHidden: true }).isVisible(), width > 1024, `${width}px inspiration adapts to available content width`);
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
      assert.equal(await inspiration.isVisible(), false, `${width}px keeps inspiration artwork out of the phone task flow`);
      const suggestionBoxes = await suggestions.getByRole("button", { name: /^(Birthdays|Baby Showers|Bridal Showers|General Events)$/ }).evaluateAll(elements => elements.map(element => {
        const { x, y, width, height } = element.getBoundingClientRect(); return { x, y, width, height };
      }));
      assert.ok(suggestionBoxes.length > 1, "the phone fixture has multiple enabled event templates");
      assert.ok(suggestionBoxes.every(box => box.height >= 44), `${width}px template choices retain usable touch targets`);
      assert.ok(suggestionBoxes.every((box, index) => index === 0 || box.y >= suggestionBoxes[index - 1].y + suggestionBoxes[index - 1].height - 1), `${width}px event templates stack vertically: ${JSON.stringify(suggestionBoxes)}`);
      assert.equal(await page.getByRole("button", { name: "Read event information", exact: true }).count(), 0, "uploads need no separate matching-designs submission");
      t.diagnostic(`${width}px initial upload action ends at ${Math.round(nextAction.y + nextAction.height)}px`);
      await capture(`source-initial-${width}.png`);
      if (width === 320) await page.screenshot({ path: path.join(output, "source-modes-320.png") });
    }
    await mode("Start from scratch").focus(); await page.keyboard.press("Enter");
    const manualTypes = page.getByRole("region", { name: "Choose an event type", exact: true });
    await manualTypes.waitFor();
    await assertNoOverflow("Manual categories at 390px"); await capture("source-manual-390.png");
    await page.setViewportSize({ width: 320, height: 900 }); await assertNoOverflow("Manual categories at 320px"); await capture("source-manual-320.png");
    await page.setViewportSize({ width: 1440, height: 1000 }); await capture("source-manual-desktop.png");
    await page.locator("#root").evaluate(parent => { parent.style.paddingLeft = "320px"; parent.style.boxSizing = "border-box"; });
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 }); await assertNoOverflow(`Manual categories beside a sidebar at ${width}px`);
      const columns = await manualTypes.getByRole("button", { name: "Birthday", exact: true }).evaluate(button => getComputedStyle(button.parentElement).gridTemplateColumns.split(/\s+/).filter(Boolean).length);
      assert.equal(columns, width === 1440 ? 3 : 2, `${width}px category columns follow available workspace width`);
      await capture(`manual-sidebar-${width}.png`);
    }
    await page.locator("#root").evaluate((parent, previous) => { if (previous === null) parent.removeAttribute("style"); else parent.setAttribute("style", previous); }, initialParentStyle);
    assert.equal(await manualTypes.getByRole("button", { name: "Baby shower", exact: true }).count(), 1);
    assert.equal(await manualTypes.getByRole("button", { name: "Bridal shower", exact: true }).count(), 1);
    await click("Bridal shower"); await templates.waitFor();
    assert.equal(await templates.getByRole("combobox").inputValue(), "bridal-showers:");
    assert.equal(extracts.length, 0, "Bridal selection retains its actual category without provider work");
    assert.equal(await modes.count(), 0, "source method controls leave the design-selection workspace");
    assert.deepEqual(errors, [], "combined Baby/Bridal preferences never produce duplicate React keys");
    await click("Back to your information");
    await click("Birthday"); await templates.waitFor();
    assert.equal(extracts.length, 0, "manual type selection reads no source and starts no AI work");
    assert.equal(forbidden.length, 0);
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 900 }); await assertNoOverflow(`Template cards at ${width}px`); }
    await capture("templates-390.png");
    await page.setViewportSize({ width: 1440, height: 1000 }); await capture("templates-desktop.png");

    await t.test("scratch creation keeps the original responsive gymnastics mosaic and loads designs while scrolling", async () => {
      const beforeScratchReads = extracts.length;
      await templates.getByRole("combobox", { name: "Event type", exact: true }).selectOption("sports:gymnastics");
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

    await t.test("account checks run behind usable source controls and selected files parse once access arrives", async () => {
      const before = extracts.length, gate = holdAccessResponse();
      try {
        await page.goto(`${base}/create`);
        await page.locator("[data-unified-create]").waitFor();
        await waitForStored(() => gate.started, "initial account access request");
        for (const button of await modes.getByRole("button").all()) assert.equal(await button.isEnabled(), true, "source modes remain usable during account checks");
        assert.equal(await page.getByText("Loading your workspace…", { exact: true }).count(), 0);
        assert.equal(await page.getByRole("button", { name: "Choose files", exact: true }).isEnabled(), true);
        await mode("Paste URL").click();
        const publicUrl = page.getByLabel("Public event URL", { exact: true });
        await publicUrl.fill("https://school.test/ready-while-access-loads");
        assert.equal(await publicUrl.inputValue(), "https://school.test/ready-while-access-loads");
        await mode("Upload").click();
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("background-access-flyer.png"));
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
            await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file(failure ? "failed-access-flyer.png" : "denied-access-flyer.png"));
            await page.getByRole("list", { name: "Selected files" }).waitFor();
            assert.equal(extracts.length, before);
            accessResponseGate = null; gate.release();
            if (failure) await page.getByRole("alert").getByText(accessResponseError, { exact: true }).waitFor();
            else await page.getByRole("heading", { name: "Event Pages aren’t enabled for this account.", exact: true }).waitFor();
            assert.equal(extracts.length, before, "an unverified or denied account never uploads or parses its waiting source");
            assert.equal(new URL(page.url()).pathname, "/create");
          } finally { accessResponseGate = null; gate.release(); }
        }
      } finally { allowedProducts = products; accessResponseError = ""; await openCreate(); }
    });

    await t.test("waiting reads respect Cancel and use only the latest accepted source", async () => {
      const before = extracts.length;
      let gate = holdAccessResponse();
      try {
        await page.goto(`${base}/create`);
        await waitForStored(() => gate.started, "account check before cancellation");
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("cancelled-before-access.png"));
        await page.getByRole("status").filter({ hasText: "Checking event access before reading…" }).waitFor();
        await click("Cancel");
        accessResponseGate = null; gate.release();
        await suggestions.waitFor();
        await page.getByRole("list", { name: "Selected files" }).getByText("cancelled-before-access.png", { exact: true }).waitFor();
        assert.equal(extracts.length, before, "Cancel retains the source without starting it after access arrives");

        gate = holdAccessResponse();
        await page.goto(`${base}/create`);
        await waitForStored(() => gate.started, "account check before source replacement");
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("replaced-before-access.png"));
        await click("Remove replaced-before-access.png");
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("latest-before-access.png"));
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
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("private-waiting-first-account.png"));
        await page.getByRole("list", { name: "Selected files" }).waitFor();
        accessResponseGate = null;
        await page.evaluate(() => window.__creationBrowser.setFixtureOwner("waiting-second-host"));
        await suggestions.waitFor();
        assert.equal(await page.getByRole("list", { name: "Selected files" }).count(), 0, "the second account never sees the first account's waiting source");
        gate.release();
        await waitForStored(() => gate.finished, "late first account access response");
        assert.equal(extracts.length, before, "neither the new grant nor the old late grant consumes the prior account's waiting file");
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("current-waiting-second-account.png"));
        await waitForImportedEditor();
        assert.equal(extracts.length, before + 1);
        assert.match(extracts.at(-1).raw, /current-waiting-second-account\.png/);
        assert.doesNotMatch(extracts.at(-1).raw, /private-waiting-first-account/);
      } finally { accessResponseGate = null; gate.release(); await openCreate(); }
    });

    await t.test("refocusing refreshes account access without hiding the form or resetting edits", async () => {
      await openCreate(); await mode("Paste URL").click();
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

    await t.test("enabled templates and inspiration intersect server category grants without fallback", async () => {
      const readsBefore = extracts.length;
      restricted = true; restrictedCategories = ["gymnastics", "football"];
      try {
        await openCreate();
        await setMenuPreferences({ visibleTemplateKeys: ["gymnastics", "football_season", "birthdays", "weddings"], sportPreferences: { setupCompleted: true, enabledSports: ["gymnastics", "football"], primarySport: "gymnastics" } });
        await suggestions.getByRole("button", { name: "Gymnastics", exact: true }).waitFor();
        assert.equal(await suggestions.getByRole("button", { name: "Football", exact: true }).count(), 1);
        for (const label of ["Birthdays", "Weddings", "Baby Showers", "Bridal Showers", "General Events"])
          assert.equal(await suggestions.getByRole("button", { name: label, exact: true }).count(), 0, `${label} is never suggested outside the current category grant`);
        assert.ok(["gymnastics", "football"].includes(await inspiration.getAttribute("data-creation-preview-category")), "inspiration uses a permitted enabled category");
        assert.ok(await inspiration.locator("img").count() > 0, "a permitted enabled category has real preview artwork");
        assert.equal(await suggestions.getByRole("link", { name: "Manage event types", exact: true }).count(), 0, "template shortcuts omit the bottom settings link");
        await capture("source-access-sports-desktop.png");
        await page.setViewportSize({ width: 390, height: 900 }); await assertNoOverflow("Sports-only source choices on phones");
        await capture("source-access-sports-390.png");
        await page.setViewportSize({ width: 1440, height: 1000 });

        await setMenuPreferences({ visibleTemplateKeys: [], sportPreferences: { setupCompleted: true, enabledSports: [], primarySport: null } });
        await page.waitForFunction(() => !document.querySelector('[aria-label="Event page design inspiration"] img'));
        assert.equal(await suggestions.getByRole("button", { name: /^(Gymnastics|Football|Birthdays|Weddings)$/ }).count(), 0, "empty preferences never fall back to arbitrary permitted categories");
        assert.equal(await inspiration.locator("img").count(), 0, "empty preferences keep the preview neutral");
        await suggestions.getByRole("button", { name: "Browse available event types", exact: true }).click();
        const manualTypes = page.getByRole("region", { name: "Choose an event type", exact: true });
        await manualTypes.getByRole("button", { name: "Gymnastics", exact: true }).waitFor();
        assert.equal(await manualTypes.getByRole("button", { name: "Football", exact: true }).count(), 1, "browse explicitly reveals available server-approved types");
        assert.equal(await manualTypes.getByRole("button", { name: "Birthday", exact: true }).count(), 0);
        assert.equal(extracts.length, readsBefore, "personalized suggestions and browsing start no parsing");
        assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
      } finally {
        restricted = false; restrictedCategories = ["birthdays"];
        await openCreate();
      }
    });

    await t.test("live preference, grant and account changes remove stale recommendations and artwork", async () => {
      restricted = true; restrictedCategories = ["birthdays", "football"];
      try {
        await openCreate();
        await setMenuPreferences({ visibleTemplateKeys: ["birthdays", "football_season"], sportPreferences: { setupCompleted: true, enabledSports: ["football"], primarySport: "football" } });
        await suggestions.getByRole("button", { name: "Birthdays", exact: true }).waitFor();
        await suggestions.getByRole("button", { name: "Football", exact: true }).waitFor();

        await setMenuPreferences({ visibleTemplateKeys: ["football_season"] });
        assert.equal(await suggestions.getByRole("button", { name: "Birthdays", exact: true }).count(), 0, "disabled preferences disappear in the mounted screen");
        assert.equal(await inspiration.getAttribute("data-creation-preview-category"), "football", "preview follows the remaining enabled sport");
        await setMenuPreferences({ hasLoadedPreferences: false, loading: true });
        assert.equal(await suggestions.getByRole("button", { name: "Football", exact: true }).count(), 0, "loading new preferences never retains category suggestions");
        assert.equal(await inspiration.locator("img").count(), 0, "loading new preferences keeps the preview neutral");
        await setMenuPreferences({ hasLoadedPreferences: true, loading: false });
        await suggestions.getByRole("button", { name: "Football", exact: true }).waitFor();

        restrictedCategories = ["birthdays"];
        await reloadAccess();
        await page.waitForFunction(() => {
          const upload = document.querySelector('[aria-label="How would you like to start?"] button');
          return upload && !upload.disabled && !document.querySelector('[aria-label="Event page design inspiration"] img');
        });
        assert.equal(await suggestions.getByRole("button", { name: "Football", exact: true }).count(), 0, "revoked categories disappear without a page reload");
        assert.equal(await inspiration.locator("img").count(), 0, "revoked preview art is not retained");

        await setMenuPreferences({ visibleTemplateKeys: ["birthdays", "football_season"] });
        await suggestions.getByRole("button", { name: "Birthdays", exact: true }).waitFor();
        allowedProducts = ["snap", "live_card", "signup_form"];
        await reloadAccess();
        await page.getByRole("heading", { name: "Event Pages aren’t enabled for this account.", exact: true }).waitFor();
        assert.equal(await suggestions.getByRole("button", { name: "Birthdays", exact: true }).count(), 0, "a category grant cannot bypass the Event Page product grant");
        assert.equal(await inspiration.locator("img").count(), 0, "no Event Page product grant means no category artwork");

        allowedProducts = ["snap", "live_card", "event_page", "signup_form"];
        await reloadAccess(); await suggestions.getByRole("button", { name: "Birthdays", exact: true }).waitFor();
        accessResponseDelay = 700; delayedAccessStarted = false; delayedAccessFinished = false;
        await reloadAccess(); await waitForStored(() => delayedAccessStarted, "old-account grant refresh");
        accessResponseDelay = 0; restrictedCategories = ["football"];
        await page.evaluate(() => window.__creationBrowser.setFixtureOwner("access-second-host"));
        await suggestions.getByRole("button", { name: "Birthdays", exact: true }).waitFor({ state: "hidden" });
        assert.equal(await suggestions.getByRole("button", { name: "Birthdays", exact: true }).count(), 0, "session changes hide the old account's suggestions immediately");
        await suggestions.getByRole("button", { name: "Football", exact: true }).waitFor();
        await waitForStored(() => delayedAccessFinished, "late old-account grant response");
        assert.equal(await suggestions.getByRole("button", { name: "Birthdays", exact: true }).count(), 0, "late old-account access never restores its suggestions");
        assert.equal(await inspiration.getAttribute("data-creation-preview-category"), "football", "late access never replaces the current account's preview");
        assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
      } finally {
        restricted = false; restrictedCategories = ["birthdays"]; accessResponseDelay = 0;
        allowedProducts = ["snap", "live_card", "event_page", "signup_form"];
        await openCreate();
      }
    });

    await t.test("unfinished creation resumes from Drafts while Create omits the recovery banner and footer", async () => {
      const title = "2027 Women's Invitational Championship and Regional Community Celebration with Extended Meet Details";
      await openCreate();
      const intakeId = await page.evaluate(async title => {
        const browser = window.__creationBrowser;
        const record = browser.createCreationIntake("unified-host", { kind: "scratch", files: [], text: "" });
        await browser.writeCreationIntake({ ...record, sourceText: title, information: { version: 1, kind: "information", category: "general", details: { title } } });
        return record.id;
      }, title);
      await openCreate();
      assert.equal(await page.getByRole("region", { name: "Continue creating", exact: true }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Resume", exact: true }).count(), 0);
      assert.equal(await page.getByText("A beautiful beginning for every occasion.", { exact: true }).count(), 0);
      assert.equal(await suggestions.getByRole("link", { name: "Manage event types", exact: true }).count(), 0);
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

    await t.test("Bridal-only accounts keep the Bridal shortcut and one manual choice through the legacy Baby route", async () => {
      restricted = true; restrictedCategories = ["bridal-showers"];
      try {
        await openCreate();
        assert.equal(await page.getByRole("button", { name: "Bridal Showers", exact: true }).count(), 1);
        assert.equal(await page.getByRole("button", { name: "Baby Showers", exact: true }).count(), 0);
        await mode("Start from scratch").click();
        assert.equal(await manualTypes.getByRole("button", { name: "Bridal shower", exact: true }).count(), 1);
        assert.equal(await manualTypes.getByRole("button", { name: "Baby shower", exact: true }).count(), 0);
        await click("Bridal shower"); await templates.waitFor();
        assert.equal(await templates.getByRole("combobox").inputValue(), "bridal-showers:");
        assert.deepEqual(errors, []);
      } finally { restricted = false; restrictedCategories = ["birthdays"]; }
    });

    await t.test("switching input methods retains recognized upload and unsubmitted URL sources without reading again", async () => {
      const beforeSwitchReads = extracts.length;
      await openCreate();
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("mode-switch-flyer.png"));
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
      // Do not wait for the 250ms source debounce: the shortcut must retain the newest input itself.
      await click("Birthdays"); await templates.waitFor();
      assert.equal(await templates.getByRole("combobox").inputValue(), "birthdays:");
      await click("Back to your information"); await mode("Paste URL").click();
      assert.equal(await page.getByLabel("Public event URL", { exact: true }).inputValue(), "https://school.test/newest-source?keep=latest", "template shortcuts preserve the most recent URL before debounce");
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).some(row => row.source.url === "https://school.test/newest-source?keep=latest")), "shortcut recovery with the latest source URL");
      await mode("Upload").click();
      await page.getByRole("list", { name: "Selected files" }).getByText("mode-switch-flyer.png", { exact: true }).waitFor();
      assert.equal(extracts.length, beforeSwitchReads + 1, "changing methods or using a template shortcut never repeats extraction");
      assert.equal(forbidden.length, 0); assert.deepEqual(errors, []);
    });

    await t.test("uploads parse immediately, retain retry control, and ignore cancelled responses", async () => {
      await openCreate();
      const beforeInvalid = extracts.length;
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(Array.from({ length: 6 }, (_, index) => file(`too-many-${index}.png`)));
      await page.getByRole("alert").filter({ hasText: "Choose one PDF or up to five photos." }).waitFor();
      assert.equal(extracts.length, beforeInvalid, "invalid file selections never start parsing");

      const beforeDrop = extracts.length;
      const dataTransfer = await page.evaluateHandle(() => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["%PDF-1.4\nDropped source bytes\n%%EOF"], "dropped-packet.pdf", { type: "application/pdf" }));
        return transfer;
      });
      await page.getByRole("heading", { name: "Drop your flyer or PDF here", exact: true }).locator("..").dispatchEvent("drop", { dataTransfer });
      await dataTransfer.dispose();
      await waitForImportedEditor();
      assert.equal(extracts.length, beforeDrop + 1, "dropping a PDF starts one read without a submit action");
      assert.match(extracts.at(-1).raw, /dropped-packet.pdf/);
      assert.equal((await inspect()).file, "dropped-packet.pdf");

      await openCreate();
      const beforeFailure = extracts.length;
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("retry-flyer.png"));
      await page.getByRole("alert").filter({ hasText: "The source reader is temporarily unavailable." }).waitFor();
      await page.getByRole("list", { name: "Selected files" }).getByText("retry-flyer.png", { exact: true }).waitFor();
      await page.waitForTimeout(450);
      assert.equal(extracts.length, beforeFailure + 1, "a failed read does not automatically retry in a loop");
      await click("Retry parsing"); await waitForImportedEditor();
      assert.equal(extracts.length, beforeFailure + 2, "retry starts exactly one fresh read of the retained file");
      assert.match(extracts.at(-1).raw, /retry-flyer.png/);

      await openCreate();
      const beforeCancelled = extracts.length;
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("cancelled-flyer.png"));
      await waitForStored(() => releaseCancelledRead !== null, "delayed upload reader");
      await page.getByRole("status").filter({ hasText: "Finding your event details" }).waitFor();
      await click("Cancel reading");
      await page.getByRole("list", { name: "Selected files" }).getByText("cancelled-flyer.png", { exact: true }).waitFor();
      await page.waitForTimeout(350);
      assert.equal(extracts.length, beforeCancelled + 1, "cancelled reading remains stopped until the host chooses another action");
      await click("Remove cancelled-flyer.png");
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("elliot-flyer.png"));
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
      await openCreate();
      const beforeRead = extracts.length;
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("uncertain-flyer.png"));
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
    await page.setViewportSize({ width: 1440, height: 1000 }); await openCreate(); await mode("Upload").click();
    const readsBeforeOriginal = extracts.length;
    await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("maya-flyer.png"));
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
    await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("elliot-flyer.png"));
    await waitForImportedEditor();
    const replacement = await inspect(); assert.notEqual(replacement.id, original.id); assert.equal(replacement.title, "Elliot's 9th birthday"); assert.equal(replacement.venue, "Meadow Hall");
    assert.ok(!replacement.sourceText.includes("Maya"));

    await t.test("URL imports enter the General editor and changing designs preserves facts, notes and uploaded artwork", async () => {
      await openCreate(); await mode("Paste URL").click();
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
    await openCreate(); await mode("Paste URL").click();
    await page.getByLabel("Public event URL", { exact: true }).fill("https://blocked.test/event/831");
    await click("Read event information"); await page.getByRole("alert").filter({ hasText: "That page could not be opened" }).waitFor();
    await click("Can’t open the link? Paste the event text instead");
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
          await openCreate();
          const readsBefore = extracts.length, postsBefore = intakePosts().length, uploadsBefore = sportsSourceUploads.length;
          const bytes = Buffer.from(`%PDF-1.4\nOriginal ${sport} event packet\n%%EOF`);
          await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles({ name: `${sport}-packet.pdf`, mimeType: "application/pdf", buffer: bytes });
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

        await openCreate();
        const beforeRetryRead = extracts.length, beforeRetryPost = intakePosts().length;
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles({ name: "retry-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nRetained gymnastics packet for retry\n%%EOF") });
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

        await openCreate();
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles({ name: "retry-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nChoose a different sport after importer failure\n%%EOF") });
        await page.getByRole("alert").filter({ hasText: "Schedule importer temporarily unavailable." }).waitFor();
        await templates.waitFor();
        const oldSportId = new URL(page.url()).searchParams.get("intake");
        await templates.getByRole("combobox", { name: "Event type", exact: true }).selectOption("sports:football");
        const newSportId = await waitForImportedEditor();
        assert.notEqual(newSportId, oldSportId, "a corrected sport receives a fresh durable identity before reading");
        assert.equal(new URL(page.url()).pathname, "/event/football/customize");
        assert.equal(discoveryEvents.get((await readIntake(newSportId)).discoveryEventId).sport, "football");

        await openCreate();
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles({ name: "lost-response-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nOriginal source whose response was interrupted\n%%EOF") });
        await page.getByRole("alert").filter({ hasText: "Retry to resume your source" }).waitFor();
        const interruptedId = new URL(page.url()).searchParams.get("intake");
        assert.ok(discoveryIntakes.has(interruptedId), "the server may retain a shell before its result reaches the browser");
        await click("Remove lost-response-gymnastics.pdf");
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles({ name: "replacement-football.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nReplacement football source\n%%EOF") });
        const replacementId = await waitForImportedEditor();
        assert.notEqual(replacementId, interruptedId, "replacing an unrecognized submitted source never recovers the old file's shell");
        assert.equal(new URL(page.url()).pathname, "/event/football/customize");

        await openCreate();
        const beforeCancelRead = extracts.length;
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles({ name: "cancel-gymnastics.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nRetained gymnastics cancellation packet\n%%EOF") });
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

        await openCreate();
        const beforeAmbiguousPosts = intakePosts().length;
        await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("ambiguous-sport.png"));
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
    restricted = true; await openCreate(); await mode("Upload").click();
    await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("wedding-flyer.png"));
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
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("calendar-explicit-date.png"));
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
      workspaceMode = false; await openCreate(); await mode("Paste URL").click();
      await click("Can’t open the link? Paste the event text instead");
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
      workspaceMode = false; await openCreate(); await mode("Upload").click();
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("private-first-account.png"));
      await openImportedDesigns();
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).some(row => row.source.files[0]?.name === "private-first-account.png")), "first account source");
      await click("Back to your information");
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("private-trailing-change.png"));
      await page.evaluate(() => window.__creationBrowser.setFixtureOwner("second-host"));
      await mode("Upload").waitFor();
      await waitForStored(() => page.evaluate(async () => (await window.__creationBrowser.listCreationIntakes("unified-host")).length === 0), "retired account browser cleanup");
      assert.equal(await page.getByText("private-first-account.png", { exact: true }).count(), 0);
      assert.equal(await page.getByText("private-trailing-change.png", { exact: true }).count(), 0);
      assert.equal(await page.getByRole("list", { name: "Selected files" }).count(), 0, "new account begins with an empty source");
      assert.equal(await templates.count(), 0);
      await mode("Upload").click();
      await page.locator('input[type="file"][aria-label="Upload event information"]').setInputFiles(file("second-account.png"));
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
