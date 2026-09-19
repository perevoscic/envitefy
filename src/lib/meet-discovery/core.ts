import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { inflateRawSync, inflateSync } from "node:zlib";
import * as chrono from "chrono-node";
import OpenAI from "openai";
import sharp from "sharp";
import { hotelUrl, projectTravelHotels } from "../travel-accommodation-evidence";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  DEFAULT_NEW_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";
import { throwIfDiscoveryCancelled } from "@/lib/discovery/cancel";
import { type BrowserDiscoveryResult, collectDiscoveryBrowserData } from "@/lib/discovery-browser";
import {
  type DiscoveryBudgetSource,
  resolveDiscoveryBudget as resolveSharedDiscoveryBudget,
} from "@/lib/discovery-budget";
import { normalizeAccessControlPayload } from "@/lib/event-access";
import { getVisionClient } from "@/lib/gcp";
import {
  extractPdfAnnotationLinks,
  extractPdfTextWithPdfJs,
  type PdfAnnotationLink,
  rasterizePdfPageToPng,
} from "@/lib/pdf-raster";
import {
  buildTravelAccommodationResult,
  detectTravelAccommodationCandidates,
  extractHotelObjectsFromPdf,
  summarizeHotelsForNarrative,
  type TravelAccommodationCandidate,
  type TravelAccommodationHotel,
} from "@/lib/travel-accommodation-discovery";
import { normalizeVenueFactForCompare, sanitizeVenueFactLines } from "@/lib/venue-facts";
import { parseDataUrlBase64 } from "@/utils/data-url";
import { openAiChatCompatibilityParams } from "../openai-chat-params.ts";
import {
  createDiscoveryRequestCache,
  type DiscoveryRequestCache,
  getOrCreatePdfPageImage,
  getOrCreateWeakCacheValue,
} from "./cache";
import { GYM_DISCOVERY_PUBLIC_PAGE_V2 } from "./constants";
import { computeGymBuilderStatuses } from "./status";

export { computeGymBuilderStatuses, GYM_DISCOVERY_PUBLIC_PAGE_V2 };

export type DiscoverySourceInput =
  | {
      type: "file";
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl?: string | null;
      blobStored?: boolean;
      /** Set when PDF was not persisted to blob; client must re-upload on parse/enrich. */
      ephemeralFile?: boolean;
    }
  | {
      type: "url";
      url: string;
    };

export type ParseResult = {
  eventType: "gymnastics_meet" | "unknown";
  documentProfile: "parent_packet" | "registration_packet" | "meet_overview" | "unknown";
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
  contextText?: string | null;
  sectionHeading?: string | null;
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

export type DiscoveryResourceKind =
  | "packet"
  | "roster"
  | "team_divisions"
  | "rotation_hub"
  | "rotation_sheet"
  | "results_hub"
  | "results_live"
  | "results_pdf"
  | "travel_accommodation"
  | "hotel_booking"
  | "photo_video"
  | "apparel_form"
  | "admission"
  | "parking"
  | "other";

export type DiscoveryResourceStatus = "available" | "not_posted" | "unknown";

export type GymContentAudience = "public_attendee" | "coach_ops" | "mixed" | "unknown";

export type GymResourceRenderTarget =
  | "meet_details"
  | "admission"
  | "venue"
  | "traffic_parking"
  | "hotels"
  | "results"
  | "documents"
  | "hidden";

type DiscoveryResourceOrigin = "root" | "child_page" | "linked_asset" | "hub" | "hub_descendant";

export type DiscoveryResourceLink = {
  kind: DiscoveryResourceKind;
  status: DiscoveryResourceStatus;
  label: string;
  url: string;
  sourceUrl?: string | null;
  contextText?: string | null;
  sectionHeading?: string | null;
  origin: DiscoveryResourceOrigin;
  contentType: string | null;
  followed: boolean;
  matchScore: number | null;
  matchReason: string | null;
  availabilityText: string | null;
  availabilityDate: string | null;
  discoveryMethod: "http" | "playwright";
  audience?: GymContentAudience;
  renderTarget?: GymResourceRenderTarget;
};

type EventFingerprint = {
  rootUrl: string;
  slugTokens: string[];
  titleTokens: string[];
  locationTokens: string[];
  startDate: string | null;
  endDate: string | null;
  year: string | null;
};

type EventResourceMatch = {
  score: number;
  passes: boolean;
  hardReject: boolean;
  reason: string;
};

export type DiscoveryWorkflow = "gymnastics" | "football" | "sports";
export type DiscoveryMode = "core" | "enrich";

type DiscoveryUsageStage = "parse" | "gymLayoutVision";

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
  signal?: AbortSignal;
};

type NormalizedDiscoveryExtractionOptions = Omit<Required<DiscoveryExtractionOptions>, "signal"> & {
  signal?: AbortSignal;
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

export type GymPublicSectionOrigin =
  | "pdf_grounded"
  | "derived_summary"
  | "venue_enriched"
  | "mixed";

export type GymPublicSectionVisibility = "visible" | "hidden";

export type GymPublicTravelHotelItem = {
  id?: string;
  address?: string | null;
  bookingInstructions?: string | null;
  discoveredValues?: import("../travel-accommodation-evidence").HotelProjection["discoveredValues"];
  editedFields?: import("../travel-accommodation-evidence").HotelField[];
  name: string;
  imageUrl?: string | null;
  distanceFromVenue?: string | null;
  groupRate?: string | null;
  parking?: string | null;
  breakfast?: string | null;
  reservationDeadline?: string | null;
  phone?: string | null;
  bookingUrl?: string | null;
};

export type GymPublicPageSection = {
  title: string;
  body: string;
  bullets: string[];
  origin: GymPublicSectionOrigin;
  confidence: number;
  evidenceRefs: string[];
  items?: GymPublicTravelHotelItem[];
  fallbackLink?: string | null;
  visibility?: GymPublicSectionVisibility;
  hideReason?: string | null;
};

export type GymPublicDocumentSection = {
  title: "Documents";
  links: Array<{ label: string; url: string }>;
  origin: "pdf_grounded";
  confidence: number;
  evidenceRefs: string[];
  visibility?: GymPublicSectionVisibility;
  hideReason?: string | null;
};

export type GymPublicPageSections = {
  meetDetails: GymPublicPageSection | null;
  parking: GymPublicPageSection | null;
  traffic: GymPublicPageSection | null;
  venue: GymPublicPageSection | null;
  spectatorInfo: GymPublicPageSection | null;
  travel: GymPublicPageSection | null;
  documents: GymPublicDocumentSection | null;
};

type GymAudienceClassifiedText = {
  text: string;
  audience: GymContentAudience;
  source: "parse_field" | "operational_note" | "unmapped_fact" | "resource_hint" | "raw_detail";
};

export type GymDiscoveryPublishAssessment = {
  state: "auto_publish" | "review" | "draft";
  reasons: string[];
  sectionScores: {
    core: number;
    meetDetails: number;
    parking: number;
    traffic: number;
    venue: number;
    spectatorInfo: number;
    documents: number;
  };
};

type ExtractionResult = {
  extractedText: string;
  extractionMeta: {
    sourceType: "file" | "url";
    annotationLinks?: import("../travel-accommodation-evidence").HotelLink[];
    accommodationPageTexts?: Array<{ pageNumber: number; text: string }>;
    usedOcr: boolean;
    linkedAssets: Array<{ url: string; contentType: string }>;
    discoveredLinks?: DiscoveredLink[];
    resourceLinks?: DiscoveryResourceLink[];
    crawledPages?: CrawledPage[];
    pageTitle?: string | null;
    gymLayoutImageDataUrl?: string | null;
    gymLayoutFacts?: string[];
    gymLayoutZones?: GymLayoutZone[];
    gymLayoutPage?: number | null;
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    coachPageHints?: CoachPageHint[];
    travelAccommodationCandidates?: TravelAccommodationCandidate[];
    travelAccommodationSignals?: string[];
    travelAccommodationSummary?: {
      pdfHotels?: TravelAccommodationHotel[];
      fallbackLink?: string | null;
      confidence?: number | null;
    };
    textQuality?: TextQuality | null;
    qualitySignals?: TextQualitySignals | null;
    parseDiagnostics?: {
      staged?: {
        classifier: {
          eventType: ParseResult["eventType"];
          documentProfile: ParseResult["documentProfile"];
          confidence: number;
          contentMix: {
            registrationHeavy: boolean;
            parentPacketHeavy: boolean;
            mixed: boolean;
          };
          selectedProfiles: string[];
          usedHeuristicFallback?: boolean;
        };
        extractorCalls: Array<{
          profile: string;
          selectedEvidenceLabels: string[];
          selectedExcerptLabels: string[];
          evidenceChars: number;
          excerptChars: number;
        }>;
      };
      completeness?: {
        sectionScores: Record<
          string,
          {
            raw: number;
            sanitized: number;
            backfilled: number;
            mapped: number;
            evidenceSignals: number;
            sparseAt: "none" | "extraction" | "sanitization" | "mapping";
          }
        >;
      };
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
  resources: {
    links: DiscoveryResourceLink[];
    hotelHints: string[];
    statusHints: string[];
  };
};

type ParsePromptProfile = "overview_core" | "parent_public";

type ParseContentMix = {
  registrationHeavy: boolean;
  parentPacketHeavy: boolean;
  mixed: boolean;
};

type ParseClassification = {
  eventType: ParseResult["eventType"];
  documentProfile: ParseResult["documentProfile"];
  confidence: number;
  contentMix: ParseContentMix;
};

type SelectedParseEvidence = {
  evidence: Record<string, unknown>;
  evidenceChars: number;
  evidenceLabels: string[];
  excerpts: Array<{ label: string; text: string }>;
  excerptChars: number;
  excerptLabels: string[];
};

type ParseCompletenessSnapshot = Record<
  "core" | "athlete" | "meetDetails" | "logistics" | "coachInfo",
  { filled: number; total: number; score: number }
>;

type CrawlCandidate = DiscoveredLink & {
  score: number;
};

type UrlDiscoveryTestHooks = {
  fetchWithLimit?: (
    url: string,
    options?: { timeoutMs?: number; signal?: AbortSignal },
  ) => Promise<{ contentType: string; buffer: Buffer; text: string }>;
  collectBrowserData?: (
    url: string,
    options?: { timeoutMs?: number; maxChildPages?: number; maxActionablesPerPage?: number },
  ) => Promise<BrowserDiscoveryResult>;
  extractTextFromPdf?: (
    buffer: Buffer,
    options?: {
      budgetMs?: number;
      performance?: DiscoveryPerformance;
      cache?: DiscoveryRequestCache;
      mode?: DiscoveryMode;
      signal?: AbortSignal;
    },
  ) => Promise<{
    text: string;
    usedOcr: boolean;
    coachPageHints: CoachPageHint[];
    textQuality: TextQuality;
    qualitySignals: TextQualitySignals;
    pages?: Array<{ num: number; text: string }>;
    annotationLinks?: PdfAnnotationLink[];
  }>;
  extractTextFromImage?: (buffer: Buffer, cache?: DiscoveryRequestCache) => Promise<string>;
  extractGymLayoutImageFromPdf?: (
    buffer: Buffer,
    options?: {
      maxPages?: number;
      maxAiCandidates?: number;
      performance?: DiscoveryPerformance;
      budgetMs?: number;
      cache?: DiscoveryRequestCache;
    },
  ) => Promise<GymLayoutExtraction>;
  openAiExtractGymLayoutZones?: (
    buffer: Buffer,
    mimeType?: string,
    performance?: DiscoveryPerformance,
  ) => Promise<GymLayoutZone[]>;
  toOptimizedImageDataUrl?: (
    buffer: Buffer,
    cache?: DiscoveryRequestCache,
  ) => Promise<string | null>;
};

const MAX_FETCHED_LINKED_ASSETS = 8;
const MAX_FOLLOWED_CHILD_PAGES = 3;
const MAX_DISCOVERED_LINKS = 24;
const MAX_FETCH_BYTES = 7 * 1024 * 1024;
const LOW_TEXT_THRESHOLD = 200;
let urlDiscoveryTestHooks: UrlDiscoveryTestHooks | null = null;

export function createDiscoveryPerformance(
  seed: Partial<DiscoveryPerformance> = {},
): DiscoveryPerformance {
  return {
    pdfParseMs: 0,
    ocrMs: 0,
    ocrPageCount: 0,
    gymLayoutScanMs: 0,
    gymLayoutAiCalls: 0,
    modelParseMs: 0,
    persistMs: 0,
    tokenUsage: null,
    ...seed,
  };
}

export {
  type DiscoveryParseLogSummary,
  summarizeDiscoveryPerformanceForLog,
} from "../discovery-performance-log";

export function resolveDiscoveryBudget(
  mode: DiscoveryMode,
  sourceType: DiscoveryBudgetSource = "file",
): number {
  return resolveSharedDiscoveryBudget(mode, sourceType);
}

export function isDiscoveryDebugArtifactsEnabled(): boolean {
  return safeString(process.env.DISCOVERY_DEBUG_ARTIFACTS) === "1";
}

function logDiscoveryDebug(message: string, payload?: Record<string, unknown>) {
  if (!isDiscoveryDebugArtifactsEnabled()) return;
  if (payload) {
    console.log(message, payload);
    return;
  }
  console.log(message);
}

function warnDiscoveryDebug(message: string, payload?: Record<string, unknown>) {
  if (!isDiscoveryDebugArtifactsEnabled()) return;
  if (payload) {
    console.warn(message, payload);
    return;
  }
  console.warn(message);
}

function normalizeDiscoveryExtractionOptions(
  options?: DiscoveryExtractionOptions,
  sourceType: DiscoveryBudgetSource = "file",
): NormalizedDiscoveryExtractionOptions {
  return {
    workflow: options?.workflow || "gymnastics",
    mode: options?.mode || "core",
    budgetMs:
      typeof options?.budgetMs === "number" &&
      Number.isFinite(options.budgetMs) &&
      options.budgetMs > 0
        ? options.budgetMs
        : resolveDiscoveryBudget(options?.mode || "core", sourceType),
    debugArtifacts:
      typeof options?.debugArtifacts === "boolean"
        ? options.debugArtifacts
        : isDiscoveryDebugArtifactsEnabled(),
    performance: options?.performance || createDiscoveryPerformance(),
    signal: options?.signal,
  };
}

function throwIfExtractionAborted(signal?: AbortSignal) {
  throwIfDiscoveryCancelled(signal);
}

function deadlineAt(budgetMs?: number): number {
  return typeof budgetMs === "number" && Number.isFinite(budgetMs) && budgetMs > 0
    ? Date.now() + budgetMs
    : Number.POSITIVE_INFINITY;
}

function remainingBudgetMs(nextDeadlineAt: number): number {
  if (!Number.isFinite(nextDeadlineAt)) return Number.POSITIVE_INFINITY;
  return Math.max(0, nextDeadlineAt - Date.now());
}

function isBudgetExhausted(nextDeadlineAt: number): boolean {
  return remainingBudgetMs(nextDeadlineAt) <= 0;
}

function normalizeTokenUsage(usage: any) {
  if (!usage || typeof usage !== "object") return null;
  const promptTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0;
  const completionTokens = Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0;
  const totalTokens = Number(usage.total_tokens ?? promptTokens + completionTokens) || 0;
  const cachedTokens =
    Number(
      usage.prompt_tokens_details?.cached_tokens ?? usage.input_tokens_details?.cached_tokens ?? 0,
    ) || 0;
  if (!promptTokens && !completionTokens && !totalTokens && !cachedTokens) {
    return null;
  }
  return { promptTokens, completionTokens, totalTokens, cachedTokens };
}

function recordDiscoveryUsage(
  performance: DiscoveryPerformance | undefined,
  stage: DiscoveryUsageStage,
  usage: any,
) {
  if (!performance) return;
  const normalized = normalizeTokenUsage(usage);
  if (!normalized) return;
  const existing = performance.tokenUsage?.[stage];
  performance.tokenUsage = performance.tokenUsage || {};
  performance.tokenUsage[stage] = {
    promptTokens: (existing?.promptTokens || 0) + normalized.promptTokens,
    completionTokens: (existing?.completionTokens || 0) + normalized.completionTokens,
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
  annotationLinks: PdfAnnotationLink[];
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type DiscoveryAiImageArtifact = {
  workflow?: DiscoveryWorkflow | null;
  stage: string;
  page?: number | null;
  mimeType?: string | null;
};

function sanitizeArtifactPathPart(value: string, fallback: string): string {
  const normalized = safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function getArtifactExtensionForMimeType(mimeType?: string | null): string {
  const normalized = safeString(mimeType).toLowerCase();
  if (normalized.includes("png")) return ".png";
  if (normalized.includes("webp")) return ".webp";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return ".jpg";
  return ".bin";
}

async function persistVisionInputDebugArtifact(
  buffer: Buffer,
  artifact?: DiscoveryAiImageArtifact,
): Promise<string | null> {
  if (!artifact?.stage || buffer.length === 0) return null;
  try {
    const baseDir =
      safeString(process.env.DISCOVERY_DEBUG_ARTIFACT_DIR) ||
      path.join(process.cwd(), "qa-artifacts", "discovery-ai-inputs");
    const workflow = sanitizeArtifactPathPart(artifact.workflow || "gymnastics", "gymnastics");
    const stage = sanitizeArtifactPathPart(artifact.stage, "vision-input");
    const pageNumber =
      typeof artifact.page === "number" && Number.isFinite(artifact.page)
        ? artifact.page + 1
        : null;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 12);
    const fileName = `${stamp}${pageNumber ? `-page-${pageNumber}` : ""}-${hash}${getArtifactExtensionForMimeType(
      artifact.mimeType,
    )}`;
    const dir = path.join(baseDir, workflow, stage);
    const filePath = path.join(dir, fileName);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    return filePath;
  } catch (error) {
    console.warn("[meet-discovery] failed to persist AI input image", {
      stage: artifact?.stage || null,
      page:
        typeof artifact?.page === "number" && Number.isFinite(artifact.page)
          ? artifact.page + 1
          : null,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

const HOST_GYM_PACKET_TEXT_PATTERN =
  /\b(?:please review|following items enclosed|this packet|info packet|packet:|competition to follow|recognized at|award ceremony)\b/i;
const HOST_GYM_EVENT_TITLE_PATTERN =
  /\b(?:state championships?|regional championships?|national championships?|session\s+[A-Z]{2}\d+|schedule|info packet|meet packet)\b/i;
const HOST_GYM_PAYMENT_LINE_PATTERN =
  /^(?:payment|payment instructions?:|checks?\s+payable|check:\s*make payable|make payable to|payable to)/i;
const GYM_LAYOUT_PDF_MAX_PAGES = 10;

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

  text = text
    .replace(/^host(?:ed)?\s+by[:\s-]*/i, "")
    .replace(/[,:;.-]+$/g, "")
    .trim();
  if (!text) return null;
  if (HOST_GYM_PAYMENT_LINE_PATTERN.test(text)) return null;
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
  if (HOST_GYM_PAYMENT_LINE_PATTERN.test(original)) return false;
  const hasHostCue = /\bhost(?:ed)?\b/i.test(original);
  const hasOrgCue = /\b(?:gym|gymnastics|academy|club|team|usa competitions)\b/i.test(candidate);
  if (!hasHostCue && !hasOrgCue) return false;
  if (!hasHostCue && HOST_GYM_EVENT_TITLE_PATTERN.test(candidate)) return false;
  return true;
}

function toIsoOrNull(value: unknown): string | null {
  const asText = safeString(value);
  if (!asText) return null;
  if (
    !/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/i.test(
      asText,
    )
  ) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/i.test(asText)) {
    return `${asText}T00:00:00.000Z`;
  }
  const normalized = asText.includes("T")
    ? asText
    : asText.includes(" ")
      ? asText.replace(" ", "T")
      : `${asText}T00:00:00`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toIsoDateOnlyOrNull(value: unknown): string | null {
  const iso = toIsoOrNull(value);
  return iso ? iso.slice(0, 10) : null;
}

function pickArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value).replace(/[)\],.;!?]+$/, "");
  if (!raw) return "";
  const withProtocol = /^www\./i.test(raw)
    ? `https://${raw}`
    : /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?$/i.test(raw) && !/@/.test(raw)
      ? `https://${raw}`
      : raw;
  if (!/^https?:\/\//i.test(withProtocol)) return "";
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function extractCanonicalUrlFromText(value: unknown): string {
  const text = safeString(value);
  if (!text) return "";
  const match = text.match(
    /(?:https?:\/\/[^\s)]+|www\.[^\s)]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s),;!?]*)?)/i,
  );
  if (!match) return "";
  const candidate = safeString(match[0]).replace(/[)\],.;!?]+$/, "");
  if (!candidate || /@/.test(candidate)) return "";
  return normalizeUrl(candidate);
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

const SCHEDULE_DATE_LINE_PATTERN =
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?\b/i;

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
  /(session\s+(?:[a-z]{1,3}\d{1,2}|\d{1,2})\b|\b[a-z]{1,3}\d{1,2}\b.*\b[a-z]{1,3}\d{1,2}\b|stretch\/warmup:|levels?\s+\d|clubs in pink|individual & team awards|your designated number of athlete spots per session|questions\?\s*email us asap)/i;
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

function splitScheduleCellCandidates(
  line: string,
  options?: { preserveEmpty?: boolean },
): string[] {
  const normalized = safeString(line);
  if (!normalized) return [];
  const preserveEmpty = options?.preserveEmpty ?? false;
  const cells = /\t/.test(normalized) ? normalized.split(/\t/) : normalized.split(/\s{2,}/);
  return preserveEmpty
    ? cells.map((cell) => safeString(cell))
    : cells.map((cell) => safeString(cell)).filter(Boolean);
}

function normalizeScheduleSessionCode(value: unknown): string {
  const normalized = safeString(value)
    .replace(/^session\s+/i, "")
    .replace(/[#:]+$/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  if (/^\d+$/.test(normalized)) return normalized;
  return normalized.toUpperCase();
}

function extractSessionCodeFromCell(
  value: string,
  options?: { allowBareCode?: boolean; allowNumericOnly?: boolean },
): string {
  const normalized = safeString(value).replace(/\s+/g, " ");
  if (!normalized) return "";
  const prefixedMatch = normalized.match(/\bsession\s+([a-z]{1,3}\d{1,2}|\d{1,2})\b/i);
  if (prefixedMatch) {
    return normalizeScheduleSessionCode(prefixedMatch[1]);
  }
  if (!options?.allowBareCode) return "";
  const exactMatch = normalized.match(/^([a-z]{1,3}\d{1,2})$/i);
  if (exactMatch) {
    return normalizeScheduleSessionCode(exactMatch[1]);
  }
  if (options?.allowNumericOnly) {
    const numericMatch = normalized.match(/^(\d{1,2})$/);
    if (numericMatch) {
      return normalizeScheduleSessionCode(numericMatch[1]);
    }
  }
  return "";
}

function extractScheduleSessionCodesInText(text: string): string[] {
  const normalized = safeString(text);
  if (!normalized) return [];
  const prefixed = [...normalized.matchAll(/\bsession\s+([a-z]{1,3}\d{1,2}|\d{1,2})\b/gi)].map(
    (match) => normalizeScheduleSessionCode(match[1]),
  );
  const bare =
    prefixed.length === 0 &&
    /\t|\s{2,}/.test(normalized) &&
    !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(normalized)
      ? splitScheduleCellCandidates(normalized)
          .map((cell) =>
            extractSessionCodeFromCell(cell, {
              allowBareCode: true,
              allowNumericOnly: false,
            }),
          )
          .filter(Boolean)
      : [];
  return uniqueBy([...prefixed, ...bare], (item) => item);
}

function countScheduleTimeValues(text: string): number {
  return (safeString(text).match(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi) || []).length;
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
    safeString(value),
  );
}

function isStructuredAnnouncementText(value: string): boolean {
  return /(doors open|arrival guidance|registration\b|results|live scoring|rotation sheets?|awards|venue contact|facility contact|meet director|director of operations|event coordinator|floor manager)/i.test(
    safeString(value),
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
      combined,
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
  return (
    (
      text.match(
        /\b(?:gymnastics|gym|academy|twisters|ymca|starz|miami|wellington|boca|canada)\b/gi,
      ) || []
    ).length >= 3
  );
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
  confidence: "high" | "medium" | "low" = "high",
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
          .trim() === key,
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
    text,
  );
}

function normalizeDiscoveryDateArtifacts(value: string): string {
  return safeString(value)
    .replace(/\u2013|\u2014/g, "-")
    .replace(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})(\s*,\s*\d{4})/gi,
      "$1 $2-$3$4",
    )
    .replace(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})\b/gi,
      "$1 $2-$3",
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
        prevText,
      ) && /^\d{1,2}(?:,\s*\d{4})?\b/.test(nextText);

    if (!prevIsHeading && !nextIsHeading && (joinsBrokenWord || joinsCurrency || joinsDateRange)) {
      out[out.length - 1] = `${prevText.replace(/-\s*$/, "")}${nextText}`
        .replace(/\s+/g, " ")
        .trim();
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
    safeString(line),
  );
}

function looksLikeCoachLine(line: string): boolean {
  return /(coach(?:es)?|entry fees?|team fees?|team entry|athlete fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|floor manager|meet director|director of operations|assistant event coordinator|dress code|attire|floor music|meet maker|reservation)/i.test(
    safeString(line),
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
      lowered,
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
      .filter(Boolean),
  );
  const lines = baseLines.flatMap((line) =>
    line
      .split(/(?=\b(?:when|meet dates?|competition dates?|event dates?)\b[:]?)/i)
      .map((item) => safeString(item))
      .filter(Boolean),
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
    text,
  );
}

function inferCoachFeeBucket(item: {
  label: string;
  amount?: string;
  price?: string;
  note: string | null;
}): "entry" | "team" | "late" | null {
  const haystack = `${safeString(item.label)} ${safeString(item.note)} ${safeString(
    item.amount || item.price,
  )}`.toLowerCase();
  if (/(late fee|late entry|after .*deadline)/i.test(haystack)) return "late";
  if (/\b(team fee|team entry|team)\b/i.test(haystack)) return "team";
  if (/\b(entry fee|athlete fee|registration fee|per gymnast|entry)\b/i.test(haystack))
    return "entry";
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
      pickArray(coachInfo.notes).length,
  );
}

function extractCoachPageHintsFromPages(
  pages: Array<{ num: number; text: string }>,
): CoachPageHint[] {
  const hints: CoachPageHint[] = [];
  for (const page of pages) {
    const pageText = cleanExtractedText(safeString(page?.text));
    if (!pageText) continue;
    const lines = stitchDiscoveryLines(
      pageText
        .split(/\n+/)
        .map((line) => safeString(line))
        .filter(Boolean),
    );
    const heading =
      lines.find((line) => isCoachHeadingLine(line)) ||
      lines.find((line) =>
        /(coach(?:es)?|entry fees?|how to enter|payment|refund|qualification|regional commitment)/i.test(
          line,
        ),
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
      coachLines.length > 0 ? coachLines.slice(0, 6) : lines.slice(0, 6),
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
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),?\s*(\d{4})\b/i,
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
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2}),?\s*(\d{4})\b/i,
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
    text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*[–-]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/) ||
    null;
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
    .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
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
  extractionMeta: ExtractionResult["extractionMeta"],
): DiscoveryEvidence {
  const text = cleanExtractedText(extractedText);
  const lines = stitchDiscoveryLines(
    text
      .split(/\n+/)
      .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
      .filter(Boolean),
  );
  const firstLines = uniqueLines(lines.slice(0, 24), 12);
  const additionalInfoStartIdx = lines.findIndex((line) => /additional\s*info/i.test(line));
  const additionalInfoLines =
    additionalInfoStartIdx >= 0
      ? uniqueLines(lines.slice(additionalInfoStartIdx + 1, additionalInfoStartIdx + 26), 12)
      : [];

  const matchLines = (pattern: RegExp, limit = 12) =>
    uniqueLines(
      lines.filter((line) => pattern.test(line)),
      limit,
    );
  const sectionMatchLines = (patterns: RegExp[], limit = 12) =>
    uniqueLines(
      lines.filter((line) => patterns.some((pattern) => pattern.test(line))),
      limit,
    );
  const dateAnalysis = classifyMeetDateCandidates(text);

  const dateHints = uniqueLines(
    [
      ...(dateAnalysis.primary ? [dateAnalysis.primary.label] : []),
      ...(text.match(
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:\s*[–-]\s*\d{1,2})?(?:,\s*\d{4})?/gi,
      ) || []),
      ...(text.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || []),
    ],
    10,
  );
  const timeHints = uniqueLines(
    text.match(/\b\d{1,2}(?::\d{2})?\s*[AP]M(?:\s*-\s*\d{1,2}(?::\d{2})?\s*[AP]M)?\b/gi) || [],
    14,
  );
  const timezoneHints = uniqueLines(
    text.match(
      /\b(?:America\/[A-Za-z_]+|EST|EDT|CST|CDT|MST|MDT|PST|PDT|Eastern|Central|Mountain|Pacific)\b/gi,
    ) || [],
    8,
  );
  const addressHints = matchLines(
    /\b\d{2,6}\s+[A-Za-z0-9.\-'\s]+,\s*[A-Za-z.\-'\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/,
    8,
  );
  const venueHints = matchLines(
    /(convention center|arena|center|hall|gymnasium|gym|sports complex|fieldhouse|venue)/i,
    12,
  );
  const hostGymHints = uniqueLines(
    lines
      .filter(
        (line) =>
          /(host(ed)? by|gymnastics|gym club|academy|host gym|host|team\b|usa competitions)/i.test(
            line,
          ) && isProbableHostGymHint(line),
      )
      .map((line) => sanitizeHostGymValue(line))
      .filter((line): line is string => Boolean(line)),
    12,
  );
  const admissionHints = matchLines(
    /(admission|ticket|adult|children|cash|weekend pass|door)/i,
    12,
  );
  const athleteHints = matchLines(
    /(athlete|gymnast|level|team|march in|stretch|assigned gym|awards)/i,
    14,
  );
  const logisticsHints = matchLines(
    /(parking|traffic|hotel|meal|food|waiver|rideshare|uber|lyft|map|directions|drop[- ]?off|visitor guide|host hotels?|reservation deadline|pay by mobile)/i,
    14,
  );
  const policyHints = matchLines(
    /(hydration|service animal|service dog|safety|food|beverage|outside food|throwing object|flash)/i,
    12,
  );
  const coachHints = uniqueLines(
    [
      ...matchLines(
        /(coach(?:es)?|entry fees?|team fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|meet director|floor manager|attire|dress code)/i,
        16,
      ),
      ...pickArray(extractionMeta.coachPageHints)
        .flatMap((item) => [safeString(item?.heading), safeString(item?.excerpt)])
        .filter(Boolean),
    ],
    16,
  );
  const trafficLines = matchLines(/(traffic|disney on ice|benchmark|parking rate|30-45)/i, 8);
  const hallLayoutLines = matchLines(
    /(east hall|west hall|central hall|registration|guest services|competition area|coffee bar|awards)/i,
    10,
  );
  const coachLines = matchLines(
    /(coach(?:es)?|entry fees?|team fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|meet director|floor manager|attire|dress code)/i,
    10,
  );
  const spectatorSection = sectionMatchLines(
    [
      /(spectator admission|spectator admissions|admission|ticket|door fees?|doors? open|weekend passes?|adult|child|cash only|parents?\/spectators?|additional info|rotation sheets?|event merchandise)/i,
    ],
    12,
  );
  const venueSection = sectionMatchLines(
    [
      /(east hall|west hall|central hall|guest services|registration desk|competition area|venue|facility layout|awards area|entrance|meet site|assigned halls?|lobby)/i,
    ],
    12,
  );
  const trafficSection = sectionMatchLines(
    [/(parking|traffic|ride ?share|uber|lyft|drop-?off|garage|parkmobile|complimentary parking)/i],
    12,
  );
  const policySection = sectionMatchLines(
    [
      /(food|water|hydration|service animals?|service dogs?|safety|outside food|throwing objects?)/i,
    ],
    12,
  );
  const coachOpsSection = sectionMatchLines(
    [
      /(coach(?:es)?|sign[- ]?in|floor access|attire|hospitality|scratches|rotation sheets?|floor music|regional commitment|qualification|coaches information|athlete\s*&\s*coach registration|regional meet coaches information)/i,
    ],
    12,
  );
  const registrationSection = sectionMatchLines(
    [
      /(entry fees?|team fees?|late fees?|how to enter|payment|refund|deadline|meet maker|reservation|meet entry summary|athlete\s*&\s*coach registration|regional meet coaches information)/i,
    ],
    12,
  );
  const titleHints = uniqueLines(
    [
      safeString(extractionMeta.pageTitle || ""),
      ...firstLines.filter((line) => line.length >= 6 && line.length <= 90),
    ],
    8,
  );
  const resourceLinks = pickArray(extractionMeta.resourceLinks)
    .map<DiscoveryResourceLink>((item) => ({
      kind: (safeString(item?.kind) as DiscoveryResourceKind) || "other",
      status: (safeString(item?.status) as DiscoveryResourceStatus) || "unknown",
      label: safeString(item?.label) || "Resource link",
      url: normalizeUrl(item?.url) || "",
      sourceUrl: normalizeUrl(item?.sourceUrl) || "",
      origin: (safeString(item?.origin) as DiscoveryResourceOrigin) || "root",
      contentType: safeString(item?.contentType) || null,
      followed: Boolean(item?.followed),
      availabilityText: safeString(item?.availabilityText) || null,
      availabilityDate: safeString(item?.availabilityDate) || null,
      discoveryMethod: safeString(item?.discoveryMethod) === "playwright" ? "playwright" : "http",
      matchScore:
        typeof item?.matchScore === "number" && Number.isFinite(item.matchScore)
          ? item.matchScore
          : null,
      matchReason: safeString(item?.matchReason) || null,
    }))
    .filter((item) => item.url);
  const linkHints = uniqueBy(
    [
      ...resourceLinks.map((item) => ({
        label: item.label,
        url: item.url,
      })),
      ...pickArray(extractionMeta.discoveredLinks)
        .map((item) => ({
          label: safeString(item?.label) || "Source link",
          url: normalizeUrl(item?.url),
        }))
        .filter((item) => item.url),
      ...uniqueLines(
        (text.match(/https?:\/\/[^\s)]+/gi) || []).map((url) => url.replace(/[.,;!?]+$/, "")),
        14,
      ).map((url) => ({ label: "Source link", url })),
    ],
    (item) => item.url,
  ).slice(0, 14);
  const hotelHints = uniqueLines(
    lines.filter((line) =>
      /\b(groupbook|hotel|lodging|room block|reservation deadline|group rate)\b/i.test(line),
    ),
    8,
  );
  const statusHints = uniqueLines(
    resourceLinks
      .filter((item) => item.status !== "available" || item.matchReason)
      .map(
        (item) => `${item.kind}: ${item.status}${item.matchReason ? ` (${item.matchReason})` : ""}`,
      ),
    10,
  );

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
    resources: {
      links: resourceLinks,
      hotelHints,
      statusHints,
    },
  };
}

