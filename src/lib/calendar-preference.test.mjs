import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./calendar-preference.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const {
  normalizeCalendarProvider,
  validCalendarDefault,
  calendarActionLabel,
  calendarProviderHref,
} = exports;

test("calendar labels identify the action and the exact chosen provider", () => {
  assert.equal(calendarActionLabel(null), "Add to calendar");
  assert.equal(calendarActionLabel("google"), "Add to Google Calendar");
  assert.equal(calendarActionLabel("apple"), "Add to Apple Calendar");
  assert.equal(calendarActionLabel("microsoft"), "Add to Outlook Calendar");
});

test("only verified connected defaults bypass the chooser for a signed-in person", () => {
  for (const provider of ["google", "apple", "microsoft"]) {
    assert.equal(validCalendarDefault(provider, true, null), null);
    assert.equal(
      validCalendarDefault(provider, true, { google: false, apple: false, microsoft: false }),
      null,
    );
    assert.equal(validCalendarDefault(provider, true, { [provider]: true }), provider);
    assert.equal(validCalendarDefault(provider, false, null), provider);
  }
  assert.equal(validCalendarDefault(null, false, null), null);
});

test("provider selection preserves the event links and rejects unrecognized preferences", () => {
  const links = {
    google: "https://calendar.google.com/event?title=Meet",
    outlook: "https://outlook.live.com/calendar?title=Meet",
    appleInline: "/api/ics?event=meet",
  };
  assert.equal(calendarProviderHref(links, "google"), links.google);
  assert.equal(calendarProviderHref(links, "apple"), links.appleInline);
  assert.equal(calendarProviderHref(links, "microsoft"), links.outlook);
  assert.equal(normalizeCalendarProvider(" Google "), "google");
  for (const invalid of [null, {}, 1, "", "not-a-provider"])
    assert.equal(normalizeCalendarProvider(invalid), null);
});
