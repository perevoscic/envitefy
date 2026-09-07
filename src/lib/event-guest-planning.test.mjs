import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
const source = readFileSync(new URL("./event-guest-planning.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { normalizeEventGuestPlanning, getEventGuestPlanningFields, getEventGuestPlanningNotes, getEventEndLocal, eventLocalDateParts, resolvePublicEventShareUrl } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("planning rejects malformed fields and hides blank guidance", () => {
  assert.deepEqual(normalizeEventGuestPlanning(null), {});
  assert.deepEqual(normalizeEventGuestPlanning(["parking"]), {});
  assert.deepEqual(normalizeEventGuestPlanning({ parking: " North entrance ", dietary: false, arrival: "  ", invented: "no" }), { parking: "North entrance" });
  assert.deepEqual(getEventGuestPlanningNotes({}), []);
  assert.equal(getEventGuestPlanningNotes({ accessibility: "Step-free entry" })[0].value, "Step-free entry");
});
test("guidance is tailored to weddings, appointments, and sports", () => {
  assert.ok(getEventGuestPlanningFields("weddings").some(f => f.key === "accommodation"));
  assert.ok(!getEventGuestPlanningFields("appointments").some(f => f.key === "guestPolicy" || f.key === "dietary"));
  assert.equal(getEventGuestPlanningFields("soccer").find(f => f.key === "guestPolicy").label, "Spectators & accompanying guests");
});
test("explicit end validates order without assuming duration or overnight rollover", () => {
  assert.equal(getEventEndLocal("2026-11-07", "14:00", ""), undefined);
  assert.equal(getEventEndLocal("2026-11-07", "14:00", "13:00"), undefined);
  assert.equal(getEventEndLocal("2026-11-07", "14:00", "16:30"), "2026-11-07T16:30");
  assert.equal(getEventEndLocal("2026-11-07", "20:00", "09:00", "2026-11-08"), "2026-11-08T09:00");
  assert.deepEqual(eventLocalDateParts(new Date(2026, 10, 7, 14, 30).toISOString()), { date: "2026-11-07", time: "14:30" });
});
test("sharing only produces public links and never shares drafts or template catalogs", () => {
  const origin = "https://envitefy.com";
  assert.equal(resolvePublicEventShareUrl({ origin, preview: true, eventId: "saved-id", shareUrl: "/event/saved-id" }), "");
  for (const shareUrl of ["/event/weddings/customize", "/event/weddings", "javascript:alert(1)", "/admin/users"]) {
    assert.equal(resolvePublicEventShareUrl({ origin, shareUrl }), "");
  }
  assert.equal(resolvePublicEventShareUrl({ origin, eventId: "preview" }), "");
  assert.equal(resolvePublicEventShareUrl({ origin, eventId: "saved-id" }), `${origin}/event/saved-id`);
  assert.equal(resolvePublicEventShareUrl({ origin, shareUrl: "/smart-signup-form/community-day" }), `${origin}/smart-signup-form/community-day`);
});
