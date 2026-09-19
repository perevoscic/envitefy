import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft } from "./fallback.ts";

for (const output of ["live_card", "digital_flyer", "event_page"]) {
  test(`${output}: asking about multi-location support cannot become the event title`, () => {
    const initial = fallbackExtractConciergeDraft({
      message: "Elena and Sam's 25th anniversary, November 5 2099 at 2 PM, Maple Community Center. Dinner at Example Garden Room at 5 PM.",
      requestedOutputs: [output],
    });
    // An unresolved provisional title is especially vulnerable to raw question text.
    const draft = { ...initial, title: "Event draft", titleConfirmed: false };
    const next = fallbackExtractConciergeDraft({ draft, requestedOutputs: [output], message: "Can the page show the vow renewal and dinner as two different locations without mixing up the times?" });
    assert.equal(next.eventPurpose, draft.eventPurpose);
    assert.ok(!next.title?.includes("Can the page"));
    assert.equal(next.startISO, draft.startISO);
    assert.equal(next.location, draft.location);
    assert.deepEqual(next.requestedOutputs, draft.requestedOutputs);
  });
}

test("an explicit title correction phrased as a question still changes the title", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Birthday for Nora, turning 7, November 5 2099 at 2 PM at Maple Community Center.", requestedOutputs: ["live_card"] });
  const next = fallbackExtractConciergeDraft({ draft, requestedOutputs: ["live_card"], message: 'Can you change the title to "Nora Takes Seven"?' });
  assert.equal(next.title, "Nora Takes Seven");
});

const factualFields = [
  "title", "eventPurpose", "honoreeName", "ageOrMilestone", "eventType", "dateText", "timeText",
  "startISO", "endISO", "timezone", "location", "venue", "additionalLocations", "rsvpEnabled",
  "rsvpName", "rsvpContact", "rsvpDeadline", "registryLink", "giftPreferenceNote", "previewCopy",
  "requestedOutputs", "outputs",
];

const questionCases = [
  ["game_day", "Neighbors' game day watch party", "Will people understand this is a watch party instead of a team playing at the venue?"],
  ["open_house", "School open house", "Can I say drop in any time during the window instead of assigning everyone an appointment?"],
  ["housewarming", "Jordan's housewarming", "If I edit the address later, will the shared online version update?"],
  ["sport_event", "Cedar basketball scrimmage", "Can I mark this as a scrimmage so parents do not mistake it for a league game?"],
  ["sport_event", "Maple wrestling practice", "Can this stay a practice announcement without made-up brackets?"],
];

for (const output of ["live_card", "digital_flyer", "event_page"]) {
  test(`${output}: questions about presentation and future behavior preserve every approved fact`, () => {
    for (const [eventType, subject, message] of questionCases) {
      const initial = fallbackExtractConciergeDraft({
        message: `Create a ${output.replaceAll("_", " ")} for ${subject}, November 5 2099 at 2 PM at Maple Community Center, Austin, TX.`,
        requestedOutputs: [output],
      });
      const draft = { ...initial, eventType, title: `${subject} draft`, eventPurpose: subject, currentQuestion: null, missingFields: [] };
      const next = fallbackExtractConciergeDraft({ draft, requestedOutputs: [output], message });
      for (const key of factualFields) assert.deepEqual(next[key], draft[key], `${eventType}: ${key}`);
      assert.ok(next.knowledgeAnswer, eventType);
    }
  });
}

test("polite factual corrections are applied even when written as questions", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Birthday for Nora, turning 7, November 5 2099 at 2 PM at Maple Community Center, Austin, TX.", requestedOutputs: ["live_card"] });
  for (const [message, key, expected] of [
    ["Can you change the location to Oak Community Hall, Austin, TX?", "location", "Oak Community Hall, Austin, TX"],
    ["Could you turn online RSVP off?", "rsvpEnabled", false],
    ["Can you change the time to 3 PM?", "timeText", "3:00 PM"],
    ['If I share this later, will it update? Please change the title to "Nora Takes Seven".', "title", "Nora Takes Seven"],
  ]) {
    const next = fallbackExtractConciergeDraft({ draft, requestedOutputs: ["live_card"], message });
    assert.equal(next[key], expected, message);
  }
});

test("a visual edit phrased as a question is retained while event facts stay intact", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Birthday for Nora, turning 7, November 5 2099 at 2 PM at Maple Community Center, Austin, TX. Pink rainbow artwork.", requestedOutputs: ["live_card"] });
  const next = fallbackExtractConciergeDraft({ draft, requestedOutputs: ["live_card"], message: "Could you make the artwork dark blue with larger lettering?" });
  assert.match(next.theme, /dark blue/);
  for (const key of factualFields) assert.deepEqual(next[key], draft[key], key);
});
