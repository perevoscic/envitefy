export {
  computeGymBuilderStatuses,
  GYM_DISCOVERY_PUBLIC_PAGE_V2,
} from "./core";

export type {
  DiscoveryEvidence,
  DiscoveryEnrichmentState,
  DiscoveryEnrichmentStatus,
  DiscoveryExtractionOptions,
  DiscoveryMode,
  DiscoveryParseLogSummary,
  DiscoveryPerformance,
  DiscoveryResourceKind,
  DiscoveryResourceLink,
  DiscoveryResourceStatus,
  DiscoverySourceInput,
  DiscoveryWorkflow,
  GymContentAudience,
  GymDiscoveryPublishAssessment,
  GymPublicDocumentSection,
  GymPublicPageSection,
  GymPublicPageSections,
  GymPublicSectionOrigin,
  GymPublicSectionVisibility,
  GymPublicTravelHotelItem,
  GymResourceRenderTarget,
  ParseResult,
} from "./core";

export type DiscoveryExtractionResult = Awaited<ReturnType<typeof import("./core").extractDiscoveryText>>;
