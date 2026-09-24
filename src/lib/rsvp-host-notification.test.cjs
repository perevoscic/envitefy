const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { NextResponse } = require("next/server");

function setup({ eventData = {}, hostEmail = "host@example.test", ownerEmail = "owner@example.test", changed = true, signedIn = false, self = false, guestFailure = false, saveFailure = false } = {}) {
  const jobs = [];
  const host = [];
  const guest = [];
  const statements = [];
  const route = loadTs("src/app/api/events/[id]/rsvp/route.ts", {
    "next/server": { NextResponse, after: (callback) => jobs.push(callback) },
    "next-auth": { getServerSession: async () => signedIn ? { user: { email: self ? ownerEmail : "guest@example.test" } } : null },
    "@/lib/auth": { authOptions: {} },
    "@/lib/event-draft-access-server": { guardDraftRequest: async () => null },
    "@/lib/history-cache": { invalidateUserHistory() {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
    "@/lib/absolute-url": { absoluteUrl: async (path) => `https://envitefy.com${path}` },
    "@/utils/calendar-handoff": { buildCalendarHandoffPath: () => "/calendar/add" },
    "@/lib/calendar-date-time": { parseCalendarDateTimeToIso: () => null },
    "@/lib/calendar-preference": { CALENDAR_PROVIDER_NAMES: {} },
    "@/lib/db": {
      getUserIdByEmail: async () => self ? "owner-id" : "guest-id",
      query: async (sql) => {
        statements.push(sql);
        if (sql.includes("to_regclass")) return { rows: [{ exists: "rsvp_responses" }] };
        if (sql.startsWith("alter table")) return { rows: [] };
        if (sql.startsWith("SELECT user_id")) return { rows: [{ user_id: "owner-id", title: "Livia is turning 10", public_slug: "livia", data: { category: "Birthday", rsvpEmail: hostEmail, rsvpName: "Host", ...eventData } }] };
        if (sql.includes("INSERT INTO rsvp_responses")) {
          if (saveFailure) throw new Error("Synthetic database failure");
          return { rows: changed ? [{ id: "response-id" }] : [] };
        }
        if (sql.startsWith("SELECT email FROM users")) return { rows: [{ email: ownerEmail }] };
        throw new Error(`Unexpected query: ${sql}`);
      },
    },
    "@/lib/email": {
      sendRsvpConfirmationEmail: async (message) => { guest.push(message); if (guestFailure) throw new Error("Synthetic guest mail failure"); },
      sendHostRsvpNotificationEmail: async (message) => host.push(message),
    },
  });
  return { host, guest, jobs, statements, submit: async (response) => {
    const result = await route.POST(new Request("https://envitefy.com/api/events/event-id/rsvp", {
      method: "POST", body: JSON.stringify({ response, name: "Taylor", email: "guest@example.test", message: "We will bring snacks.", adultCount: 2, kidCount: 1, hostEmail: "forged@example.test" }),
    }), { params: Promise.resolve({ id: "event-id" }) });
    assert.equal(host.length, 0, "mail waits until after the saved RSVP response");
    await Promise.all(jobs.map((work) => work()));
    return result;
  } };
}

test("guest confirmation uses the public renderer while host mail keeps the workspace URL", async () => {
  for (const [primaryOutput, prefix] of [["live_card", "card"], ["event_page", "event"], ["signup_form", "smart-signup-form"]]) {
    const fixture = setup({ eventData: { primaryOutput } });
    assert.equal((await fixture.submit("yes")).status, 200);
    assert.equal(fixture.guest[0].eventUrl, `https://envitefy.com/${prefix}/livia`);
    assert.match(fixture.host[0].dashboardUrl, /\/event\/livia\?tab=rsvps$/);
  }
});

test("host receives Yes, Maybe and No; declined guest receives no email", async () => {
  for (const response of ["yes", "maybe", "no"]) {
    const fixture = setup({ signedIn: response === "maybe" });
    assert.equal((await fixture.submit(response)).status, 200);
    assert.equal(fixture.host.length, 1);
    assert.equal(fixture.guest.length, response === "no" ? 0 : 1);
    const message = fixture.host[0];
    assert.equal(message.toEmail, "host@example.test");
    assert.equal(message.response, response);
    assert.equal(message.guestName, "Taylor");
    assert.equal(message.message, "We will bring snacks.");
    assert.equal(message.adultCount, 2);
    assert.equal(message.kidCount, 1);
    assert.match(message.dashboardUrl, /^https:\/\/.+\/event\/livia\?tab=rsvps$/);
    assert.equal(fixture.statements.some((sql) => sql.startsWith("SELECT email FROM users")), false);
  }
});

test("host notifications use owner account fallback only when no valid saved host email exists", async () => {
  for (const hostEmail of ["", "invalid"]) {
    const fixture = setup({ hostEmail });
    await fixture.submit("yes");
    assert.equal(fixture.host[0].toEmail, "owner@example.test");
  }
});

test("identical resubmissions and self RSVPs do not send duplicate host alerts", async () => {
  for (const options of [{ changed: false }, { signedIn: true, changed: false }, { signedIn: true, self: true }, { hostEmail: "GUEST@example.test" }]) {
    const fixture = setup(options);
    await fixture.submit("yes");
    assert.equal(fixture.host.length, 0);
    const sql = fixture.statements.find((statement) => statement.includes("INSERT INTO rsvp_responses"));
    assert.match(sql, /IS DISTINCT FROM/);
    assert.match(sql, /RETURNING id/);
  }
});

test("host alerts survive guest-mail failure; failed RSVP saves send no emails", async () => {
  const guestFailed = setup({ guestFailure: true });
  assert.equal((await guestFailed.submit("yes")).status, 200);
  assert.equal(guestFailed.host.length, 1);
  const saveFailed = setup({ saveFailure: true });
  assert.equal((await saveFailed.submit("yes")).status, 500);
  assert.equal(saveFailed.jobs.length, 0);
});

test("host email includes the saved response, escaped details, signature and guest reply address", async () => {
  const sent = [];
  const { sendHostRsvpNotificationEmail } = loadTs("src/lib/email.ts", {
    "@/lib/db": {}, "@/lib/mail-transport": { sendTransactionalEmail: async (message) => sent.push(message) },
  });
  await sendHostRsvpNotificationEmail({ toEmail: "host@example.test", hostName: "Host", guestName: "Taylor <script>", guestEmail: "guest@example.test", response: "no", eventTitle: "Livia's birthday", dashboardUrl: "https://envitefy.com/event/livia?tab=rsvps", message: "Sorry!\nWe cannot attend.", adultCount: 0 });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "host@example.test");
  assert.equal(sent[0].replyTo, "guest@example.test");
  assert.match(sent[0].html, /No — Declined/);
  assert.match(sent[0].html, /&lt;script&gt;/);
  assert.doesNotMatch(sent[0].html, /<script>/);
  assert.match(sent[0].html, /Sorry!<br\/>We cannot attend/);
  assert.match(sent[0].html, /Adults:<\/strong> 0/);
  assert.match(sent[0].html, /View RSVPs/);
  assert.match(sent[0].text, /Envitefy Team/);
});
