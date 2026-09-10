import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET as downloadIcs } from "../app/api/ics/route.ts";
import { POST as downloadBulkIcs } from "../app/api/events/ics/bulk/route.ts";
import { buildCalendarLinks } from "../utils/calendar-links.ts";
import { buildAutoCalendarEvent } from "./calendar-auto-sync.ts";
import { buildCalendarDescription } from "./calendar-description.ts";
import { toGoogleEvent, toIcsFields, toMicrosoftEvent } from "./mappers.ts";

// Same flattened phone/fax + identity + appointment-table shape as the reported regression.
const transcript =
  "Phone: (727) 555-0100 Fax: (727) 555-0101 SAM EXAMPLE DOB: 06/18/1988 Age: 38 Patient ID: 1234567 Date Time Appointment Dept./Address Phone 11/18/2026 01:45 PM Dermatology Consultation Example Skin Center (727) 555-0100 DR. ALEX EXAMPLE, MD 123 MAIN ST DOB: 06/18/1988 | Provider: ALEX EXAMPLE";
const eventUrl = "https://envitefy.com/event/sam-dermatology-appointment";
const data = {
  title: "Sam dermatology appointment",
  category: "Medical Appointments",
  start: "2026-11-18T13:45:00-06:00",
  end: "2026-11-18T14:45:00-06:00",
  timezone: "America/Chicago",
  allDay: false,
  venue: "Example Skin Center",
  location: "123 Main St",
  description: transcript,
  ocrText: transcript,
  hostName: "Example Skin Center",
  goodToKnow: "Bring your appointment details with you.",
  ocrFacts: [
    { label: "Patient", value: "Sam Example" },
    { label: "Patient ID", value: "1234567" },
    { label: "DOB", value: "06/18/1988" },
    { label: "Appointment Provider", value: "DR. ALEX EXAMPLE, MD" },
    { label: "Host", value: "Example Skin Center" },
    { label: "Fax", value: "(727) 555-0101" },
  ],
};
const expected = [
  "Patient: Sam Example",
  "Patient ID: 1234567",
  "Clinician: DR. ALEX EXAMPLE, MD",
  "Appointment provider: Example Skin Center",
  "",
  "Contacts",
  "Phone: (727) 555-0100",
  "Fax: (727) 555-0101",
  "",
  "View on Envitefy:",
  eventUrl,
].join("\n");

function readIcsDescription(ics) {
  const line = ics
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/)
    .find((value) => value.startsWith("DESCRIPTION:"));
  return line
    ?.slice("DESCRIPTION:".length)
    .replace(/\\([nN,;\\])/g, (_, char) => (/n/i.test(char) ? "\n" : char));
}

test("automatic medical sync formats structured facts and never attaches the original", () => {
  const before = JSON.stringify(data);
  const result = buildAutoCalendarEvent({
    title: data.title,
    data,
    envitefyUrl: eventUrl,
    flyerSourceUrl: "https://envitefy.com/private/original",
    flyerPreviewUrl: "https://envitefy.com/private/thumbnail",
  });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.event.description).toBe(expected);
  expect(result.value.flyer).toBeNull();
  expect(result.value.event.attachment).toBeNull();
  expect(JSON.stringify(data)).toBe(before);
  expect(toGoogleEvent(result.value.event).description).toBe(expected);
  expect(toMicrosoftEvent(result.value.event).body).toEqual({
    contentType: "text",
    content: expected,
  });
  expect(toIcsFields(result.value.event).description).toBe(expected);
});

test("direct Google, Outlook and ICS adapters format the same medical payload", () => {
  const payload = { ...data, envitefyUrl: eventUrl };
  expect(toGoogleEvent(payload).description).toBe(expected);
  expect(toMicrosoftEvent(payload).body).toEqual({ contentType: "text", content: expected });
  expect(toIcsFields(payload).description).toBe(expected);
});

test("manual links retain appointment context through Google, Outlook and real ICS downloads", async () => {
  const links = buildCalendarLinks({
    ...data,
    startIso: data.start,
    endIso: data.end,
    reminders: [60],
    recurrence: null,
    details: data,
    eventUrl,
  });
  expect(new URL(links.google).searchParams.get("details")).toBe(expected);
  expect(new URL(links.outlook).searchParams.get("body")).toBe(expected);
  for (const link of [links.appleInline, links.appleDownload]) {
    const response = await downloadIcs(new Request(new URL(link, "https://envitefy.com")));
    expect(response.status).toBe(200);
    expect(readIcsDescription(await response.text())).toBe(expected);
  }
});

