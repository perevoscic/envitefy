"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  normalizeEventPageComposition,
  type EventPageComposition,
} from "@/lib/event-page-composition";
import { useRouter, useSearchParams } from "next/navigation";
import { useEventProgress } from "@/components/UnsavedProgressProvider";
import { useTemplateEditor } from "@/components/templates/TemplateEditorContext";
import { saveTemplateDraftToAccount } from "@/lib/template-draft-handoff";
import { buildTemplateDraftPayload } from "@/lib/template-draft-payload";
import { getPublicTemplate, getPublicTemplates } from "@/lib/public-template-catalog";
import { saveManualEventProgress } from "@/lib/manual-event-progress";
import type { TemplateCategory } from "@/lib/template-categories";
import type { EditorSnapshot, TemplateDraft } from "@/lib/template-draft-storage";
import type { createEventHistoryClient } from "@/lib/event-history-client";
import {
  eventEditorContent,
  eventEditorPublicHref,
  persistEventEditorPayload,
  type EventEditorPayload,
} from "@/lib/event-editor";
import { ownerEventEditorReturnHref } from "@/lib/event-preview-viewport";
import { buildEventPath } from "@/utils/event-url";
import { isEventDraft } from "@/lib/event-draft-access";
import { getSession } from "next-auth/react";
import { attachCreationIntakeEvent, creationIntakeOwner, readCreationIntake, writeCreationIntake } from "@/lib/create/creation-intake";
import { creationComposition, creationNativePayload } from "@/lib/create/editor-handoff";
import type { EventUrlUpdate } from "./EventUrlEditor";

export type EventPageEditorSession = {
  eventId?: string;
  published: boolean;
  dirty: boolean;
  busy: boolean;
  ready: boolean;
  authenticated: boolean;
  error: string;
  message: string;
  saveDraft: () => Promise<void>;
  saveChanges: () => Promise<void>;
  cancel: () => void;
  allowNavigation: (navigate: () => void) => void;
  requestLeave: (navigate: () => void) => void;
  composition?: EventPageComposition;
  setComposition?: Dispatch<SetStateAction<EventPageComposition | undefined>>;
  urlEditor?: {
    historyClient: ReturnType<typeof createEventHistoryClient>;
    onUpdated?: (update: EventUrlUpdate) => void;
    onBusyChange: (busy: boolean) => void;
  };
};