function extractPdfTextHeuristic(buffer: Buffer): string {
  const decodePdfFragment = (value: string) =>
    value
      .replace(/\\([0-7]{1,3})/g, (_m, oct) => String.fromCharCode(parseInt(oct, 8)))
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
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " "),
  );
  const stitched = stitchDiscoveryLines(
    normalized
      .split(/\n+/)
      .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
      .filter(Boolean),
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
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

function resolveOpenAiMiniModel(): string {
  return (
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.6-luna"
  );
}

function resolveDiscoveryParseModel(): string {
  return safeString(process.env.OPENAI_DISCOVERY_PARSE_MODEL) || "gpt-6-astra";
}

function resolveDiscoveryVisionModel(): string {
  return safeString(process.env.OPENAI_DISCOVERY_VISION_MODEL) || "gpt-5.6-luna";
}

const DEFAULT_GEMINI_PARSE_MODEL = "gemini-3.6-flash";

function resolveGeminiParseModels(): string[] {
  const configuredModel = safeString(process.env.GEMINI_MODEL);
  return uniqueBy([configuredModel, DEFAULT_GEMINI_PARSE_MODEL].filter(Boolean), (model) => model);
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

async function getPdfPageImage(
  pdfBuffer: Buffer,
  pageIndex: number,
  cache?: DiscoveryRequestCache,
  artifact?: DiscoveryAiImageArtifact,
): Promise<Buffer | null> {
  const render = async () => {
    const image = await rasterizePdfPageToPng(pdfBuffer, pageIndex);
    if (image) {
      await persistVisionInputDebugArtifact(image, {
        workflow: artifact?.workflow || "gymnastics",
        stage: artifact?.stage || "pdf-raster-page",
        page: typeof artifact?.page === "number" ? artifact.page : pageIndex,
        mimeType: artifact?.mimeType || "image/png",
      });
    }
    return image;
  };
  return cache ? getOrCreatePdfPageImage(cache, pdfBuffer, pageIndex, render) : render();
}

const SCHEDULE_SESSION_HEADER_PATTERN = /session\s+([a-z]{1,3}\d{1,2}|\d{1,2})/i;
const SCHEDULE_TIME_PATTERN =
  /^(?:stretch\/warmup:|stretch:|warm-?up:|open stretch:|march in:)|\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i;

function splitScheduleCells(line: string): string[] {
  return splitScheduleCellCandidates(line);
}

function extractSessionCodesFromHeader(line: string): string[] {
  const cells = splitScheduleCells(line);
  const fromCells = uniqueBy(
    cells
      .map((cell) =>
        extractSessionCodeFromCell(cell, {
          allowBareCode: true,
          allowNumericOnly: true,
        }),
      )
      .filter(Boolean),
    (item) => item,
  );
  if (fromCells.length >= 2) return fromCells;
  return extractScheduleSessionCodesInText(line);
}

function looksLikeScheduleTimeLine(line: string): boolean {
  const normalized = safeString(line);
  if (!normalized) return false;
  if (/^(?:stretch\/warmup:|stretch:|warm-?up:|open stretch:|march in:)/i.test(normalized)) {
    return true;
  }
  return (
    countScheduleTimeValues(normalized) >= 2 && (/\t/.test(normalized) || /\s{2,}/.test(normalized))
  );
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

function looksLikePdfInternals(text: string): boolean {
  const sample = cleanExtractedText(text).slice(0, 24000);
  if (!sample) return false;
  if (/%PDF-\d\.\d/i.test(sample)) return true;
  const pdfKeywords =
    sample.match(
      /\b(?:obj|endobj|stream|endstream|xref|trailer|startxref|catalog|mediabox|fontdescriptor|flatedecode)\b/gi,
    ) || [];
  const slashDirectives = sample.match(/\/[A-Za-z][A-Za-z0-9]+/g) || [];
  return pdfKeywords.length >= 8 || (pdfKeywords.length >= 3 && slashDirectives.length >= 120);
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
  const englishLikeTokens = tokens.filter((token) =>
    /^[A-Za-z][A-Za-z'’-]{1,24}$/.test(token),
  ).length;
  const longTokens = tokens.filter((token) => token.length > 35).length;
  const nonTextChars = (sample.match(/[^A-Za-z0-9\s.,:;!?()'"&@#%/-]/g) || []).length;
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
  const pdfJsExtraction = await extractPdfTextWithPdfJs(buffer);
  return {
    text: cleanExtractedText(String(pdfJsExtraction.text || "")),
    pages: pdfJsExtraction.pages
      .map((page) => ({
        num: Number(page?.num) || 0,
        text: cleanPdfPageTextPreservingGrid(String(page?.text || "")),
      }))
      .filter((page) => page.text),
    annotationLinks: [],
  };
}

async function ocrBuffer(buffer: Buffer): Promise<string> {
  const vision = getVisionClient();
  const [result] = await vision.documentTextDetection({
    image: { content: buffer },
    imageContext: { languageHints: ["en"] },
  });
  return (result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "").trim();
}

async function openAiOcrTextFromImage(
  buffer: Buffer,
  mimeType = "image/png",
  artifact?: DiscoveryAiImageArtifact,
): Promise<string> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return "";
  const model = resolveOpenAiMiniModel();
  try {
    if (artifact) await persistVisionInputDebugArtifact(buffer, {
      ...artifact,
      mimeType: artifact?.mimeType || mimeType,
    });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        ...openAiChatCompatibilityParams(model, { temperature: 0 }),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are an OCR engine. Return strict JSON {"text": string}. Extract only visible text and labels from the image.',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all visible text." },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` },
              },
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
  performance?: DiscoveryPerformance,
  artifact?: DiscoveryAiImageArtifact,
): Promise<{ isLayout: boolean; confidence: number; facts: string[]; text: string } | null> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return null;
  const model = resolveDiscoveryVisionModel();
  try {
    if (artifact) await persistVisionInputDebugArtifact(buffer, {
      ...artifact,
      mimeType: artifact?.mimeType || mimeType,
    });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        ...openAiChatCompatibilityParams(model, { temperature: 0 }),
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
                text: "Return JSON with keys: isLayout (boolean), confidence (number 0-1), text (string), facts (string[]). Facts must be verbatim visible map labels/text only (no paraphrase, no inference, no reconstruction). Each fact must be a complete, readable sentence or complete standalone label. Never return broken fragments or mid-sentence splits. If uncertain, return an empty facts array.",
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
    if (!response.ok) return null;
    const payload = await response.json();
    recordDiscoveryUsage(performance, "gymLayoutVision", payload?.usage);
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const confidenceRaw = Number(parsed?.confidence);
    const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0;
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
        },
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
    workflow?: DiscoveryWorkflow;
    signal?: AbortSignal;
  },
): Promise<{
  text: string;
  usedOcr: boolean;
  coachPageHints: CoachPageHint[];
  textQuality: TextQuality;
  qualitySignals: TextQualitySignals;
  pages: Array<{ num: number; text: string }>;
  annotationLinks: PdfAnnotationLink[];
}> {
  const rank: Record<TextQuality, number> = { good: 2, suspect: 1, poor: 0 };
  throwIfExtractionAborted(options?.signal);
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
  throwIfExtractionAborted(options?.signal);
  let selectedPages = workerExtraction.pages;
  const workerCandidate = toCandidate(workerExtraction.text, false);
  let pdfJsCandidate: ReturnType<typeof toCandidate> | null = null;
  if (!isStrongNativeCandidate(workerCandidate) || selectedPages.length === 0) {
    const pdfJsExtraction = await extractPdfTextWithPdfJs(buffer);
    throwIfExtractionAborted(options?.signal);
    const pdfJsPages = pickArray(pdfJsExtraction.pages)
      .map((page) => ({
        num: Number(page?.num) || 0,
        text: cleanPdfPageTextPreservingGrid(String(page?.text || "")),
      }))
      .filter((page) => page.text);
    if (pdfJsPages.length > selectedPages.length) {
      selectedPages = pdfJsPages;
    }
    if (pdfJsExtraction.text) {
      pdfJsCandidate = toCandidate(pdfJsExtraction.text, false);
    }
  }
  const annotationLinks = await extractPdfAnnotationLinks(buffer);
  throwIfExtractionAborted(options?.signal);
  const selectedCoachPageHints = extractCoachPageHintsFromPages(selectedPages);
  if (options?.performance) {
    options.performance.pdfParseMs += Date.now() - nativeParseStartedAt;
  }
  if (isStrongNativeCandidate(workerCandidate)) {
    return {
      ...workerCandidate,
      coachPageHints: selectedCoachPageHints,
      pages: selectedPages,
      annotationLinks,
    };
  }
  if (pdfJsCandidate && isStrongNativeCandidate(pdfJsCandidate)) {
    return {
      ...pdfJsCandidate,
      coachPageHints: selectedCoachPageHints,
      pages: selectedPages,
      annotationLinks,
    };
  }

  const heuristicCandidate = toCandidate(extractPdfTextHeuristic(buffer), false);
  if (isStrongNativeCandidate(heuristicCandidate)) {
    return {
      ...heuristicCandidate,
      coachPageHints: selectedCoachPageHints,
      pages: selectedPages,
      annotationLinks,
    };
  }

  if (Date.now() >= deadline) {
    const bestNative =
      rank[workerCandidate.textQuality] >= rank[heuristicCandidate.textQuality]
        ? workerCandidate
        : heuristicCandidate;
    return {
      ...bestNative,
      coachPageHints: selectedCoachPageHints,
      pages: selectedPages,
      annotationLinks,
    };
  }

  let ocrCandidate: ReturnType<typeof toCandidate> | null = null;
  try {
    const ocrStartedAt = Date.now();
    const ocrPages: string[] = [];
    const maxOcrPages = options?.mode === "core" ? 3 : 5;
    for (let page = 0; page < maxOcrPages; page += 1) {
      throwIfExtractionAborted(options?.signal);
      if (Date.now() >= deadline) break;
      const pageImage = await getPdfPageImage(buffer, page, options?.cache, {
        workflow: options?.workflow || "gymnastics",
        stage: "pdf-raster-page",
        page,
        mimeType: "image/png",
      });
      if (!pageImage) break;
      if (options?.performance) {
        options.performance.ocrPageCount += 1;
      }
      const text = cleanExtractedText(
        await extractTextFromImage(pageImage, options?.cache, {
          aiArtifact:
            options?.workflow === "gymnastics"
              ? {
                  workflow: options.workflow,
                  stage: "pdf-ocr-page",
                  page,
                  mimeType: "image/png",
                }
              : undefined,
        }),
      );
      if (text) {
        ocrPages.push(text);
        const aggregate = analyzeTextQuality(ocrPages.join("\n\n"));
        if (aggregate.quality === "good" && aggregate.cleanedText.length >= 800) {
          break;
        }
      }
      throwIfExtractionAborted(options?.signal);
    }
    if (options?.performance) {
      options.performance.ocrMs += Date.now() - ocrStartedAt;
    }
    if (ocrPages.length > 0) {
      ocrCandidate = toCandidate(ocrPages.join("\n\n"), true);
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return {
          ...ocrCandidate,
          coachPageHints: selectedCoachPageHints,
          pages: selectedPages,
          annotationLinks,
        };
      }
    }
  } catch {
    // Continue to final fallbacks.
  }
  if (!ocrCandidate) {
    try {
      const ocrStartedAt = Date.now();
      const fallbackPages: string[] = [];
      const maxFallbackPages = options?.mode === "core" ? 2 : 4;
      for (let page = 0; page < maxFallbackPages; page += 1) {
        throwIfExtractionAborted(options?.signal);
        if (Date.now() >= deadline) break;
        const pageImage = await getPdfPageImage(buffer, page, options?.cache, {
          workflow: options?.workflow || "gymnastics",
          stage: "pdf-raster-page",
          page,
          mimeType: "image/png",
        });
        if (!pageImage) break;
        if (options?.performance) {
          options.performance.ocrPageCount += 1;
        }
        const text = cleanExtractedText(
          await extractTextFromImage(pageImage, options?.cache, {
            aiArtifact:
              options?.workflow === "gymnastics"
                ? {
                    workflow: options.workflow,
                    stage: "pdf-ocr-page",
                    page,
                    mimeType: "image/png",
                  }
                : undefined,
          }),
        );
        if (text) fallbackPages.push(text);
        throwIfExtractionAborted(options?.signal);
      }
      if (options?.performance) {
        options.performance.ocrMs += Date.now() - ocrStartedAt;
      }
      if (fallbackPages.length > 0) {
        ocrCandidate = toCandidate(fallbackPages.join("\n\n"), true);
        if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
          return {
            ...ocrCandidate,
            coachPageHints: selectedCoachPageHints,
            pages: selectedPages,
            annotationLinks,
          };
        }
      }
    } catch {
      // Continue to best-candidate selection.
    }
  }

  const candidates = [workerCandidate, pdfJsCandidate, heuristicCandidate, ocrCandidate]
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
      coachPageHints: selectedCoachPageHints,
      pages: selectedPages,
      annotationLinks,
    };
  }

  const emptyQuality = analyzeTextQuality("");
  return {
    text: "",
    usedOcr: false,
    coachPageHints: selectedCoachPageHints,
    textQuality: "poor",
    qualitySignals: emptyQuality.signals,
    pages: selectedPages,
    annotationLinks,
  };
}

