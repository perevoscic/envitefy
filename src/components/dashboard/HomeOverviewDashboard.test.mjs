import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dashboard invitation actions keep mobile buttons on one row", () => {
  const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /const primaryButtonClassName = `group\/btn inline-flex min-h-\[56px\] min-w-0 flex-1.*sm:min-h-\[60px\] sm:min-w-\[170px\]/s,
  );
  assert.match(
    source,
    /const secondaryButtonClassName =\s*"inline-flex min-h-\[56px\] min-w-0 flex-1.*sm:min-h-\[60px\] sm:min-w-\[170px\]/s,
  );
  assert.match(source, /<div className="flex gap-3 sm:gap-4">/);
});

test("dashboard invitation actions gate RSVP on actionable RSVP data", () => {
  const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /hasRsvp\?: boolean/);
  assert.match(source, /if \(!item\.hasRsvp\)/);
  assert.match(source, /label: "Get Directions"/);
  assert.match(source, /if \(isInvitedWithoutResponse && item\.hasRsvp\)/);
  assert.match(
    source,
    /if \(isInvitedWithoutResponse && item\.hasRsvp\)[\s\S]*label: "RSVP Now"/,
  );
});

test("dashboard overview includes a directions info tile for the next event", () => {
  const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /label: "Directions"/);
  assert.match(source, /href: nextEvent\?\.mapsUrl \|\| null/);
  assert.match(source, /value: nextEvent\?\.mapsUrl[\s\S]*"Open Route"/);
});

test("dashboard uses the shared flip clock and keeps countdown parts mapped to Days, Hours, and Mins", () => {
  const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ FlipClock \} from "@\/components\/ui\/flip-clock";/);
  assert.equal((source.match(/<FlipClock/g) || []).length, 2);
  assert.match(
    source,
    /<FlipClock\s+units=\{\[\s*\{ label: "Days", value: countdown\.days \},\s*\{ label: "Hours", value: countdown\.hours \},\s*\{ label: "Mins", value: countdown\.minutes \},\s*\]\}/s,
  );
});

test("dashboard invitation card applies thumbnail focus as image object position", () => {
  const source = readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8");

  assert.match(source, /thumbnailFocusToObjectPosition/);
  assert.match(source, /thumbnailFocus\?: ThumbnailFocus \| null/);
  assert.match(source, /const thumbnailObjectPosition = thumbnailFocusToObjectPosition\(item\.thumbnailFocus\);/);
  assert.match(source, /objectPosition: thumbnailObjectPosition/);
});
