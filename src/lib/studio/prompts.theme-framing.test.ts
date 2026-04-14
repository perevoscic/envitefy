import assert from "node:assert/strict";
import test from "node:test";

import { buildInvitationImagePrompt, buildLiveCardPrompt } from "./prompts.ts";

test("studio live-card prompt keeps birthday themes tied to the celebration type", () => {
  const prompt = buildLiveCardPrompt(
    {
      title: "Ava's Birthday",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Ava",
      ageOrMilestone: "7",
      userIdea: "Jurassic Park",
      description: "Jurassic Park theme",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: Jurassic Park. Treat the user's words as the theme of the invitation.",
    },
  );

  assert.match(prompt, /Theme words must be interpreted through the selected event type/);
  assert.match(prompt, /Core creative inputs:/);
  assert.match(prompt, /Selected Event Type: Birthday/);
  assert.match(prompt, /User Idea: Jurassic Park/);
  assert.match(prompt, /Age or Milestone: 7/);
  assert.match(prompt, /Treat the user's idea as the main creative concept when one is provided\./);
  assert.match(
    prompt,
    /Jurassic Park should become a Jurassic Park birthday party, not just jungle foliage and dinosaurs\./,
  );
  assert.match(prompt, /themeStyle should name the celebration version of the concept/);
});

test("studio invitation image prompt keeps custom themes invitation-ready", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Spring Social",
      category: "Custom Invite",
      occasion: "Custom Invite",
      userIdea: "Great Gatsby",
      description: "Great Gatsby theme",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: Great Gatsby. Treat the user's words as the theme of the invitation.",
    },
  );

  assert.match(prompt, /Theme words must be interpreted through the selected event type/);
  assert.match(prompt, /Build the artwork around the selected event type first, then express the user's idea through that celebration type\./);
  assert.match(prompt, /Treat the user's idea as the main visual concept when one is provided\./);
  assert.match(prompt, /Keep the final concept invitation-ready and celebration-oriented/);
  assert.match(prompt, /themeStyle should describe the invitation-ready version of the concept/);
});

test("studio invitation image prompt keeps the bottom action zone safe without forcing a footer strip", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Noah's Birthday",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Noah",
      ageOrMilestone: "9",
      userIdea: "modern race car",
      description: "Modern race car theme",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: modern race car. Treat the user's words as the theme of the invitation.",
    },
  );

  assert.match(prompt, /Core creative inputs:/);
  assert.match(prompt, /User Idea: modern race car/);
  assert.match(prompt, /Age or Milestone: 9/);
  assert.match(prompt, /Keep essential text out of the bottom action-button zone\./);
  assert.match(prompt, /Let the background and artwork continue naturally behind the bottom buttons as full-bleed art\./);
  assert.match(
    prompt,
    /Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom\./,
  );
  assert.doesNotMatch(prompt, /Reserve roughly the bottom 28-30% of the card/);
  assert.doesNotMatch(prompt, /The lower button area should be visually quiet/);
});
