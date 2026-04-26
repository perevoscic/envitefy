function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

const CANONICAL_BRAND_DOMAIN = "envitefy.com";
const BRAND_DOMAIN_TYPO_REGEX = /\benvitefye\.com\b/gi;

function normalizeBrandDomainText(value) {
  const text = clean(value);
  if (!text) return text;
  return text.replace(BRAND_DOMAIN_TYPO_REGEX, CANONICAL_BRAND_DOMAIN);
}

function normalizeBrandDomainDeep(value) {
  if (typeof value === "string") return normalizeBrandDomainText(value);
  if (Array.isArray(value)) return value.map((entry) => normalizeBrandDomainDeep(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeBrandDomainDeep(entry)]),
    );
  }
  return value;
}

function resolveJsonObject(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {}

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  return null;
}

async function runStructuredStage({
  client,
  model,
  responseFormat,
  systemPrompt,
  userLines,
  temperature = 0.5,
}) {
  const completion = await client.chat.completions.create({
    model,
    temperature,
    response_format: responseFormat,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userLines.filter(Boolean).join("\n"),
      },
    ],
  });

  const raw = resolveJsonObject(completion.choices?.[0]?.message?.content || "") || {};
  return normalizeBrandDomainDeep(raw);
}

function stringArraySchema() {
  return {
    type: "array",
    items: { type: "string" },
  };
}

export const BRIEF_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_campaign_brief",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        product: { type: "string" },
        audience: { type: "string" },
        problem: { type: "string" },
        promise: { type: "string" },
        desiredFeeling: { type: "string" },
        brandGuardrails: stringArraySchema(),
        campaignHook: { type: "string" },
        callToAction: { type: "string" },
        mustInclude: stringArraySchema(),
        mustAvoid: stringArraySchema(),
        singleAudience: { type: "string" },
        singlePain: { type: "string" },
        singlePromise: { type: "string" },
        coreMechanism: { type: "string" },
        proofMoment: { type: "string" },
        conversionGoal: { type: "string" },
        emotionalShift: { type: "string" },
        mustShow: stringArraySchema(),
        mustNotShow: stringArraySchema(),
        brandNaming: { type: "string" },
      },
      required: [
        "product",
        "audience",
        "problem",
        "promise",
        "desiredFeeling",
        "brandGuardrails",
        "campaignHook",
        "callToAction",
        "mustInclude",
        "mustAvoid",
        "singleAudience",
        "singlePain",
        "singlePromise",
        "coreMechanism",
        "proofMoment",
        "conversionGoal",
        "emotionalShift",
        "mustShow",
        "mustNotShow",
        "brandNaming",
      ],
    },
  },
};

export const PERSONA_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_campaign_persona",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        age: { type: "string" },
        occupation: { type: "string" },
        lifeContext: { type: "string" },
        triggerMoment: { type: "string" },
        objections: stringArraySchema(),
        aspirations: stringArraySchema(),
        voiceTone: { type: "string" },
        contextBeforeProduct: { type: "string" },
        whyNow: { type: "string" },
        whatFeelsMessy: { type: "string" },
        whatSuccessLooksLike: { type: "string" },
        whatWouldMakeHerSend: { type: "string" },
      },
      required: [
        "name",
        "age",
        "occupation",
        "lifeContext",
        "triggerMoment",
        "objections",
        "aspirations",
        "voiceTone",
        "contextBeforeProduct",
        "whyNow",
        "whatFeelsMessy",
        "whatSuccessLooksLike",
        "whatWouldMakeHerSend",
      ],
    },
  },
};

export const CRITIQUE_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_campaign_critique",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        resonatesBecause: stringArraySchema(),
        feelsOffBecause: stringArraySchema(),
        suggestedBeats: stringArraySchema(),
        confusions: stringArraySchema(),
        repetitionRisks: stringArraySchema(),
        missingProof: stringArraySchema(),
        genericAdSignals: stringArraySchema(),
        beatsToCut: stringArraySchema(),
      },
      required: [
        "resonatesBecause",
        "feelsOffBecause",
        "suggestedBeats",
        "confusions",
        "repetitionRisks",
        "missingProof",
        "genericAdSignals",
        "beatsToCut",
      ],
    },
  },
};

