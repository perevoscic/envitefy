import test from "node:test";
import assert from "node:assert/strict";
import {
  detectCategory,
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
