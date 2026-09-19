import { createServer } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";

// Checked against these official pages on 2026-09-18. An estimate is never
// promoted to a guaranteed maximum. In particular the legacy 6240-token image
// table is NOT valid for GPT Image 2.5 Flare.
export const PRICING_SOURCES = Object.freeze({
  checkedAt: "2026-09-18",
  pricing: "https://developers.openai.com/api/docs/pricing",
  images: "https://developers.openai.com/api/docs/guides/image-generation",
  flare: "https://developers.openai.com/api/docs/models/gpt-image-2.5-flare",
  tokenCounting: "https://developers.openai.com/api/docs/guides/advanced-usage",
  imageUsage: "https://developers.openai.com/api/reference/resources/images",
  imageCalculator: "https://developers.openai.com/_astro/GptImageTokenCalculator.react.DVgudqu4.js",
});

export const METERED_ESTIMATE_POLICY = Object.freeze({
  version: 1,
  guaranteedMaximum: false,
  text: "Serialized UTF-8 request bytes (excluding inline image base64) plus 512 and 64 per message, capped at model context; output uses the requested token maximum. Inline raster inputs use the same padded dimension heuristic as image edits. Input framing and image token counts remain estimates.",
  image: "Official GPT Image 2.5 size/quality calculator estimate with 2x output margin. Text uses UTF-8 bytes plus 512; uploaded image inputs use a deliberately padded pixel heuristic (2x (ceil(pixels/256) + 2048)), not a documented Flare token bound.",
  phases: "All phases share the original total target; original phase allocations remain in the journal for attribution only.",
  uncertainty: "Missing/invalid usage, interrupted responses and provider errors retain the reservation and halt. An estimate overrun is recorded at the observed charge; a reached target stops subsequent requests. A final request can exceed the target.",
  source: PRICING_SOURCES.imageCalculator,
});

// A second audit specifically looked for smaller *proven* request bounds.
// This metadata is available to the report; it must not be read as a finding
// about the app's model quality, or as an estimate of what a short call costs.
export const BUDGET_BOUND_AUDIT = Object.freeze({
  checkedAt: "2026-09-18",
  text: Object.freeze({
    status: "model_limit_only",
    reason: "UTF-8 byte length bounds supplied text, not undocumented Chat Completions framing. Official documentation warns local message-token counts can be approximate across models. The Responses input_tokens endpoint does not establish an equivalent Chat Completions count.",
    tokenizerDependencies: "No tiktoken or gpt-tokenizer package installed in this workspace.",
    source: PRICING_SOURCES.tokenCounting,
    modelLimitsSource: "https://developers.openai.com/api/docs/models/gpt-6-astra",
    inputTokenEndpointSource: "https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count",
  }),
  image: Object.freeze({
    status: "image_bound_unavailable",
    reason: "Flare's documentation publishes token rates and image-size constraints but no guaranteed input/output token maximum. Fixed quality and dimensions do not supply a documented upper bound; GPT Image 2 token estimates do not apply to GPT Image 2.5.",
    source: PRICING_SOURCES.flare,
    sizeConstraintsSource: "https://developers.openai.com/api/docs/guides/image-prompting#model-parameters",
  }),
  decision: "Preserve model, quality and the approved hard ceiling in strict mode. Fail closed where the reviewed maximum does not fit; do not substitute an estimate or a different model.",
});

export const MAX_CAMPAIGN_BUDGET_USD = 60;

const MODEL_LIMITS = Object.freeze({
  "gpt-6-astra": { input: 10, cached: 1, output: 50, maxInput: 922000, maxOutput: 128000 },
  "gpt-5.6-terra": { input: 2, cached: 0.2, output: 12, maxInput: 922000, maxOutput: 128000 },
  "gpt-5.6-luna": { input: 0.2, cached: 0.02, output: 1.2, maxInput: 922000, maxOutput: 128000 },
});
const PHASES = ["baseline", "retest", "contingency"];
const DEFAULT_PHASES = Object.freeze({ baseline: 6, retest: 3, contingency: 1 });
const BILLION = 1000000000;
const MAX_BODY = 32 * 1024 * 1024;
const POLICIES = ["strict", "metered"];

export class CampaignBudgetError extends Error {
  constructor(code, message, status = 402) {
    super(message);
    this.name = "CampaignBudgetError";
    this.code = code;
    this.status = status;
  }
}

function reject(code, message, status) {
  throw new CampaignBudgetError(code, message, status);
}
function nano(usd) {
  if (!Number.isFinite(usd) || usd < 0) reject("invalid_amount", "Amounts must be finite and nonnegative.", 400);
  return Math.ceil(usd * BILLION);
}
function usd(amount) { return amount / BILLION; }
function count(value) { return Number.isSafeInteger(value) && value >= 0; }
function safeContext(context = {}) {
  const phase = context.phase || "baseline";
  if (!PHASES.includes(phase)) reject("invalid_phase", "Unknown campaign phase.", 400);
  return { phase, ...Object.fromEntries(["caseId", "turnId"].filter((key) => typeof context[key] === "string").map((key) => [key, context[key].slice(0, 160)])) };
}

