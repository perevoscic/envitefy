"use client";

import { MoreVertical } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from "react";

/** A mobile disclosure keeps the desktop actions and their dialogs mounted. */
export default function EventPreviewActions({
  children,
  surfaceStyle,
  previewDocument,
}: {
  children: ReactNode;
  surfaceStyle?: CSSProperties;
  previewDocument: Document | null;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    // The event content lives in its own document, so listen there as well.
    const documents = previewDocument ? [document, previewDocument] : [document];
    for (const doc of documents) {
      doc.addEventListener("pointerdown", dismissOutside);
      doc.addEventListener("focusin", dismissOutside);
    }
    const resize = () => setOpen(false);
    window.addEventListener("resize", resize);
    return () => {
      for (const doc of documents) {
        doc.removeEventListener("pointerdown", dismissOutside);
        doc.removeEventListener("focusin", dismissOutside);
      }
      window.removeEventListener("resize", resize);
    };
  }, [open, previewDocument]);

  return (
    <div
      ref={root}
      className="pointer-events-auto relative col-start-3 row-start-1 justify-self-end lg:justify-self-start"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="More event actions"
        title="More event actions"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex size-11 items-center justify-center rounded-full border border-current/15 shadow-sm backdrop-blur-xl transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current lg:hidden"
        style={surfaceStyle}
      >
        <MoreVertical size={21} aria-hidden="true" />
      </button>
      <div
        id={id}
        className={`${open ? "block" : "hidden"} absolute right-0 top-[calc(100%+0.5rem)] w-48 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-current/15 p-1.5 shadow-lg backdrop-blur-xl lg:static lg:block lg:w-auto lg:max-w-none lg:rounded-full lg:p-1 lg:shadow-sm`}
        style={surfaceStyle}
        onClick={(event) => {
          // Portalled confirmation dialogs also bubble through this component.
          if (!event.currentTarget.contains(event.target as Node)) return;
          if ((event.target as Element).closest("a, button")) {
            setOpen(false);
            if (window.innerWidth < 1024) trigger.current?.focus();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
