import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = path.join(process.cwd(), "src", specifier.slice(2));
      const withExtension = /\.[a-z]+$/i.test(resolvedPath) ? resolvedPath : `${resolvedPath}.ts`;
      return nextResolve(pathToFileURL(withExtension).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { buildInvitationImagePrompt, buildLiveCardPrompt } = await import("./prompts.ts");

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
  assert.match(prompt, /Design Idea: Jurassic Park/);
  assert.match(prompt, /Event Details: Jurassic Park theme/);
  assert.match(prompt, /Age or Milestone: 7/);
  assert.match(
    prompt,
    /Treat the Design Idea as private art direction for themeStyle, palette, and artwork concept when one is provided\./,
  );
  assert.match(
    prompt,
    /Treat Event Details, names, date\/time, venue, and RSVP fields as the source of guest-facing copy\./,
  );
  assert.match(prompt, /Design Idea is private art direction, not default visible invitation copy\./);
  assert.match(
    prompt,
    /Guest-facing invitation copy fields must not introduce Design Idea-only nouns, motifs, props, animals, places, or prompt fragments\./,
  );
  assert.match(
    prompt,
    /Do not quote, restate, or lightly paraphrase raw Design Idea wording as a title, subtitle, theme line, opening line, schedule line, or other visible invitation copy unless the user explicitly asked for that exact wording to appear\./,
  );
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
        "Highest-priority visual direction from the user: Great Gatsby. Treat the Design Idea as the theme of the invitation.",
    },
  );

  assert.match(prompt, /Theme words must be interpreted through the selected event type/);
  assert.match(
    prompt,
    /Build the artwork around the selected event type first, then express the private visual direction through that celebration type\./,
  );
  assert.match(prompt, /Treat the private visual direction as the main visual concept when one is provided\./);
  assert.match(
    prompt,
    /Let supporting event details sharpen specificity and approved wording, but do not let them replace the private visual direction\./,
  );
  assert.match(
    prompt,
    /Never print raw private visual direction wording or prompt fragments in the artwork unless the user explicitly requested that exact phrase as visible copy\./,
  );
  assert.match(
    prompt,
    /Form labels, section headings, prompt labels, and instruction text are internal only\. Never print them anywhere in the image\./,
  );
  assert.doesNotMatch(prompt, /Design Idea/);
  assert.match(prompt, /Keep the final concept invitation-ready and celebration-oriented/);
  assert.match(prompt, /themeStyle should describe the invitation-ready version of the concept/);
});

test("studio prompts treat raw design-idea fragments as visual direction instead of printed copy", () => {
  const liveCardPrompt = buildLiveCardPrompt(
    {
      title: "Lara Turns 7",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Lara",
      ageOrMilestone: "7",
      userIdea: "realistic festive cats at the movie",
      description: "We are going to watch a movie, then lunch",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: realistic festive cats at the movie. Treat the user's words as the theme of the invitation.",
    },
  );

  const imagePrompt = buildInvitationImagePrompt(
    {
      title: "Lara Turns 7",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Lara",
      ageOrMilestone: "7",
      userIdea: "realistic festive cats at the movie",
      description: "We are going to watch a movie, then lunch",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: realistic festive cats at the movie. Treat the user's words as the theme of the invitation.",
    },
  );

  assert.match(
    liveCardPrompt,
    /If the Design Idea contains prompt-like visual fragments such as 'realistic festive cats at the movie', translate that into imagery and mood instead of printing it as guest-facing copy\./,
  );
  assert.match(
    imagePrompt,
    /If the private visual direction contains prompt-like visual fragments such as 'realistic festive cats at the movie', translate that into imagery and mood instead of treating it as approved subtitle or headline text\./,
  );

  const imagePromptWithGeneratedCopy = buildInvitationImagePrompt(
    {
      title: "Lara's 7th Birthday Bash",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Lara",
      ageOrMilestone: "7",
      userIdea: "realistic festive cats at the movie",
      description: "Join us for popcorn, pizza, and fun. We are going to watch a movie, then lunch.",
      date: "05/23",
      venueName: "AMC Boulevard 10",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: realistic festive cats at the movie. Treat the user's words as the theme of the invitation.",
    },
    {
      title: "Lara's 7th Birthday Bash",
      description: "Movie birthday with cats.",
      palette: {
        primary: "#111827",
        secondary: "#F9FAFB",
        accent: "#F59E0B",
      },
      themeStyle: "realistic movie cats",
      interactiveMetadata: {
        rsvpMessage: "Tell us if you can join the cats.",
        funFacts: ["Cats on the marquee"],
        ctaLabel: "RSVP",
        shareNote: "Join Lara for cats and movies.",
      },
      invitation: {
        title: "Lara's 7th Birthday Bash",
        subtitle: "Movie & Lunch Celebration",
        openingLine: "Join us for popcorn, cats, pizza, and fun!",
        scheduleLine: "Saturday May 23rd at 1:00 PM",
        locationLine: "AMC Boulevard 10",
        detailsLine: "Pizza after the movie",
        callToAction: "RSVP",
        socialCaption: "Join Lara for cats and movies.",
        hashtags: ["#LaraCats"],
      },
    },
    { surface: "page" },
  );

  assert.match(imagePromptWithGeneratedCopy, /Opening Line: Join us for popcorn, pizza, and fun!/);
  assert.doesNotMatch(imagePromptWithGeneratedCopy, /Opening Line:.*cats/i);
  assert.doesNotMatch(imagePromptWithGeneratedCopy, /ShareNote:.*cats/i);
  assert.match(
    imagePromptWithGeneratedCopy,
    /The approved invitation copy is the complete visible-text whitelist\./,
  );
});

