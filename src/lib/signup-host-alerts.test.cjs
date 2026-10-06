const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { NextResponse } = require("next/server");
const activity = load("src/lib/signup-host-activity.ts");

function form(responses = []) {
  return { version: 1, title: "Fall picnic", enabled: true,
    sections: [{ id: "food", title: "Food", slots: [{ id: "dessert", label: "Desserts", capacity: 3, startTime: "12:00", endTime: "13:00" }] }],
    questions: [{ id: "allergy", prompt: "Allergies?" }], timezone: "America/Chicago", responses };
}
function response(extra = {}) {
  return { id: "response", name: "Alex", email: null, phone: null, status: "confirmed",
    createdAt: "2026-10-06T12:00:00Z", updatedAt: "2026-10-06T12:00:00Z",
    slots: [{ sectionId: "food", slotId: "dessert", quantity: 2 }], answers: [], ...extra };
}

test("activity distinguishes new, changed, cancelled, waitlisted and automatically promoted signups", () => {
  assert.equal(activity.signupHostActivities(form(), form([response()]))[0].kind, "new_signup");
  const previous = response();
  const changed = response({ note: "Bring ice", guests: 2, answers: [{ questionId: "allergy", value: "Nuts" }] });
  const result = activity.signupHostActivities(form([previous]), form([changed]))[0];
  assert.equal(result.kind, "changed");
  assert.ok(result.changes.includes("Allergies?: Not provided → Nuts"));
  assert.equal(result.guests, 2);
  assert.ok(result.changes.includes("Extra guests: 0 → 2"));
  assert.match(result.selections[0], /Food: Desserts ×2.*12:00–13:00.*America\/Chicago/);
  assert.equal(result.email, null, "host alerts do not require guest email");
  const waitlisted = response({ id: "second", status: "waitlisted" });
  const events = activity.signupHostActivities(form([previous, waitlisted]), form([response({ status: "cancelled" }), { ...waitlisted, status: "confirmed" }]));
  assert.deepEqual(events.map((event) => event.kind), ["cancelled", "promoted"]);
  assert.equal(activity.signupHostActivities(form(), form([waitlisted]))[0].kind, "waitlisted");
});

test("timestamp-only changes, reordered selections and repeat cancellations do not enqueue duplicate activity", () => {
  const previous = response({ slots: [{ sectionId: "food", slotId: "dessert", quantity: 2 }, { sectionId: "food", slotId: "drinks", quantity: 1 }] });
  assert.deepEqual(activity.signupHostActivities(form([previous]), form([{ ...previous, updatedAt: "later", slots: [...previous.slots].reverse() }])), []);
  const cancelled = response({ status: "cancelled" });
  assert.deepEqual(activity.signupHostActivities(form([cancelled]), form([{ ...cancelled, updatedAt: "later" }])), []);
});

