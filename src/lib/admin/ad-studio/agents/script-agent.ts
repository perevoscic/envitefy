import { runJsonTextAgent } from "@/lib/admin/ad-studio/providers";
import { VIDEO_SCRIPT_SCHEMA } from "@/lib/admin/ad-studio/schemas";
import type {
  AdStudioRequest,
  CampaignBrief,
  VideoScene,
  VideoScript,
} from "@/lib/admin/ad-studio/types";
import { compactText, safeString } from "./common";

function timestamp(start: number, end: number): string {
  return `0:${String(start).padStart(2, "0")}-0:${String(end).padStart(2, "0")}`;
}

function sceneDurations(total: number): number[] {
  if (total === 10) return [2, 2, 2, 2, 2];
  if (total === 20) return [4, 4, 4, 4, 4];
  return [3, 3, 3, 3, 3];
}

function fallbackScript(request: AdStudioRequest, brief: CampaignBrief): VideoScript {
  const durations = sceneDurations(request.videoLength);
  let cursor = 0;
  const sceneDrafts: VideoScene[] = [
    {
      sceneNumber: 1,
      timestamp: "",
      durationSeconds: durations[0],
      purpose: "hook",
      visual: "A busy host sees the paper invite while their phone lights up with questions.",
      voiceover: "Planning an event should not feel this messy.",
      onScreenText: "Planning an event should not feel this messy.",
      captionOverlay: "Too many details. Too many texts.",
      chatBubbles: [],
    },
    {
      sceneNumber: 2,
      timestamp: "",
      durationSeconds: durations[1],
      purpose: "problem",
      visual: "Message bubbles stack around the host asking for RSVP, address, time, and registry.",
      voiceover: "Every guest asks for the same details again.",
      onScreenText: "Too many questions. Too many messages.",
      captionOverlay: "Where do we RSVP?",
      chatBubbles: ["What time is it?", "Can you send the registry?", "What's the address?"],
    },
    {
      sceneNumber: 3,
      timestamp: "",
      durationSeconds: durations[2],
      purpose: "reveal",
      visual: "The host opens Envitefy and snaps or uploads the invite.",
      voiceover: "Meet Envitefy.",
      onScreenText: "Meet Envitefy.",
      captionOverlay: "Snap or upload the invite.",
      chatBubbles: [],
    },
    {
      sceneNumber: 4,
      timestamp: "",
      durationSeconds: durations[3],
      purpose: "product-demo",
      visual:
        "The phone shows a polished live event page with RSVP, location, registry, and share.",
      voiceover: "Turn any invite into a live event page.",
      onScreenText: "A live event page in minutes.",
      captionOverlay: "RSVP. Location. Registry. Share.",
      chatBubbles: [],
    },
    {
      sceneNumber: 5,
      timestamp: "",
      durationSeconds: durations[4],
      purpose: "cta",
      visual: "Clean branded payoff with the host sharing one Envitefy link.",
      voiceover: brief.cta,
      onScreenText: brief.cta,
      captionOverlay: "Create your event page today.",
      chatBubbles: [],
    },
  ];
  const scenes = sceneDrafts.map((scene) => {
    const start = cursor;
    cursor += scene.durationSeconds;
    return { ...scene, timestamp: timestamp(start, cursor) };
  });

  return {
    totalSeconds: request.videoLength,
    logline: brief.adSummary,
    voiceoverScript: scenes.map((scene) => scene.voiceover).join(" "),
    scenes,
  };
}

function normalizeScene(value: unknown, index: number, fallback: VideoScene): VideoScene {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  const purpose = safeString(record.purpose);
  return {
    sceneNumber: index + 1,
    timestamp: compactText(safeString(record.timestamp) || fallback.timestamp, 24),
    durationSeconds: Number(record.durationSeconds) || fallback.durationSeconds,
    purpose:
      purpose === "hook" ||
      purpose === "problem" ||
      purpose === "reveal" ||
      purpose === "product-demo" ||
      purpose === "cta"
        ? purpose
        : fallback.purpose,
    visual: compactText(safeString(record.visual) || fallback.visual, 260),
    voiceover: compactText(safeString(record.voiceover) || fallback.voiceover, 160),
    onScreenText: compactText(safeString(record.onScreenText) || fallback.onScreenText, 90),
    captionOverlay: compactText(safeString(record.captionOverlay) || fallback.captionOverlay, 90),
    chatBubbles: Array.isArray(record.chatBubbles)
      ? record.chatBubbles.map(safeString).filter(Boolean).slice(0, 4)
      : fallback.chatBubbles,
  };
}

function normalizeScript(value: unknown, fallback: VideoScript): VideoScript | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const scenes = Array.isArray(record.scenes) ? record.scenes : [];
  if (scenes.length < 5) return null;
  const normalizedScenes = fallback.scenes.map((scene, index) =>
    normalizeScene(scenes[index], index, scene),
  ) as VideoScript["scenes"];
  return {
    totalSeconds: fallback.totalSeconds,
    logline: compactText(safeString(record.logline) || fallback.logline, 220),
    voiceoverScript: compactText(
      safeString(record.voiceoverScript) ||
        normalizedScenes.map((scene) => scene.voiceover).join(" "),
      800,
    ),
    scenes: normalizedScenes,
  };
}

export async function runScriptAgent(request: AdStudioRequest, brief: CampaignBrief) {
  const fallback = fallbackScript(request, brief);
  const prompt = `Create a fast ${request.videoLength}-second Envitefy promo script.

Campaign brief:
${JSON.stringify(brief, null, 2)}

Requirements:
- Five scenes only: hook, problem, reveal, product demo, CTA.
- Include voiceover, on-screen text, caption overlays, and chat bubbles when useful.
- Keep text short enough for mobile video.
- Do not ask the image model to generate readable flyer text or exact phone UI.`;

  return runJsonTextAgent({
    agentName: "script_agent",
    prompt,
    schema: VIDEO_SCRIPT_SCHEMA,
    fallback,
    normalize: (value) => normalizeScript(value, fallback),
  });
}
