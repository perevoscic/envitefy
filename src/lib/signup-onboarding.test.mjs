import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function evaluate(source, filename, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      let target = name.startsWith("@/")
        ? path.resolve("src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      if (!path.extname(target)) target += existsSync(`${target}.ts`) ? ".ts" : ".tsx";
      return load(target, mocks);
    }
    return require(name);
  };
  new Function("require", "module", "exports", ...Object.keys(globals), code)(
    localRequire,
    module,
    module.exports,
    ...Object.values(globals),
  );
  return module.exports;
}
function load(filename, mocks = {}) {
  return evaluate(readFileSync(filename, "utf8"), filename, mocks);
}
const intents = load("src/lib/signup-intent.ts");
const { buildSignupDefaults } = load("src/lib/signup-defaults.ts");
const { resolveVisibility, QUICK_ACCESS_DEFAULT } = load("src/config/feature-visibility.ts");
const legalAcceptance = {
  source: "email_signup",
  termsVersion: "test",
  privacyVersion: "test",
  acceptedAt: "2026-09-17T12:00:00Z",
};
const cookieValues = (header) =>
  Object.fromEntries(
    (header || "")
      .split(";")
      .filter(Boolean)
      .map((pair) => pair.trim().split("=")),
  );
function responseMock() {
  return {
    NextResponse: {
      json(body, options) {
        const cookies = new Map();
        return {
          body,
          status: options?.status || 200,
          cookies: {
            set: (name, value, options) => cookies.set(name, { value, ...options }),
            get: (name) => cookies.get(name),
          },
        };
      },
    },
  };
}
const legalMock = {
  LEGAL_ACCEPTANCE_COOKIE_NAME: "legal",
  readCookieValue: (header, name) => cookieValues(header)[name],
  verifyLegalAcceptanceToken: async () => legalAcceptance,
};

test("sports category signup enables just that sport, with Snap, Upload and sign-up forms intact", () => {
  for (const [intent, key] of [
    ["gymnastics", "gymnastics"],
    ["football", "football_season"],
  ]) {
    const defaults = buildSignupDefaults(intent, `/${intent}`);
    assert.deepEqual(defaults.visibleTemplateKeys, [key]);
    assert.equal(defaults.persona, "sports_staff");
    assert.equal(defaults.defaultCreateIntent, intent);
    assert.deepEqual(defaults.sportPreferences, {
      primarySport: intent,
      enabledSports: [intent],
      setupCompleted: true,
    });
    assert.deepEqual(resolveVisibility(defaults).quickAccess, QUICK_ACCESS_DEFAULT);
    assert.deepEqual(defaults.signupAttribution, { intent, path: `/${intent}` });
  }
  assert.deepEqual(buildSignupDefaults("weddings").visibleTemplateKeys, ["weddings"]);
  assert.deepEqual(buildSignupDefaults("birthdays").visibleTemplateKeys, ["birthdays"]);
  assert.ok(buildSignupDefaults("snap").visibleTemplateKeys.includes("football_season"));
  assert.equal(buildSignupDefaults("snap").defaultCreateIntent, null);
});

test("landing context survives galleries and generic signup; an explicit new category wins", () => {
  assert.deepEqual(
    intents.resolveSignupContext({
      path: "/gymnastics/templates/design/customize",
      previousPath: "/gymnastics",
    }),
    { intent: "gymnastics", source: "gymnastics", path: "/gymnastics" },
  );
  assert.equal(
    intents.resolveSignupContext({
      path: "/",
      previousIntent: "football",
      previousPath: "/football",
    }).intent,
    "football",
  );
  assert.deepEqual(
    intents.resolveSignupContext({
      path: "/football",
      previousIntent: "gymnastics",
      previousPath: "/gymnastics",
    }),
    { intent: "football", source: "football", path: "/football" },
  );
  assert.equal(
    intents.signupIntentForMarketingPath("/event/football-season/customize"),
    "football",
  );
  assert.equal(intents.signupIntentForMarketingPath("/templates/signup"), "signup_forms");
  assert.equal(intents.normalizeSignupPath("/football?email=private#section"), "/football");
  for (const invalid of ["https://evil.test/football", "//evil.test", "/\\evil", {}, "/x\ny"])
    assert.equal(intents.normalizeSignupPath(invalid), null);
});

