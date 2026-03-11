import assert from "node:assert/strict";
import test from "node:test";

import {
  collapseRepeatedDisplayText,
  formatGymMeetTime,
  joinUniqueDisplayParts,
  stripLinkedDomainMentions,
} from "./displayText";

test("formatGymMeetTime extracts the first clean time token", () => {
  assert.equal(formatGymMeetTime("12:00AM sessions. AM"), "12:00 AM");
  assert.equal(formatGymMeetTime("13:45 warmup"), "1:45 PM");
});

test("collapseRepeatedDisplayText removes duplicated gym strings", () => {
  assert.equal(
    collapseRepeatedDisplayText("360 Gymnastics FL 360 Gymnastics FL"),
    "360 Gymnastics FL"
  );
});

test("joinUniqueDisplayParts keeps the longest venue line without duplication", () => {
  assert.equal(
    joinUniqueDisplayParts([
      "Coral Springs Gymnasium",
      "Coral Springs Gymnasium, 123 Main St, Coral Springs, FL",
    ]),
    "Coral Springs Gymnasium, 123 Main St, Coral Springs, FL"
  );
});

test("stripLinkedDomainMentions removes linked bare domains from copy", () => {
  assert.equal(
    stripLinkedDomainMentions("Live scoring available online at USACompetitions.com.", [
      { url: "https://www.usacompetitions.com/results" },
    ]),
    "Live scoring available online."
  );
});
