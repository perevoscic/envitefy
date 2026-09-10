import assert from "node:assert/strict";
import test from "node:test";
import { compactCalendarDescription } from "./calendar-description.ts";

const appointment = {
  title: "Sam's ENT appointment",
  start: "2026-11-02T14:10:00.000Z",
  end: "2026-11-02T15:10:00.000Z",
  timezone: "America/Chicago",
  location: "123 Main St, Suite 301",
};

test("appointment descriptions keep useful extras without repeating calendar fields", () => {
  const description = [
    "Event details",
    "Event: Sam's ENT appointment",
    "Date: Monday, November 2, 2026",
    "Starts: 8:10 AM CST",
    "Ends: 9:10 AM CST",
    "Category: Medical Appointments",
    "Location: 123 MAIN ST, SUITE 301",
    "Appointment provider: Example Clinic",
    "Patient: Sam Example",
    "Patient ID: 123456",
    "Clinician: Dr. Example",
    "",
    "Contacts",
    "Phone: (555) 555-0100",
    "Fax: (555) 555-0101",
    "",
    "Notes",
    "Bring your referral and arrive 15 minutes early.",
    "",
    "View on Envitefy:",
    "https://envitefy.com/event/example-appointment",
  ].join("\n");

  const cleaned = compactCalendarDescription({ ...appointment, description });
  assert.equal(cleaned, description.slice(description.indexOf("Appointment provider:")));
  assert.equal(compactCalendarDescription({ ...appointment, description: cleaned }), cleaned);
});

test("secondary times, locations, deadlines, and prose remain intact", () => {
  const description = [
    "Sam's ENT appointment includes a hearing test.",
    "Check-in: 7:55 AM CST",
    "RSVP by: November 1, 2026",
    "",
    "Follow-up",
    "Event: Hearing test",
    "Date: November 3, 2026",
    "Starts: 10:00 AM CST",
    "Location: 456 Oak Ave",
    "",
    "Notes",
    "Parking: Use the north entrance at 123 Main St, Suite 301.",
  ].join("\n");
  assert.equal(compactCalendarDescription({ ...appointment, description }), description);
});

test("all-day dates and markdown field labels are cleaned without dropping notes about time", () => {
  assert.equal(
    compactCalendarDescription({
      title: "School fair",
      start: "2026-10-03",
      end: "2026-10-04",
      allDay: true,
      timezone: "America/Los_Angeles",
      description:
        "## Event details\n**Event:** School fair\n- Date: October 3, 2026\nStarts: Gates open at noon\n\nNotes\nBring cash.",
    }),
    "Starts: Gates open at noon\n\nNotes\nBring cash.",
  );
});

test("empty headings disappear and unavailable fields do not cause details to be discarded", () => {
  assert.equal(
    compactCalendarDescription({
      ...appointment,
      description:
        "Event details\nDate: 11/2/2026\n\nNotes\n\nContacts\n\nView on Envitefy:\nhttps://envitefy.com/event/example",
    }),
    "View on Envitefy:\nhttps://envitefy.com/event/example",
  );
  const description =
    "Date: November 2, 2026\nLocation: Example Clinic\nNotes\nBring your referral.";
  assert.equal(
    compactCalendarDescription({ title: "Appointment", start: "", description }),
    description,
  );
});
