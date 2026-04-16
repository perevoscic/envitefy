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
  assert.match(
    prompt,
    /Build the artwork around the selected event type first, then express the user's idea through that celebration type\./,
  );
  assert.match(prompt, /Treat the user's idea as the main visual concept when one is provided\./);
  assert.match(prompt, /Keep the final concept invitation-ready and celebration-oriented/);
  assert.match(prompt, /themeStyle should describe the invitation-ready version of the concept/);
});

test("studio prompts keep game day themes tied to the sports invitation type", () => {
  const prompt = buildLiveCardPrompt(
    {
      title: "Panthers vs Tigers",
      category: "Game Day",
      occasion: "Game Day",
      sportType: "Football",
      teamName: "Varsity Panthers",
      opponentName: "Central City Tigers",
      leagueDivision: "District 4",
      userIdea: "Friday night lights",
      description: "Home opener under the lights",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: Friday night lights. Treat the user's words as the theme of the invitation.",
    },
  );

  assert.match(prompt, /Selected Event Type: Game Day/);
  assert.match(prompt, /Sport: Football/);
  assert.match(prompt, /Team \/ Host: Varsity Panthers/);
  assert.match(prompt, /Opponent: Central City Tigers/);
  assert.match(
    prompt,
    /For Game Day, make the theme read as a real sports-event invitation with matchup energy, crowd atmosphere, sport-specific setting cues, and game-night presentation rather than a generic athlete poster or random action shot\./,
  );
  assert.match(
    prompt,
    /For Game Day, make the result read first as a real sports-event invite with matchup energy and guest-useful information, not a generic sports poster or season recap\./,
  );
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
  assert.match(
    prompt,
    /Let the background and artwork continue naturally behind the bottom buttons as full-bleed art\./,
  );
  assert.match(
    prompt,
    /Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom\./,
  );
  assert.doesNotMatch(prompt, /Reserve roughly the bottom 28-30% of the card/);
  assert.doesNotMatch(prompt, /The lower button area should be visually quiet/);
});

test("studio invitation image prompt keeps game day imagery grounded in provided sports context", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Panthers vs Tigers",
      category: "Game Day",
      occasion: "Game Day",
      sportType: "Football",
      teamName: "Varsity Panthers",
      opponentName: "Central City Tigers",
      leagueDivision: "District 4",
      broadcastInfo: "ESPN+",
      parkingInfo: "Lot C",
      userIdea: "Friday night lights",
      description: "Home opener under the lights",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: Friday night lights. Treat the user's words as the theme of the invitation.",
    },
    null,
    { surface: "page" },
  );

  assert.match(
    prompt,
    /Game Day \/ sports invitation: make the artwork read as a live game-day invite with sport-specific atmosphere, field, court, arena, rink, or ballpark cues, crowd energy, and arrival-night styling rather than generic athlete action photography\./,
  );
  assert.match(
    prompt,
    /Use the provided sport context to steer the scene\. If the sport is football, bias to stadium, turf, and Friday-night-light cues/,
  );
  assert.match(
    prompt,
    /Do not invent team logos, branded uniforms, scoreboard text, mascots, jersey numbers, sponsor marks, or venue signage\./,
  );
  assert.match(prompt, /Broadcast \/ Stream: ESPN\+/);
  assert.match(prompt, /Parking \/ Arrival: Lot C/);
  assert.match(
    prompt,
    /Visible text is forbidden in the final raster for page\/live-card backgrounds\./,
  );
});

test("page live-card background prompts forbid visible raster text and preserve overlay space", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Ava's Garden Party",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Ava",
      links: [],
    },
    undefined,
    null,
    { surface: "page" },
  );

  assert.match(prompt, /live-card background only/);
  assert.match(
    prompt,
    /Do not add visible event wording, letters, numbers, captions, logos, monograms, or decorative type/,
  );
  assert.match(
    prompt,
    /Visible text is forbidden in the final raster for page\/live-card backgrounds\./,
  );
  assert.match(
    prompt,
    /Preserve clean negative space and readable contrast through the upper and middle zones/,
  );
  assert.doesNotMatch(prompt, /Approved invitation copy to use verbatim/);
});