/** Append-only, fsynced journal. A process lease prevents concurrent gateways. */
export class BudgetLedger {
  static async open({ ledgerPath, budgetUsd = 10, phaseLimitsUsd = DEFAULT_PHASES, budgetPolicy = "strict", allowPolicyTransition = false, allowBudgetIncrease = false, budgetIncreaseReason }) {
    if (!POLICIES.includes(budgetPolicy)) reject("invalid_budget_policy", "Use strict or metered budget policy.", 400);
    if (!ledgerPath) reject("missing_ledger", "A durable ledger path is required.", 400);
    if (!(budgetUsd > 0 && budgetUsd <= MAX_CAMPAIGN_BUDGET_USD)) reject("invalid_budget", "The campaign budget must be greater than zero and cannot exceed the $60 configuration maximum. Existing ledgers require an explicitly authorized increase.", 400);
    const phases = Object.fromEntries(PHASES.map((phase) => [phase, nano(phaseLimitsUsd[phase] ?? 0)]));
    if (Object.values(phases).reduce((a, b) => a + b, 0) > nano(budgetUsd)) reject("invalid_phase_limits", "Phase limits cannot exceed the campaign budget.", 400);
    const resolved = path.resolve(ledgerPath);
    await mkdir(path.dirname(resolved), { recursive: true });
    const leasePath = `${resolved}.lock`;
    let lease;
    try { lease = await open(leasePath, "wx", 0o600); }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      let owner;
      try { owner = JSON.parse(await readFile(leasePath, "utf8")); }
      catch { reject("ledger_locked", "Unreadable ledger lease; inspect it before resuming.", 409); }
      if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) reject("ledger_locked", "Invalid ledger lease; inspect it before resuming.", 409);
      try { process.kill(owner.pid, 0); reject("ledger_locked", "Another process owns this campaign ledger.", 409); }
      catch (probe) { if (probe.code !== "ESRCH") throw probe; }
      await unlink(leasePath);
      try { lease = await open(leasePath, "wx", 0o600); }
      catch { reject("ledger_locked", "Another process is resuming this campaign ledger.", 409); }
    }
    let journalFile;
    try {
      await lease.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      await lease.sync();
      let journal = "";
      try { journal = await readFile(resolved, "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
      if (journal && !journal.endsWith("\n")) reject("ledger_corrupt", "Incomplete ledger write; refusing to discard a possible reservation.", 409);
      let events;
      try { events = journal.split("\n").filter(Boolean).map((line) => JSON.parse(line)); }
      catch { reject("ledger_corrupt", "Invalid ledger journal; paid work is blocked.", 409); }
      const file = await open(resolved, "a", 0o600);
      journalFile = file;
      const ledger = new BudgetLedger(file, lease, leasePath);
      if (events.length) {
        for (const event of events) ledger.apply(event);
        if (JSON.stringify(ledger.phaseLimitsNanos) !== JSON.stringify(phases)) reject("ledger_limits_changed", "Resume must preserve the original phase limits.", 409);
        const budgetChanged = ledger.budgetNanos !== nano(budgetUsd);
        const policyChanged = ledger.budgetPolicy !== budgetPolicy;
        if (budgetChanged && (nano(budgetUsd) < ledger.budgetNanos || allowBudgetIncrease !== true || typeof budgetIncreaseReason !== "string" || !budgetIncreaseReason.trim() || budgetIncreaseReason.length > 500)) reject("ledger_budget_increase_required", "A budget increase requires allowBudgetIncrease:true and a nonempty authorization reason of at most 500 characters; reductions are not allowed.", 409);
        if (policyChanged && (!allowPolicyTransition || ledger.budgetPolicy !== "strict" || budgetPolicy !== "metered")) reject("ledger_policy_changed", "Explicit approval of the strict-to-metered policy transition is required; prior spend is preserved.", 409);
        // Validate every requested transition before appending any mutation.
        if (budgetChanged) await ledger.append({ type: "budget_increase", previousBudgetNanos: ledger.budgetNanos, budgetNanos: nano(budgetUsd), reason: budgetIncreaseReason.trim() });
        if (policyChanged) await ledger.append({ type: "policy", from: "strict", budgetPolicy, estimates: METERED_ESTIMATE_POLICY });
      } else await ledger.append({ type: "init", version: 1, budgetNanos: nano(budgetUsd), phaseLimitsNanos: phases, budgetPolicy, pricing: PRICING_SOURCES, ...(budgetPolicy === "metered" ? { estimates: METERED_ESTIMATE_POLICY } : {}) });
      if (budgetPolicy === "metered" && !ledger.halted && [...ledger.reservations.values()].some((entry) => entry.status !== "settled")) await ledger.append({ type: "halt", code: "uncertain_usage", reason: "Unsettled prior request may have incurred charges; metered work cannot resume." });
      return ledger;
    } catch (error) {
      await journalFile?.close();
      await lease.close();
      await unlink(leasePath);
      throw error;
    }
  }

  constructor(file, lease, leasePath) {
    this.file = file;
    this.lease = lease;
    this.leasePath = leasePath;
    this.reservations = new Map();
    this.blocks = [];
    this.budgetChanges = [];
    this.halted = null;
    this.queue = Promise.resolve();
    this.closed = false;
  }

  apply(event) {
    if (event.type === "init") {
      if (this.budgetNanos || event.version !== 1 || !count(event.budgetNanos) || event.budgetNanos === 0 || event.budgetNanos > nano(MAX_CAMPAIGN_BUDGET_USD)) reject("ledger_corrupt", "Invalid ledger initialization.", 409);
      this.budgetNanos = event.budgetNanos;
      this.phaseLimitsNanos = event.phaseLimitsNanos;
      this.budgetPolicy = event.budgetPolicy || "strict";
      if (!POLICIES.includes(this.budgetPolicy)) reject("ledger_corrupt", "Invalid budget policy.", 409);
    } else if (!this.budgetNanos) reject("ledger_corrupt", "Ledger initialization is missing.", 409);
    else if (event.type === "budget_increase") {
      if (event.previousBudgetNanos !== this.budgetNanos || !count(event.budgetNanos) || event.budgetNanos <= this.budgetNanos || event.budgetNanos > nano(MAX_CAMPAIGN_BUDGET_USD) || typeof event.reason !== "string" || !event.reason.trim() || event.reason.length > 500) reject("ledger_corrupt", "Invalid authorized budget increase.", 409);
      this.budgetNanos = event.budgetNanos;
      this.budgetChanges.push(event);
      if (this.haltInfo?.code === "campaign_target_reached" && this.snapshot().remainingUsd > 0) { this.halted = null; this.haltInfo = null; }
    }
    else if (event.type === "policy") {
      if (event.from !== this.budgetPolicy || event.from !== "strict" || event.budgetPolicy !== "metered") reject("ledger_corrupt", "Invalid policy transition.", 409);
      this.budgetPolicy = event.budgetPolicy;
    }
    else if (event.type === "reserve") {
      if (this.reservations.has(event.id) || !count(event.reservedNanos) || event.reservedNanos === 0 || !PHASES.includes(event.phase)) reject("ledger_corrupt", "Invalid reservation in ledger.", 409);
      this.reservations.set(event.id, { ...event, status: "reserved" });
    } else if (event.type === "settle" || event.type === "retain") {
      const item = this.reservations.get(event.id);
      if (item?.status !== "reserved") reject("ledger_corrupt", "Invalid reservation transition.", 409);
      if (event.type === "settle" && (!count(event.chargedNanos) || (item.budgetPolicy !== "metered" && event.chargedNanos > item.reservedNanos))) reject("ledger_corrupt", "Settlement exceeds reservation.", 409);
      this.reservations.set(event.id, { ...item, ...event, status: event.type === "settle" ? "settled" : "retained" });
    } else if (event.type === "block") this.blocks.push(event);
    else if (event.type === "halt") { this.halted = event.reason; this.haltInfo = event; }
    else reject("ledger_corrupt", "Unknown ledger journal event.", 409);
  }

  async append(event) {
    const complete = { ...event, at: new Date().toISOString() };
    await this.file.writeFile(`${JSON.stringify(complete)}\n`);
    await this.file.sync();
    this.apply(complete);
  }
  exclusive(work) {
    const next = this.queue.then(() => {
      if (this.closed) reject("ledger_closed", "Ledger is closed.", 409);
      return work();
    });
    this.queue = next.catch(() => {});
    return next;
  }
  snapshot() {
    let spentNanos = 0;
    let reservedNanos = 0;
    const phaseCommitted = Object.fromEntries(PHASES.map((phase) => [phase, 0]));
    for (const entry of this.reservations.values()) {
      const amount = entry.status === "settled" ? entry.chargedNanos : entry.reservedNanos;
      if (entry.status === "settled") spentNanos += amount;
      else reservedNanos += amount;
      phaseCommitted[entry.phase] += amount;
    }
    return {
      budgetPolicy: this.budgetPolicy, guaranteedMaximum: this.budgetPolicy === "strict", phaseLimitsEnforced: this.budgetPolicy === "strict",
      budgetUsd: usd(this.budgetNanos), spentUsd: usd(spentNanos), reservedUsd: usd(reservedNanos),
      committedUsd: usd(spentNanos + reservedNanos), remainingUsd: usd(this.budgetNanos - spentNanos - reservedNanos),
      overrunUsd: usd(Math.max(0, spentNanos + reservedNanos - this.budgetNanos)),
      phases: Object.fromEntries(PHASES.map((phase) => [phase, { limitUsd: usd(this.phaseLimitsNanos[phase]), committedUsd: usd(phaseCommitted[phase]) }])),
      halted: this.halted, haltInfo: this.haltInfo || null, budgetChanges: [...this.budgetChanges], reservations: [...this.reservations.values()], blocks: [...this.blocks],
    };
  }
  reserve({ maximumUsd, ...metadata }) {
    return this.exclusive(async () => {
      if (this.halted) reject("budget_halted", this.halted);
      const context = safeContext(metadata);
      const amount = nano(maximumUsd);
      if (amount <= 0) reject("invalid_reservation", "A positive maximum cost is required.", 400);
      const snapshot = this.snapshot();
      if (snapshot.remainingUsd <= 0 || amount > nano(snapshot.remainingUsd)) reject("budget_exhausted", this.budgetPolicy === "metered" ? "The estimated request reservation does not fit the remaining campaign target." : "The conservative request maximum exceeds the remaining campaign budget.");
      const remainingPhase = this.phaseLimitsNanos[context.phase] - nano(snapshot.phases[context.phase].committedUsd);
      if (this.budgetPolicy === "strict" && amount > remainingPhase) reject("phase_budget_exhausted", `The conservative request maximum exceeds the remaining ${context.phase} allocation.`);
      const id = randomUUID();
      await this.append({ type: "reserve", id, ...context, model: metadata.model, endpoint: metadata.endpoint, reservedNanos: amount, basis: metadata.basis, budgetPolicy: this.budgetPolicy, reservationKind: this.budgetPolicy === "metered" ? "estimate" : "maximum" });
      return id;
    });
  }
  settle(id, { costUsd, usage, costKind = "usage_upper_bound" }) {
    return this.exclusive(async () => {
      const entry = this.reservations.get(id);
      if (entry?.status !== "reserved") reject("invalid_reservation", "Reservation is absent or already finalized.", 409);
      const amount = nano(costUsd);
      if (amount > entry.reservedNanos && entry.budgetPolicy !== "metered") {
        await this.append({ type: "retain", id, reason: "usage_exceeded_reservation" });
        await this.append({ type: "halt", reason: "Observed usage exceeded its proven reservation; all paid work is stopped." });
        reject("reservation_overrun", this.halted);
      }
      await this.append({ type: "settle", id, chargedNanos: amount, usage, costKind, ...(entry.budgetPolicy === "metered" ? { estimateOverrunNanos: Math.max(0, amount - entry.reservedNanos) } : {}) });
      if (this.budgetPolicy === "metered" && this.snapshot().remainingUsd <= 0) await this.append({ type: "halt", code: "campaign_target_reached", reason: "Metered campaign target reached; no further provider requests will be sent.", reservationId: id, ...safeContext(entry) });
    });
  }
  retain(id, reason, stop = {}) {
    return this.exclusive(async () => {
      const entry = this.reservations.get(id);
      if (entry?.status === "reserved") await this.append({ type: "retain", id, reason });
      if (entry && !this.halted && (this.budgetPolicy === "metered" || stop.code === "api_quota")) await this.append({ type: "halt", code: stop.code || "uncertain_usage", reason: stop.reason || "Provider charge is uncertain; further paid requests are stopped.", reservationId: id, ...safeContext(entry), ...(stop.providerCode ? { providerCode: stop.providerCode } : {}) });
    });
  }
  block({ code, model, endpoint, providerCode, ...context }) {
    return this.exclusive(() => this.append({ type: "block", code, model, endpoint, ...(providerCode ? { providerCode } : {}), ...safeContext(context) }));
  }
  async close() {
    await this.queue;
    if (this.closed) return;
    this.closed = true;
    await this.file.close();
    await this.lease.close();
    await unlink(this.leasePath);
  }
}

