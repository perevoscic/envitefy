"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_STUDIO_SETTINGS,
  defaultStudioFormat,
  isActiveStudioStatus,
  type StudioAsset,
  type StudioConversation,
  type StudioConversationSummary,
  type StudioSettings,
  type StudioTurnInput,
  type StudioVersion,
} from "@/lib/admin/marketing-studio/types";
import { choosePreviewVersion } from "./studio-state";

const API = "/api/admin/marketing-studio";
const DRAFT_KEY = "envitefy-content-studio-draft:";
const SETTINGS_KEY = "envitefy-content-studio-settings";

export type LegacyRun = {
  runId: string;
  request?: {
    generatedAt?: string;
    input?: {
      campaignName?: string;
      jobLabel?: string;
      productName?: string;
      assetType?: string;
      channels?: string[];
    };
  };
  status?: { state?: string; generatedAt?: string };
};

type LocalDraft = {
  draft: string;
  settings: StudioSettings;
  referenceAssetIds: string[];
  savedAt: number;
};
type SendOptions = { text?: string; settings?: StudioSettings; promptOverride?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { cache: "no-store", ...init });
  const json = await response.json();
  if (!response.ok)
    throw new Error(
      typeof json?.error === "string"
        ? json.error
        : "We couldn't complete that request. Please try again.",
    );
  return json as T;
}

function jsonBody(value: object, method = "POST"): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Your idea is still here.";
}

function readLocalDraft(id: string | null): LocalDraft | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(`${DRAFT_KEY}${id || "new"}`) || "null",
    ) as LocalDraft | null;
    return value && typeof value.draft === "string" && typeof value.savedAt === "number"
      ? value
      : null;
  } catch {
    return null;
  }
}

