import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { BUDGET_BOUND_AUDIT, BudgetLedger, classifyBudgetRequest, classifyProviderFailure, createBudgetGateway, estimateFlareOutputTokens, inspectBudgetRequest, reconcileChatUsage, reconcileImageUsage } from "./create-campaign-budget.mjs";
test("approved fifteen-to-thirty transition preserves metered spend and resumes durably", async (t) => {
  const ledgerPath = await temp(t);
  const first = await BudgetLedger.open({ ledgerPath, budgetUsd: 15, budgetPolicy: "metered" });
  const id = await first.reserve({ maximumUsd: 1, phase: "baseline" });
  await first.settle(id, { costUsd: 0.621062511, usage });
  await first.close();
  await assert.rejects(BudgetLedger.open({ ledgerPath, budgetUsd: 30, budgetPolicy: "metered" }), { code: "ledger_budget_increase_required" });
  const next = await BudgetLedger.open({ ledgerPath, budgetUsd: 30, budgetPolicy: "metered", allowBudgetIncrease: true, budgetIncreaseReason: "User explicitly approved $30 total and said Resume" });
  assert.equal(next.snapshot().spentUsd, 0.621062511);
  assert.equal(next.snapshot().budgetUsd, 30);
  assert.equal(next.snapshot().budgetPolicy, "metered");
  assert.equal(next.snapshot().budgetChanges[0].previousBudgetNanos, 15000000000);
  assert.equal(next.snapshot().budgetChanges[0].budgetNanos, 30000000000);
  await next.close();
  const resumed = await BudgetLedger.open({ ledgerPath, budgetUsd: 30, budgetPolicy: "metered" });
  assert.equal(resumed.snapshot().spentUsd, 0.621062511);
  assert.equal(resumed.snapshot().budgetChanges.length, 1);
  await resumed.close();
});
test("fresh additional thirty-dollar allowance keeps prior charges and gives exactly thirty remaining", async (t) => {
  const ledgerPath = await temp(t);
  const first = await BudgetLedger.open({ ledgerPath, budgetUsd: 30, budgetPolicy: "metered" });
  const id = await first.reserve({ maximumUsd: 29.3, caseId: "prior-campaign", phase: "baseline" });
  await first.settle(id, { costUsd: 29.245399873, usage });
  await first.close();
  const previous = await readFile(ledgerPath, "utf8");
  const target = 59.245399873;
  const reason = "User approved an additional $30 to finish remaining 44 of 93 cases; cumulative target is prior recorded spend $29.245399873 plus $30.";
  await assert.rejects(BudgetLedger.open({ ledgerPath, budgetUsd: target, budgetPolicy: "metered" }), { code: "ledger_budget_increase_required" });
  assert.equal(await readFile(ledgerPath, "utf8"), previous);
  const next = await BudgetLedger.open({ ledgerPath, budgetUsd: target, budgetPolicy: "metered", allowBudgetIncrease: true, budgetIncreaseReason: reason });
  assert.equal(next.snapshot().budgetUsd, target);
  assert.equal(next.snapshot().spentUsd, 29.245399873);
  assert.equal(next.snapshot().remainingUsd, 30);
  assert.equal(next.snapshot().reservedUsd, 0);
  assert.equal(next.snapshot().budgetChanges[0].reason, reason);
  assert.ok((await readFile(ledgerPath, "utf8")).startsWith(previous));
  await next.close();
  const resumed = await BudgetLedger.open({ ledgerPath, budgetUsd: target, budgetPolicy: "metered" });
  assert.equal(resumed.snapshot().remainingUsd, 30);
  assert.equal(resumed.snapshot().budgetChanges.length, 1);
  await resumed.close();
});
test("authorized ten-to-fifteen transition preserves spend and phase allocations without resetting history", async (t) => {
  const ledgerPath = await temp(t);
  const first = await BudgetLedger.open({ ledgerPath });
  const id = await first.reserve({ maximumUsd: 1 });
  await first.settle(id, { costUsd: 0.210686508, usage });
  const before = first.snapshot();
  await first.close();
  const original = await readFile(ledgerPath, "utf8");
  for (const options of [{}, { allowBudgetIncrease: true }, { allowBudgetIncrease: true, budgetIncreaseReason: " " }, { allowBudgetIncrease: "true", budgetIncreaseReason: "User approved" }]) {
    await assert.rejects(BudgetLedger.open({ ledgerPath, budgetUsd: 15, ...options }), { code: "ledger_budget_increase_required" });
    assert.equal(await readFile(ledgerPath, "utf8"), original);
  }
  await assert.rejects(BudgetLedger.open({ ledgerPath, budgetUsd: 15, allowBudgetIncrease: true, budgetIncreaseReason: "User approved $15", budgetPolicy: "metered" }), { code: "ledger_policy_changed" });
  assert.equal(await readFile(ledgerPath, "utf8"), original);
  const next = await BudgetLedger.open({ ledgerPath, budgetUsd: 15, allowBudgetIncrease: true, budgetIncreaseReason: "User explicitly approved $15", budgetPolicy: "metered", allowPolicyTransition: true });
  assert.equal(next.snapshot().budgetUsd, 15);
  assert.equal(next.snapshot().spentUsd, 0.210686508);
  assert.deepEqual(next.snapshot().phases, before.phases);
  assert.deepEqual(next.snapshot().reservations, JSON.parse(JSON.stringify(before.reservations)));
  assert.equal(next.snapshot().phaseLimitsEnforced, false);
  assert.equal(next.snapshot().budgetChanges[0].previousBudgetNanos, 10000000000);
  assert.equal(next.snapshot().budgetChanges[0].budgetNanos, 15000000000);
  assert.equal(next.snapshot().budgetChanges[0].reason, "User explicitly approved $15");
  await next.close();
  const resumed = await BudgetLedger.open({ ledgerPath, budgetUsd: 15, budgetPolicy: "metered" });
  assert.equal(resumed.snapshot().spentUsd, 0.210686508);
  assert.equal(resumed.snapshot().budgetChanges.length, 1);
  const pooled = await resumed.reserve({ maximumUsd: 11, phase: "baseline" });
  await resumed.settle(pooled, { costUsd: 0, usage });
  await resumed.close();
  await assert.rejects(BudgetLedger.open({ ledgerPath, budgetUsd: 10, budgetPolicy: "metered", allowBudgetIncrease: true, budgetIncreaseReason: "Reduction is not an increase" }), { code: "ledger_budget_increase_required" });
});

