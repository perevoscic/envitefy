import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { buildEnvitefyMarketingCatalogPrompt } from "../../product-marketing-catalog.ts";
import { openAiChatCompatibilityParams } from "../../openai-chat-params.ts";
import { resolveAdStudioImageModel } from "../ad-studio/providers.ts";
import { StudioProviderError } from "./provider-errors.ts";
import type { StudioConversation, StudioResult, StudioVersion } from "./types.ts";

export type StudioMediaInput = { bytes: Buffer; mimeType: string; name: string };
export type StudioCreativeInput = { version: StudioVersion; parent: StudioVersion | null; conversation: StudioConversation };
export type StudioImageRequest = { prompt: string; format: StudioVersion["input"]["settings"]["format"]; references: StudioMediaInput[] };
export type StudioImageResponse = { bytes: Buffer; mimeType: string; model: string };
export type StudioVideoRequest = StudioImageRequest & { previousInteractionId?: string; restoredVideo?: StudioMediaInput };
export type StudioVideoResponse = {
  id: string;
  model: string;
  status: "running" | "completed" | "failed";
  videoUri?: string;
  videoBytes?: Buffer;
  error?: string;
};

export function buildStudioCreativeContext({ version, parent, conversation }: StudioCreativeInput) {
  const turnCreatedAt = Date.parse(version.createdAt);
  return {
    request: version.input.text,
    settings: version.input.settings,
    selectedVersion: parent?.result ? { prompt: parent.result.prompt, direction: parent.result.direction, caption: parent.result.caption } : null,
    // A queued turn can start after other tabs add messages. Its context is fixed at submission time.
    recentConversation: conversation.messages
      .filter(message => message.versionId !== version.id && Date.parse(message.createdAt) <= turnCreatedAt)
      .slice(-8)
      .map(message => ({ role: message.role, text: message.text.slice(0, 2_000) })),
    referenceImageCount: version.input.referenceAssetIds.length,
  };
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_VIDEO_BYTES = 128 * 1024 * 1024;
const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime"]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function string(value: unknown): string { return typeof value === "string" ? value : ""; }

function openAiClient(timeout = 180_000): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new StudioProviderError("OpenAI is not configured. Set OPENAI_API_KEY and retry this version.", "rejected");
  // SDK retries would purchase a duplicate image after an uncertain network response.
  return new OpenAI({ apiKey, maxRetries: 0, timeout });
}

export async function developStudioIdea({ version, parent, conversation }: StudioCreativeInput): Promise<StudioResult> {
  const client = openAiClient(60_000);
  const model = process.env.ADMIN_MARKETING_PROMPT_MODEL || process.env.STORYBOARD_OPENAI_TEXT_MODEL || "gpt-5.6-luna";
  const completion = await client.chat.completions.create({
    model,
    ...openAiChatCompatibilityParams(model),
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "envitefy_content_studio_idea", strict: true,
        schema: {
          type: "object", additionalProperties: false, required: ["prompt", "direction", "caption", "headline"],
          properties: { prompt: { type: "string" }, direction: { type: "string" }, caption: { type: "string" }, headline: { type: "string" } },
        },
      },
    },
    messages: [
      { role: "developer", content: [
        "You are Envitefy's experienced social creative director. Turn an idea into ONE production-ready visual prompt, one brief creative direction, one ready-to-copy platform caption, and an optional concise headline.",
        "Choose one clear audience, promise, visual hook and conversion action. Adapt composition and caption to the selected platform. Keep language warm, clear and credible. Never invent capabilities, prices, guarantees, integrations or testimonials.",
        "For images specify a complete final composition with legible intentional text only when helpful. For video create a roughly 10-second clip with an immediate visual hook, natural motion, a simple progression, and optional natural audio. Do not add unsupported duration parameters to prose.",
        "When a prior version is selected, preserve its subjects, composition and intent except for the user's requested changes. A platform adaptation should retain the concept and adapt framing/copy. The prompt for an edit must explain the requested changes relative to the provided reference.",
        "Do not ask the image/video model to draw the Envitefy wordmark, logos or QR codes. Branding is composed afterward using official assets when enabled. If branding is enabled reserve unobtrusive space at upper left. Envitefy brand voice applies even without a visible logo.",
        `Verified product truth: ${buildEnvitefyMarketingCatalogPrompt()}`,
      ].join("\n") },
      { role: "user", content: JSON.stringify(buildStudioCreativeContext({ version, parent, conversation })) },
    ],
  });
  const payload: unknown = JSON.parse(completion.choices[0]?.message?.content || "{}");
  const parsed = object(payload);
  if (!string(parsed.prompt).trim()) throw new StudioProviderError("The creative assistant returned no prompt. Retry your idea.", "rejected");
  return { prompt: string(parsed.prompt).slice(0, 16_000), direction: string(parsed.direction).slice(0, 2_000), caption: string(parsed.caption).slice(0, 8_000), headline: string(parsed.headline).slice(0, 240) };
}

