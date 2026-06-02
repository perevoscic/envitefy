import OpenAI from "openai";
import { processBufferUpload } from "../media-upload.ts";
import { buildPublicAssetUrl } from "../public-asset-url.ts";

type JsonRecord = Record<string, unknown>;

export type AdminEmailAudienceMode = "individual" | "broadcast";

export type AdminEmailGenerationRequest = {
  prompt: string;
  audienceMode: AdminEmailAudienceMode;
  currentImageAssets: AdminEmailImageAsset[];
  currentSubject?: string | null;
  currentBodyHtml?: string | null;
};

export type AdminEmailImageAsset = {
  role: "hero";
  url: string;
  altText: string;
  prompt: string;
  model: string;
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
};

const DEFAULT_ADMIN_EMAIL_GENERATOR_MODEL = "gpt-5.5";
const DEFAULT_ADMIN_EMAIL_IMAGE_MODEL = "gpt-image-2";
const MAX_PROMPT_LENGTH = 5000;
const MAX_BODY_HTML_LENGTH = 50000;

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

function sanitizeImageTags(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\s+src\s*=\s*(["'])(.*?)\1/i);
    const src = srcMatch?.[2]?.trim() || "";
    return isHttpUrl(src) ? tag : "";
  });
}

function parseCurrentImageAssets(value: unknown): AdminEmailImageAsset[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): AdminEmailImageAsset | null => {
      if (!isRecord(item)) return null;
      const url = cleanString(item.url, 1000);
      if (!isHttpUrl(url)) return null;
      return {
        role: "hero",
        url,
        altText: cleanString(item.altText, 200) || "Envitefy event planning preview",
        prompt: cleanString(item.prompt, 2000),
        model: cleanString(item.model, 120),
      };
    })
    .filter((item): item is AdminEmailImageAsset => Boolean(item))
    .slice(0, 3);
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

function buildSystemPrompt(): string {
  return [
    "You generate polished Envitefy admin marketing emails.",
    "Return strict JSON only with subject, preheader, bodyHtml, buttonText, buttonUrl, and notes.",
    "bodyHtml must be an email-client-safe HTML fragment that will be placed inside Envitefy's branded wrapper.",
    "Do not return a full HTML document, <html>, <head>, <body>, <script>, forms, iframes, external CSS, or markdown.",
    "Use inline styles on ordinary email-safe elements such as p, h1, h2, div, table, ul, li, strong, em, and a.",
    "If generatedImageAssets are supplied, use at least one exact generatedImageAssets.url in bodyHtml unless the user's prompt explicitly asks for text only.",
    "Never invent image URLs, never use local files, and never use base64 or data URLs.",
    "Images must use email-safe <img> tags with width, alt text, border:0, display:block, max-width:100%, and height:auto inline styles.",
    "Use clear conversion copy, short paragraphs, and a practical CTA.",
    "When currentDraft.bodyHtml is present, treat the user's prompt as an edit request and preserve what is not being changed.",
    "Only use {{greeting}}, {{firstName}}, and {{lastName}} personalization tokens.",
    "Do not invent pricing, launch dates, offers, guarantees, legal claims, or user data that the prompt did not supply.",
    "Envitefy helps people create and share public event pages, live cards, invitations, RSVP flows, smart sign-up forms, registry links, and multi-vertical events.",
  ].join(" ");
}

