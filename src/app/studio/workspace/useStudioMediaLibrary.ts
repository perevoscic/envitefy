"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { clean } from "../studio-workspace-builders";
import { STORAGE_KEY } from "../studio-workspace-field-config";
import {
  extractHistoryStudioImageUrl,
  extractHistoryStudioInvitationData,
  isEphemeralOrDevOnlyImageUrl,
  isNonFallbackStudioThumbnailUrl,
  restoreHydratedMediaItems,
  sanitizeInvitationData,
  sanitizeMediaItems,
} from "../studio-workspace-sanitize";
import type { MediaItem } from "../studio-workspace-types";
import {
  canonicalizeLibraryPayloadForCompare,
  putStudioLibraryRemote,
} from "./studio-library-remote";

function readLocalStorageItems(): MediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as unknown;
    return restoreHydratedMediaItems(sanitizeMediaItems(parsed));
  } catch {
    return [];
  }
}

/** Server wins on id collision; union otherwise; newest createdAt first. */
function mergeStudioLibraries(local: MediaItem[], server: MediaItem[]): MediaItem[] {
  const map = new Map<string, MediaItem>();
  for (const item of local) {
    map.set(item.id, item);
  }
  for (const item of server) {
    map.set(item.id, item);
  }
  const combined = [...map.values()];
  combined.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return sanitizeMediaItems(combined);
}

const REMOTE_SAVE_DEBOUNCE_MS = 800;

