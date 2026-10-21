import { EVENT_EXTRACTION_SCHEMA, EVENT_EXTRACTION_RESPONSE_SCHEMA, parseEventExtraction } from "./extraction-contract.ts";
import { classifyOpenAiHttpFailure } from "./failure.ts";
import { creationModelBudget, recordCreationModelRun } from "../creation/openai-workloads.ts";
import { OPENAI_TIMEOUT_MS, resolveOcrModel } from "./constants";
import { openAiChatCompatibilityParams } from "../openai-chat-params.ts";
import { matchesSchema, strictObject } from "../creation/source-evidence.ts";
import { GYMNASTICS_SCHEDULE_SCHEMA, PRACTICE_SCHEDULE_SCHEMA, normalizeGymnasticsScheduleEvent } from "./schedule-contract.ts";
import {
  buildBirthdayRewritePrompt,
  buildEventExtractionPrompt,
  buildGymnasticsSchedulePrompt,
  buildPracticeSchedulePrompt,
  buildSmartRewritePrompt,
  buildWeddingRewritePrompt,
} from "./prompts";
import type {
  EventOcrLlmResult,
  GymnasticsScheduleLlmResult,
  PracticeScheduleLLMResponse,
} from "./types";

export class OpenAiOcrError extends Error {
  code: string;
  status?: number;
  timeoutMs?: number;

  constructor(message: string, options: { code: string; status?: number; timeoutMs?: number }) {
    super(message);
    this.name = "OpenAiOcrError";
    this.code = options.code;
    this.status = options.status;
    this.timeoutMs = options.timeoutMs;
  }
}

async function openAiHttpError(response: Response): Promise<OpenAiOcrError> {
  const body: unknown = await response.json().catch(() => null);
  const code = classifyOpenAiHttpFailure(response.status, body);
  // Retain the cause without logging arbitrary provider bodies or credentials.
  return new OpenAiOcrError(`OpenAI OCR returned ${response.status} (${code})`, {
    code,
    status: response.status,
  });
}

function isAbortLikeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"))
  );
}

export function llmEventToRawText(payload: any): string {
  const parts: string[] = [];
  if (typeof payload?.category === "string" && payload.category.trim())
    parts.push(payload.category.trim());
  if (typeof payload?.title === "string" && payload.title.trim()) parts.push(payload.title.trim());
  if (typeof payload?.start === "string" && payload.start.trim()) parts.push(payload.start.trim());
  if (typeof payload?.end === "string" && payload.end.trim()) parts.push(payload.end.trim());
  if (typeof payload?.address === "string" && payload.address.trim())
    parts.push(payload.address.trim());
  if (typeof payload?.description === "string" && payload.description.trim())
    parts.push(payload.description.trim());
  if (typeof payload?.rsvp === "string" && payload.rsvp.trim()) parts.push(payload.rsvp.trim());
  if (typeof payload?.rsvpUrl === "string" && payload.rsvpUrl.trim())
    parts.push(payload.rsvpUrl.trim());
  if (typeof payload?.rsvpDeadline === "string" && payload.rsvpDeadline.trim())
    parts.push(`RSVP by ${payload.rsvpDeadline.trim()}`);
  if (typeof payload?.hostName === "string" && payload.hostName.trim())
    parts.push(`Hosted by ${payload.hostName.trim()}`);
  if (Array.isArray(payload?.activities)) {
    const activities = payload.activities
      .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    if (activities.length) parts.push(`Activities: ${activities.join(", ")}`);
  }
  if (typeof payload?.attire === "string" && payload.attire.trim())
    parts.push(`Dress code: ${payload.attire.trim()}`);
  if (typeof payload?.registryUrl === "string" && payload.registryUrl.trim())
    parts.push(payload.registryUrl.trim());
  if (Array.isArray(payload?.ocrFacts)) {
    const facts = payload.ocrFacts
      .map((item: unknown) =>
        item && typeof item === "object"
          ? [String((item as any).label || "").trim(), String((item as any).value || "").trim()]
              .filter(Boolean)
              .join(": ")
          : "",
      )
      .filter(Boolean);
    if (facts.length) parts.push(facts.join("\n"));
  }
  if (typeof payload?.goodToKnow === "string" && payload.goodToKnow.trim())
    parts.push(payload.goodToKnow.trim());
  if (payload?.openHouse && typeof payload.openHouse === "object") {
    const openHouse = payload.openHouse;
    for (const key of [
      "price",
      "mlsNumber",
      "bedrooms",
      "bathrooms",
      "sqft",
      "lotSize",
      "propertyType",
      "realtorName",
      "realtorPhone",
      "realtorEmail",
      "agencyName",
      "brokerageName",
      "listingUrl",
      "websiteUrl",
    ] as const) {
      const value = openHouse[key];
      if (typeof value === "string" && value.trim()) parts.push(`${key}: ${value.trim()}`);
    }
    if (Array.isArray(openHouse.features)) {
      const features = openHouse.features
        .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
      if (features.length) parts.push(`Features: ${features.join(", ")}`);
    }
    if (Array.isArray(openHouse.extractedFields)) {
      const extra = openHouse.extractedFields
        .map((item: unknown) =>
          item && typeof item === "object"
            ? [String((item as any).label || "").trim(), String((item as any).value || "").trim()]
                .filter(Boolean)
                .join(": ")
            : "",
        )
        .filter(Boolean);
      if (extra.length) parts.push(extra.join("\n"));
    }
  }
  return parts.join("\n").trim();
}

