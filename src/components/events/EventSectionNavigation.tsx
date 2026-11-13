"use client";

import { ArrowLeft, ArrowRight, Pencil, Plus } from "lucide-react";
import type { EventSectionOption } from "./EventSectionBuilder";
import { EventSortableTab, EventTabOrder } from "./EventTabOrder";
import styles from "./event-section-navigation.module.css";
import { useEventNavigationScroll } from "./useEventNavigationScroll";

export default function EventSectionNavigation({
  sections,
  selected,
  select,
  href,
  edit,
  move,
  add,
}: {
  sections: EventSectionOption[];
  selected: string;
  select: (id: string) => void;
  href: (id: string) => string;
  edit?: (section: EventSectionOption) => void;
  move?: (id: string, index: number) => void;
  add?: () => void;
}) {
  const railScroll = useEventNavigationScroll();
  const index = Math.max(
    0,
    sections.findIndex((section) => section.id === selected),
  );
  const active = sections[index];
  if (!active && !add) return null;
  return (
    <div className={styles.navigation}>
      <div className={styles.header}>
        <EventTabOrder
          enabled={Boolean(move)}
          ids={sections.map((section) => section.id)}
          onMove={(id, next) => move?.(id, next)}
        >
          <nav className={styles.rail} aria-label="Page navigation" {...railScroll}>
            {sections.map((section) => {
              const link = (
                <a
                  key={section.id}
                  href={href(section.id)}
                  aria-current={active?.id === section.id ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    select(section.id);
                  }}
                >
                  {section.label}
                </a>
              );
              return move ? (
                <EventSortableTab key={section.id} id={section.id} label={section.label}>
                  {link}
                </EventSortableTab>
              ) : (
                <span key={section.id}>{link}</span>
              );
            })}
          </nav>
        </EventTabOrder>
        {add && (
          <button
            type="button"
            className={styles.add}
            aria-label="Add tab"
            title="Add tab"
            onClick={add}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      {move && active && (
        <div className={styles.tools} role="group" aria-label="Selected tab controls">
          <span>{active.label}</span>
          <button
            type="button"
            disabled={index === 0}
            aria-label={`Move ${active.label} tab left`}
            onClick={() => move(active.id, index - 1)}
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={index === sections.length - 1}
            aria-label={`Move ${active.label} tab right`}
            onClick={() => move(active.id, index + 1)}
          >
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          {edit && (
            <button
              type="button"
              aria-label={`Edit ${active.label} content`}
              onClick={() => edit(active)}
            >
              <Pencil size={16} aria-hidden="true" />
              {active.editorId === "schedule" || /schedule/i.test(`${active.id} ${active.label}`)
                ? "Edit schedule"
                : "Edit section"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
