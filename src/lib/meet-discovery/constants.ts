/**
 * Gymnastics discovery now always runs through the attendee-first public-page pipeline.
 * Keep the helper as a stable import surface for callers that depend on this import.
 */
export function isGymDiscoveryPublicPageV2Enabled(): boolean {
  return true;
}

export const GYM_DISCOVERY_PUBLIC_PAGE_V2 = isGymDiscoveryPublicPageV2Enabled();
