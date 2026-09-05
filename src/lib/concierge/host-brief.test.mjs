import assert from "node:assert/strict";
import test from "node:test";
import { formatHostBrief, normalizeHostBrief, updateHostBrief } from "./host-brief.ts";

const opening = "I'm a bit overwhelmed. I'm organising my mum Elena's 60th, about 28 people in Chicago, and I want her to feel celebrated without it looking like a kids' birthday. She loves gardens and old jazz records. Some relatives read Spanish, some English. I've got about $600 for food and decorations, and I'm doing this on my own. I need something I can share in our family WhatsApp group myself. I haven't picked a date or venue. Please help me work out a sensible starting point rather than ask me a whole form of questions.";
const kinds = (notes) => (notes || []).map((note) => note.kind);

test("Elena's stated priorities persist independently of a short chat history", () => {
  const brief = updateHostBrief(null, opening);
  assert.deepEqual({ ...brief.budget, sourceText: undefined }, { amount: 600, currency: "$", scope: "food and decorations", sourceText: undefined });
  assert.deepEqual(brief.languages.values, ["English", "Spanish"]);
  assert.ok(kinds(brief.hostSupport).includes("planning_alone"));
  assert.ok(kinds(brief.hostSupport).includes("simple_steps"));
  let restored = JSON.parse(JSON.stringify(brief));
  for (let index = 0; index < 30; index++) restored = updateHostBrief(restored, `The event title should be Elena Celebration ${index}.`);
  assert.deepEqual(restored, brief);
  assert.match(formatHostBrief(restored).join("\n"), /Budget: \$600 for food and decorations/);
  assert.ok(JSON.stringify(brief).length < opening.length * 2);
});

test("the saved-priorities review does not repeat superseded facts from source citations", () => {
  const initial = updateHostBrief(null, "We have $600 for food and decorations, some relatives read English and some Spanish, and two relatives need step-free access.");
  const revised = updateHostBrief(initial, "Our budget is now $450 for food and decorations. Use English only.");
  const review = formatHostBrief(revised).join("\n");
  assert.match(review, /\$450.*food and decorations/);
  assert.match(review, /Accessibility: Step-free access/);
  assert.doesNotMatch(review, /\$600|Spanish/);
  assert.match(revised.accessibilityNeeds[0].sourceText, /\$600/);
});

test("explicit privacy and manual reply requests stay attached to the host brief", () => {
  const message = "Keep 'Chicago — exact address shared privately' as the location. No host phone or email on the card. I'll collect replies myself. Please include a request for a private reply with the number coming and vegetarian meals needed.";
  const brief = updateHostBrief(updateHostBrief(null, opening), message);
  assert.deepEqual(kinds(brief.privacyPreferences), ["address_private", "contact_private"]);
  assert.deepEqual(kinds(brief.dietaryNeeds), ["vegetarian"]);
  assert.equal(brief.replyPlan.mode, "manual_private");
  for (const note of [...brief.privacyPreferences, ...brief.dietaryNeeds]) assert.ok(message.includes(note.sourceText));
});

test("a wedding host's access and food needs can be individually corrected", () => {
  let brief = updateHostBrief(null, "We need step-free access for my dad. Two guests need vegetarian meals. My aunt needs gluten-free food.");
  assert.deepEqual(kinds(brief.accessibilityNeeds), ["step_free"]);
  assert.deepEqual(kinds(brief.dietaryNeeds), ["vegetarian", "gluten_free"]);
  brief = updateHostBrief(brief, "We no longer need vegetarian meals. Drop the step-free access requirement.");
  assert.deepEqual(brief.accessibilityNeeds, []);
  assert.deepEqual(kinds(brief.dietaryNeeds), ["gluten_free"]);
  assert.deepEqual(updateHostBrief(brief, "No dietary restrictions now.").dietaryNeeds, []);
  assert.deepEqual(kinds(updateHostBrief(brief, "Drop vegetarian meals but keep gluten-free food.").dietaryNeeds), ["gluten_free"]);
  assert.deepEqual(updateHostBrief(brief, "My aunt no longer needs gluten-free food.").dietaryNeeds, []);
});

