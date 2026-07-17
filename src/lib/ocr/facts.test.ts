import assert from "node:assert/strict";
import test from "node:test";
import {
  coalesceFactValues,
  filterRegistryOcrFacts,
  filterRenderedOcrFacts,
  mergeOcrFacts,
  normalizeOcrFacts,
} from "./facts.ts";

test("normalizeOcrFacts keeps abbreviated host names intact", () => {
  const facts = normalizeOcrFacts([
    { label: "Host", value: "U.S. Gold Gymnastics" },
    { label: "Details", value: "Bring sunscreen. Pack a lunch." },
  ]);

  assert.deepEqual(facts, [
    { label: "Host", value: "U.S. Gold Gymnastics" },
    { label: "Details", value: "Bring sunscreen" },
    { label: "Details", value: "Pack a lunch." },
  ]);
});

test("coalesceFactValues rejoins abbreviated host fragments", () => {
  assert.deepEqual(coalesceFactValues("Host", ["U.S", "Gold Gymnastics"]), [
    "U.S. Gold Gymnastics",
  ]);
  assert.deepEqual(coalesceFactValues("Perks", ["Prizes", "Music", "Refreshments"]), [
    "Prizes",
    "Music",
    "Refreshments",
  ]);
});

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

test("filterRegistryOcrFacts removes registry facts when a registry action is rendered", () => {
  const facts = [
    { label: "Registry", value: "Registered at Amazon" },
    { label: "Details", value: "Adults-only celebration" },
  ];

  assert.deepEqual(filterRegistryOcrFacts(facts, true), [
    { label: "Details", value: "Adults-only celebration" },
  ]);
  assert.deepEqual(filterRegistryOcrFacts(facts, false), facts);
});