/** Creation supplies content; every page module shares this editing lifecycle. */
export function useEventPageEditor({
  snapshot,
  category,
  templateCategory,
  templateId,
  eventId,
  historyClient,
  ready = true,
  busy: externalBusy = false,
  onBusyChange,
  buildPayload,
  onSaved,
  savePage,
  published: suppliedPublished,
  initialDirty = false,
  cancelHref,
}: {
  snapshot: object;
  category: string;
  templateCategory?: TemplateCategory;
  templateId?: string;
  eventId?: string;
  historyClient: ReturnType<typeof createEventHistoryClient>;
  ready?: boolean;
  busy?: boolean;
  onBusyChange?: (busy: boolean) => void;
  buildPayload?: () => Promise<EventEditorPayload>;
  onSaved?: (id: string) => void;
  savePage?: (publish: boolean) => Promise<{ id: string; href: string; snapshot: object }>;
  published?: boolean;
  initialDirty?: boolean;
  cancelHref?: string;
}): EventPageEditorSession {
  const router = useRouter();
  const search = useSearchParams();
  const template = useTemplateEditor();
  const id = useRef(eventId || template?.eventId);
  const clientDraftId = useRef<string | null>(null);
  const templateDraft = useRef<TemplateDraft | null>(null);
  const remoteMedia = useRef<Record<string, string>>({});
  const saving = useRef(false);
  const savedEventId = eventId || template?.eventId;
  if (savedEventId && savedEventId !== id.current) id.current = savedEventId;
  const [busy, setBusy] = useState(false);
  const [urlBusy, setUrlBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const loaded = id.current
    ? historyClient.read(`/api/history/${encodeURIComponent(id.current)}`)
    : null;
  const canEditUrl = useRef<boolean | null>(null);
  if (loaded?.permissions?.role) canEditUrl.current = loaded.permissions.role === "owner";
  const published =
    suppliedPublished ?? template?.published ?? (loaded ? !isEventDraft(loaded.data) : false);
  const [composition, setComposition] = useState<EventPageComposition | undefined>(() =>
    normalizeEventPageComposition(template?.initial.pageComposition),
  );
  const [compositionReady, setCompositionReady] = useState(!id.current || Boolean(template));
  const hydratedComposition = useRef(Boolean(template) || !id.current);
  const intakeId = search?.get("intake");
  const [intakeCompositionReady, setIntakeCompositionReady] = useState(!intakeId || Boolean(id.current) || Boolean(template) || Boolean(savePage));
  useEffect(() => {
    if (!intakeId || id.current || template || intakeCompositionReady) return;
    let active = true;
    void getSession().then(async session => {
      const intake = await readCreationIntake(creationIntakeOwner(session?.user), intakeId);
      if (!active || !intake) return;
      setComposition(normalizeEventPageComposition(intake.editorSnapshot?.pageComposition) || creationComposition(intake.information));
      setIntakeCompositionReady(true);
    }).catch(() => setError("Your imported sections could not be restored. Reload this editor or return to Create."));
    return () => { active = false; };
  }, [intakeId, template, intakeCompositionReady]);
  useEffect(() => {
    if (hydratedComposition.current || !ready || !loaded) return;
    hydratedComposition.current = true;
    const draft = loaded.data.manualEditor as
      | { snapshot?: { pageComposition?: unknown } }
      | undefined;
    setComposition(
      normalizeEventPageComposition(
        draft?.snapshot?.pageComposition ?? loaded.data.eventPageComposition,
      ),
    );
    setCompositionReady(true);
  }, [loaded, ready]);
  const normalizedComposition = normalizeEventPageComposition(composition);
  const editorReady = ready && intakeCompositionReady && (Boolean(savePage) || compositionReady);
  const composedSnapshot =
    !savePage && normalizedComposition
      ? { ...snapshot, pageComposition: normalizedComposition }
      : snapshot;
  const content = eventEditorContent(composedSnapshot);
  const latest = useRef({ snapshot, content, buildPayload });
  latest.current = {
    snapshot: composedSnapshot,
    content,
    buildPayload: buildPayload
      ? async () => {
          const payload = creationNativePayload(await buildPayload(), composedSnapshot);
          return !savePage
            ? {
                ...payload,
                data: {
                  ...payload.data,
                  eventPageComposition: normalizeEventPageComposition(composition) ?? null,
                },
              }
            : payload;
        }
      : undefined,
  };
  useEffect(() => {
    if (!intakeId || !ready || id.current || template || !intakeCompositionReady) return;
    const timer = window.setTimeout(() => {
      void getSession().then(async session => {
        const intake = await readCreationIntake(creationIntakeOwner(session?.user), intakeId);
        if (intake) await writeCreationIntake({ ...intake, editorSnapshot: JSON.parse(JSON.stringify(latest.current.snapshot)) });
      }).catch(() => setError("Browser recovery could not be updated. Keep this tab open or explicitly save a draft."));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [content, intakeId, ready, template, intakeCompositionReady]);
  useEffect(() => {
    if (template && !savePage)
      template.record(
        "pageComposition",
        composition ? JSON.parse(JSON.stringify(composition)) : null,
      );
  }, [template, composition, savePage]);

  const perform = async (publish: boolean, navigate: boolean) => {
    if (!editorReady || externalBusy || urlBusy || saving.current)
      throw new Error("Wait for the current work to finish, then save your event.");
    if (template && !template.authenticated) {
      await template.requestSave();
      return;
    }
    saving.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    setMessage("");
    const capturedSnapshot = JSON.parse(JSON.stringify(latest.current.snapshot)) as EditorSnapshot;
    const capturedContent = JSON.parse(JSON.stringify(latest.current.content)) as object;
    const builder = latest.current.buildPayload;
    clientDraftId.current ||= crypto.randomUUID();
    try {
      let href: string | undefined;
      let savedContent = capturedContent;
      if (savePage) {
        const saved = await savePage(publish);
        id.current = saved.id;
        href = saved.href;
        savedContent = eventEditorContent(saved.snapshot);
      } else if (templateCategory && !template) {
        const selected =
          (templateId && getPublicTemplate(templateCategory, templateId)) ||
          getPublicTemplates(templateCategory)[0];
        if (!selected)
          throw new Error(
            "The selected template could not be opened. Your changes are still here.",
          );
        const current = templateDraft.current || {
          version: 1 as const,
          id: clientDraftId.current,
          category: templateCategory,
          templateId: selected.id,
          updatedAt: Date.now(),
          snapshot: {},
          assets: {},
          eventId: id.current,
        };
        current.snapshot = capturedSnapshot;
        current.updatedAt = Date.now();
        templateDraft.current = current;
        if (publish && !builder) throw new Error("This event's fields are still loading.");
        const payload =
          publish && builder
            ? await builder()
            : buildTemplateDraftPayload(
                capturedSnapshot,
                templateCategory,
                Intl.DateTimeFormat().resolvedOptions().timeZone,
              );
        id.current = await saveTemplateDraftToAccount({
          draft: current,
          payload,
          category: templateCategory,
          templateId: selected.id,
          status: publish ? "published" : "draft",
          authenticated: true,
          remoteMedia: remoteMedia.current,
          existing: loaded,
          request: (input, options) =>
            typeof input === "string" ? historyClient.fetch(input, options) : fetch(input, options),
        });
        const row = historyClient.read(`/api/history/${encodeURIComponent(id.current)}`);
        href = row
          ? eventEditorPublicHref(row, payload.title)
          : buildEventPath(id.current, payload.title);
      } else if (publish) {
        if (!builder) throw new Error("This event's fields are still loading.");
        const payload = await builder();
        if (template) {
          id.current = await template.persist(payload, "published", {
            navigate: false,
            snapshot: capturedSnapshot,
          });
          const row = historyClient.read(`/api/history/${encodeURIComponent(id.current)}`);
          href = row
            ? eventEditorPublicHref(row, payload.title)
            : buildEventPath(id.current, payload.title);
        } else {
          const row = await persistEventEditorPayload({
            payload,
            eventId: id.current,
            clientDraftId: clientDraftId.current,
            historyFetch: historyClient.fetch,
            existing: loaded,
          });
          id.current = row.id;
          href = eventEditorPublicHref(row, payload.title);
        }
      } else if (template) {
        id.current = await template.persist(
          buildTemplateDraftPayload(
            capturedSnapshot,
            template.category,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          ),
          "draft",
          { navigate: false, snapshot: capturedSnapshot },
        );
      } else {
        id.current = await saveManualEventProgress({
          snapshot: capturedSnapshot,
          category,
          templateId,
          eventId: id.current,
          path: window.location.pathname,
          clientDraftId: clientDraftId.current,
          historyFetch: historyClient.fetch,
        });
      }
      progress.markSaved(savedContent);
      if (id.current) onSaved?.(id.current);
      if (intakeId && id.current) {
        const savedId = id.current;
        void getSession().then(session => attachCreationIntakeEvent(creationIntakeOwner(session?.user), intakeId, savedId)).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: id.current } }));
      setMessage(publish ? "Changes saved." : "Draft saved.");
      if (navigate && publish && href)
        progress.allowNavigation(() => {
          if (search?.get("embed") === "1" && window.parent !== window)
            window.parent.postMessage(
              { type: "envitefy:discovery-edit-saved", eventId: id.current, redirectUrl: href },
              window.location.origin,
            );
          else router.push(href);
        });
      else if (!eventId && !template?.eventId && id.current) {
        const params = new URLSearchParams(search?.toString());
        params.delete("draft");
        params.delete("themePreview");
        params.delete("ready");
        params.set("edit", id.current);
        // Keep the mounted editor and its current form state after the first explicit save.
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}?${params}`,
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your event could not be saved. Your changes are still here.",
      );
      throw failure;
    } finally {
      saving.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  const progress = useEventProgress({
    snapshot: content,
    ready: editorReady,
    initialDirty,
    busy: busy || externalBusy || urlBusy,
    save: async () => {
      if (template && !template.authenticated) {
        throw new Error(
          "Choose Keep editing, then Save and continue to sign in and save your event.",
        );
      }
      await perform(published, false);
    },
  });
  const cancel = () => {
    const href =
      cancelHref ||
      ownerEventEditorReturnHref(search) ||
      (id.current
        ? buildEventPath(id.current, loaded?.title, { tab: "event" }, loaded?.public_slug)
        : "/");
    progress.requestLeave(() => {
      if (search?.get("embed") === "1" && window.parent !== window) {
        window.parent.postMessage(
          { type: "envitefy:discovery-preview-reset", eventId: id.current },
          window.location.origin,
        );
        try {
          window.parent.location.assign(href);
        } catch {
          router.push(href);
        }
      } else router.push(href);
    });
  };
  return {
    eventId: id.current,
    published,
    dirty: progress.dirty,
    busy: busy || externalBusy || urlBusy,
    ready: editorReady,
    authenticated: template?.authenticated ?? true,
    error,
    message,
    saveDraft: () => perform(false, false),
    saveChanges: () => perform(true, true),
    cancel,
    allowNavigation: progress.allowNavigation,
    requestLeave: progress.requestLeave,
    ...(template?.canManageCollaborators !== false && canEditUrl.current !== false
      ? { urlEditor: { historyClient: template?.historyClient || historyClient, onUpdated: template?.publicUrlUpdated, onBusyChange: setUrlBusy } }
      : {}),
    ...(!savePage ? { composition: normalizedComposition, setComposition } : {}),
  };
}