export function useStudioMediaLibrary() {
  const { data: session, status } = useSession();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [remoteHydrated, setRemoteHydrated] = useState(false);
  const [librarySyncError, setLibrarySyncError] = useState<string | null>(null);
  const [syncRetryTick, setSyncRetryTick] = useState(0);
  const studioHistorySyncAttemptedRef = useRef(new Set<string>());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaListRef = useRef<MediaItem[]>([]);

  const retryLibrarySync = useCallback(() => {
    setSyncRetryTick((n) => n + 1);
  }, []);

  useEffect(() => {
    mediaListRef.current = mediaList;
  }, [mediaList]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    let cancelled = false;

    async function hydrateRemote() {
      const local = readLocalStorageItems();

      if (status !== "authenticated") {
        setMediaList(local);
        setLibrarySyncError(null);
        setRemoteHydrated(true);
        return;
      }

      setRemoteHydrated(false);

      let server: MediaItem[] = [];
      let getOk = false;
      try {
        const res = await fetch("/api/studio/library", { credentials: "include" });
        if (res.ok) {
          getOk = true;
          const data: unknown = await res.json();
          const rawItems =
            data != null && typeof data === "object" && !Array.isArray(data) && "items" in data
              ? (data as { items: unknown }).items
              : [];
          server = restoreHydratedMediaItems(sanitizeMediaItems(rawItems));
        } else {
          console.warn("[studio-library] GET failed", res.status);
        }
      } catch (err) {
        console.warn("[studio-library] GET network error", err);
      }

      if (cancelled) return;

      const merged = mergeStudioLibraries(
        mergeStudioLibraries(local, mediaListRef.current),
        server,
      );
      setMediaList(merged);

      if (!getOk) {
        setLibrarySyncError("Could not load your library from the server. Check your connection.");
      } else if (
        canonicalizeLibraryPayloadForCompare(merged) === canonicalizeLibraryPayloadForCompare(server)
      ) {
        setLibrarySyncError(null);
      } else {
        const { ok, status: putStatus } = await putStudioLibraryRemote(merged);
        if (cancelled) return;
        if (ok) {
          setLibrarySyncError(null);
        } else {
          setLibrarySyncError(
            putStatus === 413
              ? "Library is too large to sync. Try publishing cards or removing heavy images."
              : "Could not save your library to the server. Your items stay in this browser.",
          );
        }
      }

      if (!cancelled) {
        setRemoteHydrated(true);
      }
    }

    void hydrateRemote();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email, syncRetryTick]);

  const lastFocusRetryAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status !== "authenticated" || !librarySyncError) return;
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusRetryAtRef.current < 10_000) return;
      lastFocusRetryAtRef.current = now;
      setSyncRetryTick((n) => n + 1);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [status, librarySyncError]);

  useEffect(() => {
    if (!remoteHydrated) return;
    try {
      const sanitized = sanitizeMediaItems(mediaList);
      if (sanitized.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Ignore storage quota issues in the studio shell.
    }
  }, [mediaList, remoteHydrated]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteHydrated) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void putStudioLibraryRemote(mediaList).then(({ ok, status: putStatus }) => {
        if (ok) {
          setLibrarySyncError(null);
        } else {
          console.warn("[studio-library] debounced PUT failed", putStatus);
          setLibrarySyncError(
            putStatus === 413
              ? "Library is too large to sync. Try publishing cards or removing heavy images."
              : "Could not save your library to the server. Your items stay in this browser.",
          );
        }
      });
    }, REMOTE_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [mediaList, status, remoteHydrated]);

  useEffect(() => {
    let active = true;

    async function syncFromPublishedHistory() {
      for (const item of mediaList) {
        if (!active) return;
        const pubId = item.publishedEventId?.trim();
        if (!pubId) continue;

        const nonFallbackImage = isNonFallbackStudioThumbnailUrl(item.url, item.details);
        const hasRealImage =
          nonFallbackImage &&
          Boolean(clean(item.url)) &&
          !isEphemeralOrDevOnlyImageUrl(item.url);
        const needsPageData = item.type === "page" && !item.data;
        const stuckWhileGenerating = item.status === "error" || item.status === "loading";
        const readyMissingSyncedAsset =
          item.status === "ready" && (!hasRealImage || needsPageData);
        if (!stuckWhileGenerating && !readyMissingSyncedAsset) continue;

        const needsImage = !hasRealImage;
        if (!needsImage && !needsPageData) continue;

        const syncKey = `${item.id}:${pubId}`;
        if (studioHistorySyncAttemptedRef.current.has(syncKey)) continue;
        studioHistorySyncAttemptedRef.current.add(syncKey);

        try {
          const res = await fetch(`/api/history/${encodeURIComponent(pubId)}`, {
            credentials: "include",
          });
          if (!active) {
            studioHistorySyncAttemptedRef.current.delete(syncKey);
            return;
          }
          if (!res.ok) {
            studioHistorySyncAttemptedRef.current.delete(syncKey);
            continue;
          }
          const row: unknown = await res.json();
          const imageUrl = extractHistoryStudioImageUrl(row);
          if (!active) {
            studioHistorySyncAttemptedRef.current.delete(syncKey);
            return;
          }
          if (!imageUrl) {
            studioHistorySyncAttemptedRef.current.delete(syncKey);
            continue;
          }

          setMediaList((prev) =>
            sanitizeMediaItems(
              prev.map((entry) => {
                if (entry.id !== item.id) return entry;
                const fromErrorOrLoading =
                  entry.status === "error" || entry.status === "loading";
                const nextStatus = fromErrorOrLoading ? "ready" : entry.status;

                let dataPatch: Pick<MediaItem, "data"> | Record<string, never> = {};
                if (item.type === "page" && (!entry.data || fromErrorOrLoading)) {
                  dataPatch = {
                    data:
                      extractHistoryStudioInvitationData(row, entry.details) ||
                      sanitizeInvitationData({}, entry.details),
                  };
                }

                return {
                  ...entry,
                  status: nextStatus,
                  url: imageUrl,
                  ...dataPatch,
                  errorMessage: undefined,
                };
              }),
            ),
          );
        } catch {
          if (active) studioHistorySyncAttemptedRef.current.delete(syncKey);
        }
      }
    }

    void syncFromPublishedHistory();
    return () => {
      active = false;
    };
  }, [mediaList]);

  return { mediaList, setMediaList, librarySyncError, retryLibrarySync };
}