test("studio baked-text invitation prompts give every non-birthday-wedding category explicit invitation guidance", () => {
  const cases = [
    {
      category: "Baby Shower",
      title: "Elena's Baby Shower",
      occasion: "Baby Shower",
      honoreeName: "Elena",
      userIdea: "soft blue balloons and teddy bears",
      copyRule:
        /For baby showers, make the honoree name, baby name, or baby shower title the main invitation hierarchy first\./,
      imageRule:
        /For baby showers, make the theme read as a baby shower with baby-shower decor, favors, dessert-table styling, and welcoming celebration cues\./,
    },
    {
      category: "Bridal Shower",
      title: "Madeline’s Garden Brunch",
      occasion: "Bridal Shower",
      honoreeName: "Madeline",
      userIdea: "garden brunch with blush flowers",
      copyRule:
        /For bridal showers, make the bride's name or bridal shower title the main invitation hierarchy first\./,
      imageRule:
        /For bridal showers, make the theme read as a bridal shower with brunch, tea-party, gift-table, floral, and bride-focused celebration cues\./,
    },
    {
      category: "Anniversary",
      title: "Silver Milestone Dinner",
      occasion: "Anniversary",
      honoreeName: "Ava & James",
      ageOrMilestone: "25",
      userIdea: "25th anniversary dinner with candles and roses",
      copyRule:
        /For anniversaries, make the couple names, anniversary title, or milestone year the main invitation hierarchy first\./,
      imageRule:
        /For anniversaries, make the theme read as an anniversary celebration with elegant party styling and couple-centered celebration cues\./,
    },
    {
      category: "Housewarming",
      title: "New Home, New Memories",
      occasion: "Housewarming",
      honoreeName: "The Bennetts",
      userIdea: "modern housewarming party at our new home",
      copyRule:
        /For housewarmings, make the host names, housewarming title, or new-home identity the main invitation hierarchy first\./,
      imageRule:
        /For housewarmings, make the theme read as a welcoming hosted gathering with home-party decor and hosting cues\./,
    },
    {
      category: "Field Trip/Day",
      title: "Science Discovery Day",
      occasion: "Field Trip/Day",
      honoreeName: "3rd Grade",
      userIdea: "school trip to the science museum",
      copyRule:
        /For field trips or school days, make the event title, school outing name, or destination title the main invitation hierarchy first\./,
      imageRule:
        /For field trips or school-day invites, make the theme read as an organized school event with group-activity and school-planning cues\./,
    },
    {
      category: "Game Day",
      title: "Friday Night Lights",
      occasion: "Game Day",
      sportType: "Football",
      teamName: "Varsity Panthers",
      opponentName: "Central City Tigers",
      userIdea: "friday night football under the lights, blue and gold",
      copyRule:
        /For Game Day, make the matchup, team, or game-day title the main invitation hierarchy first\./,
      imageRule:
        /For Game Day, make the theme read as a real sports-event invitation with matchup energy, crowd atmosphere, sport-specific setting cues, and game-night presentation rather than a generic athlete poster or random action shot\./,
    },
    {
      category: "Custom Invite",
      title: "Founder Appreciation Night",
      occasion: "Custom Invite",
      honoreeName: "Founders",
      userIdea: "founder appreciation night in a modern loft",
      copyRule:
        /For custom invites, make the event title, honoree, or host identity the main invitation hierarchy first\./,
      imageRule:
        /Keep the final concept invitation-ready and celebration-oriented rather than drifting into generic scenery\./,
    },
  ];

  for (const testCase of cases) {
    const liveCardPrompt = buildLiveCardPrompt(
      {
        title: testCase.title,
        category: testCase.category,
        occasion: testCase.occasion,
        honoreeName: testCase.honoreeName,
        ageOrMilestone: testCase.ageOrMilestone,
        sportType: testCase.sportType,
        teamName: testCase.teamName,
        opponentName: testCase.opponentName,
        userIdea: testCase.userIdea,
        links: [],
      },
      {
        style: `Highest-priority visual direction from the user: ${testCase.userIdea}. Treat the user's words as the theme of the invitation.`,
      },
    );
    const imagePrompt = buildInvitationImagePrompt(
      {
        title: testCase.title,
        category: testCase.category,
        occasion: testCase.occasion,
        honoreeName: testCase.honoreeName,
        ageOrMilestone: testCase.ageOrMilestone,
        sportType: testCase.sportType,
        teamName: testCase.teamName,
        opponentName: testCase.opponentName,
        userIdea: testCase.userIdea,
        links: [],
      },
      {
        style: `Highest-priority visual direction from the user: ${testCase.userIdea}. Treat the user's words as the theme of the invitation.`,
      },
      null,
      { surface: "image" },
    );

    assert.match(liveCardPrompt, /write short cinematic invitation copy with a poster-like hierarchy/);
    assert.match(liveCardPrompt, testCase.copyRule);
    assert.match(
      imagePrompt,
      /Create one single seamless full-bleed invitation image with one unified continuous scene from top to bottom\./,
    );
    assert.match(
      imagePrompt,
      /Bake the invitation text directly into the image itself so it feels like part of the printed or designed artwork, not a separate overlay\./,
    );
    assert.match(
      imagePrompt,
      /Visible invitation text is allowed in the final raster, but it must be intentional, sparse, and supported by the supplied event details\./,
    );
    assert.match(imagePrompt, testCase.imageRule);
    if (testCase.category === "Field Trip/Day") {
      assert.match(
        liveCardPrompt,
        /Phrase the invite like an upcoming visit, not like the pictured students already hosted, designed, or commemorated the event\./,
      );
      assert.match(
        imagePrompt,
        /Field trip \/ school outing invitation: make the artwork read as a future organized visit, discovery day, or school excursion rather than a souvenir poster from a completed trip\./,
      );
      assert.match(
        imagePrompt,
        /Do not imply that the depicted students designed, printed, or are personally presenting the invitation\./,
      );
    }
  }
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

  assert.match(prompt, /Core creative inputs \(internal, not visible copy\):/);
  assert.match(prompt, /Private Visual Direction: modern race car/);
  assert.match(prompt, /Supporting Context: Modern race car theme/);
  assert.doesNotMatch(prompt, /Design Idea: modern race car/);
  assert.doesNotMatch(prompt, /Event Details: Modern race car theme/);
  assert.match(prompt, /Age or Milestone: 9/);
  assert.match(
    prompt,
    /Bake the invitation text directly into the image itself so it feels like part of the printed or designed artwork, not a separate overlay\./,
  );
  assert.match(
    prompt,
    /Use at most one short supporting line beyond the title and event details\. Do not create body-paragraph blocks, prose descriptions, or multi-sentence copy sections\./,
  );
  assert.match(
    prompt,
    /Visible invitation text is allowed in the final raster, but it must be intentional, sparse, and supported by the supplied event details\./,
  );
  assert.match(
    prompt,
    /Let the background and artwork continue naturally behind the bottom buttons as full-bleed art\./,
  );
  assert.match(
    prompt,
    /Keep the lower portion reserved visually for the app action buttons without turning it into a blank tray or fake footer\./,
  );
  assert.match(
    prompt,
    /Treat the lower edge as artwork continuation behind the app action buttons\./,
  );
  assert.match(
    prompt,
    /Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom\./,
  );
  assert.match(
    prompt,
    /Do not create a colored footer slab, tinted rectangle, or unrelated graphic block at the bottom edge\./,
  );
  assert.doesNotMatch(prompt, /Reserve roughly the bottom 28-30% of the card/);
  assert.doesNotMatch(prompt, /The lower button area should be visually quiet/);
  assert.doesNotMatch(prompt, /Legible typography with editorial hierarchy/);
});

