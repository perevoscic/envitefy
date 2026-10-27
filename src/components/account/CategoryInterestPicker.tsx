"use client";

import {
  Baby,
  Cake,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Flower2,
  GraduationCap,
  Heart,
  Home,
  School,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  CATEGORY_FAVORITES,
  filterPinnedCategoryIds,
  type CategoryFavorite,
} from "@/lib/category-favorites";
import type { CreationAccess } from "@/lib/creation-access";
import { SPORT_ACTIVITY_PROFILES } from "@/lib/sports-discovery/profiles";
import styles from "./category-interests.module.css";

const sportIds = new Set(
  SPORT_ACTIVITY_PROFILES.map((sport) => (sport.key === "dance" ? "dance-ballet" : sport.key)),
);
const eventOrder = [
  "birthdays",
  "holidays-seasonal",
  "weddings",
  "anniversaries",
  "baby-showers",
  "bridal-showers",
  "gender-reveal",
  "school",
  "signup-forms",
  "general",
  "graduations",
  "housewarming",
  "open-house",
  "religious-events",
];

function InterestIcon({ id, className }: { id: string; className?: string }) {
  const Icon =
    id === "birthdays"
      ? Cake
      : id === "holidays-seasonal"
        ? CalendarDays
        : id === "weddings" || id === "anniversaries"
          ? Heart
          : id === "bridal-showers"
            ? Flower2
            : id === "baby-showers" || id === "gender-reveal"
              ? Baby
              : id === "school"
                ? School
                : id === "signup-forms"
                  ? ClipboardList
                  : id === "graduations"
                    ? GraduationCap
                    : id === "housewarming" || id === "open-house"
                      ? Home
                      : id === "religious-events"
                        ? Sparkles
                        : id === "general"
                          ? Users
                          : Trophy;
  return <Icon className={className} size={22} strokeWidth={1.45} aria-hidden="true" />;
}

export default function CategoryInterestPicker({
  value,
  onChange,
  access,
  disabled = false,
  variant = "compact",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  access: CreationAccess;
  disabled?: boolean;
  variant?: "compact" | "cards";
}) {
  const [sportsOpen, setSportsOpen] = useState(() => value.some((id) => sportIds.has(id)));
  const allowed = new Set(
    filterPinnedCategoryIds(
      CATEGORY_FAVORITES.map((favorite) => favorite.id),
      access,
    ),
  );
  const options = CATEGORY_FAVORITES.filter((favorite) => allowed.has(favorite.id));
  const selected = new Set(value);
  const sports = options.filter((favorite) => sportIds.has(favorite.id));
  const events = options
    .filter((favorite) => !sportIds.has(favorite.id))
    .sort((a, b) => eventOrder.indexOf(a.id) - eventOrder.indexOf(b.id));
  const choice = (favorite: CategoryFavorite) => (
    <label key={favorite.id} className={styles.choice} data-selected={selected.has(favorite.id)}>
      <input
        type="checkbox"
        checked={selected.has(favorite.id)}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.checked
              ? filterPinnedCategoryIds([...value, favorite.id], access)
              : value.filter((id) => id !== favorite.id),
          )
        }
      />
      {variant === "cards" ? (
        <>
          <InterestIcon id={favorite.id} className={styles.choiceIcon} />
          <span className={styles.selectionMark} aria-hidden="true">
            <Check size={12} strokeWidth={2} />
          </span>
        </>
      ) : null}
      <span className={styles.choiceLabel}>{favorite.label}</span>
    </label>
  );
  return (
    <div className={`${styles.picker} ${variant === "cards" ? styles.cardPicker : ""}`}>
      {sports.length > 0 ? (
        <details
          className={styles.sports}
          open={sportsOpen}
          onToggle={(event) => setSportsOpen(event.currentTarget.open)}
        >
          <summary className={styles.sportsSummary}>
            <Trophy size={19} aria-hidden="true" />
            <span>Sports</span>
            {sports.some((sport) => selected.has(sport.id)) ? (
              <span className={styles.sportsCount}>
                {sports.filter((sport) => selected.has(sport.id)).length}
              </span>
            ) : null}
            <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
          </summary>
          <fieldset className={styles.fieldset} disabled={disabled}>
            <legend className={styles.srOnly}>Sports</legend>
            <div className={styles.grid}>{sports.map(choice)}</div>
          </fieldset>
        </details>
      ) : null}
      {events.length > 0 ? (
        <fieldset className={styles.fieldset} disabled={disabled}>
          <legend className={styles.legend}>Event types</legend>
          <div className={styles.grid}>{events.map(choice)}</div>
        </fieldset>
      ) : null}
    </div>
  );
}
