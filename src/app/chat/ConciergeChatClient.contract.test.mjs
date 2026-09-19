import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { publicContentForDraft } from "../../lib/concierge/public-content.ts";
import { resolveProductEditPlan } from "../../lib/studio/product-edit-plan.ts";
import { resolveStudioProduct } from "../../lib/studio/product-contract.ts";
import { shouldRegenerateGeneratedDraftImageForEdit } from "../../lib/concierge/artwork-change.ts";
import { buildPersonaTurnReceipt, guardPersonaSentence } from "../../lib/concierge/persona-contract.ts";
import { conciergeCapabilityAnswer } from "../../lib/concierge/capabilities.ts";

const source = fs.readFileSync(new URL("./ConciergeChatClient.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("chat.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = new Set(["draftHeadline", "draftSubheadline", "uniqueDisplayLine", "additionalLocationLine", "additionalLocationNarrative", "studioCategoryForDraft", "dateInputFromDraft", "localDateInputFromIso", "timeInputFromDraft", "draftVisualDirection", "buildStudioDetailsFromDraft"]);
const helpers = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text));
const build = new Function("stringValue", "createInitialDetails", "skinLabelForDraft", "publicContentForDraft", `${ts.transpile(helpers.map(node => node.getText(ast)).join("\n"))}; return buildStudioDetailsFromDraft;`)(
  value => typeof value === "string" ? value.trim() || null : null, () => ({}), () => "Original design", publicContentForDraft,
);
const draft = {
  eventType: "sport_event", title: "Rivera swim meet", titleConfirmed: true, honoreeName: "Rivera team",
  previewCopy: { headline: "Event draft", body: "Join the team.", subheadline: "Meet day" },
  eventPurpose: "swim meet", requestedOutputs: ["event_page"],
  dateText: "September 23, 2026", timeText: "Warmup at 1 PM, meet at 2 PM",
  startISO: "2026-09-23T19:00:00.000Z", endISO: "2026-09-23T21:00:00.000Z", timezone: "America/Chicago",
  venue: "Maple Center", location: "100 Example Road, Room B", additionalLocations: [], rsvpEnabled: true,
};

test("chat generation uses the approved primary clock in event timezone, not itinerary prose", () => {
  const details = build(draft);
  assert.equal(details.eventDate, "2026-09-23");
  assert.equal(details.startTime, "14:00");
  assert.equal(details.endTime, "16:00");
  assert.equal(details.calendarStartISO, draft.startISO);
  assert.equal(details.calendarEndISO, draft.endISO);
  assert.equal(details.timezone, draft.timezone);
});

test("a stale generated headline cannot replace a supplied title", () => {
  assert.equal(build(draft).eventTitle, "Rivera swim meet");
});

test("anniversary and school open house keep their semantic identity in the generation adapter", () => {
  const anniversary = build({ ...draft, eventType: "anniversary", semanticKind: "anniversary", honoreeName: "Elena and Sam", ageOrMilestone: "25th anniversary" });
  assert.equal(anniversary.category, "Anniversary");
  assert.equal(anniversary.semanticKind, "anniversary");
  assert.equal(anniversary.age, "");
  const school = build({ ...draft, eventType: "open_house", semanticKind: "school_open_house" });
  assert.equal(school.category, "Custom Invite");
  const reveal = build({ ...draft, eventType: "gender_reveal" });
  assert.equal(reveal.category, "Baby Shower");
  assert.equal(reveal.eventKind, "gender_reveal");
});

test("approved guest requirements and exact artwork copy reach the generation contract separately", () => {
  const details = build({ ...draft, semanticKind: "clinic", publicContent: { version: 1, revision: 1, items: [
    { id: "safety", kind: "safety", text: "Non-contact skills session.", sourceText: "Non-contact skills session.", sourceMessage: "Non-contact skills session." },
    { id: "copy", kind: "exact_copy", text: "Ready, set, celebrate!", sourceText: "Keep the exact line.", sourceMessage: "Keep the exact line." },
  ] } });
  assert.deepEqual(details.guestInstructions, ["Non-contact skills session."]);
  assert.deepEqual(details.requiredArtworkLines, ["Ready, set, celebrate!"]);
  assert.equal(details.semanticKind, "clinic");
});

