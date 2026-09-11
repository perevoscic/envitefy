import assert from "node:assert/strict";
import test from "node:test";
import { usefulScanNotes } from "./useful-notes.ts";
import { filterRenderedOcrFacts } from "./facts.ts";

test("empty and generic messages do not create a Good to Know card", () => {
  for (const value of [
    null,
    "",
    "N/A",
    "No additional information.",
    "Have fun!",
    "Event from flyer.",
    "Bring your appointment details with you.",
    "Join us for a wonderful celebration!",
  ])
    assert.equal(usefulScanNotes(value), "", String(value));
});

test("printed reception plans, preparation, access and restrictions stay useful", () => {
  for (const value of [
    "Dinner and dancing to follow.",
    "Reception to follow",
    "Dinner & dancing after the ceremony.",
    "Join us for dinner and dancing!",
    "Refreshments provided.",
    "Reception at the Garden Room from 6 PM.",
    "Dinner and dancing to follow at the Garden Room.",
    "Vegetarian meals available on request.",
    "Bring your insurance card.",
    "No food for 8 hours before arrival.",
    "Ages 16+",
    "Park behind the church.",
    "No gifts, please.",
    "Use the side entrance after 6 PM.",
  ])
    assert.equal(usefulScanNotes(value), value);
});

test("remove repeated logistics sentence by sentence while keeping additional instructions", () => {
  const shown = ["Sam ENT appointment", "Clinic One", "Monday, November 2"];
  const value =
    "Sam ENT appointment at Clinic One on Monday, November 2. Bring your insurance card. Have fun!";
  assert.equal(usefulScanNotes(value, shown), "Bring your insurance card.");
  assert.equal(
    usefulScanNotes("Arrive at Clinic One 15 minutes before Sam ENT appointment.", shown),
    "Arrive at Clinic One 15 minutes before Sam ENT appointment.",
  );
  assert.equal(
    usefulScanNotes("Dinner and dancing to follow. Use the side entrance after 6 PM."),
    "Dinner and dancing to follow.\n\nUse the side entrance after 6 PM.",
  );
});

test("legacy note facts cannot reintroduce filler or duplicate another rendered card", () => {
  const facts = [
    { label: "Good to Know", value: "Have fun!" },
    { label: "Notes", value: "Dinner and dancing to follow." },
    { label: "Details", value: "Bring your insurance card." },
    { label: "Patient ID", value: "123" },
  ];
  assert.deepEqual(filterRenderedOcrFacts(facts, ["Dinner and dancing to follow."]), [
    facts[2],
    facts[3],
  ]);
  assert.equal(facts[0].value, "Have fun!", "saved source facts are not mutated");
  assert.deepEqual(filterRenderedOcrFacts(facts, []), [facts[1], facts[2], facts[3]]);
});
