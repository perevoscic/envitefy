"use client";

import { LoaderCircle, RotateCcw, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEventCategoryFavorites } from "@/hooks/useEventCategoryFavorites";
import { categoryFavoriteFor, type CategoryFavorite } from "@/lib/category-favorites";
import styles from "./event-category-favorite.module.css";

export type EventCategoryFavorites = ReturnType<typeof useEventCategoryFavorites>;
type Favorites = EventCategoryFavorites;

export function CategoryFavoriteButton({ favorite, favorites, iconOnly = false, className = "" }: {
  favorite: CategoryFavorite;
  favorites: Favorites;
  iconOnly?: boolean;
  className?: string;
}) {
  if (!favorites.available.some((option) => option.id === favorite.id)) return null;
  const selected = favorites.pinnedIds.includes(favorite.id);
  return (
    <button
      type="button"
      data-event-category-favorite={favorite.id}
      className={`${styles.button} ${iconOnly ? styles.iconOnly : ""} ${className}`}
      aria-label={`${selected ? "Remove" : "Add"} ${favorite.label} ${selected ? "from" : "to"} favorites`}
      aria-pressed={selected}
      disabled={favorites.loading || favorites.saving}
      onClick={() => void favorites.toggle(favorite.id)}
    >
      {favorites.savingId === favorite.id ? <LoaderCircle className={styles.spinner} size={19} aria-hidden="true" /> :
        <Star size={19} fill={selected ? "currentColor" : "none"} aria-hidden="true" />}
      {!iconOnly && <span>{selected ? "Favorited" : "Favorite"}</span>}
    </button>
  );
}

export function CategoryFavoriteFeedback({ favorites, compact = false }: { favorites: Favorites; compact?: boolean }) {
  if (!favorites.authenticated || !favorites.error) return null;
  if (compact) return <span role="alert" className={styles.compactFeedback}>
    <span className={styles.srOnly}>{favorites.error}</span>
    <button type="button" aria-label="Retry favorites" title={favorites.error} onClick={() => void favorites.retry()}>
      <RotateCcw size={16} aria-hidden="true" />
    </button>
  </span>;
  return <div role="alert" className={styles.error}>
    <span>{favorites.error}</span>
    <button type="button" onClick={() => void favorites.retry()}>Retry favorites</button>
  </div>;
}

export function EventCategoryFavoriteControl({ favorite, favorites, iconOnly = false }: { favorite: CategoryFavorite; favorites: Favorites; iconOnly?: boolean }) {
  return <div className={styles.control}>
    {(!iconOnly || !favorites.error) && <CategoryFavoriteButton favorite={favorite} favorites={favorites} iconOnly={iconOnly} />}
    <CategoryFavoriteFeedback favorites={favorites} compact={iconOnly} />
  </div>;
}

function ConnectedFavoriteButton({ favorite, iconOnly }: { favorite: CategoryFavorite; iconOnly?: boolean }) {
  const favorites = useEventCategoryFavorites();
  return <EventCategoryFavoriteControl favorite={favorite} favorites={favorites} iconOnly={iconOnly} />;
}

export default function EventCategoryFavoriteButton({ iconOnly = false, ...target }: Parameters<typeof categoryFavoriteFor>[0] & { iconOnly?: boolean }) {
  const { data: session, status } = useSession();
  const favorite = categoryFavoriteFor(target);
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id;
  if (!favorite || status !== "authenticated" || !identity) return null;
  return <ConnectedFavoriteButton favorite={favorite} iconOnly={iconOnly} />;
}
