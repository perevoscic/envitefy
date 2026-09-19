import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { publicContentForDraft } from "./public-content.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";

const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/campaign-remediation-replay.json", import.meta.url), "utf8"));
// Independently transcribed content expectations, not output derived from the parser.
const required = {
  anniversary: [/vow renewal/i, /dinner.*Example Garden Room.*5(?::00)? PM/i],
  appointment: [/portrait session.*Rivera family/i, /arrive ten minutes early/i],
  baby_shower: [/A little sunshine is on the way/, /Un rayito de sol viene en camino/, /No gifts, please\./],
  baseball: [/ages 10 to 12.*glove.*water/i, /throwing and fielding/i],
  basketball: [/Cedar Hawks.*Maple Bears/i, /indoor court shoes/i],
  birthday: [/Ready, set, celebrate!/, /No gifts, please\./],
  bridal_shower: [/afternoon tea/i],
  cheerleading: [/water/i, /spectators.*marked seating area/i],
  dance: [/ballet and contemporary/i, /performers arrive at 1(?::00)? PM/i, /doors open at 1:30 PM/i],
  field_trip: [/Example Elementary.*9(?::00)? AM.*returns.*3:00 PM/i, /Example Nature Museum/i, /water bottle.*packed lunch/i],
  football: [/Cedar Hawks are away.*Maple Bears are home/i, /arrive at 1:30 PM/i],
  game_day: [/watching a game together, not playing/i, /bring a snack/i],
  gender_reveal: [/find out together/i, /must not announce a boy or girl/i],
  general: [/conversation with tea/i],
  graduation: [/On to the next adventure/],
  gymnastics: [/warmup starts at 1(?::00)? PM.*competition starts at 2(?::00)? PM.*awards are at 4(?::00)? PM/i],
  hockey: [/full protective gear/i, /warm layer/i],
  housewarming: [/housewarming with snacks/i, /No gifts, please\./],
  lacrosse: [/non-contact skills session/i, /lacrosse stick.*water.*mouthguard/i],
  open_house: [/meet teachers.*see classrooms/i, /main office/i],
  soccer: [/shin guards and water are required/i],
  softball: [/Maple Comets/i, /glove.*helmet.*water/i],
  special_event: [/battery-powered lanterns only/i, /open flames are not allowed/i],
  sport_event: [/basketball and soccer stations/i, /bring water/i, /no experience needed/i],
  swimming: [/warmup is at 1(?::00)? PM.*meet starts at 2(?::00)? PM/i, /goggles.*towel.*water/i],
  tennis: [/new players are welcome/i, /racket and water/i],
  track_field: [/sprint drills and long-jump technique/i, /running shoes and water/i],
  volleyball: [/indoor volleyball/i, /non-marking shoes.*knee pads/i],
  wedding: [/ceremony and reception.*same venue/i, /dress code is garden formal/i],
  workshop: [/adults and teens aged 13 and up/i, /materials are provided/i],
  wrestling: [/supervised technique practice/i, /wrestling shoes and water/i],
};

test("the replay covers each of the original 31 families in all three outputs", () => {
  assert.equal(fixture.cases.length, 93);
  assert.equal(new Set(fixture.cases.map(item => item.category)).size, 31);
  assert.equal(Object.keys(required).length, 31);
});

for (const scenario of fixture.cases) {
  test(`${scenario.id}: captured turns preserve title, product, canonical schedule and required public content`, () => {
    let draft;
    for (const turn of scenario.messages) {
      const previous = draft;
      const fallback = fallbackExtractConciergeDraft({ message: turn.text, draft: previous });
      draft = previous ? normalizeConciergeDraft({
        title: "Unrelated birthday draft", eventPurpose: "Raw correction text", eventType: "birthday",
        requestedOutputs: ["live_card"], giftNote: "Your presence is the best gift.",
        publicContent: { version: 1, revision: 999, items: [] },
      }, fallback, { message: turn.text, previousDraft: previous }) : fallback;
      assert.equal(draft.title, scenario.facts.title, `${turn.kind}: title`);
      assert.deepEqual(draft.requestedOutputs, [scenario.output], `${turn.kind}: output`);
    }
    const clock = (iso) => iso ? new Intl.DateTimeFormat("en-GB", { timeZone: scenario.facts.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso)) : null;
    assert.equal(clock(draft.startISO), scenario.facts.startTime, "primary clock");
    assert.equal(clock(draft.endISO), scenario.facts.endTime, "explicit event end");
    assert.equal(new Intl.DateTimeFormat("en-CA", { timeZone: scenario.facts.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(draft.startISO)), scenario.facts.date, "original supplied calendar date");
    assert.equal(draft.location, scenario.facts.location, "corrected location");
    const publicFacts = publicContentForDraft(draft);
    const publishedText = [draft.title, ...publicFacts.guestInstructions, ...publicFacts.requiredArtworkLines, draft.giftPreferenceNote, draft.giftNote].filter(Boolean).join("\n");
    for (const expected of required[scenario.category]) assert.match(publishedText, expected);
    assert.doesNotMatch(publishedText, /Your presence is the best gift|Raw correction text|Unrelated birthday draft/);
    if (scenario.category === "anniversary") {
      assert.equal(draft.eventType, "anniversary");
      assert.equal(draft.additionalLocations.length, 1);
      assert.equal(draft.additionalLocations[0].timeText, "5:00 PM");
    }
    if (scenario.category === "open_house") assert.equal(publicFacts.semanticKind, "school_open_house");
    if (scenario.category === "workshop") {
      assert.equal(draft.honoreeName, null);
      assert.equal(draft.ageOrMilestone, null);
    }
    const saved = buildConciergeHistoryPayload(draft, { studioInvite: { imageUrl: "/existing.webp", invitationData: { eventDetails: { pageTypography: { scale: 1.2 } } } } });
    assert.deepEqual(saved.data.publicEvent.guestInstructions, publicFacts.guestInstructions);
    assert.deepEqual(saved.data.publicEvent.requiredArtworkLines, publicFacts.requiredArtworkLines);
    assert.equal(saved.data.publicEvent.calendarStartISO, draft.startISO);
    assert.equal(saved.data.publicEvent.calendarEndISO, draft.endISO);
    assert.equal(saved.data.publicEvent.timezone, scenario.facts.timezone);
    assert.deepEqual(saved.data.publicEvent.pageTypography, { scale: 1.2 });
    assert.equal(saved.data.primaryOutput, scenario.output);
  });
}
