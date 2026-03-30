/** Browser-safe string helpers for discovery modules imported by client bundles. */

export function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
