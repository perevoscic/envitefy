import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { inspectNewGeneration, diffDraftFacts } from "./create-campaign-validation.mjs";
import { archiveGeneratedArtwork } from "./create-campaign-artwork.mjs";
import { runCampaignGuestJourney } from "./create-campaign-guest.mjs";
import { createCampaignResponseCapture } from "./create-campaign-network.mjs";
import { bindCampaignScenario } from "./create-campaign-date.mjs";
import { CAMPAIGN_OPERATION_TIMEOUT_MS, withCampaignTimeout } from "./create-campaign-timeout.mjs";

const timeout = CAMPAIGN_OPERATION_TIMEOUT_MS;
const labels = { live_card: "Live Card", digital_flyer: "Flyer/Invitation", event_page: "Event Page" };

export async function assertCampaignMayContinue(shouldStop, context) {
  if (await shouldStop(context)) {
    const error = new Error(`harness_maintenance: Campaign stopped before ${context.stage}`);
    error.code = "harness_maintenance";
    throw error;
  }
}

export function readIntakeResponse(text) {
  if (!text.startsWith("event:")) {
    try { return JSON.parse(text); } catch { return { error: "Invalid intake response" }; }
  }
  const result = {};
  for (const block of text.split(/\r?\n\r?\n/)) {
    const event = block.match(/^event:\s*(.+)$/m)?.[1];
    const data = block.match(/^data:\s*(.+)$/m)?.[1];
    if (!data) continue;
    const value = JSON.parse(data);
    if (event === "state") Object.assign(result, value);
    if (event === "assistant_done") Object.assign(result, { assistantMessage: value.assistantMessage, usedAi: value.usedAi });
    if (event === "error") result.error = value.error;
  }
  return result;
}

export function selectRejectedArtworkCandidate(events, generated) {
  if (generated?.ok !== false) return null;
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    if (event.type === "preview" && event.partial === false && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(event.imageDataUrl || "")) {
      return { imageDataUrl: event.imageDataUrl, streamEventIndex: index, partial: false, candidateOnly: true, unaccepted: true };
    }
  }
  return null;
}

/** A rejected edit can leave a valid original available for downstream testing. */
export function assessAppearanceEdit({ before = [], after = [] }) {
  const checked = inspectNewGeneration({ before, after });
  if (checked.complete) return { ...checked, recoverable: false };
  const original = before.findLast(entry => entry.ok === true && entry.artifactSha256 && entry.archival?.verification?.decoded === true);
  const newResults = after.slice(before.length);
  const rejection = newResults.length === 1 ? newResults[0] : null;
  const errors = Object.values(rejection?.errors || {}).filter(Boolean);
  const recoverable = Boolean(original && rejection?.ok === false && rejection.qualityCheck === "failed" && errors.length && errors.every(error => error.code === "image_quality_failed"));
  return { ...checked, recoverable, ...(recoverable ? { original, rejection } : {}) };
}

/** Generated-edit intake replies are internal; the rendered status is different. */
export async function collectRenderedStyleOutcome(page, userMessage) {
  const messages = await page.getByRole("log").evaluateAll(logs => logs.flatMap(log => [...log.querySelectorAll(":scope > .items-start, :scope > .items-end, .flex-col.items-start, .flex-col.items-end")]
    .map(element => {
      const role = element.classList.contains("items-end") ? "user" : "assistant";
      // The real message row contains an avatar sibling (including initials).
      // Read only its bubble, never the entire row's visible text.
      const bubble = element.querySelector(role === "user" ? ".rounded-tr-md" : ".rounded-tl-md");
      return { role, text: (bubble || element).innerText.trim() };
    })));
  const normalize = text => text.replace(/\s+/g, " ").trim();
  const userIndex = messages.findLastIndex(message => message.role === "user" && normalize(message.text) === normalize(userMessage));
  const alerts = await page.getByRole("alert").allTextContents();
  return { source: "rendered_ui", submittedRequestObserved: userIndex >= 0, messages: userIndex >= 0 ? messages.slice(userIndex + 1) : [], alerts: alerts.map(text => text.trim()).filter(Boolean), ...(userIndex < 0 ? { observation: "Submitted style request was not observed in the rendered chat", observedChatTail: messages.slice(-4) } : {}) };
}

