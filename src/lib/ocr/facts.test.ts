import assert from "node:assert/strict";
import test from "node:test";
import { filterRenderedOcrFacts, mergeOcrFacts, normalizeOcrFacts } from "./facts.ts";

test("mergeOcrFacts dedupes repeated entry fees with label prefixes", () => {
  const facts = mergeOcrFacts(
    normalizeOcrFacts([
      { label: "Entry Fee", value: "$25 entry" },
      { label: "Entry", value: "Entry Fee: $25 entry" },
      { label: "Check-in", value: "Check-in 8:30 AM" },
      { label: "Games Start", value: "Games start 9:00 AM" },
      { label: "Perks", value: "Prizes, Music, Refreshments" },
    ]),
  );

  assert.deepEqual(facts, [
    { label: "Entry Fee", value: "$25 entry" },
    { label: "Check-in", value: "Check-in 8:30 AM" },
    { label: "Games Start", value: "Games start 9:00 AM" },
    { label: "Perks", value: "Prizes, Music, Refreshments" },
  ]);
});

test("filterRenderedOcrFacts keeps semantic check-in and game-start facts", () => {
  const facts = filterRenderedOcrFacts(
    [
      { label: "Check-in", value: "Check-in 8:30 AM" },
      { label: "Games Start", value: "Games start 9:00 AM" },
      { label: "Entry Fee", value: "$25 entry" },
    ],
    ["8:30 AM - 9:00 AM", "$25 entry"],
  );

  assert.deepEqual(facts, [
    { label: "Check-in", value: "Check-in 8:30 AM" },
    { label: "Games Start", value: "Games start 9:00 AM" },
  ]);
});
