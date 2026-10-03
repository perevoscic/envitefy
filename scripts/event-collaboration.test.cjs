const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const test = require("node:test");
const ts = require("typescript");
const nativeRequire = require;
function compile(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    if (mocks[name]) return mocks[name];
    if (name === "./event-collaboration-types") return compile("src/lib/event-collaboration-types.ts");
    if (name === "@/lib/event-draft-access") return compile("src/lib/event-draft-access.ts");
    return nativeRequire(name);
  }, module, module.exports);
  return module.exports;
}
function fixture() {
  const event = { id: "event", user_id: "owner", title: "Garden party", data: { status: "draft", createdVia: "livecard-builder", title: "Garden party", studioCard: { imageUrl: "https://assets.test/card.webp" } } };
  const state = { events: [event, { ...event, id: "other" }], users: [{ id: "owner", email: "host@test.com" }, { id: "friend", email: "friend@test.com" }], members: [], invites: [], activity: [], invalidated: [] };
  let queue = Promise.resolve();
  async function query(sql, args = []) {
    const q = sql.replace(/\s+/g, " ").trim();
    const rows = [];
    if (/^(BEGIN|COMMIT|ROLLBACK|CREATE TABLE)/.test(q)) return { rows };
    if (q.startsWith("SELECT count(*) = 3")) rows.push({ ready: true });
    else if (q.startsWith("SELECT id,user_id,title,jsonb_build_object")) rows.push(...state.events.filter(e => e.id === args[0] && e.user_id === args[1]).map(e => structuredClone(e)));
    else if (q.startsWith("SELECT id,user_id,title,data")) rows.push(...state.events.filter(e => e.id === args[0]).map(e => structuredClone(e)));
    else if (q.startsWith("SELECT email FROM users")) rows.push(...state.users.filter(u => u.id === args[0]));
    else if (q.startsWith("SELECT count(*)")) rows.push({ count: "0" });
    else if (q.startsWith("SELECT 1 FROM event_collaborators c JOIN")) rows.push(...state.members.filter(m => m.event_id === args[0] && !m.revoked_at && state.users.find(u => u.id === m.user_id)?.email === args[1]));
    else if (q.startsWith("SELECT 1 FROM event_collaborators")) rows.push(...state.members.filter(m => m.event_id === args[0] && !m.revoked_at && (!args[1] || m.user_id === args[1])));
    else if (q.startsWith("SELECT EXISTS")) rows.push({ allowed: state.members.some(m => m.event_id === args[0] && m.user_id === args[1] && !m.revoked_at) });
    else if (q.startsWith("SELECT user_id FROM event_collaborators")) rows.push(...state.members.filter(m => m.event_id === args[0] && !m.revoked_at));
    else if (q.startsWith("SELECT i.id::text AS id")) {
      assert.match(q, /recipient.id=\$1 AND lower\(recipient.email\)=lower\(i.email\)/);
      assert.match(q, /e.user_id=i.invited_by/);
      assert.match(q, /i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>now\(\)/);
      const recipient = state.users.find(u => u.id === args[0]);
      for (const invite of state.invites) {
        const target = state.events.find(e => e.id === invite.event_id && e.user_id === invite.invited_by);
        if (!recipient || !target || invite.email.toLowerCase() !== recipient.email.toLowerCase() || invite.accepted_at || invite.revoked_at || Date.parse(invite.expires_at) <= Date.now() || state.members.some(m => m.event_id === invite.event_id && m.user_id === recipient.id && !m.revoked_at)) continue;
        rows.push({ id: invite.id, eventId: invite.event_id, eventTitle: target.title, ownerName: "Host", expiresAt: invite.expires_at, eligibility: target.data, token_hash: invite.token_hash });
      }
    }
    else if (q.startsWith("SELECT i.id,i.event_id")) {
      assert.match(q, /u.id=\$2 AND lower\(u.email\)=lower\(i.email\) WHERE i.id=\$1/);
      rows.push(...state.invites.filter(i => i.id === args[0] && state.users.find(u => u.id === args[1])?.email.toLowerCase() === i.email.toLowerCase()));
    }
    else if (q.startsWith("SELECT i.*,e.title")) rows.push(...state.invites.filter(i => i.token_hash === args[0]).map(i => ({ ...i, eventTitle: event.title, ownerName: "Host" })));
    else if (q.startsWith("SELECT * FROM event_collaborator_invites")) rows.push(...state.invites.filter(i => i.id === args[0]).map(i => ({ ...i })));
    else if (q.startsWith("INSERT INTO event_collaborator_invites")) {
      const invite = { id: crypto.randomUUID(), event_id: args[0], invited_by: args[1], email: args[2], token_hash: args[3], expires_at: new Date(Date.now() + 7*86400000).toISOString(), revoked_at: null, accepted_at: null, accepted_by: null };
      state.invites.push(invite); rows.push({ id: invite.id });
    } else if (q.startsWith("INSERT INTO event_collaborators(")) {
      let member = state.members.find(m => m.event_id === args[0] && m.user_id === args[1]);
      if (!member) { member = { event_id: args[0], user_id: args[1], invited_by: args[2] }; state.members.push(member); }
      member.revoked_at = null;
    } else if (q.startsWith("UPDATE event_collaborator_invites i SET revoked_at=now() FROM users u")) {
      assert.match(q, /u.id=\$2 AND lower\(u.email\)=lower\(i.email\) AND i.accepted_at IS NULL AND i.revoked_at IS NULL/);
      const recipient = state.users.find(u => u.id === args[1]);
      for (const invite of state.invites) {
        if (invite.id !== args[0] || !recipient || invite.email.toLowerCase() !== recipient.email.toLowerCase() || invite.accepted_at || invite.revoked_at) continue;
        invite.revoked_at = new Date().toISOString(); rows.push({ id: invite.id });
      }
    } else if (q.startsWith("UPDATE event_collaborator_invites SET accepted_at")) {
      Object.assign(state.invites.find(i => i.id === args[0]), { accepted_at: new Date().toISOString(), accepted_by: args[1] });
    } else if (q.startsWith("UPDATE event_collaborator_invites SET revoked_at")) {
      for (const invite of state.invites) if (invite.event_id === args[0] && (q.includes("email=$2") ? invite.email === args[1] && !invite.accepted_at : invite.id === args[1] || invite.accepted_by === args[1])) invite.revoked_at = new Date().toISOString();
    } else if (q.startsWith("UPDATE event_collaborators SET revoked_at")) {
      for (const member of state.members) if (member.event_id === args[0] && member.user_id === args[1]) member.revoked_at = new Date().toISOString();
    } else if (q.startsWith("UPDATE event_history SET")) {
      const saved = state.events.find(e => e.id === args[0]); saved.data = JSON.parse(args[1]); saved.title = args[2]; rows.push(structuredClone(saved));
    } else if (q.startsWith("INSERT INTO event_edit_activity")) state.activity.push({ eventId: args[0], userId: args[1], action: args[2] });
    else throw new Error(`Unmocked SQL: ${q}`);
    return { rows };
  }
  const errors = compile("src/lib/event-collaboration-types.ts");
  const api = compile("src/lib/event-collaboration.ts", {
    "./event-collaboration-types": errors,
    "@/lib/db": { query, getEventHistoryById: async id => state.events.find(e => e.id === id), prepareEventHistoryData: d => d,
      withClient: async callback => { const previous = queue; let release; queue = new Promise(resolve => { release = resolve; }); await previous; try { return await callback({ query }); } finally { release(); } } },
    "@/lib/history-cache": { invalidateUserHistory: id => state.invalidated.push(id) },
    "@/lib/dashboard-cache": { invalidateUserDashboard: id => state.invalidated.push(id) },
  });
  return { api, state, event, errors };
}