test("approved increase clears only a reached-target halt and retains measured overrun", async (t) => {
  const ledgerPath = await temp(t);
  const first = await BudgetLedger.open({ ledgerPath, budgetPolicy: "metered" });
  const id = await first.reserve({ maximumUsd: 1, caseId: "case-one", turnId: "artwork" });
  await first.settle(id, { costUsd: 10.1, usage });
  assert.equal(first.snapshot().haltInfo.code, "campaign_target_reached");
  await first.close();
  const next = await BudgetLedger.open({ ledgerPath, budgetUsd: 15, budgetPolicy: "metered", allowBudgetIncrease: true, budgetIncreaseReason: "User approved $15 total" });
  assert.equal(next.snapshot().spentUsd, 10.1);
  assert.equal(next.snapshot().remainingUsd, 4.9);
  assert.equal(next.snapshot().haltInfo, null);
  assert.equal(next.snapshot().halted, null);
  assert.equal(next.snapshot().reservations[0].chargedNanos, 10100000000);
  await next.close();
  const resumed = await BudgetLedger.open({ ledgerPath, budgetUsd: 15, budgetPolicy: "metered" });
  assert.equal(resumed.snapshot().halted, null);
  await resumed.close();
});

test("budget increase cannot clear quota or uncertain-charge halts", async (t) => {
  for (const code of ["api_quota", "uncertain_usage"]) {
    const ledgerPath = await temp(t);
    const first = await BudgetLedger.open({ ledgerPath, budgetPolicy: "metered" });
    const id = await first.reserve({ maximumUsd: 0.5 });
    await first.retain(id, code, { code });
    await first.close();
    const next = await BudgetLedger.open({ ledgerPath, budgetUsd: 15, budgetPolicy: "metered", allowBudgetIncrease: true, budgetIncreaseReason: "User approved $15 total" });
    assert.equal(next.snapshot().budgetUsd, 15);
    assert.equal(next.snapshot().reservedUsd, 0.5);
    assert.equal(next.snapshot().haltInfo.code, code);
    await assert.rejects(next.reserve({ maximumUsd: 0.01 }), { code: "budget_halted" });
    await next.close();
  }
});

test("gateway forwards explicit budget authorization into the existing ledger", async (t) => {
  const ledgerPath = await temp(t);
  const first = await BudgetLedger.open({ ledgerPath });
  await first.close();
  const upstream = await mock(t, async (_req, res) => res.end("must not happen"));
  const instance = await createBudgetGateway({ ledgerPath, apiKey: "test-campaign-key", testUpstreamUrl: upstream.url, budgetUsd: 15, allowBudgetIncrease: true, budgetIncreaseReason: "User approved $15 total" });
  assert.equal(instance.snapshot().budgetUsd, 15);
  assert.equal(instance.snapshot().budgetChanges.length, 1);
  assert.equal(upstream.seen.length, 0);
  await instance.close();
});
test("studio visual QA inline images keep Astra and real multimodal payload unchanged", async (t) => {
  const { default: sharp } = await import("sharp");
  const bytes = await sharp({ create: { width: 1024, height: 1536, channels: 3, background: "#aa3322" } }).webp().toBuffer();
  const dataUrl = `data:image/webp;base64,${bytes.toString("base64")}`;
  const payload = requestBody({ model: "gpt-6-astra", max_completion_tokens: 1800, response_format: { type: "json_schema", json_schema: { name: "artwork_check", schema: { type: "object" } } }, messages: [
    { role: "system", content: "Inspect the first image and compare the reference." },
    { role: "user", content: [{ type: "text", text: "Preserve Nora and the supplied date." }, { type: "image_url", image_url: { url: dataUrl } }, { type: "image_url", image_url: { url: dataUrl, detail: "high" } }] },
  ] });
  const inspected = await classified(payload, { budgetPolicy: "metered", standardTier: true });
  assert.equal(inspected.basis.inputImages.length, 2);
  assert.equal(inspected.basis.inputImages[0].width, 1024);
  assert.equal(inspected.basis.inputImages[0].height, 1536);
  assert.equal(inspected.basis.inputImageEstimateSource, "campaign_pixel_heuristic_not_official_bound");
  assert.equal(inspected.basis.inputImages[0].estimatedTokens, 16384);
  assert.ok(inspected.estimatedUsd < 1);
  assert.deepEqual(inspected.payload.messages, payload.messages);
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ usage, service_tier: "default" })); }, { budgetPolicy: "metered", standardTier: true });
  await (await post(instance, payload)).text();
  assert.equal(instance.upstream.seen[0].body.model, "gpt-6-astra");
  assert.deepEqual(instance.upstream.seen[0].body.messages, payload.messages);
  assert.equal(instance.snapshot().reservations[0].status, "settled");
});

