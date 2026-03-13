import OpenAI from "openai";
import sharp from "sharp";
import { inflateRawSync, inflateSync } from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  createDiscoveryRequestCache,
  getOrCreatePdfPageImage,
  getOrCreateWeakCacheValue,
  type DiscoveryRequestCache,
} from "@/lib/meet-discovery/cache";
import { getVisionClient } from "@/lib/gcp";
import { normalizeAccessControlPayload } from "@/lib/event-access";
import {
  normalizeVenueFactForCompare,
  sanitizeVenueFactLines,
} from "@/lib/venue-facts";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";
import { computeGymBuilderStatuses } from "@/lib/meet-discovery/status";

export { computeGymBuilderStatuses };

export type DiscoverySourceInput =
  | {
      type: "file";
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl?: string | null;
      blobStored?: boolean;
    }
  | {
      type: "url";
      url: string;
    };

type ScheduleColorTarget = "session" | "club";

type ScheduleColorRef = {
  legendId: string | null;
  textColorHex: string | null;
  confidence: number | null;
};

type ScheduleColorLegendEntry = {
  id: string | null;
  target: ScheduleColorTarget | null;
  colorHex: string | null;
  colorLabel: string | null;
  meaning: string | null;
  sourceText: string | null;
  teamAwardEligible: boolean | null;
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
    resultsInfo: string | null;
    rotationSheetsInfo: string | null;
    awardsInfo: string | null;
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
    parkingPricingLinks: Array<{ label: string; url: string }>;
  };
  policies: {
    food: string | null;
    hydration: string | null;
    safety: string | null;
    animals: string | null;
    misc: string[];
  };
  coachInfo: {
    signIn: string | null;
    attire: string | null;
    hospitality: string | null;
    floorAccess: string | null;
    scratches: string | null;
    floorMusic: string | null;
    rotationSheets: string | null;
    awards: string | null;
    regionalCommitment: string | null;
    qualification: string | null;
    meetFormat: string | null;
    equipment: string | null;
    refundPolicy: string | null;
    paymentInstructions: string | null;
    entryFees: Array<{ label: string; amount: string; note: string | null }>;
    teamFees: Array<{ label: string; amount: string; note: string | null }>;
    lateFees: Array<{
      label: string;
      amount: string;
      trigger: string | null;
      note: string | null;
    }>;
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
    links: Array<{ label: string; url: string }>;
    notes: string[];
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
  schedule: {
    venueLabel: string | null;
    supportEmail: string | null;
    notes: string[];
    colorLegend?: ScheduleColorLegendEntry[];
    awardLegend?: Array<{
      colorHex?: string | null;
      colorLabel: string | null;
      meaning: string | null;
      teamAwardEligible: boolean | null;
    }>;
    annotations?: Array<{
      kind: string | null;
      level: string | null;
      sessionCode: string | null;
      date: string | null;
      time: string | null;
      text: string;
    }>;
    assignments?: Array<{
      level: string | null;
      groupLabel: string | null;
      sessionCode: string | null;
      birthDateRange: string | null;
      divisionLabel: string | null;
      note: string | null;
    }>;
    days: Array<{
      date: string | null;
      shortDate: string | null;
      sessions: Array<{
        code: string | null;
        group: string | null;
        startTime: string | null;
        warmupTime: string | null;
        note: string | null;
        color?: ScheduleColorRef | null;
        clubs: Array<{
          name: string | null;
          teamAwardEligible: boolean | null;
          athleteCount: number | null;
          divisionLabel: string | null;
          color?: ScheduleColorRef | null;
        }>;
      }>;
    }>;
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

type CoachPageHint = {
  page: number;
  heading: string | null;
  excerpt: string;
};

type DiscoveryLinkKind = "asset" | "html" | "external";

type DiscoveredLink = {
  url: string;
  label: string;
  sourceUrl: string;
  depth: 0 | 1;
  kind: DiscoveryLinkKind;
  sameHost: boolean;
  followed: boolean;
  contentType?: string | null;
};

type CrawledPage = {
  url: string;
  title: string | null;
  depth: 0 | 1;
};

export type DiscoveryWorkflow = "gymnastics" | "football";
export type DiscoveryMode = "core" | "enrich";

type DiscoveryUsageStage =
  | "parse"
  | "scheduleText"
  | "scheduleVisual"
  | "gymLayoutVision";

type DiscoveryTokenUsage = Partial<
  Record<
    DiscoveryUsageStage,
    {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      cachedTokens?: number;
    }
  >
>;

export type DiscoveryPerformance = {
  pdfParseMs: number;
  ocrMs: number;
  ocrPageCount: number;
  gymLayoutScanMs: number;
  gymLayoutAiCalls: number;
  scheduleTextParseMs: number;
  scheduleVisionCalls: number;
  modelParseMs: number;
  persistMs: number;
  tokenUsage?: DiscoveryTokenUsage | null;
};

export type DiscoveryExtractionOptions = {
  workflow?: DiscoveryWorkflow;
  mode?: DiscoveryMode;
  budgetMs?: number;
  debugArtifacts?: boolean;
  performance?: DiscoveryPerformance;
};

export type DiscoveryEnrichmentState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "not_applicable";

export type DiscoveryEnrichmentStatus = {
  state: DiscoveryEnrichmentState;
  pending: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
  performance: DiscoveryPerformance;
};

type ExtractionResult = {
  extractedText: string;
  extractionMeta: {
    sourceType: "file" | "url";
    usedOcr: boolean;
    linkedAssets: Array<{ url: string; contentType: string }>;
    discoveredLinks?: DiscoveredLink[];
    crawledPages?: CrawledPage[];
    pageTitle?: string | null;
    gymLayoutImageDataUrl?: string | null;
    gymLayoutFacts?: string[];
    gymLayoutZones?: GymLayoutZone[];
    gymLayoutPage?: number | null;
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    coachPageHints?: CoachPageHint[];
    textQuality?: TextQuality | null;
    qualitySignals?: TextQualitySignals | null;
    schedulePageImages?: Array<{ pageNumber: number; dataUrl: string | null }>;
    schedulePageTexts?: Array<{ pageNumber: number; text: string }>;
    scheduleDiagnostics?: {
      selectedSchedulePages: number[];
      selectedScheduleSegments?: Array<{
        pageNumber: number;
        kind: "grid" | "narrative" | "assignment";
        reason: string;
      }>;
      rejectedScheduleSegments?: Array<{
        pageNumber: number;
        reason: string;
      }>;
      ambiguityNotes?: string[];
      extractedDateLines: string[];
      parsedFromTextDayCount: number;
      parsedFromImageDayCount: number;
      finalDayCount: number;
      usedImageTableExtraction: boolean;
      usedTextFallback: boolean;
      usedImageAwardExtraction: boolean;
      staleStoredScheduleDetected: boolean;
      tableBlocksDetected?: number;
      tableCropCount?: number;
      tableRepairApplied?: boolean;
      fallbackMetadataApplied?: boolean;
    };
  };
  performance: DiscoveryPerformance;
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
    coachHints: string[];
    linkHints: Array<{ label: string; url: string }>;
  };
  sections: {
    spectator: string[];
    venue: string[];
    traffic: string[];
    policy: string[];
    coachOps: string[];
    registration: string[];
  };
  dateAnalysis: {
    primaryCandidate: {
      label: string;
      startDate: string | null;
      endDate: string | null;
      line: string;
      score: number;
    } | null;
    ignoredCandidates: Array<{
      label: string;
      line: string;
      score: number;
      reason: string;
    }>;
  };
  snippets: {
    firstLines: string[];
    additionalInfoLines: string[];
    trafficLines: string[];
    hallLayoutLines: string[];
    coachLines: string[];
  };
};

type CrawlCandidate = DiscoveredLink & {
  score: number;
};

type UrlDiscoveryTestHooks = {
  fetchWithLimit?: (
    url: string
  ) => Promise<{ contentType: string; buffer: Buffer; text: string }>;
  extractTextFromPdf?: (
    buffer: Buffer,
    options?: {
      budgetMs?: number;
      performance?: DiscoveryPerformance;
      cache?: DiscoveryRequestCache;
      mode?: DiscoveryMode;
    }
  ) => Promise<{
    text: string;
    usedOcr: boolean;
    coachPageHints: CoachPageHint[];
    textQuality: TextQuality;
    qualitySignals: TextQualitySignals;
    pages?: Array<{ num: number; text: string }>;
  }>;
  extractTextFromImage?: (
    buffer: Buffer,
    cache?: DiscoveryRequestCache
  ) => Promise<string>;
  extractGymLayoutImageFromPdf?: (
    buffer: Buffer,
    options?: {
      maxPages?: number;
      maxAiCandidates?: number;
      performance?: DiscoveryPerformance;
      budgetMs?: number;
      cache?: DiscoveryRequestCache;
    }
  ) => Promise<GymLayoutExtraction>;
  openAiExtractGymLayoutZones?: (
    buffer: Buffer,
    mimeType?: string,
    performance?: DiscoveryPerformance
  ) => Promise<GymLayoutZone[]>;
  toOptimizedImageDataUrl?: (
    buffer: Buffer,
    cache?: DiscoveryRequestCache
  ) => Promise<string | null>;
};

const MAX_FETCHED_LINKED_ASSETS = 8;
const MAX_FOLLOWED_CHILD_PAGES = 3;
const MAX_DISCOVERED_LINKS = 24;
const MAX_FETCH_BYTES = 7 * 1024 * 1024;
const LOW_TEXT_THRESHOLD = 200;
const DEFAULT_DISCOVERY_CORE_BUDGET_MS = 25_000;
const DEFAULT_DISCOVERY_ENRICH_BUDGET_MS = 45_000;
const execFileAsync = promisify(execFile);
let pdfRenderDepsPromise: Promise<
  | {
      pdfjs: any;
      createCanvas: (width: number, height: number) => any;
    }
  | null
> | null = null;
let urlDiscoveryTestHooks: UrlDiscoveryTestHooks | null = null;

export function createDiscoveryPerformance(
  seed: Partial<DiscoveryPerformance> = {}
): DiscoveryPerformance {
  return {
    pdfParseMs: 0,
    ocrMs: 0,
    ocrPageCount: 0,
    gymLayoutScanMs: 0,
    gymLayoutAiCalls: 0,
    scheduleTextParseMs: 0,
    scheduleVisionCalls: 0,
    modelParseMs: 0,
    persistMs: 0,
    tokenUsage: null,
    ...seed,
  };
}

export function resolveDiscoveryBudget(mode: DiscoveryMode): number {
  const raw =
    mode === "enrich"
      ? process.env.DISCOVERY_ENRICH_BUDGET_MS
      : process.env.DISCOVERY_CORE_BUDGET_MS;
  const fallback =
    mode === "enrich"
      ? DEFAULT_DISCOVERY_ENRICH_BUDGET_MS
      : DEFAULT_DISCOVERY_CORE_BUDGET_MS;
  const parsed = Number.parseInt(safeString(raw), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isDiscoveryDebugArtifactsEnabled(): boolean {
  return safeString(process.env.DISCOVERY_DEBUG_ARTIFACTS) === "1";
}

function normalizeDiscoveryExtractionOptions(
  options?: DiscoveryExtractionOptions
): Required<DiscoveryExtractionOptions> {
  return {
    workflow: options?.workflow || "gymnastics",
    mode: options?.mode || "core",
    budgetMs:
      typeof options?.budgetMs === "number" && Number.isFinite(options.budgetMs) && options.budgetMs > 0
        ? options.budgetMs
        : resolveDiscoveryBudget(options?.mode || "core"),
    debugArtifacts:
      typeof options?.debugArtifacts === "boolean"
        ? options.debugArtifacts
        : isDiscoveryDebugArtifactsEnabled(),
    performance: options?.performance || createDiscoveryPerformance(),
  };
}

function normalizeTokenUsage(usage: any) {
  if (!usage || typeof usage !== "object") return null;
  const promptTokens =
    Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0;
  const completionTokens =
    Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0;
  const totalTokens =
    Number(usage.total_tokens ?? promptTokens + completionTokens) || 0;
  const cachedTokens =
    Number(
      usage.prompt_tokens_details?.cached_tokens ??
        usage.input_tokens_details?.cached_tokens ??
        0
    ) || 0;
  if (!promptTokens && !completionTokens && !totalTokens && !cachedTokens) {
    return null;
  }
  return { promptTokens, completionTokens, totalTokens, cachedTokens };
}

function recordDiscoveryUsage(
  performance: DiscoveryPerformance | undefined,
  stage: DiscoveryUsageStage,
  usage: any
) {
  if (!performance) return;
  const normalized = normalizeTokenUsage(usage);
  if (!normalized) return;
  const existing = performance.tokenUsage?.[stage];
  performance.tokenUsage = performance.tokenUsage || {};
  performance.tokenUsage[stage] = {
    promptTokens: (existing?.promptTokens || 0) + normalized.promptTokens,
    completionTokens:
      (existing?.completionTokens || 0) + normalized.completionTokens,
    totalTokens: (existing?.totalTokens || 0) + normalized.totalTokens,
    cachedTokens: (existing?.cachedTokens || 0) + normalized.cachedTokens,
  };
}

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

type PdfTextExtraction = {
  text: string;
  pages: Array<{ num: number; text: string }>;
};

type ScheduleAwardFlagDay = {
  date: string | null;
  sessions: Array<{
    code: string | null;
    clubs: Array<{
      name: string | null;
      teamAwardEligible: boolean | null;
    }>;
  }>;
};

type ScheduleImageDerivationResult = {
  schedule: ParseResult["schedule"];
  tableBlocksDetected: number;
  tableCropCount: number;
};

type ScheduleRepairResult = {
  schedule: ParseResult["schedule"];
  tableRepairApplied: boolean;
  fallbackMetadataApplied: boolean;
};

type NormalizedScheduleColorBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type ScheduleColorPageLegendEntry = {
  target: ScheduleColorTarget | null;
  meaning: string | null;
  colorLabel: string | null;
  sourceText: string | null;
  teamAwardEligible: boolean | null;
  sessionCodes: string[];
  clubNames: string[];
};

type ScheduleColorPageSessionItem = {
  sessionCode: string | null;
  group: string | null;
  box: NormalizedScheduleColorBox | null;
  confidence: number | null;
};

type ScheduleColorPageClubItem = {
  sessionCode: string | null;
  clubName: string | null;
  teamAwardEligible: boolean | null;
  box: NormalizedScheduleColorBox | null;
  confidence: number | null;
};

type ScheduleColorPageAnalysis = {
  legendEntries: ScheduleColorPageLegendEntry[];
  sessions: ScheduleColorPageSessionItem[];
  clubs: ScheduleColorPageClubItem[];
};

type ScheduleColorOcrTextBox = {
  text: string;
  normalizedText: string;
  clubLookup: string;
  box: NormalizedScheduleColorBox;
  area: number;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const HOST_GYM_PACKET_TEXT_PATTERN =
  /\b(?:please review|following items enclosed|this packet|info packet|packet:|competition to follow|recognized at|award ceremony)\b/i;
const HOST_GYM_EVENT_TITLE_PATTERN =
  /\b(?:state championships?|regional championships?|national championships?|session\s+[A-Z]{2}\d+|schedule|info packet|meet packet)\b/i;

function sanitizeHostGymValue(value: unknown): string | null {
  let text = safeString(value).replace(/\s+/g, " ").trim();
  if (!text) return null;

  const hostedByMatch = text.match(/^(?:host(?:ed)?\s+by[:\s-]*)(.+)$/i);
  if (hostedByMatch?.[1]) {
    text = hostedByMatch[1].replace(/\s+/g, " ").trim();
  }

  const proudHostMatch = text.match(/^(.+?)\s+is proud to host\b/i);
  if (proudHostMatch?.[1]) {
    text = proudHostMatch[1].replace(/\s+/g, " ").trim();
  }

  text = text.replace(/^host(?:ed)?\s+by[:\s-]*/i, "").replace(/[,:;.\-]+$/g, "").trim();
  if (!text) return null;
  if (HOST_GYM_PACKET_TEXT_PATTERN.test(text)) return null;
  if (HOST_GYM_EVENT_TITLE_PATTERN.test(text)) return null;
  if (/^(?:team award eligible|award category)\b/i.test(text)) return null;
  if (text.length > 96) return null;
  if (/[.!?]/.test(text) && text.split(/\s+/).length > 8) return null;
  return text;
}

function isProbableHostGymHint(value: unknown): boolean {
  const original = safeString(value).replace(/\s+/g, " ").trim();
  const candidate = sanitizeHostGymValue(original);
  if (!original || !candidate) return false;
  const hasHostCue = /\bhost(?:ed)?\b/i.test(original);
  const hasOrgCue = /\b(?:gym|gymnastics|academy|club|team|usa competitions)\b/i.test(candidate);
  if (!hasHostCue && !hasOrgCue) return false;
  if (!hasHostCue && HOST_GYM_EVENT_TITLE_PATTERN.test(candidate)) return false;
  return true;
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

function normalizeColorHex(value: unknown): string {
  const raw = safeString(value).toLowerCase();
  if (!raw) return "";
  const match = raw.match(/^#?([0-9a-f]{6})$/i);
  if (match) return `#${match[1].toLowerCase()}`;
  return "";
}

function normalizeScheduleColorRef(value: unknown): ScheduleColorRef | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, any>;
  const legendId = safeString(raw.legendId) || null;
  const textColorHex = normalizeColorHex(raw.textColorHex) || null;
  const confidence =
    typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
      ? Math.max(0, Math.min(1, raw.confidence))
      : null;
  if (!legendId && !textColorHex && confidence == null) return null;
  return { legendId, textColorHex, confidence };
}

function sanitizeScheduleColorLegendEntries(
  entries: Array<ScheduleColorLegendEntry | Record<string, any>>
): ScheduleColorLegendEntry[] {
  return uniqueBy(
    entries
      .map((entry, index) => ({
        id: safeString((entry as any)?.id) || null,
        target:
          safeString((entry as any)?.target) === "session" ||
          safeString((entry as any)?.target) === "club"
            ? (safeString((entry as any)?.target) as ScheduleColorTarget)
            : null,
        colorHex: normalizeColorHex((entry as any)?.colorHex) || null,
        colorLabel: safeString((entry as any)?.colorLabel) || null,
        meaning: safeString((entry as any)?.meaning) || null,
        sourceText: safeString((entry as any)?.sourceText) || null,
        teamAwardEligible:
          typeof (entry as any)?.teamAwardEligible === "boolean"
            ? (entry as any).teamAwardEligible
            : null,
      }))
      .filter((entry) => {
        if (
          /(recognized at|competition floor|awards ceremony following|please review|host the|following items enclosed|team awards at approx)/i.test(
            safeString(entry.meaning)
          )
        ) {
          return false;
        }
        return Boolean(
          entry.id ||
            entry.meaning ||
            entry.colorHex ||
            entry.colorLabel ||
            entry.sourceText ||
            typeof entry.teamAwardEligible === "boolean"
        );
      })
      .map((entry, index) => ({
        ...entry,
        id:
          entry.id ||
          `schedule-color-${entry.target || "unknown"}-${slugifyScheduleToken(
            entry.meaning || entry.colorHex || entry.colorLabel || `entry-${index + 1}`,
            `entry-${index + 1}`
          )}`,
      })),
    (entry) =>
      `${entry.id || ""}|${entry.target || ""}|${entry.colorHex || ""}|${entry.colorLabel || ""}|${entry.meaning || ""}|${entry.sourceText || ""}|${entry.teamAwardEligible ?? ""}`
  );
}

function deriveAwardLegendFromColorLegend(entries: ScheduleColorLegendEntry[]): Array<{
  colorHex: string;
  colorLabel: string;
  meaning: string;
  teamAwardEligible: boolean | null;
}> {
  return sanitizeScheduleColorLegendEntries(entries)
    .filter((entry) => entry.target === "club" && typeof entry.teamAwardEligible === "boolean")
    .map((entry) => ({
      colorHex: entry.colorHex || "",
      colorLabel: entry.colorLabel || "",
      meaning: entry.meaning || "",
      teamAwardEligible: entry.teamAwardEligible,
    }));
}

type StoredGymMeetScheduleClub = {
  id: string;
  name: string;
  teamAwardEligible: boolean | null;
  athleteCount: number | null;
  divisionLabel: string;
  color: ScheduleColorRef | null;
};

type StoredGymMeetScheduleSession = {
  id: string;
  code: string;
  label: string;
  group: string;
  startTime: string;
  warmupTime: string;
  note: string;
  color: ScheduleColorRef | null;
  clubs: StoredGymMeetScheduleClub[];
};

type StoredGymMeetScheduleDay = {
  id: string;
  date: string;
  shortDate: string;
  isoDate: string;
  sessions: StoredGymMeetScheduleSession[];
};

type StoredGymMeetSchedule = {
  enabled: boolean;
  venueLabel: string;
  supportEmail: string;
  notes: string[];
  colorLegend: ScheduleColorLegendEntry[];
  awardLegend: Array<{
    colorHex: string;
    colorLabel: string;
    meaning: string;
    teamAwardEligible: boolean | null;
  }>;
  annotations: Array<{
    id: string;
    kind: string;
    level: string;
    sessionCode: string;
    date: string;
    time: string;
    text: string;
  }>;
  assignments: Array<{
    id: string;
    level: string;
    groupLabel: string;
    sessionCode: string;
    birthDateRange: string;
    divisionLabel: string;
    note: string;
  }>;
  days: StoredGymMeetScheduleDay[];
};

function compareScheduleSessionCodes(a: string, b: string): number {
  const left = safeString(a).toUpperCase();
  const right = safeString(b).toUpperCase();
  const leftMatch = left.match(/^([A-Z]+)(\d+)$/);
  const rightMatch = right.match(/^([A-Z]+)(\d+)$/);
  if (leftMatch && rightMatch) {
    const prefixDelta = leftMatch[1].localeCompare(rightMatch[1]);
    if (prefixDelta !== 0) return prefixDelta;
    return Number(leftMatch[2]) - Number(rightMatch[2]);
  }
  return left.localeCompare(right);
}

const SCHEDULE_DATE_LINE_PATTERN =
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?\b/i;
function slugifyScheduleToken(value: unknown, fallback: string): string {
  const normalized = safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function formatScheduleShortDate(value: string): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
      .format(date)
      .replace(",", " •");
  } catch {
    return raw;
  }
}

function formatScheduleIsoDate(value: string): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function deriveScheduleContextYear(text: string): string {
  const primary = classifyMeetDateCandidates(text).primary;
  if (primary?.startDate) return primary.startDate.slice(0, 4);
  const yearMatch = safeString(text).match(/\b(20\d{2})\b/);
  return yearMatch?.[1] || "";
}

function normalizeScheduleDayLabelWithContext(value: string, fallbackYear: string): string {
  const raw = safeString(value).replace(/\s+/g, " ");
  if (!raw) return "";
  if (/\b20\d{2}\b/.test(raw) || !fallbackYear) return raw;
  return `${raw.replace(/,\s*$/, "")}, ${fallbackYear}`;
}

function normalizeStoredSchedule(
  value: unknown,
  fallback: Partial<StoredGymMeetSchedule> = {}
): StoredGymMeetSchedule {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, any>;
  const days = pickArray(raw.days)
    .map((day, dayIndex) => {
      const date = safeString(day?.date);
      const isoDate = safeString(day?.isoDate) || formatScheduleIsoDate(date);
      const shortDate = safeString(day?.shortDate) || formatScheduleShortDate(date);
      const dayId =
        safeString(day?.id) ||
        `${slugifyScheduleToken(isoDate || shortDate || date, `day-${dayIndex + 1}`)}`;
      const sessions = pickArray(day?.sessions)
        .map((session, sessionIndex) => {
          const code = safeString(session?.code);
          const group = safeString(session?.group);
          const label = safeString(session?.label) || (code ? `Session ${code}` : `Session ${sessionIndex + 1}`);
          const clubs = uniqueBy(
            pickArray(session?.clubs)
              .map((club, clubIndex) => ({
                id:
                  safeString(club?.id) ||
                  `${dayId}-${slugifyScheduleToken(code || label, `session-${sessionIndex + 1}`)}-club-${clubIndex + 1}`,
                name: safeString(club?.name),
                teamAwardEligible:
                  typeof club?.teamAwardEligible === "boolean"
                    ? club.teamAwardEligible
                    : null,
                athleteCount:
                  typeof club?.athleteCount === "number" && Number.isFinite(club.athleteCount)
                    ? club.athleteCount
                    : null,
                divisionLabel: safeString(club?.divisionLabel),
                color: normalizeScheduleColorRef(club?.color),
              }))
              .filter((club) => club.name),
            (club) => [club.name, club.divisionLabel, `${club.athleteCount ?? ""}`].join("|")
          );
          if (!code && !group && !safeString(session?.startTime) && clubs.length === 0) return null;
          const sessionSlug = slugifyScheduleToken(code || label || group, `session-${sessionIndex + 1}`);
          return {
            id: safeString(session?.id) || `${dayId}-${sessionSlug}`,
            code,
            label,
            group,
            startTime: safeString(session?.startTime),
            warmupTime: safeString(session?.warmupTime),
            note: safeString(session?.note),
            color: normalizeScheduleColorRef(session?.color),
            clubs,
          };
        })
        .filter((session): session is StoredGymMeetScheduleSession => Boolean(session))
        .sort((a, b) => compareScheduleSessionCodes(a.code, b.code));
      if (!date && !shortDate && sessions.length === 0) return null;
      return {
        id: dayId,
        date,
        shortDate,
        isoDate,
        sessions,
      };
    })
    .filter((day): day is StoredGymMeetScheduleDay => Boolean(day));

  return {
    enabled: raw.enabled !== false,
    venueLabel: safeString(raw.venueLabel || fallback.venueLabel),
    supportEmail: safeString(raw.supportEmail || fallback.supportEmail),
    notes: uniqueBy(
      [
        ...pickArray(raw.notes).map((item) => safeString(item)).filter(Boolean),
        ...pickArray(fallback.notes).map((item) => safeString(item)).filter(Boolean),
      ],
      (item) => item
    ),
    colorLegend: uniqueBy(
      [
        ...sanitizeScheduleColorLegendEntries(pickArray(raw.colorLegend) as any),
        ...sanitizeScheduleColorLegendEntries(pickArray(fallback.colorLegend) as any),
      ],
      (item) =>
        `${item.id || ""}|${item.target || ""}|${item.colorHex || ""}|${item.colorLabel || ""}|${item.meaning || ""}|${item.sourceText || ""}|${item.teamAwardEligible ?? ""}`
    ),
    awardLegend: uniqueBy(
      [
        ...pickArray(raw.awardLegend)
          .map((item) => ({
            colorHex: normalizeColorHex(item?.colorHex),
            colorLabel: safeString(item?.colorLabel),
            meaning: safeString(item?.meaning),
            teamAwardEligible:
              typeof item?.teamAwardEligible === "boolean" ? item.teamAwardEligible : null,
          }))
          .filter((item) => item.meaning || typeof item.teamAwardEligible === "boolean"),
        ...pickArray(fallback.awardLegend)
          .map((item) => ({
            colorHex: normalizeColorHex(item?.colorHex),
            colorLabel: safeString(item?.colorLabel),
            meaning: safeString(item?.meaning),
            teamAwardEligible:
              typeof item?.teamAwardEligible === "boolean" ? item.teamAwardEligible : null,
          }))
          .filter((item) => item.meaning || typeof item.teamAwardEligible === "boolean"),
        ...deriveAwardLegendFromColorLegend([
          ...sanitizeScheduleColorLegendEntries(pickArray(raw.colorLegend) as any),
          ...sanitizeScheduleColorLegendEntries(pickArray(fallback.colorLegend) as any),
        ]),
      ],
      (item) =>
        `${item.meaning}|${item.colorHex || ""}|${item.colorLabel}|${item.teamAwardEligible ?? ""}`
    ),
    annotations: uniqueBy(
      [
        ...pickArray(raw.annotations),
        ...pickArray(fallback.annotations),
      ]
        .map((item, index) => ({
          id: safeString(item?.id) || `schedule-annotation-${index + 1}`,
          kind: safeString(item?.kind),
          level: safeString(item?.level),
          sessionCode: safeString(item?.sessionCode).toUpperCase(),
          date: safeString(item?.date),
          time: safeString(item?.time),
          text: safeString(item?.text),
        }))
        .filter((item) => item.text),
      (item) =>
        [item.kind, item.level, item.sessionCode, item.date, item.time, item.text].join("|")
    ),
    assignments: uniqueBy(
      [
        ...pickArray(raw.assignments),
        ...pickArray(fallback.assignments),
      ]
        .map((item, index) => ({
          id: safeString(item?.id) || `schedule-assignment-${index + 1}`,
          level: safeString(item?.level),
          groupLabel: safeString(item?.groupLabel),
          sessionCode: safeString(item?.sessionCode).toUpperCase(),
          birthDateRange: safeString(item?.birthDateRange),
          divisionLabel: safeString(item?.divisionLabel),
          note: safeString(item?.note),
        }))
        .filter(
          (item) =>
            item.sessionCode || item.groupLabel || item.birthDateRange || item.divisionLabel || item.note
        ),
      (item) =>
        [
          item.level,
          item.groupLabel,
          item.sessionCode,
          item.birthDateRange,
          item.divisionLabel,
          item.note,
        ].join("|")
    ),
    days,
  };
}

function hasStoredScheduleContent(value: unknown): boolean {
  const schedule = normalizeStoredSchedule(value);
  return schedule.days.some(
    (day) =>
      day.sessions.some(
        (session) => session.clubs.length > 0 || session.group || session.startTime || session.code
      )
  );
}

function extractScheduleDateLines(text: string): string[] {
  return uniqueBy(
    safeString(text)
      .split(/\n+/)
      .map((line) => safeString(line))
      .filter((line) => SCHEDULE_DATE_LINE_PATTERN.test(line)),
    (line) => line
  );
}

function looksLikeSchedulePageText(text: string): boolean {
  const combined = safeString(text);
  if (!combined) return false;
  const scheduleSignals = (combined.match(/session\s+[a-z]{1,3}\d+/gi) || []).length;
  return (
    SCHEDULE_GRID_TEXT_PATTERN.test(combined) ||
    scheduleSignals >= 2 ||
    (SCHEDULE_DATE_LINE_PATTERN.test(combined) &&
      /(stretch\/warmup|warmup|bronze|silver|gold|platinum|diamond)/i.test(combined))
  );
}

function isCodeOnlyScheduleSession(
  session: Pick<StoredGymMeetScheduleSession, "code" | "group" | "startTime" | "warmupTime" | "note" | "clubs">
): boolean {
  return Boolean(session.code) &&
    !session.group &&
    !session.startTime &&
    !session.warmupTime &&
    !session.note &&
    session.clubs.length === 0;
}

function isStaleDerivedSchedule(value: unknown, extractedText = ""): boolean {
  const schedule = normalizeStoredSchedule(value);
  if (!schedule.days.length) return false;
  const sessions = schedule.days.flatMap((day) => day.sessions);
  if (!sessions.length) return false;
  const extractedDayCount = extractScheduleDateLines(extractedText).length;
  const sessionsWithTimes = sessions.filter((session) => session.startTime || session.warmupTime).length;
  const sessionsWithGroups = sessions.filter((session) => session.group).length;
  const sessionsWithClubs = sessions.filter((session) => session.clubs.length > 0).length;
  const codeOnlySessions = sessions.filter((session) => isCodeOnlyScheduleSession(session)).length;
  const overwhelminglyCodeOnly =
    sessions.length >= 3 &&
    codeOnlySessions >= Math.max(3, Math.ceil(sessions.length * 0.75)) &&
    sessionsWithTimes === 0 &&
    sessionsWithGroups === 0 &&
    sessionsWithClubs === 0;

  if (schedule.days.length === 1 && extractedDayCount >= 2) return true;
  if (overwhelminglyCodeOnly) return true;
  return false;
}

function getStoredScheduleSessionKey(session: {
  code?: string | null;
  label?: string | null;
  group?: string | null;
  startTime?: string | null;
}) {
  const code = safeString(session.code).toLowerCase();
  if (code) return `code:${code}`;
  const label = safeString(session.label).toLowerCase();
  if (label) return `label:${label}`;
  const composite = [session.group, session.startTime]
    .map((item) => safeString(item).toLowerCase())
    .filter(Boolean)
    .join("|");
  return composite ? `composite:${composite}` : "";
}

function getStoredScheduleDayKey(day: {
  isoDate?: string | null;
  date?: string | null;
  shortDate?: string | null;
}): string {
  return [day.isoDate, day.date, day.shortDate]
    .map((item) => safeString(item).toLowerCase())
    .find(Boolean) || "";
}

function getStoredScheduleDaySessionCodes(day: {
  sessions: Array<{ code?: string | null }>;
}): Set<string> {
  return new Set(
    day.sessions
      .map((session) => safeString(session.code).toLowerCase())
      .filter(Boolean)
  );
}

function findStoredScheduleDayMatchIndex(
  days: StoredGymMeetScheduleDay[],
  targetDay: StoredGymMeetScheduleDay
): number {
  const targetKey = getStoredScheduleDayKey(targetDay);
  const targetCodes = getStoredScheduleDaySessionCodes(targetDay);
  if (!targetCodes.size) return -1;

  let bestIndex = -1;
  let bestOverlap = 0;

  days.forEach((day, index) => {
    const dayKey = getStoredScheduleDayKey(day);
    if (targetKey && dayKey && targetKey !== dayKey) return;

    const dayCodes = getStoredScheduleDaySessionCodes(day);
    if (!dayCodes.size) return;

    let overlap = 0;
    targetCodes.forEach((code) => {
      if (dayCodes.has(code)) overlap += 1;
    });
    if (overlap === 0) return;

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function splitExtractedSchedulePages(text: string) {
  const normalized = safeString(text);
  if (!normalized) {
    return [] as Array<{ pageNumber: number; text: string }>;
  }
  const markerPattern = /(?:^|\n)\s*--\s*(\d+)(?:\s+of\s+\d+)?\s*--\s*(?=\n|$)/gi;
  const matches = [...normalized.matchAll(markerPattern)];
  if (!matches.length) {
    return [{ pageNumber: 1, text: normalized }];
  }
  return matches.map((match, index) => {
    const pageNumber = Number.parseInt(match[1] || `${index + 1}`, 10) || index + 1;
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || normalized.length : normalized.length;
    return {
      pageNumber,
      text: normalized.slice(start, end).trim(),
    };
  });
}

function selectSchedulePages(text: string) {
  return selectScheduleSegments(splitExtractedSchedulePages(text)).map((segment) => ({
    pageNumber: segment.pageNumber,
    text: segment.text,
  }));
}

const USABLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PUBLIC_MEET_CONTACT_ROLE_PATTERN =
  /\b(meet director|director of operations|assistant event coordinator|event coordinator|floor manager|meet contact|event contact)\b/i;
const VENUE_CONTACT_ROLE_PATTERN =
  /\b(venue contact|facility contact|gym contact|gymnasium contact)\b|\b(venue|facility|gym(?:nasium)?)\b/i;
const COACH_CONTACT_ROLE_PATTERN =
  /\b(coach|registration|meet reservations?|meetmaker|entry|regional|club admin|team admin|pro member)\b/i;
const SUPPRESSED_UNMAPPED_FACT_CATEGORIES = new Set([
  "marketing",
  "club_participation",
  "document_version",
]);
const MARKETING_TEXT_PATTERN =
  /(visit lauderdale|hairstyle ?to ?impress|hairstyling appointment|sponsor(?:ing)? this event|many thanks to our sponsors|book your hairstyling appointment)/i;
const SCHEDULE_GRID_TEXT_PATTERN =
  /(session\s+(?:fr|sa|su)\d+\b|stretch\/warmup:|levels?\s+\d|clubs in pink|individual & team awards|your designated number of athlete spots per session|questions\?\s*email us asap)/i;
const CLUB_PARTICIPATION_TEXT_PATTERN =
  /\b(360 gymnastics fl|alpha gymnastics|christi'?s gymnastics|browns? gym(?:nastics)?|team twisters|twisters canada|top gymnastics fl|whitby-galaxy|gymnastics usa|gymnastics du sol|miracle gymnastics|southern starz|fgtc|ega|zga|world class miami|intensity gymnastics|harbor city|sunny gymnastics)\b/i;
const TRUE_GEAR_TEXT_PATTERN =
  /\b(leotard|uniform|warm-?ups?|warmup jacket|grips|beam shoes|shoes|scrunchie|hair|bun|bobby pins?|bag|equipment bag|water bottle|wristbands?|athletic tape|music file)\b/i;
const GEAR_EXCLUDED_TEXT_PATTERN =
  /(admission|ticket|pre[-\s]?sale|cash|credit\/debit|credit card|debit card|registration|check[- ]?in|results?|live scoring|website|visit us on the web|rotation sheets?|awards ceremonies?|temperature inside the venue|beyond our control|come prepared|athlete cards? will be distributed|record scores)/i;
const VENUE_DETAIL_TEXT_PATTERN =
  /(meet site:|coral springs gymnasium|temperature inside the venue|beyond our control|please come prepared|parking is complimentary|\bph:\b|\bphone numbers?\b|venue is chilly|inside the venue is chilly)/i;
const MEET_DETAIL_REROUTE_TEXT_PATTERN =
  /(athlete cards? will be distributed|athlete cards?\b.*record(?:ing)? scores?|record scores on (?:their|the) cards?|memento of their meet|coaches choose competitive order|submit cards to judges)/i;

type ScheduleSegmentKind = "grid" | "narrative" | "assignment" | "other";

type SchedulePageSegment = {
  pageNumber: number;
  text: string;
  kind: Exclude<ScheduleSegmentKind, "other">;
  reason: string;
};

type ScheduleAnnotation = NonNullable<ParseResult["schedule"]["annotations"]>[number];
type ScheduleAssignment = NonNullable<ParseResult["schedule"]["assignments"]>[number];

function countScheduleSessionCodes(text: string): number {
  return (safeString(text).match(/\bsession\s+(?:fr|sa|su)\d+\b/gi) || []).length;
}

function looksLikeScheduleNarrativeText(text: string): boolean {
  const normalized = safeString(text);
  if (!normalized) return false;
  const sessionLines = countScheduleSessionCodes(normalized);
  if (sessionLines === 0) return false;
  return (
    /\b(?:stretch|warm-?up|competition to follow|age groups?:|born\s+\d{1,2}\/\d{1,2}\/\d{2,4})/i.test(
      normalized
    ) && !/\t/.test(normalized)
  );
}

function looksLikeScheduleAssignmentText(text: string): boolean {
  const normalized = safeString(text);
  if (!normalized) return false;
  return (
    /(age groups?\s+and\s+session assignments|age group\s+birth date\s+divisions?\s+session)/i.test(
      normalized
    ) ||
    (/\bgroup\s+\d+\b/i.test(normalized) &&
      /\bsession\s+(?:fr|sa|su)\d+\b/i.test(normalized) &&
      /\b(?:younger|older)\b/i.test(normalized))
  );
}

function classifySchedulePageText(text: string): {
  kind: ScheduleSegmentKind;
  reason: string;
} {
  const normalized = safeString(text);
  if (!normalized) return { kind: "other", reason: "empty" };
  if (looksLikeScheduleAssignmentText(normalized)) {
    return { kind: "assignment", reason: "assignment_table_signals" };
  }
  if (SCHEDULE_GRID_TEXT_PATTERN.test(normalized) && /\t/.test(normalized)) {
    return { kind: "grid", reason: "grid_tabs_and_schedule_signals" };
  }
  if (
    SCHEDULE_GRID_TEXT_PATTERN.test(normalized) &&
    CLUB_PARTICIPATION_TEXT_PATTERN.test(normalized) &&
    /stretch\/warmup:/i.test(normalized)
  ) {
    return { kind: "grid", reason: "grid_club_and_warmup_signals" };
  }
  if (looksLikeScheduleNarrativeText(normalized)) {
    return { kind: "narrative", reason: "narrative_session_signals" };
  }
  if (looksLikeSchedulePageText(normalized)) {
    return { kind: "narrative", reason: "generic_schedule_signals" };
  }
  return { kind: "other", reason: "no_schedule_signals" };
}

function selectScheduleSegments(
  pages: Array<{ pageNumber: number; text: string }>
): SchedulePageSegment[] {
  return pages
    .map((page) => {
      const classification = classifySchedulePageText(page.text);
      if (classification.kind === "other") return null;
      return {
        pageNumber: page.pageNumber,
        text: page.text,
        kind: classification.kind,
        reason: classification.reason,
      };
    })
    .filter((segment): segment is SchedulePageSegment => Boolean(segment));
}

function isUsableEmail(value: unknown): boolean {
  return USABLE_EMAIL_PATTERN.test(safeString(value));
}

function isUsablePhone(value: unknown): boolean {
  return safeString(value).replace(/\D/g, "").length >= 7;
}

function sanitizeDiscoveryContact(item: any, fallbackRole = "Contact") {
  const role = safeString(item?.role || fallbackRole) || fallbackRole;
  const name = safeString(item?.name);
  const email = isUsableEmail(item?.email) ? safeString(item?.email) : "";
  const phone = isUsablePhone(item?.phone) ? safeString(item?.phone) : "";
  if (!name && !email && !phone) return null;
  return {
    role,
    name: name || null,
    email: email || null,
    phone: phone || null,
  };
}

function classifyDiscoveryContact(item: any): "public" | "venue" | "coach" | "other" {
  const haystack = `${safeString(item?.role)} ${safeString(item?.name)}`;
  if (VENUE_CONTACT_ROLE_PATTERN.test(haystack)) return "venue";
  if (PUBLIC_MEET_CONTACT_ROLE_PATTERN.test(haystack)) return "public";
  if (COACH_CONTACT_ROLE_PATTERN.test(haystack)) return "coach";
  return "other";
}

function shouldSuppressUnmappedFact(item: any): boolean {
  const category = safeString(item?.category).toLowerCase();
  const detail = safeString(item?.detail);
  if (!detail) return true;
  if (SUPPRESSED_UNMAPPED_FACT_CATEGORIES.has(category)) return true;
  return false;
}

function isAdmissionAnnouncementText(value: string): boolean {
  return /(spectator|admission|ticket|pre[-\s]?sale|credit\/debit|credit card|debit card|cashless|cash is not accepted|cash not accepted|no cash)/i.test(
    safeString(value)
  );
}

function isStructuredAnnouncementText(value: string): boolean {
  return /(doors open|arrival guidance|registration\b|results|live scoring|rotation sheets?|awards|venue contact|facility contact|meet director|director of operations|event coordinator|floor manager)/i.test(
    safeString(value)
  );
}

function shouldPersistParsedAnnouncement(item: any): boolean {
  const title = safeString(item?.title || item?.label);
  const body = safeString(item?.body || item?.text || item?.message);
  const combined = `${title} ${body}`;
  if (!body) return false;
  if (isAdmissionAnnouncementText(combined) || isStructuredAnnouncementText(combined)) return false;
  if (
    /(marketing|sponsor|visit lauderdale|hairstyle to impress|final posting|club[_\s-]?participation|venue[_\s-]?contact|document[_\s-]?version)/i.test(
      combined
    )
  ) {
    return false;
  }
  return body.split(/\s+/).filter(Boolean).length >= 4;
}

function isMarketingLikeText(value: unknown): boolean {
  return MARKETING_TEXT_PATTERN.test(safeString(value));
}

function isScheduleGridLikeText(value: unknown): boolean {
  return SCHEDULE_GRID_TEXT_PATTERN.test(safeString(value));
}

function isClubParticipationLikeText(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  if (CLUB_PARTICIPATION_TEXT_PATTERN.test(text)) return true;
  return (text.match(/\b(?:gymnastics|gym|academy|twisters|ymca|starz|miami|wellington|boca|canada)\b/gi) || [])
    .length >= 3;
}

function isTrueGearLikeText(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  if (GEAR_EXCLUDED_TEXT_PATTERN.test(text)) return false;
  return TRUE_GEAR_TEXT_PATTERN.test(text);
}

function appendUnmappedFact(
  items: Array<{ category: string; detail: string; confidence: "high" | "medium" | "low" }>,
  category: string,
  detail: string,
  confidence: "high" | "medium" | "low" = "high"
) {
  const cleanDetail = safeString(detail);
  if (!cleanDetail) return items;
  const key = `${safeString(category)}|${cleanDetail}`.toLowerCase().replace(/\s+/g, " ").trim();
  if (!key) return items;
  if (
    items.some(
      (item) =>
        `${safeString(item?.category)}|${safeString(item?.detail)}`
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim() === key
    )
  ) {
    return items;
  }
  items.push({ category, detail: cleanDetail, confidence });
  return items;
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

function isLikelySectionHeading(line: string): boolean {
  const text = safeString(line);
  if (!text) return false;
  if (text.length > 72) return false;
  if (/^[A-Z0-9][A-Z0-9/&(),.' -]{2,}$/.test(text)) return true;
  return /^(entry fees|how to enter|awards|coaches information|parking|doors open|additional info|spectator admission|traffic|payment|refund|qualification|regional meet coaches information)\b/i.test(
    text
  );
}

function normalizeDiscoveryDateArtifacts(value: string): string {
  return safeString(value)
    .replace(/\u2013|\u2014/g, "-")
    .replace(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})(\s*,\s*\d{4})/gi,
      "$1 $2-$3$4"
    )
    .replace(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})\b/gi,
      "$1 $2-$3"
    )
    .replace(/\$\s+(\d)/g, "$$$1")
    .replace(/(\d)\s*-\s+(\d{1,2},\s*\d{4})/g, "$1-$2")
    .replace(/([A-Za-z])\s*-\s*\n\s*([A-Za-z])/g, "$1$2")
    .replace(/\b([A-Za-z]{3,})\s*\n\s*(\d{1,2}\b)/g, "$1 $2")
    .replace(/\b(\d{1,2})\s*\n\s*-\s*\n\s*(\d{1,2}\b)/g, "$1-$2")
    .replace(/\b(\d{1,2})\s*-\s*\n\s*(\d{1,2}\b)/g, "$1-$2")
    .replace(/[ \t]{2,}/g, " ");
}

function stitchDiscoveryLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const rawLine of lines) {
    const line = normalizeDiscoveryDateArtifacts(rawLine);
    if (!line) continue;
    if (!out.length) {
      out.push(line);
      continue;
    }
    const prev = out[out.length - 1];
    const prevText = safeString(prev);
    const nextText = safeString(line);
    const prevIsHeading = isLikelySectionHeading(prevText);
    const nextIsHeading = isLikelySectionHeading(nextText);
    const prevEndsSentence = /[.!?:]$/.test(prevText);
    const startsContinuation =
      /^[a-z(]/.test(nextText) ||
      /^[\d$]/.test(nextText) ||
      /^(and|or|but|with|for|to|from|by|at|in|on|of|if|when|then)\b/i.test(nextText);
    const joinsBrokenWord = /[A-Za-z]-$/.test(prevText) && /^[A-Za-z]/.test(nextText);
    const joinsCurrency = /(?:\$|usd)\s*$/i.test(prevText) && /^[\d.]/.test(nextText);
    const joinsDateRange =
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+\d{1,2}\s*-\s*$/i.test(
        prevText
      ) && /^\d{1,2}(?:,\s*\d{4})?\b/.test(nextText);

    if (!prevIsHeading && !nextIsHeading && (joinsBrokenWord || joinsCurrency || joinsDateRange)) {
      out[out.length - 1] = `${prevText.replace(/-\s*$/, "")}${nextText}`.replace(/\s+/g, " ").trim();
      continue;
    }
    if (!prevIsHeading && !nextIsHeading && !prevEndsSentence && startsContinuation) {
      out[out.length - 1] = `${prevText} ${nextText}`.replace(/\s+/g, " ").trim();
      continue;
    }
    out.push(nextText);
  }
  return out;
}

function isCoachHeadingLine(line: string): boolean {
  return /^(attention coaches!?|coaches information(?:[—-].*)?|regional meet coaches information|coaches attire|coaches sign in|attending coaches.*|coach(?:es)?\b.*important|entry fees|how to enter|payment|refund policy|qualification|coaches? meeting|scratches?|rotation sheets?)/i.test(
    safeString(line)
  );
}

function looksLikeCoachLine(line: string): boolean {
  return /(coach(?:es)?|entry fees?|team fees?|team entry|athlete fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|floor manager|meet director|director of operations|assistant event coordinator|dress code|attire|floor music|meet maker|reservation)/i.test(
    safeString(line)
  );
}

function sanitizeCoachExcerpt(lines: string[]): string {
  return safeString(lines.join(" ").replace(/\s+/g, " ")).slice(0, 320);
}

type ScoredDateCandidate = {
  label: string;
  line: string;
  startDate: string | null;
  endDate: string | null;
  score: number;
  reason: string;
};

function parseDateRangeCandidate(value: string): DateRangeInfo {
  return deriveDateRangeFromText(normalizeDiscoveryDateArtifacts(value));
}

function scoreMeetDateLine(line: string, index: number): ScoredDateCandidate | null {
  const text = normalizeDiscoveryDateArtifacts(line);
  if (!text) return null;
  const parsed = parseDateRangeCandidate(text);
  if (!parsed.startDate) return null;

  let score = parsed.endDate && parsed.endDate !== parsed.startDate ? 7 : 4;
  const lowered = text.toLowerCase();
  const reasons: string[] = [];

  if (/^(when|meet dates?|competition dates?|event dates?)\b/i.test(text)) {
    score += 7;
    reasons.push("labelled-date");
  }
  if (index < 12) {
    score += 4;
    reasons.push("title-area");
  } else if (index < 24) {
    score += 2;
    reasons.push("early-document");
  }
  if (
    /\b(updated|posted|deadline|late fee|refund|entry fee|entry deadline|how to enter|must enter|by noon|page\s+\d+\s+of\s+\d+)\b/i.test(
      lowered
    )
  ) {
    score -= 10;
    reasons.push("admin-date");
  }
  if (/\b(noon|11:59|11:00|12:00)\b/i.test(lowered)) {
    score -= 3;
    reasons.push("deadline-time");
  }
  if (/\b(entry|refund|late fee|qualification|payment|regional commitment)\b/i.test(lowered)) {
    score -= 4;
    reasons.push("coach-admin-context");
  }

  return {
    label: parsed.label || text,
    line: text,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    score,
    reason: reasons.join(","),
  };
}

function classifyMeetDateCandidates(text: string): {
  primary: ScoredDateCandidate | null;
  ignored: ScoredDateCandidate[];
} {
  const baseLines = stitchDiscoveryLines(
    cleanExtractedText(text)
      .split(/\n+/)
      .map((line) => safeString(line))
      .filter(Boolean)
  );
  const lines = baseLines.flatMap((line) =>
    line
      .split(/(?=\b(?:when|meet dates?|competition dates?|event dates?)\b[:]?)/i)
      .map((item) => safeString(item))
      .filter(Boolean)
  );
  const candidates = lines
    .map((line, index) => scoreMeetDateLine(line, index))
    .filter((item): item is ScoredDateCandidate => Boolean(item));
  const ranked = [...candidates].sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (scoreDelta !== 0) return scoreDelta;
    const aSpan = a.startDate && a.endDate && a.startDate !== a.endDate ? 1 : 0;
    const bSpan = b.startDate && b.endDate && b.startDate !== b.endDate ? 1 : 0;
    return bSpan - aSpan;
  });
  const primary = ranked.find((item) => item.score > 0) || null;
  return {
    primary,
    ignored: ranked.filter((item) => !primary || item.line !== primary.line).slice(0, 8),
  };
}

function isSpectatorAdmissionLabel(value: string): boolean {
  const text = safeString(value);
  return /(spectator|admission|ticket|adult|child|children|seniors?|military|cash|door|weekend pass|per day|parking)/i.test(
    text
  );
}

function inferCoachFeeBucket(item: {
  label: string;
  amount?: string;
  price?: string;
  note: string | null;
}):
  | "entry"
  | "team"
  | "late"
  | null {
  const haystack = `${safeString(item.label)} ${safeString(item.note)} ${safeString(
    item.amount || item.price
  )}`.toLowerCase();
  if (/(late fee|late entry|after .*deadline)/i.test(haystack)) return "late";
  if (/\b(team fee|team entry|team)\b/i.test(haystack)) return "team";
  if (/\b(entry fee|athlete fee|registration fee|per gymnast|entry)\b/i.test(haystack)) return "entry";
  return null;
}

function hasCoachInfoContent(value: any): boolean {
  const coachInfo = value || {};
  return Boolean(
    safeString(coachInfo.signIn) ||
      safeString(coachInfo.attire) ||
      safeString(coachInfo.hospitality) ||
      safeString(coachInfo.floorAccess) ||
      safeString(coachInfo.scratches) ||
      safeString(coachInfo.floorMusic) ||
      safeString(coachInfo.rotationSheets) ||
      safeString(coachInfo.awards) ||
      safeString(coachInfo.regionalCommitment) ||
      safeString(coachInfo.qualification) ||
      safeString(coachInfo.meetFormat) ||
      safeString(coachInfo.equipment) ||
      safeString(coachInfo.refundPolicy) ||
      safeString(coachInfo.paymentInstructions) ||
      pickArray(coachInfo.entryFees).length ||
      pickArray(coachInfo.teamFees).length ||
      pickArray(coachInfo.lateFees).length ||
      pickArray(coachInfo.deadlines).length ||
      pickArray(coachInfo.contacts).length ||
      pickArray(coachInfo.links).length ||
      pickArray(coachInfo.notes).length
  );
}

function extractCoachPageHintsFromPages(
  pages: Array<{ num: number; text: string }>
): CoachPageHint[] {
  const hints: CoachPageHint[] = [];
  for (const page of pages) {
    const pageText = cleanExtractedText(safeString(page?.text));
    if (!pageText) continue;
    const lines = stitchDiscoveryLines(
      pageText
        .split(/\n+/)
        .map((line) => safeString(line))
        .filter(Boolean)
    );
    const heading =
      lines.find((line) => isCoachHeadingLine(line)) ||
      lines.find((line) =>
        /(coach(?:es)?|entry fees?|how to enter|payment|refund|qualification|regional commitment)/i.test(
          line
        )
      ) ||
      null;
    const coachLines = lines.filter((line) => looksLikeCoachLine(line));
    const strongSignalCount = [
      /coach(?:es)?/gi,
      /\bentry fees?\b/gi,
      /\bteam fees?\b/gi,
      /\blate fees?\b/gi,
      /\bpayment\b/gi,
      /\brefund\b/gi,
      /\bqualification\b/gi,
      /\bhospitality\b/gi,
      /\bsign[- ]?in\b/gi,
      /\bscratches?\b/gi,
      /\brotation sheets?\b/gi,
      /\bregional\b/gi,
    ].reduce((count, pattern) => count + countPatternMatches(pageText, pattern), 0);
    if (!heading && strongSignalCount < 3) continue;
    const excerpt = sanitizeCoachExcerpt(
      coachLines.length > 0 ? coachLines.slice(0, 6) : lines.slice(0, 6)
    );
    if (!excerpt) continue;
    hints.push({
      page: Number.isFinite(page?.num) ? Number(page.num) : hints.length + 1,
      heading,
      excerpt,
    });
  }
  return uniqueBy(hints, (item) => `${item.page}|${item.heading}|${item.excerpt}`).slice(0, 6);
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

function normalizeParsedYear(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (value >= 100) return value;
  return value >= 70 ? 1900 + value : 2000 + value;
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
      /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*[–-]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/
    ) || null;
  if (slashRange) {
    const m1 = Number.parseInt(slashRange[1], 10) - 1;
    const d1 = Number.parseInt(slashRange[2], 10);
    const y1 = normalizeParsedYear(Number.parseInt(slashRange[3], 10));
    const m2 = Number.parseInt(slashRange[4], 10) - 1;
    const d2 = Number.parseInt(slashRange[5], 10);
    const y2 = normalizeParsedYear(Number.parseInt(slashRange[6], 10));
    return {
      label: text,
      startDate: toIsoDate(y1, m1, d1),
      endDate: toIsoDate(y2, m2, d2),
    };
  }

  const slashSingle = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/) || null;
  if (slashSingle) {
    const m = Number.parseInt(slashSingle[1], 10) - 1;
    const d = Number.parseInt(slashSingle[2], 10);
    const y = normalizeParsedYear(Number.parseInt(slashSingle[3], 10));
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
  const lines = stitchDiscoveryLines(
    text
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
      .filter(Boolean)
  );
  const firstLines = uniqueLines(lines.slice(0, 24), 12);
  const additionalInfoStartIdx = lines.findIndex((line) => /additional\s*info/i.test(line));
  const additionalInfoLines =
    additionalInfoStartIdx >= 0
      ? uniqueLines(lines.slice(additionalInfoStartIdx + 1, additionalInfoStartIdx + 26), 12)
      : [];

  const matchLines = (pattern: RegExp, limit = 12) =>
    uniqueLines(lines.filter((line) => pattern.test(line)), limit);
  const sectionMatchLines = (patterns: RegExp[], limit = 12) =>
    uniqueLines(
      lines.filter((line) => patterns.some((pattern) => pattern.test(line))),
      limit
    );
  const dateAnalysis = classifyMeetDateCandidates(text);

  const dateHints = uniqueLines(
    [
      ...(dateAnalysis.primary ? [dateAnalysis.primary.label] : []),
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
  const hostGymHints = uniqueLines(
    lines
      .filter(
        (line) =>
          /(host(ed)? by|gymnastics|gym club|academy|host gym|host|team\b|usa competitions)/i.test(
            line
          ) && isProbableHostGymHint(line)
      )
      .map((line) => sanitizeHostGymValue(line))
      .filter((line): line is string => Boolean(line)),
    12
  );
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
  const coachHints = uniqueLines(
    [
      ...matchLines(
        /(coach(?:es)?|entry fees?|team fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|meet director|floor manager|attire|dress code)/i,
        16
      ),
      ...pickArray(extractionMeta.coachPageHints)
        .flatMap((item) => [safeString(item?.heading), safeString(item?.excerpt)])
        .filter(Boolean),
    ],
    16
  );
  const trafficLines = matchLines(/(traffic|disney on ice|benchmark|parking rate|30-45)/i, 8);
  const hallLayoutLines = matchLines(
    /(east hall|west hall|central hall|registration|guest services|competition area|coffee bar|awards)/i,
    10
  );
  const coachLines = matchLines(
    /(coach(?:es)?|entry fees?|team fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|meet director|floor manager|attire|dress code)/i,
    10
  );
  const spectatorSection = sectionMatchLines(
    [/(spectator admission|admission|ticket|door fees?|weekend passes?|adult|child|cash only)/i],
    12
  );
  const venueSection = sectionMatchLines(
    [
      /(east hall|west hall|central hall|guest services|registration|competition area|venue|facility layout|awards area|entrance)/i,
    ],
    12
  );
  const trafficSection = sectionMatchLines(
    [/(parking|traffic|ride ?share|uber|lyft|drop-?off|garage|parkmobile|complimentary parking)/i],
    12
  );
  const policySection = sectionMatchLines(
    [/(food|water|hydration|service animals?|service dogs?|safety|outside food|throwing objects?)/i],
    12
  );
  const coachOpsSection = sectionMatchLines(
    [
      /(coach(?:es)?|sign[- ]?in|floor access|attire|hospitality|scratches|rotation sheets?|floor music|regional commitment|qualification)/i,
    ],
    12
  );
  const registrationSection = sectionMatchLines(
    [/(entry fees?|team fees?|late fees?|how to enter|payment|refund|deadline|meet maker|reservation)/i],
    12
  );
  const titleHints = uniqueLines(
    [
      safeString(extractionMeta.pageTitle || ""),
      ...firstLines.filter((line) => line.length >= 6 && line.length <= 90),
    ],
    8
  );
  const linkHints = uniqueBy(
    [
      ...pickArray(extractionMeta.discoveredLinks)
        .map((item) => ({
          label: safeString(item?.label) || "Source link",
          url: normalizeUrl(item?.url),
        }))
        .filter((item) => item.url),
      ...uniqueLines(
        (text.match(/https?:\/\/[^\s)]+/gi) || []).map((url) => url.replace(/[.,;!?]+$/, "")),
        14
      ).map((url) => ({ label: "Source link", url })),
    ],
    (item) => item.url
  ).slice(0, 14);

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
      coachHints,
      linkHints,
    },
    sections: {
      spectator: spectatorSection,
      venue: venueSection,
      traffic: trafficSection,
      policy: policySection,
      coachOps: coachOpsSection,
      registration: registrationSection,
    },
    dateAnalysis: {
      primaryCandidate: dateAnalysis.primary
        ? {
            label: dateAnalysis.primary.label,
            startDate: dateAnalysis.primary.startDate,
            endDate: dateAnalysis.primary.endDate,
            line: dateAnalysis.primary.line,
            score: dateAnalysis.primary.score,
          }
        : null,
      ignoredCandidates: dateAnalysis.ignored.map((item) => ({
        label: item.label,
        line: item.line,
        score: item.score,
        reason: item.reason,
      })),
    },
    snippets: {
      firstLines,
      additionalInfoLines,
      trafficLines,
      hallLayoutLines,
      coachLines,
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
  const normalized = normalizeDiscoveryDateArtifacts(
    (text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u0000/g, " ")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
  );
  const stitched = stitchDiscoveryLines(
    normalized
      .split(/\n+/)
      .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
      .filter(Boolean)
  );
  return stitched
    .join("\n")
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanPdfPageTextPreservingGrid(text: string): string {
  return normalizeDiscoveryDateArtifacts(
    (text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u0000/g, " ")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/[ \f\v]+/g, " ")
      .replace(/\t{2,}/g, "\t")
      .replace(/\n{3,}/g, "\n\n")
  ).trim();
}

function resolveOpenAiMiniModel(): string {
  return (
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-4o-mini"
  );
}

function resolveDiscoveryParseModel(): string {
  return safeString(process.env.OPENAI_DISCOVERY_PARSE_MODEL) || "gpt-4.1-mini";
}

function resolveDiscoveryVisionModel(): string {
  return safeString(process.env.OPENAI_DISCOVERY_VISION_MODEL) || "gpt-4o-mini";
}

let openAiClient: OpenAI | null = null;
function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey });
  }
  return openAiClient;
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

async function getPdfPageImage(
  pdfBuffer: Buffer,
  pageIndex: number,
  cache?: DiscoveryRequestCache
): Promise<Buffer | null> {
  const render = async () => {
    const sharpPageImage = await sharp(pdfBuffer, { density: 220, page: pageIndex })
      .png()
      .toBuffer()
      .catch(() => null);
    return sharpPageImage || (await renderPdfPageToPng(pdfBuffer, pageIndex));
  };
  return cache
    ? getOrCreatePdfPageImage(cache, pdfBuffer, pageIndex, render)
    : render();
}

function selectSchedulePageNumbersFromPdfPages(pages: Array<{ num: number; text: string }>): number[] {
  return uniqueBy(
    pages
      .filter((page) => looksLikeSchedulePageText(page.text))
      .map((page) => Number(page.num) || 0)
      .filter((pageNumber) => pageNumber > 0),
    (pageNumber) => String(pageNumber)
  );
}

function extractSchedulePageTextsFromPdfPages(
  pages: Array<{ num: number; text: string }>
): Array<{ pageNumber: number; text: string }> {
  const selected = new Set(selectSchedulePageNumbersFromPdfPages(pages));
  return pages
    .filter((page) => selected.has(Number(page.num) || 0))
    .map((page) => ({
      pageNumber: Number(page.num) || 0,
      text: safeString(page.text),
    }))
    .filter((page) => page.pageNumber > 0 && page.text);
}

async function extractSchedulePageImagesFromPdf(
  buffer: Buffer,
  pages: Array<{ num: number; text: string }>,
  cache?: DiscoveryRequestCache
): Promise<Array<{ pageNumber: number; dataUrl: string | null }>> {
  const pageNumbers = selectSchedulePageNumbersFromPdfPages(pages).slice(0, 6);
  const images: Array<{ pageNumber: number; dataUrl: string | null }> = [];
  for (const pageNumber of pageNumbers) {
    try {
      const pageImage = await getPdfPageImage(buffer, pageNumber - 1, cache);
      images.push({
        pageNumber,
        dataUrl: pageImage ? await toOptimizedImageDataUrl(pageImage, cache) : null,
      });
    } catch {
      images.push({ pageNumber, dataUrl: null });
    }
  }
  return images;
}

const SCHEDULE_SESSION_HEADER_PATTERN = /session\s+([a-z]{1,3}\d{1,2})/i;
const SCHEDULE_TIME_PATTERN = /^stretch\/warmup:/i;
const SCHEDULE_BOILERPLATE_PATTERN =
  /^(?:florida crown championships schedule|clubs in pink|clubs in black|questions\?\s*email|for event info and results|[*]teams with athletes of the same level|your designated number of athlete spots|email\s+[^\s@]+@[^\s@]+\.[^\s@]+\s+with your choice|many thanks to our sponsors|thank you to visit lauderdale|meet site:|ph:|parking is|the temperature inside the venue|group hotel:|group rate:|distance from venue:|parking:|breakfast:|reservation deadline:|reservations link:|for complete meet results|book your hairstyling appointment|please book in advance|get ready to impress|@usacompetitions|✨)/i;
const SCHEDULE_EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function splitScheduleCells(line: string): string[] {
  return safeString(line)
    .split(/\t+/)
    .map((cell) => safeString(cell))
    .filter(Boolean);
}

function splitScheduleGridCells(line: string): string[] {
  const cells = safeString(line)
    .split(/\t/)
    .map((cell) => safeString(cell));
  while (cells.length > 0 && !cells[cells.length - 1]) {
    cells.pop();
  }
  return cells;
}

function extractSessionCodesFromHeader(line: string): string[] {
  return [...safeString(line).matchAll(/session\s+([a-z]{1,3}\d{1,2})/gi)]
    .map((match) => safeString(match[1]).toUpperCase())
    .filter(Boolean);
}

function normalizeScheduleTimeCell(value: string): string {
  return safeString(value).replace(/^stretch\/warmup:\s*/i, "");
}

function looksLikeScheduleBoilerplate(line: string): boolean {
  const normalized = safeString(line);
  if (!normalized) return true;
  return SCHEDULE_BOILERPLATE_PATTERN.test(normalized);
}

function looksLikeScheduleDivisionLine(cells: string[]): boolean {
  const nonEmptyCells = cells.map((cell) => safeString(cell)).filter(Boolean);
  if (!nonEmptyCells.length) return false;
  return nonEmptyCells.every((cell) => {
    const value = safeString(cell);
    if (
      SCHEDULE_SESSION_HEADER_PATTERN.test(value) ||
      SCHEDULE_TIME_PATTERN.test(value) ||
      SCHEDULE_DATE_LINE_PATTERN.test(value) ||
      /@|\.com|https?:\/\//i.test(value)
    ) {
      return false;
    }
    return /^[A-Z0-9/&'().\-\s]+$/.test(value) && value === value.toUpperCase();
  });
}

function normalizeScheduleDivisionLabel(value: string): string {
  return safeString(value)
    .replace(/^levels?\s+/i, "LEVEL ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function extractScheduleDivisionTokens(group: string): string[] {
  const normalized = safeString(group)
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];
  const hasLevelPrefix = /^levels?\b/i.test(normalized);
  return normalized
    .replace(/^levels?\s+/i, "")
    .split("/")
    .map((part) => safeString(part))
    .filter(Boolean)
    .map((part) => {
      if (hasLevelPrefix && /^\d+(?:[A-Z])?$/.test(part)) {
        return `LEVEL ${part}`;
      }
      return part.toUpperCase();
    });
}

type ScheduleBlockColumnAssignment = {
  sessionIndex: number;
  divisionLabel: string;
};

function buildScheduleDirectColumns(
  sessionCount: number
): ScheduleBlockColumnAssignment[] {
  return Array.from({ length: sessionCount }, (_, sessionIndex) => ({
    sessionIndex,
    divisionLabel: "",
  }));
}

function matchDivisionHeaderToRemainingColumns(
  labels: string[],
  sessions: Array<{ expectedDivisions: string[]; seenDivisions: Set<string> }>
): ScheduleBlockColumnAssignment[] {
  const normalizedLabels = labels.map((label) => normalizeScheduleDivisionLabel(label)).filter(Boolean);
  if (!normalizedLabels.length) return [];
  const assignments: ScheduleBlockColumnAssignment[] = [];
  let minimumSessionIndex = 0;

  for (const label of normalizedLabels) {
    let matchedSessionIndex = -1;
    for (let sessionIndex = minimumSessionIndex; sessionIndex < sessions.length; sessionIndex += 1) {
      const session = sessions[sessionIndex];
      const expectedMatch = session.expectedDivisions.find(
        (divisionLabel) => normalizeScheduleDivisionLabel(divisionLabel) === label
      );
      if (!expectedMatch || session.seenDivisions.has(label)) continue;
      matchedSessionIndex = sessionIndex;
      session.seenDivisions.add(label);
      assignments.push({
        sessionIndex,
        divisionLabel: expectedMatch,
      });
      minimumSessionIndex = sessionIndex;
      break;
    }
    if (matchedSessionIndex < 0) return [];
  }

  return assignments;
}

function parseScheduleClubCell(value: string) {
  const normalized = safeString(value).replace(/\s+/g, " ");
  const athleteCountMatch = normalized.match(/\((\d+)\)\s*$/);
  return {
    name: normalized.replace(/\s*\(\d+\)\s*$/, "").trim(),
    athleteCount: athleteCountMatch ? Number.parseInt(athleteCountMatch[1], 10) : null,
    teamAwardEligible: null,
    divisionLabel: null,
  };
}

function assignScheduleClubRowToColumns(
  rawCells: string[],
  activeColumns: ScheduleBlockColumnAssignment[]
): Array<{ value: string; column: ScheduleBlockColumnAssignment }> {
  const nonEmptyCells = rawCells
    .map((value, index) => ({ value: safeString(value), index }))
    .filter((cell) => cell.value);
  if (!nonEmptyCells.length || !activeColumns.length) return [];

  if (rawCells.length === activeColumns.length) {
    return rawCells
      .map((value, index) => ({
        value: safeString(value),
        column: activeColumns[index],
      }))
      .filter((item) => item.value && item.column);
  }

  if (nonEmptyCells.length === activeColumns.length) {
    return nonEmptyCells.map((cell, index) => ({
      value: cell.value,
      column: activeColumns[index],
    }));
  }

  if (nonEmptyCells.length === 1) {
    return [{ value: nonEmptyCells[0].value, column: activeColumns[activeColumns.length - 1] }];
  }

  if (
    activeColumns.length === 1 &&
    nonEmptyCells.length === 1
  ) {
    return [{ value: nonEmptyCells[0].value, column: activeColumns[0] }];
  }

  return [];
}

function buildScheduleSessionsFromBlock(
  headerLine: string,
  groupLine: string,
  timeLine: string,
  bodyLines: string[]
): ParseResult["schedule"]["days"][number]["sessions"] {
  const codes = extractSessionCodesFromHeader(headerLine);
  if (!codes.length) return [];
  const groupCells = splitScheduleCells(groupLine);
  const timeCells = splitScheduleCells(timeLine).map((cell) => normalizeScheduleTimeCell(cell));
  const sessions = codes.map((code, index) => ({
    code,
    group: groupCells[index] || null,
    startTime: timeCells[index] || null,
    warmupTime: timeCells[index] || null,
    note: timeCells[index] ? "Stretch/warmup" : null,
    clubs: [] as ParseResult["schedule"]["days"][number]["sessions"][number]["clubs"],
  }));
  const sessionDivisionState = sessions.map((session) => ({
    expectedDivisions: extractScheduleDivisionTokens(session.group || ""),
    seenDivisions: new Set<string>(),
  }));

  let activeColumns = buildScheduleDirectColumns(sessions.length);

  for (const bodyLine of bodyLines) {
    const rawCells = splitScheduleGridCells(bodyLine);
    const nonEmptyCells = rawCells.filter(Boolean);
    if (!nonEmptyCells.length) continue;

    if (looksLikeScheduleDivisionLine(rawCells)) {
      const matchedDivisionColumns = matchDivisionHeaderToRemainingColumns(
        nonEmptyCells,
        sessionDivisionState
      );
      if (matchedDivisionColumns.length > 0) {
        activeColumns = matchedDivisionColumns;
        continue;
      }
      activeColumns = buildScheduleDirectColumns(sessions.length);
      continue;
    }

    const assignedCells = assignScheduleClubRowToColumns(rawCells, activeColumns);
    for (const assignment of assignedCells) {
      const club = parseScheduleClubCell(assignment.value);
      if (!club.name) continue;
      sessions[assignment.column.sessionIndex]?.clubs.push({
        ...club,
        divisionLabel: assignment.column.divisionLabel || null,
      });
    }
  }

  return sessions;
}

function parseScheduleDayFromPage(page: { pageNumber: number; text: string }) {
  const lines = page.text
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter(Boolean);
  const dateLine = lines.find((line) => SCHEDULE_DATE_LINE_PATTERN.test(line)) || "";
  if (!dateLine) return null;

  const sessions: ParseResult["schedule"]["days"][number]["sessions"] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!extractSessionCodesFromHeader(line).length) continue;

    const groupLine =
      index + 1 < lines.length &&
      !SCHEDULE_TIME_PATTERN.test(lines[index + 1]) &&
      !SCHEDULE_DATE_LINE_PATTERN.test(lines[index + 1]) &&
      !extractSessionCodesFromHeader(lines[index + 1]).length &&
      !looksLikeScheduleBoilerplate(lines[index + 1])
        ? lines[index + 1]
        : "";
    const timeLine =
      index + (groupLine ? 2 : 1) < lines.length &&
      SCHEDULE_TIME_PATTERN.test(lines[index + (groupLine ? 2 : 1)])
        ? lines[index + (groupLine ? 2 : 1)]
        : "";

    const bodyStart = index + 1 + (groupLine ? 1 : 0) + (timeLine ? 1 : 0);
    const bodyLines: string[] = [];
    let cursor = bodyStart;
    while (cursor < lines.length) {
      const candidate = lines[cursor];
      if (
        extractSessionCodesFromHeader(candidate).length ||
        SCHEDULE_DATE_LINE_PATTERN.test(candidate) ||
        /^--\s*\d+/i.test(candidate)
      ) {
        break;
      }
      if (!looksLikeScheduleBoilerplate(candidate)) {
        bodyLines.push(candidate);
      }
      cursor += 1;
    }

    sessions.push(...buildScheduleSessionsFromBlock(line, groupLine, timeLine, bodyLines));
    index = Math.max(index, cursor - 1);
  }

  if (!sessions.length) return null;
  return {
    date: dateLine,
    shortDate: formatScheduleShortDate(dateLine),
    sessions,
  };
}

function sanitizeScheduleLegendEntries(
  entries: Array<{
    colorHex?: string | null;
    colorLabel: string | null;
    meaning: string | null;
    teamAwardEligible: boolean | null;
  }>
): Array<{
  colorHex: string | null;
  colorLabel: string | null;
  meaning: string | null;
  teamAwardEligible: boolean | null;
}> {
  return uniqueBy(
    entries
      .map((entry) => ({
        colorHex: normalizeColorHex(entry.colorHex) || null,
        colorLabel: safeString(entry.colorLabel) || null,
        meaning: safeString(entry.meaning) || null,
        teamAwardEligible:
          typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
      }))
      .filter((entry) => {
        const meaning = safeString(entry.meaning);
        if (!meaning) return typeof entry.teamAwardEligible === "boolean" || Boolean(entry.colorHex);
        if (
          /(recognized at|competition floor|awards ceremony following|please review|host the|following items enclosed|team awards at approx)/i.test(
            meaning
          )
        ) {
          return false;
        }
        return true;
      }),
    (entry) =>
      `${entry.meaning || ""}|${entry.colorHex || ""}|${entry.colorLabel || ""}|${entry.teamAwardEligible ?? ""}`
  );
}

function sanitizeScheduleAnnotations(entries: ScheduleAnnotation[]): ScheduleAnnotation[] {
  return uniqueBy(
    entries
      .map((entry) => ({
        kind: safeString(entry.kind) || null,
        level: safeString(entry.level) || null,
        sessionCode: safeString(entry.sessionCode).toUpperCase() || null,
        date: safeString(entry.date) || null,
        time: safeString(entry.time) || null,
        text: safeString(entry.text),
      }))
      .filter((entry) => entry.text),
    (entry) =>
      `${entry.kind || ""}|${entry.level || ""}|${entry.sessionCode || ""}|${entry.date || ""}|${entry.time || ""}|${entry.text}`
  );
}

function sanitizeScheduleAssignments(entries: ScheduleAssignment[]): ScheduleAssignment[] {
  return uniqueBy(
    entries
      .map((entry) => ({
        level: safeString(entry.level) || null,
        groupLabel: safeString(entry.groupLabel) || null,
        sessionCode: safeString(entry.sessionCode).toUpperCase() || null,
        birthDateRange: safeString(entry.birthDateRange) || null,
        divisionLabel: safeString(entry.divisionLabel) || null,
        note: safeString(entry.note) || null,
      }))
      .filter(
        (entry) =>
          entry.sessionCode ||
          entry.groupLabel ||
          entry.birthDateRange ||
          entry.divisionLabel ||
          entry.note
      ),
    (entry) =>
      `${entry.level || ""}|${entry.groupLabel || ""}|${entry.sessionCode || ""}|${entry.birthDateRange || ""}|${entry.divisionLabel || ""}|${entry.note || ""}`
  );
}

function toStoredScheduleLegendEntries(
  entries: Array<{
    colorHex?: string | null;
    colorLabel: string | null;
    meaning: string | null;
    teamAwardEligible: boolean | null;
  }>
): StoredGymMeetSchedule["awardLegend"] {
  return sanitizeScheduleLegendEntries(entries).map((entry) => ({
    colorHex: normalizeColorHex(entry.colorHex),
    colorLabel: safeString(entry.colorLabel),
    meaning: safeString(entry.meaning),
    teamAwardEligible:
      typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
  }));
}

function toStoredScheduleAnnotations(entries: ScheduleAnnotation[]): StoredGymMeetSchedule["annotations"] {
  return sanitizeScheduleAnnotations(entries).map((entry, index) => ({
    id: `schedule-annotation-${index + 1}`,
    kind: safeString(entry.kind),
    level: safeString(entry.level),
    sessionCode: safeString(entry.sessionCode),
    date: safeString(entry.date),
    time: safeString(entry.time),
    text: entry.text,
  }));
}

function toStoredScheduleAssignments(entries: ScheduleAssignment[]): StoredGymMeetSchedule["assignments"] {
  return sanitizeScheduleAssignments(entries).map((entry, index) => ({
    id: `schedule-assignment-${index + 1}`,
    level: safeString(entry.level),
    groupLabel: safeString(entry.groupLabel),
    sessionCode: safeString(entry.sessionCode),
    birthDateRange: safeString(entry.birthDateRange),
    divisionLabel: safeString(entry.divisionLabel),
    note: safeString(entry.note),
  }));
}

function sanitizeNarrativeScheduleSessions(
  sessions: ParseResult["schedule"]["days"][number]["sessions"]
): ParseResult["schedule"]["days"][number]["sessions"] {
  return sessions
    .map((session) => ({
      ...session,
      group:
        safeString(session.group) && !looksLikeMergedScheduleClubName(session.group)
          ? session.group
          : null,
      note:
        safeString(session.note) &&
        !/please review|following items enclosed|visit us on the web|many thanks to our sponsors/i.test(
          safeString(session.note)
        )
          ? session.note
          : null,
      clubs: [],
    }))
    .filter((session) => session.code || session.group || session.startTime || session.note);
}

function parseNarrativeScheduleSessionsFromPage(
  page: { pageNumber: number; text: string },
  fallbackYear: string
): ParseResult["schedule"] {
  const lines = page.text
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter(Boolean);
  const days: ParseResult["schedule"]["days"] = [];
  let currentDay: ParseResult["schedule"]["days"][number] | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\*+\s*s(enior|chedule)/i.test(line)) continue;
    if (SCHEDULE_DATE_LINE_PATTERN.test(line)) {
      const normalizedDate = normalizeScheduleDayLabelWithContext(line, fallbackYear);
      currentDay = {
        date: normalizedDate || line,
        shortDate: formatScheduleShortDate(normalizedDate || line),
        sessions: [],
      };
      days.push(currentDay);
      continue;
    }

    const sessionMatch = line.match(
      /^session\s+([a-z]{2,3}\d{1,2})\s+(.+?)\s+(\d{1,2}:\d{2}\s*(?:am|pm))\s+stretch\b/i
    );
    if (!sessionMatch || !currentDay) continue;

    const sessionCode = safeString(sessionMatch[1]).toUpperCase();
    const group = safeString(sessionMatch[2]).replace(/\s+/g, " ");
    const startTime = safeString(sessionMatch[3]);
    let warmupTime: string | null = null;
    const noteParts: string[] = [];

    const nextLine = safeString(lines[index + 1]);
    if (nextLine && !SCHEDULE_DATE_LINE_PATTERN.test(nextLine) && !/^session\s+/i.test(nextLine)) {
      const warmupMatch = nextLine.match(/(\d{1,2}:\d{2}\s*(?:am|pm))\s+warm-?up/i);
      if (warmupMatch) warmupTime = safeString(warmupMatch[1]);
      const cleanedDetail = nextLine
        .replace(/(\d{1,2}:\d{2}\s*(?:am|pm))\s+warm-?up\.?/i, "")
        .replace(/competition to follow\.?/i, "")
        .replace(/\*+/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (cleanedDetail) noteParts.push(cleanedDetail);
      index += 1;
    }

    currentDay.sessions.push({
      code: sessionCode,
      group: group || null,
      startTime: startTime || null,
      warmupTime,
      note: noteParts.join(" ").trim() || null,
      clubs: [],
    });
  }

  return {
    venueLabel: null,
    supportEmail: null,
    notes: [],
    colorLegend: [],
    awardLegend: [],
    annotations: [],
    assignments: [],
    days: days
      .map((day) => ({
        ...day,
        sessions: sanitizeNarrativeScheduleSessions(day.sessions),
      }))
      .filter((day) => day.sessions.length > 0),
  };
}

