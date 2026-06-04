import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 reminders use providerless dry-run deliveries", async () => {
  const source = await readFile(new URL("./reminders.ts", import.meta.url), "utf8");
  assert.match(source, /dryRunConciergeV2Reminder/);
  assert.match(source, /sendConciergeV2ReminderNow/);
  assert.match(source, /dispatchDueConciergeV2Reminders/);
  assert.match(source, /status, provider, error_message, metadata_json/);
  assert.match(source, /'dry_run', 'stub'/);
  assert.match(source, /providerCalled: false/);
  assert.match(source, /sendConciergeV2Email/);
  assert.match(source, /sendConciergeV2Sms/);
});

test("Concierge V2 reminder APIs expose queue, preview, dry run, send, and status routes", async () => {
  const queueRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/reminders/route.ts", import.meta.url),
    "utf8",
  );
  const previewRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/reminders/[reminderId]/preview/route.ts", import.meta.url),
    "utf8",
  );
  const dryRunRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/reminders/[reminderId]/dry-run/route.ts", import.meta.url),
    "utf8",
  );
  const statusRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/reminders/[reminderId]/status/route.ts", import.meta.url),
    "utf8",
  );
  const sendRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/reminders/[reminderId]/send/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(queueRoute, /getConciergeV2ReminderQueue/);
  assert.match(previewRoute, /previewConciergeV2Reminder/);
  assert.match(dryRunRoute, /dryRunConciergeV2Reminder/);
  assert.match(sendRoute, /sendConciergeV2ReminderNow/);
  assert.match(statusRoute, /updateConciergeV2ReminderStatus/);
});

test("Concierge V2 ops UI exposes preview, dry-run, and provider send actions", async () => {
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/ops/ConciergeV2OpsClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/reminders/);
  assert.match(component, /Dry run/);
  assert.match(component, /Send now/);
  assert.match(component, /Preview/);
  assert.match(component, /\/send/);
});