function buildUserPrompt(
  input: AdminEmailGenerationRequest,
  generatedImageAssets: AdminEmailImageAsset[],
): string {
  return JSON.stringify({
    mode: input.currentBodyHtml ? "revise_existing_draft" : "create_new_draft",
    prompt: input.prompt,
    audienceMode: input.audienceMode,
    generatedImageAssets,
    currentDraft: {
      subject: input.currentSubject || "",
      bodyHtml: input.currentBodyHtml || "",
    },
    outputRules: {
      subject: "Punchy but not spammy. 80 characters or fewer when possible.",
      preheader: "Preview text under 140 characters.",
      bodyHtml: "HTML fragment only. Inline styles. Include {{greeting}} near the top.",
      buttonText: "Empty string if no CTA button is appropriate.",
      buttonUrl: "Only include a real http(s) URL from the prompt, otherwise empty string.",
      notes: "Short private note for the admin explaining assumptions.",
      revision:
        "For revise_existing_draft, apply the requested change while preserving the existing structure, generated image URLs, and CTA unless the prompt asks to change them.",
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

function buildGeneratedEmailImagePrompt(input: AdminEmailGenerationRequest): string {
  return [
    "Create one premium email hero image for an Envitefy marketing email.",
    "The image should support this campaign prompt:",
    input.prompt,
    "Make it polished, modern, warm, and conversion-focused.",
    "Show the feeling of easy digital event creation: invitations, live event pages, RSVP, sign-up organization, registry links, and simple sharing.",
    "Use realistic product-ad composition or tasteful abstract product staging, but do not render readable text, logos, watermarks, UI labels, QR codes, or fake URLs.",
    "Leave generous clean space and avoid busy clutter so the email still works if the image is small.",
    "No embedded typography. No text overlays.",
  ].join(" ");
}

async function generateEmailHeroImage(params: {
  client: OpenAI;
  prompt: string;
  model: string;
}): Promise<Buffer> {
  const response = await params.client.images.generate({
    model: params.model,
    prompt: params.prompt,
    size: "1536x1024",
    quality: "medium",
    background: "opaque",
    output_format: "png",
    moderation: "auto",
    n: 1,
  });

  const imageData = response.data?.[0]?.b64_json || "";
  if (!imageData) throw new Error("Image generator returned no image data.");
  return Buffer.from(imageData, "base64");
}

async function uploadEmailHeroImage(params: {
  bytes: Buffer;
  fileName: string;
  altText: string;
  prompt: string;
  model: string;
}): Promise<AdminEmailImageAsset> {
  const uploadToken = `admin-email-${Date.now()}-${slugForPrompt(params.fileName)}`;
  const uploaded = await processBufferUpload({
    bytes: params.bytes,
    fileName: params.fileName,
    mimeType: "image/png",
    usage: "header",
    uploadToken,
  });
  const url = buildPublicAssetUrl(uploaded.stored.display?.url || uploaded.stored.source?.url || "");
  if (!url) throw new Error("Generated image upload did not return a public URL.");

  return {
    role: "hero",
    url,
    altText: params.altText,
    prompt: params.prompt,
    model: params.model,
  };
}

async function generateEmailImageAssets(
  input: AdminEmailGenerationRequest,
  params: {
    client: OpenAI;
    imageModel: string;
    generateImage?: GenerateAdminEmailDraftDeps["generateImage"];
    uploadImage?: GenerateAdminEmailDraftDeps["uploadImage"];
  },
): Promise<AdminEmailImageAsset[]> {
  const prompt = buildGeneratedEmailImagePrompt(input);
  const altText = "Envitefy event planning preview";
  const bytes = params.generateImage
    ? await params.generateImage({ prompt, model: params.imageModel })
    : await generateEmailHeroImage({
        client: params.client,
        prompt,
        model: params.imageModel,
      });

  const fileName = `${slugForPrompt(input.prompt)}-email-hero.png`;
  const asset = params.uploadImage
    ? await params.uploadImage({
        bytes,
        fileName,
        altText,
        prompt,
        model: params.imageModel,
      })
    : await uploadEmailHeroImage({
        bytes,
        fileName,
        altText,
        prompt,
        model: params.imageModel,
      });

  return [asset];
}

function shouldRegenerateImage(input: AdminEmailGenerationRequest): boolean {
  if (!input.currentImageAssets.length) return true;
  return /\b(?:new|different|replace|regenerate|change|update|refresh)\s+(?:hero\s+)?(?:image|visual|picture|photo|art|graphic)\b/i.test(
    input.prompt,
  );
}

export function buildGeneratedEmailImageBlock(asset: AdminEmailImageAsset): string {
  return `<div style="margin:0 0 24px 0; border-radius:16px; overflow:hidden; background:#F5F2FF;">
  <img src="${asset.url}" width="544" alt="${asset.altText}" style="display:block; width:100%; max-width:544px; height:auto; border:0; outline:none; text-decoration:none;" />
</div>`;
}

export function ensureDraftIncludesImageAssets(
  draft: AdminEmailDraft,
  imageAssets: AdminEmailImageAsset[],
): AdminEmailDraft {
  if (!imageAssets.length) return { ...draft, imageAssets: [] };
  const allowedUrls = new Set(imageAssets.map((asset) => asset.url));
  const bodyHtml = draft.bodyHtml.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\s+src\s*=\s*(["'])(.*?)\1/i);
    const src = srcMatch?.[2]?.trim() || "";
    return allowedUrls.has(src) ? tag : "";
  });
  const missingAssets = imageAssets.filter((asset) => !bodyHtml.includes(asset.url));
  if (!missingAssets.length) return { ...draft, bodyHtml, imageAssets };

  const imageBlocks = missingAssets.map(buildGeneratedEmailImageBlock).join("\n");
  return {
    ...draft,
    bodyHtml: `${imageBlocks}\n${bodyHtml}`.trim(),
    imageAssets,
  };
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
  const imageAssets = shouldRegenerateImage(input)
    ? await generateEmailImageAssets(input, {
        client,
        imageModel,
        generateImage: deps.generateImage,
        uploadImage: deps.uploadImage,
      })
    : input.currentImageAssets;
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
      { role: "system", content: buildSystemPrompt() },
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