function parseScheduleAnnotationsFromPages(
  pages: Array<{ pageNumber: number; text: string }>,
  fallbackYear: string
): ScheduleAnnotation[] {
  const annotations: ScheduleAnnotation[] = [];
  for (const page of pages) {
    const lines = page.text
      .split(/\n+/)
      .map((line) => safeString(line).replace(/\*+/g, ""))
      .filter(Boolean);
    let currentDate = "";
    for (const line of lines) {
      if (SCHEDULE_DATE_LINE_PATTERN.test(line)) {
        currentDate = normalizeScheduleDayLabelWithContext(line, fallbackYear);
        continue;
      }

      const seniorMatch = line.match(
        /^level\s+([0-9a-z/ ]+):\s*(recognized.+)$/i
      );
      if (seniorMatch) {
        annotations.push({
          kind: "senior_recognition",
          level: `Level ${safeString(seniorMatch[1]).toUpperCase()}`,
          sessionCode: null,
          date: currentDate || null,
          time: null,
          text: `Recognized ${safeString(seniorMatch[2]).replace(/^recognized\s+/i, "")}`,
        });
        continue;
      }

      const teamAwardMatch = line.match(
        /^level\s+([0-9a-z/ ]+)\s+team awards?\s+at\s+approx\.?\s*([0-9:apm ]+),?\s*following session\s+([a-z]{2,3}\d{1,2})/i
      );
      if (teamAwardMatch) {
        annotations.push({
          kind: "team_awards",
          level: `Level ${safeString(teamAwardMatch[1]).toUpperCase()}`,
          sessionCode: safeString(teamAwardMatch[3]).toUpperCase(),
          date: currentDate || null,
          time: safeString(teamAwardMatch[2]) || null,
          text: line,
        });
        continue;
      }

      if (
        /\b(final level \d+\s+schedule will be released|waiting to see if we get any scratches|all level \d+['’]?s will compete)/i.test(
          line
        )
      ) {
        const levelMatch = line.match(/\blevel\s+([0-9a-z/]+)(?=\s+schedule|\b)/i);
        annotations.push({
          kind: "schedule_note",
          level: levelMatch ? `Level ${safeString(levelMatch[1]).toUpperCase()}` : null,
          sessionCode: null,
          date: currentDate || null,
          time: null,
          text: line,
        });
      }
    }
  }
  return sanitizeScheduleAnnotations(annotations);
}

function parseScheduleAssignmentsFromPages(
  pages: Array<{ pageNumber: number; text: string }>
): ScheduleAssignment[] {
  const assignments: ScheduleAssignment[] = [];
  let currentLevel = "";

  for (const page of pages) {
    const lines = page.text
      .split(/\n+/)
      .map((line) => safeString(line))
      .filter(Boolean);

    for (const line of lines) {
      const levelHeaderMatch = line.match(/^level\s+([0-9a-z/ ]+)\b/i);
      if (
        levelHeaderMatch &&
        !/^level\s+\d+[:]/i.test(line) &&
        !/^level\s+\d+['’]?s/i.test(line) &&
        !/^level\s+\d+\s+team awards/i.test(line)
      ) {
        currentLevel = `Level ${safeString(levelHeaderMatch[1]).toUpperCase()}`;
        continue;
      }
      if (
        /^(age group|draw\b|please verify|for event info|many thanks|to be determined\b)/i.test(line)
      ) {
        continue;
      }
      const rowMatch = line.match(
        /^(group\s+\d+|younger|middle|older)\s+(.+?)\s+([a-z]{2,3}\d{1,2})$/i
      );
      if (!rowMatch) continue;
      assignments.push({
        level: currentLevel || null,
        groupLabel: safeString(rowMatch[1]) || null,
        sessionCode: safeString(rowMatch[3]).toUpperCase() || null,
        birthDateRange: safeString(rowMatch[2]) || null,
        divisionLabel: null,
        note: null,
      });
    }
  }

  return sanitizeScheduleAssignments(assignments);
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

async function extractPdfTextWithNodeWorker(buffer: Buffer): Promise<PdfTextExtraction> {
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
  process.stdout.write(JSON.stringify({
    text: result?.text || "",
    pages: Array.isArray(result?.pages)
      ? result.pages.map((page) => ({
          num: Number(page?.num) || 0,
          text: page?.text || "",
        }))
      : [],
  }));
})().catch((error) => {
  process.stderr.write(String(error?.message || error));
  process.exit(1);
});
`;
    const { stdout } = await execFileAsync(process.execPath, ["-e", workerScript, filePath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    const payload = JSON.parse(stdout || "{}");
    return {
      text: cleanExtractedText(String(payload?.text || "")),
      pages: pickArray(payload?.pages)
        .map((page) => ({
          num: Number(page?.num) || 0,
          text: cleanPdfPageTextPreservingGrid(String(page?.text || "")),
        }))
        .filter((page) => page.text),
    };
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
        return {
          text: cleanExtractedText(String(result?.text || "")),
          pages: Array.isArray(result?.pages)
            ? result.pages
                .map((page: any) => ({
                  num: Number(page?.num) || 0,
                  text: cleanPdfPageTextPreservingGrid(String(page?.text || "")),
                }))
                .filter((page: any) => page.text)
            : [],
        };
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
    return { text: "", pages: [] };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

async function ocrBuffer(buffer: Buffer): Promise<string> {
  const vision = getVisionClient();
  const [result] = await vision.documentTextDetection({
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
  const model = resolveOpenAiMiniModel();
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
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
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
  mimeType = "image/png",
  performance?: DiscoveryPerformance
): Promise<{ isLayout: boolean; confidence: number; facts: string[]; text: string } | null> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return null;
  const model = resolveDiscoveryVisionModel();
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
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    recordDiscoveryUsage(performance, "gymLayoutVision", payload?.usage);
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

async function extractTextFromPdf(
  buffer: Buffer,
  options?: {
    budgetMs?: number;
    performance?: DiscoveryPerformance;
    cache?: DiscoveryRequestCache;
    mode?: DiscoveryMode;
  }
): Promise<{
  text: string;
  usedOcr: boolean;
  coachPageHints: CoachPageHint[];
  textQuality: TextQuality;
  qualitySignals: TextQualitySignals;
  pages: Array<{ num: number; text: string }>;
}> {
  const rank: Record<TextQuality, number> = { good: 2, suspect: 1, poor: 0 };
  const deadline =
    typeof options?.budgetMs === "number" && options.budgetMs > 0
      ? Date.now() + options.budgetMs
      : Number.POSITIVE_INFINITY;
  const toCandidate = (raw: string, usedOcr: boolean) => {
    const analyzed = analyzeTextQuality(raw);
    return {
      text: analyzed.cleanedText,
      usedOcr,
      textQuality: analyzed.quality,
      qualitySignals: analyzed.signals,
    };
  };
  const isStrongNativeCandidate = (candidate: ReturnType<typeof toCandidate>) =>
    candidate.textQuality !== "poor" &&
    (candidate.text.length >= 1000 ||
      (candidate.text.length >= LOW_TEXT_THRESHOLD &&
        !candidate.qualitySignals.looksLikePdfInternals &&
        candidate.qualitySignals.englishLikeRatio >= 0.55));

  const nativeParseStartedAt = Date.now();
  const workerExtraction = await extractPdfTextWithNodeWorker(buffer);
  const workerCoachPageHints = extractCoachPageHintsFromPages(workerExtraction.pages);
  const workerCandidate = toCandidate(workerExtraction.text, false);
  if (options?.performance) {
    options.performance.pdfParseMs += Date.now() - nativeParseStartedAt;
  }
  if (isStrongNativeCandidate(workerCandidate)) {
    return {
      ...workerCandidate,
      coachPageHints: workerCoachPageHints,
      pages: workerExtraction.pages,
    };
  }

  const heuristicCandidate = toCandidate(extractPdfTextHeuristic(buffer), false);
  if (isStrongNativeCandidate(heuristicCandidate)) {
    return {
      ...heuristicCandidate,
      coachPageHints: workerCoachPageHints,
      pages: workerExtraction.pages,
    };
  }

  if (Date.now() >= deadline) {
    const bestNative =
      rank[workerCandidate.textQuality] >= rank[heuristicCandidate.textQuality]
        ? workerCandidate
        : heuristicCandidate;
    return {
      ...bestNative,
      coachPageHints: workerCoachPageHints,
      pages: workerExtraction.pages,
    };
  }

  let ocrCandidate: ReturnType<typeof toCandidate> | null = null;
  try {
    const ocrStartedAt = Date.now();
    const ocrPages: string[] = [];
    const maxOcrPages = options?.mode === "core" ? 3 : 5;
    for (let page = 0; page < maxOcrPages; page += 1) {
      if (Date.now() >= deadline) break;
      const pageImage = await getPdfPageImage(buffer, page, options?.cache);
      if (!pageImage) break;
      if (options?.performance) {
        options.performance.ocrPageCount += 1;
      }
      const text = cleanExtractedText(
        await extractTextFromImage(pageImage, options?.cache)
      );
      if (text) {
        ocrPages.push(text);
        const aggregate = analyzeTextQuality(ocrPages.join("\n\n"));
        if (aggregate.quality === "good" && aggregate.cleanedText.length >= 800) {
          break;
        }
      }
    }
    if (options?.performance) {
      options.performance.ocrMs += Date.now() - ocrStartedAt;
    }
    if (ocrPages.length > 0) {
      ocrCandidate = toCandidate(ocrPages.join("\n\n"), true);
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return {
          ...ocrCandidate,
          coachPageHints: workerCoachPageHints,
          pages: workerExtraction.pages,
        };
      }
    }
  } catch {
    // Continue to final fallbacks.
  }
  if (!ocrCandidate) {
    try {
      const ocrStartedAt = Date.now();
      if (options?.performance) {
        options.performance.ocrPageCount += 1;
      }
      ocrCandidate = toCandidate(
        await extractTextFromImage(buffer, options?.cache),
        true
      );
      if (options?.performance) {
        options.performance.ocrMs += Date.now() - ocrStartedAt;
      }
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return {
          ...ocrCandidate,
          coachPageHints: workerCoachPageHints,
          pages: workerExtraction.pages,
        };
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
    return {
      ...best,
      coachPageHints: workerCoachPageHints,
      pages: workerExtraction.pages,
    };
  }

  const emptyQuality = analyzeTextQuality("");
  return {
    text: "",
    usedOcr: false,
    coachPageHints: workerCoachPageHints,
    textQuality: "poor",
    qualitySignals: emptyQuality.signals,
    pages: workerExtraction.pages,
  };
}

async function extractTextFromImage(
  buffer: Buffer,
  cache?: DiscoveryRequestCache
): Promise<string> {
  const run = async () => {
    const prepared = await sharp(buffer)
      .resize(2200)
      .grayscale()
      .normalize()
      .toBuffer();
    try {
      const text = await ocrBuffer(prepared);
      if (safeString(text)) return cleanExtractedText(text);
    } catch {
      // Fall through to OpenAI OCR.
    }
    const fallbackText = await openAiOcrTextFromImage(prepared, "image/png");
    return cleanExtractedText(fallbackText);
  };
  return cache ? getOrCreateWeakCacheValue(cache.imageText, buffer, run) : run();
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
  mimeType = "image/png",
  performance?: DiscoveryPerformance
): Promise<GymLayoutZone[]> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return [];
  const model = resolveDiscoveryVisionModel();
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
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return [];
    const payload = await response.json();
    recordDiscoveryUsage(performance, "gymLayoutVision", payload?.usage);
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
  buffer: Buffer,
  cache?: DiscoveryRequestCache
): Promise<string | null> {
  const run = async () => {
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
  };
  return cache
    ? getOrCreateWeakCacheValue(cache.optimizedDataUrl, buffer, run)
    : run();
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

async function extractGymLayoutImageFromPdf(
  buffer: Buffer,
  options?: {
    maxPages?: number;
    maxAiCandidates?: number;
    performance?: DiscoveryPerformance;
    budgetMs?: number;
    cache?: DiscoveryRequestCache;
  }
): Promise<GymLayoutExtraction> {
  const startedAt = Date.now();
  const finalize = (value: GymLayoutExtraction): GymLayoutExtraction => {
    if (options?.performance) {
      options.performance.gymLayoutScanMs += Date.now() - startedAt;
    }
    return value;
  };
  const deadline =
    typeof options?.budgetMs === "number" && options.budgetMs > 0
      ? startedAt + options.budgetMs
      : Number.POSITIVE_INFINITY;
  const maxPages =
    typeof options?.maxPages === "number" && options.maxPages > 0
      ? options.maxPages
      : 20;
  const maxAiCandidates =
    typeof options?.maxAiCandidates === "number" && options.maxAiCandidates > 0
      ? options.maxAiCandidates
      : 6;
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
  for (let page = 0; page < maxPages; page += 1) {
    if (Date.now() >= deadline) break;
    try {
      const pageImage = await getPdfPageImage(buffer, page, options?.cache);
      if (!pageImage) continue;
      const pageText = await extractTextFromImage(pageImage, options?.cache);
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
    return finalize({
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
    });
  }

  const rankedCandidates = [...candidatePages].sort((a, b) => {
    const preScoreDelta = b.preScore - a.preScore;
    if (preScoreDelta !== 0) return preScoreDelta;
    return a.page - b.page;
  });
  const topForAi = rankedCandidates.slice(0, maxAiCandidates);
  for (const candidate of topForAi) {
    if (Date.now() >= deadline) break;
    if (options?.performance) {
      options.performance.gymLayoutAiCalls += 1;
    }
    const ai = await openAiAnalyzeGymLayoutPage(
      candidate.image,
      "image/png",
      options?.performance
    );
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
    return finalize({
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
    });
  }

  const selected = acceptedCandidates[0];
  const dataUrl = await toOptimizedImageDataUrl(selected.image, options?.cache);
  if (!dataUrl) {
    return finalize({
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
    });
  }

  const zones = await openAiExtractGymLayoutZones(
    selected.image,
    "image/png",
    options?.performance
  );
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
  const result = {
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
  return finalize(result);
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

function decodeHtmlEntities(input: string): string {
  return safeString(input)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function linkUrlFromHref(base: URL, href: string): URL | null {
  try {
    const decodedHref = decodeHtmlEntities(href);
    if (!decodedHref || decodedHref.startsWith("#")) return null;
    if (/^(mailto:|tel:|javascript:)/i.test(decodedHref)) return null;
    const next = new URL(decodedHref, base);
    if (next.protocol !== "http:" && next.protocol !== "https:") return null;
    return next;
  } catch {
    return null;
  }
}

function isAssetUrl(url: URL | string): boolean {
  const href = typeof url === "string" ? url : url.href;
  return /\.(pdf|png|jpg|jpeg|webp)(\?|#|$)/i.test(href);
}

function extractLinkAttribute(rawAttrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = rawAttrs.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"));
  return decodeHtmlEntities(match?.[1] || "");
}

function fallbackLinkLabel(url: URL): string {
  const tail = safeString(url.pathname.split("/").filter(Boolean).pop() || "");
  if (!tail) return url.hostname.replace(/^www\./i, "");
  const decoded = decodeURIComponent(tail)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return decoded || url.hostname.replace(/^www\./i, "");
}

function normalizeLinkLabel(innerHtml: string, rawAttrs: string, url: URL): string {
  const textLabel = decodeHtmlEntities(stripHtml(innerHtml));
  const ariaLabel = extractLinkAttribute(rawAttrs, "aria-label");
  const titleLabel = extractLinkAttribute(rawAttrs, "title");
  const label = safeString(textLabel || ariaLabel || titleLabel || fallbackLinkLabel(url))
    .replace(/\s{2,}/g, " ")
    .trim();
  return label || fallbackLinkLabel(url);
}

function classifyDiscoveryLink(url: URL, baseUrl: URL): DiscoveryLinkKind {
  if (url.host !== baseUrl.host) return "external";
  return isAssetUrl(url) ? "asset" : "html";
}

function scoreDiscoveryCandidate(candidate: Omit<CrawlCandidate, "score" | "followed">): number {
  const haystack = `${candidate.label} ${candidate.url}`.toLowerCase();
  let score = 0;

  const boosts: Array<[RegExp, number]> = [
    [/\bschedule\b/, 7],
    [/\binfo\b/, 5],
    [/\bpacket\b/, 7],
    [/\broster\b/, 6],
    [/\brotation\b/, 6],
    [/\bfaq\b/, 5],
    [/\bresults?\b/, 5],
    [/\bhotel\b/, 5],
    [/\bparking\b/, 4],
    [/\bmap\b/, 3],
    [/\badmission\b/, 6],
    [/\btickets?\b/, 5],
    [/\bregistration\b/, 4],
  ];
  for (const [pattern, value] of boosts) {
    if (pattern.test(haystack)) score += value;
  }

  const penalties: Array<[RegExp, number]> = [
    [/\bhome\b/, 6],
    [/\babout\b/, 5],
    [/\bcontact\b/, 5],
    [/\bblog\b/, 6],
    [/\bsponsorship\b/, 5],
    [/\bauthor\b/, 5],
    [/\bfeed\b/, 5],
    [/\bcomments?\b/, 4],
    [/\bfacebook\b|\binstagram\b|\byoutube\b/, 8],
  ];
  for (const [pattern, value] of penalties) {
    if (pattern.test(haystack)) score -= value;
  }

  if (candidate.kind === "asset") score += 5;
  if (/\.pdf(\?|#|$)/i.test(candidate.url)) score += 4;
  if (candidate.kind === "external" && /(square|groupbook|ticket|hotel|results)/i.test(haystack)) {
    score += 3;
  }
  if (candidate.sameHost && candidate.depth === 0) score += 1;
  if (candidate.label.length <= 2) score -= 2;
  if (candidate.kind === "html" && /\/(?:about-us|contact|gymnastics-blog)\/?$/i.test(candidate.url)) {
    score -= 5;
  }

  return score;
}

function compareDiscoveryCandidates(a: CrawlCandidate, b: CrawlCandidate): number {
  const scoreDelta = b.score - a.score;
  if (scoreDelta !== 0) return scoreDelta;
  const kindRank = { asset: 0, html: 1, external: 2 } as const;
  const kindDelta = kindRank[a.kind] - kindRank[b.kind];
  if (kindDelta !== 0) return kindDelta;
  const depthDelta = a.depth - b.depth;
  if (depthDelta !== 0) return depthDelta;
  return a.url.localeCompare(b.url);
}

function shouldReplaceDiscoveryLink(existing: CrawlCandidate, next: CrawlCandidate): boolean {
  if (next.score !== existing.score) return next.score > existing.score;
  if (next.label.length !== existing.label.length) return next.label.length > existing.label.length;
  return next.depth < existing.depth;
}

function upsertDiscoveredLink(map: Map<string, CrawlCandidate>, candidate: CrawlCandidate) {
  const existing = map.get(candidate.url);
  if (!existing) {
    map.set(candidate.url, candidate);
    return;
  }
  const merged: CrawlCandidate = shouldReplaceDiscoveryLink(existing, candidate)
    ? { ...existing, ...candidate }
    : { ...candidate, ...existing };
  merged.followed = existing.followed || candidate.followed;
  merged.contentType = candidate.contentType || existing.contentType || null;
  merged.depth = existing.depth <= candidate.depth ? existing.depth : candidate.depth;
  merged.sourceUrl = shouldReplaceDiscoveryLink(existing, candidate)
    ? candidate.sourceUrl
    : existing.sourceUrl;
  merged.score = Math.max(existing.score, candidate.score);
  map.set(candidate.url, merged);
}

function collectDiscoveryCandidates(html: string, baseUrl: URL, depth: 0 | 1): CrawlCandidate[] {
  const links: CrawlCandidate[] = [];
  const anchorRegex = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = anchorRegex.exec(html))) {
    const rawAttrs = `${match[1] || ""} ${match[3] || ""}`;
    const url = linkUrlFromHref(baseUrl, match[2] || "");
    if (!url) continue;
    if (url.href === baseUrl.href) continue;
    const kind = classifyDiscoveryLink(url, baseUrl);
    const sameHost = url.host === baseUrl.host;
    const candidateBase = {
      url: url.toString(),
      label: normalizeLinkLabel(match[4] || "", rawAttrs, url),
      sourceUrl: baseUrl.toString(),
      depth,
      kind,
      sameHost,
    };
    links.push({
      ...candidateBase,
      followed: false,
      contentType: null,
      score: scoreDiscoveryCandidate(candidateBase),
    });
  }
  return uniqueBy(links, (item) => item.url).sort(compareDiscoveryCandidates);
}

function buildHtmlTextChunk(
  pageUrl: string,
  metadataText: string,
  readableText: string
): string {
  const pieces = [
    `Source URL: ${pageUrl}`,
    safeString(metadataText),
    safeString(readableText),
  ].filter(Boolean);
  return pieces.join("\n\n").trim();
}

function getPageTitle(html: string): string | null {
  return safeString(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "") || null;
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

function getUrlDiscoveryHooks(): Required<UrlDiscoveryTestHooks> {
  return {
    fetchWithLimit: urlDiscoveryTestHooks?.fetchWithLimit || fetchWithLimit,
    extractTextFromPdf: urlDiscoveryTestHooks?.extractTextFromPdf || extractTextFromPdf,
    extractTextFromImage: urlDiscoveryTestHooks?.extractTextFromImage || extractTextFromImage,
    extractGymLayoutImageFromPdf:
      urlDiscoveryTestHooks?.extractGymLayoutImageFromPdf || extractGymLayoutImageFromPdf,
    openAiExtractGymLayoutZones:
      urlDiscoveryTestHooks?.openAiExtractGymLayoutZones || openAiExtractGymLayoutZones,
    toOptimizedImageDataUrl:
      urlDiscoveryTestHooks?.toOptimizedImageDataUrl || toOptimizedImageDataUrl,
  };
}

async function appendFetchedAssetText(
  assetUrl: URL,
  fetched: { contentType: string; buffer: Buffer; text: string },
  accumulators: {
    linkedChunks: string[];
    linkedMeta: Array<{ url: string; contentType: string }>;
    usedOcr: boolean;
    highConfidencePdfFound: boolean;
    gymLayoutImageDataUrl: string | null;
    gymLayoutPage: number | null;
    gymLayoutFacts: string[];
    gymLayoutZones: GymLayoutZone[];
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    coachPageHints: CoachPageHint[];
    schedulePageImages: Array<{ pageNumber: number; dataUrl: string | null }>;
    schedulePageTexts: Array<{ pageNumber: number; text: string }>;
  },
  hooks: Required<UrlDiscoveryTestHooks>,
  options: Required<DiscoveryExtractionOptions>,
  requestCache?: DiscoveryRequestCache
) {
  accumulators.linkedMeta.push({ url: assetUrl.toString(), contentType: fetched.contentType });
  if (/pdf/i.test(fetched.contentType) || /\.pdf(\?|#|$)/i.test(assetUrl.pathname)) {
    const parsed = await hooks.extractTextFromPdf(fetched.buffer, {
      budgetMs: options.budgetMs,
      performance: options.performance,
      cache: requestCache,
      mode: options.mode,
    });
    if (parsed.textQuality === "good" && parsed.text.length >= 1500) {
      accumulators.highConfidencePdfFound = true;
    }
    accumulators.linkedChunks.push(parsed.text);
    accumulators.usedOcr = accumulators.usedOcr || parsed.usedOcr;
    accumulators.coachPageHints = uniqueBy(
      [...accumulators.coachPageHints, ...parsed.coachPageHints],
      (item) => `${item.page}|${item.heading}|${item.excerpt}`
    );
    if (
      options.workflow === "gymnastics" &&
      options.mode === "enrich" &&
      !accumulators.gymLayoutImageDataUrl
    ) {
      const layout = await hooks.extractGymLayoutImageFromPdf(fetched.buffer, {
        maxPages: 4,
        maxAiCandidates: 2,
        performance: options.performance,
        budgetMs: options.budgetMs,
        cache: requestCache,
      });
      accumulators.gymLayoutImageDataUrl = layout.dataUrl;
      accumulators.gymLayoutPage = layout.page;
      accumulators.gymLayoutFacts = uniqueLines(
        [...accumulators.gymLayoutFacts, ...layout.facts],
        14
      );
      accumulators.gymLayoutZones = normalizeGymLayoutZones(layout.zones);
      if (layout.selection) {
        accumulators.gymLayoutSelection = layout.selection;
      }
    }
    if (
      options.workflow === "gymnastics" &&
      options.mode === "enrich" &&
      !accumulators.schedulePageImages.length
    ) {
      accumulators.schedulePageImages = await extractSchedulePageImagesFromPdf(
        fetched.buffer,
        pickArray(parsed.pages)
          .map((page) => ({
            num: Number(page?.num) || 0,
            text: safeString(page?.text || ""),
          }))
          .filter((page) => page.num > 0 && page.text),
        requestCache
      );
    }
    if (
      options.workflow === "gymnastics" &&
      !accumulators.schedulePageTexts.length
    ) {
      accumulators.schedulePageTexts = extractSchedulePageTextsFromPdfPages(
        pickArray(parsed.pages)
          .map((page) => ({
            num: Number(page?.num) || 0,
            text: safeString(page?.text || ""),
          }))
          .filter((page) => page.num > 0 && page.text)
      );
    }
    return;
  }

  if (
    /image\/(png|jpe?g|webp)/i.test(fetched.contentType) ||
    /\.(png|jpe?g|webp)(\?|#|$)/i.test(assetUrl.pathname)
  ) {
    const imageText = await hooks.extractTextFromImage(fetched.buffer, requestCache);
    accumulators.linkedChunks.push(imageText);
    accumulators.usedOcr = true;
    if (
      options.workflow === "gymnastics" &&
      options.mode === "enrich" &&
      !accumulators.gymLayoutImageDataUrl &&
      looksLikeGymLayoutText(imageText)
    ) {
      accumulators.gymLayoutImageDataUrl = await hooks.toOptimizedImageDataUrl(
        fetched.buffer,
        requestCache
      );
      accumulators.gymLayoutZones = await hooks.openAiExtractGymLayoutZones(
        fetched.buffer,
        fetched.contentType || "image/png",
        options.performance
      );
    }
    if (options.workflow === "gymnastics") {
      accumulators.gymLayoutFacts = uniqueLines(
        [...accumulators.gymLayoutFacts, ...extractHallFactsFromText(imageText)],
        14
      );
    }
  }
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
    pageTemplateId: DEFAULT_GYM_MEET_TEMPLATE_ID,
    date: "",
    time: "",
    timezone: "America/Chicago",
    hostGym: "",
    venue: "",
    address: "",
    details: "",
    rsvpEnabled: false,
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
        resultsInfo: "",
        rotationSheetsInfo: "",
        awardsInfo: "",
        sessionWindows: [],
        operationalNotes: [],
        staffContacts: [],
      },
      practice: { enabled: true, blocks: [], excusedAthletes: [], modifiedTraining: [] },
      logistics: {
        enabled: false,
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
        parkingLinks: [],
        parkingPricingLinks: [],
        policyFood: "",
        policyHydration: "",
        policySafety: "",
        policyAnimals: "",
        additionalDocuments: [],
        venueContacts: [],
        venueContactNotes: [],
      },
      coaches: {
        enabled: false,
        signIn: "",
        attire: "",
        hospitality: "",
        floorAccess: "",
        scratches: "",
        floorMusic: "",
        rotationSheets: "",
        awards: "",
        regionalCommitment: "",
        qualification: "",
        meetFormat: "",
        equipment: "",
        refundPolicy: "",
        paymentInstructions: "",
        entryFees: [],
        teamFees: [],
        lateFees: [],
        deadlines: [],
        contacts: [],
        links: [],
        notes: [],
      },
      schedule: {
        enabled: true,
        venueLabel: "",
        supportEmail: "",
        notes: [],
        colorLegend: [],
        awardLegend: [],
        days: [],
      },
      gear: {
        enabled: false,
        leotardOfDay: "",
        hairMakeupNotes: "",
        musicFileLink: "",
        items: [],
      },
      volunteers: {
        enabled: false,
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

export async function extractDiscoveryText(
  input: DiscoverySourceInput,
  options?: DiscoveryExtractionOptions
): Promise<ExtractionResult> {
  const resolvedOptions = normalizeDiscoveryExtractionOptions(options);
  const performance = resolvedOptions.performance;
  const requestCache = createDiscoveryRequestCache();
  if (input.type === "file") {
    const parsed = input.dataUrl ? parseDataUrl(input.dataUrl) : null;
    if (!parsed) throw new Error("Invalid file payload");
    const mime = (parsed.mimeType || input.mimeType || "").toLowerCase();
    if (/pdf/.test(mime)) {
      const { text, usedOcr, coachPageHints, textQuality, qualitySignals, pages } =
        await extractTextFromPdf(parsed.buffer, {
          budgetMs: resolvedOptions.budgetMs,
          performance,
          cache: requestCache,
          mode: resolvedOptions.mode,
        });
      const shouldRunGymnasticsEnrichment =
        resolvedOptions.workflow === "gymnastics" &&
        resolvedOptions.mode === "enrich";
      const shouldExtractSchedulePageImages =
        resolvedOptions.workflow === "gymnastics";
      const gymLayout = shouldRunGymnasticsEnrichment
        ? await extractGymLayoutImageFromPdf(parsed.buffer, {
            maxPages: 4,
            maxAiCandidates: 2,
            performance,
            budgetMs: resolvedOptions.budgetMs,
            cache: requestCache,
          })
        : {
            dataUrl: null,
            facts: [],
            zones: [],
            page: null,
            selection: undefined,
          };
      const schedulePageImages =
        shouldExtractSchedulePageImages && resolvedOptions.debugArtifacts
          ? await extractSchedulePageImagesFromPdf(parsed.buffer, pages, requestCache)
          : shouldExtractSchedulePageImages
          ? await extractSchedulePageImagesFromPdf(parsed.buffer, pages, requestCache)
          : [];
      const schedulePageTexts =
        resolvedOptions.workflow === "gymnastics"
          ? extractSchedulePageTextsFromPdfPages(pages)
          : [];
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
          discoveredLinks: [],
          crawledPages: [],
          gymLayoutImageDataUrl: gymLayout.dataUrl || null,
          gymLayoutFacts: combinedLayoutFacts,
          gymLayoutZones: gymLayout.zones,
          gymLayoutPage: gymLayout.page,
          gymLayoutSelection: gymLayout.selection,
          coachPageHints,
          textQuality,
          qualitySignals,
          schedulePageImages,
          schedulePageTexts,
        },
        performance,
      };
    }
    if (/image\/(png|jpe?g|webp)/.test(mime)) {
      const text = await extractTextFromImage(parsed.buffer, requestCache);
      const quality = analyzeTextQuality(text);
      const shouldRunGymnasticsEnrichment =
        resolvedOptions.workflow === "gymnastics" &&
        resolvedOptions.mode === "enrich" &&
        looksLikeGymLayoutText(text);
      const gymLayoutImageDataUrl = shouldRunGymnasticsEnrichment
        ? await toOptimizedImageDataUrl(parsed.buffer, requestCache)
        : null;
      const gymLayoutZones = gymLayoutImageDataUrl
        ? await openAiExtractGymLayoutZones(
            parsed.buffer,
            parsed.mimeType || "image/png",
            performance
          )
        : [];
      const gymLayoutFacts =
        resolvedOptions.workflow === "gymnastics"
          ? extractHallFactsFromText(text)
          : [];
      return {
        extractedText: quality.cleanedText,
        extractionMeta: {
          sourceType: "file",
          usedOcr: true,
          linkedAssets: [],
          discoveredLinks: [],
          crawledPages: [],
          gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
          gymLayoutFacts,
          gymLayoutZones,
          gymLayoutPage: null,
          textQuality: quality.quality,
          qualitySignals: quality.signals,
          schedulePageImages: [],
          schedulePageTexts: [],
        },
        performance,
      };
    }
    throw new Error("Unsupported file type for discovery");
  }

  const url = new URL(input.url);
  const hooks = getUrlDiscoveryHooks();
  const page = await hooks.fetchWithLimit(url.toString());
  const html = page.text || page.buffer.toString("utf8");
  const readable = stripHtml(html);
  const metadata = extractMetadataText(html);
  const pageTitle = getPageTitle(html);
  const rootCandidates = collectDiscoveryCandidates(html, url, 0);
  const linkedChunks: string[] = [];
  const htmlChunks: string[] = [buildHtmlTextChunk(url.toString(), metadata, readable)];
  const linkedMeta: Array<{ url: string; contentType: string }> = [];
  const discoveredLinkMap = new Map<string, CrawlCandidate>();
  const crawledPages: CrawledPage[] = [{ url: url.toString(), title: pageTitle, depth: 0 }];
  const fetchedAssetUrls = new Set<string>();
  let usedOcr = false;
  let gymLayoutImageDataUrl: string | null = null;
  let gymLayoutPage: number | null = null;
  let gymLayoutFacts: string[] = [];
  let gymLayoutZones: GymLayoutZone[] = [];
  let gymLayoutSelection: GymLayoutSelectionDiagnostics | undefined = undefined;
  let coachPageHints: CoachPageHint[] = [];
  let schedulePageImages: Array<{ pageNumber: number; dataUrl: string | null }> = [];
  let schedulePageTexts: Array<{ pageNumber: number; text: string }> = [];

  for (const candidate of rootCandidates) {
    upsertDiscoveredLink(discoveredLinkMap, candidate);
  }

  const accumulators = {
    linkedChunks,
    linkedMeta,
    usedOcr,
    highConfidencePdfFound: false,
    gymLayoutImageDataUrl,
    gymLayoutPage,
    gymLayoutFacts,
    gymLayoutZones,
    gymLayoutSelection,
    coachPageHints,
    schedulePageImages,
    schedulePageTexts,
  };

  const fetchAssetCandidate = async (candidate: CrawlCandidate) => {
    if (fetchedAssetUrls.has(candidate.url)) return;
    if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) return;
    try {
      const fetched = await hooks.fetchWithLimit(candidate.url);
      fetchedAssetUrls.add(candidate.url);
      upsertDiscoveredLink(discoveredLinkMap, {
        ...candidate,
        followed: true,
        contentType: fetched.contentType || null,
      });
      await appendFetchedAssetText(
        new URL(candidate.url),
        fetched,
        accumulators,
        hooks,
        resolvedOptions,
        requestCache
      );
    } catch {
      // Best-effort linked assets.
    }
  };

  const shouldContinueFetchingAssets = () => {
    if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) return false;
    if (!accumulators.highConfidencePdfFound) return true;
    if (
      resolvedOptions.workflow === "gymnastics" &&
      resolvedOptions.mode === "enrich"
    ) {
      return (
        !accumulators.gymLayoutImageDataUrl ||
        accumulators.schedulePageImages.length === 0
      );
    }
    return false;
  };

  const fetchAssetCandidates = async (candidates: CrawlCandidate[]) => {
    for (let index = 0; index < candidates.length; index += 2) {
      if (!shouldContinueFetchingAssets()) break;
      await Promise.all(
        candidates.slice(index, index + 2).map((candidate) => fetchAssetCandidate(candidate))
      );
    }
  };

  await fetchAssetCandidates(
    rootCandidates.filter((candidate) => candidate.kind === "asset")
  );

  for (const childPage of rootCandidates.filter((candidate) => candidate.kind === "html")) {
    if (crawledPages.length - 1 >= MAX_FOLLOWED_CHILD_PAGES) break;
    try {
      const fetched = await hooks.fetchWithLimit(childPage.url);
      upsertDiscoveredLink(discoveredLinkMap, {
        ...childPage,
        followed: true,
        contentType: fetched.contentType || null,
      });
      if (!/text\/html|text\/plain|application\/json|application\/ld\+json/i.test(fetched.contentType)) {
        if (isAssetUrl(childPage.url) || /pdf|image\//i.test(fetched.contentType)) {
          await appendFetchedAssetText(
            new URL(childPage.url),
            fetched,
            accumulators,
            hooks,
            resolvedOptions,
            requestCache
          );
          fetchedAssetUrls.add(childPage.url);
        }
        continue;
      }

      const childHtml = fetched.text || fetched.buffer.toString("utf8");
      const childUrl = new URL(childPage.url);
      const childMetadata = extractMetadataText(childHtml);
      const childReadable = stripHtml(childHtml);
      const childTitle = getPageTitle(childHtml);
      crawledPages.push({ url: childPage.url, title: childTitle, depth: 1 });
      htmlChunks.push(buildHtmlTextChunk(childPage.url, childMetadata, childReadable));

      const childCandidates = collectDiscoveryCandidates(childHtml, childUrl, 1);
      for (const candidate of childCandidates) {
        upsertDiscoveredLink(discoveredLinkMap, candidate);
      }
      await fetchAssetCandidates(
        childCandidates.filter((candidate) => candidate.kind === "asset")
      );
    } catch {
      // Best-effort child pages.
    }
  }

  usedOcr = accumulators.usedOcr;
  gymLayoutImageDataUrl = accumulators.gymLayoutImageDataUrl;
  gymLayoutPage = accumulators.gymLayoutPage;
  gymLayoutFacts = accumulators.gymLayoutFacts;
  gymLayoutZones = accumulators.gymLayoutZones;
  gymLayoutSelection = accumulators.gymLayoutSelection;
  coachPageHints = accumulators.coachPageHints;
  schedulePageImages = accumulators.schedulePageImages;
  schedulePageTexts = accumulators.schedulePageTexts;

  const discoveredLinks = [...discoveredLinkMap.values()]
    .sort(compareDiscoveryCandidates)
    .slice(0, MAX_DISCOVERED_LINKS)
    .map(({ score: _score, ...item }) => item);

  const fullText = [...htmlChunks, ...linkedChunks]
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
      discoveredLinks,
      crawledPages,
      pageTitle: pageTitle || "",
      gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
      gymLayoutFacts: mergedLayoutFacts,
      gymLayoutZones,
      gymLayoutPage,
      gymLayoutSelection,
      coachPageHints,
      textQuality: quality.quality,
      qualitySignals: quality.signals,
      schedulePageImages,
      schedulePageTexts,
    },
    performance,
  };
}

const JSON_STRING = { type: "string" } as const;
const JSON_NUMBER = { type: "number" } as const;
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

const GYMNASTICS_PARSE_JSON_SCHEMA = {
  name: "gymnastics_meet_parse",
  strict: true,
  schema: jsonObject({
    eventType: { type: "string", enum: ["gymnastics_meet", "unknown"] },
    documentProfile: {
      type: "string",
      enum: [
        "athlete_session",
        "parent_packet",
        "registration_packet",
        "meet_overview",
        "unknown",
      ],
    },
    title: JSON_STRING,
    dates: JSON_STRING,
    startAt: jsonNullable(JSON_STRING),
    endAt: jsonNullable(JSON_STRING),
    timezone: jsonNullable(JSON_STRING),
    venue: jsonNullable(JSON_STRING),
    address: jsonNullable(JSON_STRING),
    hostGym: jsonNullable(JSON_STRING),
    admission: jsonArray(
      jsonObject({
        label: JSON_STRING,
        price: JSON_STRING,
        note: jsonNullable(JSON_STRING),
      })
    ),
    athlete: jsonObject({
      name: jsonNullable(JSON_STRING),
      level: jsonNullable(JSON_STRING),
      team: jsonNullable(JSON_STRING),
      session: jsonNullable(JSON_STRING),
      competitionDate: jsonNullable(JSON_STRING),
      stretchTime: jsonNullable(JSON_STRING),
      marchIn: jsonNullable(JSON_STRING),
      assignedGym: jsonNullable(JSON_STRING),
      awards: jsonNullable(JSON_STRING),
    }),
    meetDetails: jsonObject({
      warmup: jsonNullable(JSON_STRING),
      marchIn: jsonNullable(JSON_STRING),
      rotationOrder: jsonNullable(JSON_STRING),
      judgingNotes: jsonNullable(JSON_STRING),
      doorsOpen: jsonNullable(JSON_STRING),
      arrivalGuidance: jsonNullable(JSON_STRING),
      registrationInfo: jsonNullable(JSON_STRING),
      facilityLayout: jsonNullable(JSON_STRING),
      scoringInfo: jsonNullable(JSON_STRING),
      resultsInfo: jsonNullable(JSON_STRING),
      rotationSheetsInfo: jsonNullable(JSON_STRING),
      awardsInfo: jsonNullable(JSON_STRING),
      sessionWindows: jsonArray(
        jsonObject({
          date: jsonNullable(JSON_STRING),
          start: jsonNullable(JSON_STRING),
          end: jsonNullable(JSON_STRING),
          note: jsonNullable(JSON_STRING),
        })
      ),
      operationalNotes: jsonArray(JSON_STRING),
    }),
    logistics: jsonObject({
      parking: jsonNullable(JSON_STRING),
      trafficAlerts: jsonNullable(JSON_STRING),
      hotel: jsonNullable(JSON_STRING),
      meals: jsonNullable(JSON_STRING),
      fees: jsonNullable(JSON_STRING),
      waivers: jsonNullable(JSON_STRING),
      rideShare: jsonNullable(JSON_STRING),
      accessibility: jsonNullable(JSON_STRING),
      parkingLinks: jsonArray(
        jsonObject({
          label: JSON_STRING,
          url: JSON_STRING,
        })
      ),
      parkingPricingLinks: jsonArray(
        jsonObject({
          label: JSON_STRING,
          url: JSON_STRING,
        })
      ),
    }),
    policies: jsonObject({
      food: jsonNullable(JSON_STRING),
      hydration: jsonNullable(JSON_STRING),
      safety: jsonNullable(JSON_STRING),
      animals: jsonNullable(JSON_STRING),
      misc: jsonArray(JSON_STRING),
    }),
    coachInfo: jsonObject({
      signIn: jsonNullable(JSON_STRING),
      attire: jsonNullable(JSON_STRING),
      hospitality: jsonNullable(JSON_STRING),
      floorAccess: jsonNullable(JSON_STRING),
      scratches: jsonNullable(JSON_STRING),
      floorMusic: jsonNullable(JSON_STRING),
      rotationSheets: jsonNullable(JSON_STRING),
      awards: jsonNullable(JSON_STRING),
      regionalCommitment: jsonNullable(JSON_STRING),
      qualification: jsonNullable(JSON_STRING),
      meetFormat: jsonNullable(JSON_STRING),
      equipment: jsonNullable(JSON_STRING),
      refundPolicy: jsonNullable(JSON_STRING),
      paymentInstructions: jsonNullable(JSON_STRING),
      entryFees: jsonArray(
        jsonObject({
          label: JSON_STRING,
          amount: JSON_STRING,
          note: jsonNullable(JSON_STRING),
        })
      ),
      teamFees: jsonArray(
        jsonObject({
          label: JSON_STRING,
          amount: JSON_STRING,
          note: jsonNullable(JSON_STRING),
        })
      ),
      lateFees: jsonArray(
        jsonObject({
          label: JSON_STRING,
          amount: JSON_STRING,
          trigger: jsonNullable(JSON_STRING),
          note: jsonNullable(JSON_STRING),
        })
      ),
      contacts: jsonArray(
        jsonObject({
          role: JSON_STRING,
          name: jsonNullable(JSON_STRING),
          email: jsonNullable(JSON_STRING),
          phone: jsonNullable(JSON_STRING),
        })
      ),
      deadlines: jsonArray(
        jsonObject({
          label: JSON_STRING,
          date: jsonNullable(JSON_STRING),
          note: jsonNullable(JSON_STRING),
        })
      ),
      links: jsonArray(
        jsonObject({
          label: JSON_STRING,
          url: JSON_STRING,
        })
      ),
      notes: jsonArray(JSON_STRING),
    }),
    contacts: jsonArray(
      jsonObject({
        role: JSON_STRING,
        name: jsonNullable(JSON_STRING),
        email: jsonNullable(JSON_STRING),
        phone: jsonNullable(JSON_STRING),
      })
    ),
    deadlines: jsonArray(
      jsonObject({
        label: JSON_STRING,
        date: jsonNullable(JSON_STRING),
        note: jsonNullable(JSON_STRING),
      })
    ),
    gear: jsonObject({
      uniform: jsonNullable(JSON_STRING),
      checklist: jsonArray(JSON_STRING),
    }),
    volunteers: jsonObject({
      signupLink: jsonNullable(JSON_STRING),
      notes: jsonNullable(JSON_STRING),
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
    schedule: jsonObject({
      venueLabel: jsonNullable(JSON_STRING),
      supportEmail: jsonNullable(JSON_STRING),
      notes: jsonArray(JSON_STRING),
      colorLegend: jsonArray(
        jsonObject({
          id: jsonNullable(JSON_STRING),
          target: jsonNullable({ type: "string", enum: ["session", "club"] }),
          colorHex: jsonNullable(JSON_STRING),
          colorLabel: jsonNullable(JSON_STRING),
          meaning: jsonNullable(JSON_STRING),
          sourceText: jsonNullable(JSON_STRING),
          teamAwardEligible: jsonNullable(JSON_BOOLEAN),
        })
      ),
      awardLegend: jsonArray(
        jsonObject({
          colorHex: jsonNullable(JSON_STRING),
          colorLabel: jsonNullable(JSON_STRING),
          meaning: jsonNullable(JSON_STRING),
          teamAwardEligible: jsonNullable(JSON_BOOLEAN),
        })
      ),
      annotations: jsonArray(
        jsonObject({
          kind: jsonNullable(JSON_STRING),
          level: jsonNullable(JSON_STRING),
          sessionCode: jsonNullable(JSON_STRING),
          date: jsonNullable(JSON_STRING),
          time: jsonNullable(JSON_STRING),
          text: JSON_STRING,
        })
      ),
      assignments: jsonArray(
        jsonObject({
          level: jsonNullable(JSON_STRING),
          groupLabel: jsonNullable(JSON_STRING),
          sessionCode: jsonNullable(JSON_STRING),
          birthDateRange: jsonNullable(JSON_STRING),
          divisionLabel: jsonNullable(JSON_STRING),
          note: jsonNullable(JSON_STRING),
        })
      ),
      days: jsonArray(
        jsonObject({
          date: jsonNullable(JSON_STRING),
          shortDate: jsonNullable(JSON_STRING),
          sessions: jsonArray(
            jsonObject({
              code: jsonNullable(JSON_STRING),
              group: jsonNullable(JSON_STRING),
              startTime: jsonNullable(JSON_STRING),
              warmupTime: jsonNullable(JSON_STRING),
              note: jsonNullable(JSON_STRING),
              color: jsonNullable(
                jsonObject({
                  legendId: jsonNullable(JSON_STRING),
                  textColorHex: jsonNullable(JSON_STRING),
                  confidence: jsonNullable(JSON_NUMBER),
                })
              ),
              clubs: jsonArray(
                jsonObject({
                  name: jsonNullable(JSON_STRING),
                  teamAwardEligible: jsonNullable(JSON_BOOLEAN),
                  athleteCount: jsonNullable(JSON_NUMBER),
                  divisionLabel: jsonNullable(JSON_STRING),
                  color: jsonNullable(
                    jsonObject({
                      legendId: jsonNullable(JSON_STRING),
                      textColorHex: jsonNullable(JSON_STRING),
                      confidence: jsonNullable(JSON_NUMBER),
                    })
                  ),
                })
              ),
            })
          ),
        })
      ),
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
    "resultsInfo": string|null, "rotationSheetsInfo": string|null, "awardsInfo": string|null,
    "sessionWindows": [{ "date": string|null, "start": string|null, "end": string|null, "note": string|null }],
    "operationalNotes": [string]
  },
  "logistics": {
    "parking": string|null, "trafficAlerts": string|null, "hotel": string|null,
    "meals": string|null, "fees": string|null, "waivers": string|null,
    "rideShare": string|null, "accessibility": string|null,
    "parkingLinks": [{ "label": string, "url": string }],
    "parkingPricingLinks": [{ "label": string, "url": string }]
  },
  "policies": {
    "food": string|null, "hydration": string|null, "safety": string|null, "animals": string|null, "misc": [string]
  },
  "coachInfo": {
    "signIn": string|null,
    "attire": string|null,
    "hospitality": string|null,
    "floorAccess": string|null,
    "scratches": string|null,
    "floorMusic": string|null,
    "rotationSheets": string|null,
    "awards": string|null,
    "regionalCommitment": string|null,
    "qualification": string|null,
    "meetFormat": string|null,
    "equipment": string|null,
    "refundPolicy": string|null,
    "paymentInstructions": string|null,
    "entryFees": [{ "label": string, "amount": string, "note": string|null }],
    "teamFees": [{ "label": string, "amount": string, "note": string|null }],
    "lateFees": [{ "label": string, "amount": string, "trigger": string|null, "note": string|null }],
    "contacts": [{ "role": string, "name": string|null, "email": string|null, "phone": string|null }],
    "deadlines": [{ "label": string, "date": string|null, "note": string|null }],
    "links": [{ "label": string, "url": string }],
    "notes": [string]
  },
  "contacts": [{ "role": string, "name": string|null, "email": string|null, "phone": string|null }],
  "deadlines": [{ "label": string, "date": string|null, "note": string|null }],
  "gear": { "uniform": string|null, "checklist": [string] },
  "volunteers": { "signupLink": string|null, "notes": string|null },
  "communications": {
    "announcements": [{ "title": string, "body": string }],
    "passcode": string|null
  },
  "schedule": {
    "venueLabel": string|null,
    "supportEmail": string|null,
    "notes": [string],
    "awardLegend": [{
      "colorLabel": string|null,
      "meaning": string|null,
      "teamAwardEligible": boolean|null
    }],
    "annotations": [{
      "kind": string|null,
      "level": string|null,
      "sessionCode": string|null,
      "date": string|null,
      "time": string|null,
      "text": string
    }],
    "assignments": [{
      "level": string|null,
      "groupLabel": string|null,
      "sessionCode": string|null,
      "birthDateRange": string|null,
      "divisionLabel": string|null,
      "note": string|null
    }],
    "days": [{
      "date": string|null,
      "shortDate": string|null,
      "sessions": [{
        "code": string|null,
        "group": string|null,
        "startTime": string|null,
        "warmupTime": string|null,
        "note": string|null,
        "clubs": [{
          "name": string|null,
          "teamAwardEligible": boolean|null,
          "athleteCount": number|null,
          "divisionLabel": string|null
        }]
      }]
    }]
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
    "- Documents may be mixed packets. Use `documentProfile` only as the coarse primary label; still extract both public and coach-only sections when present.",
    "- `coachInfo`: sign-in, attire, hospitality, scratches, floor-access rules, rotation-sheet instructions, regional commitment steps, payment/refund/qualification rules, and coach/admin contacts.",
    "",
    "## Field-Level Rules",
    "- `rotationOrder`: populate ONLY when the source explicitly lists an apparatus/rotation sequence.",
    "- Narrative references to rotation sheets are NOT a sequence; set `rotationOrder` to null and keep narrative in operational notes.",
    "- For `dates`, preserve meet ranges exactly when present (example: `March 6-8, 2026`).",
    "- Never use update/revision stamps (e.g., `Updated February 23, 2026`) as meet date values.",
    "- Never use posted timestamps (for example `Posted 3/4/26`) as meet date values.",
    "- Never use traffic windows or unrelated schedule snippets as primary meet dates.",
    "- Never place late-fee dates, refund deadlines, or entry deadlines in `dates`, `startAt`, or `endAt`.",
    "- URLs must be absolute (https://...) whenever possible.",
    "- Strings must be short and factual. No meta commentary.",
    "- Use only explicitly visible/source-grounded facts. No paraphrase or inferred venue details.",
    "- For `meetDetails.operationalNotes`, each item must be a complete sentence or complete standalone label.",
    "- `meetDetails.operationalNotes`: maximum 6 items, deduplicated, concise, readable, and non-overlapping with dedicated fields.",
    "- `athlete.awards`: only explicit awards location/time when shown; otherwise null.",
    "- Keep traffic/parking/general travel guidance in logistics fields, not awards/facility-specific fields.",
    "- Do not output fragmented line-wrap artifacts (for example avoid splitting one sentence into multiple array items).",
    "- If evidence includes coach-page hints, treat them as a strong signal to populate `coachInfo`.",
    "- Put coach-only operational instructions in `coachInfo` before using generic `contacts`, `deadlines`, or `unmappedFacts`.",
    "- Route public spectator pricing ONLY into `admission`.",
    "- Do not repeat public meet dates inside `meetDetails.operationalNotes`; dates belong in `dates` only.",
    "- Do not repeat public admission pricing inside `meetDetails.operationalNotes`; pricing belongs in `admission` only.",
    "- Do not place public admission pass labels or ticket notes in `meetDetails.operationalNotes` (examples: `Day Pass`, `All Session Pass`, `Adult`, `Child`, `Children 5 and under`, `Cash only`, `Credit card`).",
    "- If a line is about spectator tickets, pass types, admission prices, or who gets in free, route it ONLY to `admission` and keep it out of `meetDetails.operationalNotes`.",
    "- Route club/coach registration fees, team fees, late fees, payment rules, refunds, qualification, meet format, equipment notes, and coach operations into `coachInfo`.",
    "- Never place coach entry fees or team fees into public `admission`.",
    "- Keep parking maps/rates in `logistics.parkingLinks` or `logistics.parkingPricingLinks`.",
    "- Put public results/live scoring text in `meetDetails.resultsInfo`; put coach-only rotation-sheet procedures in `coachInfo.rotationSheets` or `meetDetails.rotationSheetsInfo` only when they are public-facing.",
    "- `coachInfo.attire` should be one concise string. Use `coachInfo.notes` for extra bullet-like coach notes.",
    "- `gear.uniform` and `gear.checklist` are ONLY for true athlete gear, uniform, hair, or equipment-prep items.",
    "- Never place venue temperature notes, admission reminders, ticket policy, athlete cards, score-recording notes, results websites, sponsor copy, or general operational reminders in `gear`.",
    "- Pages dominated by session labels, stretch/warmup times, and repeated club names are schedule grids, not public prose.",
    "- Do not convert session grids, club participation tables, or repeated club-name lists into `meetDetails.operationalNotes`, `gear`, `communications.announcements`, or `unmappedFacts`.",
    "- Venue comfort notes (for example temperature/chilly reminders) belong with venue details, not `gear`.",
    "- Athlete card or scorecard-memento notes belong in `meetDetails.operationalNotes`, not `gear`.",
    "- For `communications.announcements`, include ONLY true transient updates or cross-cutting alerts that a user would reasonably expect in an announcements module.",
    "- Do NOT place venue phone numbers, facility contacts, meet staff contacts, admission pricing/policies, arrival guidance, registration instructions, results, rotation sheets, awards, sponsor blurbs, club-participation lists, or document-version notes in `communications.announcements`.",
    "- Do not prefix leftover facts with category labels inside announcement text (examples to avoid: `venue_contact ...`, `marketing ...`, `document_version ...`).",
    "- For `communications.announcements`, use a short `title` when obvious and keep the `body` as the explanatory sentence only.",
    "- Never repeat the title words at the beginning of `communications.announcements[].body`.",
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
    hostGym: sanitizeHostGymValue(value.hostGym),
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
      resultsInfo: safeString(value.meetDetails?.resultsInfo) || null,
      rotationSheetsInfo: safeString(value.meetDetails?.rotationSheetsInfo) || null,
      awardsInfo: safeString(value.meetDetails?.awardsInfo) || null,
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
      parkingPricingLinks: uniqueBy(
        pickArray(value.logistics?.parkingPricingLinks)
          .map((item) => ({
            label: safeString(item?.label) || "Parking pricing",
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
    coachInfo: {
      signIn: safeString(value.coachInfo?.signIn) || null,
      attire:
        safeString(value.coachInfo?.attire) ||
        uniqueBy(
          pickArray(value.coachInfo?.attire).map((item) => safeString(item)).filter(Boolean),
          (item) => item
        ).join("\n") ||
        null,
      hospitality: safeString(value.coachInfo?.hospitality) || null,
      floorAccess: safeString(value.coachInfo?.floorAccess) || null,
      scratches: safeString(value.coachInfo?.scratches) || null,
      floorMusic: safeString(value.coachInfo?.floorMusic) || null,
      rotationSheets: safeString(value.coachInfo?.rotationSheets) || null,
      awards: safeString(value.coachInfo?.awards) || null,
      regionalCommitment: safeString(value.coachInfo?.regionalCommitment) || null,
      qualification: safeString(value.coachInfo?.qualification) || null,
      meetFormat: safeString(value.coachInfo?.meetFormat) || null,
      equipment: safeString(value.coachInfo?.equipment) || null,
      refundPolicy: safeString(value.coachInfo?.refundPolicy) || null,
      paymentInstructions: safeString(value.coachInfo?.paymentInstructions) || null,
      entryFees: uniqueBy(
        pickArray(value.coachInfo?.entryFees)
          .map((item) => ({
            label: safeString(item?.label) || "Entry fee",
            amount: safeString(item?.amount || item?.price),
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.note),
        (item) => [item.label, item.amount, item.note || ""].join("|")
      ),
      teamFees: uniqueBy(
        pickArray(value.coachInfo?.teamFees)
          .map((item) => ({
            label: safeString(item?.label) || "Team fee",
            amount: safeString(item?.amount || item?.price),
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.note),
        (item) => [item.label, item.amount, item.note || ""].join("|")
      ),
      lateFees: uniqueBy(
        pickArray(value.coachInfo?.lateFees)
          .map((item) => ({
            label: safeString(item?.label) || "Late fee",
            amount: safeString(item?.amount || item?.price),
            trigger: safeString(item?.trigger) || null,
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.trigger || item.note),
        (item) => [item.label, item.amount, item.trigger || "", item.note || ""].join("|")
      ),
      contacts: uniqueBy(
        pickArray(value.coachInfo?.contacts)
          .map((item) => ({
            role: safeString(item?.role) || "Coach contact",
            name: safeString(item?.name) || null,
            email: safeString(item?.email) || null,
            phone: safeString(item?.phone) || null,
          }))
          .filter((item) => item.name || item.email || item.phone),
        (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
      ),
      deadlines: uniqueBy(
        pickArray(value.coachInfo?.deadlines)
          .map((item) => ({
            label: safeString(item?.label) || "Coach deadline",
            date: safeString(item?.date) || null,
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.date || item.note || item.label !== "Coach deadline"),
        (item) => [item.label, item.date || "", item.note || ""].join("|")
      ),
      links: uniqueBy(
        pickArray(value.coachInfo?.links)
          .map((item) => ({
            label: safeString(item?.label) || "Coach link",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url
      ),
      notes: uniqueBy(
        pickArray(value.coachInfo?.notes).map((item) => safeString(item)).filter(Boolean),
        (item) => item
      ),
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
    schedule: {
      venueLabel: safeString(value.schedule?.venueLabel) || null,
      supportEmail: safeString(value.schedule?.supportEmail) || null,
      notes: uniqueBy(
        pickArray(value.schedule?.notes).map((item) => safeString(item)).filter(Boolean),
        (item) => item
      ),
      colorLegend: sanitizeScheduleColorLegendEntries(pickArray(value.schedule?.colorLegend) as any),
      awardLegend: uniqueBy(
        pickArray(value.schedule?.awardLegend)
          .map((item) => ({
            colorHex: normalizeColorHex(item?.colorHex) || null,
            colorLabel: safeString(item?.colorLabel) || null,
            meaning: safeString(item?.meaning) || null,
            teamAwardEligible:
              typeof item?.teamAwardEligible === "boolean" ? item.teamAwardEligible : null,
          }))
          .filter((item) => item.meaning || typeof item.teamAwardEligible === "boolean"),
        (item) =>
          `${item.meaning || ""}|${item.colorHex || ""}|${item.colorLabel || ""}|${item.teamAwardEligible ?? ""}`
      ),
      annotations: uniqueBy(
        pickArray(value.schedule?.annotations)
          .map((item) => ({
            kind: safeString(item?.kind) || null,
            level: safeString(item?.level) || null,
            sessionCode: safeString(item?.sessionCode).toUpperCase() || null,
            date: safeString(item?.date) || null,
            time: safeString(item?.time) || null,
            text: safeString(item?.text),
          }))
          .filter((item) => item.text),
        (item) =>
          `${item.kind || ""}|${item.level || ""}|${item.sessionCode || ""}|${item.date || ""}|${item.time || ""}|${item.text}`
      ),
      assignments: uniqueBy(
        pickArray(value.schedule?.assignments)
          .map((item) => ({
            level: safeString(item?.level) || null,
            groupLabel: safeString(item?.groupLabel) || null,
            sessionCode: safeString(item?.sessionCode).toUpperCase() || null,
            birthDateRange: safeString(item?.birthDateRange) || null,
            divisionLabel: safeString(item?.divisionLabel) || null,
            note: safeString(item?.note) || null,
          }))
          .filter(
            (item) =>
              item.sessionCode ||
              item.groupLabel ||
              item.birthDateRange ||
              item.divisionLabel ||
              item.note
          ),
        (item) =>
          `${item.level || ""}|${item.groupLabel || ""}|${item.sessionCode || ""}|${item.birthDateRange || ""}|${item.divisionLabel || ""}|${item.note || ""}`
      ),
      days: pickArray(value.schedule?.days)
        .map((day) => ({
          date: safeString(day?.date) || null,
          shortDate: safeString(day?.shortDate) || null,
          sessions: pickArray(day?.sessions)
            .map((session) => ({
              code: safeString(session?.code) || null,
              group: safeString(session?.group) || null,
              startTime: safeString(session?.startTime) || null,
              warmupTime: safeString(session?.warmupTime) || null,
              note: safeString(session?.note) || null,
              color: normalizeScheduleColorRef(session?.color),
              clubs: uniqueBy(
                pickArray(session?.clubs)
                  .map((club) => ({
                    name: safeString(club?.name) || null,
                    teamAwardEligible:
                      typeof club?.teamAwardEligible === "boolean"
                        ? club.teamAwardEligible
                        : null,
                    athleteCount:
                      typeof club?.athleteCount === "number" && Number.isFinite(club.athleteCount)
                        ? club.athleteCount
                        : null,
                    divisionLabel: safeString(club?.divisionLabel) || null,
                    color: normalizeScheduleColorRef(club?.color),
                  }))
                  .filter((club) => club.name),
                (club) => [club.name || "", club.divisionLabel || "", `${club.athleteCount ?? ""}`].join("|")
              ),
            }))
            .filter((session) => session.code || session.group || session.startTime || session.clubs.length > 0),
        }))
        .filter((day) => day.date || day.shortDate || day.sessions.length > 0),
    },
  };
}

function sanitizeDiscoveryParseResult(value: ParseResult): ParseResult {
  const next: ParseResult = {
    ...value,
    hostGym: sanitizeHostGymValue(value.hostGym),
    meetDetails: {
      ...value.meetDetails,
      operationalNotes: [...pickArray(value.meetDetails?.operationalNotes)],
    },
    gear: {
      ...value.gear,
      checklist: [...pickArray(value.gear?.checklist)],
    },
    unmappedFacts: pickArray(value.unmappedFacts).map((item) => ({
      category: safeString(item?.category) || "general",
      detail: safeString(item?.detail),
      confidence:
        item?.confidence === "high" || item?.confidence === "low" ? item.confidence : "medium",
    })),
  };

  const nextFacts = [...next.unmappedFacts];
  const routeRejectedFact = (line: string) => {
    const text = safeString(line);
    if (!text) return;
    if (isMarketingLikeText(text) || isScheduleGridLikeText(text) || isClubParticipationLikeText(text)) {
      return;
    }
    if (VENUE_DETAIL_TEXT_PATTERN.test(text)) {
      appendUnmappedFact(nextFacts, "venue_detail", text);
      return;
    }
    if (isAdmissionAnnouncementText(text)) {
      appendUnmappedFact(nextFacts, "admission_policy", text);
      return;
    }
    if (MEET_DETAIL_REROUTE_TEXT_PATTERN.test(text)) {
      appendUnmappedFact(nextFacts, "meet_detail", text);
    }
  };

  next.meetDetails.operationalNotes = uniqueBy(
    next.meetDetails.operationalNotes
      .map((item) => safeString(item))
      .filter(Boolean)
      .filter((item) => {
        if (isMarketingLikeText(item) || isScheduleGridLikeText(item) || isClubParticipationLikeText(item)) {
          return false;
        }
        if (VENUE_DETAIL_TEXT_PATTERN.test(item) || isAdmissionAnnouncementText(item)) {
          routeRejectedFact(item);
          return false;
        }
        return true;
      }),
    (item) => item
  );

  const gearUniform = safeString(next.gear.uniform);
  next.gear.uniform = gearUniform && isTrueGearLikeText(gearUniform) ? gearUniform : null;
  if (gearUniform && !next.gear.uniform) {
    routeRejectedFact(gearUniform);
  }

  next.gear.checklist = uniqueBy(
    next.gear.checklist
      .map((item) => safeString(item))
      .filter(Boolean)
      .filter((item) => {
        if (isTrueGearLikeText(item)) return true;
        routeRejectedFact(item);
        return false;
      }),
    (item) => item
  );

  next.unmappedFacts = uniqueBy(
    nextFacts.filter((item) => {
      const category = safeString(item?.category).toLowerCase();
      const detail = safeString(item?.detail);
      if (!detail) return false;
      if (SUPPRESSED_UNMAPPED_FACT_CATEGORIES.has(category)) return false;
      if (isMarketingLikeText(detail)) return false;
      if (isScheduleGridLikeText(detail) || isClubParticipationLikeText(detail)) return false;
      return true;
    }),
    (item) => `${safeString(item?.category)}|${safeString(item?.detail)}`
  );
  next.schedule = finalizeParsedSchedule({
    ...next.schedule,
    awardLegend: sanitizeScheduleLegendEntries(pickArray(next.schedule?.awardLegend) as any),
    annotations: sanitizeScheduleAnnotations(pickArray(next.schedule?.annotations) as any),
    assignments: sanitizeScheduleAssignments(pickArray(next.schedule?.assignments) as any),
  });

  return next;
}

function mergeCoachFeesFromAdmission(parseResult: ParseResult): ParseResult {
  const spectatorAdmission: ParseResult["admission"] = [];
  const entryFees = [...parseResult.coachInfo.entryFees];
  const teamFees = [...parseResult.coachInfo.teamFees];
  const lateFees = [...parseResult.coachInfo.lateFees];

  for (const item of parseResult.admission) {
    const bucket = inferCoachFeeBucket(item);
    if (!isSpectatorAdmissionLabel(item.label) && bucket) {
      if (bucket === "entry") {
        entryFees.push({
          label: item.label || "Entry fee",
          amount: item.price,
          note: item.note || null,
        });
      } else if (bucket === "team") {
        teamFees.push({
          label: item.label || "Team fee",
          amount: item.price,
          note: item.note || null,
        });
      } else if (bucket === "late") {
        lateFees.push({
          label: item.label || "Late fee",
          amount: item.price,
          trigger: item.note || null,
          note: item.note || null,
        });
      }
      continue;
    }
    spectatorAdmission.push(item);
  }

  return {
    ...parseResult,
    admission: uniqueBy(spectatorAdmission, (item) =>
      [item.label, item.price, item.note || ""].join("|")
    ),
    coachInfo: {
      ...parseResult.coachInfo,
      entryFees: uniqueBy(entryFees, (item) => [item.label, item.amount, item.note || ""].join("|")),
      teamFees: uniqueBy(teamFees, (item) => [item.label, item.amount, item.note || ""].join("|")),
      lateFees: uniqueBy(lateFees, (item) =>
        [item.label, item.amount, item.trigger || "", item.note || ""].join("|")
      ),
    },
  };
}

function routeCoachDeadlines(parseResult: ParseResult): ParseResult {
  const publicDeadlines: ParseResult["deadlines"] = [];
  const coachDeadlines = [...parseResult.coachInfo.deadlines];
  for (const item of parseResult.deadlines) {
    const haystack = `${item.label} ${item.note || ""}`;
    if (/(entry|registration|deadline|late fee|refund|regional|qualification|payment|meet maker|reservation)/i.test(haystack)) {
      coachDeadlines.push(item);
      continue;
    }
    publicDeadlines.push(item);
  }
  return {
    ...parseResult,
    deadlines: uniqueBy(publicDeadlines, (item) => [item.label, item.date || "", item.note || ""].join("|")),
    coachInfo: {
      ...parseResult.coachInfo,
      deadlines: uniqueBy(coachDeadlines, (item) => [item.label, item.date || "", item.note || ""].join("|")),
    },
  };
}

function reconcileParsedDates(parseResult: ParseResult, extractedText: string): ParseResult {
  const dateAnalysis = classifyMeetDateCandidates(extractedText);
  const primary = dateAnalysis.primary;
  const currentRange = deriveDateRangeFromText(parseResult.dates);
  const currentLabel = safeString(parseResult.dates);
  const currentLooksAdministrative =
    /\b(updated|posted|deadline|late fee|refund|entry|page\s+\d+\s+of\s+\d+)\b/i.test(currentLabel);
  const shouldReplaceDates =
    Boolean(primary) &&
    (currentLooksAdministrative ||
      !currentRange.startDate ||
      !currentLabel ||
      (primary &&
        currentRange.startDate &&
        primary.startDate &&
        currentRange.startDate !== primary.startDate &&
        primary.score >= 4));

  if (!primary || !shouldReplaceDates) {
    return parseResult;
  }

  const preserveIsoTime = (iso: string | null, nextDate: string | null) => {
    if (!iso || !nextDate) return iso;
    const match = iso.match(/T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
    if (!match) return `${nextDate}T00:00:00.000Z`;
    return `${nextDate}${match[0]}`;
  };

  const nextStartAt =
    !parseResult.startAt ||
    !isDateWithinRange(parseResult.startAt.slice(0, 10), primary.startDate, primary.endDate)
      ? preserveIsoTime(parseResult.startAt, primary.startDate)
      : parseResult.startAt;
  const nextEndAt =
    !parseResult.endAt ||
    !isDateWithinRange(parseResult.endAt.slice(0, 10), primary.startDate, primary.endDate)
      ? preserveIsoTime(parseResult.endAt, primary.endDate || primary.startDate)
      : parseResult.endAt;

  return {
    ...parseResult,
    dates: primary.label,
    startAt: nextStartAt,
    endAt: nextEndAt,
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

const SCHEDULE_SCHEMA_INSTRUCTIONS = `Return JSON only. Do not wrap in markdown.
{
  "venueLabel": string|null,
  "supportEmail": string|null,
  "notes": [string],
  "colorLegend": [{
    "id": string|null,
    "target": "session"|"club"|null,
    "colorHex": string|null,
    "colorLabel": string|null,
    "meaning": string|null,
    "sourceText": string|null,
    "teamAwardEligible": boolean|null
  }],
  "awardLegend": [{
    "colorHex": string|null,
    "colorLabel": string|null,
    "meaning": string|null,
    "teamAwardEligible": boolean|null
  }],
  "annotations": [{
    "kind": string|null,
    "level": string|null,
    "sessionCode": string|null,
    "date": string|null,
    "time": string|null,
    "text": string
  }],
  "assignments": [{
    "level": string|null,
    "groupLabel": string|null,
    "sessionCode": string|null,
    "birthDateRange": string|null,
    "divisionLabel": string|null,
    "note": string|null
  }],
  "days": [{
    "date": string|null,
    "shortDate": string|null,
    "sessions": [{
      "code": string|null,
      "group": string|null,
      "startTime": string|null,
      "warmupTime": string|null,
      "note": string|null,
      "color": {
        "legendId": string|null,
        "textColorHex": string|null,
        "confidence": number|null
      }|null,
      "clubs": [{
        "name": string|null,
        "teamAwardEligible": boolean|null,
        "athleteCount": number|null,
        "divisionLabel": string|null,
        "color": {
          "legendId": string|null,
          "textColorHex": string|null,
          "confidence": number|null
        }|null
      }]
    }]
  }]
}`;

const SCHEDULE_AWARD_FLAGS_SCHEMA = `Return JSON only. Do not wrap in markdown.
{
  "legendNotes": [string],
  "awardLegend": [{
    "colorHex": string|null,
    "colorLabel": string|null,
    "meaning": string|null,
    "teamAwardEligible": boolean|null
  }],
  "days": [{
    "date": string|null,
    "sessions": [{
      "code": string|null,
      "clubs": [{
        "name": string|null,
        "teamAwardEligible": boolean|null,
        "color": {
          "legendId": string|null,
          "textColorHex": string|null,
          "confidence": number|null
        }|null
      }]
    }]
  }]
}`;

const SCHEDULE_VISUAL_SCHEMA = `Return JSON only. Do not wrap in markdown.
{
  "venueLabel": string|null,
  "supportEmail": string|null,
  "notes": [string],
  "colorLegend": [{
    "id": string|null,
    "target": "session"|"club"|null,
    "colorHex": string|null,
    "colorLabel": string|null,
    "meaning": string|null,
    "sourceText": string|null,
    "teamAwardEligible": boolean|null
  }],
  "awardLegend": [{
    "colorHex": string|null,
    "colorLabel": string|null,
    "meaning": string|null,
    "teamAwardEligible": boolean|null
  }],
  "annotations": [{
    "kind": string|null,
    "level": string|null,
    "sessionCode": string|null,
    "date": string|null,
    "time": string|null,
    "text": string
  }],
  "assignments": [{
    "level": string|null,
    "groupLabel": string|null,
    "sessionCode": string|null,
    "birthDateRange": string|null,
    "divisionLabel": string|null,
    "note": string|null
  }],
  "days": [{
    "date": string|null,
    "shortDate": string|null,
    "sessions": [{
      "code": string|null,
      "group": string|null,
      "startTime": string|null,
      "warmupTime": string|null,
      "note": string|null,
      "color": {
        "legendId": string|null,
        "textColorHex": string|null,
        "confidence": number|null
      }|null,
      "clubs": [{
        "name": string|null,
        "teamAwardEligible": boolean|null,
        "athleteCount": number|null,
        "divisionLabel": string|null,
        "color": {
          "legendId": string|null,
          "textColorHex": string|null,
          "confidence": number|null
        }|null
      }]
    }]
  }]
}`;

function normalizeScheduleClubLookup(value: unknown): string {
  return safeString(value)
    .replace(/\(\d+\)/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function extractScheduleLegendNotes(text: string): string[] {
  const lines = safeString(text)
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter(Boolean);
  const notes: string[] = [];
  if (lines.some((line) => /clubs in pink .*individual\s*&?\s*team awards/i.test(line))) {
    notes.push("Clubs in pink are competing for Individual & Team awards.");
  }
  if (lines.some((line) => /clubs in black .*individual awards only/i.test(line))) {
    notes.push("Clubs in black are competing for Individual awards only.");
  }
  return uniqueBy(notes, (item) => item);
}

function normalizeScheduleAwardFlagDays(value: unknown): ScheduleAwardFlagDay[] {
  return pickArray(value)
    .map((day) => ({
      date: safeString(day?.date) || null,
      sessions: pickArray(day?.sessions)
        .map((session) => ({
          code: safeString(session?.code).toUpperCase() || null,
          clubs: uniqueBy(
            pickArray(session?.clubs)
              .map((club) => ({
                name: safeString(club?.name) || null,
                teamAwardEligible:
                  typeof club?.teamAwardEligible === "boolean" ? club.teamAwardEligible : null,
              }))
              .filter((club) => club.name),
            (club) => normalizeScheduleClubLookup(club.name)
          ),
        }))
        .filter((session) => session.code || session.clubs.length > 0),
    }))
    .filter((day) => day.date || day.sessions.length > 0);
}

function detectScheduleTableBlocksFromPageText(
  pageNumber: number,
  text: string
): Array<{
  pageNumber: number;
  order: number;
  text: string;
  normalizedBox: { x: number; y: number; w: number; h: number };
}> {
  const lines = safeString(text)
    .split(/\n/)
    .map((line) => safeString(line));
  const nonEmptyLines = lines.filter(Boolean);
  if (!nonEmptyLines.length) return [];

  const blocks: Array<{
    pageNumber: number;
    order: number;
    text: string;
    normalizedBox: { x: number; y: number; w: number; h: number };
  }> = [];

  for (let index = 0; index < nonEmptyLines.length; index += 1) {
    if (!extractSessionCodesFromHeader(nonEmptyLines[index]).length) continue;
    let cursor = index + 1;
    while (cursor < nonEmptyLines.length) {
      const candidate = nonEmptyLines[cursor];
      if (
        (cursor > index + 1 && extractSessionCodesFromHeader(candidate).length) ||
        /^--\s*\d+/i.test(candidate)
      ) {
        break;
      }
      cursor += 1;
    }
    const startLine = Math.max(0, index - 1);
    const endLine = Math.min(nonEmptyLines.length, cursor + 1);
    const y = Math.max(0.01, startLine / nonEmptyLines.length);
    const h = Math.max(0.12, Math.min(0.96 - y, (endLine - startLine) / nonEmptyLines.length));
    blocks.push({
      pageNumber,
      order: blocks.length + 1,
      text: nonEmptyLines.slice(index, cursor).join("\n"),
      normalizedBox: {
        x: 0.02,
        y,
        w: 0.96,
        h,
      },
    });
    index = Math.max(index, cursor - 1);
  }

  return blocks;
}

async function cropScheduleImageTableBlock(
  dataUrl: string,
  box: { x: number; y: number; w: number; h: number }
): Promise<string | null> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  try {
    const metadata = await sharp(parsed.buffer).metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!width || !height) return null;
    const left = Math.max(0, Math.floor(box.x * width));
    const top = Math.max(0, Math.floor(box.y * height));
    const cropWidth = Math.min(width - left, Math.max(32, Math.ceil(box.w * width)));
    const cropHeight = Math.min(height - top, Math.max(32, Math.ceil(box.h * height)));
    if (cropWidth < 24 || cropHeight < 24) return null;
    const cropped = await sharp(parsed.buffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();
    return await toOptimizedImageDataUrl(cropped);
  } catch {
    return null;
  }
}

function clampNormalizedScheduleColorBox(value: unknown): NormalizedScheduleColorBox | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, any>;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const w = Number(raw.w);
  const h = Number(raw.h);
  if (![x, y, w, h].every((item) => Number.isFinite(item))) return null;
  const normalized = {
    x: Math.max(0, Math.min(1000, x)),
    y: Math.max(0, Math.min(1000, y)),
    w: Math.max(1, Math.min(1000, w)),
    h: Math.max(1, Math.min(1000, h)),
  };
  if (normalized.x + normalized.w > 1000) normalized.w = 1000 - normalized.x;
  if (normalized.y + normalized.h > 1000) normalized.h = 1000 - normalized.y;
  return normalized.w >= 1 && normalized.h >= 1 ? normalized : null;
}

function normalizeScheduleColorOcrText(value: unknown): string {
  return safeString(value).replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function toNormalizedScheduleColorBoxFromVertices(
  vertices: unknown,
  width: number,
  height: number
): NormalizedScheduleColorBox | null {
  const points = pickArray(vertices)
    .map((vertex) => ({
      x: Number((vertex as any)?.x),
      y: Number((vertex as any)?.y),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length || width <= 0 || height <= 0) return null;
  const minX = Math.max(0, Math.min(...points.map((point) => point.x)));
  const minY = Math.max(0, Math.min(...points.map((point) => point.y)));
  const maxX = Math.min(width, Math.max(...points.map((point) => point.x)));
  const maxY = Math.min(height, Math.max(...points.map((point) => point.y)));
  if (maxX - minX < 2 || maxY - minY < 2) return null;
  return clampNormalizedScheduleColorBox({
    x: (minX / width) * 1000,
    y: (minY / height) * 1000,
    w: ((maxX - minX) / width) * 1000,
    h: ((maxY - minY) / height) * 1000,
  });
}

async function extractScheduleOcrTextBoxesFromDataUrl(
  dataUrl: string
): Promise<ScheduleColorOcrTextBox[]> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return [];
  try {
    const metadata = await sharp(parsed.buffer).metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!width || !height) return [];
    const vision = getVisionClient();
    const [result] = await vision.documentTextDetection({
      image: { content: parsed.buffer },
      imageContext: { languageHints: ["en"] },
    });
    const paragraphs =
      pickArray(result?.fullTextAnnotation?.pages)
        .flatMap((page: any) => pickArray(page?.blocks))
        .flatMap((block: any) => pickArray(block?.paragraphs))
        .map((paragraph: any) => {
          const words = pickArray(paragraph?.words)
            .map((word: any) =>
              pickArray(word?.symbols)
                .map((symbol: any) => safeString(symbol?.text))
                .join("")
            )
            .filter(Boolean);
          const text = words.join(" ").replace(/\s+/g, " ").trim();
          const box = toNormalizedScheduleColorBoxFromVertices(
            paragraph?.boundingBox?.vertices,
            width,
            height
          );
          return {
            text,
            normalizedText: normalizeScheduleColorOcrText(text),
            clubLookup: normalizeScheduleClubLookup(text),
            box,
            area: box ? box.w * box.h : Number.POSITIVE_INFINITY,
          };
        })
        .filter(
          (item): item is ScheduleColorOcrTextBox =>
            Boolean(item.text) && Boolean(item.box)
        ) || [];
    if (paragraphs.length > 0) {
      return uniqueBy(paragraphs, (item) => `${item.normalizedText}|${JSON.stringify(item.box)}`);
    }
    const textAnnotations = pickArray(result?.textAnnotations)
      .slice(1)
      .map((item: any) => {
        const text = safeString(item?.description).replace(/\s+/g, " ").trim();
        const box = toNormalizedScheduleColorBoxFromVertices(
          item?.boundingPoly?.vertices,
          width,
          height
        );
        return {
          text,
          normalizedText: normalizeScheduleColorOcrText(text),
          clubLookup: normalizeScheduleClubLookup(text),
          box,
          area: box ? box.w * box.h : Number.POSITIVE_INFINITY,
        };
      })
      .filter(
        (item): item is ScheduleColorOcrTextBox =>
          Boolean(item.text) && Boolean(item.box)
      );
    return uniqueBy(textAnnotations, (item) => `${item.normalizedText}|${JSON.stringify(item.box)}`);
  } catch {
    return [];
  }
}

function findBestScheduleSessionColorBox(
  textBoxes: ScheduleColorOcrTextBox[],
  sessionCode: string
): ScheduleColorOcrTextBox | null {
  const code = safeString(sessionCode).toUpperCase();
  if (!code) return null;
  const codeLookup = normalizeScheduleColorOcrText(code);
  const candidates = textBoxes
    .map((item) => {
      const text = item.normalizedText;
      let score = 0;
      if (new RegExp(`\\bsession\\s+${codeLookup}\\b`, "i").test(text)) score = 5;
      else if (new RegExp(`\\b${codeLookup}\\b`, "i").test(text)) score = 3;
      else if (text.includes(codeLookup)) score = 1;
      return { item, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.item.area - right.item.area);
  return candidates[0]?.item || null;
}

function findBestScheduleClubColorBox(
  textBoxes: ScheduleColorOcrTextBox[],
  clubName: string
): ScheduleColorOcrTextBox | null {
  const lookup = normalizeScheduleClubLookup(clubName);
  if (!lookup) return null;
  const candidates = textBoxes
    .map((item) => {
      let score = 0;
      if (item.clubLookup === lookup) score = 5;
      else if (item.clubLookup.startsWith(`${lookup} `) || item.clubLookup.endsWith(` ${lookup}`))
        score = 4;
      else if (item.clubLookup.includes(lookup) || lookup.includes(item.clubLookup)) score = 2;
      return { item, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.item.area - right.item.area);
  return candidates[0]?.item || null;
}

function deriveScheduleLegendEntriesFromOcrTextBoxes(
  textBoxes: ScheduleColorOcrTextBox[],
  clubColors: Array<{ colorHex: string | null; teamAwardEligible: boolean | null }>
): ScheduleColorLegendEntry[] {
  const lines = uniqueBy(
    textBoxes.map((item) => safeString(item.text)).filter(Boolean),
    (item) => normalizeScheduleColorOcrText(item)
  );
  const trueColors = clubColors
    .filter((item) => item.teamAwardEligible === true)
    .map((item) => item.colorHex || "")
    .filter(Boolean);
  const falseColors = clubColors
    .filter((item) => item.teamAwardEligible === false)
    .map((item) => item.colorHex || "")
    .filter(Boolean);
  const entries: ScheduleColorLegendEntry[] = [];
  if (lines.some((line) => /clubs in pink .*individual\s*&?\s*team awards/i.test(line))) {
    entries.push({
      id: null,
      target: "club",
      colorHex: pickDominantLegendColorHex(trueColors),
      colorLabel: "Pink",
      meaning: "Individual & Team Awards",
      sourceText: lines.find((line) => /clubs in pink/i.test(line)) || null,
      teamAwardEligible: true,
    });
  }
  if (lines.some((line) => /clubs in black .*individual awards only/i.test(line))) {
    entries.push({
      id: null,
      target: "club",
      colorHex: pickDominantLegendColorHex(falseColors),
      colorLabel: "Black",
      meaning: "Individual Only",
      sourceText: lines.find((line) => /clubs in black/i.test(line)) || null,
      teamAwardEligible: false,
    });
  }
  return entries;
}

function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  const hex = normalizeColorHex(value);
  if (!hex) return null;
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((item) => Math.max(0, Math.min(255, Math.round(item))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbDistance(
  left: { r: number; g: number; b: number } | null,
  right: { r: number; g: number; b: number } | null
): number {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  return Math.sqrt(
    (left.r - right.r) ** 2 + (left.g - right.g) ** 2 + (left.b - right.b) ** 2
  );
}

function describeRgbColor(rgb: { r: number; g: number; b: number }): {
  luminance: number;
  saturation: number;
} {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const saturation = max === 0 ? 0 : (max - min) / max;
  return { luminance, saturation };
}

async function sampleScheduleTextColorFromDataUrl(
  dataUrl: string,
  box: NormalizedScheduleColorBox | null
): Promise<ScheduleColorRef | null> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed || !box) return null;
  try {
    const base = sharp(parsed.buffer);
    const metadata = await base.metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!width || !height) return null;
    const left = Math.max(0, Math.floor((box.x / 1000) * width));
    const top = Math.max(0, Math.floor((box.y / 1000) * height));
    const cropWidth = Math.min(width - left, Math.max(8, Math.ceil((box.w / 1000) * width)));
    const cropHeight = Math.min(height - top, Math.max(8, Math.ceil((box.h / 1000) * height)));
    if (cropWidth < 4 || cropHeight < 4) return null;
    const { data, info } = await base
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const channels = Number(info.channels || 4);
    const buckets = new Map<
      string,
      { count: number; samples: Array<{ r: number; g: number; b: number }> }
    >();
    let qualifying = 0;
    for (let index = 0; index < data.length; index += channels) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const alpha = (data[index + 3] ?? 255) / 255;
      if (alpha < 0.3) continue;
      const metrics = describeRgbColor({ r, g, b });
      if (metrics.luminance > 0.96) continue;
      if (metrics.luminance < 0.01) continue;
      if (metrics.saturation < 0.08 && metrics.luminance > 0.35 && metrics.luminance < 0.85) {
        continue;
      }
      qualifying += 1;
      const key = `${Math.round(r / 16) * 16}|${Math.round(g / 16) * 16}|${Math.round(b / 16) * 16}`;
      const bucket = buckets.get(key) || { count: 0, samples: [] };
      bucket.count += 1;
      bucket.samples.push({ r, g, b });
      buckets.set(key, bucket);
    }
    if (qualifying < 20 || buckets.size === 0) return null;
    const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    const confidence = dominant.count / qualifying;
    if (confidence < 0.3) return null;
    const avg = dominant.samples.reduce(
      (acc, sample) => ({
        r: acc.r + sample.r,
        g: acc.g + sample.g,
        b: acc.b + sample.b,
      }),
      { r: 0, g: 0, b: 0 }
    );
    const rgb = {
      r: avg.r / dominant.samples.length,
      g: avg.g / dominant.samples.length,
      b: avg.b / dominant.samples.length,
    };
    const metrics = describeRgbColor(rgb);
    if (metrics.saturation < 0.18 && metrics.luminance > 0.25) return null;
    return {
      legendId: null,
      textColorHex: rgbToHex(rgb.r, rgb.g, rgb.b),
      confidence: Number(confidence.toFixed(3)),
    };
  } catch {
    return null;
  }
}

async function openAiExtractScheduleColorBindingsFromImage(
  dataUrl: string,
  pageText: string
): Promise<ScheduleColorPageAnalysis | null> {
  const parsed = parseDataUrl(dataUrl);
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!parsed || !apiKey) return null;
  const model = resolveOpenAiMiniModel();
  const schema = `Return JSON only. Do not wrap in markdown.
{
  "legendEntries": [{
    "target": "session"|"club"|null,
    "meaning": string|null,
    "colorLabel": string|null,
    "sourceText": string|null,
    "teamAwardEligible": boolean|null,
    "sessionCodes": [string],
    "clubNames": [string]
  }],
  "sessions": [{
    "sessionCode": string|null,
    "group": string|null,
    "confidence": number|null,
    "box": { "x": number, "y": number, "w": number, "h": number }|null
  }],
  "clubs": [{
    "sessionCode": string|null,
    "clubName": string|null,
    "teamAwardEligible": boolean|null,
    "confidence": number|null,
    "box": { "x": number, "y": number, "w": number, "h": number }|null
  }]
}`;
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
              "You inspect gymnastics schedule grid pages and locate session headers and club names that are visible on the page. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  schema,
                  "",
                  "Read the image visually.",
                  "- Bounding boxes use a 0..1000 coordinate space relative to the full page image.",
                  "- Include visible session headers and visible club names from the page.",
                  "- Capture the text box tightly around the colored or styled text itself, not the whole table cell.",
                  "- If the page contains an explicit legend or prose describing color meaning, return it in `legendEntries` and link it to `sessionCodes` or `clubNames` when possible.",
                  "- For club items, set `teamAwardEligible` only when the page makes that meaning explicit.",
                  "- Keep names and session codes as they appear on the page when possible.",
                  "Auxiliary OCR text:",
                  safeString(pageText).slice(0, 12000),
                ].join("\n"),
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${parsed.mimeType};base64,${parsed.buffer.toString("base64")}`,
                },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const json = extractJsonObject(raw);
    if (!json || typeof json !== "object") return null;
    return {
      legendEntries: uniqueBy(
        pickArray((json as any)?.legendEntries)
          .map((entry) => ({
            target:
              safeString(entry?.target) === "session" || safeString(entry?.target) === "club"
                ? (safeString(entry?.target) as ScheduleColorTarget)
                : null,
            meaning: safeString(entry?.meaning) || null,
            colorLabel: safeString(entry?.colorLabel) || null,
            sourceText: safeString(entry?.sourceText) || null,
            teamAwardEligible:
              typeof entry?.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
            sessionCodes: uniqueBy(
              pickArray(entry?.sessionCodes)
                .map((item) => safeString(item).toUpperCase())
                .filter(Boolean),
              (item) => item
            ),
            clubNames: uniqueBy(
              pickArray(entry?.clubNames)
                .map((item) => safeString(item))
                .filter(Boolean),
              (item) => item
            ),
          }))
          .filter(
            (entry) =>
              entry.meaning ||
              entry.colorLabel ||
              entry.sourceText ||
              entry.sessionCodes.length > 0 ||
              entry.clubNames.length > 0
          ),
        (entry) =>
          `${entry.target || ""}|${entry.meaning || ""}|${entry.colorLabel || ""}|${entry.sourceText || ""}|${entry.sessionCodes.join(",")}|${entry.clubNames.join(",")}|${entry.teamAwardEligible ?? ""}`
      ),
      sessions: uniqueBy(
        pickArray((json as any)?.sessions)
          .map((entry) => ({
            sessionCode: safeString(entry?.sessionCode).toUpperCase() || null,
            group: safeString(entry?.group) || null,
            confidence:
              typeof entry?.confidence === "number" && Number.isFinite(entry.confidence)
                ? Math.max(0, Math.min(1, entry.confidence))
                : null,
            box: clampNormalizedScheduleColorBox(entry?.box),
          }))
          .filter((entry) => entry.sessionCode && entry.box),
        (entry) => `${entry.sessionCode}|${JSON.stringify(entry.box)}`
      ),
      clubs: uniqueBy(
        pickArray((json as any)?.clubs)
          .map((entry) => ({
            sessionCode: safeString(entry?.sessionCode).toUpperCase() || null,
            clubName: safeString(entry?.clubName) || null,
            teamAwardEligible:
              typeof entry?.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
            confidence:
              typeof entry?.confidence === "number" && Number.isFinite(entry.confidence)
                ? Math.max(0, Math.min(1, entry.confidence))
                : null,
            box: clampNormalizedScheduleColorBox(entry?.box),
          }))
          .filter((entry) => entry.clubName && entry.box),
        (entry) =>
          `${entry.sessionCode || ""}|${normalizeScheduleClubLookup(entry.clubName)}|${JSON.stringify(entry.box)}`
      ),
    };
  } catch {
    return null;
  }
}

