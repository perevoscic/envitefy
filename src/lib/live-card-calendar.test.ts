import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveCardCalendarLinks } from "./live-card-calendar.ts";

const build = (
  startTime = "3 PM",
  eventDate = "2026-09-26",
  timeZone = "America/Chicago",
  endTime = "",
) =>
  buildLiveCardCalendarLinks(
    "Livia is turning 10",
    {
      description: "Join us to celebrate Livia's 10th birthday.",
      eventDetails: { eventDate, startTime, endTime, venueName: "AMC Boulevard 10" },
    },
    timeZone,
  );

test("the reported Saturday 3 PM card exports the same instant to every calendar", () => {
  for (const time of ["3PM", "3 pm", "3:00 PM", "15:00", "15:00:00", "3 p.m."]) {
    const links = build(time);
    assert.ok(links, time);
    const google = new URL(links.google).searchParams;
    const outlook = new URL(links.outlook).searchParams;
    const apple = new URL(links.appleInline, "http://localhost").searchParams;
    assert.equal(google.get("dates"), "20260926T200000Z/20260926T220000Z", time);
    assert.equal(google.get("ctz"), "America/Chicago");
    assert.equal(outlook.get("startdt"), "2026-09-26T20:00:00.000Z");
    assert.equal(outlook.get("enddt"), "2026-09-26T22:00:00.000Z");
    assert.equal(apple.get("start"), outlook.get("startdt"));
    assert.equal(apple.get("end"), outlook.get("enddt"));
    assert.equal(apple.get("floating"), "0");
    assert.equal(apple.get("allDay"), "false");
    assert.equal(google.get("location"), "AMC Boulevard 10");
    assert.equal(google.get("text"), "Livia is turning 10");
  }
});

test("unzoned card times use the viewer's zone and the offset on the event date", () => {
  for (const [zone, date, expected] of [
    ["America/Chicago", "2026-09-26", "20260926T200000Z"],
    ["America/Chicago", "2026-12-26", "20261226T210000Z"],
    ["America/New_York", "2026-09-26", "20260926T190000Z"],
    ["America/Los_Angeles", "2026-09-26", "20260926T220000Z"],
    ["Asia/Kolkata", "2026-09-26", "20260926T093000Z"],
    ["Pacific/Auckland", "2026-09-26", "20260926T030000Z"],
  ]) {
    const links = build("3 PM", date, zone);
    assert.ok(links);
    assert.equal(new URL(links.google).searchParams.get("dates")?.split("/")[0], expected, zone);
  }
});

test("noon and midnight are distinct and do not move to the previous local day", () => {
  for (const [time, expected] of [
    ["12 AM", "20260926T050000Z"],
    ["midnight", "20260926T050000Z"],
    ["12 PM", "20260926T170000Z"],
    ["noon", "20260926T170000Z"],
  ]) {
    const links = build(time);
    assert.ok(links);
    assert.equal(new URL(links.google).searchParams.get("dates")?.split("/")[0], expected);
  }
});

test("explicit end times and natural clock ranges preserve duration, including overnight", () => {
  for (const [start, end, expected] of [
    ["3 PM", "4:30 PM", "20260926T200000Z/20260926T213000Z"],
    ["3 to 5 pm", "", "20260926T200000Z/20260926T220000Z"],
    ["3:00 PM – 4:30 PM", "", "20260926T200000Z/20260926T213000Z"],
    ["11 PM", "1 AM", "20260927T040000Z/20260927T060000Z"],
  ]) {
    const links = build(start, "2026-09-26", "America/Chicago", end);
    assert.ok(links);
    assert.equal(new URL(links.google).searchParams.get("dates"), expected);
  }
});

test("invalid, missing, or nonexistent local times cannot become midnight calendar events", () => {
  for (const time of ["", "TBD", "25:00", "15:70", "0 PM", "13 PM"]) {
    assert.equal(build(time), null, time);
  }
  assert.equal(build("3 PM", "2026-02-30"), null);
  assert.equal(build("2:30 AM", "2026-03-08"), null);
  assert.equal(
    buildLiveCardCalendarLinks(
      "Event",
      { eventDetails: { eventDate: "2026-09-26", startTime: "3 PM" } },
      null,
    ),
    null,
  );
});

test("an explicitly zoned preview keeps its actual instants when viewed from another zone", () => {
  const links = buildLiveCardCalendarLinks(
    "Event",
    {
      eventDetails: {
        eventDate: "2026-09-26",
        startTime: "20:30",
        calendarStartISO: "2026-09-27T01:30:00.000Z",
        calendarEndISO: "2026-09-27T03:00:00.000Z",
      },
    },
    "America/Los_Angeles",
  );
  assert.ok(links);
  assert.equal(
    new URL(links.google).searchParams.get("dates"),
    "20260927T013000Z/20260927T030000Z",
  );
  assert.equal(new URL(links.google).searchParams.get("ctz"), "America/Los_Angeles");
});
