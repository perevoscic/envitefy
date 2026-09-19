import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { assessAppearanceEdit, assertCampaignMayContinue, collectPreviewArtwork, collectRenderedStyleOutcome, readIntakeResponse, selectRejectedArtworkCandidate } from "./create-campaign-browser.mjs";
import { adjudicateCampaignCase, inspectNewGeneration } from "./create-campaign-validation.mjs";

test("only an explicit quality rejection can continue using an accepted, decoded original", () => {
  const original = { ok: true, imageUrl: "/original.webp", artifactSha256: "original", archival: { verification: { decoded: true } } };
  const rejection = { ok: false, qualityCheck: "failed", errors: { image: { code: "image_quality_failed" } } };
  const before = [original];
  const recovery = assessAppearanceEdit({ before, after: [original, rejection] });
  assert.equal(recovery.complete, false);
  assert.equal(recovery.recoverable, true);
  assert.equal(recovery.original, original);
  assert.equal(recovery.rejection, rejection);
  assert.equal(inspectNewGeneration({ before, after: [original, rejection] }).complete, false);
  for (const code of ["budget_exhausted", "insufficient_quota", "harness_interaction", "invalid_source_image"]) {
    assert.equal(assessAppearanceEdit({ before, after: [original, { ...rejection, errors: { image: { code } } }] }).recoverable, false, code);
    assert.equal(assessAppearanceEdit({ before, after: [original, { ...rejection, errors: { ...rejection.errors, other: { code } } }] }).recoverable, false, `mixed ${code}`);
  }
  assert.equal(assessAppearanceEdit({ before, after: before }).recoverable, false);
  assert.equal(assessAppearanceEdit({ before: [], after: [rejection] }).recoverable, false);
  assert.equal(assessAppearanceEdit({ before: [{ ...original, archival: null }], after: [original, rejection] }).recoverable, false);
  assert.equal(assessAppearanceEdit({ before, after: [original, { ok: false }] }).recoverable, false);
  const success = assessAppearanceEdit({ before, after: [original, { ...original, artifactSha256: "edited" }] });
  assert.equal(success.complete, true);
  assert.equal(success.recoverable, false);
  const reviewed = adjudicateCampaignCase({ caseId: "fixture", status: "passed", generations: [original, rejection], checks: { editFailed: true, appearanceEditSucceeded: false }, findings: [{ kind: "product", severity: "high", verified: true, cause: "image_quality_failed" }] });
  assert.equal(reviewed.status, "failed");
  assert.ok(reviewed.validationGaps.includes("two_artwork_operations_not_verified"));
});

test("rejected artwork evidence selects the last complete preview without accepting partials", () => {
  const events = [
    { type: "preview", imageDataUrl: "data:image/png;base64,UEFSVElBTA==", partial: true },
    { type: "preview", imageDataUrl: "data:image/png;base64,RklSU1Q=", partial: false },
    { type: "stage", stage: "repairing" },
    { type: "preview", imageDataUrl: "data:image/png;base64,TEFTVA==", partial: false },
    { type: "complete", result: { ok: false, imageDataUrl: null } },
  ];
  const candidate = selectRejectedArtworkCandidate(events, events.at(-1).result);
  assert.equal(candidate.streamEventIndex, 3);
  assert.equal(candidate.imageDataUrl, "data:image/png;base64,TEFTVA==");
  assert.equal(candidate.candidateOnly, true);
  assert.equal(candidate.unaccepted, true);
  assert.equal(selectRejectedArtworkCandidate(events, { ok: true }), null);
  assert.equal(selectRejectedArtworkCandidate([events[0]], { ok: false }), null);
  assert.equal(inspectNewGeneration({ after: [{ ok: false, rejectedCandidate: { ...candidate, artifactSha256: "candidate-hash" } }] }).complete, false);
});

test("maintenance boundary stops before an action with an explicit harness code", async () => {
  const context = { caseId: "fixture", attemptId: "one", stage: "generation", turnId: "generation" };
  let actionStarted = false;
  await assert.rejects(async () => {
    await assertCampaignMayContinue(async observed => { assert.deepEqual(observed, context); return true; }, context);
    actionStarted = true;
  }, error => error.code === "harness_maintenance" && error.message.includes("before generation"));
  assert.equal(actionStarted, false);
  await assertCampaignMayContinue(async () => false, context);
});