export const SCENE_SPEC_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_storyboard_scene_spec",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        numberOfFrames: {
          anyOf: [{ type: "integer", minimum: 1, maximum: 24 }, { type: "null" }],
        },
        characterLock: { type: "string" },
        outfitLock: { type: "string" },
        phoneLock: { type: "string" },
        flyerLock: { type: "string" },
        accessoryLock: { type: "string" },
        locationLock: { type: "string" },
        backgroundAnchors: { type: "string" },
        screenLock: { type: "string" },
        composition: { type: "string" },
        mood: { type: "string" },
        mainCharacterDetails: { type: "string" },
        locationEnvironment: { type: "string" },
        propsKeyObjects: { type: "string" },
        visualStyle: { type: "string" },
        cameraFormat: { type: "string" },
        frameToFrameChanges: { type: "string" },
        actionSequence: stringArraySchema(),
        environmentStrategy: { type: "string" },
        propPriority: { type: "string" },
        disallowedProps: { type: "string" },
        screenProofRequirements: { type: "string" },
        visualArc: { type: "string" },
        identityLock: { type: "string" },
        appearanceLock: { type: "string" },
        environmentLayoutLock: { type: "string" },
        propContinuityLock: { type: "string" },
        styleContinuityLock: { type: "string" },
        framingBaseline: { type: "string" },
      },
      required: [
        "numberOfFrames",
        "characterLock",
        "outfitLock",
        "phoneLock",
        "flyerLock",
        "accessoryLock",
        "locationLock",
        "backgroundAnchors",
        "screenLock",
        "composition",
        "mood",
        "mainCharacterDetails",
        "locationEnvironment",
        "propsKeyObjects",
        "visualStyle",
        "cameraFormat",
        "frameToFrameChanges",
        "actionSequence",
        "environmentStrategy",
        "propPriority",
        "disallowedProps",
        "screenProofRequirements",
        "visualArc",
        "identityLock",
        "appearanceLock",
        "environmentLayoutLock",
        "propContinuityLock",
        "styleContinuityLock",
        "framingBaseline",
      ],
    },
  },
};

export const FRAME_PLAN_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_storyboard_frame_plan",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        frames: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              actionBeat: { type: "string" },
              cameraShot: { type: "string" },
              composition: { type: "string" },
              mood: { type: "string" },
              persuasionRole: { type: "string" },
              screenState: { type: "string" },
              propFocus: { type: "string" },
              emotionalBeat: { type: "string" },
              proofTarget: { type: "string" },
              mustDifferFromPrevious: { type: "string" },
              shotFamily: {
                type: "string",
                enum: [
                  "wide-environment",
                  "environment-detail",
                  "hands-action",
                  "over-shoulder",
                  "phone-proof",
                  "reaction",
                  "social-proof",
                  "final-hero",
                ],
              },
              phoneDominance: {
                type: "string",
                enum: ["none", "secondary", "dominant"],
              },
              brandingPresence: {
                type: "string",
                enum: ["none", "subtle", "screen", "hero"],
              },
              disallowedPropRisk: { type: "string" },
            },
            required: [
              "title",
              "actionBeat",
              "cameraShot",
              "composition",
              "mood",
              "persuasionRole",
              "screenState",
              "propFocus",
              "emotionalBeat",
              "proofTarget",
              "mustDifferFromPrevious",
              "shotFamily",
              "phoneDominance",
              "brandingPresence",
              "disallowedPropRisk",
            ],
          },
        },
      },
      required: ["frames"],
    },
  },
};

export const SOCIAL_COPY_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_storyboard_social_copy",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        hook: { type: "string" },
        endCard: { type: "string" },
        frames: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              frameNumber: { type: "integer", minimum: 1 },
              text: { type: "string" },
              emphasisWord: { type: "string" },
              voiceover: { type: "string" },
              durationSec: { type: "number", minimum: 1, maximum: 3.5 },
              transition: {
                type: "string",
                enum: ["cut", "crossfade", "whip"],
              },
              kineticStyle: {
                type: "string",
                enum: ["pop-in", "typewriter", "word-by-word", "static"],
              },
              captionRole: { type: "string" },
            },
            required: [
              "frameNumber",
              "text",
              "emphasisWord",
              "voiceover",
              "durationSec",
              "transition",
              "kineticStyle",
              "captionRole",
            ],
          },
        },
      },
      required: ["hook", "endCard", "frames"],
    },
  },
};

