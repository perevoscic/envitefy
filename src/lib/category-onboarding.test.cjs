const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const ts = require("typescript");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");

const { buildSignupDefaults, normalizeCategoryOnboarding } = load("src/lib/signup-defaults.ts");
const { SIGNUP_INTENTS } = load("src/lib/signup-intent.ts");
const { resolveCreationAccess } = load("src/lib/creation-access.ts");
const { normalizeSportPreferences } = load("src/lib/sports-preferences.ts");

// Exercise the real JSONB patch builder without opening the application pool.
const source = ts.createSourceFile("db.ts", readFileSync("src/lib/db.ts", "utf8"), ts.ScriptTarget.Latest, true);
const update = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "updateFeatureVisibilityByEmail");
const updateCode = ts.transpileModule(update.getText(source), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function persistence(query) {
  const module = { exports: {} };
  new Function("module", "exports", "ensureUsersHasFeatureVisibilityColumn", "normalizeSportPreferences", "query", updateCode)(
    module, module.exports, async () => {}, normalizeSportPreferences, query,
  );
  return module.exports.updateFeatureVisibilityByEmail;
}

function harness({ metadata = {}, access = resolveCreationAccess(), authenticated = true, beforePatch } = {}) {
  const row = {
    id: "current-user",
    feature_visibility: {
      v: 4,
      visibleTemplateKeys: ["birthdays", "general", "sport_events"],
      ...metadata,
    },
  };
  const writes = [];
  let reads = 0;
  const save = persistence(async (sql, values) => {
    assert.match(sql, /coalesce\(feature_visibility, '\{\}'::jsonb\) \|\| \$2::jsonb/);
    assert.match(sql, /where email = \$1/);
    assert.equal(values[0], "current@example.test");
    beforePatch?.(row);
    const patch = JSON.parse(values[1]);
    writes.push(patch);
    row.feature_visibility = { ...row.feature_visibility, ...patch };
  });
  const route = load("src/app/api/user/feature-visibility/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/auth": {
      getAuthenticatedRequestUser: async () => authenticated
        ? { ok: true, email: "current@example.test", userId: row.id }
        : { ok: false },
    },
    "@/lib/db": {
      getFeatureVisibilityByEmail: async () => { reads += 1; return structuredClone(row); },
      getSportPreferenceSuggestionByEmail: async () => null,
      updateFeatureVisibilityByEmail: save,
    },
    "@/lib/creation-access-server": { getCreationAccess: async () => access },
  });
  return {
    row, writes, reads: () => reads,
    get: () => route.GET(new Request("http://localhost/api/user/feature-visibility")),
    put: (body) => route.PUT(new Request("http://localhost/api/user/feature-visibility", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })),
  };
}

test("only new generic homepage signup defaults request category onboarding", () => {
  for (const path of [undefined, null, "/", "/landing", "/landing/?auth=signup#account"]) {
    const defaults = buildSignupDefaults("snap", path);
    assert.equal(defaults.categoryOnboarding, "pending", String(path));
    assert.equal(defaults.defaultCreateIntent, null);
    assert.deepEqual(defaults.sportPreferences, { primarySport: null, enabledSports: [], setupCompleted: false });
    assert.ok(defaults.visibleTemplateKeys.includes("birthdays"));
    assert.ok(defaults.visibleTemplateKeys.includes("general"));
    assert.equal(Object.hasOwn(defaults, "pinnedCategoryIds"), false);
  }
  for (const path of ["/snap", "/invitation-maker", "/event/general", "/signup"]) {
    assert.equal(buildSignupDefaults("snap", path).categoryOnboarding, null, path);
  }
});

test("category-specific account defaults retain their existing interest and sport selection", () => {
  for (const intent of SIGNUP_INTENTS.filter((value) => value !== "snap")) {
    const defaults = buildSignupDefaults(intent, "/");
    assert.equal(defaults.categoryOnboarding, null, intent);
    assert.equal(defaults.defaultCreateIntent, intent);
  }
  for (const sport of ["football", "gymnastics"]) {
    assert.deepEqual(buildSignupDefaults(sport).sportPreferences, {
      primarySport: sport, enabledSports: [sport], setupCompleted: true,
    });
  }
  assert.deepEqual(buildSignupDefaults("birthdays").visibleTemplateKeys, ["birthdays"]);
  assert.deepEqual(buildSignupDefaults("weddings").visibleTemplateKeys, ["weddings"]);
});

