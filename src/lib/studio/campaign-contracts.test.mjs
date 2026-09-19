import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test, { mock } from "node:test";
import { CAMPAIGN_FAMILIES } from "../../../scripts/lib/create-campaign-scenarios.mjs";
import { compileArtworkContract, compareArtworkText } from "./artwork-copy.ts";
import { resolveProductEditPlan } from "./product-edit-plan.ts";
import { buildProductArtworkPrompt } from "./product-prompts.ts";
import { artworkCheckDeps, verifyStudioArtwork } from "./output-checks.ts";
import { requestedStudioPalette } from "./palette.ts";

registerHooks({ resolve(specifier, context, next) {
  const url = specifier.startsWith("@/") ? pathToFileURL(resolve("src", specifier.slice(2))) : specifier.startsWith(".") ? new URL(specifier, context.parentURL) : null;
  return url && existsSync(new URL(`${url}.ts`)) ? next(`${url}.ts`, context) : next(specifier, context);
} });
const { generateStudioInvitation, studioGenerationDeps: deps } = await import("./generate.ts");
test.beforeEach(() => {
  mock.method(deps, "prepareStudioImageGeometry", async (product) => product === "event_page" ? { width: 1536, height: 1024, size: "1536x1024" } : { width: 1024, height: 1536, size: "1024x1536" });
  mock.method(deps, "validateStudioImageGeometry", async () => ({ ok: true, width: 1024, height: 1536 }));
});
const { validateCreativePlan, defaultCreativePlan } = await import("./product-contract.ts");
const event = { title: "Community Lantern Walk", date: "2026-09-23", category: "Custom Invite", guestInstructions: ["Battery-powered lanterns only; no open flames."], requiredArtworkLines: ["Ready, set, celebrate!"], userIdea: "navy and silver lanterns" };
const image = "data:image/png;base64,ZXhpc3Rpbmc=";
test.afterEach(() => mock.restoreAll());

for (const family of CAMPAIGN_FAMILIES) for (const product of ["live_card", "digital_flyer", "event_page"]) {
  test(`${family.id}/${product}: required copy has an allowed surface and identical generator/verifier contract`, () => {
    const details = { ...event, category: family.label, semanticKind: family.id };
    const contract = compileArtworkContract(details, product);
    assert.deepEqual(contract.blockedIssues, []);
    assert.ok(contract.pageText.includes(event.guestInstructions[0]));
    assert.ok(contract.pageText.includes(event.requiredArtworkLines[0]));
    if (product === "event_page") assert.deepEqual(contract.approvedText, []);
    else assert.equal(contract.approvedText.filter((line) => line === event.requiredArtworkLines[0]).length, 1);
    if (product === "digital_flyer") assert.ok(contract.approvedText.includes(event.guestInstructions[0]));
    const prompt = buildProductArtworkPrompt(details, undefined, null, product, 0);
    assert.ok(prompt.includes(contract.id));
    assert.deepEqual(compareArtworkText(contract.approvedText, contract.approvedText), []);
  });
}