export async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutError = new OpenAiOcrError(`OpenAI request timed out after ${timeoutMs}ms`, {
    code: "OPENAI_TIMEOUT",
    timeoutMs,
  });
  const timeout = setTimeout(() => controller.abort(timeoutError), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason instanceof OpenAiOcrError) throw reason;
      throw new OpenAiOcrError(`OpenAI request timed out after ${timeoutMs}ms`, {
        code: "OPENAI_TIMEOUT",
        timeoutMs,
      });
    }
    throw new OpenAiOcrError("Could not connect to the OpenAI scan service", {
      code: "OPENAI_NETWORK_ERROR",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getOpenAiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

function buildChatPayload({
  model,
  temperature,
  responseFormat,
  messages,
}: {
  model: string;
  temperature: number;
  responseFormat?: Record<string, unknown>;
  messages: unknown[];
}) {
  return {
    model,
    ...openAiChatCompatibilityParams(model, { temperature }),
    ...(responseFormat ? { response_format: responseFormat } : {}),
    ...(responseFormat?.type === "json_schema" ? creationModelBudget(model, "extraction") : {}),
    messages,
  };
}

function parseOcrOutput<T>(completion: any, schema: object, normalize: (value: any) => T | null): {
  outcome: "success" | "invalid_output" | "refused" | "incomplete";
  value: T | null;
} {
  const choice = completion?.choices?.[0];
  if (choice?.message?.refusal) return { outcome: "refused", value: null };
  if (choice?.finish_reason !== "stop") return { outcome: "incomplete", value: null };
  try {
    const parsed: unknown = JSON.parse(choice.message.content || "null");
    const value = matchesSchema(parsed, schema) ? normalize(parsed) : null;
    return { outcome: value === null ? "invalid_output" : "success", value };
  } catch {
    return { outcome: "invalid_output", value: null };
  }
}

export async function llmExtractEventFromImage(
  imageBytes: Buffer,
  mime: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
  modelOverride?: string,
): Promise<EventOcrLlmResult | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    console.error(">>> OpenAI API key not found in environment");
    return null;
  }
  const model = modelOverride || resolveOcrModel();
  const debug = process.env.NODE_ENV !== "production";
  const log = (...args: any[]) => {
    if (debug) console.log(...args);
  };
  log(">>> Using OpenAI model:", model);

  const base64 = imageBytes.toString("base64");
  const startedAt = Date.now();
  const todayIso = new Date().toISOString().slice(0, 10);
  const prompt = buildEventExtractionPrompt(todayIso);

  try {
    log(">>> Making OpenAI Vision API call...");
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0.1,
            responseFormat: { type: "json_schema", json_schema: { name: "event_source_v2", strict: true, schema: EVENT_EXTRACTION_RESPONSE_SCHEMA } },
            messages: [
              { role: "system", content: prompt.system },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt.user },
                  { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
                ],
              },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    log(">>> OpenAI API response status:", res.status);
    if (!res.ok) {
      throw await openAiHttpError(res);
    }
    const j: any = await res.json();
    log(">>> OpenAI API response received");
    const result = parseOcrOutput(j, EVENT_EXTRACTION_SCHEMA, parseEventExtraction);
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: result.outcome, usage: j?.usage, requestId: res.headers.get("x-request-id") });
    const parsed = result.value;
    if (parsed) {
      if (
        parsed.title &&
        parsed.birthdayAge != null &&
        /birthday/i.test(parsed.title) &&
        !/\d{1,2}(st|nd|rd|th)/i.test(parsed.title)
      ) {
        log(">>> ⚠️ WARNING: Birthday title is missing age ordinal:", parsed.title);
      }
      return parsed;
    }
    return null;
  } catch (err) {
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: "error" });
    console.error(">>> OpenAI Vision API exception:", err);
    if (err instanceof OpenAiOcrError || isAbortLikeError(err)) {
      throw err;
    }
    return null;
  }
}