export async function collectPreviewArtwork(dialog) {
  const scopes = [];
  const inlineImages = dialog.locator("img");
  if (await inlineImages.count()) scopes.push({ images: inlineImages, document: "dialog" });
  const frames = dialog.locator("iframe");
  for (let index = 0; index < await frames.count(); index++) {
    const handle = await frames.nth(index).elementHandle();
    const frame = await handle?.contentFrame();
    if (frame) scopes.push({ images: frame.locator("img"), document: "preview_iframe" });
  }
  if (!scopes.length) scopes.push({ images: inlineImages, document: "dialog" });
  const artwork = [];
  for (const scope of scopes) {
    await scope.images.first().waitFor({ state: "attached", timeout: 20_000 });
    const images = await scope.images.evaluateAll(async elements => {
      await Promise.all(elements.map(image => image.decode().catch(() => {})));
      return elements.map(image => ({ src: image.currentSrc || image.src, decoded: image.complete && image.naturalWidth > 0, width: image.naturalWidth, height: image.naturalHeight }));
    });
    artwork.push(...images.map(image => ({ ...image, document: scope.document })));
  }
  return artwork;
}

/** The browser performs actual UI actions. Network observations only collect evidence. */
export async function runBrowserCase({ scenario, baseUrl, account, runDir, setContext = () => {}, onProgress = async () => {}, databaseCounts = async () => null, shouldStop = async () => false, headless = true, conversationOnly = false }) {
  const origin = new URL(baseUrl);
  if (origin.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) throw new Error("campaign_browser_requires_loopback");
  const attemptId = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const caseDir = path.join(runDir, "cases", scenario.id, "attempts", attemptId);
  await fs.mkdir(caseDir, { recursive: true });
  const result = {
    caseId: scenario.id, attemptId, scope: conversationOnly ? "conversation_only" : "complete_journey", status: "incomplete", stage: "authentication", startedAt: new Date().toISOString(),
    transcript: [], evidence: [], findings: [], qaResults: [], scores: null, facts: [],
    checks: {}, timings: {}, modelFallbacks: 0, consoleErrors: [], networkFailures: [],
    ...bindCampaignScenario(scenario, attemptId, path.relative(runDir, path.join(caseDir, "scenario.json")).replaceAll("\\", "/")),
  };
  await fs.writeFile(path.join(caseDir, "scenario.json"), `${JSON.stringify(scenario, null, 2)}\n`);
  result.evidence.push({ kind: "effective-scenario", path: result.scenarioEvidence.path, exists: true, attemptId, sha256: result.scenarioEvidence.sha256 });
  const save = async () => {
    await fs.writeFile(path.join(caseDir, "result.json"), JSON.stringify(result, null, 2));
    await onProgress(result);
  };
  const stage = async (name, turnId = name) => {
    result.stage = name;
    setContext({ caseId: scenario.id, turnId });
    await save();
    await assertCampaignMayContinue(shouldStop, { caseId: scenario.id, attemptId, stage: name, turnId });
  };
  const recordJson = async (name, value, kind = name) => {
    const target = path.join(caseDir, `${name}.json`);
    await fs.writeFile(target, JSON.stringify(value, (_key, item) => typeof item === "string" && /^data:image\/[^;]+;base64,/.test(item) ? "[image bytes archived separately as verified WebP]" : item, 2));
    result.evidence.push({ kind, path: path.relative(runDir, target).replaceAll("\\", "/"), exists: true, attemptId });
  };
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US", timezoneId: "America/Chicago" });
  const page = await context.newPage();
  const responseCapture = await createCampaignResponseCapture(context, page);
  page.setDefaultTimeout(20_000);
  page.on("pageerror", error => {
    result.consoleErrors.push(error.message);
    result.browserExceptions ||= [];
    result.browserExceptions.push({ message: error.message, stack: error.stack });
  });
  page.on("requestfailed", request => result.networkFailures.push({ url: new URL(request.url()).pathname, error: request.failure()?.errorText }));
  page.on("dialog", dialog => dialog.type() === "beforeunload" ? dialog.accept() : dialog.dismiss());
  const pendingEvidence = new Set();
  const captureFailures = [];
  async function readCapturedResponse(response) {
    try { return await responseCapture.text(response); }
    catch (error) { throw new Error(`harness_interaction: Response capture failed: ${error.message}`); }
  }
  async function finishEvidenceCapture() {
    await withCampaignTimeout(Promise.allSettled([...pendingEvidence]), { label: "Pending response evidence" });
    if (captureFailures.length) throw new Error(`harness_interaction: Evidence capture failed: ${captureFailures[0].message}`);
  }
  let latestDraft = null;
  let latestGeneration = null;
  let publishedEventId = null;
  let writeCount = 0;
  let responseCount = 0;
  let savedSnapshot = null;
  page.on("response", response => {
    const pathname = new URL(response.url()).pathname;
    if (!["/api/creation/intake", "/api/creation/intake/stream", "/api/studio/generate", "/api/creation/draft"].includes(pathname)) return;
    if (response.request().method() === "GET") return;
    const responseIndex = ++responseCount;
    const responseStage = result.stage;
    const work = (async () => {
      const text = await readCapturedResponse(response);
      if (pathname === "/api/studio/generate") {
        const requestPath = path.join(caseDir, `generation-request-${(result.generations?.length || 0) + 1}.json`);
        await fs.writeFile(requestPath, JSON.stringify(response.request().postDataJSON(), (_key, item) => typeof item === "string" && item.startsWith("data:image/") ? "[source image bytes omitted; generated artwork archived separately]" : item, 2));
        result.evidence.push({ kind: "generation-request", path: path.relative(runDir, requestPath).replaceAll("\\", "/"), exists: true });
        const events = text.split("\n").filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
        const generated = events.find(event => event.type === "complete")?.result || events.find(event => "ok" in event);
        if (generated) {
          latestGeneration = generated;
          result.generations ||= [];
          result.generations.push({ ok: generated.ok, warnings: generated.warnings, errors: generated.errors, qualityCheck: generated.qualityCheck, timings: generated.timings, imageUrl: generated.imageUrl, phase: responseStage, attemptId });
          if (generated.ok === true && (generated.imageDataUrl || generated.imageUrl)) await captureArtwork(generated, result.generations.length);
          else {
            const rejectedCandidate = selectRejectedArtworkCandidate(events, generated);
            if (rejectedCandidate) await captureArtwork(rejectedCandidate, result.generations.length, { candidateOnly: true });
          }
          await recordJson(`generation-response-${result.generations.length}`, generated, "generation-response");
        }
        if (events.find(event => event.type === "error")) result.findings.push({ severity: "high", summary: events.find(event => event.type === "error").message, stage: "generation" });
      } else {
        const value = readIntakeResponse(text);
        await recordJson(`response-${responseIndex}-${responseStage}`, { pathname, status: response.status(), body: value }, "api-response");
        if (value.draft) {
          if (responseStage !== "style_edit") latestDraft = value.draft;
          result.facts.push({ phase: responseStage, draft: value.draft, ...(responseStage === "style_edit" ? { stateSource: "proposed_intake_draft" } : {}) });
        }
        if (value.savedEventId) publishedEventId = value.savedEventId;
        if (value.usedAi === false) result.modelFallbacks++;
        if (pathname === "/api/creation/draft" && response.ok() && value.ok) {
          writeCount++;
          savedSnapshot = response.request().postDataJSON();
          result.creationSessionId = value.creationSessionId;
          await recordJson(`explicit-save-${writeCount}`, { request: savedSnapshot, response: value }, "explicit-save");
        }
      }
    })().catch(error => {
      captureFailures.push({ pathname, stage: responseStage, message: error.message });
      result.captureFailures = captureFailures;
      result.findings.push({ kind: "infrastructure", cause: "harness_interaction", severity: "high", stage: responseStage, summary: `Evidence capture: ${error.message}`, verified: false });
    });
    pendingEvidence.add(work);
    void work.finally(() => pendingEvidence.delete(work));
  });

  async function captureArtwork(generated, index, { candidateOnly = false } = {}) {
    let bytes;
    if (generated.imageDataUrl) bytes = Buffer.from(generated.imageDataUrl.split(",")[1], "base64");
    else {
      const imageUrl = new URL(generated.imageUrl, baseUrl);
      if (imageUrl.origin !== origin.origin) throw new Error("Generated artwork escaped local campaign storage");
      const response = await context.request.get(imageUrl.href);
      if (!response.ok()) throw new Error(`Artwork fetch ${response.status()}`);
      bytes = await withCampaignTimeout(response.body(), { label: "Generated artwork response body" });
    }
    const artifact = await archiveGeneratedArtwork({ bytes, targetPath: path.join(caseDir, `${candidateOnly ? "unaccepted-candidate" : "artwork"}-${index}.webp`), runDir });
    if (candidateOnly) {
      result.generations[index - 1].rejectedCandidate = { candidateOnly: true, unaccepted: true, partial: false, streamEventIndex: generated.streamEventIndex, artifactSha256: artifact.sourceHash, archival: artifact };
    } else {
      result.generations[index - 1].artifactSha256 = artifact.sourceHash;
      result.generations[index - 1].archival = artifact;
    }
    result.evidence.push({ kind: candidateOnly ? "unaccepted-artwork-candidate" : "artwork", path: path.relative(runDir, artifact.finalWebp).replaceAll("\\", "/"), exists: true, verifiedWebp: true, attemptId, ...(candidateOnly ? { candidateOnly: true, unaccepted: true } : {}) });
  }

  async function settleLayout() {
    let previous = "";
    let stable = 0;
    for (let index = 0; index < 30; index++) {
      const current = await page.evaluate(() => JSON.stringify([...document.querySelectorAll("[data-app-navigation], #create-preview-panel, [role='dialog']")].map(element => { const rect = element.getBoundingClientRect(); return [rect.x, rect.y, rect.width, rect.height, getComputedStyle(element).transform]; })));
      stable = current === previous ? stable + 1 : 0;
      if (stable >= 3) return;
      previous = current;
      await page.waitForTimeout(100);
    }
  }

  async function screenshot(name) {
    await settleLayout();
    const target = path.join(caseDir, `${name}.png`);
    await page.screenshot({ path: target, fullPage: true });
    result.evidence.push({ kind: "screenshot", path: path.relative(runDir, target).replaceAll("\\", "/"), exists: true, attemptId });
  }

  async function send(message, kind) {
    const userTurns = result.transcript.filter(turn => turn.role === "user").length;
    if (userTurns >= 14) throw new Error("turn_limit: Maximum 14 user turns reached");
    await stage(kind, `turn-${userTurns + 1}`);
    const chatTab = page.getByRole("tab", { name: "Chat", exact: true });
    if (await chatTab.isVisible().catch(() => false)) await chatTab.click();
    const editor = page.getByRole("textbox", { name: /Start planning from scratch|Refine invite/ });
    if (!await editor.isVisible().catch(() => false)) {
      const edit = page.getByRole("button", { name: "Edit in chat", exact: true }).first();
      if (await edit.isVisible()) await edit.click();
    }
    await editor.fill(message);
    const started = Date.now();
    result.transcript.push({ role: "user", kind, text: message, at: new Date().toISOString() });
    await save();
    const [response] = await Promise.all([
      page.waitForResponse(response => /\/api\/creation\/intake(?:\/stream)?(?:\?|$)/.test(response.url()) && response.request().method() === "POST", { timeout }),
      page.getByRole("button", { name: "Send", exact: true }).click(),
    ]);
    const value = readIntakeResponse(await readCapturedResponse(response));
    const intakeDurationMs = Date.now() - started;
    if (kind !== "style_edit") {
      result.transcript.push({ role: "assistant", kind, text: value.assistantMessage || value.error || "", usedAi: value.usedAi ?? null, durationMs: intakeDurationMs, source: "intake_response" });
      if (value.draft) latestDraft = value.draft;
    } else {
      result.internalIntakeResponses ||= [];
      result.internalIntakeResponses.push({ kind, assistantMessage: value.assistantMessage, usedAi: value.usedAi ?? null, durationMs: intakeDurationMs, rendered: false });
    }
    await page.getByRole("button", { name: "Cancel chat and return to dashboard", exact: true }).waitFor({ state: "visible", timeout });
    await finishEvidenceCapture();
    if (kind === "style_edit") {
      const outcome = await collectRenderedStyleOutcome(page, message);
      result.uiOutcomes ||= [];
      result.uiOutcomes.push({ kind, ...outcome, durationMs: Date.now() - started });
      for (const turn of outcome.messages) result.transcript.push({ ...turn, kind, source: "client_status", usedAi: null, durationMs: Date.now() - started });
      const editedGeneration = result.generations?.at(-1);
      if (((editedGeneration?.phase === "style_edit" && editedGeneration.ok === true) || outcome.messages.some(turn => turn.role === "assistant")) && !outcome.alerts.length && value.draft) latestDraft = value.draft;
      await recordJson("style-edit-rendered-outcome", outcome, "rendered-chat-outcome");
    }
    await save();
    if (!response.ok() || value.error) throw new Error(value.error || `HTTP ${response.status()}`);
    return value;
  }

  async function generate() {
    await stage("generation");
    latestGeneration = null;
    const button = page.getByRole("button", { name: "Generate now", exact: true });
    if (!await button.isVisible().catch(() => false)) throw new Error("generation_unavailable: Generate now was not offered after the supplied facts");
    const [generationResponse] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === "/api/studio/generate", { timeout }),
      button.click(),
    ]);
    const failure = await withCampaignTimeout(generationResponse.finished(), { label: "Generation response completion" });
    if (failure) throw new Error(`harness_interaction: Generation response interrupted: ${failure.message}`);
    await page.getByRole("button", { name: "Cancel chat and return to dashboard", exact: true }).waitFor({ state: "visible", timeout });
    await finishEvidenceCapture();
    await screenshot("first-generation");
    await save();
    if (!latestGeneration?.ok || !(latestGeneration.imageUrl || latestGeneration.imageDataUrl)) throw new Error("generation_failed: No real generated artwork returned");
    if (!result.generations.at(-1)?.archival?.verification?.decoded) throw new Error("artwork_archive_failed: Generated image has no verified WebP archive");
  }

  try {
    const csrf = await context.request.get(`${baseUrl}/api/auth/csrf`);
    const csrfToken = (await csrf.json()).csrfToken;
    const login = await context.request.post(`${baseUrl}/api/auth/callback/credentials`, { form: { csrfToken, email: account.email, password: account.password, json: "true", callbackUrl: `${baseUrl}/chat` } });
    if (!login.ok()) throw new Error(`Authentication failed (${login.status()})`);
    const session = await (await context.request.get(`${baseUrl}/api/auth/session`)).json();
    if (session.user?.email !== account.email) throw new Error("Authentication did not establish the isolated test user");
    result.checks.authenticatedRegularUser = session.user.isAdmin !== true;
    const countsBefore = await databaseCounts(account.email);
    await page.goto(`${baseUrl}/chat`, { waitUntil: "domcontentloaded", timeout });
    const cookieChoice = page.getByRole("button", { name: "Essential only", exact: true });
    // Fresh contexts have no consent state. Wait for client hydration before
    // interacting with the composer; a pre-hydration fill is not a user turn.
    await cookieChoice.waitFor({ state: "visible", timeout: 45_000 });
    await cookieChoice.click();
    await cookieChoice.waitFor({ state: "hidden" });
    await page.getByRole("group", { name: "Choose product format" }).getByRole("button", { name: labels[scenario.output], exact: true }).click();
    await screenshot("start-desktop");
    const turns = scenario.messages;
    await send(turns.find(turn => turn.kind === "opening").text, "opening");
    const answers = turns.filter(turn => turn.kind === "answer");
    for (const turn of answers) await send(turn.text, "answer");
    for (const turn of turns.filter(turn => turn.kind === "question" || turn.kind === "correction")) {
      const value = await send(turn.text, turn.kind);
      if (turn.kind === "question") result.qaResults.push({ question: turn.text, answer: value.assistantMessage, expectedBehavior: scenario.questionChecks?.find(check => check.messageId === turn.id)?.expectedBehavior, verdict: "unreviewed" });
    }
    // A genuine date confirmation is answered using only the sealed scenario facts.
    if (latestDraft?.currentQuestion === "date_confirmation") await send(`Yes, ${scenario.facts.date} is the date I intend.`, "date_confirmation");
    result.checks.beforeExplicitSave = { before: countsBefore, after: await databaseCounts(account.email), observedDraftWrites: writeCount };
    if (conversationOnly) {
      await screenshot("conversation-desktop");
      await page.setViewportSize({ width: 390, height: 844 });
      await screenshot("conversation-mobile");
      result.checks.conversationMobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      result.stage = "conversation_review";
      result.status = "incomplete";
      result.deferredStages = ["generation", "appearance_edit", "preview", "save_resume", "publish", "guest"];
      return result;
    }
    await generate();
    const visual = turns.find(turn => turn.kind === "style_edit");
    if (visual) {
      const before = [...(result.generations || [])];
      const factsBefore = structuredClone(latestDraft);
      const proposedEdit = await send(visual.text, "style_edit");
      const checked = assessAppearanceEdit({ before, after: result.generations });
      result.checks.appearanceEditProposedFactChanges = diffDraftFacts(factsBefore, proposedEdit.draft);
      result.checks.appearanceEditFactChanges = diffDraftFacts(factsBefore, latestDraft);
      result.checks.appearanceEditFactsPreserved = result.checks.appearanceEditFactChanges.length === 0;
      result.checks.appearanceEditFactEvidence = checked.recoverable ? "retained_pre_edit_state_pending_save_confirmation" : "accepted_intake_draft";
      for (const change of result.checks.appearanceEditFactChanges) result.findings.push({ kind: "product", severity: "high", verified: true, summary: `Appearance edit changed ${change.field}`, detail: change, stage: "style_edit" });
      result.checks.appearanceEditSucceeded = checked.complete;
      result.checks.editFailed = !checked.complete;
      if (!checked.complete && !checked.recoverable) throw new Error(`appearance_edit_failed: ${checked.reason}`);
      if (checked.recoverable) {
        result.recovery = { kind: "continue_with_original_after_rejected_edit", stage: "style_edit", errorCode: "image_quality_failed", acceptedArtifactSha256: checked.original.artifactSha256, acceptedImageUrl: checked.original.imageUrl, editSucceeded: false };
        result.findings.push({ kind: "product", severity: "high", verified: true, stage: "style_edit", cause: "image_quality_failed", summary: "Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork.", detail: { errors: checked.rejection.errors, timings: checked.rejection.timings, recovery: result.recovery } });
      } else if (!result.generations.at(-1)?.archival?.verification?.decoded) throw new Error("artwork_archive_failed: Edited image has no verified WebP archive");
      await screenshot("appearance-edit");
      await save();
    }
    await stage("preview");
    for (const [name, width, height] of [["preview-desktop", 1280, 900], ["preview-mobile", 390, 844]]) {
      await page.setViewportSize({ width, height });
      const preview = page.getByRole("tab", { name: "Preview", exact: true });
      if (await preview.isVisible().catch(() => false)) await preview.click();
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      const dialog = page.getByRole("dialog").last();
      await dialog.waitFor({ state: "visible" });
      if (name === "preview-mobile") {
        const mobile = dialog.getByRole("button", { name: "Mobile", exact: true });
        if (await mobile.isVisible().catch(() => false)) await mobile.click();
      }
      const artwork = await collectPreviewArtwork(dialog);
      await screenshot(name);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      result.checks[name] = { horizontalOverflow: overflow, fullScreenOpened: true, artwork };
      await dialog.getByRole("button", { name: "Close preview", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await save();
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    result.checks.beforeExplicitSave.after = await databaseCounts(account.email);
    result.checks.beforeExplicitSave.observedDraftWrites = writeCount;
    await stage("save_resume");
    const beforeResume = structuredClone(latestDraft);
    await page.getByRole("button", { name: "Cancel chat and return to dashboard", exact: true }).click();
    const [draftResponse] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === "/api/creation/draft" && response.request().method() === "PUT", { timeout: 60_000 }),
      page.getByRole("button", { name: "Save and leave", exact: true }).click(),
    ]);
    const saved = await withCampaignTimeout(draftResponse.json(), { label: "Saved draft response body" });
    if (!draftResponse.ok() || !saved.ok) throw new Error(`explicit_save_failed: ${saved.error || draftResponse.status()}`);
    await page.waitForURL(url => url.pathname !== "/chat", { timeout: 60_000 });
    await finishEvidenceCapture();
    result.checks.explicitSaveWrites = writeCount;
    result.creationSessionId = saved.creationSessionId || latestDraft?.creationSessionId;
    if (!result.creationSessionId) throw new Error("Saved draft lacks a session identifier");
    const [resumedResponse] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === "/api/creation/intake" && response.request().method() === "GET", { timeout: 60_000 }),
      page.goto(`${baseUrl}/chat?thread=${encodeURIComponent(result.creationSessionId)}`, { waitUntil: "domcontentloaded", timeout }),
    ]);
    const resumed = await withCampaignTimeout(resumedResponse.json(), { label: "Resumed draft response body" });
    await recordJson("resumed-draft", resumed, "resume-response");
    if (!resumedResponse.ok() || resumed?.ok !== true || !resumed.draft || typeof resumed.draft !== "object" || Array.isArray(resumed.draft)) throw new Error(`resume_failed: ${resumed?.error || "The saved chat did not restore an event draft"}`);
    latestDraft = resumed.draft;
    result.checks.resumeFactsPreserved = diffDraftFacts(beforeResume, resumed.draft).length === 0;
    result.checks.resumeArtworkPreserved = Boolean(savedSnapshot?.studioInvite?.imageUrl && savedSnapshot.studioInvite.imageUrl === resumed.studioInvite?.imageUrl);
    if (result.recovery) {
      result.checks.appearanceEditFactChanges = diffDraftFacts(beforeResume, resumed.draft);
      result.checks.appearanceEditFactsPreserved = result.checks.appearanceEditFactChanges.length === 0;
      result.checks.appearanceEditFactEvidence = "explicit_saved_draft_restored";
      for (const change of result.checks.appearanceEditFactChanges) result.findings.push({ kind: "product", severity: "high", verified: true, summary: `Rejected appearance edit recovery changed ${change.field}`, detail: change, stage: "save_resume" });
      result.checks.recoveryOriginalArtworkPreserved = Boolean(result.recovery.acceptedImageUrl && savedSnapshot?.studioInvite?.imageUrl && new URL(result.recovery.acceptedImageUrl, baseUrl).href === new URL(savedSnapshot.studioInvite.imageUrl, baseUrl).href && result.checks.resumeArtworkPreserved);
      if (!result.checks.recoveryOriginalArtworkPreserved) throw new Error("appearance_edit_recovery_failed: Explicit save did not preserve the accepted original artwork");
    }
    result.checks.afterExplicitSave = await databaseCounts(account.email);
    await page.getByRole("button", { name: "Publish", exact: true }).waitFor({ timeout: 60_000 });
    await screenshot("resumed-draft");
    await stage("publish");
    const [publishResponse] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === "/api/creation/intake" && response.request().method() === "POST", { timeout: 60_000 }),
      page.getByRole("button", { name: "Publish", exact: true }).click(),
    ]);
    const publishFailure = await withCampaignTimeout(publishResponse.finished(), { label: "Publication response completion" });
    if (publishFailure) throw new Error(`harness_interaction: Publication response interrupted: ${publishFailure.message}`);
    const publication = await withCampaignTimeout(publishResponse.json(), { label: "Publication response body" });
    if (!publishResponse.ok() || !publication.ok || !publication.savedEventId) throw new Error(`publication_failed: ${publication.error || publishResponse.status()}`);
    publishedEventId = publication.savedEventId;
    await page.getByRole("button", { name: "Cancel chat and return to dashboard", exact: true }).waitFor({ state: "visible", timeout: 60_000 });
    await finishEvidenceCapture();
    if (!publishedEventId) throw new Error("Publish did not return an event identifier");
    result.eventId = publishedEventId;
    const publicHref = await page.locator('a[href^="/card/"], a[href^="/event/"]').filter({ hasText: /Open|View/ }).first().getAttribute("href");
    if (!publicHref) throw new Error("Published output has no guest link");
    result.publicUrl = new URL(publicHref, baseUrl).href;
    await screenshot("published-owner");
    result.checks.afterPublish = await databaseCounts(account.email);
    await stage("guest");
    const guest = await runCampaignGuestJourney({ browser, publicUrl: result.publicUrl, baseUrl, eventId: publishedEventId, caseDir, runDir, caseId: scenario.id, attemptId, expectedDraft: latestDraft });
    result.guest = guest;
    result.guestText = guest.text;
    result.guestActions = guest.actions;
    result.checks.anonymousGuestStatus = guest.checks.anonymousGuestStatus;
    result.checks.requiredGuestActionsPassed = guest.checks.requiredGuestActionsPassed;
    result.evidence.push(...guest.evidence);
    result.findings.push(...guest.findings);
    if (guest.failure) throw new Error(`harness_interaction: ${guest.failure}`);
    result.stage = "needs_review";
    result.status = "unreviewed";
  } catch (error) {
    result.status = /budget|bound_unavailable/.test(error.message) ? "budget-deferred" : "blocked";
    result.failure = error.message;
    const harnessFailure = /harness_maintenance|harness_interaction|strict mode violation|locator\.|waiting for (?:getBy|locator)|Target page, context or browser|browserType\.|campaign_browser_requires|guest_isolation_required/.test(error.message);
    result.error = { code: error.code === "harness_maintenance" ? "harness_maintenance" : harnessFailure ? "harness_interaction" : "journey_incomplete", message: error.message };
    result.executionClassification = harnessFailure ? "infrastructure" : "unclassified";
    result.findings.push({ severity: "high", summary: error.message, stage: result.stage, kind: harnessFailure ? "infrastructure" : "execution", cause: harnessFailure ? "harness_interaction" : undefined, verified: false });
    await screenshot("stopped").catch(() => {});
    result.visibleText = await page.locator("body").innerText().catch(() => "");
  } finally {
    const cleanupFailure = error => captureFailures.push({ stage: result.stage, message: error.message });
    // Closing capture first releases pending Network bodies even when a reload
    // prevented loadingFinished. Do not await those bodies before cancelling.
    await responseCapture.close().catch(cleanupFailure);
    await withCampaignTimeout(Promise.allSettled([...pendingEvidence]), { label: "Final response evidence" }).catch(cleanupFailure);
    await withCampaignTimeout(browser.close(), { timeoutMs: 10_000, label: "Campaign browser close" }).catch(cleanupFailure);
    if (captureFailures.length) result.captureFailures = captureFailures;
    if (captureFailures.length && !result.failure) {
      result.status = "blocked";
      result.failure = `harness_interaction: Evidence capture failed: ${captureFailures[0].message}`;
      result.error = { code: "harness_interaction", message: result.failure };
      result.executionClassification = "infrastructure";
    }
    result.finishedAt = new Date().toISOString();
    result.timings.totalMs = Date.parse(result.finishedAt) - Date.parse(result.startedAt);
    await save();
  }
  return result;
}
