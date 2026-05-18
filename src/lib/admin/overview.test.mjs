import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin events data includes category, share, and RSVP summaries", () => {
  const source = readSource("src/lib/admin/events.ts");

  assert.match(source, /AdminEventCategorySummary/);
  assert.match(source, /event_shares/);
  assert.match(source, /rsvp_responses/);
  assert.match(source, /rsvpSelect/);
  assert.match(source, /humanizeCategory/);
});

test("admin concierge data summarizes sessions, threads, and messages", () => {
  const source = readSource("src/lib/admin/concierge.ts");

  assert.match(source, /creation_sessions/);
  assert.match(source, /conversation_threads/);
  assert.match(source, /conversation_messages/);
  assert.match(source, /active7Days/);
});

test("admin analytics exposes disconnected GA4 state and tracking gaps", () => {
  const source = readSource("src/lib/admin/analytics.ts");
  const ga4Reporting = readSource("src/lib/admin/ga4-reporting.ts");

  assert.match(source, /GOOGLE_ANALYTICS_PROPERTY_ID/);
  assert.match(source, /Google Analytics is not connected/);
  assert.match(source, /getGa4DashboardSnapshot/);
  assert.match(ga4Reporting, /analyticsdata/);
  assert.match(ga4Reporting, /runReport/);
  assert.match(ga4Reporting, /GOOGLE_APPLICATION_CREDENTIALS_BASE64/);
  assert.match(source, /public_event_view/);
  assert.match(source, /share_link_click/);
  assert.match(source, /registry_click/);
});

test("admin overview keeps first-party tracking readiness explicit", () => {
  const source = readSource("src/lib/admin/overview.ts");

  assert.match(source, /First-party funnel events are placeholders/);
  assert.match(source, /First-party event tracking is active/);
  assert.match(source, /views, share clicks, registry clicks/i);
  assert.match(source, /getEmailCampaignSummary/);
  assert.match(source, /listMarketingRuns/);
});
