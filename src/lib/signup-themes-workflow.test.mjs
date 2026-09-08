import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
function load(relative, mocks = {}) {
  const file = path.resolve(relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const require = (name) => {
    if (name in mocks) return mocks[name];
    if (name.endsWith(".css")) return new Proxy({}, { get: (_, key) => String(key) });
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/") ? path.resolve("src", name.slice(2)) : path.resolve(path.dirname(file), name);
    return load([base, base + ".ts", base + ".tsx"].find(existsSync), mocks);
  };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const utils = load("src/utils/signup.ts");
const themes = load("src/lib/signup-themes.ts");
const starters = load("src/lib/signup-starters.ts");
const mutations = load("src/lib/signup-mutations.ts");
const { projectSignupForm } = load("src/lib/signup-projection.ts");
const { validateSignupPublish, signupWindowMessage } = load("src/lib/signup-validation.ts");
const { buildTemplateDraftPayload } = load("src/lib/template-draft-payload.ts");
const actor = (userId, isOwner = false) => ({ userId, name: userId, email: `${userId}@example.com`, isOwner });
const form = () => {
  const value = starters.createSignupThemeForm("harvest-table");
  value.settings.collectPhone = false;
  value.settings.waitlistEnabled = false;
  value.settings.allowMultipleSlotsPerPerson = true;
  value.sections[0].slots[0].capacity = 1;
  return value;
};
const reserve = (value, extra = {}) => ({ action: "reserve", slots: [{ sectionId: value.sections[0].id, slotId: value.sections[0].slots[0].id, quantity: 1 }], ...extra });
const fails = (fn, status) => assert.throws(fn, e => e instanceof mutations.SignupMutationError && e.status === status);

test("all six themes roundtrip, preserve signup content, and keep readable accent contrast", () => {
  const original = form(); original.responses = [{ id: "preserve", status: "cancelled", slots: [] }];
  for (const theme of themes.SIGNUP_THEMES) {
    const next = themes.applySignupTheme(original, theme.id);
    assert.deepEqual(next.sections, original.sections);
    assert.deepEqual(next.responses, original.responses);
    assert.equal(next.title, original.title);
    assert.deepEqual(utils.sanitizeSignupForm(next).appearance, next.appearance);
    assert.ok(existsSync(path.join("public", theme.artwork)));
    const bytes = readFileSync(path.join("public", theme.artwork));
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    for (const palette of ["original", "soft", "ink"]) {
      next.appearance.palette = palette;
      const style = themes.resolveSignupThemeStyle(next);
      assert.ok(themes.signupContrast(style["--signup-accent"], style["--signup-on-accent"]) >= 4.5, `${theme.id}/${palette}`);
    }
  }
});

test("public and participant projections remove other contacts while retaining accurate quantities", () => {
  let value = form(); value.sections[0].slots[0].capacity = 5;
  const first = mutations.mutateSignupReservation(value, reserve(value, { note: "private note" }), actor("alex")); value = first.form;
  value = mutations.mutateSignupReservation(value, reserve(value, { slots: [{ ...reserve(value).slots[0], quantity: 2 }] }), actor("blair")).form;
  const publicForm = projectSignupForm(value), guest = projectSignupForm(value, { userId: "alex" });
  assert.equal(publicForm.responses.length, 0); assert.equal(guest.responses.length, 1);
  assert.ok(!JSON.stringify(guest).includes("blair@example.com"));
  assert.equal(utils.countConfirmedForSlot(publicForm, value.sections[0].id, value.sections[0].slots[0].id), 3);
  assert.equal(utils.remainingCapacityForSlot(guest, value.sections[0].id, value.sections[0].slots[0].id, first.response.id), 3);
  assert.equal(projectSignupForm(value, { isOwner: true }).responses.length, 2);
});

test("reservation ownership, signed identities, windows, quantity and slot limits are enforced", () => {
  const value = form(), saved = mutations.mutateSignupReservation(value, reserve(value), actor("alex"));
  for (const action of ["reserve", "cancel"]) fails(() => mutations.mutateSignupReservation(saved.form, { ...reserve(value), action, signupId: saved.response.id }, actor("blair")), 403);
  const legacy = { ...saved.form, responses: [{ ...saved.response, userId: null }] };
  fails(() => mutations.mutateSignupReservation(legacy, { action: "cancel", signupId: saved.response.id }, actor("blair")), 403);
  const edited = mutations.mutateSignupReservation(saved.form, reserve(value, { signupId: saved.response.id, name: "Alex edited" }), actor("host", true));
  assert.equal(edited.response.userId, "alex");
  fails(() => mutations.mutateSignupReservation({ ...value, enabled: false }, reserve(value), actor("blair")), 409);
  value.settings.signupClosesAt = "2026-09-08T10:00"; value.timezone = "America/Chicago";
  fails(() => mutations.mutateSignupReservation(value, reserve(value), actor("blair"), new Date("2026-09-08T15:00Z")), 409);
  assert.equal(signupWindowMessage(value, new Date("2026-09-08T14:59Z")), null);
  value.settings.signupClosesAt = null;
  fails(() => mutations.mutateSignupReservation(value, reserve(value, { slots: [{ ...reserve(value).slots[0], quantity: 51 }] }), actor("blair")), 400);
  value.settings.maxSlotsPerPerson = 1;
  fails(() => mutations.mutateSignupReservation(value, reserve(value, { slots: value.sections[0].slots.slice(0, 2).map(slot => ({ sectionId: value.sections[0].id, slotId: slot.id, quantity: 1 })) }), actor("blair")), 400);
});

test("waitlist promotion preserves confirmed places and only promotes when space becomes available", () => {
  const value = form(); value.settings.waitlistEnabled = true;
  const first = mutations.mutateSignupReservation(value, reserve(value), actor("alex"));
  const second = mutations.mutateSignupReservation(first.form, reserve(value), actor("blair"));
  assert.equal(second.response.status, "waitlisted");
  const cancelled = mutations.mutateSignupReservation(second.form, { action: "cancel", signupId: first.response.id }, actor("alex"));
  assert.equal(cancelled.form.responses.find(r => r.userId === "blair").status, "confirmed");
});

test("definition edits retain newer responses, reject stale revisions and protect claimed slots", () => {
  const initial = form();
  const saved = mutations.mutateSignupReservation(initial, reserve(initial), actor("alex"));
  const edit = themes.applySignupTheme(initial, "school-days");
  const next = mutations.updateSignupDefinition(saved.form, edit);
  assert.equal(next.responses.length, 1); assert.equal(next.revision, 1);
  fails(() => mutations.updateSignupDefinition(next, edit), 409);
  edit.sections[0].slots = edit.sections[0].slots.slice(1);
  fails(() => mutations.updateSignupDefinition(saved.form, edit), 409);
});

test("publishing checks missing details, date ordering and nonexistent local DST times", () => {
  const value = form(); value.timezone = "America/Chicago";
  value.start = "2026-03-08T02:30";
  assert.ok(validateSignupPublish(value).some(issue => issue.field === "signup-start"));
  value.start = "2026-09-10T10:00"; value.end = "2026-09-10T09:00";
  assert.ok(validateSignupPublish(value).some(issue => issue.field === "signup-end"));
  value.end = null; value.locationMode = "online"; value.location = "example.com";
  assert.ok(validateSignupPublish(value).some(issue => issue.field === "signup-location"));
  const payload = buildTemplateDraftPayload({ form: value }, "signup-forms", "America/Chicago");
  assert.equal(payload.data.startISO, "2026-09-10T15:00:00.000Z");
  assert.equal(payload.data.responses, undefined);
});

function transactionalStore(initial, failMirror = false) {
  let row = { id: "event", user_id: "host", title: initial.title, data: { signupForm: initial, marker: "preserve" } };
  let mirror = initial, queue = Promise.resolve();
  const dbSource = readFileSync("src/lib/db.ts", "utf8");
  const source = dbSource.slice(dbSource.indexOf("export async function mutateSignupEvent"), dbSource.indexOf("export type SignupFormRow"));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const withClient = async callback => {
    let release, stagedRow, stagedMirror;
    const client = { query: async (sql, params) => {
      if (sql.includes("for update")) { const before = queue; queue = new Promise(resolve => { release = resolve; }); await before; return { rows: [structuredClone(row)] }; }
      if (sql.startsWith("update event_history")) { stagedRow = { ...row, data: JSON.parse(params[1]) }; return { rows: [stagedRow] }; }
      if (sql.includes("insert into signup_forms")) { if (failMirror) throw new Error("mirror unavailable"); stagedMirror = JSON.parse(params[1]); }
      if (sql === "commit") { row = stagedRow; mirror = stagedMirror; release?.(); }
      if (sql === "rollback") release?.();
      return { rows: [] };
    } };
    return callback(client);
  };
  const exports = {};
  new Function("exports", "withClient", "ensureSignupFormsTable", "sanitizeJsonValueForPostgres", "normalizeCanonicalStartFields", code)(exports, withClient, async () => {}, value => value, () => {});
  return { mutate: exports.mutateSignupEvent, read: () => ({ row, mirror }) };
}

test("transaction serializes competing last-place claims and commits both stores together", async () => {
  const value = form(), store = transactionalStore(value);
  const claim = user => store.mutate("event", row => { const change = mutations.mutateSignupReservation(mutations.readStoredSignup(row.data.signupForm), reserve(value), actor(user)); return { data: { ...row.data, signupForm: change.form }, result: change.response }; });
  const results = await Promise.allSettled([claim("alex"), claim("blair")]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
  const persisted = store.read();
  assert.equal(persisted.row.data.signupForm.responses.length, 1);
  assert.deepEqual(persisted.row.data.signupForm, persisted.mirror);
  assert.equal(persisted.row.data.marker, "preserve");
});

test("a normalized-store failure rolls back the event change", async () => {
  const value = form(), store = transactionalStore(value, true);
  await assert.rejects(store.mutate("event", row => ({ data: { ...row.data, signupForm: { ...value, title: "must rollback" } }, result: null })), /mirror unavailable/);
  assert.equal(store.read().row.data.signupForm.title, value.title);
});

test("every header layout uses the same saved photo sources and has decorative images", () => {
  const React = nativeRequire("react"), { renderToStaticMarkup } = nativeRequire("react-dom/server");
  const Header = load("src/components/smart-signup-form/SignupTemplateHeader.tsx").default;
  const value = form();
  value.header.images = ["one", "two", "three"].map(id => ({ id, name: id, dataUrl: `/${id}.webp`, type: "image/webp" }));
  const expected = { "header-1": 1, "header-2": 1, "header-3": 1, "header-4": 2, "header-5": 2, "header-6": 3, none: 0 };
  for (const [layout, count] of Object.entries(expected)) {
    value.appearance.headerLayout = layout;
    const html = renderToStaticMarkup(React.createElement(Header, { form: value }));
    assert.equal((html.match(/<img /g) || []).length, count, layout);
    assert.equal((html.match(/alt=""/g) || []).length, count);
    assert.ok(html.includes(value.title));
  }
});

test("CSV quotes guest text and prevents spreadsheet formulas; only organizers close forms", () => {
  const { signupResponsesCsv } = load("src/lib/signup-export.ts");
  const value = form();
  const saved = mutations.mutateSignupReservation(value, reserve(value, { name: '=HYPERLINK("https://example.com")', note: "two\nlines" }), actor("alex"));
  const csv = signupResponsesCsv(saved.form);
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.com"")"'));
  assert.ok(csv.includes('"two\nlines"'));
  fails(() => mutations.mutateSignupReservation(saved.form, { action: "set-open", enabled: false }, actor("alex")), 403);
  const closed = mutations.mutateSignupReservation(saved.form, { action: "set-open", enabled: false }, actor("host", true));
  assert.equal(closed.form.enabled, false); assert.equal(closed.form.responses.length, 1);
});

test("draft sanitization retains opening intent, closed definitions stay closed, reminders can be empty", () => {
  const empty = { ...form(), sections: [], settings: { ...form().settings, autoRemindersHoursBefore: [] } };
  const saved = utils.sanitizeSignupForm(empty);
  assert.equal(saved.enabled, true);
  assert.deepEqual(saved.settings.autoRemindersHoursBefore, []);
  const closed = { ...form(), enabled: false };
  const changed = mutations.updateSignupDefinition(closed, themes.applySignupTheme(closed, "game-day"));
  assert.equal(changed.enabled, false);
});

test("the signup API returns guest-safe data and rejects editing another participant", async () => {
  const initial = form(); initial.sections[0].slots[0].capacity = 3;
  const claimed = mutations.mutateSignupReservation(initial, reserve(initial, { note: "private answer" }), actor("alex"));
  const row = { id: "event", user_id: "host", title: "Signup", data: { signupForm: claimed.form } };
  let userId = null;
  const route = load("src/app/api/history/[id]/signup/route.ts", {
    "next/server": { NextResponse: Response },
    "next-auth": { getServerSession: async () => userId ? { user: { email: `${userId}@example.com`, name: userId } } : null },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/event-draft-access-server": { guardDraftRequest: async () => null },
    "@/lib/history-cache": { invalidateUserHistory() {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
    "@/lib/smart-signup-indexing": { isIndexablePublicSmartSignupData: () => true },
    "@/lib/db": { getEventHistoryById: async () => row, isEventSharedWithUser: async () => Boolean(userId), listShareRecipientUserIdsForEvent: async () => [], mutateSignupEvent: async (_id, change) => { const next = change(row); return { row: { ...row, data: next.data }, result: next.result }; } },
    "@/lib/email": { sendSignupConfirmationEmail: async () => { throw new Error("Unexpected email attempt in this read/denial test"); } },
    "@/lib/absolute-url": { absoluteUrl: async path => `https://example.com${path}` },
  });
  const context = { params: Promise.resolve({ id: "event" }) };
  const publicResponse = await route.GET(new Request("https://example.com/api/history/event/signup"), context);
  const publicJson = await publicResponse.json();
  assert.equal(publicJson.signupForm.responses.length, 0);
  assert.ok(!JSON.stringify(publicJson).includes("private answer"));
  userId = "blair";
  const denial = await route.POST(new Request("https://example.com/api/history/event/signup", { method: "POST", body: JSON.stringify(reserve(initial, { signupId: claimed.response.id })) }), context);
  assert.equal(denial.status, 403);
  userId = "alex";
  const own = await route.GET(new Request("https://example.com/api/history/event/signup"), context);
  assert.equal((await own.json()).signupForm.responses[0].userId, "alex");
});

test("repeated account draft saves use the server revision without resetting editor fields", async () => {
  const { saveTemplateDraftToAccount } = load("src/lib/template-draft-handoff.ts");
  const value = form();
  const draft = { version: 1, id: "browser-draft", category: "signup-forms", templateId: "editorial--harvest-table", updatedAt: Date.now(), snapshot: { form: value }, assets: {} };
  const revisions = [];
  const request = async (_url, options) => {
    const body = JSON.parse(options.body); revisions.push(body.data.signupForm.revision || 0);
    return Response.json({ id: "event", data: { ...body.data, signupForm: { ...body.data.signupForm, revision: revisions.length } } });
  };
  const persist = () => saveTemplateDraftToAccount({ draft, payload: buildTemplateDraftPayload(draft.snapshot, "signup-forms", "America/Chicago"), category: "signup-forms", templateId: draft.templateId, status: "draft", authenticated: true, remoteMedia: {}, request });
  await persist();
  draft.snapshot.form.title = "Keep these new edits";
  await persist();
  assert.deepEqual(revisions, [0, 1]); assert.equal(draft.signupRevision, 2);
  assert.equal(draft.snapshot.form.title, "Keep these new edits");
});
