import { randomUUID } from "node:crypto";
import { parseDataUrlBase64 } from "../utils/data-url";
import { replaceTransientEventMedia } from "./event-media";
import { processBufferUpload } from "./media-upload";
import { resolveScanMediaPolicy } from "./ocr/scan-media";

/** Public discovery sources only. Private scans use the encrypted original pipeline. */
export async function storePublicEventMedia<T extends Record<string, any>>(
  data: T,
  eventId: string,
): Promise<T> {
  return replaceTransientEventMedia(data, async (entry) => {
    if (
      data.accessControl?.requirePasscode ||
      resolveScanMediaPolicy(data, String(data.title || ""))?.medical
    )
      throw new Error("Private inline media requires authenticated storage");
    const parsed = parseDataUrlBase64(entry.value);
    if (!parsed || !/^(image\/(png|jpeg|webp)|application\/pdf)$/.test(parsed.mimeType))
      throw new Error("Unsupported inline event media");
    const upload = await processBufferUpload({
      bytes: Buffer.from(parsed.base64Payload, "base64"),
      mimeType: parsed.mimeType,
      fileName: parsed.mimeType === "application/pdf" ? "document.pdf" : "event-image.webp",
      usage: parsed.mimeType === "application/pdf" ? "attachment" : "header",
      eventId: `${eventId}-${randomUUID()}`,
    });
    const url =
      parsed.mimeType === "application/pdf"
        ? upload.eventMedia.attachment?.dataUrl
        : upload.stored.display?.url;
    if (!url) throw new Error("Media upload did not return a stored file");
    return url;
  });
}
