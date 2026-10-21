const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../../scripts/lib/event-messages-test-loader.cjs");

function fixture() {
  const rows = new Map();
  const sends = [];
  const queries = [];
  const legacy = { id: "legacy", subject: "Existing subject", body_html: '<p style="color:#111827">Existing body</p>', from_email: "Envitefy <hello@envitefy.com>", audience_filter: { testEmail: "guest@example.test", rawHtml: false }, recipient_count: 1, status: "draft", scheduled_at: null };
  rows.set(legacy.id, structuredClone(legacy));
  const query = async (sql, values = []) => {
    const q = sql.replace(/\s+/g, " ").trim();
    queries.push({ q, values });
    if (/FROM users/.test(q)) return { rows: [{ email: "guest@example.test", first_name: "Guest", last_name: null }] };
    if (/^SELECT .* FROM email_campaigns/.test(q)) return { rows: rows.has(values[0]) ? [structuredClone(rows.get(values[0]))] : [] };
    if (/^INSERT INTO email_campaigns/.test(q)) {
      const id = `new-${rows.size}`;
      rows.set(id, { id, subject: values[1], body_html: values[2], from_email: values[3], audience_filter: JSON.parse(values[4]), recipient_count: values[5], status: /'draft'/.test(q) ? "draft" : "sending", scheduled_at: null });
      return { rows: [{ id }] };
    }
    if (/WHERE id IN/.test(q)) {
      const claimed = [...rows.values()].filter(row => row.status === "queued" && new Date(row.scheduled_at) <= new Date(values[0]));
      claimed.forEach(row => { row.status = "sending"; });
      return { rows: structuredClone(claimed) };
    }
    if (/^UPDATE email_campaigns/.test(q) && /subject = \$1/.test(q)) {
      const row = rows.get(values[5]);
      if (!row) return { rows: [] };
      Object.assign(row, { subject: values[0], body_html: values[1], from_email: values[2], audience_filter: JSON.parse(values[3]) });
      if (/status = 'queued'/.test(q)) Object.assign(row, { status: "queued", scheduled_at: values[4] });
      else row.status = /status = 'draft'/.test(q) ? "draft" : "sending";
      return { rows: [{ id: row.id, scheduled_at: row.scheduled_at }] };
    }
    if (/status = \$1/.test(q)) {
      const row = rows.get(values[4]);
      if (row) row.status = values[0];
      return { rows: [] };
    }
    throw new Error(`Unexpected query: ${q}`);
  };
  const email = load("src/lib/admin/email-campaign-send.ts", {
    "../db.ts": { query, ensureUsersHasLegalPrivacyColumns: async () => {} },
    "../resend.ts": { sendBulkEmail: async message => { sends.push(message); return { sent: 1, failed: 0, errors: [] }; } },
    "./email-campaign-schema.ts": { ensureEmailCampaignsSchema: async () => {} },
  });
  return { email, rows, sends, legacy, queries };
}

test("new saved compositions get adaptive-v1 while missing persisted metadata resolves to legacy", async () => {
  const { email, rows } = fixture();
  const result = await email.upsertCampaignDraft({ adminUserId: "admin", subject: "New", bodyHtml: "<p>New body</p>", audienceFilter: { testEmail: "guest@example.test" } });
  assert.equal(rows.get(result.id).audience_filter.emailDesignVersion, "adaptive-v1");
  await email.upsertCampaignDraft({ adminUserId: "admin", campaignId: "legacy", subject: "Edited old", bodyHtml: "<p>Edited body</p>", emailDesignVersion: "adaptive-v1", audienceFilter: { testEmail: "guest@example.test" } });
  assert.equal(rows.get("legacy").audience_filter.emailDesignVersion, "legacy", "request metadata must not upgrade an existing composition");
});

test("saving and scheduling new or legacy campaigns preserves their version without transforming body HTML", async () => {
  const { email, rows, legacy } = fixture();
  const scheduledAt = new Date(Date.now() + 60_000);
  await email.scheduleCampaign({ campaignId: "legacy", scheduledAt, emailDesignVersion: "adaptive-v1" });
  assert.equal(rows.get("legacy").audience_filter.emailDesignVersion, "legacy");
  assert.equal(rows.get("legacy").body_html, legacy.body_html);
  const created = await email.upsertCampaignDraft({ adminUserId: "admin", subject: "New", bodyHtml: "<p>Brand new</p>", audienceFilter: { testEmail: "guest@example.test" } });
  await email.scheduleCampaign({ campaignId: created.id, scheduledAt });
  assert.equal(rows.get(created.id).audience_filter.emailDesignVersion, "adaptive-v1");
  assert.equal(rows.get(created.id).body_html, "<p>Brand new</p>");
});