test("metered vision rejects remote or unreadable references without provider calls", async (t) => {
  const instance = await gateway(t, async (_req, res) => res.end("must not happen"), { budgetPolicy: "metered" });
  for (const url of ["https://example.com/reference.webp", "data:image/png;base64,YmFk", "data:image/svg+xml;base64,PHN2Zy8+"]) {
    const response = await post(instance, requestBody({ messages: [{ role: "user", content: [{ type: "image_url", image_url: { url } }] }] }));
    assert.equal(response.status, 400);
  }
  assert.equal(instance.upstream.seen.length, 0);
  assert.equal(instance.snapshot().committedUsd, 0);
});

test("named image completion SSE events work when payload omits redundant type", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "text/event-stream"); res.end(`event: image_generation.completed\ndata: ${JSON.stringify({ usage: imageUsage, b64_json: "final" })}\n\n`); }, { budgetPolicy: "metered" });
  await (await imagePost(instance, imageBody({ stream: true, partial_images: 2 }))).text();
  assert.equal(instance.snapshot().reservations[0].status, "settled");
  assert.equal(instance.snapshot().halted, null);
});
test("metered overrun settlement and exact stopping request survive journal restart", async (t) => {
  const ledgerPath = await temp(t);
  const config = { ledgerPath, budgetUsd: 1, phaseLimitsUsd: { baseline: 1, retest: 0, contingency: 0 }, budgetPolicy: "metered" };
  const first = await BudgetLedger.open(config);
  const id = await first.reserve({ maximumUsd: 0.1, caseId: "anniversary--event_page", turnId: "generation" });
  await first.settle(id, { costUsd: 1.02, usage: imageUsage, costKind: "usage_upper_bound" });
  await first.close();
  const resumed = await BudgetLedger.open(config);
  assert.equal(resumed.snapshot().spentUsd, 1.02);
  assert.equal(resumed.snapshot().overrunUsd, 0.02);
  assert.equal(resumed.snapshot().haltInfo.reservationId, id);
  assert.equal(resumed.snapshot().haltInfo.caseId, "anniversary--event_page");
  assert.equal(resumed.snapshot().haltInfo.turnId, "generation");
  await assert.rejects(resumed.reserve({ maximumUsd: 0.001 }), { code: "budget_halted" });
  await resumed.close();
});

test("incomplete image SSE retains its estimate and refuses subsequent paid work", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "text/event-stream"); res.end(`data: ${JSON.stringify({ type: "image_generation.partial_image", b64_json: "partial" })}\n\ndata: [DONE]\n\n`); }, { budgetPolicy: "metered" });
  await (await imagePost(instance, imageBody({ stream: true, partial_images: 1 }))).text();
  assert.equal(instance.snapshot().haltInfo.code, "uncertain_usage");
  assert.equal(instance.snapshot().reservations[0].status, "retained");
  await (await imagePost(instance)).text();
  assert.equal(instance.upstream.seen.length, 1);
});

test("SSE account quota errors are identified even after HTTP success headers", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "text/event-stream"); res.end(`data: ${JSON.stringify({ type: "error", error: { code: "billing_hard_limit_reached" } })}\n\n`); }, { budgetPolicy: "metered" });
  await (await imagePost(instance, imageBody({ stream: true }))).text();
  assert.equal(instance.snapshot().haltInfo.code, "api_quota");
  assert.equal(instance.snapshot().haltInfo.providerCode, "billing_hard_limit_reached");
  assert.equal(instance.snapshot().blocks[0].code, "api_quota");
});
const imageBody = (overrides = {}) => ({ model: "gpt-image-2.5-flare", prompt: "A sunflower invitation", size: "1024x1536", quality: "high", n: 1, ...overrides });
const imageUsage = { input_tokens: 150, input_tokens_details: { text_tokens: 100, image_tokens: 50 }, output_tokens: 1372, total_tokens: 1522 };
function imagePost(instance, payload = imageBody(), overrides = {}) {
  return fetch(`${instance.url}/images/generations`, { method: "POST", headers: { authorization: `Bearer ${instance.clientApiKey}`, "content-type": "application/json" }, body: JSON.stringify(payload), ...overrides });
}
const classifyImage = (payload, options = {}) => classifyBudgetRequest({ endpoint: "/v1/images/generations", contentType: "application/json", body: Buffer.from(JSON.stringify(payload)), budgetPolicy: "metered", ...options });

