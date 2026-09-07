import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as data from "./dashboard-data.ts";
import * as overview from "./dashboard-overview.ts";
import * as ownerRsvp from "./owner-rsvp-dashboard.ts";

function load(query) {
  const { outputText } = ts.transpileModule(readFileSync(new URL("./dashboard-overview-query.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)((name) => {
    if (name === "@/lib/db") return { query };
    if (name === "@/lib/dashboard-data") return data;
    if (name === "@/lib/dashboard-overview") return overview;
    if (name === "@/lib/owner-rsvp-dashboard") return ownerRsvp;
    if (name === "@/utils/event-edit-route") return { buildEditLink: (id) => `/edit/${id}` };
    throw new Error(name);
  }, module, module.exports);
  return module.exports.loadDashboardOverview;
}
const event = (id, ownership = "owned") => data.toDashboardEvent({ id, title: id, data: { startAt: "2030-01-01T12:00:00Z", ownership } });

test("overview scopes host details to the owner and keeps undated drafts and actual shared reply counts", async () => {
  const seen = [];
  const loadOverview = load(async (sql, values) => {
    seen.push({ sql, values });
    if (sql.includes("count(*) over()")) return { rows: [{ id: "draft", title: "Unfinished", data: { status: "draft" }, created_at: null, total: "1" }] };
    if (sql.includes("to_regclass")) return { rows: [{ available: "signup_forms" }] };
    assert.equal(values[0], "owner");
    assert.deepEqual(values[1], ["owned"]);
    assert.match(sql, /user_id = \$1/);
    if (sql.includes("count(r.id)")) return { rows: [{ event_id: "owned", going: "4", maybe: "1", declined: "2" }] };
    if (sql.includes("count(distinct")) return { rows: [{ event_id: "owned", awaiting: "3" }] };
    if (sql.includes(" as form from")) return { rows: [{ id: "owned", title: "School", form: { enabled: true, sections: [{ id: "s", title: "Helpers", slots: [{ id: "one", capacity: 2 }] }], responses: [{ status: "confirmed", slots: [{ sectionId: "s", slotId: "one", quantity: 1 }] }] } }] };
    return { rows: [{ id: "owned", title: "School", data: { ownership: "owned", rsvpEnabled: true, numberOfGuests: 100 }, created_at: null }] };
  });
  const result = await loadOverview("owner", [event("owned"), event("invited", "invited")]);
  assert.equal(result.guests[0].awaitingShared, 3, "a target of 100 is not a guest list");
  assert.equal(result.guests[0].going, 4);
  assert.equal(result.drafts.items[0].startAt, null);
  assert.equal(result.drafts.items[0].href, "/edit/draft");
  assert.equal(result.signups[0].remaining, 1);
  assert.equal(result.editLinks.invited, undefined);
  assert.deepEqual(result.unavailable, []);
  assert.ok(seen.some(({ sql }) => sql.includes("left join signup_forms")));
});

test("optional data failures preserve attention and conflicts and identify unavailable panels", async () => {
  const loadOverview = load(async (sql) => {
    if (sql.includes("count(*) over()")) throw new Error("draft timeout");
    if (sql.includes("count(r.id)")) throw new Error("responses offline");
    if (sql.includes("to_regclass")) throw new Error("signups offline");
    return { rows: [{ id: "owned", title: "School", data: { rsvpEnabled: true }, created_at: null }] };
  });
  const result = await loadOverview("owner", [event("owned")]);
  assert.deepEqual(result.unavailable, ["drafts", "guest responses", "sign-up progress"]);
  assert.equal(result.attention[0].kind, "venue");
});

test("invited-only accounts never load private host response or sign-up data", async () => {
  const calls = [];
  const result = await load(async (sql, values) => { calls.push({ sql, values }); return { rows: [] }; })("viewer", [event("invite", "invited")]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /lower\(data->>'status'\) = 'draft'/);
  assert.deepEqual(result.guests, []);
  assert.deepEqual(result.signups, []);
});
