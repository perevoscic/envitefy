import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test, { mock } from "node:test";
registerHooks({ resolve(specifier, context, next) {
  const url = specifier.startsWith("@/") ? pathToFileURL(resolve("src", specifier.slice(2))) : specifier.startsWith(".") ? new URL(specifier, context.parentURL) : null;
  return url && existsSync(new URL(`${url}.ts`)) ? next(`${url}.ts`, context) : next(specifier, context);
} });
const { createInitialDetails, sanitizeEventDetails, sanitizeInvitationData, sanitizeStudioGenerateResponse } = await import("./studio-workspace-sanitize.ts");
const { buildStudioRequest, refreshLiveCardInvitationData, buildStudioPublishPayload } = await import("./studio-workspace-builders.ts");
const { compileArtworkContract } = await import("../../lib/studio/artwork-copy.ts");
const { StudioGenerationRequestError } = await import("../../lib/studio/generation-error.ts");
const { requestStudioGeneration } = await import("./studio-workspace-api.ts");
const details = { ...createInitialDetails(), category: "Game Day", product: "digital_flyer", eventTitle: "Cedar Non-contact Clinic", eventDate: "2026-09-23", startTime: "14:00", endTime: "16:00", timezone: "America/Chicago", calendarStartISO: "2026-09-23T19:00:00.000Z", calendarEndISO: "2026-09-23T21:00:00.000Z", venueName: "Maple Center", location: "100 Example Lane", guestInstructions: ["Bring a mouthguard and water."], requiredArtworkLines: ["Non-contact skills session"], semanticKind: "lacrosse clinic", rsvpEnabled: true, rsvpContact: "coach@example.invalid", theme: "Forest green and cream" };
const contract = compileArtworkContract(buildStudioRequest(details, "image", "page").event, "digital_flyer");
const diagnostics = { version: 1, contractId: contract.id, operation: "edit", outcome: "rejected", checks: [{ attempt: "initial", status: "failed", issues: ["faux_controls"], repairInstructions: ["Remove the painted heart control."] }, { attempt: "repair", status: "failed", issues: ["missing_copy"], repairInstructions: ["Restore the required safety line."] }] };
const failure = { ok: false, mode: "image", product: "digital_flyer", qualityCheck: "failed", liveCard: null, invitation: null, imageDataUrl: null, warnings: [], diagnostics, artworkContract: contract, errors: { image: { code: "image_quality_failed", message: "Your previous image is unchanged.", retryable: true, provider: "openai" } } };
test.afterEach(() => mock.restoreAll());

test("explicit RSVP and public instructions survive the Game Day builder without invented gifts or a default gold palette", () => {
  const request = buildStudioRequest(details, "image", "page");
  assert.equal(request.event.rsvpContact, "coach@example.invalid");
  assert.equal(request.event.registryNote, null);
  assert.deepEqual(request.event.guestInstructions, details.guestInstructions);
  assert.deepEqual(request.event.requiredArtworkLines, details.requiredArtworkLines);
  assert.equal(request.event.semanticKind, "lacrosse clinic");
  assert.match(request.guidance.colorPalette, /Forest green and cream/);
  assert.doesNotMatch(request.guidance.colorPalette, /gold/);
});
test("canonical title, corrected schedule and copy replace previous invitation facts without replacing its design", () => {
  const invitation = refreshLiveCardInvitationData(details, { title: "Workshop draft", scheduleLine: "September 23 at noon", description: "Discard this obsolete description", theme: { primaryColor: "#112233", secondaryColor: "#445566", accentColor: "#778899", themeStyle: "original" } });
  assert.equal(invitation.title, details.eventTitle);
  assert.match(invitation.scheduleLine, /2:00 PM – 4:00 PM/);
  assert.doesNotMatch(invitation.scheduleLine, /noon/);
  assert.match(invitation.description, /mouthguard/);
  assert.match(invitation.description, /Non-contact skills session/);
  assert.doesNotMatch(invitation.description, /obsolete/);
  assert.equal(invitation.theme.primaryColor, "#112233");
});
test("public wording preserves distinct non-Latin blocks and longer specific instructions", () => {
  const invitation = refreshLiveCardInvitationData({ ...details, approvedWording: "欢迎参加庆祝活动", guestInstructions: ["请自带水", "Bring water", "Bring water and a mouthguard"], requiredArtworkLines: [] });
  for (const line of ["欢迎参加庆祝活动", "请自带水", "Bring water", "Bring water and a mouthguard"]) assert.ok(invitation.description.includes(line));
});
test("saved creation metadata retains the exact content contract, QA evidence, typography and canonical instants", () => {
  const restoredDetails = sanitizeEventDetails(JSON.parse(JSON.stringify({ ...details, category: "Baby Shower", eventKind: "gender_reveal", pageTypography: { scale: 1.2, contrast: "high", foreground: "dark" } })));
  assert.deepEqual(restoredDetails.guestInstructions, details.guestInstructions);
  assert.deepEqual(restoredDetails.requiredArtworkLines, details.requiredArtworkLines);
  assert.equal(restoredDetails.calendarStartISO, details.calendarStartISO);
  assert.deepEqual(restoredDetails.pageTypography, { scale: 1.2, contrast: "high", foreground: "dark" });
  assert.equal(restoredDetails.eventKind, "gender_reveal");
  assert.equal(restoredDetails.category, "Baby Shower");
  const restored = sanitizeStudioGenerateResponse(JSON.parse(JSON.stringify(failure)));
  assert.deepEqual(restored.diagnostics, diagnostics);
  assert.deepEqual(restored.artworkContract, contract);
  assert.equal(restored.qualityCheck, "failed");
  const invitation = refreshLiveCardInvitationData(restoredDetails, { diagnostics, artworkContract: contract });
  const reopened = sanitizeInvitationData(JSON.parse(JSON.stringify(invitation)), restoredDetails);
  assert.equal(reopened.eventDetails.eventKind, "gender_reveal");
  assert.equal(reopened.eventDetails.category, "Baby Shower");
  assert.deepEqual(reopened.diagnostics, diagnostics);
  assert.deepEqual(reopened.artworkContract, contract);
});
test("a failed response retains typed diagnostics and useful reason through the actual client API throw path", async () => {
  mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(failure), { status: 422, headers: { "content-type": "application/json" } }));
  await assert.rejects(requestStudioGeneration(details, "image", "image"), (error) => {
    assert.ok(error instanceof StudioGenerationRequestError);
    assert.match(error.message, /Required wording is missing/);
    assert.match(error.message, /previous image is unchanged/);
    assert.deepEqual(error.diagnostics, diagnostics);
    assert.equal(error.code, "image_quality_failed");
    return true;
  });
});
test("publishing projects canonical timezone and instants rather than the viewing browser's timezone", () => {
  const payload = buildStudioPublishPayload({ id: "fixture", type: "image", status: "ready", theme: "forest", details, data: refreshLiveCardInvitationData(details), createdAt: "2026-09-19T00:00:00Z" }, "/existing-fixture.webp");
  assert.equal(payload.data.timezone, "America/Chicago");
  assert.equal(payload.data.startISO, details.calendarStartISO);
  assert.equal(payload.data.endISO, details.calendarEndISO);
});
