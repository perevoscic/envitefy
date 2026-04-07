import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("login form supports redirect targets passed by the caller", () => {
  const loginForm = readSource("src/components/auth/LoginForm.tsx");
  const authModal = readSource("src/components/auth/AuthModal.tsx");
  const studioPage = readSource("src/app/studio/StudioMarketingPage.tsx");

  assert.match(loginForm, /successRedirectUrl = "\/"/);
  assert.match(loginForm, /callbackUrl: successRedirectUrl/);
  assert.match(loginForm, /window\.location\.replace\(successRedirectUrl\)/);
  assert.match(loginForm, /signIn\("google", \{ callbackUrl: successRedirectUrl \}\)/);
  assert.match(authModal, /<LoginForm[\s\S]*successRedirectUrl=\{successRedirectUrl\}/s);
  assert.match(studioPage, /successRedirectUrl="\/studio"/);
});

test("middleware redirects signed-in marketing page visits to root", () => {
  const middleware = readSource("src/middleware.ts");

  assert.match(middleware, /normalizedPathname === "\/landing"/);
  assert.match(middleware, /normalizedPathname === "\/snap"/);
  assert.match(middleware, /normalizedPathname === "\/gymnastics"/);
  assert.match(middleware, /if \(authState\.hasSession\) \{/);
  assert.match(middleware, /url\.pathname = "\/"/);
  assert.match(middleware, /return redirectWithMarker\(url, 302\);/);
});

test("middleware keeps Studio public without treating it as a marketing redirect", () => {
  const middleware = readSource("src/middleware.ts");
  const appShell = readSource("src/app/AppShell.tsx");

  assert.match(middleware, /const PUBLIC_UNAUTH_PATHS = new Set\(\[[\s\S]*"\/studio"/s);
  assert.match(middleware, /const isStudioCardSharePath = \(pathname: string\) =>/);
  assert.match(middleware, /if \(isStudioCardSharePath\(normalized\)\) return true;/);
  assert.doesNotMatch(appShell, /const MARKETING_PATHS = new Set\(\[[\s\S]*"\/studio"/s);
});
