type DocumentShareNavigator = {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

export type DocumentShareResult = "opened" | "unsupported" | "cancelled" | "failed";

/** Share the file itself; an owner-only source URL is not useful to its recipient. */
export async function shareOriginalDocument(
  file: File,
  navigatorApi: DocumentShareNavigator,
): Promise<DocumentShareResult> {
  if (!navigatorApi.share || !navigatorApi.canShare) return "unsupported";
  const data: ShareData = { files: [file] };
  try {
    if (!navigatorApi.canShare(data)) return "unsupported";
    // The viewer loads the file before the click, preserving transient user activation.
    await navigatorApi.share(data);
    return "opened";
  } catch (error) {
    return error instanceof Error && error.name === "AbortError" ? "cancelled" : "failed";
  }
}
