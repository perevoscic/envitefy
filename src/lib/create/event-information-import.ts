import {
  type CustomEventCategory,
  type CustomEventInformation,
  normalizeCustomEventInformation,
  normalizeCustomEventPage,
  stageCustomEventPage,
} from "@/lib/event-custom-design";
import { UPLOAD_LIMITS } from "@/lib/upload-config";

export const EVENT_INFORMATION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class EventInformationSignInRequired extends Error {}

export function eventInformationFilesError(files: File[]): string | null {
  if (
    !files.length ||
    files.length > 5 ||
    files.some(
      (file) => !EVENT_INFORMATION_IMAGE_TYPES.includes(file.type) || file.size > UPLOAD_LIMITS.imageBytes,
    )
  )
    return "Choose up to five JPG, PNG or WebP images, up to 10 MB each.";
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("That file could not be read."));
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
}

async function generate(body: object, signal: AbortSignal) {
  const deadline = Date.now() + 270_000;
  while (true) {
    const response = await fetch("/api/event-themes/generate", {
      method: "POST",
      credentials: "include",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (response.status === 401) throw new EventInformationSignInRequired();
    if (response.status !== 429 || result.code !== "THEME_IN_PROGRESS") return { response, result };
    if (Date.now() >= deadline)
      throw new Error(
        "The previous creation is taking longer than expected. Your uploaded details are kept here. Please retry shortly.",
      );
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      }, 2000);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
  }
}

/** Read event facts from information photos into editable fields and sections. */
export async function readEventInformation(
  files: File[],
  category: CustomEventCategory,
  signal: AbortSignal,
  text = "",
): Promise<CustomEventInformation> {
  const form = new FormData();
  for (const file of files) form.append("file", file);
  form.append("category", category);
  form.append("text", text);
  signal.throwIfAborted();
  const response = await fetch("/api/create/extract", { method: "POST", credentials: "include", body: form, signal });
  const result = await response.json();
  if (response.status === 401) throw new EventInformationSignInRequired();
  if (!response.ok) throw new Error(result.error || "The event information could not be read. Please retry.");
  const page = normalizeCustomEventInformation(result.information);
  if (!page || page.category !== category)
    throw new Error("The event information could not be read. Please retry.");
  return page;
}

/** Design a complete page around extracted facts and return the editor preview token. */
export async function createEventPageFromInformation(
  extracted: CustomEventInformation,
  signal: AbortSignal,
  selectedDate?: string | null,
): Promise<string> {
  const category = extracted.category;
  const { response, result } = await generate(
    {
      mode: "design",
      category,
      prompt:
        "Create a complete, polished event page with a distinctive theme and artwork based on the supplied event title, description, activities and sections. Choose the layout, typography and palette automatically to suit this event. Preserve every supplied fact and section; do not invent missing event information.",
      currentDesign: extracted.design,
      currentDetails: extracted.details,
    },
    signal,
  );
  if (!response.ok)
    throw new Error(
      result.error || "Your event theme could not be created. Retry to continue with your uploaded details.",
    );
  const generated = normalizeCustomEventPage(result);
  if (!generated || generated.category !== category)
    throw new Error("Your event theme could not be read. Retry to continue with your uploaded details.");
  signal.throwIfAborted();
  const details =
    selectedDate && !extracted.details.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
      ? { ...extracted.details, date: selectedDate }
      : extracted.details;
  return stageCustomEventPage({ ...generated, details });
}

export function customEventEditorHref(category: CustomEventCategory, token: string, ready = true): string {
  return `/event/design/customize?category=${category}&themePreview=${encodeURIComponent(token)}${ready ? "&ready=1" : ""}`;
}