async function extractTextFromImage(
  buffer: Buffer,
  cache?: DiscoveryRequestCache,
  options?: { aiArtifact?: DiscoveryAiImageArtifact },
): Promise<string> {
  const run = async () => {
    const prepared = await sharp(buffer).resize(2200).grayscale().normalize().toBuffer();
    try {
      const text = await ocrBuffer(prepared);
      if (safeString(text)) return cleanExtractedText(text);
    } catch {
      // Fall through to OpenAI OCR.
    }
    const fallbackText = await openAiOcrTextFromImage(prepared, "image/png", options?.aiArtifact);
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

  const mapHeading =
    /(gym\s*layout|facility\s*map|floor\s*plan|venue\s*map|convention\s*center\s*map)/i.test(
      normalized,
    );
  const gymLabelCount = countPatternMatches(normalized, /\bgym\s*[a-f]\b/gi);
  const hallLabelCount = countPatternMatches(
    normalized,
    /\b(?:east|west|central|north|south)\s*hall\b/gi,
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
      /\b(registration|awards area|competition area|guest services|entrance|coffee bar)\b/gi,
    );
  const paragraphPenalty =
    normalized.length >= 800 && longLineCount >= 4 && textScore <= 2 && weakAnchorCount <= 2;

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
    summary.strongSignalCount >= 3 && (summary.gymLabelCount >= 1 || summary.hallLabelCount >= 2)
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
        3,
      )}|${item.h.toFixed(3)}`,
  ).slice(0, 24);
}

async function openAiExtractGymLayoutZones(
  buffer: Buffer,
  mimeType = "image/png",
  performance?: DiscoveryPerformance,
  artifact?: DiscoveryAiImageArtifact,
): Promise<GymLayoutZone[]> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return [];
  const model = resolveDiscoveryVisionModel();
  try {
    if (artifact) await persistVisionInputDebugArtifact(buffer, {
      ...artifact,
      mimeType: artifact?.mimeType || mimeType,
    });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        ...openAiChatCompatibilityParams(model, { temperature: 0 }),
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
                text: 'Return JSON with key "zones" where zones is an array of objects: {label:string, x:number, y:number, w:number, h:number, confidence:number}. Coordinates must be normalized 0..1 relative to the full image. Include only visible map regions such as gym labels, hall names, registration, guest services, entrances, competition area, and awards area. If unsure, return an empty array.',
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
  assignedGym: string,
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
    const cropWidth = Math.min(width - left, Math.max(32, Math.ceil(chosen.w * width) + padX * 2));
    const cropHeight = Math.min(
      height - top,
      Math.max(32, Math.ceil(chosen.h * height) + padY * 2),
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
  cache?: DiscoveryRequestCache,
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
  return cache ? getOrCreateWeakCacheValue(cache.optimizedDataUrl, buffer, run) : run();
}

async function scoreGymLayoutVisualSignal(buffer: Buffer): Promise<number> {
  try {
    const stats = await sharp(buffer).stats();
    const channels = pickArray(stats?.channels);
    if (!channels.length) return 0;
    const mean =
      channels.reduce((sum, channel) => sum + Number(channel?.mean || 0), 0) / channels.length;
    const stdev =
      channels.reduce((sum, channel) => sum + Number(channel?.stdev || 0), 0) / channels.length;
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
  },
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
    typeof options?.maxPages === "number" && options.maxPages > 0 ? options.maxPages : 20;
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
      const pageImage = await getPdfPageImage(buffer, page, options?.cache, {
        workflow: "gymnastics",
        stage: "pdf-raster-page",
        page,
        mimeType: "image/png",
      });
      if (!pageImage) continue;
      const pageText = await extractTextFromImage(pageImage, options?.cache, {
        aiArtifact: {
          workflow: "gymnastics",
          stage: "pdf-layout-ocr-page",
          page,
          mimeType: "image/png",
        },
      });
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
    } catch {}
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
      options?.performance,
      {
        workflow: "gymnastics",
        stage: "pdf-layout-page",
        page: candidate.page,
        mimeType: "image/png",
      },
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
    const deterministicAccepted = candidate.gymLabelCount >= 2 && candidate.hallLabelCount >= 1;
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
    options?.performance,
    {
      workflow: "gymnastics",
      stage: "pdf-layout-zones",
      page: selected.page,
      mimeType: "image/png",
    },
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
    },
  );
  const result = {
    dataUrl,
    facts,
    zones,
    page: selected.page,
    selection: {
      selectedPage: selected.page,
      reason:
        selected.acceptReason === "ai" ? "accepted_ai_layout" : "accepted_deterministic_strong_map",
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
  return decodeHtmlEntities(
    withBreaks
      .replace(/<[^>]+>/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function collectJsonLdMetadataStrings(value: unknown, snippets: string[], depth = 0): void {
  if (depth > 6 || value == null) return;
  if (typeof value === "string") return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdMetadataStrings(item, snippets, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  for (const key of ["name", "headline", "description", "alternateName"]) {
    const next = safeString(record[key]);
    if (next && next.length >= 6 && next.length <= 220 && !/^https?:\/\//i.test(next)) {
      snippets.push(decodeHtmlEntities(next));
    }
  }
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") {
      collectJsonLdMetadataStrings(nested, snippets, depth + 1);
    }
  }
}

function extractJsonLdMetadataText(html: string): string[] {
  const snippets: string[] = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (let match = jsonLdRegex.exec(html); match; match = jsonLdRegex.exec(html)) {
    const content = safeString(match[1]);
    if (!content) continue;
    try {
      const parsed = JSON.parse(content);
      collectJsonLdMetadataStrings(parsed, snippets);
    } catch {
      // Ignore malformed JSON-LD.
    }
  }
  return uniqueLines(snippets.filter(Boolean), 12);
}

function extractMetadataText(html: string): string {
  const snippets: string[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) snippets.push(stripHtml(titleMatch[1]));
  const metaRegex =
    /<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description|twitter:title|twitter:description)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let match = metaRegex.exec(html);
  while (match) {
    if (match[1]) snippets.push(stripHtml(match[1]));
    match = metaRegex.exec(html);
  }
  snippets.push(...extractJsonLdMetadataText(html));
  return uniqueLines(snippets.filter(Boolean), 12).join("\n\n");
}

function decodeHtmlEntities(input: string): string {
  return safeString(input)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => {
      const value = Number.parseInt(code, 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : _match;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const value = Number.parseInt(code, 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : _match;
    });
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

function normalizeResourceLinkLabel(label: string, url: string, contextText = ""): string {
  const cleanedLabel = safeString(label)
    .replace(/\s{2,}/g, " ")
    .trim();
  const normalizedContext = safeString(contextText)
    .replace(/\s{2,}/g, " ")
    .trim();
  const kind = classifyResourceLink(
    [cleanedLabel, normalizedContext].filter(Boolean).join(" "),
    url,
    null,
  );
  switch (kind) {
    case "travel_accommodation":
    case "hotel_booking":
      if (
        /\bhost hotels?\b/i.test(normalizedContext) &&
        !/\breserv|book/i.test(normalizedContext)
      ) {
        return "Host Hotels";
      }
      if (/\breserv|book/i.test(normalizedContext)) return "Hotel Reservations";
      return "Hotel Booking";
    case "photo_video":
      return "Photo / Video Order Form";
    case "apparel_form":
      return "Apparel Sizing Form";
    case "parking":
      if (/\bgarage\b/i.test(normalizedContext) && /\bdirection/i.test(normalizedContext)) {
        return "Parking Garage Directions";
      }
      if (/\bparking map\b|\blots? and garages?\b|\bwayfinding\b/i.test(normalizedContext)) {
        return "Parking Map";
      }
      return "Parking";
    default:
      if (cleanedLabel) return cleanedLabel;
      try {
        return fallbackLinkLabel(new URL(url));
      } catch {
        return "Resource link";
      }
  }
}

function extractLastHtmlMatch(html: string, pattern: RegExp): string {
  let last = "";
  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    const text = safeString(stripHtml(match[1] || ""));
    if (text) last = text;
  }
  return last;
}

function extractContainingHtmlBlock(
  html: string,
  anchorIndex: number,
  openTag: string,
  closeTag: string,
): string {
  const start = html.lastIndexOf(openTag, anchorIndex);
  const end = html.indexOf(closeTag, anchorIndex);
  if (start < 0 || end < 0 || end <= anchorIndex) return "";
  return html.slice(start, end + closeTag.length);
}

function isDiscoveryChromeHtml(value: string): boolean {
  const normalized = safeString(value).replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  return (
    /<(?:nav|header|footer|aside)\b/i.test(normalized) ||
    /\b(?:menu|navbar|breadcrumb|fusion-menu|fusion-mobile-menu|fusion-main-menu|fusion-header|fusion-footer|sub-menu)\b/i.test(
      normalized,
    ) ||
    /\bdisplay\s*:\s*none\b/i.test(normalized) ||
    /\baria-hidden\s*=\s*["']?true["']?/i.test(normalized)
  );
}

function shouldIgnoreDiscoveryAnchor(html: string, anchorIndex: number, rawAttrs: string): boolean {
  const directAttrs = safeString(rawAttrs);
  if (isDiscoveryChromeHtml(directAttrs)) return true;
  const surroundingBlocks = [
    extractContainingHtmlBlock(html, anchorIndex, "<nav", "</nav>"),
    extractContainingHtmlBlock(html, anchorIndex, "<header", "</header>"),
    extractContainingHtmlBlock(html, anchorIndex, "<footer", "</footer>"),
    extractContainingHtmlBlock(html, anchorIndex, "<aside", "</aside>"),
    extractContainingHtmlBlock(html, anchorIndex, "<ul", "</ul>"),
    extractContainingHtmlBlock(html, anchorIndex, "<li", "</li>"),
    extractContainingHtmlBlock(html, anchorIndex, "<div", "</div>"),
  ];
  return surroundingBlocks.some((block) => isDiscoveryChromeHtml(block));
}

function extractDiscoveryAnchorContext(
  html: string,
  anchorIndex: number,
): { heading: string; blockText: string; contextText: string } {
  const windowStart = Math.max(0, anchorIndex - 1800);
  const windowEnd = Math.min(html.length, anchorIndex + 1200);
  const before = html.slice(windowStart, anchorIndex);
  const heading =
    extractLastHtmlMatch(
      before,
      /<(?:h[1-6]|div)[^>]*class=["'][^"']*(?:sectionheader|section-header|sectiontitle|section-title|widgettitle|pageSectionHeader)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[1-6]|div)>/gi,
    ) ||
    extractLastHtmlMatch(before, /<(?:h[1-6]|strong|b)[^>]*>([\s\S]*?)<\/(?:h[1-6]|strong|b)>/gi);
  const blockHtml =
    extractContainingHtmlBlock(html, anchorIndex, "<p", "</p>") ||
    extractContainingHtmlBlock(html, anchorIndex, "<li", "</li>") ||
    extractContainingHtmlBlock(html, anchorIndex, "<td", "</td>") ||
    html.slice(windowStart, windowEnd);
  const blockText = safeString(stripHtml(blockHtml))
    .replace(/\b(?:click here(?: for .+?)?|here|open link|resource link)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const contextText = [heading, blockText].filter(Boolean).join(" ").trim();
  return { heading, blockText, contextText };
}

function deriveDiscoveryAnchorLabel(
  innerHtml: string,
  rawAttrs: string,
  url: URL,
  fullHtml: string,
  anchorIndex: number,
): string {
  const baseLabel = normalizeLinkLabel(innerHtml, rawAttrs, url);
  if (!looksLikeGenericResourceLabel(baseLabel)) return baseLabel;
  const context = extractDiscoveryAnchorContext(fullHtml, anchorIndex);
  const preferredLabel =
    (!looksLikeGenericResourceLabel(context.heading) && context.heading) || baseLabel;
  return normalizeResourceLinkLabel(preferredLabel, url.toString(), context.contextText);
}

function classifyDiscoveryLink(url: URL, baseUrl: URL): DiscoveryLinkKind {
  if (url.host !== baseUrl.host) return "external";
  return isAssetUrl(url) ? "asset" : "html";
}

function normalizeCanonicalUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = "";
    if (
      (url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")
    ) {
      url.port = "";
    }
    return url.toString();
  } catch {
    return safeString(input);
  }
}

const RESOURCE_STATUS_LABEL_PATTERN =
  /\((?:\s*(?:not yet posted|will be posted(?:\s+by)?[^)]*|posted[^)]*|updated[^)]*)\s*)\)/gi;

function toIsoDateOnly(value: Date | null): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

function extractAvailabilityText(label: string): string | null {
  const raw = safeString(label);
  if (!raw) return null;
  const parenMatches = [...raw.matchAll(/\(([^)]+)\)/g)]
    .map((match) => safeString(match[1]))
    .filter(Boolean);
  const parenthetical =
    parenMatches.find((item) => /(not yet posted|will be posted|posted|updated)/i.test(item)) || "";
  if (parenthetical) return parenthetical;
  const inlineMatch = raw.match(
    /\b(not yet posted|will be posted(?:\s+by)?[^,.;]*|posted[^,.;]*|updated[^,.;]*)\b/i,
  );
  return safeString(inlineMatch?.[1] || inlineMatch?.[0] || "") || null;
}

function parseAvailabilityDateFromText(
  availabilityText: string | null,
  referenceYear?: string | null,
): string | null {
  const raw = safeString(availabilityText);
  if (!raw) return null;
  const year =
    safeString(referenceYear).match(/\b(20\d{2})\b/)?.[1] || String(new Date().getFullYear());
  const referenceDate = new Date(`${year}-01-15T12:00:00.000Z`);
  const parsed = chrono.parseDate(raw, referenceDate, {
    forwardDate: false,
  });
  return toIsoDateOnly(parsed || null);
}

function parseResourceStatusFromLabel(
  label: string,
  options?: {
    referenceYear?: string | null;
  },
): {
  status: DiscoveryResourceStatus;
  cleanedLabel: string;
  availabilityText: string | null;
  availabilityDate: string | null;
} {
  const raw = safeString(label);
  const lowered = raw.toLowerCase();
  const availabilityText = extractAvailabilityText(raw);
  const status: DiscoveryResourceStatus = /(not yet posted|will be posted)/i.test(lowered)
    ? "not_posted"
    : /(posted|updated|available|live|book now|reserve now|buy now)/i.test(lowered)
      ? "available"
      : "unknown";
  const cleanedLabel = raw
    .replace(RESOURCE_STATUS_LABEL_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return {
    status,
    cleanedLabel: cleanedLabel || raw,
    availabilityText,
    availabilityDate: parseAvailabilityDateFromText(availabilityText, options?.referenceYear),
  };
}

function isTrustedExternalResourceUrl(input: string): boolean {
  try {
    const hostname = new URL(input).hostname.toLowerCase();
    return [
      "api.groupbook.io",
      "app.eventpipe.com",
      "eventpipe.com",
      "jotform.com",
      "form.jotform.com",
      "pci.jotform.com",
      "forms.office.com",
      "meetscoresonline.com",
      "results.scorecatonline.com",
    ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function classifyResourceLink(
  label: string,
  url: string,
  contentType?: string | null,
): DiscoveryResourceKind {
  const safeUrl = safeString(url);
  const safeLabel = safeString(label);
  const haystack = `${safeLabel} ${safeUrl} ${safeString(contentType)}`.toLowerCase();
  const pathname = (() => {
    try {
      return new URL(safeUrl).pathname.toLowerCase();
    } catch {
      return safeUrl.toLowerCase();
    }
  })();
  const assetLike = /\.pdf(\?|#|$)/i.test(safeUrl) || /pdf/i.test(safeString(contentType));
  const liveResultsDomain = /meetscoresonline\.com|results\.scorecatonline\.com/i.test(safeUrl);
  const rotationHubLike =
    /rotation-sheets\/?$/i.test(pathname) ||
    (/\brotation sheets?\b/i.test(haystack) && !assetLike && !liveResultsDomain);
  const resultsHubLike =
    /\/results\/?$/i.test(pathname) ||
    (/\bresults?\b/i.test(haystack) && !assetLike && !liveResultsDomain);

  if (
    /\bgroupbook\b/i.test(haystack) ||
    /\b(hotels?|lodging|travel|stay|booking|room block)\b/i.test(haystack)
  ) {
    return "travel_accommodation";
  }
  if (
    /\b(apparel|uniform|sizing|size)\b/i.test(haystack) &&
    /\b(form|e-form|eform|survey|office\.com|forms\.office\.com)\b/i.test(haystack)
  ) {
    return "apparel_form";
  }
  if (
    /\bjotform\b/i.test(haystack) ||
    (/\b(photo|video|picture|pictures|order photos?|photo\/video)\b/i.test(haystack) &&
      !/\b(media resources?|media release|pressbox|press box|press|media credential)\b/i.test(
        haystack,
      ))
  ) {
    return "photo_video";
  }
  if (liveResultsDomain || /\blive scoring\b/i.test(haystack)) {
    return "results_live";
  }
  if (rotationHubLike) {
    return "rotation_hub";
  }
  if (resultsHubLike) {
    return "results_hub";
  }
  if (/\brotation\b/i.test(haystack) && assetLike) {
    return "rotation_sheet";
  }
  if (/\b(result|results|score|scores)\b/i.test(haystack) && assetLike) {
    return "results_pdf";
  }
  if (
    /\b(packet|program|meet packet|info packet|schedule(?:\s*&|\s+and)?\s*info|schedule packet|meet info|information packet)\b/i.test(
      haystack,
    )
  ) {
    return "packet";
  }
  if (/\b(rosters?|athlete\s*&?\s*coach registration|athlete registration)\b/i.test(haystack)) {
    return "roster";
  }
  if (/\b(team divisions?|divisions?|session assignments?)\b/i.test(haystack)) {
    return "team_divisions";
  }
  if (/\b(admission|ticket|spectator|purchase|buy)\b/i.test(haystack)) {
    return "admission";
  }
  if (
    /\b(parking|garage|garages|parkmobile|arcgis|dashboard|lots and garages|rates info|parking map)\b/i.test(
      haystack,
    )
  ) {
    return "parking";
  }
  return "other";
}

const GYM_PUBLIC_ANNOUNCEMENT_PATTERN =
  /\b(urgent|reminder|delay|changed|change|closed|closing|today|tomorrow|tonight|this morning|this afternoon|this evening|weather|alert|update)\b/i;
const GYM_PUBLIC_ATTENDEE_TEXT_PATTERN =
  /\b(admission|ticket|spectator|adults?|children|child|under\s*\d|free|venue|address|parking|garage|drop[-\s]?off|ride[-\s]?share|accessible|accessibility|guest services|awards?|hotel|lodging|travel|results?|live scoring|map|doors open|arrival|welcome|hosted by|meet site|food|hydration|animals?|service animals?|photo|video|order form|apparel|sizing)\b/i;
const GYM_PUBLIC_OVERVIEW_TEXT_PATTERN =
  /\b(championships?|classic|invitational|state meet|regional meet|national meet|takes place|host(?:ed)? by|awards ceremon|team awards?|all around awards?)\b/i;
const GYM_COACH_OPS_TEXT_PATTERN =
  /\b(coach(?:es)?(?:\s+only)?|meet reservations?|membership verification|pro member|sign[-\s]?in|attire|competition floor access|scratches?|master rotation sheet|floor music|regional(?:s)?|qualification|entry fees?|late fee|meetmaker|payment instructions?|check payable|coach hospitality)\b/i;
const GYM_PUBLIC_DOCUMENT_PATTERN =
  /\b(faq|program|spectator guide|visitor guide|event guide|public document|order form|sizing form|apparel form|photo\s*\/?\s*video)\b/i;
const GYM_MIXED_DOCUMENT_PATTERN =
  /\b(packet|info packet|meet packet|schedule(?:\s*&|\s+and)?\s*info|schedule packet)\b/i;

function classifyGymPublicAudience(text: string): GymContentAudience {
  const normalized = safeString(text).replace(/\s+/g, " ").trim();
  if (!normalized) return "unknown";
  const lowered = normalized.toLowerCase();
  const hasCoachOps = GYM_COACH_OPS_TEXT_PATTERN.test(lowered);
  const hasPublicAttendee =
    GYM_PUBLIC_ATTENDEE_TEXT_PATTERN.test(lowered) ||
    GYM_PUBLIC_OVERVIEW_TEXT_PATTERN.test(lowered) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i.test(
      lowered,
    ) ||
    /\b\d{3,5}\s+[a-z0-9].*,\s*[a-z]{2}\s+\d{5}\b/i.test(lowered);
  if (hasCoachOps && hasPublicAttendee) return "mixed";
  if (hasCoachOps) return "coach_ops";
  if (hasPublicAttendee) return "public_attendee";
  if (GYM_MIXED_DOCUMENT_PATTERN.test(lowered)) return "mixed";
  return "unknown";
}

function classifyGymResourceRenderTarget(link: DiscoveryResourceLink): GymResourceRenderTarget {
  const audience = link.audience || classifyGymPublicAudience(`${link.label} ${link.url}`);
  const haystack = `${safeString(link.label)} ${safeString(link.url)}`.toLowerCase();
  if (audience === "coach_ops") {
    return "hidden";
  }
  if (
    link.kind === "roster" ||
    link.kind === "team_divisions" ||
    link.kind === "rotation_hub" ||
    link.kind === "rotation_sheet"
  ) {
    return "hidden";
  }
  if (link.kind === "hotel_booking" || link.kind === "travel_accommodation") return "hotels";
  if (link.kind === "results_hub" || link.kind === "results_live" || link.kind === "results_pdf") {
    return "results";
  }
  if (link.kind === "admission") return "admission";
  if (link.kind === "parking") return "traffic_parking";
  if (link.kind === "photo_video" || link.kind === "apparel_form") return "documents";
  if (audience === "unknown") return "hidden";
  if (GYM_PUBLIC_DOCUMENT_PATTERN.test(haystack)) return "documents";
  if (link.kind === "packet") {
    return audience === "public_attendee" && GYM_PUBLIC_DOCUMENT_PATTERN.test(haystack)
      ? "documents"
      : "hidden";
  }
  if (/venue|facility|guest services|entrance|map/i.test(haystack)) return "venue";
  return audience === "public_attendee" ? "meet_details" : "hidden";
}

function classifyGymAudienceText(
  text: unknown,
  source: GymAudienceClassifiedText["source"],
): GymAudienceClassifiedText | null {
  const normalized = safeString(text).replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return {
    text: normalized,
    audience: classifyGymPublicAudience(normalized),
    source,
  };
}

function filterPublicAudienceTexts(
  items: Array<unknown>,
  source: GymAudienceClassifiedText["source"],
  limit = 8,
): string[] {
  return uniqueBy(
    items
      .map((item) => classifyGymAudienceText(item, source))
      .filter((item): item is GymAudienceClassifiedText => Boolean(item))
      .filter((item) => item.audience === "public_attendee")
      .map((item) => item.text),
    (item) => item.toLowerCase(),
  ).slice(0, limit);
}

/**
 * Dedicated parse fields already carry an audience contract from the schema.
 * Reclassifying their values by keywords drops useful copy after labels such as
 * "Doors open" have been removed by the model (for example, "7:00 AM daily").
 */
function collectDedicatedPublicFieldTexts(
  items: Array<string | null | undefined>,
  limit = 8,
): string[] {
  return uniqueBy(
    items.map((item) => safeString(item).replace(/\s+/g, " ").trim()).filter(Boolean),
    (item) => item.toLowerCase(),
  ).slice(0, limit);
}

function formatDedicatedPublicFact(label: string, value: string | null | undefined): string {
  const text = safeString(value).replace(/\s+/g, " ").trim();
  if (!text) return "";
  const normalizedText = text.toLowerCase();
  const normalizedLabel = label.toLowerCase();
  if (
    normalizedText === normalizedLabel ||
    normalizedText.startsWith(`${normalizedLabel}:`) ||
    normalizedText.startsWith(`${normalizedLabel} `)
  ) {
    return text;
  }
  return `${label}: ${text}`;
}

function isTransientPublicAnnouncement(text: string): boolean {
  const normalized = safeString(text).replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const audience = classifyGymPublicAudience(normalized);
  if (audience !== "public_attendee") return false;
  if (
    /\b(schedule|coaches?|results?|admission|venue|host hotels?|packet|document|live scoring)\b/i.test(
      normalized,
    )
  ) {
    return false;
  }
  return GYM_PUBLIC_ANNOUNCEMENT_PATTERN.test(normalized);
}

const EVENT_TOKEN_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "from",
  "gymnastics",
  "meet",
  "the",
  "to",
  "usa",
  "usag",
  "with",
  "www",
  "com",
]);

const EVENT_MATCH_GENERIC_TOKENS = new Set([
  "event",
  "events",
  "championship",
  "championships",
  "classic",
  "competition",
  "competitions",
  "cup",
  "gymnastics",
  "invitational",
  "level",
  "levels",
  "meet",
  "meets",
  "men",
  "mens",
  "open",
  "regional",
  "regionals",
  "region",
  "session",
  "sessions",
  "state",
  "states",
  "team",
  "teams",
  "usa",
  "usag",
  "women",
  "womens",
  "xcel",
]);

function normalizeEventTokens(value: string): string[] {
  return uniqueBy(
    safeString(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 || /^\d$/.test(token))
      .filter((token) => !EVENT_TOKEN_STOP_WORDS.has(token)),
    (item) => item,
  );
}

function filterSpecificEventTokens(tokens: string[]): string[] {
  return uniqueBy(
    tokens
      .map((token) => safeString(token).toLowerCase())
      .filter(Boolean)
      .filter((token) => !EVENT_MATCH_GENERIC_TOKENS.has(token))
      .filter((token) => !/^20\d{2}$/.test(token))
      .filter((token) => !/^\d+$/.test(token)),
    (item) => item,
  );
}

function isFingerprintSignalLine(line: string): boolean {
  const normalized = safeString(line).replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  if (/https?:\/\/|www\./i.test(normalized)) return false;
  if (
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?(?:,\s*\d{4})?\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(normalized)) return true;
  if (
    /\b(?:convention center|arena|center|centre|complex|gym|gymnasium|fieldhouse|venue|coliseum|civic center|sportsplex|resort|hotel)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/\b[A-Za-z.' -]+,\s*[A-Z]{2}\b/.test(normalized)) return true;
  if (
    /\b(?:street|st|road|rd|drive|dr|avenue|ave|boulevard|blvd|lane|ln|court|ct|way)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  return false;
}

function buildEventFingerprint(
  rootUrl: URL,
  pageTitle: string | null,
  metadataText: string,
  readableText: string,
): EventFingerprint {
  const slug = decodeURIComponent(rootUrl.pathname)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const readableLines = safeString(readableText)
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter((line) => line.length >= 8 && line.length <= 140);
  const signalLines = readableLines.filter((line) => isFingerprintSignalLine(line));
  const firstMeaningfulLines = (signalLines.length > 0 ? signalLines : readableLines)
    .slice(0, 6)
    .join(" ");
  const titleSource = [safeString(pageTitle), slug, firstMeaningfulLines].filter(Boolean).join(" ");
  const titleTokens = normalizeEventTokens(titleSource);
  const slugTokens = normalizeEventTokens(slug);
  const addressMatch =
    readableText.match(
      /\b\d{2,6}\s+[A-Za-z0-9.\-'\s]+,\s*[A-Za-z.\-'\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/,
    ) || null;
  const locationTokens = normalizeEventTokens(
    [addressMatch?.[0], metadataText, firstMeaningfulLines].filter(Boolean).join(" "),
  );
  const dateRange =
    classifyMeetDateCandidates(`${safeString(pageTitle)}\n${metadataText}\n${readableText}`)
      .primary || deriveDateRangeFromText(`${safeString(pageTitle)} ${readableText}`);
  const startDate = dateRange?.startDate || null;
  const endDate = dateRange?.endDate || dateRange?.startDate || null;
  return {
    rootUrl: rootUrl.toString(),
    slugTokens,
    titleTokens,
    locationTokens,
    startDate,
    endDate,
    year: startDate?.slice(0, 4) || endDate?.slice(0, 4) || null,
  };
}

function scoreEventResourceMatch(
  fingerprint: EventFingerprint,
  candidateText: string,
  candidateLabel: string,
  candidateUrl: string,
): EventResourceMatch {
  const text = [candidateLabel, candidateUrl, candidateText].filter(Boolean).join("\n");
  const candidateTokens = normalizeEventTokens(text);
  const candidateTokenSet = new Set(candidateTokens);
  const overlappingTitleTokens = fingerprint.titleTokens.filter((token) =>
    candidateTokenSet.has(token),
  );
  const overlappingSlugTokens = fingerprint.slugTokens.filter((token) =>
    candidateTokenSet.has(token),
  );
  const overlappingLocationTokens = filterSpecificEventTokens(
    fingerprint.locationTokens.filter((token) => candidateTokenSet.has(token)),
  );
  const specificOverlapTokens = filterSpecificEventTokens([
    ...overlappingTitleTokens,
    ...overlappingSlugTokens,
  ]);
  const candidateDate = classifyMeetDateCandidates(text).primary || deriveDateRangeFromText(text);

  if (
    fingerprint.startDate &&
    fingerprint.endDate &&
    candidateDate?.startDate &&
    candidateDate?.endDate &&
    !(
      candidateDate.endDate >= fingerprint.startDate &&
      candidateDate.startDate <= fingerprint.endDate
    )
  ) {
    return {
      score: -10,
      passes: false,
      hardReject: true,
      reason: `rejected: conflicting dates (${candidateDate.label || candidateDate.startDate})`,
    };
  }

  let score = 0;
  const reasons: string[] = [];
  if (candidateDate?.startDate && fingerprint.startDate) {
    score += 5;
    reasons.push("date_overlap");
  } else if (fingerprint.year && new RegExp(`\\b${fingerprint.year}\\b`).test(text)) {
    score += 2;
    reasons.push("year_match");
  }
  if (overlappingTitleTokens.length >= 4) {
    score += 4;
    reasons.push(`title_tokens:${overlappingTitleTokens.length}`);
  } else if (overlappingTitleTokens.length >= 2) {
    score += 2;
    reasons.push(`title_tokens:${overlappingTitleTokens.length}`);
  }
  if (overlappingSlugTokens.length >= 2) {
    score += 2;
    reasons.push(`slug_tokens:${overlappingSlugTokens.length}`);
  }
  if (overlappingLocationTokens.length >= 2) {
    score += 2;
    reasons.push(`location_tokens:${overlappingLocationTokens.length}`);
  } else if (overlappingLocationTokens.length === 1) {
    score += 1;
    reasons.push("location_hint");
  }

  let passes = score >= 4;
  if (
    passes &&
    specificOverlapTokens.length === 0 &&
    overlappingLocationTokens.length === 0 &&
    !candidateDate?.startDate
  ) {
    passes = false;
    reasons.push("generic_token_overlap_only");
  }
  return {
    score,
    passes,
    hardReject: false,
    reason: reasons.join(", ") || "insufficient match signals",
  };
}

function shouldTreatResourceAsTrustedHtmlFetch(resource: DiscoveryResourceLink): boolean {
  return (
    (["travel_accommodation", "hotel_booking", "photo_video", "results_live"].includes(
      resource.kind,
    ) &&
      isTrustedExternalResourceUrl(resource.url)) ||
    ["roster", "team_divisions", "rotation_hub", "results_hub"].includes(resource.kind)
  );
}

function shouldFollowDiscoveryChildPage(
  candidate: CrawlCandidate,
  fingerprint: EventFingerprint,
): boolean {
  if (candidate.kind !== "html" || !candidate.sameHost) return false;
  const candidateUrl = safeString(candidate.url);
  const candidateLabel = safeString(candidate.label);
  const haystack = `${candidateLabel} ${candidateUrl}`;
  const pathname = (() => {
    try {
      return new URL(candidateUrl).pathname.toLowerCase();
    } catch {
      return candidateUrl.toLowerCase();
    }
  })();

  if (
    /^\/?(?:|news|history|contact|about|blog|photos?|videos?|gallery|media|results?)\/?$/i.test(
      pathname,
    ) ||
    /\b(home|news|history|contact|about|blog|gallery|media)\b/i.test(candidateLabel)
  ) {
    return false;
  }

  if (
    /\b(info|details|schedule|venue|parking|hotel|travel|faq|packet|document|program|admission|ticket|rotation|result|roster|division|session assignment)\b/i.test(
      haystack,
    )
  ) {
    return true;
  }

  const match = scoreEventResourceMatch(fingerprint, "", candidateLabel, candidateUrl);
  return match.passes;
}

function upsertResourceLink(
  map: Map<string, DiscoveryResourceLink>,
  resource: DiscoveryResourceLink,
) {
  const key = `${resource.kind}|${normalizeCanonicalUrl(resource.url)}`;
  const existing = map.get(key);
  if (!existing) {
    map.set(key, resource);
    return;
  }
  const merged: DiscoveryResourceLink =
    (resource.matchScore || 0) > (existing.matchScore || 0)
      ? { ...existing, ...resource }
      : { ...resource, ...existing };
  merged.followed = existing.followed || resource.followed;
  merged.contentType = resource.contentType || existing.contentType || null;
  merged.availabilityText = resource.availabilityText || existing.availabilityText || null;
  merged.availabilityDate = resource.availabilityDate || existing.availabilityDate || null;
  merged.discoveryMethod =
    resource.discoveryMethod === "playwright" || existing.discoveryMethod === "playwright"
      ? "playwright"
      : "http";
  merged.matchScore =
    resource.matchScore == null
      ? existing.matchScore
      : existing.matchScore == null
        ? resource.matchScore
        : Math.max(existing.matchScore, resource.matchScore);
  merged.matchReason = resource.matchReason || existing.matchReason || null;
  merged.audience =
    merged.audience ||
    resource.audience ||
    existing.audience ||
    classifyGymPublicAudience(`${merged.label} ${merged.url}`);
  merged.renderTarget =
    merged.renderTarget ||
    resource.renderTarget ||
    existing.renderTarget ||
    classifyGymResourceRenderTarget(merged);
  if (existing.status === "not_posted" || resource.status === "not_posted") {
    merged.status = "not_posted";
  } else if (existing.status === "available" || resource.status === "available") {
    merged.status = "available";
  } else {
    merged.status = "unknown";
  }
  map.set(key, merged);
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
  if (
    candidate.kind === "html" &&
    /\/(?:about-us|contact|gymnastics-blog)\/?$/i.test(candidate.url)
  ) {
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

function scoreResourceFollowUpPriority(resource: DiscoveryResourceLink, rootHost: string): number {
  let score = 0;
  const sameHost = (() => {
    try {
      return new URL(resource.url).host === rootHost;
    } catch {
      return false;
    }
  })();
  const isPdf =
    /\.pdf(\?|#|$)/i.test(resource.url) || /pdf/i.test(safeString(resource.contentType));
  const kindWeight: Record<DiscoveryResourceKind, number> = {
    packet: 24,
    roster: 22,
    team_divisions: 18,
    rotation_sheet: 16,
    rotation_hub: 15,
    results_pdf: 14,
    results_live: 12,
    results_hub: 11,
    admission: 5,
    parking: 4,
    travel_accommodation: 2,
    hotel_booking: 2,
    photo_video: 1,
    apparel_form: 1,
    other: 0,
  };
  score += kindWeight[resource.kind] || 0;
  if (sameHost) score += 14;
  if (isPdf) score += 8;
  if (resource.origin === "root") score += 4;
  if (resource.status === "not_posted") score -= 6;
  if (resource.followed) score -= 20;
  return score;
}

function compareResourceLinksForFollowUp(
  a: DiscoveryResourceLink,
  b: DiscoveryResourceLink,
  rootHost: string,
): number {
  const scoreDelta =
    scoreResourceFollowUpPriority(b, rootHost) - scoreResourceFollowUpPriority(a, rootHost);
  if (scoreDelta !== 0) return scoreDelta;
  const matchDelta = (b.matchScore || 0) - (a.matchScore || 0);
  if (matchDelta !== 0) return matchDelta;
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
  for (let match = anchorRegex.exec(html); match; match = anchorRegex.exec(html)) {
    const rawAttrs = `${match[1] || ""} ${match[3] || ""}`;
    if (shouldIgnoreDiscoveryAnchor(html, match.index || 0, rawAttrs)) continue;
    const url = linkUrlFromHref(baseUrl, match[2] || "");
    if (!url) continue;
    if (url.href === baseUrl.href) continue;
    const kind = classifyDiscoveryLink(url, baseUrl);
    const sameHost = url.host === baseUrl.host;
    const anchorIndex = match.index || 0;
    const rawAnchorText = safeString(stripHtml(match[4] || ""));
    const looksTravelish =
      /\b(hotel|lodging|travel|host\s+hotel|reservations?|book(?:\s+here)?|rooms?)\b/i.test(
        `${rawAnchorText} ${url.toString()}`,
      ) || /\b(hotel|lodging|travel|reservations?|book)\b/i.test(rawAttrs);
    const context = looksTravelish ? extractDiscoveryAnchorContext(html, anchorIndex) : null;
    const candidateBase = {
      url: url.toString(),
      label: deriveDiscoveryAnchorLabel(match[4] || "", rawAttrs, url, html, anchorIndex),
      sourceUrl: baseUrl.toString(),
      contextText: context?.contextText || null,
      sectionHeading: context?.heading || null,
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

function toCrawlCandidateFromBrowserDiscovery(
  candidate: {
    label: string;
    url: string;
    sourceUrl: string;
    depth: 0 | 1;
    sameHost: boolean;
    contentType?: string | null;
    contextText?: string | null;
  },
  rootUrl: URL,
): CrawlCandidate | null {
  const normalizedUrl = normalizeUrl(candidate.url);
  if (!normalizedUrl) return null;
  const resolvedUrl = new URL(normalizedUrl);
  const kind = candidate.sameHost
    ? isAssetUrl(resolvedUrl) || /pdf|image\//i.test(safeString(candidate.contentType))
      ? "asset"
      : "html"
    : "external";
  const baseCandidate: Omit<CrawlCandidate, "score" | "followed"> = {
    url: normalizedUrl,
    label: normalizeResourceLinkLabel(
      safeString(candidate.label) || fallbackLinkLabel(resolvedUrl),
      normalizedUrl,
      `${safeString(candidate.contextText)} ${safeString(candidate.label)}`,
    ),
    sourceUrl: normalizeUrl(candidate.sourceUrl) || rootUrl.toString(),
    contextText: safeString(candidate.contextText) || null,
    sectionHeading: null,
    depth: candidate.depth,
    kind,
    sameHost: candidate.sameHost,
  };
  return {
    ...baseCandidate,
    followed: candidate.depth > 0,
    contentType: safeString(candidate.contentType) || null,
    score: scoreDiscoveryCandidate(baseCandidate),
  };
}

function titleCaseWords(value: string): string {
  return safeString(value)
    .split(/\s+/)
    .map((part) => (part ? `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}` : ""))
    .join(" ")
    .trim();
}

function fallbackLabelFromPdfAnnotation(url: URL): string {
  const inferredKind = classifyResourceLink("", url.toString(), null);
  switch (inferredKind) {
    case "travel_accommodation":
    case "hotel_booking":
      return "Hotel Booking";
    case "photo_video":
      return "Photo / Video Order Form";
    case "apparel_form":
      return "Apparel Sizing Form";
    case "results_live":
    case "results_hub":
    case "results_pdf":
      return "Results";
    case "rotation_hub":
    case "rotation_sheet":
      return "Rotation Sheets";
    case "packet":
      return "Schedule & Info";
    case "roster":
      return "Rosters";
    case "team_divisions":
      return "Team Divisions";
    case "admission":
      return "Admission";
    case "parking":
      return "Parking";
    default:
      break;
  }

  const pathLabel = titleCaseWords(
    decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_]+/g, " "),
  );
  return pathLabel || fallbackLinkLabel(url);
}

function looksLikeGenericResourceLabel(label: string): boolean {
  const normalized = safeString(label).replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  return /^(?:click here(?: for .+)?|here|resource link|open link|link|website)$/i.test(normalized);
}

function splitPdfPageLinesForLabeling(pageText: string): string[] {
  return cleanExtractedText(pageText)
    .split(/\n+/)
    .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeUrlForLooseSearch(url: string): string[] {
  const normalized = normalizeUrl(url);
  if (!normalized) return [];
  try {
    const parsed = new URL(normalized);
    const pathname = decodeURIComponent(parsed.pathname).replace(/\/+$/, "");
    return uniqueBy(
      [
        normalized.toLowerCase(),
        `${parsed.hostname}${pathname}`.toLowerCase(),
        parsed.hostname.toLowerCase(),
        pathname.toLowerCase(),
        `${parsed.hostname}${pathname}`.replace(/^www\./, "").toLowerCase(),
      ].filter(Boolean),
      (item) => item,
    );
  } catch {
    return [normalized.toLowerCase()];
  }
}

function inferKindBasedPdfLabel(
  kind: DiscoveryResourceKind,
  pageText: string,
  url: string,
): string {
  const normalizedPageText = safeString(pageText).replace(/\s+/g, " ").trim();
  switch (kind) {
    case "parking":
      if (/pay by (?:mobile|phone)|mobile app/i.test(normalizedPageText)) {
        return "Pay By Phone Parking";
      }
      if (/\brates?\b/i.test(normalizedPageText)) return "Parking Rates";
      if (/\blots and garages\b|\bparking map\b/i.test(normalizedPageText)) {
        return "Parking Map";
      }
      return "Parking";
    case "travel_accommodation":
    case "hotel_booking":
      if (/click here for all host hotels|host hotels?/i.test(normalizedPageText)) {
        return "Host Hotels";
      }
      if (/\breservations link\b/i.test(normalizedPageText)) {
        return "Reservations Link";
      }
      if (/\bhost hotel information\b/i.test(normalizedPageText)) {
        return "Host Hotel Information";
      }
      if (/\bgroup hotel\b/i.test(normalizedPageText)) return "Group Hotel";
      return "Hotel Booking";
    case "results_live":
      return /live scoring/i.test(normalizedPageText) ? "Live Scoring" : "Results";
    case "results_hub":
    case "results_pdf":
      if (/event info and results|complete meet results/i.test(normalizedPageText)) {
        return "Event Info & Results";
      }
      return "Official Results";
    case "rotation_hub":
    case "rotation_sheet":
      if (/master rotation sheet/i.test(normalizedPageText)) {
        return "Master Rotation Sheet";
      }
      return "Rotation Sheets";
    case "packet":
      if (/schedule & team entries|competition schedule/i.test(normalizedPageText)) {
        return "Competition Schedule";
      }
      return "Schedule & Info Packet";
    case "roster":
      return "Rosters";
    case "team_divisions":
      return /session assignments?/i.test(normalizedPageText)
        ? "Session Assignments"
        : "Team Divisions";
    case "admission":
      if (/\bpre[-\s]?sale\b|\bpurchase\b|\bsquare\.site\b/i.test(`${normalizedPageText} ${url}`)) {
        return "Admission Pre-Sale";
      }
      return "Admission";
    case "photo_video":
      return "Photo / Video Order Form";
    case "apparel_form":
      return "Apparel Sizing Form";
    default:
      if (/visit lauderdale|visit gainesville|visitor guide/i.test(normalizedPageText)) {
        return "Visitor Guide";
      }
      break;
  }
  try {
    return fallbackLabelFromPdfAnnotation(new URL(url));
  } catch {
    return "Resource link";
  }
}

function derivePdfAnnotationLabel(
  link: PdfAnnotationLink,
  pages: Array<{ num: number; text: string }> = [],
): string {
  const explicitLabel = safeString(link.label);
  const pageText =
    safeString(pages.find((page) => Number(page?.num) === Number(link.pageNumber))?.text || "") ||
    "";
  if (explicitLabel && !looksLikeGenericResourceLabel(explicitLabel)) {
    return explicitLabel;
  }

  const lines = splitPdfPageLinesForLabeling(pageText);
  const looseTargets = normalizeUrlForLooseSearch(link.url);
  const exactTargets = looseTargets.filter((target) => target.includes("/"));
  const broadTargets = looseTargets.filter((target) => !exactTargets.includes(target));
  const findMatchingIndex = (targets: string[]) =>
    lines.findIndex((line) => {
      const lowered = line.toLowerCase();
      return targets.some((target) => target && lowered.includes(target));
    });
  const matchingIndex =
    findMatchingIndex(exactTargets) >= 0
      ? findMatchingIndex(exactTargets)
      : findMatchingIndex(broadTargets);

  if (matchingIndex >= 0) {
    const matchingLine = safeString(lines[matchingIndex]);
    const prefixLabel = safeString(
      matchingLine
        .replace(/https?:\/\/[^\s)]+/gi, "")
        .replace(/www\.[^\s)]+/gi, "")
        .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s),;!?]*)?\b/gi, "")
        .replace(/\s+/g, " ")
        .replace(/[:\-–—]\s*$/g, ""),
    );
    if (prefixLabel && !looksLikeGenericResourceLabel(prefixLabel)) {
      return prefixLabel;
    }
    const previousLine = safeString(lines[matchingIndex - 1]);
    if (
      previousLine &&
      previousLine.length <= 96 &&
      !/https?:\/\/|www\./i.test(previousLine) &&
      !looksLikeGenericResourceLabel(previousLine)
    ) {
      return previousLine.replace(/[:\-–—]\s*$/g, "").trim();
    }
  }

  if (/click here for all host hotels|host hotels?|reservations link|group hotel/i.test(pageText)) {
    return inferKindBasedPdfLabel("hotel_booking", pageText, link.url);
  }
  if (/pre[-\s]?sale|spectator admissions?|tickets?/i.test(pageText)) {
    return inferKindBasedPdfLabel("admission", pageText, link.url);
  }
  if (
    /for event info and results|live scoring|official results|complete meet results/i.test(pageText)
  ) {
    return inferKindBasedPdfLabel("results_hub", pageText, link.url);
  }
  if (
    /location of lots and garages|pay by (?:mobile|phone)|parking rates|parking map/i.test(pageText)
  ) {
    return inferKindBasedPdfLabel("parking", pageText, link.url);
  }
  if (/apparel sizing form|sizing e-form|complete the sizing/i.test(pageText)) {
    return inferKindBasedPdfLabel("apparel_form", pageText, link.url);
  }
  if (/rotation sheets?|master rotation sheet/i.test(pageText)) {
    return inferKindBasedPdfLabel("rotation_hub", pageText, link.url);
  }
  if (/session assignments?|team rosters?|birth date divisions/i.test(pageText)) {
    return inferKindBasedPdfLabel("team_divisions", pageText, link.url);
  }

  const inferredKind = classifyResourceLink(explicitLabel, link.url, null);
  return inferKindBasedPdfLabel(inferredKind, pageText, link.url);
}

function toCrawlCandidateFromPdfAnnotation(
  link: PdfAnnotationLink,
  assetUrl: URL,
  rootUrl: URL,
  pages: Array<{ num: number; text: string }>,
): CrawlCandidate | null {
  const normalizedUrl = normalizeUrl(link.url);
  if (!normalizedUrl || normalizedUrl === assetUrl.toString()) return null;
  const resolvedUrl = new URL(normalizedUrl);
  const kind = classifyDiscoveryLink(resolvedUrl, rootUrl);
  const baseCandidate = {
    url: normalizedUrl,
    label: derivePdfAnnotationLabel(link, pages) || fallbackLabelFromPdfAnnotation(resolvedUrl),
    sourceUrl: assetUrl.toString(),
    depth: 1 as const,
    kind,
    sameHost: resolvedUrl.host === rootUrl.host,
  };
  return {
    ...baseCandidate,
    followed: false,
    contentType: null,
    score: scoreDiscoveryCandidate(baseCandidate),
  };
}

function buildHtmlTextChunk(pageUrl: string, metadataText: string, readableText: string): string {
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

function looksLikeDiscoveryPlaceholderTitle(title: string): boolean {
  const normalized = safeString(title);
  if (!normalized) return true;
  if (/^(gymnastics meet|football event|event)$/i.test(normalized)) return true;
  return /^[a-z0-9.-]+\.(?:com|org|net|io|co|us|info)\s+(?:Meet|Football)$/i.test(normalized);
}

function looksLikeDiscoverySectionTitle(title: string): boolean {
  const normalized = decodeHtmlEntities(safeString(title)).replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  if (
    /^(?:club and general information|general information|club information|coach information|parent information|meet information|session information|registration information|spectator information|travel information|parking information)$/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (
    /^(?:club|general|coach|parent|meet|session|registration|spectator|travel|parking|venue|facility|schedule|admission|awards?|results?|logistics|policies?)\s+(?:information|details?)$/i.test(
      normalized,
    )
  ) {
    return true;
  }
  return false;
}

function scoreDiscoveryTitleFragment(value: string): number {
  const candidate = decodeHtmlEntities(safeString(value)).replace(/\s+/g, " ").trim();
  if (!candidate) return Number.NEGATIVE_INFINITY;
  if (looksLikeDiscoverySectionTitle(candidate)) return -8;
  if (
    /^(skip to content|search for:?|menu|home|about us|events?|registration|results?|contact|blog|resources?)$/i.test(
      candidate,
    )
  ) {
    return -10;
  }
  let score = 0;
  if (
    /\b(?:championship|championships|classic|invite|invitational|regional|state|national|gymnastics|xcel|level|cup|open|festival|meet)\b/i.test(
      candidate,
    )
  ) {
    score += 6;
  }
  if (/\b20\d{2}\b/.test(candidate)) score += 3;
  if (/\b(?:women'?s|men'?s|boys|girls|jr\.?|sr\.?)\b/i.test(candidate)) score += 1;
  if (candidate.length >= 12 && candidate.length <= 100) score += 2;
  if (
    /^[A-Z][a-z]+ \d{1,2}(?:-\d{1,2})?, 20\d{2}$/i.test(candidate) ||
    /\b\d{2,6}\s+[A-Za-z0-9.'-]+\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|boulevard|blvd\.?|lane|ln\.?|way|court|ct\.?)\b/i.test(
      candidate,
    ) ||
    /\b(?:arena|gymnasium|convention center|fieldhouse|drive|street|avenue|boulevard|road)\b/i.test(
      candidate,
    )
  ) {
    score -= 4;
  }
  if (
    /\b(?:www\.)?[a-z0-9-]+\.(?:com|org|net|io|co|us|info)\b/i.test(candidate) ||
    /^(usa competitions|event info|event information)$/i.test(candidate)
  ) {
    score -= 6;
  }
  return score;
}

function deriveDiscoveryFallbackTitle(
  extractedText: string,
  extractionMeta?: ExtractionResult["extractionMeta"] | null,
): string {
  const candidates = [
    safeString(extractionMeta?.pageTitle),
    ...safeString(extractedText)
      .split(/\n+/)
      .map((line) => decodeHtmlEntities(safeString(line)).replace(/\s+/g, " ").trim())
      .filter((line) => line.length >= 6 && line.length <= 120)
      .slice(0, 12),
  ];
  const fragments = uniqueBy(
    candidates.flatMap((candidate) =>
      candidate.split(/\s(?:\||-|—|–|:)\s/g).map((part) => part.trim()),
    ),
    (item) => item.toLowerCase(),
  );
  const best = fragments
    .map((value) => ({ value, score: scoreDiscoveryTitleFragment(value) }))
    .sort((a, b) => b.score - a.score)[0];
  if (best && best.score >= 4) return best.value;

  const fallback = candidates
    .map((value) => value.replace(/\s+/g, " ").trim())
    .find(
      (value) =>
        !looksLikeDiscoveryPlaceholderTitle(value) && scoreDiscoveryTitleFragment(value) >= 1,
    );
  return fallback || "";
}

function normalizeDiscoveryTitleForCompare(value: string): string {
  return decodeHtmlEntities(safeString(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveDiscoveryEventTitle(parsedTitle: string, fallbackTitle: string): string {
  const normalizedParsed = safeString(parsedTitle);
  const normalizedFallback = safeString(fallbackTitle);
  if (!normalizedParsed) return normalizedFallback;
  if (!normalizedFallback) return normalizedParsed;
  if (looksLikeDiscoveryPlaceholderTitle(normalizedParsed)) return normalizedFallback;
  if (looksLikeDiscoverySectionTitle(normalizedParsed)) return normalizedFallback;
  const parsedKey = normalizeDiscoveryTitleForCompare(normalizedParsed);
  const fallbackKey = normalizeDiscoveryTitleForCompare(normalizedFallback);
  if (!parsedKey) return normalizedFallback;
  if (!fallbackKey) return normalizedParsed;
  if (parsedKey === fallbackKey) return normalizedFallback;
  if (parsedKey.includes(fallbackKey) && /\s(?:\||-|—|–)\s/.test(normalizedParsed)) {
    return normalizedFallback;
  }
  return normalizedParsed;
}

async function fetchWithLimit(
  url: string,
  options?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<{ contentType: string; buffer: Buffer; text: string }> {
  const controller = new AbortController();
  const abortFromSignal = () => controller.abort(options?.signal?.reason);
  const timeoutMs =
    typeof options?.timeoutMs === "number" &&
    Number.isFinite(options.timeoutMs) &&
    options.timeoutMs > 0
      ? Math.max(250, Math.min(12_000, Math.floor(options.timeoutMs)))
      : 12_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeout);
      throwIfExtractionAborted(options.signal);
    }
    options.signal.addEventListener("abort", abortFromSignal, { once: true });
  }
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EnvitefyBot/1.0; +https://envitefy.com)",
      },
      cache: "no-store",
    });
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
    throwIfExtractionAborted(options?.signal);
    return { contentType, buffer, text };
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener("abort", abortFromSignal);
  }
}

function getUrlDiscoveryHooks(): Required<UrlDiscoveryTestHooks> {
  return {
    fetchWithLimit: urlDiscoveryTestHooks?.fetchWithLimit || fetchWithLimit,
    collectBrowserData: urlDiscoveryTestHooks?.collectBrowserData || collectDiscoveryBrowserData,
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

function isMissingPlaywrightBrowserError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return (
    (/chromium/i.test(message) && /executable|install/i.test(message)) ||
    /playwright install/i.test(message)
  );
}

async function appendFetchedAssetText(
  assetUrl: URL,
  fetched: { contentType: string; buffer: Buffer; text: string },
  accumulators: {
    rootUrl: URL;
    referenceYear: string | null;
    linkedChunks: string[];
    linkedMeta: Array<{ url: string; contentType: string }>;
    discoveredLinkMap: Map<string, CrawlCandidate>;
    resourceLinkMap: Map<string, DiscoveryResourceLink>;
    usedOcr: boolean;
    highConfidencePdfFound: boolean;
    gymLayoutImageDataUrl: string | null;
    gymLayoutPage: number | null;
    gymLayoutFacts: string[];
    gymLayoutZones: GymLayoutZone[];
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    coachPageHints: CoachPageHint[];
  },
  hooks: Required<UrlDiscoveryTestHooks>,
  options: NormalizedDiscoveryExtractionOptions,
  context: {
    discoveryMethod: "http" | "playwright";
  },
  crawlBudget: {
    deadlineAt: number;
    onBudgetExhausted: (stage: string) => void;
  },
  requestCache?: DiscoveryRequestCache,
) {
  throwIfExtractionAborted(options.signal);
  const assetUrlString = assetUrl.toString();
  const resolveRemainingAssetBudget = (stage: string): number | null => {
    const remainingMs = remainingBudgetMs(crawlBudget.deadlineAt);
    if (remainingMs > 0) return remainingMs;
    crawlBudget.onBudgetExhausted(stage);
    return null;
  };
  accumulators.linkedMeta.push({ url: assetUrl.toString(), contentType: fetched.contentType });
  if (/pdf/i.test(fetched.contentType) || /\.pdf(\?|#|$)/i.test(assetUrl.pathname)) {
    const pdfBudgetMs = resolveRemainingAssetBudget(`asset_parse:${assetUrlString}`);
    if (pdfBudgetMs == null) return;
    const assetParseStartedAt = Date.now();
    logDiscoveryDebug("[meet-discovery] asset parse started", {
      url: assetUrlString,
      contentType: fetched.contentType || "application/pdf",
      assetType: "pdf",
      budgetMs: pdfBudgetMs,
    });
    const parsed = await hooks.extractTextFromPdf(fetched.buffer, {
      budgetMs: pdfBudgetMs,
      performance: options.performance,
      cache: requestCache,
      mode: options.mode,
      signal: options.signal,
    });
    throwIfExtractionAborted(options.signal);
    logDiscoveryDebug("[meet-discovery] asset parse finished", {
      url: assetUrlString,
      contentType: fetched.contentType || "application/pdf",
      assetType: "pdf",
      durationMs: Date.now() - assetParseStartedAt,
      textChars: parsed.text.length,
      usedOcr: parsed.usedOcr,
    });
    if (parsed.textQuality === "good" && parsed.text.length >= 1500) {
      accumulators.highConfidencePdfFound = true;
    }
    accumulators.linkedChunks.push(parsed.text);
    accumulators.usedOcr = accumulators.usedOcr || parsed.usedOcr;
    accumulators.coachPageHints = uniqueBy(
      [...accumulators.coachPageHints, ...parsed.coachPageHints],
      (item) => `${item.page}|${item.heading}|${item.excerpt}`,
    );
    for (const annotationLink of pickArray(parsed.annotationLinks)) {
      const discovered = toCrawlCandidateFromPdfAnnotation(
        annotationLink as PdfAnnotationLink,
        assetUrl,
        accumulators.rootUrl,
        pickArray(parsed.pages)
          .map((page) => ({
            num: Number(page?.num) || 0,
            text: safeString(page?.text || ""),
          }))
          .filter((page) => page.num > 0 && page.text),
      );
      if (!discovered) continue;
      upsertDiscoveredLink(accumulators.discoveredLinkMap, discovered);
      const resource = buildResourceLinkFromCandidate(discovered, "linked_asset", null, {
        referenceYear: accumulators.referenceYear,
        discoveryMethod: context.discoveryMethod,
      });
      if (resource) {
        upsertResourceLink(accumulators.resourceLinkMap, resource);
      }
    }
    if (
      options.workflow === "gymnastics" &&
      options.mode === "enrich" &&
      !accumulators.gymLayoutImageDataUrl
    ) {
      const layoutBudgetMs = resolveRemainingAssetBudget(`asset_layout:${assetUrlString}`);
      if (layoutBudgetMs == null) return;
      const layout = await hooks.extractGymLayoutImageFromPdf(fetched.buffer, {
        maxPages: GYM_LAYOUT_PDF_MAX_PAGES,
        maxAiCandidates: 2,
        performance: options.performance,
        budgetMs: layoutBudgetMs,
        cache: requestCache,
      });
      throwIfExtractionAborted(options.signal);
      accumulators.gymLayoutImageDataUrl = layout.dataUrl;
      accumulators.gymLayoutPage = layout.page;
      accumulators.gymLayoutFacts = uniqueLines(
        [...accumulators.gymLayoutFacts, ...layout.facts],
        14,
      );
      accumulators.gymLayoutZones = normalizeGymLayoutZones(layout.zones);
      if (layout.selection) {
        accumulators.gymLayoutSelection = layout.selection;
      }
    }
    return;
  }

  if (
    /image\/(png|jpe?g|webp)/i.test(fetched.contentType) ||
    /\.(png|jpe?g|webp)(\?|#|$)/i.test(assetUrl.pathname)
  ) {
    const imageBudgetMs = resolveRemainingAssetBudget(`asset_parse:${assetUrlString}`);
    if (imageBudgetMs == null) return;
    const assetParseStartedAt = Date.now();
    logDiscoveryDebug("[meet-discovery] asset parse started", {
      url: assetUrlString,
      contentType: fetched.contentType || "image/png",
      assetType: "image",
      budgetMs: imageBudgetMs,
    });
    const imageText = await hooks.extractTextFromImage(fetched.buffer, requestCache);
    throwIfExtractionAborted(options.signal);
    logDiscoveryDebug("[meet-discovery] asset parse finished", {
      url: assetUrlString,
      contentType: fetched.contentType || "image/png",
      assetType: "image",
      durationMs: Date.now() - assetParseStartedAt,
      textChars: imageText.length,
      usedOcr: true,
    });
    accumulators.linkedChunks.push(imageText);
    accumulators.usedOcr = true;
    if (
      options.workflow === "gymnastics" &&
      options.mode === "enrich" &&
      !accumulators.gymLayoutImageDataUrl &&
      looksLikeGymLayoutText(imageText)
    ) {
      if (resolveRemainingAssetBudget(`asset_layout:${assetUrlString}`) == null) return;
      accumulators.gymLayoutImageDataUrl = await hooks.toOptimizedImageDataUrl(
        fetched.buffer,
        requestCache,
      );
      if (resolveRemainingAssetBudget(`asset_layout_zones:${assetUrlString}`) == null) return;
      accumulators.gymLayoutZones = await hooks.openAiExtractGymLayoutZones(
        fetched.buffer,
        fetched.contentType || "image/png",
        options.performance,
      );
      throwIfExtractionAborted(options.signal);
    }
    if (options.workflow === "gymnastics") {
      accumulators.gymLayoutFacts = uniqueLines(
        [...accumulators.gymLayoutFacts, ...extractHallFactsFromText(imageText)],
        14,
      );
    }
  }
}

function buildFetchedHtmlTextChunk(
  pageUrl: string,
  fetched: { contentType: string; text: string; buffer: Buffer },
): {
  text: string;
  pageTitle: string | null;
  readableText: string;
  metadataText: string;
} {
  const html = fetched.text || fetched.buffer.toString("utf8");
  const metadataText = extractMetadataText(html);
  const readableText = stripHtml(html);
  return {
    text: buildHtmlTextChunk(pageUrl, metadataText, readableText),
    pageTitle: getPageTitle(html),
    readableText,
    metadataText,
  };
}

function buildResourceLinkFromCandidate(
  candidate: Pick<CrawlCandidate, "label" | "url" | "sourceUrl" | "followed">,
  origin: DiscoveryResourceOrigin,
  contentType?: string | null,
  options?: { referenceYear?: string | null; discoveryMethod?: "http" | "playwright" },
): DiscoveryResourceLink | null {
  const normalizedUrl = normalizeUrl(candidate.url);
  if (!normalizedUrl) return null;
  const { status, cleanedLabel, availabilityText, availabilityDate } = parseResourceStatusFromLabel(
    candidate.label,
    {
      referenceYear: options?.referenceYear,
    },
  );
  const kind = classifyResourceLink(cleanedLabel || candidate.label, normalizedUrl, contentType);
  if (kind === "other") return null;
  const baseResource: DiscoveryResourceLink = {
    kind,
    status,
    label: cleanedLabel || candidate.label || "Resource link",
    url: normalizedUrl,
    sourceUrl: normalizeUrl(candidate.sourceUrl) || candidate.sourceUrl,
    contextText: safeString((candidate as any).contextText) || null,
    sectionHeading: safeString((candidate as any).sectionHeading) || null,
    origin,
    contentType: safeString(contentType) || null,
    followed: Boolean(candidate.followed),
    matchScore: origin === "root" ? 10 : null,
    matchReason: origin === "root" ? "root_direct_resource" : null,
    availabilityText,
    availabilityDate,
    discoveryMethod: options?.discoveryMethod || "http",
  };
  baseResource.audience = classifyGymPublicAudience(
    `${baseResource.label} ${baseResource.url} ${baseResource.sourceUrl || ""}`,
  );
  baseResource.renderTarget = classifyGymResourceRenderTarget(baseResource);
  return baseResource;
}

async function fetchResourceCandidateText(
  resource: DiscoveryResourceLink,
  hooks: Required<UrlDiscoveryTestHooks>,
  options: NormalizedDiscoveryExtractionOptions,
  crawlBudget: {
    deadlineAt: number;
    onBudgetExhausted: (stage: string) => void;
  },
  requestCache?: DiscoveryRequestCache,
): Promise<{ contentType: string; text: string } | null> {
  const remainingFetchBudgetMs = remainingBudgetMs(crawlBudget.deadlineAt);
  if (remainingFetchBudgetMs <= 0) {
    crawlBudget.onBudgetExhausted(`hub_candidate_fetch:${resource.url}`);
    return null;
  }
  try {
    const fetched = await hooks.fetchWithLimit(resource.url, {
      timeoutMs: remainingFetchBudgetMs,
      signal: options.signal,
    });
    throwIfExtractionAborted(options.signal);
    if (
      /text\/html|text\/plain|application\/json|application\/ld\+json/i.test(fetched.contentType)
    ) {
      const htmlChunk = buildFetchedHtmlTextChunk(resource.url, fetched);
      return {
        contentType: fetched.contentType || "text/html",
        text: [safeString(htmlChunk.pageTitle), htmlChunk.readableText, htmlChunk.metadataText]
          .filter(Boolean)
          .join("\n"),
      };
    }
    if (/pdf/i.test(fetched.contentType) || /\.pdf(\?|#|$)/i.test(resource.url)) {
      const remainingParseBudgetMs = remainingBudgetMs(crawlBudget.deadlineAt);
      if (remainingParseBudgetMs <= 0) {
        crawlBudget.onBudgetExhausted(`hub_candidate_parse:${resource.url}`);
        return null;
      }
      const parsed = await hooks.extractTextFromPdf(fetched.buffer, {
        budgetMs: remainingParseBudgetMs,
        performance: options.performance,
        cache: requestCache,
        mode: options.mode,
        signal: options.signal,
      });
      throwIfExtractionAborted(options.signal);
      return {
        contentType: fetched.contentType || "application/pdf",
        text: parsed.text,
      };
    }
    if (/image\/(png|jpe?g|webp)/i.test(fetched.contentType)) {
      return {
        contentType: fetched.contentType,
        text: await hooks.extractTextFromImage(fetched.buffer, requestCache),
      };
    }
    return {
      contentType: fetched.contentType || "",
      text: safeString(fetched.text || ""),
    };
  } catch {
    return null;
  }
}

async function resolveHubResourceLinks(
  hubResource: DiscoveryResourceLink,
  fingerprint: EventFingerprint,
  hooks: Required<UrlDiscoveryTestHooks>,
  options: NormalizedDiscoveryExtractionOptions,
  crawlBudget: {
    deadlineAt: number;
    onBudgetExhausted: (stage: string) => void;
  },
  requestCache?: DiscoveryRequestCache,
): Promise<DiscoveryResourceLink[]> {
  throwIfExtractionAborted(options.signal);
  const hubResolveStartedAt = Date.now();
  const finalizeHubResolve = (resolved: DiscoveryResourceLink[]) => {
    logDiscoveryDebug("[meet-discovery] hub resolve finished", {
      url: hubResource.url,
      kind: hubResource.kind,
      durationMs: Date.now() - hubResolveStartedAt,
      promotedCount: resolved.length,
    });
    return resolved;
  };
  logDiscoveryDebug("[meet-discovery] hub resolve started", {
    url: hubResource.url,
    kind: hubResource.kind,
  });
  const remainingHubBudgetMs = remainingBudgetMs(crawlBudget.deadlineAt);
  if (remainingHubBudgetMs <= 0) {
    crawlBudget.onBudgetExhausted(`hub_resolve:${hubResource.url}`);
    return finalizeHubResolve([]);
  }
  let hubFetched: { contentType: string; buffer: Buffer; text: string } | null = null;
  try {
    hubFetched = await hooks.fetchWithLimit(hubResource.url, {
      timeoutMs: remainingHubBudgetMs,
      signal: options.signal,
    });
  } catch {
    return finalizeHubResolve([]);
  }
  throwIfExtractionAborted(options.signal);
  if (
    !hubFetched ||
    !/text\/html|text\/plain|application\/json|application\/ld\+json/i.test(hubFetched.contentType)
  ) {
    return finalizeHubResolve([]);
  }
  const hubUrl = new URL(hubResource.url);
  const hubHtml = hubFetched.text || hubFetched.buffer.toString("utf8");
  const hubCandidates = collectDiscoveryCandidates(hubHtml, hubUrl, 1)
    .sort(compareDiscoveryCandidates)
    .slice(0, 16);
  const resolved: DiscoveryResourceLink[] = [];

  for (const candidate of hubCandidates) {
    throwIfExtractionAborted(options.signal);
    if (isBudgetExhausted(crawlBudget.deadlineAt)) {
      crawlBudget.onBudgetExhausted(`hub_resolve:${hubResource.url}`);
      break;
    }
    const baseResource = buildResourceLinkFromCandidate(
      { ...candidate, followed: false },
      "hub_descendant",
      candidate.contentType || null,
      {
        referenceYear: fingerprint.year,
        discoveryMethod: "http",
      },
    );
    if (!baseResource) continue;
    if (
      hubResource.kind === "results_hub" &&
      !["results_live", "results_pdf", "results_hub"].includes(baseResource.kind)
    ) {
      continue;
    }
    if (
      hubResource.kind === "rotation_hub" &&
      !["rotation_sheet", "rotation_hub"].includes(baseResource.kind)
    ) {
      continue;
    }
    if (
      (hubResource.kind === "travel_accommodation" || hubResource.kind === "hotel_booking") &&
      !["travel_accommodation", "hotel_booking"].includes(baseResource.kind)
    ) {
      continue;
    }
    const sameHostAsHub = (() => {
      try {
        return new URL(baseResource.url).host === hubUrl.host;
      } catch {
        return false;
      }
    })();
    if (!sameHostAsHub && !isTrustedExternalResourceUrl(baseResource.url)) {
      continue;
    }
    const fetchedText = await fetchResourceCandidateText(
      baseResource,
      hooks,
      options,
      crawlBudget,
      requestCache,
    );
    throwIfExtractionAborted(options.signal);
    const match = scoreEventResourceMatch(
      fingerprint,
      fetchedText?.text || `${candidate.label}\n${candidate.url}`,
      candidate.label,
      candidate.url,
    );
    if (match.hardReject) continue;
    const shouldAcceptTravelHubDescendant =
      (hubResource.kind === "travel_accommodation" || hubResource.kind === "hotel_booking") &&
      ["travel_accommodation", "hotel_booking"].includes(baseResource.kind);
    if (!shouldAcceptTravelHubDescendant && !match.passes) continue;
    resolved.push({
      ...baseResource,
      contentType: fetchedText?.contentType || baseResource.contentType || null,
      followed: Boolean(fetchedText),
      status: hubResource.status === "not_posted" ? "available" : baseResource.status,
      matchScore: match.score,
      matchReason: match.reason,
    });
  }

  return finalizeHubResolve(resolved.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)));
}

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const parsed = parseDataUrlBase64(dataUrl);
  if (!parsed) return null;
  try {
    return {
      mimeType: parsed.mimeType,
      buffer: Buffer.from(parsed.base64Payload, "base64"),
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
    pageTemplateId: DEFAULT_NEW_GYM_MEET_TEMPLATE_ID,
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
        pendingResources: [],
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
        hotelInfo: "",
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
  options?: DiscoveryExtractionOptions,
): Promise<ExtractionResult> {
  const resolvedOptions = normalizeDiscoveryExtractionOptions(options, input.type);
  throwIfExtractionAborted(resolvedOptions.signal);
  const performance = resolvedOptions.performance;
  const requestCache = createDiscoveryRequestCache();
  if (input.type === "file") {
    const parsed = input.dataUrl ? parseDataUrl(input.dataUrl) : null;
    if (!parsed) throw new Error("Invalid file payload");
    const mime = (parsed.mimeType || input.mimeType || "").toLowerCase();
    if (/pdf/.test(mime)) {
      const { text, usedOcr, coachPageHints, textQuality, qualitySignals, pages, annotationLinks } =
        await extractTextFromPdf(parsed.buffer, {
          budgetMs: resolvedOptions.budgetMs,
          performance,
          cache: requestCache,
          mode: resolvedOptions.mode,
          workflow: resolvedOptions.workflow,
          signal: resolvedOptions.signal,
        });
      throwIfExtractionAborted(resolvedOptions.signal);
      const shouldRunGymnasticsEnrichment =
        resolvedOptions.workflow === "gymnastics" && resolvedOptions.mode === "enrich";
      const gymLayout = shouldRunGymnasticsEnrichment
        ? await extractGymLayoutImageFromPdf(parsed.buffer, {
            maxPages: GYM_LAYOUT_PDF_MAX_PAGES,
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
      throwIfExtractionAborted(resolvedOptions.signal);
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
        },
      );
      const referenceYear =
        classifyMeetDateCandidates(text).primary?.startDate?.slice(0, 4) ||
        deriveDateRangeFromText(text).startDate?.slice(0, 4) ||
        null;
      const fileRootUrl = new URL("https://envitefy.local/discovery/file.pdf");
      const discoveredLinkMap = new Map<string, CrawlCandidate>();
      const resourceLinkMap = new Map<string, DiscoveryResourceLink>();
      for (const annotationLink of pickArray(annotationLinks)) {
        throwIfExtractionAborted(resolvedOptions.signal);
        const pageAssetUrl = new URL(
          `https://envitefy.local/discovery/file-page-${Number(annotationLink?.pageNumber) || 1}.pdf`,
        );
        const discovered = toCrawlCandidateFromPdfAnnotation(
          annotationLink as PdfAnnotationLink,
          pageAssetUrl,
          fileRootUrl,
          pages,
        );
        if (!discovered) continue;
        upsertDiscoveredLink(discoveredLinkMap, discovered);
        const resource = buildResourceLinkFromCandidate(discovered, "linked_asset", null, {
          referenceYear,
          discoveryMethod: "http",
        });
        if (resource) {
          upsertResourceLink(resourceLinkMap, resource);
        }
      }
      const discoveredLinks = [...discoveredLinkMap.values()]
        .sort(compareDiscoveryCandidates)
        .slice(0, MAX_DISCOVERED_LINKS)
        .map(({ score: _score, ...item }) => item);
      const resourceLinks = [...resourceLinkMap.values()]
        .sort((a, b) => {
          const scoreDelta = (b.matchScore || 0) - (a.matchScore || 0);
          if (scoreDelta !== 0) return scoreDelta;
          const kindDelta = a.kind.localeCompare(b.kind);
          if (kindDelta !== 0) return kindDelta;
          return a.url.localeCompare(b.url);
        })
        .slice(0, MAX_DISCOVERED_LINKS);
      const travelAccommodationCandidates = detectTravelAccommodationCandidates({
        source: "pdf",
        extractedText: text,
        pages: pages.map((page) => ({
          pageNumber: Number(page?.num) || null,
          text: safeString(page?.text),
        })),
        links: resourceLinks.map((item) => ({
          label: item.label,
          url: item.url,
          sourceUrl: item.sourceUrl,
          contextText: item.contextText || null,
          sectionHeading: item.sectionHeading || null,
        })),
      });
      const pdfTravelHotels = extractHotelObjectsFromPdf({ extractedText: text, pages: pages.map(page => ({ pageNumber: page.num, text: page.text })) }, travelAccommodationCandidates);
      const travelAccommodationResult = buildTravelAccommodationResult({
        candidates: travelAccommodationCandidates,
        pdfHotels: pdfTravelHotels,
        webHotels: [],
      });
      return {
        extractedText: text,
        extractionMeta: {
          sourceType: "file",
          annotationLinks: annotationLinks.map(link => ({ ...link, label: derivePdfAnnotationLabel(link, pages), contextText: link.contextText || link.label })),
          accommodationPageTexts: pages.map(page => ({ pageNumber: page.num, text: page.text })),
          usedOcr,
          linkedAssets: [],
          discoveredLinks,
          resourceLinks,
          crawledPages: [],
          gymLayoutImageDataUrl: gymLayout.dataUrl || null,
          gymLayoutFacts: combinedLayoutFacts,
          gymLayoutZones: gymLayout.zones,
          gymLayoutPage: gymLayout.page,
          gymLayoutSelection: gymLayout.selection,
          coachPageHints,
          travelAccommodationCandidates,
          travelAccommodationSignals: uniqueBy(
            travelAccommodationCandidates.flatMap((item) => item.signals || []),
            (item) => item,
          ),
          travelAccommodationSummary: {
            pdfHotels: pdfTravelHotels,
            fallbackLink: travelAccommodationResult.fallbackLink,
            confidence: travelAccommodationResult.confidence,
          },
          textQuality,
          qualitySignals,
        },
        performance,
      };
    }
    if (/image\/(png|jpe?g|webp)/.test(mime)) {
      const text = await extractTextFromImage(parsed.buffer, requestCache);
      throwIfExtractionAborted(resolvedOptions.signal);
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
            performance,
          )
        : [];
      throwIfExtractionAborted(resolvedOptions.signal);
      const gymLayoutFacts =
        resolvedOptions.workflow === "gymnastics" ? extractHallFactsFromText(text) : [];
      return {
        extractedText: quality.cleanedText,
        extractionMeta: {
          sourceType: "file",
          usedOcr: true,
          linkedAssets: [],
          discoveredLinks: [],
          resourceLinks: [],
          crawledPages: [],
          gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
          gymLayoutFacts,
          gymLayoutZones,
          gymLayoutPage: null,
          textQuality: quality.quality,
          qualitySignals: quality.signals,
        },
        performance,
      };
    }
    throw new Error("Unsupported file type for discovery");
  }

  const url = new URL(input.url);
  const hooks = getUrlDiscoveryHooks();
  logDiscoveryDebug("[meet-discovery] url root fetch started", {
    url: url.toString(),
    budgetMs: resolvedOptions.budgetMs,
    workflow: resolvedOptions.workflow,
    mode: resolvedOptions.mode,
  });
  const page = await hooks.fetchWithLimit(url.toString(), { signal: resolvedOptions.signal });
  throwIfExtractionAborted(resolvedOptions.signal);
  logDiscoveryDebug("[meet-discovery] url root fetch finished", {
    url: url.toString(),
    contentType: page.contentType || null,
    textChars: page.text?.length || 0,
    bytes: page.buffer.length,
  });
  const html = page.text || page.buffer.toString("utf8");
  const readable = stripHtml(html);
  const metadata = extractMetadataText(html);
  const pageTitle = getPageTitle(html);
  const rootCandidates = collectDiscoveryCandidates(html, url, 0);
  const fingerprint = buildEventFingerprint(url, pageTitle, metadata, readable);
  const linkedChunks: string[] = [];
  const htmlChunks: string[] = [buildHtmlTextChunk(url.toString(), metadata, readable)];
  const linkedMeta: Array<{ url: string; contentType: string }> = [];
  const discoveredLinkMap = new Map<string, CrawlCandidate>();
  const resourceLinkMap = new Map<string, DiscoveryResourceLink>();
  const crawledPages: CrawledPage[] = [{ url: url.toString(), title: pageTitle, depth: 0 }];
  const crawledPageKeys = new Set([`${url.toString()}|0`]);
  const fetchedAssetUrls = new Set<string>();
  const fetchedCanonicalUrls = new Set<string>();
  let usedOcr = false;
  let gymLayoutImageDataUrl: string | null = null;
  let gymLayoutPage: number | null = null;
  let gymLayoutFacts: string[] = [];
  let gymLayoutZones: GymLayoutZone[] = [];
  let gymLayoutSelection: GymLayoutSelectionDiagnostics | undefined;
  let coachPageHints: CoachPageHint[] = [];

  for (const candidate of rootCandidates) {
    throwIfExtractionAborted(resolvedOptions.signal);
    upsertDiscoveredLink(discoveredLinkMap, candidate);
    const resource = buildResourceLinkFromCandidate(candidate, "root", null, {
      referenceYear: fingerprint.year,
      discoveryMethod: "http",
    });
    if (resource) {
      upsertResourceLink(resourceLinkMap, resource);
    }
  }
  logDiscoveryDebug("[meet-discovery] url root candidates collected", {
    url: url.toString(),
    rootCandidateCount: rootCandidates.length,
    seededResourceCount: resourceLinkMap.size,
  });
  const crawlDeadlineAt = deadlineAt(resolvedOptions.budgetMs);
  let crawlBudgetExhaustedLogged = false;
  const logCrawlBudgetExhausted = (stage: string) => {
    if (crawlBudgetExhaustedLogged) return;
    crawlBudgetExhaustedLogged = true;
    logDiscoveryDebug("[meet-discovery] budget exhausted, skipping remaining follow-ups", {
      url: url.toString(),
      stage,
      budgetMs: resolvedOptions.budgetMs,
    });
  };
  const hasFollowUpBudget = (stage: string) => {
    if (!isBudgetExhausted(crawlDeadlineAt)) return true;
    logCrawlBudgetExhausted(stage);
    return false;
  };
  const getRemainingFollowUpBudgetMs = (stage: string) => {
    const remainingMs = remainingBudgetMs(crawlDeadlineAt);
    if (remainingMs > 0) return remainingMs;
    logCrawlBudgetExhausted(stage);
    return 0;
  };
  const crawlBudget = {
    deadlineAt: crawlDeadlineAt,
    onBudgetExhausted: logCrawlBudgetExhausted,
  };

  const accumulators = {
    rootUrl: url,
    referenceYear: fingerprint.year,
    linkedChunks,
    linkedMeta,
    discoveredLinkMap,
    resourceLinkMap,
    usedOcr,
    highConfidencePdfFound: false,
    gymLayoutImageDataUrl,
    gymLayoutPage,
    gymLayoutFacts,
    gymLayoutZones,
    gymLayoutSelection,
    coachPageHints,
  };
  const resolveDiscoveryMethodForUrl = (targetUrl: string): "http" | "playwright" =>
    [...resourceLinkMap.values()].find(
      (item) => normalizeCanonicalUrl(item.url) === normalizeCanonicalUrl(targetUrl),
    )?.discoveryMethod || "http";

  const browserCollector = urlDiscoveryTestHooks?.collectBrowserData || collectDiscoveryBrowserData;
  const shouldRunBrowserDiscovery =
    !urlDiscoveryTestHooks?.fetchWithLimit || Boolean(urlDiscoveryTestHooks?.collectBrowserData);
  const browserDiscoveryBudgetMs = Math.min(
    getRemainingFollowUpBudgetMs("browser_discovery"),
    2_000,
  );
  if (shouldRunBrowserDiscovery && browserDiscoveryBudgetMs >= 750) {
    const browserDiscoveryStartedAt = Date.now();
    logDiscoveryDebug("[meet-discovery] browser discovery started", {
      url: url.toString(),
      maxChildPages: 3,
      budgetMs: browserDiscoveryBudgetMs,
    });
    try {
      const browserDiscovery = await browserCollector(url.toString(), {
        maxChildPages: 3,
        timeoutMs: browserDiscoveryBudgetMs,
      });
      throwIfExtractionAborted(resolvedOptions.signal);
      for (const browserCandidate of browserDiscovery.candidates) {
        throwIfExtractionAborted(resolvedOptions.signal);
        const normalizedCandidate = toCrawlCandidateFromBrowserDiscovery(browserCandidate, url);
        if (!normalizedCandidate) continue;
        upsertDiscoveredLink(discoveredLinkMap, normalizedCandidate);
        const resource = buildResourceLinkFromCandidate(
          normalizedCandidate,
          normalizedCandidate.depth === 0 ? "root" : "child_page",
          normalizedCandidate.contentType || null,
          {
            referenceYear: fingerprint.year,
            discoveryMethod: "playwright",
          },
        );
        if (resource) {
          upsertResourceLink(resourceLinkMap, resource);
        }
      }
      for (const browserPage of browserDiscovery.pages) {
        throwIfExtractionAborted(resolvedOptions.signal);
        if (!browserPage.text) continue;
        const pageKey = `${browserPage.url}|${browserPage.depth}`;
        if (!crawledPageKeys.has(pageKey)) {
          crawledPages.push({
            url: browserPage.url,
            title: browserPage.title,
            depth: browserPage.depth,
          });
          crawledPageKeys.add(pageKey);
        }
        if (browserPage.depth > 0) {
          htmlChunks.push(
            buildHtmlTextChunk(browserPage.url, browserPage.title || "", browserPage.text),
          );
        }
      }
      logDiscoveryDebug("[meet-discovery] browser discovery finished", {
        url: url.toString(),
        durationMs: Date.now() - browserDiscoveryStartedAt,
        candidateCount: browserDiscovery.candidates.length,
        pageCount: browserDiscovery.pages.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "");
      if (isMissingPlaywrightBrowserError(error)) {
        warnDiscoveryDebug("[meet-discovery] playwright browser discovery unavailable, skipping", {
          url: url.toString(),
          message,
        });
      } else {
        warnDiscoveryDebug("[meet-discovery] playwright browser discovery failed", {
          url: url.toString(),
          message,
        });
      }
    }
  } else if (shouldRunBrowserDiscovery && browserDiscoveryBudgetMs > 0) {
    logDiscoveryDebug("[meet-discovery] browser discovery skipped", {
      url: url.toString(),
      reason: "insufficient_budget",
      budgetMs: browserDiscoveryBudgetMs,
    });
  }

  const fetchAssetCandidate = async (candidate: CrawlCandidate) => {
    throwIfExtractionAborted(resolvedOptions.signal);
    if (fetchedAssetUrls.has(candidate.url)) return;
    if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) return;
    const fetchBudgetMs = getRemainingFollowUpBudgetMs(`asset_fetch:${candidate.url}`);
    if (fetchBudgetMs <= 0) return;
    const assetFetchStartedAt = Date.now();
    logDiscoveryDebug("[meet-discovery] asset fetch started", {
      url: candidate.url,
      label: candidate.label,
      budgetMs: fetchBudgetMs,
    });
    try {
      const fetched = await hooks.fetchWithLimit(candidate.url, {
        timeoutMs: fetchBudgetMs,
        signal: resolvedOptions.signal,
      });
      throwIfExtractionAborted(resolvedOptions.signal);
      logDiscoveryDebug("[meet-discovery] asset fetch finished", {
        url: candidate.url,
        contentType: fetched.contentType || null,
        durationMs: Date.now() - assetFetchStartedAt,
        bytes: fetched.buffer.length,
      });
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
        {
          discoveryMethod: resolveDiscoveryMethodForUrl(candidate.url),
        },
        crawlBudget,
        requestCache,
      );
    } catch {
      // Best-effort linked assets.
    }
  };

  const appendCanonicalResourceToText = async (resource: DiscoveryResourceLink) => {
    throwIfExtractionAborted(resolvedOptions.signal);
    const canonicalUrl = normalizeCanonicalUrl(resource.url);
    if (fetchedCanonicalUrls.has(canonicalUrl)) return;
    const sameHost = (() => {
      try {
        return new URL(resource.url).host === url.host;
      } catch {
        return false;
      }
    })();
    if (!sameHost && !isTrustedExternalResourceUrl(resource.url)) return;
    const fetchBudgetMs = getRemainingFollowUpBudgetMs(`resource_fetch:${resource.url}`);
    if (fetchBudgetMs <= 0) return;
    const assetLike =
      /pdf|image\//i.test(safeString(resource.contentType)) || isAssetUrl(resource.url);
    if (assetLike) {
      logDiscoveryDebug("[meet-discovery] asset fetch started", {
        url: resource.url,
        label: resource.label,
        budgetMs: fetchBudgetMs,
      });
    }
    const fetchStartedAt = Date.now();
    try {
      const fetched = await hooks.fetchWithLimit(resource.url, {
        timeoutMs: fetchBudgetMs,
        signal: resolvedOptions.signal,
      });
      throwIfExtractionAborted(resolvedOptions.signal);
      if (assetLike || /pdf|image\//i.test(fetched.contentType)) {
        logDiscoveryDebug("[meet-discovery] asset fetch finished", {
          url: resource.url,
          contentType: fetched.contentType || null,
          durationMs: Date.now() - fetchStartedAt,
          bytes: fetched.buffer.length,
        });
      }
      fetchedCanonicalUrls.add(canonicalUrl);
      upsertResourceLink(resourceLinkMap, {
        ...resource,
        followed: true,
        contentType: fetched.contentType || resource.contentType || null,
      });
      if (
        /text\/html|text\/plain|application\/json|application\/ld\+json/i.test(fetched.contentType)
      ) {
        const htmlChunk = buildFetchedHtmlTextChunk(resource.url, fetched);
        linkedMeta.push({ url: resource.url, contentType: fetched.contentType || "text/html" });
        linkedChunks.push(htmlChunk.text);
        return;
      }
      if (/pdf|image\//i.test(fetched.contentType) || isAssetUrl(resource.url)) {
        fetchedAssetUrls.add(resource.url);
        await appendFetchedAssetText(
          new URL(resource.url),
          fetched,
          accumulators,
          hooks,
          resolvedOptions,
          {
            discoveryMethod: resource.discoveryMethod,
          },
          crawlBudget,
          requestCache,
        );
      }
    } catch {
      // Best-effort canonical resource fetching.
    }
  };

  const shouldContinueFetchingAssets = () => {
    if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) return false;
    if (!accumulators.highConfidencePdfFound) return true;
    if (resolvedOptions.workflow === "gymnastics" && resolvedOptions.mode === "enrich") {
      return !accumulators.gymLayoutImageDataUrl;
    }
    return false;
  };

  const fetchAssetCandidates = async (candidates: CrawlCandidate[]) => {
    for (let index = 0; index < candidates.length; index += 2) {
      throwIfExtractionAborted(resolvedOptions.signal);
      if (!hasFollowUpBudget("asset_fetch_batch")) break;
      if (!shouldContinueFetchingAssets()) break;
      await Promise.all(
        candidates.slice(index, index + 2).map((candidate) => fetchAssetCandidate(candidate)),
      );
    }
  };

  await fetchAssetCandidates(
    [...discoveredLinkMap.values()]
      .filter((candidate) => candidate.kind === "asset" && candidate.depth === 0)
      .sort(compareDiscoveryCandidates),
  );

  for (const resource of [...resourceLinkMap.values()].sort((a, b) =>
    compareResourceLinksForFollowUp(a, b, url.host),
  )) {
    throwIfExtractionAborted(resolvedOptions.signal);
    if (!hasFollowUpBudget("resource_follow_up")) break;
    if (shouldTreatResourceAsTrustedHtmlFetch(resource)) {
      await appendCanonicalResourceToText(resource);
    }
  }

  for (const childPage of [...discoveredLinkMap.values()]
    .filter((candidate) => shouldFollowDiscoveryChildPage(candidate, fingerprint))
    .sort(compareDiscoveryCandidates)) {
    throwIfExtractionAborted(resolvedOptions.signal);
    if (!hasFollowUpBudget("child_page_fetch")) break;
    if (crawledPages.length - 1 >= MAX_FOLLOWED_CHILD_PAGES) break;
    const childPageKey = `${childPage.url}|1`;
    if (crawledPageKeys.has(childPageKey)) continue;
    const childPageBudgetMs = getRemainingFollowUpBudgetMs(`child_page_fetch:${childPage.url}`);
    if (childPageBudgetMs <= 0) break;
    try {
      const fetched = await hooks.fetchWithLimit(childPage.url, {
        timeoutMs: childPageBudgetMs,
        signal: resolvedOptions.signal,
      });
      throwIfExtractionAborted(resolvedOptions.signal);
      upsertDiscoveredLink(discoveredLinkMap, {
        ...childPage,
        followed: true,
        contentType: fetched.contentType || null,
      });
      if (
        !/text\/html|text\/plain|application\/json|application\/ld\+json/i.test(fetched.contentType)
      ) {
        if (isAssetUrl(childPage.url) || /pdf|image\//i.test(fetched.contentType)) {
          await appendFetchedAssetText(
            new URL(childPage.url),
            fetched,
            accumulators,
            hooks,
            resolvedOptions,
            {
              discoveryMethod: resolveDiscoveryMethodForUrl(childPage.url),
            },
            crawlBudget,
            requestCache,
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
      if (!crawledPageKeys.has(childPageKey)) {
        crawledPages.push({ url: childPage.url, title: childTitle, depth: 1 });
        crawledPageKeys.add(childPageKey);
      }
      htmlChunks.push(buildHtmlTextChunk(childPage.url, childMetadata, childReadable));

      const childCandidates = collectDiscoveryCandidates(childHtml, childUrl, 1);
      for (const candidate of childCandidates) {
        throwIfExtractionAborted(resolvedOptions.signal);
        upsertDiscoveredLink(discoveredLinkMap, candidate);
      }
      await fetchAssetCandidates(
        childCandidates
          .filter((candidate) => candidate.kind === "asset")
          .sort(compareDiscoveryCandidates),
      );
    } catch {
      // Best-effort child pages.
    }
  }

  await fetchAssetCandidates(
    [...discoveredLinkMap.values()]
      .filter((candidate) => candidate.kind === "asset")
      .sort(compareDiscoveryCandidates),
  );

  usedOcr = accumulators.usedOcr;
  gymLayoutImageDataUrl = accumulators.gymLayoutImageDataUrl;
  gymLayoutPage = accumulators.gymLayoutPage;
  gymLayoutFacts = accumulators.gymLayoutFacts;
  gymLayoutZones = accumulators.gymLayoutZones;
  gymLayoutSelection = accumulators.gymLayoutSelection;
  coachPageHints = accumulators.coachPageHints;

  const hubResources = [...resourceLinkMap.values()].filter((item) => {
    if (item.kind === "results_hub" || item.kind === "rotation_hub") return true;
    if (item.kind !== "travel_accommodation" && item.kind !== "hotel_booking") return false;
    try {
      return new URL(item.url).host === url.host;
    } catch {
      return false;
    }
  });
  for (const hubResource of hubResources.sort((a, b) =>
    compareResourceLinksForFollowUp(a, b, url.host),
  )) {
    throwIfExtractionAborted(resolvedOptions.signal);
    if (!hasFollowUpBudget("hub_resolve")) break;
    const promotedResources = await resolveHubResourceLinks(
      hubResource,
      fingerprint,
      hooks,
      resolvedOptions,
      crawlBudget,
      requestCache,
    );
    for (const promoted of promotedResources) {
      throwIfExtractionAborted(resolvedOptions.signal);
      if (!hasFollowUpBudget("hub_promoted_resource")) break;
      upsertResourceLink(resourceLinkMap, promoted);
      await appendCanonicalResourceToText(promoted);
    }
  }

  const discoveredLinks = [...discoveredLinkMap.values()]
    .sort(compareDiscoveryCandidates)
    .slice(0, MAX_DISCOVERED_LINKS)
    .map(({ score: _score, ...item }) => item);
  const resourceLinks = [...resourceLinkMap.values()]
    .sort((a, b) => {
      const scoreDelta = (b.matchScore || 0) - (a.matchScore || 0);
      if (scoreDelta !== 0) return scoreDelta;
      const labelDelta = a.kind.localeCompare(b.kind);
      if (labelDelta !== 0) return labelDelta;
      return a.url.localeCompare(b.url);
    })
    .slice(0, MAX_DISCOVERED_LINKS);
  const fullText = [...htmlChunks, ...linkedChunks].filter(Boolean).join("\n\n---\n\n").trim();
  const quality = analyzeTextQuality(fullText);
  const travelAccommodationCandidates = detectTravelAccommodationCandidates({
    source: "url",
    extractedText: quality.cleanedText,
    links: resourceLinks.map((item) => ({
      label: item.label,
      url: item.url,
      sourceUrl: item.sourceUrl,
      contextText: item.contextText || null,
      sectionHeading: item.sectionHeading || null,
    })),
  });
  const travelAccommodationResult = buildTravelAccommodationResult({
    candidates: travelAccommodationCandidates,
    pdfHotels: [],
    webHotels: [],
  });
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
    },
  );

  return {
    extractedText: quality.cleanedText,
    extractionMeta: {
      sourceType: "url",
      usedOcr,
      linkedAssets: linkedMeta,
      discoveredLinks,
      resourceLinks,
      crawledPages,
      pageTitle: pageTitle || "",
      gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
      gymLayoutFacts: mergedLayoutFacts,
      gymLayoutZones,
      gymLayoutPage,
      gymLayoutSelection,
      coachPageHints,
      travelAccommodationCandidates,
      travelAccommodationSignals: uniqueBy(
        travelAccommodationCandidates.flatMap((item) => item.signals || []),
        (item) => item,
      ),
      travelAccommodationSummary: {
        pdfHotels: [],
        fallbackLink: travelAccommodationResult.fallbackLink,
        confidence: travelAccommodationResult.confidence,
      },
      textQuality: quality.quality,
      qualitySignals: quality.signals,
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
      enum: ["parent_packet", "registration_packet", "meet_overview", "unknown"],
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
      }),
    ),
    athlete: jsonObject({
      name: jsonNullable(JSON_STRING),
      level: jsonNullable(JSON_STRING),
      team: jsonNullable(JSON_STRING),
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
        }),
      ),
      parkingPricingLinks: jsonArray(
        jsonObject({
          label: JSON_STRING,
          url: JSON_STRING,
        }),
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
        }),
      ),
      teamFees: jsonArray(
        jsonObject({
          label: JSON_STRING,
          amount: JSON_STRING,
          note: jsonNullable(JSON_STRING),
        }),
      ),
      lateFees: jsonArray(
        jsonObject({
          label: JSON_STRING,
          amount: JSON_STRING,
          trigger: jsonNullable(JSON_STRING),
          note: jsonNullable(JSON_STRING),
        }),
      ),
      contacts: jsonArray(
        jsonObject({
          role: JSON_STRING,
          name: jsonNullable(JSON_STRING),
          email: jsonNullable(JSON_STRING),
          phone: jsonNullable(JSON_STRING),
        }),
      ),
      deadlines: jsonArray(
        jsonObject({
          label: JSON_STRING,
          date: jsonNullable(JSON_STRING),
          note: jsonNullable(JSON_STRING),
        }),
      ),
      links: jsonArray(
        jsonObject({
          label: JSON_STRING,
          url: JSON_STRING,
        }),
      ),
      notes: jsonArray(JSON_STRING),
    }),
    contacts: jsonArray(
      jsonObject({
        role: JSON_STRING,
        name: jsonNullable(JSON_STRING),
        email: jsonNullable(JSON_STRING),
        phone: jsonNullable(JSON_STRING),
      }),
    ),
    deadlines: jsonArray(
      jsonObject({
        label: JSON_STRING,
        date: jsonNullable(JSON_STRING),
        note: jsonNullable(JSON_STRING),
      }),
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
        }),
      ),
      passcode: jsonNullable(JSON_STRING),
    }),
    links: jsonArray(
      jsonObject({
        label: JSON_STRING,
        url: JSON_STRING,
      }),
    ),
    unmappedFacts: jsonArray(
      jsonObject({
        category: JSON_STRING,
        detail: JSON_STRING,
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      }),
    ),
  }),
} as const;

