import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("login form sends sign-in flows back to root", () => {
  const loginForm = readSource("src/components/auth/LoginForm.tsx");

  assert.match(loginForm, /callbackUrl: "\/"/);
  assert.match(loginForm, /window\.location\.replace\("\/"\)/);
  assert.match(loginForm, /signIn\("google", \{ callbackUrl: "\/" \}\)/);
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