export const CREATIVE_QA_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marketing_storyboard_creative_qa",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        pass: { type: "boolean" },
        reasons: stringArraySchema(),
        framesToRewrite: {
          type: "array",
          items: { type: "integer", minimum: 1 },
        },
        framesToCut: {
          type: "array",
          items: { type: "integer", minimum: 1 },
        },
        captionIssues: stringArraySchema(),
        blockedCaptionPatterns: stringArraySchema(),
        requiredShotFamilies: stringArraySchema(),
        singleFinalPayoffFrame: {
          anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }],
        },
        maxPhoneDominantFrames: { type: "integer", minimum: 0, maximum: 24 },
        valueClarityScore: { type: "integer", minimum: 1, maximum: 5 },
        visualVarietyScore: { type: "integer", minimum: 1, maximum: 5 },
        productProofScore: { type: "integer", minimum: 1, maximum: 5 },
        rewriteBrief: { type: "string" },
      },
      required: [
        "pass",
        "reasons",
        "framesToRewrite",
        "framesToCut",
        "captionIssues",
        "blockedCaptionPatterns",
        "requiredShotFamilies",
        "singleFinalPayoffFrame",
        "maxPhoneDominantFrames",
        "valueClarityScore",
        "visualVarietyScore",
        "productProofScore",
        "rewriteBrief",
      ],
    },
  },
};

export const BRIEF_SYSTEM_PROMPT =
  "You are the Director of Growth Marketing. Turn the loose founder prompt into a conversion brief with one audience, one pain, one product promise, and one proof moment. You must choose a single buyer, a single emotional problem, a single transformation, and the exact conversion outcome. Do not invent product features that were not stated. Reject mushy positioning that tries to sell speed, beauty, organization, and premium brand feel all at once without a primary value.";

export const PERSONA_SYSTEM_PROMPT =
  "You are the exact end customer described in the brief. Speak in first person, present tense. Describe the concrete moment before the product appears, why this moment matters now, what feels messy or stressful, and what would finally make you confident enough to send or publish.";

export const CRITIQUE_SYSTEM_PROMPT =
  "You are a ruthless ad reviewer. Given the brief and the persona, identify what lands, what feels fake or generic, what confuses the value proposition, what visual repetition risks exist, what proof is missing, and which beats should be cut. Call out weak hooks, mushy product value, repeated compositions, and stock-ad behavior.";

export const ART_DIRECTION_SYSTEM_PROMPT =
  "You are the Creative Director for a short-form ad made from still images. Convert the brief, persona, and critique into storyboard locks plus explicit variation rules. Separate fixed continuity details from allowed variation. Every lock must be specific enough that a different illustrator could redraw any frame and keep the same person, outfit, props, room layout, phone, flyer, lighting, style, and framing baseline. But do not freeze the campaign into one repeated composition. Lock identity, wardrobe, room, product, invite design, lighting direction, and brand tone. Do not lock one chest-level phone pose, one centered stance, or one medium close-up across the whole sequence. Favor candid, observational, believable camera language over posed product-demo photography. The subject should usually seem unaware of the camera, as if captured naturally from the side, three-quarter rear, over-the-shoulder, or in passing, not performing for the lens. Decide which props prove chaos, which props prove resolution, which props are disallowed, and what exact product proof must be visible on screen. Preserve user overrides. Preserve the user's vertical and story intent over any defaults: a birthday invite/flyer-delay campaign must not become gymnastics, sports, dance, or an activity-venue campaign unless the user explicitly requested that. For birthday campaigns, place the scene before the party, avoid physical birthday cake and completed party setups unless explicitly requested, and make the final proof the digital Envitefy live card or share result. Phones must be physically held by visible fingers or supported on a table/counter; never instruct a floating phone. Paper props must face the character's natural reading direction, not the camera, and should not create upside-down planner text from the character's perspective.";

