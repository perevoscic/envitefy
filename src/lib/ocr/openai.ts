import { OPENAI_TIMEOUT_MS, resolveOcrModel } from "./constants";
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

export function llmEventToRawText(payload: any): string {
  const parts: string[] = [];
  if (typeof payload?.title === "string" && payload.title.trim()) parts.push(payload.title.trim());
  if (typeof payload?.start === "string" && payload.start.trim()) parts.push(payload.start.trim());
  if (typeof payload?.end === "string" && payload.end.trim()) parts.push(payload.end.trim());
  if (typeof payload?.address === "string" && payload.address.trim())
    parts.push(payload.address.trim());
  if (typeof payload?.description === "string" && payload.description.trim())
    parts.push(payload.description.trim());
  if (typeof payload?.rsvp === "string" && payload.rsvp.trim()) parts.push(payload.rsvp.trim());
  if (typeof payload?.goodToKnow === "string" && payload.goodToKnow.trim())
    parts.push(payload.goodToKnow.trim());
  return parts.join("\n").trim();
}

export async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function getOpenAiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
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
  const todayIso = new Date().toISOString().slice(0, 10);
  const prompt = buildEventExtractionPrompt(todayIso);

  try {
    log(">>> Making OpenAI Vision API call...");
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
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
      },
      timeoutMs,
    );
    log(">>> OpenAI API response status:", res.status);
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(">>> OpenAI API error:", { status: res.status, body: errorBody });
      return null;
    }
    const j: any = await res.json();
    log(">>> OpenAI API response received");
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) {
      console.warn(">>> OpenAI returned no content");
      return null;
    }
    try {
      const parsed = JSON.parse(text) as EventOcrLlmResult;
      log(">>> OpenAI extracted data:", parsed);
      log(">>> OpenAI title:", parsed.title);
      log(">>> OpenAI description:", parsed.description);
      if (parsed.title && /birthday/i.test(parsed.title) && !/\d{1,2}(st|nd|rd|th)/i.test(parsed.title)) {
        log(">>> ⚠️ WARNING: Birthday title is missing age ordinal:", parsed.title);
      }
      return parsed;
    } catch (parseErr) {
      console.error(">>> Failed to parse OpenAI JSON:", parseErr, "Raw:", text);
      return null;
    }
  } catch (err) {
    console.error(">>> OpenAI Vision API exception:", err);
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

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.system },
            {
              role: "user",
              content: [
                { type: "text", text: prompt.user },
                { type: "input_image", image_url: { url: `data:${mime};base64,${base64}` } },
              ],
            },
          ],
        }),
      },
      timeoutMs,
    );
    if (!res.ok) return null;
    const j: any = await res.json();
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as GymnasticsScheduleLlmResult;
      const events = Array.isArray(parsed?.events) ? parsed.events : [];
      const normalize = (ev: any) => {
        const title = String(ev?.title || "Meet").slice(0, 120);
        const loc = typeof ev?.location === "string" ? ev.location : "";
        const startIso = typeof ev?.start === "string" ? ev.start : null;
        const endIso = typeof ev?.end === "string" ? ev.end : null;
        let s = startIso;
        let e = endIso;
        try {
          if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
            s = new Date(`${s}T00:00:00.000Z`).toISOString();
            const d = new Date(s);
            e = new Date(
              Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1),
            ).toISOString();
          }
        } catch {}
        return {
          title,
          start: s || new Date().toISOString(),
          end: e || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          allDay: Boolean(ev?.allDay ?? true),
          timezone,
          location: loc,
          description: typeof ev?.description === "string" ? ev.description.slice(0, 600) : "",
        };
      };
      return {
        season: parsed?.season ?? null,
        homeTeam: parsed?.homeTeam ?? null,
        homeAddress: parsed?.homeAddress ?? null,
        events: events.map(normalize),
      };
    } catch {
      return null;
    }
  } catch {
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

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.system },
            {
              role: "user",
              content: [
                { type: "text", text: prompt.user },
                { type: "input_image", image_url: { url: `data:${mime};base64,${base64}` } },
              ],
            },
          ],
        }),
      },
      timeoutMs,
    );
    if (!res.ok) return null;
    const j: any = await res.json();
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) return null;
    try {
      return JSON.parse(text) as PracticeScheduleLLMResponse;
    } catch {
      return null;
    }
  } catch {
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
  const model = process.env.LLM_MODEL || "gpt-5.1-mini";
  const prompt = buildBirthdayRewritePrompt(title, location, description);

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
        }),
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
  const model = process.env.LLM_MODEL || "gpt-5.1-mini";
  const prompt = buildWeddingRewritePrompt(rawText, location);

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
        }),
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
  const model = process.env.LLM_MODEL || "gpt-5.1-mini";
  const prompt = buildSmartRewritePrompt(rawText, title, location, category, baseline);

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
        }),
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
