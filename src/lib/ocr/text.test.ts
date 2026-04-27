import test from "node:test";
import assert from "node:assert/strict";
import {
  detectCategory,
  extractRsvpDetails,
  inferTimezoneFromAddress,
  pickTitle,
  splitVenueFromAddress,
} from "./text.ts";

test("pickTitle prefers event-like lines over dates", () => {
  const lines = ["Saturday", "Gemma's 7th Birthday Party", "April 12 at 2 PM"];
  const title = pickTitle(lines, lines.join("\n"));
  assert.match(title, /Birthday Party/i);
  assert.doesNotMatch(title, /^Event from flyer$/i);
});

test("inferTimezoneFromAddress detects central and pacific hints", () => {
  assert.equal(inferTimezoneFromAddress("Austin, Texas"), "America/Chicago");
  assert.equal(inferTimezoneFromAddress("San Diego, California"), "America/Los_Angeles");
});

test("splitVenueFromAddress keeps venue separate from street address", () => {
  const split = splitVenueFromAddress(
    "US Gold Gymnastics, 123 Main St, Springfield, IL 62704",
    "",
    "",
  );
  assert.equal(split.venue, "US Gold Gymnastics");
  assert.equal(split.address, "123 Main St, Springfield, IL 62704");
});

test("detectCategory recognizes medical and sports text", () => {
  assert.equal(detectCategory("Dental cleaning appointment with Sacred Heart"), "Doctor Appointments");
  assert.equal(detectCategory("Volleyball practice schedule Monday 4:30"), "Sport Events");
});

test("detectCategory recognizes expanded invite categories", () => {
  assert.equal(detectCategory("Join us for Ava's Baby Shower brunch"), "Baby Showers");
  assert.equal(detectCategory("Olivia's Bridal Shower at Magnolia House"), "Bridal Showers");
  assert.equal(detectCategory("Class of 2026 Graduation Party"), "Graduations");
  assert.equal(detectCategory("Graduation Ceremony — Lena De La Cruz"), "Graduations");
  assert.equal(detectCategory("You're invited to our neighborhood fundraiser gala"), "General Events");
});

test("extractRsvpDetails captures wedding RSVP url and deadline", () => {
  const details = extractRsvpDetails(
    [
      "RSVP by December 1st at:",
      "theknot.com/us/isabellaandjonathon",
    ].join("\n"),
  );

  assert.equal(details.url, "https://theknot.com/us/isabellaandjonathon");
  assert.equal(details.deadline, "December 1st");
  assert.equal(details.contact, null);
});

test("extractRsvpDetails keeps phone-based RSVP contact", () => {
  const details = extractRsvpDetails("RSVP to Maria at 555-123-4567");

  assert.equal(details.contact, "RSVP: Maria 555-123-4567");
  assert.equal(details.url, null);
  assert.equal(details.deadline, null);
});

test("extractRsvpDetails does not treat generic links as RSVP links", () => {
  const details = extractRsvpDetails("Photos: www.example.com/gallery");

  assert.equal(details.url, null);
  assert.equal(details.deadline, null);
  assert.equal(details.contact, null);
});