function pickDominantLegendColorHex(samples: string[]): string | null {
  const normalized = samples.map((item) => normalizeColorHex(item)).filter(Boolean);
  if (!normalized.length) return null;
  const clusters: Array<{ rgb: { r: number; g: number; b: number }; colors: string[] }> = [];
  for (const color of normalized) {
    const rgb = hexToRgb(color);
    if (!rgb) continue;
    const cluster = clusters.find((item) => rgbDistance(item.rgb, rgb) <= 18);
    if (cluster) {
      cluster.colors.push(color);
    } else {
      clusters.push({ rgb, colors: [color] });
    }
  }
  const winner = clusters.sort((a, b) => b.colors.length - a.colors.length)[0];
  if (!winner) return null;
  const rgbs = winner.colors.map((item) => hexToRgb(item)).filter(Boolean) as Array<{
    r: number;
    g: number;
    b: number;
  }>;
  if (!rgbs.length) return null;
  return rgbToHex(
    rgbs.reduce((sum, item) => sum + item.r, 0) / rgbs.length,
    rgbs.reduce((sum, item) => sum + item.g, 0) / rgbs.length,
    rgbs.reduce((sum, item) => sum + item.b, 0) / rgbs.length
  );
}

function deriveClubLegendFromColoredClubs(
  days: StoredGymMeetScheduleDay[]
): ScheduleColorLegendEntry[] {
  const grouped = new Map<
    string,
    { colorHex: string; teamAwardEligible: boolean; count: number }
  >();
  days.forEach((day) => {
    day.sessions.forEach((session) => {
      session.clubs.forEach((club) => {
        const colorHex = normalizeColorHex(club.color?.textColorHex);
        if (!colorHex || typeof club.teamAwardEligible !== "boolean") return;
        const key = `${colorHex}|${club.teamAwardEligible}`;
        const existing = grouped.get(key) || {
          colorHex,
          teamAwardEligible: club.teamAwardEligible,
          count: 0,
        };
        existing.count += 1;
        grouped.set(key, existing);
      });
    });
  });
  return [...grouped.values()]
    .filter((entry) => entry.count >= 2)
    .map((entry) => ({
      id: null,
      target: "club" as const,
      colorHex: entry.colorHex,
      colorLabel: null,
      meaning: entry.teamAwardEligible ? "Individual & Team Awards" : "Individual Only",
      sourceText: null,
      teamAwardEligible: entry.teamAwardEligible,
    }));
}