test("explicit metered transition preserves legacy spend and pools phases durably", async (t) => {
  const ledgerPath = await temp(t);
  const strict = await BudgetLedger.open({ ledgerPath });
  const id = await strict.reserve({ maximumUsd: 1, phase: "baseline" });
  await strict.settle(id, { costUsd: 0.210686508, usage });
  await strict.close();
  const lines = (await readFile(ledgerPath, "utf8")).trim().split("\n").map(JSON.parse);
  delete lines[0].budgetPolicy;
  await writeFile(ledgerPath, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`);
  await assert.rejects(BudgetLedger.open({ ledgerPath, budgetPolicy: "metered" }), { code: "ledger_policy_changed" });
  const metered = await BudgetLedger.open({ ledgerPath, budgetPolicy: "metered", allowPolicyTransition: true });
  assert.equal(metered.snapshot().spentUsd, 0.210686508);
  const pooled = await metered.reserve({ maximumUsd: 6.5, phase: "baseline", basis: { guaranteedMaximum: false } });
  assert.equal(metered.snapshot().phaseLimitsEnforced, false);
  await metered.settle(pooled, { costUsd: 0.1, usage });
  await metered.close();
  await assert.rejects(BudgetLedger.open({ ledgerPath }), { code: "ledger_policy_changed" });
  const resumed = await BudgetLedger.open({ ledgerPath, budgetPolicy: "metered" });
  assert.equal(resumed.snapshot().spentUsd, 0.310686508);
  assert.equal(resumed.snapshot().reservations[1].reservationKind, "estimate");
  await resumed.close();
});

test("metered resume halts on unfinished prior charges and cannot discard reservations", async (t) => {
  const ledgerPath = await temp(t);
  const first = await BudgetLedger.open({ ledgerPath, budgetPolicy: "metered" });
  await first.reserve({ maximumUsd: 0.25 });
  await first.close();
  const resumed = await BudgetLedger.open({ ledgerPath, budgetPolicy: "metered" });
  assert.equal(resumed.snapshot().reservedUsd, 0.25);
  assert.equal(resumed.snapshot().haltInfo.code, "uncertain_usage");
  await assert.rejects(resumed.reserve({ maximumUsd: 0.01 }), { code: "budget_halted" });
  await resumed.close();
});

test("metered text estimate preserves Astra and labels its input count as an estimate", async () => {
  const payload = requestBody({ model: "gpt-6-astra", max_completion_tokens: 3500 });
  const request = await classified(payload, { budgetPolicy: "metered", standardTier: true });
  assert.equal(request.payload.model, "gpt-6-astra");
  assert.deepEqual(request.payload.messages, payload.messages);
  assert.equal(request.maximumUsd, null);
  assert.ok(request.estimatedUsd > 0.175 && request.estimatedUsd < 0.2);
  assert.equal(request.basis.guaranteedMaximum, false);
  assert.equal(request.basis.outputTokenMaximum, 3500);
  assert.ok(request.basis.inputTokenEstimate < 2000);
  await assert.rejects(classified(requestBody({ messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: "https://example.com/image.png" } }] }] }), { budgetPolicy: "metered" }), { code: "unsupported_message_input" });
});

test("Flare estimate uses its own official quality formula and preserves all request bytes", async () => {
  assert.equal(estimateFlareOutputTokens("1024x1536", "high"), 1372);
  assert.equal(estimateFlareOutputTokens("1536x1024", "high"), 1372);
  assert.ok(estimateFlareOutputTokens("1024x1536", "xhigh") > 1372);
  const payload = imageBody({ output_format: "webp", output_compression: 85, background: "opaque" });
  const request = await classifyImage(payload);
  assert.deepEqual(JSON.parse(request.body), payload);
  assert.equal(request.maximumUsd, null);
  assert.equal(request.basis.guaranteedMaximum, false);
  assert.equal(request.basis.outputSafetyMultiplier, 2);
  assert.ok(request.estimatedUsd > 0.08232 && request.estimatedUsd < 0.1);
  await assert.rejects(classifyImage(imageBody({ quality: "auto" })), { code: "explicit_image_settings_required" });
  await assert.rejects(classifyImage(imageBody({ size: "auto" })), { code: "explicit_image_settings_required" });
  await assert.rejects(classifyImage(imageBody({ stream: true, n: 2 })), { code: "unsupported_image_stream_count" });
});

test("image usage reconciliation prices modalities, validates sums, and counts partial allowance", async () => {
  const request = await classifyImage(imageBody({ stream: true, partial_images: 1 }));
  const result = reconcileImageUsage(request, { usage: imageUsage }, 1);
  assert.equal(result.costUsd, (100 * 5 + 50 * 8 + 1472 * 30) / 1000000);
  assert.equal(result.costKind, "usage_upper_bound");
  assert.equal(result.usage.additional_partial_token_allowance, 100);
  assert.equal(reconcileImageUsage(request, { usage: { ...imageUsage, input_tokens: 151 } }), null);
  assert.equal(reconcileImageUsage(request, { usage: { ...imageUsage, total_tokens: 1 } }), null);
  assert.equal(reconcileImageUsage(request, { usage: { ...imageUsage, input_tokens_details: undefined } }), null);
  assert.equal(reconcileImageUsage(request, { usage: imageUsage }, 2), null);
});

test("metered image generation reconciles usage and records an estimate without changing quality", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ data: [{ b64_json: "mock" }], usage: imageUsage })); }, { budgetPolicy: "metered" });
  assert.equal((await imagePost(instance)).status, 200);
  await instance.ledger.queue;
  const snapshot = instance.snapshot();
  assert.equal(snapshot.reservations[0].status, "settled");
  assert.equal(snapshot.reservations[0].reservationKind, "estimate");
  assert.equal(snapshot.spentUsd, (100 * 5 + 50 * 8 + 1372 * 30) / 1000000);
  assert.equal(instance.upstream.seen[0].body.quality, "high");
  assert.equal(instance.upstream.seen[0].body.model, "gpt-image-2.5-flare");
});

test("metered image SSE settles on completed event without Chat Completions DONE", async (t) => {
  const instance = await gateway(t, async (_req, res) => {
    res.setHeader("content-type", "text/event-stream");
    res.write(`event: image_generation.partial_image\ndata: ${JSON.stringify({ type: "image_generation.partial_image", partial_image_index: 0, b64_json: "partial" })}\n\n`);
    res.end(`event: image_generation.completed\ndata: ${JSON.stringify({ type: "image_generation.completed", b64_json: "final", usage: imageUsage })}\n\n`);
  }, { budgetPolicy: "metered" });
  const response = await imagePost(instance, imageBody({ stream: true, partial_images: 1 }));
  assert.match(await response.text(), /image_generation.completed/);
  assert.equal(instance.snapshot().reservations[0].status, "settled");
  assert.equal(instance.snapshot().reservations[0].usage.observed_partial_images, 1);
});

test("metered multipart edits preserve binary payload and reconcile streamed edit completion", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "text/event-stream"); res.end(`data: ${JSON.stringify({ type: "image_edit.completed", usage: imageUsage, b64_json: "final" })}\n\n`); }, { budgetPolicy: "metered" });
  const form = new FormData();
  for (const [key, value] of Object.entries(imageBody({ stream: true, partial_images: 2, output_format: "png" }))) form.set(key, String(value));
  const reference = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64")], { type: "image/png" });
  form.append("image[]", reference, "reference.png");
  form.append("image[]", reference, "second-reference.png");
  const built = new Request("http://localhost/", { method: "POST", body: form });
  const bytes = Buffer.from(await built.arrayBuffer());
  const response = await fetch(`${instance.url}/images/edits`, { method: "POST", headers: { authorization: `Bearer ${instance.clientApiKey}`, "content-type": built.headers.get("content-type") }, body: bytes });
  await response.text();
  assert.equal(response.status, 200);
  assert.deepEqual(instance.upstream.seen[0].rawBody, bytes);
  assert.equal(instance.upstream.seen[0].contentType, built.headers.get("content-type"));
  assert.equal(instance.snapshot().reservations[0].basis.inputImages[0].width, 1);
  assert.equal(instance.snapshot().reservations[0].basis.inputImages.length, 2);
  assert.equal(instance.snapshot().reservations[0].status, "settled");
});

test("metered missing usage halts queued retries before another paid request", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "application/json"); res.end('{"choices":[]}'); }, { budgetPolicy: "metered", standardTier: true });
  const responses = await Promise.all([post(instance), post(instance), post(instance)]);
  await Promise.all(responses.map((r) => r.text()));
  assert.equal(instance.upstream.seen.length, 1);
  assert.equal(instance.snapshot().haltInfo.code, "uncertain_usage");
  assert.equal(instance.snapshot().reservations[0].status, "retained");
  assert.ok(instance.snapshot().reservedUsd > 0);
});

test("metered actual overrun is fully recorded and stops concurrent requests at total target", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ usage: { ...usage, prompt_tokens: 50000 }, service_tier: "default" })); }, { budgetPolicy: "metered", standardTier: true, budgetUsd: 0.01, phaseLimitsUsd: { baseline: 0.01, retest: 0, contingency: 0 } });
  const responses = await Promise.all([post(instance), post(instance)]);
  await Promise.all(responses.map((r) => r.text()));
  assert.equal(instance.upstream.seen.length, 1);
  const snapshot = instance.snapshot();
  assert.equal(snapshot.haltInfo.code, "campaign_target_reached");
  assert.ok(snapshot.spentUsd > 0.01);
  assert.ok(snapshot.overrunUsd > 0);
  assert.ok(snapshot.reservations[0].estimateOverrunNanos > 0);
  assert.equal(snapshot.reservations[0].status, "settled");
});

test("provider quota and ordinary 429 failures are distinct durable stop reasons", async (t) => {
  assert.equal(classifyProviderFailure(429, { error: { code: "insufficient_quota" } }).code, "api_quota");
  assert.equal(classifyProviderFailure(429, { error: { code: "rate_limit_exceeded" } }).code, "api_rate_limit");
  for (const providerCode of ["insufficient_quota", "rate_limit_exceeded"]) {
    const instance = await gateway(t, async (_req, res) => { res.writeHead(429, { "content-type": "application/json" }); res.end(JSON.stringify({ error: { code: providerCode } })); }, { budgetPolicy: "metered" });
    await (await post(instance)).text();
    const expected = providerCode === "insufficient_quota" ? "api_quota" : "api_rate_limit";
    assert.equal(instance.snapshot().haltInfo.code, expected);
    assert.equal(instance.snapshot().haltInfo.providerCode, providerCode);
    assert.equal(instance.snapshot().blocks[0].providerCode, providerCode);
    assert.equal((await post(instance)).status, 402);
    assert.equal(instance.upstream.seen.length, 1);
  }
});

test("metered requests whose estimate exceeds remaining target never reach upstream", async (t) => {
  const instance = await gateway(t, async (_req, res) => res.end("must not happen"), { budgetPolicy: "metered", budgetUsd: 0.01, phaseLimitsUsd: { baseline: 0.01, retest: 0, contingency: 0 } });
  const response = await imagePost(instance);
  assert.equal((await response.json()).error.code, "budget_exhausted");
  assert.equal(instance.upstream.seen.length, 0);
  assert.equal(instance.snapshot().spentUsd, 0);
});

const allBaseline = { baseline: 10, retest: 0, contingency: 0 };
const requestBody = (overrides = {}) => ({ model: "gpt-5.6-luna", messages: [{ role: "user", content: "Make an invitation." }], max_completion_tokens: 100, ...overrides });
const usage = { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 } };
const classified = (payload, options = {}) => classifyBudgetRequest({ endpoint: "/v1/chat/completions", contentType: "application/json", body: Buffer.from(JSON.stringify(payload)), ...options });

const temporaryDirectories = [];
after(async () => {
  for (const directory of temporaryDirectories) {
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("create-campaign-budget-test-"));
    await rm(resolved, { recursive: true, force: true });
  }
});
async function temp(_t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "create-campaign-budget-test-"));
  temporaryDirectories.push(directory);
  return path.join(directory, "ledger.jsonl");
}
async function mock(t, handler) {
  const seen = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    const contentType = req.headers["content-type"] || "";
    seen.push({ url: req.url, body: contentType.startsWith("application/json") ? JSON.parse(rawBody.toString("utf8")) : null, rawBody, contentType, authorization: req.headers.authorization });
    await handler(req, res, seen.length);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => { const closed = new Promise((resolve) => server.close(resolve)); server.closeAllConnections(); await closed; });
  return { url: `http://127.0.0.1:${server.address().port}`, seen };
}
async function gateway(t, handler, options = {}) {
  const ledgerPath = await temp(t);
  const upstream = await mock(t, handler);
  const instance = await createBudgetGateway({ ledgerPath, apiKey: "test-campaign-key", testUpstreamUrl: upstream.url, ...options });
  t.after(() => instance.close());
  return { ...instance, upstream, ledgerPath };
}
function post(instance, payload = requestBody(), overrides = {}) {
  return fetch(`${instance.url}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${instance.clientApiKey}` }, body: JSON.stringify(payload), ...overrides });
}