function baseModel(model) {
  // Only explicit documented aliases are accepted. New snapshots must be
  // researched rather than inheriting potentially changed pricing by regex.
  return MODEL_LIMITS[model] ? model : null;
}

/** Reproduces the official 2.5 calculator's estimate, not a billed-token bound. */
export function estimateFlareOutputTokens(size, quality) {
  const match = /^(\d+)x(\d+)$/.exec(size || "");
  const edge = { low: 16, medium: 24, high: 48, xhigh: 64, max: 96 }[quality];
  if (!match || !edge) reject("explicit_image_settings_required", "Metered image requests require explicit supported size and quality; auto is not estimated.", 400);
  const width = Number(match[1]); const height = Number(match[2]);
  const pixels = width * height;
  if (width % 16 || height % 16 || pixels < 655360 || pixels > 8294400 || Math.max(width, height) > 3840 || Math.max(width, height) / Math.min(width, height) > 3) reject("unsupported_image_size", "Image size is outside the official calculator's supported range.", 400);
  const short = edge * Math.min(width, height) / Math.max(width, height);
  const floor = Math.floor(short);
  const rounded = short - floor === 0.5 ? floor + floor % 2 : Math.round(short);
  return Math.ceil(edge * rounded * (2000000 + pixels) / 4000000);
}

