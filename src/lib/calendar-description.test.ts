import assert from "node:assert/strict";
import test from "node:test";
import { buildCalendarDescription } from "./calendar-description.ts";
import { buildCalendarLinks } from "../utils/calendar-links.ts";

const eventUrl = "https://envitefy.com/event/sample-appointment";
const medical = {
  title: "Maya ENT appointment",
  category: "Medical Appointments",
  startISO: "2026-11-02T08:10:00",
  timezone: "America/Chicago",
  venue: "Example ENT Clinic",
  location: "100 Example Street, Suite 301",
  hostName: "Example ENT Clinic",
  description:
    "Example ENT Clinic Phone: (212) 555-0100 Fax:(212) 555-0100 MAYA SAMPLE DOB: 05/22/2019 Patient ID: 12345 Date Time Appointment 11/02/2026 08:10 AM",
  goodToKnow: "Arrive 15 minutes early.\nBring your insurance card.",
  ocrFacts: [
    { label: "Patient", value: "MAYA SAMPLE" },
    { label: "Patient ID", value: "12345" },
    { label: "Appointment Provider", value: "JAMIE SAMPLE, PA-C" },
    { label: "Host", value: "Example ENT Clinic" },
    { label: "DOB", value: "05/22/2019" },
  ],
};

test("medical calendar bodies organize source facts and recover labelled contacts without copying the transcript", () => {
  const before = JSON.stringify(medical);
  const body = buildCalendarDescription(medical, {
    envitefyUrl: eventUrl,
    flyerUrl: "https://example.com/private-source",
  });
  for (const value of [
    "Event: Maya ENT appointment",
    "Date: Monday, November 2, 2026",
    "Starts: 8:10 AM CST",
    "Patient: MAYA SAMPLE",
    "Patient ID: 12345",
    "Clinician: JAMIE SAMPLE, PA-C",
    "Appointment provider: Example ENT Clinic",
    "Contacts\nPhone: (212) 555-0100\nFax: (212) 555-0100",
    "Notes\nArrive 15 minutes early.\nBring your insurance card.",
  ])
    assert.ok(body.includes(value), value);
  assert.equal(body.match(/Appointment provider: Example ENT Clinic/g)?.length, 1);
  assert.doesNotMatch(body, /DOB|05\/22\/2019|Date Time Appointment|Host:|private-source/);
  assert.ok(body.endsWith(`View on Envitefy:\n${eventUrl}`));
  assert.equal(JSON.stringify(medical), before);
});

test("ordinary events retain authored paragraphs and group RSVP, notes, locations, and registries", () => {
  const body = buildCalendarDescription({
    title: "Garden party",
    description: "Join us in the garden.\r\n\r\nChildren are welcome!",
    hostName: "Sam",
    rsvp: { email: "rsvp@example.com" },
    rsvpName: "Alex",
    rsvpDeadline: "October 1",
    attire: "Casual",
    activities: ["Games", "Cake"],
    ocrFacts: [
      { label: "Host", value: "Sam" },
      { label: "Parking", value: "Use the east gate" },
    ],
    additionalLocations: [{ label: "Dinner", address: "5 Example Road", time: "6 PM" }],
    registries: [{ label: "Gift list", url: "https://example.com/gifts" }],
    registryUrl: "https://example.com/gifts",
  });
  assert.ok(body.includes("About this event\nJoin us in the garden.\n\nChildren are welcome!"));
  assert.ok(body.includes("RSVP\nRSVP (Alex): rsvp@example.com\nRSVP by: October 1"));
  assert.ok(
    body.includes("Notes\nAttire: Casual\nActivities: Games, Cake\nParking: Use the east gate"),
  );
  assert.ok(body.includes("Additional locations\nDinner: 5 Example Road — 6 PM"));
  assert.equal(body.match(/https:\/\/example.com\/gifts/g)?.length, 1);
  assert.equal(body.match(/Host: Sam/g)?.length, 1);
});

test("HTML descriptions keep paragraph breaks, list items, and link destinations in text exports", () => {
  const body = buildCalendarDescription({
    title: "Class",
    description:
      '<p>Art &amp; crafts</p><ul><li>Bring paper</li><li>Bring pens</li></ul><p><a href="https://example.com/info">More information</a></p>',
  });
  assert.ok(body.includes("Art & crafts\n\n• Bring paper\n• Bring pens"));
  assert.ok(body.includes("More information (https://example.com/info)"));
  assert.doesNotMatch(body, /<p>|<li>|&amp;/);
});

test("empty optional fields do not create empty sections or guessed appointment details", () => {
  assert.equal(
    buildCalendarDescription({ title: "Untimed event" }),
    "Event details\nEvent: Untimed event\n\nSaved from Envitefy",
  );
  const body = buildCalendarDescription({
    title: "Visit",
    category: "Appointments",
    description: "Meet the architect.",
  });
  assert.ok(body.includes("Meet the architect."));
  assert.doesNotMatch(body, /Patient:|Clinician:|Contacts\n/);
  const writtenNote = buildCalendarDescription({
    ...medical,
    description: "Bring your patient ID. Arrive early.",
  });
  assert.ok(writtenNote.includes("About this event\nBring your patient ID. Arrive early."));
});

test("formatting is idempotent and bounds long descriptions while retaining the complete event URL", () => {
  const body = buildCalendarDescription(
    { title: "Long event", description: "Details ".repeat(4000) },
    { envitefyUrl: eventUrl },
  );
  assert.ok(body.length <= 12000);
  assert.ok(body.endsWith(`View on Envitefy:\n${eventUrl}`));
  assert.equal(buildCalendarDescription({ description: body }), body);
});

test("all-day dates stay on the printed date and invalid timezones cannot break a calendar action", () => {
  const body = buildCalendarDescription({
    title: "Fair",
    start: "2026-10-03",
    allDay: true,
    timezone: "Pacific/Honolulu",
  });
  assert.ok(body.includes("Date: Saturday, October 3, 2026\nTime: All day"));
  assert.doesNotThrow(() =>
    buildCalendarDescription({ title: "Meeting", start: "bad-date", timezone: "bad-zone" }),
  );
});

test("manual Google, Outlook, and ICS links receive identical structured appointment bodies", () => {
  const links = buildCalendarLinks({
    title: medical.title,
    description: medical.description,
    details: medical,
    eventUrl,
    location: medical.location,
    timezone: medical.timezone,
    startIso: "2026-11-02T14:10:00Z",
    endIso: "2026-11-02T15:10:00Z",
    allDay: false,
    reminders: [15],
    recurrence: null,
  });
  const google = new URL(links.google).searchParams.get("details");
  assert.ok(google?.includes("Clinician: JAMIE SAMPLE, PA-C"));
  assert.equal(new URL(links.outlook).searchParams.get("body"), google);
  assert.equal(
    new URL(links.appleDownload, "https://envitefy.com").searchParams.get("description"),
    google,
  );
  assert.equal(
    new URL(links.google).searchParams.get("dates"),
    "20261102T141000Z/20261102T151000Z",
  );
});
