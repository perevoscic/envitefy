import { getTemplateCategory, type TemplateCategory } from "./template-categories";
import { buildTemplateDraftPayload } from "./template-draft-payload";
import {
  type DraftValue,
  type EditorSnapshot,
  replaceDraftMedia,
  retainDraftMedia,
  type TemplateDraft,
} from "./template-draft-storage";

export type TemplateHistoryPayload = {
  title: string;
  data: Record<string, DraftValue | undefined>;
};

/** Upload and save only after authentication; leave browser data intact on every failure. */
export async function saveTemplateDraftToAccount({
  draft,
  payload,
  category,
  templateId,
  status,
  authenticated,
  remoteMedia,
  request = fetch,
}: {
  draft: TemplateDraft;
  payload: TemplateHistoryPayload;
  category: TemplateCategory;
  templateId: string;
  status: "draft" | "published";
  authenticated: boolean;
  remoteMedia: Record<string, string>;
  request?: typeof fetch;
}): Promise<string> {
  if (!authenticated) throw new Error("Sign in to save your event.");
  const snapshot = structuredClone(draft.snapshot);
  await retainDraftMedia(snapshot, draft.assets);
  for (const [key, file] of Object.entries(draft.assets)) {
    if (remoteMedia[key]) continue;
    const uploadBody = new FormData();
    uploadBody.set("file", file, file instanceof File ? file.name : "template-photo");
    if (draft.eventId) uploadBody.set("eventId", draft.eventId);
    const upload = await request("/api/templates/media", {
      method: "POST",
      credentials: "include",
      body: uploadBody,
    });
    const result = await upload.json();
    if (!upload.ok || typeof result.url !== "string" || !result.url)
      throw new Error(
        result.error || "A photo could not be uploaded. Your draft is still here; please retry.",
      );
    remoteMedia[key] = result.url;
  }
  const savedSnapshot = replaceDraftMedia(snapshot, remoteMedia);
  const data = replaceDraftMedia(payload.data as EditorSnapshot, remoteMedia);
  const canonical = buildTemplateDraftPayload(
    savedSnapshot,
    category,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const signup = data.signupForm;
  if (
    category === "signup-forms" &&
    signup &&
    typeof signup === "object" &&
    !Array.isArray(signup) &&
    draft.signupRevision != null
  )
    signup.revision = draft.signupRevision;
  const body = {
    title: payload.title,
    clientDraftId: draft.id,
    data: {
      ...canonical.data,
      ...data,
      category: data.category || getTemplateCategory(category)!.historyCategory,
      ownership: "owned",
      status,
      draftStatus: status,
      createdVia: data.createdVia || "template",
      createdManually: true,
      templateEditor: { category, templateId, snapshot: savedSnapshot },
    },
  };
  const send = (url: string, method: "POST" | "PATCH") =>
    request(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const creating = !draft.eventId;
  const response = await send(
    creating ? "/api/history" : `/api/history/${draft.eventId}`,
    creating ? "POST" : "PATCH",
  );
  let row = await response.json();
  if (!response.ok || typeof row.id !== "string")
    throw new Error(row.error || "Your event could not be saved. Please retry.");
  draft.eventId = row.id;
  // A create retry returns the existing event unchanged. Apply newer edits through
  // the ordinary ownership-checked update after recovering that event's identity.
  if (
    creating &&
    (JSON.stringify(row.data?.templateEditor?.snapshot) !== JSON.stringify(savedSnapshot) ||
      row.data?.status !== status)
  ) {
    if (
      category === "signup-forms" &&
      signup &&
      typeof signup === "object" &&
      !Array.isArray(signup)
    )
      signup.revision = Number(row.data?.signupForm?.revision || 0);
    const updated = await send(`/api/history/${row.id}`, "PATCH");
    const updatedRow = await updated.json();
    if (!updated.ok)
      throw new Error(
        updatedRow.error ||
          "Your event was recovered, but the latest edits could not be saved. Please retry.",
      );
    row = updatedRow;
  }

  if (category === "signup-forms")
    draft.signupRevision = Number(row.data?.signupForm?.revision || 0);
  draft.pendingSave = false;
  return row.id;
}