async function rasterInputEstimate(bytes) {
  let metadata;
  try { const { default: sharp } = await import("sharp"); metadata = await sharp(bytes, { limitInputPixels: 50000000 }).metadata(); }
  catch { reject("unreadable_image_input", "Image dimensions cannot be estimated.", 400); }
  if (!["png", "jpeg", "webp"].includes(metadata.format) || !count(metadata.width) || !count(metadata.height) || !metadata.width || !metadata.height || (metadata.pages || 1) !== 1 || metadata.width * metadata.height > 50000000) reject("unsupported_image_input", "Only single-frame PNG/JPEG/WebP references within 50 megapixels have reviewed estimates.", 400);
  return { width: metadata.width, height: metadata.height, bytes: bytes.length, estimatedTokens: 2 * (Math.ceil(metadata.width * metadata.height / 256) + 2048) };
}

async function meteredChatInput(payload, limits) {
  const inputs = [];
  const messages = [];
  for (const message of payload.messages) {
    if (!message || typeof message !== "object") reject("unsupported_message_input", "Unsupported message input.", 400);
    if (typeof message.content === "string") { messages.push(message); continue; }
    if (!Array.isArray(message.content)) reject("unsupported_message_input", "Metered messages require text or inline raster image content.", 400);
    const content = [];
    for (const part of message.content) {
      if (part?.type === "text" && typeof part.text === "string") { content.push(part); continue; }
      if (part?.type !== "image_url" || typeof part.image_url?.url !== "string") reject("unsupported_message_input", "Unreviewed multimodal message part.", 400);
      const match = /^data:image\/(?:png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(part.image_url.url);
      if (!match) reject("unsupported_message_input", "Metered vision supports inline PNG/JPEG/WebP data URLs; remote images are never fetched.", 400);
      const bytes = Buffer.from(match[1], "base64");
      if (bytes.toString("base64").replace(/=+$/, "") !== match[1].replace(/=+$/, "")) reject("unreadable_image_input", "Malformed inline image data.", 400);
      if (inputs.length >= 16) reject("unsupported_image_input", "At most sixteen inline images can be estimated per request.", 400);
      inputs.push(await rasterInputEstimate(bytes));
      content.push({ ...part, image_url: { ...part.image_url, url: "[inline image counted by dimensions]" } });
    }
    messages.push({ ...message, content });
  }
  const textTokenEstimate = Buffer.byteLength(JSON.stringify({ ...payload, messages }), "utf8") + 512 + messages.length * 64;
  const inputTokenEstimate = Math.min(limits.maxInput, textTokenEstimate + inputs.reduce((sum, image) => sum + image.estimatedTokens, 0));
  return { inputTokenEstimate, textTokenEstimate, inputImages: inputs };
}

async function imageInputEstimate(form) {
  const inputs = [];
  let imageCount = 0;
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") continue;
    if (!["image", "image[]", "mask"].includes(key)) reject("unsupported_image_input", "Unreviewed image upload field.", 400);
    if (key !== "mask") imageCount++;
    inputs.push(await rasterInputEstimate(Buffer.from(await value.arrayBuffer())));
  }
  if (imageCount < 1 || imageCount > 16) reject("unsupported_image_input", "Image edits require between one and sixteen uploaded references.", 400);
  return inputs;
}

