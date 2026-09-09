"use client";

import { useEventProgress } from "@/components/UnsavedProgressProvider";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPublicTemplate, getPublicTemplates } from "@/lib/public-template-catalog";
import { templateEditorHref, type TemplateCategory } from "@/lib/template-categories";
import { buildTemplateDraftPayload } from "@/lib/template-draft-payload";
import { saveTemplateDraftToAccount } from "@/lib/template-draft-handoff";
import {
  retainDraftMedia,
  writeTemplateDraft,
  type EditorSnapshot,
  type TemplateDraft,
} from "@/lib/template-draft-storage";

/** Bring existing authenticated editor URLs into the shared draft workflow. */
export default function LegacyTemplateDraftButton({
  category,
  templateId,
  eventId,
  snapshot,
  disabled = false,
  ready = true,
}: {
  category: TemplateCategory;
  templateId?: string;
  eventId?: string;
  snapshot: object;
  disabled?: boolean;
  ready?: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const draft = useRef<TemplateDraft | null>(null);
  const remoteMedia = useRef<Record<string, string>>({});
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const progress = useEventProgress({
    snapshot: Object.fromEntries(Object.entries(snapshot).filter(([key]) => !["activeView", "activeSection"].includes(key))),
    ready,
    busy: disabled || busy,
    save: async () => { await save(true); },
  });
  const save = async (leaving = false) => {
    if (saving.current) throw new Error("Your progress is still saving. Please wait.");
    if (status !== "authenticated") throw new Error("Sign in to save your progress.");
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const selected =
        (templateId && getPublicTemplate(category, templateId)) || getPublicTemplates(category)[0];
      const current = draft.current || {
        version: 1 as const,
        id: crypto.randomUUID(),
        category,
        templateId: selected.id,
        updatedAt: Date.now(),
        snapshot: {},
        assets: {},
        eventId,
      };
      current.snapshot = JSON.parse(JSON.stringify(snapshot)) as EditorSnapshot;
      current.updatedAt = Date.now();
      current.templateId = selected.id;
      draft.current = current;
      await retainDraftMedia(current.snapshot, current.assets);
      await writeTemplateDraft(current).catch(() => {});
      const id = await saveTemplateDraftToAccount({
        draft: current,
        payload: buildTemplateDraftPayload(
          current.snapshot,
          category,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        ),
        category,
        templateId: selected.id,
        status: "draft",
        authenticated: true,
        remoteMedia: remoteMedia.current,
      });
      await writeTemplateDraft(current).catch(() => {});
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id } }));
      progress.markSaved();
      if (!leaving) progress.allowNavigation(() => router.replace(`${templateEditorHref(category, selected.id)}?edit=${encodeURIComponent(id)}`));
    } catch (failure) {
      if (leaving) throw failure;
      setError(
        failure instanceof Error
          ? failure.message
          : "Your draft could not be saved. Keep this tab open and retry.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="flex-1">
      <button
        type="button"
        disabled={disabled || busy || status !== "authenticated"}
        onClick={() => void save()}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save draft"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
