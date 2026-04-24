import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStoredCampaignAudienceFilter,
  isIndividualCampaignAudience,
} from "./email-campaigns.ts";

test("individual sends are recognized and stored without raw recipient emails", () => {
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