async function meteredImageRequest({ payload, form, body, contentType, endpoint }) {
  if (payload.service_tier != null) reject("unknown_service_tier", "Image service-tier pricing has not been reviewed.", 400);
  if (typeof payload.prompt !== "string" || !payload.prompt.trim()) reject("invalid_image_prompt", "An image prompt is required.", 400);
  const n = payload.n == null ? 1 : Number(payload.n);
  const partialImages = payload.partial_images == null ? 0 : Number(payload.partial_images);
  if (!count(n) || n < 1 || n > 10 || !count(partialImages) || partialImages > 3) reject("invalid_image_count", "Invalid image or partial-image count.", 400);
  const streaming = payload.stream === true || payload.stream === "true";
  if (streaming && n !== 1) reject("unsupported_image_stream_count", "Streamed image accounting supports one completed image per request.", 400);
  const outputTokens = estimateFlareOutputTokens(payload.size, payload.quality);
  if (endpoint.endsWith("/edits") && !form) reject("unsupported_image_input", "Metered image edits require uploaded multipart references; remote references are not inspected.", 400);
  if (!form && (payload.image || payload.images || payload.mask)) reject("unsupported_image_input", "Unreviewed image reference encoding.", 400);
  const inputs = form ? await imageInputEstimate(form) : [];
  const textTokens = Buffer.byteLength(payload.prompt, "utf8") + 512;
  const imageTokens = inputs.reduce((sum, input) => sum + input.estimatedTokens, 0);
  const estimatedUsd = (textTokens * 5 + imageTokens * 8 + (2 * outputTokens + partialImages * 100) * n * 30) / 1000000;
  return { model: payload.model, endpoint, payload, body, contentType, maximumUsd: null, reservationUsd: estimatedUsd, estimatedUsd,
    basis: { method: "metered_image_estimate", guaranteedMaximum: false, estimatorVersion: 1, size: payload.size, quality: payload.quality, n, partialImages, outputTokenEstimatePerImage: outputTokens, outputSafetyMultiplier: 2, inputTextTokenEstimate: textTokens, inputImages: inputs, source: PRICING_SOURCES.imageCalculator, inputImageEstimateSource: "campaign_pixel_heuristic_not_official_bound" } };
}

