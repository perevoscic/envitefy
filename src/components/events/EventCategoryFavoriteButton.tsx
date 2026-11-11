"use client";

import { LoaderCircle, Star } from "lucide-react";
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

export function CategoryFavoriteFeedback({ favorites }: { favorites: Favorites }) {
  if (!favorites.authenticated || !favorites.error) return null;
  return <div role="alert" className={styles.error}>
    <span>{favorites.error}</span>
    <button type="button" onClick={() => void favorites.retry()}>Retry favorites</button>
  </div>;
}

export function EventCategoryFavoriteControl({ favorite, favorites }: { favorite: CategoryFavorite; favorites: Favorites }) {
  return <div className={styles.control}>
    <CategoryFavoriteButton favorite={favorite} favorites={favorites} />
    <CategoryFavoriteFeedback favorites={favorites} />
  </div>;
}

function ConnectedFavoriteButton({ favorite }: { favorite: CategoryFavorite }) {
  const favorites = useEventCategoryFavorites();
  return <EventCategoryFavoriteControl favorite={favorite} favorites={favorites} />;
}

export default function EventCategoryFavoriteButton(target: Parameters<typeof categoryFavoriteFor>[0]) {
  const { data: session, status } = useSession();
  const favorite = categoryFavoriteFor(target);
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id;
  if (!favorite || status !== "authenticated" || !identity) return null;
  return <ConnectedFavoriteButton favorite={favorite} />;
}