test("bilingual exact lines, contact punctuation and required safety survive whole-block deduplication", () => {
  const bilingual = "A little sunshine is on the way\nUn rayito de sol viene en camino";
  const details = { ...event, approvedWording: bilingual, requiredArtworkLines: [bilingual, bilingual], rsvpContact: "rsvp@example.invalid", rsvpEnabled: true };
  const contract = compileArtworkContract(details, "digital_flyer");
  assert.equal(contract.approvedText.filter((line) => line === bilingual).length, 1);
  assert.ok(contract.approvedText.some((line) => line.includes("rsvp@example.invalid")));
  assert.deepEqual(compareArtworkText(contract.approvedText, contract.approvedText.filter((line) => line !== event.guestInstructions[0])), ["missing_copy"]);
  assert.deepEqual(compareArtworkText(["rsvp@example.invalid"], ["rsvp example invalid"]), ["missing_copy"]);
});
test("model text placement cannot contradict approved copy or promise text on a text-free hero", () => {
  const maliciousPlan = { ...defaultCreativePlan(event, "event_page"), textPlacement: "Print the title and an invented RSVP URL in the image." };
  const plan = validateCreativePlan(event, "event_page", maliciousPlan);
  assert.doesNotMatch(plan.textPlacement, /invented RSVP/);
  assert.deepEqual(plan.approvedTextBlockIds, []);
  assert.match(plan.textPlacement, /Text-free website hero/);
});
test("explicit sports cannot acquire unsupported stations in the model creative plan", () => {
  const details = { ...event, title: "Basketball and soccer skills stations", sportType: "basketball and soccer" };
  const plan = validateCreativePlan(details, "live_card", { ...defaultCreativePlan(details, "live_card"), concept: "Basketball, soccer and tennis stations", focalSubject: "tennis players" });
  assert.doesNotMatch(`${plan.concept} ${plan.focalSubject}`, /tennis/);
  assert.match(plan.focalSubject, /Basketball and soccer/);
});
test("explicit user palette replaces generated gold defaults and honors exclusions", () => {
  assert.deepEqual(requestedStudioPalette("navy and silver, no gold"), { primary: "#0f172a", secondary: "#c0c0c0", accent: "#c0c0c0" });
  assert.deepEqual(requestedStudioPalette("green and cream"), { primary: "#166534", secondary: "#fffdd0", accent: "#fffdd0" });
  assert.equal(requestedStudioPalette(""), undefined);
});

for (const request of ["Keep this same event and artwork. Make all lettering larger.", "Make the font larger and more readable.", "Increase font size.", "Make the text darker."]) {
  test(`Event Page typography stays out of image operations: ${request}`, () => {
    const plan = resolveProductEditPlan("event_page", request);
    assert.equal(plan.hasRasterChanges, false);
    assert.ok(Object.keys(plan.pageTypography).length);
  });
}
test("mixed Event Page edit only sends the requested background to image generation", () => {
  const plan = resolveProductEditPlan("event_page", "Make the background darker and the lettering larger. Keep every approved fact and line of copy.");
  assert.equal(plan.hasRasterChanges, true);
  assert.match(plan.rasterInstruction, /background darker/);
  assert.doesNotMatch(plan.rasterInstruction, /letter|copy|fact/);
  assert.equal(plan.pageTypography.scale, 1.2);
  assert.match(resolveProductEditPlan("digital_flyer", "Make the lettering larger.").rasterInstruction, /lettering larger/);
});

test("mixed raster and unsupported font edits are rejected before any provider call", async () => {
  const request = "Make the background blue and use serif lettering.";
  const plan = resolveProductEditPlan("event_page", request);
  assert.equal(plan.rasterInstruction, "Make the background blue");
  assert.deepEqual(plan.unsupportedPageChanges, ["use serif lettering"]);
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => { throw new Error("No provider call allowed"); });
  const result = await generateStudioInvitation({ event, product: "event_page", mode: "image", imageEdit: { sourceImageDataUrl: image, editInstruction: request } });
  assert.equal(result.errors.image.code, "unsupported_page_change");
  assert.equal(result.timings.imageAttempts, 0);
});

test("coordinated public copy operations and quoted words never become raster changes", () => {
  for (const request of [
    "Change the title to Maya and Jordan's Wedding and include the date and time on the page",
    "Add the exact line 'Welcome. Use reusable cups and remove all rubbish.'",
    'Add the title "Make and Use Day" and remove the wording "No gifts please"',
    "Add the exact line 'Let's add and remove decorations.'",
  ]) {
    const plan = resolveProductEditPlan("event_page", request);
    assert.equal(plan.hasRasterChanges, false, request);
    assert.deepEqual(plan.unsupportedPageChanges, [], request);
    assert.deepEqual(plan.pageTypography, {}, request);
  }
});