export async function generateStudioImage(request: StudioImageRequest): Promise<StudioImageResponse> {
  const client = openAiClient();
  const model = process.env.ADMIN_MARKETING_IMAGE_MODEL || resolveAdStudioImageModel();
  const size = request.format === "horizontal" ? "1536x1024" : request.format === "vertical" ? "1024x1536" : "1024x1024";
  try {
    const response = request.references.length
      ? await client.images.edit({
        model, image: await Promise.all(request.references.map(reference => toFile(reference.bytes, reference.name, { type: reference.mimeType }))),
        prompt: request.prompt, size, quality: "medium", background: "opaque", n: 1,
      })
      : await client.images.generate({ model, prompt: request.prompt, size, quality: "medium", background: "opaque", output_format: "png", moderation: "auto", n: 1 });
    const data = response.data?.[0]?.b64_json;
    if (!data) throw new StudioProviderError("The image provider finished without a downloadable image. Check generation details before creating a new version.", "ambiguous");
    return { bytes: Buffer.from(data, "base64"), mimeType: "image/png", model };
  } catch (error) {
    if (error instanceof StudioProviderError) throw error;
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    const rejected = typeof status === "number" && status >= 400 && status < 500 && status !== 408;
    throw new StudioProviderError(
      rejected ? `OpenAI rejected the image request (${status}). ${error instanceof Error ? error.message.slice(0, 700) : "Check model access and billing, then retry."}`
        : "The image request was interrupted and may have completed at the provider. Check usage before explicitly creating another version; it will not be submitted again automatically.",
      rejected ? "rejected" : "ambiguous", status,
    );
  }
}

function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new StudioProviderError("Video generation is not configured. Set GEMINI_API_KEY with access to Gemini Omni Flash, then retry.", "rejected");
  return key;
}

export function parseOmniInteraction(payload: unknown): StudioVideoResponse {
  const data = object(payload);
  const id = string(data.id);
  if (!id) throw new StudioProviderError("Google returned no interaction ID. Check provider usage before explicitly starting another video.", "ambiguous");
  const status = string(data.status);
  const outputs: Record<string, unknown>[] = [];
  for (const step of Array.isArray(data.steps) ? data.steps : []) {
    const record = object(step);
    if (record.type !== "model_output") continue;
    for (const content of Array.isArray(record.content) ? record.content : []) {
      const item = object(content);
      if (item.type === "video") outputs.push(item);
    }
  }
  const output = outputs.at(-1) || object(data.output_video);
  const encoded = string(output.data);
  if (encoded.length > Math.ceil(MAX_VIDEO_BYTES * 4 / 3)) throw new StudioProviderError("Generated video exceeds the studio download limit. Its provider interaction is saved; contact the administrator to retrieve it.", "rejected");
  const failed = ["failed", "cancelled", "requires_action"].includes(status);
  return {
    id, model: string(data.model) || process.env.ADMIN_MARKETING_VIDEO_MODEL || "gemini-omni-1.1-flash",
    status: failed ? "failed" : status === "completed" || output.uri || encoded ? "completed" : "running",
    ...(string(output.uri) ? { videoUri: string(output.uri) } : {}),
    ...(encoded ? { videoBytes: Buffer.from(encoded, "base64") } : {}),
    ...(failed ? { error: string(object(data.error).message) || `Video generation ${status}. Revise the prompt or check Google model access and billing.` } : {}),
  };
}

