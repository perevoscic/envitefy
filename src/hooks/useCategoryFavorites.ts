"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { notifyFeatureVisibilityChanged } from "@/hooks/useFeatureVisibility";
import {
  CATEGORY_FAVORITES,
  categoryFavoritesFor,
  defaultCreationCategoryFor,
  filterPinnedCategoryIds,
  normalizePinnedCategoryIds,
  resolvePinnedCategoryIds,
} from "@/lib/category-favorites";
import type { CreationAccess } from "@/lib/creation-access";

type CategoryFavoritePreferences = {
  hasLoadedPreferences: boolean;
  pinnedCategoryIds?: string[];
  error?: string;
  loading?: boolean;
  refresh?: () => Promise<unknown>;
};

type AccountValue<T> = { identity: string; epoch: number; value: T };
export const CATEGORY_FAVORITE_SAVE_TIMEOUT_MS = 10_000;

export function useCategoryFavorites({
  access,
  preferences,
  signupSource,
  defaultCreateIntent,
}: {
  access: CreationAccess | null;
  preferences: CategoryFavoritePreferences;
  signupSource?: unknown;
  defaultCreateIntent?: unknown;
}) {
  const { data: session, status } = useSession();
  const identity =
    status === "authenticated"
      ? session?.user?.email || (session?.user as { id?: string } | undefined)?.id || ""
      : "";
  const account = useRef({ identity, epoch: 0 });
  if (account.current.identity !== identity) {
    account.current = { identity, epoch: account.current.epoch + 1 };
  }
  const epoch = account.current.epoch;
  const [confirmed, setConfirmed] = useState<AccountValue<{
    ids: string[];
    source: string;
  }> | null>(null);
  const [failure, setFailure] = useState<AccountValue<string> | null>(null);
  const [pending, setPending] = useState<AccountValue<boolean> | null>(null);
  const request = useRef<{ identity: string; epoch: number; controller: AbortController } | null>(
    null,
  );
  const persisted = resolvePinnedCategoryIds(preferences.pinnedCategoryIds);
  const source = JSON.stringify(persisted);
  const preferenceSource = useRef(source);
  preferenceSource.current = source;
  const isCurrent = <T>(value: AccountValue<T> | null): value is AccountValue<T> =>
    Boolean(value && value.identity === identity && value.epoch === epoch);
  const ids =
    isCurrent(confirmed) && confirmed.value.source === source ? confirmed.value.ids : persisted;
  const loading =
    status === "loading" ||
    Boolean(identity && ((!preferences.hasLoadedPreferences && !preferences.error) || !access));
  const ready = Boolean(identity && preferences.hasLoadedPreferences && access);
  const defaultCategory =
    ready && access ? defaultCreationCategoryFor(signupSource, defaultCreateIntent, access) : null;
  const favorites =
    ready && access
      ? categoryFavoritesFor(ids, access).filter((favorite) => favorite.id !== defaultCategory?.id)
      : [];
  const options =
    ready && access
      ? categoryFavoritesFor(
          CATEGORY_FAVORITES.map((favorite) => favorite.id),
          access,
        ).filter((favorite) => favorite.id !== defaultCategory?.id)
      : [];
  const saving = isCurrent(pending) && pending.value;
  const error =
    (isCurrent(failure) ? failure.value : "") ||
    (identity && !preferences.hasLoadedPreferences ? preferences.error || "" : "");

  useEffect(
    () => () => {
      const active = request.current;
      if (active?.identity === identity && active.epoch === epoch) {
        active.controller.abort();
        request.current = null;
      }
    },
    [identity, epoch],
  );

  const toggle = useCallback(
    async (id: string) => {
      if (!ready || !access || !options.some((favorite) => favorite.id === id)) return;
      if (request.current?.identity === identity && request.current.epoch === epoch) return;
      request.current?.controller.abort();
      const controller = new AbortController();
      const active = { identity, epoch, controller };
      request.current = active;
      const currentIds = filterPinnedCategoryIds(ids, access);
      const nextIds = currentIds.includes(id)
        ? currentIds.filter((value) => value !== id)
        : [...currentIds, id];
      setPending({ identity, epoch, value: true });
      setFailure({ identity, epoch, value: "" });
      const ownsRequest = () =>
        request.current === active &&
        account.current.identity === identity &&
        account.current.epoch === epoch;
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      try {
        const timeout = new Promise<never>((_, reject) => {
          timeoutTimer = setTimeout(() => {
            timedOut = true;
            controller.abort();
            reject(new Error("Saving favorites took too long"));
          }, CATEGORY_FAVORITE_SAVE_TIMEOUT_MS);
        });
        const save = (async () => {
          const response = await fetch("/api/user/feature-visibility", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pinnedCategoryIds: nextIds }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Could not save favorites");
          const json = await response.json();
          const savedIds = json?.featureVisibility?.pinnedCategoryIds;
          if (!Array.isArray(savedIds) || savedIds.some((value) => typeof value !== "string")) {
            throw new Error("Favorites save was not confirmed");
          }
          return normalizePinnedCategoryIds(savedIds);
        })();
        const savedIds = await Promise.race([save, timeout]);
        if (!ownsRequest() || controller.signal.aborted) return;
        setConfirmed({
          identity,
          epoch,
          value: { ids: savedIds, source: preferenceSource.current },
        });
        notifyFeatureVisibilityChanged();
      } catch {
        if (ownsRequest() && (!controller.signal.aborted || timedOut)) {
          setFailure({
            identity,
            epoch,
            value: timedOut
              ? "Saving your favorites took too long. Please try again."
              : "Could not save your favorites. Please try again.",
          });
        }
      } finally {
        clearTimeout(timeoutTimer);
        if (ownsRequest()) {
          request.current = null;
          setPending({ identity, epoch, value: false });
        }
      }
    },
    [access, epoch, identity, ids, options, ready],
  );

  const retry = useCallback(async () => {
    await preferences.refresh?.();
  }, [preferences.refresh]);
  return { favorites, options, defaultCategory, loading, saving, error, toggle, retry };
}