/** Request classification never changes quality, models, prompts or formats. */
export async function classifyBudgetRequest({ endpoint, contentType, body, standardTier = false, budgetPolicy = "strict" }) {
  if (!POLICIES.includes(budgetPolicy)) reject("invalid_budget_policy", "Use strict or metered budget policy.", 400);
  if (!["/v1/chat/completions", "/v1/images/generations", "/v1/images/edits"].includes(endpoint)) reject("unsupported_endpoint", "This endpoint has no reviewed campaign cost bound.", 400);
  let payload;
  let form;
  if (contentType.startsWith("application/json")) {
    try { payload = JSON.parse(body.toString("utf8")); }
    catch { reject("invalid_json", "Invalid JSON request.", 400); }
  } else if (endpoint === "/v1/images/edits" && contentType.startsWith("multipart/form-data")) {
    try { form = await new Request("http://localhost/", { method: "POST", headers: { "content-type": contentType }, body }).formData(); }
    catch { reject("invalid_multipart", "Invalid multipart image edit request.", 400); }
    payload = {};
    for (const key of ["model", "prompt", "size", "quality", "n", "stream", "partial_images", "service_tier"]) {
      if (form.getAll(key).length > 1) reject("ambiguous_multipart", "Duplicate image request fields are not permitted.", 400);
      const value = form.get(key);
      if (value !== null && typeof value !== "string") reject("invalid_multipart", "Expected text image options.", 400);
      payload[key] = value;
    }
  } else reject("unsupported_content_type", "Unsupported request content type.", 400);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) reject("invalid_payload", "Expected an object payload.", 400);
  if (endpoint.startsWith("/v1/images/")) {
    if (payload.model !== "gpt-image-2.5-flare" && payload.model !== "gpt-image-2.5-flare-2026-09-08") reject("unsupported_model", "This image model has no reviewed campaign cost bound.", 400);
    if (budgetPolicy === "metered") return meteredImageRequest({ payload, form, body, contentType, endpoint });
    reject("image_bound_unavailable", "OpenAI documents Flare token rates but no guaranteed per-request input/output token maximum. Its calculator supplies estimates, and legacy image token tables exclude Flare. Image requests are blocked to preserve the approved hard ceiling.");
  }
  const model = baseModel(payload.model);
  if (!model) reject("unsupported_model", "This model has no reviewed campaign cost bound.", 400);
  if (payload.tools?.length || payload.functions?.length || payload.web_search_options || payload.audio || payload.prediction || payload.modalities?.some((value) => value !== "text")) reject("unsupported_billable_feature", "Tools, audio and prediction require additional reviewed cost bounds.", 400);
  if (!Array.isArray(payload.messages) || !payload.messages.length) reject("invalid_messages", "A conversation is required.", 400);
  const limits = MODEL_LIMITS[model];
  const maximumOutput = payload.max_completion_tokens;
  if (!Number.isSafeInteger(maximumOutput) || maximumOutput <= 0 || maximumOutput > limits.maxOutput || payload.max_tokens !== undefined) reject("output_bound_required", "Supply max_completion_tokens within the documented model limit.", 400);
  const candidates = payload.n ?? 1;
  if (!Number.isSafeInteger(candidates) || candidates < 1 || candidates > 128) reject("invalid_candidates", "Invalid completion count.", 400);
  const originalTier = payload.service_tier ?? "auto";
  if (standardTier && originalTier === "auto") payload.service_tier = "default";
  const tier = payload.service_tier ?? "auto";
  if (!["auto", "default", "flex", "priority", "fast"].includes(tier)) reject("unknown_service_tier", "Unknown service tier has no reviewed cost bound.", 400);
  const tierMultiplier = tier === "default" || tier === "flex" ? 1 : 2;
  // Full documented input limit is intentionally conservative: neither local
  // tokenizers nor Responses input_tokens prove Chat Completions framing costs.
  // Reserve long-context cache-write input and long-context output rates.
  const maximumUsd = (limits.maxInput * limits.input * 2 * 1.25 + maximumOutput * candidates * limits.output * 1.5) * tierMultiplier / 1000000;
  if (payload.stream === true) payload.stream_options = { ...payload.stream_options, include_usage: true };
  if (budgetPolicy === "metered") {
    const input = await meteredChatInput(payload, limits);
    const inputTokens = input.inputTokenEstimate;
    const long = inputTokens > 272000;
    const estimatedUsd = (inputTokens * limits.input * (long ? 2 : 1) * 1.25 + maximumOutput * candidates * limits.output * (long ? 1.5 : 1)) * tierMultiplier / 1000000;
    return { model, endpoint, payload, body: Buffer.from(JSON.stringify(payload)), contentType: "application/json", maximumUsd: null, reservationUsd: estimatedUsd, estimatedUsd,
      basis: { ...input, outputTokenMaximum: maximumOutput * candidates, tierMultiplier, standardTierApplied: standardTier && originalTier === "auto", method: "metered_utf8_request_estimate", guaranteedMaximum: false, estimatorVersion: 1, source: PRICING_SOURCES.tokenCounting, ...(input.inputImages.length ? { inputImageEstimateSource: "campaign_pixel_heuristic_not_official_bound" } : {}) } };
  }
  return {
    model, endpoint, payload, body: Buffer.from(JSON.stringify(payload)), contentType: "application/json", maximumUsd,
    basis: { inputTokenMaximum: limits.maxInput, outputTokenMaximum: maximumOutput * candidates, tierMultiplier, standardTierApplied: standardTier && originalTier === "auto", method: "documented_model_input_limit", source: `https://developers.openai.com/api/docs/models/${model}` },
  };
}

export async function inspectBudgetRequest(options) {
  try {
    const result = await classifyBudgetRequest(options);
    return { allowed: true, model: result.model, endpoint: result.endpoint, maximumUsd: result.maximumUsd, ...(result.estimatedUsd !== undefined ? { estimatedUsd: result.estimatedUsd, reservationUsd: result.reservationUsd } : {}), basis: result.basis };
  } catch (error) {
    if (!(error instanceof CampaignBudgetError)) throw error;
    return { allowed: false, endpoint: options.endpoint, code: error.code, reason: error.message };
  }
}

/** Conservative reconciliation; unknown cache-write usage is never assumed free. */
export function reconcileChatUsage(request, result) {
  const usage = result?.usage;
  if (!usage || !count(usage.prompt_tokens) || !count(usage.completion_tokens)) return null;
  const limits = MODEL_LIMITS[request.model];
  const tier = result.service_tier;
  if (tier != null && !["default", "flex", "priority", "fast"].includes(tier)) return null;
  const multiplier = tier === "default" || tier === "flex" ? 1 : tier === "priority" || tier === "fast" ? 2 : request.basis.tierMultiplier;
  const long = usage.prompt_tokens > 272000;
  const inputRate = limits.input * (long ? 2 : 1) * multiplier;
  const outputRate = limits.output * (long ? 1.5 : 1) * multiplier;
  const details = usage.prompt_tokens_details;
  const cached = details?.cached_tokens;
  const writes = details?.cache_write_tokens;
  let inputCost;
  let costKind;
  if (count(cached) && count(writes) && cached + writes <= usage.prompt_tokens) {
    inputCost = (usage.prompt_tokens - cached - writes) * inputRate + cached * limits.cached * (long ? 2 : 1) * multiplier + writes * inputRate * 1.25;
    costKind = "reported_usage";
  } else {
    inputCost = usage.prompt_tokens * inputRate * 1.25;
    costKind = "usage_upper_bound";
  }
  return { costUsd: (inputCost + usage.completion_tokens * outputRate) / 1000000, usage: { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens, ...(count(cached) ? { cached_tokens: cached } : {}), ...(count(writes) ? { cache_write_tokens: writes } : {}) }, costKind };
}