export async function llmExtractVisibleTextFromImage(
  imageBytes: Buffer,
  mime: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
  modelOverride?: string,
): Promise<string | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    console.error(">>> OpenAI API key not found in environment");
    return null;
  }
  const model = modelOverride || resolveOcrModel();
  const debug = process.env.NODE_ENV !== "production";
  const log = (...args: any[]) => {
    if (debug) console.log(...args);
  };
  const base64 = imageBytes.toString("base64");
  const startedAt = Date.now();
  const schema = strictObject({ text: { type: "string" } });

  try {
    log(">>> Making OpenAI visible-text OCR call...");
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0,
            responseFormat: { type: "json_schema", json_schema: { name: "visible_source_text", strict: true, schema } },
            messages: [
              {
                role: "system",
                content:
                  'You are a precise OCR engine. Return strict JSON {"text": string}. Extract only visible printed text from the image, preserving line breaks and labels. Do not infer missing dates, locations, names, or descriptions. If no readable text is visible, return {"text": ""}.',
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: 'Return only strict JSON {"text": string} with the visible text in reading order.',
                  },
                  { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
                ],
              },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    log(">>> OpenAI visible-text OCR response status:", res.status);
    if (!res.ok) {
      throw await openAiHttpError(res);
    }
    const j: any = await res.json();
    const result = parseOcrOutput(j, schema, (parsed) => parsed.text.trim() || null);
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: result.outcome, usage: j?.usage, requestId: res.headers.get("x-request-id") });
    return result.value;
  } catch (err) {
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: "error" });
    console.error(">>> OpenAI visible-text OCR exception:", err);
    if (err instanceof OpenAiOcrError || isAbortLikeError(err)) {
      throw err;
    }
    return null;
  }
}

