import { getTemplateCategory, type TemplateCategory } from "./template-categories";
import { buildTemplateDraftPayload } from "./template-draft-payload";
import type { EventEditorRecord } from "./event-editor";
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
  publicSlug?: string;
  claim?: boolean;
};

const draftRecord = (value: unknown): Record<string, DraftValue> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, DraftValue>
    : {};

/** Omitted fields retain their saved values; explicit empty values replace them. */
function mergeSnapshotFields(base: unknown, edited: Record<string, DraftValue>) {
  const merged = { ...draftRecord(base) };
  for (const [key, value] of Object.entries(edited)) {
    merged[key] = value && typeof value === "object" && !Array.isArray(value)
      ? mergeSnapshotFields(merged[key], value)
      : value;
  }
  return merged;
}

/** Upload and save only after authentication; leave browser data intact on every failure. */
export async function saveTemplateDraftToAccount({
  draft,
  payload,
  category,
  templateId,
  status,
  authenticated,
  remoteMedia,
  existing,
  request = fetch,
}: {
  draft: TemplateDraft;
  payload: TemplateHistoryPayload;
  category: TemplateCategory;
  templateId: string;
  status: "draft" | "published";
  authenticated: boolean;
  remoteMedia: Record<string, string>;
  existing?: EventEditorRecord | null;
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
  // Saving an imported page with a template snapshot does not turn it into a
  // manually created event. Its source still selects the imported guest layout.
  const source = data.discoverySource || existing?.data.discoverySource;
  const hasSource = source && typeof source === "object" &&
    (("input" in source && source.input) || ("parseResult" in source && source.parseResult));
  const pipelineSummary = data.pipelineSummary || existing?.data.pipelineSummary;
  const hasV2Identity = Boolean((data.builderDraft || existing?.data.builderDraft) &&
    (data.publicArtifacts || existing?.data.publicArtifacts) &&
    pipelineSummary && typeof pipelineSummary === "object" &&
    "discoveryId" in pipelineSummary && pipelineSummary.discoveryId);
  const restoredImport = category === "gymnastics" && (hasSource || hasV2Identity);
  const createdVia = data.createdVia || (restoredImport
    ? hasV2Identity ? "meet-discovery-v2" : "meet-discovery"
    : existing?.data.createdVia || "template");
  const imported = createdVia === "meet-discovery" || createdVia === "meet-discovery-v2";
  const existingBuilder = data.builderDraft || existing?.data.builderDraft;
  const snapshotFields: Record<string, DraftValue> = {};
  if (category === "gymnastics" && imported) {
    const fields = draftRecord(savedSnapshot.data);
    const baseline = { ...draftRecord(draftRecord(existingBuilder).event), ...draftRecord(existing?.data) };
    for (const key of ["title", "date", "time", "endDate", "endTime", "timezone", "tz", "start", "startAt", "startISO", "end", "endAt", "endISO", "allDay", "gymnasticsDateVersion", "guestPlanning", "venue", "address", "hostGym", "city", "state", "details", "rsvpEnabled", "rsvpDeadline", "pageTemplateId", "fontId", "fontSize", "heroImageFilterEnabled", "heroImageSettings", "gymnasticsPageText", "gymnasticsTitleFont", "sectionLayout"]) {
      if (Object.hasOwn(fields, key)) snapshotFields[key] = fields[key];
      else if (Object.hasOwn(baseline, key)) snapshotFields[key] = baseline[key];
    }
    for (const [key, alias] of [["venue", "location"], ["details", "description"], ["hero", "heroImage"], ["simpleDesignTokens", "designTokens"]]) {
      if (Object.hasOwn(fields, key)) snapshotFields[alias] = fields[key];
    }
    if (Object.hasOwn(fields, "date") || Object.hasOwn(baseline, "date")) {
      const dates = buildTemplateDraftPayload({ data: { ...baseline, ...fields } }, category,
        Intl.DateTimeFormat().resolvedOptions().timeZone).data;
      for (const key of ["tz", "start", "startAt", "startISO", "end", "endAt", "endISO", "allDay", "gymnasticsDateVersion"]) {
        if (dates[key] !== undefined) snapshotFields[key] = dates[key];
      }
    }
    if (Object.hasOwn(savedSnapshot, "themeId")) snapshotFields.themeId = savedSnapshot.themeId;
    if (Object.hasOwn(fields, "extra")) snapshotFields.customFields = fields.extra;
    if (Object.hasOwn(savedSnapshot, "advancedState")) {
      snapshotFields.advancedSections = savedSnapshot.advancedState;
      snapshotFields.customFields = {
        ...draftRecord(snapshotFields.customFields),
        advancedSections: savedSnapshot.advancedState,
      };
    }
  }
  const builderDraft = category === "gymnastics" && imported && existingBuilder &&
    typeof existingBuilder === "object" && !Array.isArray(existingBuilder)
    ? {
        ...existingBuilder,
        event: mergeSnapshotFields("event" in existingBuilder ? existingBuilder.event : {}, snapshotFields),
        venue: mergeSnapshotFields("venue" in existingBuilder ? existingBuilder.venue : {},
          Object.fromEntries(["location", "venue", "address", "city", "state"]
            .filter(key => Object.hasOwn(snapshotFields, key)).map(key => [key, snapshotFields[key]]))),
        ...(Object.hasOwn(snapshotFields, "advancedSections")
          ? { advancedSections: snapshotFields.advancedSections && typeof snapshotFields.advancedSections === "object" && !Array.isArray(snapshotFields.advancedSections)
            ? mergeSnapshotFields("advancedSections" in existingBuilder ? existingBuilder.advancedSections : {}, snapshotFields.advancedSections)
            : snapshotFields.advancedSections }
          : {}),
      }
    : undefined;
  if (
    category === "signup-forms" &&
    signup &&
    typeof signup === "object" &&
    !Array.isArray(signup) &&
    draft.signupRevision != null
  )
    signup.revision = draft.signupRevision;
  const body = {
    ...payload,
    clientDraftId: draft.id,
    data: {
      ...mergeSnapshotFields({ ...existing?.data, ...canonical.data, ...data }, snapshotFields),
      ...(builderDraft ? { builderDraft } : {}),
      ...(existing && "numberOfGuests" in existing.data
        ? { numberOfGuests: existing.data.numberOfGuests }
        : {}),
      category: data.category || getTemplateCategory(category)!.historyCategory,
      primaryOutput: category === "signup-forms" ? "signup_form" : "event_page",
      ownership: "owned",
      status,
      draftStatus: status,
      createdVia,
      createdManually: imported ? false : data.createdManually ?? existing?.data.createdManually ?? true,
      templateEditor: { category, templateId, snapshot: savedSnapshot },
    },
  };
  const send = (url: string, method: "POST" | "PATCH") =>
    request(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...(method === "PATCH" && draft.eventRevision ? { expectedRevision: draft.eventRevision } : {}) }),
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
  if (typeof row.revision === "string") draft.eventRevision = row.revision;
  draft.pendingSave = false;
  draft.pendingPublish = false;
  return row.id;
}
