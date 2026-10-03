import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { parseEventWeatherTarget } from "../../../../lib/event-weather.ts";
import { isEventDraft } from "../../../../lib/event-draft-access.ts";

const id = "11111111-1111-4111-8111-111111111111";
const details = {
  weather: { enabled: true, units: "f" },
  date: "2026-10-05",
  time: "09:30",
  location: "Panama City Beach",
  venue: "Camp Helen",
};
function harness({ userId = null, data = {}, canEdit = false, recipient = false } = {}) {
  const calls = [];
  const refreshOptions = [];
  const mocks = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "next-auth": { getServerSession: async () => ({}) },
    cookie: {
      parse: (value) =>
        Object.fromEntries(
          value
            .split(";")
            .filter(Boolean)
            .map((entry) => entry.trim().split("=")),
        ),
    },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/db": {
      getEventHistoryById: async () => ({
        id,
        user_id: "owner",
        data: { customEventPage: { details }, ...data },
      }),
      isEventSharedWithUser: async () => recipient,
    },
    "@/lib/event-collaboration": { getEventPermissions: async () => ({ canEdit }) },
    "@/lib/event-draft-access": { isEventDraft },
    "@/lib/event-access": {
      getEventAccessCookieName: () => "event_access",
      verifyEventAccessCookieValue: (cookie) => cookie === "valid",
    },
    "@/lib/event-custom-design": { normalizeCustomEventPage: (value) => value },
    "@/lib/event-weather": { parseEventWeatherTarget },
    "@/lib/event-weather-server": {
      getEventWeather: async (target, options) => {
        calls.push(target);
        refreshOptions.push(options);
        return { status: "available", ...target };
      },
    },
  };
  const code = ts.transpileModule(readFileSync("src/app/api/events/weather/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      if (!(name in mocks)) throw new Error(name);
      return mocks[name];
    },
    module,
    module.exports,
  );
  return {
    calls,
    refreshOptions,
    send: (body, headers = {}) =>
      module.exports.POST(
        new Request("http://localhost/api/events/weather", {
          method: "POST",
          headers: { "content-type": "application/json", ...headers },
          body: JSON.stringify(body),
        }),
      ),
  };
}

test("anonymous visitors can only request enabled, published event weather using saved facts", async () => {
  const h = harness({
    data: { customEventPageDraft: { details: { ...details, location: "Private new location" } } },
  });
  const response = await h.send({
    eventId: id,
    location: "Injected location",
    date: "2030-01-01",
    time: "00:00",
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(h.calls, [
    { location: details.location, date: details.date, time: details.time },
  ]);
  assert.equal((await h.send({ location: "Paris", date: "2026-10-05", time: "" })).status, 401);
  const disabled = harness({
    data: { customEventPage: { details: { ...details, weather: { enabled: false, units: "f" } } } },
  });
  assert.equal((await disabled.send({ eventId: id })).status, 404);
  assert.deepEqual(disabled.calls, []);
});

test("manual refresh uses saved event facts and preserves the same access restrictions", async () => {
  const h = harness();
  assert.equal((await h.send({ eventId: id, refresh: true, location: "Injected" })).status, 200);
  assert.deepEqual(h.calls, [{ location: details.location, date: details.date, time: details.time }]);
  assert.deepEqual(h.refreshOptions, [{ refresh: true }]);
  assert.equal((await h.send({ eventId: id, refresh: "yes" })).status, 400);
  const locked = harness({ data: { accessControl: { requirePasscode: true, passcodeHash: "hashed" } } });
  assert.equal((await locked.send({ eventId: id, refresh: true })).status, 403);
  assert.deepEqual(locked.calls, []);
  const preview = harness({ userId: "host" });
  assert.equal((await preview.send({ location: "Paris", date: "2026-10-05", time: "", refresh: true })).status, 200);
  assert.deepEqual(preview.refreshOptions, [{ refresh: true }]);
});

test("draft and passcode restrictions are checked before weather lookup", async () => {
  const draft = harness({ data: { status: "draft" } });
  assert.equal((await draft.send({ eventId: id })).status, 404);
  assert.deepEqual(draft.calls, []);
  const cohost = harness({ userId: "cohost", canEdit: true, data: { status: "draft" } });
  assert.equal((await cohost.send({ eventId: id })).status, 200);
  const data = { accessControl: { requirePasscode: true, passcodeHash: "hashed" } };
  const locked = harness({ data });
  assert.equal((await locked.send({ eventId: id })).status, 403);
  assert.deepEqual(locked.calls, []);
  assert.equal((await locked.send({ eventId: id }, { cookie: "event_access=valid" })).status, 200);
  assert.equal(
    (await harness({ data, userId: "recipient", recipient: true }).send({ eventId: id })).status,
    200,
  );
});

test("authenticated editor previews use in-memory facts and reject malformed or cross-site requests", async () => {
  const h = harness({ userId: "host" });
  assert.equal(
    (await h.send({ location: "Tokyo", date: "2026-10-05", time: "15:00" })).status,
    200,
  );
  assert.deepEqual(h.calls, [{ location: "Tokyo", date: "2026-10-05", time: "15:00" }]);
  assert.equal((await h.send({ location: "Tokyo", date: "2026-02-30", time: "" })).status, 400);
  assert.equal((await h.send({ eventId: "invalid" })).status, 404);
  assert.equal((await h.send({ eventId: id }, { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal((await h.send({ location: "x".repeat(5000), date: "", time: "" })).status, 413);
  assert.equal(h.calls.length, 1);
});