const GYMNASTICS_CLASSIFIER_JSON_SCHEMA = {
  name: "gymnastics_discovery_classifier",
  strict: true,
  schema: jsonObject({
    eventType: { type: "string", enum: ["gymnastics_meet", "unknown"] },
    documentProfile: {
      type: "string",
      enum: ["parent_packet", "registration_packet", "meet_overview", "unknown"],
    },
    confidence: JSON_NUMBER,
    contentMix: jsonObject({
      registrationHeavy: JSON_BOOLEAN,
      parentPacketHeavy: JSON_BOOLEAN,
      mixed: JSON_BOOLEAN,
    }),
  }),
} as const;

const OPENAI_SCHEMA_INSTRUCTIONS = `Return JSON only. Do not wrap in markdown. Follow this exact shape and key names:
{
  "eventType": "gymnastics_meet" | "unknown",
  "documentProfile": "parent_packet" | "registration_packet" | "meet_overview" | "unknown",
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
    "name": string|null, "level": string|null, "team": string|null,
    "competitionDate": string|null, "stretchTime": string|null, "marchIn": string|null,
    "assignedGym": string|null, "awards": string|null
  },
  "meetDetails": {
    "warmup": string|null, "marchIn": string|null, "rotationOrder": string|null, "judgingNotes": string|null,
    "doorsOpen": string|null, "arrivalGuidance": string|null, "registrationInfo": string|null,
    "facilityLayout": string|null, "scoringInfo": string|null,
    "resultsInfo": string|null, "rotationSheetsInfo": string|null, "awardsInfo": string|null,
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
  "links": [{ "label": string, "url": string }],
  "unmappedFacts": [{ "category": string, "detail": string, "confidence": "high"|"medium"|"low" }]
}`;

