import assert from "node:assert/strict";
import test from "node:test";
import { renderCampaignReport, reviewScenarioFacts, summarizeCampaignCoverage } from "./create-campaign-report.mjs";
import { buildCampaignScenarios } from "./create-campaign-scenarios.mjs";

const manifest = { runId: "fixture", cases: buildCampaignScenarios(), budgetUsd: 10 };
test("coverage separates completed review from the original browser needs-review checkpoint", () => {
  const report = renderCampaignReport(manifest, [{
    caseId: manifest.cases[0].id, status: "failed", stage: "needs_review", reviewRequired: false,
    scores: Object.fromEntries(["understanding", "factualAccuracy", "usefulQuestions", "qaAccuracy", "conversationFlow", "visualFidelity", "usability", "completion"].map(key => [key, 2])),
    findings: [{ id: "copy-lost", title: "Required copy is missing", fixed: false, verified: true, kind: "product" }],
  }], {}, { review: { verifiedFixes: { "copy-lost": "A previous unit-level copy guard passed." } } });
  assert.match(report.html, /Review completion/);
  assert.match(report.html, /Complete/);
  assert.match(report.html, /Awaiting review \(original browser checkpoint\)/);
  assert.match(report.html, /class="status failed">failed/);
  assert.doesNotMatch(report.markdown, /fixed.*Required copy is missing/);
  assert.match(report.markdown, /Historical scoped verification/);
});
test("additional authorization reports only new spending without resetting prior cost", () => {
  const report = renderCampaignReport(manifest, [], {
    budgetUsd: 59.245399873, spentUsd: 34.245399873, reservedUsd: 1,
  }, { funding: { startingSpentUsd: 29.245399873, additionalBudgetUsd: 30 } });
  for (const output of [report.markdown, report.html]) {
    assert.match(output, /Latest authorization: \$30\.0000 in additional API cost/);
    assert.match(output, /Prior recorded cost: \$29\.2454/);
    assert.match(output, /Recorded cost since authorization: \$5\.0000/);
    assert.match(output, /Remaining new allowance after reservations: \$24\.0000/);
  }
  const missing = renderCampaignReport(manifest, [], {}, {
    funding: { startingSpentUsd: 29.245399873, additionalBudgetUsd: 30 },
  });
  assert.match(missing.markdown, /Recorded cost since authorization: unavailable/);
});

test("all attempted combinations does not claim passing or incomplete execution coverage", () => {
  const results = manifest.cases.map(scenario => ({
    caseId: scenario.id, status: "failed", attemptId: "attempt", scope: "complete_journey", startedAt: "2026-09-19T00:00:00.000Z", transcript: [{ role: "user", text: "Create" }],
  }));
  const report = renderCampaignReport(manifest, results);
  assert.match(report.markdown, /Every combination has a recorded live attempt; quality checks remain unresolved/);
  assert.doesNotMatch(report.markdown, /Coverage is incomplete/);
  assert.match(report.markdown, /0 of 93 combinations passed/);
});

