import assert from "node:assert/strict";
import test from "node:test";
import { breadthFirstCampaignQueue, buildCampaignScenarios, CAMPAIGN_FAMILIES, CAMPAIGN_OUTPUTS } from "./create-campaign-scenarios.mjs";

test("limited-budget ordering covers all families before repeats without changing briefs or dropping crosses", () => {
  const scenarios = buildCampaignScenarios();
  const order = breadthFirstCampaignQueue(scenarios);
  assert.deepEqual(order.slice(0, 6), scenarios.slice(0, 6));
  assert.equal(new Set(order.slice(0, 31).map(scenario => scenario.category)).size, 31);
  assert.deepEqual(order.map(scenario => scenario.id).sort(), scenarios.map(scenario => scenario.id).sort());
  assert.ok(order.every(scenario => scenarios.includes(scenario)));
  const counts = CAMPAIGN_OUTPUTS.map(output => order.slice(0, 31).filter(scenario => scenario.output === output.id).length);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});

test("campaign covers every family and output exactly once, with all five personas", () => {
  const scenarios = buildCampaignScenarios();
  assert.equal(scenarios.length, 93);
  assert.equal(CAMPAIGN_FAMILIES.length, 31);
  assert.equal(new Set(scenarios.map((item) => item.id)).size, 93);
  for (const family of CAMPAIGN_FAMILIES) {
    assert.deepEqual(scenarios.filter((item) => item.category === family.id).map((item) => item.output).sort(), CAMPAIGN_OUTPUTS.map((item) => item.id).sort());
  }
  assert.deepEqual([...new Set(scenarios.map((item) => item.persona))].sort(), ["coach", "general", "gymnast", "mom", "teacher"]);
});

test("pilot order matches the accepted campaign and scenarios are deeply immutable", () => {
  const scenarios = buildCampaignScenarios();
  assert.deepEqual(scenarios.slice(0, 6).map((item) => [item.id, item.pilotOrder]), [
    ["birthday--live_card", 1], ["field_trip--event_page", 2], ["football--digital_flyer", 3],
    ["gymnastics--live_card", 4], ["anniversary--event_page", 5], ["baby_shower--digital_flyer", 6],
  ]);
  assert.ok(Object.isFrozen(scenarios));
  assert.ok(Object.isFrozen(scenarios[0].facts));
  assert.ok(Object.isFrozen(scenarios[0].messages[0]));
  assert.throws(() => { scenarios[0].facts.title = "Changed"; }, TypeError);
});

test("dates remain deterministic and future relative to the pinned reference", () => {
  assert.deepEqual(buildCampaignScenarios(), buildCampaignScenarios());
  const scenarios = buildCampaignScenarios({ referenceDate: "2027-12-20" });
  for (const scenario of scenarios) {
    assert.ok(scenario.facts.date > "2027-12-20");
    assert.equal(scenario.referenceDate, "2027-12-20");
    assert.equal(scenario.facts.timezone, "America/Chicago");
  }
  assert.deepEqual(buildCampaignScenarios({ referenceDate: new Date("2027-12-20T12:00:00Z") }), scenarios);
  for (const referenceDate of ["2026-02-30", "tomorrow", "2026-13-01", "2026-2-01"]) {
    assert.throws(() => buildCampaignScenarios({ referenceDate }), TypeError);
  }
});

test("every brief has bounded artwork authorization, missing details, a Q&A check and a real correction", () => {
  for (const scenario of buildCampaignScenarios()) {
    assert.ok(scenario.messages.length <= scenario.limits.maxUserTurns);
    assert.equal(scenario.messages.filter((message) => message.artworkOperation).length, 2);
    assert.equal(scenario.limits.maxArtworkOperations, 2);
    assert.ok(scenario.messages.some((message) => message.kind === "style_edit"));
    assert.ok(scenario.questionChecks.length > 0);
    assert.ok(scenario.missingAtOpening.includes("organizer"));
    assert.ok(scenario.messages.find((message) => message.kind === "answer").text.includes(scenario.facts.email));
    assert.match(scenario.facts.email, /@example\.invalid$/);
    assert.ok(scenario.messages[0].text.includes(scenario.categoryLabel));
    for (const approvedLine of scenario.facts.approvedCopy ?? []) {
      assert.ok(scenario.messages[0].text.includes(approvedLine), `${scenario.id} supplies its approved copy`);
    }
    for (const correction of scenario.corrections) {
      assert.notEqual(correction.before, correction.after);
      assert.equal(scenario.initialFacts[correction.field], correction.before);
      assert.equal(scenario.facts[correction.field], correction.after);
    }
  }
});

test("sensitive pilot distinctions survive the sealed final facts", () => {
  const cases = new Map(buildCampaignScenarios().map((scenario) => [scenario.id, scenario]));
  const trip = cases.get("field_trip--event_page");
  assert.equal(trip.facts.returnTime, "15:00");
  assert.equal(trip.facts.endTime, "15:00");
  assert.equal(trip.facts.departureTime, "09:00");
  assert.match(trip.facts.notes, /returns there at 3:00 PM/);
  assert.doesNotMatch(trip.facts.notes, /2:30 PM/);
  const meet = cases.get("gymnastics--live_card");
  assert.equal(meet.facts.warmupTime, "13:00");
  assert.equal(meet.facts.competitionTime, "14:00");
  assert.equal(meet.facts.awardsTime, "16:00");
  const anniversary = cases.get("anniversary--event_page");
  assert.equal(anniversary.facts.anniversaryYears, 25);
  assert.notEqual(anniversary.facts.location, anniversary.facts.dinnerLocation);
  assert.ok(cases.get("baby_shower--digital_flyer").facts.approvedCopy.includes("Un rayito de sol viene en camino"));
});
