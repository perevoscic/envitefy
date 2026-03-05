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
import {
  normalizeVenueFactForCompare,
  sanitizeVenueFactLines,
} from "@/lib/venue-facts";

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
  documentProfile:
    | "athlete_session"
    | "parent_packet"
    | "registration_packet"
    | "meet_overview"
    | "unknown";
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
    doorsOpen: string | null;
    arrivalGuidance: string | null;
    registrationInfo: string | null;
    facilityLayout: string | null;
    scoringInfo: string | null;
    sessionWindows: Array<{
      date: string | null;
      start: string | null;
      end: string | null;
      note: string | null;
    }>;
    operationalNotes: string[];
  };
  logistics: {
    parking: string | null;
    trafficAlerts: string | null;
    hotel: string | null;
    meals: string | null;
    fees: string | null;
    waivers: string | null;
    rideShare: string | null;
    accessibility: string | null;
    parkingLinks: Array<{ label: string; url: string }>;
  };
  policies: {
    food: string | null;
    hydration: string | null;
    safety: string | null;
    animals: string | null;
    misc: string[];
  };
  contacts: Array<{
    role: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  }>;
  deadlines: Array<{
    label: string;
    date: string | null;
    note: string | null;
  }>;
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
  unmappedFacts: Array<{
    category: string;
    detail: string;
    confidence: "high" | "medium" | "low";
  }>;
};

type TextQuality = "good" | "suspect" | "poor";
type TextQualitySignals = {
  controlRatio: number;
  englishLikeRatio: number;
  longTokenRatio: number;
  nonTextRatio: number;
  readableLines: number;
  tokenCount: number;
  nonAsciiRatio: number;
  looksLikePdfInternals: boolean;
};

type GymLayoutZone = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
};

type GymLayoutSelectionCandidate = {
  page: number;
  preScore: number;
  finalScore: number;
  textScore: number;
  visualScore: number;
  gymLabelCount: number;
  hallLabelCount: number;
  mapHeading: boolean;
  paragraphPenalty: boolean;
  aiIsLayout: boolean | null;
  aiConfidence: number | null;
  accepted: boolean;
};

type GymLayoutSelectionDiagnostics = {
  selectedPage: number | null;
  reason: string;
  confidence: number | null;
  candidates: GymLayoutSelectionCandidate[];
};

type ExtractionResult = {
  extractedText: string;
  extractionMeta: {
    sourceType: "file" | "url";
    usedOcr: boolean;
    linkedAssets: Array<{ url: string; contentType: string }>;
    pageTitle?: string | null;
    gymLayoutImageDataUrl?: string | null;
    gymLayoutFacts?: string[];
    gymLayoutZones?: GymLayoutZone[];
    gymLayoutPage?: number | null;
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    textQuality?: TextQuality | null;
    qualitySignals?: TextQualitySignals | null;
  };
};

export type DiscoveryEvidence = {
  source: {
    sourceType: "file" | "url";
    usedOcr: boolean;
    pageTitle: string | null;
    linkedAssetCount: number;
    extractedChars: number;
    textQuality: TextQuality | null;
    qualitySignals: TextQualitySignals | null;
  };
  candidates: {
    titleHints: string[];
    dateHints: string[];
    timeHints: string[];
    timezoneHints: string[];
    venueHints: string[];
    addressHints: string[];
    hostGymHints: string[];
    admissionHints: string[];
    athleteHints: string[];
    sessionHints: string[];
    logisticsHints: string[];
    policyHints: string[];
    linkHints: Array<{ label: string; url: string }>;
  };
  snippets: {
    firstLines: string[];
    additionalInfoLines: string[];
    trafficLines: string[];
    hallLayoutLines: string[];
  };
};

const MAX_LINKED_ASSETS = 4;
const MAX_FETCH_BYTES = 7 * 1024 * 1024;
const LOW_TEXT_THRESHOLD = 200;
const execFileAsync = promisify(execFile);
let pdfRenderDepsPromise: Promise<
  | {
      pdfjs: any;
      createCanvas: (width: number, height: number) => any;
    }
  | null
> | null = null;

type DateRangeInfo = {
  label: string | null;
  startDate: string | null;
  endDate: string | null; // Inclusive end date.
};

type GymLayoutExtraction = {
  dataUrl: string | null;
  facts: string[];
  zones: GymLayoutZone[];
  page: number | null;
  selection?: GymLayoutSelectionDiagnostics;
};

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

function normalizeUrl(value: unknown): string {
  const raw = safeString(value).replace(/[)\],.;!?]+$/, "");
  if (!raw) return "";
  const withProtocol = /^www\./i.test(raw) ? `https://${raw}` : raw;
  if (!/^https?:\/\//i.test(withProtocol)) return "";
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
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

function uniqueLines(lines: string[], limit = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines.map((item) => safeString(item)).filter(Boolean)) {
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
}

function toIsoDate(year: number, monthIndex: number, day: number): string | null {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  const y = Math.trunc(year);
  const m = Math.trunc(monthIndex);
  const d = Math.trunc(day);
  if (y < 1900 || y > 2200) return null;
  if (m < 0 || m > 11) return null;
  if (d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m, d));
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

function monthNameToIndex(value: string): number {
  const normalized = safeString(value).toLowerCase();
  const map: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };
  return typeof map[normalized] === "number" ? map[normalized] : -1;
}

function deriveDateRangeFromText(value: string): DateRangeInfo {
  const text = safeString(value);
  if (!text) return { label: null, startDate: null, endDate: null };

  const monthRange =
    text.match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),?\s*(\d{4})\b/i
    ) || null;
  if (monthRange) {
    const monthIdx = monthNameToIndex(monthRange[1]);
    const dayStart = Number.parseInt(monthRange[2], 10);
    const dayEnd = Number.parseInt(monthRange[3], 10);
    const year = Number.parseInt(monthRange[4], 10);
    const startDate = toIsoDate(year, monthIdx, dayStart);
    const endDate = toIsoDate(year, monthIdx, dayEnd);
    return {
      label: text,
      startDate,
      endDate,
    };
  }

  const monthSingle =
    text.match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2}),?\s*(\d{4})\b/i
    ) || null;
  if (monthSingle) {
    const monthIdx = monthNameToIndex(monthSingle[1]);
    const day = Number.parseInt(monthSingle[2], 10);
    const year = Number.parseInt(monthSingle[3], 10);
    const date = toIsoDate(year, monthIdx, day);
    return {
      label: text,
      startDate: date,
      endDate: date,
    };
  }

  const slashRange =
    text.match(
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[–-]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\b/
    ) || null;
  if (slashRange) {
    const m1 = Number.parseInt(slashRange[1], 10) - 1;
    const d1 = Number.parseInt(slashRange[2], 10);
    const y1 = Number.parseInt(slashRange[3], 10);
    const m2 = Number.parseInt(slashRange[4], 10) - 1;
    const d2 = Number.parseInt(slashRange[5], 10);
    const y2 = Number.parseInt(slashRange[6], 10);
    return {
      label: text,
      startDate: toIsoDate(y1, m1, d1),
      endDate: toIsoDate(y2, m2, d2),
    };
  }

  const slashSingle = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/) || null;
  if (slashSingle) {
    const m = Number.parseInt(slashSingle[1], 10) - 1;
    const d = Number.parseInt(slashSingle[2], 10);
    const y = Number.parseInt(slashSingle[3], 10);
    const date = toIsoDate(y, m, d);
    return {
      label: text,
      startDate: date,
      endDate: date,
    };
  }

  return { label: text || null, startDate: null, endDate: null };
}

function extractHallFactsFromText(text: string): string[] {
  const normalizedLines = safeString(text)
    .split(/\n+/)
    .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
    .filter(Boolean);
  return sanitizeVenueFactLines(normalizedLines, {
    mode: "strict",
    maxLines: 14,
    requireAnchor: true,
    excludePatterns: [
      /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
      /official results|live scoring|daylight savings/i,
    ],
  });
}

