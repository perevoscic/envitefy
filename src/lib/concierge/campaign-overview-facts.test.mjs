import assert from "node:assert/strict";
import test from "node:test";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { buildConciergeHistoryPayload } from "./history-payload.ts";
import { publicContentForDraft, updatePublicContent } from "./public-content.ts";
import { requestsInvitationCopy } from "./copy-workflow.ts";
import { buildProductCopyPrompt } from "../studio/product-prompts.ts";
import { applyVerifiedCopy } from "../studio/output-checks.ts";
import { normalizeLiveCardMetadata } from "../studio/types.ts";
import { buildLiveCardOverviewPlan } from "../live-card-event-details.ts";
import { buildLiveCardLocationActions } from "../live-card-locations.ts";

const movie = "We are going to watch Forgotten Island at AMC Grand Boulevard.";
const opening = `Livia is turning 10. ${movie} Then dinner at Pazzo SRB. She likes purple balloons. No RSVP.`;

test("a supplied movie survives an LLM omission, later intake replies, and published guest details", async () => {
  let extractionPrompt;
  const result = await extractConciergeDraft({ message: opening, requestedOutputs: ["live_card"] }, {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async (request) => {
      extractionPrompt = request;
      return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ edits: [], previewCopy: null }) } }] };
    } } } }),
  });
  assert.equal(result.usedAi, true);
  assert.match(extractionPrompt.messages[0].content, /stated activity is a public event fact/);
  assert.match(extractionPrompt.messages[0].content, /every supplied activity, named place, stop time and ordering/);
  const context = JSON.parse(extractionPrompt.messages[1].content);
  assert.ok(context.fallbackDraft.publicContent.items.some((item) => item.text === movie));

  let draft = result.draft;
  for (const message of ["September 26 2099 at 4 PM", "Skip the gift link", "Make the artwork lavender with cursive lettering."]) {
    draft = fallbackExtractConciergeDraft({ message, draft });
  }
  const normalized = normalizeConciergeDraft({ previewCopy: { body: "Join us to celebrate Livia." }, publicContent: { items: [] } }, draft, {
    message: "Make the overview more informative.", previousDraft: draft,
  });
  assert.ok(publicContentForDraft(normalized).guestInstructions.includes(movie));
  const details = buildConciergeHistoryPayload(normalized).data.studioCard.invitationData.eventDetails;
  assert.match(details.detailsDescription, /Forgotten Island/);
  const plan = buildLiveCardOverviewPlan({
    locations: buildLiveCardLocationActions(details), startTime: details.startTime,
    descriptions: [details.detailsDescription, ...details.guestInstructions],
  });
  assert.match(plan[0], /AMC Grand Boulevard at 4:00 PM to watch Forgotten Island/);
  assert.match(plan[1], /After the movie.*Pazzo SRB.*dinner/);

  const event = { title: normalized.title, category: "Birthday", description: "Join us to celebrate Livia.", venueName: details.venueName, startTime: details.startTime, guestInstructions: details.guestInstructions };
  const prompt = buildProductCopyPrompt(event, undefined, "live_card");
  const inputs = JSON.parse(prompt.split("\n").at(-1));
  assert.ok(inputs.PUBLIC_FACTS.guestInstructions.includes(movie));
  assert.match(prompt, /check description against every supplied public activity/);
  const modelCopy = normalizeLiveCardMetadata({ title: event.title, description: "A birthday celebration.", themeStyle: "lavender", palette: {}, interactiveMetadata: { ctaLabel: "View details" }, invitation: { title: event.title } });
  assert.ok(modelCopy);
  const verified = applyVerifiedCopy(event, modelCopy);
  assert.match(verified.description, /Forgotten Island/);
  assert.match(verified.description, /Pazzo SRB/);
});

test("only a public viewing plan is captured, not a movie theme or hypothetical idea", () => {
  for (const message of [
    "Use a Forgotten Island movie theme.",
    "Draw guests watching Forgotten Island on the artwork.",
    "Maybe we could watch Forgotten Island at AMC?",
    "Could we watch Forgotten Island?",
  ]) assert.deepEqual(updatePublicContent(null, message).items, [], message);
  for (const message of [movie, "Movie: Forgotten Island.", "We will see the movie Forgotten Island at AMC."]) {
    assert.ok(updatePublicContent(null, message).items.some((item) => item.kind === "activity" && item.text === message), message);
  }
  const inline = updatePublicContent(null, `Create a birthday live card and ${movie.toLowerCase()}`);
  assert.match(inline.items[0].text, /^we are going to watch/);
  assert.doesNotMatch(inline.items[0].text, /create a birthday/i);
});

test("Overview wording requests revise the copy while viewing and styling requests do not", () => {
  for (const message of ["Make the overview more informative.", "Rewrite the overview.", "The overview needs to be clearer."]) {
    assert.equal(requestsInvitationCopy(message), true, message);
  }
  for (const message of ["Open the overview.", "Make the overview button purple.", "Where is the overview?"]) {
    assert.equal(requestsInvitationCopy(message), false, message);
  }
  const draft = fallbackExtractConciergeDraft({ message: opening, requestedOutputs: ["live_card"] });
  const body = "We are meeting at AMC Grand Boulevard to watch Forgotten Island.";
  const revised = normalizeConciergeDraft({ previewCopy: { body } }, { ...draft, copyStatus: "ready" }, {
    message: "Make the overview more informative.", previousDraft: draft,
  });
  assert.equal(revised.previewCopy.body, body);
});
