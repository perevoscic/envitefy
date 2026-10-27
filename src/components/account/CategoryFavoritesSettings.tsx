"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import CategoryInterestPicker from "@/components/account/CategoryInterestPicker";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import {
  notifyFeatureVisibilityChanged,
  useFeatureVisibility,
} from "@/hooks/useFeatureVisibility";
import { filterPinnedCategoryIds, normalizePinnedCategoryIds } from "@/lib/category-favorites";

type AccountValue<T> = { identity: string; epoch: number; value: T };
type FavoritesDraft = { ids: string[]; source: string; dirty: boolean };

export default function CategoryFavoritesSettings() {
  const { data: session, status } = useSession();
  const creation = useCreationAccess();
  const preferences = useFeatureVisibility();
  const identity = status === "authenticated"
    ? session?.user?.email || (session?.user as { id?: string } | undefined)?.id || ""
    : "";
  const account = useRef({ identity, epoch: 0 });
  if (account.current.identity !== identity) {
    account.current = { identity, epoch: account.current.epoch + 1 };
  }
  const epoch = account.current.epoch;
  const [draft, setDraft] = useState<AccountValue<FavoritesDraft> | null>(null);
  const [pending, setPending] = useState<AccountValue<boolean> | null>(null);
  const [feedback, setFeedback] = useState<AccountValue<{ error: boolean; text: string }> | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const request = useRef<{ identity: string; epoch: number; controller: AbortController } | null>(null);
  const isCurrent = <T,>(value: AccountValue<T> | null): value is AccountValue<T> =>
    Boolean(value && value.identity === identity && value.epoch === epoch);
  const persisted = normalizePinnedCategoryIds(preferences.pinnedCategoryIds);
  const source = JSON.stringify(persisted);
  const latestSource = useRef(source);
  latestSource.current = source;
  const selected = isCurrent(draft) && (draft.value.dirty || draft.value.source === source)
    ? draft.value.ids
    : persisted;
  const saving = isCurrent(pending) && pending.value;
  const ready = Boolean(identity && preferences.hasLoadedPreferences && creation.access);
  const loadError = preferences.error || creation.error;
  const message = isCurrent(feedback) ? feedback.value : null;

  useEffect(() => {
    if (message?.error) feedbackRef.current?.focus();
  }, [message]);

  useEffect(() => () => {
    const active = request.current;
    if (active?.identity === identity && active.epoch === epoch) {
      active.controller.abort();
      request.current = null;
    }
  }, [identity, epoch]);

  async function saveFavorites() {
    const access = creation.access;
    if (!ready || !access || saving || request.current
      || account.current.identity !== identity || account.current.epoch !== epoch) return;
    const controller = new AbortController();
    const active = { identity, epoch, controller };
    request.current = active;
    const ownsRequest = () => request.current === active
      && account.current.identity === identity && account.current.epoch === epoch;
    setPending({ identity, epoch, value: true });
    setFeedback(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
          reject(new Error("Saving your favorites took too long. Please try again."));
        }, 10_000);
      });
      const save = (async () => {
        const response = await fetch("/api/user/feature-visibility", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinnedCategoryIds: filterPinnedCategoryIds(selected, access) }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not save your favorites. Please try again.");
        const payload = await response.json();
        const ids = payload?.featureVisibility?.pinnedCategoryIds;
        if (!Array.isArray(ids) || ids.some(id => typeof id !== "string")) {
          throw new Error("Favorites save was not confirmed. Please try again.");
        }
        return normalizePinnedCategoryIds(ids);
      })();
      const savedIds = await Promise.race([save, timeout]);
      if (!ownsRequest() || controller.signal.aborted) return;
      setDraft({ identity, epoch, value: { ids: savedIds, source: latestSource.current, dirty: false } });
      setFeedback({ identity, epoch, value: { error: false, text: "Favorites saved." } });
      notifyFeatureVisibilityChanged();
    } catch (error) {
      if (ownsRequest() && (!controller.signal.aborted || timedOut)) {
        setFeedback({ identity, epoch, value: {
          error: true,
          text: error instanceof Error ? error.message : "Could not save your favorites. Please try again.",
        } });
      }
    } finally {
      clearTimeout(timer);
      if (ownsRequest()) {
        request.current = null;
        setPending({ identity, epoch, value: false });
      }
    }
  }

  if (!ready) {
    return loadError ? (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive">{loadError}</p>
        <button type="button" className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" onClick={() => {
          void preferences.refresh();
          void creation.reload();
        }}>Retry favorites</button>
      </div>
    ) : <p role="status" className="text-sm text-muted-foreground">Loading favorites…</p>;
  }

  return (
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); void saveFavorites(); }}>
      <CategoryInterestPicker access={creation.access!} value={selected} disabled={saving} onChange={ids => {
        if (account.current.identity !== identity || account.current.epoch !== epoch) return;
        setDraft({ identity, epoch, value: { ids, source, dirty: true } });
        setFeedback(null);
      }} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">
          {saving ? "Saving…" : "Save favorites"}
        </button>
        {message ? <p ref={feedbackRef} tabIndex={message.error ? -1 : undefined} role={message.error ? "alert" : "status"} className={`text-sm ${message.error ? "text-destructive" : "text-card-foreground"}`}>{message.text}</p> : null}
      </div>
    </form>
  );
}
