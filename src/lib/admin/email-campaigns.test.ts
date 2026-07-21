import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildIndividualCampaignRecipients,
  buildStoredCampaignAudienceFilter,
  isIndividualCampaignAudience,
  parseIndividualCampaignEmails,
  parseStoredCampaignAudienceFilter,
} from "./email-campaigns.ts";

const repoRoot = process.cwd();

test("individual sends are recognized and stored without raw recipient emails by default", () => {
  assert.equal(
    isIndividualCampaignAudience({
      testEmail: "first@example.com, second@example.com",
    }),
    true,
  );

  assert.deepEqual(
    buildStoredCampaignAudienceFilter(
      {
        testEmail: "first@example.com, second@example.com",
      },
      2,
      { rawHtml: true },
    ),
    {
      audienceMode: "individual",
      recipientCount: 2,
      rawHtml: true,
    },
  );
});

test("drafts persist test emails and CTA fields for later send", () => {
  const stored = buildStoredCampaignAudienceFilter(
    { testEmail: "a@example.com, b@example.com" },
    2,
    {
      persistTestEmail: true,
      buttonText: "Open Envitefy",
      buttonUrl: "https://envitefy.com",
    },
  );

  assert.deepEqual(stored, {
    audienceMode: "individual",
    recipientCount: 2,
    testEmail: "a@example.com, b@example.com",
    buttonText: "Open Envitefy",
    buttonUrl: "https://envitefy.com",
  });

  const parsed = parseStoredCampaignAudienceFilter(stored);
  assert.equal(parsed.audienceFilter.testEmail, "a@example.com, b@example.com");
  assert.equal(parsed.buttonText, "Open Envitefy");
  assert.equal(parsed.buttonUrl, "https://envitefy.com");
  assert.equal(parsed.rawHtml, false);
});

test("broadcast sends retain filter metadata for history queries", () => {
  assert.equal(isIndividualCampaignAudience({ testEmail: null }), false);

  assert.deepEqual(
    buildStoredCampaignAudienceFilter(
      {
        minScans: 5,
        maxScans: 100,
        lastActiveAfter: "2026-01-01",
        lastActiveBefore: "2026-04-01",
      },
      42,
    ),
    {
      audienceMode: "broadcast",
      recipientCount: 42,
      minScans: 5,
      maxScans: 100,
      lastActiveAfter: "2026-01-01",
      lastActiveBefore: "2026-04-01",
    },
  );
});

test("individual recipient helpers dedupe emails and merge user names", () => {
  const emails = parseIndividualCampaignEmails(
    "Taylor@Example.com, no-name@example.com\nTaylor@example.com; invalid",
  );

  assert.deepEqual(emails, ["Taylor@Example.com", "no-name@example.com"]);

  assert.deepEqual(
    buildIndividualCampaignRecipients(emails, [
      {
        email: "taylor@example.com",
        first_name: " Taylor ",
        last_name: " Lee ",
      },
    ]),
    [
      {
        email: "Taylor@Example.com",
        firstName: "Taylor",
        lastName: "Lee",
      },
      {
        email: "no-name@example.com",
        firstName: null,
        lastName: null,
      },
    ],
  );
});

test("campaign draft schedule and process-due source guards", () => {
  const migration = fs.readFileSync(
    path.join(repoRoot, "prisma/manual_sql/20260720_add_email_campaigns_scheduled_at.sql"),
    "utf8",
  );
  assert.match(migration, /scheduled_at TIMESTAMPTZ/);
  assert.match(migration, /idx_email_campaigns_status_scheduled_at/);

  const sendLib = fs.readFileSync(
    path.join(repoRoot, "src/lib/admin/email-campaign-send.ts"),
    "utf8",
  );
  assert.match(sendLib, /status = 'draft'/);
  assert.match(sendLib, /status = 'queued'/);
  assert.match(sendLib, /processDueCampaigns/);
  assert.match(sendLib, /FOR UPDATE SKIP LOCKED/);
  assert.match(sendLib, /persistTestEmail/);
  assert.match(sendLib, /ensureEmailCampaignsSchema/);

  const schemaLib = fs.readFileSync(
    path.join(repoRoot, "src/lib/admin/email-campaign-schema.ts"),
    "utf8",
  );
  assert.match(schemaLib, /scheduled_at TIMESTAMPTZ/);
  assert.match(schemaLib, /ADD COLUMN IF NOT EXISTS scheduled_at/);

  const processDueRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/api/admin/campaigns/process-due/route.ts"),
    "utf8",
  );
  assert.match(processDueRoute, /ADMIN_EMAIL_CRON_SECRET/);
  assert.match(processDueRoute, /Bearer \$\{secret\}/);

  const campaignsRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/api/admin/campaigns/route.ts"),
    "utf8",
  );
  assert.match(campaignsRoute, /upsertCampaignDraft/);
  assert.match(campaignsRoute, /scheduled_at/);
  assert.match(campaignsRoute, /processDueCampaigns/);

  const patchRoute = fs.readFileSync(
    path.join(repoRoot, "src/app/api/admin/campaigns/[id]/route.ts"),
    "utf8",
  );
  assert.match(patchRoute, /action === "schedule"/);
  assert.match(patchRoute, /action === "cancel"/);

  const ui = fs.readFileSync(
    path.join(repoRoot, "src/components/admin/EmailCampaignsClient.tsx"),
    "utf8",
  );
  assert.match(ui, /Save draft/);
  assert.match(ui, /Schedule send/);
  assert.match(ui, /editingCampaignId/);
  assert.match(ui, /processDue/);
});
