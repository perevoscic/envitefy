import OpenAI from "openai";
import { normalizeAccessControlPayload } from "@/lib/event-access";
import type { DiscoveryPerformance } from "@/lib/meet-discovery";

type ExtractionMeta = {
  textQuality?: "good" | "suspect" | "poor" | null;
  qualitySignals?: Record<string, unknown> | null;
};

type FootballGameResult = "W" | "L" | "T" | null;
type FootballTravelMode = "bus" | "parent_drive" | "carpool" | "other";

export type FootballParseResult = {
  eventType: "football_game_packet" | "football_season_schedule" | "unknown";
  documentProfile:
    | "game_day_packet"
    | "season_schedule"
    | "travel_itinerary"
    | "roster_sheet"
    | "parent_letter"
    | "unknown";
  title: string;
  summary: string | null;
  dates: string;
  startAt: string | null;
  endAt: string | null;
  timezone: string | null;
  homeTeam: string | null;
  opponent: string | null;
  season: string | null;
  headCoach: string | null;
  venue: string | null;
  address: string | null;
  games: Array<{
    opponent: string;
    date: string | null;
    time: string | null;
    homeAway: "home" | "away" | null;
    venue: string | null;
    address: string | null;
    conference: boolean | null;
    broadcast: string | null;
    ticketsLink: string | null;
    result: FootballGameResult;
    score: string | null;
    notes: string | null;
  }>;
  roster: {
    players: Array<{
      name: string;
      jerseyNumber: string | null;
      position: string | null;
      grade: string | null;
      parentName: string | null;
      parentPhone: string | null;
      parentEmail: string | null;
      medicalNotes: string | null;
      status: "active" | "injured" | "ineligible" | "pending" | null;
    }>;
  };
  practice: {
    blocks: Array<{
      day: string | null;
      date: string | null;
      startTime: string | null;
      endTime: string | null;
      arrivalTime: string | null;
      type:
        | "full_pads"
        | "shells"
        | "helmets"
        | "no_contact"
        | "walk_through"
        | null;
      positionGroups: string[];
      focus: string | null;
      film: boolean | null;
    }>;
  };
  logistics: {
    travelMode: FootballTravelMode | null;
    callTime: string | null;
    departureTime: string | null;
    pickupWindow: string | null;
    parking: string | null;
    hotelName: string | null;
    hotelAddress: string | null;
    mealPlan: string | null;
    weatherPolicy: string | null;
    ticketsLink: string | null;
    broadcast: string | null;
    notes: string[];
  };
  gear: {
    uniform: string | null;
    checklist: string[];
  };
  volunteers: {
    signupLink: string | null;
    notes: string | null;
    slots: Array<{
      role: string;
      name: string | null;
      filled: boolean | null;
      gameDate: string | null;
    }>;
  };
  communications: {
    announcements: Array<{ title: string; body: string }>;
    passcode: string | null;
  };
  links: Array<{ label: string; url: string }>;
  unmappedFacts: Array<{
    category: string;
    detail: string;
    confidence: "high" | "medium" | "low";
  }>;
};

const FOOTBALL_SCHEMA_INSTRUCTIONS = `Return JSON only. Do not wrap in markdown. Follow this exact shape and key names:
{
  "eventType": "football_game_packet" | "football_season_schedule" | "unknown",
  "documentProfile": "game_day_packet" | "season_schedule" | "travel_itinerary" | "roster_sheet" | "parent_letter" | "unknown",
  "title": string,
  "summary": string|null,
  "dates": string,
  "startAt": string|null,
  "endAt": string|null,
  "timezone": string|null,
  "homeTeam": string|null,
  "opponent": string|null,
  "season": string|null,
  "headCoach": string|null,
  "venue": string|null,
  "address": string|null,
  "games": [],
  "roster": { "players": [] },
  "practice": { "blocks": [] },
  "logistics": {
    "travelMode": "bus" | "parent_drive" | "carpool" | "other" | null,
    "callTime": string|null,
    "departureTime": string|null,
    "pickupWindow": string|null,
    "parking": string|null,
    "hotelName": string|null,
    "hotelAddress": string|null,
    "mealPlan": string|null,
    "weatherPolicy": string|null,
    "ticketsLink": string|null,
    "broadcast": string|null,
    "notes": string[]
  },
  "gear": { "uniform": string|null, "checklist": string[] },
  "volunteers": { "signupLink": string|null, "notes": string|null, "slots": [] },
  "communications": { "announcements": [{ "title": string, "body": string }], "passcode": string|null },
  "links": [{ "label": string, "url": string }],
  "unmappedFacts": [{ "category": string, "detail": string, "confidence": "high" | "medium" | "low" }]
}`;

