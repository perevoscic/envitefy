import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const require = (name) => {
      if (name in mocks) return mocks[name];
      if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
      const base = name.startsWith("@/")
        ? path.resolve("src", name.slice(2))
        : path.resolve(path.dirname(file), name);
      return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync));
    };
    new Function("require", "module", "exports", code)(require, module, module.exports);
    return module.exports;
  }
  return load;
}
const load = loader();
const { allowsPublicSignup } = load("src/lib/signup-access.ts");
const { createSignupThemeForm } = load("src/lib/signup-starters.ts");
const { createSignupGuestToken, signupGuestId } = load("src/lib/signup-guest-cookie.ts");

function setup() {
  const form = createSignupThemeForm("harvest-table");
  form.settings.collectPhone = false;
  form.settings.collectEmail = true;
  form.settings.waitlistEnabled = false;
  form.sections[0].slots[0].capacity = 2;
  let row = {
    id: "event",
    user_id: "host",
    title: "Breakfast",
    data: { status: "published", signupForm: form },
  };
  let userId = null;
  let shared = false;
  let draftDenied = false;
  const mail = [];
  const route = loader({
    "next-auth": {
      getServerSession: async () =>
        userId ? { user: { email: `${userId}@example.com`, name: userId } } : null,
    },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/event-draft-access-server": {
      guardDraftRequest: async () =>
        draftDenied ? Response.json({ error: "Not found" }, { status: 404 }) : null,
    },
    "@/lib/history-cache": { invalidateUserHistory() {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
    "@/lib/db": {
      getEventHistoryById: async () => row,
      isEventSharedWithUser: async () => shared,
      listShareRecipientUserIdsForEvent: async () => [],
      mutateSignupEvent: async (_id, change) => {
        const next = change(row);
        row = { ...row, data: next.data };
        return { row, result: next.result };
      },
    },
    "@/lib/email": {
      sendSignupConfirmationEmail: async (message) => {
        mail.push(message);
      },
    },
    "@/lib/absolute-url": { absoluteUrl: async (value) => `https://example.com${value}` },
  })("src/app/api/history/[id]/signup/route.ts");
  const url = "https://example.com/api/history/event/signup";
  const context = { params: Promise.resolve({ id: "event" }) };
  const reservation = (extra = {}) => ({
    action: "reserve",
    name: "Guest One",
    email: "one@example.com",
    note: "Private note",
    slots: [{ sectionId: form.sections[0].id, slotId: form.sections[0].slots[0].id, quantity: 1 }],
    ...extra,
  });
  return {
    row: () => row,
    mail,
    reservation,
    signIn: (value) => {
      userId = value;
    },
    acceptInvitation: () => {
      shared = true;
    },
    setDraft: (guard = true) => {
      row.data.status = "draft";
      draftDenied = guard;
    },
    get: (cookie = "") => route.GET(new Request(url, { headers: { cookie } }), context),
    post: (body, cookie = "", origin = "https://example.com") =>
      route.POST(
        new Request(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie, origin },
          body: JSON.stringify(body),
        }),
        context,
      ),
  };
}

test("ordinary and unlisted published signup links accept guests without becoming indexable", () => {
  assert.equal(allowsPublicSignup({ signupForm: {} }), true);
  assert.equal(
    allowsPublicSignup({ signupForm: { enabled: false }, visibility: "unlisted", noindex: true }),
    true,
  );
  for (const visibility of ["private", "restricted", "invite-only"])
    assert.equal(allowsPublicSignup({ signupForm: {}, visibility }), false);
  assert.equal(allowsPublicSignup({ signupForm: {}, status: "draft" }), false);
  assert.equal(allowsPublicSignup({ signupForm: { publicPage: false } }), false);
  assert.equal(allowsPublicSignup({ title: "Not a signup" }), false);
});

