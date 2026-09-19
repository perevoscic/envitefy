import { createHash } from "node:crypto";

export function validateCampaignEventDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new TypeError("Campaign event date must be a valid YYYY-MM-DD date");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new TypeError("Campaign event date must be a valid calendar date");
  return value;
}

export const campaignScenarioHash = (scenario) =>
  createHash("sha256").update(JSON.stringify(scenario)).digest("hex");

const displayDate = (value) => new Intl.DateTimeFormat("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
}).format(new Date(`${value}T00:00:00.000Z`));

/** Change only the supplied calendar date; clocks, zone and original brief stay intact. */
export function overrideCampaignEventDate(scenario, eventDate, { reason, authorizedAt } = {}) {
  validateCampaignEventDate(eventDate);
  const originalDate = validateCampaignEventDate(scenario.initialFacts.date);
  if (scenario.facts.date !== originalDate) throw new Error("Scenario has multiple primary dates; explicit review is required");
  const originalLabel = displayDate(originalDate);
  const nextLabel = displayDate(eventDate);
  function replace(value) {
    if (typeof value === "string") return value.replaceAll(originalLabel, nextLabel).replaceAll(originalDate, eventDate);
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replace(child)]));
    return value;
  }
  const effective = replace(scenario);
  effective.scenarioOverride = {
    type: "event_date",
    originalDate,
    eventDate,
    reason: reason || `User requested ${eventDate} for future campaign tests`,
    authorizedAt: authorizedAt || new Date().toISOString(),
    sourceScenarioSha256: campaignScenarioHash(scenario),
  };
  return effective;
}

export function bindCampaignScenario(scenario, attemptId, evidencePath) {
  return {
    effectiveScenario: structuredClone(scenario),
    scenarioEvidence: { attemptId, path: evidencePath, sha256: campaignScenarioHash(scenario) },
    ...(scenario.scenarioOverride ? { scenarioOverride: { ...scenario.scenarioOverride, attemptId, effectiveScenarioSha256: campaignScenarioHash(scenario) } } : {}),
  };
}

/** Existing evidence outranks a later policy: old attempts never acquire a new date. */
export function effectiveCampaignScenario(scenario, result, persisted) {
  if (result) {
    if (!result.effectiveScenario && !result.scenarioEvidence) return scenario;
    const effective = result.effectiveScenario;
    const binding = result.scenarioEvidence;
    if (!effective || effective.id !== scenario.id || binding?.attemptId !== result.attemptId || binding.sha256 !== campaignScenarioHash(effective))
      throw new Error(`Unbound effective scenario for ${scenario.id}`);
    return effective;
  }
  if (!persisted) return scenario;
  if (persisted.id !== scenario.id || persisted.scenarioOverride?.sourceScenarioSha256 !== campaignScenarioHash(scenario))
    throw new Error(`Persisted date override does not match original scenario ${scenario.id}`);
  validateCampaignEventDate(persisted.facts.date);
  if (persisted.facts.date !== persisted.initialFacts.date || persisted.facts.date !== persisted.scenarioOverride.eventDate)
    throw new Error(`Inconsistent persisted date override for ${scenario.id}`);
  return persisted;
}