test("an English-only correction removes Spanish and survives unrelated edits", () => {
  const previous = updateHostBrief(null, opening);
  const brief = updateHostBrief(previous, "Use English only, drop Spanish.");
  assert.deepEqual(brief.languages.values, ["English"]);
  assert.deepEqual(updateHostBrief(brief, "Add French as well.").languages.values, ["English", "French"]);
  assert.equal(updateHostBrief(brief, "No language preference now.").languages, null);
  assert.deepEqual(updateHostBrief(previous, "I don't want Spanish anymore.").languages.values, ["English"]);
});

test("budget revisions preserve scope while line items cannot replace the whole budget", () => {
  const previous = updateHostBrief(null, opening);
  for (const message of ["Put $100 toward flowers.", "Budget $100 for flowers.", "Allocate $100 of that budget to flowers.", "Food will cost $400."]) {
    assert.deepEqual(updateHostBrief(previous, message).budget, previous.budget, message);
  }
  assert.equal(updateHostBrief(previous, "Our budget is now $800.").budget.amount, 800);
  assert.equal(updateHostBrief(previous, "Our budget is now $800.").budget.scope, "food and decorations");
  assert.equal(updateHostBrief(previous, "Raise the budget to 800.").budget.amount, 800);
  assert.equal(updateHostBrief(previous, "Remove the budget limit.").budget, null);
  assert.equal(updateHostBrief(null, "Our total budget is 1200 EUR for food and flowers.").budget.currency, "EUR");
});

test("questions, possibilities and assistant suggestions never become confirmed requirements", () => {
  const previous = updateHostBrief(null, opening);
  for (const message of [
    "We might need step-free access and vegetarian food.",
    "Should we use English only?",
    "Can RSVP ask whether people need vegetarian meals?",
    "You suggested a $900 budget and English only.",
    "Maybe I'll collect replies privately.",
    "If we choose a wedding venue, we may need wheelchair access.",
  ]) assert.deepEqual(updateHostBrief(previous, message), previous, message);
  assert.ok(kinds(updateHostBrief(null, "Can you include step-free access instructions?").accessibilityNeeds).includes("step_free"));
});

test("model normalization cannot introduce unsupported facts or strip a source's negation", () => {
  const previous = updateHostBrief(null, opening);
  const latest = "We don't need vegetarian meals. The date is October 24.";
  const normalized = normalizeHostBrief({
    budget: { amount: 9000, currency: "USD", sourceText: "The date is October 24." },
    languages: { values: ["Japanese"], sourceText: "The date is October 24." },
    dietaryNeeds: [{ kind: "vegetarian", sourceText: "vegetarian meals" }],
    accessibilityNeeds: [{ kind: "wheelchair", sourceText: "The date is October 24." }],
  }, previous, latest);
  assert.deepEqual(normalized, updateHostBrief(previous, latest));
  assert.deepEqual(normalizeHostBrief(null, previous, "Thanks."), previous);
  assert.deepEqual(normalizeHostBrief({ languages: { values: ["Spanish"], sourceText: "Use Spanish." } }, previous, "Use Spanish. Actually use English only.").languages.values, ["English"]);
});

test("negated hazards remain needs and an explicit change can end a privacy or manual plan", () => {
  let brief = updateHostBrief(null, "No stairs at the venue. No nuts in the food. Keep the address private. I'll collect replies privately.");
  assert.deepEqual(kinds(brief.accessibilityNeeds), ["step_free"]);
  assert.deepEqual(kinds(brief.dietaryNeeds), ["nut_free"]);
  brief = updateHostBrief(brief, "Include the exact address on the card. Switch to online RSVP.");
  assert.deepEqual(brief.privacyPreferences, []);
  assert.equal(brief.replyPlan.mode, "online");
});