test("email invitations support a recipient without an account and store only a token hash", async () => {
  const { api, state } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "new@test.com");
  assert.equal(state.users.length, 2);
  assert.equal(state.members.length, 0);
  assert.equal(state.invites[0].email, "new@test.com");
  assert.notEqual(state.invites[0].token_hash, invite.token);
  assert.equal(state.invites[0].token_hash, crypto.createHash("sha256").update(invite.token).digest("hex"));
  state.users.push({ id: "new", email: "new@test.com" });
  assert.equal(await api.acceptCollaboratorInvitation(invite.token, "new"), "event");
  assert.equal(state.members[0].user_id, "new");
  assert.equal((await api.getEventPermissions(state.events[1], "new")).canEdit, false);
});

test("acceptance rejects wrong accounts, expired, cancelled and previously used invitations", async () => {
  for (const mode of ["wrong", "expired", "cancelled", "used"]) {
    const { api, state } = fixture();
    const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
    if (mode === "expired") state.invites[0].expires_at = "2000-01-01";
    if (mode === "cancelled") await api.revokeEventCollaborator("event", "owner", invite.id);
    if (mode === "used") await api.acceptCollaboratorInvitation(invite.token, "friend");
    await assert.rejects(api.acceptCollaboratorInvitation(invite.token, mode === "wrong" ? "owner" : "friend"), error => error.status === (mode === "wrong" ? 403 : 410));
  }
});

