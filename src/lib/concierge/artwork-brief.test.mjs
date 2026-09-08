import assert from "node:assert/strict";
import test from "node:test";
import { extractExplicitEventTitle } from "./conversation-edits.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { extractVisualDirection } from "./visual-direction.ts";
import { shouldRegenerateGeneratedDraftImageForEdit } from "./artwork-change.ts";

const direction = "Design a vivid pink, purple and electric-blue toy pop concert: three original cute expressive toy performers with headset microphones and coordinated stage outfits, dimensional holographic balloon lettering, concert spotlights, a giant glowing star, reflective stage flooring and glow sticks in the foreground. Make the lettering part of the scene and give the characters a strong focal presence.";
const message = `Create a birthday Live Card for Livia turning 10. The exact headline is LIVIA IS TURNING 10! The party is October 24, 2026 from 4 PM to 6 PM at Celebration Hall, 123 Main Street, Austin, Texas. Enable RSVP in Envitefy. ${direction} This is a design verification draft; do not publish it.`;

test("the complete concert brief and exact headline survive fallback extraction", () => {
  const draft = fallbackExtractConciergeDraft({ message });
  assert.equal(draft.title, "LIVIA IS TURNING 10!");
  assert.equal(draft.titleConfirmed, true);
  assert.equal(draft.previewCopy.headline, draft.title);
  assert.equal(draft.theme, direction);
  assert.doesNotMatch(draft.previewCopy.body, /microphones|lettering|verification/);
});

test("advancing to a logistics question never discards supplied AI art direction", () => {
  for (const currentQuestion of ["numberOfGuests", "rsvpEnabled"]) {
    const fallback = { ...fallbackExtractConciergeDraft({ message }), theme: null, tone: null, currentQuestion, missingFields: [currentQuestion] };
    const normalized = normalizeConciergeDraft({ theme: direction, tone: "Neon holographic stage lighting" }, fallback, { message });
    assert.equal(normalized.theme, direction);
    assert.equal(normalized.tone, "Neon holographic stage lighting");
    const countReply = normalizeConciergeDraft({ tone: "polished birthday" }, fallback, { message: "20 guests" });
    assert.equal(countReply.tone, null);
  }
});

test("an exact headline correction retains punctuation and survives later logistics", () => {
  assert.equal(extractExplicitEventTitle("The exact headline is LIVIA IS TURNING 10! Keep the date."), "LIVIA IS TURNING 10!");
  assert.equal(extractExplicitEventTitle('Change the headline to "Ready, Set, Party!".'), "Ready, Set, Party!");
  const first = fallbackExtractConciergeDraft({ message });
  const next = fallbackExtractConciergeDraft({ message: "20 guests", draft: first });
  assert.equal(next.title, first.title);
  assert.equal(next.theme, direction);
});

test("the art fallback excludes logistics and planning instructions, preserving visual exclusions", () => {
  assert.equal(extractVisualDirection(`${direction} No cake, gifts, generic birthday balloons or black footer. Keep the existing date and RSVP. My budget is $500. Do not publish.`), `${direction} No cake, gifts, generic birthday balloons or black footer.`);
});

test("a date-only correction preserves the creative brief across fallback, AI merge, and image reuse", () => {
  const previous = fallbackExtractConciergeDraft({ message });
  const editMessage = "Change only the date to October 25, 2026. Keep the artwork unchanged.";
  assert.equal(extractVisualDirection(editMessage), null);
  const fallback = fallbackExtractConciergeDraft({ message: editMessage, draft: previous });
  assert.equal(fallback.theme, direction);
  const normalized = normalizeConciergeDraft({ theme: "Keep the artwork unchanged", tone: "Polished" }, fallback, { message: editMessage });
  assert.equal(normalized.theme, previous.theme);
  assert.equal(normalized.tone, previous.tone);
  assert.match(normalized.dateText, /October 25/);
  assert.equal(shouldRegenerateGeneratedDraftImageForEdit({ userMessage: editMessage, previousDraft: previous, nextDraft: normalized, artworkTextMode: "headline" }), false);
});

test("keeping a draft unpublished does not become the visual style", () => {
  const previous = fallbackExtractConciergeDraft({ message });
  const next = fallbackExtractConciergeDraft({ message: "Keep it unpublished.", draft: previous });
  assert.equal(next.tone, previous.tone);
});
