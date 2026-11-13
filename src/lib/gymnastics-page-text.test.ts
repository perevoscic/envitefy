import assert from "node:assert/strict";
import test from "node:test";
import { applyGymnasticsPageTextChange, normalizeGymnasticsPageText, parseGymnasticsTextPlacement } from "./gymnastics-page-text.ts";

const original = {
  title: "Club championship",
  date: "2026-03-06",
  time: "09:00",
  endDate: "2026-03-08",
  timezone: "America/New_York",
  venue: "Tampa Convention Center",
  address: "333 S Franklin St, Tampa, FL 33602",
  extra: { meetDateRangeLabel: "March 6–8, 2026", arrival: "Use the east entrance" },
  gymnasticsPageText: { tagline: "Together, we rise." },
};

test("inline hero facts update the sidebar's event fields without decorative overrides", () => {
  let edited = applyGymnasticsPageTextChange(original, "eventDisplayDate", "March 6–8, 2027");
  edited = applyGymnasticsPageTextChange(edited, "eventVenue", "East competition hall");
  edited = applyGymnasticsPageTextChange(edited, "eventAddress", "100 N Tampa St, Tampa, FL");
  assert.equal(edited.extra.meetDateRangeLabel, "March 6–8, 2027");
  assert.equal(edited.extra.arrival, original.extra.arrival);
  assert.equal(edited.venue, "East competition hall");
  assert.equal(edited.address, "100 N Tampa St, Tampa, FL");
  assert.equal(edited.date, original.date, "display wording never moves the calendar start");
  assert.equal(edited.endDate, original.endDate);
  assert.equal(edited.time, original.time);
  assert.equal(edited.timezone, original.timezone);
  assert.deepEqual(edited.gymnasticsPageText, original.gymnasticsPageText);
  assert.equal(original.venue, "Tampa Convention Center", "state updates preserve the previous snapshot");
});

test("cleared facts survive serialization and Cancel restores the prior canonical value", () => {
  const cleared = applyGymnasticsPageTextChange(
    applyGymnasticsPageTextChange(original, "eventAddress", ""), "eventVenue", "",
  );
  assert.equal(JSON.parse(JSON.stringify(cleared)).venue, "");
  assert.equal(JSON.parse(JSON.stringify(cleared)).address, "");
  const restored = applyGymnasticsPageTextChange(cleared, "eventAddress", original.address);
  assert.equal(restored.address, original.address);
  const resetDate = applyGymnasticsPageTextChange(original, "eventDisplayDate", undefined);
  assert.equal(resetDate.extra.meetDateRangeLabel, "");
  assert.equal(resetDate.date, original.date);
  assert.deepEqual(normalizeGymnasticsPageText({
    eventDisplayDate: "stale label", eventVenue: "stale venue", eventAddress: "stale address",
    ...original.gymnasticsPageText,
  }), original.gymnasticsPageText);
});

test("standalone text copies save independently and deletion preserves event facts and source wording", () => {
  const key = "copy:invitation:host-copy-1:text";
  const first = applyGymnasticsPageTextChange(original, key, "Welcome to the meet");
  const edited = applyGymnasticsPageTextChange(first, key, "Welcome, families!");
  const saved = JSON.parse(JSON.stringify(edited));
  assert.equal(normalizeGymnasticsPageText(saved.gymnasticsPageText)[key], "Welcome, families!");
  assert.equal(saved.title, original.title);
  assert.equal(saved.date, original.date);
  assert.equal(first.gymnasticsPageText[key], "Welcome to the meet");
  const deleted = applyGymnasticsPageTextChange(edited, key, undefined);
  assert.deepEqual(deleted.gymnasticsPageText, original.gymnasticsPageText);
  assert.deepEqual(normalizeGymnasticsPageText({
    "copy:invitation:host-copy-1:text": "Welcome",
    "copy:section:host-copy-1:text": "invalid section copy",
    "copy:eventTitle:host-copy-1:text": "invalid event fact copy",
    "copy:invitation::text": "invalid missing ID",
  }), { [key]: "Welcome" });
});

test("text placement survives saves with independent phone and desktop positions and no event fact changes", () => {
  const desktop = { x: 0.32, y: 0.64 }, mobile = { x: 0.1, y: 0.25 };
  const moved = applyGymnasticsPageTextChange(original, "placement:invitation", JSON.stringify({ desktop, mobile }));
  const reloaded = normalizeGymnasticsPageText(JSON.parse(JSON.stringify(moved.gymnasticsPageText)));
  assert.deepEqual(parseGymnasticsTextPlacement(reloaded["placement:invitation"]), { desktop, mobile });
  assert.equal(moved.date, original.date);
  assert.equal(moved.title, original.title);
  const copy = applyGymnasticsPageTextChange(moved, "copy:invitation:copy-1:text", "Welcome again");
  const placedCopy = applyGymnasticsPageTextChange(copy, "placement:copy:invitation:copy-1:text", JSON.stringify({ mobile }));
  const deleted = applyGymnasticsPageTextChange(placedCopy, "copy:invitation:copy-1:text", undefined);
  assert.equal(deleted.gymnasticsPageText["placement:copy:invitation:copy-1:text"], undefined);
  assert.equal(deleted.gymnasticsPageText["placement:invitation"], moved.gymnasticsPageText["placement:invitation"]);
  assert.deepEqual(parseGymnasticsTextPlacement('{"desktop":{"x":-2,"y":4},"mobile":{"x":"bad","y":0}}'), { desktop: { x: 0, y: 1 } });
  assert.equal(parseGymnasticsTextPlacement("not json"), undefined);
  assert.deepEqual(normalizeGymnasticsPageText({
    "placement:invitation": "not json", "placement:eventTitle": '{"desktop":{"x":0,"y":0}}',
    "placement:copy:invitation:orphan:text": '{"desktop":{"x":0,"y":0}}',
  }), {});
});