/** Modalities are priced independently; cache discounts are never guessed. */
export function reconcileImageUsage(request, result, observedPartialImages = 0) {
  const usage = result?.usage;
  const details = usage?.input_tokens_details;
  if (!usage || !details || !count(usage.input_tokens) || !count(usage.output_tokens) || !count(usage.total_tokens) || !count(details.text_tokens) || !count(details.image_tokens)) return null;
  if (details.text_tokens + details.image_tokens !== usage.input_tokens || usage.total_tokens !== usage.input_tokens + usage.output_tokens) return null;
  const output = usage.output_tokens_details;
  if (output && (!count(output.image_tokens) || !count(output.text_tokens) || output.image_tokens + output.text_tokens !== usage.output_tokens)) return null;
  // Flare has no billed text output. Older schemas expose only output_tokens.
  const imageOutput = output ? output.image_tokens : usage.output_tokens;
  if (!count(observedPartialImages) || observedPartialImages > (request.basis.partialImages || 0)) return null;
  const partialReserve = observedPartialImages * 100;
  const costUsd = (details.text_tokens * 5 + details.image_tokens * 8 + (imageOutput + partialReserve) * 30) / 1000000;
  return { costUsd, usage: { input_tokens: usage.input_tokens, input_tokens_details: { text_tokens: details.text_tokens, image_tokens: details.image_tokens }, output_tokens: usage.output_tokens, total_tokens: usage.total_tokens, ...(output ? { output_tokens_details: { image_tokens: output.image_tokens, text_tokens: output.text_tokens } } : {}), observed_partial_images: observedPartialImages, additional_partial_token_allowance: partialReserve }, costKind: "usage_upper_bound" };
}

export function classifyProviderFailure(status, result) {
  const raw = result?.error?.code || result?.error?.type;
  const providerCode = typeof raw === "string" && /^[a-zA-Z0-9_]{1,100}$/.test(raw) ? raw : `http_${status}`;
  const quota = ["insufficient_quota", "billing_hard_limit_reached", "billing_not_active", "usage_limit_reached", "organization_quota_exceeded"].includes(providerCode);
  const rateLimit = status === 429 || ["rate_limit_exceeded", "slow_down"].includes(providerCode);
  return { code: quota ? "api_quota" : rateLimit ? "api_rate_limit" : "api_error", providerCode, reason: quota ? "Provider account quota or billing limit stopped this request." : rateLimit ? "Provider rate limit stopped this request; its reservation remains retained." : "Provider error left this request's charge uncertain." };
}

