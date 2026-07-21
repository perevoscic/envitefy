import type OpenAI from "openai";
import {
  ADMIN_EMAIL_GENERATION_GUIDE,
  type AdminEmailImageVisualRules,
} from "./email-generation-guide.ts";

export type AdminEmailImageQaResult = {
  pass: boolean;
  aiIshScore: number;
  reasons: string[];
};

/** Only fail hard surreal / collage AI looks — product photos with phones & paper should ship. */
export const ADMIN_EMAIL_IMAGE_QA_REJECT_SCORE = 0.75;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {}
  }
  return null;
}

const BRAND_LOGO_TERM_PATTERN =
  /\b(?:logo|logos|wordmark|watermark|brand\s*mark|brand\s*badge|envitefy\s+(?:logo|mark|badge|wordmark))\b/i;

/** True when the reason is saying logos/watermarks are absent, not present. */
function reasonNegatesBrandLogo(reason: string): boolean {
  return (
    /\b(?:no|not|without|none|absent|lacks?|lacking|free\s+of|devoid\s+of|zero)\b[\s\S]{0,48}\b(?:logo|logos|wordmark|watermark|brand\s*mark|brand\s*badge)\b/i.test(
      reason,
    ) ||
    /\b(?:logo|logos|wordmark|watermark|brand\s*mark|brand\s*badge)\b[\s\S]{0,48}\b(?:not\s+(?:visible|present|found|detected|shown)|absent|missing|unseen)\b/i.test(
      reason,
    )
  );
}

/**
 * Detects affirmative logo/watermark findings in QA reasons.
 * Negated phrases like "No visible logo or watermark" must not hard-fail.
 */
export function reasonsIndicateBrandLogo(reasons: string[]): boolean {
  return reasons.some((reason) => {
    if (!BRAND_LOGO_TERM_PATTERN.test(reason)) return false;
    if (reasonNegatesBrandLogo(reason)) return false;
    return true;
  });
}

export function normalizeAdminEmailImageQaResult(value: unknown): AdminEmailImageQaResult | null {
  if (!isRecord(value)) return null;
  let pass = value.pass === true;
  const aiIshScoreRaw = Number(value.aiIshScore);
  let aiIshScore = Number.isFinite(aiIshScoreRaw)
    ? Math.min(1, Math.max(0, aiIshScoreRaw))
    : pass
      ? 0.2
      : 0.9;
  const reasons = Array.isArray(value.reasons)
    ? value.reasons
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];
  const hasLogo =
    value.hasBrandLogoOverlay === true || reasonsIndicateBrandLogo(reasons);
  if (hasLogo) {
    pass = false;
    aiIshScore = Math.max(aiIshScore, 0.95);
    if (!reasonsIndicateBrandLogo(reasons)) {
      reasons.unshift("Brand logo or watermark overlay detected on the photo.");
    }
  }
  const result = { pass, aiIshScore, reasons };
  if (result.aiIshScore >= ADMIN_EMAIL_IMAGE_QA_REJECT_SCORE) {
    return { ...result, pass: false };
  }
  return result;
}

export function buildAdminEmailImageQaPrompt(rules: AdminEmailImageVisualRules): string {
  const acceptTraits =
    "acceptTraits" in rules && Array.isArray(rules.acceptTraits)
      ? rules.acceptTraits.join("; ")
      : "";
  return [
    "You are a pragmatic art director for Envitefy marketing emails.",
    "Goal: ship usable documentary product photos. Prefer pass when the scene looks like a real photograph.",
    "Only fail for obvious surreal AI concept art OR any logo/watermark overlays.",
    `Hard reject traits: ${rules.rejectTraits.join("; ")}.`,
    `Require: ${rules.requireTraits.join("; ")}.`,
    acceptTraits ? `Always allow: ${acceptTraits}.` : "",
    "Do NOT fail solely because a phone screen, printed invitation, greeting card, or flyer shows vague/document-like detail.",
    "Do NOT fail solely because party artwork looks generic or template-like.",
    "HARD FAIL if any brand logo, Envitefy wordmark, watermark, or corner badge appears on the image — set hasBrandLogoOverlay=true, pass=false, and aiIshScore >= 0.95.",
    "aiIshScore should stay low (under 0.5) for ordinary stock-photo style scenes with phones or paper props and no logos.",
    "Return JSON only with pass (boolean), aiIshScore (0-1), hasBrandLogoOverlay (boolean), and reasons (string array).",
    `Fail (pass=false) when hasBrandLogoOverlay is true, aiIshScore is ${ADMIN_EMAIL_IMAGE_QA_REJECT_SCORE} or higher, or a hard reject trait is clearly dominant.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Vision QA for admin email stills. Rejects collage/glow/hologram AI aesthetics only.
 */
export async function inspectAdminEmailImageProfessionalism(params: {
  client: OpenAI;
  imageBytes: Buffer;
  model?: string | null;
  mimeType?: string;
}): Promise<AdminEmailImageQaResult> {
  const rules = ADMIN_EMAIL_GENERATION_GUIDE.imageVisuals;
  const model =
    (typeof params.model === "string" && params.model.trim()) ||
    process.env.ADMIN_EMAIL_IMAGE_QA_MODEL ||
    "gpt-5.4-mini";
  const mimeType = params.mimeType || "image/png";
  const dataUrl = `data:${mimeType};base64,${params.imageBytes.toString("base64")}`;

  const completion = await params.client.chat.completions.create({
    model,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "admin_email_image_qa",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["pass", "aiIshScore", "hasBrandLogoOverlay", "reasons"],
          properties: {
            pass: { type: "boolean" },
            aiIshScore: { type: "number" },
            hasBrandLogoOverlay: { type: "boolean" },
            reasons: { type: "array", items: { type: "string" } },
          },
        },
      },
    } as any,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildAdminEmailImageQaPrompt(rules) },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = normalizeAdminEmailImageQaResult(extractJsonObject(raw));
  if (!parsed) {
    // Invalid QA response should not block email generation.
    return {
      pass: true,
      aiIshScore: 0.4,
      reasons: ["Image QA returned an invalid response; accepting image to keep email generation moving."],
    };
  }

  if (parsed.aiIshScore >= ADMIN_EMAIL_IMAGE_QA_REJECT_SCORE) {
    return { ...parsed, pass: false };
  }
  return parsed;
}
