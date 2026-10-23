const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const access = loadTs("src/lib/creation-access.ts");

test("legacy import processing and review stages remain private until explicit publication", () => {
  const drafts = loadTs("src/lib/event-draft-access.ts");
  for (const field of ["status", "draftStatus"]) for (const stage of ["processing", "review_ready", "failed_parse"]) {
    const data = { discoverySource: { workflow: "gymnastics" }, [field]: stage };
    assert.equal(drafts.isEventDraft(data), true);
    assert.equal(drafts.canReadEventDraft(data, "owner", null), false);
    assert.equal(drafts.canReadEventDraft(data, "owner", "unrelated"), false);
    assert.equal(drafts.canReadEventDraft(data, "owner", "owner"), true);
  }
  assert.equal(drafts.isEventDraft({ discoverySource: { workflow: "gymnastics" }, status: "published", draftStatus: "review_ready" }), false);
  assert.equal(drafts.isEventDraft({ status: "processing" }), false, "ordinary historical statuses retain their existing meaning");
  const sql = drafts.legacyDiscoveryDraftSql("data");
  assert.match(sql, /data->>'status'[\s\S]*in[\s\S]*or[\s\S]*data->>'draftStatus'[\s\S]*in/);
});

test("standard availability is independent of acquisition, hidden preferences and old product scopes", () => {
  const standard = access.resolveCreationAccess({ policy: "standard", categories: [], products: [], primarySignupSource: "gymnastics", visibleTemplateKeys: ["gymnastics"] });
  assert.equal(access.creationAllowed(standard, "event_page", "weddings"), true);
  assert.equal(access.creationAllowed(standard, "signup_form"), true);
  const restricted = access.resolveCreationAccess({ policy: "restricted", categories: ["gymnastics"], products: ["event_page"] });
  assert.equal(access.creationAllowed(restricted, "event_page", "sport_gymnastics_schedule"), true);
  assert.equal(access.creationAllowed(restricted, "event_page", "weddings"), false);
  assert.equal(access.creationAllowed(restricted, "snap"), false);
});
test("preferences select only granted categories and keep baby and bridal showers independent", () => {
  const restricted = access.resolveCreationAccess({ policy: "restricted", categories: ["soccer", "bridal-showers"], products: ["event_page"] });
  assert.deepEqual(access.filterCreationTemplateKeys(["general", "birthdays", "sport_events", "baby_showers", "bridal_showers"], restricted), ["sport_events", "bridal_showers"]);
  assert.deepEqual(restricted.allowedCategories, ["soccer", "bridal-showers"]);
  assert.deepEqual(access.approvedCreationPreferences({ visibleTemplateKeys: [] }, "category", "bridal-showers").visibleTemplateKeys, ["bridal_showers"]);
});
test("combined legacy shower visibility migrates once without overriding an independent remove choice", () => {
  const visibility = loadTs("src/config/feature-visibility.ts");
  assert.deepEqual(visibility.migrateAnniversaryTemplateKeys(["baby_showers"], 3), ["baby_showers", "bridal_showers"]);
  assert.deepEqual(visibility.migrateAnniversaryTemplateKeys(["baby_showers"], 4), ["baby_showers"]);
  assert.deepEqual(visibility.migrateAnniversaryTemplateKeys(["bridal_showers"], 4), ["bridal_showers"]);
  assert.equal(visibility.getTemplateDefByKey("bridal_showers").label, "Bridal Showers");
});
test("host structures outrank forged scan and received-invite flags", () => {
  assert.deepEqual(access.eventCreationRequirement({ createdVia: "ocr", ownership: "invited", category: "weddings", customEventPage: { version: 1, category: "birthdays" } }), { product: "event_page", categories: ["birthdays", "weddings"] });
  assert.equal(access.eventCreationRequirement({ createdVia: "scan", discoverySource: { workflow: "gymnastics" } }).product, "event_page");
  assert.equal(access.eventCreationRequirement({ ownership: "invited", signupForm: {} }).product, "signup_form");
  assert.deepEqual(access.eventCreationRequirement({ createdVia: "ocr", category: "Medical appointment", attachment: {} }), { product: "snap", categories: [] });
});
test("Live Card imports retain their source category and explicit changed types without coarse legacy labels", () => {
  assert.deepEqual(access.liveCardCreationCategories({ eventType: "General event", creationCategory: "gymnastics" }), ["gymnastics"]);
  assert.deepEqual(access.liveCardCreationCategories({ eventType: "Birthday", creationCategory: "gymnastics" }), ["gymnastics", "birthdays"]);
  assert.deepEqual(access.eventCreationRequirement({ createdVia: "livecard-builder", category: "Baby Shower", liveCardBuilder: { form: { eventType: "Gender reveal" } } }), { product: "live_card", categories: ["gender-reveal"] });
  assert.deepEqual(access.eventCreationRequirement({ createdVia: "livecard-builder", creationCategory: "gymnastics", category: "Custom Invite", liveCardBuilder: { form: { eventType: "General event" } } }), { product: "live_card", categories: ["gymnastics"] });
});
test("approval selects the requested category while preserving other interests and attribution", () => {
  const before = { visibleTemplateKeys: ["weddings"], signupAttribution: { intent: "weddings" }, sportPreferences: { primarySport: "football", enabledSports: ["football"], setupCompleted: true }, quickAccess: ["snap"] };
  const after = access.approvedCreationPreferences(before, "category", "gymnastics");
  assert.deepEqual(after.visibleTemplateKeys, ["weddings", "gymnastics"]);
  assert.deepEqual(after.sportPreferences.enabledSports, ["football", "gymnastics"]);
  assert.equal(after.sportPreferences.primarySport, "football");
  assert.deepEqual(after.signupAttribution, before.signupAttribution);
  assert.deepEqual(access.approvedCreationPreferences(before, "product", "signup_form").quickAccess, ["snap", "smart_signup"]);
  assert.deepEqual(before.visibleTemplateKeys, ["weddings"]);
});
function serverHarness({ policy = "restricted", categories = ["gymnastics"], products = ["event_page"], canEdit = true, requestStatus = "pending", discovery = null } = {}) {
  const calls = [];
  const event = { id: "saved", user_id: "owner", data: { createdVia: "custom-event-page", customEventPage: { version: 1, category: "weddings" } } };
  const query = async (sql, args) => {
    calls.push({ sql, args });
    if (sql.startsWith("SELECT policy")) return { rows: [{ policy, categories, products }] };
    if (sql.includes("SELECT * FROM creation_access_requests")) return { rows: [{ id: "request", user_id: "user", kind: "category", capability: "gymnastics", status: requestStatus }] };
    if (sql.startsWith("SELECT feature_visibility")) return { rows: [{ feature_visibility: { visibleTemplateKeys: ["weddings"] } }] };
    return { rows: [] };
  };
  const server = loadTs("src/lib/creation-access-server.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/db": { query, withClient: (callback) => callback({ query }), getEventHistoryById: async (id) => id === "saved" ? event : null, getEventDiscoveryByEventId: async () => discovery },
    "@/lib/event-collaboration": { getEventPermissions: async () => ({ canEdit }) },
  });
  return { server, calls, event };
}
test("restricted direct creation fails without provider work, while verified existing edits survive restrictions", async () => {
  const { server, calls } = serverHarness();
  await assert.rejects(server.requireCreationAccess("user", { product: "event_page", category: "weddings" }), /Request access/);
  calls.length = 0;
  await server.requireCreationAccess("user", { product: "event_page", category: "weddings", eventId: "saved" });
  assert.equal(calls.length, 0, "existing membership should not depend on new-create policy");
  await assert.rejects(server.requireCreationAccess("user", { product: "live_card", eventId: "saved" }), /existing editor/);
  await assert.rejects(server.requireCreationAccess("user", { product: "event_page", category: "birthdays", eventId: "saved" }), /does not match/);
});
test("new Live Card saves and provider operations enforce all imported and explicitly changed categories", async () => {
  const { server } = serverHarness({ products: ["live_card"] });
  const data = { createdVia: "livecard-builder", creationCategory: "gymnastics", liveCardBuilder: { form: { eventType: "General event" } } };
  await server.requireEventCreationAccess("user", data);
  await assert.rejects(server.requireEventCreationAccess("user", { ...data, liveCardBuilder: { form: { eventType: "Birthday" } } }), /Request access/);
  await assert.rejects(server.requireCreationAccess("user", { product: "live_card", categories: ["gymnastics", "birthdays"] }), /Request access/);
});
test("an arbitrary event identity or revoked co-host cannot be used as a new-create exemption", async () => {
  const { server } = serverHarness({ canEdit: false });
  await assert.rejects(server.requireCreationAccess("user", { product: "event_page", eventId: "saved" }), /editing access/);
  await assert.rejects(server.requireCreationAccess("user", { product: "event_page", eventId: "missing" }), /editing access/);
});
test("server-stamped unsaved discovery shells keep fresh grants despite forged client saved flags", async () => {
  const stamp = { version: 1, userId: "owner", product: "event_page", category: "weddings", authorizedAt: "2026-10-19T00:00:00.000Z" };
  const source = { type: "file", creationAuthorization: stamp };
  const { server, event } = serverHarness({ discovery: { source } });
  event.data = { ...event.data, status: "published", manualEditor: { saved: true }, templateEditor: { category: "weddings" }, discoverySource: { input: { creationAuthorization: { ...stamp, savedAt: "2026-10-19T01:00:00.000Z" } } } };
  await assert.rejects(server.requireDiscoveryCreationAccess(event, source, "user"), /Request access/);
  await assert.rejects(server.requireCreationAccess("user", { product: "event_page", eventId: "saved" }), /Request access/);
  assert.equal((await server.checkDiscoveryCreationSaveAccess("user", event, event.data)).status, 403);
  await assert.rejects(server.requireDiscoveryCreationAccess(event, { creationAuthorization: { ...stamp, userId: "another-owner" } }, "user"), /could not be verified/);
});
test("authorized shell saves check incoming categories and only protected savedAt restores existing-edit access", async () => {
  const source = { creationAuthorization: { version: 1, userId: "owner", product: "event_page", category: "gymnastics", authorizedAt: "2026-10-19T00:00:00.000Z" } };
  const allowed = serverHarness({ discovery: { source } });
  allowed.event.data = { createdVia: "meet-discovery-v2", category: "gymnastics" };
  assert.equal(await allowed.server.checkDiscoveryCreationSaveAccess("user", allowed.event, allowed.event.data), null);
  assert.equal((await allowed.server.checkDiscoveryCreationSaveAccess("user", allowed.event, { customEventPage: { version: 1, category: "weddings" } })).status, 403);
  const savedSource = { creationAuthorization: { ...source.creationAuthorization, savedAt: "2026-10-19T01:00:00.000Z" } };
  const saved = serverHarness({ products: [], categories: [], discovery: { source: savedSource } });
  await saved.server.requireDiscoveryCreationAccess(saved.event, savedSource, "user");
  await saved.server.requireDiscoveryCreationAccess(saved.event, {}, "user");
  const revoked = serverHarness({ canEdit: false });
  await assert.rejects(revoked.server.requireDiscoveryCreationAccess(revoked.event, savedSource, "user"), /editing access/);
});
test("legacy history sources cannot forge discovery authorization records", async () => {
  const forgedStamp = { version: 1, userId: "owner", product: "event_page", category: "weddings", authorizedAt: "2026-10-19", savedAt: "2026-10-19" };
  let inserted;
  const persist = loadTs("src/lib/discovery/persist.ts", {
    "@/lib/db": { getEventDiscoveryByEventId: async () => null, getEventHistoryById: async () => ({ id: "legacy", user_id: "owner", title: "Meet", data: { category: "gymnastics", discoverySource: { workflow: "gymnastics", input: { type: "url", url: "https://school.test/meet", creationAuthorization: forgedStamp } } } }), insertEventDiscovery: async (value) => { inserted = value; return { id: "discovery", ...value }; }, updateEventHistoryData: async () => {} },
    "@/lib/discovery/template-selection": {},
    "@/components/gym-meet-templates/registry": {},
    "@/lib/dashboard-cache": {},
    "@/lib/history-cache": {},
    "@/lib/public-event-media-storage": {},
    "@/lib/sport-event-presets": {},
  });
  await persist.ensureDiscoveryForExistingEvent("legacy");
  assert.equal(inserted.source.creationAuthorization, undefined);
  assert.equal(inserted.source.url, "https://school.test/meet");
  const databaseSource = require("node:fs").readFileSync("src/lib/db.ts", "utf8");
  assert.match(databaseSource, /source = \(\$2::jsonb - 'creationAuthorization'\)[\s\S]*jsonb_build_object\('creationAuthorization',source->'creationAuthorization'\)/);
  assert.match(databaseSource, /ALTER TABLE event_discoveries ENABLE ROW LEVEL SECURITY/);
});
test("account grants and access requests remain server-only in runtime schema and deployment migration", async () => {
  const { server, calls } = serverHarness();
  await server.getCreationAccess("user");
  const schema = calls.find((call) => call.sql.startsWith("CREATE TABLE")).sql;
  const migration = require("node:fs").readFileSync("prisma/manual_sql/20261019_creation_access.sql", "utf8");
  for (const sql of [schema, migration]) {
    for (const table of ["creation_account_access", "creation_access_requests"]) {
      assert.match(sql, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
    }
    for (const role of ["PUBLIC", "anon", "authenticated"]) assert.match(sql, new RegExp(`REVOKE ALL ON TABLE creation_account_access,\\s*creation_access_requests FROM ${role}`));
  }
});
test("approval and preference selection commit atomically, while stale review rolls back", async () => {
  const approved = serverHarness();
  await approved.server.ensureCreationAccessSchema();
  approved.calls.length = 0;
  await approved.server.reviewCreationAccessRequest("request", "approved", "admin@example.com");
  const transaction = approved.calls.filter((call) => !call.sql.startsWith("CREATE TABLE"));
  assert.equal(transaction[0].sql, "BEGIN");
  assert.equal(transaction.at(-1).sql, "COMMIT");
  const preferenceWrite = transaction.find((call) => call.sql.startsWith("UPDATE users"));
  assert.deepEqual(JSON.parse(preferenceWrite.args[1]).visibleTemplateKeys, ["weddings", "gymnastics"]);
  const stale = serverHarness({ requestStatus: "approved" });
  await assert.rejects(stale.server.reviewCreationAccessRequest("request", "approved", "admin@example.com"), /already been reviewed/);
  assert.equal(stale.calls.at(-1).sql, "ROLLBACK");
  assert.equal(stale.calls.some((call) => call.sql.startsWith("UPDATE creation_account_access")), false);
});
test("admin creation access endpoints reject non-admins before reading or changing grants", async () => {
  let called = false;
  const route = loadTs("src/app/api/admin/creation-access/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/admin/require-admin": { requireAdminSession: async () => { throw new Error("Forbidden"); }, adminErrorResponse: () => Response.json({ error: "Forbidden" }, { status: 403 }) },
    "@/lib/db": { getUserByEmail: async () => { called = true; } },
    "@/lib/creation-access-server": { getCreationAccess: async () => { called = true; }, listCreationAccessRequests: async () => { called = true; }, updateCreationAccountAccess: async () => { called = true; }, reviewCreationAccessRequest: async () => { called = true; } },
  });
  for (const method of ["GET", "POST", "PATCH"]) {
    assert.equal((await route[method](new Request("http://localhost/api/admin/creation-access", { method }))).status, 403);
  }
  assert.equal(called, false);
});
test("generation endpoint denies restricted categories before provider work and verifies saved edit context", async (t) => {
  const previous = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = "unit-test-only";
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; });
  const { server } = serverHarness();
  let providerCalls = 0;
  const route = loadTs("src/app/api/event-themes/generate/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "next-auth": { getServerSession: async () => ({ user: { email: "host@example.com" } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "user" },
    "@/lib/creation-access-server": { checkCreationAccess: server.checkCreationAccess },
    "@/lib/event-theme-generation": { EventThemeRequestError: class extends Error {}, parseEventThemeRequest: (value) => value, generateEventTheme: async () => { providerCalls++; return { theme: "verified" }; } },
  });
  const request = (eventId) => new Request("http://localhost/api/event-themes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "weddings", prompt: "Garden celebration", eventId }) });
  assert.equal((await route.POST(request())).status, 403);
  assert.equal(providerCalls, 0);
  assert.equal((await route.POST(request("missing"))).status, 403);
  assert.equal(providerCalls, 0);
  assert.equal((await route.POST(request("saved"))).status, 200);
  assert.equal(providerCalls, 1);
});
test("the legacy source classifier checks current product access before reading sources or paid work", async () => {
  const { server } = serverHarness({ products: [] });
  let providerCalls = 0;
  const route = loadTs("src/app/api/create/classify/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "next-auth": { getServerSession: async () => ({ user: { email: "host@example.com" } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "user" },
    "@/lib/creation-access-server": { checkCreationAccess: server.checkCreationAccess },
    "@/lib/create/classify-source": { CreateClassifyRequestError: class extends Error {}, parseCreateClassifyInput: (value) => value, classifyCreateSource: async () => { providerCalls++; return {}; } },
  });
  const response = await route.POST(new Request("http://localhost/api/create/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "A picnic on Saturday" }) }));
  assert.equal(response.status, 403);
  assert.equal(providerCalls, 0);
});
test("self-service settings and Reset cannot grant categories, products or account policy", async () => {
  const restricted = access.resolveCreationAccess({ policy: "restricted", categories: ["gymnastics"], products: ["event_page"] });
  let saved;
  const route = loadTs("src/app/api/user/feature-visibility/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": { getAuthenticatedRequestUser: async () => ({ ok: true, userId: "user", email: "user@example.com" }) },
    "@/lib/creation-access-server": { getCreationAccess: async () => restricted },
    "@/lib/db": { getFeatureVisibilityByEmail: async () => ({ feature_visibility: saved || { v: 3, visibleTemplateKeys: ["gymnastics"] } }), updateFeatureVisibilityByEmail: async (value) => { saved = value; } },
  });
  const response = await route.PUT(new Request("http://localhost/api/user/feature-visibility", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibleTemplateKeys: ["general", "weddings", "gymnastics"], defaultCreateIntent: "weddings", quickAccess: [], policy: "standard", allowedProducts: ["signup_form"] }) }));
  assert.equal(response.status, 200);
  assert.deepEqual(saved.visibleTemplateKeys, ["gymnastics"]);
  assert.equal(saved.defaultCreateIntent, null);
  assert.deepEqual(saved.quickAccess, []);
  assert.equal(saved.policy, undefined);
  assert.deepEqual(restricted.allowedProducts, ["event_page"]);
});

