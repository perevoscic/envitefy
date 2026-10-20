import assert from "node:assert/strict";
import test from "node:test";
import { applyGymnasticsPageTextChange, normalizeGymnasticsPageText } from "./gymnastics-page-text.ts";

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
