"use client";

import ResponsiveEventNavigation from "@/components/events/ResponsiveEventNavigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import FootballText, { useFootballPageText } from "./FootballPageText";
import { useEventSectionBuilder } from "@/components/events/EventSectionBuilder";
import { useEventSectionSwipe } from "@/components/events/useEventSectionSwipe";
import { useEventNavigationScroll } from "@/components/events/useEventNavigationScroll";
import { EventSortableTab, EventTabOrder } from "@/components/events/EventTabOrder";
import { ArrowLeft, ArrowRight, Plus, Pencil } from "lucide-react";
import navigationStyles from "@/components/events/event-section-navigation.module.css";
import { useEventPageComposition } from "@/components/events/EventPageCompositionContext";

type Section = {
  id: string;
  label: string;
  count?: number;
  members?: Array<{ id: string; label: string }>;
};

export function useFootballSectionTabs(items: Section[], syncHash = true) {
  const prefix = useId();
  const [requestedId, setRequestedId] = useState(items[0]?.id || "");
  const resolveId = useCallback(
    (id: string) =>
      items.find((item) => item.id === id || item.members?.some((member) => member.id === id))?.id,
    [items],
  );
  const activeId = resolveId(requestedId) || items[0]?.id || "";

  useEffect(() => {
    if (!syncHash) return;
    const readHash = () => {
      const id = window.location.hash.slice(1);
      if (resolveId(id)) setRequestedId(id);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, [resolveId, syncHash]);

  const select = useCallback(
    (id: string) => {
      setRequestedId(id);
      if (syncHash) window.history.replaceState(window.history.state, "", `#${id}`);
    },
    [syncHash],
  );
  const tabId = (id: string) => `${prefix}-tab-${resolveId(id) || id}`;
  const panelId = (id: string) => `${prefix}-panel-${resolveId(id) || id}`;
  const swipeHandlers = useEventSectionSwipe(items.map(item => item.id), activeId, select);
  const panelProps = (id: string) => ({
    ...swipeHandlers,
    id: panelId(id),
    role: "tabpanel" as const,
    "aria-labelledby": tabId(id),
    tabIndex: 0,
    hidden: activeId !== (resolveId(id) || id),
    style: { display: activeId !== (resolveId(id) || id) ? ("none" as const) : undefined },
  });
  return { items, activeId, select, tabId, panelId, panelProps };
}

export default function FootballSectionTabs({
  tabs,
  shellClassName = "",
  activeClassName,
  idleClassName,
  ariaLabel = "Football page sections",
  pageSections = true,
}: {
  tabs: ReturnType<typeof useFootballSectionTabs>;
  shellClassName?: string;
  activeClassName: string;
  idleClassName: string;
  ariaLabel?: string;
  pageSections?: boolean;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const railScroll = useEventNavigationScroll();
  const { text } = useFootballPageText();
  const context = useEventSectionBuilder();
  const composition = useEventPageComposition();
  const builder = pageSections ? context : null;
  const index = tabs.items.findIndex(item => item.id === tabs.activeId);
  const active = tabs.items[index];
  const sectionId = (id: string) => id === "attendance" ? "rsvp" : id;
  const move = (id: string, next: number) => {
    const target = tabs.items[next];
    if (!target) return;
    const entries = builder?.layout?.order || builder?.entries.map(entry => entry.id) || [];
    const targetIndex = entries.indexOf(sectionId(target.id));
    builder?.change({ type: "move-tab", id: sectionId(id), index: targetIndex >= 0 ? targetIndex : next });
    tabs.select(id);
  };
  if (!tabs.items.length || pageSections && composition?.value?.sections.length) return null;
  return (
    <div className={shellClassName}>
      <ResponsiveEventNavigation
        managedNavigation
        items={tabs.items.map(item => ({ id: item.id, count: item.count, label: item.members?.length ? item.members.map(member => text?.[`nav:${member.id}`] || text?.[`section:${member.id}:title`] || member.label).join(" + ") : text?.[`nav:${item.id}`] || text?.[`section:${item.id}:title`] || item.label, panelId: tabs.panelId(item.id) }))}
        activeId={tabs.activeId}
        onSelect={tabs.select}
        tabbed
        ariaLabel={ariaLabel}
        renderItem={(item, control) => {
          const source = tabs.items.find(section => section.id === item.id);
          return (
            <FootballText textKey={`nav:${item.id}`}
              fallback={text?.[`section:${item.id}:title`] ?? source?.label ?? item.label}
              label={`${source?.label ?? item.label} navigation label`} renderText={() => control} />
          );
        }}
      >
        <EventTabOrder enabled={Boolean(builder)} ids={tabs.items.map(item => item.id)} onMove={move}>
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="no-scrollbar flex select-none gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain p-1"
          {...railScroll}
        >
          {tabs.items.map((item, index) => {
            const active = tabs.activeId === item.id;
            const control = (
              <FootballText
                key={item.id}
                textKey={`nav:${item.id}`}
                fallback={text?.[`section:${item.id}:title`] ?? item.label}
                label={`${item.label} navigation label`}
                renderText={(caption) => (
                  <button
                    ref={(node) => {
                      buttons.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={tabs.tabId(item.id)}
                    aria-controls={tabs.panelId(item.id)}
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => tabs.select(item.id)}
                    onKeyDown={(event) => {
                      let next = index;
                      if (event.key === "ArrowRight") next = (index + 1) % tabs.items.length;
                      else if (event.key === "ArrowLeft")
                        next = (index - 1 + tabs.items.length) % tabs.items.length;
                      else if (event.key === "Home") next = 0;
                      else if (event.key === "End") next = tabs.items.length - 1;
                      else return;
                      event.preventDefault();
                      buttons.current[next]?.focus();
                      buttons.current[next]?.scrollIntoView({
                        block: "nearest",
                        inline: "nearest",
                        behavior: "instant",
                      });
                      tabs.select(tabs.items[next].id);
                    }}
                    className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? activeClassName : idleClassName}`}
                  >
                    <span
                      className={`size-1.5 rounded-full bg-current ${active ? "" : "opacity-40"}`}
                      aria-hidden="true"
                    />
                    {item.members?.length
                      ? item.members
                          .map(
                            (member) =>
                              text?.[`nav:${member.id}`] ||
                              text?.[`section:${member.id}:title`] ||
                              member.label,
                          )
                          .join(" + ")
                      : caption || item.label}
                    {item.count == null ? null : ` (${item.count})`}
                  </button>
                )}
              />
            );
            return builder ? <EventSortableTab key={item.id} id={item.id} label={item.label}>{control}</EventSortableTab> : control;
          })}
        </div>
        </EventTabOrder>
      </ResponsiveEventNavigation>
      {builder && <div className={navigationStyles.tools} role="group" aria-label="Selected tab controls">
        <button type="button" aria-label="Add tab" onClick={() => builder.addAt(builder.entries.length)}><Plus size={18} aria-hidden="true" />Add tab</button>
        {active && <>
          <button type="button" disabled={index === 0} aria-label={`Move ${active.label} tab left`} onClick={() => move(active.id, index - 1)}><ArrowLeft size={17} aria-hidden="true" /></button>
          <button type="button" disabled={index === tabs.items.length - 1} aria-label={`Move ${active.label} tab right`} onClick={() => move(active.id, index + 1)}><ArrowRight size={17} aria-hidden="true" /></button>
          <button type="button" aria-label={`Edit ${active.label} content`} onClick={() => builder.edit(builder.entries.find(entry => entry.id === sectionId(active.id)) || { id: sectionId(active.id), label: active.label })}><Pencil size={16} aria-hidden="true" />{active.id === "schedule" ? "Edit schedule" : "Edit section"}</button>
        </>}
      </div>}
    </div>
  );
}