export async function llmExtractGymnasticsScheduleFromImage(
  imageBytes: Buffer,
  mime: string,
  timezone: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
): Promise<GymnasticsScheduleLlmResult | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;
  const model = resolveOcrModel();
  const base64 = imageBytes.toString("base64");
  const prompt = buildGymnasticsSchedulePrompt(timezone);
  const startedAt = Date.now();

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0.1,
            responseFormat: { type: "json_schema", json_schema: { name: "gymnastics_schedule", strict: true, schema: GYMNASTICS_SCHEDULE_SCHEMA } },
            messages: [
              { role: "system", content: prompt.system },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt.user },
                  { type: "image_url", image_url: { url: `data:${mime};base64,${base64}`, detail: "high" } },
                ],
              },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    if (!res.ok) throw await openAiHttpError(res);
    const j: any = await res.json();
    const result = parseOcrOutput<GymnasticsScheduleLlmResult>(j, GYMNASTICS_SCHEDULE_SCHEMA, (parsed) => ({
      season: parsed.season, homeTeam: parsed.homeTeam, homeAddress: parsed.homeAddress,
      events: parsed.events.map((event: unknown) => normalizeGymnasticsScheduleEvent(event, timezone)),
    }));
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: result.outcome, usage: j?.usage, requestId: res.headers.get("x-request-id") });
    return result.value;
  } catch {
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: "error" });
    return null;
  }
}

export async function llmExtractPracticeScheduleFromImage(
  imageBytes: Buffer,
  mime: string,
  timezone: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
): Promise<PracticeScheduleLLMResponse | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;
  const model = resolveOcrModel();
  const base64 = imageBytes.toString("base64");
  const prompt = buildPracticeSchedulePrompt(timezone);
  const startedAt = Date.now();

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0.1,
            responseFormat: { type: "json_schema", json_schema: { name: "practice_schedule", strict: true, schema: PRACTICE_SCHEDULE_SCHEMA } },
            messages: [
              { role: "system", content: prompt.system },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt.user },
                  { type: "image_url", image_url: { url: `data:${mime};base64,${base64}`, detail: "high" } },
                ],
              },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    if (!res.ok) throw await openAiHttpError(res);
    const j: any = await res.json();
    const result = parseOcrOutput<PracticeScheduleLLMResponse>(j, PRACTICE_SCHEDULE_SCHEMA, (parsed) => parsed);
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: result.outcome, usage: j?.usage, requestId: res.headers.get("x-request-id") });
    return result.value;
  } catch {
    recordCreationModelRun({ workload: "extraction", model, startedAt, outcome: "error" });
    return null;
  }
}

export async function llmRewriteBirthdayDescription(
  title: string,
  location: string,
  description: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
): Promise<string | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-5.6-luna";
  const prompt = buildBirthdayRewritePrompt(title, location, description);

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0.2,
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    const text = (j?.choices?.[0]?.message?.content || "").trim();
    if (!text) return null;
    return text.replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

export async function llmRewriteWedding(
  rawText: string,
  _title: string,
  location: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
): Promise<{ title: string; description: string } | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-5.6-luna";
  const prompt = buildWeddingRewritePrompt(rawText, location);

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0.2,
            responseFormat: { type: "json_object" },
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) return null;
    const parsed = JSON.parse(text);
    const title = String(parsed?.title || "").trim();
    let description = String(parsed?.description || "").trim();
    const rawLower = (rawText || "").toLowerCase();
    if (!/parents?/i.test(rawLower)) {
      description = description
        .replace(/\s*together with their parents\s*/i, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
    if (!title || !description) return null;
    return { title: title.slice(0, 120), description: description.slice(0, 600) };
  } catch {
    return null;
  }
}

export async function llmRewriteSmartDescription(
  rawText: string,
  title: string,
  location: string,
  category: string | null,
  baseline: string,
  timeoutMs = OPENAI_TIMEOUT_MS,
): Promise<string | null> {
  const apiKey = getOpenAiKey();
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-5.6-luna";
  const prompt = buildSmartRewritePrompt(rawText, title, location, category, baseline);

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(
          buildChatPayload({
            model,
            temperature: 0.2,
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
          }),
        ),
      },
      timeoutMs,
    );
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    const text = (j?.choices?.[0]?.message?.content || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 200) return null;
    return /\.$/.test(text) ? text : `${text}.`;
  } catch {
    return null;
  }
}
