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
/** Read env at call time (e.g. tests) — client/server const snapshot uses the value at bundle load. */
export function isGymDiscoveryScheduleGridEnabled(): boolean {
  if (typeof process === "undefined" || !process.env) return false;
  const v = process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;
  return typeof v === "string" && v.trim() === "1";
}

export const GYM_DISCOVERY_SCHEDULE_GRID_ENABLED = isGymDiscoveryScheduleGridEnabled();