test("immediate and due sends resolve persisted version instead of adopting a new global default", async () => {
  const { email, rows, sends, legacy } = fixture();
  await email.sendCampaignNow({ adminUserId: "admin", campaignId: "legacy", subject: legacy.subject, bodyHtml: legacy.body_html, emailDesignVersion: "adaptive-v1", audienceFilter: { testEmail: "guest@example.test" } });
  assert.equal(sends[0].emailDesignVersion, "legacy");
  assert.equal(sends[0].body, legacy.body_html);
  await email.sendCampaignNow({ adminUserId: "admin", subject: "New", bodyHtml: "<p>New</p>", audienceFilter: { testEmail: "guest@example.test" } });
  assert.equal(sends[1].emailDesignVersion, "adaptive-v1");
  rows.set("old-queued", { ...legacy, id: "old-queued", status: "queued", scheduled_at: new Date(Date.now() - 60_000).toISOString() });
  await email.processDueCampaigns();
  assert.equal(sends[2].emailDesignVersion, "legacy");
  assert.equal(sends[2].body, legacy.body_html);
});

test("raw delivery keeps legacy HTML and uses adaptive wrappers only for new compositions", async () => {
  const captured = [];
  const previous = { key: process.env.RESEND_API_KEY, address: process.env.LEGAL_POSTAL_ADDRESS, fetch: global.fetch };
  process.env.RESEND_API_KEY = "fixture-key";
  process.env.LEGAL_POSTAL_ADDRESS = "Fixture address";
  global.fetch = async (_url, options) => { captured.push(JSON.parse(options.body)); return { ok: true, status: 200, text: async () => "" }; };
  try {
    const { sendBulkEmail } = load("src/lib/resend.ts", { "./marketing-unsubscribe": { createMarketingUnsubscribeUrl: async () => "https://envitefy.com/unsubscribe?token=fixture" } });
    const original = '<!doctype html><html><head><title>Old</title></head><body style="background:#FFFFFF;color:#111827"><p>Hi {{firstName}}</p><a href="{{unsubscribeUrl}}">Unsubscribe</a></body></html>';
    const base = { subject: "Fixture", body: original, recipients: [{ email: "guest@example.test", firstName: "Guest" }], rawHtml: true };
    await sendBulkEmail({ ...base, emailDesignVersion: "legacy" });
    await sendBulkEmail({ ...base, emailDesignVersion: "adaptive-v1" });
    assert.doesNotMatch(captured[0].html, /adaptive-v1|email-footer-band|#251F2D/);
    assert.match(captured[0].html, /<body style="background:#FFFFFF;color:#111827">/);
    assert.match(captured[1].html, /data-email-design="adaptive-v1"/);
    assert.match(captured[1].html, /email-footer-band/);
    for (const message of captured) {
      assert.match(message.html, /Hi Guest/);
      assert.match(message.html, /href="https:\/\/envitefy.com\/unsubscribe\?token=fixture"/);
      assert.match(message.headers["List-Unsubscribe"], /\/api\/email\/unsubscribe\?token=fixture/);
    }
  } finally {
    global.fetch = previous.fetch;
    if (previous.key === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous.key;
    if (previous.address === undefined) delete process.env.LEGAL_POSTAL_ADDRESS; else process.env.LEGAL_POSTAL_ADDRESS = previous.address;
  }
});

test("Reuse composes adaptive mail while same-id editing and original campaign remain legacy", async () => {
  const { email, rows, sends, legacy } = fixture();
  const { campaignComposerEmailDesignVersion, parseStoredCampaignAudienceFilter } = load("src/lib/admin/email-campaigns.ts");
  const stored = parseStoredCampaignAudienceFilter(legacy.audience_filter).emailDesignVersion;
  assert.equal(campaignComposerEmailDesignVersion("edit", stored), "legacy");
  const version = campaignComposerEmailDesignVersion("reuse", stored);
  assert.equal(version, "adaptive-v1");
  const original = structuredClone(rows.get("legacy"));
  const copy = await email.upsertCampaignDraft({ adminUserId: "admin", subject: legacy.subject, bodyHtml: legacy.body_html, emailDesignVersion: version, audienceFilter: { testEmail: "guest@example.test" } });
  assert.notEqual(copy.id, "legacy");
  assert.equal(rows.get(copy.id).audience_filter.emailDesignVersion, "adaptive-v1");
  assert.deepEqual(rows.get("legacy"), original);
  await email.sendCampaignNow({ adminUserId: "admin", campaignId: copy.id, subject: legacy.subject, bodyHtml: legacy.body_html, audienceFilter: { testEmail: "guest@example.test" } });
  assert.equal(sends[0].emailDesignVersion, "adaptive-v1");
  assert.deepEqual(rows.get("legacy"), original);
  const { createEmailTemplate } = load("src/lib/email-template.ts");
  assert.match(createEmailTemplate({ title: legacy.subject, body: legacy.body_html, emailDesignVersion: version }), /data-email-design="adaptive-v1"/);
});