test("public template previews stay available but saved editor data never survives sign-out or a different account", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const ts = require("typescript");
  const code = ts.transpileModule(require("node:fs").readFileSync("src/components/event-create/CreationAccessBoundary.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const render = (status, email, eventId) => {
    let stateIndex = 0;
    const existing = { id: "saved", identity: "owner@example.com", allowed: true };
    const stubs = {
      react: { ...React, useState: (value) => [stateIndex++ === 0 ? existing : value, () => {}], useRef: () => ({ current: "owner@example.com:event_page:weddings:saved" }), useEffect: () => {}, useCallback: (callback) => callback },
      "next-auth/react": { useSession: () => ({ status, data: email ? { user: { email } } : null }) },
      "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
      "@/hooks/useCreationAccess": { useCreationAccess: () => ({ access: access.resolveCreationAccess({ policy: "restricted", categories: [], products: [] }), loading: false, error: "", reload: async () => {} }) },
      "@/lib/creation-access": access,
    };
    const module = { exports: {} };
    new Function("require", "module", "exports", code)((name) => stubs[name] || require(name), module, module.exports);
    const result = module.exports.default({ product: "event_page", category: "weddings", eventId, children: React.createElement("p", {}, "Private editor content") });
    return renderToStaticMarkup(result);
  };
  assert.match(render("unauthenticated", null, null), /Private editor content/, "public template preview");
  assert.match(render("authenticated", "owner@example.com", "saved"), /Private editor content/, "verified saved owner");
  assert.doesNotMatch(render("authenticated", "other@example.com", "saved"), /Private editor content/, "stale verified owner cannot admit another account");
  assert.doesNotMatch(render("unauthenticated", null, "saved"), /Private editor content/, "saved edits need current sign-in");
  assert.doesNotMatch(render("unauthenticated", "owner@example.com", "saved"), /Private editor content/, "stale session data cannot override signed-out status");
});

test("a previous account's cached grant snapshot is unavailable on the first render after account change", () => {
  const cached = access.resolveCreationAccess();
  const render = (email, status = "authenticated") => {
    let stateIndex = 0, refIndex = 0;
    const states = [{ identity: "owner@example.com", access: cached }, false, { identity: "", message: "" }];
    const refs = [0, null, "owner@example.com", { identity: "owner@example.com", signature: JSON.stringify(cached) }];
    const hook = loadTs("src/hooks/useCreationAccess.ts", {
      react: { useState: () => [states[stateIndex++], () => {}], useRef: () => ({ current: refs[refIndex++] }), useEffect: () => {}, useCallback: (callback) => callback },
      "next-auth/react": { useSession: () => ({ status, data: { user: { email } } }) },
      "./useFeatureVisibility": { notifyFeatureVisibilityChanged: () => {} },
    });
    return hook.useCreationAccess().access;
  };
  assert.equal(render("owner@example.com"), cached);
  assert.equal(render("other@example.com"), null);
  assert.equal(render("owner@example.com", "unauthenticated"), null);
});
