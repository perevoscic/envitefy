import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(file, "utf8");
function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? sources(file) : /\.[cm]?[jt]sx?$/.test(file) && !/\.test\./.test(file) ? [file] : [];
  });
}

test("all manual provider URL building and native launches stay in shared utilities", () => {
  const violations = [];
  for (const file of sources("src")) {
    const source = read(file);
    if (file !== "src/utils/calendar-links.ts" && /(?:calendar\.google\.com\/calendar\/render|outlook\.(?:live|office)\.com\/calendar\/(?:0\/)?deeplink\/compose)/.test(source)) violations.push(file);
    if (file !== "src/utils/calendar-open.ts" && /(?:comgooglecalendar:\/\/|ms-outlook:\/\/events|scheme=ms-outlook)/.test(source)) violations.push(file);
    if (/on(?:Google|Apple|Outlook)Calendar|_handle(?:Google|Apple|Outlook)Calendar/.test(source)) violations.push(file);
    if (/ensureEndIso/.test(source)) violations.push(file);
  }
  assert.deepEqual(violations, [], "Use buildCalendarLinks and CalendarAction/useCalendarAction");
  assert.doesNotMatch(read("src/components/CalendarAction.tsx"), /onChoose/);
});

test("email handoff is public, requires a tap and retains shared fallback controls", () => {
  const route = read("src/app/api/events/[id]/rsvp/route.ts");
  assert.match(route, /absoluteUrl\(buildCalendarHandoffPath\(event, provider\)\)/);
  assert.doesNotMatch(route, /ensureEndIso|url: links\.(?:google|outlook)/);
  const client = read("src/app/calendar/add/CalendarHandoff.tsx");
  assert.match(client, /useCalendarAction\(\{ links \}\)/);
  assert.match(client, /onClick=\{\(\) => calendar.select\(handoff.provider\)\}/);
  assert.match(client, /calendar.fallbackOptions/);
  assert.doesNotMatch(client, /useEffect|window.location|window.open/);
  const paths = read("src/middleware.ts").match(/const PUBLIC_UNAUTH_PATHS = new Set\(\[([\s\S]*?)\]\);/)?.[1];
  assert.ok(paths?.includes('"/calendar/add"'));
  assert.ok(!paths?.includes('"/calendar"'));
  assert.match(read("src/app/calendar/add/page.tsx"), /referrer: "no-referrer"/);
});
