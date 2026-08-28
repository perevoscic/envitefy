import OpenAI from "openai";
import { resolveEmailEmbedAssetUrl, uploadPublicBinaryAsset } from "../media-upload.ts";
import {
  ADMIN_EMAIL_GENERATION_GUIDE,
  bannedAdminEmailTextLinkPattern,
  buildAdminEmailGuidePromptPayload,
  buildAdminEmailSystemPromptFromGuide,
} from "./email-generation-guide.ts";
import {
  inspectAdminEmailImageProfessionalism,
  reasonsIndicateBrandLogo,
} from "./email-image-qa.ts";
import {
  ADMIN_EMAIL_PRODUCT_SCENARIOS,
  type AdminEmailScenarioId,
  resolveScenarioCtaUrl,
} from "./email-scenarios.ts";

type JsonRecord = Record<string, unknown>;

export type AdminEmailAudienceMode = "individual" | "broadcast";

export type AdminEmailGenerationRequest = {
  prompt: string;
  audienceMode: AdminEmailAudienceMode;
  currentImageAssets: AdminEmailImageAsset[];
  currentScenarioRows: AdminEmailScenarioRow[];
  currentSubject?: string | null;
  currentBodyHtml?: string | null;
};

export type AdminEmailImageRole = "demo" | "scenario" | "hero" | "feature" | "support";

export type AdminEmailImageAsset = {
  role: AdminEmailImageRole;
  url: string;
  altText: string;
  prompt: string;
  model: string;
  scenarioId?: AdminEmailScenarioId;
};

export type AdminEmailScenarioRow = {
  scenarioId: AdminEmailScenarioId;
  title: string;
  body: string;
  imageScene: string;
};

export type AdminEmailDraft = {
  subject: string;
  preheader: string;
  bodyHtml: string;
  buttonText: string;
  buttonUrl: string;
  notes: string;
  scenarioRows: AdminEmailScenarioRow[];
  imageAssets: AdminEmailImageAsset[];
};

type GenerateAdminEmailDraftDeps = {
  openAiApiKey?: string | null;
  openAiModel?: string | null;
  openAiImageModel?: string | null;
  createOpenAiClient?: (apiKey: string) => OpenAI;
  generateImage?: (params: { prompt: string; model: string }) => Promise<Buffer>;
  uploadImage?: (params: {
    bytes: Buffer;
    fileName: string;
    altText: string;
    prompt: string;
    model: string;
  }) => Promise<AdminEmailImageAsset>;
  inspectImage?: (params: { imageBytes: Buffer }) => Promise<{
    pass: boolean;
    aiIshScore: number;
    reasons: string[];
  }>;
};

const DEFAULT_ADMIN_EMAIL_GENERATOR_MODEL = "gpt-5.6-sol";
const DEFAULT_ADMIN_EMAIL_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_ENVITEFY_CTA_URL = ADMIN_EMAIL_GENERATION_GUIDE.ctaDefaults.buttonUrl;
const MAX_PROMPT_LENGTH = 5000;
const MAX_BODY_HTML_LENGTH = 50000;
const MAX_IMAGE_ASSETS = 8;
const MAX_IMAGE_QA_ATTEMPTS = 3;
const MAX_DRAFT_FIDELITY_ATTEMPTS = 3;
const BANNED_TEXT_LINK_PATTERN = bannedAdminEmailTextLinkPattern();
const ADMIN_EMAIL_LOG_PREFIX = "[admin-email]";
const ADMIN_EMAIL_SCENARIO_IDS = new Set<AdminEmailScenarioId>(
  ADMIN_EMAIL_PRODUCT_SCENARIOS.map((scenario) => scenario.id),
);