for (const request of ["Make the headline cursive", "Use a serif font", "Make the text smaller", "Change the page layout to two columns", "Move the title to the bottom", "Reorder the sections"]) {
  test(`unsupported HTML change never reaches the raster: ${request}`, async () => {
    const plan = resolveProductEditPlan("event_page", request);
    assert.equal(plan.hasRasterChanges, false);
    assert.ok(plan.unsupportedPageChanges.length);
    mock.method(deps, "resolveStudioProvider", () => "openai");
    mock.method(deps, "normalizeStudioTheme", async () => { throw new Error("No provider call allowed"); });
    const result = await generateStudioInvitation({ event, product: "event_page", mode: "image", imageEdit: { sourceImageDataUrl: image, editInstruction: request } });
    assert.equal(result.errors.image.code, "unsupported_page_change");
    assert.equal(result.timings.imageAttempts, 0);
  });
}
for (const request of ["Change the title to Rivera Workshop", "Change the title to Blue River Workshop", "Change the title to Maya and Jordan's Wedding", "Change the date to September 23", "Change the venue to Maple Center", "Add the exact line 'Welcome everyone'", "Replace the wording 'Welcome' with 'Hello'", "Add the title School Open House", "Add the title Community Center Celebration", "Remove the wording No gifts please", "Please include the date and time on the page"]) {
  test(`Event Page factual wording changes remain metadata changes: ${request}`, () => {
    const plan = resolveProductEditPlan("event_page", request);
    assert.deepEqual(plan.unsupportedPageChanges, []);
    assert.equal(plan.hasRasterChanges, false);
    assert.deepEqual(plan.pageTypography, {});
  });
}
for (const request of ["Make the background darker behind the title", "Darken the background behind the heading", "Remove the blue balloon behind the title"]) {
  test(`an incidental text reference cannot change the typography target: ${request}`, () => {
    const plan = resolveProductEditPlan("event_page", request);
    assert.deepEqual(plan.unsupportedPageChanges, []);
    assert.deepEqual(plan.pageTypography, {});
    assert.equal(plan.hasRasterChanges, true);
    assert.equal(plan.rasterInstruction, request);
  });
}
test("mixed background and type changes retain independent targets", () => {
  for (const request of ["Make the background darker behind the title and the lettering larger", "Make the background darker with larger lettering"]) {
    const plan = resolveProductEditPlan("event_page", request);
    assert.deepEqual(plan.unsupportedPageChanges, []);
    assert.equal(plan.pageTypography.scale, 1.2);
    assert.equal(plan.pageTypography.foreground, undefined);
    assert.match(plan.rasterInstruction, /background darker/);
    assert.doesNotMatch(plan.rasterInstruction, /larger/);
  }
  const heroTitle = resolveProductEditPlan("event_page", "Make the hero title larger");
  assert.equal(heroTitle.hasRasterChanges, false);
  assert.equal(heroTitle.pageTypography.scale, 1.2);
});

test("oversized required wording is preserved and rejected locally instead of shortened", async () => {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => { throw new Error("No provider call allowed"); });
  const line = "Exact wording ".repeat(1100);
  const result = await generateStudioInvitation({ event: { ...event, requiredArtworkLines: [line] }, product: "digital_flyer", mode: "image" });
  assert.equal(result.errors.image.code, "invalid_artwork_contract");
  assert.match(result.errors.image.message, /12,000 characters/);
  assert.ok(result.artworkContract.requiredText.includes(line.trim()));
  assert.equal(result.timings.imageAttempts, 0);
});
test("combined artwork instructions exceeding the installed SDK prompt limit fail before any model call", async () => {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => { throw new Error("No provider call allowed"); });
  const line = "Required public information ".repeat(300);
  const result = await generateStudioInvitation({ event: { ...event, requiredArtworkLines: [line] }, product: "digital_flyer", mode: "image" });
  assert.equal(result.errors.image.code, "invalid_artwork_contract");
  assert.ok(result.artworkContract.blockedIssues.includes("artwork_prompt_too_long"));
  assert.ok(result.artworkContract.requiredText.includes(line.trim()));
  assert.equal(result.timings.imageAttempts, 0);
});