async function applyScheduleColorsFromImages(
  schedule: ParseResult["schedule"],
  images: Array<{ pageNumber: number; dataUrl: string | null }>,
  pageTexts: Array<{ pageNumber: number; text: string }>,
  performance?: DiscoveryPerformance
): Promise<ParseResult["schedule"]> {
  const normalized = normalizeStoredSchedule(schedule || {});
  const validImages = pickArray(images)
    .map((item) => ({
      pageNumber: Number(item?.pageNumber) || 0,
      dataUrl: safeString(item?.dataUrl || ""),
    }))
    .filter((item) => item.pageNumber > 0 && item.dataUrl);
  if (!normalized.days.length || !validImages.length) {
    return toParseScheduleShape(normalized);
  }
  const textByPage = new Map(
    pickArray(pageTexts)
      .map((item) => [Number(item?.pageNumber) || 0, safeString(item?.text || "")] as const)
      .filter(([pageNumber, text]) => pageNumber > 0 && text)
  );
  const uniqueSessionCodes = uniqueBy(
    normalized.days.flatMap((day) => day.sessions.map((session) => safeString(session.code).toUpperCase())),
    (item) => item
  ).filter(Boolean);
  const uniqueClubNames = uniqueBy(
    normalized.days.flatMap((day) =>
      day.sessions.flatMap((session) => session.clubs.map((club) => safeString(club.name)))
    ),
    (item) => normalizeScheduleClubLookup(item)
  ).filter(Boolean);
  const sessionSamples = new Map<string, ScheduleColorRef>();
  const clubSamples = new Map<string, ScheduleColorRef>();
  const clubEligibility = new Map<string, boolean | null>();
  const explicitLegendEntries: ScheduleColorLegendEntry[] = [];
  for (const image of validImages) {
    const pageText = textByPage.get(image.pageNumber) || "";
    const pageLookup = normalizeScheduleColorOcrText(pageText);
    const ocrTextBoxes = await extractScheduleOcrTextBoxesFromDataUrl(image.dataUrl);
    let ocrSampleCount = 0;

    for (const sessionCode of uniqueSessionCodes) {
      if (pageLookup && !new RegExp(`\\b${normalizeScheduleColorOcrText(sessionCode)}\\b`, "i").test(pageLookup)) {
        continue;
      }
      const matchedBox = findBestScheduleSessionColorBox(ocrTextBoxes, sessionCode);
      if (!matchedBox) continue;
      const sampled = await sampleScheduleTextColorFromDataUrl(image.dataUrl, matchedBox.box);
      if (!sampled?.textColorHex) continue;
      sessionSamples.set(sessionCode, sampled);
      ocrSampleCount += 1;
    }

    for (const clubName of uniqueClubNames) {
      const clubLookup = normalizeScheduleClubLookup(clubName);
      if (pageLookup && clubLookup && !pageLookup.includes(clubLookup)) {
        continue;
      }
      const matchedBox = findBestScheduleClubColorBox(ocrTextBoxes, clubName);
      if (!matchedBox) continue;
      const sampled = await sampleScheduleTextColorFromDataUrl(image.dataUrl, matchedBox.box);
      if (!sampled?.textColorHex) continue;
      normalized.days.forEach((day) => {
        day.sessions.forEach((session) => {
          session.clubs.forEach((club) => {
            if (normalizeScheduleClubLookup(club.name) !== clubLookup) return;
            const key = `${safeString(session.code).toUpperCase()}|${clubLookup}`;
            if (!clubSamples.has(key)) {
              clubSamples.set(key, sampled);
            }
            if (typeof club.teamAwardEligible === "boolean" && !clubEligibility.has(key)) {
              clubEligibility.set(key, club.teamAwardEligible);
            }
          });
        });
      });
      ocrSampleCount += 1;
    }

    if (ocrSampleCount > 0) {
      explicitLegendEntries.push(
        ...deriveScheduleLegendEntriesFromOcrTextBoxes(
          ocrTextBoxes,
          [...clubSamples.entries()].map(([key, value]) => ({
            colorHex: value.textColorHex,
            teamAwardEligible: clubEligibility.get(key) ?? null,
          }))
        )
      );
    }

    if (ocrSampleCount >= 2) {
      continue;
    }

    if (performance) performance.scheduleVisionCalls += 1;
    const analysis = await openAiExtractScheduleColorBindingsFromImage(image.dataUrl, pageText);
    if (!analysis) continue;
    for (const session of analysis.sessions) {
      if (!session.sessionCode || !session.box || sessionSamples.has(session.sessionCode)) continue;
      const sampled = await sampleScheduleTextColorFromDataUrl(image.dataUrl, session.box);
      if (!sampled?.textColorHex) continue;
      sessionSamples.set(session.sessionCode, sampled);
    }
    for (const club of analysis.clubs) {
      if (!club.clubName || !club.box) continue;
      const sampled = await sampleScheduleTextColorFromDataUrl(image.dataUrl, club.box);
      if (!sampled?.textColorHex) continue;
      const key = `${safeString(club.sessionCode).toUpperCase()}|${normalizeScheduleClubLookup(club.clubName)}`;
      if (!clubSamples.has(key)) {
        clubSamples.set(key, sampled);
      }
      if (typeof club.teamAwardEligible === "boolean" && !clubEligibility.has(key)) {
        clubEligibility.set(key, club.teamAwardEligible);
      }
    }
    for (const entry of analysis.legendEntries) {
      const sampleColors =
        entry.target === "session"
          ? entry.sessionCodes
              .map((code) => sessionSamples.get(safeString(code).toUpperCase())?.textColorHex || "")
              .filter(Boolean)
          : entry.clubNames
              .flatMap((clubName) =>
                [...clubSamples.entries()]
                  .filter(([key]) => key.endsWith(`|${normalizeScheduleClubLookup(clubName)}`))
                  .map(([, value]) => value.textColorHex || "")
              )
              .filter(Boolean);
      explicitLegendEntries.push({
        id: null,
        target: entry.target,
        colorHex: pickDominantLegendColorHex(sampleColors),
        colorLabel: entry.colorLabel,
        meaning: entry.meaning,
        sourceText: entry.sourceText,
        teamAwardEligible: entry.teamAwardEligible,
      });
    }
  }

  const nextDays = normalized.days.map((day) => ({
    ...day,
    sessions: day.sessions.map((session) => {
      const sessionSample = sessionSamples.get(safeString(session.code).toUpperCase()) || null;
      const nextClubs = session.clubs.map((club) => {
        const clubKey = `${safeString(session.code).toUpperCase()}|${normalizeScheduleClubLookup(club.name)}`;
        const clubSample = clubSamples.get(clubKey) || null;
        const teamAwardEligible =
          typeof club.teamAwardEligible === "boolean"
            ? club.teamAwardEligible
            : clubEligibility.get(clubKey) ?? null;
        return {
          ...club,
          teamAwardEligible,
          color: clubSample || club.color || null,
        };
      });
      return {
        ...session,
        color: sessionSample || session.color || null,
        clubs: nextClubs,
      };
    }),
  }));

  const syntheticLegendEntries: ScheduleColorLegendEntry[] = [];
  const groupedSessions = new Map<string, Array<{ code: string; group: string }>>();
  nextDays.forEach((day) => {
    day.sessions.forEach((session) => {
      const colorHex = normalizeColorHex(session.color?.textColorHex);
      if (!colorHex) return;
      const key = pickDominantLegendColorHex([colorHex]) || colorHex;
      const group = groupedSessions.get(key) || [];
      group.push({ code: session.code, group: session.group });
      groupedSessions.set(key, group);
    });
  });
  groupedSessions.forEach((items, colorHex) => {
    if (items.length < 2) return;
    const groupLabel = uniqueBy(
      items.map((item) => safeString(item.group)).filter(Boolean),
      (item) => item
    );
    syntheticLegendEntries.push({
      id: null,
      target: "session",
      colorHex,
      colorLabel: null,
      meaning:
        groupLabel.length === 1
          ? groupLabel[0]
          : `Sessions ${items.map((item) => item.code).filter(Boolean).join(", ")}`,
      sourceText: null,
      teamAwardEligible: null,
    });
  });

  const colorLegend = sanitizeScheduleColorLegendEntries([
    ...normalized.colorLegend,
    ...explicitLegendEntries,
    ...deriveClubLegendFromColoredClubs(nextDays),
    ...syntheticLegendEntries,
  ]);

  const legendIdByTargetAndColor = new Map<string, string>();
  colorLegend.forEach((entry) => {
    const key = `${entry.target || ""}|${entry.colorHex || ""}|${entry.teamAwardEligible ?? ""}`;
    if (entry.id && !legendIdByTargetAndColor.has(key)) {
      legendIdByTargetAndColor.set(key, entry.id);
    }
  });

  const finalizedDays = nextDays.map((day) => ({
    ...day,
    sessions: day.sessions.map((session) => {
      const sessionColorHex = normalizeColorHex(session.color?.textColorHex);
      const sessionLegendId =
        sessionColorHex
          ? legendIdByTargetAndColor.get(`session|${sessionColorHex}|`) || session.color?.legendId || null
          : session.color?.legendId || null;
      return {
        ...session,
        color: session.color
          ? {
              ...session.color,
              legendId: sessionLegendId,
              textColorHex: sessionColorHex || session.color.textColorHex,
            }
          : null,
        clubs: session.clubs.map((club) => {
          const clubColorHex = normalizeColorHex(club.color?.textColorHex);
          const clubLegendId =
            clubColorHex
              ? legendIdByTargetAndColor.get(
                  `club|${clubColorHex}|${club.teamAwardEligible ?? ""}`
                ) ||
                legendIdByTargetAndColor.get(`club|${clubColorHex}|`) ||
                club.color?.legendId ||
                null
              : club.color?.legendId || null;
          return {
            ...club,
            color: club.color
              ? {
                  ...club.color,
                  legendId: clubLegendId,
                  textColorHex: clubColorHex || club.color.textColorHex,
                }
              : null,
          };
        }),
      };
    }),
  }));

  return finalizeParsedSchedule({
    ...toParseScheduleShape({
      ...normalized,
      colorLegend,
      awardLegend: toStoredScheduleLegendEntries([
        ...normalized.awardLegend,
        ...deriveAwardLegendFromColorLegend(colorLegend),
      ]),
      days: finalizedDays,
    }),
  });
}

