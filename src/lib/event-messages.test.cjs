const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

test("message tables become visible only after RLS and client revocations commit; migration matches", async () => {
  const statements = [];
  const client = { query: async (sql) => { statements.push(sql); return { rows: [] }; } };
  const service = loadTs("src/lib/event-messages.ts", {
    "@/lib/db": { withClient: async (callback) => callback(client) },
    "@/lib/email": {},
  });
  await Promise.all([service.ensureEventMessages(), service.ensureEventMessages()]);
  assert.equal(statements.filter((sql) => sql === "BEGIN").length, 1);
  assert.equal(statements[0], "BEGIN");
  assert.equal(statements.at(-1), "COMMIT");
  for (const table of ["event_messages", "event_message_deliveries"]) {
    const creation = statements.findIndex((sql) => sql.startsWith(`CREATE TABLE IF NOT EXISTS public.${table} (`));
    const protection = statements.indexOf(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    assert.ok(creation > 0 && protection > creation && protection < statements.length - 1);
  }
  for (const role of ["PUBLIC", "anon", "authenticated"]) {
    assert.ok(statements.some((sql) => sql.includes(`REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM ${role}`)));
  }
  const normalized = (sql) => sql.replace(/--[^\n]*/g, "").replace(/\s+/g, "");
  const migration = normalized(fs.readFileSync("prisma/manual_sql/20260921_event_messages.sql", "utf8"));
  for (const statement of statements) assert.ok(migration.includes(`${normalized(statement)};`), `Missing bootstrap statement in migration: ${statement}`);
});

test("failed RLS setup rolls back and can be retried", async () => {
  const statements = [];
  let fail = true;
  const client = { query: async (sql) => {
    statements.push(sql);
    if (fail && sql === "ALTER TABLE public.event_message_deliveries ENABLE ROW LEVEL SECURITY") throw new Error("Setup denied");
    return { rows: [] };
  } };
  const service = loadTs("src/lib/event-messages.ts", {
    "@/lib/db": { withClient: async (callback) => callback(client) },
    "@/lib/email": {},
  });
  await assert.rejects(service.ensureEventMessages(), /Setup denied/);
  assert.equal(statements.at(-1), "ROLLBACK");
  assert.equal(statements.includes("COMMIT"), false);
  fail = false;
  await service.ensureEventMessages();
  assert.equal(statements.at(-1), "COMMIT");
  assert.equal(statements.filter((sql) => sql === "BEGIN").length, 2);
});

test("confirmation emails exclude No; updates escape content, preserve paragraphs and use the host Reply-To", async () => {
  const sent = [];
  const email = loadTs("src/lib/email.ts", {
    "@/lib/db": {},
    "@/lib/mail-transport": { sendTransactionalEmail: async (message) => sent.push(message) },
  });
  const params = { toEmail: "guest@example.test", eventTitle: "Livia's birthday", eventUrl: "https://envitefy.com/event/test" };
  await email.sendRsvpConfirmationEmail({ ...params, response: "no" });
  assert.equal(sent.length, 0);
  await email.sendRsvpConfirmationEmail({ ...params, response: "yes" });
  await email.sendRsvpConfirmationEmail({ ...params, response: "maybe" });
  assert.equal(sent.length, 2);
  await email.sendEventUpdateEmail({ ...params, subject: "New time <test>", body: "Meet at 3 PM.\n<script>alert(1)</script>", replyTo: "host@example.test" });
  assert.equal(sent[2].to, params.toEmail);
  assert.equal(sent[2].replyTo, "host@example.test");
  assert.match(sent[2].html, /3 PM\.<br\/>/);
  assert.match(sent[2].html, /&lt;script&gt;/);
  assert.doesNotMatch(sent[2].html, /<script>/);
  assert.match(sent[2].html, /Envitefy Team/);
  assert.match(sent[2].text, /View event: https:\/\/envitefy.com/);
});

test("message validation permits partial drafts but requires subject and body to send", () => {
  const { validateEventMessage, validGuestEmail } = loadTs("src/lib/event-message-types.ts");
  const id = randomUUID();
  assert.equal(validateEventMessage({ id, subject: "", body: "Planning" }, false).body, "Planning");
  assert.throws(() => validateEventMessage({ id, subject: "", body: "Planning" }), /subject/);
  assert.throws(() => validateEventMessage({ id, subject: "Hello\nBcc: x", body: "Hello" }), /subject/);
  assert.equal(validGuestEmail("guest@example.test,another@example.test"), false);
  assert.equal(validGuestEmail("guest@example.test"), true);
});

test("owner-only API rejects guests, other owners, drafts and forged recipient lists; GET never sends", async () => {
  let owner = null;
  let draft = false;
  const calls = [];
  const route = loadTs("src/app/api/events/[id]/messages/route.ts", {
    "next-auth": { getServerSession: async () => ({ user: { id: owner } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => owner },
    "@/lib/db": { getEventHistoryById: async () => ({ user_id: "owner", title: "Party", data: { status: draft ? "draft" : "published" }, public_slug: "party" }) },
    "@/lib/event-messages": {
      ensureEventMessages: async () => {},
      currentMessageAudience: async () => [{ email: "yes@example.test" }],
      listEventMessages: async () => [],
      saveEventMessage: async (...args) => calls.push(args),
      processEventMessage: async () => { throw new Error("Unexpected send"); },
    },
  });
  const context = { params: Promise.resolve({ id: randomUUID() }) };
  assert.equal((await route.GET(new Request("https://envitefy.com"), context)).status, 401);
  owner = "other";
  assert.equal((await route.GET(new Request("https://envitefy.com"), context)).status, 403);
  owner = "owner"; draft = true;
  assert.equal((await route.GET(new Request("https://envitefy.com"), context)).status, 409);
  draft = false;
  const loaded = await route.GET(new Request("https://envitefy.com"), context);
  assert.equal(loaded.status, 200);
  assert.equal(loaded.headers.get("cache-control"), "private, no-store");
  assert.equal((await loaded.json()).audienceCount, 1);
  assert.equal(calls.length, 0);
  const payload = { action: "send", id: randomUUID(), subject: "Update", body: "Hello", recipients: ["no@example.test"], userId: "other" };
  const sent = await route.POST(new Request("https://envitefy.com", { method: "POST", body: JSON.stringify(payload) }), context);
  assert.equal(sent.status, 200);
  assert.deepEqual(calls[0][1], { id: payload.id, subject: "Update", body: "Hello" });
  assert.equal(calls[0][2], true);
});

test("atomic delivery claims prevent duplicate sends; current No and removed responses are excluded; retries only reset failures", async () => {
  const rows = [
    { email: "yes@example.test", name: "Yes", status: "pending" },
    { email: "maybe@example.test", name: "Maybe", status: "pending" },
    { email: "changed@example.test", name: "Changed to No", status: "pending" },
    { email: "removed@example.test", name: "Removed", status: "pending" },
  ];
  const replies = { "yes@example.test": "yes", "maybe@example.test": "maybe", "changed@example.test": "no" };
  const sent = [];
  let failMaybe = true;
  const query = async (sql, args) => {
    if (sql.startsWith("SELECT subject")) return { rows: [{ subject: "Update", body: "New time" }] };
    if (sql.includes("RETURNING email, name")) {
      assert.match(sql, /FOR UPDATE SKIP LOCKED/);
      const selected = rows.filter((row) => row.status === "pending").slice(0, 3);
      for (const row of selected) row.status = "sending";
      return { rows: selected };
    }
    if (sql.startsWith("SELECT response")) return { rows: replies[args[1]] ? [{ response: replies[args[1]] }] : [] };
    if (sql.includes("SET status = $3")) { rows.find((row) => row.email === args[1]).status = args[2]; return { rows: [] }; }
    if (sql.includes("d.status = 'failed'")) { for (const row of rows) if (row.status === "failed") row.status = "pending"; return { rows: [] }; }
    throw new Error(`Unexpected query: ${sql}`);
  };
  const service = loadTs("src/lib/event-messages.ts", {
    "@/lib/db": { query },
    "@/lib/email": { sendEventUpdateEmail: async (message) => {
      if (message.toEmail === "maybe@example.test" && failMaybe) throw new Error("SMTP unavailable");
      sent.push(message);
    } },
  });
  const input = { eventId: randomUUID(), messageId: randomUUID(), eventTitle: "Party", eventUrl: "https://envitefy.com/event/party", replyTo: "host@example.test" };
  await Promise.all([service.processEventMessage(input), service.processEventMessage(input)]);
  assert.deepEqual(sent.map((message) => message.toEmail), ["yes@example.test"]);
  assert.deepEqual(rows.map((row) => row.status), ["sent", "failed", "skipped", "skipped"]);
  failMaybe = false;
  await service.retryEventMessage(input.eventId, input.messageId);
  replies["maybe@example.test"] = "no";
  await service.processEventMessage(input);
  assert.equal(sent.length, 1, "a guest declining before retry receives no email");
  assert.equal(rows[1].status, "skipped");
});

test("sent content and deliveries survive repeated Send requests without creating another announcement", async () => {
  const statements = [];
  const client = { query: async (sql) => { statements.push(sql); return { rows: sql.startsWith("SELECT status") ? [{ status: "queued" }] : [] }; } };
  const service = loadTs("src/lib/event-messages.ts", { "@/lib/db": { withClient: async (callback) => callback(client) }, "@/lib/email": {} });
  await service.saveEventMessage(randomUUID(), { id: randomUUID(), subject: "Changed text", body: "Changed body" }, true);
  assert.ok(statements.some((sql) => sql.includes("FOR UPDATE")));
  assert.equal(statements.filter((sql) => sql.startsWith("UPDATE")).length, 0);
  assert.equal(statements.filter((sql) => sql.includes("INSERT INTO event_message_deliveries")).length, 0);
  assert.equal(statements.at(-1), "COMMIT");
});

test("SMTP disconnect after DATA stays unconfirmed rather than becoming retryable", async () => {
  let savedStatus;
  const service = loadTs("src/lib/event-messages.ts", {
    "@/lib/db": { query: async (sql, args) => {
      if (sql.startsWith("SELECT subject")) return { rows: [{ subject: "Update", body: "Details" }] };
      if (sql.includes("RETURNING email, name")) return { rows: [{ email: "guest@example.test", name: "Guest" }] };
      if (sql.startsWith("SELECT response")) return { rows: [{ response: "yes" }] };
      savedStatus = args[2]; return { rows: [] };
    } },
    "@/lib/email": { sendEventUpdateEmail: async () => { throw Object.assign(new Error("Connection lost"), { code: "ETIMEDOUT", command: "DATA" }); } },
  });
  await service.processEventMessage({ eventId: randomUUID(), messageId: randomUUID(), eventTitle: "Party", eventUrl: "https://envitefy.com/event/party", replyTo: null });
  assert.equal(savedStatus, "sending");
});

test("latest response is selected before eligibility filtering; edit routes never send announcements", () => {
  const source = fs.readFileSync("src/lib/event-messages.ts", "utf8");
  const selection = source.slice(source.indexOf("export const CURRENT_GUESTS_SQL"), source.indexOf("export async function currentMessageAudience"));
  assert.match(selection, /DISTINCT ON \(lower\(trim\(email\)\)\)/);
  assert.match(selection, /coalesce\(updated_at, created_at\) DESC/);
  assert.doesNotMatch(selection, /response\s*(=|IN)/);
  for (const file of ["src/app/api/history/[id]/route.ts", "src/app/api/events/[id]/card/edit/route.ts", "src/app/api/events/[id]/update-theme/route.ts"]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /sendEventUpdateEmail|saveEventMessage|processEventMessage/);
  }
  const rsvp = fs.readFileSync("src/app/api/events/[id]/rsvp/route.ts", "utf8");
  assert.match(rsvp, /if \(responseValue !== "no"\) after\(async/);
});
