import OpenAI from "openai";
import sharp from "sharp";
import { inflateRawSync, inflateSync } from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { getVisionClient } from "@/lib/gcp";
import { normalizeAccessControlPayload } from "@/lib/event-access";

export type DiscoverySourceInput =
  | {
      type: "file";
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    }
  | {
      type: "url";
      url: string;
    };

export type ParseResult = {
  eventType: "gymnastics_meet" | "unknown";
  title: string;
  dates: string;
  startAt: string | null;
  endAt: string | null;
  timezone: string | null;
  venue: string | null;
  address: string | null;
  hostGym: string | null;
  admission: Array<{ label: string; price: string; note: string | null }>;
  athlete: {
    name: string | null;
    level: string | null;
    team: string | null;
    session: string | null;
    competitionDate: string | null;
    stretchTime: string | null;
    marchIn: string | null;
    assignedGym: string | null;
    awards: string | null;
  };
  meetDetails: {
    warmup: string | null;
    marchIn: string | null;
    rotationOrder: string | null;
    judgingNotes: string | null;
  };
  logistics: {
    parking: string | null;
    trafficAlerts: string | null;
    hotel: string | null;
    meals: string | null;
    fees: string | null;
    waivers: string | null;
  };
  gear: {
    uniform: string | null;
    checklist: string[];
  };
  volunteers: {
    signupLink: string | null;
    notes: string | null;
  };
  communications: {
    announcements: Array<{ title: string; body: string }>;
    passcode: string | null;
  };
  links: Array<{ label: string; url: string }>;
};

type ExtractionResult = {
  extractedText: string;
  extractionMeta: {
    sourceType: "file" | "url";
    usedOcr: boolean;
    linkedAssets: Array<{ url: string; contentType: string }>;
    pageTitle?: string | null;
  };
};

