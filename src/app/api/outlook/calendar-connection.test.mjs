import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authSource = readFileSync(new URL("./auth/route.ts", import.meta.url), "utf8");
const callbackSource = readFileSync(new URL("./callback/route.ts", import.meta.url), "utf8");

test("Outlook calendar connection preserves a safe post-OAuth return path", () => {
  assert.match(authSource, /normalizeInternalRedirect/);
  assert.match(authSource, /searchParams\.get\("next"\)/);
  assert.match(authSource, /type: "oauth_redirect"/);
  assert.match(authSource, /Calendars\.ReadWrite/);
  assert.match(callbackSource, /readRedirectPath/);
  assert.match(callbackSource, /outlookAuth/);
  assert.match(callbackSource, /preferredProvider: "microsoft"/);
  assert.match(callbackSource, /NextResponse\.redirect\(redirectUrl\)/);
});