const JSON_STRING = { type: "string" } as const;
const JSON_BOOLEAN = { type: "boolean" } as const;

function jsonNullable(schema: Record<string, unknown>) {
  return { anyOf: [schema, { type: "null" }] };
}

function jsonArray(items: Record<string, unknown>) {
  return { type: "array", items };
}

function jsonObject(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

function resolveDiscoveryParseModel(): string {
  return safeString(process.env.OPENAI_DISCOVERY_PARSE_MODEL) || "gpt-4.1-mini";
}

function normalizeTokenUsage(usage: any) {
  if (!usage || typeof usage !== "object") return null;
  const promptTokens =
    Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0;
  const completionTokens =
    Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0;
  const totalTokens =
    Number(usage.total_tokens ?? promptTokens + completionTokens) || 0;
  if (!promptTokens && !completionTokens && !totalTokens) return null;
  return { promptTokens, completionTokens, totalTokens };
}

function recordParseUsage(performance: DiscoveryPerformance | undefined, usage: any) {
  if (!performance) return;
  const normalized = normalizeTokenUsage(usage);
  if (!normalized) return;
  const existing = performance.tokenUsage?.parse;
  performance.tokenUsage = performance.tokenUsage || {};
  performance.tokenUsage.parse = {
    promptTokens: (existing?.promptTokens || 0) + normalized.promptTokens,
    completionTokens:
      (existing?.completionTokens || 0) + normalized.completionTokens,
    totalTokens: (existing?.totalTokens || 0) + normalized.totalTokens,
    cachedTokens: existing?.cachedTokens || 0,
  };
}

const FOOTBALL_PARSE_JSON_SCHEMA = {
  name: "football_discovery_parse",
  strict: true,
  schema: jsonObject({
    eventType: {
      type: "string",
      enum: ["football_game_packet", "football_season_schedule", "unknown"],
    },
    documentProfile: {
      type: "string",
      enum: [
        "game_day_packet",
        "season_schedule",
        "travel_itinerary",
        "roster_sheet",
        "parent_letter",
        "unknown",
      ],
    },
    title: JSON_STRING,
    summary: jsonNullable(JSON_STRING),
    dates: JSON_STRING,
    startAt: jsonNullable(JSON_STRING),
    endAt: jsonNullable(JSON_STRING),
    timezone: jsonNullable(JSON_STRING),
    homeTeam: jsonNullable(JSON_STRING),
    opponent: jsonNullable(JSON_STRING),
    season: jsonNullable(JSON_STRING),
    headCoach: jsonNullable(JSON_STRING),
    venue: jsonNullable(JSON_STRING),
    address: jsonNullable(JSON_STRING),
    games: jsonArray(
      jsonObject({
        opponent: JSON_STRING,
        date: jsonNullable(JSON_STRING),
        time: jsonNullable(JSON_STRING),
        homeAway: jsonNullable({
          type: "string",
          enum: ["home", "away"],
        }),
        venue: jsonNullable(JSON_STRING),
        address: jsonNullable(JSON_STRING),
        conference: jsonNullable(JSON_BOOLEAN),
        broadcast: jsonNullable(JSON_STRING),
        ticketsLink: jsonNullable(JSON_STRING),
        result: jsonNullable({
          type: "string",
          enum: ["W", "L", "T"],
        }),
        score: jsonNullable(JSON_STRING),
        notes: jsonNullable(JSON_STRING),
      })
    ),
    roster: jsonObject({
      players: jsonArray(
        jsonObject({
          name: JSON_STRING,
          jerseyNumber: jsonNullable(JSON_STRING),
          position: jsonNullable(JSON_STRING),
          grade: jsonNullable(JSON_STRING),
          parentName: jsonNullable(JSON_STRING),
          parentPhone: jsonNullable(JSON_STRING),
          parentEmail: jsonNullable(JSON_STRING),
          medicalNotes: jsonNullable(JSON_STRING),
          status: jsonNullable({
            type: "string",
            enum: ["active", "injured", "ineligible", "pending"],
          }),
        })
      ),
    }),
    practice: jsonObject({
      blocks: jsonArray(
        jsonObject({
          day: jsonNullable(JSON_STRING),
          date: jsonNullable(JSON_STRING),
          startTime: jsonNullable(JSON_STRING),
          endTime: jsonNullable(JSON_STRING),
          arrivalTime: jsonNullable(JSON_STRING),
          type: jsonNullable({
            type: "string",
            enum: [
              "full_pads",
              "shells",
              "helmets",
              "no_contact",
              "walk_through",
            ],
          }),
          positionGroups: jsonArray(JSON_STRING),
          focus: jsonNullable(JSON_STRING),
          film: jsonNullable(JSON_BOOLEAN),
        })
      ),
    }),
    logistics: jsonObject({
      travelMode: jsonNullable({
        type: "string",
        enum: ["bus", "parent_drive", "carpool", "other"],
      }),
      callTime: jsonNullable(JSON_STRING),
      departureTime: jsonNullable(JSON_STRING),
      pickupWindow: jsonNullable(JSON_STRING),
      parking: jsonNullable(JSON_STRING),
      hotelName: jsonNullable(JSON_STRING),
      hotelAddress: jsonNullable(JSON_STRING),
      mealPlan: jsonNullable(JSON_STRING),
      weatherPolicy: jsonNullable(JSON_STRING),
      ticketsLink: jsonNullable(JSON_STRING),
      broadcast: jsonNullable(JSON_STRING),
      notes: jsonArray(JSON_STRING),
    }),
    gear: jsonObject({
      uniform: jsonNullable(JSON_STRING),
      checklist: jsonArray(JSON_STRING),
    }),
    volunteers: jsonObject({
      signupLink: jsonNullable(JSON_STRING),
      notes: jsonNullable(JSON_STRING),
      slots: jsonArray(
        jsonObject({
          role: JSON_STRING,
          name: jsonNullable(JSON_STRING),
          filled: jsonNullable(JSON_BOOLEAN),
          gameDate: jsonNullable(JSON_STRING),
        })
      ),
    }),
    communications: jsonObject({
      announcements: jsonArray(
        jsonObject({
          title: JSON_STRING,
          body: JSON_STRING,
        })
      ),
      passcode: jsonNullable(JSON_STRING),
    }),
    links: jsonArray(
      jsonObject({
        label: JSON_STRING,
        url: JSON_STRING,
      })
    ),
    unmappedFacts: jsonArray(
      jsonObject({
        category: JSON_STRING,
        detail: JSON_STRING,
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      })
    ),
  }),
} as const;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = safeString(getKey(item)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value).replace(/[)\],.;!?]+$/, "");
  if (!raw) return "";
  const withProtocol = /^www\./i.test(raw) ? `https://${raw}` : raw;
  if (!/^https?:\/\//i.test(withProtocol)) return "";
  try {
    const parsed = new URL(withProtocol);
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function toIsoOrNull(value: unknown): string | null {
  const text = safeString(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function splitDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 16),
  };
}

function extractJsonObject(text: string): any | null {
  const parseWithRepairs = (input: string) => {
    try {
      return JSON.parse(input);
    } catch {
      const repaired = input
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
        .replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u");
      try {
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  };
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return parseWithRepairs(text.slice(start, end + 1));
    }
    return parseWithRepairs(text);
  }
}

function buildEmptyParseResult(): FootballParseResult {
  return {
    eventType: "unknown",
    documentProfile: "unknown",
    title: "",
    summary: null,
    dates: "",
    startAt: null,
    endAt: null,
    timezone: null,
    homeTeam: null,
    opponent: null,
    season: null,
    headCoach: null,
    venue: null,
    address: null,
    games: [],
    roster: { players: [] },
    practice: { blocks: [] },
    logistics: {
      travelMode: null,
      callTime: null,
      departureTime: null,
      pickupWindow: null,
      parking: null,
      hotelName: null,
      hotelAddress: null,
      mealPlan: null,
      weatherPolicy: null,
      ticketsLink: null,
      broadcast: null,
      notes: [],
    },
    gear: { uniform: null, checklist: [] },
    volunteers: { signupLink: null, notes: null, slots: [] },
    communications: { announcements: [], passcode: null },
    links: [],
    unmappedFacts: [],
  };
}

function normalizeParseResult(value: any): FootballParseResult | null {
  if (!value || typeof value !== "object") return null;
  const eventType =
    value.eventType === "football_game_packet" ||
    value.eventType === "football_season_schedule"
      ? value.eventType
      : "unknown";
  const documentProfile =
    value.documentProfile === "game_day_packet" ||
    value.documentProfile === "season_schedule" ||
    value.documentProfile === "travel_itinerary" ||
    value.documentProfile === "roster_sheet" ||
    value.documentProfile === "parent_letter"
      ? value.documentProfile
      : "unknown";
  return {
    eventType,
    documentProfile,
    title: safeString(value.title),
    summary: safeString(value.summary) || null,
    dates: safeString(value.dates),
    startAt: toIsoOrNull(value.startAt),
    endAt: toIsoOrNull(value.endAt),
    timezone: safeString(value.timezone) || null,
    homeTeam: safeString(value.homeTeam) || null,
    opponent: safeString(value.opponent) || null,
    season: safeString(value.season) || null,
    headCoach: safeString(value.headCoach) || null,
    venue: safeString(value.venue) || null,
    address: safeString(value.address) || null,
    games: pickArray(value.games)
      .map((item) => ({
        opponent: safeString(item?.opponent),
        date: safeString(item?.date) || null,
        time: safeString(item?.time) || null,
        homeAway:
          item?.homeAway === "home" || item?.homeAway === "away"
            ? item.homeAway
            : null,
        venue: safeString(item?.venue) || null,
        address: safeString(item?.address) || null,
        conference:
          typeof item?.conference === "boolean" ? item.conference : null,
        broadcast: safeString(item?.broadcast) || null,
        ticketsLink: normalizeUrl(item?.ticketsLink) || null,
        result:
          item?.result === "W" || item?.result === "L" || item?.result === "T"
            ? item.result
            : null,
        score: safeString(item?.score) || null,
        notes: safeString(item?.notes) || null,
      }))
      .filter((item) => item.opponent || item.date || item.time || item.venue),
    roster: {
      players: pickArray(value.roster?.players)
        .map((item) => ({
          name: safeString(item?.name),
          jerseyNumber: safeString(item?.jerseyNumber) || null,
          position: safeString(item?.position) || null,
          grade: safeString(item?.grade) || null,
          parentName: safeString(item?.parentName) || null,
          parentPhone: safeString(item?.parentPhone) || null,
          parentEmail: safeString(item?.parentEmail) || null,
          medicalNotes: safeString(item?.medicalNotes) || null,
          status:
            item?.status === "active" ||
            item?.status === "injured" ||
            item?.status === "ineligible" ||
            item?.status === "pending"
              ? item.status
              : null,
        }))
        .filter((item) => item.name),
    },
    practice: {
      blocks: pickArray(value.practice?.blocks)
        .map((item) => ({
          day: safeString(item?.day) || null,
          date: safeString(item?.date) || null,
          startTime: safeString(item?.startTime) || null,
          endTime: safeString(item?.endTime) || null,
          arrivalTime: safeString(item?.arrivalTime) || null,
          type:
            item?.type === "full_pads" ||
            item?.type === "shells" ||
            item?.type === "helmets" ||
            item?.type === "no_contact" ||
            item?.type === "walk_through"
              ? item.type
              : null,
          positionGroups: pickArray(item?.positionGroups)
            .map((entry) => safeString(entry))
            .filter(Boolean),
          focus: safeString(item?.focus) || null,
          film: typeof item?.film === "boolean" ? item.film : null,
        }))
        .filter((item) => item.day || item.date || item.startTime || item.focus),
    },
    logistics: {
      travelMode:
        value.logistics?.travelMode === "bus" ||
        value.logistics?.travelMode === "parent_drive" ||
        value.logistics?.travelMode === "carpool" ||
        value.logistics?.travelMode === "other"
          ? value.logistics.travelMode
          : null,
      callTime: safeString(value.logistics?.callTime) || null,
      departureTime: safeString(value.logistics?.departureTime) || null,
      pickupWindow: safeString(value.logistics?.pickupWindow) || null,
      parking: safeString(value.logistics?.parking) || null,
      hotelName: safeString(value.logistics?.hotelName) || null,
      hotelAddress: safeString(value.logistics?.hotelAddress) || null,
      mealPlan: safeString(value.logistics?.mealPlan) || null,
      weatherPolicy: safeString(value.logistics?.weatherPolicy) || null,
      ticketsLink: normalizeUrl(value.logistics?.ticketsLink) || null,
      broadcast: safeString(value.logistics?.broadcast) || null,
      notes: pickArray(value.logistics?.notes)
        .map((item) => safeString(item))
        .filter(Boolean),
    },
    gear: {
      uniform: safeString(value.gear?.uniform) || null,
      checklist: uniqueBy(
        pickArray(value.gear?.checklist)
          .map((item) => safeString(item))
          .filter(Boolean),
        (item) => item
      ),
    },
    volunteers: {
      signupLink: normalizeUrl(value.volunteers?.signupLink) || null,
      notes: safeString(value.volunteers?.notes) || null,
      slots: pickArray(value.volunteers?.slots)
        .map((item) => ({
          role: safeString(item?.role),
          name: safeString(item?.name) || null,
          filled: typeof item?.filled === "boolean" ? item.filled : null,
          gameDate: safeString(item?.gameDate) || null,
        }))
        .filter((item) => item.role),
    },
    communications: {
      announcements: pickArray(value.communications?.announcements)
        .map((item) => ({
          title: safeString(item?.title),
          body: safeString(item?.body),
        }))
        .filter((item) => item.title || item.body),
      passcode: safeString(value.communications?.passcode) || null,
    },
    links: uniqueBy(
      pickArray(value.links)
        .map((item) => ({
          label: safeString(item?.label) || "Reference link",
          url: normalizeUrl(item?.url),
        }))
        .filter((item) => item.url),
      (item) => item.url
    ),
    unmappedFacts: pickArray(value.unmappedFacts)
      .map((item) => ({
        category: safeString(item?.category) || "general",
        detail: safeString(item?.detail),
        confidence:
          item?.confidence === "high" ||
          item?.confidence === "medium" ||
          item?.confidence === "low"
            ? item.confidence
            : ("medium" as const),
      }))
      .filter((item) => item.detail),
  };
}

function buildFootballParsePrompt(sourceText: string, followup?: string): string {
  const boundedText = sourceText
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .slice(0, 120000);
  return [
    FOOTBALL_SCHEMA_INSTRUCTIONS,
    "",
    "You extract structured football team event data from uploaded packets, schedules, travel sheets, parent letters, and roster documents.",
    "",
    "Classify the document first:",
    "- `football_game_packet`: one opponent/game packet, travel sheet, or game-day memo.",
    "- `football_season_schedule`: full schedule or season slate.",
    "- `unknown`: only when the document is not clearly football-related.",
    "",
    "Field rules:",
    "- Never invent opponents, kickoff times, venues, addresses, or roster entries.",
    "- Keep season schedule rows in `games`.",
    "- Keep single-game logistics in `logistics` and announcements.",
    "- `startAt` should represent the primary kickoff/event start when a single game is evident; otherwise null.",
    "- `dates` should preserve date ranges or the schedule label exactly when present.",
    "- Do not use update stamps or publish stamps as game dates.",
    "- `ticketsLink` and all `links[].url` values must be absolute http/https URLs when possible.",
    "- If a volunteer ask is mentioned but no named slots are listed, keep it in `volunteers.notes`.",
    "- Put leftover factual items in `unmappedFacts` instead of dropping them.",
    "",
    "Return JSON only.",
    "",
    "Source text:",
    boundedText,
    "",
    followup || "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callOpenAiFootballParse(
  text: string,
  performance?: DiscoveryPerformance
): Promise<{ result: FootballParseResult | null; raw: string; usage: any }> {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: resolveDiscoveryParseModel(),
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: FOOTBALL_PARSE_JSON_SCHEMA,
    } as any,
    messages: [
      {
        role: "system",
        content:
          "You extract structured football event data from source text. Return only strict JSON.",
      },
      {
        role: "user",
        content: buildFootballParsePrompt(text),
      },
    ],
  });
  recordParseUsage(performance, completion.usage);
  const raw = completion.choices?.[0]?.message?.content || "";
  return {
    raw,
    result: normalizeParseResult(extractJsonObject(raw)),
    usage: completion.usage || null,
  };
}

