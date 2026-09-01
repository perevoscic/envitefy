import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

test("calendar connection requests a refresh token and the narrow event scope", () => {
  assert.match(source, /GOOGLE_CALENDAR_EVENT_WRITE_SCOPE/);
  assert.match(source, /access_type:\s*"offline"/);
  assert.match(source, /prompt:\s*"consent"/);
  assert.doesNotMatch(source, /auth\/calendar\.events"/);
});
