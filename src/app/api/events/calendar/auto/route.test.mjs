import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const routeSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/events/calendar/auto/route.ts"),
  "utf8",
);
const dashboardSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/Dashboard.tsx"),
  "utf8",
);
const serviceSource = fs.readFileSync(path.join(process.cwd(), "src/lib/calendar-sync-service.ts"), "utf8");
const createHistorySource = fs.readFileSync(path.join(process.cwd(), "src/app/api/history/route.ts"), "utf8");
const historyRouteSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/history/[id]/route.ts"),
  "utf8",
);
const dbSource = fs.readFileSync(path.join(process.cwd(), "src/lib/db.ts"), "utf8");

test("snap/upload opens after saving and leaves calendar work to the server", () => {
  assert.doesNotMatch(dashboardSource, /fetch\("\/api\/events\/calendar\/auto"/);
  assert.match(createHistorySource, /prepareScanCalendarSync\(data, scanAttemptId\)/);
  assert.match(createHistorySource, /if \(needsCalendarSync\) \{\s*after\(async \(\) =>/);
  assert.match(routeSource, /row\.user_id !== userId/);
  assert.match(serviceSource, /status:\s*"needs_connection"/);
  assert.match(serviceSource, /reason:\s*"no_supported_calendar_connected"/);
});

test("a stale Apple default cannot block a connected automatic-sync provider", () => {
  assert.doesNotMatch(serviceSource, /apple_calendar_selected/);
  assert.match(serviceSource, /else if \(googleRefreshToken\)/);
  assert.match(serviceSource, /else if \(microsoftRefreshToken\)/);
});

test("automatic calendar sync is idempotent and supports flyer attachments", () => {
  assert.match(serviceSource, /function googleEventId\(eventId: string\)/);
  assert.match(serviceSource, /transactionId:\s*`envitefy:\$\{params\.eventId\}`/);
  assert.match(serviceSource, /supportsAttachments:\s*Boolean\(params\.flyer\)/);
  assert.match(serviceSource, /#microsoft\.graph\.fileAttachment/);
  assert.match(serviceSource, /existingProvider\.status === "synced"/);
});

test("private provider sync identifiers are removed from public event projections", () => {
  assert.match(historyRouteSource, /delete redacted\.calendarSync/);
  assert.match(dbSource, /- 'ocrText' - 'calendarSync'/);
});
