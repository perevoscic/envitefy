/** Missing status remains compatible with existing published events. */
export function isEventDraft(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return [data.status, data.draftStatus].some(
    (status) => typeof status === "string" && status.trim().toLowerCase() === "draft",
  );
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