function logAdminEmail(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {},
): void {
  const payload = { event, ...details };
  if (level === "error") {
    console.error(ADMIN_EMAIL_LOG_PREFIX, payload);
    return;
  }
  if (level === "warn") {
    console.warn(ADMIN_EMAIL_LOG_PREFIX, payload);
    return;
  }
  console.log(ADMIN_EMAIL_LOG_PREFIX, payload);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseImageRole(value: unknown): AdminEmailImageRole {
  const role = cleanString(value, 40);
  if (role === "demo" || role === "scenario" || role === "feature" || role === "support") {
    return role;
  }
  return "hero";
}

function parseScenarioId(value: unknown): AdminEmailScenarioId | undefined {
  const id = cleanString(value, 40);
  if (ADMIN_EMAIL_SCENARIO_IDS.has(id as AdminEmailScenarioId)) {
    return id as AdminEmailScenarioId;
  }
  return undefined;
}

function cleanString(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMultilineString(value: unknown, maxLength = MAX_BODY_HTML_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function normalizeEnvitefyConciergeName(value: string): string {
  return value.replace(/(?<!Envitefy\s)\bConcierge\b/gi, "Envitefy Concierge");
}

function normalizeEnvitefyConciergeInHtml(html: string): string {
  return html.replace(/>([^<]*)</g, (_full, text: string) => {
    return `>${normalizeEnvitefyConciergeName(text)}<`;
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeEmailHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isGifAssetUrl(url: string): boolean {
  return /\.gif(?:$|[?#])/i.test(url.trim());
}

function sanitizeImageTags(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\s+src\s*=\s*(["'])(.*?)\1/i);
    const src = srcMatch?.[2]?.trim() || "";
    if (!isHttpUrl(src) || isGifAssetUrl(src)) return "";
    return tag;
  });
}

function parseCurrentImageAssets(value: unknown): AdminEmailImageAsset[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): AdminEmailImageAsset | null => {
      if (!isRecord(item)) return null;
      const url = cleanString(item.url, 1000);
      if (!isHttpUrl(url) || isGifAssetUrl(url)) return null;
      const role = parseImageRole(item.role);
      // Legacy GIF/demo assets are never reused.
      if (role === "demo") return null;
      const scenarioId = parseScenarioId(item.scenarioId);
      if (!scenarioId) return null;
      return {
        role: "scenario",
        url,
        altText: cleanString(item.altText, 200) || "Envitefy event planning preview",
        prompt: cleanString(item.prompt, 2000),
        model: cleanString(item.model, 120),
        scenarioId,
      };
    })
    .filter((item): item is AdminEmailImageAsset => Boolean(item))
    .slice(0, MAX_IMAGE_ASSETS);
}

export function hasCompleteScenarioStillAssets(
  assets: AdminEmailImageAsset[],
  scenarioIds: readonly AdminEmailScenarioId[] = ADMIN_EMAIL_PRODUCT_SCENARIOS.map(
    (scenario) => scenario.id,
  ),
): boolean {
  const byId = new Map(
    assets
      .filter((asset) => asset.scenarioId && !isGifAssetUrl(asset.url) && asset.role !== "demo")
      .map((asset) => [asset.scenarioId as AdminEmailScenarioId, asset]),
  );
  return scenarioIds.every((scenarioId) => byId.has(scenarioId));
}

export function parseAdminEmailGenerationRequest(
  value: unknown,
): { ok: true; value: AdminEmailGenerationRequest } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const prompt = cleanMultilineString(value.prompt, MAX_PROMPT_LENGTH);
  if (!prompt) {
    return { ok: false, error: "Prompt is required." };
  }

  const requestedAudience = cleanString(value.audienceMode, 40);
  const audienceMode: AdminEmailAudienceMode =
    requestedAudience === "broadcast" ? "broadcast" : "individual";

  return {
    ok: true,
    value: {
      prompt,
      audienceMode,
      currentImageAssets: parseCurrentImageAssets(value.currentImageAssets),
      currentScenarioRows: parseScenarioRows(value.currentScenarioRows),
      currentSubject: cleanString(value.currentSubject, 160) || null,
      currentBodyHtml: cleanMultilineString(value.currentBodyHtml, 8000) || null,
    },
  };
}

export function sanitizeGeneratedEmailHtml(value: string): string {
  let html = cleanMultilineString(value, MAX_BODY_HTML_LENGTH);
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) {
    html = bodyMatch[1].trim();
  }

  const cleaned = html
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?(?:html|head|body|meta|title|link)\b[^>]*>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[\s\S]*?>/gi, "")
    .replace(/<form\b[\s\S]*?<\/form>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "")
    .trim();

  return sanitizeImageTags(cleaned).trim();
}

function parseScenarioRows(value: unknown): AdminEmailScenarioRow[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<AdminEmailScenarioId>();
  const rows: AdminEmailScenarioRow[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const scenarioId = parseScenarioId(item.scenarioId);
    if (!scenarioId || seen.has(scenarioId)) continue;

    const title = normalizeEnvitefyConciergeName(cleanString(item.title, 120));
    const body = normalizeEnvitefyConciergeName(cleanString(item.body, 500));
    const imageScene = normalizeEnvitefyConciergeName(cleanString(item.imageScene, 1200));
    if (!title || !body || !imageScene) continue;

    seen.add(scenarioId);
    rows.push({ scenarioId, title, body, imageScene });
    if (rows.length >= ADMIN_EMAIL_PRODUCT_SCENARIOS.length) break;
  }
  return rows;
}

const TEACHER_AUDIENCE_PATTERN =
  /\b(?:teachers?|classrooms?|school\s+staff|educators?|class\s+part(?:y|ies)|school\s+events?)\b/i;
const EXPLICIT_TEACHER_BRIEF_PATTERN =
  /\b(?:teachers?|classrooms?|school\s+staff|educators?|room\s+parents?|class\s+part(?:y|ies)|school\s+events?)\b/i;
const PARENTS_ONLY_PATTERN = /\b(?:(?:only|just)\s+(?:for\s+)?parents?|parents?\s+only)\b/i;
const BARE_CONCIERGE_PATTERN = /(?<!Envitefy\s)\bConcierge\b/i;
const SNAP_EVENT_RESULT_PATTERN =
  /\b(?:live\s+(?:event\s+)?card|event\s+(?:card|page|record)|hosted\s+event\s+page)\b/i;
const SNAP_CALENDAR_PATTERN = /\bcalendar\b/i;
const SNAP_SHARE_PATTERN = /\b(?:share(?:able|d|s|ing)?|one\s+link)\b/i;
const SNAP_KEEP_PATTERN =
  /\b(?:reopen|never\s+lose|won'?t\s+(?:lose|get\s+lost)|easy\s+to\s+(?:find|access)|always\s+(?:available|handy)|accessible|stored|fridge|paper\s+clutter|old\s+(?:texts?|messages?|emails?)|screenshots?|digging|hunting)\b/i;
const CONCIERGE_INPUT_PATTERN = /\b(?:describe|plain\s+language|your\s+words|tell)\b/i;
const CONCIERGE_RESULT_PATTERN =
  /\b(?:polished\s+)?(?:invitation|live\s+(?:event\s+)?card|event\s+page|hosted\s+page)\b/i;
const CONCIERGE_TOOL_PATTERNS = [
  /\brsvp\b/i,
  /\bcalendar\b/i,
  /\b(?:share(?:able|d|s|ing)?|one\s+link)\b/i,
  /\b(?:registry|gift\s+links?)\b/i,
  /\b(?:directions?|maps?)\b/i,
  /\b(?:reminders?|updates?)\b/i,
  /\b(?:smart\s+)?sign-?ups?\b/i,
  /\bguest\s+tracking\b/i,
] as const;
const RSVP_RESPONSE_PATTERN = /\b(?:rsvp|respond|response|attendance|coming)\b/i;
const RSVP_HOST_VALUE_PATTERN =
  /\b(?:track|organize|host|pending|headcounts?|guest\s+counts?|who\s+(?:is|has)|still\s+needs?)\b/i;
const RSVP_DEPTH_PATTERN =
  /\b(?:households?|plus-ones?|adults?|kids?|children|allerg(?:y|ies)|dietary|meals?|notes?|messages?|questions?|guesses?|availability)\b/i;
const SIGNUP_USE_CASE_PATTERN =
  /\b(?:volunteers?|helpers?|potlucks?|food|snacks?|supplies|shifts?|slots?|items?|roles?)\b/i;
const SIGNUP_LIMIT_PATTERN = /\b(?:quantit(?:y|ies)|capacity|limits?|full|waitlists?)\b/i;
const SIGNUP_STATUS_PATTERN = /\b(?:claimed|filled|full|waitlisted|still\s+needed|available)\b/i;
const CREATE_INVITATION_PATTERN =
  /\b(?:create|make|build|draft|design)\s+(?!an?\s+email\b)(?:an?\s+|the\s+|my\s+|your\s+|their\s+|our\s+|new\s+|polished\s+|professional\s+|beautiful\s+|birthday\s+|wedding\s+|baby\s+shower\s+|bridal\s+shower\s+|gender\s+reveal\s+){0,4}(?:invites?|invitations?|event\s+pages?|live\s+cards?)\b/i;
const EXPLICIT_NON_CONCIERGE_CREATION_PATTERN =
  /\b(?:manual(?:ly)?|from\s+a\s+template|using\s+(?:a\s+)?template|in\s+Studio|without\s+Envitefy\s+Concierge)\b/i;

type ExplicitFeatureRequirement = {
  label: string;
  requestPattern: RegExp;
  outputPattern: RegExp;
};

const EXPLICIT_FEATURE_REQUIREMENTS: readonly ExplicitFeatureRequirement[] = [
  {
    label: "RSVP or attendance",
    requestPattern:
      /\b(?:rsvp|attendance|guest\s+(?:repl(?:y|ies)|responses?)|headcounts?|plus-ones?)\b/i,
    outputPattern:
      /\b(?:rsvp|attendance|guest\s+(?:repl(?:y|ies)|responses?)|headcounts?|plus-ones?|who\s+is\s+coming)\b/i,
  },
  {
    label: "smart sign-ups",
    requestPattern:
      /\b(?:(?:smart\s+)?sign-?ups?|volunteer\s+(?:slots?|roles?|forms?)|potluck\s+(?:items?|forms?))\b/i,
    outputPattern:
      /\b(?:(?:smart\s+)?sign-?ups?|volunteers?|potlucks?|supplies|shifts?|slots?|waitlists?)\b/i,
  },
  {
    label: "calendar saves",
    requestPattern: /\b(?:calendar|save\s+the\s+date)\b/i,
    outputPattern: /\b(?:calendar|save\s+the\s+date)\b/i,
  },
  {
    label: "maps or directions",
    requestPattern: /\b(?:maps?|directions?|venue\s+navigation)\b/i,
    outputPattern: /\b(?:maps?|directions?|venue\s+navigation)\b/i,
  },
  {
    label: "registry or gift links",
    requestPattern: /\b(?:registr(?:y|ies)|gift\s+links?|wishlists?|honeymoon\s+funds?)\b/i,
    outputPattern: /\b(?:registr(?:y|ies)|gift\s+links?|wishlists?|fund\s+links?)\b/i,
  },
] as const;

const EXPLICIT_EVENT_TYPE_REQUIREMENTS: readonly ExplicitFeatureRequirement[] = [
  { label: "weddings", requestPattern: /\bweddings?\b/i, outputPattern: /\bweddings?\b/i },
  {
    label: "birthdays",
    requestPattern: /\bbirthdays?(?:\s+part(?:y|ies))?\b/i,
    outputPattern: /\bbirthdays?(?:\s+part(?:y|ies))?\b/i,
  },
  {
    label: "baby showers",
    requestPattern: /\bbaby\s+showers?\b/i,
    outputPattern: /\bbaby\s+showers?\b/i,
  },
  {
    label: "bridal showers",
    requestPattern: /\bbridal\s+showers?\b/i,
    outputPattern: /\bbridal\s+showers?\b/i,
  },
  {
    label: "gender reveals",
    requestPattern: /\bgender\s+reveals?\b/i,
    outputPattern: /\bgender\s+reveals?\b/i,
  },
  {
    label: "gymnastics",
    requestPattern: /\b(?:gymnastics|gym\s+meets?)\b/i,
    outputPattern: /\b(?:gymnastics|gym\s+meets?)\b/i,
  },
  {
    label: "football or sports",
    requestPattern: /\b(?:football|sports?|game\s+day)\b/i,
    outputPattern: /\b(?:football|sports?|game\s+day|team\s+schedules?)\b/i,
  },
] as const;

function promptPositivelyRequests(prompt: string, pattern: RegExp): boolean {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);
  for (const match of prompt.matchAll(globalPattern)) {
    const index = match.index ?? 0;
    const prefix = prompt.slice(Math.max(0, index - 40), index);
    if (
      /\b(?:do\s+not|don'?t|without|exclud(?:e|ing)|omit|avoid|no|not\s+for)\b[\s\S]{0,28}$/i.test(
        prefix,
      )
    ) {
      continue;
    }
    return true;
  }
  return false;
}

function matchCase(value: string, replacement: string): string {
  return /^[A-Z]/.test(value)
    ? `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`
    : replacement;
}

function sanitizeParentsOnlyText(value: string): string {
  return value
    .replace(/\bclass[-\s]+part(?:y|ies)\b/gi, (match) =>
      matchCase(match, /ies$/i.test(match) ? "family celebrations" : "family celebration"),
    )
    .replace(/\bschool[-\s]+events?\b/gi, (match) =>
      matchCase(match, /s$/i.test(match) ? "family events" : "family event"),
    )
    .replace(/\bclassrooms?\b/gi, (match) =>
      matchCase(match, /s$/i.test(match) ? "family settings" : "family setting"),
    )
    .replace(/\bschool[-\s]+staff\b/gi, (match) => matchCase(match, "parents"))
    .replace(/\broom\s+parents?\b/gi, (match) => matchCase(match, "parents"))
    .replace(/\bteachers?\b/gi, (match) =>
      matchCase(match, /s$/i.test(match) ? "parents" : "parent"),
    )
    .replace(/\beducators?\b/gi, (match) =>
      matchCase(match, /s$/i.test(match) ? "parents" : "parent"),
    )
    .replace(/\bparents?\s+(?:and|&)\s+parents?\b/gi, "parents")
    .replace(/\bparents?,\s*parents?\b/gi, "parents");
}

/** Remove deterministic audience conflicts before validation or image generation. */
export function applyAdminEmailPromptConstraints(
  prompt: string,
  draft: AdminEmailDraft,
  currentScenarioRows: AdminEmailScenarioRow[] = [],
): AdminEmailDraft {
  const parentsOnly = PARENTS_ONLY_PATTERN.test(prompt);
  const teacherRequested =
    !parentsOnly &&
    (promptPositivelyRequests(prompt, EXPLICIT_TEACHER_BRIEF_PATTERN) ||
      currentScenarioRows.some((row) => row.scenarioId === "teachers"));
  const scenarioRows = teacherRequested
    ? draft.scenarioRows
    : draft.scenarioRows.filter((row) => row.scenarioId !== "teachers");

  if (!parentsOnly) return { ...draft, scenarioRows };

  return {
    ...draft,
    subject: sanitizeParentsOnlyText(draft.subject),
    preheader: sanitizeParentsOnlyText(draft.preheader),
    bodyHtml: sanitizeParentsOnlyText(draft.bodyHtml),
    buttonText: sanitizeParentsOnlyText(draft.buttonText),
    notes: sanitizeParentsOnlyText(draft.notes),
    scenarioRows: scenarioRows.map((row) => ({
      ...row,
      title: sanitizeParentsOnlyText(row.title),
      body: sanitizeParentsOnlyText(row.body),
      imageScene: sanitizeParentsOnlyText(row.imageScene),
    })),
  };
}

type PromptEventMatch = { label: string; index: number };

const PROMPT_EVENT_PATTERNS = [
  { label: "baby shower", pattern: /\bbaby\s+showers?\b/gi },
  { label: "bridal shower", pattern: /\bbridal\s+showers?\b/gi },
  { label: "gender reveal", pattern: /\bgender\s+reveals?\b/gi },
  { label: "gymnastics meet", pattern: /\b(?:gymnastics|gym\s+meets?)\b/gi },
  { label: "football", pattern: /\bfootball\b/gi },
  { label: "sports event", pattern: /\b(?:sports?|game\s+day)\b/gi },
  { label: "field trip", pattern: /\bfield\s+(?:trips?|days?)\b/gi },
  { label: "open house", pattern: /\bopen\s+houses?\b/gi },
  { label: "wedding", pattern: /\bweddings?\b/gi },
  { label: "birthday", pattern: /\bbirthdays?(?:\s+part(?:y|ies))?\b/gi },
] as const;

function promptEventMatches(prompt: string): PromptEventMatch[] {
  const matches: PromptEventMatch[] = [];
  for (const definition of PROMPT_EVENT_PATTERNS) {
    for (const match of prompt.matchAll(definition.pattern)) {
      matches.push({ label: definition.label, index: match.index ?? 0 });
    }
  }
  return matches.sort((left, right) => left.index - right.index);
}

function scenarioActionPattern(scenarioId: AdminEmailScenarioId): RegExp {
  if (scenarioId === "snap") return /\b(?:snap|scan|photograph|upload)\b/gi;
  if (scenarioId === "concierge") {
    return /\b(?:create|make|build|draft|design|Envitefy\s+Concierge)\b/gi;
  }
  if (scenarioId === "rsvp") {
    return /\b(?:rsvp|attendance|headcounts?|guest\s+(?:repl(?:y|ies)|responses?))\b/gi;
  }
  if (scenarioId === "signups") {
    return /\b(?:(?:smart\s+)?sign-?ups?|volunteers?|potlucks?|shifts?|slots?)\b/gi;
  }
  return /\b(?:event|invitation|page|share)\b/gi;
}

function eventLabelForScenario(prompt: string, scenarioId: AdminEmailScenarioId): string {
  const events = promptEventMatches(prompt);
  if (events.length === 0) return "";
  const actions = Array.from(prompt.matchAll(scenarioActionPattern(scenarioId))).map(
    (match) => match.index ?? 0,
  );
  if (actions.length === 0) return events[0]?.label || "";

  let best = events[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const actionIndex of actions) {
    for (const event of events) {
      const distance = event.index - actionIndex;
      const score = distance >= 0 && distance <= 90 ? distance : 1000 + Math.abs(distance);
      if (score < bestScore) {
        best = event;
        bestScore = score;
      }
    }
  }
  return best?.label || "";
}

function requiredScenarioIdsForPrompt(
  prompt: string,
  currentScenarioRows: AdminEmailScenarioRow[] = [],
): AdminEmailScenarioId[] {
  const required: AdminEmailScenarioId[] = [];
  const add = (scenarioId: AdminEmailScenarioId) => {
    if (!required.includes(scenarioId) && required.length < 4) required.push(scenarioId);
  };

  const teacherRequested =
    !PARENTS_ONLY_PATTERN.test(prompt) &&
    promptPositivelyRequests(prompt, EXPLICIT_TEACHER_BRIEF_PATTERN);
  if (teacherRequested) add("teachers");
  if (promptPositivelyRequests(prompt, /\b(?:snap|scan|photograph|upload)\b/i)) add("snap");
  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:Envitefy\s+Concierge|ask\s+(?:Envitefy\s+)?Concierge|from\s+(?:my|your|their|the\s+host'?s)\s+words)\b/i,
    ) ||
    (promptPositivelyRequests(prompt, CREATE_INVITATION_PATTERN) &&
      !EXPLICIT_NON_CONCIERGE_CREATION_PATTERN.test(prompt))
  ) {
    add("concierge");
  }
  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:rsvp|attendance|guest\s+(?:repl(?:y|ies)|responses?)|headcounts?|plus-ones?)\b/i,
    )
  ) {
    add("rsvp");
  }
  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:(?:smart\s+)?sign-?ups?|volunteer\s+(?:slots?|roles?|forms?)|potluck\s+(?:items?|forms?))\b/i,
    )
  ) {
    add("signups");
  }
  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:(?:share|sharing|send)\s+(?:the\s+|one\s+|an?\s+)?(?:event\s+)?link|one\s+(?:event\s+)?link)\b/i,
    )
  ) {
    add("share");
  }
  if (required.length === 0 && /\bweddings?\b/i.test(prompt)) add("weddings");
  if (required.length === 0 && /\b(?:gymnastics|football|sports?|game\s+day)\b/i.test(prompt)) {
    add("sports");
  }
  if (
    required.length === 0 &&
    /\b(?:live\s+(?:event\s+)?(?:page|card)|hosted\s+page|calendar|maps?|directions?|registr(?:y|ies))\b/i.test(
      prompt,
    )
  ) {
    add("live-page");
  }
  if (required.length === 0 && currentScenarioRows.length > 0) {
    for (const row of currentScenarioRows) add(row.scenarioId);
  }
  if (required.length === 0) add("live-page");
  return required;
}

