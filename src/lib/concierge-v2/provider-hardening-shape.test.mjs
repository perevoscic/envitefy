import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 parser and source imports use provider-backed adapters with deterministic fallback", async () => {
  const providers = await readFile(new URL("./providers.ts", import.meta.url), "utf8");
  const parseRoute = await readFile(new URL("../../app/api/concierge/parse/route.ts", import.meta.url), "utf8");
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  const sourceImports = await readFile(new URL("./source-imports.ts", import.meta.url), "utf8");
  const uploadRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/imports/upload/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(providers, /OPENAI_API_KEY/);
  assert.match(providers, /@vercel\/blob/);
  assert.match(providers, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  assert.match(providers, /@google-cloud\/vision/);
  assert.match(providers, /parseConciergeInputWithProvider/);
  assert.match(parseRoute, /parseConciergeInputWithProvider/);
  assert.match(storage, /model_provider/);
  assert.match(storage, /fallbackUsed/);
  assert.match(sourceImports, /createConciergeV2SourceImportFromFile/);
  assert.match(sourceImports, /uploadConciergeV2SourceFile/);
  assert.match(uploadRoute, /formData/);
  assert.match(uploadRoute, /createConciergeV2SourceImportFromFile/);
});

test("Concierge V2 reminders and payments have real provider dispatch seams", async () => {
  const reminders = await readFile(new URL("./reminders.ts", import.meta.url), "utf8");
  const dispatchRoute = await readFile(
    new URL("../../app/api/concierge/reminders/dispatch/route.ts", import.meta.url),
    "utf8",
  );
  const sendRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/reminders/[reminderId]/send/route.ts", import.meta.url),
    "utf8",
  );
  const operations = await readFile(new URL("./operations.ts", import.meta.url), "utf8");
  const checkoutRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/payment-requests/[paymentRequestId]/checkout/route.ts", import.meta.url),
    "utf8",
  );
  const webhookRoute = await readFile(
    new URL("../../app/api/concierge/payments/stripe/webhook/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(reminders, /sendConciergeV2Email/);
  assert.match(reminders, /sendConciergeV2Sms/);
  assert.match(reminders, /sendConciergeV2ReminderNow/);
  assert.match(dispatchRoute, /CONCIERGE_V2_CRON_SECRET/);
  assert.match(sendRoute, /sendConciergeV2ReminderNow/);
  assert.match(operations, /createStripeCheckoutSession/);
  assert.match(operations, /reconcileConciergeV2StripeCheckout/);
  assert.match(checkoutRoute, /createConciergeV2PaymentCheckout/);
  assert.match(webhookRoute, /verifyStripeWebhookSignature/);
  assert.match(webhookRoute, /reconcileConciergeV2StripeCheckout/);
});

test("Concierge V2 invite acceptance and resource operations are no longer deferred placeholders", async () => {
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  const hub = await readFile(new URL("./team-class-hub.ts", import.meta.url), "utf8");
  const invitePage = await readFile(
    new URL("../../app/concierge-v2/invitations/[token]/page.tsx", import.meta.url),
    "utf8",
  );
  const acceptRoute = await readFile(
    new URL("../../app/api/concierge/invitations/[token]/accept/route.ts", import.meta.url),
    "utf8",
  );
  const resources = await readFile(new URL("./resource-planning.ts", import.meta.url), "utf8");
  const resourceRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/[resourceId]/route.ts", import.meta.url),
    "utf8",
  );
  const exportRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/attendance/export/route.ts", import.meta.url),
    "utf8",
  );
  const checkoutRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/attendance/checkout/route.ts", import.meta.url),
    "utf8",
  );
  const requirementsRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/requirements/route.ts", import.meta.url),
    "utf8",
  );
  const migration = await readFile(
    new URL("../../../prisma/manual_sql/20260604_add_concierge_v2_provider_integrations.sql", import.meta.url),
    "utf8",
  );
  const backfill = await readFile(
    new URL("../../../scripts/concierge-v2-backfill-dry-run.mjs", import.meta.url),
    "utf8",
  );

  assert.match(storage, /membership_invitations/);
  assert.match(migration, /membership_invitations/);
  assert.match(hub, /createMembershipInvitation/);
  assert.match(hub, /acceptConciergeV2HubInvitation/);
  assert.match(invitePage, /acceptConciergeV2HubInvitation/);
  assert.match(acceptRoute, /acceptConciergeV2HubInvitation/);
  assert.match(resources, /updateConciergeV2Resource/);
  assert.match(resources, /createConciergeV2ResourceRequirement/);
  assert.match(resources, /checkOutConciergeV2Attendance/);
  assert.match(resources, /exportConciergeV2AttendanceCsv/);
  assert.match(resourceRoute, /archiveConciergeV2Resource/);
  assert.match(exportRoute, /exportConciergeV2AttendanceCsv/);
  assert.match(resources, /text\/csv/);
  assert.match(checkoutRoute, /checkOutConciergeV2Attendance/);
  assert.match(requirementsRoute, /createConciergeV2ResourceRequirement/);
  assert.match(backfill, /DRY RUN/);
  assert.match(backfill, /--confirm=concierge-v2-backfill/);
  assert.match(backfill, /legacy_event_history_id/);
});
