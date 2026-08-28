import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const routeSource = fs.readFileSync(path.join(process.cwd(), "src/app/api/events/calendar/auto/route.ts"), "utf8");
const dashboardSource = fs.readFileSync(path.join(process.cwd(), "src/components/Dashboard.tsx"), "utf8");
const historyRouteSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/history/[id]/route.ts"),
  "utf8",
);
const dbSource = fs.readFileSync(path.join(process.cwd(), "src/lib/db.ts"), "utf8");

test("snap/upload creation starts silent automatic calendar sync after history is saved", () => {
  assert.match(dashboardSource, /fetch\("\/api\/events\/calendar\/auto"/);
  assert.match(dashboardSource, /keepalive:\s*true/);
  assert.match(routeSource, /row\.user_id !== userId/);
});

test("automatic calendar sync is idempotent and supports flyer attachments", () => {
  assert.match(routeSource, /function googleEventId\(eventId: string\)/);
  assert.match(routeSource, /transactionId:\s*`envitefy:\$\{params\.eventId\}`/);
  assert.match(routeSource, /supportsAttachments:\s*Boolean\(params\.flyer\)/);
  assert.match(routeSource, /#microsoft\.graph\.fileAttachment/);
  assert.match(routeSource, /existingProvider\.status === "synced"/);
});

test("private provider sync identifiers are removed from public event projections", () => {
  assert.match(historyRouteSource, /delete redacted\.calendarSync/);
  assert.match(dbSource, /- 'ocrText' - 'calendarSync'/);
});