function editHarness({ fail = false, generate, preload, typography = {}, assistantMessage, nextDraft = draft, previousDraft = draft } = {}) {
  let declaration;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "sendGeneratedDraftEdit") declaration = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const original = { imageUrl: "accepted-existing.webp", invitationData: { artworkTextMode: "none", eventDetails: { pageTypography: typography } } };
  const state = { generations: [], invite: original, messages: [], error: null };
  const noop = () => {};
  const scope = {
    draft: previousDraft, draftStudioInvite: original, generatedInviteImageUrl: original.imageUrl,
    conversationVersionRef: { current: 1 }, responseAbortRef: { current: null },
    isGeneratedDraftFullRedesignRequest: () => false,
    newMessage: (role, text) => ({ role, text }), setError: value => { state.error = value; },
    setFailedRequest: noop, setIsSending: noop, setPhase: noop, setGenerationStage: noop,
    setStreamingPreviewImage: noop, setMessages: update => { state.messages = update(state.messages); },
    fetch: async () => ({ ok: true, json: async () => ({ ok: true, draft: nextDraft, assistantMessage }) }),
    withConciergeTiming: value => value, CREATION_INTAKE_URL: "/offline-intake",
    effectiveSelectedProductOutput: previousDraft.requestedOutputs[0], chatMessagesForPersistence: value => value,
    messages: [], normalizeDraftProductOutputs: value => value,
    resolveStudioProduct, resolveProductEditPlan, shouldRegenerateGeneratedDraftImageForEdit,
    buildPersonaTurnReceipt, guardPersonaSentence, conciergeCapabilityAnswer,
    refreshGeneratedDraftInviteMetadata: (invite, next, pageTypography) => ({ ...invite, invitationData: { ...invite.invitationData, eventDetails: { pageTypography, ...build(next) } } }),
    generateStudioInviteForDraft: async (_next, options) => {
      state.generations.push(options);
      if (generate) return generate(options);
      if (fail) throw new Error("The edited image did not pass quality checks.");
      return { imageUrl: "existing-replacement-fixture.webp", invitationData: { eventDetails: { pageTypography: options.pageTypography } } };
    },
    preloadGeneratedPreviewImage: preload || (async () => {}),
    setDraft: noop, setDraftStudioInvite: value => { state.invite = value; },
    selectProductOutputForDraft: value => { state.selectedOutput = value.requestedOutputs[0]; },
    setGeneratedInviteImageUrl: noop, setLiveCardEventId: noop, setLiveCardTitle: noop,
    setLiveCardSummary: value => { state.summary = value; }, setWeatherContext: noop, setMobileView: noop,
    draftHeadline: value => value.title, liveCardSummaryFromDraft: (_value, output) => ({ output }),
    buildGeneratedDraftImageEditPrompt: ({ userMessage }) => userMessage,
    notifyCreationThreadsChanged: noop, refocusComposerAfterResponse: noop,
  };
  return { state, scope, original, edit: new Function(...Object.keys(scope), `${ts.transpile(declaration.getText(ast))}; return sendGeneratedDraftEdit;`)(...Object.values(scope)) };
}

test("the actual Event Page edit handler applies larger lettering with zero image calls", async () => {
  const h = editHarness();
  await h.edit("Make all lettering larger.");
  assert.equal(h.state.error, null);
  assert.equal(h.state.generations.length, 0);
  assert.equal(h.state.invite.imageUrl, h.original.imageUrl);
  assert.equal(h.state.invite.invitationData.eventDetails.pageTypography.scale, 1.2);
});

test("mixed page edits send only raster changes to generation and preserve the HTML edit", async () => {
  const h = editHarness();
  await h.edit("Make the background darker and the lettering larger.");
  assert.equal(h.state.error, null);
  assert.equal(h.state.generations.length, 1);
  assert.match(h.state.generations[0].editPrompt, /background darker/i);
  assert.doesNotMatch(h.state.generations[0].editPrompt, /letter|font/i);
  assert.equal(h.state.invite.invitationData.eventDetails.pageTypography.scale, 1.2);
});