async function callGeminiFootballParse(
  text: string
): Promise<{ result: FootballParseResult | null; raw: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  if (!apiKey) throw new Error("Gemini API key is not configured");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    process.env.GEMINI_MODEL || "gemini-1.5-flash"
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildFootballParsePrompt(text) }],
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }
  const json = await response.json();
  const raw = safeString(json?.candidates?.[0]?.content?.parts?.[0]?.text);
  return { raw, result: normalizeParseResult(extractJsonObject(raw)) };
}

export async function parseFootballFromExtractedText(
  extractedText: string,
  extractionMeta: ExtractionMeta,
  options?: { performance?: DiscoveryPerformance }
): Promise<{
  parseResult: FootballParseResult;
  modelUsed: "openai" | "gemini" | "quality-gate";
  rawModelOutput: string;
}> {
  if (extractionMeta.textQuality === "poor") {
    return {
      parseResult: buildEmptyParseResult(),
      modelUsed: "quality-gate",
      rawModelOutput: JSON.stringify({
        skipped: true,
        reason: "poor_extraction_quality",
        qualitySignals: extractionMeta.qualitySignals || null,
      }),
    };
  }

  let openAiRaw = "";
  let openAiErrorMessage = "";
  try {
    const modelStartedAt = Date.now();
    const first = await callOpenAiFootballParse(
      extractedText,
      options?.performance
    );
    if (options?.performance) {
      options.performance.modelParseMs += Date.now() - modelStartedAt;
    }
    openAiRaw = first.raw;
    if (first.result) {
      return {
        parseResult: first.result,
        modelUsed: "openai",
        rawModelOutput: first.raw,
      };
    }
    openAiErrorMessage = "OpenAI returned invalid structured output.";
  } catch (err: any) {
    openAiErrorMessage = String(err?.message || "OpenAI parse failed.");
  }

  const hasGeminiKey = Boolean(
    safeString(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)
  );
  if (!hasGeminiKey) {
    throw new Error(
      openAiErrorMessage ||
        "OpenAI parsing failed and Gemini fallback is not configured."
    );
  }

  const geminiStartedAt = Date.now();
  const gemini = await callGeminiFootballParse(extractedText);
  if (options?.performance) {
    options.performance.modelParseMs += Date.now() - geminiStartedAt;
  }
  if (!gemini.result) {
    throw new Error("Gemini returned invalid JSON");
  }
  return {
    parseResult: gemini.result,
    modelUsed: "gemini",
    rawModelOutput: gemini.raw || openAiRaw,
  };
}