export function useContentStudio() {
  const [conversation, setConversation] = useState<StudioConversation | null>(null);
  const [conversations, setConversations] = useState<StudioConversationSummary[]>([]);
  const [legacyRuns, setLegacyRuns] = useState<LegacyRun[]>([]);
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS);
  const [draft, setDraft] = useState("");
  const [referenceAssetIds, setReferenceAssetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "local">("saved");
  const [error, setError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const currentId = useRef<string | null>(null);
  const currentConversation = useRef<StudioConversation | null>(null);
  const selectedId = useRef<string | null>(null);
  const creating = useRef<Promise<StudioConversation> | null>(null);
  const saving = useRef<Promise<void>>(Promise.resolve());
  const latestDraft = useRef({ draft, settings, referenceAssetIds });
  const ready = useRef(false);
  const pendingRequest = useRef<{ signature: string; id: string } | null>(null);
  latestDraft.current = { draft, settings, referenceAssetIds };
  currentConversation.current = conversation;

  function setLocation(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("conversation", id);
    else url.searchParams.delete("conversation");
    window.history.replaceState({}, "", url);
  }

  async function loadLibrary() {
    setLibraryLoading(true);
    setLibraryError(null);
    const [studio, legacy] = await Promise.allSettled([
      request<{ conversations: StudioConversationSummary[] }>("/conversations"),
      fetch("/api/admin/marketing-campaigns", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Earlier campaigns could not be loaded.");
        return response.json() as Promise<{ runs: LegacyRun[] }>;
      }),
    ]);
    if (studio.status === "fulfilled") setConversations(studio.value.conversations);
    else setLibraryError(errorMessage(studio.reason));
    if (legacy.status === "fulfilled") setLegacyRuns(legacy.value.runs || []);
    else
      setLibraryError(
        (current) =>
          current ||
          "Earlier campaigns couldn't be loaded. You can still open the original editor.",
      );
    setLibraryLoading(false);
  }

  function applyConversation(next: StudioConversation, recoverLocal = false) {
    const local = recoverLocal ? readLocalDraft(next.id) : null;
    const useLocal = local && local.savedAt > Date.parse(next.updatedAt);
    currentId.current = next.id;
    currentConversation.current = next;
    selectedId.current = next.selectedVersionId;
    setConversation(next);
    setDraft(useLocal ? local.draft : next.draft || "");
    setSettings(useLocal ? { ...DEFAULT_STUDIO_SETTINGS, ...local.settings } : next.settings);
    setReferenceAssetIds(useLocal ? local.referenceAssetIds : next.referenceAssetIds);
    setLocation(next.id);
  }

  useEffect(() => {
    let live = true;
    async function initialize() {
      void loadLibrary();
      const id = new URLSearchParams(window.location.search).get("conversation");
      try {
        if (id) {
          const result = await request<{ conversation: StudioConversation }>(
            `/conversations/${encodeURIComponent(id)}`,
          );
          if (live) applyConversation(result.conversation, true);
        } else {
          const local = readLocalDraft(null);
          let savedSettings = DEFAULT_STUDIO_SETTINGS;
          try {
            savedSettings = {
              ...DEFAULT_STUDIO_SETTINGS,
              ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
            };
          } catch {
            /* Defaults work without browser storage. */
          }
          if (live) {
            setSettings(local?.settings || savedSettings);
            setDraft(local?.draft || "");
          }
        }
      } catch (failure) {
        if (live) setError(errorMessage(failure));
      } finally {
        if (live) {
          ready.current = true;
          setLoading(false);
        }
      }
    }
    void initialize();
    return () => {
      live = false;
    };
  }, []);

  async function ensureConversation(): Promise<StudioConversation> {
    if (currentId.current && currentConversation.current?.id === currentId.current)
      return currentConversation.current;
    if (creating.current) return creating.current;
    const work = request<{ conversation: StudioConversation }>(
      "/conversations",
      jsonBody({ settings: latestDraft.current.settings }),
    ).then(({ conversation: next }) => {
      currentId.current = next.id;
      currentConversation.current = next;
      setConversation(next);
      setLocation(next.id);
      try {
        localStorage.setItem(
          `${DRAFT_KEY}${next.id}`,
          JSON.stringify({ ...latestDraft.current, savedAt: Date.now() }),
        );
        localStorage.removeItem(`${DRAFT_KEY}new`);
      } catch {
        /* Storage is optional. */
      }
      return next;
    });
    creating.current = work;
    try {
      return await work;
    } finally {
      creating.current = null;
    }
  }

  async function saveDraft() {
    const data = { ...latestDraft.current };
    if (!currentId.current && !data.draft.trim() && !data.referenceAssetIds.length) {
      setSaveState("saved");
      return;
    }
    const work = saving.current.then(async () => {
      setSaveState("saving");
      try {
        const target = await ensureConversation();
        const { conversation: next } = await request<{ conversation: StudioConversation }>(
          `/conversations/${target.id}`,
          jsonBody(data, "PATCH"),
        );
        if (currentId.current === next.id) {
          setConversation((current) =>
            current
              ? {
                  ...current,
                  draft: next.draft,
                  settings: next.settings,
                  referenceAssetIds: next.referenceAssetIds,
                  updatedAt: next.updatedAt,
                }
              : next,
          );
          setSaveState("saved");
        }
      } catch {
        setSaveState("local");
      }
    });
    saving.current = work;
    await work;
  }

  useEffect(() => {
    if (!ready.current || loading) return;
    try {
      localStorage.setItem(
        `${DRAFT_KEY}${currentId.current || "new"}`,
        JSON.stringify({ draft, settings, referenceAssetIds, savedAt: Date.now() }),
      );
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* The server still saves when local storage is unavailable. */
    }
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void saveDraft();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [draft, settings, referenceAssetIds, loading]);

  const activeVersion = conversation?.versions.find((version) =>
    isActiveStudioStatus(version.status),
  );
  const activeVersionId = activeVersion?.id;

  useEffect(() => {
    if (!activeVersionId || !conversation?.id) return;
    const id = conversation.id;
    let busy = false;
    let stopped = false;
    async function poll() {
      if (busy) return;
      busy = true;
      try {
        await request<{ version: StudioVersion }>(`/versions/${activeVersionId}/refresh`, {
          method: "POST",
        });
        const { conversation: next } = await request<{ conversation: StudioConversation }>(
          `/conversations/${id}`,
        );
        if (!stopped && currentId.current === id)
          setConversation({
            ...next,
            selectedVersionId: selectedId.current || next.selectedVersionId,
          });
      } catch (failure) {
        if (!stopped) setError(errorMessage(failure));
      } finally {
        busy = false;
      }
    }
    const interval = window.setInterval(() => {
      void poll();
    }, 10_000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [activeVersionId, conversation?.id]);

  async function openConversation(id: string) {
    setLoading(true);
    setError(null);
    await saveDraft();
    try {
      const { conversation: next } = await request<{ conversation: StudioConversation }>(
        `/conversations/${encodeURIComponent(id)}`,
      );
      applyConversation(next, true);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLoading(false);
    }
  }

  async function newConversation() {
    await saveDraft();
    currentId.current = null;
    currentConversation.current = null;
    selectedId.current = null;
    pendingRequest.current = null;
    setConversation(null);
    setDraft("");
    setReferenceAssetIds([]);
    setError(null);
    setLocation(null);
    void loadLibrary();
  }

  async function send(options: SendOptions = {}) {
    const submittedDraft = latestDraft.current.draft;
    const text = (options.text ?? latestDraft.current.draft).trim();
    if (!text || sending || activeVersion) return false;
    setSending(true);
    setError(null);
    try {
      await saveDraft();
      const target = await ensureConversation();
      const nextSettings = options.settings || latestDraft.current.settings;
      const parent =
        conversation?.versions.find((version) => version.id === conversation.selectedVersionId) ||
        conversation?.versions.at(-1);
      const input = {
        text,
        settings: nextSettings,
        parentVersionId: parent?.id || null,
        referenceAssetIds: latestDraft.current.referenceAssetIds,
        ...(options.promptOverride ? { promptOverride: options.promptOverride } : {}),
      };
      const signature = JSON.stringify(input);
      if (pendingRequest.current?.signature !== signature)
        pendingRequest.current = { signature, id: crypto.randomUUID() };
      const body: StudioTurnInput = { ...input, clientRequestId: pendingRequest.current.id };
      const { version } = await request<{ version: StudioVersion }>(
        `/conversations/${target.id}/turns`,
        jsonBody(body),
      );
      pendingRequest.current = null;
      selectedId.current = version.id;
      setSettings(nextSettings);
      const remainingDraft =
        options.text || latestDraft.current.draft !== submittedDraft
          ? latestDraft.current.draft
          : "";
      setDraft(remainingDraft);
      latestDraft.current = {
        ...latestDraft.current,
        draft: remainingDraft,
        settings: nextSettings,
      };
      setConversation((current) =>
        current
          ? {
              ...current,
              selectedVersionId: version.id,
              versions: [...current.versions.filter((item) => item.id !== version.id), version],
              messages: [
                ...current.messages,
                {
                  id: `pending-${version.id}`,
                  role: "user",
                  text,
                  versionId: version.id,
                  createdAt: version.createdAt,
                },
              ],
            }
          : current,
      );
      const { conversation: next } = await request<{ conversation: StudioConversation }>(
        `/conversations/${target.id}`,
      );
      if (currentId.current === next.id)
        setConversation({
          ...next,
          selectedVersionId: selectedId.current || next.selectedVersionId,
        });
      void loadLibrary();
      return true;
    } catch (failure) {
      setError(errorMessage(failure));
      return false;
    } finally {
      setSending(false);
    }
  }

  async function upload(files: File[]) {
    if (!files.length || uploading) return;
    setUploading(true);
    setError(null);
    try {
      await saveDraft();
      const target = await ensureConversation();
      const data = new FormData();
      data.append("conversationId", target.id);
      for (const file of files) data.append("files", file);
      const { assets } = await request<{ assets: StudioAsset[] }>("/uploads", {
        method: "POST",
        body: data,
      });
      setConversation((current) =>
        current ? { ...current, attachments: [...current.attachments, ...assets] } : current,
      );
      setReferenceAssetIds((current) => [
        ...new Set([...current, ...assets.map((asset) => asset.id)]),
      ]);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUploading(false);
    }
  }

  async function selectVersion(id: string) {
    if (!conversation) return;
    selectedId.current = id;
    setConversation((current) => (current ? { ...current, selectedVersionId: id } : current));
    try {
      await request(
        `/conversations/${conversation.id}`,
        jsonBody({ selectedVersionId: id }, "PATCH"),
      );
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  async function rename(title: string) {
    if (!conversation || !title.trim()) return;
    try {
      const { conversation: next } = await request<{ conversation: StudioConversation }>(
        `/conversations/${conversation.id}`,
        jsonBody({ title: title.trim() }, "PATCH"),
      );
      setConversation((current) => (current ? { ...current, title: next.title } : current));
      void loadLibrary();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  async function retryFinishing(versionId: string) {
    if (sending || activeVersion) return;
    setSending(true);
    setError(null);
    try {
      const { version } = await request<{ version: StudioVersion }>(
        `/versions/${versionId}/retry`,
        { method: "POST" },
      );
      selectedId.current = version.id;
      setConversation((current) =>
        current
          ? {
              ...current,
              selectedVersionId: version.id,
              versions: current.versions.map((item) => (item.id === version.id ? version : item)),
            }
          : current,
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSending(false);
    }
  }

  function reviseFailedVersion(version: StudioVersion) {
    setDraft(version.input.text);
    setSettings(version.input.settings);
    setReferenceAssetIds(version.input.referenceAssetIds);
    document.getElementById("studio-idea")?.focus();
  }

  function changeSettings(next: Partial<StudioSettings>) {
    setSettings((current) => {
      const result = { ...current, ...next };
      if (next.platform || next.output)
        result.format = defaultStudioFormat(result.platform, result.output);
      return result;
    });
  }

  const selectedVersion =
    conversation?.versions.find((version) => version.id === conversation.selectedVersionId) ||
    conversation?.versions.at(-1) ||
    null;
  const previewVersion = choosePreviewVersion(conversation?.versions || [], selectedVersion);

  return {
    conversation,
    conversations,
    legacyRuns,
    settings,
    draft,
    referenceAssetIds,
    loading,
    libraryLoading,
    sending,
    uploading,
    saveState,
    error,
    libraryError,
    activeVersion,
    selectedVersion,
    previewVersion,
    setDraft,
    setError,
    changeSettings,
    setReferenceAssetIds,
    openConversation,
    newConversation,
    send,
    upload,
    selectVersion,
    rename,
    loadLibrary,
    retryFinishing,
    reviseFailedVersion,
  };
}

export type ContentStudio = ReturnType<typeof useContentStudio>;
