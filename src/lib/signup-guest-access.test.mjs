import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
process.env.SIGNUP_MANAGEMENT_SECRET = "signup-management-test-secret-only";
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
test("private form flags survive normalization and explicit saves", () => {
  const { sanitizeSignupForm } = load("src/utils/signup.ts");
  const { updateSignupDefinition } = load("src/lib/signup-mutations.ts");
  const { createDefaultSignupForm } = load("src/utils/signup.ts");
  for (const flags of [{ visibility: "private" }, { publicVisibility: "invite_only" }, { publicPage: false }, { isPublic: "false" }, { public: "0" }]) {
    const form = { ...createDefaultSignupForm(), ...flags };
    const normalized = sanitizeSignupForm(form);
    assert.equal(normalized.visibility, "restricted");
    assert.equal(allowsPublicSignup({ status: "published", signupForm: normalized }), false);
    const saved = updateSignupDefinition(form, { ...normalized, visibility: undefined }, true);
    assert.equal(allowsPublicSignup({ status: "published", signupForm: saved }), false);
  }
  const ordinary = sanitizeSignupForm(createDefaultSignupForm());
  assert.equal(allowsPublicSignup({ status: "published", signupForm: ordinary }), true);
  assert.equal(allowsPublicSignup({ status: "draft", signupForm: ordinary }), false);
  assert.equal(allowsPublicSignup({ status: "published", visibility: "private", signupForm: ordinary }), false);
});
const { createSignupThemeForm } = load("src/lib/signup-starters.ts");
const { createSignupGuestToken, signupGuestId } = load("src/lib/signup-guest-cookie.ts");
const {
  createSignupManagementToken,
  managedSignupResponseId,
  normalizeSignupContact,
  signupEmailEventUrl,
  signupManagementUrl,
  signupManagementCookieName,
  SIGNUP_MANAGEMENT_MAX_AGE,
} = load("src/lib/signup-management.ts");