const genId = (prefix: string, idx: number) => `${prefix}-${idx + 1}`;

export function buildDefaultFootballDiscoveryData() {
  return {
    category: "sport_football_season",
    createdVia: "football-discovery",
    createdManually: false,
    templateId: "football-season",
    templateKey: "football",
    date: "",
    time: "",
    timezone: "America/Chicago",
    city: "",
    state: "",
    venue: "",
    details: "",
    rsvpEnabled: true,
    accessControl: {
      mode: "public",
      requirePasscode: false,
      passcodeHint: "",
    },
    customFields: {
      team: "",
      season: "",
      headCoach: "",
      stadium: "",
      stadiumAddress: "",
      advancedSections: {},
    },
    advancedSections: {
      games: { games: [] },
      practice: { blocks: [] },
      roster: { players: [] },
      logistics: {
        travelMode: "bus",
        callTime: "",
        departureTime: "",
        pickupWindow: "",
        hotelName: "",
        hotelAddress: "",
        mealPlan: "",
        weatherPolicy: "",
      },
      gear: { items: [] },
      volunteers: { slots: [] },
      announcements: { items: [] },
    },
    discoverySource: {},
  } as Record<string, any>;
}

export async function mapParseResultToFootballData(
  parseResult: FootballParseResult,
  baseData: any = {}
) {
  const { date, time } = splitDateTime(parseResult.startAt);
  const existingAdvanced = (baseData?.advancedSections as Record<string, any>) || {};
  const existingAnnouncements = pickArray(existingAdvanced?.announcements?.items);

  const mappedGames = uniqueBy(
    (parseResult.games.length
      ? parseResult.games
      : [
          {
            opponent: parseResult.opponent || "",
            date: date || null,
            time: time || null,
            homeAway: null,
            venue: parseResult.venue,
            address: parseResult.address,
            conference: null,
            broadcast: parseResult.logistics.broadcast,
            ticketsLink: parseResult.logistics.ticketsLink,
            result: null,
            score: null,
            notes: parseResult.summary,
          },
        ]
    )
      .map((game, idx) => ({
        id: genId("game", idx),
        opponent: game.opponent || "Opponent TBD",
        date: game.date || "",
        time: game.time || "",
        homeAway: game.homeAway || "home",
        venue: game.venue || parseResult.venue || "",
        address: game.address || parseResult.address || "",
        conference: Boolean(game.conference),
        broadcast: game.broadcast || "",
        ticketsLink: game.ticketsLink || "",
        result: game.result,
        score: game.score || "",
      })),
    (item) =>
      [
        item.opponent,
        item.date,
        item.time,
        item.venue,
        item.address,
        item.homeAway,
      ].join("|")
  );

  const mappedRoster = uniqueBy(
    parseResult.roster.players.map((player, idx) => ({
      id: genId("player", idx),
      name: player.name,
      jerseyNumber: player.jerseyNumber || "",
      position: player.position || "",
      grade: player.grade || "",
      parentName: player.parentName || "",
      parentPhone: player.parentPhone || "",
      parentEmail: player.parentEmail || "",
      medicalNotes: player.medicalNotes || "",
      status: player.status || "active",
    })),
    (item) => [item.name, item.jerseyNumber, item.position].join("|")
  );

  const mappedPractice = parseResult.practice.blocks.map((block, idx) => ({
    id: genId("practice", idx),
    day: block.day || "",
    startTime: block.startTime || "",
    endTime: block.endTime || "",
    arrivalTime: block.arrivalTime || "",
    type: block.type || "full_pads",
    positionGroups: block.positionGroups || [],
    focus: block.focus || "",
    film: Boolean(block.film),
  }));

  const mappedGearItems = uniqueBy(
    parseResult.gear.checklist.map((item, idx) => ({
      id: genId("gear", idx),
      name: item,
      required: true,
      forGames: true,
      forPractice: true,
    })),
    (item) => item.name
  );

  const mappedVolunteerSlots = parseResult.volunteers.slots.map((slot, idx) => ({
    id: genId("volunteer", idx),
    role: slot.role,
    name: slot.name || "",
    filled: Boolean(slot.filled),
    gameDate: slot.gameDate || "",
  }));

  const generatedAnnouncements = uniqueBy(
    [
      ...parseResult.communications.announcements,
      parseResult.summary
        ? { title: "Summary", body: parseResult.summary }
        : null,
      parseResult.logistics.weatherPolicy
        ? { title: "Weather Policy", body: parseResult.logistics.weatherPolicy }
        : null,
      parseResult.logistics.parking
        ? { title: "Parking", body: parseResult.logistics.parking }
        : null,
      parseResult.volunteers.notes
        ? { title: "Volunteers", body: parseResult.volunteers.notes }
        : null,
      ...parseResult.unmappedFacts
        .filter((item) => item.confidence !== "low")
        .map((item) => ({
          title: item.category || "Additional details",
          body: item.detail,
        })),
    ].filter(
      (item): item is { title: string; body: string } =>
        Boolean(item?.title || item?.body)
    ),
    (item) => `${safeString(item.title)}|${safeString(item.body)}`
  );

  const mergedAnnouncements = uniqueBy(
    [
      ...generatedAnnouncements.map((item, idx) => ({
        id: genId("announcement", idx),
        text: [item.title, item.body].filter(Boolean).join("\n\n").trim(),
      })),
      ...existingAnnouncements,
    ],
    (item) => safeString(item?.text || item?.body || item?.title)
  );

  const detailBlocks = uniqueBy(
    [
      parseResult.dates,
      parseResult.summary || "",
      parseResult.logistics.weatherPolicy
        ? `Weather policy: ${parseResult.logistics.weatherPolicy}`
        : "",
      parseResult.logistics.mealPlan
        ? `Meal plan: ${parseResult.logistics.mealPlan}`
        : "",
      parseResult.logistics.parking
        ? `Parking: ${parseResult.logistics.parking}`
        : "",
      parseResult.volunteers.notes
        ? `Volunteer help: ${parseResult.volunteers.notes}`
        : "",
      ...parseResult.logistics.notes,
    ].filter(Boolean),
    (item) => item
  );

  const nextAdvanced = {
    ...existingAdvanced,
    games: {
      ...(existingAdvanced.games || {}),
      games: mappedGames.length ? mappedGames : existingAdvanced?.games?.games || [],
    },
    practice: {
      ...(existingAdvanced.practice || {}),
      blocks: mappedPractice.length
        ? mappedPractice
        : existingAdvanced?.practice?.blocks || [],
    },
    roster: {
      ...(existingAdvanced.roster || {}),
      players: mappedRoster.length ? mappedRoster : existingAdvanced?.roster?.players || [],
    },
    logistics: {
      ...(existingAdvanced.logistics || {}),
      travelMode:
        parseResult.logistics.travelMode ||
        existingAdvanced?.logistics?.travelMode ||
        "bus",
      callTime: parseResult.logistics.callTime || "",
      departureTime: parseResult.logistics.departureTime || "",
      pickupWindow: parseResult.logistics.pickupWindow || "",
      hotelName: parseResult.logistics.hotelName || "",
      hotelAddress: parseResult.logistics.hotelAddress || "",
      mealPlan: parseResult.logistics.mealPlan || "",
      weatherPolicy: parseResult.logistics.weatherPolicy || "",
      parking: parseResult.logistics.parking || "",
      broadcast: parseResult.logistics.broadcast || "",
      ticketsLink: parseResult.logistics.ticketsLink || "",
    },
    gear: {
      ...(existingAdvanced.gear || {}),
      uniform: parseResult.gear.uniform || "",
      items: mappedGearItems.length ? mappedGearItems : existingAdvanced?.gear?.items || [],
    },
    volunteers: {
      ...(existingAdvanced.volunteers || {}),
      signupLink: parseResult.volunteers.signupLink || "",
      notes: parseResult.volunteers.notes || "",
      slots: mappedVolunteerSlots.length
        ? mappedVolunteerSlots
        : existingAdvanced?.volunteers?.slots || [],
    },
    announcements: {
      ...(existingAdvanced.announcements || {}),
      items: mergedAnnouncements,
    },
  };

  const nextAccessControl = parseResult.communications.passcode
    ? await normalizeAccessControlPayload({
        mode: "access-code",
        requirePasscode: true,
        passcodePlain: parseResult.communications.passcode,
      })
    : await normalizeAccessControlPayload({
        mode: "public",
        requirePasscode: false,
      });

  return {
    ...baseData,
    title: parseResult.title || baseData?.title || "Football Event",
    details: uniqueBy(
      [baseData?.details, ...detailBlocks].filter(Boolean),
      (item) => item
    ).join("\n\n"),
    date: date || safeString(baseData?.date) || "",
    time: time || safeString(baseData?.time) || "",
    startISO: parseResult.startAt || null,
    endISO: parseResult.endAt || null,
    timezone: parseResult.timezone || baseData?.timezone || "America/Chicago",
    venue: parseResult.venue || baseData?.venue || "",
    location: parseResult.venue || baseData?.location || "",
    city: safeString(baseData?.city) || "",
    state: safeString(baseData?.state) || "",
    customFields: {
      ...(baseData?.customFields || {}),
      team: parseResult.homeTeam || baseData?.customFields?.team || "",
      season: parseResult.season || baseData?.customFields?.season || "",
      headCoach:
        parseResult.headCoach || baseData?.customFields?.headCoach || "",
      stadium: parseResult.venue || baseData?.customFields?.stadium || "",
      stadiumAddress:
        parseResult.address || baseData?.customFields?.stadiumAddress || "",
      scheduleDateRangeLabel: parseResult.dates || "",
      advancedSections: nextAdvanced,
    },
    extra: {
      ...(baseData?.extra || {}),
      team: parseResult.homeTeam || baseData?.extra?.team || "",
      season: parseResult.season || baseData?.extra?.season || "",
      headCoach: parseResult.headCoach || baseData?.extra?.headCoach || "",
      stadium: parseResult.venue || baseData?.extra?.stadium || "",
      stadiumAddress:
        parseResult.address || baseData?.extra?.stadiumAddress || "",
      scheduleDateRangeLabel: parseResult.dates || "",
    },
    links: uniqueBy(
      [
        ...parseResult.links,
        parseResult.logistics.ticketsLink
          ? { label: "Tickets", url: parseResult.logistics.ticketsLink }
          : null,
      ].filter(
        (item): item is { label: string; url: string } => Boolean(item?.url)
      ),
      (item) => item.url
    ),
    advancedSections: nextAdvanced,
    accessControl: nextAccessControl || baseData?.accessControl || null,
    templateKey: "football",
    templateId: "football-season",
    category: "sport_football_season",
    createdVia: "football-discovery",
    createdManually: false,
  };
}