function buildFallbackScenarioRow(
  scenarioId: AdminEmailScenarioId,
  prompt: string,
): AdminEmailScenarioRow {
  const eventLabel = eventLabelForScenario(prompt, scenarioId);
  const eventPrefix = eventLabel ? `${eventLabel} ` : "";
  const actor = PARENTS_ONLY_PATTERN.test(prompt) ? "parent" : "host";

  if (scenarioId === "snap") {
    return {
      scenarioId,
      title: `Turn the ${eventPrefix}invitation into a live event card`,
      body: `Photograph or upload the ${eventPrefix}invitation and Envitefy creates a saved live event card with the important details organized. Add it to a calendar, share one easy link, and reopen it anytime instead of losing the paper invite or adding more fridge clutter.`,
      imageScene: `Professional documentary photo of a ${actor} photographing or uploading a printed ${eventPrefix}invitation in a bright home, with natural light and realistic hands.`,
    };
  }
  if (scenarioId === "concierge") {
    return {
      scenarioId,
      title: `Create a polished ${eventPrefix}invitation with Envitefy Concierge`,
      body: `Describe the ${eventPrefix}event in your own words and Envitefy Concierge creates a polished invitation and live event page for review. Add relevant tools such as RSVP and calendar details, then share one guest-ready link.`,
      imageScene: `Professional lifestyle photo of a ${actor} calmly creating a ${eventPrefix}invitation on a phone at home, with natural light and realistic materials.`,
    };
  }
  if (scenarioId === "rsvp") {
    return {
      scenarioId,
      title: `Keep ${eventPrefix}RSVPs with the invitation`,
      body: "Guests respond from the live event page while the host tracks attendance, household headcounts, plus-ones, notes, and pending replies in one organized place.",
      imageScene: `Professional documentary photo of a ${actor} reviewing ${eventPrefix}guest responses on a laptop or phone at a tidy planning table.`,
    };
  }
  if (scenarioId === "signups") {
    return {
      scenarioId,
      title: `Coordinate ${eventPrefix}sign-ups without spreadsheet cleanup`,
      body: "Create volunteer, food, supply, or shift slots with quantities, capacity, and automatic waitlists, then see what is claimed, full, waitlisted, or still needed from one live form.",
      imageScene: `Professional documentary photo of a ${actor} reviewing ${eventPrefix}volunteer or supply sign-ups on a laptop in a realistic community setting.`,
    };
  }

  const scenario = ADMIN_EMAIL_PRODUCT_SCENARIOS.find((item) => item.id === scenarioId);
  return {
    scenarioId,
    title:
      eventLabel && scenario
        ? `${scenario.title} for your ${eventLabel}`
        : scenario?.title || "One live event home",
    body:
      scenario?.body ||
      "Create a polished event page with RSVP, calendar, directions, registry, sign-up, sharing, and update tools when they fit the event.",
    imageScene:
      scenario?.stillScene ||
      `Professional lifestyle photo of a ${actor} using a phone to organize an event.`,
  };
}

