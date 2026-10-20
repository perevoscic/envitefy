#!/usr/bin/env node
// Run from any directory: node <this-file> [--write]
// Persistence, consent verification, notification delivery and network access are mocked.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

const repoRoot = new URL("../../../", import.meta.url);
const sourcePath = "src/app/api/auth/signup/route.ts";
const source = readFileSync(new URL(sourcePath, repoRoot), "utf8");
const transpile = (text, filename) => ts.transpileModule(text, {
  fileName: filename,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const intentModule = { exports: {} };
new Function("module", "exports", transpile(
  readFileSync(new URL("src/lib/signup-intent.ts", repoRoot), "utf8"),
  "signup-intent.ts",
))(intentModule, intentModule.exports);

let inserted;
let notificationCount;
const mocks = {
  "next/server": {
    NextResponse: {
      json(body, options) {
        return { body, status: options?.status || 200, cookies: { set() {} } };
      },
    },
  },
  "@/lib/db": {
    createUserWithEmailPassword: async (params) => { inserted = params; },
  },
  "@/lib/new-account-notification": {
    notifyNewAccountSignup: async () => { notificationCount += 1; },
  },
  "@/lib/legal-acceptance": {
    LEGAL_ACCEPTANCE_COOKIE_NAME: "diagnostic-consent",
    readCookieValue: (_cookie, name) => name === "envitefy_signup_path" ? "/gymnastics" : null,
    verifyLegalAcceptanceToken: async () => ({ source: "email_signup" }),
  },
  "@/lib/signup-intent": intentModule.exports,
};
const routeModule = { exports: {} };
new Function("require", "module", "exports", "console", "process", "fetch", transpile(source, sourcePath))(
  (name) => {
    if (!Object.hasOwn(mocks, name)) throw new Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  },
  routeModule,
  routeModule.exports,
  { log() {}, warn() {}, error() {} },
  { env: { NODE_ENV: "development" } },
  async () => { throw new Error("Network access is forbidden in this diagnostic."); },
);

const base = {
  email: "gymnast-parent@example.test",
  password: "Diagnostic-only-strong-password-2026",
  firstName: "Maya",
  lastName: "Tester",
  signupSource: "gymnastics",
};
const scenarios = [
  { id: "valid_control", change: {}, expectedStatus: 200 },
  { id: "one_character_password", change: { password: "a" }, expectedStatus: 200 },
  { id: "malformed_email", change: { email: "not-an-email" }, expectedStatus: 200 },
  { id: "empty_email_control", change: { email: "" }, expectedStatus: 400 },
  { id: "empty_password_control", change: { password: "" }, expectedStatus: 400 },
];
const cases = [];
for (const scenario of scenarios) {
  inserted = null;
  notificationCount = 0;
  const body = { ...base, ...scenario.change };
  const response = await routeModule.exports.POST(new Request("https://envitefy.example.test/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
  assert.equal(response.status, scenario.expectedStatus, `${scenario.id}: behavior changed; review this evidence`);
  cases.push({
    id: scenario.id,
    email: body.email,
    passwordLength: body.password.length,
    status: response.status,
    reachedAccountInsert: Boolean(inserted),
    notificationCalls: notificationCount,
    response: response.body,
  });
}

const evidence = {
  generatedAt: new Date().toISOString(),
  run: "node docs/qa/gymnast-mom-2026-10-19/signup-handler-diagnostics.mjs --write",
  source: sourcePath,
  scope: "Actual POST handler with real signup-intent helpers; persistence, notification delivery and successful legal verification mocked. Development reCAPTCHA bypass; network forbidden. No accounts created or emails sent.",
  limitation: "This isolates server input validation. It does not exercise a real database, live signup, browser email validation, CAPTCHA, or production deployment.",
  interpretation: "The one-character password and malformed-email cases reach account insertion. Empty values are rejected. Assertions preserve the observed behavior for reproduction, not the desired validation policy.",
  cases,
};
const json = `${JSON.stringify(evidence, null, 2)}\n`;
if (process.argv.includes("--write")) {
  writeFileSync(new URL("signup-handler-evidence.json", import.meta.url), json);
}
process.stdout.write(json);
