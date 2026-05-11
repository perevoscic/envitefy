import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

test("dashboard uses isolated mock data only as a development fallback", () => {
  const mockSource = readFileSync(new URL("./adminDashboardMockData.ts", import.meta.url), "utf8");

  assert.match(source, /from "\.\/adminDashboardMockData"/);
  assert.match(source, /shouldUseAdminDashboardMockData && realEvents\.length === 0 && !loading/);
  assert.match(mockSource, /export const mockEvents/);
  assert.match(mockSource, /export const mockActivity/);
  assert.match(mockSource, /process\.env\.NODE_ENV !== "production"/);
});

test("dashboard event cards keep one primary management action and scoped secondary actions", () => {
  assert.match(source, /function EventManagementCard/);
  assert.match(source, /function manageEventHref/);
  assert.match(source, /const manageHref = manageEventHref\(event\);/);
  assert.match(source, /\/events\/\$\{encodeURIComponent\(event\.id\)\}\/manage/);
  assert.match(source, />\{event\.isSample \? "Create similar" : "Manage event"\}</);
  assert.match(source, /onClick=\{\(\) => onCopy\(event\)\}/);
  assert.match(source, /onClick=\{\(\) => onShare\(event\)\}/);
  assert.match(source, /aria-label=\{`View live card for \$\{event\.title\}`\}/);
});

test("dashboard includes creator-oriented sections and mobile dashboard navigation", () => {
  assert.match(source, /function SmartActionCard/);
  assert.match(source, /function UpcomingEventsList/);
  assert.match(source, /function EventHealthChecklist/);
  assert.match(source, /function RecentActivityPanel/);
  assert.match(source, /function ConciergeSuggestionsCard/);
  assert.match(source, /function MobileAdminNav/);
  assert.match(source, /href: "#overview"/);
  assert.match(source, /href: "#events"/);
  assert.match(source, /href: "#activity"/);
  assert.match(source, /href: "#concierge"/);
});

test("dashboard summary removes attendee-first travel tiles from the creator overview", () => {
  assert.doesNotMatch(source, /label: "Directions"/);
  assert.doesNotMatch(source, /label: "Weather"/);
  assert.doesNotMatch(source, /label: "Travel Time"/);
  assert.match(source, /label: "Needs attention"/);
  assert.match(source, /label: "Page views"/);
});

test("dashboard empty state offers studio and snap upload routes", () => {
  assert.match(source, /href="\/studio"[\s\S]*Create in Studio/);
  assert.match(source, /href="\/event"[\s\S]*Snap\/upload/);
  assert.doesNotMatch(source, /Create First Event/);
  assert.doesNotMatch(source, /onCreateEvent/);
});

test("dashboard keeps countdown and thumbnail focus support", () => {
  assert.match(source, /import \{ FlipClock \} from "@\/components\/ui\/flip-clock";/);
  assert.match(
    source,
    /<FlipClock\s+units=\{\[\s*\{ label: "Days", value: countdown\.days \},\s*\{ label: "Hours", value: countdown\.hours \},\s*\{ label: "Mins", value: countdown\.minutes \},\s*\]\}/s,
  );
  assert.match(source, /thumbnailFocusToObjectPosition/);
  assert.match(source, /function getDashboardThumbnailObjectPosition/);
  assert.match(source, /objectPosition: thumbnailObjectPosition/);
});
