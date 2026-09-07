import type {
  CreationPreviewSaveRequest,
  CreationPreviewSaveResponse,
} from "@/lib/concierge/types";

export async function persistDraftPreview(request: CreationPreviewSaveRequest): Promise<void> {
  const response = await fetch("/api/creation/intake", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const result = await response.json().catch(() => null) as CreationPreviewSaveResponse | null;
  if (!response.ok || !result?.ok) {
    throw new Error(result && !result.ok ? result.error : "Unable to save the preview.");
  }
}