test("studio invitation image prompt applies selected image finish presets to standalone images", () => {
  const prompt = buildInvitationImagePrompt(
    {
      title: "Ava After Dark",
      category: "Birthday",
      occasion: "Birthday",
      honoreeName: "Ava",
      userIdea: "city rooftop party",
      links: [],
    },
    {
      imageFinishPreset: "Golden Glow",
      style:
        "Highest-priority visual direction from the user: city rooftop party. Treat the user's words as the theme of the invitation.",
    },
    null,
    { surface: "image" },
  );

  assert.match(prompt, /Selected image finish preset: Golden Glow - warm light, elegant celebration\./);
  assert.match(
    prompt,
    /Treat the selected image finish preset as a high-priority finishing direction for mood, polish, lighting, palette handling, and contrast while still obeying the selected event type, approved event details, and the user's private visual direction\./,
  );
  assert.match(prompt, /Image Finish Preset: Golden Glow/);
});

test("studio invitation image prompt applies selected image finish presets to live-card rasters only when present", () => {
  const pagePrompt = buildInvitationImagePrompt(
    {
      title: "Championship Night",
      category: "Game Day",
      occasion: "Game Day",
      sportType: "Basketball",
      teamName: "West High",
      opponentName: "Central",
      userIdea: "playoff energy",
      links: [],
    },
    {
      imageFinishPreset: "Victory Night",
      style:
        "Highest-priority visual direction from the user: playoff energy. Treat the user's words as the theme of the invitation.",
    },
    null,
    { surface: "page" },
  );

  const imagePromptWithoutPreset = buildInvitationImagePrompt(
    {
      title: "Championship Night",
      category: "Game Day",
      occasion: "Game Day",
      sportType: "Basketball",
      teamName: "West High",
      opponentName: "Central",
      userIdea: "playoff energy",
      links: [],
    },
    {
      style:
        "Highest-priority visual direction from the user: playoff energy. Treat the user's words as the theme of the invitation.",
    },
    null,
    { surface: "page" },
  );

  assert.match(
    pagePrompt,
    /Selected image finish preset: Victory Night - cinematic, competitive atmosphere\./,
  );
  assert.match(pagePrompt, /Image Finish Preset: Victory Night/);
  assert.doesNotMatch(imagePromptWithoutPreset, /Selected image finish preset:/);
  assert.match(imagePromptWithoutPreset, /Image Finish Preset: Not provided/);
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
    /Visible invitation text is required in the final raster for page\/live-card images, but keep it sparse, readable, and intentionally designed\./,
  );
});

