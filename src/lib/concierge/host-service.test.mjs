import assert from "node:assert/strict";
import test from "node:test";
import { conciergeServiceFallback } from "./capabilities.ts";
import { classifyCreationBoundary, isOffDomainRequest } from "./creation-intent.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { streamConciergePersona } from "./persona.ts";
import { sanitizeGuestCopy } from "./public-copy.ts";

const recovery = "That's a date, not a location. I don't want to keep fixing this. The location should say only 'Chicago — exact address shared privately'; the date is October 24, 2026, 4–7 pm. The title must be 'Elena, 60 años de alegría'. No online RSVP and no host phone or email on the card. Before I go further, show me exactly what you have saved and the English and Spanish invitation wording, so I can trust it.";
const workaround = "That feels like a list of things you can't do, and I'm still left figuring it out. I understand there are no separate adult and child fields or address approval. Please don't explain those limits again. Recommend one simple way for me to collect the family numbers and vegetarian requests, write the exact message I should send, and help me keep the address private. I need a next step I can actually manage.";
const base = () => fallbackExtractConciergeDraft({ message: "Create a live card for Elena's 60th birthday on October 18, 2099 from 4 to 7 pm at My home in Chicago. Garden and vintage jazz. No gifts, RSVP for 28 guests." });

test("bilingual guest prose keeps readable paragraph breaks", () => {
  assert.equal(sanitizeGuestCopy("English: Celebrate Elena.\n\nEspañol: Celebremos a Elena."), "English: Celebrate Elena.\n\nEspañol: Celebremos a Elena.");
});

test("copy sanitation preserves single line breaks without inflating paragraph spacing", () => {
  const copy = "English\nCelebrate Livia.\nNo gifts, please.\n\nEspañol\nCelebremos a Livia.";
  assert.equal(sanitizeGuestCopy(copy), copy);
  assert.equal(sanitizeGuestCopy(sanitizeGuestCopy(copy)), copy);
});

test("an overwhelmed host receives a manageable provisional plan during an AI timeout", () => {
  const answer = conciergeServiceFallback("I'm overwhelmed and doing this on my own with $600.", base());
  assert.match(answer, /Elena/);
  assert.match(answer, /\$390.*\$120.*\$60.*\$30/);
  assert.doesNotMatch(answer, /When should|What date/);
});

test("later fallback help respects the saved budget and access needs", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create Elena's birthday. We have $600 for food and decorations, some relatives read English and some Spanish, and two relatives need step-free access." });
  const answer = conciergeServiceFallback("I'm overwhelmed again. Where do I start?", draft);
  assert.equal(draft.hostBrief.budget.scope, "food and decorations");
  assert.match(answer, /\$390.*\$120.*\$60.*\$30/);
  assert.match(answer, /step-free entrance/);
});

test("a host can remove contact details and review a bilingual invitation without an off-topic refusal", () => {
  assert.equal(classifyCreationBoundary(recovery, { previous: base() }), null);
  assert.equal(isOffDomainRequest("My phone is broken. Can you fix my phone before the birthday?"), true);
  const draft = fallbackExtractConciergeDraft({ message: recovery, draft: base() });
  assert.equal(draft.title, "Elena, 60 años de alegría");
  assert.equal(draft.location, "Chicago — exact address shared privately");
  assert.equal(draft.rsvpEnabled, false);
});

test("stale model values cannot undo an exact location, title or RSVP privacy correction", () => {
  const previous = { ...base(), numberOfGuests: 28 };
  const fallback = fallbackExtractConciergeDraft({ message: recovery, draft: previous });
  const normalized = normalizeConciergeDraft({
    title: "Elena’s Birthday", location: "Old home address", venue: "Old venue", rsvpEnabled: true,
    rsvpContact: "host@example.com", rsvpName: "Old host", rsvpDeadline: "October 10",
    requestedOutputs: ["event_page"],
    previewCopy: { locationLine: "Old home address", cta: "RSVP now", body: "English: Celebrate Elena.\n\nEspañol: Celebremos a Elena." },
  }, fallback, { message: recovery });
  assert.equal(normalized.title, "Elena, 60 años de alegría");
  assert.equal(normalized.location, "Chicago — exact address shared privately");
  assert.equal(normalized.venue, normalized.location);
  assert.equal(normalized.rsvpEnabled, false);
  assert.equal(normalized.rsvpContact, null);
  assert.equal(normalized.rsvpDeadline, null);
  assert.equal(normalized.numberOfGuests, 28);
  assert.deepEqual(normalized.requestedOutputs, ["live_card"]);
  assert.equal(normalized.previewCopy.locationLine, normalized.location);
  assert.equal(normalized.previewCopy.cta, "View details");
  assert.match(normalized.previewCopy.body, /\n\nEspañol:/);
});

test("unavailable AI still offers a concrete manual-reply plan after the host accepts a limitation", () => {
  const answer = conciergeServiceFallback(workaround, base());
  assert.doesNotMatch(answer, /can't|cannot|not an automatic/);
  assert.match(answer, /one private reply per household/);
  assert.match(answer, /You can send:/);
  assert.match(answer, /vegetarian meals/);
  assert.match(answer, /Keep the exact address off the shared card/);
});

test("moving on to invitation wording does not repeat the previous manual-reply plan", () => {
  assert.equal(conciergeServiceFallback("Let's move on. Please write the invitation now, including a request for a private reply with the number coming and vegetarian meals needed.", base()), null);
});

test("model prose cannot restore a contact removed in the current correction", () => {
  const previous = { ...base(), rsvpEnabled: true, rsvpContact: "host@example.com" };
  const fallback = fallbackExtractConciergeDraft({ message: recovery, draft: previous });
  const normalized = normalizeConciergeDraft({ previewCopy: { body: "Join Elena and reply to host@example.com." } }, fallback, { message: recovery, previousDraft: previous });
  assert.doesNotMatch(normalized.previewCopy.body, /host@example.com/);
  assert.equal(normalized.rsvpContact, null);
});

test("capability facts ground a contextual response instead of short-circuiting the host's request", async () => {
  let payload;
  async function* stream() {
    yield { choices: [{ delta: { content: "Let's keep it simple: one private reply per family. Here is the invitation wording." } }] };
  }
  const result = await streamConciergePersona({
    message: workaround,
    chatMessages: [{ role: "assistant", text: "I can't set up address release after RSVP approval in this chat." }],
    draft: base(), fallbackMessage: "What phone number?", onDelta: () => {},
  }, {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async (request) => { payload = request; return stream(); } } } }),
  });
  assert.equal(result.usedAi, true);
  const context = JSON.parse(payload.messages.at(-1).content);
  assert.match(context.relevantCapabilityFacts, /can't set up address release/);
  assert.ok(context.currentDraft.previewCopy.body);
  assert.match(result.assistantMessage, /invitation wording/);
  assert.doesNotMatch(result.assistantMessage, /Flyer\/Invitation/);
});

test("a failed AI response is transparent and still gives the host a practical next step", async () => {
  const result = await streamConciergePersona({
    message: workaround, draft: base(), chatMessages: [], fallbackMessage: "What phone number?", onDelta: () => {},
  }, {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async () => { throw new Error("provider unavailable"); } } } }),
  });
  assert.equal(result.usedAi, false);
  assert.match(result.assistantMessage, /couldn't finish the tailored reply/);
  assert.match(result.assistantMessage, /You can send:/);
  assert.doesNotMatch(result.assistantMessage, /What phone number/);
});
