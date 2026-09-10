export type ScanDisplayCopy = {
  version: 1;
  status: "pending" | "generating" | "ready" | "skipped" | "failed";
  sourceUrl: string;
  updatedAt: string;
  token?: string;
  dataUrl?: string;
  storageKind?: "encrypted-blob";
  type?: "image/webp";
  sizeBytes?: number;
  width?: number;
  height?: number;
};

export type ScanImageOriginal = {
  dataUrl: string;
  type: string;
  storageKind?: string;
  displayCopy?: ScanDisplayCopy;
};

export function scanImageOriginal(data: Record<string, unknown>): ScanImageOriginal | null {
  const attachment = data.attachment;
  if (!attachment || typeof attachment !== "object") return null;
  if (!("dataUrl" in attachment) || typeof attachment.dataUrl !== "string") return null;
  if (!("type" in attachment) || !/^image\/(jpeg|png|webp)$/.test(String(attachment.type)))
    return null;
  return attachment as ScanImageOriginal;
}

export function readyScanDisplayCopy(original: ScanImageOriginal): ScanDisplayCopy | null {
  const copy = original.displayCopy;
  return copy?.version === 1 &&
    copy.status === "ready" &&
    copy.sourceUrl === original.dataUrl &&
    typeof copy.dataUrl === "string" &&
    copy.storageKind === "encrypted-blob" &&
    copy.type === "image/webp"
    ? copy
    : null;
}

/** Mark work only when explicitly saving a scan; uploading alone never creates an event. */
export function prepareSavedScanDisplay(data: Record<string, unknown>): boolean {
  if (!/^ocr(?:-|$)/.test(String(data.createdVia || "")) && data.createdVia !== "scan-event-page")
    return false;
  const original = scanImageOriginal(data);
  if (!original) return false;
  original.displayCopy = {
    version: 1,
    status: "pending",
    sourceUrl: original.dataUrl,
    updatedAt: new Date().toISOString(),
  };
  return true;
}
