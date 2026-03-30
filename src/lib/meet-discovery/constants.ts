/**
 * When unset or not `"1"`, discovery skips schedule grid derivation, PDF schedule page extraction,
 * and strips grids before persist. The gymnastics customize builder hides the Schedule section.
 *
 * Set `GYM_DISCOVERY_SCHEDULE_GRID_ENABLED=1` when running `meet-discovery` unit tests, or in
 * deployment to restore legacy schedule grid behavior.
 *
 * Standalone module so client bundles (e.g. gymnastics customize) can import without pulling
 * `meet-discovery.ts` → `pdf-raster` → `@napi-rs/canvas`.
 */
/**
 * Schedule/session grid extraction is temporarily disabled across gymnastics discovery.
 * Keep the helper as a stable import surface for older callers/tests.
 */
export function isGymDiscoveryScheduleGridEnabled(): boolean {
  return false;
}

export const GYM_DISCOVERY_SCHEDULE_GRID_ENABLED = isGymDiscoveryScheduleGridEnabled();

/**
 * Gymnastics discovery now always runs through the attendee-first public-page pipeline.
 * Keep the helper as a stable import surface for older callers/tests.
 */
export function isGymDiscoveryPublicPageV2Enabled(): boolean {
  return true;
}

export const GYM_DISCOVERY_PUBLIC_PAGE_V2 = isGymDiscoveryPublicPageV2Enabled();