test("create menus show only the selected sport and let settings add more categories", () => {
  const { getTemplateLinks } = load("src/config/navigation-config.tsx");
  for (const sport of ["gymnastics", "football"]) {
    const defaults = buildSignupDefaults(sport);
    const links = getTemplateLinks(defaults.visibleTemplateKeys, ["snap"], defaults.sportPreferences);
    assert.deepEqual(links.map((link) => link.href), [`/event/${sport}`]);
    const expanded = getTemplateLinks([...defaults.visibleTemplateKeys, "weddings"], ["snap"], defaults.sportPreferences);
    assert.ok(expanded.some((link) => link.href === "/event/weddings"));
  }
});

test("signup-source primes category cookies for Google and generic forms and rejects invalid intent", async () => {
  const { POST } = load("src/app/api/auth/signup-source/route.ts", {
    "next/server": responseMock(),
    "@/lib/legal-acceptance": legalMock,
  });
  const request = (body, cookie = "") =>
    new Request("https://envitefy.test/api/auth/signup-source", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { cookie },
    });
  const football = await POST(
    request(
      { intent: "football", source: "snap", path: "/football/templates" },
      "envitefy_signup_intent=gymnastics; envitefy_signup_path=/gymnastics",
    ),
  );
  assert.equal(football.cookies.get("envitefy_signup_source").value, "football");
  assert.equal(football.cookies.get("envitefy_signup_path").value, "/football/templates");
  assert.equal(football.cookies.get("envitefy_signup_intent").httpOnly, true);
  const inherited = await POST(
    request({ path: "/" }, "envitefy_signup_intent=gymnastics; envitefy_signup_path=/gymnastics"),
  );
  assert.equal(inherited.body.intent, "gymnastics");
  const general = await POST(request({ path: "/" }));
  assert.equal(general.body.source, "snap");
  assert.equal((await POST(request({ intent: "admin" }))).status, 400);
});

test("email signup forwards category and original path into account creation", async () => {
  let saved;
  const { POST } = load("src/app/api/auth/signup/route.ts", {
    "next/server": responseMock(),
    "@/lib/legal-acceptance": legalMock,
    "@/lib/db": {
      createUserWithEmailPassword: async (params) => {
        saved = params;
      },
    },
  });
  const res = await POST(
    new Request("https://envitefy.test/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.test",
        password: "test-only-password",
        signupSource: "snap",
        signupIntent: "football",
      }),
      headers: {
        cookie:
          "envitefy_signup_source=football; envitefy_signup_intent=football; envitefy_signup_path=/football",
      },
    }),
  );
  assert.equal(res.status, 200);
  assert.equal(saved.signupSource, "football");
  assert.equal(saved.signupIntent, "football");
  assert.equal(saved.signupPath, "/football");
  assert.equal(res.cookies.get("envitefy_signup_path").value, "");
});

test("middleware records visits, but ignores prefetches and signed-in browsing", async () => {
  const mock = responseMock();
  mock.NextResponse.next = () => mock.NextResponse.json({});
  const originalJson = mock.NextResponse.json;
  mock.NextResponse.json = (...args) => ({ ...originalJson(...args), headers: new Headers() });
  const { middleware } = load("src/middleware.ts", {
    "next/server": mock,
    "next-auth/jwt": { getToken: async () => null },
  });
  const request = (headers = {}, cookies = {}) => ({
    nextUrl: new URL("https://envitefy.test/football"),
    headers: new Headers(headers),
    cookies: { get: (name) => (cookies[name] ? { value: cookies[name] } : undefined) },
  });
  assert.equal(
    (await middleware(request())).cookies.get("envitefy_signup_intent").value,
    "football",
  );
  assert.equal(
    (await middleware(request())).cookies.get("envitefy_signup_path").value,
    "/football",
  );
  for (const headers of [
    { "next-router-prefetch": "1" },
    { purpose: "prefetch" },
    { "sec-purpose": "prefetch" },
  ]) {
    assert.equal(
      (await middleware(request(headers))).cookies.get("envitefy_signup_intent"),
      undefined,
    );
  }
  assert.equal(
    (await middleware(request({}, { "next-auth.session-token": "existing" }))).cookies.get(
      "envitefy_signup_intent",
    ),
    undefined,
  );
});