test("ledger caps configured budget at $60 and cannot silently change resume limits", async (t) => {
  const ledgerPath = await temp(t);
  await assert.rejects(BudgetLedger.open({ ledgerPath, budgetUsd: 60.01 }), { code: "invalid_budget" });
  const ledger = await BudgetLedger.open({ ledgerPath });
  const reservation = await ledger.reserve({ maximumUsd: 2, phase: "baseline" });
  await ledger.settle(reservation, { costUsd: 1.2, usage });
  await ledger.close();
  await assert.rejects(BudgetLedger.open({ ledgerPath, phaseLimitsUsd: allBaseline }), { code: "ledger_limits_changed" });
  const resumed = await BudgetLedger.open({ ledgerPath });
  assert.equal(resumed.snapshot().spentUsd, 1.2);
  await resumed.close();
});

test("concurrent reservations cannot exceed a phase allocation", async (t) => {
  const ledger = await BudgetLedger.open({ ledgerPath: await temp(t) });
  t.after(() => ledger.close());
  const results = await Promise.allSettled(Array.from({ length: 3 }, () => ledger.reserve({ maximumUsd: 3, phase: "baseline" })));
  assert.equal(results.filter((entry) => entry.status === "fulfilled").length, 2);
  assert.equal(ledger.snapshot().committedUsd, 6);
  await assert.rejects(ledger.reserve({ maximumUsd: 4.01, phase: "retest" }), { code: "budget_exhausted" });
});

