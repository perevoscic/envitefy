import assert from "node:assert/strict";
import test from "node:test";

import {
  collapseRepeatedDisplayText,
  compareGymMeetScheduleDays,
  formatGymMeetDate,
  formatGymMeetScheduleTabLabel,
  formatGymMeetTime,
  getGymMeetScheduleDaySortTime,
  joinUniqueDisplayParts,
  sanitizeGymMeetDisplayDateLabel,
  stripLinkedDomainMentions,
} from "./displayText";

test("formatGymMeetTime extracts the first clean time token", () => {
  assert.equal(formatGymMeetTime("12:00AM sessions. AM"), "12:00 AM");
  assert.equal(formatGymMeetTime("13:45 warmup"), "1:45 PM");
});

test("formatGymMeetTime hides placeholder midnight when no real time was parsed", () => {
  assert.equal(formatGymMeetTime(""), "");
  assert.equal(formatGymMeetTime("2026-04-10"), "");
  assert.equal(formatGymMeetTime("2026-04-10T00:00:00.000Z"), "");
  assert.equal(formatGymMeetTime("2026-04-10T00:00:00"), "");
  assert.equal(formatGymMeetTime("00:00"), "");
});

test("collapseRepeatedDisplayText removes duplicated gym strings", () => {
  assert.equal(
    collapseRepeatedDisplayText("360 Gymnastics FL 360 Gymnastics FL"),
    "360 Gymnastics FL",
  );
});

test("joinUniqueDisplayParts keeps the longest venue line without duplication", () => {
  assert.equal(
    joinUniqueDisplayParts([
      "Coral Springs Gymnasium",
      "Coral Springs Gymnasium, 123 Main St, Coral Springs, FL",
    ]),
    "Coral Springs Gymnasium, 123 Main St, Coral Springs, FL",
  );
});

test("stripLinkedDomainMentions removes linked bare domains from copy", () => {
  assert.equal(
    stripLinkedDomainMentions("Live scoring available online at USACompetitions.com.", [
      { url: "https://www.usacompetitions.com/results" },
    ]),
    "Live scoring available online.",
  );
});

test("sanitizeGymMeetDisplayDateLabel rejects packet intro prose and keeps real date ranges", () => {
  assert.equal(
    sanitizeGymMeetDisplayDateLabel(
      "Team Twisters & USA Competitions is proud to host the 2026 Florida USA Gymnastics Level 7/9/10 State Championships. Please review the following items enclosed in this packet:",
    ),
    "",
  );
  assert.equal(sanitizeGymMeetDisplayDateLabel("March 20-22, 2026"), "March 20-22, 2026");
});

test("formatGymMeetDate only formats strict ISO inputs", () => {
  assert.equal(formatGymMeetDate("2026-03-20"), "Mar 20, 2026");
  assert.equal(
    formatGymMeetDate(
      "Team Twisters & USA Competitions is proud to host the 2026 Florida USA Gymnastics Level 7/9/10 State Championships.",
    ),
    "",
  );
});

test("formatGymMeetScheduleTabLabel uses local calendar day for date-only ISO (US timezones)", (t) => {
  const prevTz = process.env.TZ;
  t.after(() => {
    if (prevTz === undefined) delete process.env.TZ;
    else process.env.TZ = prevTz;
  });
  process.env.TZ = "America/Chicago";

  const label = formatGymMeetScheduleTabLabel({ isoDate: "2026-04-10" });
  assert.match(label, /^FRI • APR 10$/);
});

test("compareGymMeetScheduleDays orders by isoDate chronologically", () => {
  const days = [
    { isoDate: "2026-04-12", id: "c" },
    { isoDate: "2026-04-10", id: "a" },
    { isoDate: "2026-04-11", id: "b" },
  ] as const;
  const sorted = [...days].sort(compareGymMeetScheduleDays);
  assert.deepEqual(
    sorted.map((d) => d.isoDate),
    ["2026-04-10", "2026-04-11", "2026-04-12"],
  );
  assert.ok(Number.isFinite(getGymMeetScheduleDaySortTime({ isoDate: "2026-04-10" })));
  assert.equal(getGymMeetScheduleDaySortTime({}), Number.POSITIVE_INFINITY);
});
