import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("login form supports redirect targets passed by the caller", () => {
  const loginForm = readSource("src/components/auth/LoginForm.tsx");
  const authModal = readSource("src/components/auth/AuthModal.tsx");
  const conciergePage = readSource("src/app/envitefy-concierge/ConciergeLandingPage.tsx");

  assert.match(loginForm, /successRedirectUrl = "\/"/);
  assert.match(loginForm, /callbackUrl: successRedirectUrl/);
  assert.match(loginForm, /showAuthTransition\("Loading \.\.\."\)/);
  assert.match(loginForm, /window\.location\.replace\(successRedirectUrl\)/);
  assert.match(loginForm, /signIn\("google", \{ callbackUrl: successRedirectUrl \}\)/);
  assert.match(authModal, /<LoginForm[\s\S]*successRedirectUrl=\{successRedirectUrl\}/s);
  assert.match(conciergePage, /successRedirectUrl="\/chat"/);
});

test("middleware leaves category landings and galleries public for signed-in visitors", () => {
  const middleware = readSource("src/middleware.ts");
  assert.match(middleware, /categorySignupIntent && templateCategoryForPath\(normalizedPathname\)/);
  assert.match(middleware, /return attachSignupSourceCookie\(ok\(\), signupSourceForIntent\(categorySignupIntent\), categorySignupIntent\)/);
  assert.match(middleware, /isPublicTemplatePath\(normalized\)/);
});

test("middleware lets authenticated users open /snap for the app launch cards", () => {
  const middleware = readSource("src/middleware.ts");
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(middleware, /if \(normalizedPathname === "\/snap"\) \{/);
  assert.match(
    middleware,
    /if \(!authState\.hasSession\) \{\s*return attachSignupSourceCookie\(ok\(\), "snap", "snap"\);\s*\}/s,
  );
  assert.match(middleware, /return ok\(\);/);
  assert.doesNotMatch(appShell, /const MARKETING_PATHS = new Set\(\[[^\]]*"\/snap"/s);
});

test("middleware keeps the Concierge introduction public but requires authentication for chat", () => {
  const middleware = readSource("src/middleware.ts");
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(middleware, /const PUBLIC_UNAUTH_PATHS = new Set\(\[[\s\S]*"\/envitefy-concierge"/s);
  const publicPaths = middleware.match(/const PUBLIC_UNAUTH_PATHS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || "";
  assert.doesNotMatch(publicPaths, /"\/chat"/);
  assert.match(middleware, /const isStudioCardSharePath = \(pathname: string\) =>/);
  assert.match(middleware, /if \(isStudioCardSharePath\(normalized\)\) return true;/);
  assert.doesNotMatch(appShell, /const MARKETING_PATHS = new Set\(\[[\s\S]*"\/studio"/s);
});

test("middleware keeps public share media routes available to link preview crawlers", () => {
  const middleware = readSource("src/middleware.ts");

  assert.match(middleware, /pathname\.startsWith\("\/media\/"\)/);
  assert.doesNotMatch(middleware, /isEventShareMetadataImagePath/);
});

test("middleware leaves local font assets available to every page", () => {
  const middleware = readSource("src/middleware.ts");

  assert.match(middleware, /pathname\.startsWith\("\/fonts\/"\)/);
  assert.match(middleware, /\|fonts\|/);
  assert.match(middleware, /woff\|woff2\|ttf\|otf/);
});

test("middleware redirects disabled event builders to gymnastics", () => {
  const middleware = readSource("src/middleware.ts");
  const featureVisibility = readSource("src/config/feature-visibility.ts");

  assert.match(middleware, /DISABLED_EVENT_ROUTE_PREFIXES/);
  assert.match(middleware, /const matchesPathPrefix = \(pathname: string, prefix: string\) =>/);
  assert.match(middleware, /normalizedPathname === "\/event\/new"/);
  assert.match(
    middleware,
    /DISABLED_EVENT_ROUTE_PREFIXES\.some\(\(prefix\) =>\s*matchesPathPrefix\(normalizedPathname, prefix\)\s*\)/s,
  );
  assert.match(middleware, /url\.pathname = "\/event\/gymnastics";/);
  assert.match(featureVisibility, /href: "\/event\/weddings"/);
  assert.match(featureVisibility, /href: "\/event\/birthdays"/);
});

test("wedding launch routes open the design gallery before the customize studio", () => {
  const middleware = readSource("src/middleware.ts");
  const featureVisibility = readSource("src/config/feature-visibility.ts");
  const signupIntent = readSource("src/lib/signup-intent.ts");

  assert.match(
    featureVisibility,
    /key: "weddings",[\s\S]*?href: "\/event\/weddings",/,
  );
  assert.match(
    signupIntent,
    /weddings: \{[\s\S]*?href: "\/event\/weddings",/,
  );
  assert.match(
    middleware,
    /normalizedPathname === "\/event\/weddings\/customize"[\s\S]*?!req\.nextUrl\.searchParams\.get\("templateId"\)[\s\S]*?!req\.nextUrl\.searchParams\.get\("edit"\)[\s\S]*?url\.pathname = "\/event\/weddings";/,
  );
});

test("middleware gives enabled category editors signed-in access and keeps other admin gates", () => {
  const middleware = readSource("src/middleware.ts");

  assert.match(middleware, /const ADMIN_ONLY_CREATE_EVENT_SEGMENTS = new Set\(\[/);
  assert.match(middleware, /"birthdays"/);
  assert.match(middleware, /"weddings"/);
  assert.match(middleware, /"baby-showers"/);
  assert.match(middleware, /"gender-reveal"/);
  assert.match(middleware, /"gymnastics"/);
  assert.match(middleware, /"sport-events"/);
  assert.match(middleware, /const isAdminOnlyCreateEventPath = \(pathname: string\) =>/);
  assert.match(middleware, /if \(normalized === "\/event"\) return true;/);
  assert.match(middleware, /return segments\[2\] === "customize";/);
  assert.match(middleware, /if \(isAdminOnlyCreateEventPath\(normalizedPathname\)\) \{/);
  assert.match(middleware, /!authState\.hasSession \|\| \(!enabledEditor && !isAdminToken\(authState\.token\)\)/);
  assert.match(middleware, /url\.pathname = "\/";/);
  assert.match(middleware, /!createAction \|\|\s*!isAdminToken\(authState\.token\)/s);
});