const reviewed = () => ({
  status: "passed",
  stage: "reviewed",
  scores: {
    understanding: 4,
    factualAccuracy: 4,
    usefulQuestions: 4,
    qaAccuracy: 4,
    conversationFlow: 4,
    visualFidelity: 4,
    usability: 4,
    completion: 4,
  },
  transcript: [{ role: "assistant", usedAi: true, text: "Ready" }],
  checks: {
    authenticatedRegularUser: true,
    beforeExplicitSave: { before: { events: 0 }, after: { events: 0 }, observedDraftWrites: 0 },
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
  eventId: "event-1",
  publicUrl: "http://localhost/event/event-1",
  generations: [
    {
      ok: true,
      imageUrl: "first.webp",
      artifactSha256: "a".repeat(64),
      archival: { verification: { decoded: true } },
    },
    {
      ok: true,
      imageUrl: "second.webp",
      artifactSha256: "b".repeat(64),
      archival: { verification: { decoded: true } },
    },
  ],
});

test("report retains all 93 cells and does not invent scores or cost values", () => {
  const report = renderCampaignReport(manifest);
  assert.match(report.markdown, /0 of 93 combinations passed/);
  assert.match(report.markdown, /untested: 93/);
  assert.match(report.markdown, /Recorded API cost: unavailable/);
  assert.match(report.markdown, /Understanding: unrated/);
  assert.doesNotMatch(report.html, /<img /);
  for (const scenario of manifest.cases)
    assert.ok(report.markdown.includes(scenario.id.replaceAll("_", "\\_")));
});

test("intake-only completion is incomplete and statuses remain distinguishable", () => {
  const results = [
    {
      caseId: manifest.cases[0].id,
      status: "saveable",
      stage: "intake-complete",
      scores: { understanding: 4, factualAccuracy: 0 },
    },
    { caseId: manifest.cases[1].id, status: "budget-deferred", stage: "generation" },
    { caseId: manifest.cases[2].id, status: "blocked", stage: "authentication" },
    { caseId: manifest.cases[3].id, status: "failed", stage: "guest-view" },
  ];
  const report = renderCampaignReport(manifest, results, {
    budgetUsd: 10,
    spentUsd: 2,
    reservedUsd: 1,
  });
  assert.match(report.markdown, /incomplete: 1/);
  assert.match(report.markdown, /budget-deferred: 1/);
  assert.match(report.markdown, /blocked: 1/);
  assert.match(report.markdown, /failed: 1/);
  assert.match(report.markdown, /untested: 89/);
  assert.match(report.markdown, /Available after reservations: \$7\.0000/);
  assert.match(report.markdown, /Understanding: 4 · Factual accuracy: unrated/);
});

test("gallery includes only supplied verified images and escapes data and local paths", () => {
  const report = renderCampaignReport({ ...manifest, runId: '<script>alert("x")</script>' }, [
    {
      caseId: manifest.cases[0].id,
      status: "failed",
      stage: "<script>bad</script>",
      evidence: [
        {
          kind: "generated",
          path: 'cases/a/final "card".webp',
          exists: true,
          caption: "<img onerror=bad>",
        },
        { kind: "screenshot", path: "cases/a/missing.png", exists: false },
        { kind: "generated", path: "javascript:alert(1)", exists: true },
        { kind: "generated", path: "../private.png", exists: true },
        { kind: "generated", path: "https://example.com/remote.png", exists: true },
        { kind: "generated", path: "cases/%2e%2e/private.png", exists: true },
        "cases/a/transcript.json",
      ],
      qaResults: [
        {
          question: "<script>q</script>",
          answer: "<b>fake</b>",
          expectedBehavior: "Honest answer",
          verdict: "failed",
        },
      ],
      findings: [{ title: "<script>finding</script>", verified: true, severity: "high" }],
    },
  ]);
  assert.equal((report.html.match(/<img loading=/g) ?? []).length, 1);
  assert.match(report.html, /cases\/a\/final%20%22card%22\.webp/);
  assert.doesNotMatch(report.html, /<script>|javascript:|https:\/\/example\.com|\.\.\/private/);
  assert.match(report.html, /&lt;script&gt;q&lt;\/script&gt;/);
  assert.match(report.html, /existence unverified/);
  assert.match(report.html, /Verified defect/);
});

test("object results are supported and full validation requires exactly all 93 cases passed", () => {
  const results = Object.fromEntries(manifest.cases.map((scenario) => [scenario.id, reviewed()]));
  assert.match(
    renderCampaignReport(manifest, results).markdown,
    /All 93 combinations are reported passed/,
  );
  delete results[manifest.cases[0].id];
  assert.match(renderCampaignReport(manifest, results).markdown, /92 of 93 combinations passed/);
  assert.match(
    renderCampaignReport({ cases: manifest.cases.slice(1) }, results).markdown,
    /Coverage is incomplete/,
  );
  assert.throws(
    () => renderCampaignReport({ cases: [manifest.cases[0], manifest.cases[0]] }),
    /Duplicate/,
  );
});

test("claimed passes without artwork review or guest evidence remain incomplete", () => {
  const noGuest = reviewed();
  delete noGuest.checks.requiredGuestActionsPassed;
  delete noGuest.checks.anonymousGuestStatus;
  const noReview = reviewed();
  noReview.scores.visualFidelity = null;
  const report = renderCampaignReport(manifest, [
    { ...noGuest, caseId: manifest.cases[0].id },
    { ...noReview, caseId: manifest.cases[1].id },
    { caseId: manifest.cases[2].id, status: "passed", stage: "reviewed" },
  ]);
  assert.match(report.markdown, /0 of 93 combinations passed/);
  assert.match(report.markdown, /incomplete: 3/);
  assert.match(report.markdown, /guest\\_actions\\_not\\_verified/);
  assert.match(report.html, /Still unverified:.*guest_actions_not_verified/);
  assert.match(report.markdown, /Visual fidelity: unrated/);
});

test("execution checkpoint records the exact stop and does not mistake API quota for the campaign target", () => {
  const report = renderCampaignReport(
    manifest,
    [],
    { budgetUsd: 10, spentUsd: 2, reservedUsd: 0.5 },
    {
      execution: {
        status: "stopped",
        stopReason: {
          kind: "api_quota",
          code: "insufficient_quota",
          message: "Provider rejected the next generation <script>",
        },
        lastCaseId: "birthday--live_card",
        lastStage: "appearance_generation",
        lastTurn: { index: 5, id: "style-1", kind: "style_edit", role: "user" },
        nextCaseId: "field_trip--event_page",
        attemptedCaseIds: ["birthday--live_card"],
        completedCaseIds: [],
        remainingCaseIds: ["birthday--live_card", "field_trip--event_page"],
        checkpointAt: "2026-09-18T23:00:00Z",
        stoppedAt: "2026-09-18T23:00:01Z",
        budget: { billedUsd: 1.9 },
        evidence: [
          { kind: "execution checkpoint", path: "execution.json", exists: true },
          { kind: "prior report", path: "archive/report 1.html", exists: true },
        ],
      },
    },
  );
  assert.match(report.html, /Provider API quota or account limit/);
  assert.match(report.html, /does not establish that the campaign budget was exhausted/);
  assert.match(
    report.html,
    /Last case: birthday--live_card\. Stage: appearance_generation\. Turn: index 5 · style-1 · style_edit · user/,
  );
  assert.match(
    report.html,
    /Remaining execution queue: 2 — birthday--live_card, field_trip--event_page/,
  );
  assert.match(
    report.html,
    /Recorded API cost: \$2\.0000\. Cost from reported usage \(subtotal\): \$1\.9000\. Reserved: \$0\.5000/,
  );
  assert.match(report.html, /Available after reservations: \$7\.5000/);
  assert.match(report.html, /href="archive\/report%201\.html"/);
  assert.match(report.html, /&lt;script&gt;/);
  assert.doesNotMatch(report.html, /<script>/);
});

test("campaign budget, infrastructure, and completed batches retain distinct explanations", () => {
  for (const [kind, explanation] of [
    ["campaign_budget", /Campaign spending limit or reservation policy/],
    ["infrastructure", /Infrastructure blocker/],
    ["completed", /requested execution batch finished/],
  ]) {
    const report = renderCampaignReport(
      manifest,
      [],
      {},
      { execution: { status: "completed", stopReason: { kind }, remainingCaseIds: [] } },
    );
    assert.match(report.html, explanation);
    assert.match(report.html, /0 of 93 combinations passed/);
    assert.match(report.html, /Remaining execution queue: 0/);
    assert.match(report.html, /Cost from reported usage \(subtotal\): unavailable/);
    assert.match(report.html, /Turn: unavailable/);
  }
});

test("the stopping API request is recorded separately from a later guest UI checkpoint", () => {
  const report = renderCampaignReport(
    manifest,
    [],
    {},
    {
      execution: {
        status: "stopped",
        lastCaseId: "birthday--live_card",
        lastStage: "guest_actions",
        lastTurn: { id: "guest-rsvp", kind: "guest" },
        checkpointAt: "2026-09-18T23:02:00Z",
        stopReason: {
          kind: "campaign_budget",
          code: "metered_target_reached",
          stoppingRequest: {
            caseId: "birthday--live_card",
            turnId: "style_edit",
            model: "image-model-fixture",
            endpoint: "/v1/images/edits",
            reservationId: "reservation-7",
            at: "2026-09-18T23:00:00Z",
            code: "metered_target_reached",
            providerCode: "fixture<script>",
          },
        },
      },
    },
  );
  assert.match(
    report.html,
    /Stopping API request: case birthday--live_card\. Turn ID: style_edit\. Model: image-model-fixture\. Endpoint: \/v1\/images\/edits/,
  );
  assert.match(
    report.html,
    /Stopping request reservation: reservation-7\. Request timestamp: 2026-09-18T23:00:00Z\. Code: metered_target_reached\. Provider code: fixture&lt;script&gt;/,
  );
  assert.match(
    report.html,
    /Last UI checkpoint\. Last case: birthday--live_card\. Stage: guest_actions\. Turn: guest-rsvp · guest/,
  );
  assert.match(report.markdown, /stages completed after the stopping API request/);
  assert.doesNotMatch(report.html, /<script>/);
  const missing = renderCampaignReport(
    manifest,
    [],
    {},
    {
      execution: {
        lastCaseId: "birthday--live_card",
        lastTurn: { id: "guest-rsvp" },
        stopReason: { kind: "api_quota", stoppingRequest: {} },
      },
    },
  );
  assert.match(missing.html, /Stopping API request: case unavailable\. Turn ID: unavailable/);
});

test("current limits supersede historical notes without losing prior evidence", () => {
  const report = renderCampaignReport(
    manifest,
    [],
    {},
    {
      review: {
        limitations: ["Only six conversations were run; no artwork."],
        evidence: [{ kind: "original review", path: "archive/review.json", exists: true }],
      },
      execution: {
        currentLimitations: ["Artwork awaits visual review."],
        checkpoint: {
          caseId: "wedding--event_page",
          stage: "generation",
          turn: { index: 4 },
          at: "checkpoint-time",
        },
        evidence: [{ kind: "bad", path: "../private.json", exists: true }],
      },
    },
  );
  assert.match(report.markdown, /## Limits of this run\n\n- Artwork awaits visual review/);
  assert.match(report.markdown, /## Historical first-cycle notes[\s\S]*Only six conversations/);
  assert.match(report.html, /href="archive\/review\.json"/);
  assert.match(report.html, /Last case: wedding--event_page\. Stage: generation\. Turn: index 4/);
  assert.doesNotMatch(report.html, /private\.json/);
});

function suppliedFactFixture(category = "birthday") {
  const scenario = manifest.cases.find((item) => item.category === category);
  const facts = scenario.initialFacts;
  // All fixtures are in November or earlier unless the caller supplies its own ISO.
  const timezoneOffset = facts.date < "2026-11-01" ? "-05:00" : "-06:00";
  const draft = {
    title: "A reasonable alternate title",
    eventType: "general",
    startISO: new Date(`${facts.date}T${facts.startTime}:00${timezoneOffset}`).toISOString(),
    endISO: new Date(`${facts.date}T${facts.endTime}:00${timezoneOffset}`).toISOString(),
    timezone: facts.timezone,
    venue: facts.location.split(",")[0],
    location: facts.location.split(",").slice(1).join(",").trim(),
    previewCopy: { body: (facts.approvedCopy || []).join("\n") },
  };
  const transcript = scenario.messages
    .filter((message) => ["opening", "answer"].includes(message.kind))
    .map((message) => ({ role: "user", ...message }));
  return { scenario, result: { finalDraft: draft, transcript } };
}

test("fact review uses supplied facts, accepts split venue/address, and never grades hidden category/title labels", () => {
  const { scenario, result } = suppliedFactFixture("baby_shower");
  const review = reviewScenarioFacts(scenario, result);
  assert.equal(review.status, "checked");
  assert.equal(review.checks.filter((check) => check.status === "failed").length, 0);
  assert.equal(
    review.checks.some((check) => ["eventType", "category", "title"].includes(check.field)),
    false,
  );
  assert.ok(review.unreviewed.includes("rendered_artwork"));
  assert.equal(review.scores, undefined);
});

test("exact copy in conversation memory or theme does not count as guest-facing wording", () => {
  const { scenario, result } = suppliedFactFixture();
  const text = result.finalDraft.previewCopy.body;
  result.finalDraft.previewCopy.body = "Join us!";
  result.finalDraft.theme = text;
  result.finalDraft.conversationState = { sourceText: text };
  const review = reviewScenarioFacts(scenario, result);
  assert.equal(review.status, "issues_found");
  assert.equal(
    review.checks.filter((check) => check.field === "exactCopy" && check.status === "failed")
      .length,
    2,
  );
  assert.ok(
    review.checks
      .find((check) => check.field === "exactCopy")
      .evidence[0].text.includes("Ready, set, celebrate!"),
  );
});

test("planned future corrections and unsupplied answer facts are not graded", () => {
  const { scenario, result } = suppliedFactFixture();
  result.transcript = result.transcript.filter((turn) => turn.kind === "opening");
  result.finalDraft.endISO = null;
  result.finalDraft.timezone = null;
  const review = reviewScenarioFacts(scenario, result);
  assert.equal(review.checks.find((check) => check.field === "location").status, "passed");
  assert.equal(review.checks.find((check) => check.field === "endTime").status, "not_observed");
  assert.equal(review.checks.find((check) => check.field === "timezone").status, "not_observed");
  assert.equal(review.status, "checked");
  assert.equal(
    reviewScenarioFacts(scenario, { finalDraft: result.finalDraft }).status,
    "not_reviewed",
  );
});

test("delivered return correction is checked against the new end while start stays intact", () => {
  const { scenario, result } = suppliedFactFixture("field_trip");
  result.transcript.push({
    role: "user",
    ...scenario.messages.find((message) => message.kind === "correction"),
  });
  const before = reviewScenarioFacts(scenario, result);
  assert.equal(before.checks.find((check) => check.field === "endTime").status, "failed");
  assert.equal(before.checks.find((check) => check.field === "startTime").status, "passed");
  result.finalDraft.endISO = `${scenario.facts.date}T21:00:00.000Z`;
  assert.equal(reviewScenarioFacts(scenario, result).status, "checked");
});

test("unplanned corrections abstain from grading against stale scenario facts", () => {
  const { scenario, result } = suppliedFactFixture();
  result.transcript.push({ role: "user", kind: "correction", text: "Move it to Friday at noon." });
  const review = reviewScenarioFacts(scenario, result);
  assert.equal(review.status, "not_reviewed");
  assert.deepEqual(review.checks, []);
  assert.match(review.reason, /unplanned correction/);
});

test("offline success and partial transcripts never become live passes", () => {
  const report = renderCampaignReport(
    manifest,
    [
      {
        caseId: manifest.cases[0].id,
        status: "incomplete",
        transcript: [{ role: "user", kind: "question", text: "Can <script> change my address?" }],
        findings: [{ summary: "Blocked by guard", kind: "infrastructure" }],
      },
    ],
    {},
    {
      offline: { count: 93, appearancePreservationPassed: 93, conversationPreservationPassed: 93 },
      baseline: { count: 93, conversationPreservationPassed: 62, appearancePreservationPassed: 93 },
      review: {
        limitations: ["No artwork was generated."],
        findings: [
          {
            title: "Question changed title",
            detail: { before: "Party", after: "Question" },
            fixed: true,
            verified: true,
          },
        ],
      },
    },
  );
  assert.match(report.markdown, /0 of 93 combinations passed/);
  assert.match(report.markdown, /93\/93 preserve facts/);
  assert.match(report.markdown, /62\/93 capability-question/);
  assert.match(report.html, /No artwork was generated/);
  assert.match(report.html, /Blocked by guard/);
  assert.match(report.html, /before.*Party.*after.*Question/);
  assert.match(report.html, /Can &lt;script&gt;/);
  assert.doesNotMatch(report.html, /<script>/);
});

test("coverage counts actual latest browser milestones separately from quality and parser passes", () => {
  const ids = ["birthday--live_card", "birthday--digital_flyer", "wedding--event_page", "anniversary--live_card", "baby_shower--digital_flyer", "gender_reveal--live_card", "field_trip--event_page"];
  const scenarios = ids.map(id => manifest.cases.find(scenario => scenario.id === id));
  const live = (caseId, extra = {}) => ({ caseId, attemptId: "attempt-1", startedAt: "2026-09-19T04:00:00Z", scope: "complete_journey", status: "incomplete", transcript: [{ role: "user", text: "Please create my event" }], ...extra });
  const artwork = (hash, phase = "generation") => ({ ok: true, phase, artifactSha256: hash, archival: { verification: { decoded: true } } });
  const guestChecks = { anonymousGuestStatus: 200, anonymousSession: true, publicRoutePreserved: true, noOwnerControls: true, mobileOverflow: false, directions: true, calendar: true, rsvp: true, requiredGuestActionsPassed: true };
  const results = [
    live(ids[0], { generations: [artwork("original"), artwork("edited", "style_edit")], creationSessionId: "saved-1", eventId: "published-1", publicUrl: "http://localhost/card/published-1", checks: { explicitSaveWrites: 1, resumeFactsPreserved: true, resumeArtworkPreserved: true, requiredGuestActionsPassed: false }, guest: { mode: "local_anonymous_ui", checks: { ...guestChecks, calendar: false, requiredGuestActionsPassed: false } } }),
    live(ids[1], { generations: [{ ok: false, rejectedCandidate: { ...artwork("unaccepted"), candidateOnly: true } }] }),
    live(ids[2], { generations: [artwork("same"), artwork("same", "style_edit")], creationSessionId: "saved-2", eventId: "published-1", publicUrl: "http://localhost/event/published-1", checks: { explicitSaveWrites: 1, resumeFactsPreserved: true, resumeArtworkPreserved: false, requiredGuestActionsPassed: true }, guest: { mode: "local_anonymous_ui", checks: guestChecks } }),
    live(ids[3], { stage: "authentication", transcript: [] }),
    live(ids[4], { mode: "deterministic_only", generations: [artwork("offline")] }),
    { caseId: ids[5], transcript: [{ role: "user", text: "A planned prompt is not a browser attempt" }] },
    live(ids[6], { guest: { mode: "local_anonymous_ui", checks: {} } }),
    live("outside-manifest", { generations: [artwork("irrelevant")] }),
  ];
  assert.deepEqual(summarizeCampaignCoverage(scenarios, results), {
    totalFamilies: 6, totalCases: 7, familiesWithLiveUserTurns: 3, casesAttemptedLive: 5,
    casesWithAcceptedInitialArtwork: 2, casesWithSuccessfulDistinctEdits: 1,
    casesWithVerifiedSaveResume: 1, publishedEventIds: 1,
    anonymousGuestJourneysExercised: 2, completePassingGuestChecks: 1,
  });
  const report = renderCampaignReport({ cases: scenarios }, results, { spentUsd: 2.25 });
  assert.match(report.markdown, /\| Families with live user turns \| 3 \/ 6 \|/);
  assert.match(report.markdown, /\| Cases with successful distinct edits \| 1 \|/);
  assert.match(report.html, /Complete passing guest checks<\/td><td>1<\/td>/);
  assert.match(report.markdown, /0 of 7 combinations passed/);
  assert.match(report.html, /execution milestones, not quality passes/);
  assert.match(report.html, /Recorded API cost: \$2\.2500/);
  assert.match(report.html, /may include conservative usage bounds/);
  const replaced = summarizeCampaignCoverage(scenarios, [...results, live(ids[0], { attemptId: "later-attempt", transcript: [] })]);
  assert.equal(replaced.casesAttemptedLive, 5, "retries do not add matrix cases");
  assert.equal(replaced.casesWithAcceptedInitialArtwork, 1, "only latest provided attempt contributes milestones");
});

test("recommendations come only from supplied review data, retain priority order, and escape content", () => {
  const audit = { review: { recommendations: [
    { priority: "P2", title: "Later fix", detail: "Preserve existing behavior." },
    { priority: "P0", title: "First <script>", detail: "Evidence: <img onerror=bad>" },
    { priority: "P1", title: "Second fix", detail: "Use the recorded rejection." },
  ], evidence: [{ kind: "prior attempt", path: "archive/prior-result.json", exists: true }] } };
  const original = JSON.stringify(audit);
  const report = renderCampaignReport(manifest, [], {}, audit);
  assert.match(report.markdown, /## Prioritized recommendations/);
  assert.ok(report.html.indexOf("First &lt;script&gt;") < report.html.indexOf("Second fix"));
  assert.ok(report.html.indexOf("Second fix") < report.html.indexOf("Later fix"));
  assert.match(report.html, /Evidence: &lt;img onerror=bad&gt;/);
  assert.match(report.html, /href="archive\/prior-result\.json"/);
  assert.doesNotMatch(report.html, /<script>|<img onerror/);
  assert.match(report.markdown, /untested: 93/);
  assert.equal(JSON.stringify(audit), original, "rendering never edits historical review data");
  assert.doesNotMatch(renderCampaignReport(manifest).html, /Prioritized recommendations/);
});
