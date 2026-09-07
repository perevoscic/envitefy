import type { CreationGeneratedPreview } from "./types.ts";

export function parseCreationGeneratedPreview(value: unknown): CreationGeneratedPreview | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const preview = value as Record<string, unknown>;
  const imageUrl = typeof preview.imageUrl === "string" ? preview.imageUrl.trim() : "";
  // Browser-local URLs disappear when the page closes. Only store durable image references.
  if (!imageUrl || !/^(?:https?:\/\/|\/(?!\/))/.test(imageUrl)) return null;
  const invitationData = preview.invitationData;
  if (!invitationData || typeof invitationData !== "object" || Array.isArray(invitationData)) {
    return null;
  }
  return { imageUrl, invitationData: invitationData as Record<string, unknown> };
}