async function openAiExtractVisualSchedulePage(
  dataUrl: string,
  pageNumber: number,
  pageText = "",
  tableContext?: { order: number; total: number },
  performance?: DiscoveryPerformance
): Promise<ParseResult["schedule"] | null> {
  const parsed = parseDataUrl(dataUrl);
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!parsed || !apiKey) return null;
  const model = resolveDiscoveryVisionModel();
  const auxiliaryText = safeString(pageText);
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
              "You extract gymnastics session schedules from schedule-grid images. Read the table visually by columns and subcolumns, not by OCR reading order. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  SCHEDULE_VISUAL_SCHEMA,
                  "",
                  `Image page number: ${pageNumber}`,
                  tableContext
                    ? `This crop is schedule table ${tableContext.order} of ${tableContext.total} on the page.`
                    : "A page may contain multiple independent schedule tables. Parse one table block at a time when boundaries are visible.",
                  "Interpret the schedule as a visual table.",
                  "- A page may contain multiple independent schedule tables. Never let clubs or group labels leak from one table into another.",
                  "- Major session columns are separate sessions. Never merge adjacent session columns.",
                  "- Preserve parent session columns and nested subcolumns exactly as shown.",
                  "- Blank left-side space does not mean clubs belong to the next session.",
                  "- Later subcolumn rows may continue within the same parent session without reopening earlier sessions.",
                  "- When a session contains subcolumns like LEVEL 6, LEVEL 7, LEVEL 8, PLATINUM, DIAMOND, LEVEL 9, LEVEL 10, SAPPHIRE, keep the umbrella session group in `group` and assign the subcolumn label to each club via `divisionLabel`.",
                  "- Include every visible club row in each session/subcolumn. Do not stop after a few examples.",
                  "- Scan each session column all the way down to the last visible club row before moving to the next session.",
                  "- If the same club appears in two different division subcolumns, include both rows with their respective `divisionLabel`.",
                  "- For `startTime`, use only the session's visible primary time value such as `4:00pm` or `6:45PM`.",
                  "- Use `note` for supporting labels like `Stretch/warmup` when visible.",
                  "- Output sessions in natural code order within the day, like FR1, FR2, FR3, FR4, FR5.",
                  "- If the image shows color-coded club text or an explicit legend, infer the meaning visually and set `teamAwardEligible` accordingly.",
                  "- Do not assume any specific colors unless the image or legend makes the rule explicit.",
                  "- Return explicit legend/category meaning in `awardLegend` only for true visual legends tied to schedule styling.",
                  "- Do not place ceremony rules, team-awards timing, senior-recognition prose, packet headers, or sponsor copy in `awardLegend`.",
                  "- Use `annotations` for schedule-specific rules like team awards or senior recognition when they appear inside the cropped schedule region.",
                  "- Use the auxiliary OCR text only to clarify blurry text. The image layout is the source of truth for session boundaries, times, and club assignment.",
                  auxiliaryText ? "" : "",
                  auxiliaryText ? "Auxiliary OCR text:" : "",
                  auxiliaryText ? auxiliaryText.slice(0, 12000) : "",
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
              {
                type: "image_url",
                image_url: { url: `data:${parsed.mimeType};base64,${parsed.buffer.toString("base64")}` },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    recordDiscoveryUsage(performance, "scheduleVisual", payload?.usage);
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const json = extractJsonObject(raw);
    const normalized = normalizeParseResult({
      ...buildEmptyParseResult(),
      schedule: json,
    });
    return normalized?.schedule || null;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, U>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<U>
): Promise<U[]> {
  if (!items.length) return [];
  const results: U[] = new Array(items.length);
  let cursor = 0;
  const lanes = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  });
  await Promise.all(lanes);
  return results;
}

