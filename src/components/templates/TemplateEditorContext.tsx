"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import AuthModal from "@/components/auth/AuthModal";
import { getFamilyTemplateDesign } from "@/lib/family-template-designs";
import { hasAnalyticsConsent } from "@/lib/privacy-preferences";
import { BRIDAL_PRESETS, getPublicTemplate } from "@/lib/public-template-catalog";
import { getSignupTemplateTheme } from "@/lib/signup-starters";
import { createSignupAppearance } from "@/lib/signup-themes";
import { getSportEventPreset, getSportStyleThemeIds } from "@/lib/sport-event-presets";
import {
  getTemplateCategory,
  type TemplateCategory,
  templateEditorHref,
} from "@/lib/template-categories";
import {
  saveTemplateDraftToAccount,
  type TemplateHistoryPayload,
} from "@/lib/template-draft-handoff";
import { buildTemplateDraftPayload } from "@/lib/template-draft-payload";
import {
  type DraftValue,
  deleteTemplateDraft,
  type EditorSnapshot,
  readTemplateDraft,
  replaceDraftMedia,
  retainDraftMedia,
  type TemplateDraft,
  writeTemplateDraft,
} from "@/lib/template-draft-storage";
import { validateClientUploadFile } from "@/utils/media-upload-client";
import styles from "./template-editor.module.css";

export function trackTemplateEvent(name: string, category: string, templateId?: string) {
  if (hasAnalyticsConsent() && typeof window.gtag === "function")
    window.gtag("event", name, { category, template_id: templateId });
}
export type { TemplateHistoryPayload } from "@/lib/template-draft-handoff";
export type TemplateEditorRuntime = {
  category: TemplateCategory;
  templateId: string;
  initial: EditorSnapshot;
  authenticated: boolean;
  record: (key: string, value: DraftValue) => void;
  requestSave: () => Promise<void>;
  persist: (payload: TemplateHistoryPayload, status: "draft" | "published") => Promise<void>;
  previewPhoto: (file: File) => string;
};
const Context = createContext<TemplateEditorRuntime | null>(null);
export const useTemplateEditor = () => useContext(Context);

/** Existing editors keep their state types and behavior outside the public editor. */
export function useTemplateState<S>(
  key: string,
  initial: S | (() => S),
): [S, Dispatch<SetStateAction<S>>] {
  const editor = useTemplateEditor();
  const [value, setValue] = useState<S>(() =>
    editor && Object.hasOwn(editor.initial, key)
      ? (editor.initial[key] as S)
      : typeof initial === "function"
        ? (initial as () => S)()
        : initial,
  );
  useEffect(() => {
    if (editor) editor.record(key, JSON.parse(JSON.stringify(value ?? null)) as DraftValue);
  }, [editor, key, value]);
  return [value, setValue];
}