function buildParsePromptEvidence(
  evidence: DiscoveryEvidence,
  options?: {
    compact?: boolean;
    pretty?: boolean;
  },
): string {
  if (!options?.compact) {
    return JSON.stringify(evidence, null, options?.pretty === false ? 0 : 2);
  }
  const compactEvidence = {
    source: {
      sourceType: evidence.source.sourceType,
      usedOcr: evidence.source.usedOcr,
      pageTitle: evidence.source.pageTitle,
      extractedChars: evidence.source.extractedChars,
      textQuality: evidence.source.textQuality,
    },
    candidates: {
      titleHints: evidence.candidates.titleHints.slice(0, 6),
      dateHints: evidence.candidates.dateHints.slice(0, 6),
      timeHints: evidence.candidates.timeHints.slice(0, 8),
      timezoneHints: evidence.candidates.timezoneHints.slice(0, 4),
      venueHints: evidence.candidates.venueHints.slice(0, 8),
      addressHints: evidence.candidates.addressHints.slice(0, 4),
      hostGymHints: evidence.candidates.hostGymHints.slice(0, 6),
      admissionHints: evidence.candidates.admissionHints.slice(0, 8),
      athleteHints: evidence.candidates.athleteHints.slice(0, 8),
      logisticsHints: evidence.candidates.logisticsHints.slice(0, 8),
      policyHints: evidence.candidates.policyHints.slice(0, 6),
      coachHints: evidence.candidates.coachHints.slice(0, 10),
      linkHints: evidence.candidates.linkHints.slice(0, 8),
    },
    sections: {
      spectator: evidence.sections.spectator.slice(0, 8),
      venue: evidence.sections.venue.slice(0, 8),
      traffic: evidence.sections.traffic.slice(0, 8),
      policy: evidence.sections.policy.slice(0, 8),
      coachOps: evidence.sections.coachOps.slice(0, 8),
      registration: evidence.sections.registration.slice(0, 8),
    },
    dateAnalysis: {
      primaryCandidate: evidence.dateAnalysis.primaryCandidate,
      ignoredCandidates: evidence.dateAnalysis.ignoredCandidates.slice(0, 4),
    },
    snippets: {
      firstLines: evidence.snippets.firstLines.slice(0, 8),
      additionalInfoLines: evidence.snippets.additionalInfoLines.slice(0, 8),
      trafficLines: evidence.snippets.trafficLines.slice(0, 6),
      hallLayoutLines: evidence.snippets.hallLayoutLines.slice(0, 6),
      coachLines: evidence.snippets.coachLines.slice(0, 8),
    },
    resources: {
      links: evidence.resources.links.slice(0, 12),
      hotelHints: evidence.resources.hotelHints.slice(0, 6),
      statusHints: evidence.resources.statusHints.slice(0, 6),
    },
  };
  return JSON.stringify(compactEvidence);
}

function clampParseConfidence(value: unknown, fallback = 0.5): number {
  const num = typeof value === "number" ? value : Number.parseFloat(safeString(value));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

function normalizeParseClassification(value: any): ParseClassification | null {
  if (!value || typeof value !== "object") return null;
  const eventType = value.eventType === "gymnastics_meet" ? "gymnastics_meet" : "unknown";
  const documentProfile =
    value.documentProfile === "parent_packet" ||
    value.documentProfile === "registration_packet" ||
    value.documentProfile === "meet_overview"
      ? value.documentProfile
      : "unknown";
  return {
    eventType,
    documentProfile,
    confidence: clampParseConfidence(value.confidence, 0.5),
    contentMix: {
      registrationHeavy: Boolean(value?.contentMix?.registrationHeavy),
      parentPacketHeavy: Boolean(value?.contentMix?.parentPacketHeavy),
      mixed: Boolean(value?.contentMix?.mixed),
    },
  };
}

function inferHeuristicParseClassification(
  evidence: DiscoveryEvidence,
  extractionMeta?: ExtractionResult["extractionMeta"],
): ParseClassification {
  const combinedEvidenceText = [
    ...evidence.snippets.firstLines,
    ...evidence.snippets.additionalInfoLines,
    ...evidence.sections.spectator,
    ...evidence.sections.venue,
    ...evidence.sections.traffic,
    ...evidence.sections.policy,
    ...evidence.sections.coachOps,
    ...evidence.sections.registration,
    ...evidence.candidates.coachHints,
    ...pickArray(extractionMeta?.coachPageHints).map((item) => safeString(item?.excerpt)),
  ]
    .filter(Boolean)
    .join("\n");
  const hasPacketCoverSignal =
    /please review the following items enclosed in this packet|the following items are included/i.test(
      combinedEvidenceText,
    );
  const hasRegistrationHeadingSignal =
    /athlete\s*&\s*coach registration|meet entry summary|regional meet coaches information|coaches information(?:—|-)important/i.test(
      combinedEvidenceText,
    );
  const hasParentHeadingSignal =
    /parents?\/spectators?|additional info|spectator admissions?/i.test(combinedEvidenceText);
  const registrationSignals =
    evidence.sections.registration.length +
    evidence.sections.coachOps.length +
    evidence.candidates.coachHints.length +
    (hasRegistrationHeadingSignal ? 3 : 0);
  const parentSignals =
    evidence.sections.spectator.length +
    evidence.sections.traffic.length +
    evidence.sections.policy.length +
    evidence.sections.venue.length +
    (hasParentHeadingSignal ? 2 : 0);
  const registrationHeavy = registrationSignals >= 6 || hasRegistrationHeadingSignal;
  const parentPacketHeavy =
    parentSignals >= 5 ||
    (evidence.sections.spectator.length > 0 && evidence.sections.traffic.length > 0) ||
    hasParentHeadingSignal;
  const signalBuckets = [registrationHeavy, parentPacketHeavy].filter(Boolean).length;
  const mixed = signalBuckets >= 2;
  let documentProfile: ParseResult["documentProfile"] = "meet_overview";
  const strongestSignal = Math.max(registrationSignals, parentSignals);
  if (hasPacketCoverSignal && !mixed) {
    documentProfile = "meet_overview";
  } else if (mixed && registrationHeavy) {
    documentProfile = "registration_packet";
  } else if (mixed && parentPacketHeavy) {
    documentProfile = "parent_packet";
  } else if (strongestSignal === registrationSignals && registrationSignals >= 5) {
    documentProfile = "registration_packet";
  } else if (strongestSignal === parentSignals && parentSignals >= 5) {
    documentProfile = "parent_packet";
  }
  const eventType =
    /gymnastics|usag|xcel|state championships?|entry fee|spectator admission|march in|warm ?up/i.test(
      [
        ...evidence.candidates.titleHints,
        ...evidence.candidates.coachHints,
        ...evidence.sections.spectator,
        ...evidence.sections.registration,
      ].join("\n"),
    )
      ? "gymnastics_meet"
      : "unknown";
  return {
    eventType,
    documentProfile,
    confidence: clampParseConfidence(
      0.45 + Math.min(0.45, strongestSignal / 24) - (mixed ? 0.05 : 0),
      0.55,
    ),
    contentMix: {
      registrationHeavy,
      parentPacketHeavy,
      mixed,
    },
  };
}

function selectParsePromptProfiles(classification: ParseClassification): ParsePromptProfile[] {
  if (
    classification.documentProfile === "parent_packet" &&
    !classification.contentMix.registrationHeavy
  ) {
    return ["parent_public"];
  }

  return uniqueBy<ParsePromptProfile>(["overview_core", "parent_public"], (item) => item).slice(0, 2);
}

function buildClassifierPrompt(evidence: DiscoveryEvidence, extractedText: string): string {
  const boundedText = cleanExtractedText(extractedText).slice(0, 12000);
  const classifierEvidence = {
    source: evidence.source,
    candidates: {
      titleHints: evidence.candidates.titleHints.slice(0, 4),
      dateHints: evidence.candidates.dateHints.slice(0, 4),
      coachHints: evidence.candidates.coachHints.slice(0, 6),
      logisticsHints: evidence.candidates.logisticsHints.slice(0, 6),
      policyHints: evidence.candidates.policyHints.slice(0, 6),
    },
    sections: {
      spectator: evidence.sections.spectator.slice(0, 6),
      venue: evidence.sections.venue.slice(0, 6),
      traffic: evidence.sections.traffic.slice(0, 6),
      policy: evidence.sections.policy.slice(0, 6),
      coachOps: evidence.sections.coachOps.slice(0, 6),
      registration: evidence.sections.registration.slice(0, 6),
    },
    snippets: {
      firstLines: evidence.snippets.firstLines.slice(0, 8),
      coachLines: evidence.snippets.coachLines.slice(0, 6),
      trafficLines: evidence.snippets.trafficLines.slice(0, 6),
    },
  };
  return [
    "Classify a gymnastics meet document for staged extraction.",
    "Return only strict JSON that matches the schema.",
    "",
    "Rules:",
    "- `documentProfile` is the primary dominant packet type.",
    "- Set `registrationHeavy` when entry fees, deadlines, refunds, qualification, payment, or coach operations dominate.",
    "- Set `parentPacketHeavy` when parking, admissions, doors, traffic, venue layout, or public policies dominate.",
    "- Packet covers often include phrases like `Please review the following items enclosed in this packet` or `The following items are included`.",
    "- Coach/registration packets often include headings like `Athlete & Coach Registration`, `Meet Entry Summary`, or `REGIONAL MEET COACHES INFORMATION`.",
    "- Treat `Updated`, `Posted`, and `Final Posting` lines as document metadata, not meet-date evidence.",
    "- Set `mixed` when two or more of those buckets are materially present.",
    "- Use `meet_overview` for general meet summaries that are not clearly dominated by one packet type.",
    "- Use `unknown` only if the content does not look like a gymnastics meet document.",
    "",
    "Evidence JSON:",
    JSON.stringify(classifierEvidence),
    "",
    "Source excerpt:",
    boundedText,
  ].join("\n");
}

function selectExcerptWindows(
  sourceText: string,
  patterns: RegExp[],
  options?: { limit?: number; radius?: number; fallbackLines?: number },
): Array<{ label: string; text: string }> {
  const cleaned = cleanExtractedText(sourceText);
  const lines = stitchDiscoveryLines(
    cleaned
      .split(/\n+/)
      .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
      .filter(Boolean),
  );
  const radius = options?.radius ?? 1;
  const selectedIndexes = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (!patterns.some((pattern) => pattern.test(lines[index]))) continue;
    for (
      let target = Math.max(0, index - radius);
      target <= Math.min(lines.length - 1, index + radius);
      target += 1
    ) {
      selectedIndexes.add(target);
    }
  }
  if (!selectedIndexes.size) {
    for (let index = 0; index < Math.min(lines.length, options?.fallbackLines ?? 10); index += 1) {
      selectedIndexes.add(index);
    }
  }
  const sorted = [...selectedIndexes].sort((a, b) => a - b);
  const windows: Array<{ label: string; text: string }> = [];
  let start = -1;
  let previous = -1;
  const flush = () => {
    if (start < 0 || previous < start) return;
    windows.push({
      label: `lines_${start + 1}_${previous + 1}`,
      text: lines.slice(start, previous + 1).join("\n"),
    });
  };
  for (const index of sorted) {
    if (start < 0) {
      start = index;
      previous = index;
      continue;
    }
    if (index === previous + 1) {
      previous = index;
      continue;
    }
    flush();
    start = index;
    previous = index;
  }
  flush();
  return windows.slice(0, options?.limit ?? 8);
}

