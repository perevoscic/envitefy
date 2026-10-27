"use client";

import { ArrowUpRight, CalendarDays, Check, ChevronDown, Gift, House, Landmark, PartyPopper, School, Trophy } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useRef, useState } from "react";
import type { CreateGuess } from "@/lib/create/create-intent";
import { availableEventTypeGroups, eventTypeGroupExamples, type EventTypeGroup } from "@/lib/create/event-type-groups";
import EventTypeExamples from "./EventTypeExamples";
import styles from "./create-workspace.module.css";

const groupIcons = {
  celebrations: PartyPopper,
  holidays: Gift,
  home: House,
  religious: Landmark,
  gatherings: CalendarDays,
  sports: Trophy,
  school: School,
};

// Existing Envitefy artwork introduces each group without choosing a template.
const groupPreviews = {
  celebrations: {
    artwork: "/studio/birthday.webp",
    position: "70% center",
  },
  holidays: {
    artwork: "/templates/signup/holidays/christmas/wrapped-with-care.webp",
    position: "center",
  },
  home: {
    artwork: "/studio/housewarming.webp",
    position: "center",
  },
  religious: {
    artwork: "/templates/event-pages/v2/religious-events/buddhist-vesak-lotus-water-detail.webp",
    position: "center",
  },
  gatherings: {
    artwork: "/templates/signup/photographic/general/monthly-meetup.webp",
    position: "center",
  },
  school: { artwork: "/templates/event-pages/v2/open-house/school-open-house-paper-learning-garden.webp", position: "center" },
  sports: {
    artwork: "/studio/game-day.webp",
    position: "center 70%",
  },
} satisfies Record<EventTypeGroup, { artwork: string; position: string }>;

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
    onChange(key === value ? "all" : key);
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
          <div className={styles.typeFilterPanel} data-event-type-filter-panel>
            <div className={styles.typeFilterGroups} data-event-type-filter-groups>
              {groups.map((group) => {
                const Icon = groupIcons[group.id];
                const preview = groupPreviews[group.id];
                const selected = value === group.id;
                const examplesId = `creation-type-group-${group.id}-examples`;
                const examples = eventTypeGroupExamples(choices, group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={styles.typeFilterChoice}
                    aria-label={group.label}
                    aria-describedby={examplesId}
                    aria-pressed={selected}
                    title={selected ? "Select again to show all categories" : undefined}
                    data-event-type-group={group.id}
                    onClick={() => select(group.id)}
                  >
                    <span className={styles.typeFilterArtwork} aria-hidden="true">
                      {expanded && (
                        <Image
                          src={preview.artwork}
                          alt=""
                          width={264}
                          height={224}
                          loading="eager"
                          sizes="(max-width: 639px) 88px, (max-width: 1100px) 104px, 132px"
                          style={{ objectPosition: preview.position }}
                          data-event-type-group-artwork
                        />
                      )}
                      <span className={styles.typeFilterIcon}><Icon aria-hidden="true" /></span>
                    </span>
                    <span className={styles.typeFilterDetails}>
                      <span className={styles.typeFilterTitle} data-event-type-group-title>{group.label}</span>
                      <EventTypeExamples id={examplesId} examples={examples} expanded={expanded} />
                    </span>
                    <span className={styles.typeFilterIndicator} aria-hidden="true">
                      {selected ? <Check /> : <ArrowUpRight />}
                    </span>
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
