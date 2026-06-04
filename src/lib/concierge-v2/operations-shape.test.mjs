import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 apply publishes stored operation ids into event_history data", async () => {
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  assert.match(storage, /function withStoredPublicSections/);
  assert.match(storage, /updateEventHistoryData\(eventHistory\.id, storedPublicData\)/);
  assert.match(storage, /forms: storedForms/);
  assert.match(storage, /volunteerSlots: storedVolunteerSlots/);
  assert.match(storage, /paymentItems: storedPaymentItems/);
});

test("Concierge V2 public operations use row-backed endpoints and capacity guards", async () => {
  const operations = await readFile(new URL("./operations.ts", import.meta.url), "utf8");
  assert.match(operations, /submitConciergeV2FormResponse/);
  assert.match(operations, /claimConciergeV2VolunteerSlot/);
  assert.match(operations, /updateConciergeV2PaymentStatus/);
  assert.match(operations, /set claimed_quantity = coalesce\(vs\.claimed_quantity, 0\) \+ \$5/);
  assert.match(operations, /coalesce\(vs\.claimed_quantity, 0\) \+ \$5 <= vs\.quantity_needed/);
  assert.match(operations, /requireOwner\(page, params\.userId\)/);
});

test("Concierge V2 public page exposes real form and volunteer submissions", async () => {
  const component = await readFile(
    new URL("../../components/concierge/ConciergePublicOperations.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/forms\//);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/volunteer-slots\//);
  assert.doesNotMatch(component, /Response disabled[\s\S]*Claim this[\s\S]*fetch\(\/api\/fake/);
});
