import { CAMPAIGN_SCORE_DIMENSIONS } from "./create-campaign-scenarios.mjs";
import { adjudicateCampaignCase } from "./create-campaign-validation.mjs";

/**
 * Report inputs (plain JSON):
 * - manifest: {runId, referenceDate, cases: Scenario[]} (`scenarios` also accepted).
 * - caseResults: array or id-keyed object. Result shape:
 *   {caseId, status, stage, scores, findings, qaResults, evidence, timings, error}.
 *   Supported terminal statuses: passed, failed, blocked, budget-deferred, untested.
 *   running and incomplete remain distinct, and unknown statuses become incomplete.
 *   scores maps exported dimension names to 1..5, or null for unreviewed evidence.
 *   findings: [{severity, title, detail, reproduction, cause, verified, fixed}].
 *   qaResults: [{question, answer, expectedBehavior, verdict}].
 *   evidence: [{kind, path, exists:true, caption}]. Paths are report-relative.
 *   Only verified existing image evidence is included in the gallery. This pure
 *   renderer never probes the filesystem; the runner must verify `exists:true`.
 * - ledger: {budgetUsd, spentUsd, reservedUsd, entries?}. No missing value becomes 0.
 * - audit.execution: {status, stopReason:{kind,code,message}, lastCaseId,
 *   lastStage, lastTurn:{index,id,kind,role}, nextCaseId, remainingCaseIds,
 *   attemptedCaseIds, completedCaseIds, checkpointAt, stoppedAt,
 *   budget:{billedUsd,spentUsd,reservedUsd,budgetUsd}, evidence:[...]}.
 *   Stop kinds: campaign_budget, api_quota, infrastructure, completed, user_stop.
 *   stopReason.stoppingRequest: {caseId,turnId,model,endpoint,reservationId,at,
 *   code,providerCode} identifies the API request independently of the later UI
 *   checkpoint. No missing request field is inferred from the UI checkpoint.
 *   completed means the requested batch was attempted, never that all cases pass.
 *   Evidence may link execution.json and archived reports or prior checkpoints.
 * - audit.review.recommendations: [{title, detail, priority}]. Only supplied
 *   recommendations appear; P0..P3, numeric priorities, and severity names sort first.
 *
 * A result records what a worker observed; the renderer does not invent scores,
 * infer success from reaching intake, or hide untested matrix cells.
 */

export const CAMPAIGN_RESULT_STATUSES = Object.freeze([
  "passed",
  "failed",
  "blocked",
  "budget-deferred",
  "untested",
  "running",
  "incomplete",
]);

