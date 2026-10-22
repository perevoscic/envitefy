"use client";

import { CalendarDays, Check, ChevronDown, Gift, House, Landmark, PartyPopper, Trophy } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import type { CreateGuess } from "@/lib/create/create-intent";
import { availableEventTypeGroups } from "@/lib/create/event-type-groups";
import styles from "./create-workspace.module.css";

const groupIcons = {
  celebrations: PartyPopper,
  holidays: Gift,
  home: House,
  religious: Landmark,
  gatherings: CalendarDays,
  sports: Trophy,
};

export default function EventTypeFilter({ choices, value, onChange, children, search, compact = false }: {
  choices: CreateGuess[];
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
  search: ReactNode;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const groups = availableEventTypeGroups(choices);
  const label = groups.find((group) => group.id === value)?.label || "All";

  const select = (key: string) => {
    onChange(key);
    setExpanded(false);
    trigger.current?.focus({ preventScroll: true });
  };

  return (
    <div className={compact ? styles.categoryToolbar : undefined} data-category-toolbar={compact ? "" : undefined} onKeyDown={(event) => {
      if (event.key === "Escape" && expanded) {
        event.preventDefault();
        event.stopPropagation();
        setExpanded(false);
        trigger.current?.focus({ preventScroll: true });
      }
    }}>
      <div className={styles.typePickerHeading}>
        <div className={styles.typePickerCopy}>
          <div className={styles.typePickerTitleRow}>
            {children}
            <button
              ref={trigger}
              type="button"
              className={styles.typeFilter}
              aria-label={`Filter event types: ${label}`}
              aria-expanded={expanded}
              aria-controls="creation-type-filters"
              onClick={() => setExpanded((open) => !open)}
            >
              <span>{label}</span>
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
          {!compact && <p className={styles.taskIntro}>Pick an event type to explore its designs.</p>}
        </div>
        {search}
      </div>
      <div
        id="creation-type-filters"
        role="region"
        aria-label="Event type filters"
        aria-hidden={!expanded}
        inert={!expanded}
        className={styles.typeFilterExpansion}
        data-expanded={expanded}
      >
        <div className={styles.typeFilterClip}>
          <div className={styles.typeFilterPanel}>
            <button type="button" className={styles.typeFilterAll} aria-pressed={value === "all"} onClick={() => select("all")}>
              All event types
              {value === "all" && <Check aria-hidden="true" />}
            </button>
            <div className={styles.typeFilterGroups}>
              {groups.map((group) => {
                const Icon = groupIcons[group.id];
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={styles.typeFilterChoice}
                    aria-pressed={value === group.id}
                    onClick={() => select(group.id)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{group.label}</span>
                    {value === group.id && <Check aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
