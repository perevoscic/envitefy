import assert from "node:assert/strict";
import test from "node:test";
import {
  adjudicateCampaignCase,
  collectCaseBudgetEvidence,
  diffDraftFacts,
  inspectNewGeneration,
  reviewOfflineFactCase,
} from "./create-campaign-validation.mjs";

const scores = {
  understanding: 4,
  factualAccuracy: 4,
  usefulQuestions: 4,
  qaAccuracy: 4,
  conversationFlow: 4,
  visualFidelity: 4,
  usability: 4,
  completion: 4,
};
const complete = () => ({
  caseId: "anniversary--event_page",
  status: "passed",
  stage: "needs_review",
  scores,
  transcript: [
    { role: "user", text: "Create an anniversary page" },
    { role: "assistant", usedAi: true, text: "Ready" },
  ],
  checks: {
    authenticatedRegularUser: true,
    beforeExplicitSave: {
      before: { creationSessions: 0, events: 0 },
      after: { creationSessions: 0, events: 0 },
      observedDraftWrites: 0,
    },
    explicitSaveWrites: 1,
    resumeFactsPreserved: true,
    resumeArtworkPreserved: true,
    appearanceEditFactsPreserved: true,
    anonymousGuestStatus: 200,
    requiredGuestActionsPassed: true,
    "preview-desktop": {
      horizontalOverflow: false,
      fullScreenOpened: true,
      artwork: [{ decoded: true }],
    },
    "preview-mobile": {
      horizontalOverflow: false,
      fullScreenOpened: true,
      artwork: [{ decoded: true }],
    },
  },
  generations: [
    {
      ok: true,
      imageUrl: "first.webp",
      artifactSha256: "first",
      archival: { verification: { decoded: true } },
    },
    {
      ok: true,
      imageUrl: "second.webp",
      artifactSha256: "second",
      archival: { verification: { decoded: true } },
    },
  ],
  eventId: "event-1",
  publicUrl: "http://localhost/event/event-1",
  findings: [],
});

test("rendered client confirmations are not mistaken for AI replies or model fallback", () => {
  const result = complete();
  result.transcript.push({ role: "assistant", source: "client_status", usedAi: null, text: "Your artwork is updated." });
  assert.equal(adjudicateCampaignCase(result).modelQualityEligible, true);
  result.transcript = result.transcript.filter((turn) => turn.source === "client_status");
  assert.equal(adjudicateCampaignCase(result).modelQualityEligible, false);
});

test("only matching new ledger evidence affects a retry", () => {
  const old = { caseId: "anniversary--event_page", code: "image_bound_unavailable", at: "one" };
  const unrelated = { caseId: "birthday--live_card", code: "budget_exhausted", at: "two" };
  const before = { blocks: [old], reservations: [{ id: "existing", caseId: old.caseId }] };
  const after = {
    blocks: [old, unrelated],
    reservations: [...before.reservations, { id: "new", caseId: old.caseId }],
  };
  assert.deepEqual(collectCaseBudgetEvidence({ before, after, caseId: old.caseId }), {
    blocks: [],
    reservations: [{ id: "new", caseId: old.caseId }],
    journalMismatch: false,
  });
  assert.equal(
    adjudicateCampaignCase(complete(), { ledgerBefore: before, ledgerAfter: after }).status,
    "passed",
  );
});

test("generic generation error caused by gateway gets deferred rather than a product defect", () => {
  const result = {
    ...complete(),
    status: "blocked",
    failure: "generation_failed: No real generated artwork returned",
    findings: [
      { kind: "execution", severity: "high", summary: "No generated artwork" },
      { kind: "product", verified: true, severity: "high", title: "Question overwrote title" },
    ],
  };
  const after = { blocks: [{ caseId: result.caseId, code: "image_bound_unavailable" }] };
  const adjudicated = adjudicateCampaignCase(result, { ledgerAfter: after });
  assert.equal(adjudicated.status, "budget-deferred");
  assert.equal(adjudicated.executionClassification, "campaign_budget");
  assert.equal(adjudicated.findings[0].kind, "infrastructure");
  assert.equal(adjudicated.findings[0].productRegression, false);
  assert.equal(adjudicated.findings[1].kind, "product");
  assert.equal(adjudicated.findings[1].verified, true);
});

test("unsupported models are infrastructure blockers, even when the app falls back successfully", () => {
  const result = { ...complete(), modelFallbacks: 1 };
  const adjudicated = adjudicateCampaignCase(result, {
    ledgerAfter: { blocks: [{ caseId: result.caseId, code: "unsupported_model" }] },
  });
  assert.equal(adjudicated.status, "blocked");
  assert.equal(adjudicated.executionClassification, "infrastructure");
  assert.equal(adjudicated.modelQualityEligible, false);
});

test("provider quota and browser harness failures remain distinct from product defects", () => {
  const quota = adjudicateCampaignCase({
    ...complete(),
    generations: [{ ok: false, errors: { image: { code: "insufficient_quota" } } }],
  });
  assert.equal(quota.executionClassification, "api_quota");
  assert.equal(quota.status, "budget-deferred");
  assert.equal(quota.modelQualityEligible, false);
  for (const code of ["harness_interaction", "guest_isolation_required"]) {
    const harness = adjudicateCampaignCase({ ...complete(), error: { code } });
    assert.equal(harness.executionClassification, "infrastructure");
    assert.equal(harness.status, "blocked");
  }
});