test("Google signup uses the same category defaults, while existing accounts remain unchanged", async () => {
  let saved;
  let existing = false;
  const cookies = {
    envitefy_signup_source: "football",
    envitefy_signup_intent: "football",
    envitefy_signup_path: "/football",
  };
  const auth = load("src/lib/auth.ts", {
    "next-auth": {},
    "next-auth/jwt": {},
    "next-auth/providers/credentials": { default: (config) => config },
    "next-auth/providers/google": { default: (config) => config },
    "next/headers": { cookies: async () => ({ get: (name) => ({ value: cookies[name] }) }) },
    "@/lib/legal-acceptance": {
      ...legalMock,
      verifyLegalAcceptanceToken: async () => ({ ...legalAcceptance, source: "google_signup" }),
    },
    "@/lib/db": {
      getUserByEmail: async () => (existing ? { id: "existing" } : null),
      createOrUpdateOAuthUser: async (params) => {
        saved = params;
      },
    },
  });
  const args = {
    account: { provider: "google" },
    user: { email: "test@example.test", name: "Test Coach" },
  };
  const callback = auth.getAuthOptions().callbacks.signIn;
  assert.equal(await callback(args), true);
  assert.equal(saved.signupIntent, "football");
  assert.equal(saved.signupPath, "/football");
  existing = true;
  saved = null;
  assert.equal(await callback(args), true);
  assert.equal(saved, null);
});

test("Next matcher excludes public prefetches without bypassing protected routes", () => {
  const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
  const { config } = load("src/middleware.ts", {
    "next/server": responseMock(),
    "next-auth/jwt": {},
  });
  for (const url of ["/gymnastics", "/football", "/football/templates", "/weddings/templates/garden/customize", "/snap"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true, url);
    assert.equal(unstable_doesMiddlewareMatch({ config, url, headers: { "next-router-prefetch": "1" } }), false, url);
  }
  for (const url of ["/settings", "/admin", "/chat", "/event", "/event/football/customize"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url, headers: { "next-router-prefetch": "1" } }), true, url);
  }
});

test("both account inserts persist category preferences atomically with the new user", async () => {
  const source = ts.createSourceFile(
    "db.ts",
    readFileSync("src/lib/db.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const name of ["createUserWithEmailPassword", "createOrUpdateOAuthUser"]) {
    const declaration = source.statements.find(
      (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name,
    );
    let inserted;
    const noop = async () => {};
    const module = evaluate(
      declaration.getText(source),
      "db.ts",
      {},
      {
        buildSignupDefaults,
        USER_SELECT_COLUMNS: "*",
        ensureUsersHasFeatureVisibilityColumn: noop,
        ensureUsersHasProductScopeColumns: noop,
        ensureUsersHasAvatarUrlColumn: noop,
        ensureUsersHasLegalPrivacyColumns: noop,
        getUserByEmail: async () => null,
        hashPassword: async () => "test-hash",
        productScopesForSignupSource: () => ["snap"],
        query: async (sql, values) => {
          inserted = { sql, values };
          return { rows: [{ id: "new" }] };
        },
      },
    );
    await module[name]({
      email: "test@example.test",
      password: "test",
      provider: "google",
      signupSource: "gymnastics",
      signupIntent: "gymnastics",
      signupPath: "/gymnastics",
      legalAcceptance,
    });
    assert.match(inserted.sql, /legal_acceptance_metadata, feature_visibility/);
    const defaults = JSON.parse(inserted.values.at(-1));
    assert.deepEqual(defaults.visibleTemplateKeys, ["gymnastics"]);
    assert.equal(defaults.sportPreferences.setupCompleted, true);
    assert.equal(
      Math.max(...[...inserted.sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]))),
      inserted.values.length,
    );
  }
});

test("football landing uses shared navigation and a real WebP hero", () => {
  const page = readFileSync("src/components/football-landing/FootballLanding.tsx", "utf8");
  assert.match(page, /SignedOutPageChrome topNavVariant="transparent-dark"/);
  assert.match(page, /LandingHeroMedia images=\{heroImages\}/);
  assert.match(page, /signupIntent="football"/);
  for (const image of page.matchAll(/(?:src: |src=)"(\/images\/[^"]+)"/g)) {
    assert.ok(existsSync(`public${image[1]}`));
    const bytes = readFileSync(`public${image[1]}`);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
});