test("pending notifications follow the invited account, including signup after the invitation, without exposing tokens or event data", async () => {
  const { api, state } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "new@test.com");
  assert.deepEqual(await api.listPendingCoHostInvitations("friend"), []);
  state.users.push({ id: "new", email: "New@test.com" });
  const pending = await api.listPendingCoHostInvitations("new");
  assert.deepEqual(Object.keys(pending[0]).sort(), ["id", "eventId", "eventTitle", "ownerName", "expiresAt"].sort());
  assert.equal(pending[0].id, invite.id);
  assert.equal(pending[0].eventTitle, "Garden party");
  assert.equal((await api.getEventPermissions(state.events[0], "new")).canEdit, false);
  await api.acceptCoHostInvitationById(invite.id, "new");
  assert.deepEqual(await api.listPendingCoHostInvitations("new"), []);
  assert.equal((await api.getEventPermissions(state.events[0], "new")).canEdit, true);
  assert.ok(state.invalidated.includes("new"));
});

test("pending notifications exclude expired, revoked, replaced, deleted, unsupported and already joined events", async () => {
  for (const mode of ["expired", "revoked", "resend", "deleted", "unsupported", "joined", "different-owner"]) {
    const { api, state } = fixture();
    const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
    if (mode === "expired") state.invites[0].expires_at = "2000-01-01";
    if (mode === "revoked") await api.revokeEventCollaborator("event", "owner", invite.id);
    if (mode === "resend") await api.inviteEventCollaborator("event", "owner", "friend@test.com");
    if (mode === "deleted") state.events.splice(0, 1);
    if (mode === "unsupported") state.events[0].data.attachment = {};
    if (mode === "joined") state.members.push({ event_id: "event", user_id: "friend", revoked_at: null });
    if (mode === "different-owner") state.events[0].user_id = "someone-else";
    const pending = await api.listPendingCoHostInvitations("friend");
    assert.equal(pending.length, mode === "resend" ? 1 : 0, mode);
    assert.ok(!pending.some(i => i.id === invite.id), mode);
  }
});

test("dashboard decline is bound to the invited account and closes only a pending invitation", async () => {
  const { api, state } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  await assert.rejects(api.declineCoHostInvitationById(invite.id, "owner"), e => e.status === 404);
  assert.equal(state.invites[0].revoked_at, null);
  await api.declineCoHostInvitationById(invite.id, "friend");
  assert.deepEqual(await api.listPendingCoHostInvitations("friend"), []);
  assert.equal(state.members.length, 0);
  await assert.rejects(api.declineCoHostInvitationById(invite.id, "friend"), e => e.status === 404);
  const accepted = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  await api.acceptCoHostInvitationById(accepted.id, "friend");
  await assert.rejects(api.declineCoHostInvitationById(accepted.id, "friend"), e => e.status === 404);
  assert.equal((await api.getEventPermissions(state.events[0], "friend")).canEdit, true);
});

test("dashboard acceptance rechecks account binding, expiry, revocation and eligibility under the existing lock", async () => {
  for (const mode of ["wrong", "expired", "revoked", "used", "unsupported"]) {
    const { api, state } = fixture();
    const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
    if (mode === "expired") state.invites[0].expires_at = "2000-01-01";
    if (mode === "revoked") await api.revokeEventCollaborator("event", "owner", invite.id);
    if (mode === "used") await api.acceptCoHostInvitationById(invite.id, "friend");
    if (mode === "unsupported") state.events[0].data.signupForm = {};
    await assert.rejects(api.acceptCoHostInvitationById(invite.id, mode === "wrong" ? "owner" : "friend"), e => e.status === (mode === "wrong" ? 404 : 410), mode);
    if (mode !== "used") assert.equal(state.members.length, 0, mode);
  }
  const { api } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  const results = await Promise.allSettled([api.acceptCoHostInvitationById(invite.id, "friend"), api.acceptCoHostInvitationById(invite.id, "friend")]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.status, 410);
});

