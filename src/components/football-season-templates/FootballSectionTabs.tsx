"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import FootballText, { useFootballPageText } from "./FootballPageText";

type Section = { id: string; label: string; count?: number };

export function useFootballSectionTabs(items: Section[], syncHash = true) {
  const prefix = useId();
  const [requestedId, setRequestedId] = useState(items[0]?.id || "");
  const activeId = items.some((item) => item.id === requestedId) ? requestedId : items[0]?.id || "";

  useEffect(() => {
    if (!syncHash) return;
    const readHash = () => {
      const id = window.location.hash.slice(1);
      if (items.some((item) => item.id === id)) setRequestedId(id);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, [items, syncHash]);

  const select = useCallback(
    (id: string) => {
      setRequestedId(id);
      if (syncHash) window.history.replaceState(window.history.state, "", `#${id}`);
    },
    [syncHash],
  );
  const tabId = (id: string) => `${prefix}-tab-${id}`;
  const panelId = (id: string) => `${prefix}-panel-${id}`;
  const panelProps = (id: string) => ({
    id: panelId(id),
    role: "tabpanel" as const,
    "aria-labelledby": tabId(id),
    tabIndex: 0,
    hidden: activeId !== id,
    style: { display: activeId !== id ? ("none" as const) : undefined },
  });
  return { items, activeId, select, tabId, panelId, panelProps };
}

export default function FootballSectionTabs({
  tabs,
  shellClassName = "",
  activeClassName,
  idleClassName,
  ariaLabel = "Football page sections",
}: {
  tabs: ReturnType<typeof useFootballSectionTabs>;
  shellClassName?: string;
  activeClassName: string;
  idleClassName: string;
  ariaLabel?: string;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const { text } = useFootballPageText();
  if (!tabs.items.length) return null;
  return (
    <div className={shellClassName}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="no-scrollbar flex gap-2 overflow-x-auto p-1"
      >
        {tabs.items.map((item, index) => {
          const active = tabs.activeId === item.id;
          return (
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
                  {caption || item.label}
                  {item.count == null ? null : ` (${item.count})`}
                </button>
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
