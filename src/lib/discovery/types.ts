export type DiscoveryWorkflow = "gymnastics";

export type DiscoveryStage =
  | "ingested"
  | "extract"
  | "parse"
  | "map"
  | "enrich"
  | "compose_public"
  | "review_ready"
  | "published";

export type DiscoveryFailureStage =
  | "failed_intake"
  | "failed_extract"
  | "failed_parse"
  | "failed_enrich"
  | "failed_compose"
  | "needs_review";

export type DiscoveryPipelineLease = {
  ownerId: string;
  acquiredAt: string;
  expiresAt: string;
};

export type DiscoveryPipelineState = {
  processingStage: DiscoveryStage | DiscoveryFailureStage;
  lastSuccessfulStage: DiscoveryStage | null;
  needsHumanReview: boolean;
  publishReady: boolean;
  reviewFlags: string[];
  errorCode: string | null;
  errorMessage: string | null;
  attempts: Partial<Record<DiscoveryStage, number>>;
  timingsMs: Partial<Record<DiscoveryStage, number>>;
  lease: DiscoveryPipelineLease | null;
};

export type DiscoverySourceRecord = {
  type: "file" | "url";
  url?: string | null;
  label?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  blobStored?: boolean;
  originalName?: string | null;
  originalMimeType?: string | null;
  originalSizeBytes?: number | null;
  optimizedByQpdf?: boolean | null;
  dataUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiscoveryPage = {
  pageNumber: number;
  text: string;
  width?: number | null;
  height?: number | null;
  imageUrl?: string | null;
};

export type DiscoveryTextBlock = {
  id: string;
  pageNumber: number;
  text: string;
  role?: string | null;
};

export type DiscoveryTable = {
  id: string;
  pageNumber: number;
  rows: string[][];
  title?: string | null;
};

export type DiscoveryLink = {
  label: string;
  url: string;
  sourceUrl?: string | null;
};

export type DiscoveryResource = {
  kind: string;
  label: string;
  url: string;
  sourceUrl?: string | null;
  status?: string | null;
  audience?: string | null;
  renderTarget?: string | null;
};

export type DiscoveryEvidence = {
  kind: string;
  label: string;
  value?: string | null;
  score?: number | null;
  metadata?: Record<string, unknown>;
};

export type DiscoveryDocument = {
  sourceType: "pdf" | "image" | "url";
  documentTypeHints: string[];
  pageCount: number;
  hasEmbeddedText: boolean;
  ocrUsed: boolean;
  pages: DiscoveryPage[];
  textBlocks: DiscoveryTextBlock[];
  tables: DiscoveryTable[];
  links: DiscoveryLink[];
  resources: DiscoveryResource[];
  evidence: DiscoveryEvidence[];
  extractionMeta: Record<string, unknown>;
};

export type CanonicalIssue = {
  code: string;
  message: string;
  severity?: "info" | "warning" | "error";
};

export type CanonicalDiscoveryParse = {
  workflow: "gymnastics";
  eventCore: Record<string, unknown>;
  venue: Record<string, unknown>;
  spectatorInfo: Record<string, unknown>;
  logistics: Record<string, unknown>;
  links: Record<string, unknown>;
  documents: Record<string, unknown>[];
  meetDetailsInputs: string[];
  confidence: Record<string, number>;
  issues: CanonicalIssue[];
};

export type GymBuilderDraft = {
  event: Record<string, unknown>;
  venue: Record<string, unknown>;
  advancedSections: Record<string, unknown>;
  canonicalLinks: Record<string, unknown>;
  reviewFlags: string[];
};

export type PublicLink = {
  label: string;
  url: string;
};

export type PublishAssessment = {
  state: string;
  reasons: string[];
};

export type PublicHero = {
  title: string;
  dateLabel: string;
  venue: string;
  badges: string[];
};

export type PublicSectionProvenance =
  | "pdf_grounded"
  | "derived_summary"
  | "location_enriched"
  | "mixed"
  | "manual_edit";

export type GymPublicSection = {
  title: string;
  visibility: string;
  body?: string;
  bullets?: string[];
  links?: PublicLink[];
  items?: Array<{
    name: string;
    imageUrl?: string | null;
    distanceFromVenue?: string | null;
    groupRate?: string | null;
    parking?: string | null;
    breakfast?: string | null;
    reservationDeadline?: string | null;
    phone?: string | null;
    bookingUrl?: string | null;
  }>;
  fallbackLink?: string | null;
  hideReason?: string | null;
  provenance: PublicSectionProvenance;
  confidence: number;
};

export type GymPublicArtifacts = {
  pipelineVersion: "gym-public-v3";
  publishAssessment: PublishAssessment;
  hero: PublicHero;
  sections: Record<string, GymPublicSection>;
  quickAccess: PublicLink[];
};

export type EventDiscoveryRow = {
  id: string;
  eventId: string;
  workflow: "gymnastics";
  source: DiscoverySourceRecord;
  document: DiscoveryDocument | null;
  canonicalParse: CanonicalDiscoveryParse | null;
  enrichment: Record<string, unknown> | null;
  pipeline: DiscoveryPipelineState;
  debug: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type DiscoveryStatusResponse = {
  eventId: string;
  discoveryId: string;
  processingStage: DiscoveryStage | DiscoveryFailureStage;
  lastSuccessfulStage: DiscoveryStage | null;
  needsHumanReview: boolean;
  builderReady: boolean;
  errorCode: string | null;
  errorStage: string | null;
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;
  reviewFlags: string[];
};