test("uncertain charges survive restart, and a second live owner is refused", async (t) => {
  const ledgerPath = await temp(t);
  const ledger = await BudgetLedger.open({ ledgerPath });
  await assert.rejects(BudgetLedger.open({ ledgerPath }), { code: "ledger_locked" });
  const id = await ledger.reserve({ maximumUsd: 2.75 });
  await ledger.retain(id, "network_error");
  await ledger.reserve({ maximumUsd: 0.75 });
  await ledger.close();
  const resumed = await BudgetLedger.open({ ledgerPath });
  assert.equal(resumed.snapshot().reservedUsd, 3.5);
  assert.equal(resumed.snapshot().remainingUsd, 6.5);
  await resumed.close();
});

test("partial journal writes fail closed instead of discarding reservations", async (t) => {
  const ledgerPath = await temp(t);
  await writeFile(ledgerPath, '{"type":"reserve"');
  await assert.rejects(BudgetLedger.open({ ledgerPath }), { code: "ledger_corrupt" });
});

test("usage exceeding a reservation halts future calls", async (t) => {
  const ledger = await BudgetLedger.open({ ledgerPath: await temp(t) });
  t.after(() => ledger.close());
  const id = await ledger.reserve({ maximumUsd: 0.01 });
  await assert.rejects(ledger.settle(id, { costUsd: 0.02, usage }), { code: "reservation_overrun" });
  await assert.rejects(ledger.reserve({ maximumUsd: 0.01 }), { code: "budget_halted" });
  assert.equal(ledger.snapshot().reservedUsd, 0.01);
});