test("page live-card image edit prompts preserve baked-in text and logos", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Ava's Garden Party",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Ava",
      links: [],
    },
    undefined,
    null,
    { surface: "page", editingExistingImage: true },
  );

  assert.match(prompt, /Edit the provided invitation artwork image\./);
  assert.match(prompt, /Preserve every character of existing visible text/);
  assert.match(prompt, /Apply the edit mainly to illustrated or photographic elements/);
  assert.match(prompt, /Treat existing raster typography and signage as locked/);
  assert.doesNotMatch(
    prompt,
    /Visible text is forbidden in the final raster for page\/live-card backgrounds\./,
  );
});

test("poster-first birthday live-card image prompts allow cinematic raster text, exact spelling, and no visible year by default", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Ava After Dark",
      category: "Birthday",
      occasion: "Birthday",
      eventYear: "2030",
      honoreeName: "Ava",
      venueName: "Moonlight Hall",
      userIdea: "cinematic garden party",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: cinematic garden party. Treat the user's words as the theme of the invitation.",
    },
    {
      title: "Ava After Dark",
      description: "Golden-hour rooftop birthday invitation.",
      palette: {
        primary: "#101828",
        secondary: "#f5d0fe",
        accent: "#f59e0b",
      },
      themeStyle: "cinematic garden",
      interactiveMetadata: {
        rsvpMessage: "Reply yes to celebrate with Ava.",
        funFacts: ["Sunset cocktails"],
        ctaLabel: "RSVP Tonight",
        shareNote: "Celebrate Ava under the city lights.",
      },
      invitation: {
        title: "Ava After Dark",
        subtitle: "Birthday in Bloom",
        openingLine: "Meet us under the lights.",
        scheduleLine: "Friday May 10th at 7:00 PM",
        locationLine: "Moonlight Hall",
        detailsLine: "Cocktail attire",
        callToAction: "RSVP Tonight",
        socialCaption: "Celebrate Ava under the city lights.",
        hashtags: ["#AvaAfterDark"],
      },
    },
    { surface: "image", posterTextInImage: true, referenceImageCount: 2 },
  );

  assert.match(prompt, /first render of a live invitation card for Birthday or Wedding/);
  assert.match(prompt, /Bake the invitation copy into the raster like cinematic poster art/);
  assert.match(
    prompt,
    /When uploaded reference photo\(s\) are present, build the poster around those exact photo\(s\)/,
  );
  assert.match(
    prompt,
    /Visible poster schedule\/date lines should omit the year and prefer Saturday May 23rd at 12:00 PM; if time is missing, use Saturday May 23rd\./,
  );
  assert.match(
    prompt,
    /Only show a year in visible poster copy when the user's custom wording explicitly includes that year and it must be preserved\./,
  );
  assert.match(
    prompt,
    /Keep venue\/location on its own line or separate field rather than merging it into the visible schedule\/date line\./,
  );
  assert.match(
    prompt,
    /Preserve the exact supplied spelling of names, venue words, and key event terms/,
  );
  assert.match(
    prompt,
    /Keep the visible copy short and cinematic with a clear invitation\/poster hierarchy/,
  );
  assert.match(
    prompt,
    /The finished image must read first as a professional hosted event invitation, not merely a cinematic still, venue ad, mascot portrait, or mood board/,
  );
  assert.match(
    prompt,
    /Make the design unmistakably event-oriented and celebratory for the selected occasion/,
  );
  assert.match(
    prompt,
    /If the concept uses a theater, cinema, screening, or movie-party setting, keep the staging physically correct: seats and audience face the screen, sightlines make sense, and screen-to-seat geometry is believable/,
  );
  assert.match(
    prompt,
    /Never show theater chairs or audience rows facing away from the screen or arranged in impossible directions relative to the screen/,
  );
  assert.match(
    prompt,
    /Do not invent marquee text, venue branding, logos, signage, or event facts that are not explicitly supported by the supplied details, approved invitation copy, or source image/,
  );
  assert.match(prompt, /Keep the lower portion behind them free of visible copy/);
  assert.match(
    prompt,
    /No words, dates, venue lines, captions, or taglines may appear behind the bottom buttons/,
  );
  assert.match(
    prompt,
    /Treat the lowest part of the poster as art-first support for the floating buttons/,
  );
  assert.match(
    prompt,
    /Do not place marquee wording, signage, decorative captions, or secondary copy in the lowest part of the card/,
  );
  assert.doesNotMatch(prompt, /show that exact year in the poster copy or hierarchy/i);
  assert.match(
    prompt,
    /Never print phrases such as action buttons, button row, safe area, safe band, or any other instruction text in the artwork/,
  );
  assert.doesNotMatch(prompt, /text-free safe band/i);
  assert.match(prompt, /Approved invitation copy to use verbatim if text appears in the artwork/);
  assert.match(prompt, /Event Year: 2030/);
});

