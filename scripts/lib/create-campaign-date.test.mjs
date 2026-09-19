import assert from "node:assert/strict";
import test from "node:test";
import { buildCampaignScenarios } from "./create-campaign-scenarios.mjs";
import { bindCampaignScenario, campaignScenarioHash, effectiveCampaignScenario, overrideCampaignEventDate, validateCampaignEventDate } from "./create-campaign-date.mjs";

test("event-date override validates real ISO calendar dates", () => {
  for (const value of ["2026-09-23", "2028-02-29"]) assert.equal(validateCampaignEventDate(value), value);
  for (const value of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-9-23", "September 23, 2026", null, "2026-09-23T00:00Z"]) assert.throws(() => validateCampaignEventDate(value), TypeError);
});

test("all 93 date overrides preserve the frozen brief, facts, clocks and scenario identity", () => {
  const scenarios = buildCampaignScenarios();
  const original = JSON.stringify(scenarios);
  for (const scenario of scenarios) {
    const changed = overrideCampaignEventDate(scenario, "2026-09-23", {reason:"User requested all future tests on Sept 23",authorizedAt:"2026-09-19T12:30:00Z"});
    assert.equal(changed.id, scenario.id);
    assert.equal(changed.initialFacts.date, "2026-09-23");
    assert.equal(changed.facts.date, "2026-09-23");
    assert.match(changed.messages[0].text, /Wednesday, September 23, 2026/);
    assert.equal(changed.facts.startTime, scenario.facts.startTime);
    assert.equal(changed.facts.endTime, scenario.facts.endTime);
    assert.equal(changed.facts.timezone, scenario.facts.timezone);
    assert.deepEqual(changed.corrections, scenario.corrections);
    assert.deepEqual(changed.messages.slice(1), scenario.messages.slice(1));
    assert.equal(changed.scenarioOverride.sourceScenarioSha256, campaignScenarioHash(scenario));
  }
  assert.equal(JSON.stringify(scenarios), original);
});

test("field-trip departure and corrected return survive the date policy", () => {
  const scenario = buildCampaignScenarios().find((item)=>item.id === "field_trip--live_card");
  const effective = overrideCampaignEventDate(scenario,"2026-09-23");
  assert.equal(effective.initialFacts.endTime,"14:30");
  assert.equal(effective.facts.endTime,"15:00");
  assert.equal(effective.facts.departureTime,"09:00");
  assert.equal(effective.facts.returnTime,"15:00");
  assert.deepEqual(effective.corrections,scenario.corrections);
  assert.match(effective.messages[0].text,/Wednesday, September 23, 2026/);
  assert.deepEqual(effective.messages.slice(1),scenario.messages.slice(1));
});

test("report expectations use attempt-bound effective brief and retain prior attempt dates", () => {
  const scenario=buildCampaignScenarios()[0];
  const persisted=overrideCampaignEventDate(scenario,"2026-09-23");
  assert.equal(effectiveCampaignScenario(scenario,{attemptId:"old",caseId:scenario.id},persisted),scenario);
  assert.equal(effectiveCampaignScenario(scenario,null,persisted),persisted);
  const bound=bindCampaignScenario(persisted,"new","cases/x/attempts/new/scenario.json");
  const result={caseId:scenario.id,attemptId:"new",...bound};
  assert.deepEqual(effectiveCampaignScenario(scenario,result),persisted);
  assert.equal(result.scenarioOverride.attemptId,"new");
  assert.notEqual(result.effectiveScenario,persisted);
  assert.throws(()=>effectiveCampaignScenario(scenario,{...result,attemptId:"different"}),/Unbound/);
  result.effectiveScenario.facts.date="2026-10-01";
  assert.throws(()=>effectiveCampaignScenario(scenario,result),/Unbound/);
  assert.throws(()=>effectiveCampaignScenario(scenario,null,{...persisted,id:"different"}),/does not match/);
});
