import OpenAI from "openai";
import { resolveEmailEmbedAssetUrl, uploadPublicBinaryAsset } from "../media-upload.ts";
import {
  ADMIN_EMAIL_PRODUCT_SCENARIOS,
  resolveScenarioCtaUrl,
  type AdminEmailScenarioId,
} from "./email-scenarios.ts";
import {
  ADMIN_EMAIL_GENERATION_GUIDE,
  bannedAdminEmailTextLinkPattern,
  buildAdminEmailGuidePromptPayload,
  buildAdminEmailSystemPromptFromGuide,
} from "./email-generation-guide.ts";
import { inspectAdminEmailImageProfessionalism, reasonsIndicateBrandLogo } from "./email-image-qa.ts";

type JsonRecord = Record<string, unknown>;

export type AdminEmailAudienceMode = "individual" | "broadcast";

export type AdminEmailGenerationRequest = {
  prompt: string;
  audienceMode: AdminEmailAudienceMode;
  currentImageAssets: AdminEmailImageAsset[];
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

export type AdminEmailDraft = {
  subject: string;
  preheader: string;
  bodyHtml: string;
  buttonText: string;
  buttonUrl: string;
  notes: string;
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
const BANNED_TEXT_LINK_PATTERN = bannedAdminEmailTextLinkPattern();

function parseImageRole(value: unknown): AdminEmailImageRole {
  const role = cleanString(value, 40);
  if (role === "demo" || role === "scenario" || role === "feature" || role === "support") {
    return role;
  }
  return "hero";
}

function parseScenarioId(value: unknown): AdminEmailScenarioId | undefined {
  const id = cleanString(value, 40);
  if (id === "snap" || id === "concierge" || id === "teachers" || id === "share") return id;
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

export function hasCompleteScenarioStillAssets(assets: AdminEmailImageAsset[]): boolean {
  const byId = new Map(
    assets
      .filter((asset) => asset.scenarioId && !isGifAssetUrl(asset.url) && asset.role !== "demo")
      .map((asset) => [asset.scenarioId as AdminEmailScenarioId, asset]),
  );
  return ADMIN_EMAIL_PRODUCT_SCENARIOS.every((scenario) => byId.has(scenario.id));
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

export function normalizeAdminEmailDraft(value: unknown): AdminEmailDraft | null {
  if (!isRecord(value)) return null;

  const subject = cleanString(value.subject, 140);
  const preheader = cleanString(value.preheader, 180);
  const bodyHtml = sanitizeGeneratedEmailHtml(cleanMultilineString(value.bodyHtml));
  const buttonText = cleanString(value.buttonText, 60);
  const rawButtonUrl = cleanString(value.buttonUrl, 500);
  const notes = cleanString(value.notes, 500);

  if (!subject || !bodyHtml) return null;

  return {
    subject,
    preheader,
    bodyHtml,
    buttonText,
    buttonUrl: isHttpUrl(rawButtonUrl) ? rawButtonUrl : "",
    notes,
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
  generatedImageAssets: AdminEmailImageAsset[],
): string {
  return JSON.stringify({
    mode: input.currentBodyHtml ? "revise_existing_draft" : "create_new_draft",
    prompt: input.prompt,
    audienceMode: input.audienceMode,
    ...buildAdminEmailGuidePromptPayload({
      audienceMode: input.audienceMode,
      generatedImageAssetsCount: generatedImageAssets.length,
    }),
    currentDraft: {
      subject: input.currentSubject || "",
      bodyHtml: input.currentBodyHtml || "",
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

async function generateQaApprovedStillBytes(params: {
  prompt: string;
  model: string;
  client: OpenAI;
  generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
  inspectImage?: GenerateAdminEmailDraftDeps["inspectImage"];
}): Promise<Buffer> {
  let bestBytes: Buffer | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 1; attempt <= MAX_IMAGE_QA_ATTEMPTS; attempt += 1) {
    const retryHint =
      attempt > 1
        ? " Previous attempt failed. Make this one look like a real stock photograph with natural light, no surreal overlays, and absolutely no logos, watermarks, or brand badges anywhere in the frame. Phones and printed invites are fine."
        : "";
    const bytes = await generateFreshImageBytes({
      prompt: `${params.prompt}${retryHint}`,
      model: params.model,
      client: params.client,
      generateImage: params.generateImage,
    });

    const qa = params.inspectImage
      ? await params.inspectImage({ imageBytes: bytes })
      : await inspectAdminEmailImageProfessionalism({
          client: params.client,
          imageBytes: bytes,
        });

    if (qa.pass) return bytes;
    // Never keep a logo/watermark image as the fallback ship candidate.
    if (reasonsIndicateBrandLogo(qa.reasons)) continue;
    if (qa.aiIshScore < bestScore) {
      bestScore = qa.aiIshScore;
      bestBytes = bytes;
    }
  }

  // Prefer shipping a usable photo over blocking the whole marketing email.
  if (bestBytes) return bestBytes;
  throw new Error(`Failed to generate an email still after ${MAX_IMAGE_QA_ATTEMPTS} attempts.`);
}

function promptRequestsFreshImages(prompt: string): boolean {
  return /\b(?:new|different|replace|regenerate|change|update|refresh)\s+(?:hero\s+)?(?:images?|visuals?|pictures?|photos?|demos?|scenarios?|art|graphics?)\b/i.test(
    prompt,
  );
}

async function generateScenarioStillAssets(
  input: AdminEmailGenerationRequest,
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
  // Only regenerate every scenario when the user explicitly asks; otherwise fill gaps
  // (e.g. legacy GIF stripped from Snap while Concierge/teachers/share stills remain).
  const forceAll = promptRequestsFreshImages(input.prompt);

  return Promise.all(
    ADMIN_EMAIL_PRODUCT_SCENARIOS.map(async (scenario) => {
      const existing = existingById.get(scenario.id);
      if (!forceAll && existing) return existing;

      const prompt = buildStillImagePrompt(input.prompt, scenario.stillScene);
      const bytes = await generateQaApprovedStillBytes({
        prompt,
        model: params.imageModel,
        client: params.client,
        generateImage: params.generateImage,
        inspectImage: params.inspectImage,
      });
      return uploadStillImageAsset({
        bytes,
        fileName: `${slugForPrompt(input.prompt)}-${scenario.id}.png`,
        altText: scenario.title,
        prompt,
        model: params.imageModel,
        role: "scenario",
        scenarioId: scenario.id,
        uploadImage: params.uploadImage,
      });
    }),
  );
}

async function generateEmailImageAssets(
  input: AdminEmailGenerationRequest,
  params: {
    client: OpenAI;
    imageModel: string;
    generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
    uploadImage?: GenerateAdminEmailDraftDeps["uploadImage"];
    inspectImage?: GenerateAdminEmailDraftDeps["inspectImage"];
  },
): Promise<AdminEmailImageAsset[]> {
  return generateScenarioStillAssets(input, params);
}

function shouldRegenerateImage(input: AdminEmailGenerationRequest): boolean {
  // Always rebuild when legacy GIFs/demo assets were stripped or any scenario still is missing.
  if (!hasCompleteScenarioStillAssets(input.currentImageAssets)) return true;
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
  href = DEFAULT_ENVITEFY_CTA_URL,
): string {
  if (isGifAssetUrl(asset.url)) return "";
  return `<div style="margin:0 0 16px 0; border-radius:16px; overflow:hidden; background:#F5F2FF;">
  <a href="${href}" target="_blank" style="display:block; text-decoration:none;">
    <img src="${asset.url}" width="544" alt="${asset.altText}" style="display:block; width:100%; max-width:544px; height:auto; border:0; outline:none; text-decoration:none;" />
  </a>
</div>`;
}

export function buildScenarioRowHtml(params: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  image?: AdminEmailImageAsset | null;
}): string {
  const imageBlock = params.image
    ? buildGeneratedEmailImageBlock(params.image, params.ctaUrl)
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px 0;">
  <tr>
    <td style="padding:18px; border:1px solid #E8E1FF; border-radius:16px; background:#FBFAFF;">
      ${imageBlock}
      <h2 style="margin:0 0 8px 0;font-size:20px;line-height:26px;color:#172033;">${params.title}</h2>
      <p style="margin:0 0 14px 0;font-size:15px;line-height:22px;color:#243047;">${params.body}</p>
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
<h1 style="margin:0 0 12px 0;font-size:28px;line-height:34px;color:#172033;">Plan birthdays, class parties, and shares the easy way</h1>
<p style="margin:0 0 24px 0;font-size:16px;line-height:24px;color:#243047;">Here are practical ways families and teachers use Envitefy.</p>`;

export function polishAdminEmailBodyHtml(html: string): string {
  let out = cleanMultilineString(html);
  if (!out) return "";

  // Never keep animated GIFs in email HTML.
  out = out.replace(/<img\b[^>]*src\s*=\s*(["'])[^"']*\.gif(?:\?[^"']*)?\1[^>]*>/gi, "");
  out = out.replace(/snap-demo\.gif/gi, "");

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
  intro = polishAdminEmailBodyHtml(intro);

  if (!/<p\b|<h1\b/i.test(intro)) return DEFAULT_CAMPAIGN_INTRO;
  return intro;
}

export function buildStructuredScenarioEmail(
  draft: AdminEmailDraft,
  imageAssets: AdminEmailImageAsset[],
): string {
  const intro = extractCampaignIntroHtml(draft.bodyHtml);
  const rows = ADMIN_EMAIL_PRODUCT_SCENARIOS.map((scenario) => {
    const image = findScenarioImage(imageAssets, scenario.id);
    return buildScenarioRowHtml({
      title: scenario.title,
      body: scenario.body,
      ctaLabel: scenario.ctaLabel,
      ctaUrl: resolveScenarioCtaUrl(scenario.ctaPath),
      image: image || null,
    });
  }).join("\n");

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
  if (!imageAssets.length) {
    return ensureDraftIncludesPrimaryCta({ ...draft, imageAssets: [] });
  }

  const bodyHtml = buildStructuredScenarioEmail(draft, imageAssets);
  // Scenario rows already include CTAs — suppress wrapper duplicate button.
  return ensureDraftIncludesPrimaryCta({
    ...draft,
    bodyHtml,
    imageAssets,
    buttonText: "",
    buttonUrl: "",
  });
}

function reusableStillAssets(assets: AdminEmailImageAsset[]): AdminEmailImageAsset[] {
  return assets.filter(
    (asset) =>
      Boolean(asset.scenarioId) &&
      asset.role === "scenario" &&
      !isGifAssetUrl(asset.url),
  );
}

export async function generateAdminEmailDraft(
  input: AdminEmailGenerationRequest,
  deps: GenerateAdminEmailDraftDeps = {},
): Promise<{ draft: AdminEmailDraft; model: string }> {
  const apiKey = deps.openAiApiKey ?? process.env.OPENAI_API_KEY ?? null;
  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");
  }

  const model = resolveAdminEmailGeneratorModel(deps.openAiModel);
  const imageModel = resolveAdminEmailImageModel(deps.openAiImageModel);
  const client = deps.createOpenAiClient?.(apiKey) || new OpenAI({ apiKey });
  const reusableAssets = reusableStillAssets(input.currentImageAssets);
  const imageAssets = shouldRegenerateImage({ ...input, currentImageAssets: reusableAssets })
    ? await generateEmailImageAssets(
        { ...input, currentImageAssets: reusableAssets },
        {
          client,
          imageModel,
          generateImage: deps.generateImage,
          uploadImage: deps.uploadImage,
          inspectImage: deps.inspectImage,
        },
      )
    : reusableAssets;
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
          required: ["subject", "preheader", "bodyHtml", "buttonText", "buttonUrl", "notes"],
          properties: {
            subject: { type: "string" },
            preheader: { type: "string" },
            bodyHtml: { type: "string" },
            buttonText: { type: "string" },
            buttonUrl: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    } as any,
    messages: [
      { role: "system", content: buildSystemPrompt(input.audienceMode) },
      { role: "user", content: buildUserPrompt(input, imageAssets) },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  const draft = normalizeAdminEmailDraft(extractJsonObject(raw));
  if (!draft) {
    throw new Error("Email generator returned an invalid draft.");
  }

  return { draft: ensureDraftIncludesImageAssets(draft, imageAssets), model };
}
