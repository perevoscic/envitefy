/** Missing status remains compatible with existing published events. */
export function isEventDraft(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  // Import processing stages are never publication. Older discovery shells predate draftStatus.
  const statuses = [data.status, data.draftStatus].map((status) => typeof status === "string" ? status.trim().toLowerCase() : "");
  const source = data.discoverySource && typeof data.discoverySource === "object" && !Array.isArray(data.discoverySource) ? data.discoverySource as Record<string, unknown> : {};
  const discovery = /^(?:meet-discovery(?:-v2)?|football-discovery(?:-v2)?|sports-discovery-v1)$/.test(String(data.createdVia || "")) || ["gymnastics", "football", "sports"].includes(String(source.workflow || ""));
  if (discovery && statuses.includes("published")) return false;
  if (discovery && statuses.some((status) => ["processing", "review_ready", "ingested", "needs_review", "failed_extract", "failed_parse", "failed_enrich", "failed_compose"].includes(status))) return true;
  return [data.status, data.draftStatus].some(
    (status) => typeof status === "string" && status.trim().toLowerCase() === "draft",
  );
}

/** Shared SQL counterpart for compact public/history projections of old import shells. */
export function legacyDiscoveryDraftSql(dataSql: string): string {
  return `(
    (coalesce(${dataSql}->>'createdVia','') in ('meet-discovery','meet-discovery-v2','football-discovery','football-discovery-v2','sports-discovery-v1')
      or coalesce(${dataSql}#>>'{discoverySource,workflow}','') in ('gymnastics','football','sports'))
    and (lower(trim(coalesce(${dataSql}->>'status',''))) in ('processing','review_ready','ingested','needs_review','failed_extract','failed_parse','failed_enrich','failed_compose')
      or lower(trim(coalesce(${dataSql}->>'draftStatus',''))) in ('processing','review_ready','ingested','needs_review','failed_extract','failed_parse','failed_enrich','failed_compose'))
    and lower(trim(coalesce(${dataSql}->>'status',''))) <> 'published'
    and lower(trim(coalesce(${dataSql}->>'draftStatus',''))) <> 'published'
  )`;
}
export function canReadEventDraft(
  data: unknown,
  ownerId: string | null | undefined,
  viewerId?: string | null,
): boolean {
  return !isEventDraft(data) || Boolean(ownerId && viewerId && ownerId === viewerId);
}
export function isClientDraftId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}
