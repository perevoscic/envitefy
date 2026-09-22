import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(filename, mocks = {}) {
  const source = readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
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
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

test("new account notice goes to the owner and keeps the signup facts", () => {
  const { buildNewAccountNotification, NEW_ACCOUNT_NOTIFY_EMAIL } = load(
    "src/lib/new-account-notification.ts",
  );
  const message = buildNewAccountNotification(
    {
      email: "Guest@Example.com",
      firstName: "Ava",
      lastName: "Cole",
      method: "google",
      signupSource: "signup_forms",
      signupPath: "/signup-forms",
    },
    new Date("2026-09-22T20:30:00Z"),
  );

  assert.equal(message.to, "bugjosru@gmail.com");
  assert.equal(NEW_ACCOUNT_NOTIFY_EMAIL, "bugjosru@gmail.com");
  assert.equal(message.subject, "New Envitefy account: Ava Cole");
  assert.equal(message.replyTo, "guest@example.com");
  assert.match(message.text, /Email: guest@example.com/);
  assert.match(message.text, /Signed up with: Google/);
  assert.match(message.text, /Started from: Signup Forms/);
  assert.match(message.text, /Page: \/signup-forms/);
  assert.match(message.text, /When: Sep 22, 2026, 3:30 PM CT/);
  assert.doesNotMatch(`${message.subject}\n${message.text}\n${message.html}`, /password/i);
});

test("a failed notification does not reject the signup", async () => {
  const { notifyNewAccountSignup } = load("src/lib/new-account-notification.ts", {
    "@/lib/mail-transport": {
      sendTransactionalEmail: async () => {
        throw Object.assign(new Error("smtp down"), { code: "ECONNECTION" });
      },
    },
  });
  await notifyNewAccountSignup({
    email: "ava@example.com",
    method: "email",
  });
});