test("text bound uses documented model limits, all candidates, longest context and highest possible tier", async () => {
  const auto = await classified(requestBody({ n: 2 }));
  assert.equal(auto.basis.inputTokenMaximum, 922000);
  assert.equal(auto.basis.outputTokenMaximum, 200);
  assert.equal(auto.maximumUsd, (922000 * 0.2 * 2 * 1.25 + 200 * 1.2 * 1.5) * 2 / 1000000);
  const standard = await classified(requestBody(), { standardTier: true });
  assert.equal(standard.payload.service_tier, "default");
  assert.equal(standard.basis.standardTierApplied, true);
  assert.equal(standard.payload.model, "gpt-5.6-luna");
  const explicitFast = await classified(requestBody({ service_tier: "fast" }), { standardTier: true });
  assert.equal(explicitFast.payload.service_tier, "fast");
  await assert.rejects(classified(requestBody({ max_completion_tokens: undefined })), { code: "output_bound_required" });
  await assert.rejects(classified(requestBody({ model: "unreviewed-model" })), { code: "unsupported_model" });
  await assert.rejects(classified(requestBody({ web_search_options: {} })), { code: "unsupported_billable_feature" });
});

test("both JSON image generation and multipart image editing have explicit unbounded-cost blockers", async () => {
  const generation = await inspectBudgetRequest({ endpoint: "/v1/images/generations", contentType: "application/json", body: Buffer.from(JSON.stringify({ model: "gpt-image-2.5-flare", size: "1024x1536", quality: "high", n: 1 })) });
  assert.equal(generation.allowed, false);
  assert.equal(generation.code, "image_bound_unavailable");
  const form = new FormData();
  form.set("model", "gpt-image-2.5-flare");
  form.set("quality", "high");
  form.set("stream", "true");
  form.set("image[]", new Blob(["fixture"], { type: "image/png" }), "reference.png");
  const request = new Request("http://localhost/", { method: "POST", body: form });
  const editing = await inspectBudgetRequest({ endpoint: "/v1/images/edits", contentType: request.headers.get("content-type"), body: Buffer.from(await request.arrayBuffer()) });
  assert.equal(editing.code, "image_bound_unavailable");
  assert.equal((await inspectBudgetRequest({ endpoint: "/v1/responses", contentType: "application/json", body: Buffer.from("{}") })).code, "unsupported_endpoint");
});

test("usage prices cache writes and does not infer missing cache metadata is free", async () => {
  const request = await classified(requestBody({ service_tier: "default" }));
  const exact = reconcileChatUsage(request, { usage, service_tier: "default" });
  assert.equal(exact.costKind, "reported_usage");
  assert.equal(exact.costUsd, (100 * 0.2 + 20 * 1.2) / 1000000);
  const uncertain = reconcileChatUsage(request, { usage: { prompt_tokens: 100, completion_tokens: 20 } });
  assert.equal(uncertain.costKind, "usage_upper_bound");
  assert.equal(uncertain.costUsd, (100 * 0.2 * 1.25 + 20 * 1.2) / 1000000);
  assert.equal(reconcileChatUsage(request, { usage: { prompt_tokens: -1, completion_tokens: 2 } }), null);
});

test("gateway forwards unchanged prompts/models and serializes concurrent paid requests", async (t) => {
  let active = 0;
  let maximumActive = 0;
  const instance = await gateway(t, async (_req, res) => {
    active++;
    maximumActive = Math.max(maximumActive, active);
    await delay(30);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ usage, service_tier: "default", choices: [{ message: { content: "Hello" } }] }));
    active--;
  });
  instance.setContext({ phase: "baseline", caseId: "birthday-live-card", turnId: "1" });
  const responses = await Promise.all(Array.from({ length: 3 }, async () => (await post(instance)).json()));
  assert.equal(responses.length, 3);
  assert.equal(maximumActive, 1);
  assert.equal(instance.upstream.seen.length, 3);
  assert.deepEqual(instance.upstream.seen[0].body, requestBody());
  assert.equal(instance.upstream.seen[0].authorization, "Bearer test-campaign-key");
  assert.equal(instance.snapshot().reservedUsd, 0);
  assert.equal(instance.snapshot().reservations[0].caseId, "birthday-live-card");
  const raw = await readFile(instance.ledgerPath, "utf8");
  assert.ok(!raw.includes("test-campaign-key"));
  assert.ok(!raw.includes(instance.clientApiKey));
  assert.ok(!raw.includes("Make an invitation"));
});