function selectEvidenceForParseProfile(
  profile: ParsePromptProfile,
  extractedText: string,
  evidence: DiscoveryEvidence,
  extractionMeta?: ExtractionResult["extractionMeta"],
): SelectedParseEvidence {
  const resourceLinks = pickArray(evidence.resources.links);
  const resourceLinksForProfile =
    profile === "parent_public"
      ? resourceLinks.filter((item) =>
          [
            "admission",
            "parking",
            "travel_accommodation",
            "hotel_booking",
            "packet",
            "photo_video",
            "apparel_form",
          ].includes(item.kind),
        )
      : resourceLinks.slice(0, 8);

  const profileEvidenceByType: Record<ParsePromptProfile, Record<string, unknown>> = {
    overview_core: {
      source: evidence.source,
      primaryDates: evidence.dateAnalysis.primaryCandidate,
      titleHints: evidence.candidates.titleHints.slice(0, 6),
      dateHints: evidence.candidates.dateHints.slice(0, 6),
      timeHints: evidence.candidates.timeHints.slice(0, 6),
      timezoneHints: evidence.candidates.timezoneHints.slice(0, 4),
      venueHints: evidence.candidates.venueHints.slice(0, 6),
      addressHints: evidence.candidates.addressHints.slice(0, 4),
      hostGymHints: evidence.candidates.hostGymHints.slice(0, 4),
      firstLines: evidence.snippets.firstLines.slice(0, 10),
      additionalInfoLines: evidence.snippets.additionalInfoLines.slice(0, 8),
      linkHints: evidence.candidates.linkHints.slice(0, 10),
      resources: resourceLinksForProfile.slice(0, 10),
    },
    parent_public: {
      source: evidence.source,
      titleHints: evidence.candidates.titleHints.slice(0, 4),
      spectator: evidence.sections.spectator.slice(0, 10),
      venue: evidence.sections.venue.slice(0, 10),
      traffic: evidence.sections.traffic.slice(0, 10),
      policy: evidence.sections.policy.slice(0, 10),
      trafficLines: evidence.snippets.trafficLines.slice(0, 8),
      hallLayoutLines: evidence.snippets.hallLayoutLines.slice(0, 8),
      linkHints: evidence.candidates.linkHints.slice(0, 8),
      resources: resourceLinksForProfile.slice(0, 10),
    },
  };

  const excerptPatternsByType: Record<ParsePromptProfile, RegExp[]> = {
    overview_core: [
      /\b(?:when|dates?|hosted by|venue|location|address|timezone|schedule|results|rotation|admission)\b/i,
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
    ],
    parent_public: [
      /\b(?:admission|ticket|cash|parking|traffic|doors|arrival|entrance|facility|layout|guest services|outside food|service animal|parents?\/spectators?|additional info|spectator admissions?)\b/i,
    ],
  };

  const excerpts = selectExcerptWindows(extractedText, excerptPatternsByType[profile], {
    limit: 8,
    radius: 1,
    fallbackLines: 10,
  });
  const boundedExcerpts = excerpts
    .map((item) => ({
      ...item,
      text: item.text.slice(0, 2600),
    }))
    .slice(0, 8);
  const evidenceJson = JSON.stringify(profileEvidenceByType[profile]);
  return {
    evidence: profileEvidenceByType[profile],
    evidenceChars: evidenceJson.length,
    evidenceLabels: Object.keys(profileEvidenceByType[profile]),
    excerpts: boundedExcerpts,
    excerptChars: boundedExcerpts.reduce((sum, item) => sum + item.text.length, 0),
    excerptLabels: boundedExcerpts.map((item) => item.label),
  };
}

function buildSelectedParseEvidenceCache(
  profiles: ParsePromptProfile[],
  extractedText: string,
  evidence: DiscoveryEvidence,
  extractionMeta?: ExtractionResult["extractionMeta"],
) {
  return new Map(
    profiles.map((profile) => [
      profile,
      selectEvidenceForParseProfile(profile, extractedText, evidence, extractionMeta),
    ]),
  );
}

function buildTargetedParsePrompt(
  profile: ParsePromptProfile,
  classification: ParseClassification,
  selected: SelectedParseEvidence,
): string {
  const focusByProfile: Record<ParsePromptProfile, string[]> = {
    overview_core: [
      "Focus on title, dates, venue, address, host gym, timezone, and high-level links.",
      "Also keep only brief public meet summary facts that clearly fit dedicated fields.",
    ],
    parent_public: [
      "Focus on doors, arrival, parking, traffic, admissions, venue logistics, public policies, and public announcements.",
      "Populate public-facing meet details and logistics before using generic leftovers.",
    ],
  };
  return [
    OPENAI_SCHEMA_INSTRUCTIONS,
    "",
    `Targeted extraction profile: ${profile}`,
    `Classifier decision: ${classification.documentProfile} (confidence ${classification.confidence.toFixed(2)})`,
    "",
    "Source priority:",
    "1) Evidence JSON",
    "2) Source excerpts",
    "3) Otherwise null or []",
    "",
    "Routing rules:",
    "- Keep strings short and factual.",
    "- Preserve meet date ranges exactly when explicit.",
    "- Do not use update stamps, posted timestamps, or deadline dates as event dates.",
    "- Section headings are not titles.",
    "- Packet intro prose is not hero copy or meet-details summary text.",
    "- `Updated`, `Posted`, and `Final Posting` lines are document metadata.",
    "- Ignore `Hosted by:` when no host value is provided.",
    "- Sponsor thanks, hashtag campaigns, and vendor promotions are not meet announcements.",
    "- Prefer structured resource fields/links for results, rotation sheets, rosters, tickets, hotels, and travel hubs.",
    "- Use only absolute URLs from evidence/resources when URLs are available there.",
    "- Public admission pricing belongs only in `admission`.",
    "- Keep parking maps/rates in parking link fields, not generic notes.",
    "- Use `unmappedFacts` only for grounded leftovers that clearly do not fit elsewhere.",
    "- Leave unrelated fields empty instead of stretching evidence.",
    "",
    ...focusByProfile[profile],
    "",
    "Evidence JSON:",
    JSON.stringify(selected.evidence),
    "",
    "Source excerpts:",
    ...selected.excerpts.map((item) => `## ${item.label}\n${item.text}`),
  ].join("\n");
}

function mergeUniqueStrings(existing: string[], incoming: string[]): string[] {
  return uniqueBy(
    [...existing, ...incoming].map((item) => safeString(item)).filter(Boolean),
    (item) => item,
  );
}

function fillScalar<T>(current: T, candidate: T, emptyCheck?: (value: T) => boolean): T {
  const isEmpty = emptyCheck || ((value: T) => !value);
  return isEmpty(current) && !isEmpty(candidate) ? candidate : current;
}

function mergeObjectArray<T>(existing: T[], incoming: T[], keyFn: (value: T) => string): T[] {
  return uniqueBy([...existing, ...incoming].filter(Boolean), keyFn);
}

function mergeParseResultsByProfile(
  results: Array<{ profile: ParsePromptProfile; result: ParseResult }>,
): ParseResult {
  const merged = buildEmptyParseResult();
  const ordered = [...results].sort(
    (a, b) =>
      ["overview_core", "parent_public"].indexOf(a.profile) -
      ["overview_core", "parent_public"].indexOf(b.profile),
  );
  for (const { result } of ordered) {
    merged.eventType = fillScalar(
      merged.eventType,
      result.eventType,
      (value) => value === "unknown",
    );
    merged.documentProfile = fillScalar(
      merged.documentProfile,
      result.documentProfile,
      (value) => value === "unknown",
    );
    merged.title = fillScalar(merged.title, result.title);
    merged.dates = fillScalar(merged.dates, result.dates);
    merged.startAt = fillScalar(merged.startAt, result.startAt);
    merged.endAt = fillScalar(merged.endAt, result.endAt);
    merged.timezone = fillScalar(merged.timezone, result.timezone);
    merged.venue = fillScalar(merged.venue, result.venue);
    merged.address = fillScalar(merged.address, result.address);
    merged.hostGym = fillScalar(merged.hostGym, result.hostGym);
    merged.admission = mergeObjectArray(merged.admission, result.admission, (item) =>
      [item.label, item.price, item.note || ""].join("|"),
    );
    merged.contacts = mergeObjectArray(merged.contacts, result.contacts, (item) =>
      [item.role, item.name || "", item.email || "", item.phone || ""].join("|"),
    );
    merged.deadlines = mergeObjectArray(merged.deadlines, result.deadlines, (item) =>
      [item.label, item.date || "", item.note || ""].join("|"),
    );
    merged.links = mergeObjectArray(merged.links, result.links, (item) =>
      [item.label, item.url].join("|"),
    );
    merged.unmappedFacts = mergeObjectArray(merged.unmappedFacts, result.unmappedFacts, (item) =>
      [item.category, item.detail, item.confidence].join("|"),
    );
  }

  const overview = results.find((item) => item.profile === "overview_core")?.result;
  const parent = results.find((item) => item.profile === "parent_public")?.result;
  const corePriority = [overview, parent].filter((item): item is ParseResult => Boolean(item));
  for (const candidate of corePriority) {
    merged.title = fillScalar(merged.title, candidate.title);
    merged.dates = fillScalar(merged.dates, candidate.dates);
    merged.startAt = fillScalar(merged.startAt, candidate.startAt);
    merged.endAt = fillScalar(merged.endAt, candidate.endAt);
    merged.timezone = fillScalar(merged.timezone, candidate.timezone);
    merged.venue = fillScalar(merged.venue, candidate.venue);
    merged.address = fillScalar(merged.address, candidate.address);
    merged.hostGym = fillScalar(merged.hostGym, candidate.hostGym);
  }

  if (parent) {
    merged.meetDetails.doorsOpen = fillScalar(
      merged.meetDetails.doorsOpen,
      parent.meetDetails.doorsOpen,
    );
    merged.meetDetails.arrivalGuidance = fillScalar(
      merged.meetDetails.arrivalGuidance,
      parent.meetDetails.arrivalGuidance,
    );
    merged.meetDetails.facilityLayout = fillScalar(
      merged.meetDetails.facilityLayout,
      parent.meetDetails.facilityLayout,
    );
    merged.meetDetails.scoringInfo = fillScalar(
      merged.meetDetails.scoringInfo,
      parent.meetDetails.scoringInfo,
    );
    merged.meetDetails.resultsInfo = fillScalar(
      merged.meetDetails.resultsInfo,
      parent.meetDetails.resultsInfo,
    );
    merged.meetDetails.rotationSheetsInfo = fillScalar(
      merged.meetDetails.rotationSheetsInfo,
      parent.meetDetails.rotationSheetsInfo,
    );
    merged.meetDetails.awardsInfo = fillScalar(
      merged.meetDetails.awardsInfo,
      parent.meetDetails.awardsInfo,
    );
    merged.meetDetails.operationalNotes = mergeUniqueStrings(
      merged.meetDetails.operationalNotes,
      parent.meetDetails.operationalNotes,
    );
    merged.logistics.parking = fillScalar(merged.logistics.parking, parent.logistics.parking);
    merged.logistics.trafficAlerts = fillScalar(
      merged.logistics.trafficAlerts,
      parent.logistics.trafficAlerts,
    );
    merged.logistics.hotel = fillScalar(merged.logistics.hotel, parent.logistics.hotel);
    merged.logistics.meals = fillScalar(merged.logistics.meals, parent.logistics.meals);
    merged.logistics.rideShare = fillScalar(merged.logistics.rideShare, parent.logistics.rideShare);
    merged.logistics.accessibility = fillScalar(
      merged.logistics.accessibility,
      parent.logistics.accessibility,
    );
    merged.logistics.parkingLinks = mergeObjectArray(
      merged.logistics.parkingLinks,
      parent.logistics.parkingLinks,
      (item) => [item.label, item.url].join("|"),
    );
    merged.logistics.parkingPricingLinks = mergeObjectArray(
      merged.logistics.parkingPricingLinks,
      parent.logistics.parkingPricingLinks,
      (item) => [item.label, item.url].join("|"),
    );
    merged.policies.food = fillScalar(merged.policies.food, parent.policies.food);
    merged.policies.hydration = fillScalar(merged.policies.hydration, parent.policies.hydration);
    merged.policies.safety = fillScalar(merged.policies.safety, parent.policies.safety);
    merged.policies.animals = fillScalar(merged.policies.animals, parent.policies.animals);
    merged.policies.misc = mergeUniqueStrings(merged.policies.misc, parent.policies.misc);
    merged.communications.announcements = mergeObjectArray(
      merged.communications.announcements,
      parent.communications.announcements,
      (item) => [item.title, item.body].join("|"),
    );
    merged.communications.passcode = fillScalar(
      merged.communications.passcode,
      parent.communications.passcode,
    );
  }

  return normalizeParseResult(merged) || buildEmptyParseResult();
}