export const COORDINATOR_SYSTEM_PROMPT =
  "You are building a frame-by-frame conversion storyboard for a short-form ad assembled from still images. Return exactly the requested number of frames. Each frame must have a different persuasion job such as hook, pain proof, chaos escalation, product entry, transformation proof, send-ready proof, emotional release, premium proof, or final payoff. Protect continuity across identity, face, age, hairstyle, body type, outfit, environment layout, props, photographic style, lighting, mood, and framing baseline unless an explicit change is requested. Use real shot variety, not micro-variations: build at least four distinct shot families when the sequence has eight or more frames, otherwise at least three. When the sequence has ten or more frames, aim for at least five shot families. No more than two frames may use the same base composition. No more than two adjacent frames may share the same camera distance or the same body orientation. Avoid repeated 'person holding phone in same place' shots. No more than three frames may be phone-dominant unless the brief explicitly requires it. At least one frame must be an environmental pain frame, at least one must be an over-the-shoulder or top-down action frame, at least one must be a tight product-proof frame, and exactly one must be a final hero or CTA frame. Frames 3 through 7 cannot all be demo coverage of the same phone or flyer loop. Adjacent frames must change at least two of these: camera distance, camera height, subject angle, hand action, eyeline, prop emphasis, or foreground object. Avoid direct phone presentation to camera. The subject should not hold the phone up to the lens in an unnatural sales-demo pose. Prefer candid side angles, over-the-shoulder coverage, profile views, tabletop inserts, hands-in-action shots, and observational framing where the subject seems unaware of the camera. If the screen must be legible, solve it with over-the-shoulder, angled close-ups, or phone-on-counter inserts instead of a frontal presentation pose. Do not use direct-to-camera performance unless the brief explicitly demands it. There must be exactly one payoff or CTA frame, and it must be the final frame. At least one frame must dramatize the pain, one must prove the product action, one must prove the send-ready result, one must prove the premium finished output, and the last must land the payoff. For birthday invite or birthday flyer-delay campaigns, do not introduce gymnastics, sports venues, dance studios, athlete posters, medals, trophies, or invented gym locations such as Bright Stars Gymnastics unless the user explicitly requested them. For those birthday campaigns, do not show a physical birthday cake, children, or a completed party table unless explicitly requested; keep the story before the party and make the final result the digital Envitefy live birthday card or share confirmation. Any phone in a frame must be visibly held by natural fingers or supported on a table/counter; never imply it hangs in air. Any planner, notebook, receipt, or paper should face the character's natural reading direction, not be staged squarely toward the camera. For every frame, classify shotFamily, phoneDominance, brandingPresence, and disallowedPropRisk honestly. Classify any Google search, search results, phone screen close-up, UI close-up, app screen, typing/tapping/scrolling phone, or held-phone proof frame as phoneDominance dominant. Do not hide a phone-heavy frame by calling it secondary. If a frame introduces a tablet, laptop, extra screen, or any prop blocked by the scene spec, name that risk in disallowedPropRisk instead of leaving it empty.";

export const SOCIAL_COPY_SYSTEM_PROMPT =
  "You write captions for TikTok and YouTube Shorts. Captions must persuade rather than label. Return exactly one caption object for every storyboard frame, using the same frameNumber values and order as the input frames. Never skip frames, merge frames, renumber frames, or return fewer captions than frames. Rules: 3 to 8 words, mostly lowercase, hook-first, no hashtags, no emoji unless exactly one is justified, and each line must add subtext rather than merely describing what is visible. Ban filler like 'here we go', ban captions that simply restate visible nouns or on-screen UI text, ban generic productivity phrasing like 'one less task', 'one less thing tonight', or similar template relief lines, and keep continuity with the fixed scene. Each caption must do exactly one job: sharpen pain, mark a turning point, confirm the transformation, or land the payoff. Voiceover must sound natural in 2 to 3 seconds.";