export function buildDiscoveryEvidence(
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"]
): DiscoveryEvidence {
  const text = cleanExtractedText(extractedText);
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
    .filter(Boolean);
  const firstLines = uniqueLines(lines.slice(0, 24), 12);
  const additionalInfoStartIdx = lines.findIndex((line) => /additional\s*info/i.test(line));
  const additionalInfoLines =
    additionalInfoStartIdx >= 0
      ? uniqueLines(lines.slice(additionalInfoStartIdx + 1, additionalInfoStartIdx + 26), 12)
      : [];

  const matchLines = (pattern: RegExp, limit = 12) =>
    uniqueLines(lines.filter((line) => pattern.test(line)), limit);

  const dateHints = uniqueLines(
    [
      ...(text.match(
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:\s*[–-]\s*\d{1,2})?(?:,\s*\d{4})?/gi
      ) || []),
      ...(text.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || []),
    ],
    10
  );
  const timeHints = uniqueLines(
    text.match(/\b\d{1,2}(?::\d{2})?\s*[AP]M(?:\s*-\s*\d{1,2}(?::\d{2})?\s*[AP]M)?\b/gi) || [],
    14
  );
  const timezoneHints = uniqueLines(
    text.match(
      /\b(?:America\/[A-Za-z_]+|EST|EDT|CST|CDT|MST|MDT|PST|PDT|Eastern|Central|Mountain|Pacific)\b/gi
    ) || [],
    8
  );
  const addressHints = matchLines(
    /\b\d{2,6}\s+[A-Za-z0-9.\-'\s]+,\s*[A-Za-z.\-'\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/,
    8
  );
  const venueHints = matchLines(
    /(convention center|arena|center|hall|gymnasium|gym|sports complex|fieldhouse|venue)/i,
    12
  );
  const hostGymHints = matchLines(/(host(ed)? by|gymnastics|gym club|academy|host gym|host)/i, 12);
  const admissionHints = matchLines(/(admission|ticket|adult|children|cash|weekend pass|door)/i, 12);
  const athleteHints = matchLines(/(athlete|gymnast|level|team|march in|stretch|assigned gym|awards)/i, 14);
  const sessionHints = matchLines(/(session|stretch|march in|warm ?up|rotation|awards)/i, 14);
  const logisticsHints = matchLines(
    /(parking|traffic|hotel|meal|food|waiver|rideshare|uber|lyft|map|directions|drop[- ]?off)/i,
    14
  );
  const policyHints = matchLines(
    /(hydration|service animal|service dog|safety|food|beverage|outside food|throwing object|flash)/i,
    12
  );
  const trafficLines = matchLines(/(traffic|disney on ice|benchmark|parking rate|30-45)/i, 8);
  const hallLayoutLines = matchLines(
    /(east hall|west hall|central hall|registration|guest services|competition area|coffee bar|awards)/i,
    10
  );
  const titleHints = uniqueLines(
    [
      safeString(extractionMeta.pageTitle || ""),
      ...firstLines.filter((line) => line.length >= 6 && line.length <= 90),
    ],
    8
  );
  const linkHints = uniqueLines(
    (text.match(/https?:\/\/[^\s)]+/gi) || []).map((url) => url.replace(/[.,;!?]+$/, "")),
    14
  ).map((url) => ({ label: "Source link", url }));

  return {
    source: {
      sourceType: extractionMeta.sourceType,
      usedOcr: extractionMeta.usedOcr,
      pageTitle: safeString(extractionMeta.pageTitle) || null,
      linkedAssetCount: Array.isArray(extractionMeta.linkedAssets)
        ? extractionMeta.linkedAssets.length
        : 0,
      extractedChars: text.length,
      textQuality: extractionMeta.textQuality || null,
      qualitySignals: extractionMeta.qualitySignals || null,
    },
    candidates: {
      titleHints,
      dateHints,
      timeHints,
      timezoneHints,
      venueHints,
      addressHints,
      hostGymHints,
      admissionHints,
      athleteHints,
      sessionHints,
      logisticsHints,
      policyHints,
      linkHints,
    },
    snippets: {
      firstLines,
      additionalInfoLines,
      trafficLines,
      hallLayoutLines,
    },
  };
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

async function getPdfRenderDeps() {
  if (!pdfRenderDepsPromise) {
    pdfRenderDepsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("@napi-rs/canvas"),
    ])
      .then(([pdfjs, canvasMod]) => ({
        pdfjs,
        createCanvas: (canvasMod as any).createCanvas,
      }))
      .catch(() => null);
  }
  return pdfRenderDepsPromise;
}

async function renderPdfPageToPng(
  pdfBuffer: Buffer,
  pageIndex: number,
  scale = 1.75
): Promise<Buffer | null> {
  const deps = await getPdfRenderDeps();
  if (!deps) return null;
  try {
    const loadingTask = deps.pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const canvas = deps.createCanvas(width, height);
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;
    const png = canvas.toBuffer("image/png");
    if (typeof page.cleanup === "function") page.cleanup();
    if (typeof doc.cleanup === "function") doc.cleanup();
    if (typeof doc.destroy === "function") await doc.destroy();
    return Buffer.isBuffer(png) ? png : Buffer.from(png);
  } catch {
    return null;
  }
}

function looksLikePdfInternals(text: string): boolean {
  const sample = cleanExtractedText(text).slice(0, 24000);
  if (!sample) return false;
  if (/%PDF-\d\.\d/i.test(sample)) return true;
  const pdfKeywords =
    sample.match(
      /\b(?:obj|endobj|stream|endstream|xref|trailer|startxref|catalog|mediabox|fontdescriptor|flatedecode)\b/gi
    ) || [];
  const slashDirectives = sample.match(/\/[A-Za-z][A-Za-z0-9]+/g) || [];
  return pdfKeywords.length >= 8 || slashDirectives.length >= 60;
}