function buildFallbackDraftSeed(prompt: string): AdminEmailDraft {
  const eventLabel = promptEventMatches(prompt)[0]?.label || "event";
  const teacherRequested =
    !PARENTS_ONLY_PATTERN.test(prompt) &&
    promptPositivelyRequests(prompt, EXPLICIT_TEACHER_BRIEF_PATTERN);
  const subject = teacherRequested
    ? "Make class events easier with Envitefy"
    : `Make your next ${eventLabel} easier with Envitefy`;
  const headline = teacherRequested
    ? "One simpler way to organize the next class event"
    : `Keep every ${eventLabel} detail useful and easy to share`;
  const intro = teacherRequested
    ? "Bring the flyer, helpers, and family-ready details together with the Envitefy tools that fit your class event."
    : "Turn the important details into one organized experience that is easy to use, share, and revisit.";

  return {
    subject,
    preheader: "Keep event details and guest actions together in one useful place.",
    bodyHtml: `<p>{{greeting}}</p><h1>${headline}</h1><p>${intro}</p>`,
    buttonText: "",
    buttonUrl: "",
    notes: "Deterministic recovery draft built from the campaign brief.",
    scenarioRows: [],
    imageAssets: [],
  };
}

/** Last-resort recovery so internal prompt-fidelity checks never become the user's result. */
export function recoverAdminEmailDraftForPrompt(
  prompt: string,
  draft: AdminEmailDraft | null,
  currentScenarioRows: AdminEmailScenarioRow[] = [],
): AdminEmailDraft {
  const constrained = applyAdminEmailPromptConstraints(
    prompt,
    draft || buildFallbackDraftSeed(prompt),
    currentScenarioRows,
  );
  const requiredIds = requiredScenarioIdsForPrompt(prompt, currentScenarioRows);
  const scenarioRows = requiredIds.map((scenarioId) =>
    buildFallbackScenarioRow(scenarioId, prompt),
  );

  return applyAdminEmailPromptConstraints(
    prompt,
    {
      ...constrained,
      buttonText: "",
      buttonUrl: "",
      scenarioRows,
    },
    currentScenarioRows,
  );
}

/**
 * Defense-in-depth for explicit audience constraints. The model gets focused
 * correction attempts before image generation, so an off-brief draft never
 * spends time creating irrelevant scenario art.
 */
export function validateAdminEmailPromptFidelity(
  prompt: string,
  draft: AdminEmailDraft,
  currentScenarioRows: AdminEmailScenarioRow[] = [],
): string[] {
  const violations: string[] = [];
  if (!draft.scenarioRows.length) {
    violations.push("Select at least one product scenario that is relevant to the campaign brief.");
  }

  const generatedCopy = [
    draft.subject,
    draft.preheader,
    draft.bodyHtml,
    draft.buttonText,
    draft.notes,
    ...draft.scenarioRows.flatMap((row) => [row.title, row.body, row.imageScene]),
  ].join(" ");
  const customerFacingCopy = [
    draft.subject,
    draft.preheader,
    draft.bodyHtml,
    draft.buttonText,
    ...draft.scenarioRows.flatMap((row) => [row.title, row.body]),
  ].join(" ");
  if (BARE_CONCIERGE_PATTERN.test(generatedCopy)) {
    violations.push(
      "Replace every standalone “Concierge” reference with the full product name “Envitefy Concierge.”",
    );
  }

  for (const row of draft.scenarioRows) {
    const rowCopy = `${row.title} ${row.body}`;
    if (row.scenarioId === "snap") {
      const missing: string[] = [];
      if (!SNAP_EVENT_RESULT_PATTERN.test(rowCopy)) missing.push("saved event/live card result");
      if (!SNAP_CALENDAR_PATTERN.test(rowCopy)) missing.push("calendar action");
      if (!SNAP_SHARE_PATTERN.test(rowCopy)) missing.push("easy sharing");
      if (!SNAP_KEEP_PATTERN.test(rowCopy)) {
        missing.push("easy future access or the paper/message clutter pain it removes");
      }
      if (missing.length > 0) {
        violations.push(
          `Expand the Snap scenario beyond photographing or extracting details. It is missing: ${missing.join(
            ", ",
          )}.`,
        );
      }
    }

    if (row.scenarioId === "concierge") {
      const toolCount = CONCIERGE_TOOL_PATTERNS.filter((pattern) => pattern.test(rowCopy)).length;
      const missing: string[] = [];
      if (!CONCIERGE_INPUT_PATTERN.test(rowCopy)) missing.push("creation from the host's words");
      if (!CONCIERGE_RESULT_PATTERN.test(rowCopy)) {
        missing.push("polished invitation/live event page result");
      }
      if (toolCount < 2) missing.push("at least two relevant guest or host tools");
      if (missing.length > 0) {
        violations.push(
          `Expand the Envitefy Concierge scenario beyond generic planning help. It is missing: ${missing.join(
            ", ",
          )}.`,
        );
      }
    }

    if (row.scenarioId === "rsvp") {
      const missing: string[] = [];
      if (!RSVP_RESPONSE_PATTERN.test(rowCopy)) missing.push("a guest response action");
      if (!RSVP_HOST_VALUE_PATTERN.test(rowCopy)) missing.push("the host tracking outcome");
      if (!RSVP_DEPTH_PATTERN.test(rowCopy)) {
        missing.push("relevant response depth such as headcounts, plus-ones, or guest notes");
      }
      if (missing.length > 0) {
        violations.push(
          `Expand the RSVP scenario beyond a button. It is missing: ${missing.join(", ")}.`,
        );
      }
    }

    if (row.scenarioId === "signups") {
      const missing: string[] = [];
      if (!SIGNUP_USE_CASE_PATTERN.test(rowCopy)) missing.push("a concrete signup use case");
      if (!SIGNUP_LIMIT_PATTERN.test(rowCopy)) missing.push("quantities, capacity, or waitlists");
      if (!SIGNUP_STATUS_PATTERN.test(rowCopy)) {
        missing.push("visibility into what is claimed, full, waitlisted, or still needed");
      }
      if (missing.length > 0) {
        violations.push(
          `Expand the smart sign-up scenario beyond a generic form. It is missing: ${missing.join(
            ", ",
          )}.`,
        );
      }
    }
  }

  for (const requirement of EXPLICIT_FEATURE_REQUIREMENTS) {
    if (
      promptPositivelyRequests(prompt, requirement.requestPattern) &&
      !requirement.outputPattern.test(customerFacingCopy)
    ) {
      violations.push(
        `The campaign brief explicitly requests ${requirement.label}; include that capability and its customer benefit in the email.`,
      );
    }
  }

  for (const requirement of EXPLICIT_EVENT_TYPE_REQUIREMENTS) {
    if (
      promptPositivelyRequests(prompt, requirement.requestPattern) &&
      !requirement.outputPattern.test(customerFacingCopy)
    ) {
      violations.push(
        `The campaign brief explicitly names ${requirement.label}; keep that event type visible in the customer-facing email copy and selected scenarios.`,
      );
    }
  }

  if (
    promptPositivelyRequests(prompt, /\b(?:snap|scan|photograph|upload)\b/i) &&
    !draft.scenarioRows.some((row) => row.scenarioId === "snap")
  ) {
    violations.push(
      "The campaign brief explicitly requests Envitefy Snap; include a Snap scenario.",
    );
  }

  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:rsvp|attendance|guest\s+(?:repl(?:y|ies)|responses?)|headcounts?|plus-ones?)\b/i,
    ) &&
    !draft.scenarioRows.some((row) => row.scenarioId === "rsvp")
  ) {
    violations.push("The campaign brief explicitly requests RSVP; include an RSVP scenario.");
  }

  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:Envitefy\s+Concierge|ask\s+(?:Envitefy\s+)?Concierge|from\s+(?:my|your|their|the\s+host'?s)\s+words)\b/i,
    ) &&
    !draft.scenarioRows.some((row) => row.scenarioId === "concierge")
  ) {
    violations.push(
      "The campaign brief explicitly requests Envitefy Concierge; include an Envitefy Concierge scenario.",
    );
  }

  if (
    promptPositivelyRequests(prompt, CREATE_INVITATION_PATTERN) &&
    !EXPLICIT_NON_CONCIERGE_CREATION_PATTERN.test(prompt) &&
    !draft.scenarioRows.some((row) => row.scenarioId === "concierge")
  ) {
    violations.push(
      "The campaign brief asks to create an invitation; include an Envitefy Concierge creation scenario unless the client explicitly requests manual or template creation.",
    );
  }

  if (
    promptPositivelyRequests(
      prompt,
      /\b(?:(?:smart\s+)?sign-?ups?|volunteer\s+(?:slots?|roles?|forms?)|potluck\s+(?:items?|forms?))\b/i,
    ) &&
    !draft.scenarioRows.some((row) => row.scenarioId === "signups")
  ) {
    violations.push(
      "The campaign brief explicitly requests smart sign-ups; include a smart sign-up scenario.",
    );
  }

  const parentsOnly = PARENTS_ONLY_PATTERN.test(prompt);
  const teacherRequested =
    promptPositivelyRequests(prompt, EXPLICIT_TEACHER_BRIEF_PATTERN) ||
    (!parentsOnly && currentScenarioRows.some((row) => row.scenarioId === "teachers"));
  const selectedTeacherRow = draft.scenarioRows.some((row) => row.scenarioId === "teachers");
  if (selectedTeacherRow && !teacherRequested) {
    violations.push(
      "Remove the teachers scenario because the campaign brief did not request teachers, classrooms, school staff, or class events.",
    );
  }

  if (parentsOnly) {
    const audienceText = [
      draft.subject,
      draft.preheader,
      draft.bodyHtml,
      ...draft.scenarioRows.flatMap((row) => [row.title, row.body, row.imageScene]),
    ].join(" ");
    if (TEACHER_AUDIENCE_PATTERN.test(audienceText)) {
      violations.push(
        "The brief says parents only; remove every teacher, classroom, school-staff, class-party, and school-event reference from copy and image scenes.",
      );
    }
  }

  return violations;
}