test("email and Google account inserts persist the new homepage marker in the account creation statement", async () => {
  for (const name of ["createUserWithEmailPassword", "createOrUpdateOAuthUser"]) {
    const declaration = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
    const code = ts.transpileModule(declaration.getText(source), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const writes = [];
    const module = { exports: {} };
    const globals = {
      buildSignupDefaults,
      USER_SELECT_COLUMNS: "*",
      ensureUsersHasFeatureVisibilityColumn: async () => {},
      ensureUsersHasProductScopeColumns: async () => {},
      ensureUsersHasAvatarUrlColumn: async () => {},
      ensureUsersHasLegalPrivacyColumns: async () => {},
      getUserByEmail: async () => null,
      hashPassword: async () => "test-hash",
      productScopesForSignupSource: () => ["snap"],
      query: async (sql, values) => { writes.push({ sql, values }); return { rows: [{ id: "new-user" }] }; },
    };
    new Function("module", "exports", ...Object.keys(globals), code)(module, module.exports, ...Object.values(globals));
    await module.exports[name]({
      email: "new@example.test", password: "test-password", provider: "google", signupSource: "snap", signupPath: "/",
      legalAcceptance: { source: "test", termsVersion: "test", privacyVersion: "test", acceptedAt: "2026-10-27T12:00:00Z" },
    });
    assert.equal(writes.length, 1, name);
    assert.match(writes[0].sql, /insert into users/);
    assert.match(writes[0].sql, /legal_acceptance_metadata, feature_visibility/);
    assert.equal(JSON.parse(writes[0].values.at(-1)).categoryOnboarding, "pending", name);
  }
});

test("legacy or malformed stored status never requests onboarding", async () => {
  for (const value of [undefined, null, "", "unknown", true, {}, ["pending"]]) {
    assert.equal(normalizeCategoryOnboarding(value), null);
    const state = harness({ metadata: { categoryOnboarding: value } });
    assert.equal((await (await state.get()).json()).categoryOnboarding, null);
    assert.equal(state.writes.length, 0);
  }
  for (const value of ["pending", "completed", "skipped"]) {
    const state = harness({ metadata: { categoryOnboarding: value } });
    assert.equal((await (await state.get()).json()).categoryOnboarding, value);
  }
});

test("completion persists explicit choices and status together, filtering every choice through current grants", async () => {
  const access = resolveCreationAccess({ policy: "restricted", categories: ["birthdays", "general", "soccer"], products: ["event_page"] });
  const originalAccess = structuredClone(access);
  const state = harness({ access, metadata: {
    categoryOnboarding: "pending",
    signupAttribution: { intent: "snap", path: null },
  } });
  const response = await state.put({
    categoryOnboarding: "completed",
    pinnedCategoryIds: ["birthdays", "holidays-seasonal", "soccer", "football", "signup-forms", "unknown", "birthdays"],
    sportPreferences: { primarySport: "football", enabledSports: ["football", "soccer", "basketball"], setupCompleted: true },
  });
  assert.equal(response.status, 200);
  const payload = (await response.json()).featureVisibility;
  assert.equal(payload.categoryOnboarding, "completed");
  assert.deepEqual(payload.pinnedCategoryIds, ["birthdays", "holidays-seasonal", "soccer"]);
  assert.deepEqual(payload.sportPreferences, { primarySport: "soccer", enabledSports: ["soccer"], setupCompleted: true });
  assert.equal(state.writes.length, 1);
  assert.equal(state.writes[0].categoryOnboarding, "completed");
  assert.deepEqual(state.writes[0].pinnedCategoryIds, payload.pinnedCategoryIds);
  assert.deepEqual(state.row.feature_visibility.signupAttribution, { intent: "snap", path: null });
  assert.deepEqual(access, originalAccess);
  assert.equal(Object.hasOwn(state.writes[0], "allowedCategories"), false);
  assert.equal(Object.hasOwn(state.writes[0], "allowedProducts"), false);
  assert.equal((await (await state.get()).json()).categoryOnboarding, "completed");
});

test("a skipped introduction saves its dismissal while preserving absent, empty and existing favorites", async () => {
  for (const pinnedCategoryIds of [undefined, [], ["weddings", "football"]]) {
    const state = harness({ metadata: { categoryOnboarding: "pending", ...(pinnedCategoryIds === undefined ? {} : { pinnedCategoryIds }) } });
    assert.equal((await state.put({ categoryOnboarding: "skipped" })).status, 200);
    assert.equal(state.writes[0].categoryOnboarding, "skipped");
    assert.equal(Object.hasOwn(state.writes[0], "pinnedCategoryIds"), false);
    assert.deepEqual(state.row.feature_visibility.pinnedCategoryIds, pinnedCategoryIds);
    assert.equal((await (await state.get()).json()).categoryOnboarding, "skipped");
  }
});

test("unrelated writes preserve category status and pins, including changes committed after their initial read", async () => {
  const state = harness({
    metadata: { categoryOnboarding: "pending", pinnedCategoryIds: ["birthdays"] },
    beforePatch: (row) => {
      row.feature_visibility.categoryOnboarding = "completed";
      row.feature_visibility.pinnedCategoryIds = ["soccer"];
    },
  });
  const response = await state.put({ quickAccess: ["snap"] });
  assert.equal(response.status, 200);
  assert.equal(Object.hasOwn(state.writes[0], "categoryOnboarding"), false);
  assert.equal(Object.hasOwn(state.writes[0], "pinnedCategoryIds"), false);
  const payload = (await response.json()).featureVisibility;
  assert.equal(payload.categoryOnboarding, "completed");
  assert.deepEqual(payload.pinnedCategoryIds, ["soccer"]);
});

test("the updater preserves onboarding through non-onboarding calls without copying stale metadata", async () => {
  const writes = [];
  const save = persistence(async (sql, values) => writes.push({ sql, patch: JSON.parse(values[1]) }));
  await save({ email: "current@example.test", visibleTemplateKeys: ["birthdays"] });
  await save({ email: "current@example.test", visibleTemplateKeys: ["birthdays"], categoryOnboarding: "skipped" });
  assert.equal(Object.hasOwn(writes[0].patch, "categoryOnboarding"), false);
  assert.equal(writes[1].patch.categoryOnboarding, "skipped");
  assert.match(writes[0].sql, /coalesce\(feature_visibility, '\{\}'::jsonb\) \|\| \$2::jsonb/);
});

test("pending, null and malformed onboarding requests are rejected before preferences are read or written", async () => {
  for (const categoryOnboarding of ["pending", null, "", "complete", true, 1, {}, ["completed"]]) {
    const state = harness({ metadata: { categoryOnboarding: "pending" } });
    const response = await state.put({ categoryOnboarding, pinnedCategoryIds: ["birthdays"] });
    assert.equal(response.status, 400, JSON.stringify(categoryOnboarding));
    assert.equal(state.reads(), 0);
    assert.deepEqual(state.writes, []);
  }
});

test("onboarding updates require the authenticated account and cannot grant Event Pages or sports", async () => {
  const signedOut = harness({ authenticated: false });
  assert.equal((await signedOut.put({ categoryOnboarding: "completed" })).status, 401);
  assert.equal(signedOut.reads(), 0);
  assert.deepEqual(signedOut.writes, []);

  const state = harness({ access: resolveCreationAccess({ policy: "restricted", categories: ["birthdays", "football"], products: ["snap"] }) });
  const response = await state.put({
    categoryOnboarding: "completed",
    pinnedCategoryIds: ["birthdays", "football"],
    sportPreferences: { primarySport: "football", enabledSports: ["football"], setupCompleted: true },
  });
  const payload = (await response.json()).featureVisibility;
  assert.equal(payload.categoryOnboarding, "completed");
  assert.deepEqual(payload.pinnedCategoryIds, []);
  assert.deepEqual(payload.sportPreferences, { primarySport: null, enabledSports: [], setupCompleted: false });
  assert.deepEqual(payload.visibleTemplateKeys, []);
});

test("the preference hook exposes the saved status only for the account whose snapshot loaded", async () => {
  const slots = [];
  let index = 0;
  let identity = "first@example.test";
  let status = "authenticated";
  let savedStatus = "pending";
  const hooks = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], (value) => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
    },
    useRef(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useCallback: (callback) => callback,
    useEffect() {},
  };
  const { useFeatureVisibility } = load("src/hooks/useFeatureVisibility.ts", {
    react: hooks,
    "next-auth/react": { useSession: () => ({ data: { user: { email: identity } }, status }) },
    "@/lib/feature-visibility-client": {
      invalidateFeatureVisibility() {},
      loadFeatureVisibility: async () => ({ visibleTemplateKeys: ["birthdays"], categoryOnboarding: savedStatus }),
    },
  });
  const render = () => { index = 0; return useFeatureVisibility(); };
  let state = render();
  assert.equal(state.categoryOnboarding, null);
  await state.refresh();
  state = render();
  assert.equal(state.categoryOnboarding, "pending");
  identity = "second@example.test";
  state = render();
  assert.equal(state.categoryOnboarding, null);
  savedStatus = "completed";
  await state.refresh();
  state = render();
  assert.equal(state.categoryOnboarding, "completed");
  status = "unauthenticated";
  assert.equal(render().categoryOnboarding, null);
});