export function useTemplateSearchParams() {
  const search = useSearchParams();
  const editor = useTemplateEditor();
  const router = useRouter();
  useEffect(() => {
    if (editor || !search?.get("edit")) return;
    let active = true;
    const id = search.get("edit");
    fetch(`/api/history/${encodeURIComponent(id || "")}`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return;
        const row = await response.json();
        const saved = row.data?.templateEditor;
        const category = saved && getTemplateCategory(saved.category);
        if (active && category && typeof saved.templateId === "string")
          router.replace(
            `${templateEditorHref(category.slug, saved.templateId)}?edit=${encodeURIComponent(id || "")}`,
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [editor, router, search]);
  return useMemo(() => {
    if (!editor) return search;
    const params = new URLSearchParams(search?.toString());
    params.delete("edit");
    params.delete("demo");
    params.delete("newDraft");
    params.set("templateId", editor.templateId);
    if (editor.category === "bridal-showers") params.set("occasion", "bridal-shower");
    if (editor.category === "sport-events") {
      const [sport, style] = editor.templateId.split("--");
      params.set("sport", sport);
      params.set("style", style || "stadium");
    }
    return params;
  }, [editor, search]);
}

export default function TemplateEditorProvider({
  category,
  templateId,
  children,
}: {
  category: TemplateCategory;
  templateId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const { status, update } = useSession();
  const authenticated = status === "authenticated";
  const [initial, setInitial] = useState<EditorSnapshot | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [storageReady, setStorageReady] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [editorReady, setEditorReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const draft = useRef<TemplateDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const savedFields = useRef<Record<string, string>>({});
  const interacted = useRef(false);
  const busyRef = useRef(false);
  const pendingHandled = useRef(false);
  const mediaUrls = useRef<Record<string, string>>({});
  const remoteMedia = useRef<Record<string, string>>({});
  const firstEdit = useRef(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const editId = search?.get("edit");
  const requestedDraft = search?.get("draft");
  const info = getTemplateCategory(category)!;

  const flush = useCallback(async () => {
    if (!draft.current) return;
    const current = {
      ...draft.current,
      snapshot: structuredClone(draft.current.snapshot),
      assets: { ...draft.current.assets },
    };
    // Serialize retention so a slower photo write cannot replace a newer edit.
    const write = writeQueue.current
      .catch(() => {})
      .then(async () => {
        await retainDraftMedia(current.snapshot, current.assets);
        if (draft.current?.id === current.id) Object.assign(draft.current.assets, current.assets);
        await writeTemplateDraft(current);
      });
    writeQueue.current = write;
    await write;
    setStorageReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      let saved: TemplateDraft | null = null;
      try {
        saved = await readTemplateDraft(category, requestedDraft || undefined);
      } catch {
        setStorageReady(false);
        setError(
          "Temporary browser storage is unavailable. Keep this tab open; email signup can save your work here.",
        );
      }
      if (editId) {
        const response = await fetch(`/api/history/${encodeURIComponent(editId)}`, {
          credentials: "include",
        });
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Log in to reopen this private draft."
              : "This draft is unavailable for this account.",
          );
        const row = await response.json();
        const stored = row.data?.templateEditor;
        if (!stored || stored.category !== category)
          throw new Error("This event uses a different editor.");
        if (!saved || saved.eventId !== editId || saved.templateId !== templateId)
          saved = {
            version: 1,
            id: crypto.randomUUID(),
            category,
            templateId,
            updatedAt: Date.now(),
            snapshot: {
              ...(stored.snapshot || {}),
              ...(category === "signup-forms" && row.data?.signupForm
                ? { form: row.data.signupForm }
                : {}),
            },
            signupRevision: row.data?.signupForm?.revision,
            assets: {},
            eventId: editId,
          };
      }
      if (cancelled) return;
      if (requestedDraft && !saved)
        setError(
          "This browser draft has expired or is unavailable. You can start again with this template.",
        );
      const current: TemplateDraft = saved || {
        version: 1,
        id: crypto.randomUUID(),
        category,
        templateId,
        updatedAt: Date.now(),
        snapshot: {},
        assets: {},
      };
      if (current.templateId !== templateId && !requestedDraft) {
        const previousTemplate = getPublicTemplate(category, current.templateId);
        const selected = getPublicTemplate(category, templateId)!;
        const raw = current.snapshot.data;
        const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
        const rawTheme = data.theme;
        const theme =
          rawTheme && typeof rawTheme === "object" && !Array.isArray(rawTheme) ? rawTheme : {};
        if (category === "weddings") data.theme = { ...theme, themeId: templateId };
        if (category === "birthdays" || category === "anniversaries") {
          data.theme = { ...theme, professionalThemeId: templateId };
          current.snapshot.activeVariationId = templateId;
        }
        if (category === "gymnastics") data.pageTemplateId = templateId;
        if (category === "baby-showers" || category === "gender-reveal") {
          const design = getFamilyTemplateDesign(category, templateId);
          data.theme = { ...theme, themeId: design.themeId, font: design.font };
          data.templateId = templateId;
        }
        if (category === "bridal-showers")
          data.theme = {
            ...theme,
            themeId:
              BRIDAL_PRESETS.find((item) => item.id === templateId)?.themeId || "golden_hour",
          };
        if (category === "sport-events") {
          const [sport, style] = templateId.split("--");
          const preset = getSportEventPreset(sport);
          current.snapshot.themeId = getSportStyleThemeIds(preset, style)[0];
          const extra = data.extra;
          data.extra = {
            ...(extra && typeof extra === "object" && !Array.isArray(extra) ? extra : {}),
            sport: preset.key,
            sportLabel: preset.label,
          };
        }
        const imageFields = ["hero", "heroImage"];
        for (const key of imageFields)
          if (data[key] === previousTemplate?.heroImage) data[key] = selected.heroImage;
        const images = data.images;
        if (
          images &&
          typeof images === "object" &&
          !Array.isArray(images) &&
          images.hero === previousTemplate?.heroImage
        )
          images.hero = selected.heroImage;
        if (category === "signup-forms") {
          const form = current.snapshot.form;
          if (form && typeof form === "object" && !Array.isArray(form)) {
            const theme = getSignupTemplateTheme(selected);
            form.appearance = JSON.parse(
              JSON.stringify(createSignupAppearance(theme.id, selected.id)),
            );
            const header = form.header;
            form.header = {
              ...(header && typeof header === "object" && !Array.isArray(header) ? header : {}),
              images: [],
              templateId: theme.headerLayout,
              backgroundImage: {
                name: selected.name,
                type: "image/webp",
                dataUrl: selected.heroImage,
              },
            };
          }
        } else current.snapshot.data = data;
        current.snapshot.activeTemplateId = templateId;
        current.templateId = templateId;
      }
      const replacements: Record<string, string> = {};
      for (const [key, blob] of Object.entries(current.assets)) {
        const url = URL.createObjectURL(blob);
        replacements[key] = url;
        mediaUrls.current[key] = url;
      }
      current.snapshot = replaceDraftMedia(current.snapshot, replacements);
      current.assets = Object.fromEntries(
        Object.entries(current.assets).map(([key, blob]) => [replacements[key] || key, blob]),
      );
      draft.current = current;
      savedFields.current = {};
      interacted.current = false;
      setDirty(false);
      setInitial(current.snapshot);
      trackTemplateEvent("template_editor_view", category, templateId);
    }
    initialize().catch((failure: Error) => {
      if (!cancelled) setError(failure.message);
    });
    return () => {
      cancelled = true;
      };
  }, [category, templateId, requestedDraft, editId, router, loadAttempt]);

  useEffect(
    () => () => {
      for (const url of Object.values(mediaUrls.current)) URL.revokeObjectURL(url);
    },
    [],
  );

  const record = useCallback(
    (key: string, value: DraftValue) => {
      const current = draft.current;
      if (key === "data" || key === "form") setEditorReady(true);
      if (!current) return;
      const editable = ["data", "form", "themeId", "advancedState", "activeTemplateId", "activeVariationId", "newHost", "newRegistry", "newEvent", "newItem", "tempHotel", "tempAirport"].includes(key);
      if (editable && (!interacted.current || !Object.hasOwn(savedFields.current, key))) savedFields.current[key] = JSON.stringify(value);
      if (JSON.stringify(current.snapshot[key]) === JSON.stringify(value)) return;
      const wasPresent = Object.hasOwn(current.snapshot, key);
      current.snapshot = { ...current.snapshot, [key]: value };
      current.updatedAt = Date.now();
      if (
        wasPresent &&
        ["data", "form", "themeId", "advancedState"].includes(key) &&
        !firstEdit.current
      ) {
        firstEdit.current = true;
        trackTemplateEvent("template_first_edit", category, templateId);
      }
      if (editable) {
        if (!Object.hasOwn(savedFields.current, key)) savedFields.current[key] = JSON.stringify(value);
        setDirty(Object.entries(savedFields.current).some(([field, saved]) => JSON.stringify(current.snapshot[field]) !== saved));
      }
    },
    [category, templateId],
  );

  const persist = useCallback(
    async (payload: TemplateHistoryPayload, nextStatus: "draft" | "published") => {
      if (busyRef.current) throw new Error("Your progress is still saving. Please wait.");
      if (!draft.current) throw new Error("Your editor is still loading.");
      if (!authenticated) throw new Error("Sign in to save your event.");
      busyRef.current = true;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const current = draft.current;
        const eventId = await saveTemplateDraftToAccount({
          draft: current,
          payload,
          category,
          templateId,
          status: nextStatus,
          authenticated,
          remoteMedia: remoteMedia.current,
        });
        savedFields.current = Object.fromEntries(Object.keys(savedFields.current).map((key) => [key, JSON.stringify(current.snapshot[key])]));
        setDirty(false);
        window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: eventId } }));
        trackTemplateEvent(
          nextStatus === "draft" ? "template_draft_saved" : "template_published",
          category,
          templateId,
        );
        try {
          await flush();
        } catch {
          /* The server has safely retained this snapshot. */
        }
        setMessage(
          nextStatus === "draft"
            ? "Draft saved. Only you can view it until you publish."
            : "Published.",
        );
        if (nextStatus === "published") {
          await deleteTemplateDraft(current.id).catch(() => {});
          progress.allowNavigation(() => router.push(
            category === "signup-forms" ? `/smart-signup-form/${eventId}` : `/event/${eventId}`,
          ));
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [authenticated, category, templateId, info.historyCategory, flush, router],
  );

  const saveDraft = useCallback(async () => {
    await persist(
      buildTemplateDraftPayload(
        draft.current?.snapshot || {},
        category,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ),
      "draft",
    );
  }, [persist, category, info.name]);

  const progress = useUnsavedProgress({
    dirty,
    busy,
    save: async () => {
      if (authenticated) await saveDraft();
      else await flush();
      setDirty(false);
    },
    discard: async () => {
      await writeQueue.current.catch(() => {});
      setDirty(false);
    },
  });

  const requestSave = useCallback(async () => {
    trackTemplateEvent("template_save_attempt", category, templateId);
    if (authenticated) {
      await saveDraft().catch((failure: Error) => setError(failure.message));
      return;
    }
    if (!draft.current) return;
    draft.current.pendingSave = true;
    pendingHandled.current = false;
    try {
      await flush();
    } catch {
      setStorageReady(false);
      setError(
        "Use email to save in this tab. Google signup needs working browser storage so your edits survive the redirect.",
      );
    }
    setAuthOpen(true);
  }, [authenticated, category, templateId, saveDraft, flush]);

  useEffect(() => {
    if (
      !initial ||
      !editorReady ||
      !authenticated ||
      !draft.current?.pendingSave ||
      pendingHandled.current
    )
      return;
    pendingHandled.current = true;
    setAuthOpen(false);
    trackTemplateEvent("template_auth_completed", category, templateId);
    saveDraft().catch((failure: Error) => setError(failure.message));
  }, [initial, editorReady, authenticated, category, templateId, saveDraft]);

  const runtime = useMemo<TemplateEditorRuntime>(
    () => ({
      category,
      templateId,
      initial: initial || {},
      authenticated,
      record,
      requestSave,
      persist,
      previewPhoto(file) {
        const issue = validateClientUploadFile(file, "header");
        if (issue) {
          setError(issue);
          return "";
        }
        const url = URL.createObjectURL(file);
        mediaUrls.current[url] = url;
        if (draft.current) draft.current.assets[url] = file;
        return url;
      },
    }),
    [category, templateId, initial, authenticated, record, requestSave, persist],
  );

  const returnUrl = `${templateEditorHref(category, templateId)}?${editId && !draft.current ? `edit=${encodeURIComponent(editId)}` : `draft=${draft.current?.id || ""}`}`;
  return (
    <Context.Provider value={runtime}>
      <div className={styles.shell}>
        <div className="relative z-40 shrink-0 border-b border-[#ded5ca] bg-[#fffcf7]/95 px-4 py-3 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
            <Link
              href={`/${category}/templates`}
              className="text-sm font-semibold text-[#59405c]"
            >
              ← {info.name} templates
            </Link>
            <p className="text-xs text-[#746775]">
              {authenticated
                ? "Save a private draft, then publish when ready."
                : "Customize freely. An account is required to save and share."}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={busy || !initial}
                className="text-xs underline"
                onClick={() => setResetOpen(true)}
              >
                Start over
              </button>
              <button
                type="button"
                disabled={busy || !editorReady}
                onClick={() => void requestSave()}
                className="rounded-full bg-[#59405c] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : authenticated ? "Save draft" : "Save and continue"}
              </button>
            </div>
          </div>
          {!authenticated && (
            <p className="mx-auto mt-2 max-w-[1500px] text-xs text-[#746775]">
              {storageReady
                ? "Progress is saved only when you choose Save. Browser drafts are kept for 7 days."
                : "Browser storage is unavailable. Keep this tab open until your draft is saved to your account."}
            </p>
          )}
          {resetOpen && (
            <div
              role="group"
              aria-label="Confirm start over"
              className="mx-auto mt-3 max-w-[1500px] rounded-xl border border-[#ded5ca] bg-white p-4"
              onKeyDown={(event) => {
                if (event.key === "Escape") setResetOpen(false);
              }}
            >
              <p className="text-sm">Discard this temporary browser draft and start again?</p>
              <div className="mt-3 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 text-sm"
                  onClick={() => setResetOpen(false)}
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#59405c] px-4 py-2 text-sm text-white"
                  onClick={async () => {
                                    await writeQueue.current.catch(() => {});
                    if (draft.current) await deleteTemplateDraft(draft.current.id).catch(() => {});
                    draft.current = {
                      version: 1,
                      id: crypto.randomUUID(),
                      category,
                      templateId,
                      updatedAt: Date.now(),
                      snapshot: {},
                      assets: {},
                    };
                    window.history.replaceState(null, "", templateEditorHref(category, templateId));
                    remoteMedia.current = {};
                    setEditorReady(false);
                    setInitial({});
                    setGeneration((n) => n + 1);
                    setMessage("");
                    setError("");
                    firstEdit.current = false;
                    savedFields.current = {};
                    interacted.current = false;
                    setDirty(false);
                    pendingHandled.current = false;
                    setResetOpen(false);
                  }}
                >
                  Discard browser draft
                </button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="mx-auto mt-2 max-w-[1500px] text-sm text-red-700">
              {error}{" "}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  void flush()
                    .then(() => setError(""))
                    .catch((failure: Error) => setError(failure.message))
                }
              >
                Retry storage
              </button>
            </p>
          )}
          {message && (
            <p role="status" className="mx-auto mt-2 max-w-[1500px] text-sm text-green-800">
              {message}
            </p>
          )}
        </div>
        {initial ? (
          <div
            className={styles.workspace}
            onInputCapture={() => { interacted.current = true; }}
            onChangeCapture={() => { interacted.current = true; }}
            onPointerDownCapture={() => { interacted.current = true; }}
            onKeyDownCapture={() => { interacted.current = true; }}
            key={generation}
            inert={busy || authOpen || resetOpen ? true : undefined}
          >
            {children}
          </div>
        ) : (
          <div className="p-12 text-center" role="status">
            {error ? "Your draft could not be opened." : "Opening your template…"}
            {editId && !authenticated && (
              <button
                type="button"
                className="ml-3 underline"
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                Log in
              </button>
            )}
          </div>
        )}
      </div>
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => {
          setAuthOpen(false);
          if (draft.current) draft.current.pendingSave = false;

        }}
        onModeChange={setAuthMode}
        successRedirectUrl={returnUrl}
        signupIntent={info.intent}
        signupSource={category === "gymnastics" ? "gymnastics" : "snap"}
        description={
          category === "signup-forms"
            ? "Create an account to save your signup form and keep editing."
            : "Create an account to save your invitation and keep editing."
        }
        allowGoogleAuth={storageReady}
        onAuthenticated={async () => {
          await update();
          setAuthOpen(false);
          if (!initial) setLoadAttempt((value) => value + 1);
        }}
      />
    </Context.Provider>
  );
}