test("intake evidence preserves streamed state and AI provenance", () => {
  const response = readIntakeResponse('event: state\ndata: {"draft":{"title":"Test"}}\n\nevent: assistant_done\ndata: {"assistantMessage":"Ready","usedAi":true}\n\n');
  assert.equal(response.draft.title, "Test");
  assert.equal(response.usedAi, true);
  assert.equal(response.assistantMessage, "Ready");
});

test("preview image verification includes asynchronously mounted event-page iframe content", async () => {
  // A local DOM fixture checks harness mechanics; it is not product evidence.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='36'%3E%3Crect width='24' height='36' fill='purple'/%3E%3C/svg%3E";
    await page.setContent('<div role="dialog"><iframe title="Test — event content" srcdoc="<html><body></body></html>"></iframe></div>');
    await page.locator("iframe").evaluate((frame, imageUrl) => {
      setTimeout(() => { const img = frame.contentDocument.createElement("img"); img.src = imageUrl; frame.contentDocument.body.append(img); }, 100);
    }, image);
    const framed = await collectPreviewArtwork(page.getByRole("dialog"));
    assert.deepEqual(framed.map(({ decoded, width, height, document }) => ({ decoded, width, height, document })), [{ decoded: true, width: 24, height: 36, document: "preview_iframe" }]);
    await page.setContent('<div role="dialog"><img alt="Fixture"></div>');
    await page.locator("img").evaluate((element, imageUrl) => { element.src = imageUrl; }, image);
    const inline = await collectPreviewArtwork(page.getByRole("dialog"));
    assert.equal(inline[0].document, "dialog");
    assert.equal(inline[0].decoded, true);
  } finally {
    await browser.close();
  }
});

test("style transcript captures rendered client status and errors, never the internal intake question", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div role="log"><div class="flex flex-col items-start"><div class="flex items-start"><div>Envitefy</div><div class="rounded-tl-md">How many guests?</div></div></div><div class="flex flex-col items-end"><div class="flex items-start"><div class="whitespace-pre-line rounded-tr-md">Make the background darker</div><div>TC</div></div></div></div><p role="alert">Your previous image is unchanged.</p>');
    const failed = await collectRenderedStyleOutcome(page, "Make the background darker");
    assert.equal(failed.submittedRequestObserved, true);
    assert.deepEqual(failed.messages, []);
    assert.deepEqual(failed.alerts, ["Your previous image is unchanged."]);
    assert.equal(JSON.stringify(failed).includes("How many guests"), false);
    await page.getByRole("alert").evaluate(element => element.remove());
    await page.getByRole("log").evaluate(log => { const status = document.createElement("div"); status.className = "flex flex-col items-start"; status.innerHTML = '<div class="flex items-start"><div>Envitefy</div><div class="rounded-tl-md">I updated the artwork in the draft preview.</div></div>'; log.append(status); });
    const success = await collectRenderedStyleOutcome(page, "Make the background darker");
    assert.deepEqual(success.messages, [{ role: "assistant", text: "I updated the artwork in the draft preview." }]);
    assert.deepEqual(success.alerts, []);
    const absent = await collectRenderedStyleOutcome(page, "Missing turn");
    assert.equal(absent.submittedRequestObserved, false);
    assert.deepEqual(absent.messages, []);
    assert.ok(absent.observedChatTail.length);
    await page.setContent('<div role="log"></div><p role="alert">The artwork was rejected. Your previous image is unchanged.</p>');
    const rejectedWithoutEcho = await collectRenderedStyleOutcome(page, "Missing turn");
    assert.equal(rejectedWithoutEcho.submittedRequestObserved, false);
    assert.deepEqual(rejectedWithoutEcho.messages, []);
    assert.equal(rejectedWithoutEcho.alerts.length, 1);
  } finally {
    await browser.close();
  }
});
