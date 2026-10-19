import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, test } from "bun:test";
import { GET as calendarIcs } from "../../app/api/ics/route";
import { buildCalendarLinks } from "../../utils/calendar-links";
import { buildGymnasticsEventDateTimes, gymnasticsDateParts, hydrateGymnasticsEventDates } from "../gymnastics-event-dates";
import { extractPdfTextWithPdfJs } from "../pdf-raster";
import { __testUtils, mapParseResultToGymData } from "./core";
import { resolveDiscoveryVenueTimezone } from "./venue-timezone";

const fetchBefore = globalThis.fetch;
let tokenBefore: string | undefined;
let browserZoneBefore: string | undefined;
beforeEach(() => {
  tokenBefore = process.env.MAPBOX_ACCESS_TOKEN;
  browserZoneBefore = process.env.TZ;
  process.env.MAPBOX_ACCESS_TOKEN = "offline-fixture-token";
  process.env.TZ = "America/Chicago";
  globalThis.fetch = (async () => { throw new Error("Unexpected provider call in offline test"); }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = fetchBefore;
  if (tokenBefore === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
  else process.env.MAPBOX_ACCESS_TOKEN = tokenBefore;
  if (browserZoneBefore === undefined) delete process.env.TZ;
  else process.env.TZ = browserZoneBefore;
});

const packets = [
  { file: "2026wgaspparentinfo.pdf", title: "Gasparilla Classic", label: "March 6-8, 2026", start: "2026-03-06", end: "2026-03-08", exclusiveEnd: "2026-03-09", venue: "Tampa Convention Center", address: "333 S Franklin St, Tampa, FL 33602", street: "333 S Franklin St", city: "Tampa", zip: "33602", latitude: 27.9423, longitude: -82.4537 },
  { file: "Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf", title: "Florida Xcel State Championships", label: "April 10 - 12, 2026", start: "2026-04-10", end: "2026-04-12", exclusiveEnd: "2026-04-13", venue: "Alachua County Sports & Events Center", address: "4870 Celebration Pointe Ave, Gainesville, FL 32608", street: "4870 Celebration Pointe Ave", city: "Gainesville", zip: "32608", latitude: 29.6248, longitude: -82.3977 },
];

for (const packet of packets) test(`${packet.title}: actual packet date range survives map, preview, save/reload and guest calendars`, async () => {
  const source = await extractPdfTextWithPdfJs(await readFile(`docs/${packet.file}`));
  assert.ok(source.text.includes(packet.city));
  const range = __testUtils.deriveDateRangeFromText(packet.label);
  assert.equal(range.startDate, packet.start);
  assert.equal(range.endDate, packet.end);
  assert.ok(source.text.includes(packet.label));
  let requests = 0;
  globalThis.fetch = (async (input) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.mapbox.com");
    assert.equal(url.searchParams.get("q"), packet.address);
    assert.equal(url.searchParams.get("permanent"), "true");
    requests++;
    return Response.json({ features: [{ properties: {
      feature_type: "address", mapbox_id: `fixture-${packet.city}`, name: packet.street,
      full_address: packet.address, coordinates: { latitude: packet.latitude, longitude: packet.longitude, accuracy: "rooftop" },
      context: { place: { name: packet.city }, region: { name: "Florida", region_code: "FL" }, country: { country_code: "US" }, address: { address_number: packet.street.split(" ")[0] } },
      match_code: { address_number: "matched", street: "matched", place: "matched", confidence: "exact" },
    } }] });
  }) as typeof fetch;
  const parsed = __testUtils.normalizeParseResult({ eventType: "gymnastics_meet", title: packet.title,
    dates: packet.label, startAt: packet.start, endAt: packet.end, timezone: null,
    venue: packet.venue, address: packet.address, meetDetails: { doorsOpen: "7:00am each day" } });
  assert.ok(parsed);
  assert.equal(parsed.startAt, packet.start, "date-only input never gains a clock");
  assert.equal(parsed.endAt, packet.end);
  const mapped = await mapParseResultToGymData(parsed, {
    timezone: "America/Chicago", discoverySource: { extractedText: source.text },
  }, {} as any);
  assert.equal(requests, 1);
  assert.equal(mapped.timezone, "America/New_York", "both fixtures resolve through geographic boundaries");
  assert.equal(mapped.date, packet.start);
  assert.equal(mapped.endDate, packet.end);
  assert.equal(mapped.time, "", "doors-open guidance must not invent a meet-wide session clock");
  assert.equal(mapped.endTime, "");
  const preview = buildGymnasticsEventDateTimes(mapped);
  assert.deepEqual(preview, { startISO: packet.start, endISO: packet.exclusiveEnd, allDay: true });
  const reloaded = hydrateGymnasticsEventDates(JSON.parse(JSON.stringify({ ...mapped, ...preview })));
  assert.deepEqual(reloaded, { date: packet.start, time: "", endDate: packet.end, endTime: "" });
  const links = buildCalendarLinks({ title: packet.title, description: "", location: packet.address,
    startIso: preview.startISO!, endIso: preview.endISO, allDay: true, timezone: mapped.timezone,
    reminders: null, recurrence: null });
  assert.equal(new URL(links.google).searchParams.get("dates"), `${packet.start.replaceAll("-", "")}/${packet.exclusiveEnd.replaceAll("-", "")}`);
  const ics = await (await calendarIcs(new Request(new URL(links.appleDownload, "https://envitefy.test")))).text();
  assert.ok(ics.includes(`DTSTART;VALUE=DATE:${packet.start.replaceAll("-", "")}`));
  assert.ok(ics.includes(`DTEND;VALUE=DATE:${packet.exclusiveEnd.replaceAll("-", "")}`));
});

test("timed multi-day events and explicit midnight retain the chosen venue zone across DST", async () => {
  for (const data of [
    { date: "2027-01-16", time: "08:00", endDate: "2027-01-17", endTime: "17:00", timezone: "America/Los_Angeles", expectedStart: "2027-01-16T16:00:00.000Z", expectedEnd: "2027-01-18T01:00:00.000Z" },
    { date: "2026-03-07", time: "08:00", endDate: "2026-03-08", endTime: "08:00", timezone: "America/New_York", expectedStart: "2026-03-07T13:00:00.000Z", expectedEnd: "2026-03-08T12:00:00.000Z" },
    { date: "2026-11-01", time: "00:00", endDate: "2026-11-01", endTime: "03:00", timezone: "America/New_York", expectedStart: "2026-11-01T04:00:00.000Z", expectedEnd: "2026-11-01T08:00:00.000Z" },
  ]) {
    const instant = buildGymnasticsEventDateTimes(data);
    assert.equal(instant.startISO, data.expectedStart);
    assert.equal(instant.endISO, data.expectedEnd);
    assert.equal(instant.allDay, false);
    assert.deepEqual(gymnasticsDateParts(instant.startISO, data.timezone), { date: data.date, time: data.time });
    const parsed = __testUtils.normalizeParseResult({ title: "Timed meet", dates: "", startAt: `${data.date}T${data.time}`, endAt: `${data.endDate}T${data.endTime}`, timezone: data.timezone });
    assert.ok(parsed);
    const mapped = await mapParseResultToGymData(parsed);
    assert.equal(mapped.time, data.time);
    assert.equal(mapped.endTime, data.endTime);
    assert.equal(mapped.startISO, data.expectedStart);
    assert.equal(mapped.endISO, data.expectedEnd);
  }
});

test("missing, ambiguous, failed venue lookup cannot inherit the parent's zone", async () => {
  assert.equal(await resolveDiscoveryVenueTimezone(null, "A gym somewhere in Florida"), null);
  globalThis.fetch = (async () => Response.json({ features: [] })) as typeof fetch;
  assert.equal(await resolveDiscoveryVenueTimezone(null, packets[0].address), null);
  globalThis.fetch = (async () => { throw new Error("provider offline"); }) as typeof fetch;
  assert.equal(await resolveDiscoveryVenueTimezone(null, packets[0].address), null);
  assert.equal(buildGymnasticsEventDateTimes({ date: "2026-03-06", time: "08:00" }).startISO, null);
  const timedWithoutZone = await mapParseResultToGymData(__testUtils.normalizeParseResult({ startAt: "2026-03-06T08:00-05:00", endAt: "2026-03-08T17:00-04:00" })!);
  assert.equal(timedWithoutZone.time, "08:00");
  assert.equal(timedWithoutZone.endTime, "17:00");
  assert.equal(timedWithoutZone.allDay, false);
  assert.equal(timedWithoutZone.startISO, null, "the missing zone stays unresolved instead of inventing a timed instant");
  assert.equal(buildGymnasticsEventDateTimes({ date: "2026-03-08", time: "02:30", timezone: "America/New_York" }).startISO, null);
});

test("hydration honors manual fields and only reverses versioned exclusive date ends", () => {
  const manual = { date: "2026-04-09", time: "00:00", endDate: "2026-04-14", endTime: "18:00", timezone: "America/Chicago", startISO: "2026-04-10", endISO: "2026-04-13", allDay: true };
  assert.deepEqual(hydrateGymnasticsEventDates(manual), { date: manual.date, time: manual.time, endDate: manual.endDate, endTime: manual.endTime });
  assert.equal(hydrateGymnasticsEventDates({ allDay: true, endISO: "2026-03-08" }).endDate, "2026-03-08");
  assert.equal(hydrateGymnasticsEventDates({ allDay: true, endISO: "2026-03-09", gymnasticsDateVersion: 1 }).endDate, "2026-03-08");
  assert.deepEqual(hydrateGymnasticsEventDates({ date: "", time: "", endDate: "", endTime: "", startISO: "2026-03-06T13:00:00Z", endISO: "2026-03-09T13:00:00Z" }), { date: "", time: "", endDate: "", endTime: "" });
});

test("parser keeps local clocks independent of the browser and rejects invalid local dates", () => {
  for (const value of ["2026-02-30", "2026-03-06T25:00", "2026-02-30T08:00Z"])
    assert.equal(__testUtils.normalizeParseResult({ startAt: value })?.startAt, null);
  assert.equal(__testUtils.normalizeParseResult({ startAt: "2026-03-06T08:00" })?.startAt, "2026-03-06T08:00");
});
