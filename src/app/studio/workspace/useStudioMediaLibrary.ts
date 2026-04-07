"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { clean } from "../studio-workspace-builders";
import { STORAGE_KEY } from "../studio-workspace-field-config";
import {
  extractHistoryStudioImageUrl,
  extractHistoryStudioInvitationData,
  isNonFallbackStudioThumbnailUrl,
  restoreHydratedMediaItems,
  sanitizeInvitationData,
  sanitizeMediaItems,
} from "../studio-workspace-sanitize";
import type { MediaItem } from "../studio-workspace-types";

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
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => readLocalStorageItems());
  const [remoteHydrated, setRemoteHydrated] = useState(false);
  const studioHistorySyncAttemptedRef = useRef(new Set<string>());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    let cancelled = false;

    async function hydrateRemote() {
      const local = readLocalStorageItems();

      if (status !== "authenticated") {
        setMediaList(local);
        setRemoteHydrated(true);
        return;
      }

      setRemoteHydrated(false);

      let server: MediaItem[] = [];
      try {
        const res = await fetch("/api/studio/library", { credentials: "include" });
        if (res.ok) {
          const data: unknown = await res.json();
          const rawItems =
            data != null && typeof data === "object" && !Array.isArray(data) && "items" in data
              ? (data as { items: unknown }).items
              : [];
          server = restoreHydratedMediaItems(sanitizeMediaItems(rawItems));
        }
      } catch {
        // keep local-only
      }

      if (cancelled) return;

      const merged = mergeStudioLibraries(local, server);
      setMediaList(merged);

      if (server.length === 0 && local.length > 0 && merged.length > 0) {
        try {
          await fetch("/api/studio/library", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: merged }),
          });
        } catch {
          // migration best-effort
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
  }, [status, session?.user?.email]);

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
      const sanitized = sanitizeMediaItems(mediaList);
      void fetch("/api/studio/library", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: sanitized }),
      }).catch(() => {});
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
        if (item.status !== "error" && item.status !== "loading") continue;
        const pubId = item.publishedEventId?.trim();
        if (!pubId) continue;

        const nonFallbackImage = isNonFallbackStudioThumbnailUrl(item.url, item.details);
        const needsImage = !nonFallbackImage || !clean(item.url);
        const needsPageData = item.type === "page" && !item.data;
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

          const invitationFromHistory =
            item.type === "page"
              ? extractHistoryStudioInvitationData(row, item.details) ||
                sanitizeInvitationData({}, item.details)
              : undefined;

          setMediaList((prev) =>
            sanitizeMediaItems(
              prev.map((entry) => {
                if (entry.id !== item.id) return entry;
                if (entry.status !== "error" && entry.status !== "loading") return entry;
                return {
                  ...entry,
                  status: "ready",
                  url: imageUrl,
                  ...(invitationFromHistory ? { data: invitationFromHistory } : {}),
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

  return { mediaList, setMediaList };
}