const scoreLabels = {
  understanding: "Understanding",
  factualAccuracy: "Factual accuracy",
  usefulQuestions: "Useful questions",
  qaAccuracy: "Q&A accuracy",
  conversationFlow: "Conversation flow",
  visualFidelity: "Visual fidelity",
  usability: "Usability",
  completion: "Completion",
};

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
const escapeMarkdown = (value) =>
  String(value ?? "")
    .replace(/[\\`*_{}[\]()<>|]/g, "\\$&")
    .replace(/\r?\n/g, " ");

function localAssetPath(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.replace(/\\/g, "/");
  if (
    /^[a-z][a-z\d+.-]*:/i.test(normalized) ||
    normalized.startsWith("/") ||
    /[\u0000-\u001f]/.test(normalized)
  )
    return null;
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === ".." || /%(?:2e|2f|5c)/i.test(segment))) return null;
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

function finiteMoney(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

const usd = (value) => (value === null ? "unavailable" : `$${value.toFixed(4)}`);

function normalizedResults(caseResults) {
  if (Array.isArray(caseResults))
    return new Map(caseResults.map((result) => [result.caseId ?? result.id, result]));
  return new Map(
    Object.entries(caseResults ?? {}).map(([id, result]) => [
      result.caseId ?? result.id ?? id,
      result,
    ]),
  );
}

function normalizedEvidence(result) {
  const evidence = Array.isArray(result.evidence) ? result.evidence : [];
  return evidence
    .map((item) =>
      typeof item === "string" ? { path: item, kind: "artifact", exists: false } : item,
    )
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ ...item, href: localAssetPath(item.path) }))
    .filter((item) => item.href);
}

function normalizeScore(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

function normalizeFindings(result) {
  return (Array.isArray(result.findings) ? result.findings : [])
    .map((finding) =>
      typeof finding === "string"
        ? { title: finding, severity: "unrated", verified: false }
        : finding,
    )
    .filter(Boolean);
}

function resultFor(scenario, results) {
  const supplied = results.get(scenario.id) ?? {};
  // A stored label cannot bypass the same evidence gate used by the runner.
  const result =
    supplied.status === "passed"
      ? adjudicateCampaignCase({
          ...supplied,
          caseId: scenario.id,
          findings: normalizeFindings(supplied),
        })
      : supplied;
  const status = !results.has(scenario.id)
    ? "untested"
    : CAMPAIGN_RESULT_STATUSES.includes(result.status)
      ? result.status
      : "incomplete";
  return {
    scenario,
    ...result,
    caseId: scenario.id,
    status,
    stage: result.stage ?? "not started",
    scores: Object.fromEntries(
      CAMPAIGN_SCORE_DIMENSIONS.map((name) => [name, normalizeScore(result.scores?.[name])]),
    ),
    evidence: normalizedEvidence(result),
    findings: normalizeFindings(result),
    qaResults: Array.isArray(result.qaResults) ? result.qaResults : [],
  };
}

/** Latest recorded browser attempts only. Execution coverage never awards quality passes. */
export function summarizeCampaignCoverage(scenarios, caseResults = []) {
  const results = normalizedResults(caseResults);
  const live = scenarios.flatMap(scenario => {
    const result = results.get(scenario.id);
    if (!result || !["conversation_only", "complete_journey"].includes(result.scope) || !result.attemptId || !result.startedAt || /offline|deterministic|fixture/i.test(result.mode || "")) return [];
    return [{ scenario, result }];
  });
  const accepted = generation => generation?.ok === true && generation.candidateOnly !== true && generation.unaccepted !== true && typeof generation.artifactSha256 === "string" && generation.artifactSha256.length > 0 && generation.archival?.verification?.decoded === true;
  const initialArtwork = result => {
    const initial = result.generations?.[0];
    return accepted(initial) && (!initial.phase || initial.phase === "generation") ? initial : null;
  };
  const guestExercised = result => result.guest?.mode === "local_anonymous_ui" && Number.isInteger(result.guest.checks?.anonymousGuestStatus);
  const families = new Set(live.filter(({ result }) => result.transcript?.some(turn => turn.role === "user" && typeof turn.text === "string" && turn.text.trim())).map(({ scenario }) => scenario.category).filter(Boolean));
  return {
    totalFamilies: new Set(scenarios.map(scenario => scenario.category).filter(Boolean)).size,
    totalCases: scenarios.length,
    familiesWithLiveUserTurns: families.size,
    casesAttemptedLive: live.length,
    casesWithAcceptedInitialArtwork: live.filter(({ result }) => initialArtwork(result)).length,
    casesWithSuccessfulDistinctEdits: live.filter(({ result }) => {
      const initial = initialArtwork(result);
      return initial && result.generations.slice(1).some(generation => accepted(generation) && generation.artifactSha256 !== initial.artifactSha256 && (generation.phase === "style_edit" || result.checks?.appearanceEditSucceeded === true));
    }).length,
    casesWithVerifiedSaveResume: live.filter(({ result }) => result.creationSessionId && result.checks?.explicitSaveWrites > 0 && result.checks.resumeFactsPreserved === true && result.checks.resumeArtworkPreserved === true).length,
    publishedEventIds: new Set(live.map(({ result }) => typeof result.eventId === "string" && result.eventId.trim() && result.publicUrl ? result.eventId : null).filter(Boolean)).size,
    anonymousGuestJourneysExercised: live.filter(({ result }) => guestExercised(result)).length,
    completePassingGuestChecks: live.filter(({ result }) => {
      const checks = result.guest?.checks;
      return guestExercised(result) && result.checks?.requiredGuestActionsPassed === true && checks.requiredGuestActionsPassed === true && checks.anonymousGuestStatus >= 200 && checks.anonymousGuestStatus < 300 && checks.anonymousSession === true && checks.publicRoutePreserved === true && checks.noOwnerControls === true && checks.mobileOverflow === false && checks.directions === true && checks.calendar === true && [true, "not_requested"].includes(checks.rsvp);
    }).length,
  };
}

function recommendationPriority(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (/^p?\d+$/.test(normalized)) return Number(normalized.replace(/^p/, ""));
  return { critical: 0, high: 1, medium: 2, low: 3 }[normalized] ?? Number.MAX_SAFE_INTEGER;
}

function evidenceLabel(item) {
  return `${item.caption || item.kind || "Artifact"}${item.exists === true ? "" : " (existence unverified)"}`;
}

function imageEvidence(item) {
  return (
    item.exists === true &&
    ["generated", "artwork", "generated-artwork", "screenshot", "image", "preview"].includes(
      item.kind,
    ) &&
    /\.(?:webp|png|jpe?g|gif)$/i.test(item.path)
  );
}

function severityOrder(value) {
  return { critical: 0, high: 1, serious: 1, medium: 2, low: 3, minor: 3 }[value] ?? 4;
}

function findingStatus(finding) {
  if (finding.verified !== true) return "Observation / unverified";
  if (finding.kind === "infrastructure") return "Verified campaign blocker";
  if (finding.kind === "follow_up") return "Verified observation";
  return "Verified defect";
}

function textDetails(value) {
  return Array.isArray(value)
    ? value.map(textDetails).join("; ")
    : value && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "");
}

function executionDetails(execution, ledger, manifest) {
  if (!execution || typeof execution !== "object") return null;
  const checkpoint = execution.lastCheckpoint ?? execution.checkpoint ?? {};
  const reason =
    typeof execution.stopReason === "string"
      ? { kind: execution.stopKind, code: execution.stopCode, message: execution.stopReason }
      : (execution.stopReason ?? {});
  const reasons = {
    api_quota:
      "Provider API quota or account limit. This does not establish that the campaign budget was exhausted.",
    campaign_budget:
      "Campaign spending limit or reservation policy. This does not establish a provider API quota failure.",
    infrastructure:
      "Infrastructure blocker. This does not establish a product defect or exhausted budget.",
    completed:
      "The requested execution batch finished. Individual cases still require their recorded checks and reviews.",
    user_stop: "Execution stopped at the user's request.",
  };
  const budget = execution.budget ?? {};
  const target = finiteMoney(budget.budgetUsd ?? ledger.budgetUsd ?? manifest.budgetUsd);
  const spent = finiteMoney(budget.spentUsd ?? ledger.spentUsd);
  const billed = finiteMoney(budget.billedUsd ?? ledger.billedUsd);
  const reserved = finiteMoney(budget.reservedUsd ?? ledger.reservedUsd);
  const available =
    target !== null && spent !== null && reserved !== null
      ? Math.max(0, target - spent - reserved)
      : null;
  const turn = execution.lastTurn ?? checkpoint.turn ?? checkpoint.lastTurn;
  const turnText =
    turn && typeof turn === "object"
      ? [turn.index != null ? `index ${turn.index}` : null, turn.id, turn.kind, turn.role]
          .filter((value) => value != null && value !== "")
          .join(" · ")
      : textDetails(turn);
  const ids = (value) =>
    Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string"))] : null;
  const remaining = ids(execution.remainingCaseIds);
  const attempted = ids(execution.attemptedCaseIds);
  const completed = ids(execution.completedCaseIds);
  const stoppingRequest = reason.stoppingRequest;
  const lines = [
    `Execution status: ${execution.status ?? "unavailable"}. A completed batch does not imply all cases passed.`,
    ...(execution.selection?.eventDatePolicy?.eventDate
      ? [`Event date for new test attempts: ${execution.selection.eventDatePolicy.eventDate}. Earlier attempts retain their original dates; each new attempt archives its effective brief.`]
      : []),
    `Stop classification: ${reason.kind ?? "unavailable"}. ${reasons[reason.kind] ?? "No classified stop reason has been recorded."}`,
    ...(reason.code ? [`Stop code: ${reason.code}.`] : []),
    ...(reason.message ? [`Stop detail: ${textDetails(reason.message)}`] : []),
    ...(stoppingRequest && typeof stoppingRequest === "object"
      ? [
          `Stopping API request: case ${stoppingRequest.caseId ?? "unavailable"}. Turn ID: ${stoppingRequest.turnId ?? "unavailable"}. Model: ${stoppingRequest.model ?? "unavailable"}. Endpoint: ${stoppingRequest.endpoint ?? "unavailable"}.`,
          `Stopping request reservation: ${stoppingRequest.reservationId ?? "unavailable"}. Request timestamp: ${stoppingRequest.at ?? "unavailable"}. Code: ${stoppingRequest.code ?? "unavailable"}. Provider code: ${stoppingRequest.providerCode ?? "unavailable"}.`,
          "The UI checkpoint below can reflect stages completed after the stopping API request.",
        ]
      : ["Stopping API request: not recorded."]),
    `Last UI checkpoint. Last case: ${execution.lastCaseId ?? checkpoint.caseId ?? "unavailable"}. Stage: ${execution.lastStage ?? checkpoint.stage ?? "unavailable"}. Turn: ${turnText || "unavailable"}.`,
    `Checkpoint time: ${execution.checkpointAt ?? checkpoint.at ?? "unavailable"}. Stopped at: ${execution.stoppedAt ?? "unavailable"}.`,
    `Next case: ${execution.nextCaseId ?? "not recorded"}. Attempted cases: ${attempted?.length ?? "unavailable"}. Cases with execution completed: ${completed?.length ?? "unavailable"}.`,
    `Remaining execution queue: ${remaining?.length ?? "unavailable"}${remaining?.length ? ` — ${remaining.join(", ")}` : ""}. This is the execution queue, not a count of failed reviews.`,
    `Campaign target: ${usd(target)}. Recorded API cost: ${usd(spent)}. Cost from reported usage (subtotal): ${usd(billed)}. Reserved: ${usd(reserved)}. Available after reservations: ${usd(available)}.`,
  ];
  return { lines, evidence: normalizedEvidence(execution) };
}

const normalizedText = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const regexLiteral = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function clockPattern(value) {
  if (!/^\d{2}:\d{2}$/.test(value ?? "")) return null;
  const [hour, minute] = value.split(":").map(Number);
  return `\\b${hour % 12 || 12}${minute === 0 ? "(?::00)?" : `:${String(minute).padStart(2, "0")}`}\\s*${hour >= 12 ? "p" : "a"}\\.?m\\.?`;
}

function localDateTime(iso, timezone) {
  if (typeof iso !== "string" || !iso) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
      date: `${values.year}-${values.month}-${values.day}`,
      time: `${values.hour}:${values.minute}`,
    };
  } catch {
    return null;
  }
}

/**
 * Pure, bounded review of canonical facts against actually delivered user turns.
 * Returns checks, not human scores or a journey pass. Hidden category/title labels,
 * planned-but-undelivered corrections, image contents and guest behavior are not
 * graded. Exact copy must reach guest-facing fields; sourceText/theme do not count.
 */
export function reviewScenarioFacts(scenario, result) {
  const draft = result.finalDraft ?? result.facts?.at(-1)?.draft ?? result.snapshots?.at(-1)?.draft;
  const turns = (result.transcript || []).filter(
    (turn) =>
      turn.role === "user" &&
      ["opening", "answer", "correction"].includes(turn.kind) &&
      typeof turn.text === "string",
  );
  const checks = [];
  const base = {
    caseId: scenario.id,
    mode: "canonical_facts_only",
    checks,
    unreviewed: ["rendered_artwork", "guest_journey", "category_label", "unrequested_exact_title"],
  };
  if (!draft || !turns.length)
    return {
      ...base,
      status: "not_reviewed",
      reason: "An observed draft and supplied user turns are required.",
    };
  const facts = { ...(scenario.initialFacts ?? scenario.facts ?? {}) };
  const plannedCorrection = scenario.messages?.find((message) => message.kind === "correction");
  if (
    turns.some(
      (turn) =>
        turn.kind === "correction" &&
        normalizedText(turn.text) !== normalizedText(plannedCorrection?.text),
    )
  ) {
    return {
      ...base,
      status: "not_reviewed",
      reason: "An unplanned correction requires manual review of the expected facts.",
    };
  }
  if (
    plannedCorrection &&
    turns.some(
      (turn) =>
        turn.kind === "correction" &&
        normalizedText(turn.text) === normalizedText(plannedCorrection.text),
    )
  ) {
    for (const correction of scenario.corrections || []) facts[correction.field] = correction.after;
  }
  const source = turns.map((turn) => turn.text).join("\n");
  const opening = turns
    .filter((turn) => turn.kind === "opening")
    .map((turn) => turn.text)
    .join("\n");
  const add = (field, expected, actual, supplied, matches = expected === actual) =>
    checks.push({
      field,
      status: !supplied ? "not_observed" : matches ? "passed" : "failed",
      expected: expected ?? null,
      actual: actual ?? null,
      evidence: supplied
        ? turns
            .filter((turn) =>
              supplied.test
                ? supplied.test(turn.text)
                : normalizedText(turn.text).includes(normalizedText(supplied)),
            )
            .map((turn) => ({ kind: turn.kind, text: turn.text }))
        : [],
    });
  const start = localDateTime(draft.startISO, draft.timezone || facts.timezone);
  const end = localDateTime(draft.endISO, draft.timezone || facts.timezone);
  let datePattern;
  if (/^\d{4}-\d{2}-\d{2}$/.test(facts.date ?? "")) {
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${facts.date}T00:00:00Z`));
    datePattern = new RegExp(`${regexLiteral(facts.date)}|${regexLiteral(dateLabel)}`, "i");
  }
  add("date", facts.date, start?.date, datePattern?.test(source) ? datePattern : null);
  const startPattern = clockPattern(facts.startTime);
  add(
    "startTime",
    facts.startTime,
    start?.time,
    startPattern && new RegExp(startPattern, "i").test(opening)
      ? new RegExp(startPattern, "i")
      : null,
  );
  const endClock = clockPattern(facts.endTime);
  const endPattern = endClock
    ? new RegExp(`(?:ends?|returns?(?: there)?)\\s+at\\s+${endClock}`, "i")
    : null;
  add("endTime", facts.endTime, end?.time, endPattern?.test(source) ? endPattern : null);
  add(
    "timezone",
    facts.timezone,
    draft.timezone,
    facts.timezone && source.includes(facts.timezone) ? facts.timezone : null,
  );
  const actualLocation = [draft.venue, draft.location]
    .filter((value) => typeof value === "string")
    .join(", ");
  const locationSupplied =
    facts.location && normalizedText(source).includes(normalizedText(facts.location));
  const locationParts = String(facts.location ?? "")
    .split(",")
    .map(normalizedText)
    .filter(Boolean);
  const actualParts = new Set(actualLocation.split(",").map(normalizedText).filter(Boolean));
  add(
    "location",
    facts.location,
    actualLocation || null,
    locationSupplied ? facts.location : null,
    locationParts.length > 0 && locationParts.every((part) => actualParts.has(part)),
  );
  const guestCopy = [
    draft.title,
    draft.giftPreferenceNote,
    ...Object.values(draft.previewCopy ?? {}),
  ]
    .filter((value) => typeof value === "string")
    .join("\n");
  for (const line of facts.approvedCopy ?? [])
    add(
      "exactCopy",
      line,
      guestCopy,
      source.includes(line) ? line : null,
      guestCopy.includes(line),
    );
  return {
    ...base,
    status: checks.some((check) => check.status === "failed")
      ? "issues_found"
      : checks.some((check) => check.status === "passed")
        ? "checked"
        : "not_reviewed",
  };
}