function setup({ sendFailure, owner = true, allowed = true, optIn = true, ackFailure = false, draft = false } = {}) {
  const jobs = [];
  const mail = [];
  const statements = [];
  let prefs = activity.defaultSignupHostPreferences(optIn);
  const row = { id: "event", user_id: owner ? "recipient" : "owner", title: "Fall picnic", public_slug: "fall-picnic",
    data: { status: draft ? "draft" : "published", signupForm: form() } };
  let schemaReady = true;
  const dbQuery = async (sql, args = []) => {
    statements.push({ sql, args });
    if (sql.includes("FROM pg_class")) return { rows: [{ ready: schemaReady }] };
    if (/^(BEGIN|COMMIT|ROLLBACK)/.test(sql) || sql.startsWith("\nCREATE TABLE")) return { rows: [] };
    if (sql.includes("SELECT u.id")) return { rows: [{ id: "recipient", ...prefs }] };
    if (sql.startsWith("INSERT INTO signup_host_alerts")) {
      jobs.push({ id: args[0], event_id: args[1], recipient_id: args[2], change_id: args[3], activity: JSON.parse(args[4]), status: "pending", attempts: 0 });
      return { rows: [] };
    }
    if (sql.startsWith("INSERT INTO signup_host_alert_preferences")) {
      prefs = { newSignups: args[2], changes: args[3], cancellations: args[4], waitlist: args[5] };
      return { rows: [] };
    }
    if (sql.includes("SELECT u.email")) return { rows: [{ email: "host@example.test", ...prefs }] };
    if (sql.includes("SELECT id,activity")) return { rows: jobs.map((job) => ({ id: job.id, kind: job.activity.kind, name: job.activity.name, status: job.status, createdAt: "2026-10-06T12:00:00Z" })) };
    if (sql.startsWith("UPDATE signup_host_alerts")) {
      if (sql.includes("WHERE id=(SELECT")) {
        const job = jobs.find((job) => job.status === "pending" && !job.deferred);
        if (!job) return { rows: [] };
        job.status = "sending"; job.attempts++;
        return { rows: [{ ...job }] };
      }
      if (sql.includes("status='unknown'")) return { rows: [] };
      if (sql.includes("status='accepted'") && ackFailure) throw new Error("Acknowledgement database write failed");
      const job = jobs.find((job) => job.id === args[0]);
      if (job) {
        job.status = sql.includes("status=$2") ? args[1] : sql.includes("status='accepted'") ? "accepted" : "skipped";
        job.deferred = job.status === "pending";
      }
      return { rows: [] };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  const client = { query: dbQuery };
  const api = load("src/lib/signup-host-alerts.ts", {
    "@/lib/db": { query: dbQuery, withClient: async (work) => work(client), getEventHistoryById: async () => row,
      mutateSignupEvent: async (_id, mutate) => ({ row, result: (await mutate(row, client)).result }) },
    "@/lib/event-collaboration": { ensureEventCollaboration: async () => {}, getEventPermissions: async () => ({ canManageResponses: allowed }) },
    "@/lib/signup-management": { signupEmailEventUrl: (id) => `https://envitefy.com/smart-signup-form/${id}` },
    "@/lib/email": { sendSignupHostAlertEmail: async (message) => { mail.push(message); if (sendFailure) throw sendFailure; } },
  });
  return { api, jobs, mail, statements, row, client, setSchemaMissing: () => { schemaReady = false; },
    enqueue: () => api.enqueueSignupHostAlerts(client, row, form(), form([response()])),
    optOut: () => { prefs = activity.defaultSignupHostPreferences(false); } };
}

test("owner alerts default on, co-host alerts default off, and queue creation uses the supplied reservation transaction", async () => {
  assert.equal(activity.defaultSignupHostPreferences(true).newSignups, true);
  assert.equal(activity.defaultSignupHostPreferences(false).newSignups, false);
  const fixture = setup();
  await fixture.enqueue();
  assert.equal(fixture.jobs.length, 1);
  assert.ok(fixture.statements[0].sql.includes("c.revoked_at IS NULL"));
  assert.ok(fixture.statements.some(({ sql }) => sql.includes("ON CONFLICT(change_id,recipient_id) DO NOTHING")));
  const optedOut = setup({ owner: false, optIn: false });
  await optedOut.enqueue(); assert.equal(optedOut.jobs.length, 0);
});

test("accepted sends are not sent again and link to the authenticated host dashboard", async () => {
  const fixture = setup(); await fixture.enqueue();
  await fixture.api.processSignupHostAlerts(); await fixture.api.processSignupHostAlerts();
  assert.equal(fixture.mail.length, 1);
  assert.equal(fixture.jobs[0].status, "accepted");
  assert.equal(fixture.mail[0].dashboardUrl, "https://envitefy.com/smart-signup-form/fall-picnic#signup-host-dashboard");
});

test("concurrent workers atomically claim each pending alert once", async () => {
  const fixture = setup(); await fixture.enqueue();
  await Promise.all([fixture.api.processSignupHostAlerts(), fixture.api.processSignupHostAlerts()]);
  assert.equal(fixture.mail.length, 1);
  assert.ok(fixture.statements.some(({ sql }) => sql.includes("FOR UPDATE SKIP LOCKED")));
});

test("signup route commits alerts with the reservation and host delivery is independent of participant confirmation", async () => {
  for (const collectEmail of [false, true]) {
    const fixture = setup();
    const defaults = load("src/utils/signup.ts").createDefaultSignupForm();
    fixture.row.data.signupForm = { ...defaults, ...form(), settings: { ...defaults.settings, collectEmail, collectPhone: false } };
    const background = [], guestMail = [];
    process.env.NEXTAUTH_SECRET = "signup-host-alert-test-secret";
    const route = load("src/app/api/history/[id]/signup/route.ts", {
      "next/server": { NextResponse, after: (job) => background.push(job) },
      "next-auth": { getServerSession: async () => ({ user: { email: "alex@example.test", name: "Alex" } }) },
      "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "guest" },
      "@/lib/event-draft-access-server": { guardDraftRequest: async () => null },
      "@/lib/history-cache": { invalidateUserHistory() {} }, "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
      "@/lib/event-collaboration": { ensureEventCollaboration: async () => {}, getEventPermissions: async () => ({ canManageResponses: false }), collaboratorUserIds: async () => [] },
      "@/lib/db": { isEventSharedWithUser: async () => false, listShareRecipientUserIdsForEvent: async () => [],
        mutateSignupEvent: async (_id, mutate) => { const change = await mutate(fixture.row, fixture.client); fixture.row.data = change.data; return { row: fixture.row, result: change.result }; } },
      "@/lib/signup-host-alerts": fixture.api,
      "@/lib/email": { sendSignupConfirmationEmail: async (message) => { guestMail.push(message); throw new Error("Participant mail unavailable"); } },
    });
    const result = await route.POST(new Request("https://envitefy.com/api/history/event/signup", {
      method: "POST", headers: { origin: "https://envitefy.com" }, body: JSON.stringify({ action: "reserve", name: "Alex", email: collectEmail ? "alex@example.test" : undefined, slots: [{ sectionId: "food", slotId: "dessert", quantity: 1 }] }),
    }), { params: Promise.resolve({ id: "event" }) });
    assert.equal(result.status, 200);
    const data = await result.json();
    assert.equal(data.confirmationEmail, collectEmail ? "failed" : "not_requested");
    assert.equal(fixture.row.data.signupForm.responses.length, 1);
    assert.equal(fixture.jobs.length, 1, "host alert is durable before the response");
    assert.equal(fixture.mail.length, 0, "host SMTP waits until after the guest response");
    await Promise.all(background.map((job) => job()));
    assert.equal(fixture.jobs[0].status, "accepted");
    assert.equal(guestMail.length, collectEmail ? 1 : 0);
    assert.equal(fixture.mail.length, 1);
  }
});

test("temporary SMTP failures are deferred with backoff, permanent failures stop and uncertain sends are held", async () => {
  const cases = [
    [{ code: "ECONNREFUSED", command: "CONN" }, "pending"],
    [{ responseCode: 451, command: "DATA" }, "pending"],
    [{ responseCode: 550, command: "RCPT TO" }, "failed"],
    [{ code: "ETIMEDOUT", command: "DATA" }, "unknown"],
  ];
  for (const [sendFailure, expected] of cases) {
    const fixture = setup({ sendFailure }); await fixture.enqueue();
    await fixture.api.processSignupHostAlerts(); await fixture.api.processSignupHostAlerts();
    assert.equal(fixture.jobs[0].status, expected);
    assert.equal(fixture.mail.length, 1);
    assert.ok(fixture.statements.some(({ sql }) => sql.includes("next_attempt_at=now()+")));
  }
});

test("lost accepted-send acknowledgement is kept in sending and cannot be automatically resent", async () => {
  const fixture = setup({ ackFailure: true }); await fixture.enqueue();
  await assert.rejects(() => fixture.api.processSignupHostAlerts(), /Acknowledgement/);
  await fixture.api.processSignupHostAlerts();
  assert.equal(fixture.mail.length, 1);
  assert.equal(fixture.jobs[0].status, "sending");
});

test("revoked membership, opt-out and unpublished forms skip already queued alerts", async () => {
  for (const options of [{ allowed: false }, { draft: true }, {}]) {
    const fixture = setup(options); await fixture.enqueue();
    if (!Object.keys(options).length) fixture.optOut();
    await fixture.api.processSignupHostAlerts();
    assert.equal(fixture.mail.length, 0); assert.equal(fixture.jobs[0].status, "skipped");
  }
});

test("schema setup protects tables atomically and matches the checked-in SQL migration", async () => {
  const fixture = setup(); fixture.setSchemaMissing();
  await Promise.all([fixture.api.ensureSignupHostAlerts(), fixture.api.ensureSignupHostAlerts()]);
  const statements = fixture.statements.map(({ sql }) => sql);
  assert.deepEqual(statements.filter((sql) => /^(BEGIN|COMMIT|ROLLBACK)/.test(sql)), ["BEGIN", "COMMIT"]);
  for (const table of ["signup_host_alert_preferences", "signup_host_alerts"]) {
    assert.match(fixture.api.SIGNUP_HOST_ALERT_SCHEMA, new RegExp(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
    for (const role of ["PUBLIC", "anon", "authenticated"]) assert.ok(fixture.api.SIGNUP_HOST_ALERT_SCHEMA.includes(`public.signup_host_alerts FROM ${role}`));
  }
  const normalize = (source) => source.replace(/\s+/g, "").toLowerCase();
  assert.equal(normalize(fs.readFileSync("prisma/manual_sql/20261006_signup_host_alerts.sql", "utf8")), normalize(`BEGIN;${fixture.api.SIGNUP_HOST_ALERT_SCHEMA}COMMIT;`));
});

test("preferences cannot be saved after membership is revoked", async () => {
  const fixture = setup({ allowed: false });
  await assert.rejects(() => fixture.api.saveSignupHostAlertPreferences("event", "recipient", activity.defaultSignupHostPreferences(true)), /no longer have access/);
  assert.equal(fixture.statements.some(({ sql }) => sql.startsWith("INSERT INTO signup_host_alert_preferences")), false);
});

test("alert API refuses anonymous guests, pending invitees, foreign origins and forged recipients", async () => {
  let userId = null, allowed = false;
  const saved = [], jobs = [];
  const row = { id: "event", data: { signupForm: form() } };
  const route = load("src/app/api/history/[id]/signup/alerts/route.ts", {
    "next/server": { NextResponse, after: (job) => jobs.push(job) },
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/db": { getEventHistoryById: async () => row },
    "@/lib/event-collaboration": { getEventPermissions: async () => ({ canManageResponses: allowed }) },
    "@/lib/signup-host-alerts": { signupHostAlertSettings: async () => ({ email: "host@example.test", preferences: activity.defaultSignupHostPreferences(true), deliveries: [] }),
      saveSignupHostAlertPreferences: async (...args) => saved.push(args), processSignupHostAlerts: async () => {}, retrySignupHostAlert: async () => {} },
  });
  const context = { params: Promise.resolve({ id: "event" }) };
  const url = "https://envitefy.com/api/history/event/signup/alerts";
  assert.equal((await route.GET(new Request(url), context)).status, 401);
  userId = "pending";
  assert.equal((await route.GET(new Request(url), context)).status, 403);
  userId = "cohost"; allowed = true;
  const body = { userId: "forged-owner", email: "forged@example.test", preferences: activity.defaultSignupHostPreferences(true) };
  const post = (origin) => route.POST(new Request(url, { method: "POST", headers: { origin }, body: JSON.stringify(body) }), context);
  assert.equal((await post("https://evil.test")).status, 403);
  const result = await post("https://envitefy.com");
  assert.equal(result.status, 200); assert.equal(result.headers.get("cache-control"), "private, no-store");
  assert.equal(saved[0][1], "cohost");
  assert.deepEqual(saved[0][2], activity.defaultSignupHostPreferences(true));
});

test("host email escapes guest content, uses Zoho sender and preserves selections without guest management tokens", async () => {
  const messages = [];
  const email = load("src/lib/email.ts", {
    "@/lib/db": {}, "@/lib/mail-transport": { sendTransactionalEmail: async (message) => messages.push(message) },
  });
  const payload = activity.signupHostActivities(form(), form([response({ name: "Alex <script>", note: "<img src=x>" })]))[0];
  await email.sendSignupHostAlertEmail({ toEmail: "host@example.test", eventTitle: "Fall picnic", dashboardUrl: "https://envitefy.com/smart-signup-form/fall-picnic#signup-host-dashboard", activity: payload });
  assert.equal(messages[0].from, "Envitefy Sign-up Forms <signup-forms@envitefy.com>");
  assert.match(messages[0].html, /Alex &lt;script&gt;/); assert.doesNotMatch(messages[0].html, /<img src=x>/);
  assert.match(messages[0].text, /Desserts ×2/); assert.match(messages[0].text, /Envitefy Team/);
  assert.doesNotMatch(messages[0].text, /signup\/manage|token=/);
});
