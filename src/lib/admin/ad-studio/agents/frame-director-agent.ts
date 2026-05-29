import { runJsonTextAgent } from "@/lib/admin/ad-studio/providers";
import { FRAME_PLAN_SCHEMA } from "@/lib/admin/ad-studio/schemas";
import type {
  AdStudioRequest,
  CampaignBrief,
  FramePlan,
  FramePlanItem,
  InvitationDesign,
  PhoneUIDesign,
  VideoScript,
} from "@/lib/admin/ad-studio/types";
import { aspectRatioForFormat, compactText, renderableFormat, safeString } from "./common";

function fallbackFramePlan(request: AdStudioRequest, script: VideoScript): FramePlan {
  const format = renderableFormat(request.format);
  const frames: FramePlanItem[] = script.scenes.map((scene) => {
    const frameNumber = scene.sceneNumber;
    if (frameNumber === 1) {
      return {
        frameNumber,
        scenePurpose: scene.purpose,
        visualDescription:
          "Realistic kitchen planning moment with a tasteful blank 5x7 paper card on the fridge and a host reacting to phone notifications.",
        cameraAngle: "medium-wide cinematic angle, slight handheld realism",
        characterAction: "host pauses in front of the fridge while holding a phone",
        blankSurfaceRequirements: ["blank unprinted 5x7 paper invitation on the fridge"],
        compositeTargets: [
          {
            type: "invitation",
            surface: "fridge",
            placementHint: "place the deterministic invitation on the blank fridge paper",
          },
        ],
        lighting: "soft morning kitchen window light",
        mood: "relatable, slightly overwhelmed, premium but natural",
        negativePrompt:
          "no readable flyer text, no fake UI text, no brand logos, no watermarks, no distorted hands",
        requiredReferences: [],
      };
    }
    if (frameNumber === 2) {
      return {
        frameNumber,
        scenePurpose: scene.purpose,
        visualDescription:
          "Same host at a kitchen counter with their phone buzzing and a blank invitation card nearby, leaving room for message overlays.",
        cameraAngle: "tight lifestyle close-up with shallow depth of field",
        characterAction: "host looks at incoming messages with visible planning stress",
        blankSurfaceRequirements: [
          "blank invitation card on table or counter",
          "phone screen turned away or blank",
        ],
        compositeTargets: [
          {
            type: "invitation",
            surface: "table",
            placementHint: "place deterministic invitation on the blank table card",
          },
        ],
        lighting: "soft interior daylight with practical warm highlights",
        mood: "busy, human, not chaotic clutter",
        negativePrompt:
          "no generated readable text, no exact UI, no fake chat content inside the base image",
        requiredReferences: ["cropped_host_identity_reference"],
      };
    }
    if (frameNumber === 3) {
      return {
        frameNumber,
        scenePurpose: scene.purpose,
        visualDescription:
          "Same host holding a modern phone toward camera with a clean blank screen ready for a deterministic Envitefy mockup.",
        cameraAngle: "over-the-shoulder close-up with phone screen clearly visible",
        characterAction: "host snaps or uploads the invite using the phone",
        blankSurfaceRequirements: ["large blank phone screen with no generated app UI"],
        compositeTargets: [
          {
            type: "phone-ui",
            surface: "phone-screen",
            placementHint: "place deterministic Envitefy capture/reveal UI on the phone",
          },
        ],
        lighting: "clean soft daylight, screen area not blown out",
        mood: "relief and discovery",
        negativePrompt:
          "no readable app UI from the image model, no flyer design leaked into the phone screen",
        requiredReferences: ["cropped_host_identity_reference"],
      };
    }
    if (frameNumber === 4) {
      return {
        frameNumber,
        scenePurpose: scene.purpose,
        visualDescription:
          "Hero phone shot in the host's hand with a blank screen, background softly showing the event setting.",
        cameraAngle: "product-demo macro shot, phone centered and readable",
        characterAction: "host presents the phone with confidence",
        blankSurfaceRequirements: [
          "full blank phone screen that can hold deterministic product UI",
        ],
        compositeTargets: [
          {
            type: "phone-ui",
            surface: "hero-phone",
            placementHint: "place deterministic full Envitefy event page UI on the blank phone",
          },
        ],
        lighting: "bright polished product demo lighting",
        mood: "clean, helpful, premium",
        negativePrompt:
          "no generated product text, no fake readable UI, no invitation art inside the phone screen",
        requiredReferences: ["cropped_host_identity_reference"],
      };
    }
    return {
      frameNumber,
      scenePurpose: scene.purpose,
      visualDescription:
        "Final lifestyle payoff with the host sharing one link, a blank phone screen visible for the CTA product page.",
      cameraAngle: "medium portrait with phone in foreground",
      characterAction: "host smiles and sends the Envitefy link",
      blankSurfaceRequirements: ["blank phone screen for deterministic final CTA UI"],
      compositeTargets: [
        {
          type: "phone-ui",
          surface: "phone-screen",
          placementHint: "place deterministic Envitefy event page and CTA on the phone",
        },
      ],
      lighting: "warm clean evening light",
      mood: "calm, organized, celebratory",
      negativePrompt:
        "no generated readable UI, no fake text, no watermarks, no copied full-frame composition",
      requiredReferences: ["cropped_host_identity_reference"],
    };
  });
  return { format, aspectRatio: aspectRatioForFormat(format), frames };
}