const MAX_LINKED_ASSETS = 4;
const MAX_FETCH_BYTES = 7 * 1024 * 1024;
const LOW_TEXT_THRESHOLD = 200;
const execFileAsync = promisify(execFile);

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toIsoOrNull(value: unknown): string | null {
  const asText = safeString(value);
  if (!asText) return null;
  const d = new Date(asText);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function extractPdfTextHeuristic(buffer: Buffer): string {
  const decodePdfFragment = (value: string) =>
    value
      .replace(/\\([0-7]{1,3})/g, (_m, oct) =>
        String.fromCharCode(parseInt(oct, 8))
      )
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .trim();
  const collectParenthesizedText = (input: string) =>
    (input.match(/\(([^()]{3,600})\)/g) || [])
      .map((item) => decodePdfFragment(item.slice(1, -1)))
      .filter(Boolean);

  // Collect text snippets from direct and flate-compressed streams.
  const raw = buffer.toString("latin1");
  const snippets: string[] = [...collectParenthesizedText(raw)];
  let cursor = 0;
  let scanned = 0;
  while (scanned < 300) {
    const streamIdx = raw.indexOf("stream", cursor);
    if (streamIdx < 0) break;
    const lineEnd = raw.indexOf("\n", streamIdx);
    if (lineEnd < 0) break;
    const endIdx = raw.indexOf("endstream", lineEnd);
    if (endIdx < 0) break;
    cursor = endIdx + 9;
    scanned += 1;

    const streamText = raw.slice(lineEnd + 1, endIdx).replace(/\r/g, "");
    const streamBuf = Buffer.from(streamText, "latin1");
    const maybeDecoded: Buffer[] = [];
    try {
      maybeDecoded.push(inflateSync(streamBuf));
    } catch {
      // no-op
    }
    try {
      maybeDecoded.push(inflateRawSync(streamBuf));
    } catch {
      // no-op
    }
    for (const decoded of maybeDecoded) {
      const decodedRaw = decoded.toString("latin1");
      snippets.push(...collectParenthesizedText(decodedRaw));
    }
  }
  return snippets.join("\n");
}

function cleanExtractedText(text: string): string {
  return (text || "")
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isLikelyReadableText(text: string): boolean {
  const candidate = cleanExtractedText(text);
  if (!candidate || candidate.length < 120) return false;
  const sample = candidate.slice(0, 5000);
  const controlChars = (sample.match(/[\u0000-\u001F\u007F-\u009F]/g) || []).length;
  const tokens = candidate.split(/\s+/).filter(Boolean);
  const englishLikeTokens = tokens.filter((token) =>
    /^[A-Za-z][A-Za-z'’-]{1,24}$/.test(token)
  ).length;
  const controlRatio = controlChars / Math.max(sample.length, 1);
  const englishLikeRatio = englishLikeTokens / Math.max(tokens.length, 1);
  return controlRatio < 0.02 && englishLikeRatio > 0.25 && tokens.length > 30;
}

async function extractPdfTextWithNodeWorker(buffer: Buffer): Promise<string> {
  let tempDir = "";
  try {
    tempDir = await mkdtemp(join(tmpdir(), "envitefy-pdf-"));
    const filePath = join(tempDir, "input.pdf");
    await writeFile(filePath, buffer);
    const workerScript = `
const { readFileSync } = require("fs");
const { PDFParse } = require("pdf-parse");
(async () => {
  const data = readFileSync(process.argv[1]);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  if (typeof parser.destroy === "function") await parser.destroy();
  process.stdout.write(JSON.stringify({ text: result?.text || "" }));
})().catch((error) => {
  process.stderr.write(String(error?.message || error));
  process.exit(1);
});
`;
    const { stdout } = await execFileAsync(process.execPath, ["-e", workerScript, filePath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    const payload = JSON.parse(stdout || "{}");
    return cleanExtractedText(String(payload?.text || ""));
  } catch {
    return "";
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

async function ocrBuffer(buffer: Buffer): Promise<string> {
  const vision = getVisionClient();
  const [result] = await vision.textDetection({
    image: { content: buffer },
    imageContext: { languageHints: ["en"] },
  });
  return (
    result.fullTextAnnotation?.text ||
    result.textAnnotations?.[0]?.description ||
    ""
  ).trim();
}

async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; usedOcr: boolean }> {
  const workerText = await extractPdfTextWithNodeWorker(buffer);
  if (workerText.length >= LOW_TEXT_THRESHOLD && isLikelyReadableText(workerText)) {
    return { text: workerText, usedOcr: false };
  }

  const heuristicText = cleanExtractedText(extractPdfTextHeuristic(buffer));
  if (heuristicText.length >= LOW_TEXT_THRESHOLD && isLikelyReadableText(heuristicText)) {
    return { text: heuristicText, usedOcr: false };
  }

  try {
    const ocrPages: string[] = [];
    for (let page = 0; page < 5; page += 1) {
      try {
        const pageImage = await sharp(buffer, { density: 220, page }).png().toBuffer();
        const text = cleanExtractedText(await ocrBuffer(pageImage));
        if (text) ocrPages.push(text);
      } catch {
        break;
      }
    }
    const ocrText = cleanExtractedText(ocrPages.join("\n\n"));
    if (ocrText.length > 0) {
      return { text: ocrText, usedOcr: true };
    }
  } catch {
    // final fallback below
  }
  const ocrText = cleanExtractedText(await ocrBuffer(buffer));
  if (ocrText.length > 0) {
    return { text: ocrText, usedOcr: true };
  }
  // Keep best-effort heuristic output rather than hard failing with empty text.
  return { text: heuristicText, usedOcr: false };
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const prepared = await sharp(buffer).resize(2200).grayscale().normalize().toBuffer();
  return ocrBuffer(prepared);
}

function stripHtml(input: string): string {
  const noScript = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withBreaks = noScript
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  return withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractMetadataText(html: string): string {
  const snippets: string[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) snippets.push(stripHtml(titleMatch[1]));
  const metaRegex =
    /<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description|twitter:title|twitter:description)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = metaRegex.exec(html))) {
    if (match[1]) snippets.push(stripHtml(match[1]));
  }
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html))) {
    const content = safeString(match[1]);
    if (content) snippets.push(content);
  }
  return snippets.filter(Boolean).join("\n\n");
}

function assetUrlFromHref(base: URL, href: string): URL | null {
  try {
    const next = new URL(href, base);
    if (next.protocol !== "http:" && next.protocol !== "https:") return null;
    if (next.host !== base.host) return null;
    return next;
  } catch {
    return null;
  }
}

function collectLinkedAssets(html: string, baseUrl: URL): URL[] {
  const links: URL[] = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null = null;
  while ((match = hrefRegex.exec(html))) {
    const url = assetUrlFromHref(baseUrl, match[1]);
    if (!url) continue;
    if (!/\.(pdf|png|jpg|jpeg|webp)(\?|#|$)/i.test(url.href)) continue;
    if (!links.find((existing) => existing.href === url.href)) {
      links.push(url);
    }
    if (links.length >= MAX_LINKED_ASSETS) break;
  }
  return links;
}

async function fetchWithLimit(url: string): Promise<{ contentType: string; buffer: Buffer; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const response = await fetch(url, {
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EnvitefyBot/1.0; +https://envitefy.com)",
    },
    cache: "no-store",
  });
  clearTimeout(timeout);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }
  const contentType = response.headers.get("content-type") || "";
  const arr = new Uint8Array(await response.arrayBuffer());
  const sliced = arr.slice(0, Math.min(arr.length, MAX_FETCH_BYTES));
  const buffer = Buffer.from(sliced);
  let text = "";
  if (/text\/html|text\/plain|application\/json|application\/ld\+json/i.test(contentType)) {
    text = buffer.toString("utf8");
  }
  return { contentType, buffer, text };
}

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) return null;
  try {
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

export function buildDefaultGymMeetData() {
  return {
    category: "sport_gymnastics_schedule",
    createdVia: "meet-discovery",
    createdManually: false,
    templateId: "gymnastics-schedule",
    templateKey: "gymnastics",
    date: "",
    time: "",
    timezone: "America/Chicago",
    hostGym: "",
    venue: "",
    address: "",
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
      coach: "",
      assistantCoach: "",
      coachPhone: "",
      advancedSections: {},
    },
    advancedSections: {
      roster: { enabled: true, showAttendance: true, athletes: [], showMedical: false },
      meet: {
        sessionNumber: "",
        warmUpTime: "",
        marchInTime: "",
        startApparatus: "",
        rotationOrder: [],
        judgingNotes: "",
        scoresLink: "",
      },
      practice: { enabled: true, blocks: [], excusedAthletes: [], modifiedTraining: [] },
      logistics: {
        enabled: true,
        showTransportation: true,
        showAccommodations: true,
        showFees: true,
        showMeals: true,
        showAdditionalDocuments: true,
        travelMode: "",
        callTime: "",
        pickupWindow: "",
        hotelName: "",
        hotelAddress: "",
        hotelCheckIn: "",
        mealPlan: "",
        feeDueDate: "",
        feeAmount: "",
        additionalDocuments: [],
      },
      gear: {
        leotardOfDay: "",
        hairMakeupNotes: "",
        musicFileLink: "",
        items: [],
      },
      volunteers: {
        enabled: true,
        showVolunteerSlots: true,
        showCarpool: true,
        volunteerSlots: [],
        carpoolOffers: [],
        signupLink: "",
        notes: "",
      },
      announcements: { announcements: [] },
    },
    discoverySource: {},
  } as Record<string, any>;
}

