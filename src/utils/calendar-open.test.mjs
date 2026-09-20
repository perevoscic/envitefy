import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { buildCalendarLinks } from "./calendar-links.ts";

const compiled = ts.transpileModule(
  readFileSync(new URL("./calendar-open.ts", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;

function harness(userAgent, maxTouchPoints = 0) {
  const assigned = [];
  const opened = [];
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    URL,
    URLSearchParams,
    navigator: { userAgent, maxTouchPoints },
    window: {
      location: { origin: "https://envitefy.com", assign: (href) => assigned.push(href) },
      open: (...args) => {
        opened.push(args);
        return null;
      },
    },
  });
  return { ...exports, assigned, opened };
}

const links = (extra = {}) =>
  buildCalendarLinks({
    title: "Movie & dinner + friends #1",
    description: "Meet here.\nDinner follows.",
    location: "Venue; downtown",
    startIso: "2026-09-26T16:00:00-05:00",
    endIso: null,
    allDay: false,
    reminders: null,
    recurrence: null,
    timezone: "America/Chicago",
    ...extra,
  });

test("device routing recognizes iPad desktop mode without mistaking a Mac for an iPad", () => {
  const { calendarDevice } = harness("");
  for (const [ua, touch, expected] of [
    ["Mozilla/5.0 (Linux; Android 15)", 5, "android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5, "ios"],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", 5, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 5, "ios"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", 0, "mac"],
    ["Mozilla/5.0 (Windows NT 10.0)", 10, "other"],
  ])
    assert.equal(calendarDevice(ua, touch), expected);
});

test("Android Outlook intent targets its installed handler with a complete web fallback", () => {
  const api = harness("Android 15");
  const event = links();
  assert.equal(api.openCalendarProvider(event, "microsoft"), true);
  assert.equal(api.opened.length, 0);
  assert.equal(api.assigned.length, 1);
  const [native, intent] = api.assigned[0].split("#Intent;");
  assert.match(intent, /^scheme=ms-outlook;package=com\.microsoft\.office\.outlook;/);
  const fallback = intent.match(/S\.browser_fallback_url=([^;]+);end$/)[1];
  assert.equal(decodeURIComponent(fallback), event.outlook);
  const params = new URL(native.replace("intent:", "ms-outlook:")).searchParams;
  assert.equal(params.get("title"), "Movie & dinner + friends #1");
  assert.equal(params.get("description"), new URL(event.outlook).searchParams.get("body"));
  assert.equal(params.get("location"), "Venue; downtown");
  assert.equal(params.get("start"), "2026-09-26T21:00:00.000Z");
  assert.equal(params.has("end"), false);
});

test("iPhone and iPad try Outlook synchronously, preserving an explicit end and never scheduling a duplicate web open", () => {
  for (const ua of ["iPhone", "Macintosh"]) {
    const api = harness(ua, 5);
    assert.equal(
      api.openCalendarProvider(links({ endIso: "2026-09-26T18:00:00-05:00" }), "microsoft"),
      true,
    );
    const url = new URL(api.assigned[0]);
    assert.equal(url.protocol, "ms-outlook:");
    assert.equal(url.host + url.pathname, "events/new");
    assert.equal(url.searchParams.get("end"), "2026-09-26T23:00:00.000Z");
    assert.equal(api.opened.length, 0);
  }
});

test("all-day events and unrecognized compose links avoid an unsupported mobile conversion", () => {
  const api = harness("Android");
  const event = links({ allDay: true, startIso: "2026-09-26" });
  assert.equal(api.openCalendarProvider(event, "microsoft"), false);
  assert.equal(api.assigned[0], event.outlook);
  for (const url of [
    "https://example.com/?startdt=2026-09-26T21:00:00Z",
    "javascript:alert(1)",
    "not a url",
    "https://outlook.live.com/?startdt=2026-09-26T16:00:00",
  ]) {
    assert.equal(api.outlookNativeUrl(url, "android"), null);
  }
});

test("Apple devices request an inline single-event import rather than a calendar subscription", () => {
  for (const ua of ["iPhone", "iPad", "Macintosh"]) {
    const api = harness(ua);
    const event = links();
    assert.equal(api.openCalendarProvider(event, "apple"), false);
    assert.equal(api.opened.length, 0);
    const url = new URL(api.assigned[0]);
    assert.equal(url.protocol, "https:");
    assert.equal(url.pathname, "/api/ics");
    assert.equal(url.searchParams.get("disposition"), "inline");
    assert.equal(url.searchParams.get("start"), "2026-09-26T16:00:00-05:00");
    assert.equal(url.searchParams.has("end"), false);
    api.openCalendarProvider(event, "apple");
    assert.equal(api.assigned.length, 1, "double tap must not open two imports");
  }
});

test("Google mobile navigation keeps the existing app-capable HTTPS link and its start time", () => {
  const api = harness("Android");
  const event = links();
  assert.equal(api.openCalendarProvider(event, "google"), false);
  assert.equal(api.assigned[0], event.google);
  assert.equal(new URL(api.assigned[0]).searchParams.get("dates"), "20260926T160000");
});

test("desktop web links and non-Apple ICS downloads open only once even if noopener returns null", () => {
  const api = harness("Windows NT 10.0");
  const event = links();
  for (const provider of ["microsoft", "google", "apple"])
    assert.equal(api.openCalendarProvider(event, provider), false);
  assert.equal(api.opened.length, 3);
  assert.equal(api.assigned.length, 0);
  assert.equal(api.opened[0][0], event.outlook);
  assert.equal(api.opened[1][0], event.google);
});