test("birthday and wedding live-card text prompts omit visible year and require poster-like copy", () => {
  const prompt = buildLiveCardPrompt(
    {
      title: "Ava After Dark",
      category: "Birthday",
      occasion: "Birthday",
      eventYear: "2030",
      honoreeName: "Ava",
      venueName: "Moonlight Hall",
      userIdea: "cinematic garden party",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: cinematic garden party. Treat the user's words as the theme of the invitation.",
    },
  );

  assert.match(
    prompt,
    /`invitation\.scheduleLine` is for visible date\/time only\. Prefer Saturday May 23rd at 12:00 PM; if time is missing, use Saturday May 23rd\./,
  );
  assert.match(
    prompt,
    /Visible card schedule\/date lines should omit the year unless the user explicitly typed year wording that must be preserved\./,
  );
  assert.match(
    prompt,
    /For birthday and wedding visible card copy, never add the year to schedule\/date wording unless the user's custom wording explicitly includes that year\./,
  );
  assert.match(prompt, /write short cinematic invitation copy with a poster-like hierarchy/);
  assert.match(prompt, /Treat the user's prompt\/theme as the dominant art direction/);
  assert.match(
    prompt,
    /Do not invent venue brands, marquee names, signage wording, or unsupported event facts in the copy/,
  );
  assert.match(
    prompt,
    /Resolve the final visible text line well above the bottom action buttons/,
  );
  assert.match(
    prompt,
    /Make the result read first as a real celebration invite for this event type/,
  );
  assert.match(
    prompt,
    /Bring clear party \/ celebration \/ hosted-event energy into the concept and invitation copy/,
  );
  assert.doesNotMatch(prompt, /use that exact year in the copy/i);
  assert.match(prompt, /Event Year: 2030/);
});

test("studio live-card prompts keep birthday copy centered on honoree name and age before theme", () => {
  const prompt = buildLiveCardPrompt(
    {
      title: "Lara's 7th Birthday",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Lara",
      ageOrMilestone: "7",
      userIdea: "movie cats",
      referenceImageUrls: ["https://example.com/lara.png"],
      links: [],
    },
    {
      subjectTransformMode: "premium_makeover",
      likenessStrength: "creative",
      visualStyleMode: "editorial_cinematic",
    },
  );

  assert.match(
    prompt,
    /For birthdays, when Honoree Name and Age or Milestone are available, make the main invitation title center on that person's name and milestone first\./,
  );
  assert.match(prompt, /Premium themed makeover is enabled/);
  assert.match(prompt, /Likeness strength is Creative/);
  assert.match(prompt, /Visual style mode is Editorial cinematic/);
  assert.match(prompt, /Subject Treatment: Premium themed makeover/);
});

test("studio invitation image prompts use subject-photo makeover rules instead of cutout behavior", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Lara's 7th Birthday",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Lara",
      ageOrMilestone: "7",
      userIdea: "movie cats",
      links: [],
    },
    {
      subjectTransformMode: "premium_makeover",
      likenessStrength: "balanced",
      visualStyleMode: "photoreal",
    },
    null,
    { surface: "image", referenceImageCount: 1, posterTextInImage: true },
  );

  assert.match(
    prompt,
    /Do not use the uploaded person as a pasted cutout, sticker, tiny inset, or throwaway reference/,
  );
  assert.match(
    prompt,
    /Premium themed makeover is enabled\. Preserve identity while restyling wardrobe, hair, props, pose energy, and environmental styling to match the event concept\./,
  );
  assert.match(prompt, /Visual style mode is Photoreal/);
  assert.match(
    prompt,
    /For birthdays, when Honoree Name and Age or Milestone are available, make that birthday identity the main visible title hierarchy\./,
  );
  assert.match(prompt, /Render Style Mode: Photoreal/);
});