function stubPipeline() {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => ({ riskLevel: "safe" }));
  mock.method(deps, "applyStudioThemeNormalization", (value) => value);
  mock.method(deps, "resolveStudioReferenceImages", async () => []);
  mock.method(deps, "composeFlyerExport", async (value) => value);
}
test("invalid contract and HTML-only edit make zero model calls", async () => {
  mock.method(deps, "resolveStudioProvider", () => "openai");
  mock.method(deps, "normalizeStudioTheme", async () => { throw new Error("No provider call allowed"); });
  const invalid = await generateStudioInvitation({ event: { title: " " }, product: "live_card" });
  assert.equal(invalid.errors.image.code, "invalid_artwork_contract");
  const html = await generateStudioInvitation({ event, product: "event_page", mode: "image", imageEdit: { sourceImageDataUrl: image, editInstruction: "Make the lettering larger." } });
  assert.equal(html.errors.image.code, "page_typography_only");
  assert.equal(html.timings.imageAttempts, 0);
});
for (const issue of ["faux_controls", "essential_clipping", "safety_mismatch", "missing_copy"]) {
  test(`${issue} is blocking, repairs once and retains both failure reasons`, async () => {
    stubPipeline();
    mock.method(deps, "editInvitationImageWithOpenAi", async () => ({ ok: true, imageDataUrl: image, warnings: [] }));
    mock.method(deps, "verifyStudioArtwork", async () => ({ status: "failed", issues: [issue], repairInstructions: ["Correct the observed defect."] }));
    const result = await generateStudioInvitation({ event, product: "live_card", mode: "image", imageEdit: { sourceImageDataUrl: image, editInstruction: "Make the background darker." } });
    assert.equal(result.ok, false);
    assert.equal(result.imageDataUrl, null);
    assert.equal(result.timings.imageAttempts, 2);
    assert.equal(result.diagnostics.outcome, "rejected");
    assert.deepEqual(result.diagnostics.checks.map((check) => check.issues), [[issue], [issue]]);
  });
}
test("Event Page image edit and repair retain landscape dimensions and exclude HTML typography", async () => {
  stubPipeline();
  let attempts = 0;
  mock.method(deps, "editInvitationImageWithOpenAi", async (prompt, _source, _references, options) => {
    attempts++;
    assert.equal(options.size, "1536x1024");
    assert.doesNotMatch(prompt, /lettering larger/);
    return { ok: true, imageDataUrl: image, warnings: [] };
  });
  mock.method(deps, "verifyStudioArtwork", async () => attempts === 1 ? { status: "failed", issues: ["style_mismatch"] } : { status: "passed", issues: [] });
  const result = await generateStudioInvitation({ event, product: "event_page", mode: "image", imageEdit: { sourceImageDataUrl: image, editInstruction: "Make the background darker and lettering larger." } });
  assert.equal(result.ok, true);
  assert.equal(attempts, 2);
});
test("cancellation after a provider resolves cannot commit or preview a late image", async () => {
  stubPipeline();
  const cancellation = new AbortController();
  const previews = [];
  mock.method(deps, "editInvitationImageWithOpenAi", async () => {
    cancellation.abort(new Error("Cancelled by user"));
    return { ok: true, imageDataUrl: image, warnings: [] };
  });
  await assert.rejects(generateStudioInvitation({ event, product: "live_card", mode: "image", imageEdit: { sourceImageDataUrl: image, editInstruction: "Darker background" } }, { signal: cancellation.signal, onProgress: (progress) => { if (progress.type === "preview") previews.push(progress); } }), /Cancelled by user/);
  assert.deepEqual(previews, []);
});
test("Live Card edit cannot retain an omitted exact line from its source", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "offline-mocked-key";
  mock.method(artworkCheckDeps, "resolveStudioSourceImage", async () => ({ mimeType: "image/png", data: "ZXhpc3Rpbmc=" }));
  mock.method(artworkCheckDeps, "createClient", () => ({ chat: { completions: { create: async (request) => {
    assert.match(request.messages[0].content, /flag pre-existing missing required copy/);
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ visibleText: [event.title], issues: [], repairInstructions: [], requestedChangesApplied: true }) } }] };
  } } } }));
  try {
    const result = await verifyStudioArtwork(image, event, "live_card", { imageEdit: { sourceImageDataUrl: image, editInstruction: "Darker background" } });
    assert.equal(result.status, "failed");
    assert.deepEqual(result.issues, ["missing_copy"]);
  } finally { if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey; }
});
