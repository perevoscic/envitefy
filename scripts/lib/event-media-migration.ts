import { createHash } from "node:crypto";
import { listEventMediaEntries } from "../../src/lib/event-media.ts";
import { parseDataUrlBase64 } from "../../src/utils/data-url.ts";

export function inlineMediaPlan(data: object) {
  return listEventMediaEntries(data)
    .filter((entry) => /^(data:|blob:)/i.test(entry.value))
    .map((entry) => {
      const parsed = parseDataUrlBase64(entry.value);
      return {
        ...entry,
        mimeType: parsed?.mimeType || null,
        bytes: Buffer.byteLength(entry.value, "utf8"),
        signature: createHash("sha256").update(entry.value).digest("hex"),
        supported: Boolean(
          parsed && /^(image\/(png|jpeg|webp)|application\/pdf)$/.test(parsed.mimeType),
        ),
      };
    });
}
