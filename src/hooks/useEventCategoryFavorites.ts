"use client";

import { useSession } from "next-auth/react";
import { useCategoryFavorites } from "./useCategoryFavorites";
import { useCreationAccess } from "./useCreationAccess";
import { useFeatureVisibility } from "./useFeatureVisibility";

export function useEventCategoryFavorites() {
  const { status } = useSession();
  const access = useCreationAccess();
  const preferences = useFeatureVisibility();
  const favorites = useCategoryFavorites({ access: access.access, preferences });
  return {
    ...favorites,
    authenticated: status === "authenticated",
    error: favorites.error || access.error,
    retry: async () => { await Promise.all([access.reload(), favorites.retry()]); },
  };
}
