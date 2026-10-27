"use client";

import {
  Baby,
  Cake,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Heart,
  Home,
  Pencil,
  Pin,
  School,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { SidebarLink } from "@/components/ui/sidebar";
import type { CategoryFavorite } from "@/lib/category-favorites";

function FavoriteIcon({ id }: { id: string }) {
  if (id === "gymnastics" || id === "football") {
    return (
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 bg-current"
        style={{
          WebkitMaskImage: `url(/icons/sidebar-${id}.png)`,
          maskImage: `url(/icons/sidebar-${id}.png)`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }
  const Icon =
    id === "signup-forms"
      ? ClipboardList
      : id === "birthdays"
        ? Cake
        : ["weddings", "anniversaries", "bridal-showers"].includes(id)
          ? Heart
          : ["baby-showers", "gender-reveal"].includes(id)
            ? Baby
            : id === "school"
              ? School
              : id === "graduations"
                ? GraduationCap
                : ["housewarming", "open-house"].includes(id)
                  ? Home
                  : id === "religious-events"
                    ? Sparkles
                    : id === "holidays-seasonal"
                      ? CalendarDays
                      : id === "general"
                        ? Users
                        : Trophy;
  return <Icon size={20} strokeWidth={1.8} aria-hidden="true" />;
}

export function SidebarCategoryShortcut({
  favorite,
  active,
  onNavigate,
}: {
  favorite: CategoryFavorite;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <SidebarLink
      className="text-[color:var(--nav-sidebar-label-muted,#6150ad)]"
      link={{
        label: favorite.label,
        icon: <FavoriteIcon id={favorite.id} />,
        active,
        onClick: onNavigate,
      }}
    />
  );
}

export function SidebarCategoryFavorites({
  favorites,
  options,
  activeId,
  loading,
  saving,
  error,
  onNavigate,
  onToggle,
  onRetry,
}: {
  favorites: CategoryFavorite[];
  options: CategoryFavorite[];
  activeId: string | null;
  loading: boolean;
  saving: boolean;
  error: string;
  onNavigate: (id: string) => void;
  onToggle: (id: string) => Promise<void>;
  onRetry?: () => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const editorId = useId();
  const editButton = useRef<HTMLButtonElement>(null);
  const pinned = new Set(favorites.map((favorite) => favorite.id));
  return (
    <section
      aria-label="Favorite event types"
      aria-busy={saving}
      className="space-y-1 pt-2"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !editing) return;
        event.stopPropagation();
        setEditing(false);
        editButton.current?.focus();
      }}
    >
      <div className="flex min-h-11 items-center justify-between">
        <p className="nav-chrome-sidebar-caption px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--nav-chrome-muted,#75618a)]">
          Favorites
        </p>
        <button
          ref={editButton}
          type="button"
          aria-label="Edit favorite categories"
          aria-expanded={editing}
          aria-controls={editorId}
          onClick={() => setEditing((value) => !value)}
          className="nav-chrome-sidebar-control flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[color:var(--nav-sidebar-label-muted,#6150ad)] transition-colors hover:bg-[color:var(--nav-chrome-selected-surface,rgba(255,255,255,0.7))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      {favorites.map((favorite) => (
        <SidebarCategoryShortcut
          key={favorite.id}
          favorite={favorite}
          active={activeId === favorite.id}
          onNavigate={() => {
            setEditing(false);
            onNavigate(favorite.id);
          }}
        />
      ))}
      {editing && (
        <div id={editorId} data-category-favorites-editor className="px-2 pb-2">
          {loading && (
            <p role="status" className="nav-chrome-menu-detail px-2 py-3 text-sm">
              Loading favorites…
            </p>
          )}
          <div
            role="region"
            aria-label="Available favorite event types"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: The named native scroll region supports keyboard scrolling.
            tabIndex={0}
            className="max-h-[min(50dvh,24rem)] space-y-1 overflow-y-auto overscroll-contain rounded-xl pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {options.map((favorite) => {
              const selected = pinned.has(favorite.id);
              return (
                <button
                  key={favorite.id}
                  type="button"
                  disabled={loading || saving}
                  aria-pressed={selected}
                  aria-label={`${selected ? "Unpin" : "Pin"} ${favorite.label}`}
                  onClick={() => void onToggle(favorite.id)}
                  className={`nav-chrome-sidebar-link flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-wait disabled:opacity-60 ${selected ? "nav-chrome-sidebar-link-active bg-white/75 text-[color:var(--nav-sidebar-label,#6b5fc2)]" : "text-[color:var(--nav-sidebar-label-muted,#6150ad)] hover:bg-white/60"}`}
                >
                  <FavoriteIcon id={favorite.id} />
                  <span className="min-w-0 flex-1">{favorite.label}</span>
                  <Pin
                    size={16}
                    aria-hidden="true"
                    className={selected ? "fill-current" : "opacity-40"}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {saving && (
        <p role="status" className="nav-chrome-menu-detail px-3 py-1 text-xs">
          Saving favorites…
        </p>
      )}
      {error && (
        <p role="alert" className="nav-chrome-menu-detail px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {error && !options.length && onRetry && (
        <button
          type="button"
          onClick={() => void onRetry()}
          disabled={loading || saving}
          className="nav-chrome-sidebar-link min-h-11 w-full rounded-xl px-3 text-left text-sm text-[color:var(--nav-sidebar-label-muted,#6150ad)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
        >
          Retry favorites
        </button>
      )}
    </section>
  );
}

export default SidebarCategoryFavorites;