test("SSE is forwarded while final usage settles the reservation", async (t) => {
  const instance = await gateway(t, async (_req, res) => {
    res.setHeader("content-type", "text/event-stream");
    res.write('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n');
    await delay(5);
    const final = `data: ${JSON.stringify({ usage, service_tier: "default", choices: [] })}\n\ndata: [DONE]\n\n`;
    res.write(final.slice(0, 30));
    await delay(5);
    res.end(final.slice(30));
  });
  const response = await post(instance, requestBody({ stream: true }));
  assert.match(await response.text(), /data: \[DONE\]/);
  assert.equal(instance.upstream.seen[0].body.stream_options.include_usage, true);
  assert.equal(instance.snapshot().reservations[0].status, "settled");
});

test("missing usage, HTTP errors and incomplete SSE retain their full maximum", async (t) => {
  const instance = await gateway(t, async (_req, res, sequence) => {
    if (sequence === 1) { res.setHeader("content-type", "application/json"); res.end('{"choices":[]}'); }
    else if (sequence === 2) { res.writeHead(500, { "content-type": "application/json" }); res.end('{"error":{"message":"uncertain"}}'); }
    else { res.setHeader("content-type", "text/event-stream"); res.end(`data: ${JSON.stringify({ usage })}\n\n`); }
  });
  for (let i = 0; i < 3; i++) await (await post(instance, requestBody({ stream: i === 2 }))).text();
  const snapshot = instance.snapshot();
  assert.equal(snapshot.reservations.length, 3);
  assert.ok(snapshot.reservations.every((entry) => entry.status === "retained"));
  assert.ok(snapshot.reservedUsd > 2.7);
});

test("retries consume fresh reservations and stop before a call that exceeds remaining budget", async (t) => {
  const instance = await gateway(t, async (_req, res) => { res.writeHead(503); res.end("uncertain"); }, { budgetUsd: 1, phaseLimitsUsd: { baseline: 1, retest: 0, contingency: 0 } });
  assert.equal((await post(instance)).status, 503);
  const retry = await post(instance);
  assert.equal(retry.status, 402);
  assert.equal((await retry.json()).error.code, "budget_exhausted");
  assert.equal(instance.upstream.seen.length, 1);
});

test("unauthorized, unknown, image and over-budget requests never reach upstream", async (t) => {
  const instance = await gateway(t, async (_req, res) => res.end("should not happen"));
  assert.equal((await post(instance, requestBody(), { headers: { "content-type": "application/json" } })).status, 401);
  const unknown = await post(instance, requestBody({ model: "unknown" }));
  assert.equal((await unknown.json()).error.code, "unsupported_model");
  const expensive = await post(instance, requestBody({ model: "gpt-6-astra" }));
  assert.equal((await expensive.json()).error.code, "budget_exhausted");
  const image = await fetch(`${instance.url}/images/generations`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${instance.clientApiKey}` }, body: JSON.stringify({ model: "gpt-image-2.5-flare", quality: "high", size: "1024x1536" }) });
  assert.equal((await image.json()).error.code, "image_bound_unavailable");
  assert.equal(instance.upstream.seen.length, 0);
  assert.equal(instance.snapshot().committedUsd, 0);
});

test("mock destinations cannot receive real credentials or target external hosts", async (t) => {
  const ledgerPath = await temp(t);
  await assert.rejects(createBudgetGateway({ ledgerPath, apiKey: "actual-key", testUpstreamUrl: "http://127.0.0.1:4000" }), { code: "invalid_test_upstream" });
  await assert.rejects(createBudgetGateway({ ledgerPath, apiKey: "test-campaign-key", testUpstreamUrl: "https://example.com" }), { code: "invalid_test_upstream" });
});

test("tiny Astra input does not turn an undocumented token estimate into a hard cost bound", async () => {
  const request = requestBody({ model: "gpt-6-astra", messages: [{ role: "user", content: "Hi" }], max_completion_tokens: 1 });
  const inspected = await inspectBudgetRequest({ endpoint: "/v1/chat/completions", contentType: "application/json", body: Buffer.from(JSON.stringify(request)), standardTier: true });
  assert.equal(inspected.allowed, true);
  assert.equal(inspected.basis.inputTokenMaximum, 922000);
  assert.ok(inspected.maximumUsd > 23 && inspected.maximumUsd < 24);
  assert.equal(BUDGET_BOUND_AUDIT.text.status, "model_limit_only");
  assert.equal(BUDGET_BOUND_AUDIT.image.status, "image_bound_unavailable");
});

test("Standard tier does not bypass Astra or explicit high-quality Flare blockers", async (t) => {
  const instance = await gateway(t, async (_req, res) => res.end("must not be reached"), { standardTier: true });
  const astra = await post(instance, requestBody({ model: "gpt-6-astra", messages: [{ role: "user", content: "Hi" }] }));
  assert.equal((await astra.json()).error.code, "budget_exhausted");
  const flare = await fetch(`${instance.url}/images/generations`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${instance.clientApiKey}` }, body: JSON.stringify({ model: "gpt-image-2.5-flare", prompt: "A flower", quality: "high", size: "1024x1536", n: 1 }) });
  assert.equal((await flare.json()).error.code, "image_bound_unavailable");
  assert.equal(instance.upstream.seen.length, 0);
  assert.equal(instance.snapshot().committedUsd, 0);
});