function analyzeTextQuality(text: string): {
  cleanedText: string;
  quality: TextQuality;
  signals: TextQualitySignals;
} {
  const cleanedText = cleanExtractedText(text);
  if (!cleanedText) {
    return {
      cleanedText,
      quality: "poor",
      signals: {
        controlRatio: 0,
        englishLikeRatio: 0,
        longTokenRatio: 0,
        nonTextRatio: 1,
        readableLines: 0,
        tokenCount: 0,
        nonAsciiRatio: 0,
        looksLikePdfInternals: false,
      },
    };
  }

  const sample = cleanedText.slice(0, 5000);
  const tokens = cleanedText.split(/\s+/).filter(Boolean);
  const controlChars = (sample.match(/[\u0000-\u001F\u007F-\u009F]/g) || []).length;
  const englishLikeTokens = tokens.filter((token) => /^[A-Za-z][A-Za-z'’-]{1,24}$/.test(token)).length;
  const longTokens = tokens.filter((token) => token.length > 35).length;
  const nonTextChars = (sample.match(/[^A-Za-z0-9\s.,:;!?()'"&@#%/\-]/g) || []).length;
  const readableLines = cleanedText
    .split(/\n+/)
    .filter((line) => (line.match(/[A-Za-z]{3,}/g) || []).length >= 3).length;
  const nonAsciiChars = (sample.match(/[^\x00-\x7F]/g) || []).length;
  const internals = looksLikePdfInternals(cleanedText);

  const signals: TextQualitySignals = {
    controlRatio: controlChars / Math.max(sample.length, 1),
    englishLikeRatio: englishLikeTokens / Math.max(tokens.length, 1),
    longTokenRatio: longTokens / Math.max(tokens.length, 1),
    nonTextRatio: nonTextChars / Math.max(sample.length, 1),
    readableLines,
    tokenCount: tokens.length,
    nonAsciiRatio: nonAsciiChars / Math.max(sample.length, 1),
    looksLikePdfInternals: internals,
  };

  const isPoor =
    internals ||
    signals.tokenCount < 25 ||
    signals.controlRatio >= 0.08 ||
    signals.nonTextRatio >= 0.35 ||
    signals.nonAsciiRatio >= 0.25 ||
    signals.englishLikeRatio < 0.08 ||
    signals.readableLines < 2;
  if (isPoor) {
    return { cleanedText, quality: "poor", signals };
  }

  const isGood =
    cleanedText.length >= LOW_TEXT_THRESHOLD &&
    signals.controlRatio < 0.02 &&
    signals.englishLikeRatio > 0.25 &&
    signals.longTokenRatio < 0.08 &&
    signals.nonTextRatio < 0.12 &&
    signals.readableLines >= 4 &&
    signals.tokenCount > 30 &&
    signals.nonAsciiRatio < 0.08;
  if (isGood) {
    return { cleanedText, quality: "good", signals };
  }

  return { cleanedText, quality: "suspect", signals };
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
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : String(err || "");
    console.warn("[meet-discovery] pdf-parse worker failed", {
      message,
    });
    try {
      const mod = await import("pdf-parse");
      const PDFParseCtor =
        typeof mod?.PDFParse === "function" ? mod.PDFParse : null;
      if (PDFParseCtor) {
        const parser = new PDFParseCtor({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === "function") await parser.destroy();
        return cleanExtractedText(String(result?.text || ""));
      }
    } catch (fallbackErr: unknown) {
      const fallbackMessage =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : typeof fallbackErr === "string"
          ? fallbackErr
          : String(fallbackErr || "");
      console.warn("[meet-discovery] pdf-parse fallback failed", {
        message: fallbackMessage,
      });
    }
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

async function openAiOcrTextFromImage(
  buffer: Buffer,
  mimeType = "image/png"
): Promise<string> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return "";
  const model =
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.1-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an OCR engine. Return strict JSON {\"text\": string}. Extract only visible text and labels from the image.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all visible text." },
              { type: "input_image", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return "";
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    return cleanExtractedText(safeString(parsed?.text || raw));
  } catch {
    return "";
  }
}

async function openAiAnalyzeGymLayoutPage(
  buffer: Buffer,
  mimeType = "image/png"
): Promise<{ isLayout: boolean; confidence: number; facts: string[]; text: string } | null> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return null;
  const model =
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.1-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Classify gymnastics venue map pages and extract hall-layout facts. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Return JSON with keys: isLayout (boolean), confidence (number 0-1), text (string), facts (string[]). Facts must be verbatim visible map labels/text only (no paraphrase, no inference, no reconstruction). Each fact must be a complete, readable sentence or complete standalone label. Never return broken fragments or mid-sentence splits. If uncertain, return an empty facts array.',
              },
              { type: "input_image", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const confidenceRaw = Number(parsed?.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0;
    return {
      isLayout: Boolean(parsed?.isLayout),
      confidence,
      text: cleanExtractedText(safeString(parsed?.text || "")),
      facts: sanitizeVenueFactLines(
        pickArray(parsed?.facts)
          .map((item) => safeString(item))
          .filter(Boolean),
        {
          mode: "strict",
          maxLines: 14,
          requireAnchor: true,
          excludePatterns: [
            /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
            /official results|live scoring|daylight savings/i,
          ],
        }
      ),
    };
  } catch {
    return null;
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<{
  text: string;
  usedOcr: boolean;
  textQuality: TextQuality;
  qualitySignals: TextQualitySignals;
}> {
  const rank: Record<TextQuality, number> = { good: 2, suspect: 1, poor: 0 };
  const toCandidate = (raw: string, usedOcr: boolean) => {
    const analyzed = analyzeTextQuality(raw);
    return {
      text: analyzed.cleanedText,
      usedOcr,
      textQuality: analyzed.quality,
      qualitySignals: analyzed.signals,
    };
  };

  const workerCandidate = toCandidate(await extractPdfTextWithNodeWorker(buffer), false);
  if (workerCandidate.text.length >= LOW_TEXT_THRESHOLD && workerCandidate.textQuality === "good") {
    return workerCandidate;
  }

  const heuristicCandidate = toCandidate(extractPdfTextHeuristic(buffer), false);
  if (
    heuristicCandidate.text.length >= LOW_TEXT_THRESHOLD &&
    heuristicCandidate.textQuality === "good"
  ) {
    return heuristicCandidate;
  }

  let ocrCandidate: ReturnType<typeof toCandidate> | null = null;
  try {
    const ocrPages: string[] = [];
    for (let page = 0; page < 5; page += 1) {
      const sharpPageImage = await sharp(buffer, { density: 220, page })
        .png()
        .toBuffer()
        .catch(() => null);
      const pageImage = sharpPageImage || (await renderPdfPageToPng(buffer, page));
      if (!pageImage) break;
      const text = cleanExtractedText(await extractTextFromImage(pageImage));
      if (text) ocrPages.push(text);
    }
    if (ocrPages.length > 0) {
      ocrCandidate = toCandidate(ocrPages.join("\n\n"), true);
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return ocrCandidate;
      }
    }
  } catch {
    // Continue to final fallbacks.
  }
  if (!ocrCandidate) {
    try {
      ocrCandidate = toCandidate(await extractTextFromImage(buffer), true);
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return ocrCandidate;
      }
    } catch {
      // Continue to best-candidate selection.
    }
  }

  const candidates = [workerCandidate, heuristicCandidate, ocrCandidate]
    .filter((item): item is ReturnType<typeof toCandidate> => Boolean(item))
    .filter((item) => item.text.length > 0)
    .sort((a, b) => {
      const qualityDelta = rank[b.textQuality] - rank[a.textQuality];
      if (qualityDelta !== 0) return qualityDelta;
      return b.text.length - a.text.length;
    });

  const best = candidates[0];
  if (best && best.textQuality !== "poor") {
    return best;
  }

  const emptyQuality = analyzeTextQuality("");
  return {
    text: "",
    usedOcr: false,
    textQuality: "poor",
    qualitySignals: emptyQuality.signals,
  };
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const prepared = await sharp(buffer).resize(2200).grayscale().normalize().toBuffer();
  try {
    const text = await ocrBuffer(prepared);
    if (safeString(text)) return cleanExtractedText(text);
  } catch {
    // Fall through to OpenAI OCR.
  }
  const fallbackText = await openAiOcrTextFromImage(prepared, "image/png");
  return cleanExtractedText(fallbackText);
}

function countPatternMatches(text: string, pattern: RegExp): number {
  return Array.from(text.matchAll(pattern)).length;
}

function summarizeGymLayoutText(text: string): {
  mapHeading: boolean;
  gymLabelCount: number;
  hallLabelCount: number;
  strongSignalCount: number;
  paragraphPenalty: boolean;
} {
  const normalized = safeString(text).toLowerCase();
  if (!normalized) {
    return {
      mapHeading: false,
      gymLabelCount: 0,
      hallLabelCount: 0,
      strongSignalCount: 0,
      paragraphPenalty: false,
    };
  }

  const mapHeading = /(gym\s*layout|facility\s*map|floor\s*plan|venue\s*map|convention\s*center\s*map)/i.test(
    normalized
  );
  const gymLabelCount = countPatternMatches(normalized, /\bgym\s*[a-f]\b/gi);
  const hallLabelCount = countPatternMatches(
    normalized,
    /\b(?:east|west|central|north|south)\s*hall\b/gi
  );
  const textScore = scoreGymLayoutSignals(normalized);
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const longLineCount = lines.filter((line) => line.length >= 85).length;
  const weakAnchorCount =
    gymLabelCount +
    hallLabelCount +
    countPatternMatches(
      normalized,
      /\b(registration|awards area|competition area|guest services|entrance|coffee bar)\b/gi
    );
  const paragraphPenalty =
    normalized.length >= 800 &&
    longLineCount >= 4 &&
    textScore <= 2 &&
    weakAnchorCount <= 2;

  return {
    mapHeading,
    gymLabelCount,
    hallLabelCount,
    strongSignalCount: textScore,
    paragraphPenalty,
  };
}

function looksLikeGymLayoutText(text: string): boolean {
  const summary = summarizeGymLayoutText(text);
  const hasAnchor = summary.gymLabelCount >= 1 || summary.hallLabelCount >= 1;
  if (summary.mapHeading && hasAnchor) return true;
  return (
    summary.strongSignalCount >= 3 &&
    (summary.gymLabelCount >= 1 || summary.hallLabelCount >= 2)
  );
}

function scoreGymLayoutSignals(text: string): number {
  const normalized = safeString(text).toLowerCase();
  if (!normalized) return 0;
  const signals = [
    /hall\s*layout|facility\s*map|floor\s*plan|venue\s*map|convention\s*center\s*map/,
    /east hall/,
    /west hall/,
    /central hall/,
    /gym\s*[a-f]/,
    /awards area/,
    /registration/,
    /guest services/,
    /competition area/,
    /entrance/,
    /coffee bar/,
  ];
  return signals.reduce((count, re) => (re.test(normalized) ? count + 1 : count), 0);
}

function extractGymTokens(value: string): string[] {
  const text = safeString(value);
  if (!text) return [];
  const matches = Array.from(text.matchAll(/\bgym\s*([a-z0-9]{1,2})\b/gi));
  if (!matches.length) return [];
  const tokens = matches
    .map((match) => safeString(match?.[1] || "").toUpperCase())
    .filter(Boolean)
    .map((suffix) => `Gym ${suffix}`);
  return uniqueLines(tokens, 8);
}

function normalizeZoneNumber(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num >= 0 && num <= 1) return num;
  if (num > 1 && num <= 100) return num / 100;
  return null;
}

function normalizeGymLayoutZones(raw: unknown): GymLayoutZone[] {
  return uniqueBy(
    pickArray(raw)
      .map((item) => {
        const label = safeString(item?.label || item?.name || item?.zone);
        const x = normalizeZoneNumber(item?.x ?? item?.left);
        const y = normalizeZoneNumber(item?.y ?? item?.top);
        const w = normalizeZoneNumber(item?.w ?? item?.width);
        const h = normalizeZoneNumber(item?.h ?? item?.height);
        const confidenceRaw = Number(item?.confidence);
        const confidence = Number.isFinite(confidenceRaw)
          ? Math.max(0, Math.min(1, confidenceRaw))
          : 0;
        if (!label || x === null || y === null || w === null || h === null) return null;
        if (w <= 0 || h <= 0) return null;
        if (x + w > 1.02 || y + h > 1.02) return null;
        return {
          label,
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          w: Math.max(0.01, Math.min(1, w)),
          h: Math.max(0.01, Math.min(1, h)),
          confidence,
        } as GymLayoutZone;
      })
      .filter((item): item is GymLayoutZone => Boolean(item)),
    (item) =>
      `${item.label.toLowerCase()}|${item.x.toFixed(3)}|${item.y.toFixed(3)}|${item.w.toFixed(
        3
      )}|${item.h.toFixed(3)}`
  ).slice(0, 24);
}

async function openAiExtractGymLayoutZones(
  buffer: Buffer,
  mimeType = "image/png"
): Promise<GymLayoutZone[]> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return [];
  const model =
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.1-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract gymnastics venue map regions from the image. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Return JSON with key "zones" where zones is an array of objects: {label:string, x:number, y:number, w:number, h:number, confidence:number}. Coordinates must be normalized 0..1 relative to the full image. Include only visible map regions such as gym labels, hall names, registration, guest services, entrances, competition area, and awards area. If unsure, return an empty array.',
              },
              {
                type: "input_image",
                image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    if (!parsed || typeof parsed !== "object") return [];
    return normalizeGymLayoutZones(parsed?.zones);
  } catch {
    return [];
  }
}

async function cropGymLayoutImageToAssignedGym(
  imageDataUrl: string,
  zones: GymLayoutZone[],
  assignedGym: string
): Promise<string | null> {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed || !zones.length) return null;
  const target = safeString(assignedGym);
  if (!target) return null;
  const targetTokens = extractGymTokens(target);
  if (!targetTokens.length) return null;
  const targetSet = new Set(targetTokens.map((item) => item.toLowerCase()));
  const matchingZones = zones.filter((zone) => {
    const zoneTokens = extractGymTokens(zone.label);
    return zoneTokens.some((token) => targetSet.has(token.toLowerCase()));
  });
  if (!matchingZones.length) return null;
  const chosen = [...matchingZones].sort((a, b) => {
    const confidenceDelta = b.confidence - a.confidence;
    if (confidenceDelta !== 0) return confidenceDelta;
    return a.w * a.h - b.w * b.h;
  })[0];
  try {
    const metadata = await sharp(parsed.buffer).metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 20 || height < 20) {
      return null;
    }
    const padX = Math.max(12, Math.round(width * 0.035));
    const padY = Math.max(12, Math.round(height * 0.035));
    const left = Math.max(0, Math.floor(chosen.x * width) - padX);
    const top = Math.max(0, Math.floor(chosen.y * height) - padY);
    const cropWidth = Math.min(
      width - left,
      Math.max(32, Math.ceil(chosen.w * width) + padX * 2)
    );
    const cropHeight = Math.min(
      height - top,
      Math.max(32, Math.ceil(chosen.h * height) + padY * 2)
    );
    if (cropWidth < 24 || cropHeight < 24) return null;
    const cropped = await sharp(parsed.buffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();
    return await toOptimizedImageDataUrl(cropped);
  } catch {
    return null;
  }
}

async function toOptimizedImageDataUrl(
  buffer: Buffer
): Promise<string | null> {
  try {
    const variants: Array<{ width: number; quality: number }> = [
      { width: 1800, quality: 82 },
      { width: 1600, quality: 76 },
      { width: 1400, quality: 72 },
      { width: 1200, quality: 68 },
      { width: 1000, quality: 64 },
    ];
    for (const variant of variants) {
      const optimized = await sharp(buffer)
        .resize({ width: variant.width, withoutEnlargement: true })
        .jpeg({ quality: variant.quality })
        .toBuffer();
      if (optimized.length <= 1_800_000) {
        return `data:image/jpeg;base64,${optimized.toString("base64")}`;
      }
    }
    // Last-resort tiny output to avoid dropping the screenshot entirely.
    const fallback = await sharp(buffer)
      .resize({ width: 900, withoutEnlargement: true })
      .jpeg({ quality: 58 })
      .toBuffer();
    return fallback.length <= 2_000_000
      ? `data:image/jpeg;base64,${fallback.toString("base64")}`
      : null;
  } catch {
    return null;
  }
}

async function scoreGymLayoutVisualSignal(buffer: Buffer): Promise<number> {
  try {
    const stats = await sharp(buffer).stats();
    const channels = pickArray(stats?.channels);
    if (!channels.length) return 0;
    const mean =
      channels.reduce((sum, channel) => sum + Number(channel?.mean || 0), 0) /
      channels.length;
    const stdev =
      channels.reduce((sum, channel) => sum + Number(channel?.stdev || 0), 0) /
      channels.length;
    const darknessScore = Math.max(0, (245 - mean) / 120);
    const textureScore = Math.max(0, stdev / 70);
    return Math.max(0, Math.min(1.5, darknessScore * 0.8 + textureScore * 0.7));
  } catch {
    return 0;
  }
}

async function extractGymLayoutImageFromPdf(buffer: Buffer): Promise<GymLayoutExtraction> {
  const candidatePages: Array<{
    page: number;
    image: Buffer;
    text: string;
    textScore: number;
    visualScore: number;
    gymLabelCount: number;
    hallLabelCount: number;
    mapHeading: boolean;
    paragraphPenalty: boolean;
    preScore: number;
    aiIsLayout: boolean | null;
    aiConfidence: number | null;
    aiFacts: string[];
    aiText: string;
    accepted: boolean;
    acceptReason: "ai" | "deterministic" | null;
    finalScore: number;
  }> = [];
  for (let page = 0; page < 20; page += 1) {
    try {
      const sharpPageImage = await sharp(buffer, { density: 220, page })
        .png()
        .toBuffer()
        .catch(() => null);
      const pageImage = sharpPageImage || (await renderPdfPageToPng(buffer, page));
      if (!pageImage) continue;
      const pageText = await extractTextFromImage(pageImage);
      const summary = summarizeGymLayoutText(pageText);
      const textScore = scoreGymLayoutSignals(pageText);
      const visualScore = await scoreGymLayoutVisualSignal(pageImage);
      const preScore =
        textScore +
        Math.min(visualScore, 1) * 0.5 +
        summary.gymLabelCount * 2 +
        summary.hallLabelCount * 0.75 +
        (summary.mapHeading ? 1 : 0) -
        (summary.paragraphPenalty ? 1 : 0);
      candidatePages.push({
        page,
        image: pageImage,
        text: pageText,
        textScore,
        visualScore,
        gymLabelCount: summary.gymLabelCount,
        hallLabelCount: summary.hallLabelCount,
        mapHeading: summary.mapHeading,
        paragraphPenalty: summary.paragraphPenalty,
        preScore,
        aiIsLayout: null,
        aiConfidence: null,
        aiFacts: [],
        aiText: "",
        accepted: false,
        acceptReason: null,
        finalScore: preScore,
      });
    } catch {
      // Continue scanning remaining pages; some PDFs can fail intermittently by page.
      continue;
    }
  }

  if (!candidatePages.length) {
    return {
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
      selection: {
        selectedPage: null,
        reason: "no_pdf_pages_scanned",
        confidence: null,
        candidates: [],
      },
    };
  }

  const rankedCandidates = [...candidatePages].sort((a, b) => {
    const preScoreDelta = b.preScore - a.preScore;
    if (preScoreDelta !== 0) return preScoreDelta;
    return a.page - b.page;
  });
  const topForAi = rankedCandidates.slice(0, 6);
  for (const candidate of topForAi) {
    const ai = await openAiAnalyzeGymLayoutPage(candidate.image, "image/png");
    if (!ai) continue;
    candidate.aiIsLayout = ai.isLayout;
    candidate.aiConfidence = ai.confidence;
    candidate.aiFacts = ai.facts;
    candidate.aiText = ai.text;
  }

  for (const candidate of candidatePages) {
    const aiScore =
      (candidate.aiIsLayout === true ? 1.5 : candidate.aiIsLayout === false ? -1 : 0) +
      (candidate.aiConfidence || 0) * 2;
    candidate.finalScore = candidate.preScore + aiScore;

    const aiAccepted =
      candidate.aiIsLayout === true &&
      (candidate.aiConfidence || 0) >= 0.62 &&
      (candidate.gymLabelCount >= 1 || candidate.hallLabelCount >= 2);
    const deterministicAccepted =
      candidate.gymLabelCount >= 2 && candidate.hallLabelCount >= 1;
    candidate.accepted = aiAccepted || deterministicAccepted;
    candidate.acceptReason = aiAccepted ? "ai" : deterministicAccepted ? "deterministic" : null;
  }

  const acceptedCandidates = [...candidatePages]
    .filter((candidate) => candidate.accepted)
    .sort((a, b) => {
      const finalScoreDelta = b.finalScore - a.finalScore;
      if (finalScoreDelta !== 0) return finalScoreDelta;
      const preScoreDelta = b.preScore - a.preScore;
      if (preScoreDelta !== 0) return preScoreDelta;
      return a.page - b.page;
    });

  const diagnosticsCandidates: GymLayoutSelectionCandidate[] = [...candidatePages]
    .sort((a, b) => {
      const preScoreDelta = b.preScore - a.preScore;
      if (preScoreDelta !== 0) return preScoreDelta;
      return a.page - b.page;
    })
    .map((candidate) => ({
      page: candidate.page,
      preScore: candidate.preScore,
      finalScore: candidate.finalScore,
      textScore: candidate.textScore,
      visualScore: candidate.visualScore,
      gymLabelCount: candidate.gymLabelCount,
      hallLabelCount: candidate.hallLabelCount,
      mapHeading: candidate.mapHeading,
      paragraphPenalty: candidate.paragraphPenalty,
      aiIsLayout: candidate.aiIsLayout,
      aiConfidence: candidate.aiConfidence,
      accepted: candidate.accepted,
    }));

  if (!acceptedCandidates.length) {
    return {
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
      selection: {
        selectedPage: null,
        reason: "no_candidate_passed_strict_gate",
        confidence: null,
        candidates: diagnosticsCandidates,
      },
    };
  }

  const selected = acceptedCandidates[0];
  const dataUrl = await toOptimizedImageDataUrl(selected.image);
  if (!dataUrl) {
    return {
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
      selection: {
        selectedPage: null,
        reason: "selected_page_image_encode_failed",
        confidence: null,
        candidates: diagnosticsCandidates,
      },
    };
  }

  const zones = await openAiExtractGymLayoutZones(selected.image, "image/png");
  const facts = sanitizeVenueFactLines(
    [...selected.aiFacts, ...extractHallFactsFromText(selected.text)],
    {
      mode: "strict",
      maxLines: 14,
      requireAnchor: true,
      excludePatterns: [
        /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
        /official results|live scoring|daylight savings/i,
      ],
    }
  );
  return {
    dataUrl,
    facts,
    zones,
    page: selected.page,
    selection: {
      selectedPage: selected.page,
      reason:
        selected.acceptReason === "ai"
          ? "accepted_ai_layout"
          : "accepted_deterministic_strong_map",
      confidence: selected.aiConfidence,
      candidates: diagnosticsCandidates,
    },
  };
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
  const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]*)$/);
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
        assignedGym: "",
        startApparatus: "",
        rotationOrder: [],
        judgingNotes: "",
        scoresLink: "",
        doorsOpen: "",
        arrivalGuidance: "",
        registrationInfo: "",
        facilityLayout: "",
        scoringInfo: "",
        sessionWindows: [],
        operationalNotes: [],
      },
      practice: { enabled: true, blocks: [], excusedAthletes: [], modifiedTraining: [] },
      logistics: {
        enabled: true,
        showTransportation: true,
        showAccommodations: true,
        showFees: true,
        showMeals: true,
        showAdditionalDocuments: true,
        gymLayoutImage: "",
        gymLayoutLabel: "",
        travelMode: "",
        callTime: "",
        pickupWindow: "",
        hotelName: "",
        hotelAddress: "",
        hotelCheckIn: "",
        mealPlan: "",
        feeDueDate: "",
        feeAmount: "",
        rideShare: "",
        accessibility: "",
        policyFood: "",
        policyHydration: "",
        policySafety: "",
        policyAnimals: "",
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
      const { text, usedOcr, textQuality, qualitySignals } = await extractTextFromPdf(parsed.buffer);
      const gymLayout = await extractGymLayoutImageFromPdf(parsed.buffer);
      const combinedLayoutFacts = sanitizeVenueFactLines(
        [...gymLayout.facts, ...extractHallFactsFromText(text)],
        {
          mode: "strict",
          maxLines: 14,
          requireAnchor: true,
          excludePatterns: [
            /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
            /official results|live scoring|daylight savings/i,
          ],
        }
      );
      return {
        extractedText: text,
        extractionMeta: {
          sourceType: "file",
          usedOcr,
          linkedAssets: [],
          gymLayoutImageDataUrl: gymLayout.dataUrl || null,
          gymLayoutFacts: combinedLayoutFacts,
          gymLayoutZones: gymLayout.zones,
          gymLayoutPage: gymLayout.page,
          gymLayoutSelection: gymLayout.selection,
          textQuality,
          qualitySignals,
        },
      };
    }
    if (/image\/(png|jpe?g|webp)/.test(mime)) {
      const text = await extractTextFromImage(parsed.buffer);
      const quality = analyzeTextQuality(text);
      const gymLayoutImageDataUrl = looksLikeGymLayoutText(text)
        ? await toOptimizedImageDataUrl(parsed.buffer)
        : null;
      const gymLayoutZones = gymLayoutImageDataUrl
        ? await openAiExtractGymLayoutZones(parsed.buffer, parsed.mimeType || "image/png")
        : [];
      const gymLayoutFacts = extractHallFactsFromText(text);
      return {
        extractedText: quality.cleanedText,
        extractionMeta: {
          sourceType: "file",
          usedOcr: true,
          linkedAssets: [],
          gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
          gymLayoutFacts,
          gymLayoutZones,
          gymLayoutPage: null,
          textQuality: quality.quality,
          qualitySignals: quality.signals,
        },
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
  let gymLayoutImageDataUrl: string | null = null;
  let gymLayoutPage: number | null = null;
  let gymLayoutFacts: string[] = [];
  let gymLayoutZones: GymLayoutZone[] = [];
  let gymLayoutSelection: GymLayoutSelectionDiagnostics | undefined = undefined;

  for (const asset of linkedAssets) {
    try {
      const fetched = await fetchWithLimit(asset.toString());
      linkedMeta.push({ url: asset.toString(), contentType: fetched.contentType });
      if (/pdf/i.test(fetched.contentType) || /\.pdf(\?|#|$)/i.test(asset.pathname)) {
        const parsed = await extractTextFromPdf(fetched.buffer);
        linkedChunks.push(parsed.text);
        usedOcr = usedOcr || parsed.usedOcr;
        if (!gymLayoutImageDataUrl) {
          const layout = await extractGymLayoutImageFromPdf(fetched.buffer);
          gymLayoutImageDataUrl = layout.dataUrl;
          gymLayoutPage = layout.page;
          gymLayoutFacts = uniqueLines([...gymLayoutFacts, ...layout.facts], 14);
          gymLayoutZones = normalizeGymLayoutZones(layout.zones);
          if (layout.selection) {
            gymLayoutSelection = layout.selection;
          }
        }
        continue;
      }
      if (
        /image\/(png|jpe?g|webp)/i.test(fetched.contentType) ||
        /\.(png|jpe?g|webp)(\?|#|$)/i.test(asset.pathname)
      ) {
        const imageText = await extractTextFromImage(fetched.buffer);
        linkedChunks.push(imageText);
        usedOcr = true;
        if (!gymLayoutImageDataUrl && looksLikeGymLayoutText(imageText)) {
          gymLayoutImageDataUrl = await toOptimizedImageDataUrl(fetched.buffer);
          gymLayoutZones = await openAiExtractGymLayoutZones(
            fetched.buffer,
            fetched.contentType || "image/png"
          );
        }
        gymLayoutFacts = uniqueLines([...gymLayoutFacts, ...extractHallFactsFromText(imageText)], 14);
      }
    } catch {
      // Best-effort linked assets.
    }
  }

  const fullText = [metadata, readable, ...linkedChunks]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .trim();
  const quality = analyzeTextQuality(fullText);
  const mergedLayoutFacts = sanitizeVenueFactLines(
    [...gymLayoutFacts, ...extractHallFactsFromText(fullText)],
    {
      mode: "strict",
      maxLines: 14,
      requireAnchor: true,
      excludePatterns: [
        /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
        /official results|live scoring|daylight savings/i,
      ],
    }
  );

  return {
    extractedText: quality.cleanedText,
    extractionMeta: {
      sourceType: "url",
      usedOcr,
      linkedAssets: linkedMeta,
      pageTitle: safeString(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
      gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
      gymLayoutFacts: mergedLayoutFacts,
      gymLayoutZones,
      gymLayoutPage,
      gymLayoutSelection,
      textQuality: quality.quality,
      qualitySignals: quality.signals,
    },
  };
}

const OPENAI_SCHEMA_INSTRUCTIONS = `Return JSON only. Do not wrap in markdown. Follow this exact shape and key names:
{
  "eventType": "gymnastics_meet" | "unknown",
  "documentProfile": "athlete_session" | "parent_packet" | "registration_packet" | "meet_overview" | "unknown",
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
    "warmup": string|null, "marchIn": string|null, "rotationOrder": string|null, "judgingNotes": string|null,
    "doorsOpen": string|null, "arrivalGuidance": string|null, "registrationInfo": string|null,
    "facilityLayout": string|null, "scoringInfo": string|null,
    "sessionWindows": [{ "date": string|null, "start": string|null, "end": string|null, "note": string|null }],
    "operationalNotes": [string]
  },
  "logistics": {
    "parking": string|null, "trafficAlerts": string|null, "hotel": string|null,
    "meals": string|null, "fees": string|null, "waivers": string|null,
    "rideShare": string|null, "accessibility": string|null,
    "parkingLinks": [{ "label": string, "url": string }]
  },
  "policies": {
    "food": string|null, "hydration": string|null, "safety": string|null, "animals": string|null, "misc": [string]
  },
  "contacts": [{ "role": string, "name": string|null, "email": string|null, "phone": string|null }],
  "deadlines": [{ "label": string, "date": string|null, "note": string|null }],
  "gear": { "uniform": string|null, "checklist": [string] },
  "volunteers": { "signupLink": string|null, "notes": string|null },
  "communications": {
    "announcements": [{ "title": string, "body": string }],
    "passcode": string|null
  },
  "links": [{ "label": string, "url": string }],
  "unmappedFacts": [{ "category": string, "detail": string, "confidence": "high"|"medium"|"low" }]
}`;

function buildProfessionalParsePrompt(
  evidence: DiscoveryEvidence,
  sourceText: string,
  followup?: string
): string {
  const boundedText = cleanExtractedText(sourceText).slice(0, 120000);
  const evidenceJson = JSON.stringify(evidence, null, 2);
  return [
    OPENAI_SCHEMA_INSTRUCTIONS,
    "",
    "You are a senior event-data extraction specialist for gymnastics meet documents.",
    "",
    "## Task",
    "Extract all relevant data into one JSON object that matches the required schema.",
    "Use two internal steps before producing output:",
    "- Step A: classify `documentProfile`.",
    "- Step B: populate all other fields with maximum factual recall.",
    "",
    "## Source Priority (resolve conflicts in this order)",
    "1) Evidence JSON candidates/snippets (primary grounding source).",
    "2) Source text (resolve ambiguity and fill gaps not covered by candidates).",
    "3) If absent from both, use null for scalars or [] for arrays. Never invent.",
    "",
    "## Conflict Resolution",
    "When candidates conflict, prefer the most specific and internally consistent value. Source text is the tiebreaker.",
    "",
    "## Document-Type Extraction Focus",
    "- `parent_packet`: doors/arrival, facility layout, parking/traffic, visitor policies.",
    "- `registration_packet`: entry fees, qualification criteria, deadlines, refund/late-fee rules, organizer contacts.",
    "- `athlete_session`: warmup schedule, march-in, session windows, rotation order/apparatus, awards, assigned gym.",
    "",
    "## Field-Level Rules",
    "- `rotationOrder`: populate ONLY when the source explicitly lists an apparatus/rotation sequence.",
    "- Narrative references to rotation sheets are NOT a sequence; set `rotationOrder` to null and keep narrative in operational notes.",
    "- For `dates`, preserve meet ranges exactly when present (example: `March 6-8, 2026`).",
    "- Never use update/revision stamps (e.g., `Updated February 23, 2026`) as meet date values.",
    "- Never use traffic windows or unrelated schedule snippets as primary meet dates.",
    "- URLs must be absolute (https://...) whenever possible.",
    "- Strings must be short and factual. No meta commentary.",
    "- Use only explicitly visible/source-grounded facts. No paraphrase or inferred venue details.",
    "- For `meetDetails.operationalNotes`, each item must be a complete sentence or complete standalone label.",
    "- `meetDetails.operationalNotes`: maximum 6 items, deduplicated, concise, readable, and non-overlapping with dedicated fields.",
    "- `athlete.awards`: only explicit awards location/time when shown; otherwise null.",
    "- Keep traffic/parking/general travel guidance in logistics fields, not awards/facility-specific fields.",
    "- Do not output fragmented line-wrap artifacts (for example avoid splitting one sentence into multiple array items).",
    "",
    "## No Fact Left Behind",
    "Any fact that does not map to a primary field must be placed in one of:",
    "`meetDetails.operationalNotes` | `policies.misc` | `deadlines` | `contacts` | `unmappedFacts`.",
    "",
    "## Output Format",
    "Return JSON only. No preamble, explanation, or markdown wrapping.",
    "",
    "Evidence JSON:",
    evidenceJson,
    "",
    "Source text:",
    boundedText,
    "",
    followup || "",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeParseResult(value: any): ParseResult | null {
  if (!value || typeof value !== "object") return null;
  const eventType = value.eventType === "gymnastics_meet" ? "gymnastics_meet" : "unknown";
  const documentProfile =
    value.documentProfile === "athlete_session" ||
    value.documentProfile === "parent_packet" ||
    value.documentProfile === "registration_packet" ||
    value.documentProfile === "meet_overview"
      ? value.documentProfile
      : "unknown";
  const title = safeString(value.title);
  const dates = safeString(value.dates);
  return {
    eventType,
    documentProfile,
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
      doorsOpen: safeString(value.meetDetails?.doorsOpen) || null,
      arrivalGuidance: safeString(value.meetDetails?.arrivalGuidance) || null,
      registrationInfo: safeString(value.meetDetails?.registrationInfo) || null,
      facilityLayout: safeString(value.meetDetails?.facilityLayout) || null,
      scoringInfo: safeString(value.meetDetails?.scoringInfo) || null,
      sessionWindows: pickArray(value.meetDetails?.sessionWindows)
        .map((item) => ({
          date: safeString(item?.date) || null,
          start: safeString(item?.start) || null,
          end: safeString(item?.end) || null,
          note: safeString(item?.note) || null,
        }))
        .filter((item) => item.date || item.start || item.end || item.note),
      operationalNotes: pickArray(value.meetDetails?.operationalNotes)
        .map((item) => safeString(item))
        .filter(Boolean),
    },
    logistics: {
      parking: safeString(value.logistics?.parking) || null,
      trafficAlerts: safeString(value.logistics?.trafficAlerts) || null,
      hotel: safeString(value.logistics?.hotel) || null,
      meals: safeString(value.logistics?.meals) || null,
      fees: safeString(value.logistics?.fees) || null,
      waivers: safeString(value.logistics?.waivers) || null,
      rideShare: safeString(value.logistics?.rideShare) || null,
      accessibility: safeString(value.logistics?.accessibility) || null,
      parkingLinks: uniqueBy(
        pickArray(value.logistics?.parkingLinks)
          .map((item) => ({
            label: safeString(item?.label) || "Parking link",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url
      ),
    },
    policies: {
      food: safeString(value.policies?.food) || null,
      hydration: safeString(value.policies?.hydration) || null,
      safety: safeString(value.policies?.safety) || null,
      animals: safeString(value.policies?.animals) || null,
      misc: pickArray(value.policies?.misc).map((item) => safeString(item)).filter(Boolean),
    },
    contacts: uniqueBy(
      pickArray(value.contacts)
        .map((item) => ({
          role: safeString(item?.role) || "Contact",
          name: safeString(item?.name) || null,
          email: safeString(item?.email) || null,
          phone: safeString(item?.phone) || null,
        }))
        .filter((item) => item.name || item.email || item.phone),
      (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
    ),
    deadlines: uniqueBy(
      pickArray(value.deadlines)
        .map((item) => ({
          label: safeString(item?.label) || "Deadline",
          date: safeString(item?.date) || null,
          note: safeString(item?.note) || null,
        }))
        .filter((item) => item.label || item.date || item.note),
      (item) => [item.label, item.date || "", item.note || ""].join("|")
    ),
    unmappedFacts: pickArray(value.unmappedFacts)
      .map((item) => ({
        category: safeString(item?.category) || "general",
        detail: safeString(item?.detail),
        confidence:
          item?.confidence === "high" || item?.confidence === "medium" || item?.confidence === "low"
            ? item.confidence
            : ("medium" as const),
      }))
      .filter((item) => item.detail),
    links: uniqueBy(
      pickArray(value.links)
        .map((item) => ({
          label: safeString(item?.label) || "Reference link",
          url: normalizeUrl(item?.url),
        }))
        .filter((item) => item.url),
      (item) => item.url
    ),
    gear: {
      uniform: safeString(value.gear?.uniform) || null,
      checklist: uniqueBy(
        pickArray(value.gear?.checklist).map((item) => safeString(item)).filter(Boolean),
        (item) => item
      ),
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

function buildEmptyParseResult(): ParseResult {
  return {
    eventType: "unknown",
    documentProfile: "unknown",
    title: "",
    dates: "",
    startAt: null,
    endAt: null,
    timezone: null,
    venue: null,
    address: null,
    hostGym: null,
    admission: [],
    athlete: {
      name: null,
      level: null,
      team: null,
      session: null,
      competitionDate: null,
      stretchTime: null,
      marchIn: null,
      assignedGym: null,
      awards: null,
    },
    meetDetails: {
      warmup: null,
      marchIn: null,
      rotationOrder: null,
      judgingNotes: null,
      doorsOpen: null,
      arrivalGuidance: null,
      registrationInfo: null,
      facilityLayout: null,
      scoringInfo: null,
      sessionWindows: [],
      operationalNotes: [],
    },
    logistics: {
      parking: null,
      trafficAlerts: null,
      hotel: null,
      meals: null,
      fees: null,
      waivers: null,
      rideShare: null,
      accessibility: null,
      parkingLinks: [],
    },
    policies: {
      food: null,
      hydration: null,
      safety: null,
      animals: null,
      misc: [],
    },
    contacts: [],
    deadlines: [],
    gear: {
      uniform: null,
      checklist: [],
    },
    volunteers: {
      signupLink: null,
      notes: null,
    },
    communications: {
      announcements: [],
      passcode: null,
    },
    links: [],
    unmappedFacts: [],
  };
}

async function callOpenAiParse(
  text: string,
  evidence: DiscoveryEvidence,
  followup?: string
): Promise<{ result: ParseResult | null; raw: string }> {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const sanitizedText = text.replace(/\u0000/g, " ").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const prompt = buildProfessionalParsePrompt(evidence, sanitizedText, followup);
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
        content: prompt,
      },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw };
}

async function callGeminiParse(
  text: string,
  evidence: DiscoveryEvidence
): Promise<{ result: ParseResult | null; raw: string }> {
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
          parts: [{ text: buildProfessionalParsePrompt(evidence, text) }],
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
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"]
): Promise<{
  parseResult: ParseResult;
  modelUsed: "openai" | "gemini" | "quality-gate";
  rawModelOutput: string;
  evidence: DiscoveryEvidence;
}> {
  const evidence = buildDiscoveryEvidence(extractedText, extractionMeta);
  if (extractionMeta.textQuality === "poor") {
    return {
      parseResult: buildEmptyParseResult(),
      modelUsed: "quality-gate",
      rawModelOutput: JSON.stringify({
        skipped: true,
        reason: "poor_extraction_quality",
        qualitySignals: extractionMeta.qualitySignals || null,
      }),
      evidence,
    };
  }
  let openAiRaw = "";
  let openAiErrorMessage = "";
  try {
    const first = await callOpenAiParse(extractedText, evidence);
    openAiRaw = first.raw;
    if (first.result) {
      return {
        parseResult: first.result,
        modelUsed: "openai",
        rawModelOutput: first.raw,
        evidence,
      };
    }
    const second = await callOpenAiParse(
      extractedText,
      evidence,
      `Your previous output was invalid. Fix and return valid strict JSON only. Previous output:\n${first.raw}`
    );
    openAiRaw = second.raw;
    if (second.result) {
      return {
        parseResult: second.result,
        modelUsed: "openai",
        rawModelOutput: second.raw,
        evidence,
      };
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
  const gemini = await callGeminiParse(extractedText, evidence);
  if (!gemini.result) {
    throw new Error("Gemini returned invalid JSON");
  }
  return {
    parseResult: gemini.result,
    modelUsed: "gemini",
    rawModelOutput: gemini.raw || openAiRaw,
    evidence,
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

function isDateWithinRange(
  value: string,
  start: string | null,
  end: string | null
): boolean {
  const target = safeString(value);
  const lower = safeString(start);
  const upper = safeString(end || start);
  if (!target || !lower || !upper) return false;
  return target >= lower && target <= upper;
}

export async function mapParseResultToGymData(
  parseResult: ParseResult,
  baseData: any = {},
  extractionMeta?: ExtractionResult["extractionMeta"]
) {
  const { date, time } = splitDateTime(parseResult.startAt);
  const derivedRange = deriveDateRangeFromText(parseResult.dates);
  const hasDateConflictWithRange =
    Boolean(date) &&
    Boolean(derivedRange.startDate) &&
    !isDateWithinRange(date, derivedRange.startDate, derivedRange.endDate);
  const authoritativeDate = hasDateConflictWithRange
    ? derivedRange.startDate || ""
    : date;
  const existingAdvanced = (baseData?.advancedSections as Record<string, any>) || {};
  const layoutFacts = uniqueLines(
    sanitizeVenueFactLines(
      pickArray(extractionMeta?.gymLayoutFacts)
        .map((item) => safeString(item))
        .filter(Boolean),
      {
        mode: "strict",
        maxLines: 14,
        requireAnchor: true,
        excludePatterns: [
          /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
          /official results|live scoring|daylight savings/i,
        ],
      }
    ),
    14
  );
  const assignedGym = safeString(existingAdvanced.meet?.assignedGym || "");
  const extractionLayoutImage = safeString(extractionMeta?.gymLayoutImageDataUrl);
  const extractionLayoutZones = normalizeGymLayoutZones(extractionMeta?.gymLayoutZones);
  const assignedGymLayoutImage =
    assignedGym && extractionLayoutImage
      ? await cropGymLayoutImageToAssignedGym(
          extractionLayoutImage,
          extractionLayoutZones,
          assignedGym
        )
      : null;
  const resolvedGymLayoutImage =
    safeString(assignedGymLayoutImage) ||
    extractionLayoutImage ||
    safeString(existingAdvanced.logistics?.gymLayoutImage) ||
    "";
  const resolvedGymLayoutLabel = assignedGym
    ? `Assigned gym location: ${assignedGym}`
    : "";
  const rotationSource = safeString(parseResult.meetDetails.rotationOrder);
  const hasRotationNarrative = /(rotation sheets?|hard cop(y|ies)|download|website|refresh)/i.test(
    rotationSource
  );
  const hasApparatusSignal =
    /(vault|bars|beam|floor|pommel|rings|parallel|high bar|p[-\s]?bars|fx)/i.test(rotationSource);
  const parsedRotationOrder = hasRotationNarrative
    ? []
    : rotationSource
        .split(/[>,|/]+/)
        .map((item) => item.trim())
        .filter(Boolean);
  const rotationOrder = hasApparatusSignal ? parsedRotationOrder : [];
  const rotationNarrative = rotationOrder.length === 0 ? rotationSource : "";
  const dedicatedFieldValues = [
    safeString(parseResult.meetDetails.doorsOpen),
    safeString(parseResult.meetDetails.arrivalGuidance),
    safeString(parseResult.meetDetails.registrationInfo),
    safeString(parseResult.meetDetails.facilityLayout),
    safeString(parseResult.meetDetails.scoringInfo),
  ].filter(Boolean);
  const dedicatedFieldKeys = new Set(
    dedicatedFieldValues
      .map((item) => normalizeVenueFactForCompare(item))
      .filter(Boolean)
  );
  const operationalNotesRaw = uniqueBy(
    [
      ...parseResult.meetDetails.operationalNotes,
      rotationNarrative,
      ...layoutFacts,
    ].filter(Boolean),
    (item) => normalizeVenueFactForCompare(item)
  );
  const operationalNotes = operationalNotesRaw
    .filter((item) => {
      const key = normalizeVenueFactForCompare(item);
      if (!key) return false;
      if (dedicatedFieldKeys.has(key)) return false;
      return true;
    })
    .slice(0, 16);
  const admissionText = parseResult.admission
    .map((item) =>
      [item.label, item.price, item.note].filter(Boolean).join(": ").trim()
    )
    .filter(Boolean)
    .join("\n");
  const policyLines = uniqueBy(
    [
      parseResult.policies.food ? `Food policy: ${parseResult.policies.food}` : "",
      parseResult.policies.hydration ? `Hydration: ${parseResult.policies.hydration}` : "",
      parseResult.policies.safety ? `Safety: ${parseResult.policies.safety}` : "",
      parseResult.policies.animals ? `Animals: ${parseResult.policies.animals}` : "",
      ...parseResult.policies.misc,
    ].filter(Boolean),
    (item) => item
  );
  const detailBlocks = uniqueBy(
    [
      parseResult.dates,
      admissionText,
      parseResult.meetDetails.doorsOpen ? `Doors open: ${parseResult.meetDetails.doorsOpen}` : "",
      parseResult.meetDetails.arrivalGuidance
        ? `Arrival guidance: ${parseResult.meetDetails.arrivalGuidance}`
        : "",
      parseResult.meetDetails.registrationInfo
        ? `Registration: ${parseResult.meetDetails.registrationInfo}`
        : "",
      parseResult.meetDetails.facilityLayout
        ? `Facility layout: ${parseResult.meetDetails.facilityLayout}`
        : "",
      parseResult.meetDetails.scoringInfo ? `Scoring: ${parseResult.meetDetails.scoringInfo}` : "",
      ...layoutFacts.map((item) => `Hall layout: ${item}`),
      ...policyLines,
    ].filter(Boolean),
    (item) => item
  );

  const athlete = parseResult.athlete;
  const existingDocuments = pickArray(existingAdvanced.logistics?.additionalDocuments)
    .map((item) => ({
      id: safeString(item?.id),
      name: safeString(item?.name),
      url: normalizeUrl(item?.url),
    }))
    .filter((item) => item.url);
  const incomingDocuments = [
    parseResult.logistics.waivers
      ? { id: "waiver-1", name: "Waiver", url: normalizeUrl(parseResult.logistics.waivers) }
      : null,
    ...parseResult.logistics.parkingLinks.map((item, idx) => ({
      id: `parking-link-${idx + 1}`,
      name: item.label || `Parking Link ${idx + 1}`,
      url: item.url,
    })),
  ]
    .filter((item): item is { id: string; name: string; url: string } => Boolean(item?.url));
  const additionalDocuments = uniqueBy([...incomingDocuments, ...existingDocuments], (item) => item.url).map(
    (item, idx) => ({
      id: item.id || `doc-${idx + 1}`,
      name: item.name || `Document ${idx + 1}`,
      url: item.url,
    })
  );

  const generatedAnnouncements: Array<{ title: string; body: string }> = [];
  const existingAnnouncementEntries: Array<{ title: string; body: string }> = pickArray(
    existingAdvanced.announcements?.announcements
  )
    .map((item) => ({
      title: "",
      body: safeString(item?.text || item?.body || item?.title),
    }))
    .filter((item) => item.body);
  if (parseResult.meetDetails.doorsOpen) {
    generatedAnnouncements.push({ title: "Doors Open", body: parseResult.meetDetails.doorsOpen });
  }
  if (parseResult.meetDetails.arrivalGuidance) {
    generatedAnnouncements.push({
      title: "Arrival Guidance",
      body: parseResult.meetDetails.arrivalGuidance,
    });
  }
  if (parseResult.meetDetails.registrationInfo) {
    generatedAnnouncements.push({
      title: "Registration",
      body: parseResult.meetDetails.registrationInfo,
    });
  }
  if (parseResult.meetDetails.scoringInfo) {
    generatedAnnouncements.push({
      title: "Scoring Information",
      body: parseResult.meetDetails.scoringInfo,
    });
  }
  for (const item of parseResult.deadlines) {
    generatedAnnouncements.push({
      title: item.label || "Deadline",
      body: [item.date, item.note].filter(Boolean).join(" — "),
    });
  }
  for (const item of parseResult.contacts) {
    generatedAnnouncements.push({
      title: item.role || "Contact",
      body: [item.name, item.email, item.phone].filter(Boolean).join(" • "),
    });
  }
  for (const item of parseResult.unmappedFacts.filter((fact) => fact.confidence !== "low")) {
    generatedAnnouncements.push({
      title: item.category || "Additional details",
      body: item.detail,
    });
  }
  for (const line of policyLines) {
    generatedAnnouncements.push({
      title: "Policy",
      body: line,
    });
  }
  const mergedAnnouncements = uniqueBy(
    [
      ...parseResult.communications.announcements,
      ...generatedAnnouncements,
      ...existingAnnouncementEntries,
    ].filter(
      (item) => safeString(item.title) || safeString(item.body)
    ),
    (item) => `${safeString(item.title)}|${safeString(item.body)}`
  );

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
      assignedGym: assignedGym || safeString(existingAdvanced.meet?.assignedGym) || "",
      rotationOrder,
      judgingNotes: [parseResult.meetDetails.judgingNotes, rotationNarrative]
        .filter(Boolean)
        .join("\n\n"),
      startApparatus: rotationOrder[0] || "",
      doorsOpen: parseResult.meetDetails.doorsOpen || "",
      arrivalGuidance: parseResult.meetDetails.arrivalGuidance || "",
      registrationInfo: parseResult.meetDetails.registrationInfo || "",
      facilityLayout: parseResult.meetDetails.facilityLayout || "",
      scoringInfo: parseResult.meetDetails.scoringInfo || "",
      sessionWindows: parseResult.meetDetails.sessionWindows || [],
      operationalNotes,
    },
    logistics: {
      ...(existingAdvanced.logistics || {}),
      hotelName: parseResult.logistics.hotel || "",
      mealPlan: parseResult.logistics.meals || "",
      feeAmount: parseResult.logistics.fees || "",
      additionalDocuments,
      parking: parseResult.logistics.parking || "",
      trafficAlerts: parseResult.logistics.trafficAlerts || "",
      rideShare: parseResult.logistics.rideShare || "",
      accessibility: parseResult.logistics.accessibility || "",
      policyFood: parseResult.policies.food || "",
      policyHydration: parseResult.policies.hydration || "",
      policySafety: parseResult.policies.safety || "",
      policyAnimals: parseResult.policies.animals || "",
      gymLayoutImage: resolvedGymLayoutImage,
      gymLayoutLabel: resolvedGymLayoutLabel,
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
      announcements: mergedAnnouncements.map((item, idx) => ({
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

  const mappedDate =
    authoritativeDate ||
    derivedRange.startDate ||
    safeString(baseData?.date) ||
    "";
  const mappedTime = (() => {
    if (authoritativeDate) return time || safeString(baseData?.time) || "";
    if (parseResult.startAt) return time || "";
    if (safeString(baseData?.date) === mappedDate) return safeString(baseData?.time) || "";
    return "";
  })();
  const mappedStartISO = (() => {
    if (parseResult.startAt && !hasDateConflictWithRange) return parseResult.startAt;
    const existingStart = safeString(baseData?.startISO);
    if (existingStart && mappedDate && existingStart.startsWith(mappedDate)) {
      return existingStart;
    }
    return null;
  })();
  const mappedEndISO = (() => {
    if (parseResult.endAt && !hasDateConflictWithRange) return parseResult.endAt;
    const existingEnd = safeString(baseData?.endISO);
    if (existingEnd && mappedDate && existingEnd.startsWith(mappedDate)) {
      return existingEnd;
    }
    return null;
  })();

  return {
    ...baseData,
    title: parseResult.title || baseData?.title || "",
    details: uniqueBy([baseData?.details, ...detailBlocks].filter(Boolean), (item) => item).join("\n\n"),
    date: mappedDate,
    time: mappedTime,
    startISO: mappedStartISO,
    endISO: mappedEndISO,
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
      discoveryDocumentProfile: parseResult.documentProfile,
      meetDateRangeLabel: derivedRange.label || "",
      meetDateRangeStart: derivedRange.startDate,
      meetDateRangeEnd: derivedRange.endDate,
      advancedSections: nextAdvanced,
    },
    links: uniqueBy(
      [...parseResult.links, ...parseResult.logistics.parkingLinks].filter((item) => item.url),
      (item) => item.url
    ),
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
      ]),
      details: getStatusFromFlags([
        Boolean(safeString(data?.details)),
        Boolean(
          safeString(
            meet?.warmUpTime ||
              meet?.judgingNotes ||
              meet?.sessionNumber ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo ||
              meet?.facilityLayout ||
              meet?.scoringInfo
          )
        ),
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
        Boolean(
          safeString(
            meet?.warmUpTime ||
              meet?.marchInTime ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo
          )
        ),
        Boolean(safeString(meet?.facilityLayout || meet?.scoringInfo || meet?.judgingNotes)),
        (Array.isArray(meet?.rotationOrder) && meet.rotationOrder.length > 0) ||
          (Array.isArray(meet?.sessionWindows) && meet.sessionWindows.length > 0) ||
          (Array.isArray(meet?.operationalNotes) && meet.operationalNotes.length > 0),
      ]),
      practicePlanner:
        Array.isArray(practice?.blocks) && practice.blocks.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      logisticsTravel: getStatusFromFlags([
        Boolean(safeString(logistics?.hotelName || logistics?.hotelAddress)),
        Boolean(safeString(logistics?.mealPlan || logistics?.policyFood)),
        Boolean(
          safeString(
            logistics?.feeAmount ||
              logistics?.parking ||
              logistics?.trafficAlerts ||
              logistics?.rideShare ||
              logistics?.accessibility
          )
        ),
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