test("bulk ICS export uses the same formatter and preserves paragraph escapes", async () => {
  const response = await downloadBulkIcs(
    new NextRequest("https://envitefy.com/api/events/ics/bulk", {
      method: "POST",
      body: JSON.stringify({ events: [{ ...data, envitefyUrl: eventUrl }] }),
      headers: { "Content-Type": "application/json" },
    }),
  );
  expect(response.status).toBe(200);
  expect(readIcsDescription(await response.text())).toBe(expected);
});

test("a footer from an older raw sync cannot bypass medical cleanup", () => {
  const description = `${transcript}\n\nView on Envitefy:\n${eventUrl}`;
  expect(buildCalendarDescription({ ...data, description })).toBe(expected);
  expect(buildCalendarDescription({ ...data, description: expected })).toBe(expected);
  expect(buildCalendarDescription({ title: data.title, description: expected })).toBe(expected);
});

test("legacy exports without category still remove the transcript and recover labelled contacts", () => {
  const legacy = { ...data, category: undefined, ocrText: undefined };
  expect(buildCalendarDescription(legacy, { envitefyUrl: eventUrl })).toBe(expected);
});

test("a flattened medical record without DOB or table headers still uses its individual facts", () => {
  const description = "Sam Example Patient ID: 1234567 DR. ALEX EXAMPLE, MD Example Skin Center";
  const formatted = buildCalendarDescription(
    { ...data, description, ocrText: "" },
    { envitefyUrl: eventUrl },
  );
  expect(formatted).not.toContain(description);
  expect(formatted).toContain(
    "Patient: Sam Example\nPatient ID: 1234567\nClinician: DR. ALEX EXAMPLE, MD",
  );
});

test("DOB embedded in an extra fact is excluded and identical phone/fax values stay distinct", () => {
  const formatted = buildCalendarDescription(
    {
      ...data,
      ocrFacts: [
        ...data.ocrFacts,
        { label: "Phone", value: "(727) 555-0101" },
        { label: "Details", value: "DOB: 06/18/1988" },
      ],
    },
    { envitefyUrl: eventUrl },
  );
  expect(formatted).toContain("Phone: (727) 555-0101\nFax: (727) 555-0101");
  expect(formatted).not.toContain("DOB");
  expect(formatted).not.toContain("06/18/1988");
});

test("source text copied into notes is omitted while authored paragraphs survive", () => {
  const description = buildCalendarDescription(
    {
      ...data,
      notes: `${transcript}\n\nBring the referral.\n\nArrive ten minutes early.`,
    },
    { envitefyUrl: eventUrl },
  );
  expect(description).toBe(
    expected.replace(
      "\n\nView on Envitefy:",
      "\n\nNotes\nBring the referral.\n\nArrive ten minutes early.\n\nView on Envitefy:",
    ),
  );
});

test("authored rich text, RSVP, notes and links remain readable and idempotent", () => {
  const event = {
    title: "Community dinner",
    start: data.start,
    end: data.end,
    timezone: data.timezone,
    description:
      "<p>Welcome, friends &amp; neighbors.</p><p>Bring a dish.<br>Doors open at six.</p>",
    rsvp: { email: "rsvp@example.com" },
    notes: "First paragraph.\n\nSecond paragraph.",
    registries: [{ label: "Wish list", url: "https://example.com/gifts" }],
  };
  const formatted = buildCalendarDescription(event, { envitefyUrl: eventUrl });
  expect(formatted).toContain("Welcome, friends & neighbors.\n\nBring a dish.\nDoors open at six.");
  expect(formatted).toContain(
    "RSVP\nRSVP: rsvp@example.com\n\nNotes\nFirst paragraph.\n\nSecond paragraph.",
  );
  expect(formatted).toContain("Links\nWish list: https://example.com/gifts");
  expect(buildCalendarDescription({ ...event, description: formatted })).toBe(formatted);
  expect(toMicrosoftEvent({ ...event, description: formatted }).body.contentType).toBe("text");
});
