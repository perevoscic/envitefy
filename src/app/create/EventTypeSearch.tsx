"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./create-workspace.module.css";

export default function EventTypeSearch({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(() => !!value);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!expanded) return;
    // Let the visibility transition paint before focusing the newly opened field.
    let focusFrame = 0;
    const frame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded || value) return;
    const dismiss = (event: MouseEvent) => {
      // The search SVG is replaced on opening; the original event path still
      // identifies that click as inside this control after React updates it.
      if (root.current && !event.composedPath().includes(root.current)) setExpanded(false);
    };
    document.addEventListener("click", dismiss);
    return () => document.removeEventListener("click", dismiss);
  }, [expanded, value]);

  const close = () => {
    setExpanded(false);
    onChange("");
    toggle.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={root}
      className={styles.typeSearchControl}
      data-event-type-search
      data-expanded={expanded}
      onTransitionEnd={(event) => {
        // The field animates into view. If the trigger still owns focus once
        // opening finishes, move focus into the now-visible search input.
        if (expanded && (event.propertyName === "opacity" || event.propertyName === "width") && document.activeElement === toggle.current) {
          input.current?.focus({ preventScroll: true });
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <div id="creation-type-search-panel" className={styles.typeSearchPanel} aria-hidden={!expanded} inert={!expanded}>
        <Search className={styles.typeSearchIcon} aria-hidden="true" />
        <input
          ref={input}
          id="creation-type-search"
          type="search"
          aria-label="Search event types"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search event types"
          className={styles.typeSearch}
        />
      </div>
      <button
        ref={toggle}
        type="button"
        className={styles.typeSearchToggle}
        aria-label={expanded ? "Close event type search" : "Open event type search"}
        aria-expanded={expanded}
        aria-controls="creation-type-search-panel"
        onClick={() => expanded ? close() : setExpanded(true)}
      >
        {expanded ? <X aria-hidden="true" /> : <Search aria-hidden="true" />}
      </button>
    </div>
  );
}
