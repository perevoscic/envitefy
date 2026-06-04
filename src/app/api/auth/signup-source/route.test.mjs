import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("signup-source route validates the source and sets the signup cookie", () => {
  const routeSource = readSource("src/app/api/auth/signup-source/route.ts");

  assert.match(routeSource, /body\?\.source === "snap" \|\| body\?\.source === "gymnastics"/);
  assert.match(routeSource, /response\.cookies\.set\("envitefy_signup_source", source/);
  assert.match(routeSource, /maxAge: 60 \* 10/);
  assert.match(routeSource, /httpOnly: true/);
});

test("signup route requires a reCAPTCHA token in production when verification is configured", () => {
  const routeSource = readSource("src/app/api/auth/signup/route.ts");
  const configuredIndex = routeSource.indexOf(
    "const recaptchaSecretConfigured = !!process.env.RECAPTCHA_SECRET_KEY",
  );
  const requiredIndex = routeSource.indexOf("const recaptchaRequired =", configuredIndex);
  const missingTokenIndex = routeSource.indexOf("if (!recaptchaToken)", requiredIndex);
  const createUserIndex = routeSource.indexOf("await createUserWithEmailPassword");

  assert.ok(configuredIndex > 0);
  assert.ok(requiredIndex > configuredIndex);
  assert.ok(missingTokenIndex > requiredIndex);
  assert.ok(missingTokenIndex < createUserIndex);
  assert.match(routeSource.slice(requiredIndex, missingTokenIndex), /NODE_ENV === "production"/);
  assert.match(
    routeSource.slice(requiredIndex, missingTokenIndex),
    /NEXT_PUBLIC_RECAPTCHA_ENABLE_IN_DEV/,
  );
  assert.match(
    routeSource.slice(requiredIndex, createUserIndex),
    /if \(recaptchaRequired\) \{[\s\S]*if \(!recaptchaToken\) \{[\s\S]*Security verification failed\. Please try again\.[\s\S]*await verifyRecaptcha\(recaptchaToken\)/,
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

  assert.match(signupFormSource, /useRecaptcha/);
  assert.match(signupFormSource, /await executeRecaptcha\("signup"\)/);
  assert.doesNotMatch(signupFormSource, /window\.grecaptcha\.execute/);
  assert.doesNotMatch(signupFormSource, /recaptcha\/api\.js\?render/);
});

test("recaptcha hook validates that api.js accepted the configured render key", () => {
  const hookSource = readSource("src/hooks/useRecaptcha.ts");

  assert.match(hookSource, /function validateRecaptchaRenderKey/);
  assert.match(hookSource, /window\.___grecaptcha_cfg\?\.render\?\.includes\(siteKey\)/);
  assert.match(hookSource, /process\.env\.NODE_ENV === "production"/);
  assert.match(hookSource, /NEXT_PUBLIC_RECAPTCHA_ENABLE_IN_DEV/);
  assert.match(hookSource, /Skipping reCAPTCHA in development/);
});

test("shared recaptcha verifier also skips by default in development", () => {
  const verifierSource = readSource("src/lib/recaptcha.ts");

  assert.match(verifierSource, /const verificationEnabled =/);
  assert.match(verifierSource, /NODE_ENV === "production"/);
  assert.match(verifierSource, /NEXT_PUBLIC_RECAPTCHA_ENABLE_IN_DEV/);
  assert.match(verifierSource, /Skipping reCAPTCHA verification in development/);
});
