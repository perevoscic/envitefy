export type ScanArtworkState = {
  version: 1;
  status: "pending" | "generating" | "ready" | "failed";
  imageUrl?: string;
  heroImageUrl?: string;
  updatedAt?: string;
};

export function normalizeScanArtwork(value: unknown): ScanArtworkState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    row.version !== 1 ||
    !["pending", "generating", "ready", "failed"].includes(String(row.status))
  )
    return null;
  const imageUrl =
    typeof row.imageUrl === "string" &&
    (/^https:\/\//.test(row.imageUrl) || /^\/(?!\/)/.test(row.imageUrl))
      ? row.imageUrl
      : undefined;
  return {
    version: 1,
    status:
      row.status === "ready" && !imageUrl ? "failed" : (row.status as ScanArtworkState["status"]),
    imageUrl,
    heroImageUrl:
      typeof row.heroImageUrl === "string" &&
      (/^https:\/\//.test(row.heroImageUrl) || /^\/(?!\/)/.test(row.heroImageUrl))
        ? row.heroImageUrl
        : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}
