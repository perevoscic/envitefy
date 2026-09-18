import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
const native = createRequire(import.meta.url);
function load(file, mocks = {}, cache = new Map()) {
  file = path.resolve(file);
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file.replace(/\.mjs$/, ".ts"),
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const require = (name) => {
    if (name in mocks) return mocks[name];
    if (!name.startsWith("@/") && !name.startsWith(".")) return native(name);
    const base = name.startsWith("@/")
      ? path.resolve("src", name.slice(2))
      : path.resolve(path.dirname(file), name);
    return load([base, base + ".ts", base + ".tsx"].find(existsSync), mocks, cache);
  };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const { createDefaultSignupForm, sanitizeSignupForm, countConfirmedForSlot } =
  load("src/utils/signup.ts");
const { validateSignupReservation } = load("src/lib/signup-reservation-validation.ts");
const { mutateSignupReservation } = load("src/lib/signup-mutations.ts");
const { createSignupBlock, generateSignupShifts, addFieldDayStarter } = load(
  "src/lib/signup-composer.ts",
);
const actor = {
  userId: "parent",
  email: "parent@example.test",
  name: "Test parent",
  isOwner: false,
};
const now = new Date("2026-09-18T12:00:00Z");
function form() {
  return {
    ...createDefaultSignupForm(),
    title: "Field Day test",
    settings: {
      ...createDefaultSignupForm().settings,
      allowMultipleSlotsPerPerson: true,
      maxSlotsPerPerson: null,
      collectPhone: false,
      maxQuantityPerSlot: 3,
      waitlistEnabled: true,
    },
    sections: [
      {
        id: "shifts",
        title: "Volunteer shifts",
        kind: "slots",
        purpose: "times",
        maxSelectionsPerPerson: 1,
        maxQuantityPerSlot: 1,
        unitLabel: "parents",
        slots: [
          { id: "morning", label: "Morning helper", capacity: 2 },
          { id: "later", label: "Later helper", capacity: 2 },
        ],
      },
      {
        id: "items",
        title: "Donations",
        kind: "slots",
        purpose: "items",
        maxQuantityPerSlot: 3,
        unitLabel: "packs",
        slots: [
          { id: "water", label: "Water", capacity: 6 },
          { id: "fruit", label: "Fruit", capacity: 8 },
        ],
      },
    ],
    questions: [{ id: "class", prompt: "Grade and teacher", required: true }],
    responses: [],
  };
}
const slot = (sectionId, slotId, quantity = 1) => ({ sectionId, slotId, quantity });
const input = (slots) => ({
  action: "reserve",
  slots,
  name: "Test parent",
  email: "parent@example.test",
  answers: [{ questionId: "class", value: "Grade 3 — Ms. Taylor" }],
});
const response = (id, slots, status = "confirmed") => ({
  id,
  userId: id,
  name: id,
  email: id + "@example.test",
  slots,
  status,
  answers: [{ questionId: "class", value: "Grade 3" }],
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
});

test("section rules permit one shift and multiple donations, but reject two shifts in both preview and server", () => {
  const f = form();
  const valid = input([
    slot("shifts", "morning"),
    slot("items", "water", 3),
    slot("items", "fruit"),
  ]);
  assert.deepEqual(validateSignupReservation(f, valid, now).issues, []);
  assert.equal(mutateSignupReservation(f, valid, actor, now).response.status, "confirmed");
  const invalid = input([slot("shifts", "morning"), slot("shifts", "later")]);
  assert.match(
    validateSignupReservation(f, invalid, now).issues[0].message,
    /no more than 1 in Volunteer shifts/,
  );
  assert.throws(
    () => mutateSignupReservation(f, invalid, actor, now),
    /no more than 1 in Volunteer shifts/,
  );
  assert.equal(f.responses.length, 0);
});
test("preview and server enforce overall limits, quantities and required answers", () => {
  const f = form();
  f.settings.maxSlotsPerPerson = 2;
  const cases = [
    input([slot("shifts", "morning"), slot("items", "water"), slot("items", "fruit")]),
    input([slot("shifts", "morning", 2)]),
    { ...input([slot("items", "water")]), answers: [] },
    { ...input([slot("items", "water")]), email: "invalid" },
  ];
  for (const payload of cases) {
    assert.ok(validateSignupReservation(f, payload, now).issues.length);
    assert.throws(() => mutateSignupReservation(f, payload, actor, now));
  }
});
test("quantities larger than total capacity cannot enter an impossible waitlist", () => {
  const f = form();
  f.sections[0].maxQuantityPerSlot = 3;
  const payload = { ...input([slot("shifts", "morning", 3)]), acceptWaitlist: true };
  assert.match(validateSignupReservation(f, payload, now).issues[0].message, /total capacity of 2/);
  assert.throws(() => mutateSignupReservation(f, payload, actor, now), /total capacity of 2/);
});
test("mixed available/unavailable choices require explicit consent before whole-request waitlisting", () => {
  const f = form();
  f.responses = [response("other", [slot("shifts", "morning", 2)])];
  const payload = input([slot("shifts", "morning"), slot("items", "water")]);
  assert.deepEqual(validateSignupReservation(f, payload, now).waitlisted, ["Morning helper"]);
  assert.throws(
    () => mutateSignupReservation(f, payload, actor, now),
    /Confirm.*all your selections/,
  );
  const accepted = mutateSignupReservation(f, { ...payload, acceptWaitlist: true }, actor, now);
  assert.equal(accepted.response.status, "waitlisted");
  assert.equal(countConfirmedForSlot(accepted.form, "items", "water"), 0);
  const onlyAvailable = mutateSignupReservation(f, input([slot("items", "water")]), actor, now);
  assert.equal(onlyAvailable.response.status, "confirmed");
});
test("a waitlisted response can be corrected without losing its identity or answers", () => {
  const f = form();
  f.sections[0].maxQuantityPerSlot = 3;
  f.responses = [
    response("parent", [slot("shifts", "morning", 3), slot("items", "water")], "waitlisted"),
  ];
  const updated = mutateSignupReservation(
    f,
    { ...input([slot("shifts", "morning"), slot("items", "water")]), signupId: "parent" },
    actor,
    now,
  );
  assert.equal(updated.response.id, "parent");
  assert.equal(updated.response.status, "confirmed");
  assert.equal(updated.response.answers[0].value, "Grade 3 — Ms. Taylor");
  assert.equal(countConfirmedForSlot(updated.form, "shifts", "morning"), 1);
});
test("cancellation remains available when closed and releases capacity; other parents cannot edit", () => {
  const f = form();
  f.enabled = false;
  f.responses = [
    response("parent", [slot("shifts", "morning", 2)]),
    response("next", [slot("shifts", "morning")], "waitlisted"),
  ];
  assert.throws(
    () => mutateSignupReservation(f, { action: "cancel", signupId: "next" }, actor, now),
    /only update your own/,
  );
  const cancelled = mutateSignupReservation(
    f,
    { action: "cancel", signupId: "parent" },
    actor,
    now,
  );
  assert.equal(cancelled.form.responses[0].status, "cancelled");
  assert.equal(cancelled.form.responses[1].status, "confirmed");
});
test("an organizer can correct or cancel a waitlisted parent", () => {
  const f = form();
  f.responses = [response("parent", [slot("shifts", "morning", 3)], "waitlisted")];
  const host = { ...actor, userId: "host", isOwner: true };
  const updated = mutateSignupReservation(
    f,
    { ...input([slot("shifts", "morning")]), signupId: "parent" },
    host,
    now,
  );
  assert.equal(updated.response.userId, "parent");
  assert.equal(updated.response.status, "confirmed");
  assert.equal(
    mutateSignupReservation(f, { action: "cancel", signupId: "parent" }, host, now).form
      .responses[0].status,
    "cancelled",
  );
});
test("section units and limits persist, while old quantity limits are retained without adding headcount", () => {
  const f = form();
  const saved = sanitizeSignupForm(f);
  assert.equal(saved.sections[0].maxSelectionsPerPerson, 1);
  assert.equal(saved.sections[1].maxQuantityPerSlot, 3);
  assert.equal(saved.sections[1].unitLabel, "packs");
  delete f.settings.maxQuantityPerSlot;
  f.settings.maxGuestsPerSignup = 3;
  const legacy = sanitizeSignupForm(f);
  assert.equal(legacy.settings.maxQuantityPerSlot, 3);
  assert.equal(legacy.settings.collectGuestCount, false);
  assert.equal(createSignupBlock("times").maxSelectionsPerPerson, 1);
});
test("shift generation bounds the final shift and rejects invalid or excessive generation", () => {
  const slots = generateSignupShifts("09:00", "10:10", 30, 2);
  assert.equal(slots.length, 3);
  assert.equal(slots[2].endTime, "10:10");
  assert.equal(new Set(slots.map((s) => s.id)).size, 3);
  for (const args of [
    ["12:00", "09:00", 30, 2],
    ["09:00", "10:00", 0, 2],
    ["bad", "10:00", 30, 2],
    ["09:00", "10:00", 30, 0],
  ])
    assert.throws(() => generateSignupShifts(...args));
});
test("Field Day starter preserves current content and adds editable, persistable sections", () => {
  const f = form();
  f.settings.maxSlotsPerPerson = 2;
  const next = addFieldDayStarter(f);
  const saved = sanitizeSignupForm(next);
  assert.equal(next.sections.length, 5);
  assert.equal(saved.sections.length, 5);
  assert.deepEqual(next.sections.slice(0, 2), f.sections);
  assert.equal(next.settings.maxSlotsPerPerson, 2);
  assert.equal(next.start, f.start);
  assert.equal(next.appearance, f.appearance);
});
test("school designs are discoverable through Field Day use-case keywords", () => {
  const { getPublicTemplates } = load("src/lib/public-template-catalog.ts");
  const matches = getPublicTemplates("signup-forms").filter((t) =>
    t.keywords?.includes("field day"),
  );
  assert.ok(matches.some((t) => t.id === "editorial--school-days"));
  assert.ok(matches.every((t) => t.audience === "School & Education"));
});
test("publishing rejects invalid section limits", () => {
  const { validateSignupPublish } = load("src/lib/signup-validation.ts");
  const value = form();
  value.sections[0].maxSelectionsPerPerson = 0;
  value.sections[1].maxQuantityPerSlot = 1.5;
  assert.equal(
    validateSignupPublish(value).filter((issue) => /section limit/.test(issue.message)).length,
    2,
  );
});

test("header date range includes end time and event timezone", () => {
  const { formatSignupDateRange } = load("src/lib/signup-display.ts");
  const label = formatSignupDateRange({
    start: "2026-10-23T09:00",
    end: "2026-10-23T12:00",
    timezone: "America/Chicago",
  });
  assert.match(label, /9:00/);
  assert.match(label, /12:00/);
  assert.match(label, /CDT/);
});
test("invitation roster is owner-only and never cached publicly", async () => {
  let session = null,
    owner = "host",
    calls = 0;
  const { GET } = load("src/app/api/events/share/route.ts", {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status || 200, headers: init.headers }),
      },
    },
    "next-auth": { getServerSession: async () => session },
    "@/lib/auth": { authOptions: {} },
    "@/lib/db": {
      getUserIdByEmail: async () => "host",
      getEventHistoryById: async () => ({ user_id: owner }),
      listShareRecipientsForEvent: async () => {
        calls++;
        return [{ email: "parent@example.test", status: "accepted" }];
      },
    },
    "@/lib/email": {},
    "@/lib/absolute-url": {},
    "@/lib/dashboard-cache": {},
    "@/lib/history-cache": {},
  });
  const request = { nextUrl: new URL("http://localhost/api/events/share?eventId=field-day") };
  assert.equal((await GET(request)).status, 401);
  session = { user: { email: "host@example.test" } };
  owner = "another-owner";
  assert.equal((await GET(request)).status, 403);
  assert.equal(calls, 0);
  owner = "host";
  const result = await GET(request);
  assert.equal(result.status, 200);
  assert.equal(result.body.recipients.length, 1);
  assert.equal(result.headers["Cache-Control"], "private, no-store");
});