test("a rejected mixed edit leaves accepted artwork intact and never claims success", async () => {
  const h = editHarness({ fail: true });
  await h.edit("Make the background darker and the lettering larger.");
  assert.equal(h.state.invite, h.original);
  assert.match(h.state.error, /quality checks/);
  assert.equal(h.state.messages.filter(message => message.role === "assistant").length, 0);
});

test("unsupported page font and layout requests preserve the page without a paid image attempt or false success", async () => {
  for (const message of ["Use a cursive font.", "Move the title below the details.", "Make the background blue and use serif lettering."]) {
    const h = editHarness();
    await h.edit(message);
    assert.equal(h.state.generations.length, 0);
    assert.equal(h.state.invite, h.original);
    assert.match(h.state.error, /not supported yet/);
    assert.equal(h.state.messages.filter(item => item.role === "assistant").length, 0);
  }
});

test("repeated larger requests increase the actual page scale until its supported limit", async () => {
  const larger = editHarness({ typography: { scale: 1.2, contrast: "high" } });
  await larger.edit("Make the lettering larger.");
  assert.equal(larger.state.invite.invitationData.eventDetails.pageTypography.scale, 1.44);
  const capped = editHarness({ typography: { scale: 1.5, contrast: "high" } });
  await capped.edit("Make the lettering larger.");
  assert.match(capped.state.messages.at(-1).text, /already.*150%/);
  assert.equal(capped.state.generations.length, 0);
});

test("a no-op generated draft edit cannot claim the title was changed", async () => {
  const h = editHarness({ assistantMessage: "I changed the title to Birthday draft." });
  await h.edit("Change the title to Rivera Workshop.");
  assert.equal(h.state.generations.length, 0);
  assert.match(h.state.messages.at(-1).text, /unchanged/);
  assert.doesNotMatch(h.state.messages.at(-1).text, /I changed the title/);
});

test("generated draft capability questions receive their answer instead of a fake edit acknowledgment", async () => {
  const h = editHarness();
  await h.edit("Can I download this flyer?");
  assert.equal(h.state.generations.length, 0);
  assert.match(h.state.messages.at(-1).text, /download/i);
  assert.doesNotMatch(h.state.messages.at(-1).text, /I updated/);
});

test("changing a generated product selects the matching preview and summary only after acceptance", async () => {
  for (const output of ["event_page", "digital_flyer"]) {
    const h = editHarness({ previousDraft: { ...draft, requestedOutputs: ["live_card"] }, nextDraft: { ...draft, requestedOutputs: [output] } });
    await h.edit(output === "event_page" ? "Make this an Event Page." : "Make this a Flyer.");
    assert.equal(h.state.error, null);
    assert.equal(h.state.generations.length, 1);
    assert.equal(h.state.selectedOutput, output);
    assert.equal(h.state.summary.output, output);
  }
  const failed = editHarness({ fail: true, previousDraft: { ...draft, requestedOutputs: ["live_card"] }, nextDraft: { ...draft, requestedOutputs: ["event_page"] } });
  await failed.edit("Make this an Event Page.");
  assert.equal(failed.state.selectedOutput, undefined);
  assert.equal(failed.state.invite, failed.original);
});

test("a superseded image edit cannot replace artwork or claim success after the provider resolves", async () => {
  let complete;
  const h = editHarness({ generate: () => new Promise(resolve => { complete = resolve; }) });
  const pending = h.edit("Make the background darker.");
  while (!complete) await Promise.resolve();
  h.scope.responseAbortRef.current.abort();
  h.scope.responseAbortRef.current = new AbortController();
  complete({ imageUrl: "stale-result.webp", invitationData: { eventDetails: {} } });
  await pending;
  assert.equal(h.state.invite, h.original);
  assert.equal(h.state.messages.filter(message => message.role === "assistant").length, 0);
  assert.equal(h.state.error, null);
});

test("cancelling while a new image loads preserves the accepted artwork", async () => {
  let complete;
  const h = editHarness({ preload: () => new Promise(resolve => { complete = resolve; }) });
  const pending = h.edit("Make the background darker.");
  while (!complete) await Promise.resolve();
  h.scope.responseAbortRef.current.abort();
  complete();
  await pending;
  assert.equal(h.state.invite, h.original);
  assert.equal(h.state.messages.filter(message => message.role === "assistant").length, 0);
});
