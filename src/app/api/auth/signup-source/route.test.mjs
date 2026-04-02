import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("signup-source route validates the source and sets the signup cookie", () => {
  const routeSource = readSource("src/app/api/auth/signup-source/route.ts");

  assert.match(routeSource, /body\?\.source === "snap" \|\| body\?\.source === "gymnastics"/);
  assert.match(routeSource, /response\.cookies\.set\("envitefy_signup_source", source/);
  assert.match(routeSource, /maxAge: 60 \* 10/);
  assert.match(routeSource, /httpOnly: true/);
});

test("signup form primes the signup-source cookie before email and Google signup", () => {
  const signupFormSource = readSource("src/components/auth/SignupForm.tsx");

  assert.match(signupFormSource, /fetch\("\/api\/auth\/signup-source"/);
  assert.match(signupFormSource, /body: JSON\.stringify\(\{ source: signupSource \}\)/);
  assert.match(signupFormSource, /await ensureSignupSourceCookie\(\);\s+if \(password !== confirmPassword\)/);
  assert.match(signupFormSource, /await ensureSignupSourceCookie\(\);\s+await signIn\("google"/);
});
