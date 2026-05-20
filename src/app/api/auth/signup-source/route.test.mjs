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

test("signup route requires a reCAPTCHA token when verification is configured", () => {
  const routeSource = readSource("src/app/api/auth/signup/route.ts");
  const configuredIndex = routeSource.indexOf(
    "const recaptchaSecretConfigured = !!process.env.RECAPTCHA_SECRET_KEY",
  );
  const missingTokenIndex = routeSource.indexOf("if (!recaptchaToken)", configuredIndex);
  const createUserIndex = routeSource.indexOf("await createUserWithEmailPassword");

  assert.ok(configuredIndex > 0);
  assert.ok(missingTokenIndex > configuredIndex);
  assert.ok(missingTokenIndex < createUserIndex);
  assert.match(
    routeSource.slice(configuredIndex, createUserIndex),
    /if \(recaptchaSecretConfigured\) \{[\s\S]*if \(!recaptchaToken\) \{[\s\S]*Security verification failed\. Please try again\.[\s\S]*await verifyRecaptcha\(recaptchaToken\)/,
  );
});

test("signup form primes the signup-source cookie before email and Google signup", () => {
  const signupFormSource = readSource("src/components/auth/SignupForm.tsx");

  assert.match(signupFormSource, /fetch\("\/api\/auth\/signup-source"/);
  assert.match(signupFormSource, /body: JSON\.stringify\(\{ source: signupSource \}\)/);
  assert.match(
    signupFormSource,
    /await ensureSignupSourceCookie\(\);\s+if \(password !== confirmPassword\)/,
  );

  const googleCookieIndex = signupFormSource.indexOf(
    "await ensureSignupSourceCookie();",
    signupFormSource.indexOf("const onGoogleSignUp"),
  );
  const googleSignInIndex = signupFormSource.indexOf('await signIn("google"', googleCookieIndex);
  assert.ok(googleCookieIndex > 0);
  assert.ok(googleSignInIndex > googleCookieIndex);
});