type Status = "ready" | "in-progress" | "not-started";

function getStatusFromFlags(required: boolean[]): Status {
  const filled = required.filter(Boolean).length;
  if (filled === 0) return "not-started";
  if (filled === required.length) return "ready";
  return "in-progress";
}

export function computeFootballBuilderStatuses(data: any) {
  const adv = data?.advancedSections || {};
  return {
    essentials: {
      eventBasics: getStatusFromFlags([
        Boolean(safeString(data?.title)),
        Boolean(safeString(data?.date || data?.startISO)),
        Boolean(safeString(data?.venue || data?.customFields?.stadium)),
      ]),
      details: getStatusFromFlags([
        Boolean(safeString(data?.details)),
        Boolean(
          safeString(data?.customFields?.team || data?.extra?.team || "")
        ),
      ]),
      design: data?.themeId ? ("ready" as Status) : ("not-started" as Status),
      images: data?.heroImage ? ("ready" as Status) : ("not-started" as Status),
    },
    operations: {
      games:
        Array.isArray(adv?.games?.games) && adv.games.games.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      practice:
        Array.isArray(adv?.practice?.blocks) && adv.practice.blocks.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      roster:
        Array.isArray(adv?.roster?.players) && adv.roster.players.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      logistics: getStatusFromFlags([
        Boolean(
          safeString(
            adv?.logistics?.callTime ||
              adv?.logistics?.departureTime ||
              adv?.logistics?.weatherPolicy ||
              adv?.logistics?.mealPlan
          )
        ),
      ]),
      gear:
        (Array.isArray(adv?.gear?.items) && adv.gear.items.length > 0) ||
        Boolean(safeString(adv?.gear?.uniform))
          ? ("ready" as Status)
          : ("not-started" as Status),
      volunteers:
        (Array.isArray(adv?.volunteers?.slots) && adv.volunteers.slots.length > 0) ||
        Boolean(safeString(adv?.volunteers?.notes))
          ? ("ready" as Status)
          : ("not-started" as Status),
    },
    communication: {
      announcements:
        Array.isArray(adv?.announcements?.items) && adv.announcements.items.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      rsvp: data?.rsvpEnabled ? ("ready" as Status) : ("not-started" as Status),
      passcode:
        data?.accessControl?.requirePasscode || data?.accessControl?.passcodeHash
          ? ("ready" as Status)
          : ("not-started" as Status),
    },
    beforePublish: {
      overview: getStatusFromFlags([
        Boolean(safeString(data?.title)),
        Boolean(safeString(data?.date || data?.startISO)),
        Boolean(
          (Array.isArray(adv?.games?.games) && adv.games.games.length > 0) ||
            (Array.isArray(adv?.roster?.players) && adv.roster.players.length > 0)
        ),
      ]),
    },
  };
}