async function deriveScheduleFromImages(
  images: Array<{ pageNumber: number; dataUrl: string | null }> | undefined,
  pageTexts: Array<{ pageNumber: number; text: string }> | undefined,
  options?: {
    maxPages?: number;
    maxTableCropsPerPage?: number;
    concurrency?: number;
    performance?: DiscoveryPerformance;
  }
): Promise<ScheduleImageDerivationResult> {
  const validImages = pickArray(images)
    .map((image) => ({
      pageNumber: Number(image?.pageNumber) || 0,
      dataUrl: safeString(image?.dataUrl || ""),
    }))
    .filter((image) => image.pageNumber > 0 && image.dataUrl)
    .slice(0, Math.max(1, Number(options?.maxPages) || 2));
  if (!validImages.length) {
    return {
      schedule: {
        venueLabel: null,
        supportEmail: null,
        notes: [],
        colorLegend: [],
        awardLegend: [],
        annotations: [],
        assignments: [],
        days: [],
      },
      tableBlocksDetected: 0,
      tableCropCount: 0,
    };
  }

  const textByPage = new Map(
    pickArray(pageTexts)
      .map((page) => [Number(page?.pageNumber) || 0, safeString(page?.text || "")] as const)
      .filter(([pageNumber, text]) => pageNumber > 0 && text)
  );

  let merged: ParseResult["schedule"] = {
    venueLabel: null,
    supportEmail: null,
    notes: [],
    colorLegend: [],
    awardLegend: [],
    annotations: [],
    assignments: [],
    days: [],
  };
  let tableBlocksDetected = 0;
  let tableCropCount = 0;
  const cropLimit = Math.max(1, Number(options?.maxTableCropsPerPage) || 3);
  const concurrency = Math.max(1, Number(options?.concurrency) || 2);

  for (const image of validImages) {
    const pageText = textByPage.get(image.pageNumber) || "";
    const tableBlocks = detectScheduleTableBlocksFromPageText(
      image.pageNumber,
      pageText
    ).slice(0, cropLimit);
    tableBlocksDetected += tableBlocks.length;

    let parsedBlockCount = 0;
    const croppedBlocks = (
      await Promise.all(
        tableBlocks.map(async (tableBlock) => ({
          tableBlock,
          croppedDataUrl: await cropScheduleImageTableBlock(
            image.dataUrl,
            tableBlock.normalizedBox
          ),
        }))
      )
    ).filter(
      (
        item
      ): item is {
        tableBlock: (typeof tableBlocks)[number];
        croppedDataUrl: string;
      } => Boolean(item.croppedDataUrl)
    );
    tableCropCount += croppedBlocks.length;
    const parsedBlocks = await mapWithConcurrency(
      croppedBlocks,
      concurrency,
      async ({ tableBlock, croppedDataUrl }) => {
        if (options?.performance) {
          options.performance.scheduleVisionCalls += 1;
        }
        const parsed = await openAiExtractVisualSchedulePage(
          croppedDataUrl,
          image.pageNumber,
          tableBlock.text,
          { order: tableBlock.order, total: tableBlocks.length },
          options?.performance
        );
        return { parsed, tableBlock };
      }
    );
    for (const { parsed } of parsedBlocks) {
      if (!parsed || countScheduleDaysWithSessions(parsed) === 0) continue;
      merged = mergeScheduleWithFallback(merged, parsed);
      parsedBlockCount += 1;
    }

    if (parsedBlockCount > 0) continue;
    if (options?.performance) {
      options.performance.scheduleVisionCalls += 1;
    }
    const parsed = await openAiExtractVisualSchedulePage(
      image.dataUrl,
      image.pageNumber,
      pageText,
      undefined,
      options?.performance
    );
    if (!parsed || countScheduleDaysWithSessions(parsed) === 0) continue;
    merged = mergeScheduleWithFallback(merged, parsed);
  }

  return {
    schedule: merged,
    tableBlocksDetected,
    tableCropCount,
  };
}

async function openAiExtractScheduleAwardFlagsFromImage(
  dataUrl: string
): Promise<{ legendNotes: string[]; days: ScheduleAwardFlagDay[] } | null> {
  const parsed = parseDataUrl(dataUrl);
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!parsed || !apiKey) return null;
  const model = resolveOpenAiMiniModel();
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
              "You inspect gymnastics schedule grid images and classify clubs using any visible color-coded legend or styling. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  SCHEDULE_AWARD_FLAGS_SCHEMA,
                  "",
                  "Read the schedule image visually.",
                  "- Identify visible schedule days and session codes.",
                  "- If the image uses color-coded club text or a visible legend to distinguish award categories, infer the meaning and set `teamAwardEligible` accordingly.",
                  "- Do not assume any specific color unless the legend or visible pattern makes the meaning explicit.",
                  "- If the category meaning is unclear, use null.",
                  "- Keep club names as shown in the image when possible.",
                  "- Capture visible legend lines or their plain-language meaning in `legendNotes` when available.",
                  "- Do not invent clubs or sessions that are not visible in the image.",
                ].join("\n"),
              },
              {
                type: "image_url",
                image_url: { url: `data:${parsed.mimeType};base64,${parsed.buffer.toString("base64")}` },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const json = extractJsonObject(raw);
    if (!json || typeof json !== "object") return null;
    return {
      legendNotes: uniqueBy(
        pickArray((json as any)?.legendNotes).map((item) => safeString(item)).filter(Boolean),
        (item) => item
      ),
      days: normalizeScheduleAwardFlagDays((json as any)?.days),
    };
  } catch {
    return null;
  }
}

