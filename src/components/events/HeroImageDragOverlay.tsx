"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { heroImagePositionAfterDrag, heroImageVerticalOverflow } from "@/lib/hero-image-drag";

type Drag = { pointerId: number; startY: number; startPosition: number; overflow: number };

export default function HeroImageDragOverlay({
  imageRef,
  imageSrc,
  positionY,
  onChange,
}: {
  imageRef: RefObject<HTMLImageElement | null>;
  imageSrc: string;
  positionY: number;
  onChange: (positionY: number) => void;
}) {
  const helpId = useId();
  const drag = useRef<Drag | null>(null);
  const [canDrag, setCanDrag] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const measure = () => {
      const rect = image.getBoundingClientRect();
      setCanDrag(
        heroImageVerticalOverflow(
          rect.width,
          rect.height,
          image.naturalWidth,
          image.naturalHeight,
        ) > 1,
      );
    };
    measure();
    image.addEventListener("load", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(image);
    window.addEventListener("resize", measure);
    return () => {
      image.removeEventListener("load", measure);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [imageRef, imageSrc]);

  if (!canDrag) return null;
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Reposition hero image"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={positionY}
      aria-valuetext={`${positionY}% from the top`}
      aria-describedby={helpId}
      className="absolute inset-0 select-none rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-violet-600"
      style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "pan-x pinch-zoom" }}
      onTouchStart={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        const image = imageRef.current;
        if (!image) return;
        const rect = image.getBoundingClientRect();
        const overflow = heroImageVerticalOverflow(
          rect.width,
          rect.height,
          image.naturalWidth,
          image.naturalHeight,
        );
        if (overflow <= 1) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          startY: event.clientY,
          startPosition: positionY,
          overflow,
        };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const active = drag.current;
        if (!active || active.pointerId !== event.pointerId) return;
        onChange(
          heroImagePositionAfterDrag(
            active.startPosition,
            event.clientY - active.startY,
            active.overflow,
          ),
        );
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        if (drag.current) onChange(drag.current.startPosition);
        drag.current = null;
        setDragging(false);
      }}
      onLostPointerCapture={() => {
        drag.current = null;
        setDragging(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && drag.current) {
          const active = drag.current;
          onChange(active.startPosition);
          drag.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(active.pointerId);
          return;
        }
        const next =
          event.key === "ArrowUp"
            ? Math.min(100, positionY + 5)
            : event.key === "ArrowDown"
              ? Math.max(0, positionY - 5)
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? 100
                  : null;
        if (next === null) return;
        event.preventDefault();
        onChange(next);
      }}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-3 py-1.5 font-sans text-xs font-medium text-white ${dragging ? "opacity-0" : ""}`}
      >
        Drag image to reposition
      </span>
      <span id={helpId} className="sr-only">
        Drag up or down, or use the up and down arrow keys. Home shows the top; End shows the
        bottom.
      </span>
    </div>
  );
}