test("recipient API lists only signed-in invitations and requires explicit same-site acceptance by ID", async () => {
  const { api, errors } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  let user = null;
  const route = compile("src/app/api/cohost-invitations/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json", ...init?.headers } }) } },
    "next-auth": { getServerSession: async () => user ? { user: { email: user === "friend" ? "friend@test.com" : "host@test.com" } } : null },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => user },
    "@/lib/event-collaboration": api,
    "@/lib/event-collaboration-types": errors,
  });
  const send = (body, headers = {}) => route.POST(new Request("https://envitefy.com/api/cohost-invitations", { method: "POST", headers, body: JSON.stringify(body) }));
  assert.equal((await route.GET()).status, 401);
  assert.equal((await send({ invitationId: invite.id, action: "accept" })).status, 401);
  user = "owner";
  assert.deepEqual((await (await route.GET()).json()).invitations, []);
  assert.equal((await send({ invitationId: invite.id, action: "accept" })).status, 404);
  user = "friend";
  const listed = await route.GET();
  assert.equal(listed.headers.get("cache-control"), "private, no-store");
  assert.equal((await listed.json()).invitations.length, 1);
  assert.equal((await send({ invitationId: invite.id, action: "accept" }, { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal((await send({ invitationId: invite.id, action: "inspect" })).status, 400);
  assert.equal((await send({ invitationId: "bad", action: "accept" })).status, 400);
  assert.equal((await send({ invitationId: invite.id, action: "accept" })).status, 200);
  assert.deepEqual((await (await route.GET()).json()).invitations, []);
});

test("resending invalidates the old link and only the owner can grant or remove access", async () => {
  const { api } = fixture();
  const first = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  const second = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  await assert.rejects(api.acceptCollaboratorInvitation(first.token, "friend"), e => e.status === 410);
  await api.acceptCollaboratorInvitation(second.token, "friend");
  await assert.rejects(api.inviteEventCollaborator("event", "friend", "another@test.com"), e => e.status === 403);
  await assert.rejects(api.revokeEventCollaborator("event", "friend", "owner"), e => e.status === 403);
});

test("a co-host edits the existing event, keeps ownership, and revocation blocks a subsequent save", async () => {
  const { api, state, event } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  await api.acceptCollaboratorInvitation(invite.token, "friend");
  const permissions = await api.getEventPermissions(event, "friend");
  assert.equal(permissions.canEdit, true); assert.equal(permissions.canManageResponses, true);
  assert.equal(permissions.canDelete, false); assert.equal(permissions.canManageCollaborators, false);
  const saved = await api.saveCollaborativeEvent({ eventId: "event", userId: "friend", expectedRevision: api.eventRevision(event), title: "New title", patch: { status: "published" } });
  assert.equal(saved.id, event.id); assert.equal(saved.user_id, "owner");
  assert.equal(saved.data.studioCard.imageUrl, event.data.studioCard.imageUrl);
  assert.equal(state.activity[0].userId, "friend");
  await api.revokeEventCollaborator("event", "owner", "friend");
  await assert.rejects(api.saveCollaborativeEvent({ eventId: "event", userId: "friend", expectedRevision: saved.revision, patch: {} }), e => e.status === 403);
});

test("concurrent saves accept one revision and reject the stale writer without overwriting", async () => {
  const { api, state, event } = fixture();
  const invite = await api.inviteEventCollaborator("event", "owner", "friend@test.com");
  await api.acceptCollaboratorInvitation(invite.token, "friend");
  const expectedRevision = api.eventRevision(event);
  const results = await Promise.allSettled(["owner", "friend"].map((userId, i) => api.saveCollaborativeEvent({ eventId: "event", userId, expectedRevision, title: `Title ${i}`, patch: {} })));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.code, "event_changed");
  assert.equal(state.events[0].title, "Title 0");
  await assert.rejects(api.saveCollaborativeEvent({ eventId: "event", userId: "owner", expectedRevision: null, patch: {} }), e => e.status === 428);
});

test("co-host access does not include private scans, signup forms or unpublishing", async () => {
  const { api, event, state } = fixture();
  state.members.push({ event_id: "event", user_id: "friend", revoked_at: null });
  for (const data of [{ attachment: {} }, { signupForm: {} }, { createdVia: "ocr" }, { ownership: "invited" }])
    assert.equal((await api.getEventPermissions({ ...event, data }, "friend")).canEdit, false);
  event.data.status = "published";
  await assert.rejects(api.saveCollaborativeEvent({ eventId: "event", userId: "friend", expectedRevision: api.eventRevision(event), patch: { status: "draft" } }), e => e.status === 403);
});

test("editor revision tracking is isolated and keeps the baseline after a rejected save", async () => {
  const { createEventHistoryClient } = compile("src/lib/event-history-client.ts", { react: { useMemo: f => f() } });
  const original = global.fetch; const calls = []; let revision = "one"; let conflict = false;
  global.fetch = async (_url, options) => { calls.push(options); return Response.json(conflict ? { error: "changed" } : { id: "event", revision }, { status: conflict ? 409 : 200 }); };
  try {
    const first = createEventHistoryClient(), second = createEventHistoryClient();
    await first.fetch("/api/history/event"); revision = "two";
    await second.fetch("/api/history/event"); conflict = true;
    conflict = false; await first.fetch("/api/history/event"); conflict = true;
    await first.fetch("/api/history/event", { method: "PATCH" });
    assert.equal(calls.at(-1).headers.get("If-Match"), "one");
    await first.fetch("/api/history/event", { method: "PATCH" });
    assert.equal(calls.at(-1).headers.get("If-Match"), "one");
  } finally { global.fetch = original; }
});

test("collaboration schema commits table creation and client access revocation together", async () => {
  const statements = [];
  const api = compile("src/lib/event-collaboration.ts", {
    "@/lib/db": { withClient: async callback => callback({ query: async sql => { statements.push(sql); return { rows: [] }; } }) },
    "@/lib/history-cache": {}, "@/lib/dashboard-cache": {},
  });
  await Promise.all([api.ensureEventCollaboration(), api.ensureEventCollaboration()]);
  assert.ok(statements[0].includes("aclexplode"));
  assert.equal(statements[1], "BEGIN"); assert.equal(statements.at(-1), "COMMIT");
  assert.equal(statements.filter(sql => sql === "BEGIN").length, 1);
  const schema = statements[2];
  for (const table of ["event_collaborators", "event_collaborator_invites", "event_edit_activity"]) {
    assert.ok(schema.indexOf(`CREATE TABLE IF NOT EXISTS ${table}`) < schema.indexOf(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
  }
  for (const role of ["PUBLIC", "anon", "authenticated"]) assert.ok(schema.includes(`public.event_edit_activity FROM ${role}`));
  const normalize = sql => sql.replace(/\s+/g, "");
  assert.equal(normalize(fs.readFileSync("prisma/manual_sql/20261002_event_collaboration.sql", "utf8")), normalize(`BEGIN;${schema}COMMIT;`));
});

test("a migrated secure collaboration schema is checked once without DDL or table locks", async () => {
  const statements = [];
  const api = compile("src/lib/event-collaboration.ts", {
    "@/lib/db": { withClient: async callback => callback({ query: async sql => { statements.push(sql); return { rows: [{ ready: true }] }; } }) },
    "@/lib/history-cache": {}, "@/lib/dashboard-cache": {},
  });
  await Promise.all([api.ensureEventCollaboration(), api.ensureEventCollaboration()]);
  await api.ensureEventCollaboration();
  assert.equal(statements.length, 1);
  assert.ok(statements[0].includes("relrowsecurity"));
  assert.ok(statements[0].includes("grants.grantee = 0"));
  assert.ok(statements[0].includes("'anon', 'authenticated'"));
});

test("access management reads ownership without running public-link setup or returning artwork", async () => {
  const calls = [];
  let row = { id: "event", user_id: "owner", title: "Party", data: { createdVia: "livecard-builder" } };
  const api = compile("src/lib/event-collaboration.ts", {
    "@/lib/db": { query: async (sql, args) => { calls.push({ sql, args }); return { rows: row ? [row] : [] }; }, getEventHistoryById: () => { throw new Error("Public-link setup must not run"); } },
    "@/lib/history-cache": {}, "@/lib/dashboard-cache": {},
  });
  assert.equal((await api.requireCollaborationOwner("event", "owner")).id, "event");
  assert.deepEqual(calls[0].args, ["event", "owner"]);
  assert.ok(calls[0].sql.includes("user_id=$2"));
  assert.equal(calls[0].sql.includes("studioCard"), false);
  for (const data of [{ attachment: {} }, { signupForm: {} }, { invitedFromScan: true }, { ownership: "invited" }, { createdVia: "OCR" }]) {
    row = { ...row, data };
    await assert.rejects(api.requireCollaborationOwner("event", "owner"), error => error.code === "unsupported_event");
  }
  row = null;
  await assert.rejects(api.requireCollaborationOwner("event", "cohost"), error => error.status === 403);
});

test("invitation APIs require owner management and explicit authenticated acceptance", async () => {
  const errors = compile("src/lib/event-collaboration-types.ts");
  let user = null, sent = true; const calls = [];
  const inviteId = crypto.randomUUID(), eventId = crypto.randomUUID();
  const mocks = {
    "next-auth": { getServerSession: async () => ({ user: { email: "host@test.com", name: "Host" } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => user },
    "@/lib/event-collaboration-types": errors,
    "@/lib/server-timing": compile("src/lib/server-timing.ts"),
    "@/lib/event-collaboration": {
      ensureEventCollaboration: async () => {},
      requireCollaborationOwner: async () => { if (user !== "owner") throw new errors.EventCollaborationError("Owner required", 403, "owner_required"); return { id: eventId }; },
      inviteEventCollaborator: async (_event, _user, email) => { calls.push(["invite", email]); return { id: inviteId, token: "b".repeat(64), event: { title: "Garden party" } }; },
      listEventAccess: async () => [], markCollaborationEmail: async (...args) => calls.push(args),
      revokeEventCollaborator: async (...args) => calls.push(["revoke", ...args]),
      readCollaboratorInvitation: async () => ({ email: "friend@test.com", eventTitle: "Garden party", ownerName: "Host", accepted_by: null, accepted_at: null, revoked_at: null, expires_at: new Date(Date.now()+86400000).toISOString() }),
      acceptCollaboratorInvitation: async () => { calls.push(["accept"]); return eventId; },
    },
    "@/lib/event-message-types": { validGuestEmail: value => /^[^@]+@[^@]+\.[^@]+$/.test(value) },
    "@/lib/public-asset-url": { resolvePublicAssetOrigin: () => "https://envitefy.com" },
    "@/lib/email": { sendCoHostInvitationEmail: async params => { calls.push(["email", params]); if (!sent) throw new Error("SMTP unavailable"); } },
  };
  const route = compile("src/app/api/events/[id]/collaborators/route.ts", mocks);
  const context = { params: Promise.resolve({ id: eventId }) };
  const request = (body, headers = {}) => new Request("https://envitefy.com", { method: "POST", headers, body: JSON.stringify(body) });
  assert.equal((await route.GET(request({}), context)).status, 401);
  user = "cohost"; assert.equal((await route.POST(request({ email: "friend@test.com" }), context)).status, 403);
  user = "owner"; assert.equal((await route.POST(request({ email: "friend@test.com" }, { "sec-fetch-site": "cross-site" }), context)).status, 403);
  assert.equal((await route.POST(request({ email: "invalid" }), context)).status, 400);
  const delivered = await route.POST(request({ email: "Friend@test.com" }), context);
  assert.equal(delivered.status, 201); assert.equal(delivered.headers.get("cache-control"), "private, no-store");
  assert.match(delivered.headers.get("server-timing"), /session;dur=.*user;dur=.*owner;dur=.*schema;dur=.*invitation;dur=.*smtp;dur=.*total;dur=/);
  const roster = await route.GET(new Request("https://envitefy.com"), context);
  assert.equal(roster.status, 200);
  assert.match(roster.headers.get("server-timing"), /owner;dur=.*schema;dur=.*roster;dur=.*total;dur=/);
  assert.deepEqual(calls[0], ["invite", "friend@test.com"]);
  assert.ok(calls[1][1].acceptUrl.includes("/cohost-invite#"));
  assert.deepEqual(calls[2], [inviteId, "sent"]);
  sent = false;
  const failed = await route.POST(request({ email: "friend@test.com" }), context);
  assert.equal(failed.status, 202); assert.equal((await failed.json()).emailSent, false);
  assert.deepEqual(calls.at(-1), [inviteId, "failed"]);
  const acceptance = compile("src/app/api/cohost-invitations/route.ts", mocks);
  user = null;
  const inspected = await acceptance.POST(request({ token: "b".repeat(64), action: "inspect" }));
  assert.equal(inspected.status, 200);
  const metadata = await inspected.json();
  assert.equal(metadata.acceptedByCurrentUser, false);
  assert.equal(metadata.href, null);
  assert.equal(calls.filter(call => call[0] === "accept").length, 0);
  assert.equal((await acceptance.POST(request({ token: "b".repeat(64), action: "accept" }))).status, 401);
  user = "friend";
  const accepted = await acceptance.POST(request({ token: "b".repeat(64), action: "accept" }));
  assert.equal((await accepted.json()).href, `/event/${eventId}?tab=dashboard`);
});

test("draft rendering rechecks co-host membership in its database read and keeps anonymous drafts private", async () => {
  const source = fs.readFileSync("src/lib/db.ts", "utf8");
  const parsed = ts.createSourceFile("db.ts", source, ts.ScriptTarget.Latest, true);
  const declaration = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "getEventHistoryPublicRenderById");
  const code = ts.transpileModule(declaration.getText(parsed), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const event = { id: "event", user_id: "owner", title: "Party", data: { status: "draft" } };
  let active = true, revokeDuringRead = false; const reads = [];
  const module = { exports: {} };
  new Function("getEventHistoryById", "canReadEventDraft", "query", "mapEventHistoryPublicRow", "resolveScanMediaPolicy", "buildEventHistoryPublicDataProjectionSql", "require", "module", "exports", code)(
    async () => event, (data, owner, viewer) => data.status !== "draft" || owner === viewer,
    async (sql, args) => { reads.push(sql); return { rows: args[1] === "owner" || (args[1] === "cohost" && active && sql.includes("c.revoked_at is null")) ? [event] : [] }; },
    row => row || null, () => null, () => "data",
    () => ({ getEventPermissions: async (_event, viewer) => { const canEdit = viewer === "cohost" && active; if (revokeDuringRead) active = false; return { canEdit }; } }), module, module.exports,
  );
  assert.equal(await module.exports.getEventHistoryPublicRenderById("event", null), null);
  assert.equal(reads.length, 0);
  assert.equal((await module.exports.getEventHistoryPublicRenderById("event", "owner")).id, "event");
  assert.equal(reads.at(-1).includes("event_collaborators"), false);
  assert.equal((await module.exports.getEventHistoryPublicRenderById("event", "cohost")).id, "event");
  revokeDuringRead = true;
  assert.equal(await module.exports.getEventHistoryPublicRenderById("event", "cohost"), null);
});

test("a resumed browser template draft keeps its earlier revision until a successful explicit save", async () => {
  const helper = compile("src/lib/template-draft-handoff.ts", {
    "./template-categories": { getTemplateCategory: () => ({ historyCategory: "General" }) },
    "./template-draft-payload": { buildTemplateDraftPayload: () => ({ data: {} }) },
    "./template-draft-storage": { retainDraftMedia: async () => {}, replaceDraftMedia: structuredClone },
  });
  const draft = { id: "draft", eventId: "event", eventRevision: "earlier", snapshot: {}, assets: {} };
  const calls = [];
  await helper.saveTemplateDraftToAccount({ draft, payload: { title: "Party", data: {} }, category: "general", templateId: "garden", status: "draft", authenticated: true, remoteMedia: {},
    request: async (url, options) => { calls.push([url, options]); return Response.json({ id: "event", revision: "saved" }); },
  });
  assert.equal(calls[0][0], "/api/history/event");
  assert.equal(new Headers(calls[0][1].headers).get("If-Match"), "earlier");
  assert.equal(draft.eventRevision, "saved");
});