export const CREATIVE_QA_SYSTEM_PROMPT =
  "You are the final creative QA reviewer before image credits are spent. Separate hard blockers from soft creative notes. Fail only for issues that would waste image generation: frame-count mismatch, disallowed props, unclear product value, missing product proof, missing final in-scene payoff, graphic logo or text-only end cards, multiple end cards, inconsistent brand naming, severe repeated product-demo loops, or captions that are unusable. Do not fail a budget-compliant plan solely because it could be more emotionally varied, because product-proof frames are at the allowed limit, because two product-proof frames have related angles, because a social-proof beat could be more specific, or because captions need polish; report those as notes while passing if the core storyboard works. A plan fails if it still reads like 'the same person in the same room holding the same phone toward camera' with only screen swaps or facial-expression changes. A plan fails if continuity was achieved by locking a single composition instead of locking identity and world. A plan fails if the shot list lacks any clear environmental setup, action coverage, product proof, or premium payoff. A plan fails if the subject repeatedly performs for the camera with unnatural phone presentation poses instead of behaving naturally in-scene. A ten-frame plan normally fails when more than three frames are phone-dominant, when more than two frames share the same phone-presentation pose, or when the only variety is tighter or wider versions of the same shot. Score visual variety realistically, not punitively, when the frame plan already includes distinct shot families. Prefer candid observational framing and side-angle realism over staged product-demo posture. If the plan fails, provide clear hard-blocker reasons, which frames need rewrite, which frames should be cut, what shot families are required, what caption patterns are blocked, which frame must be the single final payoff, the maximum phone-dominant frames allowed, and a concise rewrite brief.";