export function normalizeAdminEmailDraft(value: unknown): AdminEmailDraft | null {
  if (!isRecord(value)) return null;

  const subject = normalizeEnvitefyConciergeName(cleanString(value.subject, 140));
  const preheader = normalizeEnvitefyConciergeName(cleanString(value.preheader, 180));
  const bodyHtml = normalizeEnvitefyConciergeInHtml(
    sanitizeGeneratedEmailHtml(cleanMultilineString(value.bodyHtml)),
  );
  const buttonText = normalizeEnvitefyConciergeName(cleanString(value.buttonText, 60));
  const rawButtonUrl = cleanString(value.buttonUrl, 500);
  const notes = normalizeEnvitefyConciergeName(cleanString(value.notes, 500));
  const scenarioRows = parseScenarioRows(value.scenarioRows);

  if (!subject || !bodyHtml) return null;

  return {
    subject,
    preheader,
    bodyHtml,
    buttonText,
    buttonUrl: isHttpUrl(rawButtonUrl) ? rawButtonUrl : "",
    notes,
    scenarioRows,
    imageAssets: [],
  };
}

function resolveAdminEmailGeneratorModel(override?: string | null): string {
  return (
    cleanString(override, 120) ||
    cleanString(process.env.ADMIN_EMAIL_GENERATOR_MODEL, 120) ||
    DEFAULT_ADMIN_EMAIL_GENERATOR_MODEL
  );
}