test("page live-card prompts require baked-in raster text and preserve a clear bottom action zone", () => {
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

  assert.match(prompt, /finished live-card invitation raster/);
  assert.match(
    prompt,
    /Visible event wording belongs in the raster for this live card, but it must feel like part of one designed invitation composition rather than detached overlay text/,
  );
  assert.match(
    prompt,
    /Visible invitation text is required in the final raster for page\/live-card images, but keep it sparse, readable, and intentionally designed\./,
  );
  assert.match(
    prompt,
    /resolve the final visible text line well above the bottom action buttons/,
  );
  assert.match(prompt, /Approved invitation copy to use verbatim/);
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

test("birthday image prompts bake approved invitation copy into the image while protecting the button zone", () => {
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
    { surface: "image", referenceImageCount: 2 },
  );

  assert.match(prompt, /This is a finished invitation poster image, not a screenshot and not an app UI mockup\./);
  assert.match(
    prompt,
    /Bake the invitation text directly into the image itself so it feels like part of the printed or designed artwork, not a separate overlay\./,
  );
  assert.match(
    prompt,
    /Create one single seamless full-bleed invitation image with one unified continuous scene from top to bottom\./,
  );
  assert.match(
    prompt,
    /Visible invitation text is allowed in the final raster, but it must be intentional, sparse, and supported by the supplied event details\./,
  );
  assert.match(
    prompt,
    /This image is a finished invitation raster rather than empty background art\./,
  );
  assert.match(
    prompt,
    /USER PHOTOS IN THE FLYER \(NOT A SIDEBAR\): Before this text prompt, 2 user-uploaded photo\(s\) appear in order\./,
  );
  assert.match(
    prompt,
    /The final invitation MUST weave these into the card background and hero art: large focal photo \(upper ~45[–-]60% of the canvas\), cinematic blend or vignette into the rest of the design, and clean negative space for later overlays\./,
  );
  assert.match(
    prompt,
    /Secondary live card styling metadata only:/,
  );
  assert.match(prompt, /Approved invitation copy to use verbatim if visible text appears in the artwork:/);
  assert.match(prompt, /Main Title: Ava After Dark/);
  assert.match(prompt, /Subtitle \/ Theme Line: Birthday in Bloom/);
  assert.match(prompt, /Opening Line: Meet us under the lights\./);
  assert.match(prompt, /Schedule Line: Friday May 10th at 7:00 PM/);
  assert.match(prompt, /Location Line: Moonlight Hall/);
  assert.match(prompt, /Theme Style: cinematic garden/);
  assert.match(prompt, /Palette: #101828, #f5d0fe, #f59e0b/);
  assert.match(
    prompt,
    /The finished result must still read first as a hosted invitation or greeting-card design, not a fan poster, character sheet, collage, or movie still/,
  );
  assert.match(
    prompt,
    /The supplied reference photo\(s\) may show people: show them prominently in the hero artwork with natural, respectful rendering\./,
  );
  assert.match(
    prompt,
    /The lower zone must stay decorative rather than UI-like: do not invent buttons, icons, icon clusters, circular controls, pills, chips, chat bars, nav bars, progress dots, home indicators, or device chrome\./,
  );
  assert.match(
    prompt,
    /Do not duplicate or mirror scene elements\. Avoid repeated tables, repeated floral arrangements, repeated gazebos, repeated desserts, repeated arches, repeated portraits, or second copies of the main scene stacked elsewhere in the card\./,
  );
  assert.match(
    prompt,
    /Do not create an unrelated solid bar, footer slab, color block, green strip, dark strip, or banner panel near the bottom of the card\./,
  );
  assert.match(
    prompt,
    /Do not place captions, labels, taglines, schedule lines, location lines, decorative badges, or faux footer details in the bottom button area\./,
  );
  assert.doesNotMatch(prompt, /Golden-hour rooftop birthday invitation\./);
  assert.match(
    prompt,
    /Never print phrases such as action buttons, button row, safe area, safe band, or any other instruction text in the artwork/,
  );
  assert.match(
    prompt,
    /Use only the approved invitation copy below for visible wording in the artwork\. Preserve spelling exactly and do not duplicate lines\./,
  );
  assert.match(prompt, /Event Year: 2030/);
});

test("poster-first live-card text prompts omit visible year and require poster-like copy", () => {
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
    /Never add the year to schedule\/date wording unless the user's custom wording explicitly includes that year\./,
  );
  assert.match(prompt, /write short cinematic invitation copy with a poster-like hierarchy/);
  assert.match(
    prompt,
    /Treat the Design Idea as dominant art direction for themeStyle, palette, and artwork mood; derive visible wording from event details\./,
  );
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
    { surface: "image", referenceImageCount: 1 },
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
    /This image is a finished invitation raster rather than empty background art\./,
  );
  assert.match(prompt, /Render Style Mode: Photoreal/);
  assert.match(
    prompt,
    /Bake the invitation text directly into the image itself so it feels like part of the printed or designed artwork, not a separate overlay\./,
  );
});