async function deriveScheduleAwardFlagsFromImages(
  images: Array<{ pageNumber: number; dataUrl: string | null }> | undefined
): Promise<{ notes: string[]; days: ScheduleAwardFlagDay[]; usedImageAwardExtraction: boolean }> {
  const validImages = pickArray(images).filter(
    (item): item is { pageNumber: number; dataUrl: string | null } =>
      Boolean(item && typeof item === "object" && Number(item.pageNumber) > 0)
  );
  if (!validImages.length) {
    return { notes: [], days: [], usedImageAwardExtraction: false };
  }
  const notes: string[] = [];
  const days: ScheduleAwardFlagDay[] = [];
  let usedImageAwardExtraction = false;
  for (const image of validImages) {
    if (!safeString(image.dataUrl)) continue;
    const parsed = await openAiExtractScheduleAwardFlagsFromImage(safeString(image.dataUrl));
    if (!parsed) continue;
    usedImageAwardExtraction = true;
    notes.push(...parsed.legendNotes);
    days.push(...parsed.days);
  }
  return {
    notes: uniqueBy(notes, (item) => item),
    days,
    usedImageAwardExtraction,
  };
}

function mergeScheduleAwardFlags(
  schedule: ParseResult["schedule"],
  awardFlags: ScheduleAwardFlagDay[]
): ParseResult["schedule"] {
  const normalizedSchedule = normalizeStoredSchedule(schedule || {});
  const flagDays = normalizeScheduleAwardFlagDays(awardFlags);
  if (!normalizedSchedule.days.length || !flagDays.length) {
    return toParseScheduleShape(normalizedSchedule);
  }

  const nextDays = normalizedSchedule.days.map((day) => {
    const matchingFlagDay =
      flagDays.find((candidate) => {
        const candidateDate = safeString(candidate.date).toLowerCase();
        return candidateDate && candidateDate === safeString(day.date).toLowerCase();
      }) ||
      flagDays.find((candidate) =>
        candidate.sessions.some((candidateSession) =>
          day.sessions.some(
            (session) =>
              safeString(candidateSession.code).toLowerCase() === safeString(session.code).toLowerCase()
          )
        )
      );
    if (!matchingFlagDay) return day;

    const nextSessions = day.sessions.map((session) => {
      const matchingFlagSession = matchingFlagDay.sessions.find(
        (candidate) =>
          safeString(candidate.code).toLowerCase() === safeString(session.code).toLowerCase()
      );
      if (!matchingFlagSession) return session;
      const nextClubs = session.clubs.map((club) => {
        if (typeof club.teamAwardEligible === "boolean") return club;
        const matchingFlagClub = matchingFlagSession.clubs.find(
          (candidate) =>
            normalizeScheduleClubLookup(candidate.name) === normalizeScheduleClubLookup(club.name)
        );
        if (!matchingFlagClub || typeof matchingFlagClub.teamAwardEligible !== "boolean") {
          return club;
        }
        return {
          ...club,
          teamAwardEligible: matchingFlagClub.teamAwardEligible,
        };
      });
      return {
        ...session,
        clubs: nextClubs,
      };
    });
    return {
      ...day,
      sessions: nextSessions,
    };
  });

  return toParseScheduleShape({
    ...normalizedSchedule,
    days: nextDays,
  });
}

async function callOpenAiScheduleParse(
  text: string,
  traceId?: string,
  performance?: DiscoveryPerformance
): Promise<ParseResult["schedule"] | null> {
  if (!safeString(process.env.OPENAI_API_KEY || "")) return null;
  const sanitizedText = text.replace(/\u0000/g, " ").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const prompt = [
    SCHEDULE_SCHEMA_INSTRUCTIONS,
    "",
    "You extract gymnastics meet session schedules from schedule-grid pages.",
    "- Parse only explicit schedule-grid facts from the source.",
    "- Keep days in source order.",
    "- Use club name text exactly when possible.",
    "- Athlete counts in parentheses should become `athleteCount`.",
    "- If the schedule uses color-coded club text or a visible legend to distinguish award categories, infer the category meaning from the source and set `teamAwardEligible` accordingly.",
    "- If the source makes visual award categories explicit, return `awardLegend` entries describing only the legend meaning.",
    "- Do not assume any specific colors unless the source makes the rule explicit.",
    "- Do not place team-awards timing, senior-recognition prose, packet headers, or pending-schedule notes in `awardLegend`.",
    "- Use `annotations` for schedule rules such as team awards, senior recognition, or pending/finalized schedule notices.",
    "- Use `assignments` only for age-group or birth-date to session mapping tables.",
    "- If a session is split into divisions or level buckets, keep the main combined session label in `group` and use `divisionLabel` per club only when the source clearly associates a club with a sub-division.",
    "- `startTime` should be the visible session start/stretch/warmup time label for the session.",
    "- Do not invent venue, support email, notes, sessions, or clubs.",
    "",
    "Source text:",
    sanitizedText.slice(0, 50000),
  ].join("\n");

  try {
    const client = getOpenAiClient();
    const startedAt = Date.now();
    console.log("[meet-discovery] openai schedule parse request started", {
      traceId: traceId || null,
      promptChars: prompt.length,
      model: resolveDiscoveryParseModel(),
    });
    const completion = await client.chat.completions.create({
      model: resolveDiscoveryParseModel(),
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You extract strict JSON schedule data from gymnastics session grids.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log("[meet-discovery] openai schedule parse request finished", {
      traceId: traceId || null,
      durationMs: Date.now() - startedAt,
      usage: completion.usage || null,
    });
    recordDiscoveryUsage(performance, "scheduleText", completion.usage);
    const raw = safeString(completion.choices?.[0]?.message?.content);
    if (!raw) return null;
    const parsed = extractJsonObject(raw);
    const normalized = normalizeParseResult({
      ...buildEmptyParseResult(),
      schedule: parsed,
    });
    return normalized?.schedule || null;
  } catch {
    console.error("[meet-discovery] openai schedule parse request failed", {
      traceId: traceId || null,
    });
    return null;
  }
}

function deriveScheduleFromTextFallback(
  source: string | Array<{ pageNumber: number; text: string }>
): ParseResult["schedule"] {
  const pages = Array.isArray(source) ? source : selectSchedulePages(source);
  if (pages.length === 0) {
    return {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      colorLegend: [],
      awardLegend: [],
      annotations: [],
      assignments: [],
      days: [],
    };
  }

  const supportEmail =
    pages
      .map((page) => safeString(page.text).match(SCHEDULE_EMAIL_PATTERN)?.[0] || "")
      .find(Boolean) || null;
  const days = pages
    .map((page) => parseScheduleDayFromPage(page))
    .filter((day): day is NonNullable<typeof day> => Boolean(day));

  return {
    venueLabel: null,
    supportEmail,
    notes: [],
    colorLegend: [],
    awardLegend: [],
    annotations: [],
    assignments: [],
    days,
  };
}

function countScheduleDaysWithSessions(value: unknown): number {
  return normalizeStoredSchedule(value).days.filter((day) => day.sessions.length > 0).length;
}

function countDistinctScheduleSessionCodes(value: unknown): number {
  return new Set(
    normalizeStoredSchedule(value).days.flatMap((day) =>
      day.sessions
        .map((session) => safeString(session.code).toUpperCase())
        .filter(Boolean)
    )
  ).size;
}

function countDistinctDetectedScheduleCodes(
  pages: Array<{ pageNumber: number; text: string }>
): number {
  return new Set(
    pages.flatMap((page) =>
      [...safeString(page.text).matchAll(/session\s+([a-z]{1,3}\d{1,2})/gi)]
        .map((match) => safeString(match[1]).toUpperCase())
        .filter(Boolean)
    )
  ).size;
}

function countScheduleSessionsWithAwardFlags(value: unknown): number {
  return normalizeStoredSchedule(value).days.reduce(
    (count, day) =>
      count +
      day.sessions.reduce(
        (sessionCount, session) =>
          sessionCount +
          session.clubs.filter((club) => typeof club.teamAwardEligible === "boolean").length,
        0
      ),
    0
  );
}

function shouldSkipOpenAiScheduleParse(
  fallbackSchedule: ParseResult["schedule"],
  selectedPages: Array<{ pageNumber: number; text: string }>,
  ambiguityNotes: string[]
): boolean {
  if (!selectedPages.length || ambiguityNotes.length > 0) return false;
  const normalizedFallback = normalizeStoredSchedule(fallbackSchedule);
  if (!normalizedFallback.days.length) return false;
  if (normalizedFallback.days.some((day) => day.sessions.length === 0)) return false;
  const detectedSessionCount = countDistinctDetectedScheduleCodes(selectedPages);
  if (detectedSessionCount === 0) return false;
  const fallbackSessionCount = countDistinctScheduleSessionCodes(normalizedFallback);
  return fallbackSessionCount >= Math.ceil(detectedSessionCount * 0.8);
}

function shouldUseVisualScheduleRepair(
  textSchedule: ParseResult["schedule"],
  fallbackSchedule: ParseResult["schedule"],
  selectedPages: Array<{ pageNumber: number; text: string }>
): boolean {
  if (!selectedPages.length) return false;
  const textDayCount = countScheduleDaysWithSessions(textSchedule);
  if (textDayCount === 0) return true;
  const fallbackDayCount = countScheduleDaysWithSessions(fallbackSchedule);
  if (fallbackDayCount > textDayCount) return true;
  const hasEmptySessions = normalizeStoredSchedule(textSchedule).days.some(
    (day) => day.sessions.length === 0
  );
  if (hasEmptySessions) return true;
  const hasAmbiguousTables = selectedPages.some((page) => {
    const blocks = detectScheduleTableBlocksFromPageText(page.pageNumber, page.text);
    return blocks.length > 1;
  });
  return hasAmbiguousTables;
}

function looksLikeMergedScheduleClubName(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  const tokenCount = text.split(/\s+/).filter(Boolean).length;
  const gymWordCount = (text.match(/\b(gym|gymnastics)\b/gi) || []).length;
  return text.length >= 38 || tokenCount >= 4 || gymWordCount >= 2;
}

function toParseScheduleShape(schedule: StoredGymMeetSchedule): ParseResult["schedule"] {
  return {
    venueLabel: schedule.venueLabel || null,
    supportEmail: schedule.supportEmail || null,
    notes: schedule.notes || [],
    colorLegend: schedule.colorLegend.map((entry) => ({
      id: entry.id || null,
      target: entry.target || null,
      colorHex: entry.colorHex || null,
      colorLabel: entry.colorLabel || null,
      meaning: entry.meaning || null,
      sourceText: entry.sourceText || null,
      teamAwardEligible:
        typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
    })),
    awardLegend: schedule.awardLegend.map((entry) => ({
      colorHex: entry.colorHex || null,
      colorLabel: entry.colorLabel || null,
      meaning: entry.meaning || null,
      teamAwardEligible:
        typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
    })),
    annotations: schedule.annotations.map((entry) => ({
      kind: entry.kind || null,
      level: entry.level || null,
      sessionCode: entry.sessionCode || null,
      date: entry.date || null,
      time: entry.time || null,
      text: entry.text,
    })),
    assignments: schedule.assignments.map((entry) => ({
      level: entry.level || null,
      groupLabel: entry.groupLabel || null,
      sessionCode: entry.sessionCode || null,
      birthDateRange: entry.birthDateRange || null,
      divisionLabel: entry.divisionLabel || null,
      note: entry.note || null,
    })),
    days: schedule.days.map((day) => ({
      date: day.date || null,
      shortDate: day.shortDate || null,
      sessions: day.sessions.map((session) => ({
        code: session.code || null,
        group: session.group || null,
        startTime: session.startTime || null,
        warmupTime: session.warmupTime || null,
        note: session.note || null,
        color: session.color
          ? {
              legendId: session.color.legendId || null,
              textColorHex: session.color.textColorHex || null,
              confidence:
                typeof session.color.confidence === "number" ? session.color.confidence : null,
            }
          : null,
        clubs: session.clubs.map((club) => ({
          name: club.name || null,
          teamAwardEligible:
            typeof club.teamAwardEligible === "boolean" ? club.teamAwardEligible : null,
          athleteCount:
            typeof club.athleteCount === "number" && Number.isFinite(club.athleteCount)
              ? club.athleteCount
              : null,
          divisionLabel: club.divisionLabel || null,
          color: club.color
            ? {
                legendId: club.color.legendId || null,
                textColorHex: club.color.textColorHex || null,
                confidence:
                  typeof club.color.confidence === "number" ? club.color.confidence : null,
              }
            : null,
        })),
      })),
    })),
  };
}

function getStoredScheduleClubMergeKey(
  club: Pick<StoredGymMeetScheduleClub, "name" | "divisionLabel" | "athleteCount">
): string {
  return [
    normalizeScheduleClubLookup(club.name),
    normalizeScheduleDivisionLabel(club.divisionLabel),
    typeof club.athleteCount === "number" && Number.isFinite(club.athleteCount)
      ? `${club.athleteCount}`
      : "",
  ].join("|");
}

function getStoredScheduleClubSoftMergeKey(
  club: Pick<StoredGymMeetScheduleClub, "name" | "divisionLabel">
): string {
  return [
    normalizeScheduleClubLookup(club.name),
    normalizeScheduleDivisionLabel(club.divisionLabel),
  ].join("|");
}

function getStoredScheduleClubNameOnlyKey(
  club: Pick<StoredGymMeetScheduleClub, "name">
): string {
  return normalizeScheduleClubLookup(club.name);
}

function mergeStoredScheduleClubs(
  primaryClubs: StoredGymMeetScheduleClub[],
  fallbackClubs: StoredGymMeetScheduleClub[]
): StoredGymMeetScheduleClub[] {
  const merged = [...primaryClubs];
  const indexByKey = new Map<string, number>();
  const softIndexByKey = new Map<string, number>();
  const nameOnlyIndexByKey = new Map<string, number>();
  merged.forEach((club, index) => {
    const exactKey = getStoredScheduleClubMergeKey(club);
    const softKey = getStoredScheduleClubSoftMergeKey(club);
    const nameOnlyKey = getStoredScheduleClubNameOnlyKey(club);
    if (exactKey) indexByKey.set(exactKey, index);
    if (softKey) softIndexByKey.set(softKey, index);
    if (nameOnlyKey) nameOnlyIndexByKey.set(nameOnlyKey, index);
  });

  fallbackClubs.forEach((club) => {
    const exactKey = getStoredScheduleClubMergeKey(club);
    const softKey = getStoredScheduleClubSoftMergeKey(club);
    const nameOnlyKey = getStoredScheduleClubNameOnlyKey(club);
    if (!exactKey && !softKey && !nameOnlyKey) return;
    const exactOrDivisionIndex =
      indexByKey.get(exactKey) ??
      (softKey ? softIndexByKey.get(softKey) : undefined);
    const existingIndex =
      exactOrDivisionIndex ??
      (nameOnlyKey != null
        ? (() => {
            const candidateIndex = nameOnlyIndexByKey.get(nameOnlyKey);
            if (candidateIndex == null) return undefined;
            const candidate = merged[candidateIndex];
            const candidateHasSpecificPlacement =
              Boolean(candidate.divisionLabel) ||
              (typeof candidate.athleteCount === "number" && Number.isFinite(candidate.athleteCount));
            return candidateHasSpecificPlacement ? undefined : candidateIndex;
          })()
        : undefined);
    if (existingIndex == null) {
      merged.push(club);
      if (exactKey) indexByKey.set(exactKey, merged.length - 1);
      if (softKey) softIndexByKey.set(softKey, merged.length - 1);
      if (nameOnlyKey) nameOnlyIndexByKey.set(nameOnlyKey, merged.length - 1);
      return;
    }
    const existingClub = merged[existingIndex];
    const nextClub = {
      ...existingClub,
      name: existingClub.name || club.name,
      teamAwardEligible:
        typeof existingClub.teamAwardEligible === "boolean"
          ? existingClub.teamAwardEligible
          : typeof club.teamAwardEligible === "boolean"
          ? club.teamAwardEligible
          : null,
      athleteCount:
        typeof existingClub.athleteCount === "number" && Number.isFinite(existingClub.athleteCount)
          ? existingClub.athleteCount
          : typeof club.athleteCount === "number" && Number.isFinite(club.athleteCount)
          ? club.athleteCount
          : null,
      divisionLabel: existingClub.divisionLabel || club.divisionLabel || "",
      color:
        existingClub.color ||
        club.color ||
        null,
    };
    merged[existingIndex] = nextClub;
    const nextExactKey = getStoredScheduleClubMergeKey(nextClub);
    const nextSoftKey = getStoredScheduleClubSoftMergeKey(nextClub);
    const nextNameOnlyKey = getStoredScheduleClubNameOnlyKey(nextClub);
    if (nextExactKey) indexByKey.set(nextExactKey, existingIndex);
    if (nextSoftKey) softIndexByKey.set(nextSoftKey, existingIndex);
    if (nextNameOnlyKey) nameOnlyIndexByKey.set(nextNameOnlyKey, existingIndex);
  });

  return merged;
}

function mergeScheduleWithFallback(
  primary: ParseResult["schedule"] | null | undefined,
  fallback: ParseResult["schedule"] | null | undefined
): ParseResult["schedule"] {
  const primarySchedule = normalizeStoredSchedule(primary || {});
  const fallbackSchedule = normalizeStoredSchedule(fallback || {});

  if (!fallbackSchedule.days.length) {
    return toParseScheduleShape(primarySchedule);
  }
  if (!primarySchedule.days.length) {
    return toParseScheduleShape(fallbackSchedule);
  }

  const mergedDays = [...primarySchedule.days];
  const dayIndexByKey = new Map<string, number>();
  mergedDays.forEach((day, index) => {
    const key = getStoredScheduleDayKey(day);
    if (key) dayIndexByKey.set(key, index);
  });

  fallbackSchedule.days.forEach((fallbackDay) => {
    const dayKey = getStoredScheduleDayKey(fallbackDay);
    const matchedByCodeIndex = findStoredScheduleDayMatchIndex(mergedDays, fallbackDay);
    const existingIndex =
      (dayKey ? dayIndexByKey.get(dayKey) : undefined) ??
      (matchedByCodeIndex >= 0 ? matchedByCodeIndex : undefined);
    if (existingIndex == null) {
      mergedDays.push(fallbackDay);
      if (dayKey) dayIndexByKey.set(dayKey, mergedDays.length - 1);
      return;
    }

    const existingDay = mergedDays[existingIndex];
    if (!existingDay.sessions.length && fallbackDay.sessions.length) {
      mergedDays[existingIndex] = {
        ...existingDay,
        date: existingDay.date || fallbackDay.date,
        shortDate: existingDay.shortDate || fallbackDay.shortDate,
        isoDate: existingDay.isoDate || fallbackDay.isoDate,
        sessions: fallbackDay.sessions,
      };
      const mergedDayKey = getStoredScheduleDayKey(mergedDays[existingIndex]);
      if (mergedDayKey) dayIndexByKey.set(mergedDayKey, existingIndex);
      return;
    }

    const sessionKeys = new Map(
      existingDay.sessions
        .map((session, sessionIndex) => [getStoredScheduleSessionKey(session), sessionIndex] as const)
        .filter(([key]) => Boolean(key))
    );
    const mergedSessions = [...existingDay.sessions];
    const missingSessions = fallbackDay.sessions.filter((session) => {
      const key = getStoredScheduleSessionKey(session);
      if (!key) return false;
      const existingSessionIndex = sessionKeys.get(key);
      if (existingSessionIndex == null) {
        return true;
      }
      const existingSession = mergedSessions[existingSessionIndex];
      mergedSessions[existingSessionIndex] = {
        ...existingSession,
        code: existingSession.code || session.code,
        label: existingSession.label || session.label,
        group: existingSession.group || session.group,
        startTime: existingSession.startTime || session.startTime,
        warmupTime: existingSession.warmupTime || session.warmupTime,
        note: existingSession.note || session.note,
        color: existingSession.color || session.color || null,
        clubs: mergeStoredScheduleClubs(existingSession.clubs, session.clubs),
      };
      return false;
    });
    if (missingSessions.length > 0) {
      mergedDays[existingIndex] = {
        ...existingDay,
        date: existingDay.date || fallbackDay.date,
        shortDate: existingDay.shortDate || fallbackDay.shortDate,
        isoDate: existingDay.isoDate || fallbackDay.isoDate,
        sessions: [...mergedSessions, ...missingSessions],
      };
      const mergedDayKey = getStoredScheduleDayKey(mergedDays[existingIndex]);
      if (mergedDayKey) dayIndexByKey.set(mergedDayKey, existingIndex);
      return;
    }
    mergedDays[existingIndex] = {
      ...existingDay,
      date: existingDay.date || fallbackDay.date,
      shortDate: existingDay.shortDate || fallbackDay.shortDate,
      isoDate: existingDay.isoDate || fallbackDay.isoDate,
      sessions: mergedSessions,
    };
    const mergedDayKey = getStoredScheduleDayKey(mergedDays[existingIndex]);
    if (mergedDayKey) dayIndexByKey.set(mergedDayKey, existingIndex);
  });

  return toParseScheduleShape({
    ...primarySchedule,
    venueLabel: primarySchedule.venueLabel || fallbackSchedule.venueLabel,
    supportEmail: primarySchedule.supportEmail || fallbackSchedule.supportEmail,
    notes: uniqueBy([...primarySchedule.notes, ...fallbackSchedule.notes], (item) => item),
    colorLegend: sanitizeScheduleColorLegendEntries([
      ...primarySchedule.colorLegend,
      ...fallbackSchedule.colorLegend,
    ]),
    awardLegend: toStoredScheduleLegendEntries([
      ...primarySchedule.awardLegend,
      ...fallbackSchedule.awardLegend,
      ...deriveAwardLegendFromColorLegend([
        ...primarySchedule.colorLegend,
        ...fallbackSchedule.colorLegend,
      ]),
    ]),
    annotations: toStoredScheduleAnnotations([
      ...primarySchedule.annotations.map((item) => ({
        kind: item.kind || null,
        level: item.level || null,
        sessionCode: item.sessionCode || null,
        date: item.date || null,
        time: item.time || null,
        text: item.text,
      })),
      ...fallbackSchedule.annotations.map((item) => ({
        kind: item.kind || null,
        level: item.level || null,
        sessionCode: item.sessionCode || null,
        date: item.date || null,
        time: item.time || null,
        text: item.text,
      })),
    ]),
    assignments: toStoredScheduleAssignments([
      ...primarySchedule.assignments.map((item) => ({
        level: item.level || null,
        groupLabel: item.groupLabel || null,
        sessionCode: item.sessionCode || null,
        birthDateRange: item.birthDateRange || null,
        divisionLabel: item.divisionLabel || null,
        note: item.note || null,
      })),
      ...fallbackSchedule.assignments.map((item) => ({
        level: item.level || null,
        groupLabel: item.groupLabel || null,
        sessionCode: item.sessionCode || null,
        birthDateRange: item.birthDateRange || null,
        divisionLabel: item.divisionLabel || null,
        note: item.note || null,
      })),
    ]),
    days: mergedDays,
  });
}

function scheduleGroupLooksLeaky(
  primaryGroup: string,
  fallbackGroup: string,
  neighboringFallbackGroups: string[]
): boolean {
  const primaryTokens = extractScheduleDivisionTokens(primaryGroup);
  const fallbackTokens = extractScheduleDivisionTokens(fallbackGroup);
  if (!primaryTokens.length || !fallbackTokens.length) return false;
  const fallbackSet = new Set(fallbackTokens.map((item) => normalizeScheduleDivisionLabel(item)));
  const foreignTokens = primaryTokens.filter(
    (item) => !fallbackSet.has(normalizeScheduleDivisionLabel(item))
  );
  if (foreignTokens.length < 2) return false;
  const neighboringTokenSet = new Set(
    neighboringFallbackGroups.flatMap((group) =>
      extractScheduleDivisionTokens(group).map((item) => normalizeScheduleDivisionLabel(item))
    )
  );
  return foreignTokens.some((item) => neighboringTokenSet.has(normalizeScheduleDivisionLabel(item)));
}

function hasHighConfidenceScheduleTime(value: string): boolean {
  return /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i.test(safeString(value));
}

function finalizeParsedSchedule(
  schedule: ParseResult["schedule"] | null | undefined
): ParseResult["schedule"] {
  const normalized = normalizeStoredSchedule(schedule || {});
  return toParseScheduleShape({
    ...normalized,
    colorLegend: sanitizeScheduleColorLegendEntries(normalized.colorLegend),
    awardLegend: toStoredScheduleLegendEntries([
      ...normalized.awardLegend,
      ...deriveAwardLegendFromColorLegend(normalized.colorLegend),
    ]),
    annotations: toStoredScheduleAnnotations(
      normalized.annotations.map((item) => ({
        kind: item.kind || null,
        level: item.level || null,
        sessionCode: item.sessionCode || null,
        date: item.date || null,
        time: item.time || null,
        text: item.text,
      }))
    ),
    assignments: toStoredScheduleAssignments(
      normalized.assignments.map((item) => ({
        level: item.level || null,
        groupLabel: item.groupLabel || null,
        sessionCode: item.sessionCode || null,
        birthDateRange: item.birthDateRange || null,
        divisionLabel: item.divisionLabel || null,
        note: item.note || null,
      }))
    ),
    days: normalized.days.map((day) => ({
      ...day,
      sessions: day.sessions
        .filter(
          (session) =>
            session.code ||
            session.group ||
            session.startTime ||
            session.warmupTime ||
            session.note ||
            session.clubs.length > 0
        )
        .sort((a, b) => compareScheduleSessionCodes(a.code, b.code)),
    })),
  });
}

function supplementScheduleWithFallback(
  primary: ParseResult["schedule"] | null | undefined,
  fallback: ParseResult["schedule"] | null | undefined
): ScheduleRepairResult {
  const primarySchedule = normalizeStoredSchedule(primary || {});
  const fallbackSchedule = normalizeStoredSchedule(fallback || {});

  if (!fallbackSchedule.days.length) {
    return {
      schedule: finalizeParsedSchedule(primarySchedule),
      tableRepairApplied: false,
      fallbackMetadataApplied: false,
    };
  }
  if (!primarySchedule.days.length) {
    return {
      schedule: finalizeParsedSchedule(fallbackSchedule),
      tableRepairApplied: false,
      fallbackMetadataApplied: true,
    };
  }

  let tableRepairApplied = false;
  let fallbackMetadataApplied = false;

  const mergedDays = [...primarySchedule.days];
  const dayIndexByKey = new Map<string, number>();
  mergedDays.forEach((day, index) => {
    const key = getStoredScheduleDayKey(day);
    if (key) dayIndexByKey.set(key, index);
  });

  fallbackSchedule.days.forEach((fallbackDay) => {
    const dayKey = getStoredScheduleDayKey(fallbackDay);
    const matchedByCodeIndex = findStoredScheduleDayMatchIndex(mergedDays, fallbackDay);
    const existingIndex =
      (dayKey ? dayIndexByKey.get(dayKey) : undefined) ??
      (matchedByCodeIndex >= 0 ? matchedByCodeIndex : undefined);
    if (existingIndex == null) {
      mergedDays.push(fallbackDay);
      if (dayKey) dayIndexByKey.set(dayKey, mergedDays.length - 1);
      return;
    }

    const existingDay = mergedDays[existingIndex];
    if (!existingDay.sessions.length && fallbackDay.sessions.length) {
      mergedDays[existingIndex] = {
        ...existingDay,
        date: existingDay.date || fallbackDay.date,
        shortDate: existingDay.shortDate || fallbackDay.shortDate,
        isoDate: existingDay.isoDate || fallbackDay.isoDate,
        sessions: fallbackDay.sessions,
      };
      const mergedDayKey = getStoredScheduleDayKey(mergedDays[existingIndex]);
      if (mergedDayKey) dayIndexByKey.set(mergedDayKey, existingIndex);
      return;
    }

    const existingCodes = new Set(
      existingDay.sessions
        .map((session) => safeString(session.code).toLowerCase())
        .filter(Boolean)
    );
    const nextSessions = [...existingDay.sessions];
    fallbackDay.sessions.forEach((fallbackSession) => {
      const fallbackCode = safeString(fallbackSession.code).toLowerCase();
      if (!fallbackCode) return;
      const existingSessionIndex = nextSessions.findIndex(
        (session) => safeString(session.code).toLowerCase() === fallbackCode
      );
      if (existingSessionIndex < 0) return;
      const existingSession = nextSessions[existingSessionIndex];
      const safeFallbackClubs = fallbackSession.clubs.filter(
        (club) => !looksLikeMergedScheduleClubName(club.name)
      );
      const neighboringFallbackGroups = fallbackDay.sessions
        .filter((candidate) => safeString(candidate.code) !== safeString(fallbackSession.code))
        .map((candidate) => candidate.group);
      const shouldUseFallbackGroup =
        Boolean(fallbackSession.group) &&
        (!existingSession.group ||
          scheduleGroupLooksLeaky(
            existingSession.group,
            fallbackSession.group,
            neighboringFallbackGroups
          ));
      const shouldUseFallbackStartTime =
        Boolean(fallbackSession.startTime) && !hasHighConfidenceScheduleTime(existingSession.startTime);
      const mergedClubs =
        existingSession.clubs.length > 0 && safeFallbackClubs.length > 0
          ? mergeStoredScheduleClubs(existingSession.clubs, safeFallbackClubs)
          : existingSession.clubs.length > 0
          ? existingSession.clubs
          : safeFallbackClubs;
      if (shouldUseFallbackGroup || shouldUseFallbackStartTime) {
        fallbackMetadataApplied = true;
      }
      if (existingSession.clubs.length === 0 && safeFallbackClubs.length > 0) {
        fallbackMetadataApplied = true;
      }
      if (
        scheduleGroupLooksLeaky(existingSession.group, fallbackSession.group, neighboringFallbackGroups) ||
        (existingSession.clubs.length === 0 && safeFallbackClubs.length > 0)
      ) {
        tableRepairApplied = true;
      }
      nextSessions[existingSessionIndex] = {
        ...existingSession,
        group: shouldUseFallbackGroup ? fallbackSession.group : existingSession.group,
        startTime: shouldUseFallbackStartTime ? fallbackSession.startTime : existingSession.startTime,
        warmupTime: existingSession.warmupTime || fallbackSession.warmupTime,
        note: existingSession.note || fallbackSession.note,
        color: existingSession.color || fallbackSession.color || null,
        clubs: mergedClubs,
      };
    });
    const additionalSessions = fallbackDay.sessions.filter((session) => {
      const code = safeString(session.code).toLowerCase();
      return code ? !existingCodes.has(code) : false;
    });
    if (additionalSessions.length > 0) {
      fallbackMetadataApplied = true;
      mergedDays[existingIndex] = {
        ...existingDay,
        date: existingDay.date || fallbackDay.date,
        shortDate: existingDay.shortDate || fallbackDay.shortDate,
        isoDate: existingDay.isoDate || fallbackDay.isoDate,
        sessions: [...nextSessions, ...additionalSessions].sort((a, b) =>
          compareScheduleSessionCodes(a.code, b.code)
        ),
      };
      const mergedDayKey = getStoredScheduleDayKey(mergedDays[existingIndex]);
      if (mergedDayKey) dayIndexByKey.set(mergedDayKey, existingIndex);
    } else {
      mergedDays[existingIndex] = {
        ...existingDay,
        date: existingDay.date || fallbackDay.date,
        shortDate: existingDay.shortDate || fallbackDay.shortDate,
        isoDate: existingDay.isoDate || fallbackDay.isoDate,
        sessions: nextSessions.sort((a, b) => compareScheduleSessionCodes(a.code, b.code)),
      };
      const mergedDayKey = getStoredScheduleDayKey(mergedDays[existingIndex]);
      if (mergedDayKey) dayIndexByKey.set(mergedDayKey, existingIndex);
    }
  });

  return {
    schedule: finalizeParsedSchedule({
      ...primarySchedule,
      venueLabel: primarySchedule.venueLabel || fallbackSchedule.venueLabel,
      supportEmail: primarySchedule.supportEmail || fallbackSchedule.supportEmail,
      notes: uniqueBy([...primarySchedule.notes, ...fallbackSchedule.notes], (item) => item),
      colorLegend: sanitizeScheduleColorLegendEntries([
        ...primarySchedule.colorLegend,
        ...fallbackSchedule.colorLegend,
      ]),
      awardLegend: toStoredScheduleLegendEntries([
        ...primarySchedule.awardLegend,
        ...fallbackSchedule.awardLegend,
        ...deriveAwardLegendFromColorLegend([
          ...primarySchedule.colorLegend,
          ...fallbackSchedule.colorLegend,
        ]),
      ]),
      annotations: toStoredScheduleAnnotations([
        ...primarySchedule.annotations.map((item) => ({
          kind: item.kind || null,
          level: item.level || null,
          sessionCode: item.sessionCode || null,
          date: item.date || null,
          time: item.time || null,
          text: item.text,
        })),
        ...fallbackSchedule.annotations.map((item) => ({
          kind: item.kind || null,
          level: item.level || null,
          sessionCode: item.sessionCode || null,
          date: item.date || null,
          time: item.time || null,
          text: item.text,
        })),
      ]),
      assignments: toStoredScheduleAssignments([
        ...primarySchedule.assignments.map((item) => ({
          level: item.level || null,
          groupLabel: item.groupLabel || null,
          sessionCode: item.sessionCode || null,
          birthDateRange: item.birthDateRange || null,
          divisionLabel: item.divisionLabel || null,
          note: item.note || null,
        })),
        ...fallbackSchedule.assignments.map((item) => ({
          level: item.level || null,
          groupLabel: item.groupLabel || null,
          sessionCode: item.sessionCode || null,
          birthDateRange: item.birthDateRange || null,
          divisionLabel: item.divisionLabel || null,
          note: item.note || null,
        })),
      ]),
      days: mergedDays,
    }),
    tableRepairApplied,
    fallbackMetadataApplied,
  };
}

async function deriveScheduleFromExtractedText(
  extractedText: string,
  extractionMeta?: ExtractionResult["extractionMeta"],
  options?: {
    traceId?: string;
    mode?: DiscoveryMode;
    performance?: DiscoveryPerformance;
  }
): Promise<{
  schedule: ParseResult["schedule"];
  diagnostics: NonNullable<ExtractionResult["extractionMeta"]["scheduleDiagnostics"]>;
}> {
  const traceId = options?.traceId;
  const mode = options?.mode || "core";
  const pages =
    pickArray(extractionMeta?.schedulePageTexts)
      .map((page) => ({
        pageNumber: Number(page?.pageNumber) || 0,
        text: safeString(page?.text || ""),
      }))
      .filter((page) => page.pageNumber > 0 && page.text) || [];
  const candidatePages = pages.length > 0 ? pages : splitExtractedSchedulePages(extractedText);
  const selectedSegments = selectScheduleSegments(candidatePages);
  const selectedPages = selectedSegments.map((segment) => ({
    pageNumber: segment.pageNumber,
    text: segment.text,
  }));
  const rejectedSegments = candidatePages
    .filter((page) => !selectedSegments.some((segment) => segment.pageNumber === page.pageNumber))
    .map((page) => ({
      pageNumber: page.pageNumber,
      reason: classifySchedulePageText(page.text).reason,
    }));
  const extractedDateLines = uniqueBy(
    [
      ...extractScheduleDateLines(extractedText),
      ...selectedPages.flatMap((page) => extractScheduleDateLines(page.text)),
    ],
    (line) => line
  );
  if (selectedSegments.length === 0) {
    return {
      schedule: {
        venueLabel: null,
        supportEmail: null,
        notes: [],
        colorLegend: [],
        awardLegend: [],
        annotations: [],
        assignments: [],
        days: [],
      },
      diagnostics: {
        selectedSchedulePages: [],
        selectedScheduleSegments: [],
        rejectedScheduleSegments: rejectedSegments,
        ambiguityNotes: [],
        extractedDateLines,
        parsedFromTextDayCount: 0,
        parsedFromImageDayCount: 0,
        finalDayCount: 0,
        usedImageTableExtraction: false,
        usedTextFallback: false,
        usedImageAwardExtraction: false,
        staleStoredScheduleDetected: false,
      },
    };
  }
  const fallbackYear = deriveScheduleContextYear(extractedText);
  const gridPages = selectedSegments
    .filter((segment) => segment.kind === "grid")
    .map((segment) => ({ pageNumber: segment.pageNumber, text: segment.text }));
  const narrativePages = selectedSegments
    .filter((segment) => segment.kind === "narrative")
    .map((segment) => ({ pageNumber: segment.pageNumber, text: segment.text }));
  const assignmentPages = selectedSegments
    .filter((segment) => segment.kind === "assignment")
    .map((segment) => ({ pageNumber: segment.pageNumber, text: segment.text }));
  const ambiguityNotes = uniqueBy(
    [
      ...selectedSegments
        .filter((segment) => segment.kind === "narrative" && segment.reason === "generic_schedule_signals")
        .map((segment) => `Page ${segment.pageNumber} classified as narrative from generic schedule signals.`),
      ...selectedSegments
        .filter((segment) => segment.kind === "assignment" && countScheduleSessionCodes(segment.text) < 2)
        .map((segment) => `Page ${segment.pageNumber} contains assignment rows with sparse session coverage.`),
    ],
    (item) => item
  );
  const scheduleText = gridPages
    .map((page) => `-- ${page.pageNumber} --\n${page.text}`)
    .join("\n\n");
  console.log("[meet-discovery] derive schedule selected pages", {
    traceId: traceId || null,
    selectedSchedulePageCount: selectedSegments.length,
    pageNumbers: selectedSegments.map((page) => page.pageNumber),
    segmentKinds: selectedSegments.map((segment) => `${segment.pageNumber}:${segment.kind}`),
  });
  const gridFallback = deriveScheduleFromTextFallback(gridPages);
  const shouldSkipScheduleTextLlm = shouldSkipOpenAiScheduleParse(
    gridFallback,
    gridPages,
    ambiguityNotes
  );
  if (shouldSkipScheduleTextLlm) {
    console.log("[meet-discovery] schedule text parse skipped", {
      traceId: traceId || null,
      detectedSessionCount: countDistinctDetectedScheduleCodes(gridPages),
      fallbackSessionCount: countDistinctScheduleSessionCodes(gridFallback),
    });
  }
  let parsed: ParseResult["schedule"] | null = null;
  if (scheduleText && !shouldSkipScheduleTextLlm) {
    const scheduleTextStartedAt = Date.now();
    parsed = await callOpenAiScheduleParse(scheduleText, traceId, options?.performance);
    if (options?.performance) {
      options.performance.scheduleTextParseMs += Date.now() - scheduleTextStartedAt;
    }
  }
  const gridTextSchedule =
    countScheduleDaysWithSessions(gridFallback) > 0
      ? mergeScheduleWithFallback(
          gridFallback,
          parsed && countScheduleDaysWithSessions(parsed) > 0 ? parsed : null
        )
      : parsed && countScheduleDaysWithSessions(parsed) > 0
      ? parsed
      : gridFallback;
  const narrativeSchedule = narrativePages.reduce<ParseResult["schedule"]>(
    (acc, page) => mergeScheduleWithFallback(acc, parseNarrativeScheduleSessionsFromPage(page, fallbackYear)),
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      colorLegend: [],
      awardLegend: [],
      annotations: [],
      assignments: [],
      days: [],
    }
  );
  const annotations = parseScheduleAnnotationsFromPages(
    selectedSegments
      .filter((segment) => segment.kind !== "assignment")
      .map((segment) => ({ pageNumber: segment.pageNumber, text: segment.text })),
    fallbackYear
  );
  const assignments = parseScheduleAssignmentsFromPages(assignmentPages);
  const textSchedule = mergeScheduleWithFallback(gridTextSchedule, narrativeSchedule);
  const textScheduleWithSegments: ParseResult["schedule"] = {
    ...textSchedule,
    annotations,
    assignments,
    colorLegend: pickArray(textSchedule.colorLegend as any),
    awardLegend: sanitizeScheduleLegendEntries([
      ...pickArray(textSchedule.awardLegend as any),
    ]),
  };
  const gridPageNumbers = new Set(gridPages.map((page) => page.pageNumber));
  const scheduleImagesForSelectedPages = pickArray(extractionMeta?.schedulePageImages).filter((item) =>
    gridPageNumbers.has(Number(item?.pageNumber) || 0)
  );
  const scheduleTextsForSelectedPages = pickArray(extractionMeta?.schedulePageTexts).filter((item) =>
    gridPageNumbers.has(Number(item?.pageNumber) || 0)
  );
  if (
    mode !== "enrich" ||
    !gridPages.length ||
    !shouldUseVisualScheduleRepair(gridTextSchedule, gridFallback, gridPages)
  ) {
    const baseSchedule = finalizeParsedSchedule({
      ...textScheduleWithSegments,
      notes: uniqueBy(
        pickArray(textScheduleWithSegments.notes)
          .map((item) => safeString(item))
          .filter(Boolean),
        (item) => item
      ),
    });
    const finalSchedule =
      scheduleImagesForSelectedPages.length > 0
        ? await applyScheduleColorsFromImages(
            baseSchedule,
            scheduleImagesForSelectedPages,
            scheduleTextsForSelectedPages,
            options?.performance
          )
        : baseSchedule;
    return {
      schedule: finalSchedule,
      diagnostics: {
        selectedSchedulePages: selectedSegments.map((segment) => segment.pageNumber),
        selectedScheduleSegments: selectedSegments.map((segment) => ({
          pageNumber: segment.pageNumber,
          kind: segment.kind,
          reason: segment.reason,
        })),
        rejectedScheduleSegments: rejectedSegments,
        ambiguityNotes,
        extractedDateLines,
        parsedFromTextDayCount: countScheduleDaysWithSessions(textScheduleWithSegments),
        parsedFromImageDayCount: 0,
        finalDayCount: countScheduleDaysWithSessions(finalSchedule),
        usedImageTableExtraction: false,
        usedTextFallback:
          countScheduleDaysWithSessions(gridFallback) > 0 &&
          countScheduleDaysWithSessions(gridTextSchedule) <= countScheduleDaysWithSessions(gridFallback),
        usedImageAwardExtraction: false,
        staleStoredScheduleDetected: false,
      },
    };
  }
  const visualScheduleResult = await deriveScheduleFromImages(
    scheduleImagesForSelectedPages,
    scheduleTextsForSelectedPages,
    {
      maxPages: 2,
      maxTableCropsPerPage: 3,
      concurrency: 2,
      performance: options?.performance,
    }
  );
  const repairedSchedule =
    countScheduleDaysWithSessions(visualScheduleResult.schedule) > 0
      ? supplementScheduleWithFallback(visualScheduleResult.schedule, gridFallback)
      : null;
  const repairedGridSchedule = repairedSchedule ? repairedSchedule.schedule : gridTextSchedule;
  const mergedSchedule = mergeScheduleWithFallback(repairedGridSchedule, narrativeSchedule);
  const baseFinalSchedule = finalizeParsedSchedule({
    ...mergedSchedule,
    annotations,
    assignments,
    notes: uniqueBy(
      [
        ...pickArray(mergedSchedule.notes).map((item) => safeString(item)).filter(Boolean),
      ],
      (item) => item
    ),
  });
  const finalSchedule =
    scheduleImagesForSelectedPages.length > 0
      ? await applyScheduleColorsFromImages(
          baseFinalSchedule,
          scheduleImagesForSelectedPages,
          scheduleTextsForSelectedPages,
          options?.performance
        )
      : baseFinalSchedule;
  const usedImageTableExtraction = countScheduleDaysWithSessions(visualScheduleResult.schedule) > 0;
  const usedImageAwardExtraction = countScheduleSessionsWithAwardFlags(visualScheduleResult.schedule) > 0;
  return {
    schedule: finalSchedule,
    diagnostics: {
      selectedSchedulePages: selectedSegments.map((segment) => segment.pageNumber),
      selectedScheduleSegments: selectedSegments.map((segment) => ({
        pageNumber: segment.pageNumber,
        kind: segment.kind,
        reason: segment.reason,
      })),
      rejectedScheduleSegments: rejectedSegments,
      ambiguityNotes,
      extractedDateLines,
      parsedFromTextDayCount: countScheduleDaysWithSessions(textScheduleWithSegments),
      parsedFromImageDayCount: countScheduleDaysWithSessions(visualScheduleResult.schedule),
      finalDayCount: countScheduleDaysWithSessions(finalSchedule),
      usedImageTableExtraction,
      usedTextFallback:
        countScheduleDaysWithSessions(gridFallback) > 0 &&
        (!usedImageTableExtraction ||
          countScheduleDaysWithSessions(visualScheduleResult.schedule) < countScheduleDaysWithSessions(gridFallback) ||
          countScheduleDaysWithSessions(textScheduleWithSegments) >
            countScheduleDaysWithSessions(visualScheduleResult.schedule)),
      usedImageAwardExtraction,
      staleStoredScheduleDetected: false,
      tableBlocksDetected: visualScheduleResult.tableBlocksDetected,
      tableCropCount: visualScheduleResult.tableCropCount,
      tableRepairApplied: repairedSchedule?.tableRepairApplied || false,
      fallbackMetadataApplied: repairedSchedule?.fallbackMetadataApplied || false,
    },
  };
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
      resultsInfo: null,
      rotationSheetsInfo: null,
      awardsInfo: null,
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
      parkingPricingLinks: [],
    },
    policies: {
      food: null,
      hydration: null,
      safety: null,
      animals: null,
      misc: [],
    },
    coachInfo: {
      signIn: null,
      attire: null,
      hospitality: null,
      floorAccess: null,
      scratches: null,
      floorMusic: null,
      rotationSheets: null,
      awards: null,
      regionalCommitment: null,
      qualification: null,
      meetFormat: null,
      equipment: null,
      refundPolicy: null,
      paymentInstructions: null,
      entryFees: [],
      teamFees: [],
      lateFees: [],
      contacts: [],
      deadlines: [],
      links: [],
      notes: [],
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
    schedule: {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      colorLegend: [],
      awardLegend: [],
      annotations: [],
      assignments: [],
      days: [],
    },
    links: [],
    unmappedFacts: [],
  };
}