export type OmniDependencies = { fetch?: typeof fetch; apiKey?: string };

/** Isolated REST adapter; no SDK upgrade or provider submission retries. */
export function createOmniProvider(dependencies: OmniDependencies = {}) {
  const fetcher = dependencies.fetch || fetch;
  const headers = () => ({ "x-goog-api-key": dependencies.apiKey || geminiKey(), "Content-Type": "application/json", "Api-Revision": "2026-05-20" });
  async function requestJson(endpoint: string, body?: object): Promise<unknown> {
    const requestHeaders = headers();
    let response: Response;
    try {
      response = await fetcher(`${GEMINI_BASE}/${endpoint}`, { method: body ? "POST" : "GET", headers: requestHeaders, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45_000), redirect: "error" });
    } catch {
      throw new StudioProviderError(body ? "Google's submission response was interrupted. This request may have been accepted; check provider usage before creating another version." : "Google's status check was interrupted. The saved video interaction will be checked again.", body ? "ambiguous" : "retryable");
    }
    if (!response.ok) {
      const raw: unknown = await response.json().catch(() => null);
      const detail = string(object(object(raw).error).message).slice(0, 600);
      const hasPreviousInteraction = Boolean(body && "previous_interaction_id" in body);
      const expired = [400, 404, 410].includes(response.status) && (/previous.?interaction|interaction.*(?:expired|not found)|context.*expired/i.test(detail)
        || hasPreviousInteraction && [404, 410].includes(response.status) && !/model/i.test(detail));
      const outcome = expired ? "expired_context" : body ? response.status >= 500 || response.status === 408 ? "ambiguous" : "rejected" : response.status >= 500 || response.status === 429 ? "retryable" : "rejected";
      throw new StudioProviderError(`Google video request failed (${response.status}). ${detail || "Check Gemini Omni Flash access, region and billing."}`, outcome, response.status);
    }
    try { return await response.json(); }
    catch { throw new StudioProviderError("Google returned an unreadable response. The request will not be submitted again automatically.", body ? "ambiguous" : "retryable"); }
  }

  return {
    async submit(request: StudioVideoRequest): Promise<StudioVideoResponse> {
      type InputContent = { type: "text"; text: string } | { type: "image" | "video"; data: string; mime_type: string };
      const content: InputContent[] = request.references.map(reference => ({ type: "image", data: reference.bytes.toString("base64"), mime_type: reference.mimeType }));
      if (request.restoredVideo) {
        if (request.restoredVideo.bytes.length > 32 * 1024 * 1024 || !VIDEO_MIMES.has(request.restoredVideo.mimeType)) throw new StudioProviderError("The saved clip cannot be restored automatically. Start a new video from an image or use a clip of 10 seconds or less.", "rejected");
        content.push({ type: "video", data: request.restoredVideo.bytes.toString("base64"), mime_type: request.restoredVideo.mimeType });
      }
      content.push({ type: "text", text: request.prompt });
      const input = content.length === 1 ? request.prompt : [{ type: "user_input", content }];
      return parseOmniInteraction(await requestJson("interactions", {
        model: process.env.ADMIN_MARKETING_VIDEO_MODEL || "gemini-omni-1.1-flash", input, background: true, store: true,
        ...(request.previousInteractionId ? { previous_interaction_id: request.previousInteractionId } : {}),
        response_format: { type: "video", aspect_ratio: request.format === "horizontal" ? "16:9" : "9:16", resolution: "720p", delivery: "uri" },
      }));
    },
    async poll(id: string): Promise<StudioVideoResponse> {
      return parseOmniInteraction(await requestJson(`interactions/${encodeURIComponent(id)}`));
    },
    async download(uri: string): Promise<Buffer | null> {
      const target = googleVideoDownloadUrl(uri);
      const fileId = target.pathname.match(/\/files\/([a-zA-Z0-9_-]+)/)?.[1];
      if (!fileId) throw new StudioProviderError("Google returned an invalid video file reference.", "rejected");
      const file = object(await requestJson(`files/${encodeURIComponent(fileId)}`));
      const state = string(file.state) || string(object(file.state).name);
      if (state === "FAILED") throw new StudioProviderError("Google could not process the generated video. Its interaction is saved; create a new version to try again.", "rejected");
      if (state !== "ACTIVE") return null;
      let response: Response;
      try {
        let downloadTarget = target;
        for (let redirects = 0;; redirects++) {
          // Google may redirect the file to signed storage. API credentials stay on the API host.
          response = await fetcher(downloadTarget, { headers: downloadTarget.hostname === "generativelanguage.googleapis.com" ? headers() : {}, redirect: "manual", signal: AbortSignal.timeout(60_000) });
          if (![301, 302, 303, 307, 308].includes(response.status)) break;
          const location = response.headers.get("location");
          if (!location || redirects >= 3) throw new Error("Invalid download redirect");
          const redirect = new URL(location, downloadTarget);
          const trustedHost = redirect.hostname === "generativelanguage.googleapis.com" || redirect.hostname === "storage.googleapis.com" || redirect.hostname.endsWith(".googleusercontent.com");
          if (redirect.protocol !== "https:" || !trustedHost || redirect.port || redirect.username || redirect.password) throw new Error("Untrusted download redirect");
          downloadTarget = redirect;
        }
      }
      catch { throw new StudioProviderError("Video download was interrupted. The same generated video will be downloaded again.", "retryable"); }
      if (!response.ok) throw new StudioProviderError(`Video download failed (${response.status}). The same saved interaction will be retried.`, "retryable", response.status);
      const size = Number(response.headers.get("content-length") || 0);
      if (size > MAX_VIDEO_BYTES) throw new StudioProviderError("The generated video is too large for the studio. Contact the administrator to retrieve the saved interaction.", "rejected");
      const reader = response.body?.getReader();
      if (!reader) throw new StudioProviderError("Google returned an empty video download.", "retryable");
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          length += chunk.value.length;
          if (length > MAX_VIDEO_BYTES) { await reader.cancel(); throw new StudioProviderError("The generated video exceeds the studio download limit.", "rejected"); }
          chunks.push(chunk.value);
        }
      } catch (error) {
        if (error instanceof StudioProviderError) throw error;
        throw new StudioProviderError("Video download was interrupted. The same generated video will be downloaded again.", "retryable");
      }
      return Buffer.concat(chunks);
    },
  };
}

export function googleVideoDownloadUrl(uri: string): URL {
  let url: URL;
  try { url = new URL(uri.startsWith("files/") ? `${GEMINI_BASE}/${uri}` : uri); }
  catch { throw new StudioProviderError("Google returned an invalid video URI.", "rejected"); }
  if (url.protocol !== "https:" || url.hostname !== "generativelanguage.googleapis.com" || url.port || url.username || url.password || !/^\/(?:download\/)?v1(?:beta)?\/files\/[a-zA-Z0-9_-]+(?::download)?$/.test(url.pathname)) throw new StudioProviderError("Google returned an unsupported video URI. No download was attempted.", "rejected");
  // Do not forward provider-supplied query parameters or credentials.
  url.search = "";
  if (!url.pathname.endsWith(":download")) url.pathname += ":download";
  url.searchParams.set("alt", "media");
  return url;
}