test("silent deterministic fallback and unknown AI provenance cannot count as prompt validation", () => {
  const fallback = complete();
  fallback.transcript[1].usedAi = false;
  const result = adjudicateCampaignCase(fallback);
  assert.equal(result.status, "incomplete");
  assert.equal(result.modelQualityEligible, false);
  assert.equal(result.promptQualityStatus, "not_evaluated");
  const unknown = complete();
  delete unknown.transcript[1].usedAi;
  assert.equal(adjudicateCampaignCase(unknown).modelQualityEligible, false);
});

test("user's party budget and generic errors do not imply campaign budget failure", () => {
  const result = {
    ...complete(),
    status: "blocked",
    failure: "The page lost my $500 party budget",
  };
  assert.equal(adjudicateCampaignCase(result).status, "blocked");
  assert.equal(adjudicateCampaignCase(result).executionClassification, "unclassified");
});

test("a missing appearance generation or unverified resume/actions prevents a pass", () => {
  const result = complete();
  result.generations.pop();
  delete result.checks.resumeFactsPreserved;
  delete result.checks.requiredGuestActionsPassed;
  const reviewed = adjudicateCampaignCase(result);
  assert.equal(reviewed.status, "incomplete");
  assert.ok(reviewed.validationGaps.includes("two_artwork_operations_not_verified"));
  assert.ok(reviewed.validationGaps.includes("resumed_facts_not_verified"));
  assert.ok(reviewed.validationGaps.includes("guest_actions_not_verified"));
});

test("reported full journeys must preserve facts and artwork and display distinct verified assets", () => {
  const result = complete();
  result.checks.resumeArtworkPreserved = false;
  result.checks.appearanceEditFactsPreserved = false;
  result.generations[1].artifactSha256 = "first";
  result.checks["preview-mobile"].fullScreenOpened = false;
  const reviewed = adjudicateCampaignCase(result);
  assert.equal(reviewed.status, "incomplete");
  for (const gap of [
    "resumed_artwork_not_verified",
    "appearance_edit_facts_not_verified",
    "distinct_artwork_not_verified",
    "rendered_artwork_preview_not_verified",
  ])
    assert.ok(reviewed.validationGaps.includes(gap));
  result.findings.push({
    kind: "product",
    verified: true,
    severity: "high",
    title: "Lost approved event facts",
  });
  assert.equal(adjudicateCampaignCase(result).status, "failed");
});

test("automatic saves and missing scores cannot pass; unreviewed journeys are never promoted", () => {
  const autosaved = complete();
  autosaved.checks.beforeExplicitSave.after.events = 1;
  assert.equal(adjudicateCampaignCase(autosaved).status, "incomplete");
  assert.equal(adjudicateCampaignCase({ ...complete(), scores: null }).status, "incomplete");
  assert.equal(
    adjudicateCampaignCase({ ...complete(), status: "unreviewed" }).status,
    "unreviewed",
  );
  assert.equal(
    adjudicateCampaignCase({ ...complete(), scores: { ...scores, factualAccuracy: 2 } }).status,
    "failed",
  );
});

test("ledger mismatch blocks further model-quality claims", () => {
  const result = adjudicateCampaignCase(complete(), {
    ledgerBefore: { blocks: [{ at: "before" }] },
    ledgerAfter: { blocks: [] },
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.modelQualityEligible, false);
});

test("appearance completion requires a new successful artifact rather than prior output", () => {
  const previous = [{ ok: true, imageUrl: "same.webp" }];
  assert.equal(
    inspectNewGeneration({ before: previous, after: previous }).reason,
    "no_new_generation",
  );
  assert.equal(
    inspectNewGeneration({ before: previous, after: [...previous, { ok: false }] }).reason,
    "new_generation_failed_or_missing_artifact",
  );
  assert.equal(
    inspectNewGeneration({ before: previous, after: [...previous, ...previous] }).reason,
    "stale_generation_reused",
  );
  assert.equal(
    inspectNewGeneration({
      before: previous,
      after: [...previous, { ok: true, imageUrl: "new.webp" }],
    }).complete,
    true,
  );
});

test("offline Q&A fact mutations are checked separately from unchanged style facts", () => {
  const before = {
    title: "Anniversary",
    location: "Garden",
    previewCopy: { headline: "Anniversary" },
  };
  const after = {
    ...before,
    title: "Can the page show two locations?",
    previewCopy: { headline: "Can the page show two locations?" },
  };
  const scenario = {
    id: "anniversary--event_page",
    messages: [{ kind: "question", text: "Can the page show two locations?" }],
  };
  const result = {
    snapshots: [
      { kind: "answer", draft: before },
      { kind: "question", draft: after },
    ],
    finalDraft: after,
    passed: true,
  };
  const review = reviewOfflineFactCase(scenario, result);
  assert.equal(review.passed, false);
  assert.equal(review.modelQualityEligible, false);
  assert.deepEqual(
    review.findings.map((finding) => finding.detail.field),
    ["title", "previewCopy"],
  );
  assert.ok(review.findings.every((finding) => finding.verified && finding.stage === "question"));
  assert.equal(diffDraftFacts(before, after, { allowChanges: ["title", "previewCopy"] }).length, 0);
});