async function callOpenAiParse(
  text: string,
  evidence: DiscoveryEvidence,
  traceId?: string,
  performance?: DiscoveryPerformance
): Promise<{ result: ParseResult | null; raw: string; usage: any }> {
  const client = getOpenAiClient();
  const sanitizedText = text.replace(/\u0000/g, " ").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const prompt = buildProfessionalParsePrompt(evidence, sanitizedText);
  const startedAt = Date.now();
  console.log("[meet-discovery] openai parse request started", {
    traceId: traceId || null,
    model: resolveDiscoveryParseModel(),
    promptChars: prompt.length,
  });
  const completion = await client.chat.completions.create({
    model: resolveDiscoveryParseModel(),
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: GYMNASTICS_PARSE_JSON_SCHEMA,
    } as any,
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
  console.log("[meet-discovery] openai parse request finished", {
    traceId: traceId || null,
    durationMs: Date.now() - startedAt,
    usage: completion.usage || null,
  });
  recordDiscoveryUsage(performance, "parse", completion.usage);
  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw, usage: completion.usage || null };
}

async function callGeminiParse(
  text: string,
  evidence: DiscoveryEvidence,
  traceId?: string
): Promise<{ result: ParseResult | null; raw: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  if (!apiKey) throw new Error("Gemini API key is not configured");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    process.env.GEMINI_MODEL || "gemini-1.5-flash"
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const startedAt = Date.now();
  console.log("[meet-discovery] gemini parse request started", {
    traceId: traceId || null,
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  });
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
  console.log("[meet-discovery] gemini parse request finished", {
    traceId: traceId || null,
    durationMs: Date.now() - startedAt,
  });
  const raw = safeString(json?.candidates?.[0]?.content?.parts?.[0]?.text);
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw };
}

export async function finalizeMeetParseResult(
  value: ParseResult,
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"],
  options?: {
    traceId?: string;
    mode?: DiscoveryMode;
    performance?: DiscoveryPerformance;
  }
): Promise<ParseResult> {
  const traceId = options?.traceId || null;
  const finalizeStartedAt = Date.now();
  console.log("[meet-discovery] finalize parse result started", {
    traceId,
    mode: options?.mode || "core",
  });
  const sanitized = sanitizeDiscoveryParseResult(value);
  const withCoachRouting = routeCoachDeadlines(mergeCoachFeesFromAdmission(sanitized));
  const reconciled = reconcileParsedDates(withCoachRouting, extractedText);
  const scheduleStartedAt = Date.now();
  console.log("[meet-discovery] schedule derivation started", {
    traceId,
    mode: options?.mode || "core",
  });
  const derivedSchedule = await deriveScheduleFromExtractedText(
    extractedText,
    extractionMeta,
    {
      traceId: options?.traceId,
      mode: options?.mode,
      performance: options?.performance,
    }
  );
  console.log("[meet-discovery] schedule derivation finished", {
    traceId,
    durationMs: Date.now() - scheduleStartedAt,
    dayCount: derivedSchedule.schedule.days.length,
    diagnostics: derivedSchedule.diagnostics || null,
  });
  extractionMeta.scheduleDiagnostics = derivedSchedule.diagnostics;
  const finalized = {
    ...reconciled,
    schedule:
      derivedSchedule.schedule.days.length > 0
        ? derivedSchedule.schedule
        : reconciled.schedule || buildEmptyParseResult().schedule,
  };
  console.log("[meet-discovery] finalize parse result finished", {
    traceId,
    durationMs: Date.now() - finalizeStartedAt,
  });
  return finalized;
}

export async function parseMeetFromExtractedText(
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"],
  options?: {
    traceId?: string;
    mode?: DiscoveryMode;
    performance?: DiscoveryPerformance;
  }
): Promise<{
  parseResult: ParseResult;
  modelUsed: "openai" | "gemini" | "quality-gate";
  rawModelOutput: string;
  evidence: DiscoveryEvidence;
}> {
  const traceId = options?.traceId || null;
  console.log("[meet-discovery] parseMeetFromExtractedText started", {
    traceId,
    extractedChars: extractedText.length,
    textQuality: extractionMeta.textQuality || null,
  });
  const evidence = buildDiscoveryEvidence(extractedText, extractionMeta);
  if (extractionMeta.textQuality === "poor") {
    console.log("[meet-discovery] quality gate triggered", {
      traceId,
    });
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
    const modelStartedAt = Date.now();
    const first = await callOpenAiParse(
      extractedText,
      evidence,
      options?.traceId,
      options?.performance
    );
    if (options?.performance) {
      options.performance.modelParseMs += Date.now() - modelStartedAt;
    }
    openAiRaw = first.raw;
    console.log("[meet-discovery] openai parse parsed", {
      traceId,
      hasResult: Boolean(first.result),
      rawChars: first.raw.length,
    });
    if (first.result) {
      return {
        parseResult: await finalizeMeetParseResult(
          first.result,
          extractedText,
          extractionMeta,
          {
            traceId: options?.traceId,
            mode: options?.mode,
            performance: options?.performance,
          }
        ),
        modelUsed: "openai",
        rawModelOutput: first.raw,
        evidence,
      };
    }
    openAiErrorMessage = "OpenAI returned invalid structured output.";
  } catch (err: any) {
    console.error("[meet-discovery] openai parse failed", {
      traceId,
      message: err?.message || String(err),
    });
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
  console.log("[meet-discovery] falling back to gemini", {
    traceId,
    reason: openAiErrorMessage || "openai_invalid_json",
  });
  const geminiStartedAt = Date.now();
  const gemini = await callGeminiParse(extractedText, evidence, options?.traceId);
  if (options?.performance) {
    options.performance.modelParseMs += Date.now() - geminiStartedAt;
  }
  if (!gemini.result) {
    throw new Error("Gemini returned invalid JSON");
  }
  return {
    parseResult: await finalizeMeetParseResult(
      gemini.result,
      extractedText,
      extractionMeta,
      {
        traceId: options?.traceId,
        mode: options?.mode,
        performance: options?.performance,
      }
    ),
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
  parseResult = sanitizeDiscoveryParseResult(parseResult);
  const resolvedPageTemplateId =
    resolveGymMeetTemplateId(baseData) || DEFAULT_GYM_MEET_TEMPLATE_ID;
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
  const assignedGym = safeString(
    parseResult.athlete.assignedGym || existingAdvanced.meet?.assignedGym || ""
  );
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
    safeString(parseResult.meetDetails.resultsInfo),
    safeString(parseResult.meetDetails.rotationSheetsInfo),
    safeString(parseResult.meetDetails.awardsInfo),
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
    ...parseResult.logistics.parkingPricingLinks.map((item, idx) => ({
      id: `parking-pricing-link-${idx + 1}`,
      name: item.label || `Parking Pricing ${idx + 1}`,
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
  const assistantCoachRolePattern = /\bassistant coach\b/i;
  const publicMeetContacts = uniqueBy(
    [
      ...pickArray(existingAdvanced.meet?.staffContacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "public"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Meet staff"))
      .filter(
        (
          item
        ): item is { role: string; name: string | null; email: string | null; phone: string | null } =>
          Boolean(item)
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
  );
  const venueContacts = uniqueBy(
    [
      ...pickArray(existingAdvanced.logistics?.venueContacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "venue"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Venue contact"))
      .filter(
        (
          item
        ): item is { role: string; name: string | null; email: string | null; phone: string | null } =>
          Boolean(item)
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
  );
  const venueContactNotes = uniqueLines(
    [
      ...pickArray(existingAdvanced.logistics?.venueContactNotes),
      ...parseResult.unmappedFacts
        .filter((fact) => !shouldSuppressUnmappedFact(fact))
        .filter((fact) => /\bvenue_contact\b/i.test(safeString(fact.category)))
        .map((fact) => safeString(fact.detail)),
    ],
    6
  );
  const coachContacts = uniqueBy(
    [
      ...pickArray(parseResult.coachInfo?.contacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "coach"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Coach contact"))
      .filter(
        (
          item
        ): item is { role: string; name: string | null; email: string | null; phone: string | null } =>
          Boolean(item)
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
  );
  const primaryCoachContact =
    coachContacts.find((item) => /\bhead coach\b/i.test(item.role)) ||
    coachContacts.find((item) => /\bcoach\b/i.test(item.role) && !assistantCoachRolePattern.test(item.role)) ||
    coachContacts[0] ||
    null;
  const assistantCoachContact =
    coachContacts.find((item) => assistantCoachRolePattern.test(item.role)) || null;
  const derivedCoachName = safeString(primaryCoachContact?.name);
  const derivedAssistantCoachName = safeString(assistantCoachContact?.name);
  const derivedCoachPhone = safeString(primaryCoachContact?.phone);
  const derivedScheduleSupportEmail =
    safeString(existingAdvanced.schedule?.supportEmail) ||
    safeString(parseResult.schedule?.supportEmail) ||
    safeString(
      publicMeetContacts.find((item) => item.email)?.email ||
        coachContacts.find((item) => item.email)?.email ||
        venueContacts.find((item) => item.email)?.email ||
        ""
    );
  const derivedScheduleVenueLabel =
    safeString(existingAdvanced.schedule?.venueLabel) ||
    safeString(parseResult.schedule?.venueLabel) ||
    safeString(parseResult.venue) ||
    safeString(baseData?.venue) ||
    safeString(baseData?.address);
  const parsedSchedule = normalizeStoredSchedule(parseResult.schedule || {}, {
    venueLabel: derivedScheduleVenueLabel,
    supportEmail: derivedScheduleSupportEmail,
  });
  const existingSchedule = normalizeStoredSchedule(existingAdvanced.schedule || {}, {
    venueLabel: derivedScheduleVenueLabel,
    supportEmail: derivedScheduleSupportEmail,
  });
  const staleStoredSchedule = isStaleDerivedSchedule(
    existingAdvanced.schedule || {},
    safeString(baseData?.discoverySource?.extractedText || "")
  );
  if (extractionMeta?.scheduleDiagnostics) {
    extractionMeta.scheduleDiagnostics.staleStoredScheduleDetected = staleStoredSchedule;
  }
  const resolvedSchedule =
    hasStoredScheduleContent(existingSchedule) && !staleStoredSchedule
      ? existingSchedule
      : parsedSchedule;
  const coachSectionEnabled = hasCoachInfoContent(parseResult.coachInfo);
  const coachLinks = uniqueBy(
    [...parseResult.coachInfo.links, ...parseResult.links]
      .map((item) => ({
        label: safeString(item?.label) || "Coach link",
        url: normalizeUrl(item?.url),
      }))
      .filter(
        (item) =>
          item.url &&
          /(coach|entry|payment|refund|qualification|regional|rotation|meet maker|reservation|score|result)/i.test(
            `${item.label} ${item.url}`
          )
      ),
    (item) => item.url
  );
  const coachNotes = uniqueBy(
    parseResult.coachInfo.notes.map((item) => safeString(item)).filter(Boolean),
    (item) => item
  );
  const coachDeadlines = uniqueBy(
    parseResult.coachInfo.deadlines.map((item) => ({
      label: safeString(item.label) || "Coach deadline",
      date: safeString(item.date) || "",
      note: safeString(item.note) || "",
    })),
    (item) => `${item.label}|${item.date}|${item.note}`
  );

  const existingAnnouncementEntries: Array<{ title: string; body: string }> = pickArray(
    existingAdvanced.announcements?.announcements
  )
    .map((item) => ({
      title: "",
      body: safeString(item?.text || item?.body || item?.title),
    }))
    .filter((item) => item.body);
  const parsedAnnouncementEntries = pickArray(parseResult.communications?.announcements)
    .filter((item) => shouldPersistParsedAnnouncement(item))
    .map((item) => ({
      title: safeString(item?.title || item?.label),
      body: safeString(item?.body || item?.text || item?.message),
    }))
    .filter((item) => item.body);
  const mergedAnnouncements = uniqueBy(
    [
      ...parsedAnnouncementEntries,
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
      resultsInfo: parseResult.meetDetails.resultsInfo || "",
      rotationSheetsInfo: parseResult.meetDetails.rotationSheetsInfo || "",
      awardsInfo: parseResult.meetDetails.awardsInfo || "",
      sessionWindows: parseResult.meetDetails.sessionWindows || [],
      operationalNotes,
      staffContacts: publicMeetContacts.map((item, idx) => ({
        id: `meet-staff-${idx + 1}`,
        role: item.role,
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
      })),
    },
    logistics: {
      ...(existingAdvanced.logistics || {}),
      enabled: existingAdvanced.logistics?.enabled ?? false,
      hotelName: parseResult.logistics.hotel || "",
      mealPlan: parseResult.logistics.meals || "",
      feeAmount: parseResult.logistics.fees || "",
      additionalDocuments,
      parking: parseResult.logistics.parking || "",
      trafficAlerts: parseResult.logistics.trafficAlerts || "",
      rideShare: parseResult.logistics.rideShare || "",
      accessibility: parseResult.logistics.accessibility || "",
      parkingLinks: parseResult.logistics.parkingLinks || [],
      parkingPricingLinks: parseResult.logistics.parkingPricingLinks || [],
      policyFood: parseResult.policies.food || "",
      policyHydration: parseResult.policies.hydration || "",
      policySafety: parseResult.policies.safety || "",
      policyAnimals: parseResult.policies.animals || "",
      gymLayoutImage: resolvedGymLayoutImage,
      gymLayoutLabel: resolvedGymLayoutLabel,
      venueContacts: venueContacts.map((item, idx) => ({
        id: `venue-contact-${idx + 1}`,
        role: item.role,
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
      })),
      venueContactNotes,
    },
    coaches: {
      ...(existingAdvanced.coaches || {}),
      enabled: coachSectionEnabled,
      signIn: parseResult.coachInfo.signIn || "",
      attire: parseResult.coachInfo.attire || "",
      hospitality: parseResult.coachInfo.hospitality || "",
      floorAccess: parseResult.coachInfo.floorAccess || "",
      scratches: parseResult.coachInfo.scratches || "",
      floorMusic: parseResult.coachInfo.floorMusic || "",
      rotationSheets: parseResult.coachInfo.rotationSheets || "",
      awards: parseResult.coachInfo.awards || "",
      regionalCommitment: parseResult.coachInfo.regionalCommitment || "",
      qualification: parseResult.coachInfo.qualification || "",
      meetFormat: parseResult.coachInfo.meetFormat || "",
      equipment: parseResult.coachInfo.equipment || "",
      refundPolicy: parseResult.coachInfo.refundPolicy || "",
      paymentInstructions: parseResult.coachInfo.paymentInstructions || "",
      entryFees: parseResult.coachInfo.entryFees.map((item, idx) => ({
        id: `entry-fee-${idx + 1}`,
        label: item.label,
        amount: item.amount,
        note: item.note || "",
      })),
      teamFees: parseResult.coachInfo.teamFees.map((item, idx) => ({
        id: `team-fee-${idx + 1}`,
        label: item.label,
        amount: item.amount,
        note: item.note || "",
      })),
      lateFees: parseResult.coachInfo.lateFees.map((item, idx) => ({
        id: `late-fee-${idx + 1}`,
        label: item.label,
        amount: item.amount,
        trigger: item.trigger || "",
        note: item.note || "",
      })),
      deadlines: coachDeadlines.map((item, idx) => ({
        id: `coach-deadline-${idx + 1}`,
        label: item.label,
        date: item.date,
        note: item.note,
      })),
      contacts: coachContacts.map((item, idx) => ({
        id: `coach-contact-${idx + 1}`,
        role: item.role,
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
      })),
      links: coachLinks.map((item, idx) => ({
        id: `coach-link-${idx + 1}`,
        label: item.label,
        url: item.url,
      })),
      notes: coachNotes,
    },
    schedule: {
      ...(existingAdvanced.schedule || {}),
      ...resolvedSchedule,
    },
    gear: {
      ...(existingAdvanced.gear || {}),
      enabled: existingAdvanced.gear?.enabled ?? false,
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
      enabled: existingAdvanced.volunteers?.enabled ?? false,
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
    details: safeString(baseData?.details),
    date: mappedDate,
    time: mappedTime,
    startISO: mappedStartISO,
    endISO: mappedEndISO,
    timezone: parseResult.timezone || baseData?.timezone || "America/Chicago",
    venue: parseResult.venue || baseData?.venue || "",
    address: parseResult.address || baseData?.address || "",
    hostGym:
      sanitizeHostGymValue(parseResult.hostGym) ||
      sanitizeHostGymValue(athlete.team) ||
      sanitizeHostGymValue(baseData?.hostGym) ||
      "",
    location: parseResult.venue || baseData?.location || "",
    customFields: {
      ...(baseData?.customFields || {}),
      team:
        sanitizeHostGymValue(parseResult.hostGym) ||
        sanitizeHostGymValue(athlete.team) ||
        "",
      season: baseData?.customFields?.season || "",
      coach: baseData?.customFields?.coach || derivedCoachName || "",
      assistantCoach:
        baseData?.customFields?.assistantCoach || derivedAssistantCoachName || "",
      coachPhone: baseData?.customFields?.coachPhone || derivedCoachPhone || "",
      admission: admissionText,
      discoveryDocumentProfile: parseResult.documentProfile,
      meetDateRangeLabel: derivedRange.label || "",
      meetDateRangeStart: derivedRange.startDate,
      meetDateRangeEnd: derivedRange.endDate,
      advancedSections: nextAdvanced,
    },
    links: uniqueBy(
      [
        ...parseResult.links,
        ...parseResult.coachInfo.links,
        ...parseResult.logistics.parkingLinks,
        ...parseResult.logistics.parkingPricingLinks,
      ].filter((item) => item.url),
      (item) => item.url
    ),
    advancedSections: nextAdvanced,
    accessControl: nextAccessControl || baseData?.accessControl || null,
    templateKey: "gymnastics",
    templateId: "gymnastics-schedule",
    pageTemplateId: resolvedPageTemplateId,
    category: "sport_gymnastics_schedule",
  };
}

export const __testUtils = {
  deriveDateRangeFromText,
  classifyMeetDateCandidates,
  sanitizeHostGymValue,
  findBestScheduleSessionColorBox,
  findBestScheduleClubColorBox,
  deriveScheduleLegendEntriesFromOcrTextBoxes,
  normalizeParseResult,
  sanitizeDiscoveryParseResult,
  mergeCoachFeesFromAdmission,
  routeCoachDeadlines,
  hasCoachInfoContent,
  deriveScheduleFromTextFallback,
  parseNarrativeScheduleSessionsFromPage,
  parseScheduleAnnotationsFromPages,
  parseScheduleAssignmentsFromPages,
  classifySchedulePageText,
  selectScheduleSegments,
  mergeScheduleWithFallback,
  supplementScheduleWithFallback,
  mergeScheduleAwardFlags,
  extractScheduleLegendNotes,
  isStaleDerivedSchedule,
  collectDiscoveryCandidates,
  compareDiscoveryCandidates,
  setUrlDiscoveryTestHooks(hooks: UrlDiscoveryTestHooks | null) {
    urlDiscoveryTestHooks = hooks;
  },
  resetUrlDiscoveryTestHooks() {
    urlDiscoveryTestHooks = null;
  },
};