function formatQaFeedback(qaFeedback) {
  if (!qaFeedback) return "";
  return [
    qaFeedback.source ? `Feedback source: ${qaFeedback.source}` : "",
    qaFeedback.discardExistingFramePlan ? "Discard existing frame plan: true" : "",
    qaFeedback.rewriteBrief ? `Rewrite brief: ${qaFeedback.rewriteBrief}` : "",
    Array.isArray(qaFeedback.reasons) && qaFeedback.reasons.length > 0
      ? `QA reasons: ${qaFeedback.reasons.join(" | ")}`
      : "",
    Array.isArray(qaFeedback.captionIssues) && qaFeedback.captionIssues.length > 0
      ? `Caption issues: ${qaFeedback.captionIssues.join(" | ")}`
      : "",
    Array.isArray(qaFeedback.framesToRewrite) && qaFeedback.framesToRewrite.length > 0
      ? `Frames to rewrite: ${qaFeedback.framesToRewrite.join(", ")}`
      : "",
    Array.isArray(qaFeedback.framesToCut) && qaFeedback.framesToCut.length > 0
      ? `Frames to cut: ${qaFeedback.framesToCut.join(", ")}`
      : "",
    Array.isArray(qaFeedback.requiredShotFamilies) && qaFeedback.requiredShotFamilies.length > 0
      ? `Required shot families: ${qaFeedback.requiredShotFamilies.join(" | ")}`
      : "",
    Array.isArray(qaFeedback.blockedCaptionPatterns) && qaFeedback.blockedCaptionPatterns.length > 0
      ? `Blocked caption patterns: ${qaFeedback.blockedCaptionPatterns.join(" | ")}`
      : "",
    Number.isFinite(Number(qaFeedback.singleFinalPayoffFrame))
      ? `Single final payoff frame: ${Number(qaFeedback.singleFinalPayoffFrame)}`
      : "",
    Number.isFinite(Number(qaFeedback.maxPhoneDominantFrames))
      ? `Max phone-dominant frames: ${Number(qaFeedback.maxPhoneDominantFrames)}`
      : "",
    Array.isArray(qaFeedback.strictShotBudgetMap) && qaFeedback.strictShotBudgetMap.length > 0
      ? `Strict shot budget map: ${qaFeedback.strictShotBudgetMap.join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isStoryboardBudgetFeedback(qaFeedback) {
  return qaFeedback?.source === "storyboard-budget" || qaFeedback?.discardExistingFramePlan === true;
}

function formatShotBudgetGuide(sceneSpec) {
  const frameCount = Number(sceneSpec?.numberOfFrames) || 0;
  if (frameCount < 10) return "";
  return [
    "Required ten-frame shot budget map:",
    "1 wide-environment, phoneDominance none, brandingPresence none",
    "2 environment-detail, phoneDominance none, brandingPresence none",
    "3 hands-action, phoneDominance none or secondary, brandingPresence none, no Google search/search results",
    "4 over-shoulder, phoneDominance none, brandingPresence none",
    "5 phone-proof, phoneDominance dominant, brandingPresence screen",
    "6 reaction, phoneDominance none, brandingPresence none",
    "7 social-proof, phoneDominance none or secondary, brandingPresence none or subtle",
    "8 phone-proof, phoneDominance dominant, brandingPresence screen",
    "9 reaction, phoneDominance none, brandingPresence none",
    "10 final-hero, phoneDominance none, brandingPresence none",
    "Only frames 5 and 8 should be phone-dominant. Frame 7 social-proof must not be another phone demo. Frame 10 must be final-hero, non-phone-dominant, and must not describe a phone screen, search, typing, tapping, scrolling, held-phone proof, graphic logo, standalone logo, CTA card, or text-only end card. Show the character's emotional transformation in the real scene.",
  ].join("\n");
}

export async function runBriefAgent({ client, model, campaignInput }) {
  return runStructuredStage({
    client,
    model,
    responseFormat: BRIEF_RESPONSE_FORMAT,
    temperature: 0.4,
    systemPrompt: BRIEF_SYSTEM_PROMPT,
    userLines: [
      "Produce a conversion-focused campaign brief.",
      `Loose prompt: ${campaignInput.criteria || campaignInput.looseInput?.rawPrompt || ""}`,
      campaignInput.productName ? `Product name: ${campaignInput.productName}` : "",
      campaignInput.targetVertical ? `Target vertical: ${campaignInput.targetVertical}` : "",
      campaignInput.tone ? `Desired tone: ${campaignInput.tone}` : "",
      campaignInput.callToAction ? `CTA: ${campaignInput.callToAction}` : "",
      campaignInput.looseInput?.extraNotes ? `Extra notes: ${campaignInput.looseInput.extraNotes}` : "",
      "Brand naming must be exact in every field: envitefy.com (never envitefye.com or any variant).",
      "Choose one audience, one pain, one promise, and one proof moment. Do not make the brief broad or generic.",
    ],
  });
}

export async function runPersonaAgent({ client, model, brief }) {
  return runStructuredStage({
    client,
    model,
    responseFormat: PERSONA_RESPONSE_FORMAT,
    temperature: 0.7,
    systemPrompt: PERSONA_SYSTEM_PROMPT,
    userLines: [
      "Create a target-customer persona for this campaign.",
      `Brief JSON: ${JSON.stringify(brief)}`,
    ],
  });
}

export async function runCritiqueAgent({ client, model, brief, persona }) {
  return runStructuredStage({
    client,
    model,
    responseFormat: CRITIQUE_RESPONSE_FORMAT,
    temperature: 0.55,
    systemPrompt: CRITIQUE_SYSTEM_PROMPT,
    userLines: [
      "Critique this campaign direction like a skeptical ad reviewer.",
      `Brief JSON: ${JSON.stringify(brief)}`,
      `Persona JSON: ${JSON.stringify(persona)}`,
    ],
  });
}

export async function runArtDirectionAgent({ client, model, campaignInput, brief, persona, critique }) {
  return runStructuredStage({
    client,
    model,
    responseFormat: SCENE_SPEC_RESPONSE_FORMAT,
    temperature: 0.45,
    systemPrompt: ART_DIRECTION_SYSTEM_PROMPT,
    userLines: [
      "Produce the scene-spec lock set for a storyboard ad sequence.",
      `Campaign input JSON: ${JSON.stringify(campaignInput)}`,
      `Brief JSON: ${JSON.stringify(brief)}`,
      `Persona JSON: ${JSON.stringify(persona)}`,
      `Critique JSON: ${JSON.stringify(critique)}`,
      "Continuity is mandatory: same identity, same face, same outfit, same environment layout, same props, same photographic style, same lighting style, same mood, and the same brand world unless explicitly changed.",
      "Do not lock one repeated composition. The scene spec must preserve continuity while explicitly allowing shot-family variation, blocking variation, and prop emphasis variation inside the same location.",
      "Write composition and framing fields as sequence-level guardrails, not one reusable shot. Good examples: 'vertical short-form ad with mixed wide, insert, over-the-shoulder, tabletop, and hero frames' or 'same kitchen, varied camera distance and subject angle, no repeated phone presentation pose'.",
      "The frameToFrameChanges field must permit meaningful variation in camera distance, camera height, body angle, hand action, eyeline, prop emphasis, and foreground object. Do not limit variation to only pose, facial expression, screen state, or tiny camera shifts.",
      "Bias toward candid, side-angle, observational framing. The subject should usually look like she does not know someone took the photo.",
      "Do not write composition guidance that asks the subject to present the phone directly to camera. Product proof should come from over-the-shoulder, profile, insert, or countertop views.",
      "If the critique warns about repetition or stock-ad behavior, convert that into hard anti-repetition language in the scene spec.",
    ],
  });
}

export async function runCoordinatorAgent({
  client,
  model,
  sceneSpec,
  brief,
  persona,
  critique,
  qaFeedback,
  currentFramePlan,
}) {
  return runStructuredStage({
    client,
    model,
    responseFormat: FRAME_PLAN_RESPONSE_FORMAT,
    temperature: isStoryboardBudgetFeedback(qaFeedback) ? 0.25 : 0.65,
    systemPrompt: COORDINATOR_SYSTEM_PROMPT,
    userLines: [
      "Create a storyboard frame plan for image generation.",
      `Scene spec JSON: ${JSON.stringify(sceneSpec)}`,
      `Brief JSON: ${JSON.stringify(brief)}`,
      `Persona JSON: ${JSON.stringify(persona)}`,
      `Critique JSON: ${JSON.stringify(critique)}`,
      Array.isArray(currentFramePlan) && currentFramePlan.length > 0
        ? `Existing frame plan JSON: ${JSON.stringify(currentFramePlan)}`
        : "",
      formatShotBudgetGuide(sceneSpec),
      formatQaFeedback(qaFeedback),
      isStoryboardBudgetFeedback(qaFeedback)
        ? "STRICT BUDGET REWRITE: discard the previous frame plan completely. Do not preserve any phone-heavy frame just because it existed before. Build a fresh plan from the required ten-frame shot budget map."
        : "",
      qaFeedback
        ? "QA feedback is active. Keep successful beats only if they also satisfy the shot budget map. Rewrite any frame whose text or metadata violates phoneDominance, shotFamily, brandingPresence, disallowedPropRisk, or final-hero requirements. Remove any frames explicitly marked to cut, rebalance numbering, and keep exactly one final payoff frame at the end."
        : "",
      "Build the sequence like an ad editor would: hook, escalation, product entry, action proof, result proof, relief, premium payoff, CTA. Do not spend most of the sequence on front-facing demo coverage.",
      "Treat cameraShot plus composition as hard differentiation tools. Every frame needs a genuinely distinct setup, not a synonym for the same shot.",
      "Use a mix of environmental, insert, over-the-shoulder, top-down or tabletop, side-profile or three-quarter, tight proof, and final hero frames when the story supports it.",
      "Prefer natural observational framing. The subject should feel caught mid-action, not posed for an ad photographer.",
      "For each frame, return a short title, the exact action beat, a camera shot label, a frame-specific composition line, a frame-specific mood line, the persuasion role, the screen state, the prop focus, the emotional beat, the proof target, and how it must differ from the previous frame.",
      "For each frame, also return shotFamily, phoneDominance, brandingPresence, and disallowedPropRisk. For ten-frame non-demo ads, phoneDominance may be dominant on at most three frames; the final frame must be final-hero and not phone-dominant.",
      "Classify any Google search, search results, phone screen close-up, UI close-up, app screen, typing/tapping/scrolling phone, or held-phone proof frame as phoneDominance dominant. Do not label those frames secondary.",
      "For ten-frame ads include one social-proof frame, such as a recipient response, RSVP momentum, confidence signal, or quality/trust proof, without adding disallowed props or turning it into another phone demo.",
      "The final frame must be an in-scene emotional payoff showing the character's benefit or relief. It must not be a graphic logo shot, standalone logo, CTA card, text-only card, or forced brand splash.",
      "BrandingPresence discipline: use screen only for the one or two clearest product-proof frames, use hero only for the single final payoff frame, and mark every other frame subtle or none. Do not repeat logos across ordinary action, reaction, or environment frames.",
      "Use disallowedPropRisk only when the frame violates or risks violating scene-spec prop rules, such as introducing a tablet when tablets are disallowed.",
      "In mustDifferFromPrevious, explicitly name the concrete changes in shot family, camera distance or angle, body orientation, prop emphasis, or eyeline. Do not say only that the screen content changes.",
    ],
  });
}

export async function runSocialCopyAgent({
  client,
  model,
  brief,
  persona,
  critique,
  frames,
  sceneSpec,
  tone,
  qaFeedback,
  currentSocialCopy,
}) {
  return runStructuredStage({
    client,
    model,
    responseFormat: SOCIAL_COPY_RESPONSE_FORMAT,
    temperature: 0.8,
    systemPrompt: SOCIAL_COPY_SYSTEM_PROMPT,
    userLines: [
      "Write short-form social captions for this storyboard.",
      tone ? `Tone: ${tone}` : "",
      `Scene spec JSON: ${JSON.stringify(sceneSpec)}`,
      `Brief JSON: ${JSON.stringify(brief)}`,
      `Persona JSON: ${JSON.stringify(persona)}`,
      `Critique JSON: ${JSON.stringify(critique)}`,
      `Frames JSON: ${JSON.stringify(frames)}`,
      currentSocialCopy ? `Existing social copy JSON: ${JSON.stringify(currentSocialCopy)}` : "",
      formatQaFeedback(qaFeedback),
      `Required caption count: ${Array.isArray(frames) ? frames.length : 0}`,
      "Return frames for every input frameNumber exactly once. If there are 10 frames, return 10 social-copy frame objects.",
      "Do not restate visible objects, UI labels, or what the viewer can already see on screen.",
    ],
  });
}

export async function runCreativeQaAgent({
  client,
  model,
  brief,
  persona,
  critique,
  sceneSpec,
  framePlan,
  socialCopy,
}) {
  return runStructuredStage({
    client,
    model,
    responseFormat: CREATIVE_QA_RESPONSE_FORMAT,
    temperature: 0.3,
    systemPrompt: CREATIVE_QA_SYSTEM_PROMPT,
    userLines: [
      "Review this campaign before image generation.",
      `Brief JSON: ${JSON.stringify(brief)}`,
      `Persona JSON: ${JSON.stringify(persona)}`,
      `Critique JSON: ${JSON.stringify(critique)}`,
      `Scene spec JSON: ${JSON.stringify(sceneSpec)}`,
      `Frame plan JSON: ${JSON.stringify(framePlan)}`,
      `Social copy JSON: ${JSON.stringify(socialCopy)}`,
      "Assume a ten-frame plan should usually cap phone-dominant frames at three unless the brief explicitly requires a product-demo-heavy ad.",
      "If the storyboard satisfies the phone budget, shot-family coverage, product proof, and final payoff requirements, pass it with notes unless there is a hard blocker.",
      "Do not fail solely because phone frames are at the allowed upper limit, two proof frames are compositionally related, captions need polish, the social-proof beat could be sharper, or environment/reaction frames could be more varied.",
      "Do not pass a plan just because continuity and readable UI are present. Variety, persuasion rhythm, and payoff clarity are mandatory, but soft polish concerns belong in reasons or captionIssues with pass true.",
      "If a frame sequence could be summarized as 'same woman, same kitchen, same phone pose, different screen' then pass must be false.",
      "If the phone is repeatedly held out toward camera in a way a real person would not naturally do, pass must be false.",
      "When you pass a plan, requiredShotFamilies and maxPhoneDominantFrames must still reflect the discipline that made it pass.",
    ],
  });
}

export function normalizeSocialCopyFrame(frame) {
  return {
    frameNumber: Number.isFinite(Number(frame?.frameNumber)) ? Math.trunc(Number(frame.frameNumber)) : 0,
    text: clean(frame?.text),
    emphasisWord: clean(frame?.emphasisWord),
    voiceover: clean(frame?.voiceover),
    durationSec:
      typeof frame?.durationSec === "number" && Number.isFinite(frame.durationSec)
        ? frame.durationSec
        : 2,
    transition: clean(frame?.transition) || "cut",
    kineticStyle: clean(frame?.kineticStyle) || "static",
    captionRole: clean(frame?.captionRole),
  };
}