test("anonymous guests can reserve, reload, edit and cancel using their private browser cookie", async () => {
  const app = setup();
  const initial = await app.get();
  assert.equal(initial.status, 200);
  assert.deepEqual((await initial.json()).signupForm.responses, []);
  const saved = await app.post(app.reservation());
  assert.equal(saved.status, 200);
  const header = saved.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=lax/i);
  const cookie = header.split(";")[0];
  const body = await saved.json();
  assert.equal(body.status, "confirmed");
  assert.equal(body.myResponseId, body.response.id);
  assert.ok(!JSON.stringify(body).includes("guestId"));
  const stored = app.row().data.signupForm.responses[0];
  assert.equal(stored.guestId.length, 64);
  assert.ok(!stored.userId);
  assert.ok(!JSON.stringify(app.row()).includes(cookie.split("=")[1]));
  const refreshed = await (await app.get(cookie)).json();
  assert.equal(refreshed.myResponseId, body.response.id);
  assert.equal(refreshed.signupForm.responses[0].note, "Private note");
  const duplicate = await app.post(app.reservation(), cookie);
  assert.equal(duplicate.status, 409);
  const edited = await app.post(
    app.reservation({ signupId: body.response.id, name: "Guest Updated" }),
    cookie,
  );
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).response.name, "Guest Updated");
  const cancelled = await app.post({ action: "cancel", signupId: body.response.id }, cookie);
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).myResponseId, null);
  assert.equal(app.row().data.signupForm.responses[0].status, "cancelled");
  assert.equal(app.mail.length, 2);
});

test("response IDs and matching email addresses cannot reveal or change another guest's signup", async () => {
  const app = setup();
  const saved = await (await app.post(app.reservation())).json();
  const stranger = await (await app.get()).json();
  assert.deepEqual(stranger.signupForm.responses, []);
  assert.equal(stranger.signupForm.availability[0].confirmed, 1);
  assert.ok(!JSON.stringify(stranger).includes("one@example.com"));
  assert.ok(!JSON.stringify(stranger).includes("Private note"));
  for (const action of ["reserve", "cancel"])
    assert.equal(
      (await app.post(app.reservation({ action, signupId: saved.response.id }))).status,
      403,
    );
  assert.equal((await app.post({ action: "set-open", enabled: false })).status, 403);
  app.signIn("other-account");
  assert.equal((await app.post(app.reservation({ signupId: saved.response.id }))).status, 403);
  app.signIn("host");
  const owner = await (await app.get()).json();
  assert.equal(owner.signupForm.responses[0].email, "one@example.com");
  assert.ok(!JSON.stringify(owner).includes("guestId"));
  assert.equal((await app.post({ action: "set-open", enabled: false })).status, 200);
  app.signIn(null);
  assert.equal((await app.get()).status, 200);
  assert.equal((await app.post(app.reservation())).status, 409);
});

test("capacity, private forms, drafts and cross-origin writes remain protected", async () => {
  const app = setup();
  assert.equal((await app.post(app.reservation())).status, 200);
  assert.equal((await app.post(app.reservation({ email: "two@example.com" }))).status, 200);
  assert.equal((await app.post(app.reservation({ email: "three@example.com" }))).status, 409);
  assert.equal(app.row().data.signupForm.responses.length, 2);
  app.row().data.visibility = "private";
  assert.equal((await app.get()).status, 403);
  assert.equal((await app.post(app.reservation())).status, 403);
  app.signIn("invited");
  assert.equal((await app.get()).status, 403);
  app.acceptInvitation();
  assert.equal((await app.get()).status, 200);
  app.setDraft();
  assert.equal((await app.get()).status, 404);
  assert.equal((await app.post(app.reservation())).status, 404);
  app.setDraft(false);
  assert.equal((await app.post(app.reservation())).status, 404);
  assert.equal(
    (await setup().post(app.reservation(), "", "https://unrelated.example")).status,
    403,
  );
});

test("guest tokens are random and invalid cookies cannot become an identity", () => {
  const first = createSignupGuestToken();
  assert.notEqual(first, createSignupGuestToken());
  assert.equal(signupGuestId(first).length, 64);
  for (const value of [null, "", "guest", "one@example.com", signupGuestId(first)])
    assert.equal(signupGuestId(value), null);
});