function buildProfessionalParsePrompt(
  evidence: DiscoveryEvidence,
  sourceText: string,
  followup?: string,
  options?: {
    includeSchema?: boolean;
    compactEvidence?: boolean;
    prettyEvidence?: boolean;
  },
): string {
  const boundedText = cleanExtractedText(sourceText).slice(0, 120000);
  const evidenceJson = buildParsePromptEvidence(evidence, {
    compact: options?.compactEvidence,
    pretty: options?.prettyEvidence,
  });
  return [
    options?.includeSchema === false ? "" : OPENAI_SCHEMA_INSTRUCTIONS,
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
    "4) `resources.links` are authoritative for URLs and posting status.",
    "",
    "## Conflict Resolution",
    "When candidates conflict, prefer the most specific and internally consistent value. Source text is the tiebreaker.",
    "",
    "## Document-Type Extraction Focus",
    "- `parent_packet`: doors/arrival, facility layout, parking/traffic, visitor policies.",
    "- `registration_packet`: entry fees, qualification criteria, deadlines, refund/late-fee rules, organizer contacts.",
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
    "- When `resources.links` are present, only use those URLs. Do not invent or rewrite result, rotation, hotel, or document links.",
    "- If a results or rotation hub conflicts on dates/title with the root event, ignore the conflicting child content and keep only the neutral hub context.",
    "- If `resources.statusHints` says a resource is not yet posted, do not infer a direct PDF or live-scoring link unless an event-matched resource link is present.",
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
        (item) => item.url,
      ),
      parkingPricingLinks: uniqueBy(
        pickArray(value.logistics?.parkingPricingLinks)
          .map((item) => ({
            label: safeString(item?.label) || "Parking pricing",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url,
      ),
    },
    policies: {
      food: safeString(value.policies?.food) || null,
      hydration: safeString(value.policies?.hydration) || null,
      safety: safeString(value.policies?.safety) || null,
      animals: safeString(value.policies?.animals) || null,
      misc: pickArray(value.policies?.misc)
        .map((item) => safeString(item))
        .filter(Boolean),
    },
    coachInfo: {
      signIn: safeString(value.coachInfo?.signIn) || null,
      attire:
        safeString(value.coachInfo?.attire) ||
        uniqueBy(
          pickArray(value.coachInfo?.attire)
            .map((item) => safeString(item))
            .filter(Boolean),
          (item) => item,
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
        (item) => [item.label, item.amount, item.note || ""].join("|"),
      ),
      teamFees: uniqueBy(
        pickArray(value.coachInfo?.teamFees)
          .map((item) => ({
            label: safeString(item?.label) || "Team fee",
            amount: safeString(item?.amount || item?.price),
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.note),
        (item) => [item.label, item.amount, item.note || ""].join("|"),
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
        (item) => [item.label, item.amount, item.trigger || "", item.note || ""].join("|"),
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
        (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|"),
      ),
      deadlines: uniqueBy(
        pickArray(value.coachInfo?.deadlines)
          .map((item) => ({
            label: safeString(item?.label) || "Coach deadline",
            date: safeString(item?.date) || null,
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.date || item.note || item.label !== "Coach deadline"),
        (item) => [item.label, item.date || "", item.note || ""].join("|"),
      ),
      links: uniqueBy(
        pickArray(value.coachInfo?.links)
          .map((item) => ({
            label: safeString(item?.label) || "Coach link",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url,
      ),
      notes: uniqueBy(
        pickArray(value.coachInfo?.notes)
          .map((item) => safeString(item))
          .filter(Boolean),
        (item) => item,
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
      (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|"),
    ),
    deadlines: uniqueBy(
      pickArray(value.deadlines)
        .map((item) => ({
          label: safeString(item?.label) || "Deadline",
          date: safeString(item?.date) || null,
          note: safeString(item?.note) || null,
        }))
        .filter((item) => item.label || item.date || item.note),
      (item) => [item.label, item.date || "", item.note || ""].join("|"),
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
      (item) => item.url,
    ),
    gear: {
      uniform: safeString(value.gear?.uniform) || null,
      checklist: uniqueBy(
        pickArray(value.gear?.checklist)
          .map((item) => safeString(item))
          .filter(Boolean),
        (item) => item,
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
    if (
      isMarketingLikeText(text) ||
      isScheduleGridLikeText(text) ||
      isClubParticipationLikeText(text)
    ) {
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
        if (
          isMarketingLikeText(item) ||
          isScheduleGridLikeText(item) ||
          isClubParticipationLikeText(item) ||
          isLowSignalOperationalNote(item)
        ) {
          return false;
        }
        if (VENUE_DETAIL_TEXT_PATTERN.test(item) || isAdmissionAnnouncementText(item)) {
          routeRejectedFact(item);
          return false;
        }
        return true;
      }),
    (item) => item,
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
    (item) => item,
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
    (item) => `${safeString(item?.category)}|${safeString(item?.detail)}`,
  );

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
      [item.label, item.price, item.note || ""].join("|"),
    ),
    coachInfo: {
      ...parseResult.coachInfo,
      entryFees: uniqueBy(entryFees, (item) =>
        [item.label, item.amount, item.note || ""].join("|"),
      ),
      teamFees: uniqueBy(teamFees, (item) => [item.label, item.amount, item.note || ""].join("|")),
      lateFees: uniqueBy(lateFees, (item) =>
        [item.label, item.amount, item.trigger || "", item.note || ""].join("|"),
      ),
    },
  };
}

function routeCoachDeadlines(parseResult: ParseResult): ParseResult {
  const publicDeadlines: ParseResult["deadlines"] = [];
  const coachDeadlines = [...parseResult.coachInfo.deadlines];
  for (const item of parseResult.deadlines) {
    const haystack = `${item.label} ${item.note || ""}`;
    if (
      /(entry|registration|deadline|late fee|refund|regional|qualification|payment|meet maker|reservation)/i.test(
        haystack,
      )
    ) {
      coachDeadlines.push(item);
      continue;
    }
    publicDeadlines.push(item);
  }
  return {
    ...parseResult,
    deadlines: uniqueBy(publicDeadlines, (item) =>
      [item.label, item.date || "", item.note || ""].join("|"),
    ),
    coachInfo: {
      ...parseResult.coachInfo,
      deadlines: uniqueBy(coachDeadlines, (item) =>
        [item.label, item.date || "", item.note || ""].join("|"),
      ),
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
    links: [],
    unmappedFacts: [],
  };
}

async function _callOpenAiParse(
  text: string,
  evidence: DiscoveryEvidence,
  traceId?: string,
  performance?: DiscoveryPerformance,
): Promise<{ result: ParseResult | null; raw: string; usage: any }> {
  const client = getOpenAiClient();
  const sanitizedText = text
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const prompt = buildProfessionalParsePrompt(evidence, sanitizedText, undefined, {
    includeSchema: false,
    compactEvidence: true,
    prettyEvidence: false,
  });
  const startedAt = Date.now();
  logDiscoveryDebug("[meet-discovery] openai parse request started", {
    traceId: traceId || null,
    model: resolveDiscoveryParseModel(),
    promptChars: prompt.length,
  });
  const completion = await client.chat.completions.create({
    model: resolveDiscoveryParseModel(),
    ...openAiChatCompatibilityParams(resolveDiscoveryParseModel()),
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
  logDiscoveryDebug("[meet-discovery] openai parse request finished", {
    traceId: traceId || null,
    durationMs: Date.now() - startedAt,
    usage: completion.usage || null,
  });
  recordDiscoveryUsage(performance, "parse", completion.usage);
  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw, usage: completion.usage || null };
}

async function callOpenAiClassification(
  extractedText: string,
  evidence: DiscoveryEvidence,
  traceId?: string,
  performance?: DiscoveryPerformance,
): Promise<{ result: ParseClassification | null; raw: string; usage: any }> {
  const client = getOpenAiClient();
  const prompt = buildClassifierPrompt(evidence, extractedText);
  const startedAt = Date.now();
  logDiscoveryDebug("[meet-discovery] openai classifier request started", {
    traceId: traceId || null,
    model: resolveDiscoveryParseModel(),
    promptChars: prompt.length,
  });
  const completion = await client.chat.completions.create({
    model: resolveDiscoveryParseModel(),
    ...openAiChatCompatibilityParams(resolveDiscoveryParseModel()),
    response_format: {
      type: "json_schema",
      json_schema: GYMNASTICS_CLASSIFIER_JSON_SCHEMA,
    } as any,
    messages: [
      {
        role: "system",
        content:
          "You classify gymnastics meet documents for staged extraction. Return only strict JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  logDiscoveryDebug("[meet-discovery] openai classifier request finished", {
    traceId: traceId || null,
    durationMs: Date.now() - startedAt,
    usage: completion.usage || null,
  });
  recordDiscoveryUsage(performance, "parse", completion.usage);
  const raw = completion.choices?.[0]?.message?.content || "";
  return {
    result: normalizeParseClassification(extractJsonObject(raw)),
    raw,
    usage: completion.usage || null,
  };
}

async function callOpenAiTargetedParse(
  profile: ParsePromptProfile,
  classification: ParseClassification,
  selected: SelectedParseEvidence,
  traceId?: string,
  performance?: DiscoveryPerformance,
): Promise<{ result: ParseResult | null; raw: string; usage: any }> {
  const client = getOpenAiClient();
  const prompt = buildTargetedParsePrompt(profile, classification, selected);
  const startedAt = Date.now();
  logDiscoveryDebug("[meet-discovery] openai targeted parse request started", {
    traceId: traceId || null,
    profile,
    model: resolveDiscoveryParseModel(),
    promptChars: prompt.length,
    evidenceChars: selected.evidenceChars,
    excerptChars: selected.excerptChars,
  });
  const completion = await client.chat.completions.create({
    model: resolveDiscoveryParseModel(),
    ...openAiChatCompatibilityParams(resolveDiscoveryParseModel()),
    response_format: {
      type: "json_schema",
      json_schema: GYMNASTICS_PARSE_JSON_SCHEMA,
    } as any,
    messages: [
      {
        role: "system",
        content:
          "You extract structured gymnastics meet data for one targeted packet profile. Return only strict JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  logDiscoveryDebug("[meet-discovery] openai targeted parse request finished", {
    traceId: traceId || null,
    profile,
    durationMs: Date.now() - startedAt,
    usage: completion.usage || null,
  });
  recordDiscoveryUsage(performance, "parse", completion.usage);
  const raw = completion.choices?.[0]?.message?.content || "";
  return {
    result: normalizeParseResult(extractJsonObject(raw)),
    raw,
    usage: completion.usage || null,
  };
}

async function callGeminiParse(
  text: string,
  evidence: DiscoveryEvidence,
  traceId?: string,
): Promise<{ result: ParseResult | null; raw: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  if (!apiKey) throw new Error("Gemini API key is not configured");
  const models = resolveGeminiParseModels();
  let lastFailure = "Gemini request failed";

  for (const [index, model] of models.entries()) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const startedAt = Date.now();
    logDiscoveryDebug("[meet-discovery] gemini parse request started", {
      traceId: traceId || null,
      model,
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
      const responseDetail = (await response.text().catch(() => ""))
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);
      lastFailure = `Gemini request failed (${response.status}) for model ${model}${
        responseDetail ? `: ${responseDetail}` : ""
      }`;
      const canRetrySupportedDefault = response.status === 404 && index < models.length - 1;
      if (canRetrySupportedDefault) {
        console.warn("[meet-discovery] configured Gemini model was not found; retrying fallback", {
          traceId: traceId || null,
          model,
          fallbackModel: models[index + 1],
        });
        continue;
      }
      throw new Error(lastFailure);
    }
    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    logDiscoveryDebug("[meet-discovery] gemini parse request finished", {
      traceId: traceId || null,
      model,
      durationMs: Date.now() - startedAt,
    });
    const raw = safeString(json.candidates?.[0]?.content?.parts?.[0]?.text);
    const parsed = normalizeParseResult(extractJsonObject(raw));
    return { result: parsed, raw };
  }

  throw new Error(lastFailure);
}

export async function finalizeMeetParseResult(
  value: ParseResult,
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"],
  options?: {
    traceId?: string;
    mode?: DiscoveryMode;
    performance?: DiscoveryPerformance;
    classification?: ParseClassification;
  },
): Promise<ParseResult> {
  const traceId = options?.traceId || null;
  const finalizeStartedAt = Date.now();
  logDiscoveryDebug("[meet-discovery] finalize parse result started", {
    traceId,
    mode: options?.mode || "core",
  });
  const sanitized = sanitizeDiscoveryParseResult(value);
  const finalized = reconcileParsedDates(sanitized, extractedText);
  logDiscoveryDebug("[meet-discovery] finalize parse result finished", {
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
  },
): Promise<{
  parseResult: ParseResult;
  modelUsed: "openai" | "gemini" | "quality-gate";
  rawModelOutput: string;
  evidence: DiscoveryEvidence;
}> {
  const traceId = options?.traceId || null;
  logDiscoveryDebug("[meet-discovery] parseMeetFromExtractedText started", {
    traceId,
    extractedChars: extractedText.length,
    textQuality: extractionMeta.textQuality || null,
  });
  const evidence = buildDiscoveryEvidence(extractedText, extractionMeta);
  const fallbackTitle = deriveDiscoveryFallbackTitle(extractedText, extractionMeta);
  if (extractionMeta.textQuality === "poor") {
    logDiscoveryDebug("[meet-discovery] quality gate triggered", {
      traceId,
    });
    return {
      parseResult: {
        ...buildEmptyParseResult(),
        title: fallbackTitle,
      },
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
    const stagedRaw: {
      classifier: string;
      extractions: Array<{ profile: ParsePromptProfile; raw: string }>;
    } = {
      classifier: "",
      extractions: [],
    };
    const classifier = await callOpenAiClassification(
      extractedText,
      evidence,
      options?.traceId,
      options?.performance,
    );
    stagedRaw.classifier = classifier.raw;
    const classification =
      classifier.result || inferHeuristicParseClassification(evidence, extractionMeta);
    const selectedProfiles = selectParsePromptProfiles(classification);
    const selectedEvidenceCache = buildSelectedParseEvidenceCache(
      selectedProfiles,
      extractedText,
      evidence,
      extractionMeta,
    );
    const extractorCalls: NonNullable<
      NonNullable<ExtractionResult["extractionMeta"]["parseDiagnostics"]>["staged"]
    >["extractorCalls"] = selectedProfiles.map((profile) => {
      const selected = selectedEvidenceCache.get(profile);
      if (!selected) {
        throw new Error(`Missing selected evidence for profile ${profile}`);
      }
      return {
        profile,
        selectedEvidenceLabels: selected.evidenceLabels,
        selectedExcerptLabels: selected.excerptLabels,
        evidenceChars: selected.evidenceChars,
        excerptChars: selected.excerptChars,
      };
    });

    logDiscoveryDebug("[meet-discovery] staged classifier parsed", {
      traceId,
      documentProfile: classification.documentProfile,
      confidence: classification.confidence,
      selectedProfiles,
      usedHeuristicFallback: !classifier.result,
    });

    const targetedParseResults = await Promise.all(
      selectedProfiles.map(async (profile) => {
        const selected = selectedEvidenceCache.get(profile);
        if (!selected) {
          throw new Error(`Missing selected evidence for profile ${profile}`);
        }
        try {
          const parsed = await callOpenAiTargetedParse(
            profile,
            classification,
            selected,
            options?.traceId,
            options?.performance,
          );
          return {
            profile,
            raw: parsed.raw,
            result: parsed.result,
          };
        } catch (error: any) {
          console.error("[meet-discovery] targeted parse failed", {
            traceId,
            profile,
            message: error?.message || String(error),
          });
          return {
            profile,
            raw: "",
            result: null,
          };
        }
      }),
    );

    stagedRaw.extractions = targetedParseResults.map(({ profile, raw }) => ({
      profile,
      raw,
    }));
    const extractedResults = targetedParseResults
      .map(({ profile, result }) => (result ? { profile, result } : null))
      .filter((item): item is { profile: ParsePromptProfile; result: ParseResult } =>
        Boolean(item),
      );
    if (options?.performance) {
      options.performance.modelParseMs += Date.now() - modelStartedAt;
    }
    extractionMeta.parseDiagnostics = {
      ...(extractionMeta.parseDiagnostics || {}),
      staged: {
        classifier: {
          eventType: classification.eventType,
          documentProfile: classification.documentProfile,
          confidence: classification.confidence,
          contentMix: classification.contentMix,
          selectedProfiles,
          usedHeuristicFallback: !classifier.result,
        },
        extractorCalls,
      },
    };
    openAiRaw = JSON.stringify(stagedRaw);
    if (extractedResults.length > 0) {
      const merged = mergeParseResultsByProfile(extractedResults);
      const stagedMerged = normalizeParseResult({
        ...merged,
        eventType: classification.eventType,
        documentProfile: classification.documentProfile,
      });
      if (!stagedMerged) {
        throw new Error("Staged parse merge returned invalid structured output.");
      }
      const finalized = await finalizeMeetParseResult(stagedMerged, extractedText, extractionMeta, {
        traceId: options?.traceId,
        mode: options?.mode,
        performance: options?.performance,
        classification,
      });
      return {
        parseResult: {
          ...finalized,
          title: resolveDiscoveryEventTitle(finalized.title, fallbackTitle),
        },
        modelUsed: "openai",
        rawModelOutput: openAiRaw,
        evidence,
      };
    }
    openAiErrorMessage = "OpenAI returned invalid staged structured output.";
  } catch (err: any) {
    console.error("[meet-discovery] openai parse failed", {
      traceId,
      message: err?.message || String(err),
    });
    openAiErrorMessage = String(err?.message || "OpenAI parse failed.");
  }
  const hasGeminiKey = Boolean(
    safeString(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
  );
  if (!hasGeminiKey) {
    throw new Error(
      openAiErrorMessage ||
        "OpenAI parsing failed and Gemini fallback is not configured. Set GEMINI_API_KEY to enable fallback.",
    );
  }
  logDiscoveryDebug("[meet-discovery] falling back to gemini", {
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
  const finalizedGemini = await finalizeMeetParseResult(
    gemini.result,
    extractedText,
    extractionMeta,
    {
      traceId: options?.traceId,
      mode: options?.mode,
      performance: options?.performance,
    },
  );
  return {
    parseResult: {
      ...finalizedGemini,
      title: resolveDiscoveryEventTitle(finalizedGemini.title, fallbackTitle),
    },
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

function isDateWithinRange(value: string, start: string | null, end: string | null): boolean {
  const target = safeString(value);
  const lower = safeString(start);
  const upper = safeString(end || start);
  if (!target || !lower || !upper) return false;
  return target >= lower && target <= upper;
}

function hasExplicitIsoTimeComponent(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  const match = text.match(/T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?Z$/i);
  if (!match) return false;
  return !(match[1] === "00" && match[2] === "00" && safeString(match[3] || "00") === "00");
}

function hasAnyDiscoveryTimeSignal(parseResult: ParseResult): boolean {
  return [
    parseResult.startAt,
    parseResult.endAt,
    parseResult.athlete?.stretchTime,
    parseResult.athlete?.marchIn,
    parseResult.meetDetails?.warmup,
    parseResult.meetDetails?.marchIn,
    parseResult.meetDetails?.doorsOpen,
    parseResult.meetDetails?.registrationInfo,
  ].some((value) => /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i.test(safeString(value)));
}

function hasExplicitDiscoveryStartTime(parseResult: ParseResult): boolean {
  if (hasExplicitIsoTimeComponent(parseResult.startAt)) return true;
  if (!parseResult.startAt) return false;
  return hasAnyDiscoveryTimeSignal(parseResult);
}

function buildTextDerivedLink(
  label: string,
  value: unknown,
): { label: string; url: string } | null {
  const url = extractCanonicalUrlFromText(value);
  return url ? { label, url } : null;
}

function isScheduleTableNoiseLine(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return true;
  if (SCHEDULE_DATE_LINE_PATTERN.test(text)) return true;
  if (extractSessionCodesFromHeader(text).length >= 1) return true;
  if (looksLikeScheduleTimeLine(text)) return true;
  if (looksLikeScheduleDivisionLine(splitScheduleCells(text))) return true;
  if (/^(?:gym|arena)\s+[a-z0-9]+(?:\s{2,}(?:gym|arena)\s+[a-z0-9]+)+$/i.test(text)) return true;
  return false;
}

function isPacketCoverCopyText(value: unknown): boolean {
  return /(is proud to host|please review the following items enclosed in this packet|welcome to the .* championships?|thank you for attending|hosted by)/i.test(
    safeString(value),
  );
}

function shouldKeepOperationalLayoutEvidence(
  extractionMeta?: ExtractionResult["extractionMeta"],
): boolean {
  return Boolean(
    Number(extractionMeta?.gymLayoutPage) || safeString(extractionMeta?.gymLayoutImageDataUrl),
  );
}

function isLowSignalOperationalNote(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return true;
  if (
    isMarketingLikeText(text) ||
    isScheduleGridLikeText(text) ||
    isClubParticipationLikeText(text)
  ) {
    return true;
  }
  if (isScheduleTableNoiseLine(text) || isPacketCoverCopyText(text)) return true;
  if (/^(?:coach(?:es)?\s+)?sign[-\s]?in[:\s]/i.test(text)) return true;
  return false;
}

function scoreCompletenessSection(filled: number, total: number) {
  return total > 0 ? filled / total : 0;
}

function _hasMeaningfulArrayContent(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function computeParseCompletenessSnapshot(parseResult: ParseResult): ParseCompletenessSnapshot {
  const coreFilled =
    [
      parseResult.title,
      parseResult.dates,
      parseResult.startAt,
      parseResult.endAt,
      parseResult.timezone,
      parseResult.venue,
      parseResult.address,
      parseResult.hostGym,
    ].filter(Boolean).length + (parseResult.links.length > 0 ? 1 : 0);

  const athleteFilled = [
    parseResult.athlete.name,
    parseResult.athlete.level,
    parseResult.athlete.team,
    parseResult.athlete.competitionDate,
    parseResult.athlete.stretchTime,
    parseResult.athlete.marchIn,
    parseResult.athlete.assignedGym,
    parseResult.athlete.awards,
  ].filter(Boolean).length;

  const meetDetailsFilled =
    [
      parseResult.meetDetails.warmup,
      parseResult.meetDetails.marchIn,
      parseResult.meetDetails.rotationOrder,
      parseResult.meetDetails.judgingNotes,
      parseResult.meetDetails.doorsOpen,
      parseResult.meetDetails.arrivalGuidance,
      parseResult.meetDetails.registrationInfo,
      parseResult.meetDetails.facilityLayout,
      parseResult.meetDetails.scoringInfo,
      parseResult.meetDetails.resultsInfo,
      parseResult.meetDetails.rotationSheetsInfo,
      parseResult.meetDetails.awardsInfo,
    ].filter(Boolean).length + (parseResult.meetDetails.operationalNotes.length > 0 ? 1 : 0);

  const logisticsFilled =
    [
      parseResult.logistics.parking,
      parseResult.logistics.trafficAlerts,
      parseResult.logistics.hotel,
      parseResult.logistics.meals,
      parseResult.logistics.fees,
      parseResult.logistics.waivers,
      parseResult.logistics.rideShare,
      parseResult.logistics.accessibility,
    ].filter(Boolean).length +
    (parseResult.logistics.parkingLinks.length > 0 ? 1 : 0) +
    (parseResult.logistics.parkingPricingLinks.length > 0 ? 1 : 0);

  const coachInfoFilled =
    [
      parseResult.coachInfo.signIn,
      parseResult.coachInfo.attire,
      parseResult.coachInfo.hospitality,
      parseResult.coachInfo.floorAccess,
      parseResult.coachInfo.scratches,
      parseResult.coachInfo.floorMusic,
      parseResult.coachInfo.rotationSheets,
      parseResult.coachInfo.awards,
      parseResult.coachInfo.regionalCommitment,
      parseResult.coachInfo.qualification,
      parseResult.coachInfo.meetFormat,
      parseResult.coachInfo.equipment,
      parseResult.coachInfo.refundPolicy,
      parseResult.coachInfo.paymentInstructions,
    ].filter(Boolean).length +
    (parseResult.coachInfo.entryFees.length > 0 ? 1 : 0) +
    (parseResult.coachInfo.teamFees.length > 0 ? 1 : 0) +
    (parseResult.coachInfo.lateFees.length > 0 ? 1 : 0) +
    (parseResult.coachInfo.contacts.length > 0 ? 1 : 0) +
    (parseResult.coachInfo.deadlines.length > 0 ? 1 : 0) +
    (parseResult.coachInfo.links.length > 0 ? 1 : 0) +
    (parseResult.coachInfo.notes.length > 0 ? 1 : 0);

  return {
    core: {
      filled: coreFilled,
      total: 9,
      score: scoreCompletenessSection(coreFilled, 9),
    },
    athlete: {
      filled: athleteFilled,
      total: 8,
      score: scoreCompletenessSection(athleteFilled, 8),
    },
    meetDetails: {
      filled: meetDetailsFilled,
      total: 13,
      score: scoreCompletenessSection(meetDetailsFilled, 13),
    },
    logistics: {
      filled: logisticsFilled,
      total: 10,
      score: scoreCompletenessSection(logisticsFilled, 10),
    },
    coachInfo: {
      filled: coachInfoFilled,
      total: 21,
      score: scoreCompletenessSection(coachInfoFilled, 21),
    },
  };
}

function computeEvidenceSignalCounts(
  evidence: DiscoveryEvidence,
  _extractionMeta?: ExtractionResult["extractionMeta"],
): Record<keyof ParseCompletenessSnapshot, number> {
  return {
    core:
      evidence.candidates.titleHints.length +
      evidence.candidates.dateHints.length +
      evidence.candidates.venueHints.length +
      evidence.candidates.addressHints.length +
      evidence.candidates.hostGymHints.length,
    athlete: evidence.candidates.athleteHints.length,
    meetDetails:
      evidence.sections.venue.length +
      evidence.sections.spectator.length +
      evidence.snippets.additionalInfoLines.length,
    logistics:
      evidence.candidates.logisticsHints.length +
      evidence.sections.traffic.length +
      evidence.sections.policy.length,
    coachInfo:
      evidence.candidates.coachHints.length +
      evidence.sections.coachOps.length +
      evidence.sections.registration.length,
  };
}

function backfillDeterministicParseFields(
  parseResult: ParseResult,
  evidence: DiscoveryEvidence | null,
  fallbackTitle: string,
): ParseResult {
  if (!evidence) {
    return {
      ...parseResult,
      title: resolveDiscoveryEventTitle(parseResult.title, fallbackTitle),
    };
  }
  const next = normalizeParseResult(parseResult) || buildEmptyParseResult();
  const primaryDate = evidence.dateAnalysis.primaryCandidate;
  next.title = resolveDiscoveryEventTitle(next.title, fallbackTitle);
  next.dates = next.dates || safeString(primaryDate?.label);
  next.timezone = next.timezone || safeString(evidence.candidates.timezoneHints[0]) || null;
  next.venue = next.venue || safeString(evidence.candidates.venueHints[0]) || null;
  next.address = next.address || safeString(evidence.candidates.addressHints[0]) || null;
  next.hostGym = next.hostGym || safeString(evidence.candidates.hostGymHints[0]) || null;
  const notPostedUrls = new Set(
    evidence.resources.links
      .filter((item) => item.status === "not_posted")
      .map((item) => normalizeUrl(item.url))
      .filter(Boolean),
  );
  next.links = mergeObjectArray(
    next.links,
    evidence.candidates.linkHints
      .map((item) => ({
        label: safeString(item?.label) || "Source link",
        url: safeString(item?.url),
      }))
      .filter((item) => item.url && !notPostedUrls.has(normalizeUrl(item.url))),
    (item) => `${item.label}|${item.url}`,
  );
  const publicEvidenceLines = uniqueLines(
    [
      ...evidence.snippets.firstLines,
      ...evidence.snippets.additionalInfoLines,
      ...evidence.snippets.trafficLines,
      ...evidence.snippets.hallLayoutLines,
      ...evidence.sections.spectator,
      ...evidence.sections.venue,
      ...evidence.sections.traffic,
      ...evidence.sections.policy,
    ],
    60,
  );
  const findPublicEvidenceText = (pattern: RegExp, limit = 2) =>
    uniqueLines(
      publicEvidenceLines.filter((line) => pattern.test(line)),
      limit,
    ).join(" ");
  next.meetDetails.doorsOpen =
    next.meetDetails.doorsOpen || findPublicEvidenceText(/\bdoors?\s+open\b/i, 1) || null;
  next.meetDetails.arrivalGuidance =
    next.meetDetails.arrivalGuidance ||
    findPublicEvidenceText(
      /\b(?:plan to arrive|arrive\s+(?:one|\d+)|allow\s+\d+[–-]?\d*\s+minutes?\s+to\s+walk)\b/i,
      2,
    ) ||
    null;
  next.meetDetails.registrationInfo =
    next.meetDetails.registrationInfo ||
    findPublicEvidenceText(
      /\b(?:registration area|register the gymnast|guest services booth)\b/i,
      2,
    ) ||
    null;
  next.meetDetails.resultsInfo =
    next.meetDetails.resultsInfo ||
    findPublicEvidenceText(/\b(?:official results|live scoring|meet results)\b/i, 2) ||
    null;
  next.meetDetails.rotationSheetsInfo =
    next.meetDetails.rotationSheetsInfo ||
    findPublicEvidenceText(/\brotation sheets?\b/i, 2) ||
    null;
  next.meetDetails.operationalNotes = mergeUniqueStrings(
    next.meetDetails.operationalNotes,
    uniqueLines(
      publicEvidenceLines.filter((line) => /\bdaylight savings? time\b/i.test(line)),
      2,
    ),
  );
  next.policies.misc = mergeUniqueStrings(
    next.policies.misc,
    uniqueLines(
      publicEvidenceLines.filter((line) => /\bevent merchandise\b/i.test(line)),
      2,
    ),
  );
  const parkingLinks = evidence.resources.links
    .filter((item) => item.kind === "parking" && item.status !== "not_posted")
    .map((item) => ({
      label: item.label || "Parking",
      url: item.url,
    }));
  next.logistics.parkingLinks = mergeObjectArray(
    next.logistics.parkingLinks,
    parkingLinks,
    (item) => `${item.label}|${item.url}`,
  );
  if (!next.meetDetails.resultsInfo) {
    const resultsLink = evidence.resources.links.find(
      (item) =>
        item.status !== "not_posted" &&
        ["results_live", "results_hub", "results_pdf"].includes(item.kind),
    );
    next.meetDetails.resultsInfo = resultsLink?.label || null;
  }
  if (!next.meetDetails.rotationSheetsInfo) {
    const rotationLink = evidence.resources.links.find(
      (item) =>
        item.status !== "not_posted" && ["rotation_sheet", "rotation_hub"].includes(item.kind),
    );
    next.meetDetails.rotationSheetsInfo = rotationLink?.label || null;
  }
  return next;
}

function computeMappedCompletenessSnapshot(mapped: any): ParseCompletenessSnapshot {
  const advanced = (mapped?.advancedSections as Record<string, any>) || {};
  const coreFilled =
    [
      safeString(mapped?.title),
      safeString(mapped?.date),
      safeString(mapped?.time),
      safeString(mapped?.startISO),
      safeString(mapped?.endISO),
      safeString(mapped?.location),
      safeString(mapped?.address),
      safeString(mapped?.website),
    ].filter(Boolean).length + (pickArray(mapped?.links).length > 0 ? 1 : 0);
  const athleteFilled = [
    safeString(advanced?.roster?.athletes?.[0]?.name),
    safeString(advanced?.roster?.athletes?.[0]?.level),
    safeString(advanced?.roster?.athletes?.[0]?.team),
    safeString(advanced?.roster?.athletes?.[0]?.session),
    safeString(advanced?.meet?.warmUpTime),
    safeString(advanced?.meet?.marchInTime),
    safeString(advanced?.meet?.assignedGym),
    safeString(advanced?.meet?.awardsInfo),
  ].filter(Boolean).length;
  const meetDetailsFilled =
    [
      safeString(advanced?.meet?.warmUpTime),
      safeString(advanced?.meet?.marchInTime),
      safeString(advanced?.meet?.judgingNotes),
      safeString(advanced?.meet?.doorsOpen),
      safeString(advanced?.meet?.arrivalGuidance),
      safeString(advanced?.meet?.registrationInfo),
      safeString(advanced?.meet?.facilityLayout),
      safeString(advanced?.meet?.scoringInfo),
      safeString(advanced?.meet?.resultsInfo),
      safeString(advanced?.meet?.rotationSheetsInfo),
      safeString(advanced?.meet?.awardsInfo),
    ].filter(Boolean).length + (pickArray(advanced?.meet?.operationalNotes).length > 0 ? 1 : 0);
  const logisticsFilled =
    [
      safeString(advanced?.logistics?.hotelName),
      safeString(advanced?.logistics?.hotelInfo),
      safeString(advanced?.logistics?.mealPlan),
      safeString(advanced?.logistics?.feeAmount),
      safeString(advanced?.logistics?.parking),
      safeString(advanced?.logistics?.trafficAlerts),
      safeString(advanced?.logistics?.rideShare),
      safeString(advanced?.logistics?.accessibility),
    ].filter(Boolean).length +
    (pickArray(advanced?.logistics?.parkingLinks).length > 0 ? 1 : 0) +
    (pickArray(advanced?.logistics?.parkingPricingLinks).length > 0 ? 1 : 0);
  const coachFilled =
    [
      safeString(advanced?.coaches?.signIn),
      safeString(advanced?.coaches?.attire),
      safeString(advanced?.coaches?.hospitality),
      safeString(advanced?.coaches?.floorAccess),
      safeString(advanced?.coaches?.scratches),
      safeString(advanced?.coaches?.floorMusic),
      safeString(advanced?.coaches?.rotationSheets),
      safeString(advanced?.coaches?.awards),
      safeString(advanced?.coaches?.regionalCommitment),
      safeString(advanced?.coaches?.qualification),
      safeString(advanced?.coaches?.meetFormat),
      safeString(advanced?.coaches?.equipment),
      safeString(advanced?.coaches?.refundPolicy),
      safeString(advanced?.coaches?.paymentInstructions),
    ].filter(Boolean).length +
    (pickArray(advanced?.coaches?.entryFees).length > 0 ? 1 : 0) +
    (pickArray(advanced?.coaches?.teamFees).length > 0 ? 1 : 0) +
    (pickArray(advanced?.coaches?.lateFees).length > 0 ? 1 : 0) +
    (pickArray(advanced?.coaches?.contacts).length > 0 ? 1 : 0) +
    (pickArray(advanced?.coaches?.deadlines).length > 0 ? 1 : 0) +
    (pickArray(advanced?.coaches?.links).length > 0 ? 1 : 0) +
    (pickArray(advanced?.coaches?.notes).length > 0 ? 1 : 0);
  return {
    core: { filled: coreFilled, total: 9, score: scoreCompletenessSection(coreFilled, 9) },
    athlete: { filled: athleteFilled, total: 8, score: scoreCompletenessSection(athleteFilled, 8) },
    meetDetails: {
      filled: meetDetailsFilled,
      total: 13,
      score: scoreCompletenessSection(meetDetailsFilled, 13),
    },
    logistics: {
      filled: logisticsFilled,
      total: 10,
      score: scoreCompletenessSection(logisticsFilled, 10),
    },
    coachInfo: { filled: coachFilled, total: 21, score: scoreCompletenessSection(coachFilled, 21) },
  };
}

function determineCompletenessSparsity(
  evidenceSignals: number,
  rawScore: number,
  sanitizedScore: number,
  mappedScore: number,
): "none" | "extraction" | "sanitization" | "mapping" {
  if (mappedScore + 0.15 < sanitizedScore) return "mapping";
  if (sanitizedScore + 0.15 < rawScore) return "sanitization";
  if (evidenceSignals >= 4 && sanitizedScore < 0.2) return "extraction";
  return "none";
}

function normalizeSectionBullets(items: unknown[], limit = 6): string[] {
  return uniqueLines(
    pickArray(items)
      .map((item) => safeString(item))
      .filter(Boolean),
    limit,
  );
}

function normalizeSentence(value: unknown): string {
  const text = safeString(value).replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function joinSectionSentences(...values: unknown[]): string {
  return values
    .map((value) => normalizeSentence(value))
    .filter(Boolean)
    .join(" ");
}

function buildGymSectionVisibility(
  body: string,
  bullets: string[],
  requestedVisibility?: GymPublicSectionVisibility,
): GymPublicSectionVisibility {
  if (requestedVisibility === "visible" || requestedVisibility === "hidden") {
    return requestedVisibility;
  }
  return body || bullets.length > 0 ? "visible" : "hidden";
}

function createGymPublicPageSection(params: {
  title: string;
  body?: string;
  bullets?: unknown[];
  origin: GymPublicSectionOrigin;
  evidenceRefs?: string[];
  items?: GymPublicTravelHotelItem[];
  fallbackLink?: string | null;
  visibility?: GymPublicSectionVisibility;
  hideReason?: string | null;
}): GymPublicPageSection {
  const body = safeString(params.body).replace(/\s+/g, " ").trim();
  const bullets = normalizeSectionBullets(params.bullets || []);
  const items = normalizeTravelAccommodationHotels(params.items || []);
  const visibility =
    params.visibility === "visible" || params.visibility === "hidden"
      ? params.visibility
      : body || bullets.length > 0 || items.length > 0
        ? "visible"
        : "hidden";
  const confidenceByOrigin: Record<GymPublicSectionOrigin, number> = {
    pdf_grounded: 0.9,
    mixed: 0.8,
    derived_summary: 0.65,
    venue_enriched: 0.55,
  };
  return {
    title: params.title,
    body,
    bullets,
    origin: params.origin,
    confidence: confidenceByOrigin[params.origin],
    evidenceRefs: normalizeSectionBullets(params.evidenceRefs || [], 8),
    items,
    fallbackLink: normalizeUrl(params.fallbackLink) || null,
    visibility,
    hideReason:
      visibility === "hidden"
        ? safeString(params.hideReason) || "No attendee-safe content survived filtering."
        : null,
  };
}

function createGymDocumentsSection(
  links: Array<{ label?: string; url?: string }>,
  evidenceRefs?: string[],
  options?: {
    visibility?: GymPublicSectionVisibility;
    hideReason?: string | null;
  },
): GymPublicPageSections["documents"] {
  const normalizedLinks = uniqueBy(
    links
      .map((item) => ({
        label: safeString(item?.label) || "Document",
        url: normalizeUrl(item?.url),
      }))
      .filter((item) => item.url),
    (item) => item.url!,
  ).slice(0, 12) as Array<{ label: string; url: string }>;
  const visibility = buildGymSectionVisibility(
    "",
    normalizedLinks.map((item) => item.label),
    options?.visibility,
  );
  return {
    title: "Documents",
    links: normalizedLinks,
    origin: "pdf_grounded",
    confidence: 0.9,
    evidenceRefs: normalizeSectionBullets(evidenceRefs || [], 8),
    visibility,
    hideReason:
      visibility === "hidden"
        ? safeString(options?.hideReason) || "No public-safe documents survived filtering."
        : null,
  };
}

function buildDerivedPublicMeetOverview(params: {
  title: string;
  dates: string;
  venue: string;
  hostGym: string;
  hasCoreLocation: boolean;
}): string {
  const { title, dates, venue, hostGym, hasCoreLocation } = params;
  if (title && dates && venue) {
    return normalizeSentence(
      `${title} takes place ${dates} at ${venue}${hostGym ? ` and is hosted by ${hostGym}` : ""}`,
    );
  }
  if (title && hasCoreLocation) {
    return normalizeSentence(
      `${title} is your central hub for venue guidance, admissions, hotels, and event-day updates.`,
    );
  }
  return "";
}

function normalizeTravelAccommodationHotels(value: unknown): GymPublicTravelHotelItem[] {
  return uniqueBy(
    pickArray(value)
      .map((item) => ({
        id: safeString(item?.id) || undefined,
        address: safeString(item?.address) || null,
        bookingInstructions: safeString(item?.bookingInstructions) || null,
        discoveredValues: item?.discoveredValues,
        editedFields: item?.editedFields,
        name: safeString(item?.name),
        imageUrl: normalizeUrl(item?.imageUrl) || null,
        distanceFromVenue: safeString(item?.distanceFromVenue) || null,
        groupRate: safeString(item?.groupRate) || null,
        parking: safeString(item?.parking) || null,
        breakfast: safeString(item?.breakfast) || null,
        reservationDeadline: safeString(item?.reservationDeadline) || null,
        phone: safeString(item?.phone) || null,
        bookingUrl: hotelUrl(item?.bookingUrl),
      }))
      .filter((item) => item.name),
    (item) => `${item.name.toLowerCase()}|${item.bookingUrl || ""}`,
  );
}

function buildTravelAccommodationNarrativeFromHotels(hotels: GymPublicTravelHotelItem[]): string {
  return summarizeHotelsForNarrative(
    hotels.map((hotel) => ({
      name: hotel.name,
      imageUrl: hotel.imageUrl || null,
      distanceFromVenue: hotel.distanceFromVenue || null,
      groupRate: hotel.groupRate || null,
      parking: hotel.parking || null,
      breakfast: hotel.breakfast || null,
      reservationDeadline: hotel.reservationDeadline || null,
      phone: hotel.phone || null,
      bookingUrl: hotel.bookingUrl || null,
      notes: [],
      sourceType: "mixed",
      contentOrigin: "public_travel_section",
      confidence: 0.9,
    })),
    null,
  );
}

function buildGymPublicPageSections(params: {
  parseResult: ParseResult;
  evidence: DiscoveryEvidence | null;
  resourceLinks: DiscoveryResourceLink[];
  baseData?: any;
  extractionMeta?: ExtractionResult["extractionMeta"];
}): GymPublicPageSections {
  const { parseResult, evidence, resourceLinks, baseData, extractionMeta } = params;
  const title = safeString(parseResult.title) || safeString(baseData?.title);
  const dates =
    safeString(parseResult.dates) || safeString(baseData?.customFields?.meetDateRangeLabel);
  const venue = safeString(parseResult.venue) || safeString(baseData?.venue);
  const address = safeString(parseResult.address) || safeString(baseData?.address);
  const hostGym =
    sanitizeHostGymValue(parseResult.hostGym) || sanitizeHostGymValue(baseData?.hostGym) || "";
  const venueLabel = [venue, address].filter(Boolean).join(", ");
  const hasCoreLocation = Boolean(venue || address);
  const publicResourceLinks = resourceLinks
    .map((item) => ({
      ...item,
      audience:
        item.audience ||
        classifyGymPublicAudience(`${item.label} ${item.url} ${item.sourceUrl || ""}`),
    }))
    .map((item) => ({
      ...item,
      renderTarget: item.renderTarget || classifyGymResourceRenderTarget(item),
    }));
  const hotelLinks = publicResourceLinks
    .filter((item) => item.renderTarget === "hotels")
    .map((item) => ({ label: item.label, url: item.url }));
  const travelAccommodationState =
    baseData?.discoverySource?.travelAccommodation &&
    typeof baseData.discoverySource.travelAccommodation === "object"
      ? baseData.discoverySource.travelAccommodation
      : null;
  const travelHotels = projectTravelHotels(
    normalizeTravelAccommodationHotels(travelAccommodationState?.hotels || extractionMeta?.travelAccommodationSummary?.pdfHotels),
    normalizeTravelAccommodationHotels(baseData?.advancedSections?.logistics?.hotels),
    baseData?.advancedSections?.logistics?.discoveredHotelIds || [],
  ).hotels;
  const travelFallbackLink =
    normalizeUrl(
      travelAccommodationState?.fallbackLink ||
        extractionMeta?.travelAccommodationSummary?.fallbackLink ||
        hotelLinks[0]?.url,
    ) || null;
  const documentLinks = publicResourceLinks
    .filter((item) => item.renderTarget === "documents")
    .map((item) => ({ label: item.label, url: item.url }));
  const publicAnnouncementLines = pickArray(parseResult.communications?.announcements)
    .map((item) => safeString(item?.title || item?.body || item?.text || item?.message))
    .filter((item) => isTransientPublicAnnouncement(item));
  const derivedMeetOverview = buildDerivedPublicMeetOverview({
    title,
    dates,
    venue,
    hostGym,
    hasCoreLocation,
  });
  const dedicatedMeetFacts = collectDedicatedPublicFieldTexts(
    [
      formatDedicatedPublicFact("Doors open", parseResult.meetDetails.doorsOpen),
      formatDedicatedPublicFact("Arrival guidance", parseResult.meetDetails.arrivalGuidance),
      formatDedicatedPublicFact("Registration", parseResult.meetDetails.registrationInfo),
      formatDedicatedPublicFact("Rotation sheets", parseResult.meetDetails.rotationSheetsInfo),
      formatDedicatedPublicFact("Scoring", parseResult.meetDetails.scoringInfo),
      formatDedicatedPublicFact("Awards", parseResult.meetDetails.awardsInfo),
    ],
    6,
  );
  const publicOperationalNotes = filterPublicAudienceTexts(
    parseResult.meetDetails.operationalNotes,
    "parse_field",
    6,
  );
  const meetDetailBody = joinSectionSentences(
    derivedMeetOverview,
    ...dedicatedMeetFacts,
    ...publicOperationalNotes,
  );
  const meetDetails = createGymPublicPageSection({
    title: "Meet Details",
    body: meetDetailBody,
    bullets: [],
    origin: meetDetailBody && meetDetailBody !== derivedMeetOverview ? "mixed" : "derived_summary",
    evidenceRefs: [
      "meet_details",
      ...(publicAnnouncementLines.length > 0 ? ["announcements"] : []),
      ...(evidence?.sections.spectator.slice(0, 2) || []),
      ...(evidence?.snippets.additionalInfoLines.slice(0, 2) || []),
    ],
    visibility: meetDetailBody ? "visible" : "hidden",
    hideReason: "No attendee-safe meet overview survived filtering.",
  });

  const publicParkingBody = joinSectionSentences(
    ...collectDedicatedPublicFieldTexts(
      [
        parseResult.logistics.parking,
        parseResult.logistics.rideShare,
        parseResult.logistics.accessibility,
      ],
      4,
    ),
  );
  const parkingBody =
    publicParkingBody ||
    (hasCoreLocation
      ? normalizeSentence(
          `Parking details were not listed in the packet. Plan to arrive early at ${venue || address} and follow on-site signage for spectator parking and drop-off.`,
        )
      : "");
  const parking = createGymPublicPageSection({
    title: "Parking",
    body: parkingBody,
    bullets: [],
    origin: publicParkingBody ? "pdf_grounded" : "venue_enriched",
    evidenceRefs: [
      "parking",
      ...(evidence?.sections.traffic.slice(0, 2) || []),
      ...(evidence?.snippets.trafficLines.slice(0, 2) || []),
    ],
    visibility: parkingBody ? "visible" : "hidden",
    hideReason: "No attendee-safe parking guidance survived filtering.",
  });

  const publicTrafficBody = joinSectionSentences(
    ...collectDedicatedPublicFieldTexts([parseResult.logistics.trafficAlerts], 2),
  );
  const trafficBody =
    publicTrafficBody ||
    (hasCoreLocation
      ? normalizeSentence(
          `Allow extra arrival time near the venue, especially before the event begins, and use posted venue traffic direction on arrival.`,
        )
      : "");
  const traffic = createGymPublicPageSection({
    title: "Traffic",
    body: trafficBody,
    bullets: publicTrafficBody ? [] : [dates ? `Arrive early for ${dates}` : ""],
    origin: publicTrafficBody ? "pdf_grounded" : "venue_enriched",
    evidenceRefs: ["traffic", ...(evidence?.snippets.trafficLines.slice(0, 3) || [])],
    visibility: trafficBody ? "visible" : "hidden",
    hideReason: "No attendee-safe traffic guidance survived filtering.",
  });

  const publicFacilityLayout = collectDedicatedPublicFieldTexts(
    [parseResult.meetDetails.facilityLayout],
    2,
  );
  const venueSection = createGymPublicPageSection({
    title: "Venue Details",
    body: joinSectionSentences(venueLabel, ...publicFacilityLayout),
    bullets: [venue, address],
    origin: publicFacilityLayout.length > 0 ? "mixed" : "pdf_grounded",
    evidenceRefs: [
      "venue",
      ...(evidence?.sections.venue.slice(0, 3) || []),
      ...(evidence?.snippets.hallLayoutLines.slice(0, 2) || []),
    ],
    visibility: venueLabel || publicFacilityLayout.length > 0 ? "visible" : "hidden",
    hideReason: "Venue details are incomplete.",
  });

  const admissionSummary = parseResult.admission
    .map((item) =>
      [safeString(item.label), safeString(item.price), safeString(item.note)]
        .filter(Boolean)
        .join(": "),
    )
    .filter(Boolean)
    .join(" ");
  const publicSpectatorBullets = filterPublicAudienceTexts(
    parseResult.policies.misc,
    "parse_field",
    6,
  );
  const spectatorBody = joinSectionSentences(
    admissionSummary,
    ...collectDedicatedPublicFieldTexts(
      [
        parseResult.policies.food,
        parseResult.policies.hydration,
        parseResult.policies.safety,
        parseResult.policies.animals,
      ],
      4,
    ),
  );
  const spectatorInfo = createGymPublicPageSection({
    title: "Spectator Info",
    body: spectatorBody,
    bullets: publicSpectatorBullets,
    origin: spectatorBody || publicSpectatorBullets.length > 0 ? "pdf_grounded" : "derived_summary",
    evidenceRefs: ["spectator", ...(evidence?.sections.spectator.slice(0, 3) || [])],
    visibility: spectatorBody || publicSpectatorBullets.length > 0 ? "visible" : "hidden",
    hideReason: "No attendee-safe admission or spectator policies survived filtering.",
  });

  const travelBody = joinSectionSentences(
    ...collectDedicatedPublicFieldTexts(
      [travelAccommodationState ? "" : parseResult.logistics.hotel, buildTravelAccommodationNarrativeFromHotels(travelHotels)],
      2,
    ),
  );
  const travel = createGymPublicPageSection({
    title: "Hotels & Travel",
    body: travelBody,
    bullets: hotelLinks.map((item) => item.label),
    origin: travelBody ? "pdf_grounded" : hotelLinks.length > 0 ? "mixed" : "derived_summary",
    evidenceRefs: ["travel", ...(evidence?.resources.hotelHints.slice(0, 3) || [])],
    items: travelHotels,
    fallbackLink: travelFallbackLink,
    visibility:
      travelBody || hotelLinks.length > 0 || travelHotels.length > 0 ? "visible" : "hidden",
    hideReason: "No attendee-safe hotel or travel guidance survived filtering.",
  });

  const documents = createGymDocumentsSection(
    documentLinks,
    ["documents", ...(evidence?.candidates.linkHints.slice(0, 4).map((item) => item.label) || [])],
    {
      visibility: documentLinks.length > 0 ? "visible" : "hidden",
      hideReason: "No public-safe documents survived filtering.",
    },
  );

  return {
    meetDetails,
    parking,
    traffic,
    venue: venueSection,
    spectatorInfo,
    travel,
    documents,
  };
}

function computeGymDiscoveryPublishAssessment(
  parseResult: ParseResult,
  sections: GymPublicPageSections,
): GymDiscoveryPublishAssessment {
  const isVisible = (section: { visibility?: GymPublicSectionVisibility } | null | undefined) =>
    Boolean(section && section.visibility === "visible");
  const hasCore = Boolean(
    safeString(parseResult.title) &&
      safeString(parseResult.dates) &&
      (safeString(parseResult.venue) || safeString(parseResult.address)),
  );
  const sectionScores = {
    core: hasCore ? 1 : 0,
    meetDetails: isVisible(sections.meetDetails) ? sections.meetDetails?.confidence || 0 : 0,
    parking: isVisible(sections.parking) ? sections.parking?.confidence || 0 : 0,
    traffic: isVisible(sections.traffic) ? sections.traffic?.confidence || 0 : 0,
    venue: isVisible(sections.venue) ? sections.venue?.confidence || 0 : 0,
    spectatorInfo: isVisible(sections.spectatorInfo) ? sections.spectatorInfo?.confidence || 0 : 0,
    documents: isVisible(sections.documents) ? sections.documents?.confidence || 0 : 0,
  };
  const hasUtility = Boolean(
    parseResult.admission.length > 0 ||
      isVisible(sections.spectatorInfo) ||
      isVisible(sections.documents) ||
      isVisible(sections.travel) ||
      parseResult.links.some(
        (item) =>
          classifyGymPublicAudience(`${safeString(item?.label)} ${safeString(item?.url)}`) ===
          "public_attendee",
      ),
  );
  const reasons: string[] = [];
  if (!hasCore) reasons.push("Missing title, dates, or venue/address.");
  if (!isVisible(sections.meetDetails))
    reasons.push("Meet Details section could not be generated.");
  if (!isVisible(sections.parking)) reasons.push("Parking guidance is missing.");
  if (!isVisible(sections.traffic)) reasons.push("Traffic guidance is missing.");
  if (!hasUtility) reasons.push("No spectator, document, or utility links were found.");
  const state: GymDiscoveryPublishAssessment["state"] = !hasCore
    ? "draft"
    : !isVisible(sections.meetDetails) ||
        !isVisible(sections.parking) ||
        !isVisible(sections.traffic)
      ? "review"
      : hasUtility
        ? "auto_publish"
        : "review";
  return {
    state,
    reasons,
    sectionScores,
  };
}

function stripGymPublicPageV2ParseResult(parseResult: ParseResult): ParseResult {
  return (
    normalizeParseResult({
      ...parseResult,
      athlete: buildEmptyParseResult().athlete,
      coachInfo: buildEmptyParseResult().coachInfo,
      gear: buildEmptyParseResult().gear,
      volunteers: buildEmptyParseResult().volunteers,
      meetDetails: {
        ...parseResult.meetDetails,
        warmup: null,
        marchIn: null,
        rotationOrder: null,
        judgingNotes: null,
      },
    }) || buildEmptyParseResult()
  );
}

export function buildGymDiscoveryPublicPageArtifacts(params: {
  parseResult: ParseResult;
  baseData?: any;
  evidence?: DiscoveryEvidence | null;
  extractionMeta?: ExtractionResult["extractionMeta"];
}): {
  parseResult: ParseResult;
  publicPageSections: GymPublicPageSections;
  publishAssessment: GymDiscoveryPublishAssessment;
  pipelineVersion: "gym-public-v2";
} {
  const nextParseResult = stripGymPublicPageV2ParseResult(params.parseResult);
  const resourceLinks = uniqueBy(
    pickArray(params.extractionMeta?.resourceLinks)
      .map((item) => ({
        kind: (safeString(item?.kind) as DiscoveryResourceKind) || "other",
        status: (safeString(item?.status) as DiscoveryResourceStatus) || "unknown",
        label: safeString(item?.label) || "Resource link",
        url: normalizeUrl(item?.url),
        sourceUrl: normalizeUrl(item?.sourceUrl) || safeString(item?.sourceUrl) || null,
        audience:
          (safeString(item?.audience) as GymContentAudience) ||
          classifyGymPublicAudience(
            `${safeString(item?.label)} ${safeString(item?.url)} ${safeString(item?.sourceUrl)}`,
          ),
        renderTarget: (safeString(item?.renderTarget) as GymResourceRenderTarget) || "hidden",
      }))
      .filter((item) => item.url),
    (item) => `${item.kind}|${item.url}`,
  ).map((item) => ({
    ...item,
    renderTarget:
      item.renderTarget === "hidden" && item.audience !== "coach_ops"
        ? classifyGymResourceRenderTarget(item as DiscoveryResourceLink)
        : item.renderTarget,
  })) as DiscoveryResourceLink[];
  const publicPageSections = buildGymPublicPageSections({
    parseResult: nextParseResult,
    evidence: params.evidence || null,
    resourceLinks,
    baseData: params.baseData,
    extractionMeta: params.extractionMeta,
  });
  const publishAssessment = computeGymDiscoveryPublishAssessment(
    nextParseResult,
    publicPageSections,
  );
  return {
    parseResult: nextParseResult,
    publicPageSections,
    publishAssessment,
    pipelineVersion: "gym-public-v2",
  };
}

export async function mapParseResultToGymData(
  parseResult: ParseResult,
  baseData: any = {},
  extractionMeta?: ExtractionResult["extractionMeta"],
) {
  const usePublicPageV2 = true;
  const rawSnapshot = computeParseCompletenessSnapshot(parseResult);
  parseResult = sanitizeDiscoveryParseResult(parseResult);
  const effectiveExtractionMeta = extractionMeta || baseData?.discoverySource?.extractionMeta;
  const fallbackTitle = deriveDiscoveryFallbackTitle(
    safeString(baseData?.discoverySource?.extractedText || ""),
    effectiveExtractionMeta,
  );
  const auditEvidence =
    effectiveExtractionMeta && safeString(baseData?.discoverySource?.extractedText)
      ? buildDiscoveryEvidence(
          safeString(baseData?.discoverySource?.extractedText || ""),
          effectiveExtractionMeta,
        )
      : null;
  const sanitizedSnapshot = computeParseCompletenessSnapshot(parseResult);
  parseResult = backfillDeterministicParseFields(parseResult, auditEvidence, fallbackTitle);
  const publicArtifacts = usePublicPageV2
    ? buildGymDiscoveryPublicPageArtifacts({
        parseResult,
        baseData,
        evidence: auditEvidence,
        extractionMeta: effectiveExtractionMeta,
      })
    : null;
  if (publicArtifacts) {
    parseResult = publicArtifacts.parseResult;
  }
  const backfilledSnapshot = computeParseCompletenessSnapshot(parseResult);
  const baseTitle = safeString(baseData?.title);
  const mappedTitle =
    resolveDiscoveryEventTitle(parseResult.title, fallbackTitle) ||
    fallbackTitle ||
    (looksLikeDiscoveryPlaceholderTitle(baseTitle) ? "" : baseTitle);
  const resolvedPageTemplateId = resolveGymMeetTemplateId(baseData) || DEFAULT_GYM_MEET_TEMPLATE_ID;
  const hasExplicitStartTime = hasExplicitDiscoveryStartTime(parseResult);
  const { date, time } = splitDateTime(parseResult.startAt);
  const derivedRange = deriveDateRangeFromText(parseResult.dates);
  const hasDateConflictWithRange =
    Boolean(date) &&
    Boolean(derivedRange.startDate) &&
    !isDateWithinRange(date, derivedRange.startDate, derivedRange.endDate);
  const authoritativeDate = hasDateConflictWithRange ? derivedRange.startDate || "" : date;
  const existingAdvanced = (baseData?.advancedSections as Record<string, any>) || {};
  const resourceLinks = uniqueBy(
    pickArray(effectiveExtractionMeta?.resourceLinks)
      .map((item) => ({
        kind: (safeString(item?.kind) as DiscoveryResourceKind) || "other",
        status: (safeString(item?.status) as DiscoveryResourceStatus) || "unknown",
        label: safeString(item?.label) || "Resource link",
        url: normalizeUrl(item?.url),
        sourceUrl: normalizeUrl(item?.sourceUrl),
        availabilityText: safeString(item?.availabilityText) || null,
        availabilityDate: safeString(item?.availabilityDate) || null,
        discoveryMethod: safeString(item?.discoveryMethod) === "playwright" ? "playwright" : "http",
      }))
      .filter((item) => item.url),
    (item) => `${item.kind}|${item.url}`,
  );
  const availableResourceLinks = resourceLinks.filter((item) => item.status !== "not_posted");
  const pickAvailableResourceLink = (...kinds: DiscoveryResourceKind[]) =>
    availableResourceLinks.find((item) => kinds.includes(item.kind));
  const pickAvailableResourceLinks = (...kinds: DiscoveryResourceKind[]) =>
    availableResourceLinks.filter((item) => kinds.includes(item.kind));
  const canonicalScoresLink =
    pickAvailableResourceLink("results_live")?.url ||
    pickAvailableResourceLink("results_hub")?.url ||
    extractCanonicalUrlFromText(parseResult.meetDetails.resultsInfo) ||
    "";
  const pendingResourceKindGroups: Partial<Record<DiscoveryResourceKind, DiscoveryResourceKind[]>> =
    {
      rotation_hub: ["rotation_sheet", "rotation_hub"],
      rotation_sheet: ["rotation_sheet", "rotation_hub"],
      results_hub: ["results_live", "results_pdf", "results_hub"],
      results_pdf: ["results_live", "results_pdf", "results_hub"],
      team_divisions: ["team_divisions"],
      packet: ["packet"],
      roster: ["roster"],
      photo_video: ["photo_video"],
      apparel_form: ["apparel_form"],
      travel_accommodation: ["travel_accommodation", "hotel_booking"],
      hotel_booking: ["travel_accommodation", "hotel_booking"],
      admission: ["admission"],
      parking: ["parking"],
    };
  const pendingResources = uniqueBy(
    resourceLinks
      .filter((item) => item.status === "not_posted")
      .filter((item) => {
        const relatedKinds = pendingResourceKindGroups[item.kind] || [item.kind];
        return !availableResourceLinks.some((candidate) => relatedKinds.includes(candidate.kind));
      })
      .map((item, idx) => ({
        id: `pending-resource-${idx + 1}`,
        kind: item.kind,
        label: item.label || "Posting soon",
        availabilityText: item.availabilityText || item.label || "",
        availabilityDate: item.availabilityDate || "",
        url: item.url || "",
        sourceUrl: item.sourceUrl || "",
        lastSeenAt: new Date().toISOString(),
      }))
      .sort((a, b) => {
        if (a.availabilityDate && b.availabilityDate) {
          return a.availabilityDate.localeCompare(b.availabilityDate);
        }
        if (a.availabilityDate) return -1;
        if (b.availabilityDate) return 1;
        return a.label.localeCompare(b.label);
      }),
    (item) => `${item.kind}|${item.label}|${item.availabilityDate}`,
  );
  const travelAccommodationState =
    baseData?.discoverySource?.travelAccommodation &&
    typeof baseData.discoverySource.travelAccommodation === "object"
      ? baseData.discoverySource.travelAccommodation
      : null;
  const hotelProjection = projectTravelHotels(
    normalizeTravelAccommodationHotels(travelAccommodationState?.hotels || effectiveExtractionMeta?.travelAccommodationSummary?.pdfHotels),
    normalizeTravelAccommodationHotels(existingAdvanced.logistics?.hotels),
    existingAdvanced.logistics?.discoveredHotelIds || [],
  );
  const travelAccommodationHotels = hotelProjection.hotels;
  const travelAccommodationFallbackLink =
    normalizeUrl(
      travelAccommodationState?.fallbackLink ||
        effectiveExtractionMeta?.travelAccommodationSummary?.fallbackLink,
    ) || null;
  const derivedTravelNarrative = summarizeHotelsForNarrative(
    travelAccommodationHotels.map((hotel) => ({
      name: hotel.name,
      imageUrl: hotel.imageUrl || null,
      distanceFromVenue: hotel.distanceFromVenue || null,
      groupRate: hotel.groupRate || null,
      parking: hotel.parking || null,
      breakfast: hotel.breakfast || null,
      reservationDeadline: hotel.reservationDeadline || null,
      phone: hotel.phone || null,
      bookingUrl: hotel.bookingUrl || null,
      notes: [],
      sourceType: "mixed",
      contentOrigin: "map_parse_result",
      confidence: 0.9,
    })),
    travelAccommodationFallbackLink,
  );
  const hotelNarrative = travelAccommodationState ? derivedTravelNarrative :
    safeString(parseResult.logistics.hotel) || derivedTravelNarrative || safeString(existingAdvanced.logistics?.hotelInfo) || "";
  const inferredResultsLink = buildTextDerivedLink(
    "Official Results",
    parseResult.meetDetails.resultsInfo,
  );
  const inferredHotelLink =
    (travelAccommodationFallbackLink
      ? { label: "Hotels & Travel", url: travelAccommodationFallbackLink }
      : null) || buildTextDerivedLink("Hotels & Travel", hotelNarrative);
  const inferredRotationLink = buildTextDerivedLink(
    "Rotation Sheets",
    parseResult.meetDetails.rotationSheetsInfo,
  );
  const compactHotelName =
    hotelNarrative &&
    hotelNarrative.length <= 80 &&
    !/[\n.!?]/.test(hotelNarrative) &&
    !/\b(book|reserve|deadline|rate|parking|distance|travel)\b/i.test(hotelNarrative)
      ? hotelNarrative
      : "";
  const layoutFacts = shouldKeepOperationalLayoutEvidence(effectiveExtractionMeta)
    ? uniqueLines(
        sanitizeVenueFactLines(
          pickArray(effectiveExtractionMeta?.gymLayoutFacts)
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
          },
        ),
        14,
      )
    : [];
  const assignedGym = safeString(
    parseResult.athlete.assignedGym || existingAdvanced.meet?.assignedGym || "",
  );
  const extractionLayoutImage = safeString(effectiveExtractionMeta?.gymLayoutImageDataUrl);
  const extractionLayoutZones = normalizeGymLayoutZones(effectiveExtractionMeta?.gymLayoutZones);
  const assignedGymLayoutImage =
    assignedGym && extractionLayoutImage
      ? await cropGymLayoutImageToAssignedGym(
          extractionLayoutImage,
          extractionLayoutZones,
          assignedGym,
        )
      : null;
  const resolvedGymLayoutImage =
    safeString(assignedGymLayoutImage) ||
    extractionLayoutImage ||
    safeString(existingAdvanced.logistics?.gymLayoutImage) ||
    "";
  const resolvedGymLayoutLabel = assignedGym ? `Assigned gym location: ${assignedGym}` : "";
  const rotationSource = safeString(parseResult.meetDetails.rotationOrder);
  const hasRotationNarrative = /(rotation sheets?|hard cop(y|ies)|download|website|refresh)/i.test(
    rotationSource,
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
    safeString(parseResult.coachInfo.signIn),
  ].filter(Boolean);
  const dedicatedFieldKeys = new Set(
    dedicatedFieldValues.map((item) => normalizeVenueFactForCompare(item)).filter(Boolean),
  );
  const operationalNotesRaw = uniqueBy(
    [...parseResult.meetDetails.operationalNotes, rotationNarrative, ...layoutFacts].filter(
      Boolean,
    ),
    (item) => normalizeVenueFactForCompare(item),
  );
  const operationalNotes = operationalNotesRaw
    .filter((item) => {
      const key = normalizeVenueFactForCompare(item);
      if (!key) return false;
      if (dedicatedFieldKeys.has(key)) return false;
      if (isLowSignalOperationalNote(item)) return false;
      return true;
    })
    .slice(0, 16);
  const admissionText = parseResult.admission
    .map((item) => [item.label, item.price, item.note].filter(Boolean).join(": ").trim())
    .filter(Boolean)
    .join("\n");
  const publicMeetDetails = publicArtifacts?.publicPageSections.meetDetails || null;
  const publicParking = publicArtifacts?.publicPageSections.parking || null;
  const publicTraffic = publicArtifacts?.publicPageSections.traffic || null;
  const publicTravel = publicArtifacts?.publicPageSections.travel || null;
  const athlete = parseResult.athlete;
  const existingDocuments = pickArray(existingAdvanced.logistics?.additionalDocuments)
    .map((item) => ({
      id: safeString(item?.id),
      name: safeString(item?.name),
      url: normalizeUrl(item?.url),
    }))
    .filter((item) => item.url);
  const canonicalResourceDocuments = pickAvailableResourceLinks(
    "packet",
    "roster",
    "team_divisions",
    "rotation_sheet",
    "photo_video",
    "apparel_form",
  ).map((item, idx) => ({
    id: `resource-doc-${idx + 1}`,
    name: item.label || `Document ${idx + 1}`,
    url: item.url!,
  }));
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
    ...canonicalResourceDocuments,
  ].filter((item): item is { id: string; name: string; url: string } => Boolean(item?.url));
  const additionalDocuments = uniqueBy(
    [...incomingDocuments, ...existingDocuments],
    (item) => item.url,
  ).map((item, idx) => ({
    id: item.id || `doc-${idx + 1}`,
    name: item.name || `Document ${idx + 1}`,
    url: item.url,
  }));
  const assistantCoachRolePattern = /\bassistant coach\b/i;
  const publicMeetContacts = uniqueBy(
    [
      ...pickArray(existingAdvanced.meet?.staffContacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "public"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Meet staff"))
      .filter(
        (
          item,
        ): item is {
          role: string;
          name: string | null;
          email: string | null;
          phone: string | null;
        } => Boolean(item),
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|"),
  );
  const venueContacts = uniqueBy(
    [
      ...pickArray(existingAdvanced.logistics?.venueContacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "venue"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Venue contact"))
      .filter(
        (
          item,
        ): item is {
          role: string;
          name: string | null;
          email: string | null;
          phone: string | null;
        } => Boolean(item),
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|"),
  );
  const venueContactNotes = uniqueLines(
    [
      ...pickArray(existingAdvanced.logistics?.venueContactNotes),
      ...parseResult.unmappedFacts
        .filter((fact) => !shouldSuppressUnmappedFact(fact))
        .filter((fact) => /\bvenue_contact\b/i.test(safeString(fact.category)))
        .map((fact) => safeString(fact.detail)),
    ],
    6,
  );
  const coachContacts = uniqueBy(
    [
      ...pickArray(parseResult.coachInfo?.contacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "coach"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Coach contact"))
      .filter(
        (
          item,
        ): item is {
          role: string;
          name: string | null;
          email: string | null;
          phone: string | null;
        } => Boolean(item),
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|"),
  );
  const primaryCoachContact =
    coachContacts.find((item) => /\bhead coach\b/i.test(item.role)) ||
    coachContacts.find(
      (item) => /\bcoach\b/i.test(item.role) && !assistantCoachRolePattern.test(item.role),
    ) ||
    coachContacts[0] ||
    null;
  const assistantCoachContact =
    coachContacts.find((item) => assistantCoachRolePattern.test(item.role)) || null;
  const derivedCoachName = safeString(primaryCoachContact?.name);
  const derivedAssistantCoachName = safeString(assistantCoachContact?.name);
  const derivedCoachPhone = safeString(primaryCoachContact?.phone);
  const coachSectionEnabled = hasCoachInfoContent(parseResult.coachInfo);
  const coachLinks = uniqueBy(
    [
      ...parseResult.coachInfo.links,
      ...parseResult.links,
      inferredResultsLink,
      inferredRotationLink,
    ]
      .filter(Boolean)
      .map((item) => ({
        label: safeString(item?.label) || "Coach link",
        url: normalizeUrl(item?.url),
      }))
      .filter(
        (item) =>
          item.url &&
          /(coach|entry|payment|refund|qualification|regional|rotation|meet maker|reservation|score|result)/i.test(
            `${item.label} ${item.url}`,
          ),
      ),
    (item) => item.url,
  );
  const coachNotes = uniqueBy(
    parseResult.coachInfo.notes.map((item) => safeString(item)).filter(Boolean),
    (item) => item,
  );
  const coachDeadlines = uniqueBy(
    parseResult.coachInfo.deadlines.map((item) => ({
      label: safeString(item.label) || "Coach deadline",
      date: safeString(item.date) || "",
      note: safeString(item.note) || "",
    })),
    (item) => `${item.label}|${item.date}|${item.note}`,
  );

  const existingAnnouncementEntries: Array<{ title: string; body: string }> = pickArray(
    existingAdvanced.announcements?.announcements,
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
    [...parsedAnnouncementEntries, ...existingAnnouncementEntries].filter(
      (item) => safeString(item.title) || safeString(item.body),
    ),
    (item) => `${safeString(item.title)}|${safeString(item.body)}`,
  );

  const nextAdvanced = {
    ...existingAdvanced,
    roster: {
      ...(existingAdvanced.roster || {}),
      enabled: !usePublicPageV2,
      showAttendance: !usePublicPageV2,
      athletes: usePublicPageV2
        ? []
        : athlete.name
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
              },
            ]
          : existingAdvanced.roster?.athletes || [],
    },
    meet: {
      ...(existingAdvanced.meet || {}),
      warmUpTime: usePublicPageV2
        ? ""
        : parseResult.meetDetails.warmup || athlete.stretchTime || "",
      marchInTime: usePublicPageV2 ? "" : parseResult.meetDetails.marchIn || athlete.marchIn || "",
      assignedGym: assignedGym || safeString(existingAdvanced.meet?.assignedGym) || "",
      rotationOrder: usePublicPageV2 ? [] : rotationOrder,
      judgingNotes: usePublicPageV2
        ? ""
        : [parseResult.meetDetails.judgingNotes, rotationNarrative].filter(Boolean).join("\n\n"),
      startApparatus: usePublicPageV2 ? "" : rotationOrder[0] || "",
      scoresLink: canonicalScoresLink || safeString(existingAdvanced.meet?.scoresLink) || "",
      doorsOpen: parseResult.meetDetails.doorsOpen || "",
      arrivalGuidance: parseResult.meetDetails.arrivalGuidance || "",
      registrationInfo: parseResult.meetDetails.registrationInfo || "",
      facilityLayout: parseResult.meetDetails.facilityLayout || "",
      scoringInfo: parseResult.meetDetails.scoringInfo || "",
      resultsInfo: parseResult.meetDetails.resultsInfo || "",
      rotationSheetsInfo: parseResult.meetDetails.rotationSheetsInfo || "",
      awardsInfo: parseResult.meetDetails.awardsInfo || "",
      operationalNotes: usePublicPageV2 ? publicMeetDetails?.bullets || [] : operationalNotes,
      pendingResources,
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
      discoveredHotelIds: hotelProjection.discoveredHotelIds,
      enabled: usePublicPageV2 ? true : (existingAdvanced.logistics?.enabled ?? false),
      hotelName:
        (travelAccommodationHotels.length === 1 ? travelAccommodationHotels[0]?.name : "") ||
        compactHotelName ||
        safeString(existingAdvanced.logistics?.hotelName) ||
        "",
      hotelAddress: safeString(existingAdvanced.logistics?.hotelAddress) || "",
      hotelInfo: usePublicPageV2 ? publicTravel?.body || hotelNarrative : hotelNarrative,
      hotels:
        travelAccommodationHotels.length > 0
          ? travelAccommodationHotels
          : pickArray(existingAdvanced.logistics?.hotels)
              .map((item) => ({
                name: safeString(item?.name),
                imageUrl: normalizeUrl(item?.imageUrl) || null,
                distanceFromVenue: safeString(item?.distanceFromVenue) || null,
                groupRate: safeString(item?.groupRate) || null,
                parking: safeString(item?.parking) || null,
                breakfast: safeString(item?.breakfast) || null,
                reservationDeadline: safeString(item?.reservationDeadline) || null,
                phone: safeString(item?.phone) || null,
                bookingUrl: normalizeUrl(item?.bookingUrl) || null,
              }))
              .filter((item) => item.name),
      fallbackTravelLink:
        safeString(publicTravel?.fallbackLink) ||
        travelAccommodationFallbackLink ||
        safeString(existingAdvanced.logistics?.fallbackTravelLink) ||
        "",
      mealPlan: parseResult.logistics.meals || "",
      feeAmount: parseResult.logistics.fees || "",
      additionalDocuments,
      parking: usePublicPageV2 ? publicParking?.body || "" : parseResult.logistics.parking || "",
      trafficAlerts: usePublicPageV2
        ? publicTraffic?.body || ""
        : parseResult.logistics.trafficAlerts || "",
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
      enabled: usePublicPageV2 ? false : coachSectionEnabled,
      signIn: usePublicPageV2 ? "" : parseResult.coachInfo.signIn || "",
      attire: usePublicPageV2 ? "" : parseResult.coachInfo.attire || "",
      hospitality: usePublicPageV2 ? "" : parseResult.coachInfo.hospitality || "",
      floorAccess: usePublicPageV2 ? "" : parseResult.coachInfo.floorAccess || "",
      scratches: usePublicPageV2 ? "" : parseResult.coachInfo.scratches || "",
      floorMusic: usePublicPageV2 ? "" : parseResult.coachInfo.floorMusic || "",
      rotationSheets: usePublicPageV2 ? "" : parseResult.coachInfo.rotationSheets || "",
      awards: usePublicPageV2 ? "" : parseResult.coachInfo.awards || "",
      regionalCommitment: usePublicPageV2 ? "" : parseResult.coachInfo.regionalCommitment || "",
      qualification: usePublicPageV2 ? "" : parseResult.coachInfo.qualification || "",
      meetFormat: usePublicPageV2 ? "" : parseResult.coachInfo.meetFormat || "",
      equipment: usePublicPageV2 ? "" : parseResult.coachInfo.equipment || "",
      refundPolicy: usePublicPageV2 ? "" : parseResult.coachInfo.refundPolicy || "",
      paymentInstructions: usePublicPageV2 ? "" : parseResult.coachInfo.paymentInstructions || "",
      entryFees: usePublicPageV2
        ? []
        : parseResult.coachInfo.entryFees.map((item, idx) => ({
            id: `entry-fee-${idx + 1}`,
            label: item.label,
            amount: item.amount,
            note: item.note || "",
          })),
      teamFees: usePublicPageV2
        ? []
        : parseResult.coachInfo.teamFees.map((item, idx) => ({
            id: `team-fee-${idx + 1}`,
            label: item.label,
            amount: item.amount,
            note: item.note || "",
          })),
      lateFees: usePublicPageV2
        ? []
        : parseResult.coachInfo.lateFees.map((item, idx) => ({
            id: `late-fee-${idx + 1}`,
            label: item.label,
            amount: item.amount,
            trigger: item.trigger || "",
            note: item.note || "",
          })),
      deadlines: usePublicPageV2
        ? []
        : coachDeadlines.map((item, idx) => ({
            id: `coach-deadline-${idx + 1}`,
            label: item.label,
            date: item.date,
            note: item.note,
          })),
      contacts: usePublicPageV2
        ? []
        : coachContacts.map((item, idx) => ({
            id: `coach-contact-${idx + 1}`,
            role: item.role,
            name: item.name || "",
            email: item.email || "",
            phone: item.phone || "",
          })),
      links: usePublicPageV2
        ? []
        : coachLinks.map((item, idx) => ({
            id: `coach-link-${idx + 1}`,
            label: item.label,
            url: item.url,
          })),
      notes: usePublicPageV2 ? [] : coachNotes,
    },
    gear: {
      ...(existingAdvanced.gear || {}),
      enabled: usePublicPageV2 ? false : (existingAdvanced.gear?.enabled ?? false),
      leotardOfDay: usePublicPageV2 ? "" : parseResult.gear.uniform || "",
      items: usePublicPageV2
        ? []
        : (parseResult.gear.checklist || []).map((item, idx) => ({
            id: `gear-${idx + 1}`,
            name: item,
            required: true,
            acknowledged: false,
          })),
    },
    volunteers: {
      ...(existingAdvanced.volunteers || {}),
      enabled: usePublicPageV2 ? false : (existingAdvanced.volunteers?.enabled ?? false),
      signupLink: usePublicPageV2 ? "" : parseResult.volunteers.signupLink || "",
      notes: usePublicPageV2 ? "" : parseResult.volunteers.notes || "",
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
    authoritativeDate || derivedRange.startDate || toIsoDateOnlyOrNull(baseData?.date) || "";
  const mappedTime = (() => {
    if (!hasExplicitStartTime) return "";
    if (authoritativeDate) return time || safeString(baseData?.time) || "";
    if (parseResult.startAt) return time || "";
    if (safeString(baseData?.date) === mappedDate) return safeString(baseData?.time) || "";
    return "";
  })();
  const mappedStartISO = (() => {
    if (!hasExplicitStartTime) return null;
    if (parseResult.startAt && !hasDateConflictWithRange) return parseResult.startAt;
    const existingStart = safeString(toIsoOrNull(baseData?.startISO));
    if (existingStart && mappedDate && existingStart.startsWith(mappedDate)) {
      return existingStart;
    }
    return null;
  })();
  const mappedEndISO = (() => {
    if (!hasExplicitStartTime) return null;
    if (parseResult.endAt && !hasDateConflictWithRange) return parseResult.endAt;
    const existingEnd = safeString(toIsoOrNull(baseData?.endISO));
    if (existingEnd && mappedDate && existingEnd.startsWith(mappedDate)) {
      return existingEnd;
    }
    return null;
  })();

  const finalMapped = {
    ...baseData,
    title: mappedTitle,
    details: usePublicPageV2
      ? safeString(publicMeetDetails?.body) || safeString(baseData?.details)
      : safeString(baseData?.details),
    date: mappedDate,
    time: mappedTime,
    startISO: mappedStartISO,
    endISO: mappedEndISO,
    timezone: parseResult.timezone || baseData?.timezone || null,
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
      team: sanitizeHostGymValue(parseResult.hostGym) || sanitizeHostGymValue(athlete.team) || "",
      season: baseData?.customFields?.season || "",
      coach: baseData?.customFields?.coach || derivedCoachName || "",
      assistantCoach: baseData?.customFields?.assistantCoach || derivedAssistantCoachName || "",
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
        ...availableResourceLinks.map((item) => ({ label: item.label, url: item.url! })),
        ...parseResult.links,
        ...parseResult.coachInfo.links,
        ...parseResult.logistics.parkingLinks,
        ...parseResult.logistics.parkingPricingLinks,
        inferredResultsLink,
        inferredHotelLink,
        inferredRotationLink,
      ].filter((item): item is { label: string; url: string } => Boolean(item?.url)),
      (item) => item.url,
    ),
    advancedSections: nextAdvanced,
    accessControl: nextAccessControl || baseData?.accessControl || null,
    templateKey: "gymnastics",
    templateId: "gymnastics-schedule",
    pageTemplateId: resolvedPageTemplateId,
    category: "sport_gymnastics_schedule",
  };
  if (effectiveExtractionMeta) {
    const mappedSnapshot = computeMappedCompletenessSnapshot(finalMapped);
    const evidenceSignals = auditEvidence
      ? computeEvidenceSignalCounts(auditEvidence, effectiveExtractionMeta)
      : {
          core: 0,
          athlete: 0,
          meetDetails: 0,
          logistics: 0,
          coachInfo: 0,
          schedule: 0,
        };
    effectiveExtractionMeta.parseDiagnostics = {
      ...(effectiveExtractionMeta.parseDiagnostics || {}),
      completeness: {
        sectionScores: Object.fromEntries(
          (Object.keys(rawSnapshot) as Array<keyof ParseCompletenessSnapshot>).map((key) => [
            key,
            {
              raw: rawSnapshot[key].score,
              sanitized: sanitizedSnapshot[key].score,
              backfilled: backfilledSnapshot[key].score,
              mapped: mappedSnapshot[key].score,
              evidenceSignals: evidenceSignals[key],
              sparseAt: determineCompletenessSparsity(
                evidenceSignals[key],
                rawSnapshot[key].score,
                sanitizedSnapshot[key].score,
                mappedSnapshot[key].score,
              ),
            },
          ]),
        ) as Record<
          string,
          {
            raw: number;
            sanitized: number;
            backfilled: number;
            mapped: number;
            evidenceSignals: number;
            sparseAt: "none" | "extraction" | "sanitization" | "mapping";
          }
        >,
      },
    };
  }
  return finalMapped;
}

export const __testUtils = {
  deriveDateRangeFromText,
  classifyMeetDateCandidates,
  sanitizeHostGymValue,
  normalizeParseResult,
  normalizeParseClassification,
  inferHeuristicParseClassification,
  selectParsePromptProfiles,
  selectEvidenceForParseProfile,
  mergeParseResultsByProfile,
  sanitizeDiscoveryParseResult,
  mergeCoachFeesFromAdmission,
  routeCoachDeadlines,
  hasCoachInfoContent,
  backfillDeterministicParseFields,
  computeParseCompletenessSnapshot,
  computeMappedCompletenessSnapshot,
  determineCompletenessSparsity,
  parseResourceStatusFromLabel,
  classifyResourceLink,
  buildEventFingerprint,
  scoreEventResourceMatch,
  collectDiscoveryCandidates,
  compareDiscoveryCandidates,
  resolveDiscoveryEventTitle,
  setUrlDiscoveryTestHooks(hooks: UrlDiscoveryTestHooks | null) {
    urlDiscoveryTestHooks = hooks;
  },
  resetUrlDiscoveryTestHooks() {
    urlDiscoveryTestHooks = null;
  },
};