/** @returns {{markdown:string, html:string}} Complete matrix and evidence report. */
export function renderCampaignReport(manifest, caseResults = [], ledger = {}, audit = {}) {
  const scenarios = manifest.cases ?? manifest.scenarios ?? [];
  if (!Array.isArray(scenarios)) throw new TypeError("manifest.cases must be an array");
  if (new Set(scenarios.map((scenario) => scenario.id)).size !== scenarios.length)
    throw new Error("Duplicate scenario ids in campaign manifest");
  const results = normalizedResults(caseResults);
  const cases = scenarios.map((scenario) => resultFor(scenario, results));
  const coverage = summarizeCampaignCoverage(scenarios, caseResults);
  const coverageRows = [
    ["Families with live user turns", `${coverage.familiesWithLiveUserTurns} / ${coverage.totalFamilies}`],
    ["Cases attempted live", `${coverage.casesAttemptedLive} / ${coverage.totalCases}`],
    ["Cases with accepted initial artwork", coverage.casesWithAcceptedInitialArtwork],
    ["Cases with successful distinct edits", coverage.casesWithSuccessfulDistinctEdits],
    ["Cases with explicit save/resume verified", coverage.casesWithVerifiedSaveResume],
    ["Unique published event IDs", coverage.publishedEventIds],
    ["Anonymous guest journeys exercised", coverage.anonymousGuestJourneysExercised],
    ["Complete passing guest checks", coverage.completePassingGuestChecks],
  ];
  const coverageNote = "Counts use the latest recorded browser attempt per case, not summed retries. Live attempts include startup failures; families require actual user turns. Accepted artwork requires decoded archival evidence. These are execution milestones, not quality passes. Historical attempts remain in the evidence records.";
  const recommendations = (Array.isArray(audit.review?.recommendations) ? audit.review.recommendations : []).filter(item => item && typeof item.title === "string" && item.title.trim()).map(item => ({ title: item.title, detail: textDetails(item.detail), priority: item.priority ?? "Unprioritized" })).sort((left, right) => recommendationPriority(left.priority) - recommendationPriority(right.priority));
  const verifiedFixes = audit.review?.verifiedFixes || {};
  for (const result of cases)
    result.findings = result.findings.map((finding) =>
      verifiedFixes[finding.id]
        ? {
            ...finding,
            fixed: true,
            detail: `${textDetails(finding.detail)} Fix verification: ${verifiedFixes[finding.id]}`,
          }
        : finding,
    );
  const counts = Object.fromEntries(
    CAMPAIGN_RESULT_STATUSES.map((status) => [
      status,
      cases.filter((item) => item.status === status).length,
    ]),
  );
  const budget = finiteMoney(ledger.budgetUsd ?? manifest.budgetUsd);
  const spent = finiteMoney(ledger.spentUsd);
  const reserved = finiteMoney(ledger.reservedUsd);
  const remaining =
    budget !== null && spent !== null && reserved !== null
      ? Math.max(0, budget - spent - reserved)
      : null;
  const fullValidation = cases.length === 93 && counts.passed === 93;
  const title = `Envitefy Create campaign ${manifest.runId ?? "report"}`;
  const completion = fullValidation
    ? "All 93 combinations are reported passed."
    : `${counts.passed} of ${cases.length} combinations passed. ${coverage.casesAttemptedLive === cases.length && cases.length > 0 ? "Every combination has a recorded live attempt; quality checks remain unresolved." : "Coverage is incomplete."}`;
  const budgetSummary = `API budget: ${usd(budget)}. Recorded API cost: ${usd(spent)}. Reserved: ${usd(reserved)}. Available after reservations: ${usd(remaining)}. Recorded API cost may include conservative usage bounds; it is not necessarily a final provider invoice.`;
  const startingSpent = finiteMoney(audit.funding?.startingSpentUsd);
  const additionalBudget = finiteMoney(audit.funding?.additionalBudgetUsd);
  const newSpend = startingSpent !== null && spent !== null && spent >= startingSpent
    ? spent - startingSpent : null;
  const fundingSummary = audit.funding
    ? `Latest authorization: ${usd(additionalBudget)} in additional API cost. Prior recorded cost: ${usd(startingSpent)}. Recorded cost since authorization: ${usd(newSpend)}. Remaining new allowance after reservations: ${usd(additionalBudget !== null && newSpend !== null && reserved !== null ? Math.max(0, additionalBudget - newSpend - reserved) : null)}. Prior costs and attempts remain in the same ledger.`
    : "";
  const statusSummary = CAMPAIGN_RESULT_STATUSES.map(
    (status) => `${status}: ${counts[status]}`,
  ).join(" · ");
  const issues = [
    ...(audit.review?.findings || []),
    ...cases.flatMap((result) =>
      result.findings.map((finding) => ({
        ...finding,
        title: finding.title || finding.summary,
        caseId: result.caseId,
      })),
    ),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
  const offline = audit.offline;
  const offlineSummary = offline
    ? `Deterministic checks: ${offline.appearancePreservationPassed ?? "unavailable"}/${offline.count} preserve facts during appearance edits; ${offline.conversationPreservationPassed ?? "unavailable"}/${offline.count} preserve facts during capability questions. These are parser checks, not live model or image-quality passes.`
    : "Deterministic checks have not been recorded.";
  const baselineSummary = audit.baseline
    ? `Archived baseline: ${audit.baseline.conversationPreservationPassed ?? "not measured"}/${audit.baseline.count} capability-question checks passed; ${audit.baseline.appearancePreservationPassed ?? "not measured"}/${audit.baseline.count} appearance checks passed.`
    : "";
  const hasCurrentLimitations = Array.isArray(audit.execution?.currentLimitations);
  const limitations = hasCurrentLimitations
    ? audit.execution.currentLimitations
    : audit.review?.limitations || [];
  const historicalLimitations = hasCurrentLimitations ? audit.review?.limitations || [] : [];
  const execution = executionDetails(audit.execution, ledger, manifest);
  const auditEvidence = normalizedEvidence({
    evidence: [
      ...(audit.evidence || []),
      ...(audit.review?.evidence || []),
      ...(audit.baseline?.evidence || []),
      ...(execution?.evidence || []),
    ],
  });
  const responsive = audit.responsive;
  const responsiveSummary = responsive
    ? `Browser layout audit: ${responsive.passed ? "passed" : "not passed"}. Fresh mobile, desktop resized to mobile, and explicit navigation open/close: ${JSON.stringify(responsive.checks)}. No model requests.`
    : "";
  const md = [
    `# ${escapeMarkdown(title)}`,
    "",
    completion,
    "",
    budgetSummary,
    "",
    ...(fundingSummary ? [fundingSummary, ""] : []),
    statusSummary,
    "",
    "Agent-simulated users. Scores and verdicts require recorded review; unreviewed dimensions remain unrated. Intake completion alone is not a passed journey.",
    "",
    "## Actual coverage",
    "",
    "| Recorded milestone | Count |",
    "| --- | --- |",
    ...coverageRows.map(([label, count]) => `| ${label} | ${count} |`),
    "",
    coverageNote,
    "",
    ...(recommendations.length ? ["## Prioritized recommendations", "", ...recommendations.map(item => `- **${escapeMarkdown(item.priority)} · ${escapeMarkdown(item.title)}:** ${escapeMarkdown(item.detail)}`), ""] : []),
    ...(execution
      ? [
          "## Execution checkpoint",
          "",
          ...execution.lines.flatMap((line) => [escapeMarkdown(line), ""]),
        ]
      : []),
    ...(auditEvidence.length
      ? [
          "## Run records and archived evidence",
          "",
          ...auditEvidence.map(
            (item) => `- [${escapeMarkdown(evidenceLabel(item))}](${item.href})`,
          ),
          "",
        ]
      : []),
    "## Deterministic regression checks",
    "",
    offlineSummary,
    "",
    baselineSummary,
    "",
    ...(responsiveSummary ? [responsiveSummary, ""] : []),
    ...(limitations.length
      ? ["## Limits of this run", "", ...limitations.map((item) => `- ${escapeMarkdown(item)}`), ""]
      : []),
    ...(historicalLimitations.length
      ? [
          "## Historical first-cycle notes",
          "",
          "These describe the earlier review, not the current execution checkpoint.",
          "",
          ...historicalLimitations.map((item) => `- ${escapeMarkdown(item)}`),
          "",
        ]
      : []),
    "## Coverage",
    "",
    "| Case | Persona | Status | Stage | Evidence |",
    "| --- | --- | --- | --- | --- |",
    ...cases.map(
      (result) =>
        `| ${escapeMarkdown(result.caseId)} | ${escapeMarkdown(result.scenario.persona)} | ${result.status} | ${escapeMarkdown(result.stage)} | ${result.evidence.map((item) => `[${escapeMarkdown(evidenceLabel(item))}](${item.href})`).join("; ") || "None recorded"} |`,
    ),
    "",
    "## Findings",
    "",
    ...(issues.length
      ? issues.flatMap((issue) => [
          `- **${escapeMarkdown(issue.severity ?? "unrated")} · ${escapeMarkdown(issue.caseId || "campaign")} · ${findingStatus(issue)}${issue.fixed ? " · fixed" : ""}:** ${escapeMarkdown(issue.title ?? textDetails(issue.detail) ?? "Finding")}${issue.detail && issue.title ? ` — ${escapeMarkdown(textDetails(issue.detail))}` : ""}`,
          ...(issue.reproduction
            ? [`  Reproduction: ${escapeMarkdown(textDetails(issue.reproduction))}`]
            : []),
          ...(issue.cause ? [`  Cause: ${escapeMarkdown(issue.cause)}`] : []),
        ])
      : ["No findings recorded. This does not establish that untested cases work."]),
    "",
    "## Case reviews",
    "",
  ];
  for (const result of cases) {
    md.push(
      `### ${escapeMarkdown(result.caseId)}`,
      "",
      `Status: **${result.status}**. Stage: ${escapeMarkdown(result.stage)}.`,
      "",
      CAMPAIGN_SCORE_DIMENSIONS.map(
        (name) => `${scoreLabels[name]}: ${result.scores[name] ?? "unrated"}`,
      ).join(" · "),
      "",
    );
    if (result.error)
      md.push(
        `Blocked/error detail: ${escapeMarkdown(result.error.message ?? textDetails(result.error))}`,
        "",
      );
    if (result.failure) md.push(`Stopped: ${escapeMarkdown(result.failure)}`, "");
    if (result.validationGaps?.length)
      md.push(`Still unverified: ${escapeMarkdown(result.validationGaps.join(", "))}`, "");
    if (result.timings && Object.keys(result.timings).length)
      md.push(`Timings: ${escapeMarkdown(JSON.stringify(result.timings))}`, "");
    for (const qa of result.qaResults) {
      md.push(
        `- Question: ${escapeMarkdown(qa.question)}`,
        `  Answer: ${escapeMarkdown(qa.answer || "No answer recorded")}`,
        `  Expected: ${escapeMarkdown(qa.expectedBehavior || "Not recorded")}`,
        `  Verdict: ${escapeMarkdown(qa.verdict || "unreviewed")}`,
        "",
      );
    }
    for (const item of result.evidence.filter(imageEvidence))
      md.push(`[${escapeMarkdown(evidenceLabel(item))}](${item.href})`, "");
    if (result.transcript?.length) {
      md.push("Conversation:", "");
      for (const turn of result.transcript)
        md.push(
          `- ${turn.role === "user" ? "User" : "Create"} (${escapeMarkdown(turn.kind)}): ${escapeMarkdown(turn.text)}`,
        );
      md.push("");
    }
  }
  const caseRows = cases
    .map(
      (result, index) =>
        `<tr><td><a href="#case-${index}">${escapeHtml(result.caseId)}</a></td><td>${escapeHtml(result.scenario.persona)}</td><td><span class="status ${result.status}">${result.status}</span></td><td>${escapeHtml(result.stage)}</td><td>${result.evidence.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(evidenceLabel(item))}</a>`).join("<br>") || "None recorded"}</td></tr>`,
    )
    .join("");
  const gallery = cases
    .flatMap((result) =>
      result.evidence
        .filter(imageEvidence)
        .map(
          (item) =>
            `<figure><a href="${escapeHtml(item.href)}"><img loading="lazy" src="${escapeHtml(item.href)}" alt="${escapeHtml(item.caption || `${result.caseId}: ${item.kind}`)}"></a><figcaption>${escapeHtml(result.caseId)}<br>${escapeHtml(item.caption || item.kind)} · ${result.status}</figcaption></figure>`,
        ),
    )
    .join("");
  const responsiveGallery = normalizedEvidence(responsive || {})
    .filter(imageEvidence)
    .map(
      (item) =>
        `<figure><a href="${escapeHtml(item.href)}"><img loading="lazy" src="${escapeHtml(item.href)}" alt="Mobile navigation audit"></a><figcaption>${escapeHtml(item.path)}</figcaption></figure>`,
    )
    .join("");
  const issueHtml = issues.length
    ? `<ol>${issues.map((issue) => `<li><strong>${escapeHtml(issue.severity || "unrated")} · ${escapeHtml(issue.caseId || "campaign")}</strong> · ${findingStatus(issue)}${issue.fixed ? " · Fixed" : ""}<p>${escapeHtml(issue.title || textDetails(issue.detail) || "Finding")}</p>${issue.title && issue.detail ? `<p>${escapeHtml(textDetails(issue.detail))}</p>` : ""}${issue.reproduction ? `<p>Reproduction: ${escapeHtml(textDetails(issue.reproduction))}</p>` : ""}${issue.cause ? `<p>Cause: ${escapeHtml(issue.cause)}</p>` : ""}</li>`).join("")}</ol>`
    : "<p>No findings recorded. This does not establish that untested cases work.</p>";
  const transcripts = cases
    .filter((result) => result.transcript?.length)
    .map(
      (result) =>
        `<details><summary>${escapeHtml(result.caseId)} — conversation</summary>${result.transcript.map((turn) => `<p><strong>${turn.role === "user" ? "User" : "Create"} · ${escapeHtml(turn.kind)}</strong></p><p style="white-space:pre-wrap">${escapeHtml(turn.text)}</p>`).join("")}</details>`,
    )
    .join("");
  const reviews = cases
    .map(
      (result, index) =>
        `<details id="case-${index}"><summary>${escapeHtml(result.caseId)} — ${result.status}</summary><p>Stage: ${escapeHtml(result.stage)}</p>${result.failure ? `<p>Stopped: ${escapeHtml(result.failure)}</p>` : ""}${result.validationGaps?.length ? `<p>Still unverified: ${escapeHtml(result.validationGaps.join(", "))}</p>` : ""}<dl class="scores">${CAMPAIGN_SCORE_DIMENSIONS.map((name) => `<div><dt>${scoreLabels[name]}</dt><dd>${result.scores[name] ?? "Unrated"}</dd></div>`).join("")}</dl>${result.error ? `<p>Blocked/error detail: ${escapeHtml(result.error.message ?? textDetails(result.error))}</p>` : ""}${result.timings && Object.keys(result.timings).length ? `<p>Timings: ${escapeHtml(JSON.stringify(result.timings))}</p>` : ""}${result.qaResults.map((qa) => `<div class="qa"><p><strong>Question:</strong> ${escapeHtml(qa.question)}</p><p><strong>Answer:</strong> ${escapeHtml(qa.answer || "No answer recorded")}</p><p><strong>Expected:</strong> ${escapeHtml(qa.expectedBehavior || "Not recorded")}</p><p><strong>Verdict:</strong> ${escapeHtml(qa.verdict || "unreviewed")}</p></div>`).join("")}</details>`,
    )
    .join("");
  const executionHtml = execution
    ? `<h2>Execution checkpoint</h2>${execution.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}`
    : "";
  const auditEvidenceHtml = auditEvidence.length
    ? `<h2>Run records and archived evidence</h2><ul>${auditEvidence.map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(evidenceLabel(item))}</a></li>`).join("")}</ul>`
    : "";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>
<style>body{overflow-wrap:anywhere;margin:0;background:#f6f7fb;color:#202333;font:16px/1.55 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:32px 20px 72px}h1{font-size:2rem;line-height:1.2}h2{margin-top:40px}a{color:#3e42a1;overflow-wrap:anywhere}a:focus-visible,summary:focus-visible{outline:3px solid #6b3cff;outline-offset:4px}.summary,details{padding:20px;background:white;border:1px solid #dadee9;border-radius:12px}.summary p:first-child{font-size:1.2rem;font-weight:650}.table-scroll{overflow:auto}table{border-collapse:collapse;background:white;width:100%;font-size:14px}td,th{text-align:left;border:1px solid #dadee9;padding:10px;vertical-align:top}th{background:#eceefa}.status{white-space:nowrap}.passed{color:#17613e}.failed{color:#9c2431}.blocked,.budget-deferred{color:#865400}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}figure{margin:0;padding:12px;background:white;border:1px solid #dadee9;border-radius:12px}img{display:block;width:100%;height:300px;object-fit:contain;background:#f0f1f4}figcaption{font-size:14px;margin-top:10px}details{margin-top:12px}summary{cursor:pointer;font-weight:650;overflow-wrap:anywhere}.scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}.scores dt{font-size:13px}.scores dd{margin:0;font-weight:650}.qa{border-top:1px solid #dadee9}li{margin-bottom:18px}li p{margin:4px 0}@media(max-width:640px){main{padding:20px 12px}h1{font-size:1.55rem}.summary,details{padding:14px}}</style></head>
<body><main><h1>${escapeHtml(title)}</h1><div class="summary"><p>${escapeHtml(completion)}</p><p>${escapeHtml(budgetSummary)}</p>${fundingSummary ? `<p>${escapeHtml(fundingSummary)}</p>` : ""}<p>${escapeHtml(statusSummary)}</p><p>Agent-simulated users. Scores and verdicts require recorded review; unreviewed dimensions remain unrated. Intake completion alone is not a passed journey.</p></div>
<h2>Actual coverage</h2><div class="table-scroll"><table><thead><tr><th>Recorded milestone</th><th>Count</th></tr></thead><tbody>${coverageRows.map(([label, count]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(count)}</td></tr>`).join("")}</tbody></table></div><p>${escapeHtml(coverageNote)}</p>
${recommendations.length ? `<h2>Prioritized recommendations</h2><ol>${recommendations.map(item => `<li><strong>${escapeHtml(item.priority)} · ${escapeHtml(item.title)}</strong>${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}</li>`).join("")}</ol>` : ""}
${executionHtml}${auditEvidenceHtml}
<h2>Deterministic regression checks</h2><p>${escapeHtml(offlineSummary)}</p><p>${escapeHtml(baselineSummary)}</p>
${responsiveSummary ? `<p>${escapeHtml(responsiveSummary)}</p>` : ""}
${responsiveGallery ? `<div class="gallery">${responsiveGallery}</div>` : ""}
${limitations.length ? `<h2>Limits of this run</h2><ul>${limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
${historicalLimitations.length ? `<h2>Historical first-cycle notes</h2><p>These describe the earlier review, not the current execution checkpoint.</p><ul>${historicalLimitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
<h2>Coverage</h2><div class="table-scroll"><table id="case-coverage"><thead><tr><th>Case</th><th>Persona</th><th>Status</th><th>Stage</th><th>Evidence</th></tr></thead><tbody>${caseRows}</tbody></table></div>
<h2>Artifact gallery</h2>${gallery ? `<div class="gallery">${gallery}</div>` : "<p>No verified existing image evidence has been recorded.</p>"}
<h2>Findings</h2>${issueHtml}<h2>Case reviews and Q&amp;A</h2>${reviews}<h2>Recorded conversations</h2>${transcripts}</main></body></html>`;
  return { markdown: `${md.join("\n")}\n`, html };
}
