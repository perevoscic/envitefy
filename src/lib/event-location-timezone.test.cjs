const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { applyEventLocationTimezone, eventTimezoneLocation } = load("src/lib/event-location-timezone.ts");
const { buildTemplateDraftPayload } = load("src/lib/template-draft-payload.ts");

test("event calendar instants use the location zone while retaining local fields and media", () => {
  const payload = { title: "Meet", data: { allDay: false, heroImage: "/saved.webp", numberOfGuests: 12 } };
  const result = applyEventLocationTimezone(payload, { date: "2027-01-15", time: "08:00", endDate: "2027-01-17", endTime: "17:00", timezone: "America/New_York", timezoneSource: "location", timezoneLocation: "palmetto, fl" });
  assert.equal(result.data.startISO, "2027-01-15T13:00:00.000Z");
  assert.equal(result.data.endISO, "2027-01-17T22:00:00.000Z");
  assert.equal(result.data.timezone, "America/New_York");
  assert.equal(result.data.heroImage, "/saved.webp");
  assert.equal(result.data.numberOfGuests, 12);
  assert.equal(payload.data.startISO, undefined);
  const allDay = applyEventLocationTimezone({ data: { allDay: true, startISO: "2027-01-15", endISO: "2027-01-18" } }, { date: "2027-01-15", timezone: "America/New_York" });
  assert.equal(allDay.data.endISO, "2027-01-18");
  assert.throws(() => applyEventLocationTimezone(payload, { date: "2026-03-08", time: "02:30", timezone: "America/New_York" }), /does not exist/);
  assert.throws(() => applyEventLocationTimezone(payload, { timezone: "Invalid/Zone" }), /event city or full address/);
});

test("only event geography participates in timezone lookup", () => {
  assert.deepEqual(eventTimezoneLocation({ venue: "Chicago Classic", address: "One Haben Blvd., Palmetto, FL 34221", timezone: "America/Chicago" }), { venue: "Chicago Classic", query: "One Haben Blvd., Palmetto, FL 34221", key: "one haben blvd., palmetto, fl 34221" });
  assert.equal(eventTimezoneLocation({ venue: "Chicago Classic" }).query, "");
});

test("new Event Page drafts never borrow the host's device time zone", () => {
  const snapshot = { data: { title: "Palmetto meet", date: "2027-01-15", time: "08:00", venue: "Convention center", address: "One Haben Blvd., Palmetto, FL 34221" } };
  const unresolved = buildTemplateDraftPayload(snapshot, "birthdays", "America/Chicago");
  assert.equal(unresolved.data.timezone, "");
  assert.equal(unresolved.data.startISO, null);
  const resolved = buildTemplateDraftPayload({ data: { ...snapshot.data, timezone: "America/New_York" } }, "birthdays", "America/Chicago");
  assert.equal(resolved.data.startISO, "2027-01-15T13:00:00.000Z");
});

test("preview calendar actions use the same location clock and ignore stale prepared links", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const cache = new Map(), captured = [];
  const mocks = {
    "lucide-react": new Proxy({}, { get: (_, key) => key === "__esModule" ? true : () => null }),
    "@/components/templates/TemplateEditorContext": { useTemplateEditor: () => null },
    "@/components/CalendarAction": { __esModule: true, default: props => { captured.push(props.links); return React.createElement("button", null, "Calendar"); } },
  };
  const { EventEditorCalendarContext } = load("src/components/events/EventEditorCalendarContext.tsx", mocks, cache);
  const Actions = load("src/components/event-templates/EventGuestActions.tsx", mocks, cache).default;
  const render = fields => renderToStaticMarkup(React.createElement(EventEditorCalendarContext.Provider, { value: fields }, React.createElement(Actions, { start: "2027-01-15T14:00:00.000Z", calendarLinks: { appleInline: "stale", google: "stale", outlook: "stale" } })));
  render({ date: "2027-01-15", time: "08:00", timezone: "America/New_York" });
  assert.ok(captured[0].google.includes("20270115T130000Z"));
  captured.length = 0;
  render({ date: "2027-01-15", time: "08:00", timezone: "" });
  assert.equal(captured.length, 0, "an unresolved location cannot offer a device-time calendar link");
});

test("verified geography handles split-zone states and rejects ambiguous or mismatched towns", async t => {
  const original = process.env.MAPBOX_ACCESS_TOKEN;
  process.env.MAPBOX_ACCESS_TOKEN = "offline-test";
  t.after(() => original === undefined ? delete process.env.MAPBOX_ACCESS_TOKEN : process.env.MAPBOX_ACCESS_TOKEN = original);
  let features = [];
  t.mock.method(global, "fetch", async () => Response.json({ features }));
  const addressQueries = [];
  const { resolveEventLocationTimezone } = load("src/lib/event-location-timezone-server.ts", {
    "./livecard-address-server": { searchBuilderAddress: async input => { addressQueries.push(input.query); return { location: { resolution: "verified", timezone: "America/New_York" } }; } },
  });
  const city = (name, lng, lat) => ({ properties: { name, feature_type: "place", place_formatted: "Florida, United States", context: { region: { region_code: "FL" } } }, geometry: { coordinates: [lng, lat] } });
  features = [city("Palmetto", -82.5723, 27.5214)];
  assert.equal(await resolveEventLocationTimezone("Palmetto, FL"), "America/New_York");
  features = [city("Pensacola", -87.2169, 30.4213)];
  assert.equal(await resolveEventLocationTimezone("Pensacola, FL"), "America/Chicago");
  assert.equal(await resolveEventLocationTimezone("Palmetto, FL"), null, "a nearby town is not a match");
  features = [city("Palmetto", -82.5723, 27.5214), city("Palmetto", -82.57, 27.52)];
  assert.equal(await resolveEventLocationTimezone("Palmetto, FL"), null);
  features = [{ properties: { name: "Florida", feature_type: "region" }, geometry: { coordinates: [-82, 28] } }];
  assert.equal(await resolveEventLocationTimezone("Florida"), null, "never guess a zone from a state");
  assert.equal(await resolveEventLocationTimezone("One Haben Blvd., Palmetto, FL 34221"), "America/New_York");
  assert.equal(addressQueries[0], "1 Haben Blvd., Palmetto, FL 34221");
});

test("timezone endpoint rejects unauthenticated and invalid requests before provider work", async () => {
  let authenticated = false, calls = 0;
  const { POST } = load("src/app/api/events/timezone/route.ts", {
    "@/lib/auth": { getAuthenticatedRequestUser: async () => ({ ok: authenticated, userId: "owner" }) },
    "@/lib/event-location-timezone-server": { resolveEventLocationTimezone: async () => { calls++; return "America/New_York"; } },
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
  });
  const request = body => new Request("http://localhost/api/events/timezone", { method: "POST", body: JSON.stringify(body) });
  assert.equal((await POST(request({ query: "Palmetto, FL" }))).status, 401);
  assert.equal(calls, 0);
  authenticated = true;
  assert.equal((await POST(request({ query: "x".repeat(501) }))).status, 400);
  assert.equal(calls, 0);
  assert.deepEqual(await (await POST(request({ query: "Palmetto, FL" }))).json(), { timezone: "America/New_York" });
  assert.equal(calls, 1);
});