function setup({ sendConfirmation = async () => {} } = {}) {
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
  const recoveryMail = [];
  const limits = new Map();
  const appLoad = loader({
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
      consumeSignupRecoveryLimit: async (keys) => {
        for (const { key, limit } of keys) {
          assert.ok(!key.includes("@"));
          limits.set(key, (limits.get(key) || 0) + 1);
          if (limits.get(key) > limit) return false;
        }
        return true;
      },
      mutateSignupEvent: async (_id, change) => {
        const next = change(row);
        row = { ...row, data: next.data };
        return { row, result: next.result };
      },
    },
    "@/lib/email": {
      sendSignupConfirmationEmail: async (message) => {
        mail.push(message);
        await sendConfirmation(message);
      },
      sendSignupRecoveryEmail: async (message) => recoveryMail.push(message),
    },
    "@/lib/absolute-url": { absoluteUrl: async (value) => `https://example.com${value}` },
  });
  const route = appLoad("src/app/api/history/[id]/signup/route.ts");
  const recover = appLoad("src/app/api/history/[id]/signup/recover/route.ts");
  const manage = appLoad("src/app/api/history/[id]/signup/manage/route.ts");
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
    recoveryMail,
    recover: (contact, origin = "https://example.com") =>
      recover.POST(
        new Request(`${url}/recover`, {
          method: "POST",
          headers: { origin, "Content-Type": "application/json" },
          body: JSON.stringify({ contact }),
        }),
        context,
      ),
    manage: (token, origin = "https://example.com") =>
      manage.POST(
        new Request(`${url}/manage`, {
          method: "POST",
          headers: { origin, "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }),
        context,
      ),
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
  assert.equal(body.confirmationEmail, "accepted");
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

test("a failed confirmation is reported without losing the signup or creating a duplicate", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (...args) => errors.push(args));
  const app = setup({
    sendConfirmation: async () => {
      throw new Error("SMTP authentication failed");
    },
  });
  const saved = await app.post(app.reservation());
  assert.equal(saved.status, 200);
  const cookie = saved.headers.get("set-cookie").split(";")[0];
  const body = await saved.json();
  assert.equal(body.ok, true);
  assert.equal(body.status, "confirmed");
  assert.equal(body.confirmationEmail, "failed");
  assert.equal(app.row().data.signupForm.responses.length, 1);
  assert.equal((await (await app.get(cookie)).json()).myResponseId, body.response.id);
  assert.equal((await app.post(app.reservation(), cookie)).status, 409);
  assert.equal(app.mail.length, 1);
  assert.equal(errors[0][0], "[signup] Confirmation delivery failed");
  assert.ok(!JSON.stringify(body).includes("SMTP authentication failed"));
});

test("signup email is attempted only when an address is saved", async () => {
  const app = setup();
  app.row().data.signupForm.settings.collectEmail = false;
  const body = await (await app.post(app.reservation({ email: "" }))).json();
  assert.equal(body.ok, true);
  assert.equal(body.confirmationEmail, "not_requested");
  assert.equal(app.mail.length, 0);
});

test("signup response waits until its confirmation email attempt finishes", async () => {
  let finishEmail;
  let emailStarted;
  const started = new Promise((resolve) => {
    emailStarted = resolve;
  });
  const pendingMail = new Promise((resolve) => {
    finishEmail = resolve;
  });
  const app = setup({
    sendConfirmation: async () => {
      emailStarted();
      await pendingMail;
    },
  });
  let finished = false;
  const request = app.post(app.reservation()).then((response) => {
    finished = true;
    return response;
  });
  await started;
  assert.equal(app.row().data.signupForm.responses.length, 1);
  assert.equal(finished, false);
  finishEmail();
  assert.equal((await (await request).json()).confirmationEmail, "accepted");
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

const tokenFrom = (url) => new URLSearchParams(new URL(url).hash.slice(1)).get("token");
const managementCookie = (response) =>
  response.cookies.get(signupManagementCookieName("event"))?.value;

test("confirmation links restore only the matching signup in a new browser and permit editing and cancellation", async () => {
  const app = setup();
  const original = await app.post(app.reservation());
  const originalCookie = original.headers.get("set-cookie").split(";")[0];
  const first = (await original.json()).response;
  await app.post(app.reservation({ email: "two@example.com", name: "Guest Two" }));
  const other = app.row().data.signupForm.responses[1];
  assert.deepEqual((await (await app.get()).json()).signupForm.responses, []);
  assert.ok(app.mail[0].manageUrl.includes("/manage#token="));
  const token = tokenFrom(app.mail[0].manageUrl);
  const restored = await app.manage(token);
  assert.equal(restored.status, 200);
  assert.match(restored.headers.get("set-cookie"), /HttpOnly/);
  const cookie = `${signupManagementCookieName("event")}=${managementCookie(restored)}`;
  const body = await (await app.get(cookie)).json();
  assert.equal(body.myResponseId, first.id);
  assert.deepEqual(
    body.signupForm.responses.map((entry) => entry.id),
    [first.id],
  );
  assert.ok(!JSON.stringify(body).includes(token));
  assert.equal((await app.post({ action: "cancel", signupId: other.id }, cookie)).status, 403);
  const changed = await app.post(
    app.reservation({
      signupId: first.id,
      note: "Changed on another device",
      email: "new@example.com",
    }),
    cookie,
  );
  assert.equal(changed.status, 200);
  const renewedCookie = `${signupManagementCookieName("event")}=${managementCookie(changed)}`;
  assert.equal((await (await app.get(renewedCookie)).json()).myResponseId, first.id);
  assert.equal((await app.manage(token)).status, 400);
  // Original browser stays authorized; a recovery must not invalidate its cookie.
  assert.equal((await (await app.get(originalCookie)).json()).myResponseId, first.id);
  assert.equal(
    (await app.post({ action: "cancel", signupId: first.id }, renewedCookie)).status,
    200,
  );
  assert.equal((await app.manage(tokenFrom(app.mail.at(-1).manageUrl))).status, 400);
});

test("recovery uses saved email, accepts normalized phone lookup, and keeps matches private", async () => {
  const app = setup();
  await app.post(app.reservation());
  // An old signup needs no backfill or existing recovery token.
  app.row().data.signupForm.responses[0].phone = "(850) 555-0123";
  const byEmail = await (await app.recover("ONE@EXAMPLE.COM")).json();
  assert.equal(app.recoveryMail[0].toEmail, "one@example.com");
  await app.recover("+1 850 555 0123");
  assert.equal(app.recoveryMail[1].toEmail, "one@example.com");
  assert.equal(app.recoveryMail[1].links.length, 1);
  assert.deepEqual(await (await app.recover("missing@example.com")).json(), byEmail);
  assert.equal(app.recoveryMail.length, 2);
  assert.ok(!JSON.stringify(byEmail).includes("one@example.com"));
  assert.ok(!JSON.stringify(byEmail).includes("token="));
  assert.equal((await app.recover("555")).status, 400);
  assert.equal((await app.recover("one@example.com", "https://unrelated.example")).status, 403);
  assert.equal(normalizeSignupContact("850-555-0123"), normalizeSignupContact("+1 850 555 0123"));
});

test("recovery groups multiple signups per email and limits repeated sends across email and phone", async () => {
  const app = setup();
  await app.post(app.reservation());
  await app.post(app.reservation({ name: "Another family member" }));
  app.row().data.signupForm.responses.forEach((response) => {
    response.phone = "8505550123";
  });
  for (const contact of [
    "one@example.com",
    "8505550123",
    "+1 8505550123",
    "one@example.com",
    "one@example.com",
  ]) {
    assert.equal((await app.recover(contact)).status, 200);
  }
  assert.equal(app.recoveryMail.length, 3);
  assert.equal(app.recoveryMail[0].links.length, 2);
  assert.notEqual(app.recoveryMail[0].links[0].url, app.recoveryMail[0].links[1].url);
});

test("management tokens reject tampering, expiry, wrong events, contact changes, cancellation and missing secrets", async () => {
  const app = setup();
  await app.post(app.reservation());
  const form = app.row().data.signupForm;
  const response = form.responses[0];
  const now = Date.now();
  const token = createSignupManagementToken("event", response, now);
  assert.equal(managedSignupResponseId(token, "event", form, now), response.id);
  assert.equal(managedSignupResponseId(token, "another-event", form, now), null);
  assert.equal(
    managedSignupResponseId(token, "event", form, now + SIGNUP_MANAGEMENT_MAX_AGE * 1000),
    null,
  );
  assert.equal(managedSignupResponseId(`${token.slice(0, -1)}!`, "event", form, now), null);
  const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
  payload[1] = "different-response";
  assert.equal(
    managedSignupResponseId(
      `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${token.split(".")[1]}`,
      "event",
      form,
    ),
    null,
  );
  assert.equal((await app.manage(token, "https://unrelated.example")).status, 403);
  response.email = "changed@example.com";
  assert.equal(managedSignupResponseId(token, "event", form), null);
  response.email = "one@example.com";
  response.status = "cancelled";
  assert.equal(managedSignupResponseId(token, "event", form), null);
  response.status = "confirmed";
  const secretNames = ["SIGNUP_MANAGEMENT_SECRET", "NEXTAUTH_SECRET", "AUTH_SECRET"];
  const secrets = secretNames.map((name) => process.env[name]);
  try {
    for (const name of secretNames) delete process.env[name];
    assert.equal(managedSignupResponseId(token, "event", form), null);
    assert.throws(
      () => createSignupManagementToken("event", response),
      /requires an authentication secret/,
    );
  } finally {
    secretNames.forEach((name, index) => {
      if (secrets[index] !== undefined) process.env[name] = secrets[index];
    });
  }
});

test("private forms and drafts do not gain anonymous access through recovery links", async () => {
  const app = setup();
  await app.post(app.reservation());
  const token = tokenFrom(app.mail[0].manageUrl);
  app.row().data.visibility = "private";
  assert.equal((await app.manage(token)).status, 400);
  await app.recover("one@example.com");
  assert.equal(app.recoveryMail.length, 0);
  delete app.row().data.visibility;
  app.setDraft();
  assert.equal((await app.manage(token)).status, 400);
  await app.recover("one@example.com");
  assert.equal(app.recoveryMail.length, 0);
});

test("origin checks accept the public proxy hostname but reject unrelated or missing origins", () => {
  const { hasSameSignupOrigin } = load("src/lib/signup-request-origin.ts");
  const local = { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" };
  assert.equal(
    hasSameSignupOrigin(new Request("http://localhost:3000/api", { headers: local })),
    true,
  );
  const proxy = {
    host: "internal:3000",
    "x-forwarded-host": "envitefy.com",
    "x-forwarded-proto": "https",
    origin: "https://envitefy.com",
  };
  assert.equal(
    hasSameSignupOrigin(new Request("http://internal:3000/api", { headers: proxy })),
    true,
  );
  assert.equal(
    hasSameSignupOrigin(
      new Request("http://internal:3000/api", {
        headers: { ...proxy, origin: "https://unrelated.example" },
      }),
    ),
    false,
  );
  delete proxy.origin;
  assert.equal(
    hasSameSignupOrigin(new Request("http://internal:3000/api", { headers: proxy })),
    false,
  );
});

test("confirmation and recovery emails contain private management links in HTML and plain text", async () => {
  const sent = [];
  const smtpNames = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_PORT"];
  const previousSmtp = smtpNames.map((name) => process.env[name]);
  Object.assign(process.env, {
    SMTP_HOST: "smtppro.zoho.com",
    SMTP_USER: "test@example.com",
    SMTP_PASS: "test-only",
    SMTP_PORT: "465",
  });
  const email = loader({
    "@/lib/db": {},
    nodemailer: {
      createTransport: (options) => {
        assert.equal(options.host, "smtppro.zoho.com");
        return {
          async sendMail(message) {
            sent.push(message);
            return { accepted: [message.to], rejected: [] };
          },
        };
      },
    },
  })("src/lib/email.ts");
  try {
    const app = setup();
    app.row().data.signupForm.start = "2026-09-23T07:00";
    app.row().data.signupForm.timezone = "America/Chicago";
    app.row().data.signupForm.venue = "Upper School Campus";
    app.row().data.signupForm.sections[0].title = "Parent Volunteers";
    app.row().data.signupForm.sections[0].slots[0].label = "Donuts & muffins <nut-free>";
    await app.post(app.reservation());
    await email.sendSignupConfirmationEmail(app.mail[0]);
    const content = sent[0];
    assert.equal(content.from, "Envitefy Sign-up Forms <signup-forms@envitefy.com>");
    assert.match(content.html, /Update or cancel my signup/);
    assert.match(content.html, /Parent Volunteers: Donuts &amp; muffins &lt;nut-free&gt;/);
    assert.match(content.text, /Parent Volunteers: Donuts & muffins <nut-free>/);
    assert.match(content.text, /7:00 AM CDT/);
    assert.match(content.text, /Upper School Campus/);
    assert.match(content.html, />View signup form<\/a>/);
    assert.ok(content.html.includes(app.mail[0].eventUrl));
    assert.ok(content.html.includes(app.mail[0].manageUrl));
    assert.ok(content.text.includes(app.mail[0].manageUrl));
    await email.sendSignupRecoveryEmail({
      toEmail: "one@example.com",
      eventTitle: "Breakfast",
      links: [{ name: "Guest One", url: app.mail[0].manageUrl }],
    });
    assert.equal(sent[1].to, "one@example.com");
    assert.equal(sent[1].from, "Envitefy Sign-up Forms <signup-forms@envitefy.com>");
    assert.ok(sent[1].html.includes(app.mail[0].manageUrl));
    assert.ok(sent[1].text.includes(app.mail[0].manageUrl));
    for (const message of sent) {
      const visibleCopy = message.html.replace(/<[^>]*>/g, "");
      assert.ok(!visibleCopy.includes(app.mail[0].manageUrl));
      assert.ok(!visibleCopy.includes(app.mail[0].eventUrl));
      assert.doesNotMatch(visibleCopy, /#token=|30 days|You can also open this private link/);
      assert.match(message.html, /Sincerely,<br\/>/);
      assert.match(message.html, /<strong>Envitefy Team<\/strong>/);
      assert.match(message.html, /CREATE \| SHARE \| ENJOY/);
      assert.match(message.html, /https:\/\/envitefy.com\/email\/envitefy-wordmark-email.png/);
      assert.match(message.html, /https:\/\/www.instagram.com\/envitefy\//);
      assert.match(message.text, /Sincerely,\nEnvitefy Team\nCREATE \| SHARE \| ENJOY/);
    }
    assert.doesNotMatch(content.html, /src="\/templates\//);
    if (process.env.SIGNUP_EMAIL_PREVIEW_PATH)
      writeFileSync(process.env.SIGNUP_EMAIL_PREVIEW_PATH, content.html);
  } finally {
    smtpNames.forEach((name, index) => {
      if (previousSmtp[index] === undefined) delete process.env[name];
      else process.env[name] = previousSmtp[index];
    });
  }
});

test("emailed signup links always use the public site, even when generated on localhost", () => {
  const names = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_BASE_URL",
    "NEXTAUTH_URL",
    "PUBLIC_BASE_URL",
    "APP_URL",
  ];
  const previous = names.map((name) => process.env[name]);
  try {
    for (const name of names) process.env[name] = "http://localhost:3000";
    const response = {
      id: "response",
      createdAt: "2026-09-18T12:00:00Z",
      email: "test@example.com",
    };
    assert.equal(
      signupEmailEventUrl("breakfast"),
      "https://envitefy.com/smart-signup-form/breakfast",
    );
    assert.match(
      signupManagementUrl("event", response),
      /^https:\/\/envitefy.com\/smart-signup-form\/event\/manage#token=/,
    );
  } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});

test("Zoho requires credentials and encrypted SMTP; rejected mail remains a failure", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  t.mock.method(console, "info", (...args) => logs.push(args));
  const names = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_PASSWORD", "SMTP_PORT"];
  const previous = names.map((name) => process.env[name]);
  const attempts = [];
  let result = { accepted: ["guest@example.com"], rejected: [] };
  let sendError = null;
  const { sendTransactionalEmail, zohoSmtpOptions } = loader({
    nodemailer: {
      createTransport: (options) => ({
        async sendMail(message) {
          attempts.push({ options, message });
          if (sendError) throw sendError;
          return result;
        },
      }),
    },
  })("src/lib/mail-transport.ts");
  const message = {
    from: "Envitefy Sign-up Forms <signup-forms@envitefy.com>",
    to: "guest@example.com",
    subject: "Confirmed",
    text: "Your signup",
    html: "<p>Your signup</p>",
  };
  try {
    for (const name of names) delete process.env[name];
    await assert.rejects(sendTransactionalEmail(message), /Zoho email is not configured/);
    assert.equal(attempts.length, 0);
    Object.assign(process.env, {
      SMTP_HOST: "smtppro.zoho.com",
      SMTP_USER: "mailbox@example.com",
      SMTP_PASS: "test-only",
    });
    await sendTransactionalEmail(message);
    assert.deepEqual(attempts[0].message, message);
    assert.equal(attempts[0].options.host, "smtppro.zoho.com");
    assert.equal(attempts[0].options.port, 465);
    assert.equal(attempts[0].options.secure, true);
    process.env.SMTP_PORT = "587";
    assert.equal(zohoSmtpOptions().secure, false);
    assert.equal(zohoSmtpOptions().requireTLS, true);
    process.env.SMTP_PORT = "25";
    assert.throws(zohoSmtpOptions, /must be 465 or 587/);
    process.env.SMTP_PORT = "465";
    result = { accepted: [], rejected: [message.to] };
    await assert.rejects(sendTransactionalEmail(message), /did not accept/);
    sendError = Object.assign(new Error("SMTP authentication failed: private-token"), {
      code: "EAUTH",
      responseCode: 535,
      command: "AUTH PLAIN",
    });
    await assert.rejects(sendTransactionalEmail(message), /SMTP authentication failed/);
    assert.equal(attempts.length, 3, "delivery failures must not trigger a provider fallback");
    assert.deepEqual(logs.at(-1), [
      "[email] Zoho delivery failed",
      { code: "EAUTH", responseCode: 535, stage: "AUTH" },
    ]);
    const logged = JSON.stringify(logs);
    assert.ok(!logged.includes(message.to));
    assert.ok(!logged.includes("test-only"));
    assert.ok(!logged.includes("private-token"));
  } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});

test("account, sharing and RSVP emails use the same transactional transport", async () => {
  const sent = [];
  const email = loader({
    "@/lib/db": { getUserByEmail: async () => ({ first_name: "Test", last_name: "Host" }) },
    "@/lib/mail-transport": { sendTransactionalEmail: async (message) => sent.push(message) },
  })("src/lib/email.ts");
  const toEmail = "guest@example.com";
  await email.sendPasswordResetEmail({
    toEmail,
    resetUrl: "https://envitefy.com/reset?token=test",
  });
  await email.sendPasswordChangeConfirmationEmail({ toEmail, userName: "Guest" });
  await email.sendShareEventEmail({
    toEmail,
    ownerEmail: "host@example.com",
    eventTitle: "Breakfast",
    eventUrl: "https://envitefy.com/event/test",
  });
  await email.sendRsvpConfirmationEmail({
    toEmail,
    eventTitle: "Breakfast",
    eventUrl: "https://envitefy.com/event/test",
    response: "yes",
  });
  assert.equal(sent.length, 4);
  for (const message of sent) {
    assert.equal(message.to, toEmail);
    assert.ok(message.subject);
    assert.ok(message.html);
    assert.ok(message.text);
  }
  assert.match(sent[0].text, /https:\/\/envitefy.com\/reset\?token=test/);
  assert.match(sent[1].text, /password was successfully changed/);
  assert.match(sent[2].text, /Test Host/);
  assert.match(sent[3].text, /Going/);
});