function resolveAdminEmailImageModel(override?: string | null): string {
  return (
    cleanString(override, 120) ||
    cleanString(process.env.ADMIN_EMAIL_IMAGE_MODEL, 120) ||
    cleanString(process.env.STUDIO_OPENAI_IMAGE_MODEL, 120) ||
    DEFAULT_ADMIN_EMAIL_IMAGE_MODEL
  );
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

function buildSystemPrompt(audienceMode: AdminEmailAudienceMode): string {
  return buildAdminEmailSystemPromptFromGuide(audienceMode);
}

function buildUserPrompt(
  input: AdminEmailGenerationRequest,
  currentImageAssetsCount: number,
  correctionViolations: string[] = [],
): string {
  const constrainedCurrentDraft = applyAdminEmailPromptConstraints(
    input.prompt,
    {
      subject: input.currentSubject || "",
      preheader: "",
      bodyHtml: input.currentBodyHtml || "",
      buttonText: "",
      buttonUrl: "",
      notes: "",
      scenarioRows: input.currentScenarioRows,
      imageAssets: [],
    },
    input.currentScenarioRows,
  );
  return JSON.stringify({
    mode: input.currentBodyHtml ? "revise_existing_draft" : "create_new_draft",
    prompt: input.prompt,
    audienceMode: input.audienceMode,
    ...buildAdminEmailGuidePromptPayload({
      audienceMode: input.audienceMode,
      generatedImageAssetsCount: currentImageAssetsCount,
    }),
    correction:
      correctionViolations.length > 0
        ? {
            required: true,
            violations: correctionViolations,
            instruction:
              "Regenerate the entire draft and fix every violation. Do not defend or repeat the prior off-brief choice.",
          }
        : { required: false, violations: [], instruction: "" },
    currentDraft: {
      subject: constrainedCurrentDraft.subject,
      bodyHtml: constrainedCurrentDraft.bodyHtml,
      scenarioRows: constrainedCurrentDraft.scenarioRows,
    },
  });
}

function slugForPrompt(value: string): string {
  return (
    cleanString(value, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "email-campaign"
  );
}

function buildStillImagePrompt(campaignPrompt: string, scene: string): string {
  const visuals = ADMIN_EMAIL_GENERATION_GUIDE.imageVisuals;
  return [
    "Create one premium documentary stock photograph for an email campaign.",
    "Campaign prompt:",
    campaignPrompt,
    "Scene direction:",
    scene,
    visuals.style,
    ...visuals.generationPromptSuffix,
    "Absolutely no logos or watermarks in the photograph.",
  ].join(" ");
}

async function generateOpenAiImageBytes(params: {
  client: OpenAI;
  prompt: string;
  model: string;
}): Promise<Buffer> {
  const response = await params.client.images.generate({
    model: params.model,
    prompt: params.prompt,
    size: "1536x1024",
    quality: "high",
    background: "opaque",
    output_format: "png",
    moderation: "auto",
    n: 1,
  });

  const imageData = response.data?.[0]?.b64_json || "";
  if (!imageData) throw new Error("Image generator returned no image data.");
  return Buffer.from(imageData, "base64");
}

async function uploadStillImageAsset(params: {
  bytes: Buffer;
  fileName: string;
  altText: string;
  prompt: string;
  model: string;
  role: AdminEmailImageRole;
  scenarioId?: AdminEmailScenarioId;
  uploadImage?: GenerateAdminEmailDraftDeps["uploadImage"];
}): Promise<AdminEmailImageAsset> {
  if (params.uploadImage) {
    const uploaded = await params.uploadImage({
      bytes: params.bytes,
      fileName: params.fileName,
      altText: params.altText,
      prompt: params.prompt,
      model: params.model,
    });
    return {
      ...uploaded,
      role: params.role,
      altText: uploaded.altText || params.altText,
      ...(params.scenarioId ? { scenarioId: params.scenarioId } : {}),
    };
  }

  const pathname = `event-media/admin-email-${Date.now()}-${slugForPrompt(params.fileName)}/header/${slugForPrompt(params.fileName)}.png`;
  const uploaded = await uploadPublicBinaryAsset({
    bytes: params.bytes,
    pathname,
    contentType: "image/png",
  });
  const url = resolveEmailEmbedAssetUrl({
    url: uploaded.url,
    rawBlobUrl: uploaded.rawBlobUrl,
    access: uploaded.access,
  });
  if (!url) throw new Error("Generated image upload did not return a public URL.");

  return {
    role: params.role,
    url,
    altText: params.altText,
    prompt: params.prompt,
    model: params.model,
    ...(params.scenarioId ? { scenarioId: params.scenarioId } : {}),
  };
}

async function generateFreshImageBytes(params: {
  prompt: string;
  model: string;
  client: OpenAI;
  generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
}): Promise<Buffer> {
  if (params.generateImage) {
    return params.generateImage({ prompt: params.prompt, model: params.model });
  }
  return generateOpenAiImageBytes({
    client: params.client,
    prompt: params.prompt,
    model: params.model,
  });
}

function summarizeQaFailureReasons(reasons: string[]): string {
  const cleaned = reasons
    .map((reason) => cleanString(reason, 160))
    .filter(Boolean)
    .slice(0, 3);
  return cleaned.length ? cleaned.join("; ") : "unspecified visual QA failure";
}

/**
 * Builds corrective image-prompt text from the prior QA reject so retries
 * fix the specific failure (logos vs surreal AI look) instead of repeating
 * the same generic hint.
 */
export function buildStillImageRetryHint(params: {
  attempt: number;
  previousReasons: string[];
  logoRejected: boolean;
}): string {
  if (params.attempt <= 1) return "";

  const feedback = summarizeQaFailureReasons(params.previousReasons);
  const generationFailed = params.previousReasons.some((reason) =>
    /image generation error|image QA error/i.test(reason),
  );
  const parts = [
    generationFailed
      ? ` Retry ${params.attempt - 1}: previous attempt failed (${feedback}).`
      : ` Retry ${params.attempt - 1}: previous image failed visual QA (${feedback}).`,
  ];

  if (params.logoRejected) {
    parts.push(
      " CRITICAL FIX: remove every logo, watermark, wordmark, brand badge, corner stamp, app icon, sticker, and readable brand name from the entire frame.",
      " Phone screens and printed invites must stay blank, heavily blurred, or generic non-branded paper only — never Envitefy or any other brand mark.",
      " Do not add UI chrome, app store badges, or text overlays of any kind.",
    );
    if (params.attempt >= MAX_IMAGE_QA_ATTEMPTS) {
      parts.push(
        " Final attempt: plain unbranded props only. Prefer a soft-focus blank paper invite and a blank phone lock screen with zero text, icons, or marks.",
      );
    }
  } else if (generationFailed) {
    parts.push(
      " Simplify the scene: one clear subject, natural indoor light, ordinary lifestyle photography, no complex props or text.",
      " Keep phones and paper invites plain and unbranded.",
    );
    if (params.attempt >= MAX_IMAGE_QA_ATTEMPTS) {
      parts.push(
        " Final attempt: minimal composition only — parent hands, blank paper, blank phone screen, soft background.",
      );
    }
  } else {
    parts.push(
      " Remake as a real documentary stock photograph: natural window light, authentic skin texture, shallow depth of field.",
      " No surreal overlays, holograms, glowing UI bubbles, collage panels, neon lines, or floating icons.",
      " Phones and printed invites are fine when they look physical and unbranded.",
    );
    if (params.attempt >= MAX_IMAGE_QA_ATTEMPTS) {
      parts.push(
        " Final attempt: simpler single-subject framing, softer background bokeh, photoreal lifestyle only — no concept-art styling.",
      );
    }
  }

  return parts.join(" ");
}

async function generateQaApprovedStillBytes(params: {
  prompt: string;
  model: string;
  scenarioId: AdminEmailScenarioId;
  client: OpenAI;
  generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
  inspectImage?: GenerateAdminEmailDraftDeps["inspectImage"];
}): Promise<Buffer> {
  let bestBytes: Buffer | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let previousReasons: string[] = [];
  let previousLogoRejected = false;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= MAX_IMAGE_QA_ATTEMPTS; attempt += 1) {
    const retryHint = buildStillImageRetryHint({
      attempt,
      previousReasons,
      logoRejected: previousLogoRejected,
    });
    const attemptStartedAt = Date.now();
    logAdminEmail("info", "still_attempt_start", {
      scenarioId: params.scenarioId,
      attempt,
      maxAttempts: MAX_IMAGE_QA_ATTEMPTS,
      model: params.model,
      retryHintApplied: Boolean(retryHint),
      previousLogoRejected,
      previousReasons: previousReasons.slice(0, 3),
    });

    let bytes: Buffer;
    try {
      bytes = await generateFreshImageBytes({
        prompt: `${params.prompt}${retryHint}`,
        model: params.model,
        client: params.client,
        generateImage: params.generateImage,
      });
    } catch (error) {
      previousReasons = [`image generation error: ${errorMessage(error)}`];
      previousLogoRejected = false;
      logAdminEmail("warn", "still_image_generate_failed", {
        scenarioId: params.scenarioId,
        attempt,
        model: params.model,
        error: errorMessage(error),
        elapsedMs: Date.now() - attemptStartedAt,
      });
      continue;
    }

    let qa: { pass: boolean; aiIshScore: number; reasons: string[] };
    try {
      qa = params.inspectImage
        ? await params.inspectImage({ imageBytes: bytes })
        : await inspectAdminEmailImageProfessionalism({
            client: params.client,
            imageBytes: bytes,
          });
    } catch (error) {
      previousReasons = [`image QA error: ${errorMessage(error)}`];
      previousLogoRejected = false;
      logAdminEmail("warn", "still_image_qa_error", {
        scenarioId: params.scenarioId,
        attempt,
        model: params.model,
        error: errorMessage(error),
        elapsedMs: Date.now() - attemptStartedAt,
      });
      continue;
    }

    if (qa.pass) {
      logAdminEmail("info", "still_attempt_passed", {
        scenarioId: params.scenarioId,
        attempt,
        aiIshScore: qa.aiIshScore,
        elapsedMs: Date.now() - attemptStartedAt,
        totalElapsedMs: Date.now() - startedAt,
      });
      return bytes;
    }

    previousReasons = qa.reasons;
    previousLogoRejected = reasonsIndicateBrandLogo(qa.reasons);
    const keptAsFallbackCandidate = !previousLogoRejected;

    logAdminEmail("warn", "still_attempt_rejected", {
      scenarioId: params.scenarioId,
      attempt,
      aiIshScore: qa.aiIshScore,
      logoRejected: previousLogoRejected,
      keptAsFallbackCandidate,
      reasons: qa.reasons.slice(0, 6),
      elapsedMs: Date.now() - attemptStartedAt,
    });

    // Never keep a logo/watermark image as the fallback ship candidate.
    if (!keptAsFallbackCandidate) continue;
    if (qa.aiIshScore < bestScore) {
      bestScore = qa.aiIshScore;
      bestBytes = bytes;
    }
  }

  // Prefer shipping a usable photo over blocking the whole marketing email.
  if (bestBytes) {
    logAdminEmail("warn", "still_shipping_best_fallback", {
      scenarioId: params.scenarioId,
      bestAiIshScore: bestScore,
      attempts: MAX_IMAGE_QA_ATTEMPTS,
      lastReasons: previousReasons.slice(0, 6),
      totalElapsedMs: Date.now() - startedAt,
    });
    return bestBytes;
  }

  const lastQa = summarizeQaFailureReasons(previousReasons);
  logAdminEmail("error", "still_generation_exhausted", {
    scenarioId: params.scenarioId,
    attempts: MAX_IMAGE_QA_ATTEMPTS,
    lastLogoRejected: previousLogoRejected,
    lastReasons: previousReasons.slice(0, 6),
    totalElapsedMs: Date.now() - startedAt,
  });
  throw new Error(
    `Failed to generate an email still for "${params.scenarioId}" after ${MAX_IMAGE_QA_ATTEMPTS} attempts. Last QA: ${lastQa}`,
  );
}

function promptRequestsFreshImages(prompt: string): boolean {
  return /\b(?:new|different|replace|regenerate|change|update|refresh)\s+(?:hero\s+)?(?:images?|visuals?|pictures?|photos?|demos?|scenarios?|art|graphics?)\b/i.test(
    prompt,
  );
}

async function generateScenarioStillAssets(
  input: AdminEmailGenerationRequest,
  scenarioRows: AdminEmailScenarioRow[],
  params: {
    client: OpenAI;
    imageModel: string;
    generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
    uploadImage?: GenerateAdminEmailDraftDeps["uploadImage"];
    inspectImage?: GenerateAdminEmailDraftDeps["inspectImage"];
  },
): Promise<AdminEmailImageAsset[]> {
  const existingById = new Map(
    reusableStillAssets(input.currentImageAssets).map((asset) => [
      asset.scenarioId as AdminEmailScenarioId,
      asset,
    ]),
  );
  const selectedScenarioIds = scenarioRows.map((row) => row.scenarioId);
  // Only regenerate every scenario when the user explicitly asks; otherwise fill gaps
  // for the scenarios selected by the client brief.
  const forceAll = promptRequestsFreshImages(input.prompt);
  const reuseIds = selectedScenarioIds.filter(
    (scenarioId) => !forceAll && existingById.has(scenarioId),
  );
  const regenerateIds = selectedScenarioIds.filter(
    (scenarioId) => forceAll || !existingById.has(scenarioId),
  );

  logAdminEmail("info", "scenario_still_plan", {
    forceAll,
    imageModel: params.imageModel,
    reuseIds,
    regenerateIds,
  });

  return Promise.all(
    scenarioRows.map(async (row) => {
      const existing = existingById.get(row.scenarioId);
      if (!forceAll && existing) {
        logAdminEmail("info", "scenario_still_reused", {
          scenarioId: row.scenarioId,
          urlHost: safeUrlHost(existing.url),
        });
        return existing;
      }

      const prompt = buildStillImagePrompt(input.prompt, row.imageScene);
      const scenarioStartedAt = Date.now();
      logAdminEmail("info", "scenario_still_generate_start", {
        scenarioId: row.scenarioId,
        imageModel: params.imageModel,
        promptChars: prompt.length,
      });
      const bytes = await generateQaApprovedStillBytes({
        prompt,
        model: params.imageModel,
        scenarioId: row.scenarioId,
        client: params.client,
        generateImage: params.generateImage,
        inspectImage: params.inspectImage,
      });
      const uploaded = await uploadStillImageAsset({
        bytes,
        fileName: `${slugForPrompt(input.prompt)}-${row.scenarioId}.png`,
        altText: row.title,
        prompt,
        model: params.imageModel,
        role: "scenario",
        scenarioId: row.scenarioId,
        uploadImage: params.uploadImage,
      });
      logAdminEmail("info", "scenario_still_generate_complete", {
        scenarioId: row.scenarioId,
        urlHost: safeUrlHost(uploaded.url),
        elapsedMs: Date.now() - scenarioStartedAt,
      });
      return uploaded;
    }),
  );
}

function safeUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

async function generateEmailImageAssets(
  input: AdminEmailGenerationRequest,
  scenarioRows: AdminEmailScenarioRow[],
  params: {
    client: OpenAI;
    imageModel: string;
    generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
    uploadImage?: GenerateAdminEmailDraftDeps["uploadImage"];
    inspectImage?: GenerateAdminEmailDraftDeps["inspectImage"];
  },
): Promise<AdminEmailImageAsset[]> {
  return generateScenarioStillAssets(input, scenarioRows, params);
}

function shouldRegenerateImage(
  input: AdminEmailGenerationRequest,
  scenarioRows: AdminEmailScenarioRow[],
): boolean {
  // Always rebuild when legacy GIFs/demo assets were stripped or any selected scenario still is missing.
  if (
    !hasCompleteScenarioStillAssets(
      input.currentImageAssets,
      scenarioRows.map((row) => row.scenarioId),
    )
  ) {
    return true;
  }
  const currentScenes = new Map(
    input.currentScenarioRows.map((row) => [row.scenarioId, row.imageScene]),
  );
  if (scenarioRows.some((row) => currentScenes.get(row.scenarioId) !== row.imageScene)) {
    return true;
  }
  if (/\.gif(?:$|[?#])/i.test(input.currentBodyHtml || "")) return true;
  return promptRequestsFreshImages(input.prompt);
}

export function buildCtaButtonHtml(params: {
  href?: string;
  label?: string;
  margin?: string;
}): string {
  const href = params.href || DEFAULT_ENVITEFY_CTA_URL;
  const label = params.label || "Open Envitefy";
  const margin = params.margin || "28px 0 20px 0";
  return `<div style="text-align:center; margin:${margin};">
  <a href="${href}" target="_blank" style="background-color:#7F67D3; color:#FFFFFF; border-radius:12px; padding:14px 28px; font-weight:700; display:inline-block; text-decoration:none;">${label}</a>
</div>`;
}

export function buildGeneratedEmailImageBlock(
  asset: AdminEmailImageAsset,
  href: string = DEFAULT_ENVITEFY_CTA_URL,
): string {
  if (isGifAssetUrl(asset.url)) return "";
  return `<a href="${href}" target="_blank" style="display:block; margin:0 0 16px 0; text-decoration:none;">
  <img src="${asset.url}" width="544" alt="${escapeEmailHtmlText(normalizeEnvitefyConciergeName(asset.altText))}" style="display:block; width:100%; max-width:544px; height:auto; border:0; border-radius:14px; outline:none; text-decoration:none;" />
</a>`;
}

export function buildScenarioRowHtml(params: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  image?: AdminEmailImageAsset | null;
}): string {
  const imageBlock = params.image ? buildGeneratedEmailImageBlock(params.image, params.ctaUrl) : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px 0;">
  <tr>
    <td style="padding:24px 0 0 0; border-top:1px solid #E8E1FF; background-color:#FFFFFF;" bgcolor="#FFFFFF">
      ${imageBlock}
      <h2 style="margin:0 0 8px 0;font-size:20px;line-height:26px;color:#172033;">${escapeEmailHtmlText(params.title)}</h2>
      <p style="margin:0 0 14px 0;font-size:15px;line-height:22px;color:#243047;">${escapeEmailHtmlText(params.body)}</p>
      ${buildCtaButtonHtml({ href: params.ctaUrl, label: params.ctaLabel, margin: "0" })}
    </td>
  </tr>
</table>`;
}

function findScenarioImage(
  imageAssets: AdminEmailImageAsset[],
  scenarioId: AdminEmailScenarioId,
): AdminEmailImageAsset | undefined {
  return imageAssets.find((asset) => asset.scenarioId === scenarioId);
}

const DEFAULT_CAMPAIGN_INTRO = `<p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#243047;">{{greeting}}</p>
<h1 style="margin:0 0 12px 0;font-size:28px;line-height:34px;color:#172033;">Make your next event easier</h1>
<p style="margin:0 0 24px 0;font-size:16px;line-height:24px;color:#243047;">Create a polished event page, keep the details together, and share it when you are ready.</p>`;

const CAMPAIGN_GREETING_STYLE = "margin:0 0 16px 0;font-size:16px;line-height:24px;color:#243047;";
const CAMPAIGN_HEADLINE_STYLE = "margin:0 0 12px 0;font-size:28px;line-height:34px;color:#172033;";
const CAMPAIGN_INTRO_STYLE = "margin:0 0 24px 0;font-size:16px;line-height:24px;color:#243047;";

function normalizeCampaignIntroMarkup(html: string): string {
  let paragraphIndex = 0;
  return html
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<\/?(?:div|section|article)\b[^>]*>/gi, "")
    .replace(/<h1\b[^>]*>/gi, `<h1 style="${CAMPAIGN_HEADLINE_STYLE}">`)
    .replace(/<p\b[^>]*>/gi, () => {
      const style = paragraphIndex === 0 ? CAMPAIGN_GREETING_STYLE : CAMPAIGN_INTRO_STYLE;
      paragraphIndex += 1;
      return `<p style="${style}">`;
    })
    .trim();
}

/**
 * After {{greeting}} (already "Hi Name"), drop a redundant {{firstName}} lead-in
 * on later paragraphs/headlines so we don't get "Hi Ruslan" then "Ruslan, …".
 */
export function stripRedundantNameAfterGreeting(html: string): string {
  if (!/\{\{\s*greeting\s*\}\}/i.test(html)) return html;

  let seenGreeting = false;
  return html.replace(
    /<(p|h1|h2)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag: string, attrs: string, inner: string) => {
      if (/\{\{\s*greeting\s*\}\}/i.test(inner)) {
        seenGreeting = true;
        return full;
      }
      if (!seenGreeting) return full;

      const stripped = inner.replace(/^\s*\{\{\s*firstName\s*\}\}\s*(?:[,–—:-]\s*|\s+)/i, "");
      if (stripped === inner) return full;

      const capitalized = stripped.replace(/^(\s*)([a-z])/, (_m, ws: string, ch: string) => {
        return `${ws}${ch.toUpperCase()}`;
      });
      return `<${tag}${attrs}>${capitalized}</${tag}>`;
    },
  );
}

export function polishAdminEmailBodyHtml(html: string): string {
  let out = cleanMultilineString(html);
  if (!out) return "";

  // Never keep animated GIFs in email HTML.
  out = out.replace(/<img\b[^>]*src\s*=\s*(["'])[^"']*\.gif(?:\?[^"']*)?\1[^>]*>/gi, "");
  out = out.replace(/snap-demo\.gif/gi, "");

  out = stripRedundantNameAfterGreeting(out);

  const banned = BANNED_TEXT_LINK_PATTERN;
  // Remove filler text links under/near CTAs (never keep these).
  out = out.replace(
    new RegExp(
      `<p[^>]*>\\s*<a\\b(?![^>]*background-color\\s*:\\s*#7F67D3)[^>]*>\\s*(?:${banned})[^<]*<\\/a>\\s*<\\/p>`,
      "gi",
    ),
    "",
  );
  out = out.replace(
    new RegExp(
      `(<div[^>]*>\\s*<a[^>]*background-color\\s*:\\s*#7F67D3[\\s\\S]*?<\\/div>)\\s*<a\\b(?![^>]*background-color\\s*:\\s*#7F67D3)[^>]*>\\s*(?:${banned})[^<]*<\\/a>`,
      "gi",
    ),
    "$1",
  );
  out = out.replace(
    new RegExp(
      `<a\\b(?![^>]*background-color\\s*:\\s*#7F67D3)[^>]*>\\s*(?:${banned})\\s*<\\/a>`,
      "gi",
    ),
    "",
  );

  // Collapse consecutive duplicate purple CTA blocks.
  out = out.replace(
    /(<div[^>]*>\s*<a[^>]*background-color\s*:\s*#7F67D3[^>]*>[\s\S]*?<\/a>\s*<\/div>)(?:\s*\1)+/gi,
    "$1",
  );

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function extractCampaignIntroHtml(bodyHtml: string): string {
  let intro = polishAdminEmailBodyHtml(bodyHtml);
  if (!intro) return DEFAULT_CAMPAIGN_INTRO;

  intro = intro.replace(/<table\b[\s\S]*$/i, "");
  intro = intro.replace(/<img\b[^>]*>/gi, "");

  for (const scenario of ADMIN_EMAIL_PRODUCT_SCENARIOS) {
    const titleIndex = intro.toLowerCase().indexOf(scenario.title.toLowerCase());
    if (titleIndex >= 0) {
      intro = intro.slice(0, titleIndex);
    }
  }

  // Drop any leftover purple buttons from the intro — scenarios + wrapper own CTAs.
  intro = intro.replace(/<div[^>]*>\s*<a[^>]*background-color\s*:\s*#7F67D3[\s\S]*?<\/div>/gi, "");
  intro = normalizeCampaignIntroMarkup(polishAdminEmailBodyHtml(intro));

  if (!/<p\b|<h1\b/i.test(intro)) return DEFAULT_CAMPAIGN_INTRO;
  return intro;
}

export function buildStructuredScenarioEmail(
  draft: AdminEmailDraft,
  imageAssets: AdminEmailImageAsset[],
): string {
  const intro = extractCampaignIntroHtml(draft.bodyHtml);
  const rows = draft.scenarioRows
    .map((row) => {
      const scenario = ADMIN_EMAIL_PRODUCT_SCENARIOS.find(
        (candidate) => candidate.id === row.scenarioId,
      );
      if (!scenario) return "";
      const image = findScenarioImage(imageAssets, row.scenarioId);
      return buildScenarioRowHtml({
        title: row.title,
        body: row.body,
        ctaLabel: scenario.ctaLabel,
        ctaUrl: resolveScenarioCtaUrl(scenario.ctaPath),
        image: image || null,
      });
    })
    .join("\n");

  // No final body CTA — createEmailTemplate adds one from buttonText/buttonUrl.
  return polishAdminEmailBodyHtml(`${intro}\n${rows}`);
}

export function ensureDraftIncludesPrimaryCta(draft: AdminEmailDraft): AdminEmailDraft {
  const hasScenarioCtas = /background-color\s*:\s*#7F67D3/i.test(draft.bodyHtml);
  const buttonText = hasScenarioCtas
    ? ""
    : draft.buttonText.trim() || ADMIN_EMAIL_GENERATION_GUIDE.ctaDefaults.buttonText;
  const buttonUrl = hasScenarioCtas
    ? ""
    : isHttpUrl(draft.buttonUrl)
      ? draft.buttonUrl
      : ADMIN_EMAIL_GENERATION_GUIDE.ctaDefaults.buttonUrl;
  return {
    ...draft,
    buttonText,
    buttonUrl,
    bodyHtml: polishAdminEmailBodyHtml(draft.bodyHtml),
  };
}

export function ensureDraftIncludesImageAssets(
  draft: AdminEmailDraft,
  imageAssets: AdminEmailImageAsset[],
): AdminEmailDraft {
  if (!draft.scenarioRows.length) {
    return ensureDraftIncludesPrimaryCta({ ...draft, imageAssets: [] });
  }

  const selectedScenarioIds = new Set(draft.scenarioRows.map((row) => row.scenarioId));
  const selectedImageAssets = imageAssets.filter(
    (asset) => asset.scenarioId && selectedScenarioIds.has(asset.scenarioId),
  );
  const bodyHtml = buildStructuredScenarioEmail(draft, selectedImageAssets);
  // Scenario rows already include CTAs — suppress wrapper duplicate button.
  return ensureDraftIncludesPrimaryCta({
    ...draft,
    bodyHtml,
    imageAssets: selectedImageAssets,
    buttonText: "",
    buttonUrl: "",
  });
}

function reusableStillAssets(assets: AdminEmailImageAsset[]): AdminEmailImageAsset[] {
  return assets.filter(
    (asset) => Boolean(asset.scenarioId) && asset.role === "scenario" && !isGifAssetUrl(asset.url),
  );
}

export async function generateAdminEmailDraft(
  input: AdminEmailGenerationRequest,
  deps: GenerateAdminEmailDraftDeps = {},
): Promise<{ draft: AdminEmailDraft; model: string }> {
  const startedAt = Date.now();
  const apiKey = deps.openAiApiKey ?? process.env.OPENAI_API_KEY ?? null;
  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");
  }

  const model = resolveAdminEmailGeneratorModel(deps.openAiModel);
  const imageModel = resolveAdminEmailImageModel(deps.openAiImageModel);
  const client = deps.createOpenAiClient?.(apiKey) || new OpenAI({ apiKey });
  const reusableAssets = reusableStillAssets(input.currentImageAssets);

  logAdminEmail("info", "draft_generate_start", {
    audienceMode: input.audienceMode,
    model,
    imageModel,
    reusableAssetCount: reusableAssets.length,
    promptChars: input.prompt.length,
    hasCurrentBodyHtml: Boolean(input.currentBodyHtml),
  });

  let draft: AdminEmailDraft | null = null;
  let lastCandidate: AdminEmailDraft | null = null;
  let correctionViolations: string[] = [];
  try {
    for (let attempt = 1; attempt <= MAX_DRAFT_FIDELITY_ATTEMPTS; attempt += 1) {
      const completion = await client.chat.completions.create({
        model,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "admin_email_draft",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "subject",
                "preheader",
                "bodyHtml",
                "buttonText",
                "buttonUrl",
                "notes",
                "scenarioRows",
              ],
              properties: {
                subject: { type: "string" },
                preheader: { type: "string" },
                bodyHtml: { type: "string" },
                buttonText: { type: "string" },
                buttonUrl: { type: "string" },
                notes: { type: "string" },
                scenarioRows: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["scenarioId", "title", "body", "imageScene"],
                    properties: {
                      scenarioId: {
                        type: "string",
                        enum: ADMIN_EMAIL_PRODUCT_SCENARIOS.map((scenario) => scenario.id),
                      },
                      title: { type: "string" },
                      body: { type: "string" },
                      imageScene: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        } as any,
        messages: [
          { role: "developer", content: buildSystemPrompt(input.audienceMode) },
          {
            role: "user",
            content: buildUserPrompt(input, reusableAssets.length, correctionViolations),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content || "";
      const normalizedCandidate = normalizeAdminEmailDraft(extractJsonObject(raw));
      const candidate = normalizedCandidate
        ? applyAdminEmailPromptConstraints(
            input.prompt,
            normalizedCandidate,
            input.currentScenarioRows,
          )
        : null;
      if (!candidate) {
        correctionViolations = [
          "Return every required field with non-empty subject, bodyHtml, and at least one complete scenarioRows item.",
        ];
      } else {
        lastCandidate = candidate;
        correctionViolations = validateAdminEmailPromptFidelity(
          input.prompt,
          candidate,
          input.currentScenarioRows,
        );
        if (correctionViolations.length === 0) {
          draft = candidate;
          break;
        }
      }

      logAdminEmail("warn", "draft_prompt_fidelity_retry", {
        audienceMode: input.audienceMode,
        model,
        attempt,
        violations: correctionViolations,
      });
    }

    if (!draft) {
      const recovered = recoverAdminEmailDraftForPrompt(
        input.prompt,
        lastCandidate,
        input.currentScenarioRows,
      );
      const recoveryViolations = validateAdminEmailPromptFidelity(
        input.prompt,
        recovered,
        input.currentScenarioRows,
      );
      if (recoveryViolations.length === 0) {
        draft = recovered;
        correctionViolations = [];
        logAdminEmail("warn", "draft_prompt_fidelity_recovered", {
          audienceMode: input.audienceMode,
          model,
          selectedScenarioIds: recovered.scenarioRows.map((row) => row.scenarioId),
        });
      } else {
        correctionViolations = recoveryViolations;
      }
    }
  } catch (error) {
    logAdminEmail("error", "draft_copy_phase_failed", {
      audienceMode: input.audienceMode,
      model,
      error: errorMessage(error),
      elapsedMs: Date.now() - startedAt,
    });
    throw error;
  }

  if (!draft) {
    logAdminEmail("error", "draft_invalid_response", {
      audienceMode: input.audienceMode,
      model,
      elapsedMs: Date.now() - startedAt,
    });
    throw new Error(
      correctionViolations.length
        ? "We couldn't create a draft that matched every campaign instruction. Please try Generate again."
        : "Email generator returned an invalid draft. Please try Generate again.",
    );
  }

  const selectedScenarioIds = new Set(draft.scenarioRows.map((row) => row.scenarioId));
  const selectedReusableAssets = reusableAssets.filter(
    (asset) => asset.scenarioId && selectedScenarioIds.has(asset.scenarioId),
  );
  const imageInput = { ...input, currentImageAssets: selectedReusableAssets };
  const regenerateImages = shouldRegenerateImage(imageInput, draft.scenarioRows);

  logAdminEmail("info", "draft_scenario_plan", {
    audienceMode: input.audienceMode,
    selectedScenarioIds: draft.scenarioRows.map((row) => row.scenarioId),
    regenerateImages,
    reusableAssetCount: selectedReusableAssets.length,
  });

  let imageAssets: AdminEmailImageAsset[];
  try {
    imageAssets = regenerateImages
      ? await generateEmailImageAssets(imageInput, draft.scenarioRows, {
          client,
          imageModel,
          generateImage: deps.generateImage,
          uploadImage: deps.uploadImage,
          inspectImage: deps.inspectImage,
        })
      : selectedReusableAssets;
  } catch (error) {
    logAdminEmail("error", "draft_image_phase_failed", {
      audienceMode: input.audienceMode,
      imageModel,
      error: errorMessage(error),
      elapsedMs: Date.now() - startedAt,
    });
    throw error;
  }

  const finalized = ensureDraftIncludesImageAssets(draft, imageAssets);
  logAdminEmail("info", "draft_generate_complete", {
    audienceMode: input.audienceMode,
    model,
    imageModel,
    imageAssetCount: finalized.imageAssets.length,
    subjectChars: finalized.subject.length,
    bodyHtmlChars: finalized.bodyHtml.length,
    elapsedMs: Date.now() - startedAt,
  });
  return { draft: finalized, model };
}
