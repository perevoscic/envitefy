import type { PendingSnapUpload } from "../pending-snap-upload";
import type { CreationSource } from "./creation-intake";

/** Transfer originals unchanged; the upload's text field remains host notes. */
export function snapUploadForCreateSource(source: CreationSource, sourceText = ""): PendingSnapUpload {
  if (source.files.length) {
    return { file: source.files[0], files: source.files, text: source.text };
  }
  const observed = sourceText.trim() || source.text;
  const corrections = source.text.trim();
  const text = source.kind === "url" && corrections && !observed.includes(corrections)
    ? `${observed}\n\nHost-authored corrections:\n${source.text}`
    : observed;
  if (!text.trim()) throw new Error("Add a document or event details before opening Snap.");
  return { text };
}
