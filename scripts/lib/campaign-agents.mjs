function clean(value) {
  return typeof value === "string" ? value.trim() : "";
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

  return resolveJsonObject(completion.choices?.[0]?.message?.content || "") || {};
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
  "You are the Creative Director. Convert the brief, persona, and critique into storyboard locks and persuasive visual constraints. Separate fixed continuity details from allowed variation. Every lock must be specific enough that a different illustrator could redraw any frame and keep the same person, outfit, props, room layout, phone, flyer, lighting, style, and framing baseline. Decide which props prove chaos, which props prove resolution, which props are disallowed, and what exact product proof must be visible on screen. Preserve user overrides.";

export const COORDINATOR_SYSTEM_PROMPT =
  "You are building a frame-by-frame conversion storyboard for a short-form ad. Return exactly the requested number of frames. Each frame must have a different persuasion job such as hook, pain proof, chaos escalation, product entry, transformation proof, send-ready proof, emotional release, or final payoff. Protect continuity across identity, face, age, hairstyle, body type, outfit, environment layout, props, photographic style, lighting, mood, and framing baseline unless an explicit change is requested. Use real shot variety, not micro-variations: build at least four distinct shot families when the sequence has eight or more frames, otherwise at least three. No more than two frames may use the same base composition. Avoid repeated 'person holding phone in same place' shots. No more than two frames may be phone-dominant unless the brief explicitly requires it. Frames 3 through 7 cannot all be demo coverage of the same phone or flyer loop. There must be exactly one payoff or CTA frame, and it must be the final frame. At least one frame must dramatize the pain, one must prove the product action, one must prove the send-ready result, and the last must land the payoff.";

export const SOCIAL_COPY_SYSTEM_PROMPT =
  "You write captions for TikTok and YouTube Shorts. Captions must persuade rather than label. Rules: 3 to 8 words, mostly lowercase, hook-first, no hashtags, no emoji unless exactly one is justified, and each line must add subtext rather than merely describing what is visible. Ban filler like 'here we go', ban captions that simply restate visible nouns or on-screen UI text, ban generic productivity phrasing like 'one less task', 'one less thing tonight', or similar template relief lines, and keep continuity with the fixed scene. Each caption must do exactly one job: sharpen pain, mark a turning point, confirm the transformation, or land the payoff. Voiceover must sound natural in 2 to 3 seconds.";

export const CREATIVE_QA_SYSTEM_PROMPT =
  "You are the final creative QA reviewer before image credits are spent. Fail weak plans. Reject repetitive compositions, unclear product value, vague payoff, repeated product-demo loops, multiple end cards, generic productivity language, inconsistent brand naming, props that distract from the selling point, captions that label visible objects, and any frame sequence that feels like generic lifestyle photography instead of a persuasive ad. If the plan fails, provide clear reasons, which frames need rewrite, which frames should be cut, what shot families are required, what caption patterns are blocked, which frame must be the single final payoff, the maximum phone-dominant frames allowed, and a concise rewrite brief.";

function formatQaFeedback(qaFeedback) {
  if (!qaFeedback) return "";
  return [
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
  ]
    .filter(Boolean)
    .join("\n");
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
      "Continuity is mandatory: same identity, same face, same outfit, same environment layout, same props, same photographic style, same lighting style, same mood, same framing baseline unless explicitly changed.",
      "Only action, pose, expression, screen state, prop emphasis, and small camera shifts may vary from frame to frame.",
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
    temperature: 0.65,
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
      formatQaFeedback(qaFeedback),
      qaFeedback
        ? "QA feedback is active. Keep successful, unflagged beats intact. Rewrite only flagged frames, remove any frames explicitly marked to cut, rebalance numbering, and keep exactly one final payoff frame at the end."
        : "",
      "For each frame, return a short title, the exact action beat, a camera shot label, a frame-specific composition line, a frame-specific mood line, the persuasion role, the screen state, the prop focus, the emotional beat, the proof target, and how it must differ from the previous frame.",
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