function normalizeFrame(value: unknown, fallback: FramePlanItem): FramePlanItem {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  return {
    ...fallback,
    scenePurpose: compactText(safeString(record.scenePurpose) || fallback.scenePurpose, 80),
    visualDescription: compactText(
      safeString(record.visualDescription) || fallback.visualDescription,
      340,
    ),
    cameraAngle: compactText(safeString(record.cameraAngle) || fallback.cameraAngle, 140),
    characterAction: compactText(
      safeString(record.characterAction) || fallback.characterAction,
      160,
    ),
    blankSurfaceRequirements: Array.isArray(record.blankSurfaceRequirements)
      ? record.blankSurfaceRequirements.map(safeString).filter(Boolean).slice(0, 4)
      : fallback.blankSurfaceRequirements,
    lighting: compactText(safeString(record.lighting) || fallback.lighting, 120),
    mood: compactText(safeString(record.mood) || fallback.mood, 120),
    negativePrompt: compactText(safeString(record.negativePrompt) || fallback.negativePrompt, 240),
    requiredReferences: Array.isArray(record.requiredReferences)
      ? record.requiredReferences.map(safeString).filter(Boolean).slice(0, 3)
      : fallback.requiredReferences,
  };
}

function normalizeFramePlan(value: unknown, fallback: FramePlan): FramePlan | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const frames = Array.isArray(record.frames) ? record.frames : [];
  if (frames.length < fallback.frames.length) return null;
  return {
    ...fallback,
    frames: fallback.frames.map((frame, index) => normalizeFrame(frames[index], frame)),
  };
}

export async function runFrameDirectorAgent({
  request,
  brief,
  script,
  invitation,
  phoneUi,
}: {
  request: AdStudioRequest;
  brief: CampaignBrief;
  script: VideoScript;
  invitation: InvitationDesign;
  phoneUi: PhoneUIDesign;
}) {
  const fallback = fallbackFramePlan(request, script);
  const prompt = `Create an image frame plan for a ${request.videoLength}-second Envitefy promo.

Campaign:
${JSON.stringify(brief, null, 2)}

Script:
${JSON.stringify(script.scenes, null, 2)}

Invitation JSON:
${JSON.stringify(invitation, null, 2)}

Phone UI JSON:
${JSON.stringify(phoneUi, null, 2)}

Rules:
- The image model generates only realistic base scenes.
- Include blank paper/card surfaces where the deterministic invitation will be composited.
- Include blank phone screens where deterministic phone UI will be composited.
- Use cropped_host_identity_reference from frame 1 for later host scenes.
- Do not use whole prior frames as references unless absolutely necessary.`;

  return runJsonTextAgent({
    agentName: "frame_director_agent",
    prompt,
    schema: FRAME_PLAN_SCHEMA,
    fallback,
    normalize: (value) => normalizeFramePlan(value, fallback),
  });
}