function authorized(header, key) {
  const value = Buffer.from(header || "");
  const expected = Buffer.from(`Bearer ${key}`);
  return value.length === expected.length && timingSafeEqual(value, expected);
}
async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY) reject("request_too_large", "Request exceeds the gateway size limit.", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function errorResponse(response, error) {
  if (response.headersSent || response.destroyed) { response.end(); return; }
  response.writeHead(error instanceof CampaignBudgetError ? error.status : 502, { "content-type": "application/json", "x-should-retry": "false" });
  response.end(JSON.stringify({ error: { type: "campaign_budget_error", code: error instanceof CampaignBudgetError ? error.code : "gateway_failure", message: error instanceof CampaignBudgetError ? error.message : "Campaign gateway failed; any reservation remains charged." } }));
}

/**
 * Run one gateway per campaign. The app receives clientApiKey, never apiKey.
 * setContext belongs to the coordinator and must be set before starting a turn.
 * testUpstreamUrl is loopback-only and refuses real credentials.
 */
export async function createBudgetGateway({ ledgerPath, budgetUsd = 10, phaseLimitsUsd = DEFAULT_PHASES, apiKey, phase = "baseline", context = {}, port = 0, testUpstreamUrl, requestTimeoutMs = 240000, standardTier = false, budgetPolicy = "strict", allowPolicyTransition = false, allowBudgetIncrease = false, budgetIncreaseReason }) {
  if (typeof apiKey !== "string" || !apiKey.trim()) reject("missing_api_key", "An upstream API key is required.", 400);
  let upstream = "https://api.openai.com";
  if (testUpstreamUrl) {
    const testUrl = new URL(testUpstreamUrl);
    if (apiKey !== "test-campaign-key" || testUrl.protocol !== "http:" || testUrl.hostname !== "127.0.0.1" || testUrl.username || testUrl.password || testUrl.pathname !== "/" || testUrl.search || testUrl.hash) reject("invalid_test_upstream", "Mock upstream must use loopback and the test-only credential.", 400);
    upstream = testUrl.origin;
  }
  let activeContext = safeContext({ phase, ...context });
  const ledger = await BudgetLedger.open({ ledgerPath, budgetUsd, phaseLimitsUsd, budgetPolicy, allowPolicyTransition, allowBudgetIncrease, budgetIncreaseReason });
  const clientApiKey = `campaign-local-${randomBytes(24).toString("hex")}`;
  let queue = Promise.resolve();
  const server = createServer((request, response) => {
    const requestContext = { ...activeContext };
    const task = async () => {
      let reservation;
      let classified;
      const endpoint = request.url;
      try {
        if (!authorized(request.headers.authorization, clientApiKey)) reject("unauthorized", "Use this campaign gateway's local credential.", 401);
        if (request.method === "GET" && endpoint === "/_campaign/health") {
          response.writeHead(200, { "content-type": "application/json" });
          response.end(JSON.stringify({ ok: true, ...ledger.snapshot() }));
          return;
        }
        if (request.method !== "POST") reject("unsupported_method", "Only approved POST operations are supported.", 405);
        if (request.destroyed || response.destroyed) return;
        classified = await classifyBudgetRequest({ endpoint, contentType: request.headers["content-type"] || "", body: await readBody(request), standardTier, budgetPolicy });
        reservation = await ledger.reserve({ maximumUsd: classified.reservationUsd ?? classified.maximumUsd, ...requestContext, model: classified.model, endpoint, basis: classified.basis });
        const result = await fetch(`${upstream}${endpoint}`, {
          method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": classified.contentType },
          body: classified.body, redirect: "error", signal: AbortSignal.timeout(requestTimeoutMs),
        });
        const contentType = result.headers.get("content-type") || "application/json";
        if (!response.destroyed) response.writeHead(result.status, { "content-type": contentType, "x-campaign-reservation": reservation, "cache-control": "no-store", "x-should-retry": "false" });
        let usageResult;
        let malformed = false;
        let sawDone = false;
        let completedImages = 0;
        let observedPartialImages = 0;
        let sseEventType = "";
        let buffer = "";
        const decoder = new TextDecoder();
        const isStream = contentType.includes("text/event-stream");
        const inspectLine = (line) => {
          if (!line) { sseEventType = ""; return; }
          if (line.startsWith("event:")) { sseEventType = line.slice(6).trim(); return; }
          if (!line.startsWith("data:")) return;
          const data = line.slice(5).trim();
          if (data === "[DONE]") { sawDone = true; return; }
          if (!data) return;
          try {
            const event = JSON.parse(data);
            const eventType = event.type || sseEventType;
            if (endpoint.startsWith("/v1/images/")) {
              const expectedType = endpoint.endsWith("/edits") ? "image_edit" : "image_generation";
              if (eventType === `${expectedType}.partial_image`) observedPartialImages++;
              if (eventType === `${expectedType}.completed`) { completedImages++; sawDone = true; usageResult = event; }
              if (completedImages > 1) malformed = true;
            } else if (event.usage) usageResult = event;
            if (event.error || eventType === "error") { malformed = true; usageResult = { ...event, type: "error" }; }
          }
          catch { malformed = true; }
        };
        for await (const chunk of result.body) {
          if (!response.destroyed) response.write(chunk);
          buffer += decoder.decode(chunk, { stream: true });
          if (isStream) {
            let newline = buffer.indexOf("\n");
            while (newline !== -1) {
              inspectLine(buffer.slice(0, newline).replace(/\r$/, ""));
              buffer = buffer.slice(newline + 1);
              newline = buffer.indexOf("\n");
            }
          }
          if (buffer.length > MAX_BODY) { malformed = true; throw new Error("upstream_payload_limit"); }
        }
        buffer += decoder.decode();
        if (isStream) inspectLine(buffer);
        else { try { usageResult = JSON.parse(buffer); } catch { malformed = true; } }
        const isImage = endpoint.startsWith("/v1/images/");
        const completeStream = !isStream || (isImage ? completedImages === 1 : sawDone);
        const cost = result.ok && !malformed && completeStream ? (isImage ? reconcileImageUsage(classified, usageResult, observedPartialImages) : reconcileChatUsage(classified, usageResult)) : null;
        if (cost) await ledger.settle(reservation, cost);
        else {
          const providerError = !result.ok || usageResult?.error || usageResult?.type === "error";
          const failure = providerError ? classifyProviderFailure(result.status, usageResult) : { code: "uncertain_usage" };
          if (providerError) await ledger.block({ ...requestContext, endpoint, model: classified.model, code: failure.code, providerCode: failure.providerCode });
          await ledger.retain(reservation, result.ok ? "missing_or_invalid_usage" : `upstream_http_${result.status}`, failure);
        }
        if (!response.destroyed) response.end();
      } catch (error) {
        if (reservation) await ledger.retain(reservation, error instanceof CampaignBudgetError ? error.code : "upstream_or_stream_failure");
        else if (error instanceof CampaignBudgetError && error.code !== "unauthorized") await ledger.block({ ...requestContext, endpoint, model: classified?.model, code: error.code });
        errorResponse(response, error);
      }
    };
    queue = queue.then(task).catch((error) => errorResponse(response, error));
  });
  server.requestTimeout = requestTimeoutMs;
  try { await new Promise((resolve, rejectListen) => { server.once("error", rejectListen); server.listen(port, "127.0.0.1", resolve); }); }
  catch (error) { await ledger.close(); throw error; }
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/v1`, clientApiKey, ledger,
    snapshot: () => ledger.snapshot(),
    setContext(next) { activeContext = safeContext(next); },
    async close() { const closed = new Promise((resolve) => server.close(resolve)); await queue; server.closeIdleConnections(); await closed; await ledger.close(); },
  };
}