export async function extractDiscoveryText(input: DiscoverySourceInput): Promise<ExtractionResult> {
  if (input.type === "file") {
    const parsed = parseDataUrl(input.dataUrl);
    if (!parsed) throw new Error("Invalid file payload");
    const mime = (parsed.mimeType || input.mimeType || "").toLowerCase();
    if (/pdf/.test(mime)) {
      const { text, usedOcr } = await extractTextFromPdf(parsed.buffer);
      return {
        extractedText: text,
        extractionMeta: { sourceType: "file", usedOcr, linkedAssets: [] },
      };
    }
    if (/image\/(png|jpe?g|webp)/.test(mime)) {
      const text = await extractTextFromImage(parsed.buffer);
      return {
        extractedText: text,
        extractionMeta: { sourceType: "file", usedOcr: true, linkedAssets: [] },
      };
    }
    throw new Error("Unsupported file type for discovery");
  }

  const url = new URL(input.url);
  const page = await fetchWithLimit(url.toString());
  const html = page.text || page.buffer.toString("utf8");
  const readable = stripHtml(html);
  const metadata = extractMetadataText(html);
  const linkedAssets = collectLinkedAssets(html, url);
  const linkedChunks: string[] = [];
  const linkedMeta: Array<{ url: string; contentType: string }> = [];
  let usedOcr = false;

  for (const asset of linkedAssets) {
    try {
      const fetched = await fetchWithLimit(asset.toString());
      linkedMeta.push({ url: asset.toString(), contentType: fetched.contentType });
      if (/pdf/i.test(fetched.contentType) || /\.pdf(\?|#|$)/i.test(asset.pathname)) {
        const parsed = await extractTextFromPdf(fetched.buffer);
        linkedChunks.push(parsed.text);
        usedOcr = usedOcr || parsed.usedOcr;
        continue;
      }
      if (
        /image\/(png|jpe?g|webp)/i.test(fetched.contentType) ||
        /\.(png|jpe?g|webp)(\?|#|$)/i.test(asset.pathname)
      ) {
        const imageText = await extractTextFromImage(fetched.buffer);
        linkedChunks.push(imageText);
        usedOcr = true;
      }
    } catch {
      // Best-effort linked assets.
    }
  }

  const fullText = [metadata, readable, ...linkedChunks]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .trim();

  return {
    extractedText: fullText,
    extractionMeta: {
      sourceType: "url",
      usedOcr,
      linkedAssets: linkedMeta,
      pageTitle: safeString(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
    },
  };
}

const OPENAI_SCHEMA_INSTRUCTIONS = `Return JSON only. Do not wrap in markdown. Follow this exact shape and key names:
{
  "eventType": "gymnastics_meet" | "unknown",
  "title": string,
  "dates": string,
  "startAt": string|null,
  "endAt": string|null,
  "timezone": string|null,
  "venue": string|null,
  "address": string|null,
  "hostGym": string|null,
  "admission": [{ "label": string, "price": string, "note": string|null }],
  "athlete": {
    "name": string|null, "level": string|null, "team": string|null, "session": string|null,
    "competitionDate": string|null, "stretchTime": string|null, "marchIn": string|null,
    "assignedGym": string|null, "awards": string|null
  },
  "meetDetails": {
    "warmup": string|null, "marchIn": string|null, "rotationOrder": string|null, "judgingNotes": string|null
  },
  "logistics": {
    "parking": string|null, "trafficAlerts": string|null, "hotel": string|null,
    "meals": string|null, "fees": string|null, "waivers": string|null
  },
  "gear": { "uniform": string|null, "checklist": [string] },
  "volunteers": { "signupLink": string|null, "notes": string|null },
  "communications": {
    "announcements": [{ "title": string, "body": string }],
    "passcode": string|null
  },
  "links": [{ "label": string, "url": string }]
}`;

function normalizeParseResult(value: any): ParseResult | null {
  if (!value || typeof value !== "object") return null;
  const eventType = value.eventType === "gymnastics_meet" ? "gymnastics_meet" : "unknown";
  const title = safeString(value.title) || "Gymnastics Meet";
  const dates = safeString(value.dates) || "Date TBD";
  return {
    eventType,
    title,
    dates,
    startAt: toIsoOrNull(value.startAt),
    endAt: toIsoOrNull(value.endAt),
    timezone: safeString(value.timezone) || null,
    venue: safeString(value.venue) || null,
    address: safeString(value.address) || null,
    hostGym: safeString(value.hostGym) || null,
    admission: pickArray(value.admission).map((item) => ({
      label: safeString(item?.label),
      price: safeString(item?.price),
      note: safeString(item?.note) || null,
    })),
    athlete: {
      name: safeString(value.athlete?.name) || null,
      level: safeString(value.athlete?.level) || null,
      team: safeString(value.athlete?.team) || null,
      session: safeString(value.athlete?.session) || null,
      competitionDate: safeString(value.athlete?.competitionDate) || null,
      stretchTime: safeString(value.athlete?.stretchTime) || null,
      marchIn: safeString(value.athlete?.marchIn) || null,
      assignedGym: safeString(value.athlete?.assignedGym) || null,
      awards: safeString(value.athlete?.awards) || null,
    },
    meetDetails: {
      warmup: safeString(value.meetDetails?.warmup) || null,
      marchIn: safeString(value.meetDetails?.marchIn) || null,
      rotationOrder: safeString(value.meetDetails?.rotationOrder) || null,
      judgingNotes: safeString(value.meetDetails?.judgingNotes) || null,
    },
    logistics: {
      parking: safeString(value.logistics?.parking) || null,
      trafficAlerts: safeString(value.logistics?.trafficAlerts) || null,
      hotel: safeString(value.logistics?.hotel) || null,
      meals: safeString(value.logistics?.meals) || null,
      fees: safeString(value.logistics?.fees) || null,
      waivers: safeString(value.logistics?.waivers) || null,
    },
    gear: {
      uniform: safeString(value.gear?.uniform) || null,
      checklist: pickArray(value.gear?.checklist).map((item) => safeString(item)).filter(Boolean),
    },
    volunteers: {
      signupLink: safeString(value.volunteers?.signupLink) || null,
      notes: safeString(value.volunteers?.notes) || null,
    },
    communications: {
      announcements: pickArray(value.communications?.announcements)
        .map((item) => ({ title: safeString(item?.title), body: safeString(item?.body) }))
        .filter((item) => item.title || item.body),
      passcode: safeString(value.communications?.passcode) || null,
    },
    links: pickArray(value.links)
      .map((item) => ({ label: safeString(item?.label), url: safeString(item?.url) }))
      .filter((item) => item.url),
  };
}

function extractJsonObject(text: string): any | null {
  const parseWithRepairs = (input: string): any | null => {
    try {
      return JSON.parse(input);
    } catch {
      // Repair invalid escape sequences that occasionally appear in model output.
      const repaired = input
        // Keep valid JSON escapes; double-escape unknown ones.
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
        // Convert malformed unicode escapes like \u{1F600} or \u12 into literal \u...
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

async function callOpenAiParse(text: string, followup?: string): Promise<{ result: ParseResult | null; raw: string }> {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const sanitizedText = text
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_OCR_MODEL || process.env.LLM_MODEL || "gpt-5.1",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You extract structured gymnastics meet data from source text. Return only strict JSON.",
      },
      {
        role: "user",
        content: `${OPENAI_SCHEMA_INSTRUCTIONS}\n\nSource text:\n${sanitizedText}\n\n${followup || ""}`,
      },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw };
}

async function callGeminiParse(text: string): Promise<{ result: ParseResult | null; raw: string }> {
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
          parts: [{ text: `${OPENAI_SCHEMA_INSTRUCTIONS}\n\nSource text:\n${text}` }],
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }
  const json = await response.json();
  const raw = safeString(json?.candidates?.[0]?.content?.parts?.[0]?.text);
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw };
}

export async function parseMeetFromExtractedText(
  extractedText: string
): Promise<{ parseResult: ParseResult; modelUsed: "openai" | "gemini"; rawModelOutput: string }> {
  let openAiRaw = "";
  let openAiErrorMessage = "";
  try {
    const first = await callOpenAiParse(extractedText);
    openAiRaw = first.raw;
    if (first.result) {
      return { parseResult: first.result, modelUsed: "openai", rawModelOutput: first.raw };
    }
    const second = await callOpenAiParse(
      extractedText,
      `Your previous output was invalid. Fix and return valid strict JSON only. Previous output:\n${first.raw}`
    );
    openAiRaw = second.raw;
    if (second.result) {
      return { parseResult: second.result, modelUsed: "openai", rawModelOutput: second.raw };
    }
    openAiErrorMessage = "OpenAI returned invalid JSON twice.";
  } catch (err: any) {
    openAiErrorMessage = String(err?.message || "OpenAI parse failed.");
  }
  const hasGeminiKey = Boolean(
    safeString(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)
  );
  if (!hasGeminiKey) {
    throw new Error(
      openAiErrorMessage ||
        "OpenAI parsing failed and Gemini fallback is not configured. Set GEMINI_API_KEY to enable fallback."
    );
  }
  const gemini = await callGeminiParse(extractedText);
  if (!gemini.result) {
    throw new Error("Gemini returned invalid JSON");
  }
  return {
    parseResult: gemini.result,
    modelUsed: "gemini",
    rawModelOutput: gemini.raw || openAiRaw,
  };
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

export async function mapParseResultToGymData(parseResult: ParseResult, baseData: any = {}) {
  const { date, time } = splitDateTime(parseResult.startAt);
  const rotationOrder = safeString(parseResult.meetDetails.rotationOrder)
    .split(/[>,|/\-]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const admissionText = parseResult.admission
    .map((item) =>
      [item.label, item.price, item.note].filter(Boolean).join(": ").trim()
    )
    .filter(Boolean)
    .join("\n");

  const athlete = parseResult.athlete;
  const existingAdvanced = (baseData?.advancedSections as Record<string, any>) || {};
  const nextAdvanced = {
    ...existingAdvanced,
    roster: {
      ...(existingAdvanced.roster || {}),
      enabled: true,
      showAttendance: true,
      athletes: athlete.name
        ? [
            {
              id: "athlete-1",
              name: athlete.name,
              level: athlete.level || "",
              primaryEvents: [],
              parentName: "",
              parentPhone: "",
              parentEmail: "",
              medicalNotes: "",
              status: "pending",
              team: athlete.team || "",
              session: athlete.session || "",
            },
          ]
        : existingAdvanced.roster?.athletes || [],
    },
    meet: {
      ...(existingAdvanced.meet || {}),
      sessionNumber: athlete.session || "",
      warmUpTime: parseResult.meetDetails.warmup || athlete.stretchTime || "",
      marchInTime: parseResult.meetDetails.marchIn || athlete.marchIn || "",
      rotationOrder,
      judgingNotes: parseResult.meetDetails.judgingNotes || "",
      startApparatus: rotationOrder[0] || "",
    },
    logistics: {
      ...(existingAdvanced.logistics || {}),
      hotelName: parseResult.logistics.hotel || "",
      mealPlan: parseResult.logistics.meals || "",
      feeAmount: parseResult.logistics.fees || "",
      additionalDocuments: parseResult.logistics.waivers
        ? [{ id: "waiver-1", name: "Waiver", url: parseResult.logistics.waivers }]
        : existingAdvanced.logistics?.additionalDocuments || [],
      parking: parseResult.logistics.parking || "",
      trafficAlerts: parseResult.logistics.trafficAlerts || "",
    },
    gear: {
      ...(existingAdvanced.gear || {}),
      leotardOfDay: parseResult.gear.uniform || "",
      items: (parseResult.gear.checklist || []).map((item, idx) => ({
        id: `gear-${idx + 1}`,
        name: item,
        required: true,
        acknowledged: false,
      })),
    },
    volunteers: {
      ...(existingAdvanced.volunteers || {}),
      enabled: true,
      signupLink: parseResult.volunteers.signupLink || "",
      notes: parseResult.volunteers.notes || "",
    },
    announcements: {
      ...(existingAdvanced.announcements || {}),
      announcements: parseResult.communications.announcements.map((item, idx) => ({
        id: `announcement-${idx + 1}`,
        text: [item.title, item.body].filter(Boolean).join("\n\n").trim(),
        priority: "normal",
        createdAt: new Date().toISOString(),
      })),
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
    title: parseResult.title,
    details: [baseData?.details, parseResult.dates, admissionText].filter(Boolean).join("\n\n"),
    date: date || baseData?.date || "",
    time: time || baseData?.time || "",
    startISO: parseResult.startAt || baseData?.startISO || null,
    endISO: parseResult.endAt || baseData?.endISO || null,
    timezone: parseResult.timezone || baseData?.timezone || "America/Chicago",
    venue: parseResult.venue || baseData?.venue || "",
    address: parseResult.address || baseData?.address || "",
    hostGym: parseResult.hostGym || athlete.team || baseData?.hostGym || "",
    location: parseResult.venue || baseData?.location || "",
    customFields: {
      ...(baseData?.customFields || {}),
      team: parseResult.hostGym || athlete.team || "",
      season: baseData?.customFields?.season || "",
      coach: baseData?.customFields?.coach || "",
      assistantCoach: baseData?.customFields?.assistantCoach || "",
      coachPhone: baseData?.customFields?.coachPhone || "",
      admission: admissionText,
      advancedSections: nextAdvanced,
    },
    links: parseResult.links,
    advancedSections: nextAdvanced,
    accessControl: nextAccessControl || baseData?.accessControl || null,
    templateKey: "gymnastics",
    templateId: "gymnastics-schedule",
    category: "sport_gymnastics_schedule",
  };
}

type Status = "ready" | "in-progress" | "not-started";
function getStatusFromFlags(required: boolean[]): Status {
  const filled = required.filter(Boolean).length;
  if (filled === 0) return "not-started";
  if (filled === required.length) return "ready";
  return "in-progress";
}

export function computeGymBuilderStatuses(data: any) {
  const adv = data?.advancedSections || {};
  const roster = adv?.roster || {};
  const meet = adv?.meet || {};
  const practice = adv?.practice || {};
  const logistics = adv?.logistics || {};
  const gear = adv?.gear || {};
  const volunteers = adv?.volunteers || {};
  const announcements = adv?.announcements || {};
  const startExists = Boolean(data?.date || data?.startISO);

  const statuses = {
    essentials: {
      eventBasics: getStatusFromFlags([
        Boolean(safeString(data?.title)),
        startExists,
        Boolean(safeString(data?.timezone)),
        Boolean(safeString(data?.venue)),
        Boolean(safeString(data?.address)),
        Boolean(safeString(data?.hostGym || data?.customFields?.team)),
      ]),
      details: getStatusFromFlags([
        Boolean(safeString(data?.details)),
        Boolean(safeString(meet?.warmUpTime || meet?.judgingNotes || meet?.sessionNumber)),
      ]),
      design: "ready" as Status,
      images: data?.heroImage ? ("ready" as Status) : ("not-started" as Status),
    },
    operations: {
      rosterAttendance:
        Array.isArray(roster?.athletes) && roster.athletes.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      meetDetails: getStatusFromFlags([
        Boolean(safeString(meet?.warmUpTime)),
        Boolean(safeString(meet?.marchInTime)),
        Array.isArray(meet?.rotationOrder) && meet.rotationOrder.length > 0,
      ]),
      practicePlanner:
        Array.isArray(practice?.blocks) && practice.blocks.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      logisticsTravel: getStatusFromFlags([
        Boolean(safeString(logistics?.hotelName || logistics?.hotelAddress)),
        Boolean(safeString(logistics?.mealPlan)),
        Boolean(safeString(logistics?.feeAmount)),
      ]),
      gearUniform: getStatusFromFlags([
        Boolean(safeString(gear?.leotardOfDay)),
        Array.isArray(gear?.items) && gear.items.length > 0,
      ]),
      volunteersCarpool: getStatusFromFlags([
        Boolean(safeString(volunteers?.signupLink)),
        Boolean(safeString(volunteers?.notes)),
      ]),
    },
    communication: {
      attendance: data?.rsvpEnabled ? ("ready" as Status) : ("not-started" as Status),
      passcode:
        data?.accessControl?.requirePasscode === true
          ? data?.accessControl?.passcodeHash
            ? ("ready" as Status)
            : ("in-progress" as Status)
          : ("ready" as Status),
      announcements:
        Array.isArray(announcements?.announcements) &&
        announcements.announcements.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
    },
  };

  const essentialsReady =
    statuses.essentials.eventBasics === "ready" &&
    statuses.essentials.details !== "not-started";

  const missingEssentials: string[] = [];
  if (statuses.essentials.eventBasics !== "ready") missingEssentials.push("Event Basics");
  if (statuses.essentials.details === "not-started") missingEssentials.push("Details");

  return {
    ...statuses,
    beforePublish: {
      previewPublish: essentialsReady ? ("ready" as Status) : ("in-progress" as Status),
      missingEssentials,
    },
  };
}
